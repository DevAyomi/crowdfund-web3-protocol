const fs   = require("fs");
const path = require("path");

// ── Config ────────────────────────────────────────────────────
const contracts = ["CrowdfundFactory", "Campaign"];

const outDir    = path.join(__dirname, "../out");
const exportDir = path.join(__dirname, "../abis");

// ── Run ───────────────────────────────────────────────────────
if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

for (const name of contracts) {
    const artifactPath = path.join(outDir, `${name}.sol`, `${name}.json`);

    if (!fs.existsSync(artifactPath)) {
        console.error(`❌  Artifact not found for ${name} — run "forge build" first`);
        process.exit(1);
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    // Write just the ABI — not the whole artifact (bytecode etc.)
    const abiPath = path.join(exportDir, `${name}.json`);
    fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
    console.log(`✅  Exported ${name}.json`);
}

console.log(`\nABIs written to: ${exportDir}`);