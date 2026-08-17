// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {AbstractReactive} from "reactive-lib/src/abstract-base/AbstractReactive.sol";
import {IReactive} from "reactive-lib/src/interfaces/IReactive.sol";
import {ISystemContract} from "reactive-lib/src/interfaces/ISystemContract.sol";

/// @title MarkoutReactive — Reactive Smart Contract (deployed on Reactive Lasna).
/// @notice Listens for `SwapBonded` events on Sepolia and for the Lasna
/// `Cron1` heartbeat. Each bonded trade ages 3 Cron1 ticks (~21 s); the RSC
/// then emits a `Callback` that settles the trade on the Sepolia executor.
contract MarkoutReactive is AbstractReactive {
    // Chains
    uint256 private constant SEPOLIA_CHAIN_ID = 11155111;
    uint256 private constant LASNA_CHAIN_ID = 5318007;

    // topic_0 of MarkoutHook.SwapBonded(bytes32,address,uint160,uint160,uint256)
    uint256 private constant SWAP_BONDED_TOPIC = 0x0d39a536aa19156d3df8b040edbfea1a971c7c4f0ce06729f3af7e589d7e6a14;

    // Lasna system contract Cron1 topic, emitted every block (~7 s).
    uint256 private constant CRON1_TOPIC = 0xf02d6ea5c22a71cffe930a4523fcb4f129be6c804db50e4202fb4e0b07ccb514;

    // Settlement window: 3 Cron1 ticks ≈ 21 s.
    uint64 public constant SETTLEMENT_TICKS = 3;

    // Callback gas limit for the destination tx on Sepolia (RN minimum 100k).
    uint64 private constant CALLBACK_GAS_LIMIT = 1_000_000;

    address private immutable executor;

    struct Pending {
        bytes32 tradeId;
        uint64 birthTick;
    }

    uint64 public tick;
    Pending[] private queue;
    mapping(bytes32 => bool) private queued;

    constructor(address hook, address _executor) payable {
        executor = _executor;

        if (!vm) {
            // Listen for bonds emitted by the hook on Sepolia.
            service.subscribe(
                SEPOLIA_CHAIN_ID, hook, SWAP_BONDED_TOPIC, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE
            );
            // Time passes: subscribe to the Lasna system contract cron heartbeat.
            service.subscribe(
                LASNA_CHAIN_ID, address(SERVICE_ADDR), CRON1_TOPIC, REACTIVE_IGNORE, REACTIVE_IGNORE, REACTIVE_IGNORE
            );
        }
    }

    function react(LogRecord calldata log) external vmOnly {
        if (log.topic_0 == SWAP_BONDED_TOPIC) {
            bytes32 tradeId = bytes32(log.topic_1);
            if (!queued[tradeId]) {
                queued[tradeId] = true;
                queue.push(Pending({tradeId: tradeId, birthTick: tick}));
            }
        } else if (log.topic_0 == CRON1_TOPIC) {
            tick++;
            _settleAged();
        }
    }

    function _settleAged() private {
        uint256 length = queue.length;
        uint256 writeIndex;
        for (uint256 i; i < length; ++i) {
            Pending memory pending = queue[i];
            if (tick - pending.birthTick >= SETTLEMENT_TICKS) {
                // First payload argument must be address(0): the Reactive
                // Network overwrites the first 160 bits with the RVM ID.
                bytes memory payload =
                    abi.encodeWithSignature("settleMarkout(address,bytes32)", address(0), pending.tradeId);
                emit Callback(SEPOLIA_CHAIN_ID, executor, CALLBACK_GAS_LIMIT, payload);
            } else {
                if (writeIndex != i) queue[writeIndex] = pending;
                ++writeIndex;
            }
        }
        // Truncate the compacted queue.
        while (queue.length > writeIndex) queue.pop();
    }

    function queueLength() external view returns (uint256) {
        return queue.length;
    }
}
