// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";

import {MarkoutEngine} from "../src/MarkoutEngine.sol";

contract MarkoutEngineTest is Test {
    // Reference model mirroring the production formula for cross-checks.
    function _reference(int24 pre, int24 post, int24 avg) internal pure returns (bool) {
        int256 impact = int256(post) - int256(pre);
        if (impact == 0) return true;
        int256 residual = int256(avg) - int256(pre);
        return impact > 0 ? residual * 2 <= impact : residual * 2 >= impact;
    }

    // -------------------------------------------------------------------------
    // Zero impact refunds
    // -------------------------------------------------------------------------

    function test_zeroImpact_refunds() public pure {
        assertTrue(MarkoutEngine.decide(100, 100, 100), "zero impact at rest");
        assertTrue(MarkoutEngine.decide(100, 100, -5000), "zero impact, window drifted away");
        assertTrue(MarkoutEngine.decide(100, 100, 9000), "zero impact, window drifted up");
    }

    // -------------------------------------------------------------------------
    // 50% reversion frontier, positive impact (price up)
    // -------------------------------------------------------------------------

    function test_upImpact_frontier() public pure {
        // impact = +10 ticks. residual 5 = exactly 50% reverted => refund.
        assertTrue(MarkoutEngine.decide(0, 10, 5), "exactly 50% reverted must refund");
        // residual 4 = 60% reverted => refund.
        assertTrue(MarkoutEngine.decide(0, 10, 4), "60% reverted refunds");
        // residual 6 = 40% reverted => donate.
        assertFalse(MarkoutEngine.decide(0, 10, 6), "40% reverted donates");
        // residual 10 = 0% reverted => donate.
        assertFalse(MarkoutEngine.decide(0, 10, 10), "no reversion donates");
        // residual 12 = moved further away => donate.
        assertFalse(MarkoutEngine.decide(0, 10, 12), "movement away donates");
    }

    // -------------------------------------------------------------------------
    // 50% reversion frontier, negative impact (price down)
    // -------------------------------------------------------------------------

    function test_downImpact_frontier() public pure {
        // impact = -10. residual -5 = exactly 50% reverted => refund.
        assertTrue(MarkoutEngine.decide(0, -10, -5), "exactly 50% reverted must refund");
        assertTrue(MarkoutEngine.decide(0, -10, -4), "60% reverted refunds");
        assertFalse(MarkoutEngine.decide(0, -10, -6), "40% reverted donates");
        assertFalse(MarkoutEngine.decide(0, -10, -10), "no reversion donates");
        assertFalse(MarkoutEngine.decide(0, -10, -12), "movement away donates");
    }

    // -------------------------------------------------------------------------
    // Overshoot past pre refunds
    // -------------------------------------------------------------------------

    function test_overshoot_refunds() public pure {
        // impact +10, window average swung past pre (negative residual).
        assertTrue(MarkoutEngine.decide(50, 60, -100), "overshoot refunds");
        assertTrue(MarkoutEngine.decide(-50, -60, 100), "down overshoot refunds");
    }

    // -------------------------------------------------------------------------
    // Tiny impacts: fully-reverted 1-tick trades refund
    // -------------------------------------------------------------------------

    function test_tinyImpact_fullReversion_refunds() public pure {
        assertTrue(MarkoutEngine.decide(1000, 1001, 1000), "1-tick impact fully reverted");
        assertFalse(MarkoutEngine.decide(1000, 1001, 1001), "1-tick impact sustained donates");
        assertTrue(MarkoutEngine.decide(1000, 999, 1000), "1-tick down impact fully reverted");
    }

    // -------------------------------------------------------------------------
    // Large trades with 5-6 bps noise stay toxic: the normalized classifier
    // makes a 2000-tick impact need to actually revert ~1000 ticks, not cross
    // an absolute bps band.
    // -------------------------------------------------------------------------

    function test_largeTrade_smallNoise_donates() public pure {
        // impact 2000 ticks (~2000 bps); residual 1994 ticks is only 0.3%
        // reversion — far beyond any 5-6 bps absolute move, still donate.
        assertFalse(MarkoutEngine.decide(0, 2000, 1994), "noise on huge impact must donate");
        // ...but genuine half reversion of the same trade refunds.
        assertTrue(MarkoutEngine.decide(0, 2000, 1000), "half reversion of huge impact refunds");
        assertTrue(MarkoutEngine.decide(0, 2000, 999), "just-over-half reversion refunds");
    }

    // -------------------------------------------------------------------------
    // reversionBps preview helper
    // -------------------------------------------------------------------------

    function test_reversionBps() public pure {
        assertEq(MarkoutEngine.reversionBps(0, 10, 5), 5_000, "50% of impact");
        assertEq(MarkoutEngine.reversionBps(0, 10, 0), 10_000, "fully reverted");
        assertEq(MarkoutEngine.reversionBps(0, 10, 10), 0, "sustained");
        assertEq(MarkoutEngine.reversionBps(0, 10, 12), -2_000, "moved away (negative)");
        assertEq(MarkoutEngine.reversionBps(0, 10, -10), 20_000, "overshoot doubles");
        assertEq(MarkoutEngine.reversionBps(0, 0, 55), 10_000, "zero impact defined as fully reverted");
    }

    // -------------------------------------------------------------------------
    // Fuzz: production formula == reference model, monotone in reversion
    // -------------------------------------------------------------------------

    function testFuzz_decide_matchesReference(int24 pre, int24 post, int24 avg) public pure {
        assertEq(MarkoutEngine.decide(pre, post, avg), _reference(pre, post, avg));
    }

    function testFuzz_refundSetMonotoneTowardPre(int24 pre, int256 impact, int256 residual) public {
        impact = bound(impact, -1_000_000, 1_000_000);
        if (impact == 0) impact = 1;
        residual = bound(residual, -1_000_000, 1_000_000);
        int256 post = int256(pre) + impact;
        int256 avg = int256(pre) + residual;
        vm.assume(post >= int256(int24(type(int24).min)) && post <= int256(int24(type(int24).max)));
        vm.assume(avg >= int256(int24(type(int24).min)) && avg <= int256(int24(type(int24).max)));
        bool atResidual = MarkoutEngine.decide(pre, int24(post), int24(avg));
        // Moving the residual one more full tick toward pre must not turn a
        // refund into a donate.
        int256 closer = residual > 0 ? residual - 1 : residual + 1;
        vm.assume(closer >= int256(int24(type(int24).min)) && closer <= int256(int24(type(int24).max)));
        assertTrue(
            !atResidual || MarkoutEngine.decide(pre, int24(post), int24(int256(pre) + closer)),
            "more reversion must not lose the refund"
        );
    }
}
