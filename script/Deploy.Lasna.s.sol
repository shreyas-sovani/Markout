// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {MarkoutReactive} from "../src/MarkoutReactive.sol";

/// @notice Deploys the Markout RSC to Reactive Lasna. The constructor
/// subscribes to the hook's SwapBonded on Sepolia and to the Lasna Cron1
/// heartbeat (guarded by the built-in `!vm` check). Requires the Sepolia hook
/// and executor addresses as env vars.
///
/// IMPORTANT: `forge script` CANNOT deploy this — local simulation executes
/// the Lasna system contract off-node, whose internal subscription precompile
/// (0x64) only works with node-side state, so the simulation always reverts
/// with a generic "Failure" even though the real tx succeeds. Deploy with
/// `forge create`, which executes the constructor on the actual node:
///
///   forge create src/MarkoutReactive.sol:MarkoutReactive \
///     --rpc-url https://lasna-rpc.rnk.dev/ \
///     --private-key $ACC3_PRIV_KEY \
///     --broadcast --value 0.01ether \
///     --constructor-args $SEPOLIA_HOOK $SEPOLIA_EXECUTOR
///
/// After deployment, fund the RSC via the system contract:
///
///   cast send 0x0000000000000000000000000000000000fffFfF \
///     "depositTo(address)" $RSC_ADDR --value 0.5ether \
///     --rpc-url https://lasna-rpc.rnk.dev/ --private-key $ACC3_PRIV_KEY
contract DeployLasna is Script {
    function run() public {
        uint256 pk = vm.envUint("ACC3_PRIV_KEY");
        address hook = vm.envAddress("SEPOLIA_HOOK");
        address executor = vm.envAddress("SEPOLIA_EXECUTOR");

        vm.startBroadcast(pk);
        MarkoutReactive rsc = new MarkoutReactive{value: 0.01 ether}(hook, executor);
        vm.stopBroadcast();

        console2.log("markoutReactive:", address(rsc));
    }
}
