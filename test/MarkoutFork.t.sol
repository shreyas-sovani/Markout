// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";

import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {StateLibrary} from "@uniswap/v4-core/src/libraries/StateLibrary.sol";
import {HookMiner} from "./shared/HookMiner.sol";
import {PositionManager} from "@uniswap/v4-periphery/src/PositionManager.sol";
import {Actions} from "@uniswap/v4-periphery/src/libraries/Actions.sol";
import {IAllowanceTransfer} from "@uniswap/v4-periphery/lib/permit2/src/interfaces/IAllowanceTransfer.sol";
import {IWETH9} from "@uniswap/v4-periphery/src/interfaces/external/IWETH9.sol";

import {MarkoutHook} from "../src/MarkoutHook.sol";
import {MarkoutRouter} from "../src/MarkoutRouter.sol";
import {FaucetToken} from "../src/FaucetToken.sol";

/// @title Canonical-Sepolia fork suite.
/// @notice Deploys the hardened stack against the *canonical* Sepolia
/// PoolManager (0xE03A1074c86CFeDd5C142C4F04F1a1536e203543) and proves the
/// full lifecycle through canonical periphery (PositionManager + Permit2):
/// pool initialization, liquidity seeding, exact-in and exact-out swaps,
/// Refund settlement + pull claim, Donate settlement + deferred-donation
/// flush, and strict escrow accounting, all on real forked state.
contract MarkoutForkTest is Test {
    using CurrencyLibrary for Currency;
    using PoolIdLibrary for PoolKey;
    using StateLibrary for IPoolManager;

    // Canonical Sepolia deployment.
    IPoolManager internal constant CANONICAL_PM = IPoolManager(0xE03A1074c86CFeDd5C142C4F04F1a1536e203543);
    PositionManager internal constant CANONICAL_POSMGR =
        PositionManager(payable(0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4));
    IAllowanceTransfer internal constant PERMIT2 = IAllowanceTransfer(0x000000000022D473030F116dDEE9F6B43aC78BA3);
    address internal constant WETH9 = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;

    uint160 internal constant SQRT_PRICE_1_1 = 79228162514264337593543950336;
    bytes32 internal constant SWAP_BONDED_TOPIC = keccak256("SwapBonded(bytes32,address,int24,int24,uint256)");

    FaucetToken internal token0;
    FaucetToken internal token1;
    MarkoutHook internal hook;
    MarkoutRouter internal router;
    PositionManager internal posMgr;
    PoolKey internal key;

    address internal alice = address(0xA11CE7);
    address internal arber = address(0xA2BE2F);

    function setUp() public {
        string memory rpc = vm.envOr("SEP_RPC_URL", string("https://ethereum-sepolia-rpc.publicnode.com"));
        vm.createSelectFork(rpc);
        vm.deal(address(this), 100 ether);
        vm.deal(alice, 100 ether);
        vm.deal(arber, 100 ether);

        FaucetToken a = new FaucetToken("Markout Demo A", "MDA", 10_000_000e18, 100_000e18, address(CANONICAL_PM));
        FaucetToken b = new FaucetToken("Markout Demo B", "MDB", 10_000_000e18, 100_000e18, address(CANONICAL_PM));
        (token0, token1) = address(a) < address(b) ? (a, b) : (b, a);

        (address hookAddress, bytes32 salt) = HookMiner.find(
            address(this),
            uint160(
                Hooks.BEFORE_INITIALIZE_FLAG | Hooks.AFTER_INITIALIZE_FLAG | Hooks.BEFORE_SWAP_FLAG
                    | Hooks.AFTER_SWAP_FLAG | Hooks.BEFORE_SWAP_RETURNS_DELTA_FLAG | Hooks.AFTER_SWAP_RETURNS_DELTA_FLAG
            ),
            type(MarkoutHook).creationCode,
            abi.encode(address(CANONICAL_PM))
        );
        hook = new MarkoutHook{salt: salt}(CANONICAL_PM);
        assertEq(address(hook), hookAddress, "hook mining failed");

        router = new MarkoutRouter(CANONICAL_PM);

        // Officially deployed canonical periphery PositionManager.
        posMgr = CANONICAL_POSMGR;

        key = PoolKey({
            currency0: Currency.wrap(address(token0)),
            currency1: Currency.wrap(address(token1)),
            fee: 300,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });

        // Initialize through canonical periphery.
        posMgr.initializePool(key, SQRT_PRICE_1_1);

        // Permit2 allowances, then seed full-range liquidity via MINT_POSITION.
        token0.mint(address(this), 5_000e18);
        token1.mint(address(this), 5_000e18);
        token0.approve(address(PERMIT2), type(uint256).max);
        token1.approve(address(PERMIT2), type(uint256).max);
        PERMIT2.approve(address(token0), address(posMgr), type(uint160).max, type(uint48).max);
        PERMIT2.approve(address(token1), address(posMgr), type(uint160).max, type(uint48).max);

        // This periphery era requires an explicit SETTLE_PAIR after MINT.
        bytes memory actions = abi.encodePacked(uint8(Actions.MINT_POSITION), uint8(Actions.SETTLE_PAIR));
        bytes[] memory params = new bytes[](2);
        params[0] = abi.encode(
            key,
            TickMath.minUsableTick(60),
            TickMath.maxUsableTick(60),
            1e18, // liquidity
            2_000e18, // amount0Max
            2_000e18, // amount1Max
            address(this), // owner
            new bytes(0)
        );
        params[1] = abi.encode(key.currency0, key.currency1);
        posMgr.modifyLiquidities(abi.encode(actions, params), block.timestamp + 1_000);

        assertGt(StateLibrary.getLiquidity(CANONICAL_PM, key.toId()), 0, "pool seeded");

        token0.mint(alice, 1_000e18);
        token1.mint(alice, 1_000e18);
        token0.mint(arber, 1_000e18);
        token1.mint(arber, 1_000e18);
        vm.startPrank(alice);
        token0.approve(address(router), type(uint256).max);
        token1.approve(address(router), type(uint256).max);
        vm.stopPrank();
        vm.startPrank(arber);
        token0.approve(address(router), type(uint256).max);
        token1.approve(address(router), type(uint256).max);
        vm.stopPrank();
    }

    function _bondedId() internal returns (bytes32 tradeId) {
        Vm.Log[] memory entries = vm.getRecordedLogs();
        for (uint256 i = entries.length; i > 0; --i) {
            if (entries[i - 1].emitter == address(hook) && entries[i - 1].topics[0] == SWAP_BONDED_TOPIC) {
                return entries[i - 1].topics[1];
            }
        }
        revert("no SwapBonded found");
    }

    function _swapAs(address who, bool zeroForOne, int256 amount) internal returns (bytes32 tradeId) {
        vm.startPrank(who);
        vm.recordLogs();
        router.swap(
            key,
            IPoolManager.SwapParams({
                zeroForOne: zeroForOne,
                amountSpecified: amount,
                sqrtPriceLimitX96: zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1
            }),
            0,
            type(uint256).max
        );
        vm.stopPrank();
        return _bondedId();
    }

    function _outcome(bytes32 id) internal view returns (MarkoutHook.Outcome) {
        (,,,,,,,,, MarkoutHook.Outcome o,) = hook.trades(id);
        return o;
    }

    function test_canonical_lifecycle_refund_and_donate() public {
        bytes32 tradeId = _swapAs(alice, true, -2e17);
        (, uint256 bond,,) = _t(tradeId);
        assertGt(bond, 0, "bond escrowed on canonical PM");
        assertEq(token0.balanceOf(address(hook)), bond, "hook holds the bond");
        assertEq(hook.escrowLiability(Currency.wrap(address(token0))), bond, "liability recorded");
        uint256 aliceBefore = token0.balanceOf(alice);

        bytes32 arberTrade = _swapAs(arber, false, -2e17); // arbitrageur reverts
        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);

        hook.settle(tradeId);
        assertEq(uint8(_outcome(tradeId)), uint8(MarkoutHook.Outcome.Refunded), "organic => refund paid at settle");

        assertEq(token0.balanceOf(alice), aliceBefore + bond, "bond PAID AT SETTLE on canonical PM");
        assertEq(hook.escrowLiability(Currency.wrap(address(token0))), 0, "liability cleared");

        // The arbitrageur's own reversal trade, left unreversed, donates.
        hook.settle(arberTrade);
        assertEq(uint8(_outcome(arberTrade)), uint8(MarkoutHook.Outcome.Donated), "toxic => donate");

        (, uint256 arberBond,,) = _t(arberTrade);
        uint256 pending = hook.pendingDonation(key.toId(), 1); // arber's input was token1
        assertEq(pending, arberBond, "donation deferred");

        uint256 pm1 = token1.balanceOf(address(CANONICAL_PM));
        hook.flushDonation(key.toId());
        assertEq(token1.balanceOf(address(CANONICAL_PM)), pm1 + pending, "donation reached LPs");
        assertEq(token1.balanceOf(address(hook)), 0, "escrow empty");
        assertEq(hook.escrowLiability(Currency.wrap(address(token1))), 0, "liability cleared");
    }

    function test_canonical_exactOut_bondFromRealizedInput() public {
        uint256 alice1Before = token1.balanceOf(alice);
        vm.startPrank(alice);
        vm.recordLogs();
        router.swap(
            key,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: 1e17, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            type(uint256).max, // exact-out: no input cap in this probe
            type(uint256).max
        );
        vm.stopPrank();
        bytes32 tradeId = _bondedId();

        assertEq(token1.balanceOf(alice) - alice1Before, 1e17, "exact-out filled on canonical PM");
        (, uint256 bond,,) = _t(tradeId);
        assertGt(bond, 0, "exact-out bond charged");
        assertEq(token0.balanceOf(address(hook)), bond, "escrow matches bond");
    }

    function _t(bytes32 id) internal view returns (address trader, uint256 bond, int24 preTick, int24 postTick) {
        (, address t,, uint256 b, int24 pre, int24 post,,,,,) = hook.trades(id);
        return (t, b, pre, post);
    }
}
