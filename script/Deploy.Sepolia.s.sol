// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolManager} from "@uniswap/v4-core/src/PoolManager.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {PoolModifyLiquidityTest} from "@uniswap/v4-core/src/test/PoolModifyLiquidityTest.sol";
import {HookMiner} from "@uniswap/v4-periphery/test/shared/HookMiner.sol";

import {MarkoutHook} from "../src/MarkoutHook.sol";
import {MarkoutRouter} from "../src/MarkoutRouter.sol";
import {MockERC20} from "../test/mocks/MockERC20.sol";

/// @notice Deploys the Markout stack to Sepolia: two demo tokens, PoolManager,
/// LP helper, MarkoutHook (CREATE2-mined permission address), MarkoutRouter,
/// then initializes the 3 bps pool at 1:1 and seeds full-range liquidity.
contract DeploySepolia is Script {
    using CurrencyLibrary for Currency;

    address internal constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

    uint160 internal constant SQRT_PRICE_1_1 = 79228162514264337593543950336;
    uint24 internal constant FEE = 300; // 3 bps
    int24 internal constant TICK_SPACING = 60;
    uint128 internal constant LP_LIQUIDITY = 10e18; // 10 tokens per side at 1:1
    uint256 internal constant MINT_AMOUNT = 100e18;

    function run() public {
        uint256 pk = vm.envUint("ACC3_PRIV_KEY");
        vm.startBroadcast(pk);

        MockERC20 tokenA = new MockERC20();
        MockERC20 tokenB = new MockERC20();
        (Currency currency0, Currency currency1) = address(tokenA) < address(tokenB)
            ? (Currency.wrap(address(tokenA)), Currency.wrap(address(tokenB)))
            : (Currency.wrap(address(tokenB)), Currency.wrap(address(tokenA)));

        PoolManager manager = new PoolManager(msg.sender);
        PoolModifyLiquidityTest lpRouter = new PoolModifyLiquidityTest(IPoolManager(address(manager)));

        (address predictedHook, bytes32 minedSalt) = HookMiner.find(
            CREATE2_DEPLOYER,
            uint160(Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG),
            type(MarkoutHook).creationCode,
            abi.encode(address(manager))
        );

        MarkoutHook hook = new MarkoutHook{salt: minedSalt}(IPoolManager(address(manager)));
        require(address(hook) == predictedHook, "hook landed at wrong address");

        MarkoutRouter router = new MarkoutRouter(IPoolManager(address(manager)), address(hook));

        PoolKey memory key = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: FEE,
            tickSpacing: TICK_SPACING,
            hooks: IHooks(address(hook))
        });
        manager.initialize(key, SQRT_PRICE_1_1);

        // Seed liquidity: mint to the EOA, approve the LP helper (it pulls via
        // transferFrom and settles), add a full-range position.
        MockERC20(Currency.unwrap(currency0)).mint(msg.sender, MINT_AMOUNT);
        MockERC20(Currency.unwrap(currency1)).mint(msg.sender, MINT_AMOUNT);
        MockERC20(Currency.unwrap(currency0)).approve(address(lpRouter), type(uint256).max);
        MockERC20(Currency.unwrap(currency1)).approve(address(lpRouter), type(uint256).max);
        lpRouter.modifyLiquidity(
            key,
            IPoolManager.ModifyLiquidityParams({
                tickLower: TickMath.minUsableTick(TICK_SPACING),
                tickUpper: TickMath.maxUsableTick(TICK_SPACING),
                liquidityDelta: int256(uint256(LP_LIQUIDITY)),
                salt: bytes32(0)
            }),
            new bytes(0)
        );

        vm.stopBroadcast();

        console2.log("token0:", Currency.unwrap(currency0));
        console2.log("token1:", Currency.unwrap(currency1));
        console2.log("poolManager:", address(manager));
        console2.log("lpRouter:", address(lpRouter));
        console2.log("hook:", address(hook));
        console2.log("router:", address(router));
    }
}
