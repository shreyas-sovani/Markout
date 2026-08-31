// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {
    BeforeSwapDelta,
    BeforeSwapDeltaLibrary,
    toBeforeSwapDelta
} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IUnlockCallback} from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {StateLibrary} from "@uniswap/v4-core/src/libraries/StateLibrary.sol";

import {BaseHook} from "./BaseHook.sol";
import {MarkoutEngine} from "./MarkoutEngine.sol";

/// @title Markout — autonomous MEV/LVR protection hook for Uniswap v4.
/// @notice Swaps fill immediately at the pool's advertised 3 bps fee while a
/// 20 bps input bond is escrowed. Over the trade's *immutable* settlement
/// window [bondTime, settleAfter] (24 s ≈ two 12 s blocks), a hook-maintained
/// previous-tick accumulator measures the time-weighted average tick; the
/// normalized reversion classifier refunds the bond when at least half of
/// the trade's own price impact reverted (organic flow) and donates it to
/// in-range LPs when it sustained (informed flow).
///
/// The bond is charged to the swapper through v4's hook-delta mechanism —
/// it becomes part of the swap caller's own PoolManager delta, so ANY
/// router that can settle a normal v4 swap can pay it; no Markout-specific
/// settlement step exists. Settlement is permissionless, pays successful
/// refunds immediately (a separate claim exists only when delivery failed),
/// records its verdict before any external interaction, and computes over
/// the fixed window via an unbounded, binary-searched observation history —
/// delayed settlement always produces the window-close verdict.
contract MarkoutHook is BaseHook, IUnlockCallback {
    using StateLibrary for IPoolManager;
    using CurrencyLibrary for Currency;
    using PoolIdLibrary for PoolKey;

    uint256 public constant SWAP_FEE = 300; // 3 bps, set at pool initialization
    int24 public constant SUPPORTED_TICK_SPACING = 60;
    uint256 public constant BOND_BPS = 20;
    uint256 public constant BPS_DENOMINATOR = 10_000;
    /// @notice Settlement window T: the immutable interval every trade is
    /// measured over. Sized to ~two 12 s blocks so a full reversion landing
    /// one block after the trade already sits at the 50% frontier.
    uint256 public constant SETTLEMENT_DELAY = 24 seconds;

    enum Outcome {
        None, // 0 — open
        Refunded, // 1 — verdict refund, bond delivered (at settle or claim)
        RefundPending, // 2 — verdict refund, delivery failed; claim retries
        Donated // 3 — verdict donate; value deferred to LP distribution
    }

    struct Trade {
        PoolKey key;
        address trader;
        Currency bondCurrency;
        uint256 bondAmount;
        int24 preTick;
        int24 postTick;
        uint32 bondTime;
        uint32 settleAfter;
        int56 cumAtBond;
        Outcome outcome;
        bool refundClaimed;
    }

    /// @dev One accumulator checkpoint. `cumulative` is the accumulator value
    /// AT `timestamp`, and `tick` is the tick held *from* `timestamp` until
    /// the next observation (previous-tick attribution).
    struct Obs {
        uint32 timestamp;
        int56 cumulative;
        int24 tick;
    }

    struct PoolObservations {
        uint32 lastTimestamp;
        int56 cumulative;
        int24 tick; // tick held since lastTimestamp
        uint256 count; // total observations pushed (append-only)
        mapping(uint256 => Obs) data;
    }

    event SwapBonded(
        bytes32 indexed tradeId, address indexed trader, int24 preTick, int24 postTick, uint256 bondAmount
    );
    event Settled(bytes32 indexed tradeId, uint8 outcome, int24 windowAvgTick, uint256 bondAmount);
    event RefundClaimed(bytes32 indexed tradeId, address indexed trader, uint256 bondAmount);
    event RefundDeliveryFailed(bytes32 indexed tradeId, address indexed trader, uint256 bondAmount);
    event DonationFlushed(bytes32 indexed poolId, uint256 amount0, uint256 amount1);

    error SwapTooSmall();
    error SettlementWindowOpen(uint256 settleAfter, uint256 now);
    error UnknownTrade();
    error AlreadySettled();
    error UnsupportedPool(uint24 fee, int24 tickSpacing);
    error NoObservations();
    error NotRefundPending();
    error RefundAlreadyClaimed();
    error NothingToFlush();
    error NoActiveLiquidity();
    error TickOutOfBounds();
    error InputDeltaNotNegative();

    IPoolManager public immutable poolManager;

    mapping(bytes32 tradeId => Trade) public trades;
    uint256 private tradeNonce;

    mapping(PoolId => PoolKey) public poolKeys;
    mapping(PoolId => PoolObservations) internal observations;

    /// @notice Donations accumulated per pool, paid to LPs by flushDonation.
    mapping(PoolId => mapping(uint8 => uint256)) public pendingDonation; // 0 => currency0, 1 => currency1

    /// @notice Strict escrow accounting: bond value the hook currently owes
    /// out (open + refund-pending + donation-pending). Covered by the hook's
    /// token/native balance (which may also hold gratuitous deposits).
    mapping(Currency => uint256) public escrowLiability;

    constructor(IPoolManager manager_) {
        poolManager = manager_;
    }

    function _poolManager() internal view override returns (IPoolManager) {
        return poolManager;
    }

    receive() external payable {
        // Native `take` payouts from the PoolManager only.
        if (msg.sender != address(poolManager)) revert NotPoolManager();
    }

    // ---------------------------------------------------------------------------
    // Pool configuration
    // ---------------------------------------------------------------------------

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: true,
            afterInitialize: true,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: true, // exact-in bonds ride the specified delta
            afterSwapReturnDelta: true, // exact-out bonds ride the unspecified delta
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    function _beforeInitialize(address, PoolKey calldata key, uint160) internal view override returns (bytes4) {
        if (key.fee != SWAP_FEE || key.tickSpacing != SUPPORTED_TICK_SPACING) {
            revert UnsupportedPool(key.fee, key.tickSpacing);
        }
        return IHooks.beforeInitialize.selector;
    }

    function _afterInitialize(address, PoolKey calldata key, uint160, int24 tick) internal override returns (bytes4) {
        poolKeys[key.toId()] = key;
        _poke(key.toId(), tick);
        return IHooks.afterInitialize.selector;
    }

    // ---------------------------------------------------------------------------
    // Previous-tick accumulator — append-only history, binary-searched reads
    // ---------------------------------------------------------------------------

    /// @notice Bring the accumulator up to the current block, attributing the
    /// elapsed time to the tick held *before* the update. Permissionless.
    function poke(PoolId poolId) public returns (int56) {
        (, int24 tick,,) = poolManager.getSlot0(poolId);
        return _poke(poolId, tick);
    }

    function _poke(PoolId poolId, int24 tickNow) internal returns (int56) {
        PoolObservations storage obs = observations[poolId];
        uint32 timestamp = uint32(block.timestamp);
        if (obs.lastTimestamp == 0) {
            obs.lastTimestamp = timestamp;
            obs.tick = tickNow;
            obs.data[obs.count] = Obs({timestamp: timestamp, cumulative: 0, tick: tickNow});
            obs.count += 1;
        } else if (timestamp == obs.lastTimestamp) {
            // Same-block update (beforeSwap -> afterSwap): no time elapses,
            // but the held tick must move to the current one.
            obs.tick = tickNow;
            obs.data[obs.count - 1].tick = tickNow;
        } else if (timestamp > obs.lastTimestamp) {
            obs.cumulative += int56(obs.tick) * int56(uint56(timestamp - obs.lastTimestamp));
            obs.lastTimestamp = timestamp;
            obs.tick = tickNow;
            obs.data[obs.count] = Obs({timestamp: timestamp, cumulative: obs.cumulative, tick: tickNow});
            obs.count += 1;
        }
        return obs.cumulative;
    }

    /// @notice Accumulator value at an arbitrary (possibly past or future)
    /// timestamp. Past points binary-search the append-only observation
    /// history — nothing is ever pruned, so any open trade's window stays
    /// readable no matter how many pokes or swaps follow; future points
    /// project the currently-held tick. Settlement over the immutable
    /// [bondTime, settleAfter] window therefore returns the same value no
    /// matter when settlement happens, and escrow can never be trapped.
    function cumulativeAt(PoolId poolId, uint32 t) public view returns (int56) {
        PoolObservations storage obs = observations[poolId];
        if (obs.count == 0) revert NoObservations();
        if (t >= obs.lastTimestamp) {
            return obs.cumulative + int56(obs.tick) * int56(uint56(t - obs.lastTimestamp));
        }
        // Binary search for the last observation at or before t. Obs are
        // strictly increasing in timestamp, indexed 0..count-1.
        uint256 lo = 0;
        uint256 hi = obs.count - 1;
        while (lo < hi) {
            uint256 mid = (lo + hi + 1) / 2;
            if (obs.data[mid].timestamp <= t) {
                lo = mid;
            } else {
                hi = mid - 1;
            }
        }
        Obs storage o = obs.data[lo];
        return o.cumulative + int56(o.tick) * int56(uint56(t - o.timestamp));
    }

    function observationCount(PoolId poolId) external view returns (uint256) {
        return observations[poolId].count;
    }

    // ---------------------------------------------------------------------------
    // Hook lifecycle
    // ---------------------------------------------------------------------------

    /// @dev Exact-in: the realized input equals the specified amount, so the
    /// bond is charged up-front through the *specified* delta — it lands in
    /// the swap caller's own PoolManager delta, payable by any generic
    /// router. Exact-out: the input is only known after the swap, so the
    /// charge happens in afterSwap via the returned (unspecified-side) delta.
    function _beforeSwap(address sender, PoolKey calldata key, IPoolManager.SwapParams calldata params, bytes calldata)
        internal
        override
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        (, int24 tick,,) = poolManager.getSlot0(key.toId());
        _preSlotStore(key.toId(), sender, tick);

        if (params.amountSpecified < 0) {
            uint256 bond = (uint256(uint128(-int128(params.amountSpecified))) * BOND_BPS) / BPS_DENOMINATOR;
            if (bond == 0) revert SwapTooSmall();
            return (IHooks.beforeSwap.selector, toBeforeSwapDelta(int128(uint128(bond)), 0), 0);
        }
        return (IHooks.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    function _afterSwap(
        address sender,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata hookData
    ) internal override returns (bytes4, int128) {
        Currency inputCurrency = params.zeroForOne ? key.currency0 : key.currency1;
        int128 inputDelta = params.zeroForOne ? delta.amount0() : delta.amount1();
        if (inputDelta >= 0) revert InputDeltaNotNegative();
        uint256 amountIn = uint256(uint128(-inputDelta));

        uint256 bond = (amountIn * BOND_BPS) / BPS_DENOMINATOR;
        if (bond == 0) revert SwapTooSmall();

        // The beneficiary: a Markout-aware router may declare its payer in
        // hookData; otherwise the direct swap caller is the trader. This is
        // a convenience, never a gate — anyone may swap through any router.
        // A 32-byte zero payload is treated as "no declaration" (never burn
        // a refund to address(0)); any other non-32-byte payload also falls
        // back to the sender instead of reverting mid-swap.
        address trader = sender;
        if (hookData.length == 32) {
            address declared = abi.decode(hookData, (address));
            if (declared != address(0)) trader = declared;
        }

        // Checkpoint the accumulator at bond time (attributes elapsed time
        // to the pre-swap tick — previous-tick semantics), then capture both
        // boundary ticks for the normalized reversion classifier.
        (, int24 postTick,,) = poolManager.getSlot0(key.toId());
        int56 cumAtBond = _poke(key.toId(), postTick);
        int24 preTick = _preSlotTake(key.toId(), sender);

        // Escrow the bond against the hook's delta credit. Exact-in credit
        // was charged on the specified amount; a partial fill (price limit)
        // means the realized input is smaller — return the difference to the
        // trader so the charge always matches the realized bond exactly.
        poolManager.take(inputCurrency, address(this), bond);
        escrowLiability[inputCurrency] += bond;
        if (params.amountSpecified < 0) {
            uint256 charged = (uint256(uint128(-int128(params.amountSpecified))) * BOND_BPS) / BPS_DENOMINATOR;
            if (charged > bond) {
                poolManager.take(inputCurrency, trader, charged - bond);
            }
        }

        bytes32 tradeId = keccak256(abi.encode(key.toId(), sender, block.number, block.timestamp, tradeNonce++));

        trades[tradeId] = Trade({
            key: key,
            trader: trader,
            bondCurrency: inputCurrency,
            bondAmount: bond,
            preTick: preTick,
            postTick: postTick,
            bondTime: uint32(block.timestamp),
            settleAfter: uint32(block.timestamp + SETTLEMENT_DELAY),
            cumAtBond: cumAtBond,
            outcome: Outcome.None,
            refundClaimed: false
        });

        emit SwapBonded(tradeId, trader, preTick, postTick, bond);

        // Exact-out: charge the realized bond through the returned delta
        // (unspecified side == input currency for exact-out in both
        // directions). Exact-in was already charged in beforeSwap.
        if (params.amountSpecified > 0) {
            return (IHooks.afterSwap.selector, int128(uint128(bond)));
        }
        return (IHooks.afterSwap.selector, 0);
    }

    // ---------------------------------------------------------------------------
    // Settlement — permissionless, immutable verdicts, refunds paid here
    // ---------------------------------------------------------------------------

    /// @notice Settle a bonded trade. Callable by anyone once the window has
    /// elapsed. The verdict is computed over the immutable window
    /// [bondTime, settleAfter] via the append-only history and recorded
    /// *before* any value moves; settling late (or adversarially) cannot
    /// change it. A successful refund is paid to the trader immediately;
    /// only a failed delivery (hostile token) leaves a retryable pull claim.
    function settle(bytes32 tradeId) external {
        Trade storage trade = trades[tradeId];
        if (trade.settleAfter == 0) revert UnknownTrade();
        if (trade.outcome != Outcome.None) revert AlreadySettled();
        if (block.timestamp < trade.settleAfter) revert SettlementWindowOpen(trade.settleAfter, block.timestamp);

        PoolId poolId = trade.key.toId();
        int56 endCum = cumulativeAt(poolId, trade.settleAfter);
        uint32 elapsed = trade.settleAfter - trade.bondTime; // SETTLEMENT_DELAY by construction
        int256 avgTick = (int256(endCum) - int256(trade.cumAtBond)) / int256(uint256(elapsed));
        if (avgTick < int256(int24(type(int24).min)) || avgTick > int256(int24(type(int24).max))) {
            revert TickOutOfBounds();
        }

        bool refund = MarkoutEngine.decide(trade.preTick, trade.postTick, int24(avgTick));
        if (refund) {
            // The hook already holds the escrowed bond tokens — pay the
            // trader directly, no PoolManager interaction. On failure the
            // verdict survives and a pull claim remains.
            trade.outcome = Outcome.RefundPending; // provisional; flipped below on success
            bool ok = _tryTransfer(trade.bondCurrency, trade.trader, trade.bondAmount);
            if (ok) {
                trade.outcome = Outcome.Refunded;
                escrowLiability[trade.bondCurrency] -= trade.bondAmount;
                emit Settled(tradeId, uint8(trade.outcome), int24(avgTick), trade.bondAmount);
                emit RefundClaimed(tradeId, trade.trader, trade.bondAmount);
                return;
            }
            emit Settled(tradeId, uint8(trade.outcome), int24(avgTick), trade.bondAmount);
            emit RefundDeliveryFailed(tradeId, trade.trader, trade.bondAmount);
        } else {
            trade.outcome = Outcome.Donated;
            pendingDonation[poolId][trade.bondCurrency == trade.key.currency0 ? 0 : 1] += trade.bondAmount;
            emit Settled(tradeId, uint8(trade.outcome), int24(avgTick), trade.bondAmount);
        }
    }

    /// @notice Retry path only: exists for refunds whose delivery failed at
    /// settlement (e.g. blacklist tokens). Marks claimed *before* the
    /// external transfer so reentrancy and replay are impossible; a failed
    /// delivery resets and stays retryable.
    function claimRefund(bytes32 tradeId) external returns (bool delivered) {
        Trade storage trade = trades[tradeId];
        if (trade.outcome != Outcome.RefundPending) revert NotRefundPending();
        if (trade.refundClaimed) revert RefundAlreadyClaimed();

        trade.refundClaimed = true;
        bool ok = _tryTransfer(trade.bondCurrency, trade.trader, trade.bondAmount);
        if (ok) {
            trade.outcome = Outcome.Refunded;
            escrowLiability[trade.bondCurrency] -= trade.bondAmount;
            emit RefundClaimed(tradeId, trade.trader, trade.bondAmount);
        } else {
            trade.refundClaimed = false;
            emit RefundDeliveryFailed(tradeId, trade.trader, trade.bondAmount);
        }
        return ok;
    }

    /// @notice Donate accumulated bond value to the pool's in-range LPs.
    /// Permissionless once the pool has active liquidity; while liquidity is
    /// zero the donation stays deferred (settle still succeeded) and can be
    /// flushed after liquidity returns.
    function flushDonation(PoolId poolId) external {
        uint256 amount0 = pendingDonation[poolId][0];
        uint256 amount1 = pendingDonation[poolId][1];
        if (amount0 == 0 && amount1 == 0) revert NothingToFlush();
        if (poolManager.getLiquidity(poolId) == 0) revert NoActiveLiquidity();

        // Effects before interactions: zero the pending bucket, then move value.
        pendingDonation[poolId][0] = 0;
        pendingDonation[poolId][1] = 0;
        poolManager.unlock(abi.encode(poolId, amount0, amount1));
    }

    function unlockCallback(bytes calldata data) external override returns (bytes memory) {
        if (msg.sender != address(poolManager)) revert NotPoolManager();
        (PoolId poolId, uint256 amount0, uint256 amount1) = abi.decode(data, (PoolId, uint256, uint256));
        PoolKey storage key = poolKeys[poolId];

        if (amount0 > 0) _payIn(key.currency0, amount0);
        if (amount1 > 0) _payIn(key.currency1, amount1);
        poolManager.donate(key, amount0, amount1, new bytes(0));

        if (amount0 > 0) escrowLiability[key.currency0] -= amount0;
        if (amount1 > 0) escrowLiability[key.currency1] -= amount1;

        emit DonationFlushed(PoolId.unwrap(poolId), amount0, amount1);
        return abi.encode(0);
    }

    /// @dev Move escrowed value (held physically by the hook) into the
    /// PoolManager and credit it, for both ERC-20 and native currencies.
    function _payIn(Currency currency, uint256 amount) internal {
        if (currency.isAddressZero()) {
            IPoolManager(poolManager).settle{value: amount}();
        } else {
            poolManager.sync(currency);
            currency.transfer(address(poolManager), amount);
            IPoolManager(poolManager).settle();
        }
    }

    /// @notice Exact bond charged for a given input amount: 20 bps, floored.
    /// A result of 0 means the swap would revert with `SwapTooSmall`.
    function bondFor(uint256 amountIn) external pure returns (uint256) {
        return (amountIn * BOND_BPS) / BPS_DENOMINATOR;
    }

    // ---------------------------------------------------------------------------
    // Read-only preview for UIs
    // ---------------------------------------------------------------------------

    /// @return pre              Tick before the swap.
    /// @return post             Tick after the swap.
    /// @return windowAvg        Window average tick (projected off the held
    ///                          tick while the window is still open; final once closed).
    /// @return reversionBps     Signed fraction of the impact that reverted.
    /// @return expectedOutcome  1 Refunded / 3 Donated if settled now.
    /// @return outcome          Current recorded outcome (0-3).
    /// @return refundClaimed    Whether a pending refund has been claimed.
    function previewTrade(bytes32 tradeId)
        external
        view
        returns (
            int24 pre,
            int24 post,
            int24 windowAvg,
            int256 reversionBps,
            uint8 expectedOutcome,
            uint8 outcome,
            bool refundClaimed
        )
    {
        Trade storage trade = trades[tradeId];
        if (trade.settleAfter == 0) revert UnknownTrade();
        PoolId poolId = trade.key.toId();
        int56 endCum = cumulativeAt(poolId, trade.settleAfter);
        uint32 elapsed = trade.settleAfter - trade.bondTime;
        int256 avgTick = (int256(endCum) - int256(trade.cumAtBond)) / int256(uint256(elapsed));
        if (avgTick < int256(int24(type(int24).min)) || avgTick > int256(int24(type(int24).max))) {
            revert TickOutOfBounds();
        }
        windowAvg = int24(avgTick);
        reversionBps = MarkoutEngine.reversionBps(trade.preTick, trade.postTick, windowAvg);
        expectedOutcome = MarkoutEngine.decide(trade.preTick, trade.postTick, windowAvg) ? 1 : 3;
        return (
            trade.preTick,
            trade.postTick,
            windowAvg,
            reversionBps,
            expectedOutcome,
            uint8(trade.outcome),
            trade.refundClaimed
        );
    }

    // ---------------------------------------------------------------------------
    // Transient pre-tick passing between beforeSwap and afterSwap
    // ---------------------------------------------------------------------------

    uint256 private constant PRE_SLOT = uint256(keccak256("markout.hook.preTick"));

    function _preSlotStore(PoolId poolId, address sender, int24 tick) internal {
        bytes32 slot = keccak256(abi.encode(PRE_SLOT, PoolId.unwrap(poolId), sender));
        // solhint-disable-next-line no-inline-assembly
        assembly {
            tstore(slot, tick)
        }
    }

    function _preSlotTake(PoolId poolId, address sender) internal returns (int24 tick) {
        bytes32 slot = keccak256(abi.encode(PRE_SLOT, PoolId.unwrap(poolId), sender));
        // solhint-disable-next-line no-inline-assembly
        assembly {
            tick := tload(slot)
            tstore(slot, 0)
        }
    }

    // ---------------------------------------------------------------------------
    // Strict low-level transfer (no-revert AND empty-or-true returndata)
    // ---------------------------------------------------------------------------

    function _tryTransfer(Currency currency, address to, uint256 amount) internal returns (bool ok) {
        if (currency.isAddressZero()) {
            // solhint-disable-next-line no-inline-assembly
            assembly {
                ok := call(gas(), to, amount, 0, 0, 0, 0)
            }
        } else {
            bytes memory data = abi.encodeWithSelector(0xa9059cbb, to, amount); // transfer(address,uint256)
            // solhint-disable-next-line no-inline-assembly
            assembly {
                ok := call(gas(), currency, 0, add(data, 32), mload(data), 0, 32)
                if ok {
                    switch returndatasize()
                    case 0 {}
                    default { ok := and(eq(returndatasize(), 32), eq(mload(0), 1)) }
                }
            }
        }
    }
}
