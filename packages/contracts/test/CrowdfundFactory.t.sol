// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CrowdfundFactory.sol";
import "../src/Campaign.sol";

contract CrowdfundFactoryTest is Test {

    // ─── Contracts ────────────────────────────────────────────
    CrowdfundFactory factory;

    // ─── Actors ───────────────────────────────────────────────
    address creator     = makeAddr("creator");
    address contributor1 = makeAddr("contributor1");
    address contributor2 = makeAddr("contributor2");
    address randomUser  = makeAddr("randomUser");

    // ─── Campaign Params ──────────────────────────────────────
    string  constant TITLE       = "Build a school in Lagos";
    string  constant DESCRIPTION = "Help us fund a new school";
    uint256 constant GOAL        = 5 ether;
    uint256 constant DURATION    = 7 days;
    uint256 deployTime; // we'll capture block.timestamp at setup


    // ─── Setup ────────────────────────────────────────────────
    // setUp() runs before EVERY test function automatically
    function setUp() public {
        deployTime = block.timestamp;

        factory = new CrowdfundFactory();

        // Fund our test actors with ETH
        vm.deal(creator,      10 ether);
        vm.deal(contributor1, 10 ether);
        vm.deal(contributor2, 10 ether);
        vm.deal(randomUser,   10 ether);
    }

    // ─── Helpers ──────────────────────────────────────────────
    // DRY: reusable function to deploy a campaign in tests
    function _createCampaign() internal returns (Campaign) {
        vm.prank(creator);
        address addr = factory.createCampaign(
            TITLE,
            DESCRIPTION,
            GOAL,
            block.timestamp + DURATION
        );
        return Campaign(addr);
    }

    // ══════════════════════════════════════════════════════════
    // FACTORY TESTS
    // ══════════════════════════════════════════════════════════
    function test_create_campaign_success() public {
        vm.prank(creator);

        address campaignAddr = factory.createCampaign(
            TITLE,
            DESCRIPTION,
            GOAL,
            block.timestamp + DURATION
        );

        //Campaign address should be non zero
        assertTrue(campaignAddr != address(0));

        // Factory should have recorded it
        assertEq(factory.getCampaignCount(), 1);

        // Factory should have recorded it
        assertEq(factory.getCampaigns()[0], campaignAddr);
    }

    function test_create_campaign_emit_events() public {
       uint256 deadline = block.timestamp + DURATION;

        // vm.expectEmit checks the event is emitted
        // (true, true, false, true) = check topic1, topic2, skip topic3, check data
       vm.expectEmit(false, true, false, true);


        // This is the event we EXPECT to see emitted
        // We don't know the campaign address yet so we compute it
        // For simplicity we'll just check the creator and goal
        emit CrowdfundFactory.CampaignCreated(
            address(0), // we'll skip address check here
            creator,
            TITLE,
            GOAL,
            deadline,
            block.timestamp
        );

        vm.prank(creator);
        factory.createCampaign(TITLE, DESCRIPTION, GOAL, deadline);
    }

    function test_CreateCampaign_Reverts_EmptyTitle() public {
        vm.prank(creator);
        vm.expectRevert(CrowdfundFactory.TitleCannotBeEmpty.selector);
        factory.createCampaign("", DESCRIPTION, GOAL, block.timestamp + DURATION);
    }

    function test_CreateCampaign_Reverts_ZeroGoal() public {
        vm.prank(creator);
        vm.expectRevert(CrowdfundFactory.GoalMustBeGreaterThanZero.selector);
        factory.createCampaign(TITLE, DESCRIPTION, 0, block.timestamp + DURATION);
    }

    function test_CreateCampaign_Reverts_PastDeadline() public {
        vm.prank(creator);
        vm.expectRevert(CrowdfundFactory.DeadlineMustBeInFuture.selector);
        // Pass a deadline in the past
        factory.createCampaign(TITLE, DESCRIPTION, GOAL, block.timestamp - 1);
    }

    // ══════════════════════════════════════════════════════════
    // CONTRIBUTION TESTS
    // ══════════════════════════════════════════════════════════
    function test_contribbute_success() public {
        Campaign campaign = _createCampaign();
        vm.prank(contributor1);
        campaign.contribute{value: 2 ether}();

        // Check state updated correctly
        assertEq(campaign.totalRaised(), 2 ether);
        assertEq(campaign.contributions(contributor1), 2 ether);
        assertEq(address(campaign).balance, 2 ether);
    }

    function test_contribbute_multiple_contributors() public {
        Campaign campaign = _createCampaign();

        vm.prank(contributor1);
        campaign.contribute{value: 2 ether}();

        vm.prank(contributor2);
        campaign.contribute{value: 3 ether}();

        // Check state updated correctly
        assertEq(campaign.totalRaised(), 5 ether);
        assertEq(campaign.contributions(contributor1), 2 ether);
        assertEq(campaign.contributions(contributor2), 3 ether);
        assertEq(address(campaign).balance, 5 ether);
    }

    function test_contribute_reverts_after_deadline() public {
        Campaign campaign = _createCampaign();
        // Warp past the deadline
        vm.warp(block.timestamp + DURATION + 1);

        vm.prank(contributor1);
        vm.expectRevert(Campaign.DeadlinePassed.selector);
        campaign.contribute{value: 1 ether}();
    }

    function test_Contribute_Reverts_ZeroValue() public {
        Campaign campaign = _createCampaign();

        vm.prank(contributor1);
        vm.expectRevert(Campaign.NoContribution.selector);
        campaign.contribute{value: 0}();
    }


    // ══════════════════════════════════════════════════════════
    // WITHDRAWAL TESTS  (goal met ✅)
    // ══════════════════════════════════════════════════════════
    function test_Withdraw_Success() public {
        Campaign campaign = _createCampaign();

        // Contributors hit the goal exactly
        vm.prank(contributor1);
        campaign.contribute{value: 3 ether}();

        vm.prank(contributor2);
        campaign.contribute{value: 2 ether}();

        // Fast forward past deadline
        vm.warp(block.timestamp + DURATION + 1);

        uint256 creatorBalanceBefore = creator.balance;

        vm.prank(creator);
        campaign.withdraw();

        // Creator received the funds
        assertEq(creator.balance, creatorBalanceBefore + 5 ether);

        // Contract is drained
        assertEq(address(campaign).balance, 0);

        // withdrawn flag is set
        assertTrue(campaign.withdrawn());
    }

    function test_Withdraw_Reverts_IfNotCreator() public {
        Campaign campaign = _createCampaign();

        vm.prank(contributor1);
        campaign.contribute{value: 5 ether}();

        vm.warp(block.timestamp + DURATION + 1);

        vm.prank(randomUser);
        vm.expectRevert(Campaign.NotCreator.selector);
        campaign.withdraw();
    }

    function test_Withdraw_Reverts_BeforeDeadline() public {
        Campaign campaign = _createCampaign();

        vm.prank(contributor1);
        campaign.contribute{value: 5 ether}();

        vm.prank(creator);
        vm.expectRevert(Campaign.DeadlineNotReached.selector);
        campaign.withdraw();
    }

    function test_withdraw_fails_if_not_creator() public {
        Campaign campaign = _createCampaign();

        vm.prank(contributor1);
        campaign.contribute{value: 5 ether}();

        vm.warp(block.timestamp + DURATION + 1);

        vm.prank(randomUser);
        vm.expectRevert(Campaign.NotCreator.selector);
        campaign.withdraw();
    }

    function test_Withdraw_Reverts_GoalNotMet() public {
        Campaign campaign = _createCampaign();

        // Only contribute 2 ETH, goal is 5 ETH
        vm.prank(contributor1);
        campaign.contribute{value: 2 ether}();

        vm.warp(block.timestamp + DURATION + 1);

        vm.prank(creator);
        vm.expectRevert(Campaign.GoalNotMet.selector);
        campaign.withdraw();
    }

    function test_Withdraw_Reverts_DoubleWithdraw() public {
        Campaign campaign = _createCampaign();

        vm.prank(contributor1);
        campaign.contribute{value: 5 ether}();

        vm.warp(block.timestamp + DURATION + 1);

        vm.prank(creator);
        campaign.withdraw(); // first withdraw — succeeds

        vm.prank(creator);
        vm.expectRevert(Campaign.AlreadyWithdrawn.selector);
        campaign.withdraw(); // second attempt — must revert
    }

    // ══════════════════════════════════════════════════════════
    // REFUND TESTS  (goal NOT met ❌)
    // ══════════════════════════════════════════════════════════

    function test_Refund_Success() public {
        Campaign campaign = _createCampaign();

        vm.prank(contributor1);
        campaign.contribute{value: 2 ether}();

        // Goal not met — warp past deadline
        vm.warp(block.timestamp + DURATION + 1);

        uint256 balanceBefore = contributor1.balance;

        vm.prank(contributor1);
        campaign.refund();

        // contributor1 got their ETH back
        assertEq(contributor1.balance, balanceBefore + 2 ether);

        // Their contribution is zeroed out
        assertEq(campaign.contributions(contributor1), 0);
    }

    function test_Refund_Reverts_GoalWasMet() public {
        Campaign campaign = _createCampaign();

        vm.prank(contributor1);
        campaign.contribute{value: 5 ether}();

        vm.warp(block.timestamp + DURATION + 1);

        // Goal was met — refund should revert
        vm.prank(contributor1);
        vm.expectRevert(Campaign.GoalAlreadyMet.selector);
        campaign.refund();
    }

    function test_Refund_Reverts_NoContribution() public {
        Campaign campaign = _createCampaign();

        vm.warp(block.timestamp + DURATION + 1);

        // randomUser never contributed
        vm.prank(randomUser);
        vm.expectRevert(Campaign.NoContribution.selector);
        campaign.refund();
    }

    function test_Refund_Reverts_DoubleRefund() public {
        Campaign campaign = _createCampaign();

        vm.prank(contributor1);
        campaign.contribute{value: 2 ether}();

        vm.warp(block.timestamp + DURATION + 1);

        vm.prank(contributor1);
        campaign.refund(); // first refund — succeeds

        vm.prank(contributor1);
        vm.expectRevert(Campaign.NoContribution.selector);
        campaign.refund(); // second attempt — contribution is 0, must revert
    }

    // ══════════════════════════════════════════════════════════
    // VIEW FUNCTION TESTS
    // ══════════════════════════════════════════════════════════

    function test_IsSuccessful() public {
        Campaign campaign = _createCampaign();

        vm.prank(contributor1);
        campaign.contribute{value: 5 ether}();

        // Before deadline — not successful yet
        assertFalse(campaign.isSuccessful());

        // After deadline with goal met — successful
        vm.warp(block.timestamp + DURATION + 1);
        assertTrue(campaign.isSuccessful());
    }

    function test_IsFailed() public {
        Campaign campaign = _createCampaign();

        vm.prank(contributor1);
        campaign.contribute{value: 2 ether}(); // goal not met

        assertFalse(campaign.isFailed()); // still before deadline

        vm.warp(block.timestamp + DURATION + 1);
        assertTrue(campaign.isFailed()); // after deadline, goal not met
    }

    function test_TimeLeft() public {
        Campaign campaign = _createCampaign();

        uint256 timeLeft = campaign.timeLeft();
        assertApproxEqAbs(timeLeft, DURATION, 2); // within 2 seconds

        vm.warp(block.timestamp + DURATION + 1);
        assertEq(campaign.timeLeft(), 0);
    }

}