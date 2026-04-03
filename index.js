// Root Proxy for Railway Deployment
try {
  require('./packages/backend/src/index.js');
} catch (err) {
  console.error("❌ Root proxy failed to load backend:", err.message);
  process.exit(1);
}
