// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {AbstractReactive} from "reactive-lib/src/abstract-base/AbstractReactive.sol";

/// @dev Diagnostic RSC: forwards every SwapBonded straight to a callback with
/// no cron aging. If the executor receives settleMarkout from this contract,
/// the Reactive dispatch pipeline works and the 3-tick aging in
/// MarkoutReactive is the suspect; if nothing arrives, dispatch itself is
/// broken (subscription/status/funding layer).
contract InstantSettleReactive is AbstractReactive {
    uint256 private constant SEPLOIA = 11155111;
    uint256 private constant SWAP_BONDED_TOPIC = 0x0d39a536aa19156d3df8b040edbfea1a971c7c4f0ce06729f3af7e589d7e6a14;
    uint64 private constant GAS = 1_000_000;

    address private immutable executor;

    constructor(address hook, address _executor) payable {
        executor = _executor;
        if (!vm) {
            service.subscribe(SEPLOIA, hook, SWAP_BONDED_TOPIC, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE);
        }
    }

    function react(LogRecord calldata log) external override vmOnly {
        if (log.topic_0 != SWAP_BONDED_TOPIC) return;
        bytes memory payload = abi.encodeWithSignature("settleMarkout(address,bytes32)", address(0), bytes32(log.topic_1));
        emit Callback(SEPLOIA, executor, GAS, payload);
    }
}
