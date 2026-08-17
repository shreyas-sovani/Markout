// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IUnlockCallback} from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {StateLibrary} from "@uniswap/v4-core/src/libraries/StateLibrary.sol";

import {BaseHook} from "./BaseHook.sol";
import {MarkoutEngine} from "./MarkoutEngine.sol";

/// @title Markout — autonomous MEV/LVR protection hook for Uniswap v4.
/// @notice Fills swaps immediately at the pool's advertised 3 bps fee while
/// escrowing a 20 bps input bond. Settlement (refund vs donate) is decided by
/// the MarkoutEngine mean-reversion oracle at window T, driven by a Reactive
/// Network callback that lands on the executor, which calls `settle`.
contract MarkoutHook is BaseHook, IUnlockCallback {
    using StateLibrary for IPoolManager;
    using CurrencyLibrary for Currency;
    using PoolIdLibrary for PoolKey;

    uint256 public constant SWAP_FEE = 300; // 3 bps, set at pool initialization
    uint256 public constant BOND_BPS = 20;
    uint256 public constant BPS_DENOMINATOR = 10_000;

    enum Outcome {
        None,
        Refund,
        Donate
    }

    struct Trade {
        PoolKey key;
        address trader;
        Currency bondCurrency;
        uint256 bondAmount;
        uint160 sqrtPre;
        uint160 sqrtPost;
        Outcome outcome;
    }

    event SwapBonded(
        bytes32 indexed tradeId, address indexed trader, uint160 sqrtPre, uint160 sqrtPost, uint256 bondAmount
    );
    event Settled(bytes32 indexed tradeId, uint8 outcome, uint160 sqrtAtSettlement, uint256 bondAmount);

    error SwapTooSmall();
    error NotExecutor();
    error AlreadySettled();
    error NotPoolManager();

    IPoolManager public immutable poolManager;
    address public immutable executor;

    mapping(bytes32 tradeId => Trade) public trades;
    bytes32 public lastTradeId;
    uint256 private tradeNonce;

    // Transient slot holding P_pre between beforeSwap and afterSwap.
    uint256 private constant PRE_SLOT = uint256(keccak256("markout.hook.sqrtPre"));

    // ---------------------------------------------------------------------------
    // Minimal ERC-6909 bond receipt ledger (hook-minted, id = uint256(tradeId)).
    // ---------------------------------------------------------------------------

    event Transfer(address caller, address indexed from, address indexed to, uint256 indexed id, uint256 amount);
    event OperatorSet(address indexed owner, address indexed operator, bool approved);

    mapping(address => mapping(uint256 => uint256)) public balanceOf;
    mapping(address => mapping(address => bool)) public operatorApproval;

    constructor(IPoolManager _poolManager, address _executor) {
        poolManager = _poolManager;
        executor = _executor;
    }

    // ---------------------------------------------------------------------------
    // Hook lifecycle
    // ---------------------------------------------------------------------------

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    function beforeSwap(address sender, PoolKey calldata key, IPoolManager.SwapParams calldata, bytes calldata)
        external
        override
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        require(msg.sender == address(poolManager));
        (uint160 sqrtPre,,,) = poolManager.getSlot0(key.toId());
        _storePre(key.toId(), sender, sqrtPre);
        return (IHooks.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    function afterSwap(
        address sender,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata hookData
    ) external override returns (bytes4, int128) {
        require(msg.sender == address(poolManager));

        // The router is the direct caller; the human trader rides in hookData.
        address trader = hookData.length == 32 ? abi.decode(hookData, (address)) : sender;

        // Input side of the pool's post-swap delta is negative; its absolute
        // value is the exact amountIn actually paid on the AMM curve. This is
        // correct for both exact-in and exact-out swaps and never touches slot0.
        Currency inputCurrency = params.zeroForOne ? key.currency0 : key.currency1;
        int128 inputDelta = params.zeroForOne ? delta.amount0() : delta.amount1();
        require(inputDelta < 0, "input delta must be negative");
        uint256 amountIn = uint256(uint128(-inputDelta));

        uint256 bond = (amountIn * BOND_BPS) / BPS_DENOMINATOR;
        if (bond == 0) revert SwapTooSmall();

        uint160 sqrtPre = _takePre(key.toId(), sender);
        (uint160 sqrtPost,,,) = poolManager.getSlot0(key.toId());

        // Escrow the bond: pull real input tokens out of the pool. The hook's
        // resulting debt to the pool is settled by the router via settleFor.
        poolManager.take(inputCurrency, address(this), bond);

        bytes32 tradeId = keccak256(abi.encode(key.toId(), sender, block.number, block.timestamp, tradeNonce++));

        trades[tradeId] = Trade({
            key: key,
            trader: trader,
            bondCurrency: inputCurrency,
            bondAmount: bond,
            sqrtPre: sqrtPre,
            sqrtPost: sqrtPost,
            outcome: Outcome.None
        });

        _mint(trader, uint256(tradeId), bond);
        lastTradeId = tradeId;

        emit SwapBonded(tradeId, trader, sqrtPre, sqrtPost, bond);
        return (IHooks.afterSwap.selector, 0);
    }

    // ---------------------------------------------------------------------------
    // Settlement (called by the Reactive Network executor)
    // ---------------------------------------------------------------------------

    function settle(bytes32 tradeId) external {
        if (msg.sender != executor) revert NotExecutor();
        Trade storage trade = trades[tradeId];
        if (trade.outcome != Outcome.None) revert AlreadySettled();

        (uint160 sqrtT,,,) = poolManager.getSlot0(trade.key.toId());
        bool refund = MarkoutEngine.decide(trade.sqrtPre, trade.sqrtPost, sqrtT);
        trade.outcome = refund ? Outcome.Refund : Outcome.Donate;

        if (refund) {
            // Return the escrowed bond to the trader.
            trade.bondCurrency.transfer(trade.trader, trade.bondAmount);
        } else {
            // Socialize the bond: pay it into the pool and donate to LPs.
            poolManager.unlock(abi.encode(tradeId));
        }

        emit Settled(tradeId, uint8(trade.outcome), sqrtT, trade.bondAmount);
    }

    function unlockCallback(bytes calldata data) external override returns (bytes memory) {
        if (msg.sender != address(poolManager)) revert NotPoolManager();
        bytes32 tradeId = abi.decode(data, (bytes32));
        Trade storage trade = trades[tradeId];

        (uint256 amount0, uint256 amount1) = (trade.bondCurrency == trade.key.currency0)
            ? (trade.bondAmount, uint256(0))
            : (uint256(0), trade.bondAmount);

        // Pay the escrowed bond into the pool, then donate it to in-range LPs.
        poolManager.sync(trade.bondCurrency);
        trade.bondCurrency.transfer(address(poolManager), trade.bondAmount);
        poolManager.settle();
        poolManager.donate(trade.key, amount0, amount1, new bytes(0));

        return abi.encode(0);
    }

    // ---------------------------------------------------------------------------
    // Transient P_pre passing between beforeSwap and afterSwap
    // ---------------------------------------------------------------------------

    function _preSlot(PoolId poolId, address sender) private pure returns (bytes32 slot) {
        slot = keccak256(abi.encode(PRE_SLOT, PoolId.unwrap(poolId), sender));
    }

    function _storePre(PoolId poolId, address sender, uint160 sqrtPre) internal {
        bytes32 slot = _preSlot(poolId, sender);
        // solhint-disable-next-line no-inline-assembly
        assembly {
            tstore(slot, sqrtPre)
        }
    }

    function _takePre(PoolId poolId, address sender) internal returns (uint160 sqrtPre) {
        bytes32 slot = _preSlot(poolId, sender);
        // solhint-disable-next-line no-inline-assembly
        assembly {
            sqrtPre := tload(slot)
            tstore(slot, 0)
        }
    }

    // ---------------------------------------------------------------------------
    // Minimal ERC-6909 receipt logic
    // ---------------------------------------------------------------------------

    function transfer(address to, uint256 id, uint256 amount) external returns (bool) {
        _transfer(msg.sender, msg.sender, to, id, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 id, uint256 amount) external returns (bool) {
        require(operatorApproval[from][msg.sender], "NOT_OPERATOR");
        _transfer(msg.sender, from, to, id, amount);
        return true;
    }

    function setOperator(address operator, bool approved) external {
        operatorApproval[msg.sender][operator] = approved;
        emit OperatorSet(msg.sender, operator, approved);
    }

    function _transfer(address caller, address from, address to, uint256 id, uint256 amount) internal {
        require(to != address(0), "ZERO_TO");
        uint256 fromBalance = balanceOf[from][id];
        require(fromBalance >= amount, "INSUFFICIENT_BALANCE");
        balanceOf[from][id] = fromBalance - amount;
        balanceOf[to][id] += amount;
        emit Transfer(caller, from, to, id, amount);
    }

    function _mint(address to, uint256 id, uint256 amount) internal {
        require(to != address(0), "ZERO_TO");
        balanceOf[to][id] += amount;
        emit Transfer(address(this), address(0), to, id, amount);
    }
}
