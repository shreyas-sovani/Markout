// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";

import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {PoolManager} from "@uniswap/v4-core/src/PoolManager.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {PoolModifyLiquidityTest} from "@uniswap/v4-core/src/test/PoolModifyLiquidityTest.sol";
import {HookMiner} from "@uniswap/v4-periphery/test/shared/HookMiner.sol";

import {MarkoutHook} from "../src/MarkoutHook.sol";
import {MarkoutRouter} from "../src/MarkoutRouter.sol";
import {MarkoutExecutor} from "../src/MarkoutExecutor.sol";
import {MarkoutReactive} from "../src/MarkoutReactive.sol";
import {IReactive} from "reactive-lib/src/interfaces/IReactive.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract MarkoutTest is Test {
    using CurrencyLibrary for Currency;
    using PoolIdLibrary for PoolKey;

    uint160 internal constant SQRT_PRICE_1_1 = 79228162514264337593543950336;
    uint24 internal constant FEE = 300; // 3 bps
    int24 internal constant TICK_SPACING = 60;
    address internal constant SEPOLIA_CALLBACK_PROXY = 0xc9f36411C9897e7F959D99ffca2a0Ba7ee0D7bDA;

    MockERC20 internal tokenA;
    MockERC20 internal tokenB;
    Currency internal currency0;
    Currency internal currency1;

    PoolManager internal manager;
    PoolModifyLiquidityTest internal lpRouter;
    MarkoutHook internal hook;
    MarkoutRouter internal router;
    MarkoutExecutor internal executor;

    PoolKey internal key;

    address internal alice = makeAddr("alice");
    address internal arber = makeAddr("arber");

    function setUp() public {
        tokenA = new MockERC20();
        tokenB = new MockERC20();
        (currency0, currency1) = address(tokenA) < address(tokenB)
            ? (Currency.wrap(address(tokenA)), Currency.wrap(address(tokenB)))
            : (Currency.wrap(address(tokenB)), Currency.wrap(address(tokenA)));

        manager = new PoolManager(address(this));
        lpRouter = new PoolModifyLiquidityTest(IPoolManager(address(manager)));

        // Executor deploys first (CREATE1 at a predictable address), hook second
        // (CREATE2 with a mined salt), so both immutables can reference each other.
        address predictedExecutor = vm.computeCreateAddress(address(this), vm.getNonce(address(this)));
        (address hookAddress, bytes32 salt) = HookMiner.find(
            address(this),
            uint160(Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG),
            type(MarkoutHook).creationCode,
            abi.encode(address(manager), predictedExecutor)
        );

        executor = new MarkoutExecutor(SEPOLIA_CALLBACK_PROXY, hookAddress);
        hook = new MarkoutHook{salt: salt}(IPoolManager(address(manager)), address(executor));
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
                tickLower: -887220, tickUpper: 887220, liquidityDelta: 1e18, salt: bytes32(0)
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

    function _settle(bytes32 tradeId) internal {
        vm.prank(SEPOLIA_CALLBACK_PROXY);
        executor.settleMarkout(address(this), tradeId);
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

        // Arbitrageur reverts the price behind the organic trader.
        _swap(arber, false, -2e17);

        uint256 aliceMid = currency0.balanceOf(alice);
        _settle(tradeId);

        (,,,,,, MarkoutHook.Outcome outcome) = hook.trades(tradeId);
        assertEq(uint8(outcome), uint8(MarkoutHook.Outcome.Refund), "expected refund");
        assertEq(currency0.balanceOf(alice), aliceMid + expectedBond, "bond not refunded");
        assertEq(currency0.balanceOf(address(hook)), 0, "hook must release currency0 escrow");
        assertEq(alice0Before - currency0.balanceOf(alice), amountIn, "net cost must be only amountIn");
    }

    // -------------------------------------------------------------------------
    // arbSustains_donates: single-shot arb, no continuation => Donate
    // -------------------------------------------------------------------------

    function test_arbSustains_donates() public {
        BalanceDelta delta = _swap(alice, true, -2e17);
        uint256 amountIn = uint256(uint128(-delta.amount0()));
        uint256 expectedBond = (amountIn * hook.BOND_BPS()) / hook.BPS_DENOMINATOR();

        bytes32 tradeId = hook.lastTradeId();
        uint256 alice0 = currency0.balanceOf(alice);
        uint256 pool0 = currency0.balanceOf(address(manager));

        vm.expectEmit(true, true, true, true, address(manager));
        emit IPoolManager.Donate(key.toId(), address(hook), expectedBond, uint256(0));
        _settle(tradeId);

        (,,,,,, MarkoutHook.Outcome outcome) = hook.trades(tradeId);
        assertEq(uint8(outcome), uint8(MarkoutHook.Outcome.Donate), "expected donate");
        assertEq(currency0.balanceOf(alice), alice0, "toxic trader keeps nothing");
        assertEq(currency0.balanceOf(address(manager)), pool0 + expectedBond, "pool must receive the bond");
        assertEq(currency0.balanceOf(address(hook)), 0, "hook holds no escrow after donate");
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

    // -------------------------------------------------------------------------
    // reactive_cron_callback: synthetic Cron1 aging emits Callback after 3 ticks
    // -------------------------------------------------------------------------

    function test_reactive_cron_callback() public {
        MarkoutReactive rsc = new MarkoutReactive(address(hook), address(executor));

        bytes32 tradeId = bytes32(uint256(42));
        rsc.react(
            _log(
                11155111,
                address(hook),
                0x0d39a536aa19156d3df8b040edbfea1a971c7c4f0ce06729f3af7e589d7e6a14,
                uint256(tradeId)
            )
        );
        assertEq(rsc.queueLength(), 1, "trade not queued");

        uint256 cronTopic = 0xf02d6ea5c22a71cffe930a4523fcb4f129be6c804db50e4202fb4e0b07ccb514;
        IReactive.LogRecord memory cron = _log(5318007, 0x0000000000000000000000000000000000fffFfF, cronTopic, 0);

        rsc.react(cron);
        rsc.react(cron);
        assertEq(rsc.queueLength(), 1, "settled too early");

        bytes memory payload = abi.encodeWithSignature("settleMarkout(address,bytes32)", address(0), tradeId);
        vm.expectEmit(true, true, true, true, address(rsc));
        emit IReactive.Callback(11155111, address(executor), 1_000_000, payload);
        rsc.react(cron);
        assertEq(rsc.queueLength(), 0, "trade not dequeued");
    }

    // -------------------------------------------------------------------------
    // helpers
    // -------------------------------------------------------------------------

    function _log(uint256 chainId, address emitter, uint256 topic0, uint256 topic1)
        internal
        pure
        returns (IReactive.LogRecord memory)
    {
        return IReactive.LogRecord({
            chain_id: chainId,
            _contract: emitter,
            topic_0: topic0,
            topic_1: topic1,
            topic_2: 0,
            topic_3: 0,
            data: new bytes(0),
            block_number: 1,
            op_code: 0,
            block_hash: 0,
            tx_hash: 0,
            log_index: 0
        });
    }
}
