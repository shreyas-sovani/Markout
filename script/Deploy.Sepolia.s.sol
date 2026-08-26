// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {HookMiner} from "../test/shared/HookMiner.sol";
import {PositionManager} from "@uniswap/v4-periphery/src/PositionManager.sol";
import {Actions} from "@uniswap/v4-periphery/src/libraries/Actions.sol";
import {IAllowanceTransfer} from "@uniswap/v4-periphery/lib/permit2/src/interfaces/IAllowanceTransfer.sol";

import {MarkoutHook} from "../src/MarkoutHook.sol";
import {MarkoutRouter} from "../src/MarkoutRouter.sol";
import {FaucetToken} from "../src/FaucetToken.sol";

/// @notice Deploys the hardened Markout stack against the CANONICAL Sepolia
/// v4 deployment: capped faucet demo tokens, CREATE2-mined hook, hardened
/// router (locked into the hook), canonical-periphery PositionManager +
/// Permit2 allowances, pool initialization, and full-range liquidity seed.
contract DeploySepolia is Script {
    using CurrencyLibrary for Currency;

    // Canonical Sepolia deployment + shared infra.
    IPoolManager internal constant CANONICAL_PM = IPoolManager(0xE03A1074c86CFeDd5C142C4F04F1a1536e203543);
    IAllowanceTransfer internal constant PERMIT2 = IAllowanceTransfer(0x000000000022D473030F116dDEE9F6B43aC78BA3);
    address internal constant WETH9 = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
    address internal constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;
    // Officially deployed canonical periphery (docs.uniswap.org v4 deployments).
    PositionManager internal constant CANONICAL_POSMGR =
        PositionManager(payable(0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4));

    uint160 internal constant SQRT_PRICE_1_1 = 79228162514264337593543950336;
    uint24 internal constant FEE = 300; // 3 bps
    int24 internal constant TICK_SPACING = 60;
    uint256 internal constant LP_LIQUIDITY = 10e18;
    uint256 internal constant OPERATOR_MINT = 1_000e18;

    function run() public {
        uint256 pk = vm.envUint("ACC3_PRIV_KEY");
        vm.startBroadcast(pk);

        // 1. Capped faucet demo tokens — no blacklist, no tax, capped supply,
        //    no direct mints into the PoolManager.
        FaucetToken tokenA = new FaucetToken("Markout Demo A", "MDA", 10_000_000e18, 100_000e18, address(CANONICAL_PM));
        FaucetToken tokenB = new FaucetToken("Markout Demo B", "MDB", 10_000_000e18, 100_000e18, address(CANONICAL_PM));
        (FaucetToken token0, FaucetToken token1) =
            address(tokenA) < address(tokenB) ? (tokenA, tokenB) : (tokenB, tokenA);

        // 2. Hook with the full v4 flag set (init + swap + delta-return hooks).
        (address predictedHook, bytes32 minedSalt) = HookMiner.find(
            CREATE2_DEPLOYER,
            uint160(
                Hooks.BEFORE_INITIALIZE_FLAG | Hooks.AFTER_INITIALIZE_FLAG | Hooks.BEFORE_SWAP_FLAG
                    | Hooks.AFTER_SWAP_FLAG | Hooks.BEFORE_SWAP_RETURNS_DELTA_FLAG | Hooks.AFTER_SWAP_RETURNS_DELTA_FLAG
            ),
            type(MarkoutHook).creationCode,
            abi.encode(address(CANONICAL_PM))
        );
        MarkoutHook hook = new MarkoutHook{salt: minedSalt}(CANONICAL_PM);
        require(address(hook) == predictedHook, "hook landed at wrong address");

        // 3. Convenience router (NOT a gate — the bond rides the swap delta).
        MarkoutRouter router = new MarkoutRouter(CANONICAL_PM);

        // 4. Officially deployed canonical periphery PositionManager for seeding.
        PositionManager posMgr = CANONICAL_POSMGR;

        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(address(token0)),
            currency1: Currency.wrap(address(token1)),
            fee: FEE,
            tickSpacing: TICK_SPACING,
            hooks: IHooks(address(hook))
        });

        // 5. Initialize + seed through canonical periphery (Permit2-funded).
        posMgr.initializePool(key, SQRT_PRICE_1_1);

        token0.mint(msg.sender, 200e18);
        token1.mint(msg.sender, 200e18);
        token0.approve(address(PERMIT2), type(uint256).max);
        token1.approve(address(PERMIT2), type(uint256).max);
        PERMIT2.approve(address(token0), address(posMgr), type(uint160).max, type(uint48).max);
        PERMIT2.approve(address(token1), address(posMgr), type(uint160).max, type(uint48).max);

        bytes memory actions = abi.encodePacked(uint8(Actions.MINT_POSITION), uint8(Actions.SETTLE_PAIR));
        bytes[] memory params = new bytes[](2);
        params[0] = abi.encode(
            key,
            TickMath.minUsableTick(TICK_SPACING),
            TickMath.maxUsableTick(TICK_SPACING),
            LP_LIQUIDITY,
            100e18, // amount0Max
            100e18, // amount1Max
            msg.sender,
            new bytes(0)
        );
        params[1] = abi.encode(key.currency0, key.currency1);
        posMgr.modifyLiquidities(abi.encode(actions, params), block.timestamp + 1_000);

        // 6. Demo float for the operator EOA (proof runs, faucet for judges
        //    happens through the token's own permissionless capped mint).
        token0.mint(msg.sender, OPERATOR_MINT);
        token1.mint(msg.sender, OPERATOR_MINT);
        vm.stopBroadcast();

        console2.log("token0:", address(token0));
        console2.log("token1:", address(token1));
        console2.log("hook:", address(hook));
        console2.log("router:", address(router));
        console2.log("positionManager:", address(posMgr));
        console2.log("operator:", msg.sender);
    }
}
