// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

contract HelperConfig is Script {

    // ─── Network Config Struct ────────────────────────────────
    // Add any chain-specific config here as the project grows
    // e.g. price feeds, USDC address, bridge addresses etc.

    struct NetworkConfig {
        uint256 deployerKey;   // private key to deploy with
        string  rpcUrl;        // RPC endpoint
        string  chainName;     // human readable name (for logging)
    }

    // ─── Chain IDs ────────────────────────────────────────────
    uint256 constant ANVIL_CHAIN_ID   = 31337;
    uint256 constant SEPOLIA_CHAIN_ID = 11155111;
    uint256 constant BASE_CHAIN_ID    = 8453;
    uint256 constant BASE_SEPOLIA_ID  = 84532;

    // ─── Anvil Default Key ────────────────────────────────────
    // This is Anvil's first default private key — public knowledge,
    // safe to hardcode since it only works on local anvil instances
    uint256 constant ANVIL_DEFAULT_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    NetworkConfig public activeConfig;

    constructor() {
        if (block.chainid == ANVIL_CHAIN_ID) {
            activeConfig = getAnvilConfig();
        } else if (block.chainid == SEPOLIA_CHAIN_ID) {
            activeConfig = getSepoliaConfig();
        } else if (block.chainid == BASE_SEPOLIA_ID) {
            activeConfig = getBaseSepoliaConfig();
        } else if (block.chainid == BASE_CHAIN_ID) {
            activeConfig = getBaseConfig();
        } else {
            revert(string.concat(
                "HelperConfig: unsupported chain ID ",
                vm.toString(block.chainid)
            ));
        }
    }


    function getAnvilConfig() internal pure returns (NetworkConfig memory) {
        return NetworkConfig({
            deployerKey: ANVIL_DEFAULT_KEY,
            rpcUrl:      "http://127.0.0.1:8545",
            chainName:   "Anvil (local)"
        });
    }

    function getSepoliaConfig() internal view returns (NetworkConfig memory) {
        return NetworkConfig({
            // vm.envUint reads from your .env file
            deployerKey: vm.envUint("PRIVATE_KEY"),
            rpcUrl:      vm.envString("SEPOLIA_RPC_URL"),
            chainName:   "Sepolia"
        });
    }

    function getBaseSepoliaConfig() internal view returns (NetworkConfig memory) {
        return NetworkConfig({
            deployerKey: vm.envUint("PRIVATE_KEY"),
            rpcUrl:      vm.envString("BASE_SEPOLIA_RPC_URL"),
            chainName:   "Base Sepolia"
        });
    }

    function getBaseConfig() internal view returns (NetworkConfig memory) {
        return NetworkConfig({
            deployerKey: vm.envUint("PRIVATE_KEY"),
            rpcUrl:      vm.envString("BASE_RPC_URL"),
            chainName:   "Base Mainnet"
        });
    }

    function getConfig() external view returns (NetworkConfig memory) {
        return activeConfig;
    }

}