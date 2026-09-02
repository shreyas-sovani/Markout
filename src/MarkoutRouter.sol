// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {BalanceDelta, BalanceDeltaLibrary} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IUnlockCallback} from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {TransientStateLibrary} from "@uniswap/v4-core/src/libraries/TransientStateLibrary.sol";

/// @title MarkoutRouter — a convenience router for Markout pools.
/// @notice NOT a gate: the live premium is charged through the swap caller's
/// own PoolManager delta by the hook itself, so any router that can settle a
/// normal v4 swap (Universal Router, PoolSwapTest, a custom integrator) can
/// pay it. This contract just adds the protections a serious frontend wants:
/// a deadline, exact-in minimum output, exact-out maximum input (including
/// the hook's live premium — not this contract's BOND_BPS constant), safe
/// token handling, native support, and declaration of the human beneficiary
/// in hookData so refunds route to the end user.
/// `BOND_BPS` is the genesis default (20). The charge is `hook.premiumBps`.
contract MarkoutRouter is IUnlockCallback {
    using TransientStateLibrary for IPoolManager;
    using CurrencyLibrary for Currency;
    using BalanceDeltaLibrary for BalanceDelta;

    error DeadlineExpired(uint256 deadline, uint256 now);
    error TooLittleOut(uint256 amountOut, uint256 minAmountOut);
    error TooMuchIn(uint256 amountIn, uint256 amountInMax);
    error TransferFromFailed();
    error NotPoolManager();

    /// Genesis default only. Unused in `swap` — the hook quotes and charges live.
    uint256 public constant BOND_BPS = 20;
    uint256 public constant BPS_DENOMINATOR = 10_000;

    IPoolManager public immutable manager;

    constructor(IPoolManager _manager) {
        manager = _manager;
    }

    struct CallbackData {
        address sender;
        PoolKey key;
        IPoolManager.SwapParams params;
        uint256 limit; // minAmountOut for exact-in, amountInMax for exact-out
    }

    /// @notice Swap through a Markout pool.
    /// @param limit   Exact-in: minimum realized output. Exact-out: maximum
    ///                total input spend including the hook's live premium.
    /// @param deadline Latest block timestamp the swap may execute at.
    function swap(PoolKey calldata key, IPoolManager.SwapParams calldata params, uint256 limit, uint256 deadline)
        external
        payable
        returns (BalanceDelta delta)
    {
        if (block.timestamp > deadline) revert DeadlineExpired(deadline, block.timestamp);
        delta = abi.decode(manager.unlock(abi.encode(CallbackData(msg.sender, key, params, limit))), (BalanceDelta));

        // Return unused native value (native input swaps may overfund).
        uint256 leftover = address(this).balance;
        if (leftover > 0) CurrencyLibrary.ADDRESS_ZERO.transfer(msg.sender, leftover);
    }

    function unlockCallback(bytes calldata rawData) external override returns (bytes memory) {
        if (msg.sender != address(manager)) revert NotPoolManager();
        CallbackData memory data = abi.decode(rawData, (CallbackData));

        // Declare the paying beneficiary for the hook's refunds.
        BalanceDelta delta = manager.swap(data.key, data.params, abi.encode(data.sender));

        bool exactIn = data.params.amountSpecified < 0;
        uint256 amountOut =
            data.params.zeroForOne ? uint256(uint128(-delta.amount1())) : uint256(uint128(-delta.amount0()));
        if (exactIn) {
            if (amountOut < data.limit) revert TooLittleOut(amountOut, data.limit);
        } else {
            // Exact-out: the caller's input delta includes amountIn plus the
            // bond charged by the hook via its returned delta.
            uint256 amountIn =
                data.params.zeroForOne ? uint256(uint128(-delta.amount0())) : uint256(uint128(-delta.amount1()));
            if (amountIn > data.limit) revert TooMuchIn(amountIn, data.limit);
        }

        // Settle the router's own delta — which already contains the bond.
        _settleDelta(data.key.currency0, data.sender);
        _settleDelta(data.key.currency1, data.sender);

        return abi.encode(delta);
    }

    function _settleDelta(Currency currency, address payer) internal {
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
