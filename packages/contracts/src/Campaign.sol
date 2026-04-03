// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Campaign is ReentrancyGuard {
    // ─── State ────────────────────────────────────────────────
    address public immutable creator;
    string  public title;
    string  public description;
    uint256 public immutable goal;        // in wei
    uint256 public immutable deadline;    // unix timestamp
    uint256 public totalRaised;
    bool    public withdrawn;

    mapping(address => uint256) public contributions;

    // ─── Events ───────────────────────────────────────────────
    // Events are how your Node backend will "hear" what happened on-chain
    event Contributed(address indexed contributor, uint256 amount);
    event Withdrawn(address indexed creator, uint256 amount);
    event Refunded(address indexed contributor, uint256 amount);

    // ─── Errors ───────────────────────────────────────────────
    // Custom errors are cheaper than require() strings (less gas)
    error DeadlinePassed();
    error DeadlineNotReached();
    error GoalNotMet();
    error GoalAlreadyMet();
    error AlreadyWithdrawn();
    error NoContribution();
    error NotCreator();
    error TransferFailed();

    // ─── Constructor ──────────────────────────────────────────
    constructor(
        address _creator,
        string memory _title,
        string memory _description,
        uint256 _goal,
        uint256 _deadline
    ) {
        // The factory will pass the creator in — not msg.sender
        // because msg.sender here would be the factory contract itself
        creator     = _creator;
        title       = _title;
        description = _description;
        goal        = _goal;
        deadline    = _deadline;
    }

    // ─── Modifiers ────────────────────────────────────────────
    modifier onlyCreator() {
        if (msg.sender != creator) revert NotCreator();
        _;
    }

    modifier beforeDeadline() {
        if (block.timestamp >= deadline) revert DeadlinePassed();
        _;
    }

    modifier afterDeadline() {
        if (block.timestamp < deadline) revert DeadlineNotReached();
        _;
    }

    // ─── Core Functions ───────────────────────────────────────

    /**
     * @notice Contribute ETH to this campaign
     * @dev Only callable before the deadline
     */
    function contribute() external payable beforeDeadline {
        if (msg.value == 0) revert NoContribution();

        contributions[msg.sender] += msg.value;
        totalRaised += msg.value;

        emit Contributed(msg.sender, msg.value);
    }

    /**
     * @notice Creator withdraws funds if goal was met
     * @dev Only callable after deadline, only if goal met, only once
     */
    function withdraw() external onlyCreator afterDeadline nonReentrant {
        if (totalRaised < goal)  revert GoalNotMet();
        if (withdrawn)           revert AlreadyWithdrawn();

        withdrawn = true; // set BEFORE transfer → Checks-Effects-Interactions

        uint256 amount = totalRaised;

        (bool success, ) = creator.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit Withdrawn(creator, amount);
    }

    /**
     * @notice Contributor claims refund if goal was NOT met
     * @dev Only callable after deadline, only if goal not met
     */
    function refund() external afterDeadline nonReentrant {
        if (totalRaised >= goal) revert GoalAlreadyMet();

        uint256 amount = contributions[msg.sender];
        if (amount == 0) revert NoContribution();

        contributions[msg.sender] = 0; // zero out BEFORE transfer → CEI pattern

        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit Refunded(msg.sender, amount);
    }

    // ─── View Functions ───────────────────────────────────────

    function isSuccessful() external view returns (bool) {
        return block.timestamp >= deadline && totalRaised >= goal;
    }

    function isFailed() external view returns (bool) {
        return block.timestamp >= deadline && totalRaised < goal;
    }

    function timeLeft() external view returns (uint256) {
        if (block.timestamp >= deadline) return 0;
        return deadline - block.timestamp;
    }
}