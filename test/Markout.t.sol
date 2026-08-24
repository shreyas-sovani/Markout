// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";

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
import {HookMiner} from "@uniswap/v4-periphery/test/shared/HookMiner.sol";

import {MarkoutHook} from "../src/MarkoutHook.sol";
import {MarkoutRouter} from "../src/MarkoutRouter.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract MarkoutTest is Test {
    using CurrencyLibrary for Currency;
    using PoolIdLibrary for PoolKey;
    using StateLibrary for IPoolManager;

    uint160 internal constant SQRT_PRICE_1_1 = 79228162514264337593543950336;
    uint24 internal constant FEE = 300; // 3 bps
    int24 internal constant TICK_SPACING = 60;

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
        (currency0, currency1) = address(tokenA) < address(tokenB)
            ? (Currency.wrap(address(tokenA)), Currency.wrap(address(tokenB)))
            : (Currency.wrap(address(tokenB)), Currency.wrap(address(tokenA)));

        manager = new PoolManager(address(this));
        lpRouter = new PoolModifyLiquidityTest(IPoolManager(address(manager)));

        (address hookAddress, bytes32 salt) = HookMiner.find(
            address(this),
            uint160(Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG),
            type(MarkoutHook).creationCode,
            abi.encode(address(manager))
        );
        hook = new MarkoutHook{salt: salt}(IPoolManager(address(manager)));
        assertEq(address(hook), hookAddress, "hook address mining failed");

        router = new MarkoutRouter(IPoolManager(address(manager)), address(hook));

        key = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: FEE,
            tickSpacing: TICK_SPACING,
            hooks: IHooks(address(hook))
        });
        manager.initialize(key, SQRT_PRICE_1_1);

        MockERC20(Currency.unwrap(currency0)).mint(address(this), 1000e18);
        MockERC20(Currency.unwrap(currency1)).mint(address(this), 1000e18);
        MockERC20(Currency.unwrap(currency0)).approve(address(lpRouter), type(uint256).max);
        MockERC20(Currency.unwrap(currency1)).approve(address(lpRouter), type(uint256).max);
        lpRouter.modifyLiquidity(
            key,
            IPoolManager.ModifyLiquidityParams({
                tickLower: TickMath.minUsableTick(TICK_SPACING),
                tickUpper: TickMath.maxUsableTick(TICK_SPACING),
                liquidityDelta: 1e18,
                salt: bytes32(0)
            }),
            new bytes(0)
        );

        _fund(alice);
        _fund(arber);
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
            new bytes(0)
        );
    }

    function _outcome(bytes32 tradeId) internal view returns (MarkoutHook.Outcome) {
        (,,,,,,,,, MarkoutHook.Outcome outcome) = hook.trades(tradeId);
        return outcome;
    }

    // -------------------------------------------------------------------------
    // organicQuiet_refundsBond: uninformed swap + arbitrageur reversion => Refund
    // -------------------------------------------------------------------------

    function test_organicQuiet_refundsBond() public {
        uint256 alice0Before = currency0.balanceOf(alice);

        BalanceDelta delta = _swap(alice, true, -2e17); // organic: pushes price up ~2%
        uint256 amountIn = uint256(uint128(-delta.amount0()));
        uint256 expectedBond = (amountIn * hook.BOND_BPS()) / hook.BPS_DENOMINATOR();
        assertGt(expectedBond, 0, "bond must be nonzero");
        assertEq(currency0.balanceOf(address(hook)), expectedBond, "bond not escrowed");
        assertEq(hook.balanceOf(alice, uint256(hook.lastTradeId())), expectedBond, "6909 receipt mismatch");

        bytes32 tradeId = hook.lastTradeId();

        // Arbitrageur reverts the price behind the organic trader (same block).
        _swap(arber, false, -2e17);

        // Window elapses with the reverted price in force.
        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);

        uint256 aliceMid = currency0.balanceOf(alice);
        vm.prank(settler); // permissionless: any third party settles
        hook.settle(tradeId);

        assertEq(uint8(_outcome(tradeId)), uint8(MarkoutHook.Outcome.Refund), "expected refund");
        assertEq(currency0.balanceOf(alice), aliceMid + expectedBond, "bond not refunded");
        assertEq(currency0.balanceOf(address(hook)), 0, "hook must release currency0 escrow");
        assertEq(alice0Before - currency0.balanceOf(alice), amountIn, "net cost must be only amountIn");
    }

    // -------------------------------------------------------------------------
    // arbSustains_donates: single-shot arb, no reversion => Donate
    // -------------------------------------------------------------------------

    function test_arbSustains_donates() public {
        BalanceDelta delta = _swap(alice, true, -2e17);
        uint256 amountIn = uint256(uint128(-delta.amount0()));
        uint256 expectedBond = (amountIn * hook.BOND_BPS()) / hook.BPS_DENOMINATOR();

        bytes32 tradeId = hook.lastTradeId();
        uint256 alice0 = currency0.balanceOf(alice);
        uint256 pool0 = currency0.balanceOf(address(manager));

        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);

        vm.expectEmit(true, true, true, true, address(manager));
        emit IPoolManager.Donate(key.toId(), address(hook), expectedBond, uint256(0));
        vm.prank(settler);
        hook.settle(tradeId);

        assertEq(uint8(_outcome(tradeId)), uint8(MarkoutHook.Outcome.Donate), "expected donate");
        assertEq(currency0.balanceOf(alice), alice0, "toxic trader keeps nothing");
        assertEq(currency0.balanceOf(address(manager)), pool0 + expectedBond, "pool must receive the bond");
        assertEq(currency0.balanceOf(address(hook)), 0, "hook holds no escrow after donate");
    }

    // -------------------------------------------------------------------------
    // settleWindowOpen_reverts: nobody, not even the trader, settles early
    // -------------------------------------------------------------------------

    function test_settleWindowOpen_reverts() public {
        _swap(alice, true, -2e17);
        bytes32 tradeId = hook.lastTradeId();

        vm.prank(settler);
        vm.expectRevert(
            abi.encodeWithSelector(
                MarkoutHook.SettlementWindowOpen.selector, uint256(trades_settleAfter(tradeId)), block.timestamp
            )
        );
        hook.settle(tradeId);
    }

    // -------------------------------------------------------------------------
    // settle_replay_reverts: idempotent settlement
    // -------------------------------------------------------------------------

    function test_settle_replay_reverts() public {
        _swap(alice, true, -2e17);
        bytes32 tradeId = hook.lastTradeId();
        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);
        hook.settle(tradeId);
        vm.expectRevert(MarkoutHook.AlreadySettled.selector);
        hook.settle(tradeId);
    }

    // -------------------------------------------------------------------------
    // spotGames_ignored: intra-block price games between pokes are invisible
    // to the time-weighted oracle. A toxic trade stays toxic even if an
    // attacker spikes the spot price and restores it within one block.
    // -------------------------------------------------------------------------

    function test_spotGames_ignored() public {
        // Toxic trade: pushes price down and sustains.
        _swap(alice, true, -2e17);
        bytes32 tradeId = hook.lastTradeId();

        // Mid-window: the accumulator is poked (keeper cadence), then the
        // attacker plays a micro spot-game — a tiny shove and restore inside
        // one block. Both swaps poke at the same timestamp, so no time is
        // ever accumulated at the shoved price, and the round-trip residual
        // is far below the 5 bps threshold.
        vm.warp(block.timestamp + 10);
        hook.poke(key.toId());
        _swap(arber, false, -1e13); // micro shove toward pre
        _swap(arber, true, -1e13); // and straight back

        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY());
        vm.prank(settler);
        hook.settle(tradeId);

        assertEq(
            uint8(_outcome(tradeId)), uint8(MarkoutHook.Outcome.Donate), "intra-block spot game must not flip outcome"
        );
    }

    // -------------------------------------------------------------------------
    // twap_honorsSustainedReversion: genuine reversion held across the window
    // flips the outcome to Refund.
    // -------------------------------------------------------------------------

    function test_twap_honorsSustainedReversion() public {
        _swap(alice, true, -2e17);
        bytes32 tradeId = hook.lastTradeId();

        // Reversion happens early and is held for the whole window.
        vm.warp(block.timestamp + 1);
        _swap(arber, false, -2e17);
        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY());

        vm.prank(settler);
        hook.settle(tradeId);

        assertEq(uint8(_outcome(tradeId)), uint8(MarkoutHook.Outcome.Refund), "held reversion must refund");
    }

    // -------------------------------------------------------------------------
    // exactOut_chargesInputBondAndFillsOutput
    // -------------------------------------------------------------------------

    function test_exactOut_chargesInputBondAndFillsOutput() public {
        uint256 alice1Before = currency1.balanceOf(alice);

        BalanceDelta delta = _swap(alice, true, 1e17); // exact-out: buy exactly 1e17 of token1

        assertEq(currency1.balanceOf(alice) - alice1Before, 1e17, "exact-out not filled");

        // amountIn is read off the post-swap balanceDelta (pool perspective),
        // never a slot0 estimation.
        uint256 amountIn = uint256(uint128(-delta.amount0()));
        uint256 bond = currency0.balanceOf(address(hook));
        assertEq(bond, (amountIn * hook.BOND_BPS()) / hook.BPS_DENOMINATOR(), "bond != 20 bps of amountIn");
    }

    // -------------------------------------------------------------------------
    // refundUndeliverable_donates: a frozen/undeliverable refund must never
    // brick settlement — the bond falls through to the LPs instead.
    // -------------------------------------------------------------------------

    function test_refundUndeliverable_donates() public {
        _swap(alice, true, -2e17);
        bytes32 tradeId = hook.lastTradeId();

        // Arbitrageur reverts the price => engine verdict is Refund...
        _swap(arber, false, -2e17);
        vm.warp(block.timestamp + hook.SETTLEMENT_DELAY() + 1);

        // ...but the trader's refund becomes undeliverable (e.g. a
        // blacklist-style token that rejects transfers to the trader while
        // still allowing transfers to the pool). Settlement must still
        // succeed and route the bond to LPs.
        MockERC20(Currency.unwrap(currency0)).setBlocked(alice, true);

        uint256 pool0 = currency0.balanceOf(address(manager));
        uint256 escrow = currency0.balanceOf(address(hook));
        vm.prank(settler);
        hook.settle(tradeId);

        assertEq(uint8(_outcome(tradeId)), uint8(MarkoutHook.Outcome.Donate), "undeliverable refund must donate");
        assertEq(currency0.balanceOf(address(hook)), 0, "escrow must be released");
        assertEq(currency0.balanceOf(address(manager)), pool0 + escrow, "pool must receive the bond");
    }

    // -------------------------------------------------------------------------
    // bondFor_quotes: public quoting view matches the charged bond exactly
    // -------------------------------------------------------------------------

    function test_bondFor_quotes() public view {
        assertEq(hook.bondFor(1e18), 2e15, "bondFor(1e18)");
        assertEq(hook.bondFor(499), 0, "bondFor dust");
        assertEq(hook.bondFor(500), 1, "bondFor minimum unit");
    }

    // -------------------------------------------------------------------------
    // swapTooSmall_reverts
    // -------------------------------------------------------------------------

    function test_swapTooSmall_reverts() public {
        vm.prank(alice);
        // The hook revert is wrapped by v4's CustomRevert (ERC-7751); the
        // observable contract-level guarantee is that the whole swap reverts.
        vm.expectRevert();
        router.swap(
            key,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -499, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            new bytes(0)
        );
    }

    function trades_settleAfter(bytes32 tradeId) internal view returns (uint32) {
        (,,,,,,, uint32 settleAfter,,) = hook.trades(tradeId);
        return settleAfter;
    }
}
