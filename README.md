# ⛓ CrowdFund: Premium Web3 Crowdfunding Protocol

A decentralized, trustless crowdfunding platform built on the Ethereum blockchain. This project features a high-impact, glassmorphic UI, a robust background indexing service, and secure smart contracts for "All-or-Nothing" campaign assurance.

## 🚀 Features

- **Decentralized Trust**: Funds are held in escrow by smart contracts. Refunds are automatic if goals aren't met.
- **Premium UI/UX**: Stunning motion-optimized interface with glassmorphism and bento-grid layouts.
- **Real-time Indexing**: Background Node.js worker that syncs blockchain events to a high-speed API.
- **0% Fees**: Direct peer-to-peer funding with no platform cut.
- **Global Reach**: Connect with any Ethereum wallet world-wide.

---

## 🛠 Tech Stack

- **Foundry / Solidity**: Smart contract development and testing.
- **Next.js / Tailwind CSS**: Frontend with a premium design system.
- **RainbowKit / Wagmi**: Wallet connectivity and blockchain interactions.
- **Node.js / Express**: REST API for fast campaign discovery.
- **Postgres / Ethers.js**: Reliable event indexing and storage.

---

## 📦 Project Structure

```bash
├── packages
│   ├── contracts # Forge/Foundry smart contracts
│   ├── backend   # Node.js indexing service & API
│   └── frontend  # Next.js web application
```

---

## ⚙️ Local Setup

### 1. Smart Contracts
```bash
cd packages/contracts
forge install   # Install dependencies
forge build     # Compile contracts
forge test      # Run tests
```

### 2. Backend & Indexer
Requires a Running Postgres instance (Recommended: Railway or local pg).
```bash
cd packages/backend
# Create a .env file with the following variables:
DATABASE_URL=your_postgres_url
RPC_URL=your_sepolia_rpc_url
FACTORY_ADDRESS=0x259c50134002214B149AdC32eC5871d9De5d551E
FACTORY_DEPLOY_BLOCK=10563725

npm install
npm run dev     # Starts API on http://localhost:3001
```

### 3. Frontend
```bash
cd packages/frontend
# Create a .env.local file with the following:
NEXT_PUBLIC_FACTORY_ADDRESS=0x259c50134002214B149AdC32eC5871d9De5d551E
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

npm install
npm run dev     # Starts app on http://localhost:3000
```

---

## 🛡 Security & Assurance
This protocol implements the **All-or-Nothing** model:
1. **Active**: Goal is yet to be met before the deadline.
2. **Successful**: Goal met before deadline. Creator can withdraw.
3. **Failed**: Deadline passed without reaching goal. Contributors can claim instant refunds.

---

## 📜 License
ISC License. Built with ❤️ for the Web3 Economy.
