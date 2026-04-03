require("dotenv").config();
const { ethers }  = require("ethers");
const { query }   = require("./db");
const FactoryABI  = require("./abis/CrowdfundFactory.json");
const CampaignABI = require("./abis/Campaign.json");

// ── Config ────────────────────────────────────────────────────
const FACTORY_ADDRESS      = process.env.FACTORY_ADDRESS;
const FACTORY_DEPLOY_BLOCK = parseInt(process.env.FACTORY_DEPLOY_BLOCK || "0");
const RPC_URL              = process.env.RPC_URL;

// Alchemy free tier: max 10 blocks per getLogs call
const BLOCK_CHUNK_SIZE = 10;

// Helper for retrying RPC calls on timeout/network error
async function withRetry(fn, retries = 3, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err) {
            if (i === retries - 1) throw err;
            console.log(`⚠️ RPC call failed, retrying in ${delay}ms... (${err.message})`);
            await new Promise(r => setTimeout(r, delay));
        }
    }
}

// ── Start ─────────────────────────────────────────────────────
async function startListener() {
    if (!FACTORY_ADDRESS) throw new Error("FACTORY_ADDRESS not set in .env");
    if (!RPC_URL)         throw new Error("RPC_URL not set in .env");

    console.log("🔌 Connecting to RPC...");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const network  = await withRetry(() => provider.getNetwork());

    console.log(`✅ Connected to ${network.name} (chainId: ${network.chainId})`);
    console.log(`📄 Factory address: ${FACTORY_ADDRESS}`);

    const factory = new ethers.Contract(
        FACTORY_ADDRESS,
        FactoryABI,
        provider
    );

    // 1. Listen for new events going forward (immediate start)
    console.log("👂 Listening for live events...");
    subscribeToLiveEvents(provider, factory);

    // 2. Catch up on everything we missed in background
    console.log("🔄 Starting historical backfill (background)...");
    backfill(provider, factory)
        .then(() => {
            console.log("✅ Background backfill complete");
            console.log("🚀 All systems fully operational");
        })
        .catch(err => {
            console.error("⚠️ Background backfill failed/interrupted:");
            console.error("   Error type:", err.constructor.name);
            console.error("   Message:   ", err.message);
            console.error("   Stack:     ", err.stack?.split("\n")[1]?.trim());
        });
}

// ── Backfill ──────────────────────────────────────────────────
// Scans historical blocks in chunks to find past CampaignCreated events
async function backfill(provider, factory) {
    const { rows } = await query(
        `SELECT last_block FROM sync_state WHERE id = 1`
    );

    const lastProcessedBlock = rows[0].last_block;

    // Resume from where we left off, or from deploy block
    const fromBlock = Math.max(
        lastProcessedBlock + 1,
        FACTORY_DEPLOY_BLOCK
    );

    const toBlock = await withRetry(() => provider.getBlockNumber());

    if (fromBlock > toBlock) {
        console.log("✅ Already up to date — no backfill needed");
        return;
    }

    const totalBlocks = toBlock - fromBlock;
    console.log(`🔄 Backfilling ${totalBlocks} blocks (${fromBlock} → ${toBlock})...`);

    for (let start = fromBlock; start <= toBlock; start += BLOCK_CHUNK_SIZE) {
        const end = Math.min(start + BLOCK_CHUNK_SIZE - 1, toBlock);

        // Fetch all CampaignCreated events in this block range
        const events = await withRetry(() => factory.queryFilter(
            factory.filters.CampaignCreated(),
            start,
            end
        ));

        // Process each event
        for (const event of events) {
            await processCampaignCreated(provider, event);
        }

        // Save progress — if server crashes we resume from here
        await query(
            `UPDATE sync_state SET last_block = $1 WHERE id = 1`,
            [end]
        );

        if (events.length > 0) {
            console.log(`   Blocks ${start}→${end}: ${events.length} campaign(s) found`);
        } else if (((start - fromBlock) / BLOCK_CHUNK_SIZE) % 50 === 0) {
            // Log progress every 50 chunks (~500 blocks) to show we're alive
            const pct = Math.round(((start - fromBlock) / totalBlocks) * 100);
            console.log(`   Syncing... ${pct}% (${start} → ${end})`);
        }
    }

    console.log("✅ Backfill complete");
}

