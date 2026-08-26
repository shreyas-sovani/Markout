// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {BalanceDelta, BalanceDeltaLibrary} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";

/// @title BaseHook — minimal abstract hook implementing IHooks with no-ops.
/// @notice v4-periphery v4.0.0 ships no BaseHook, so this reproduces the
/// standard pattern: subclasses override `getHookPermissions` plus the hooks
/// they enable and inherit safe no-op defaults for the rest.
abstract contract BaseHook is IHooks {
    constructor() {
        Hooks.Permissions memory permissions = getHookPermissions();
        address hookAddress = address(this);
        require(
            permissions.beforeInitialize == Hooks.hasPermission(IHooks(hookAddress), Hooks.BEFORE_INITIALIZE_FLAG)
                && permissions.afterInitialize == Hooks.hasPermission(IHooks(hookAddress), Hooks.AFTER_INITIALIZE_FLAG)
                && permissions.beforeAddLiquidity
                    == Hooks.hasPermission(IHooks(hookAddress), Hooks.BEFORE_ADD_LIQUIDITY_FLAG)
                && permissions.afterAddLiquidity
                    == Hooks.hasPermission(IHooks(hookAddress), Hooks.AFTER_ADD_LIQUIDITY_FLAG)
                && permissions.beforeRemoveLiquidity
                    == Hooks.hasPermission(IHooks(hookAddress), Hooks.BEFORE_REMOVE_LIQUIDITY_FLAG)
                && permissions.afterRemoveLiquidity
                    == Hooks.hasPermission(IHooks(hookAddress), Hooks.AFTER_REMOVE_LIQUIDITY_FLAG)
                && permissions.beforeSwap == Hooks.hasPermission(IHooks(hookAddress), Hooks.BEFORE_SWAP_FLAG)
                && permissions.afterSwap == Hooks.hasPermission(IHooks(hookAddress), Hooks.AFTER_SWAP_FLAG)
                && permissions.beforeDonate == Hooks.hasPermission(IHooks(hookAddress), Hooks.BEFORE_DONATE_FLAG)
                && permissions.afterDonate == Hooks.hasPermission(IHooks(hookAddress), Hooks.AFTER_DONATE_FLAG)
                && permissions.beforeSwapReturnDelta
                    == Hooks.hasPermission(IHooks(hookAddress), Hooks.BEFORE_SWAP_RETURNS_DELTA_FLAG)
                && permissions.afterSwapReturnDelta
                    == Hooks.hasPermission(IHooks(hookAddress), Hooks.AFTER_SWAP_RETURNS_DELTA_FLAG)
                && permissions.afterAddLiquidityReturnDelta
                    == Hooks.hasPermission(IHooks(hookAddress), Hooks.AFTER_ADD_LIQUIDITY_RETURNS_DELTA_FLAG)
                && permissions.afterRemoveLiquidityReturnDelta
                    == Hooks.hasPermission(IHooks(hookAddress), Hooks.AFTER_REMOVE_LIQUIDITY_RETURNS_DELTA_FLAG),
            "hook address flags mismatch permissions"
        );
    }

    function getHookPermissions() public view virtual returns (Hooks.Permissions memory);

    function _beforeInitialize(address, PoolKey calldata, uint160) internal virtual returns (bytes4) {
        return IHooks.beforeInitialize.selector;
    }

    function _afterInitialize(address, PoolKey calldata, uint160, int24) internal virtual returns (bytes4) {
        return IHooks.afterInitialize.selector;
    }

    function _beforeAddLiquidity(address, PoolKey calldata, IPoolManager.ModifyLiquidityParams calldata, bytes calldata)
        internal
        virtual
        returns (bytes4)
    {
        return IHooks.beforeAddLiquidity.selector;
    }

    function _afterAddLiquidity(
        address,
        PoolKey calldata,
        IPoolManager.ModifyLiquidityParams calldata,
        BalanceDelta,
        BalanceDelta,
        bytes calldata
    ) internal virtual returns (bytes4, BalanceDelta) {
        return (IHooks.afterAddLiquidity.selector, BalanceDeltaLibrary.ZERO_DELTA);
    }

    function _beforeRemoveLiquidity(
        address,
        PoolKey calldata,
        IPoolManager.ModifyLiquidityParams calldata,
        bytes calldata
    ) internal virtual returns (bytes4) {
        return IHooks.beforeRemoveLiquidity.selector;
    }

    function _afterRemoveLiquidity(
        address,
        PoolKey calldata,
        IPoolManager.ModifyLiquidityParams calldata,
        BalanceDelta,
        BalanceDelta,
        bytes calldata
    ) internal virtual returns (bytes4, BalanceDelta) {
        return (IHooks.afterRemoveLiquidity.selector, BalanceDeltaLibrary.ZERO_DELTA);
    }

    function _beforeSwap(address, PoolKey calldata, IPoolManager.SwapParams calldata, bytes calldata)
        internal
        virtual
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        return (IHooks.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    function _afterSwap(address, PoolKey calldata, IPoolManager.SwapParams calldata, BalanceDelta, bytes calldata)
        internal
        virtual
        returns (bytes4, int128)
    {
        return (IHooks.afterSwap.selector, 0);
    }

    function _beforeDonate(address, PoolKey calldata, uint256, uint256, bytes calldata)
        internal
        virtual
        returns (bytes4)
    {
        return IHooks.beforeDonate.selector;
    }

    function _afterDonate(address, PoolKey calldata, uint256, uint256, bytes calldata)
        internal
        virtual
        returns (bytes4)
    {
        return IHooks.afterDonate.selector;
    }

    function beforeInitialize(address sender, PoolKey calldata key, uint160 sqrtPriceX96)
        external
        virtual
        returns (bytes4)
    {
        return _beforeInitialize(sender, key, sqrtPriceX96);
    }

    function afterInitialize(address sender, PoolKey calldata key, uint160 sqrtPriceX96, int24 tick)
        external
        virtual
        returns (bytes4)
    {
        return _afterInitialize(sender, key, sqrtPriceX96, tick);
    }

    function beforeAddLiquidity(
        address sender,
        PoolKey calldata key,
        IPoolManager.ModifyLiquidityParams calldata params,
        bytes calldata hookData
    ) external virtual returns (bytes4) {
        return _beforeAddLiquidity(sender, key, params, hookData);
    }

    function afterAddLiquidity(
        address sender,
        PoolKey calldata key,
        IPoolManager.ModifyLiquidityParams calldata params,
        BalanceDelta delta,
        BalanceDelta feesAccrued,
        bytes calldata hookData
    ) external virtual returns (bytes4, BalanceDelta) {
        return _afterAddLiquidity(sender, key, params, delta, feesAccrued, hookData);
    }

    function beforeRemoveLiquidity(
        address sender,
        PoolKey calldata key,
        IPoolManager.ModifyLiquidityParams calldata params,
        bytes calldata hookData
    ) external virtual returns (bytes4) {
        return _beforeRemoveLiquidity(sender, key, params, hookData);
    }

    function afterRemoveLiquidity(
        address sender,
        PoolKey calldata key,
        IPoolManager.ModifyLiquidityParams calldata params,
        BalanceDelta delta,
        BalanceDelta feesAccrued,
        bytes calldata hookData
    ) external virtual returns (bytes4, BalanceDelta) {
        return _afterRemoveLiquidity(sender, key, params, delta, feesAccrued, hookData);
    }

    function beforeSwap(
        address sender,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        bytes calldata hookData
    ) external virtual returns (bytes4, BeforeSwapDelta, uint24) {
        return _beforeSwap(sender, key, params, hookData);
    }

    function afterSwap(
        address sender,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata hookData
    ) external virtual returns (bytes4, int128) {
        return _afterSwap(sender, key, params, delta, hookData);
    }

    function beforeDonate(
        address sender,
        PoolKey calldata key,
        uint256 amount0,
        uint256 amount1,
        bytes calldata hookData
    ) external virtual returns (bytes4) {
        return _beforeDonate(sender, key, amount0, amount1, hookData);
    }

    function afterDonate(
        address sender,
        PoolKey calldata key,
        uint256 amount0,
        uint256 amount1,
        bytes calldata hookData
    ) external virtual returns (bytes4) {
        return _afterDonate(sender, key, amount0, amount1, hookData);
    }
}
