require("dotenv").config();
const { Pool } = require("pg");

// ── Connection Pool ───────────────────────────────────────────
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000,
});

// ── Query Helper ──────────────────────────────────────────────
const query = (text, params) => pool.query(text, params);

// ── Initialize Tables ─────────────────────────────────────────
async function initDb() {
    if (!process.env.DATABASE_URL) {
        console.error("❌ FATAL: DATABASE_URL is not defined!");
        console.log("💡 Tip: Make sure you have added DATABASE_URL to your Railway Service Variables.");
        process.exit(1);
    }

    try {
        console.log("📡 Connecting to database...");
        // Test connection
        await pool.query('SELECT 1');
        
        await pool.query(`
            -- ── Campaigns ──────────────────────────────────────
            CREATE TABLE IF NOT EXISTS campaigns (
                address         TEXT PRIMARY KEY,
                creator         TEXT NOT NULL,
                title           TEXT NOT NULL,
                goal            TEXT NOT NULL,
                deadline        BIGINT NOT NULL,
                created_at      BIGINT NOT NULL,
                total_raised    TEXT NOT NULL DEFAULT '0',
                withdrawn       BOOLEAN NOT NULL DEFAULT FALSE,
                block_number    INTEGER NOT NULL,
                tx_hash         TEXT NOT NULL,
                last_synced_at  BIGINT NOT NULL DEFAULT 0
            );

            CREATE INDEX IF NOT EXISTS idx_campaigns_creator ON campaigns(creator);
            CREATE INDEX IF NOT EXISTS idx_campaigns_deadline ON campaigns(deadline);

            -- ── Contributions ───────────────────────────────────
            CREATE TABLE IF NOT EXISTS contributions (
                id               SERIAL PRIMARY KEY,
                campaign_address TEXT NOT NULL REFERENCES campaigns(address),
                contributor      TEXT NOT NULL,
                amount           TEXT NOT NULL,
                block_number     INTEGER NOT NULL,
                tx_hash          TEXT NOT NULL,
                created_at       BIGINT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_contributions_campaign ON contributions(campaign_address);
            CREATE INDEX IF NOT EXISTS idx_contributions_contributor ON contributions(contributor);

            -- ── Sync State ──────────────────────────────────────
            CREATE TABLE IF NOT EXISTS sync_state (
                id          INTEGER PRIMARY KEY CHECK (id = 1),
                last_block  INTEGER NOT NULL DEFAULT 0
            );

            INSERT INTO sync_state (id, last_block)
            VALUES (1, 0)
            ON CONFLICT (id) DO NOTHING;
        `);

        console.log("✅ Database initialized successfully");

    } catch (err) {
        console.error("❌ Database initialization failed!");
        console.error("👉 Error details:", err);
        throw err;
    }
}

module.exports = { query, initDb };