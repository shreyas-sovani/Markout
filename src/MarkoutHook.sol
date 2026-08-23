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
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {StateLibrary} from "@uniswap/v4-core/src/libraries/StateLibrary.sol";

import {BaseHook} from "./BaseHook.sol";
import {MarkoutEngine} from "./MarkoutEngine.sol";

/// @title Markout — autonomous MEV/LVR protection hook for Uniswap v4.
/// @notice Swaps fill immediately at the pool's advertised 3 bps fee while a
/// 20 bps input bond is escrowed. After a settlement window T (21 s), the
/// mean-reversion oracle decides the bond's fate using a hook-maintained
/// time-weighted price: reverted toward the pre-swap price by more than 5 bps
/// (benign flow) → the bond is refunded to the trader; sustained or drifted
/// (informed flow) → the bond is donated to the pool's LPs. Settlement is
/// permissionless after T and needs no keeper, oracle, or delayed execution.
contract MarkoutHook is BaseHook, IUnlockCallback {
    using StateLibrary for IPoolManager;
    using CurrencyLibrary for Currency;
    using PoolIdLibrary for PoolKey;

    uint256 public constant SWAP_FEE = 300; // 3 bps, set at pool initialization
    uint256 public constant BOND_BPS = 20;
    uint256 public constant BPS_DENOMINATOR = 10_000;
    /// @notice Settlement window T. 3 Reactive-Cron-style ticks in the
    /// original design; now simply an on-chain timestamp delay.
    uint256 public constant SETTLEMENT_DELAY = 21 seconds;

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
        uint32 bondTime;
        uint32 settleAfter;
        int56 tickCumulativeAtBond;
        Outcome outcome;
    }

    event SwapBonded(
        bytes32 indexed tradeId, address indexed trader, uint160 sqrtPre, uint160 sqrtPost, uint256 bondAmount
    );
    event Settled(bytes32 indexed tradeId, uint8 outcome, uint160 sqrtAtSettlement, uint256 bondAmount);

    error SwapTooSmall();
    error SettlementWindowOpen(uint256 settleAfter, uint256 now);
    error UnknownTrade();
    error AlreadySettled();
    error NotPoolManager();
    error ZeroObservation();

    IPoolManager public immutable poolManager;

    mapping(bytes32 tradeId => Trade) public trades;
    bytes32 public lastTradeId;
    uint256 private tradeNonce;

    // ---------------------------------------------------------------------------
    // Hook-maintained time-weighted price (Uniswap-V2-style tick accumulator,
    // kept per pool). Updated on every swap, on every poke(), and at
    // settlement. Anyone may poke(); keepers keep the cadence between swaps so
    // that the window average is expensive to manipulate.
    // ---------------------------------------------------------------------------

    struct Observation {
        uint32 lastTimestamp;
        int56 tickCumulative;
    }

    mapping(PoolId poolId => Observation) public observations;

    /// @notice Bring the pool's tick accumulator up to the current block time.
    /// Permissionless: swaps, pokes, and settlements all call it.
    function poke(PoolId poolId) public returns (int56 tickCumulative) {
        Observation storage obs = observations[poolId];
        (, int24 tick,,) = poolManager.getSlot0(poolId);
        uint32 timestamp = uint32(block.timestamp);
        if (obs.lastTimestamp == 0) {
            obs.lastTimestamp = timestamp;
            obs.tickCumulative = 0;
        } else if (timestamp > obs.lastTimestamp) {
            obs.tickCumulative += int56(tick) * int56(uint56(timestamp - obs.lastTimestamp));
            obs.lastTimestamp = timestamp;
        }
        return obs.tickCumulative;
    }

    // ---------------------------------------------------------------------------
    // Minimal ERC-6909 bond receipt ledger (hook-minted, id = uint256(tradeId)).
    // ---------------------------------------------------------------------------

    event Transfer(address caller, address indexed from, address indexed to, uint256 indexed id, uint256 amount);
    event OperatorSet(address indexed owner, address indexed operator, bool approved);

    mapping(address => mapping(uint256 => uint256)) public balanceOf;
    mapping(address => mapping(address => bool)) public operatorApproval;

    constructor(IPoolManager _poolManager) {
        poolManager = _poolManager;
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

        // Checkpoint the TWAP accumulator at bond time.
        int56 tickCumAtBond = poke(key.toId());

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
            bondTime: uint32(block.timestamp),
            settleAfter: uint32(block.timestamp + SETTLEMENT_DELAY),
            tickCumulativeAtBond: tickCumAtBond,
            outcome: Outcome.None
        });

        _mint(trader, uint256(tradeId), bond);
        lastTradeId = tradeId;

        emit SwapBonded(tradeId, trader, sqrtPre, sqrtPost, bond);
        return (IHooks.afterSwap.selector, 0);
    }

    // ---------------------------------------------------------------------------
    // Settlement — permissionless after the window closes
    // ---------------------------------------------------------------------------

    /// @notice Settle a bonded trade. Callable by anyone once the window has
    /// elapsed; the outcome depends only on pool state, so an early or
    /// adversarial settle is impossible and a self-interested settle is
    /// harmless. P_T is the time-weighted average tick over the window, taken
    /// from the hook's own accumulator (pool-local, no external oracle).
    function settle(bytes32 tradeId) external {
        Trade storage trade = trades[tradeId];
        if (trade.settleAfter == 0) revert UnknownTrade();
        if (trade.outcome != Outcome.None) revert AlreadySettled();
        if (block.timestamp < trade.settleAfter) revert SettlementWindowOpen(trade.settleAfter, block.timestamp);

        // Bring the accumulator to now and average over the actual window.
        int56 tickCumNow = poke(trade.key.toId());
        uint32 elapsed = uint32(block.timestamp) - trade.bondTime;
        if (elapsed == 0) revert ZeroObservation();
        int256 avgTick = int256(tickCumNow - trade.tickCumulativeAtBond) / int256(uint256(elapsed));
        require(avgTick >= int256(int24(type(int24).min)) && avgTick <= int256(int24(type(int24).max)), "tick oob");
        uint160 sqrtT = TickMath.getSqrtPriceAtTick(int24(avgTick));

        bool refund = MarkoutEngine.decide(trade.sqrtPre, trade.sqrtPost, sqrtT);
        trade.outcome = refund ? Outcome.Refund : Outcome.Donate;

        if (refund) {
            // Return the escrowed bond to the trader.
            trade.bondCurrency.transfer(trade.trader, trade.bondAmount);
        } else {
            // Socialize the bond: pay it into the pool and donate it to LPs.
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

    uint256 private constant PRE_SLOT = uint256(keccak256("markout.hook.sqrtPre"));

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