// ── Live Subscriptions ────────────────────────────────────────
function subscribeToLiveEvents(provider, factory) {
    console.log("👂 Listening for live events...\n");

    // New campaign created via factory
    factory.on("CampaignCreated", async (...args) => {
        const event = args[args.length - 1];
        await processCampaignCreated(provider, event);
        await query(
            `UPDATE sync_state SET last_block = $1 WHERE id = 1`,
            [event.blockNumber]
        );
    });

    // Handle provider errors gracefully
    provider.on("error", (err) => {
        console.error("❌ Provider error:", err.message);
        // In production: add reconnection logic with exponential backoff
    });
}

// ── Process CampaignCreated Event ────────────────────────────
async function processCampaignCreated(provider, event) {
    const {
        campaignAddress,
        creator,
        title,
        goal,
        deadline,
        timestamp,
    } = event.args;

    // Ethers v6: event.log has the canonical metadata, but EventLog might 
    // have it on the root. We check both.
    const blockNumber     = event.log?.blockNumber || event.blockNumber;
    const transactionHash = event.log?.transactionHash || event.transactionHash;

    if (!blockNumber) {
        console.warn("⚠️ Event missing blockNumber, skipping indexing:", title);
        return;
    }

    // ON CONFLICT DO NOTHING = safe to call multiple times (idempotent)
    // If the server restarts and re-processes a block, no duplicates
    await query(
        `INSERT INTO campaigns
            (address, creator, title, goal, deadline,
             created_at, block_number, tx_hash, last_synced_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (address) DO NOTHING`,
        [
            campaignAddress.toLowerCase(),
            creator.toLowerCase(),
            title,
            goal.toString(),           // BigInt → string
            Number(deadline),
            Number(timestamp),
            blockNumber,
            transactionHash,
            Date.now(),
        ]
    );

    console.log(`📋 Campaign indexed: "${title}"`);
    console.log(`   Address:  ${campaignAddress}`);
    console.log(`   Creator:  ${creator}`);
    console.log(`   Goal:     ${ethers.formatEther(goal)} ETH`);
    console.log(`   Deadline: ${new Date(Number(deadline) * 1000).toLocaleDateString()}\n`);

    // Now subscribe to this specific campaign's events
    subscribeToCampaignEvents(provider, campaignAddress);
}

// ── Subscribe to Campaign-Level Events ───────────────────────
function subscribeToCampaignEvents(provider, campaignAddress) {
    const campaign = new ethers.Contract(
        campaignAddress,
        CampaignABI,
        provider
    );

    // Someone contributed ETH to this campaign
    campaign.on("Contributed", async (contributor, amount, event) => {
        try {
            // Robustly extract metadata for Ethers v6 live payloads
            const blockNumber     = event.log?.blockNumber || event.blockNumber;
            const transactionHash = event.log?.transactionHash || event.transactionHash;

            if (!blockNumber) throw new Error("Event missing blockNumber");

            const block = await withRetry(() => provider.getBlock(blockNumber));

            // Record the contribution
            await query(
                `INSERT INTO contributions
                    (campaign_address, contributor, amount,
                     block_number, tx_hash, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT DO NOTHING`,
                [
                    campaignAddress.toLowerCase(),
                    contributor.toLowerCase(),
                    amount.toString(),
                    blockNumber,
                    transactionHash,
                    block.timestamp,
                ]
            );

            // Fetch fresh totalRaised from chain and update DB
            const freshTotal = await campaign.totalRaised();

            await query(
                `UPDATE campaigns
                 SET total_raised = $1, last_synced_at = $2
                 WHERE address = $3`,
                [
                    freshTotal.toString(),
                    Date.now(),
                    campaignAddress.toLowerCase(),
                ]
            );

            console.log(
                `💰 Contribution: ${ethers.formatEther(amount)} ETH → ${campaignAddress}`
            );

        } catch (err) {
            console.error("❌ Error processing Contributed event:", err.message);
        }
    });

    // Creator withdrew funds
    campaign.on("Withdrawn", async (creator, amount, event) => {
        try {
            await query(
                `UPDATE campaigns SET withdrawn = TRUE WHERE address = $1`,
                [campaignAddress.toLowerCase()]
            );
            console.log(`🏦 Withdrawal: ${ethers.formatEther(amount)} ETH from ${campaignAddress}`);
        } catch (err) {
            console.error("❌ Error processing Withdrawn event:", err.message);
        }
    });
}

module.exports = { startListener };