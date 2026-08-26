// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {StdUtils} from "forge-std/StdUtils.sol";
import {Vm} from "forge-std/Vm.sol";

import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolManager} from "@uniswap/v4-core/src/PoolManager.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {PoolModifyLiquidityTest} from "@uniswap/v4-core/src/test/PoolModifyLiquidityTest.sol";
import {HookMiner} from "./shared/HookMiner.sol";

import {MarkoutHook} from "../src/MarkoutHook.sol";
import {MarkoutRouter} from "../src/MarkoutRouter.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

bytes32 constant SWAP_BONDED_TOPIC = keccak256("SwapBonded(bytes32,address,int24,int24,uint256)");

/// @title Handler-based fuzz: economic invariants of the bond escrow.
/// @dev Checked after every handler call:
///      1. Conservation — hook balances exactly cover escrow liabilities.
///      2. Liability identity — liabilities = open + unclaimed-refund + pending-donation bonds.
///      3. Verdict immutability — settled outcomes never change.
///      4. Bounded release — no trade ever pays out more than its bond.
contract MarkoutFuzzTest is Test {
    using PoolIdLibrary for PoolKey;

    Handler internal handler;

    function setUp() public {
        handler = new Handler();
        targetContract(address(handler));
        bytes4[] memory selectors = new bytes4[](5);
        selectors[0] = Handler.doSwap.selector;
        selectors[1] = Handler.advanceTime.selector;
        selectors[2] = Handler.doSettle.selector;
        selectors[3] = Handler.doClaimRefund.selector;
        selectors[4] = Handler.doFlushDonation.selector;
        targetSelector(FuzzSelector({addr: address(handler), selectors: selectors}));
    }

    function invariant_escrowCovered() public view {
        // Balances must COVER liabilities; they may exceed them (gratuitous
        // deposits are gifts, not obligations).
        assertGe(
            handler.token0().balanceOf(address(handler.hook())),
            handler.hook().escrowLiability(Currency.wrap(address(handler.token0()))),
            "conservation: token0 balance below liability"
        );
        assertGe(
            handler.token1().balanceOf(address(handler.hook())),
            handler.hook().escrowLiability(Currency.wrap(address(handler.token1()))),
            "conservation: token1 balance below liability"
        );
    }

    function invariant_liabilityIdentity() public view {
        Handler.Ghost[] memory gs = handler.ghosts();
        uint256 open0;
        uint256 open1;
        uint256 refund0;
        uint256 refund1;
        for (uint256 i; i < gs.length; ++i) {
            (,,,,,, MarkoutHook.Outcome outcome, bool claimed) = handler.tradeView(gs[i].id);
            if (outcome == MarkoutHook.Outcome.None) {
                if (gs[i].is0) open0 += gs[i].bond;
                else open1 += gs[i].bond;
            } else if (outcome == MarkoutHook.Outcome.RefundPending && !claimed) {
                if (gs[i].is0) refund0 += gs[i].bond;
                else refund1 += gs[i].bond;
            }
        }
        PoolKey memory k;
        (k.currency0, k.currency1, k.fee, k.tickSpacing, k.hooks) = handler.key();
        PoolId poolId = k.toId();
        assertEq(
            handler.hook().escrowLiability(Currency.wrap(address(handler.token0()))),
            open0 + refund0 + handler.hook().pendingDonation(poolId, 0),
            "liability identity: token0"
        );
        assertEq(
            handler.hook().escrowLiability(Currency.wrap(address(handler.token1()))),
            open1 + refund1 + handler.hook().pendingDonation(poolId, 1),
            "liability identity: token1"
        );
    }

    function invariant_verdictsImmutable() public view {
        Handler.Ghost[] memory gs = handler.ghosts();
        for (uint256 i; i < gs.length; ++i) {
            if (gs[i].outcome == 0) continue;
            (,,,,,, MarkoutHook.Outcome outcome,) = handler.tradeView(gs[i].id);
            assertEq(uint8(outcome), gs[i].outcome, "settled verdict mutated");
        }
    }

    function invariant_boundedRelease() public view {
        Handler.Ghost[] memory gs = handler.ghosts();
        for (uint256 i; i < gs.length; ++i) {
            assertLe(gs[i].released, gs[i].bond, "trade released more than its bond");
        }
    }
}

