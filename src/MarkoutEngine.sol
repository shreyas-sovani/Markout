// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {FullMath} from "@uniswap/v4-core/src/libraries/FullMath.sol";

/// @title Mean-Reversion Oracle math.
/// @notice Classifies a settled swap as benign (Refund) or toxic (Donate) by
/// comparing where the pool price at settlement window T sits relative to the
/// pre-swap and post-swap prices. All comparisons happen in full-price space
/// (ratios of squared sqrtPriceX96), expressed as Q128.128 fixed point.
library MarkoutEngine {
    /// @dev Price-space threshold, in bps, that separates "reverted" from "sustained".
    uint256 public constant REVERSION_BPS = 5;
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 private constant FIXED_POINT = 1 << 128;

    /// @notice Decides the bond outcome for a trade.
    /// @param sqrtPre  Pool sqrtPriceX96 immediately before the swap.
    /// @param sqrtPost Pool sqrtPriceX96 immediately after the swap.
    /// @param sqrtT    Pool sqrtPriceX96 observed at settlement window T.
    /// @return refund True when the price reverted toward sqrtPre by more than
    ///                REVERSION_BPS (benign flow): refund the bond. False when
    ///                the price sustained or drifted further (toxic flow):
    ///                donate the bond to the pool.
    function decide(uint256 sqrtPre, uint256 sqrtPost, uint256 sqrtT) internal pure returns (bool refund) {
        // Price ratio P_T / P_post in Q128.128, built from the sqrt prices
        // without ever squaring a raw sqrtPriceX96 into overflow:
        // (sqrtT / sqrtPost)^2 via one fixed-point division each.
        uint256 ratioSqrt = FullMath.mulDiv(sqrtT, FIXED_POINT, sqrtPost);
        uint256 ratioPrice = FullMath.mulDiv(ratioSqrt, ratioSqrt, FIXED_POINT);

        if (sqrtPre < sqrtPost) {
            // Price moved up on the swap; benign means it came back down by
            // strictly more than REVERSION_BPS.
            uint256 revertedThreshold = FullMath.mulDiv(BPS_DENOMINATOR - REVERSION_BPS, FIXED_POINT, BPS_DENOMINATOR);
            refund = ratioPrice < revertedThreshold;
        } else {
            // Price moved down (or did not move); benign means it came back up
            // by strictly more than REVERSION_BPS.
            uint256 revertedThreshold = FullMath.mulDiv(BPS_DENOMINATOR + REVERSION_BPS, FIXED_POINT, BPS_DENOMINATOR);
            refund = ratioPrice > revertedThreshold;
        }
    }
}
