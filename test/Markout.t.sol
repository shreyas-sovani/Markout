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
import {PoolSwapTest} from "@uniswap/v4-core/src/test/PoolSwapTest.sol";
import {TransientStateLibrary} from "@uniswap/v4-core/src/libraries/TransientStateLibrary.sol";
import {HookMiner} from "./shared/HookMiner.sol";

import {MarkoutHook} from "../src/MarkoutHook.sol";
import {BaseHook} from "../src/BaseHook.sol";
import {MarkoutRouter} from "../src/MarkoutRouter.sol";
import {FaucetToken} from "../src/FaucetToken.sol";
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
    PoolSwapTest internal genericRouter; // v4's own router: no Markout coupling
    MarkoutHook internal hook;
    MarkoutRouter internal router; // convenience router

    PoolKey internal key;

    address internal alice = makeAddr("alice");
    address internal arber = makeAddr("arber");
    address internal settler = makeAddr("settler"); // anyone

    function setUp() public {
        tokenA = new MockERC20();
        tokenB = new MockERC20();
        manager = new PoolManager(address(this));
        lpRouter = new PoolModifyLiquidityTest(IPoolManager(address(manager)));
        genericRouter = new PoolSwapTest(IPoolManager(address(manager)));

        (address hookAddress, bytes32 salt) = HookMiner.find(
            address(this),
            uint160(
                Hooks.BEFORE_INITIALIZE_FLAG | Hooks.AFTER_INITIALIZE_FLAG | Hooks.BEFORE_SWAP_FLAG
                    | Hooks.AFTER_SWAP_FLAG | Hooks.BEFORE_SWAP_RETURNS_DELTA_FLAG | Hooks.AFTER_SWAP_RETURNS_DELTA_FLAG
            ),
            type(MarkoutHook).creationCode,
            abi.encode(address(manager))
        );
        hook = new MarkoutHook{salt: salt}(IPoolManager(address(manager)));
        assertEq(address(hook), hookAddress, "hook address mining failed");

        router = new MarkoutRouter(IPoolManager(address(manager)));

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
        MockERC20(Currency.unwrap(currency0)).approve(address(genericRouter), type(uint256).max);
        MockERC20(Currency.unwrap(currency1)).approve(address(genericRouter), type(uint256).max);
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
            amountSpecified < 0 ? 0 : type(uint256).max, // exact-out: no input cap here
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

    function _ticks(bytes32 tradeId) internal view returns (int24 pre, int24 post) {
        (,,,, int24 p, int24 q,,,,,) = hook.trades(tradeId);
        return (p, q);
    }

    // ---------------------------------------------------------------------
    // 1 — Bond payable without a Markout allowlist
    // ---------------------------------------------------------------------

    /// @dev v4's own PoolSwapTest knows nothing about Markout: it swaps and
    /// settles its own delta like any generic router. The bond rides that
    /// delta, so the swap succeeds and the bond is escrowed.
    function test_bondPayable_genericRouter() public {
        vm.recordLogs();
        vm.prank(alice);
        genericRouter.swap(
            key,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -1e17, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            new bytes(0) // no hookData: trader = the router itself
        );
        bytes32 tradeId = _bondedId();

        (address trader, uint256 bond,,,) = _trade(tradeId);
        assertGt(bond, 0, "bond escrowed through generic router");
        assertEq(currency0.balanceOf(address(hook)), bond, "hook holds the bond");
        assertEq(trader, address(genericRouter), "no hookData => trader is the direct caller");
        assertEq(hook.escrowLiability(currency0), bond, "liability recorded");
    }

    /// @dev An attacker-authored router can also swap: the bond is charged
    /// to whoever initiates, and the beneficiary it declares receives any
    /// refund. No gate, no trusted-router list.
    function test_bondPayable_attackerAuthoredRouter() public {
        FakeRouter fake = new FakeRouter(address(manager));
        MockERC20(Currency.unwrap(currency0)).mint(address(this), 10e18);
        MockERC20(Currency.unwrap(currency0)).approve(address(fake), type(uint256).max);

        vm.recordLogs();
        fake.swap(
            key,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -1e17, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            alice // declares the beneficiary
        );
        bytes32 tradeId = _bondedId();
        (address trader, uint256 bond,,,) = _trade(tradeId);
        assertEq(trader, alice, "declared beneficiary honored");
        assertEq(currency0.balanceOf(address(hook)), bond, "bond escrowed");
        assertEq(hook.escrowLiability(currency0), bond, "liability recorded");
    }

    // ---------------------------------------------------------------------
    // 2 — Window + classifier match a ~12 s chain
    // ---------------------------------------------------------------------

    /// @dev A full 1:1 reversion landing one block (12 s) after the trade
    /// sits exactly at the 50% frontier of the 24 s window: refund, with no
    /// overshoot needed.
    function test_fullReverseNextBlock_refunds() public {
        vm.recordLogs();
        _swap(alice, true, -2e17);
        bytes32 tradeId = _bondedId();
        (, uint256 bond,,,) = _trade(tradeId);

        uint256 t = block.timestamp + 12; // next block on a 12 s chain
        vm.warp(t);
        _swap(arber, false, -2e17); // exact 1:1 reversion, no overshoot
        vm.warp(t + 12); // window closes

        uint256 aliceMid = currency0.balanceOf(alice);
        vm.prank(settler);
        hook.settle(tradeId);

        (,,, MarkoutHook.Outcome outcome,) = _trade(tradeId);
        assertEq(uint8(outcome), uint8(MarkoutHook.Outcome.Refunded), "next-block full reverse must refund");
        assertEq(currency0.balanceOf(alice), aliceMid + bond, "refund PAID AT SETTLE, no claim tx");
        assertEq(currency0.balanceOf(address(hook)), 0, "escrow released");
    }

    /// @dev The same reversion landing after the window closed sustains:
    /// donate.
    function test_reverseAfterWindow_donates() public {
        vm.recordLogs();
        _swap(alice, true, -2e17);
        bytes32 tradeId = _bondedId();

        uint256 t = block.timestamp + hook.SETTLEMENT_DELAY() + 12;
        vm.warp(t);
        _swap(arber, false, -2e17);
        vm.warp(t + 24);

        vm.prank(settler);
        hook.settle(tradeId);
        (,,, MarkoutHook.Outcome outcome,) = _trade(tradeId);
        assertEq(uint8(outcome), uint8(MarkoutHook.Outcome.Donated), "late reversion donates");
    }

    // ---------------------------------------------------------------------
    // 3 — Bonds cannot be trapped after the window
    // ---------------------------------------------------------------------

    /// @dev Identical trades: one settled at window close, one settled a day
    /// late after 50 swaps and 200 pokes landed in between. Same verdict,
    /// and the late settle succeeds — the observation history is
    /// append-only, so later swaps and pokes can never freeze escrow.
    function test_delayedSettlement_matchesWindowClose() public {
        vm.recordLogs();
        _swap(alice, true, -2e17);
        bytes32 tradeA = _bondedId();
        _swap(arber, false, -2e17); // organic: reverted
        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);
        hook.settle(tradeA);
        (,,, MarkoutHook.Outcome outcomeA,) = _trade(tradeA);

        vm.recordLogs();
        _swap(alice, true, -2e17);
        bytes32 tradeB = _bondedId();
        _swap(arber, false, -2e17);
        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);

        // Heavy history after the window closed.
        uint256 t = block.timestamp;
        for (uint256 i; i < 50; ++i) {
            t += 30;
            vm.warp(t);
            _swap(i % 2 == 0 ? alice : arber, i % 2 == 0, -1e15);
        }
        for (uint256 i; i < 200; ++i) {
            t += 30;
            vm.warp(t);
            hook.poke(key.toId());
        }
        vm.warp(t + 1 days);

        vm.prank(settler);
        hook.settle(tradeB);
        (,,, MarkoutHook.Outcome outcomeB,) = _trade(tradeB);

        assertEq(uint8(outcomeA), uint8(MarkoutHook.Outcome.Refunded), "run A refunded");
        assertEq(uint8(outcomeB), uint8(outcomeA), "delayed settlement changed the verdict");
    }

    // ---------------------------------------------------------------------
    // 4 — Hook callbacks reject every caller except the PoolManager
    // ---------------------------------------------------------------------

    function test_hookCallbacks_rejectNonPoolManager() public {
        IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
            zeroForOne: true, amountSpecified: -1e17, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
        });
        vm.prank(alice);
        vm.expectRevert(BaseHook.NotPoolManager.selector);
        hook.beforeSwap(alice, key, params, new bytes(0));
        vm.prank(alice);
        vm.expectRevert(BaseHook.NotPoolManager.selector);
        hook.afterSwap(alice, key, params, BalanceDelta.wrap(0), new bytes(0));
        vm.prank(alice);
        vm.expectRevert(BaseHook.NotPoolManager.selector);
        hook.afterInitialize(alice, key, SQRT_PRICE_1_1, 0);
        vm.prank(alice);
        vm.expectRevert(BaseHook.NotPoolManager.selector);
        hook.beforeInitialize(alice, key, SQRT_PRICE_1_1);
    }

    // ---------------------------------------------------------------------
    // 5 — Footguns closed
    // ---------------------------------------------------------------------

    /// @dev No deployer/router identity exists to abuse: no initializeRouter
    /// surface, no trusted-router read.
    function test_noRouterLock_surface() public {
        (bool ok,) = address(hook).call(abi.encodeWithSignature("initializeRouter(address)", alice));
        assertFalse(ok, "initializeRouter must not exist");
        (bool ok2,) = address(hook).call(abi.encodeWithSignature("trustedRouter()"));
        assertFalse(ok2, "trustedRouter must not exist");
    }

    /// @dev Gratuitous mints to the hook inflate its balance but not its
    /// liabilities; settles, claims, and flushes stay exact.
    function test_faucetMint_doesNotBreakEscrow() public {
        MockERC20(Currency.unwrap(currency0)).mint(address(hook), 5e18);

        vm.recordLogs();
        _swap(alice, true, -2e17);
        bytes32 tradeId = _bondedId();
        (, uint256 bond,,,) = _trade(tradeId);
        _swap(arber, false, -2e17);
        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);

        uint256 aliceMid = currency0.balanceOf(alice);
        hook.settle(tradeId);
        assertEq(currency0.balanceOf(alice), aliceMid + bond, "refund exact despite gifted balance");
        assertEq(currency0.balanceOf(address(hook)), 5e18, "gift remains, bond released exactly");
    }

    // ---------------------------------------------------------------------
    // Settlement behavior
    // ---------------------------------------------------------------------

    /// @dev Successful organic refund pays at settle; a claim tx exists only
    /// when delivery failed.
    function test_claimExistsOnlyWhenDeliveryFailed() public {
        vm.recordLogs();
        _swap(alice, true, -2e17);
        bytes32 tradeId = _bondedId();
        (, uint256 bond,,,) = _trade(tradeId);
        _swap(arber, false, -2e17);
        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);

        // Deliverable: paid at settle, terminal, no claim needed.
        vm.prank(settler);
        hook.settle(tradeId);
        (,,, MarkoutHook.Outcome outcome,) = _trade(tradeId);
        assertEq(uint8(outcome), uint8(MarkoutHook.Outcome.Refunded), "paid at settle");
        vm.expectRevert(MarkoutHook.NotRefundPending.selector);
        hook.claimRefund(tradeId);

        // Failed delivery: pending verdict + retryable claim.
        vm.recordLogs();
        _swap(alice, true, -2e17);
        bytes32 t2 = _bondedId();
        (, uint256 bond2,,,) = _trade(t2);
        _swap(arber, false, -2e17);
        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);
        MockERC20(Currency.unwrap(currency0)).setBlocked(alice, true);

        vm.prank(settler);
        hook.settle(t2);
        (,,, MarkoutHook.Outcome o2,) = _trade(t2);
        assertEq(uint8(o2), uint8(MarkoutHook.Outcome.RefundPending), "verdict survives failed delivery");
        assertEq(currency0.balanceOf(address(hook)), bond2, "escrow preserved");
        assertEq(hook.escrowLiability(currency0), bond2, "liability preserved");

        MockERC20(Currency.unwrap(currency0)).setBlocked(alice, false);
        uint256 aliceMid = currency0.balanceOf(alice);
        vm.prank(settler);
        assertTrue(hook.claimRefund(t2), "retry delivers");
        assertEq(currency0.balanceOf(alice), aliceMid + bond2, "bond delivered on retry");
        (,,, MarkoutHook.Outcome o3,) = _trade(t2);
        assertEq(uint8(o3), uint8(MarkoutHook.Outcome.Refunded), "terminal after claim");
    }

    /// @dev With liquidity standing, a donate verdict credits in-range LPs
    /// IN THE SETTLEMENT TRANSACTION: the pool's Donate fires inside settle,
    /// the pending bucket stays empty, and escrow + liability clear at once.
    function test_arbSustains_creditsLpsAtSettle() public {
        vm.recordLogs();
        _swap(alice, true, -2e17);
        bytes32 tradeId = _bondedId();
        (, uint256 expectedBond,,,) = _trade(tradeId);

        uint256 alice0 = currency0.balanceOf(alice);
        uint256 pool0 = currency0.balanceOf(address(manager));

        vm.expectEmit(true, true, true, true, address(manager));
        emit IPoolManager.Donate(key.toId(), address(hook), expectedBond, uint256(0));
        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);
        vm.prank(settler);
        hook.settle(tradeId);

        (,,, MarkoutHook.Outcome outcome,) = _trade(tradeId);
        assertEq(uint8(outcome), uint8(MarkoutHook.Outcome.Donated), "expected donate");
        assertEq(currency0.balanceOf(alice), alice0, "toxic trader keeps nothing");
        assertEq(hook.pendingDonation(key.toId(), 0), 0, "nothing deferred while L > 0");
        assertEq(
            currency0.balanceOf(address(manager)), pool0 + expectedBond, "pool received the premium in the settle tx"
        );
        assertEq(currency0.balanceOf(address(hook)), 0, "hook holds no escrow after settle");
        assertEq(hook.escrowLiability(currency0), 0, "liability cleared");
        assertEq(
            hook.premiumBps(key.toId()), hook.PREMIUM_DEFAULT_BPS() + hook.PREMIUM_UP_BPS(), "donate raises the premium"
        );
    }

    function test_zeroLiquidity_donationDeferred() public {
        vm.recordLogs();
        _swap(alice, true, -2e17);
        bytes32 tradeId = _bondedId();
        (, uint256 bond,,,) = _trade(tradeId);
        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);

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

        vm.prank(settler);
        hook.settle(tradeId); // succeeds at zero liquidity
        (,,, MarkoutHook.Outcome outcome,) = _trade(tradeId);
        assertEq(uint8(outcome), uint8(MarkoutHook.Outcome.Donated), "donate recorded");

        uint256 pool0 = currency0.balanceOf(address(manager));
        vm.expectRevert(MarkoutHook.NoActiveLiquidity.selector);
        hook.flushDonation(key.toId());
        assertEq(currency0.balanceOf(address(manager)), pool0, "no value moved at zero liquidity");

        _seedLiquidity(key, 1e18);
        uint256 afterReseed = currency0.balanceOf(address(manager));
        vm.prank(settler);
        hook.flushDonation(key.toId());
        assertEq(currency0.balanceOf(address(manager)), afterReseed + bond, "deferred donation delivered");
    }

    function test_reentrancy_claimBlocked() public {
        ReenterRefundToken evil = new ReenterRefundToken();
        (Currency e0, Currency e1) = address(evil) < Currency.unwrap(currency1)
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

        bool evilIs0 = Currency.unwrap(e0) == address(evil);
        vm.startPrank(address(trader));
        vm.recordLogs();
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
        vm.stopPrank();
        bytes32 tradeId = _bondedId();
        (, uint256 bond,,,) = _trade(tradeId);

        vm.startPrank(arber);
        MockERC20(Currency.unwrap(e1)).approve(address(router), type(uint256).max);
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
        vm.stopPrank();

        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);

        // Force the failed-delivery path so a claim exists to reenter.
        evil.setReject(address(trader), true);
        vm.prank(settler);
        hook.settle(tradeId);
        (,,, MarkoutHook.Outcome outcome,) = _trade(tradeId);
        assertEq(uint8(outcome), uint8(MarkoutHook.Outcome.RefundPending), "delivery failed path");

        evil.arm(address(hook), tradeId, address(trader));
        evil.setReject(address(trader), false);

        uint256 hookBefore = evil.balanceOf(address(hook));
        uint256 traderBefore = evil.balanceOf(address(trader));
        vm.prank(settler);
        bool delivered = hook.claimRefund(tradeId);
        assertTrue(delivered, "legitimate claim must deliver");
        assertEq(evil.reentries(), 1, "reentrancy attempted");
        assertEq(evil.balanceOf(address(trader)), traderBefore + bond, "trader paid exactly once");
        assertEq(evil.balanceOf(address(hook)), hookBefore - bond, "hook paid exactly one bond");

        vm.expectRevert(MarkoutHook.NotRefundPending.selector); // terminal: Refunded
        hook.claimRefund(tradeId);
    }

    // ---------------------------------------------------------------------
    // Oracle hardening
    // ---------------------------------------------------------------------

    function test_spotGames_ignored() public {
        vm.recordLogs();
        _swap(alice, true, -2e17);
        bytes32 tradeId = _bondedId();

        uint256 t = block.timestamp + 12;
        vm.warp(t);
        hook.poke(key.toId());
        _swap(arber, false, -1e13); // micro shove toward pre
        _swap(arber, true, -1e13); // and straight back, same block

        vm.warp(t + hook.SETTLEMENT_DELAY());
        vm.prank(settler);
        hook.settle(tradeId);
        (,,, MarkoutHook.Outcome outcome,) = _trade(tradeId);
        assertEq(uint8(outcome), uint8(MarkoutHook.Outcome.Donated), "intra-block spot game must not flip outcome");
    }

    function test_twap_honorsSustainedReversion() public {
        vm.recordLogs();
        _swap(alice, true, -2e17);
        bytes32 tradeId = _bondedId();

        uint256 t = block.timestamp + 12; // reversion one block in
        vm.warp(t);
        _swap(arber, false, -2e17);
        vm.warp(t + 12); // held to close

        vm.prank(settler);
        hook.settle(tradeId);
        (,,, MarkoutHook.Outcome outcome,) = _trade(tradeId);
        assertEq(uint8(outcome), uint8(MarkoutHook.Outcome.Refunded), "held reversion must refund");
    }

    function test_lastLook_postWindowShove_ignored() public {
        vm.recordLogs();
        _swap(alice, true, -2e17);
        bytes32 tradeId = _bondedId();

        uint256 t = block.timestamp + hook.SETTLEMENT_DELAY() + 2;
        vm.warp(t);
        hook.poke(key.toId());
        _swap(arber, false, -2e17);
        vm.warp(t + 30);
        hook.poke(key.toId());

        vm.prank(settler);
        hook.settle(tradeId);
        (,,, MarkoutHook.Outcome outcome,) = _trade(tradeId);
        assertEq(uint8(outcome), uint8(MarkoutHook.Outcome.Donated), "post-window shove must not flip verdict");
    }

    function test_zeroImpact_refunds() public {
        _seedLiquidity(key, 9999e18);
        vm.recordLogs();
        _swap(alice, false, 1e12); // sub-tick upward move floors to same tick
        bytes32 tradeId = _bondedId();
        {
            (int24 pre, int24 post) = _ticks(tradeId);
            assertEq(pre, post, "setup: expected zero tick impact");
        }

        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);
        vm.prank(settler);
        hook.settle(tradeId);
        (,,, MarkoutHook.Outcome outcome,) = _trade(tradeId);
        assertEq(uint8(outcome), uint8(MarkoutHook.Outcome.Refunded), "zero impact must refund");
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

    function test_routerSlippage_exactIn_reverts() public {
        vm.prank(alice);
        vm.expectRevert(); // TooLittleOut(args) propagates through unlock
        router.swap(
            key,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -1e17, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            type(uint256).max,
            type(uint256).max
        );
    }

    /// @dev Exact-out enforces a maximum input — including the bond the
    /// hook adds to the caller's delta.
    function test_routerSlippage_exactOut_revertsOnMaxInput() public {
        // Measure a fair total input (amountIn + bond) first.
        vm.prank(alice);
        BalanceDelta probe = router.swap(
            key,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: 1e17, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            type(uint256).max,
            type(uint256).max
        );
        uint256 fairIn = uint256(uint128(-probe.amount0()));

        vm.prank(alice);
        vm.expectRevert(); // TooMuchIn(args) propagates through unlock
        router.swap(
            key,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: 1e17, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            fairIn - 2, // two wei below the fair total input
            type(uint256).max
        );
    }

    // ---------------------------------------------------------------------
    // Bond math + guards
    // ---------------------------------------------------------------------

    function test_exactOut_chargesInputBondAndFillsOutput() public {
        uint256 alice1Before = currency1.balanceOf(alice);
        uint256 alice0Before = currency0.balanceOf(alice);
        vm.recordLogs();
        vm.prank(alice);
        BalanceDelta delta = genericRouter.swap(
            key,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: 1e17, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            new bytes(0)
        );
        bytes32 tradeId = _bondedId();

        assertEq(currency1.balanceOf(alice) - alice1Before, 1e17, "exact-out not filled");
        // The returned caller delta includes the bond the hook added, so the
        // realized pool input is the total minus the recorded bond.
        uint256 totalIn = uint256(uint128(-delta.amount0()));
        (, uint256 bond,,,) = _trade(tradeId);
        uint256 amountIn = totalIn - bond;
        assertEq(
            bond,
            (amountIn * hook.premiumBps(key.toId())) / hook.BPS_DENOMINATOR(),
            "premium != quoted bps of realized amountIn"
        );
        assertEq(currency0.balanceOf(address(hook)), bond, "escrow equals bond");
        assertEq(
            alice0Before - currency0.balanceOf(alice),
            amountIn + bond,
            "swapper pays input plus exactly the bond through the generic router"
        );
    }

    /// @dev The quoted premium is exactly what the next swap charges, and
    /// only settle outcomes move it. Poke spam and faucet gifts are inert.
    function test_premiumQuote_matchesCharge_andStepper() public {
        assertEq(hook.premiumBps(key.toId()), 20, "premium starts at the default");

        // A refunded trade decays the premium by the down step.
        vm.recordLogs();
        _swap(alice, true, -2e17);
        bytes32 refundId = _bondedId();
        _swap(arber, false, -2e17);
        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);
        hook.settle(refundId);
        assertEq(hook.premiumBps(key.toId()), 19, "refund lowers the premium");

        // Pokes and gifts cannot move it.
        for (uint256 i; i < 50; ++i) {
            hook.poke(key.toId());
        }
        MockERC20(Currency.unwrap(currency0)).mint(address(hook), 5e18);
        assertEq(hook.premiumBps(key.toId()), 19, "pokes and gifts are inert");

        // Donated trades raise it, same-direction one-shots, until the clamp.
        for (uint256 i; i < 20; ++i) {
            vm.recordLogs();
            _swap(alice, true, -1e17);
            bytes32 toxic = _bondedId();
            vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);
            hook.settle(toxic);
        }
        assertEq(hook.premiumBps(key.toId()), hook.PREMIUM_MAX_BPS(), "burst of donates clamps at the max");

        // Quote == charge, at whatever the current rate is (small size: the
        // burst has pushed price far, keep the fill complete).
        uint256 amt = 1e15;
        uint256 quoted = hook.premiumQuoteFor(key.toId(), amt);
        assertTrue(quoted > 0, "clamp floor keeps quotes nonzero");
        vm.recordLogs();
        _swap(alice, true, -int256(amt));
        bytes32 charged = _bondedId();
        (, uint256 bond,,,) = _trade(charged);
        assertEq(bond, quoted, "quoted premium is exactly what the swap charged");
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

    function test_noReceiptTokenSurface() public {
        (bool ok,) = address(hook).call(abi.encodeWithSignature("totalSupply()"));
        assertFalse(ok, "no ERC-6909 surface may exist");
    }

    function test_previewTrade_projectsAndFinalizes() public {
        vm.recordLogs();
        _swap(alice, true, -2e17);
        bytes32 tradeId = _bondedId();

        (int24 pre, int24 post,, int256 revBps, uint8 expected, uint8 outcome,) = hook.previewTrade(tradeId);
        assertEq(uint256(outcome), 0, "still open");
        assertEq(pre, 0, "pre tick");
        assertTrue(post != pre, "swap must move the tick");
        assertEq(expected, 3, "sustained so far => donate projection");
        assertApproxEqAbs(revBps, 0, 500, "~0% reverted while sustained");

        _swap(arber, false, -2e17);
        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);
        hook.settle(tradeId);
        (,,,,, uint8 settledOutcome,) = hook.previewTrade(tradeId);
        assertEq(settledOutcome, uint8(MarkoutHook.Outcome.Refunded), "finalized refunded");
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

        // --- Refund path, bond in native ---
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

        uint256 t = block.timestamp + 12;
        vm.warp(t);
        vm.prank(arber);
        router.swap(
            k,
            IPoolManager.SwapParams({
                zeroForOne: false, amountSpecified: -2e17, sqrtPriceLimitX96: TickMath.MAX_SQRT_PRICE - 1
            }),
            0,
            type(uint256).max
        );
        vm.warp(t + 12);

        uint256 aliceEthBefore = alice.balance;
        vm.prank(settler);
        hook.settle(tradeId);
        (,,, MarkoutHook.Outcome outcome,) = _trade(tradeId);
        assertEq(uint8(outcome), uint8(MarkoutHook.Outcome.Refunded), "native refund verdict");
        assertEq(alice.balance, aliceEthBefore + bond, "native bond PAID AT SETTLE");
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
        uint256 pmEthBefore = address(manager).balance;
        hook.settle(donateId);

        // L > 0: the native donation credits in-range LPs IN the settle tx.
        assertEq(address(manager).balance, pmEthBefore + donateBond, "pool received the native premium at settle");
        assertEq(address(hook).balance, 0, "hook escrow released");
        assertEq(hook.escrowLiability(CurrencyLibrary.ADDRESS_ZERO), 0, "native liability cleared");
        assertEq(hook.pendingDonation(k.toId(), 0), 0, "nothing deferred while L > 0");
    }

    // ---------------------------------------------------------------------
    // hookData beneficiary rules — no silent assignment, no burned refunds
    // ---------------------------------------------------------------------

    /// @dev Exactly one shape declares a beneficiary: 32 bytes holding a
    /// nonzero address. Everything else — empty payload (generic routers),
    /// arbitrary-length payloads other routers might forward, and a 32-byte
    /// zero word — falls back to the direct swap caller. No revert mid-swap,
    /// and no refund can ever be sent to address(0).
    function test_hookData_beneficiaryRules() public {
        // empty => the direct caller
        vm.recordLogs();
        vm.prank(alice);
        genericRouter.swap(
            key,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -1e16, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            new bytes(0)
        );
        (address t1,,,,) = _trade(_bondedId());
        assertEq(t1, address(genericRouter), "empty hookData => direct caller");

        // junk length => direct caller, no revert
        vm.recordLogs();
        vm.prank(alice);
        genericRouter.swap(
            key,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -1e16, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            hex"deadbeef"
        );
        (address t2,,,,) = _trade(_bondedId());
        assertEq(t2, address(genericRouter), "non-32-byte hookData => direct caller, no revert");

        // 32-byte zero => treated as undeclared, NOT address(0)
        vm.recordLogs();
        vm.prank(alice);
        genericRouter.swap(
            key,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -1e16, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            abi.encode(address(0))
        );
        (address t3,,,,) = _trade(_bondedId());
        assertEq(t3, address(genericRouter), "zero declaration => direct caller, refund can never burn");

        // a real declaration is honored
        vm.recordLogs();
        vm.prank(alice);
        genericRouter.swap(
            key,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -1e16, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            abi.encode(arber)
        );
        (address t4,,,,) = _trade(_bondedId());
        assertEq(t4, arber, "32-byte nonzero declaration honored");
    }

    // ---------------------------------------------------------------------
    // Two swaps by one router inside a single unlock — transient pre-tick
    // passing must not clobber between the pairs
    // ---------------------------------------------------------------------

    /// @dev The pre-tick is carried from beforeSwap to afterSwap in a
    /// transient slot keyed by (poolId, sender). A router that batches two
    /// swaps into one unlock reuses the same slot back-to-back: the second
    /// pair must still see the tick as of ITS OWN beforeSwap — the first
    /// swap's post — and both trades must settle independently.
    function test_batchedSwaps_sameUnlock_preTicksNotClobbered() public {
        BatchRouter batch = new BatchRouter(address(manager));
        MockERC20(Currency.unwrap(currency0)).mint(address(batch), 100e18);
        MockERC20(Currency.unwrap(currency1)).mint(address(batch), 100e18);

        vm.recordLogs();
        batch.swapTwice(
            key,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -2e17, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            IPoolManager.SwapParams({
                zeroForOne: false, amountSpecified: -4e17, sqrtPriceLimitX96: TickMath.MAX_SQRT_PRICE - 1
            }),
            alice
        );

        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32[] memory ids = new bytes32[](2);
        uint256 n;
        for (uint256 i; i < entries.length; ++i) {
            if (entries[i].topics[0] == SWAP_BONDED_TOPIC && entries[i].emitter == address(hook)) {
                ids[n++] = entries[i].topics[1];
            }
        }
        assertEq(n, 2, "two trades bonded in one unlock");

        (int24 pre1, int24 post1) = _ticks(ids[0]);
        (int24 pre2, int24 post2) = _ticks(ids[1]);
        assertEq(pre1, 0, "first swap starts at the seed tick");
        assertEq(pre2, post1, "second swap's pre MUST be the first swap's post: no tstore clobber");
        assertLt(post1, 0, "zero-for-one buy moves the tick down (currency0 cheaper)");
        assertGt(post2, 0, "the larger sell overshoots past the seed tick");

        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);
        hook.settle(ids[0]);
        hook.settle(ids[1]);
        (,,, MarkoutHook.Outcome o1,) = _trade(ids[0]);
        (,,, MarkoutHook.Outcome o2,) = _trade(ids[1]);
        assertEq(uint8(o1), uint8(MarkoutHook.Outcome.Refunded), "buy leg overshoot-reverted by the sell leg => refund");
        assertEq(uint8(o2), uint8(MarkoutHook.Outcome.Donated), "sell leg's own impact sustained => donate");
    }

    // ---------------------------------------------------------------------
    // The atomic-sandwich hole, named on-chain — honest limit
    // ---------------------------------------------------------------------

    /// @dev KNOWN, DOCUMENTED LIMIT. All three legs land in one block, so
    /// they share one timestamp: the accumulator attributes no elapsed time
    /// to any intra-block tick, and the window average therefore reads the
    /// post-backrun tick — back at pre — for the whole 24 s. The front leg
    /// refunds. A same-block rule that would separate it from the 1:1
    /// NEXT-block organic refund does not exist in tick space (the two are
    /// indistinguishable by window average alone), so this hook ships the
    /// honest limit instead of a broken classifier: the backrun leg is what
    /// donates, and the front leg's refund is bounded by its own bond.
    /// Surface copy must keep saying this (docs, README, landing).
    function test_atomicSandwich_sameBlock_frontLegRefunds_honestLimit() public {
        vm.recordLogs();
        _swap(arber, true, -3e17); // front run: buy
        bytes32 front = _bondedId();
        _swap(alice, true, -1e17); // victim: buys the moved price
        bytes32 victim = _bondedId();
        _swap(arber, false, -4e17); // backrun: sell front+victim, price returns to pre
        bytes32 backrun = _bondedId();

        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);
        hook.settle(front);
        hook.settle(victim);
        hook.settle(backrun);

        (,,, MarkoutHook.Outcome oFront,) = _trade(front);
        (,,, MarkoutHook.Outcome oVictim,) = _trade(victim);
        (,,, MarkoutHook.Outcome oBack,) = _trade(backrun);
        assertEq(uint8(oFront), uint8(MarkoutHook.Outcome.Refunded), "HONEST LIMIT: atomic front leg refunds");
        assertEq(uint8(oVictim), uint8(MarkoutHook.Outcome.Refunded), "victim refunds too: same-block reversion");
        assertEq(uint8(oBack), uint8(MarkoutHook.Outcome.Donated), "the backrun leg is what donates");
    }

    // ---------------------------------------------------------------------
    // LP PnL: what a sustained toxic move actually pays in-range LPs,
    // measured against a vanilla pool at the same 3 bps fee
    // ---------------------------------------------------------------------

    /// @dev Identical liquidity (this contract is the LP), identical toxic
    /// swap, one pool with the hook and one vanilla pool at the same 3 bps.
    /// After the verdict is donated and flushed, both LP positions are
    /// withdrawn and compared. The hook LP must end up ahead by
    /// approximately the forfeited bond — the dividend is 20 bps of the
    /// toxic input, no more. Note the bond rides the specified delta, so
    /// the pool itself executes on input minus bond; the dividend reaches
    /// LPs only through the flush, across both tokens. The site may not
    /// claim solvency beyond that number.
    function test_lpDividend_beatsVanillaSameFee() public {
        // Vanilla control pool: same pair, same fee, no hook.
        PoolKey memory vanilla = PoolKey({
            currency0: currency0, currency1: currency1, fee: FEE, tickSpacing: TICK_SPACING, hooks: IHooks(address(0))
        });
        manager.initialize(vanilla, SQRT_PRICE_1_1);
        _seedLiquidity(vanilla, 1e18);

        // Vanilla: one toxic 2e16 swap (kept small relative to liquidity so
        // both pools exit within a couple of ticks and the 1:1 token sum
        // below is a faithful valuation).
        vm.prank(alice);
        genericRouter.swap(
            vanilla,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -2e16, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            new bytes(0)
        );

        // Hook pool: the same toxic swap, window closes, premium donated —
        // and credited to LPs inside the settle tx (L > 0), so no flush.
        vm.recordLogs();
        _swap(alice, true, -2e16);
        bytes32 tradeId = _bondedId();
        (, uint256 bond,,,) = _trade(tradeId);
        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);
        hook.settle(tradeId);

        // Withdraw both LP positions; this contract holds both.
        IPoolManager.ModifyLiquidityParams memory exit = IPoolManager.ModifyLiquidityParams({
            tickLower: TickMath.minUsableTick(TICK_SPACING),
            tickUpper: TickMath.maxUsableTick(TICK_SPACING),
            liquidityDelta: -1e18,
            salt: bytes32(0)
        });
        uint256 vb0 = currency0.balanceOf(address(this));
        uint256 vb1 = currency1.balanceOf(address(this));
        lpRouter.modifyLiquidity(vanilla, exit, new bytes(0));
        uint256 vGain0 = currency0.balanceOf(address(this)) - vb0;
        uint256 vGain1 = currency1.balanceOf(address(this)) - vb1;

        uint256 hb0 = currency0.balanceOf(address(this));
        uint256 hb1 = currency1.balanceOf(address(this));
        lpRouter.modifyLiquidity(key, exit, new bytes(0));
        uint256 hGain0 = currency0.balanceOf(address(this)) - hb0;
        uint256 hGain1 = currency1.balanceOf(address(this)) - hb1;

        // Both pools sit within a few ticks of each other at exit, so the
        // two-token sums are directly comparable at this precision.
        int256 net0 = int256(hGain0) - int256(vGain0);
        int256 net1 = int256(hGain1) - int256(vGain1);
        int256 dividend = net0 + net1;
        assertGt(dividend, 0, "hook LP must end ahead of the vanilla LP");
        assertApproxEqAbs(dividend, int256(bond), 5e12, "the dividend is ~the 20 bps bond: no magic extra");
    }

    // ---------------------------------------------------------------------
    // Batch lane — 24 s epochs on the oracle's own clock, uniform clears
    // ---------------------------------------------------------------------

    /// @dev Approve the hook for batch custody pulls and enqueue an order.
    function _place(address who, bool zeroForOne, uint256 amount) internal returns (uint256 index) {
        vm.startPrank(who);
        Currency c = zeroForOne ? currency0 : currency1;
        MockERC20(Currency.unwrap(c)).approve(address(hook), type(uint256).max);
        index = hook.placeBatchOrder(key, zeroForOne, amount);
        vm.stopPrank();
    }

    /// @dev Equal opposing orders in a quiescent epoch net EXACTLY: no AMM
    /// swap (slot0 and pool balances unchanged), both sides fill at the
    /// 1:1 TWAP, zero dust.
    function test_batch_exactNet_noAmmSwap() public {
        uint256 alice0 = currency0.balanceOf(alice);
        uint256 alice1 = currency1.balanceOf(alice);
        uint256 arber0 = currency0.balanceOf(arber);
        uint256 arber1 = currency1.balanceOf(arber);
        (, int24 tickBefore,,) = StateLibrary.getSlot0(manager, key.toId());
        uint256 pm0 = currency0.balanceOf(address(manager));
        uint256 pm1 = currency1.balanceOf(address(manager));

        _place(alice, true, 1e18); // buy: in 1e18 c0
        _place(arber, false, 1e18); // sell: in 1e18 c1

        uint256 epoch = hook.epochOf(block.timestamp);
        vm.warp((epoch + 1) * hook.SETTLEMENT_DELAY() + 1);
        vm.prank(settler);
        hook.clearBatch(key, epoch);

        (, int24 tickAfter,,) = StateLibrary.getSlot0(manager, key.toId());
        assertEq(tickAfter, tickBefore, "exact net must not touch the AMM");
        assertEq(currency0.balanceOf(address(manager)), pm0, "pool c0 unchanged");
        assertEq(currency1.balanceOf(address(manager)), pm1, "pool c1 unchanged");
        assertEq(currency1.balanceOf(alice) - alice1, 1e18, "buyer filled at the 1:1 TWAP");
        assertEq(currency0.balanceOf(arber) - arber0, 1e18, "seller filled at the 1:1 TWAP");
        assertEq(currency0.balanceOf(alice), alice0 - 1e18, "buyer deposit fully consumed");
        assertEq(currency1.balanceOf(arber), arber1 - 1e18, "seller deposit fully consumed");
        assertEq(hook.batchEscrow(currency0), 0, "no c0 batch liability left");
        assertEq(hook.batchEscrow(currency1), 0, "no c1 batch liability left");
    }

    /// @dev Partial netting leaves ONE residual swap through the normal
    /// bonded lane (the hook is the caller and pays the quoted premium like
    /// anyone else), and every order on a side fills at the SAME rate.
    function test_batch_partialNet_residualSwapAndUniformFills() public {
        _place(alice, true, 2e18);
        _place(arber, true, 1e18); // same side — no netting against a seller
        _place(address(this), false, 5e17); // sell side, funded below

        uint256 epoch = hook.epochOf(block.timestamp);
        vm.warp((epoch + 1) * hook.SETTLEMENT_DELAY() + 1);
        vm.recordLogs();
        vm.prank(settler);
        hook.clearBatch(key, epoch);

        // The residual was a bonded spot swap with the hook as trader.
        assertGt(hook.escrowLiability(currency0), 0, "afterSwap escrowed the residual premium");
        bytes32 residualTrade;
        Vm.Log[] memory entries = vm.getRecordedLogs();
        for (uint256 i; i < entries.length; ++i) {
            if (entries[i].topics[0] == SWAP_BONDED_TOPIC) {
                residualTrade = entries[i].topics[1];
            }
        }
        assertTrue(residualTrade != bytes32(0), "residual swap must be bonded");
        (address residualTrader, uint256 residualBond,,) = _ticksAndBond(residualTrade);
        assertEq(residualTrader, address(hook), "hook is the residual swap caller");
        assertGt(residualBond, 0, "residual pays the premium");

        // Uniform per-side rates: both buyers got the same out1 per in0.
        uint256 outAlice = currency1.balanceOf(alice) - 1000e18;
        uint256 outArber = currency1.balanceOf(arber) - 1000e18;
        uint256 rateA = outAlice * 1e18 / 2e18;
        uint256 rateB = outArber * 1e18 / 1e18;
        assertApproxEqAbs(int256(rateA), int256(rateB), 2, "both buyers cleared at the SAME rate");

        // Netting credit: the sell side was paid from buyer deposits at the
        // same clearing, dust bounded.
        assertTrue(currency0.balanceOf(address(this)) > 5e16, "seller paid out");
    }

    function _ticksAndBond(bytes32 tradeId)
        internal
        view
        returns (address trader, uint256 bond, int24 pre, int24 post)
    {
        (, address t,, uint256 b, int24 p, int24 q,,,,,) = hook.trades(tradeId);
        return (t, b, p, q);
    }

    /// @dev A lone order in an empty epoch is a one-epoch TWAP fill, clamped
    /// by the realized residual execution — the hook never subsidizes.
    function test_batch_loneOrder_isOneEpochTwapBoundedByExecution() public {
        _place(alice, true, 1e18);
        uint256 epoch = hook.epochOf(block.timestamp);
        vm.warp((epoch + 1) * hook.SETTLEMENT_DELAY() + 1);

        // Baseline: what one direct 1e18 swap would return right now.
        uint256 spotOut = _quoteDirectSwapOut(true, 1e18);
        uint256 out1 = currency1.balanceOf(alice);
        vm.prank(settler);
        hook.clearBatch(key, epoch);
        uint256 filled = currency1.balanceOf(alice) - out1;

        // Uniform price exists, fill is bounded between the spot execution
        // and the TWAP — never a subsidized rate above either.
        assertGt(filled, 0, "lone order fills");
        assertLe(filled, spotOut, "hook never pays above spot execution");
    }

    /// @dev Cancelled orders cannot move anyone else's clearing price: the
    /// epoch TWAP is time-weighted, not book-ordered. This is NOT a sandwich
    /// test — the attacker cancels before clear. Residual AMM sandwiches are
    /// named in test_batch_residualSpotSwap_inheritsSandwichHonestLimit.
    function test_batch_cancelledOrders_doNotMoveClearingPrice() public {
        // Baseline epoch: a matched pair nets exactly at the 1:1 TWAP.
        uint256 alice1Before = currency1.balanceOf(alice);
        uint256 arber0Before = currency0.balanceOf(arber);
        uint256 counter0Before = currency0.balanceOf(address(this));
        _place(alice, true, 1e18);
        _place(arber, false, 1e18);
        uint256 epoch = hook.epochOf(block.timestamp);
        vm.warp((epoch + 1) * hook.SETTLEMENT_DELAY() + 1);
        vm.prank(settler);
        hook.clearBatch(key, epoch);
        assertEq(currency1.balanceOf(alice) - alice1Before, 1e18, "baseline exact net");
        assertEq(currency0.balanceOf(arber) - arber0Before, 1e18, "baseline seller net");

        // Attack epoch: the same pair, bracketed by a huge front order and a
        // huge late opposing order that are both cancelled before the clear.
        vm.warp((epoch + 2) * hook.SETTLEMENT_DELAY() + 1);
        uint256 attackEpoch = hook.epochOf(block.timestamp);
        uint256 atkIdx = _place(arber, true, 50e18); // huge front order
        _place(alice, true, 1e18); // the victim
        uint256 backIdx = _place(arber, false, 50e18); // huge back order
        _place(address(this), false, 1e18); // the matched counter-side
        vm.startPrank(arber);
        hook.cancelBatchOrder(key.toId(), attackEpoch, atkIdx);
        hook.cancelBatchOrder(key.toId(), attackEpoch, backIdx);
        vm.stopPrank();
        vm.warp((attackEpoch + 1) * hook.SETTLEMENT_DELAY() + 1);
        vm.prank(settler);
        hook.clearBatch(key, attackEpoch);

        uint256 alice1AfterBaseline = currency1.balanceOf(alice) - 1e18; // baseline fill already counted
        assertEq(currency1.balanceOf(alice) - alice1Before, 2e18, "victim filled twice at the same immutable rate");
        assertGt(currency0.balanceOf(address(this)), 0, "counter-side cleared");
        assertApproxEqAbs(
            int256(currency0.balanceOf(address(this)) - counter0Before),
            1e18,
            1e12,
            "counter-side clearing unchanged by attacker positioning"
        );
    }

    /// @dev HONEST LIMIT. Unmatched batch size executes as one bonded spot
    /// swap through MarkoutBatchRouter with TickMath min/max ± 1 (unbounded
    /// price limit). A same-direction spot swap immediately before clear
    /// worsens the residual fill, exactly as a spot sandwich would. Exact
    /// two-sided nets never take this path. Do not document cancelled-order
    /// irrelevance as "the batch lane cannot be sandwiched."
    function test_batch_residualSpotSwap_inheritsSandwichHonestLimit() public {
        uint256 alice1Before = currency1.balanceOf(alice);
        _place(alice, true, 1e18);
        uint256 epoch = hook.epochOf(block.timestamp);
        vm.warp((epoch + 1) * hook.SETTLEMENT_DELAY() + 1);

        uint256 snap = vm.snapshotState();
        vm.prank(settler);
        hook.clearBatch(key, epoch);
        uint256 unsandwiched = currency1.balanceOf(alice) - alice1Before;
        assertGt(unsandwiched, 0, "baseline residual fills");

        bool restored = vm.revertToState(snap);
        assertTrue(restored, "snapshot restore");

        _swap(arber, true, -3e17); // same direction as residual (sell currency0)
        vm.prank(settler);
        hook.clearBatch(key, epoch);
        uint256 sandwiched = currency1.balanceOf(alice) - alice1Before;
        assertLt(sandwiched, unsandwiched, "HONEST LIMIT: residual fill is worse after a same-direction spot sandwich");
    }

    /// @dev Custody is explicit and cancellable before the clear; after the
    /// clear, cancellation and double-clearing are refused.
    function test_batch_cancelAndGuards() public {
        uint256 alice0 = currency0.balanceOf(alice);
        uint256 idx = _place(alice, true, 1e18);
        assertEq(currency0.balanceOf(alice), alice0 - 1e18, "custody taken");

        uint256 epochNow = hook.epochOf(block.timestamp);
        vm.expectRevert(MarkoutHook.NotOrderOwner.selector);
        vm.prank(arber);
        hook.cancelBatchOrder(key.toId(), epochNow, idx);

        vm.prank(alice);
        hook.cancelBatchOrder(key.toId(), epochNow, idx);
        assertEq(currency0.balanceOf(alice), alice0, "cancel returns the deposit");

        uint256 epoch = hook.epochOf(block.timestamp);
        vm.expectRevert(
            abi.encodeWithSelector(
                MarkoutHook.EpochNotElapsed.selector, (epoch + 1) * hook.SETTLEMENT_DELAY(), block.timestamp
            )
        );
        hook.clearBatch(key, epoch);

        _place(alice, true, 1e17);
        vm.warp((epoch + 1) * hook.SETTLEMENT_DELAY() + 1);
        hook.clearBatch(key, epoch);
        vm.expectRevert(MarkoutHook.EpochAlreadyCleared.selector);
        hook.clearBatch(key, epoch);
        vm.prank(alice);
        vm.expectRevert(MarkoutHook.EpochAlreadyCleared.selector);
        hook.cancelBatchOrder(key.toId(), epoch, 0);
    }

    /// @dev Clearing is permissionless and LATE clearing is identical: the
    /// accumulator's append-only history makes the epoch TWAP immutable.
    function test_batch_lateClear_samePrice() public {
        _place(alice, true, 1e18);
        _place(arber, false, 1e18);
        uint256 epoch = hook.epochOf(block.timestamp);
        vm.warp((epoch + 1) * hook.SETTLEMENT_DELAY() + 1);

        // Heavy churn between epoch end and the clear.
        for (uint256 i; i < 20; ++i) {
            vm.warp(block.timestamp + 30);
            _swap(i % 2 == 0 ? alice : arber, i % 2 == 0, -5e16);
        }
        vm.warp(block.timestamp + 1 days);

        uint256 alice1 = currency1.balanceOf(alice);
        uint256 arber0 = currency0.balanceOf(arber);
        vm.prank(settler);
        hook.clearBatch(key, epoch);

        // Quiescent-epoch TWAP was 1:1 at seed; churn happened AFTER the
        // window, so the fills must still be the exact 1:1 net.
        assertEq(currency1.balanceOf(alice) - alice1, 1e18, "late clear: buyer filled at the immutable TWAP");
        assertEq(currency0.balanceOf(arber) - arber0, 1e18, "late clear: seller filled at the immutable TWAP");
    }

    /// @dev Direct-swap output probe (pool math only, no premium) for the
    /// lone-order bound check.
    function _quoteDirectSwapOut(bool zeroForOne, uint256 amountIn) internal returns (uint256) {
        address who = arber;
        Currency inC = zeroForOne ? currency0 : currency1;
        Currency outC = zeroForOne ? currency1 : currency0;
        uint256 before = MockERC20(Currency.unwrap(outC)).balanceOf(who);
        vm.startPrank(who);
        genericRouter.swap(
            key,
            IPoolManager.SwapParams({
                zeroForOne: zeroForOne,
                amountSpecified: -int256(amountIn),
                sqrtPriceLimitX96: zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            new bytes(0)
        );
        vm.stopPrank();
        return MockERC20(Currency.unwrap(outC)).balanceOf(who) - before;
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

/// @dev Attacker-authored router: a generic v4 unlock router with no
/// Markout-specific settlement. Proves the bond is payable without any
/// allowlist — it charges the initiator's own delta like every v4 router.
contract FakeRouter {
    using TransientStateLibrary for IPoolManager;

    IPoolManager public manager;

    constructor(address m) {
        manager = IPoolManager(m);
    }

    function swap(PoolKey memory key, IPoolManager.SwapParams memory params, address beneficiary) external {
        manager.unlock(abi.encode(key, params, beneficiary, msg.sender));
    }

    function unlockCallback(bytes calldata rawData) external returns (bytes memory) {
        require(msg.sender == address(manager), "not PM");
        (PoolKey memory key, IPoolManager.SwapParams memory params, address beneficiary, address payer) =
            abi.decode(rawData, (PoolKey, IPoolManager.SwapParams, address, address));
        manager.swap(key, params, abi.encode(beneficiary));
        int256 d0 = manager.currencyDelta(address(this), key.currency0);
        int256 d1 = manager.currencyDelta(address(this), key.currency1);
        if (d0 < 0) {
            manager.sync(key.currency0);
            MockERC20(Currency.unwrap(key.currency0)).transferFrom(payer, address(manager), uint256(-d0));
            manager.settle();
        } else if (d0 > 0) {
            manager.take(key.currency0, payer, uint256(d0));
        }
        if (d1 < 0) {
            manager.sync(key.currency1);
            MockERC20(Currency.unwrap(key.currency1)).transferFrom(payer, address(manager), uint256(-d1));
            manager.settle();
        } else if (d1 > 0) {
            manager.take(key.currency1, payer, uint256(d1));
        }
        return "";
    }
}

/// @dev A router that batches two swaps into ONE unlock — the transient
/// pre-tick slot (keyed by poolId+sender) is written and consumed twice
/// back-to-back inside the same transaction. Proves the per-pair keying
/// survives batched flow; settles its combined delta like any v4 router.
contract BatchRouter {
    using TransientStateLibrary for IPoolManager;

    IPoolManager public manager;

    constructor(address m) {
        manager = IPoolManager(m);
    }

    function swapTwice(
        PoolKey memory key,
        IPoolManager.SwapParams memory p1,
        IPoolManager.SwapParams memory p2,
        address beneficiary
    ) external {
        manager.unlock(abi.encode(key, p1, p2, beneficiary));
    }

    function unlockCallback(bytes calldata rawData) external returns (bytes memory) {
        require(msg.sender == address(manager), "not PM");
        (
            PoolKey memory key,
            IPoolManager.SwapParams memory p1,
            IPoolManager.SwapParams memory p2,
            address beneficiary
        ) = abi.decode(rawData, (PoolKey, IPoolManager.SwapParams, IPoolManager.SwapParams, address));
        manager.swap(key, p1, abi.encode(beneficiary));
        manager.swap(key, p2, abi.encode(beneficiary));
        int256 d0 = manager.currencyDelta(address(this), key.currency0);
        int256 d1 = manager.currencyDelta(address(this), key.currency1);
        if (d0 < 0) {
            manager.sync(key.currency0);
            MockERC20(Currency.unwrap(key.currency0)).transfer(address(manager), uint256(-d0));
            manager.settle();
        } else if (d0 > 0) {
            manager.take(key.currency0, beneficiary, uint256(d0));
        }
        if (d1 < 0) {
            manager.sync(key.currency1);
            MockERC20(Currency.unwrap(key.currency1)).transfer(address(manager), uint256(-d1));
            manager.settle();
        } else if (d1 > 0) {
            manager.take(key.currency1, beneficiary, uint256(d1));
        }
        return "";
    }
}
