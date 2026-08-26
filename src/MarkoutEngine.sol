// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title Normalized mean-reversion classifier.
/// @notice Classifies a bonded swap by how much of its *own* price impact
/// reverted over the fixed settlement window, measured in tick space
/// (log price). This makes the verdict scale-free: a 2-tick trade and a
/// 2000-tick trade are judged by the same 50% reversion frontier instead of
/// an absolute bps band that large trades blow through and tiny trades
/// never reach.
library MarkoutEngine {
    /// @notice A trade refunds when at least REVERSION_NUM / REVERSION_DEN of
    /// its original impact has reverted by the end of the window.
    int256 public constant REVERSION_NUM = 1;
    int256 public constant REVERSION_DEN = 2;

    /// @notice Decides the bond outcome for a trade.
    /// @param pre       Pool tick immediately before the swap.
    /// @param post      Pool tick immediately after the swap.
    /// @param windowAvg Time-weighted average tick over the trade's immutable
    ///                   [bondTime, settleAfter] window.
    /// @return refund True (Refund) when at least half of the signed impact
    ///                `post - pre` has reverted, i.e. the window average sits
    ///                at least halfway back toward `pre` (overshoot past
    ///                `pre` also refunds). Zero-impact trades refund. Movement
    ///                away from `pre` donates.
    function decide(int24 pre, int24 post, int24 windowAvg) internal pure returns (bool refund) {
        int256 impact = int256(post) - int256(pre);
        if (impact == 0) return true;
        int256 residual = int256(windowAvg) - int256(pre);
        // Refund iff residual * REVERSION_DEN <= impact * REVERSION_NUM,
        // orientation-aware: for negative impact the comparison flips.
        return impact > 0
            ? residual * REVERSION_DEN <= impact * REVERSION_NUM
            : residual * REVERSION_DEN >= impact * REVERSION_NUM;
    }

    /// @notice Reversion as a signed fraction of the original impact, in bps.
    /// @return bps of impact reverted: 10_000 = fully reverted, >10_000 =
    ///         overshoot past pre, <0 = moved further away, 0 impact = 10_000.
    function reversionBps(int24 pre, int24 post, int24 windowAvg) internal pure returns (int256) {
        int256 impact = int256(post) - int256(pre);
        if (impact == 0) return 10_000;
        int256 residual = int256(windowAvg) - int256(pre);
        return (impact - residual) * 10_000 / impact;
    }
}
