// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {MarkoutRouter} from "../src/MarkoutRouter.sol";

/// @dev Runs the live demo swap against a Sepolia fork using the real deployed
/// contracts, pranking the real operator EOA (which holds tokens + approvals).
contract ForkDemoTest is Test {
    address constant EOA = 0xFeAf5C921996FC53f4DEf35e181E766e6D74690A;
    address constant ROUTER = 0x63634289880D5ab9D74f43FA7Dc196c1F0605989;
    address constant T0 = 0x91C7d1f821B30B76e6E47fE51243B75fb2F5938e;
    address constant T1 = 0x144ABA252550ea7fbe7c487B8d153815097a1f15;
    address constant HOOK = 0x1DB65c7efD46a7d663d05C7Bc61Bb88f116000c0;

    function setUp() public {
        vm.createSelectFork("https://ethereum-sepolia-rpc.publicnode.com");
    }





    function test_liveSwap() public {
        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(T1), // 0x144A < 0x91C7 — deployed pool ordering
            currency1: Currency.wrap(T0),
            fee: 300,
            tickSpacing: 60,
            hooks: IHooks(HOOK)
        });

        vm.startPrank(EOA);
        BalanceDelta delta = MarkoutRouter(ROUTER).swap(
            key,
            IPoolManager.SwapParams({
                zeroForOne: true,
                amountSpecified: -1e18,
                sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            new bytes(0)
        );
        vm.stopPrank();
        emit log_int(delta.amount0());
        emit log_int(delta.amount1());
    }
}
