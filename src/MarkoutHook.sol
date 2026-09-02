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
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {FullMath} from "@uniswap/v4-core/src/libraries/FullMath.sol";
import {TransientStateLibrary} from "@uniswap/v4-core/src/libraries/TransientStateLibrary.sol";

import {BaseHook} from "./BaseHook.sol";
import {MarkoutEngine} from "./MarkoutEngine.sol";
import {MarkoutBatchRouter} from "./MarkoutBatchRouter.sol";

/// @title Markout — two-lane MEV-protection hook for Uniswap v4.
/// @notice One hook-local 24-second memory serves two lanes:
///
/// · SPOT lane (default): swaps fill immediately at the pool's 3 bps fee
///   while a live-quoted reversion-insurance premium — derived only from
///   this pool's own settled donate/refund history — is escrowed. The
///   normalized reversion classifier refunds the premium when at least
///   half of the trade's own tick impact reverted over its immutable
///   [bondTime, settleAfter] window, and donates it to in-range LPs when
///   it sustained; donate verdicts also credit LPs in the settlement
///   transaction itself whenever the pool has liquidity.
///
/// · BATCH lane (opt-in): traders enqueue one side per 24 s epoch with
///   explicit custody in the hook. Anyone clears after the epoch ends:
///   opposing orders net, the dust-bounded residual executes as ONE
///   normal bonded spot swap, and every order in the epoch fills at the
///   SAME clearing price — the epoch's accumulator TWAP, clamped by the
///   realized residual execution so no side is ever filled worse than the
///   TWAP. A lone order in an empty epoch is honestly a one-epoch TWAP.
///
/// The premium is charged through v4's hook-delta mechanism — it becomes
/// part of the swap caller's own PoolManager delta, so ANY router that can
/// settle a normal v4 swap can pay it. Settlement is permissionless,
/// records its verdict before any value moves, pays deliverable refunds
/// immediately (a retryable claim exists only when delivery failed), and
/// computes over the fixed window via an unbounded, binary-searched
/// observation history — delayed settlement always produces the
/// window-close verdict.
contract MarkoutHook is BaseHook, IUnlockCallback {
    using StateLibrary for IPoolManager;
    using TransientStateLibrary for IPoolManager;
    using CurrencyLibrary for Currency;
    using PoolIdLibrary for PoolKey;

    uint256 public constant SWAP_FEE = 300; // 3 bps, set at pool initialization
    int24 public constant SUPPORTED_TICK_SPACING = 60;
    uint256 public constant BPS_DENOMINATOR = 10_000;
    /// @notice Settlement window T: the immutable interval every trade is
    /// measured over. Sized to ~two 12 s blocks so a full reversion landing
    /// one block after the trade already sits at the 50% frontier. The batch
    /// lane's epochs are the SAME 24 s clock — no second time theology.
    uint256 public constant SETTLEMENT_DELAY = 24 seconds;

    // ------------------------------------------------------------------
    // Reversion-insurance premium — pool-local, history-driven, clamped.
    // A donate verdict raises the premium, a refund verdict lowers it. The
    // only way to pump the rate is to actually donate (pay real premia to
    // LPs), so griefing is self-funding for the pool; poke spam and faucet
    // gifts cannot touch it. Clamps keep dust swaps paying > 0 and cap
    // runaways.
    // ------------------------------------------------------------------
    uint16 public constant PREMIUM_MIN_BPS = 5;
    uint16 public constant PREMIUM_MAX_BPS = 60;
    uint16 public constant PREMIUM_DEFAULT_BPS = 20;
    uint16 public constant PREMIUM_UP_BPS = 3; // donate => premium rises fast
    uint16 public constant PREMIUM_DOWN_BPS = 1; // refund => premium decays slow
    uint256 public constant BATCH_ORDER_CAP = 100;

    /// @notice Current premium, bps of the realized input. This is the exact
    /// rate the next spot swap charges — `premiumQuoteFor` previews it.
    mapping(PoolId => uint16) public premiumBps;

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
    event PremiumAdjusted(bytes32 indexed poolId, uint16 fromBps, uint16 toBps, bool donate);
    event BatchOrderPlaced(
        bytes32 indexed poolId,
        uint256 indexed epoch,
        uint256 indexed index,
        address trader,
        bool zeroForOne,
        uint256 amountIn
    );
    event BatchOrderCancelled(bytes32 indexed poolId, uint256 indexed epoch, uint256 indexed index);
    event BatchCleared(
        bytes32 indexed poolId,
        uint256 indexed epoch,
        int24 clearingTick,
        uint256 buyRateX96, // out token1 per in token0, Q96 — every buy order gets this rate
        uint256 sellRateX96, // out token0 per in token1, Q96 — every sell order gets this rate
        uint256 residual0, // residual swap size, token0 side (0 if the epoch netted)
        uint256 residual1, // residual swap size, token1 side
        uint256 dust0, // rounding + execution spread kept by the hook (quantified, bounded)
        uint256 dust1
    );

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
    error PoolNotRegistered();
    error EpochNotElapsed(uint256 epochEnd, uint256 now);
    error EpochAlreadyCleared();
    error NotOrderOwner();
    error OrderCapReached();
    error UnknownOrder();
    error NativeCurrencyUnsupported();

    /// @dev Strict ERC-20 pull: no-revert AND empty-or-true returndata.
    function _strictTransferFrom(Currency currency, address from, uint256 amount) internal {
        bytes memory data = abi.encodeWithSelector(0x23b872dd, from, address(this), amount); // transferFrom(address,address,uint256)
        bool ok;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            ok := call(gas(), currency, 0, add(data, 32), mload(data), 0, 32)
            if ok {
                switch returndatasize()
                case 0 {}
                default { ok := and(eq(returndatasize(), 32), or(eq(mload(0), 1), iszero(mload(0)))) }
            }
        }
        if (!ok) revert BatchDepositFailed();
    }

    error BatchDepositFailed();

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

    // ------------------------------------------------------------------
    // Batch lane — explicit custody, per-epoch orders, uniform TWAP clears
    // ------------------------------------------------------------------

    struct BatchOrder {
        address trader;
        bool zeroForOne; // true: deposit currency0, receive currency1
        uint256 amountIn;
    }

    mapping(PoolId => mapping(uint256 epoch => BatchOrder[])) public batchOrders;
    mapping(PoolId => mapping(uint256 => bool)) public batchCleared;
    /// @notice Batch custody per currency — invariant-tested alongside
    /// escrowLiability: hook balance must always cover both.
    mapping(Currency => uint256) public batchEscrow;

    /// @notice Immutable child that executes batch residuals as a normal
    /// external caller (v4-core skips hook callbacks on self-calls).
    MarkoutBatchRouter public immutable residualRouter;

    constructor(IPoolManager manager_) {
        poolManager = manager_;
        residualRouter = new MarkoutBatchRouter(manager_);
    }

    /// @dev One-time max approval of a batch currency to the residual
    /// router, which pulls the input + premium from custody per clear.
    mapping(Currency => bool) private routerApproved;

    function _ensureRouterAllowance(Currency currency, uint256 amount) internal {
        if (currency.isAddressZero() || routerApproved[currency]) return;
        bytes memory data = abi.encodeWithSelector(0x095ea7b3, address(residualRouter), type(uint256).max); // approve(address,uint256)
        bool ok;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            ok := call(gas(), currency, 0, add(data, 32), mload(data), 0, 32)
            if ok {
                switch returndatasize()
                case 0 {}
                default { ok := and(eq(returndatasize(), 32), eq(mload(0), 1)) }
            }
        }
        require(ok, "router approve failed");
        require(amount > 0, "zero residual");
        routerApproved[currency] = true;
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
        premiumBps[key.toId()] = PREMIUM_DEFAULT_BPS;
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
        // Before the first observation (an epoch-0 clear at t=0), attribute
        // the missing span to the first held tick — the only defensible
        // pre-history for previous-tick semantics.
        if (t < obs.data[0].timestamp) {
            return obs.data[0].cumulative - int56(obs.data[0].tick) * int56(uint56(obs.data[0].timestamp - t));
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
    /// premium is charged up-front through the *specified* delta — it lands
    /// in the swap caller's own PoolManager delta, payable by any generic
    /// router. Exact-out: the input is only known after the swap, so the
    /// charge happens in afterSwap via the returned (unspecified-side)
    /// delta. Both sites read the SAME pool-local rate: nothing can change
    /// it between beforeSwap and afterSwap of one atomic swap.
    function _beforeSwap(address sender, PoolKey calldata key, IPoolManager.SwapParams calldata params, bytes calldata)
        internal
        override
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        (, int24 tick,,) = poolManager.getSlot0(key.toId());
        _preSlotStore(key.toId(), sender, tick);

        if (params.amountSpecified < 0) {
            uint256 bond =
                (uint256(uint128(-int128(params.amountSpecified))) * premiumBps[key.toId()]) / BPS_DENOMINATOR;
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
        uint256 bps = premiumBps[key.toId()];

        // Exact-in: the beforeSwap charge was bps of the SPECIFIED amount,
        // and the pool executed on specified-minus-premium — so a full fill
        // owes exactly the charged premium (quote == charge, no bps^2
        // shrink). Only a partial fill (price limit) re-sizes the premium to
        // the realized input and returns the difference.
        uint256 bond;
        if (params.amountSpecified < 0) {
            uint256 specified = uint256(uint128(-int128(params.amountSpecified)));
            uint256 charged = (specified * bps) / BPS_DENOMINATOR;
            bond = (amountIn + charged >= specified) ? charged : (amountIn * bps) / BPS_DENOMINATOR;
        } else {
            bond = (amountIn * bps) / BPS_DENOMINATOR;
        }
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

        // Escrow the premium against the hook's delta credit.
        poolManager.take(inputCurrency, address(this), bond);
        escrowLiability[inputCurrency] += bond;
        if (params.amountSpecified < 0) {
            uint256 specified = uint256(uint128(-int128(params.amountSpecified)));
            uint256 charged = (specified * bps) / BPS_DENOMINATOR;
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
    /// A donate verdict adjusts the live premium UP, a refund verdict
    /// adjusts it DOWN, and a donate credits in-range LPs inside THIS
    /// transaction whenever the pool has active liquidity (deferring to the
    /// pending bucket only at L = 0, or if the PoolManager is currently
    /// unlocked by someone else).
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
            // The hook already holds the escrowed premium tokens — pay the
            // trader directly. On failure the verdict survives and a pull
            // claim remains.
            trade.outcome = Outcome.RefundPending; // provisional; flipped below on success
            bool ok = _tryTransfer(trade.bondCurrency, trade.trader, trade.bondAmount);
            if (ok) {
                trade.outcome = Outcome.Refunded;
                escrowLiability[trade.bondCurrency] -= trade.bondAmount;
                _adjustPremium(poolId, false);
                emit Settled(tradeId, uint8(trade.outcome), int24(avgTick), trade.bondAmount);
                emit RefundClaimed(tradeId, trade.trader, trade.bondAmount);
                return;
            }
            _adjustPremium(poolId, false);
            emit Settled(tradeId, uint8(trade.outcome), int24(avgTick), trade.bondAmount);
            emit RefundDeliveryFailed(tradeId, trade.trader, trade.bondAmount);
        } else {
            trade.outcome = Outcome.Donated;
            pendingDonation[poolId][trade.bondCurrency == trade.key.currency0 ? 0 : 1] += trade.bondAmount;
            _adjustPremium(poolId, true);
            emit Settled(tradeId, uint8(trade.outcome), int24(avgTick), trade.bondAmount);
            _creditLpsIfPossible(poolId);
        }
    }

    /// @dev Live premium stepper. Only settle outcomes move it: raising the
    /// rate requires actually donating real premia to LPs, so the grief is
    /// self-funding for the pool. Pokes, mints, and gifts cannot touch it.
    function _adjustPremium(PoolId poolId, bool donate) internal {
        uint16 from = premiumBps[poolId];
        uint16 to = donate
            ? from + PREMIUM_UP_BPS > PREMIUM_MAX_BPS ? PREMIUM_MAX_BPS : from + PREMIUM_UP_BPS
            : from <= PREMIUM_MIN_BPS + PREMIUM_DOWN_BPS ? PREMIUM_MIN_BPS : from - PREMIUM_DOWN_BPS;
        if (to != from) {
            premiumBps[poolId] = to;
            emit PremiumAdjusted(PoolId.unwrap(poolId), from, to, donate);
        }
    }

    /// @dev Credit in-range LPs now if the pool has liquidity and the
    /// PoolManager is free; otherwise leave the value in the pending bucket
    /// for the already-tested permissionless flush. The verdict is already
    /// terminal when this runs, so a revert here must never unwind it.
    function _creditLpsIfPossible(PoolId poolId) internal {
        if (pendingDonation[poolId][0] == 0 && pendingDonation[poolId][1] == 0) return;
        if (poolManager.getLiquidity(poolId) == 0) return;
        try this.flushDonation(poolId) {} catch {}
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

    /// @notice Donate accumulated premium value to the pool's in-range LPs.
    /// Permissionless once the pool has active liquidity; while liquidity is
    /// zero the donation stays deferred (settle still succeeded) and can be
    /// flushed after liquidity returns. Settle's donate path invokes this
    /// automatically whenever it can.
    function flushDonation(PoolId poolId) public {
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

    /// @notice Exact premium the next swap on this pool charges for a given
    /// input amount: `premiumBps` bps of the realized input, floored. A
    /// result of 0 means the swap would revert with `SwapTooSmall` — the
    /// clamp keeps that unreachable above dust.
    function premiumQuoteFor(PoolId poolId, uint256 amountIn) external view returns (uint256) {
        return (amountIn * premiumBps[poolId]) / BPS_DENOMINATOR;
    }

    // ---------------------------------------------------------------------------
    // Batch lane — opt-in 24 s epochs on the same clock, uniform TWAP clears
    // ---------------------------------------------------------------------------

    /// @notice The epoch a timestamp falls in. Epochs are aligned 24 s
    /// windows: [epoch·T, (epoch+1)·T) — the same T the oracle uses.
    function epochOf(uint256 timestamp) public pure returns (uint256) {
        return timestamp / SETTLEMENT_DELAY;
    }

    /// @notice Enqueue an order for the CURRENT epoch. Custody is explicit:
    /// the full `amountIn` of the sell-side currency is transferred into the
    /// hook and held until the epoch clears (or the order is cancelled
    /// before then). No router required — any token holder may enqueue.
    function placeBatchOrder(PoolKey calldata key, bool zeroForOne, uint256 amountIn) external returns (uint256 index) {
        PoolId poolId = key.toId();
        if (!_isRegistered(poolId, key)) revert PoolNotRegistered();
        if (amountIn == 0) revert SwapTooSmall();
        uint256 epoch = epochOf(block.timestamp);
        if (batchCleared[poolId][epoch]) revert EpochAlreadyCleared();

        BatchOrder[] storage orders = batchOrders[poolId][epoch];
        if (orders.length >= BATCH_ORDER_CAP) revert OrderCapReached();

        Currency deposit = zeroForOne ? key.currency0 : key.currency1;
        if (deposit.isAddressZero()) revert NativeCurrencyUnsupported();
        _strictTransferFrom(deposit, msg.sender, amountIn);
        batchEscrow[deposit] += amountIn;

        index = orders.length;
        orders.push(BatchOrder({trader: msg.sender, zeroForOne: zeroForOne, amountIn: amountIn}));
        emit BatchOrderPlaced(PoolId.unwrap(poolId), epoch, index, msg.sender, zeroForOne, amountIn);
    }

    /// @notice Cancel an unexecuted order any time BEFORE its epoch is
    /// cleared. Returns the full deposit.
    function cancelBatchOrder(PoolId poolId, uint256 epoch, uint256 index) external {
        if (batchCleared[poolId][epoch]) revert EpochAlreadyCleared();
        BatchOrder[] storage orders = batchOrders[poolId][epoch];
        if (index >= orders.length) revert UnknownOrder();
        BatchOrder memory order = orders[index];
        if (order.trader != msg.sender) revert NotOrderOwner();

        PoolKey storage key = poolKeys[poolId];
        Currency deposit = order.zeroForOne ? key.currency0 : key.currency1;
        delete orders[index]; // clears trader; owner check above already passed
        batchEscrow[deposit] -= order.amountIn;
        deposit.transfer(msg.sender, order.amountIn);

        emit BatchOrderCancelled(PoolId.unwrap(poolId), epoch, index);
    }

    /// @notice Clear a finished epoch. Permissionless; the clearing price is
    /// the epoch's accumulator TWAP (immutable — clearing later changes
    /// nothing), opposing orders net, and the residual is ONE normal bonded
    /// spot swap through this hook's own lane. Every order on a side fills
    /// at the SAME rate, never worse than the TWAP; execution spread and
    /// rounding dust stay with the hook (bounded by the clear event's dust
    /// fields). A lone order in an empty epoch is a one-epoch TWAP fill.
    struct Netting {
        int24 avgTick;
        uint256 netBuy0;
        uint256 netSell1;
        uint256 twapRateBuy; // Q96: out1 per in0 at the clearing tick
        uint256 twapRateSell; // Q96: out0 per in1
        uint256 q96;
    }

    function clearBatch(PoolKey calldata key, uint256 epoch) external {
        PoolId poolId = key.toId();
        if (!_isRegistered(poolId, key)) revert PoolNotRegistered();
        if (batchCleared[poolId][epoch]) revert EpochAlreadyCleared();
        uint256 epochEnd = (epoch + 1) * SETTLEMENT_DELAY;
        if (block.timestamp < epochEnd) revert EpochNotElapsed(epochEnd, block.timestamp);
        batchCleared[poolId][epoch] = true; // effects before interactions

        BatchOrder[] storage orders = batchOrders[poolId][epoch];
        uint256 buy0; // currency0 deposited by buys (want currency1 out)
        uint256 sell1; // currency1 deposited by sells (want currency0 out)
        for (uint256 i; i < orders.length; ++i) {
            if (orders[i].zeroForOne) buy0 += orders[i].amountIn;
            else sell1 += orders[i].amountIn;
        }

        Netting memory n = _epochNetting(poolId, epoch, buy0, sell1);

        ResidualResult memory rr;
        if (n.netBuy0 > 0 || n.netSell1 > 0) {
            // The residual router runs its own unlock — the hook must not
            // hold the PoolManager lock across it (AlreadyUnlocked).
            rr = _runResidual(poolId, n.netBuy0, n.netSell1);
        }

        (uint256 buyRate, uint256 sellRate) = _uniformRates(n, buy0, sell1, rr);
        (uint256 paid0, uint256 paid1) = _payoutEpoch(poolId, epoch, buyRate, sellRate, n.q96);

        // Dust = custody this epoch left after payouts: execution spread the
        // clamped rates did not pass on, Q96 rounding, and the residual's
        // premium mechanics. Released from the batch liability; clamping
        // guarantees non-negative, guarded anyway — a clear must never
        // revert on accounting.
        PoolKey storage pkey = poolKeys[poolId];
        int256 rawDust0 = int256(buy0 + rr.received0) - int256(rr.spent0) - int256(paid0);
        int256 rawDust1 = int256(sell1 + rr.received1) - int256(rr.spent1) - int256(paid1);
        uint256 dust0 = rawDust0 > 0 ? uint256(rawDust0) : 0;
        uint256 dust1 = rawDust1 > 0 ? uint256(rawDust1) : 0;
        if (dust0 > 0) batchEscrow[pkey.currency0] -= dust0;
        if (dust1 > 0) batchEscrow[pkey.currency1] -= dust1;

        delete batchOrders[poolId][epoch];

        emit BatchCleared(
            PoolId.unwrap(poolId), epoch, n.avgTick, buyRate, sellRate, n.netBuy0, n.netSell1, dust0, dust1
        );
    }

    /// @dev Clearing tick (the epoch TWAP from the append-only accumulator),
    /// Q96 TWAP rates, and the netting residual. Split out of clearBatch so
    /// the stack fits under `forge coverage --ir-minimum` instrumentation.
    function _epochNetting(PoolId poolId, uint256 epoch, uint256 buy0, uint256 sell1)
        internal
        view
        returns (Netting memory n)
    {
        uint256 t0 = epoch * SETTLEMENT_DELAY;
        uint256 t1 = t0 + SETTLEMENT_DELAY;
        int56 c0 = cumulativeAt(poolId, uint32(t0));
        int56 c1 = cumulativeAt(poolId, uint32(t1));
        int256 avgTick = (int256(c1) - int256(c0)) / int256(SETTLEMENT_DELAY);
        if (avgTick < int256(int24(type(int24).min)) || avgTick > int256(int24(type(int24).max))) {
            revert TickOutOfBounds();
        }
        n.avgTick = int24(avgTick);
        uint160 sqrtP = TickMath.getSqrtPriceAtTick(n.avgTick);
        uint256 Q96 = 1 << 96;
        uint256 Q192 = 1 << 192;
        uint256 sp2 = uint256(sqrtP) * uint256(sqrtP); // widen BEFORE multiplying: uint160*uint160 overflows
        n.q96 = Q96;
        n.twapRateBuy = FullMath.mulDiv(sqrtP, sqrtP, Q96); // out1 per in0
        n.twapRateSell = FullMath.mulDiv(Q96, Q192, sp2); // out0 per in1 = Q96/price

        // Net at the TWAP. Equal opposing sizes net exactly; the residual is
        // one bonded swap.
        uint256 sell0Equiv = sell1 == 0 ? 0 : FullMath.mulDiv(sell1, Q192, sp2);
        uint256 buy1Equiv = buy0 == 0 ? 0 : FullMath.mulDiv(buy0, sp2, Q192);
        n.netBuy0 = buy0 > sell0Equiv ? buy0 - sell0Equiv : 0;
        n.netSell1 = sell1 > buy1Equiv ? sell1 - buy1Equiv : 0;
    }

    /// @dev Uniform per-side rates: the TWAP clamped by what was actually
    /// available after the residual executed — the hook never subsidizes a
    /// fill above realizable value, and every order on a side gets the SAME
    /// rate. Netting absorbs execution when sides match; one-sided epochs
    /// pay the realized execution. Leftovers stay as dust.
    function _uniformRates(Netting memory n, uint256 buy0, uint256 sell1, ResidualResult memory rr)
        internal
        pure
        returns (uint256 buyRate, uint256 sellRate)
    {
        buyRate = n.twapRateBuy;
        sellRate = n.twapRateSell;
        if (buy0 > 0) {
            uint256 available1 = sell1 + rr.received1 - n.netSell1;
            uint256 realizedBuy = FullMath.mulDiv(available1, n.q96, buy0);
            if (realizedBuy < buyRate) buyRate = realizedBuy;
        }
        if (sell1 > 0) {
            uint256 available0 = buy0 + rr.received0 - n.netBuy0;
            uint256 realizedSell = FullMath.mulDiv(available0, n.q96, sell1);
            if (realizedSell < sellRate) sellRate = realizedSell;
        }
    }

    /// @dev Pay every live order on its side at the uniform rate from batch
    /// custody; returns totals paid per currency for the dust computation.
    function _payoutEpoch(PoolId poolId, uint256 epoch, uint256 buyRate, uint256 sellRate, uint256 q96)
        internal
        returns (uint256 paid0, uint256 paid1)
    {
        PoolKey storage pkey = poolKeys[poolId];
        BatchOrder[] storage orders = batchOrders[poolId][epoch];
        for (uint256 i; i < orders.length; ++i) {
            BatchOrder memory o = orders[i];
            if (o.trader == address(0)) continue; // cancelled slot
            if (o.zeroForOne) {
                uint256 out1 = FullMath.mulDiv(o.amountIn, buyRate, q96);
                pkey.currency1.transfer(o.trader, out1);
                batchEscrow[pkey.currency1] -= out1;
                paid1 += out1;
            } else {
                uint256 out0 = FullMath.mulDiv(o.amountIn, sellRate, q96);
                pkey.currency0.transfer(o.trader, out0);
                batchEscrow[pkey.currency0] -= out0;
                paid0 += out0;
            }
        }
    }

    struct ResidualResult {
        uint256 received0;
        uint256 received1;
        uint256 spent0;
        uint256 spent1;
    }

    /// @notice Preview the current epoch: netting at the spot-projected
    /// TWAP, order count, and seconds left (chain time). UI use.
    function batchPreview(PoolId poolId)
        external
        view
        returns (uint256 epoch, uint256 epochEndsAt, uint256 orderCount, uint256 buy0, uint256 sell1)
    {
        epoch = epochOf(block.timestamp);
        epochEndsAt = (epoch + 1) * SETTLEMENT_DELAY;
        BatchOrder[] storage orders = batchOrders[poolId][epoch];
        for (uint256 i; i < orders.length; ++i) {
            if (orders[i].zeroForOne) buy0 += orders[i].amountIn;
            else sell1 += orders[i].amountIn;
        }
        orderCount = orders.length;
    }

    /// @dev Execute the epoch residual as one bonded spot swap with the hook
    /// itself through a minimal immutable child router — v4-core's hook
    /// dispatchers skip beforeSwap/afterSwap on self-calls, so a direct
    /// hook-as-caller swap would dodge the premium lane entirely (banned).
    /// The router is an ordinary external caller: the quoted premium is
    /// charged, a bonded trade is recorded with the hook as beneficiary
    /// (refunds return to the batch pot), and outputs land in custody.
    /// Escrow accounting uses MEASURED balance deltas around the residual —
    /// truth over sign-convention algebra.
    function _runResidual(PoolId poolId, uint256 netBuy0, uint256 netSell1)
        internal
        returns (ResidualResult memory rr)
    {
        PoolKey storage key = poolKeys[poolId];
        bool zeroForOne = netBuy0 > 0;
        uint256 amount = zeroForOne ? netBuy0 : netSell1;

        Currency inC = zeroForOne ? key.currency0 : key.currency1;
        Currency outC = zeroForOne ? key.currency1 : key.currency0;
        uint256 balInBefore = CurrencyLibrary.balanceOfSelf(inC);
        uint256 balOutBefore = CurrencyLibrary.balanceOfSelf(outC);

        _ensureRouterAllowance(inC, amount);
        (uint256 received0, uint256 received1) = residualRouter.exec(key, zeroForOne, amount, address(this));

        uint256 spentIn = balInBefore - CurrencyLibrary.balanceOfSelf(inC);
        batchEscrow[inC] -= spentIn;
        uint256 gotOut = CurrencyLibrary.balanceOfSelf(outC) - balOutBefore;
        batchEscrow[outC] += gotOut;
        if (zeroForOne) {
            require(received0 == 0 && gotOut == received1, "residual accounting mismatch");
            rr.received1 = received1;
            rr.spent0 = spentIn;
        } else {
            require(received1 == 0 && gotOut == received0, "residual accounting mismatch");
            rr.received0 = received0;
            rr.spent1 = spentIn;
        }
    }

    function _isRegistered(PoolId poolId, PoolKey calldata key) internal view returns (bool) {
        PoolKey storage stored = poolKeys[poolId];
        return stored.currency0 == key.currency0 && stored.currency1 == key.currency1 && stored.fee == key.fee
            && stored.tickSpacing == key.tickSpacing && stored.hooks == key.hooks;
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
