const express     = require("express");
const { ethers }  = require("ethers");
const { query }   = require("../db");
const router      = express.Router();

// ── GET /api/campaigns ────────────────────────────────────────
// Optional query params: ?status=active|successful|failed
//                        ?creator=0xAddress
router.get("/", async (req, res) => {
    try {
        const { creator, status } = req.query;
        const now = Math.floor(Date.now() / 1000);

        let text = `SELECT * FROM campaigns`;
        const params = [];
        const conditions = [];

        if (creator) {
            params.push(creator.toLowerCase());
            conditions.push(`creator = $${params.length}`);
        }

        if (status === "active") {
            params.push(now);
            conditions.push(`deadline > $${params.length}`);

        } else if (status === "successful") {
            params.push(now);
            conditions.push(
                `deadline <= $${params.length}
                 AND CAST(total_raised AS BIGINT) >= CAST(goal AS BIGINT)`
            );

        } else if (status === "failed") {
            params.push(now);
            conditions.push(
                `deadline <= $${params.length}
                 AND CAST(total_raised AS BIGINT) < CAST(goal AS BIGINT)`
            );
        }

        if (conditions.length > 0) {
            text += ` WHERE ` + conditions.join(" AND ");
        }

        text += ` ORDER BY created_at DESC`;

        const { rows } = await query(text, params);

        // Format wei values to ETH for convenience
        const formatted = rows.map(formatCampaign);

        res.json({ success: true, count: rows.length, data: formatted });

    } catch (err) {
        console.error("GET /campaigns error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── GET /api/campaigns/:address ───────────────────────────────
router.get("/:address", async (req, res) => {
    try {
        const address = req.params.address.toLowerCase();

        const { rows: campaigns } = await query(
            `SELECT * FROM campaigns WHERE address = $1`,
            [address]
        );

        if (campaigns.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Campaign not found"
            });
        }

        const { rows: contributions } = await query(
            `SELECT * FROM contributions
             WHERE campaign_address = $1
             ORDER BY created_at DESC`,
            [address]
        );

        res.json({
            success: true,
            data: {
                ...formatCampaign(campaigns[0]),
                contributions: contributions.map(c => ({
                    ...c,
                    amount_eth: ethers.formatEther(c.amount)
                }))
            }
        });

    } catch (err) {
        console.error("GET /campaigns/:address error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── GET /api/campaigns/:address/contributors ──────────────────
router.get("/:address/contributors", async (req, res) => {
    try {
        const address = req.params.address.toLowerCase();

        const { rows } = await query(
            `SELECT
                contributor,
                SUM(CAST(amount AS BIGINT)) AS total_amount,
                COUNT(*)                    AS contribution_count
             FROM contributions
             WHERE campaign_address = $1
             GROUP BY contributor
             ORDER BY total_amount DESC`,
            [address]
        );

        res.json({ success: true, data: rows });

    } catch (err) {
        console.error("GET /contributors error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── Helper ────────────────────────────────────────────────────
// Adds human-readable ETH values alongside raw wei strings
function formatCampaign(c) {
    const now = Math.floor(Date.now() / 1000);
    return {
        ...c,
        goal_eth:         ethers.formatEther(c.goal),
        total_raised_eth: ethers.formatEther(c.total_raised),
        is_active:        c.deadline > now,
        is_successful:    c.deadline <= now && BigInt(c.total_raised) >= BigInt(c.goal),
        is_failed:        c.deadline <= now && BigInt(c.total_raised) < BigInt(c.goal),
        progress_pct:     Math.min(
                            Math.floor(
                                (Number(c.total_raised) / Number(c.goal)) * 100
                            ), 100
                          ),
    };
}

module.exports = router;