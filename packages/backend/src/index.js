require("dotenv").config();

const express           = require("express");
const cors              = require("cors");
const { initDb }        = require("./db");
const { startListener } = require("./listener");
const campaignRoutes    = require("./routes/campaigns");

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Log every incoming request
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// ── Routes ────────────────────────────────────────────────────
app.use("/api/campaigns", campaignRoutes);

app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "Crowdfund API is running",
        timestamp: new Date().toISOString(),
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: "Route not found" });
});

// ── Boot ──────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", async () => {
    console.log(`\n🚀 API running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}\n`);

    try {
        await initDb();         // 1. Connect to Postgres + create tables

        // 2. Start blockchain listener in the background (non-blocking)
        startListener().catch(err => {
            console.error("⚠️ Background listener failed to start:", err.message);
        });
    } catch (err) {
        console.error("❌ Fatal database error:", err.message);
        process.exit(1);
    }
});