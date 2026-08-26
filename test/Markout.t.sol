// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";

import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {PoolManager} from "@uniswap/v4-core/src/PoolManager.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {StateLibrary} from "@uniswap/v4-core/src/libraries/StateLibrary.sol";
import {PoolModifyLiquidityTest} from "@uniswap/v4-core/src/test/PoolModifyLiquidityTest.sol";
import {HookMiner} from "./shared/HookMiner.sol";

import {MarkoutHook} from "../src/MarkoutHook.sol";
import {MarkoutRouter} from "../src/MarkoutRouter.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {ReenterRefundToken} from "./mocks/ReenterRefundToken.sol";

contract MarkoutTest is Test {
    using CurrencyLibrary for Currency;
    using PoolIdLibrary for PoolKey;
    using StateLibrary for IPoolManager;

    uint160 internal constant SQRT_PRICE_1_1 = 79228162514264337593543950336;
    uint24 internal constant FEE = 300; // 3 bps
    int24 internal constant TICK_SPACING = 60;
    bytes32 internal constant SWAP_BONDED_TOPIC = keccak256("SwapBonded(bytes32,address,int24,int24,uint256)");

    MockERC20 internal tokenA;
    MockERC20 internal tokenB;
    Currency internal currency0;
    Currency internal currency1;

    PoolManager internal manager;
    PoolModifyLiquidityTest internal lpRouter;
    MarkoutHook internal hook;
    MarkoutRouter internal router;

    PoolKey internal key;

    address internal alice = makeAddr("alice");
    address internal arber = makeAddr("arber");
    address internal settler = makeAddr("settler"); // anyone

    function setUp() public {
        tokenA = new MockERC20();
        tokenB = new MockERC20();
        manager = new PoolManager(address(this));
        lpRouter = new PoolModifyLiquidityTest(IPoolManager(address(manager)));

        (address hookAddress, bytes32 salt) = HookMiner.find(
            address(this),
            uint160(
                Hooks.BEFORE_INITIALIZE_FLAG | Hooks.AFTER_INITIALIZE_FLAG | Hooks.BEFORE_SWAP_FLAG
                    | Hooks.AFTER_SWAP_FLAG
            ),
            type(MarkoutHook).creationCode,
            abi.encode(address(manager))
        );
        hook = new MarkoutHook{salt: salt}(IPoolManager(address(manager)));
        assertEq(address(hook), hookAddress, "hook address mining failed");

        router = new MarkoutRouter(IPoolManager(address(manager)), address(hook));
        hook.initializeRouter(address(router));

        (currency0, currency1) = address(tokenA) < address(tokenB)
            ? (Currency.wrap(address(tokenA)), Currency.wrap(address(tokenB)))
            : (Currency.wrap(address(tokenB)), Currency.wrap(address(tokenA)));

        key = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: FEE,
            tickSpacing: TICK_SPACING,
            hooks: IHooks(address(hook))
        });
        manager.initialize(key, SQRT_PRICE_1_1);
        _seedLiquidity(key, 1e18);

        _fund(alice);
        _fund(arber);
    }

    // ---------------------------------------------------------------------
    // Harness helpers
    // ---------------------------------------------------------------------

    function _seedLiquidity(PoolKey memory k, uint256 liquidity) internal {
        MockERC20(Currency.unwrap(k.currency1)).mint(address(this), uint256(liquidity) + 1e18);
        MockERC20(Currency.unwrap(k.currency1)).approve(address(lpRouter), type(uint256).max);
        if (!k.currency0.isAddressZero()) {
            MockERC20(Currency.unwrap(k.currency0)).mint(address(this), uint256(liquidity) + 1e18);
            MockERC20(Currency.unwrap(k.currency0)).approve(address(lpRouter), type(uint256).max);
        }
        lpRouter.modifyLiquidity{value: k.currency0.isAddressZero() ? 1e18 : 0}(
            k,
            IPoolManager.ModifyLiquidityParams({
                tickLower: TickMath.minUsableTick(TICK_SPACING),
                tickUpper: TickMath.maxUsableTick(TICK_SPACING),
                liquidityDelta: int256(uint256(liquidity)),
                salt: bytes32(0)
            }),
            new bytes(0)
        );
    }

    function _fund(address trader) internal {
        MockERC20(Currency.unwrap(currency0)).mint(trader, 1000e18);
        MockERC20(Currency.unwrap(currency1)).mint(trader, 1000e18);
        vm.startPrank(trader);
        MockERC20(Currency.unwrap(currency0)).approve(address(router), type(uint256).max);
        MockERC20(Currency.unwrap(currency1)).approve(address(router), type(uint256).max);
        vm.stopPrank();
    }

    function _swap(address sender, bool zeroForOne, int256 amountSpecified) internal returns (BalanceDelta delta) {
        vm.prank(sender);
        delta = router.swap(
            key,
            IPoolManager.SwapParams({
                zeroForOne: zeroForOne,
                amountSpecified: amountSpecified,
                sqrtPriceLimitX96: zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1
            }),
            0,
            type(uint256).max
        );
    }

    function _bondedId() internal returns (bytes32 tradeId) {
        Vm.Log[] memory entries = vm.getRecordedLogs();
        for (uint256 i = entries.length; i > 0; --i) {
            if (entries[i - 1].topics[0] == SWAP_BONDED_TOPIC && entries[i - 1].emitter == address(hook)) {
                return entries[i - 1].topics[1];
            }
        }
        revert("no SwapBonded found");
    }

    function _trade(bytes32 tradeId)
        internal
        view
        returns (address trader, uint256 bondAmount, uint32 settleAfter, MarkoutHook.Outcome outcome, bool claimed)
    {
        (, address t,, uint256 b,,,, uint32 s,, MarkoutHook.Outcome o, bool c) = hook.trades(tradeId);
        return (t, b, s, o, c);
    }

    // ---------------------------------------------------------------------
    // Golden paths
    // ---------------------------------------------------------------------

    function test_organicQuiet_refundsBond() public {
        vm.recordLogs();
        BalanceDelta delta = _swap(alice, true, -2e17);
        bytes32 tradeId = _bondedId();

        uint256 amountIn = uint256(uint128(-delta.amount0()));
        uint256 expectedBond = (amountIn * hook.BOND_BPS()) / hook.BPS_DENOMINATOR();
        assertGt(expectedBond, 0, "bond must be nonzero");
        assertEq(currency0.balanceOf(address(hook)), expectedBond, "bond not escrowed");
        assertEq(hook.escrowLiability(currency0), expectedBond, "liability recorded");

        // Arbitrageur reverts the price behind the organic trader.
        _swap(arber, false, -2e17);

        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);
        uint256 aliceMid = currency0.balanceOf(alice);

        vm.prank(settler); // permissionless settlement
        hook.settle(tradeId);
        (,,, MarkoutHook.Outcome outcome,) = _trade(tradeId);
        assertEq(uint8(outcome), uint8(MarkoutHook.Outcome.RefundPending), "expected refund-pending");

        // Pull-based refund, claimable by anyone.
        vm.prank(settler);
        bool delivered = hook.claimRefund(tradeId);
        assertTrue(delivered, "claim must deliver");
        assertEq(currency0.balanceOf(alice), aliceMid + expectedBond, "bond not refunded");
        assertEq(currency0.balanceOf(address(hook)), 0, "hook escrow released");
        assertEq(hook.escrowLiability(currency0), 0, "liability cleared");
    }

    function test_arbSustains_donates() public {
        vm.recordLogs();
        BalanceDelta delta = _swap(alice, true, -2e17);
        bytes32 tradeId = _bondedId();
        uint256 amountIn = uint256(uint128(-delta.amount0()));
        uint256 expectedBond = (amountIn * hook.BOND_BPS()) / hook.BPS_DENOMINATOR();

        uint256 alice0 = currency0.balanceOf(alice);
        uint256 pool0 = currency0.balanceOf(address(manager));

        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);
        vm.prank(settler);
        hook.settle(tradeId);

        (,,, MarkoutHook.Outcome outcome,) = _trade(tradeId);
        assertEq(uint8(outcome), uint8(MarkoutHook.Outcome.Donated), "expected donate");
        assertEq(currency0.balanceOf(alice), alice0, "toxic trader keeps nothing");
        assertEq(hook.pendingDonation(key.toId(), 0), expectedBond, "donation deferred");

        // Flush moves the escrow into the pool for in-range LPs.
        vm.expectEmit(true, true, true, true, address(manager));
        emit IPoolManager.Donate(key.toId(), address(hook), expectedBond, uint256(0));
        vm.prank(settler);
        hook.flushDonation(key.toId());

        assertEq(currency0.balanceOf(address(manager)), pool0 + expectedBond, "pool must receive the bond");
        assertEq(currency0.balanceOf(address(hook)), 0, "hook holds no escrow after flush");
        assertEq(hook.escrowLiability(currency0), 0, "liability cleared");
    }

    // ---------------------------------------------------------------------
    // Guards
    // ---------------------------------------------------------------------

    function test_settleWindowOpen_reverts() public {
        vm.recordLogs();
        _swap(alice, true, -2e17);
        bytes32 tradeId = _bondedId();
        (,, uint32 settleAfter,,) = _trade(tradeId);

        vm.prank(settler);
        vm.expectRevert(
            abi.encodeWithSelector(MarkoutHook.SettlementWindowOpen.selector, uint256(settleAfter), block.timestamp)
        );
        hook.settle(tradeId);
    }

    function test_settle_replay_reverts() public {
        vm.recordLogs();
        _swap(alice, true, -2e17);
        bytes32 tradeId = _bondedId();
        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);
        hook.settle(tradeId);
        vm.expectRevert(MarkoutHook.AlreadySettled.selector);
        hook.settle(tradeId);
    }

    function test_claim_twice_reverts() public {
        vm.recordLogs();
        _swap(alice, true, -2e17);
        bytes32 tradeId = _bondedId();
        _swap(arber, false, -2e17); // reversion => refund verdict
        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);
        hook.settle(tradeId);
        assertTrue(hook.claimRefund(tradeId));
        vm.expectRevert(MarkoutHook.RefundAlreadyClaimed.selector);
        hook.claimRefund(tradeId);
    }

    function test_claim_beforeVerdict_reverts() public {
        vm.recordLogs();
        _swap(alice, true, -2e17);
        bytes32 tradeId = _bondedId();
        vm.expectRevert(MarkoutHook.NotRefundPending.selector);
        hook.claimRefund(tradeId);
    }

    // ---------------------------------------------------------------------
    // Oracle hardening
    // ---------------------------------------------------------------------

    function test_spotGames_ignored() public {
        vm.recordLogs();
        _swap(alice, true, -2e17); // toxic: pushes price up and sustains
        bytes32 tradeId = _bondedId();

        vm.warp(block.timestamp + 10);
        hook.poke(key.toId());
        _swap(arber, false, -1e13); // micro shove toward pre
        _swap(arber, true, -1e13); // and straight back, same block

        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY());
        vm.prank(settler);
        hook.settle(tradeId);
        (,,, MarkoutHook.Outcome outcome,) = _trade(tradeId);
        assertEq(uint8(outcome), uint8(MarkoutHook.Outcome.Donated), "intra-block spot game must not flip outcome");
    }

    function test_twap_honorsSustainedReversion() public {
        vm.recordLogs();
        _swap(alice, true, -2e17);
        bytes32 tradeId = _bondedId();

        vm.warp(block.timestamp + 1);
        _swap(arber, false, -2e17); // reversion held across the window
        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY());

        vm.prank(settler);
        hook.settle(tradeId);
        (,,, MarkoutHook.Outcome outcome,) = _trade(tradeId);
        assertEq(uint8(outcome), uint8(MarkoutHook.Outcome.RefundPending), "held reversion must refund");
    }

    function test_zeroImpact_refunds() public {
        _seedLiquidity(key, 9999e18); // deepen: x = 10_000e18, so 1e12 moves the tick < 1e-6 of a tick
        vm.recordLogs();
        // Buy direction: the sub-tick upward move floors back to the same
        // tick (a downward move would floor to -1 by getTickAtSqrtPrice
        // semantics), producing a genuine pre == post tick.
        _swap(alice, false, 1e12);
        bytes32 tradeId = _bondedId();
        {
            (int24 preTick, int24 postTick) = _tradeTicks(tradeId);
            assertEq(preTick, postTick, "setup: expected zero tick impact");
        }

        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);
        vm.prank(settler);
        hook.settle(tradeId);
        (,,, MarkoutHook.Outcome outcome,) = _trade(tradeId);
        assertEq(uint8(outcome), uint8(MarkoutHook.Outcome.RefundPending), "zero impact must refund");
    }

    /// @dev Last-look manipulation: after the window has closed, an attacker
    /// shoves the price fully back toward pre right before settlement. The
    /// fixed window endpoint is interpolated at settleAfter, so the shove is
    /// invisible to the verdict.
    function test_lastLook_postWindowShove_ignored() public {
        vm.recordLogs();
        _swap(alice, true, -2e17); // toxic
        bytes32 tradeId = _bondedId();

        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 2); // window closed
        hook.poke(key.toId());
        _swap(arber, false, -2e17); // shove price all the way back, post-window
        vm.warp(block.timestamp + 30); // ...and hold it
        hook.poke(key.toId());

        vm.prank(settler);
        hook.settle(tradeId);
        (,,, MarkoutHook.Outcome outcome,) = _trade(tradeId);
        assertEq(uint8(outcome), uint8(MarkoutHook.Outcome.Donated), "post-window shove must not flip verdict");
    }

    /// @dev Settling at T+1s and long after T (with unrelated accumulator
    /// churn in between) must produce identical outcomes.
    function test_delayedSettlement_sameOutcome_refund() public {
        // Run A: settle immediately after the window.
        vm.recordLogs();
        _swap(alice, true, -2e17);
        bytes32 tradeA = _bondedId();
        _swap(arber, false, -2e17);
        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);
        hook.settle(tradeA);
        (,,, MarkoutHook.Outcome outcomeA,) = _trade(tradeA);

        // Run B: identical trade, settled an hour late with churn in between.
        vm.recordLogs();
        _swap(alice, true, -2e17);
        bytes32 tradeB = _bondedId();
        _swap(arber, false, -2e17);
        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);
        uint256 t = block.timestamp;
        for (uint256 i; i < 30; ++i) {
            t += 60;
            vm.warp(t);
            hook.poke(key.toId());
        }
        vm.warp(t + 3600);
        hook.settle(tradeB);
        (,,, MarkoutHook.Outcome outcomeB,) = _trade(tradeB);

        assertEq(uint8(outcomeA), uint8(MarkoutHook.Outcome.RefundPending), "run A refund");
        assertEq(uint8(outcomeB), uint8(outcomeA), "delayed settlement changed the verdict");
    }

    function test_delayedSettlement_sameOutcome_donate() public {
        vm.recordLogs();
        _swap(alice, true, -2e17); // sustained
        bytes32 tradeA = _bondedId();
        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);
        hook.settle(tradeA);

        vm.recordLogs();
        _swap(alice, true, -2e17);
        bytes32 tradeB = _bondedId();
        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);
        uint256 t = block.timestamp;
        for (uint256 i; i < 30; ++i) {
            t += 60;
            vm.warp(t);
            hook.poke(key.toId());
        }
        hook.settle(tradeB);

        (,,, MarkoutHook.Outcome outcomeA,) = _trade(tradeA);
        (,,, MarkoutHook.Outcome outcomeB,) = _trade(tradeB);
        assertEq(uint8(outcomeA), uint8(MarkoutHook.Outcome.Donated), "run A donate");
        assertEq(uint8(outcomeB), uint8(outcomeA), "delayed settlement changed the verdict");
    }

    function test_historyPruned_reverts() public {
        vm.recordLogs();
        _swap(alice, true, -2e17);
        bytes32 tradeId = _bondedId();
        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);

        // Overwrite the observation ring so no observation at or before
        // settleAfter survives.
        uint256 t = block.timestamp;
        for (uint256 i; i < hook.OBSERVATION_CAPACITY() + 40; ++i) {
            t += 2;
            vm.warp(t);
            hook.poke(key.toId());
        }

        vm.prank(settler);
        vm.expectRevert(MarkoutHook.SettlementHistoryPruned.selector);
        hook.settle(tradeId);
    }

    // ---------------------------------------------------------------------
    // Zero-liquidity donation deferral
    // ---------------------------------------------------------------------

    function test_zeroLiquidity_donationDeferred() public {
        vm.recordLogs();
        _swap(alice, true, -2e17); // toxic
        bytes32 tradeId = _bondedId();
        (, uint256 bond,,,) = _trade(tradeId);

        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);

        // Drain all liquidity after the window closed.
        lpRouter.modifyLiquidity(
            key,
            IPoolManager.ModifyLiquidityParams({
                tickLower: TickMath.minUsableTick(TICK_SPACING),
                tickUpper: TickMath.maxUsableTick(TICK_SPACING),
                liquidityDelta: -1e18,
                salt: bytes32(0)
            }),
            new bytes(0)
        );
        assertEq(StateLibrary.getLiquidity(manager, key.toId()), 0, "liquidity drained");

        // Settlement succeeds and defers distribution.
        vm.prank(settler);
        hook.settle(tradeId);
        (,,, MarkoutHook.Outcome outcome,) = _trade(tradeId);
        assertEq(uint8(outcome), uint8(MarkoutHook.Outcome.Donated), "donate recorded");

        uint256 pool0 = currency0.balanceOf(address(manager));
        vm.expectRevert(MarkoutHook.NoActiveLiquidity.selector);
        hook.flushDonation(key.toId());
        assertEq(currency0.balanceOf(address(manager)), pool0, "no value moved at zero liquidity");

        // Liquidity returns; the deferred donation flushes.
        _seedLiquidity(key, 1e18);
        uint256 poolAfterReseed = currency0.balanceOf(address(manager));
        vm.prank(settler);
        hook.flushDonation(key.toId());
        assertEq(currency0.balanceOf(address(manager)), poolAfterReseed + bond, "deferred donation delivered");
        assertEq(currency0.balanceOf(address(hook)), 0, "escrow released");
    }

    // ---------------------------------------------------------------------
    // Reentrancy
    // ---------------------------------------------------------------------

    function test_reentrancy_claimBlocked() public {
        ReenterRefundToken evil = new ReenterRefundToken();
        (Currency e0, Currency e1) = address(evil) < address(tokenB)
            ? (Currency.wrap(address(evil)), currency1)
            : (currency1, Currency.wrap(address(evil)));
        PoolKey memory k =
            PoolKey({currency0: e0, currency1: e1, fee: FEE, tickSpacing: TICK_SPACING, hooks: IHooks(address(hook))});
        manager.initialize(k, SQRT_PRICE_1_1);
        MockERC20(Currency.unwrap(e1)).mint(address(this), 1000e18);
        MockERC20(Currency.unwrap(e1)).approve(address(lpRouter), type(uint256).max);
        evil.mint(address(this), 1000e18);
        evil.approve(address(lpRouter), type(uint256).max);
        lpRouter.modifyLiquidity(
            k,
            IPoolManager.ModifyLiquidityParams({
                tickLower: TickMath.minUsableTick(TICK_SPACING),
                tickUpper: TickMath.maxUsableTick(TICK_SPACING),
                liquidityDelta: 1e18,
                salt: bytes32(0)
            }),
            new bytes(0)
        );

        Attacker trader = new Attacker(evil);
        evil.mint(address(trader), 1000e18);
        MockERC20(Currency.unwrap(e1)).mint(address(trader), 1000e18);
        trader.doApprove(address(router));
        vm.deal(address(trader), 1 ether);

        // Organic trade bonded in the evil token, then reverted.
        bool evilIs0 = Currency.unwrap(e0) == address(evil);
        vm.recordLogs();
        vm.prank(address(trader));
        router.swap(
            k,
            IPoolManager.SwapParams({
                zeroForOne: evilIs0,
                amountSpecified: -2e17,
                sqrtPriceLimitX96: evilIs0 ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1
            }),
            0,
            type(uint256).max
        );
        bytes32 tradeId = _bondedId();
        (, uint256 bond,,,) = _trade(tradeId);
        assertEq(Currency.unwrap(evilIs0 ? e0 : e1), address(evil), "bond currency must be the evil token");

        vm.prank(address(arber));
        MockERC20(Currency.unwrap(e1)).approve(address(router), type(uint256).max);
        MockERC20(Currency.unwrap(e1)).mint(arber, 1000e18);
        vm.prank(arber);
        router.swap(
            k,
            IPoolManager.SwapParams({
                zeroForOne: !evilIs0,
                amountSpecified: -2e17,
                sqrtPriceLimitX96: !evilIs0 ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1
            }),
            0,
            type(uint256).max
        );

        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);
        hook.settle(tradeId);
        (,,, MarkoutHook.Outcome outcome,) = _trade(tradeId);
        assertEq(uint8(outcome), uint8(MarkoutHook.Outcome.RefundPending), "verdict is refund");

        // Arm the reentrancy: during the refund transfer the token reenters
        // claimRefund for the same trade.
        evil.arm(address(hook), tradeId, address(trader));

        uint256 hookBondBefore = evil.balanceOf(address(hook));
        uint256 traderBefore = evil.balanceOf(address(trader));
        vm.prank(settler);
        bool delivered = hook.claimRefund(tradeId);
        assertTrue(delivered, "legitimate claim must deliver");
        assertEq(evil.reentries(), 1, "token must have attempted the reentrancy");
        assertEq(evil.balanceOf(address(trader)), traderBefore + bond, "trader paid exactly once");
        assertEq(evil.balanceOf(address(hook)), hookBondBefore - bond, "hook paid exactly one bond");

        vm.expectRevert(MarkoutHook.RefundAlreadyClaimed.selector);
        hook.claimRefund(tradeId);
    }

    // ---------------------------------------------------------------------
    // Router identity lock
    // ---------------------------------------------------------------------

    function test_spoofedRouter_reverts() public {
        // A fake "router" tries to swap directly through the PoolManager,
        // declaring an arbitrary beneficiary in hookData.
        FakeRouter fake = new FakeRouter(address(manager));
        vm.expectRevert(); // hook revert wrapped by v4 CustomRevert (ERC-7751)
        fake.swap(
            key,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -1e17, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            alice // spoofed beneficiary
        );
    }

    function test_initializeRouter_locksForever() public {
        vm.expectRevert(MarkoutHook.RouterAlreadySet.selector);
        hook.initializeRouter(address(0xBEEF));
        vm.prank(alice);
        vm.expectRevert(MarkoutHook.NotTrustedRouter.selector);
        hook.initializeRouter(address(0xBEEF));
    }

    // ---------------------------------------------------------------------
    // Hostile token: refund delivery fails, stays retryable, never bricks
    // ---------------------------------------------------------------------

    function test_hostileToken_refundRetryable() public {
        vm.recordLogs();
        _swap(alice, true, -2e17);
        bytes32 tradeId = _bondedId();
        (, uint256 bond,,,) = _trade(tradeId);
        _swap(arber, false, -2e17); // reversion => refund verdict

        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);
        vm.prank(settler);
        hook.settle(tradeId);

        // Blacklist the trader: refunds to alice now fail, but the verdict
        // and the escrow survive — claimable later.
        MockERC20(Currency.unwrap(currency0)).setBlocked(alice, true);
        vm.expectEmit(true, true, true, true, address(hook));
        emit MarkoutHook.RefundDeliveryFailed(tradeId, alice, bond);
        vm.prank(settler);
        bool delivered = hook.claimRefund(tradeId);
        assertFalse(delivered, "delivery must fail");
        assertEq(currency0.balanceOf(address(hook)), bond, "escrow preserved");
        assertEq(hook.escrowLiability(currency0), bond, "liability preserved");
        (,,, MarkoutHook.Outcome outcome,) = _trade(tradeId);
        assertEq(uint8(outcome), uint8(MarkoutHook.Outcome.RefundPending), "verdict preserved");

        // Unblock and retry: the refund goes through.
        MockERC20(Currency.unwrap(currency0)).setBlocked(alice, false);
        uint256 aliceMid = currency0.balanceOf(alice);
        vm.prank(settler);
        assertTrue(hook.claimRefund(tradeId), "retry must deliver");
        assertEq(currency0.balanceOf(alice), aliceMid + bond, "bond delivered on retry");
        assertEq(currency0.balanceOf(address(hook)), 0, "escrow released");
    }

    // ---------------------------------------------------------------------
    // Pool configuration
    // ---------------------------------------------------------------------

    function test_unsupportedPoolConfig_reverts() public {
        PoolKey memory bad = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: 500,
            tickSpacing: TICK_SPACING,
            hooks: IHooks(address(hook))
        });
        vm.expectRevert(); // wrapped by PoolManager
        manager.initialize(bad, SQRT_PRICE_1_1);
    }

    // ---------------------------------------------------------------------
    // Router integration guarantees
    // ---------------------------------------------------------------------

    function test_routerDeadline_reverts() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(MarkoutRouter.DeadlineExpired.selector, block.timestamp - 1, block.timestamp)
        );
        router.swap(
            key,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -1e17, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            0,
            block.timestamp - 1
        );
    }

    function test_routerSlippage_reverts() public {
        vm.prank(alice);
        vm.expectRevert(); // TooLittleOut(args) propagates through unlock
        router.swap(
            key,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -1e17, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            type(uint256).max, // impossible minimum output
            type(uint256).max
        );
    }

    function test_routerSlippage_passesWhenMet() public {
        vm.prank(alice);
        BalanceDelta delta = router.swap(
            key,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -1e17, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            1, // trivially met minimum
            type(uint256).max
        );
        assertLt(delta.amount0(), 0, "input paid");
    }

    // ---------------------------------------------------------------------
    // Bond math + receipt removal
    // ---------------------------------------------------------------------

    function test_exactOut_chargesInputBondAndFillsOutput() public {
        uint256 alice1Before = currency1.balanceOf(alice);
        vm.recordLogs();
        BalanceDelta delta = _swap(alice, true, 1e17); // exact-out: buy exactly 1e17 token1

        assertEq(currency1.balanceOf(alice) - alice1Before, 1e17, "exact-out not filled");
        bytes32 tradeId = _bondedId();

        uint256 amountIn = uint256(uint128(-delta.amount0()));
        (, uint256 bond,,,) = _trade(tradeId);
        assertEq(bond, (amountIn * hook.BOND_BPS()) / hook.BPS_DENOMINATOR(), "bond != 20 bps of amountIn");
        assertEq(currency0.balanceOf(address(hook)), bond, "escrow equals bond");
    }

    function test_bondFor_quotes() public view {
        assertEq(hook.bondFor(1e18), 2e15, "bondFor(1e18)");
        assertEq(hook.bondFor(499), 0, "bondFor dust");
        assertEq(hook.bondFor(500), 1, "bondFor minimum unit");
    }

    function test_swapTooSmall_reverts() public {
        vm.prank(alice);
        vm.expectRevert(); // hook revert wrapped (ERC-7751)
        router.swap(
            key,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -499, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            0,
            type(uint256).max
        );
    }

    /// @notice The pseudo-ERC-6909 receipt ledger is gone: events + Trade
    /// state are the only records, and no transferable token exists.
    function test_noReceiptTokenSurface() public {
        (bool ok,) = address(hook).call(abi.encodeWithSignature("totalSupply()"));
        assertFalse(ok, "no ERC-6909 surface may exist");
    }

    // ---------------------------------------------------------------------
    // Preview
    // ---------------------------------------------------------------------

    function test_previewTrade_projectsAndFinalizes() public {
        vm.recordLogs();
        _swap(alice, true, -2e17);
        bytes32 tradeId = _bondedId();

        // Window still open: preview projects the held tick.
        (int24 pre, int24 post, int24 avg, int256 revBps, uint8 expected, uint8 outcome,) = hook.previewTrade(tradeId);
        assertEq(uint256(uint8(outcome)), 0, "still open");
        assertEq(pre, 0, "pre tick");
        assertTrue(post != pre, "swap must move the tick");
        assertEq(expected, 2, "sustained so far => donate projection");
        assertApproxEqAbs(revBps, 0, 500, "~0% reverted while sustained");

        _swap(arber, false, -2e17); // revert
        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);
        hook.settle(tradeId);
        (,,,,, uint8 settledOutcome,) = hook.previewTrade(tradeId);
        assertEq(settledOutcome, 1, "finalized refund-pending");
    }

    // ---------------------------------------------------------------------
    // Native currency end-to-end
    // ---------------------------------------------------------------------

    function test_nativePool_endToEnd() public {
        PoolKey memory k = PoolKey({
            currency0: CurrencyLibrary.ADDRESS_ZERO,
            currency1: currency1,
            fee: FEE,
            tickSpacing: TICK_SPACING,
            hooks: IHooks(address(hook))
        });
        manager.initialize(k, SQRT_PRICE_1_1);
        _seedLiquidity(k, 1e18);

        vm.deal(alice, 10e18);
        vm.deal(arber, 10e18);
        MockERC20(Currency.unwrap(currency1)).mint(arber, 1000e18);
        vm.prank(arber);
        MockERC20(Currency.unwrap(currency1)).approve(address(router), type(uint256).max);

        // --- Refund path, bond denominated in native ---
        vm.recordLogs();
        vm.prank(alice);
        router.swap{value: 2.5e17}(
            k,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -2e17, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            0,
            type(uint256).max
        );
        bytes32 tradeId = _bondedId();
        (, uint256 bond,,,) = _trade(tradeId);
        assertGt(bond, 0, "native bond escrowed");
        assertEq(address(hook).balance, bond, "hook physically holds the native bond");
        assertEq(hook.escrowLiability(CurrencyLibrary.ADDRESS_ZERO), bond, "native liability recorded");

        vm.prank(arber); // arbitrageur reverts with the token side
        router.swap(
            k,
            IPoolManager.SwapParams({
                zeroForOne: false, amountSpecified: -2e17, sqrtPriceLimitX96: TickMath.MAX_SQRT_PRICE - 1
            }),
            0,
            type(uint256).max
        );

        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);
        hook.settle(tradeId);
        uint256 aliceEthBefore = alice.balance;
        vm.prank(settler);
        assertTrue(hook.claimRefund(tradeId), "native refund claim");
        assertEq(alice.balance, aliceEthBefore + bond, "native bond refunded");
        assertEq(address(hook).balance, 0, "native escrow released");

        // --- Donate path: native donation flushes into the pool ---
        vm.recordLogs();
        vm.prank(alice);
        router.swap{value: 2.5e17}(
            k,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -2e17, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            0,
            type(uint256).max
        );
        bytes32 donateId = _bondedId();
        (, uint256 donateBond,,,) = _trade(donateId);

        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);
        hook.settle(donateId);

        uint256 pmEthBefore = address(manager).balance;
        vm.prank(settler);
        hook.flushDonation(k.toId());
        assertEq(address(manager).balance, pmEthBefore + donateBond, "pool received the native donation");
        assertEq(address(hook).balance, 0, "hook returned the taken native");
        assertEq(hook.escrowLiability(CurrencyLibrary.ADDRESS_ZERO), 0, "native liability cleared");
    }

    // ---------------------------------------------------------------------

    function _tradeTicks(bytes32 tradeId) internal view returns (int24 preTick, int24 postTick) {
        (,,,, int24 p, int24 q,,,,,) = hook.trades(tradeId);
        return (p, q);
    }
}

// -------------------------------------------------------------------------
// Attack collaborators
// -------------------------------------------------------------------------

contract Attacker {
    ReenterRefundToken public token;

    constructor(ReenterRefundToken t) {
        token = t;
    }

    function doApprove(address router) external {
        token.approve(router, type(uint256).max);
    }

    receive() external payable {}
}

contract FakeRouter {
    IPoolManager public manager;

    constructor(address m) {
        manager = IPoolManager(m);
    }

    function swap(PoolKey memory key, IPoolManager.SwapParams memory params, address beneficiary) external {
        manager.unlock(abi.encodeCall(this.callback, (key, params, beneficiary)));
    }

    function callback(PoolKey memory key, IPoolManager.SwapParams memory params, address beneficiary)
        external
        returns (bytes memory)
    {
        manager.swap(key, params, abi.encode(beneficiary));
        return "";
    }
}
