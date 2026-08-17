// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {AbstractCallback} from "reactive-lib/src/abstract-base/AbstractCallback.sol";

import {MarkoutHook} from "./MarkoutHook.sol";

/// @title MarkoutExecutor — destination-chain settlement endpoint (Sepolia).
/// @notice Receives Reactive Network callbacks and forwards settlement to the
/// hook. The first parameter of `settleMarkout` is `address rvm_id`: the
/// network overwrites the first 160 bits of the payload with the calling RVM
/// ID, which `rvmIdOnly` verifies against the authorized deployer.
contract MarkoutExecutor is AbstractCallback {
    /// @dev Sepolia Callback Proxy — only it may deliver callbacks.
    address private constant SEPOLIA_CALLBACK_PROXY = 0xc9f36411C9897e7F959D99ffca2a0Ba7ee0D7bDA;

    MarkoutHook public immutable hook;

    error UnexpectedCaller(address caller);

    constructor(address _callbackProxy, address _hook) AbstractCallback(_callbackProxy) {
        hook = MarkoutHook(_hook);
    }

    /// @param rvm_id RVM ID injected by the Reactive Network (was address(0)).
    /// @param tradeId The bonded trade to settle.
    function settleMarkout(address rvm_id, bytes32 tradeId) external rvmIdOnly(rvm_id) {
        if (msg.sender != SEPOLIA_CALLBACK_PROXY) revert UnexpectedCaller(msg.sender);
        hook.settle(tradeId);
    }

    receive() external payable override {}
}