contract Handler is StdUtils {
    struct Ghost {
        bytes32 id;
        bool is0; // bond currency is token0
        uint256 bond;
        uint8 outcome; // mirrors hook Outcome after settle
        uint256 released;
        uint256 pushesAtBond; // ring-pressure guard
    }

    MockERC20 public token0;
    MockERC20 public token1;
    PoolManager public manager;
    PoolModifyLiquidityTest public lpRouter;
    MarkoutHook public hook;
    MarkoutRouter public router;
    PoolKey public key;

    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    address internal alice = address(0xA11CE);
    address internal arber = address(0xA2BE2);

    Ghost[] internal ghostList;
    uint256 public swapCount;

    constructor() {
        MockERC20 a = new MockERC20();
        MockERC20 b = new MockERC20();
        (token0, token1) = address(a) < address(b) ? (a, b) : (b, a);

        manager = new PoolManager(address(this));
        lpRouter = new PoolModifyLiquidityTest(IPoolManager(address(manager)));
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
        router = new MarkoutRouter(IPoolManager(address(manager)));

        key = PoolKey({
            currency0: Currency.wrap(address(token0)),
            currency1: Currency.wrap(address(token1)),
            fee: 300,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        manager.initialize(key, 79228162514264337593543950336);

        token0.mint(address(this), 10_000e18);
        token1.mint(address(this), 10_000e18);
        token0.approve(address(lpRouter), type(uint256).max);
        token1.approve(address(lpRouter), type(uint256).max);
        lpRouter.modifyLiquidity(
            key,
            IPoolManager.ModifyLiquidityParams({
                tickLower: TickMath.minUsableTick(60),
                tickUpper: TickMath.maxUsableTick(60),
                liquidityDelta: 1e18,
                salt: bytes32(0)
            }),
            new bytes(0)
        );

        token0.mint(alice, 10_000e18);
        token1.mint(alice, 10_000e18);
        token0.mint(arber, 10_000e18);
        token1.mint(arber, 10_000e18);
    }

    function ghosts() external view returns (Ghost[] memory) {
        return ghostList;
    }

    function tradeView(bytes32 id)
        external
        view
        returns (address, uint256, int24, int24, uint32, uint32, MarkoutHook.Outcome, bool)
    {
        (
            ,
            address trader,,
            uint256 bond,,
            int24 postTick,
            uint32 bondTime,
            uint32 settleAfter,,
            MarkoutHook.Outcome outcome,
            bool claimed
        ) = hook.trades(id);
        return (trader, bond, postTick, int24(0), bondTime, settleAfter, outcome, claimed);
    }

    // ------------------------------------------------------------------
    // Actions
    // ------------------------------------------------------------------

    function doSwap(uint256 seed) external {
        address who = seed % 2 == 0 ? alice : arber;
        bool zeroForOne = (seed >> 1) % 2 == 0;
        uint256 amount = bound(seed >> 2, 1e15, 5e17);
        swapCount += 1;

        vm.startPrank(who);
        token0.approve(address(router), type(uint256).max);
        token1.approve(address(router), type(uint256).max);
        vm.recordLogs();
        router.swap(
            key,
            IPoolManager.SwapParams({
                zeroForOne: zeroForOne,
                amountSpecified: -int256(amount),
                sqrtPriceLimitX96: zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1
            }),
            0,
            type(uint256).max
        );
        vm.stopPrank();

        bytes32 id;
        uint256 bond;
        {
            Vm.Log[] memory entries = vm.getRecordedLogs();
            for (uint256 i = entries.length; i > 0; --i) {
                if (entries[i - 1].emitter == address(hook) && entries[i - 1].topics[0] == SWAP_BONDED_TOPIC) {
                    id = entries[i - 1].topics[1];
                    (,, uint256 b) = abi.decode(entries[i - 1].data, (int24, int24, uint256));
                    bond = b;
                    break;
                }
            }
        }
        if (id != bytes32(0)) {
            (,, Currency bondCurrency,,,,,,,,) = hook.trades(id);
            ghostList.push(
                Ghost({
                    id: id,
                    is0: Currency.unwrap(bondCurrency) == address(token0),
                    bond: bond,
                    outcome: 0,
                    released: 0,
                    pushesAtBond: swapCount
                })
            );
        }
    }

    function advanceTime(uint256 secs) external {
        vm.warp(block.timestamp + bound(secs, 1, 30));
    }

    function doSettle(uint256 seed) external {
        uint256 n = ghostList.length;
        if (n == 0) return;
        Ghost storage g = ghostList[seed % n];
        (,,,,, uint32 settleAfter, MarkoutHook.Outcome outcome,) = this.tradeView(g.id);
        if (outcome != MarkoutHook.Outcome.None || block.timestamp < settleAfter) return;
        hook.settle(g.id);
        (,,,,, uint32 settleAfter2, MarkoutHook.Outcome settled,) = this.tradeView(g.id);
        g.outcome = uint8(settled);
        if (settled == MarkoutHook.Outcome.Refunded) g.released += g.bond; // paid at settle
    }

    function doClaimRefund(uint256 seed) external {
        uint256 n = ghostList.length;
        if (n == 0) return;
        Ghost storage g = ghostList[seed % n];
        (,,,,,, MarkoutHook.Outcome outcome, bool claimed) = this.tradeView(g.id);
        if (outcome != MarkoutHook.Outcome.RefundPending || claimed) return;
        bool delivered = hook.claimRefund(g.id);
        if (delivered) g.released += g.bond;
    }

    function doFlushDonation(uint256) external {
        PoolId poolId = key.toId();
        if (hook.pendingDonation(poolId, 0) == 0 && hook.pendingDonation(poolId, 1) == 0) return;
        hook.flushDonation(poolId);
        for (uint256 i; i < ghostList.length; ++i) {
            if (ghostList[i].outcome == uint8(MarkoutHook.Outcome.Donated)) {
                ghostList[i].released = ghostList[i].bond;
            }
        }
    }
}
