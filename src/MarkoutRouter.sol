// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {BalanceDelta, BalanceDeltaLibrary} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IUnlockCallback} from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {TransientStateLibrary} from "@uniswap/v4-core/src/libraries/TransientStateLibrary.sol";

/// @title MarkoutRouter — the trusted integration boundary for Markout pools.
/// @notice Executes a swap through the hooked pool, enforces a deadline and
/// minimum output, settles the swapper's own deltas, then pays the hook's
/// bond escrow debt with `settleFor` — the step generic routers omit, which
/// is why the hook only accepts swaps routed through this contract. The
/// router itself always encodes the paying beneficiary (`msg.sender`) into
/// hookData; callers cannot declare anyone else.
contract MarkoutRouter is IUnlockCallback {
    using TransientStateLibrary for IPoolManager;
    using CurrencyLibrary for Currency;
    using BalanceDeltaLibrary for BalanceDelta;

    error DeadlineExpired(uint256 deadline, uint256 now);
    error TooLittleOut(uint256 amountOut, uint256 minAmountOut);
    error TransferFromFailed();

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
        uint256 minAmountOut;
    }

    /// @notice Swap through a Markout pool.
    /// @param deadline    Latest block timestamp the swap may execute at.
    /// @param minAmountOut Minimum realized output (token1 for zeroForOne
    ///                     exact-in, token0 otherwise; exact-out swaps should
    ///                     pass the specified output).
    function swap(PoolKey calldata key, IPoolManager.SwapParams calldata params, uint256 minAmountOut, uint256 deadline)
        external
        payable
        returns (BalanceDelta delta)
    {
        if (block.timestamp > deadline) revert DeadlineExpired(deadline, block.timestamp);
        delta =
            abi.decode(manager.unlock(abi.encode(CallbackData(msg.sender, key, params, minAmountOut))), (BalanceDelta));

        // Return unused native value (native input swaps may overfund).
        uint256 leftover = address(this).balance;
        if (leftover > 0) CurrencyLibrary.ADDRESS_ZERO.transfer(msg.sender, leftover);
    }

    function unlockCallback(bytes calldata rawData) external override returns (bytes memory) {
        if (msg.sender != address(manager)) revert NotPoolManager();
        CallbackData memory data = abi.decode(rawData, (CallbackData));

        // The router is the only party that may declare the beneficiary, and
        // it always declares its own payer.
        BalanceDelta delta = manager.swap(data.key, data.params, abi.encode(data.sender));

        // Enforce slippage before any settlement work.
        bool exactIn = data.params.amountSpecified < 0;
        uint256 amountOut =
            data.params.zeroForOne ? uint256(uint128(-delta.amount1())) : uint256(uint128(-delta.amount0()));
        if (exactIn && amountOut < data.minAmountOut) revert TooLittleOut(amountOut, data.minAmountOut);

        // Settle the router's own deltas, then the hook's bond debt.
        _settleRouterDelta(data.key.currency0, data.sender);
        _settleRouterDelta(data.key.currency1, data.sender);
        _settleHookDelta(data.key.currency0, data.sender);
        _settleHookDelta(data.key.currency1, data.sender);

        return abi.encode(delta);
    }

    error NotPoolManager();

    function _settleRouterDelta(Currency currency, address payer) internal {
        int256 delta = manager.currencyDelta(address(this), currency);
        if (delta < 0) {
            uint256 amount = uint256(-delta);
            if (currency.isAddressZero()) {
                manager.settle{value: amount}();
            } else {
                manager.sync(currency);
                _strictTransferFrom(currency, payer, address(manager), amount);
                manager.settle();
            }
        } else if (delta > 0) {
            manager.take(currency, payer, uint256(delta));
        }
    }

    function _settleHookDelta(Currency currency, address payer) internal {
        int256 delta = manager.currencyDelta(hook, currency);
        if (delta < 0) {
            uint256 amount = uint256(-delta);
            if (currency.isAddressZero()) {
                manager.settleFor{value: amount}(hook);
            } else {
                manager.sync(currency);
                _strictTransferFrom(currency, payer, address(manager), amount);
                manager.settleFor(hook);
            }
        }
    }

    /// @dev transferFrom with a strict success check (no-revert AND
    /// empty-or-true returndata). Hostile/ERC20-nonstandard tokens revert
    /// here instead of silently failing settlement.
    function _strictTransferFrom(Currency currency, address from, address to, uint256 amount) internal {
        bool ok;
        bytes memory data = abi.encodeWithSelector(0x23b872dd, from, to, amount); // transferFrom(address,address,uint256)
        // solhint-disable-next-line no-inline-assembly
        assembly {
            ok := call(gas(), currency, 0, add(data, 32), mload(data), 0, 32)
            if ok {
                switch returndatasize()
                case 0 {}
                default { ok := and(eq(returndatasize(), 32), eq(mload(0), 1)) }
            }
        }
        if (!ok) revert TransferFromFailed();
    }
}
