require("dotenv").config();
const { Pool } = require("pg");

// ── Connection Pool ───────────────────────────────────────────
// A pool keeps multiple connections open and reuses them
// Much more efficient than opening a new connection per query
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        // Railway requires SSL but uses a self-signed cert
        // rejectUnauthorized: false tells pg to accept it
        rejectUnauthorized: false,
    },
    max: 10,                // max 10 simultaneous connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000,
});

// ── Query Helper ──────────────────────────────────────────────
// Every other file imports and uses this instead of pool directly
// Usage: const { rows } = await query("SELECT * FROM campaigns", [])
const query = (text, params) => pool.query(text, params);

// ── Initialize Tables ─────────────────────────────────────────
async function initDb() {
    try {
        await pool.query(`

            -- ── Campaigns ──────────────────────────────────────
            CREATE TABLE IF NOT EXISTS campaigns (

                -- Identity
                address         TEXT PRIMARY KEY,
                creator         TEXT NOT NULL,

                -- Campaign metadata (from CampaignCreated event)
                title           TEXT NOT NULL,
                goal            TEXT NOT NULL,       -- uint256 stored as string
                deadline        BIGINT NOT NULL,     -- unix timestamp
                created_at      BIGINT NOT NULL,     -- block timestamp

                -- Live state (updated when Contributed events arrive)
                total_raised    TEXT NOT NULL DEFAULT '0',
                withdrawn       BOOLEAN NOT NULL DEFAULT FALSE,

                -- Indexing metadata
                block_number    INTEGER NOT NULL,
                tx_hash         TEXT NOT NULL,
                last_synced_at  BIGINT NOT NULL DEFAULT 0
            );

            CREATE INDEX IF NOT EXISTS idx_campaigns_creator
                ON campaigns(creator);

            CREATE INDEX IF NOT EXISTS idx_campaigns_deadline
                ON campaigns(deadline);

            -- ── Contributions ───────────────────────────────────
            CREATE TABLE IF NOT EXISTS contributions (
                id               SERIAL PRIMARY KEY,
                campaign_address TEXT NOT NULL REFERENCES campaigns(address),
                contributor      TEXT NOT NULL,
                amount           TEXT NOT NULL,      -- wei stored as string
                block_number     INTEGER NOT NULL,
                tx_hash          TEXT NOT NULL,
                created_at       BIGINT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_contributions_campaign
                ON contributions(campaign_address);

            CREATE INDEX IF NOT EXISTS idx_contributions_contributor
                ON contributions(contributor);

            -- ── Sync State ──────────────────────────────────────
            -- Tracks the last block the listener has processed
            -- When the server restarts it picks up from here
            -- CHECK (id = 1) enforces only one row ever exists
            CREATE TABLE IF NOT EXISTS sync_state (
                id          INTEGER PRIMARY KEY CHECK (id = 1),
                last_block  INTEGER NOT NULL DEFAULT 0
            );

            -- Safely insert the initial row
            INSERT INTO sync_state (id, last_block)
            VALUES (1, 0)
            ON CONFLICT (id) DO NOTHING;

        `);

        console.log("✅ Database tables ready");

    } catch (err) {
        console.error("❌ Database initialization failed:", err.message);
        throw err;
    }
}

module.exports = { query, initDb };