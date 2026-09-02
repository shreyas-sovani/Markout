// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IUnlockCallback} from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {TransientStateLibrary} from "@uniswap/v4-core/src/libraries/TransientStateLibrary.sol";

/// @title Markout batch-lane residual router.
/// @notice v4-core's Hooks dispatchers skip beforeSwap/afterSwap whenever
/// the swap caller IS the hook (`msg.sender == address(self)` self-call
/// guard). A hook therefore cannot push its batch residual through its own
/// premium lane directly — and a privileged premium-free residual is
/// explicitly banned. This immutable, hook-owned child contract is the
/// honest bridge: it executes exactly one swap per clearBatch as an
/// ordinary external caller, so the full hook lane applies — the quoted
/// premium is charged, a bonded trade is recorded, and the classifier will
/// adjudicate it like any other swap. The hook is declared as the
/// beneficiary (refunds return to the batch pot). Only the hook can call
/// `exec`; this is plumbing, not an allowlist — anyone else still swaps
/// through any router they like, and this contract exposes no other path.
contract MarkoutBatchRouter is IUnlockCallback {
    using CurrencyLibrary for Currency;
    using TransientStateLibrary for IPoolManager;

    IPoolManager public immutable manager;
    address public immutable owner; // the MarkoutHook

    error NotHook();
    error PullFailed();

    /// @dev Strict ERC-20 pull from the hook's custody into the PoolManager.
    function _pullFromHook(Currency currency, uint256 amount) internal {
        bytes memory data = abi.encodeWithSelector(0x23b872dd, owner, address(manager), amount); // transferFrom(address,address,uint256)
        bool ok;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            ok := call(gas(), currency, 0, add(data, 32), mload(data), 0, 32)
            if ok {
                switch returndatasize()
                case 0 {}
                default { ok := and(eq(returndatasize(), 32), or(eq(mload(0), 1), iszero(mload(0)))) }
            }
        }
        if (!ok) revert PullFailed();
    }

    constructor(IPoolManager manager_) {
        manager = manager_;
        owner = msg.sender;
    }

    struct Exec {
        PoolKey key;
        bool zeroForOne;
        uint256 amount;
        address beneficiary;
    }

    /// @notice Execute one bonded residual swap funded by the hook's batch
    /// custody; outputs are taken straight to the hook. Returns the
    /// received (out-token) amounts for uniform-rate math.
    function exec(PoolKey calldata key, bool zeroForOne, uint256 amount, address beneficiary)
        external
        returns (uint256 received0, uint256 received1)
    {
        if (msg.sender != owner) revert NotHook();
        bytes memory ret = manager.unlock(
            abi.encode(Exec({key: key, zeroForOne: zeroForOne, amount: amount, beneficiary: beneficiary}))
        );
        return abi.decode(ret, (uint256, uint256));
    }

    function unlockCallback(bytes calldata data) external override returns (bytes memory) {
        if (msg.sender != address(manager)) revert NotHook();
        Exec memory e = abi.decode(data, (Exec));

        BalanceDelta delta = manager.swap(
            e.key,
            IPoolManager.SwapParams({
                zeroForOne: e.zeroForOne,
                amountSpecified: -int256(e.amount),
                sqrtPriceLimitX96: e.zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1
            }),
            abi.encode(e.beneficiary) // 32-byte nonzero declaration: refunds route to the hook's pot
        );

        int256 d0 = manager.currencyDelta(address(this), e.key.currency0);
        int256 d1 = manager.currencyDelta(address(this), e.key.currency1);
        uint256 received0;
        uint256 received1;
        if (d0 < 0) {
            // Input side: pull the owed amount (input + premium) from the
            // hook's batch custody and settle it into the PoolManager.
            manager.sync(e.key.currency0);
            _pullFromHook(e.key.currency0, uint256(-d0));
            manager.settle();
        } else if (d0 > 0) {
            manager.take(e.key.currency0, owner, uint256(d0));
            received0 = uint256(d0);
        }
        if (d1 < 0) {
            manager.sync(e.key.currency1);
            _pullFromHook(e.key.currency1, uint256(-d1));
            manager.settle();
        } else if (d1 > 0) {
            manager.take(e.key.currency1, owner, uint256(d1));
            received1 = uint256(d1);
        }
        return abi.encode(received0, received1);
    }
}
