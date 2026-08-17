// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {BalanceDelta, BalanceDeltaLibrary} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IUnlockCallback} from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {IERC20Minimal} from "@uniswap/v4-core/src/interfaces/external/IERC20Minimal.sol";
import {TransientStateLibrary} from "@uniswap/v4-core/src/libraries/TransientStateLibrary.sol";

/// @title MarkoutRouter — reference router for Markout pools.
/// @notice Executes a swap, settles the swapper's own deltas, then pays the
/// hook's bond escrow debt with `settleFor`. Router integrators must reproduce
/// this last step or the swap reverts with CurrencyNotSettled.
contract MarkoutRouter is IUnlockCallback {
    using TransientStateLibrary for IPoolManager;
    using CurrencyLibrary for Currency;

    IPoolManager public immutable manager;
    address public immutable hook;

    constructor(IPoolManager _manager, address _hook) {
        manager = _manager;
        hook = _hook;
    }

    struct CallbackData {
        address sender;
        PoolKey key;
        IPoolManager.SwapParams params;
        bytes hookData;
    }

    function swap(PoolKey calldata key, IPoolManager.SwapParams calldata params, bytes calldata hookData)
        external
        payable
        returns (BalanceDelta delta)
    {
        delta = abi.decode(manager.unlock(abi.encode(CallbackData(msg.sender, key, params, hookData))), (BalanceDelta));

        uint256 ethBalance = address(this).balance;
        if (ethBalance > 0) CurrencyLibrary.ADDRESS_ZERO.transfer(msg.sender, ethBalance);
    }

    function unlockCallback(bytes calldata rawData) external override returns (bytes memory) {
        require(msg.sender == address(manager));
        CallbackData memory data = abi.decode(rawData, (CallbackData));

        // Carry the human trader inside hookData so the hook can bond, receipt,
        // and refund the end user rather than this router.
        bytes memory hookData = data.hookData.length == 0 ? abi.encode(data.sender) : data.hookData;
        BalanceDelta delta = manager.swap(data.key, data.params, hookData);

        // The router is the account the swap deltas accrue to (it called
        // manager.swap). Pull tokens from the swapper and settle on behalf of
        // the router; route any credits back out to the swapper.
        _settleRouterDelta(data.key.currency0, data.sender);
        _settleRouterDelta(data.key.currency1, data.sender);

        // Then cover the hook's bond escrow debt for both currencies. The
        // swapper pays the bond here, exactly as a quoting router would.
        _settleHookDelta(data.key.currency0, data.sender);
        _settleHookDelta(data.key.currency1, data.sender);

        return abi.encode(delta);
    }

    function _settleRouterDelta(Currency currency, address payer) internal {
        int256 delta = manager.currencyDelta(address(this), currency);
        if (delta < 0) {
            manager.sync(currency);
            IERC20Minimal(Currency.unwrap(currency)).transferFrom(payer, address(manager), uint256(-delta));
            manager.settle();
        } else if (delta > 0) {
            manager.take(currency, payer, uint256(delta));
        }
    }

    function _settleHookDelta(Currency currency, address payer) internal {
        int256 delta = manager.currencyDelta(hook, currency);
        if (delta < 0) {
            manager.sync(currency);
            IERC20Minimal(Currency.unwrap(currency)).transferFrom(payer, address(manager), uint256(-delta));
            manager.settleFor(hook);
        }
    }
}
