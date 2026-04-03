// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Campaign.sol";


contract CrowdfundFactory {

    address[] public campaigns;

    // Map creator → their campaign addresses
    // One creator can have multiple campaigns
    mapping(address => address[]) public campaignsByCreator;

    // This is the event your Node backend will index
    // It contains everything needed to reconstruct campaign data off-chain
    event CampaignCreated(
        address indexed campaignAddress,
        address indexed creator,
        string title,
        uint256 goal,
        uint256 deadline,
        uint256 timestamp
    );

    // ─── Errors ───────────────────────────────────────────────
    error DeadlineMustBeInFuture();
    error GoalMustBeGreaterThanZero();
    error TitleCannotBeEmpty();

    /**
     * @notice Deploy a new Campaign contract
     * @param _title        Campaign title
     * @param _description  Campaign description
     * @param _goal         Funding goal in wei
     * @param _deadline     Unix timestamp for when contributions close
     * @return campaignAddress The address of the newly deployed campaign
     */
    function createCampaign(
        string calldata _title,
        string calldata _description,
        uint256 _goal,
        uint256 _deadline
    ) external returns (address campaignAddress) {

        // ── Checks ──────────────────────────────────────────
        if (bytes(_title).length == 0)      revert TitleCannotBeEmpty();
        if (_goal == 0)                     revert GoalMustBeGreaterThanZero();
        if (_deadline <= block.timestamp)   revert DeadlineMustBeInFuture();

        // ── Effects + Interactions ───────────────────────────
        // Deploy a new Campaign, passing msg.sender as the creator
        // This is why Campaign uses _creator param, not msg.sender
        Campaign campaign = new Campaign(
            msg.sender,
            _title,
            _description,
            _goal,
            _deadline
        );

        campaignAddress = address(campaign);

        // Record it in our registry
        campaigns.push(campaignAddress);
        campaignsByCreator[msg.sender].push(campaignAddress);

        // Emit event — your backend listens for this
        emit CampaignCreated(
            campaignAddress,
            msg.sender,
            _title,
            _goal,
            _deadline,
            block.timestamp
        );
    }

    // ─── View Functions ───────────────────────────────────────

    /**
     * @notice Get all campaign addresses ever created
     */
    function getCampaigns() external view returns (address[] memory) {
        return campaigns;
    }

    /**
     * @notice Get all campaigns created by a specific address
     */
    function getCampaignsByCreator(
        address _creator
    ) external view returns (address[] memory) {
        return campaignsByCreator[_creator];
    }

    /**
     * @notice Total number of campaigns created
     */
    function getCampaignCount() external view returns (uint256) {
        return campaigns.length;
    }
}