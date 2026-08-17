// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";

import {MarkoutEngine} from "../src/MarkoutEngine.sol";

contract MarkoutEngineTest is Test {
    // 1.0 in Q64.96
    uint160 internal constant ONE = 79228162514264337593543950336;

    function test_upMove_reverts_refunds() public view {
        uint256 sqrtPre = ONE;
        uint256 sqrtPost = ONE * 102 / 100; // +4% price move up (2% on sqrt)
        uint256 sqrtT = ONE * 101 / 100; // came back down > 5 bps
        assertTrue(MarkoutEngine.decide(sqrtPre, sqrtPost, sqrtT), "expected refund");
    }

    function test_upMove_sustains_donates() public view {
        uint256 sqrtPre = ONE;
        uint256 sqrtPost = ONE * 102 / 100;
        assertTrue(!MarkoutEngine.decide(sqrtPre, sqrtPost, sqrtPost), "expected donate when sustained");
        assertTrue(!MarkoutEngine.decide(sqrtPre, sqrtPost, ONE * 103 / 100), "expected donate when drifting");
    }

    function test_downMove_reverts_refunds() public view {
        uint256 sqrtPre = ONE;
        uint256 sqrtPost = ONE * 98 / 100;
        uint256 sqrtT = ONE * 99 / 100;
        assertTrue(MarkoutEngine.decide(sqrtPre, sqrtPost, sqrtT), "expected refund");
    }

    function test_downMove_sustains_donates() public view {
        uint256 sqrtPre = ONE;
        uint256 sqrtPost = ONE * 98 / 100;
        assertTrue(!MarkoutEngine.decide(sqrtPre, sqrtPost, sqrtPost), "expected donate when sustained");
    }

    /// Price-space boundary: 4 bps of reversion still donates, 6 bps refunds.
    function test_thresholdBoundary() public view {
        uint256 sqrtPre = ONE;
        uint256 sqrtPost = ONE * 2; // price x4
        uint256 pricePost = sqrtPost * sqrtPost;

        // 4 bps reversion toward pre: not "more than 5 bps" -> donate.
        uint256 priceT4 = pricePost * 9996 / 10000;
        assertTrue(!MarkoutEngine.decide(sqrtPre, sqrtPost, _sqrt(priceT4)), "4 bps should donate");

        // 6 bps reversion toward pre: more than 5 bps -> refund.
        uint256 priceT6 = pricePost * 9994 / 10000;
        assertTrue(MarkoutEngine.decide(sqrtPre, sqrtPost, _sqrt(priceT6)), "6 bps should refund");
    }

    function _sqrt(uint256 x) internal pure returns (uint256 y) {
        y = x;
        uint256 z = (x + 1) / 2;
        while (z < y) {
            y = z;
            z = (x / y + y) / 2;
        }
    }

    function test_zeroImpact_donates() public view {
        assertTrue(!MarkoutEngine.decide(ONE, ONE, ONE), "no impact swap sustains: donate");
    }
}
