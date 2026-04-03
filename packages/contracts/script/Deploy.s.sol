// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CrowdfundFactory.sol";
import "./HelperConfig.s.sol";

contract Deploy is Script {
    
    function run () external returns (CrowdfundFactory factory, HelperConfig config) {
        
        // 1. Spin up the helper — detects chain automatically
        config = new HelperConfig();
        HelperConfig.NetworkConfig memory networkConfig = config.getConfig();

        console.log("===========================================");
        console.log("Deploying to:", networkConfig.chainName);
        console.log("===========================================");

        // 2. Everything inside startBroadcast/stopBroadcast
        //    gets signed and sent as a real transaction
        vm.startBroadcast(networkConfig.deployerKey);

        factory = new CrowdfundFactory();

        vm.stopBroadcast();

        // 3. Log results — visible in terminal after deploy
        console.log("CrowdfundFactory deployed at:", address(factory));
        console.log("Deployer:                    ", vm.addr(networkConfig.deployerKey));

        return (factory, config);
    }
}