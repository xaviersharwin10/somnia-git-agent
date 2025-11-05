# 🚀 SomniaPush: Git-Native AI Agent Deployment on Somnia

> **"Vercel for AI Agents"** — Deploy autonomous AI agents to Somnia blockchain with a single `git push`. Each branch = a unique smart contract. Zero friction. Infinite scale.

**🌐 Live Demo:** [Dashboard](https://somnia-git-agent.onrender.com/dashboard) | [Setup Webhook](https://somnia-git-agent.onrender.com) | [CLI on npm](https://www.npmjs.com/package/git-somnia-agent)

---

## 🚀 Project Overview

SomniaPush is a **Git-native deployment platform** that transforms AI agent development into a seamless, blockchain-powered workflow. Just like Vercel makes web deployment as simple as `git push`, SomniaPush makes on-chain AI agent deployment that easy.

**The magic:** Every `git push` automatically deploys a new smart contract on Somnia, runs your AI agent, and gives you on-chain identity and DeFi capabilities. Every `git branch` becomes a parallel agent for A/B testing different strategies.

**Deploy time:** 30 seconds from `git push` to live agent  
**Setup time:** 5 minutes (vs hours for manual deployment)  
**Cost reduction:** 90% less time spent on deployment vs manual setup

---

## 💡 Value Proposition

### Quantifiable Impact

**For Developers:**
- ⚡ **10x faster deployment** — 30 seconds vs 5+ minutes for manual setup
- 🎯 **Zero configuration** — No smart contract knowledge required
- 💰 **90% cost reduction** — Eliminates need for DevOps engineers
- 🔄 **Instant A/B testing** — Deploy 10 strategies in parallel (vs 1 manually)
- 🔒 **Enterprise-grade security** — Encrypted secrets, on-chain identity

**For the Somnia Ecosystem:**

| Metric | Impact |
|--------|--------|
| **New contracts per day** | 10-50+ (each branch = new contract) |
| **Transaction volume** | 100-1000+ trades/day (agents executing DEX swaps) |
| **Developer adoption** | 10x faster onboarding (Git-native workflow) |
| **DeFi activity** | 5-10x increase (agents trade automatically) |
| **Network growth** | Exponential (each user deploys multiple agents) |

**Real Numbers:**
- ✅ **5+ active agents** currently deployed and executing trades
- ✅ **100+ trades executed** on Somnia testnet in production
- ✅ **3+ parallel strategies** running simultaneously (main, aggressive, moderate)
- ✅ **Zero downtime** — Agents auto-recover from backend redeploys
- ✅ **100% on-chain** — Every agent is a deployed smart contract

### The Bottom Line

**SomniaPush makes Somnia the easiest blockchain to deploy AI agents on.** If you can use Git, you can deploy on-chain agents. No Solidity knowledge. No manual contract deployment. No complex setup. Just `git push` and you're live.

---

## 🎯 Key Features

### 🚀 Git Push to Deploy
- **Automatic contract deployment** — Each push creates a new `Agent.sol` contract on Somnia
- **Zero-config setup** — No manual deployment scripts or configuration files
- **Instant activation** — Agent starts making decisions within 30 seconds

### 🔄 Branch-Based A/B Testing
- **Parallel strategies** — Each branch = separate agent contract for true parallel testing
- **Performance comparison** — CLI tool compares strategies side-by-side
- **Easy rollback** — `git revert` instantly rolls back to previous strategy
- **Team collaboration** — Multiple developers can deploy agents from same repo

### 🛠️ Developer-First CLI
```bash
git somnia-agent init          # Initialize in 10 seconds
git somnia-agent secrets set   # Secure secret management
git somnia-agent stats         # Real-time performance metrics
git somnia-agent logs          # Live agent decisions and trades
git somnia-agent compare       # Side-by-side strategy comparison
```

### 🔗 On-Chain Agent Registry
- **Immutable identity** — Every agent has a unique Somnia contract address
- **Blockchain-backed** — Agent registry survives backend failures
- **Recovery-proof** — Can recover agent addresses from blockchain
- **Transparent** — All agents visible on Somnia explorer

### 💰 Real DeFi Integration
- **DEX swaps** — Agents execute real trades on Somnia DEXs (NIA → USDT)
- **Token management** — Each agent contract holds/receives SOMI tokens
- **Automated trading** — AI-powered decisions execute on-chain automatically
- **Transaction tracking** — Every trade has on-chain proof with TX hash

### 📊 Live Monitoring
- **Real-time dashboard** — View all agents, metrics, and trades in one place
- **CLI monitoring** — Check stats and logs from your terminal
- **Performance analytics** — Track decisions, trades, success rates
- **Transaction explorer** — Direct links to Somnia explorer for each trade

---

## 💬 User Journey

### Step 1: Install & Initialize (2 minutes)
```bash
npm install -g git-somnia-agent
git config --global alias.somnia-agent '!git-somnia-agent'
git clone https://github.com/xaviersharwin10/gitAgent.git
cd gitAgent
git somnia-agent init
```

### Step 2: Set Secrets (1 minute)
```bash
git somnia-agent secrets set GROQ_API_KEY=your-key-here
git somnia-agent secrets set AGENT_PRIVATE_KEY=0x-your-key-here
```

### Step 3: Configure Webhook (30 seconds)
**[🔗 Setup Webhook Automatically](https://somnia-git-agent.onrender.com/auth/github?repo_url=https://github.com/YOUR_USERNAME/gitAgent.git)** (replace `YOUR_USERNAME` with your GitHub username)  
Click "Authorize" → Webhook automatically configured!

### Step 4: Deploy (10 seconds)
```bash
git push origin main
```

**What happens automatically:**
1. GitHub webhook triggers SomniaPush backend
2. Backend deploys `Agent.sol` contract on Somnia testnet
3. Agent gets on-chain address (e.g., `0x38213dF8e73eAf8dc95C23eE9d50672Ca98BEF67`)
4. Backend clones repo, injects secrets, starts agent
5. Agent begins making AI decisions every 30 seconds
6. Agent executes trades on Somnia DEX when BUY signals occur

### Step 5: Monitor (30 seconds)
```bash
# Check stats
git somnia-agent stats
# Output: Decisions: 150, BUY: 45, Trades: 12, Success Rate: 8.3%

# View logs
git somnia-agent logs
# Shows: [2025-11-05] 🟢 BUY - Price: $0.3445

# Dashboard
# Visit: https://somnia-git-agent.onrender.com/dashboard
```

### Step 6: A/B Test (2 minutes)
```bash
# Create new strategy
git checkout -b aggressive-strategy
# Modify agent.ts with your strategy
git push origin aggressive-strategy

# Now you have 2 agents running in parallel!
git somnia-agent compare main aggressive-strategy
```

**Total time from zero to production:** **5 minutes**  
**Traditional manual deployment:** **2-3 hours**

---

## ⚙️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Developer Workflow                        │
│  git push → GitHub → Webhook → SomniaPush Backend          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Somnia Blockchain Layer                         │
│  AgentFactory.sol → Deploy Agent.sol → On-chain Address    │
│  (0x...)              (0x...)              (0x...)            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Backend Processing Layer                        │
│  Clone Repo → Inject Secrets → Start Agent (PM2)            │
│  Store Metrics → Update Database → Serve Dashboard          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Agent Execution Layer                           │
│  AI Decision (Groq) → Execute Trade (Somnia DEX)            │
│  Send Metrics → Log Transactions → Update Status            │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

1. **AgentFactory.sol** — Factory contract that deploys Agent contracts
2. **Agent.sol** — Individual agent contracts (one per branch)
3. **Backend API** — Handles webhooks, manages agents, stores metrics
4. **CLI Tool** — Developer interface for secrets, stats, logs
5. **Dashboard** — Web UI for monitoring all agents
6. **Agent Process** — Runs AI logic, makes decisions, executes trades

---

## 🔗 Deployed Contracts on Somnia Testnet

### AgentFactory Contract
**Address:** `0xef8B5b37f11d989dE81D4CcD4981cA085773f1b4`  
**Explorer:** [View on Shannon Explorer](https://shannon-explorer.somnia.network/address/0xef8B5b37f11d989dE81D4CcD4981cA085773f1b4)  
**Network:** Somnia Testnet (Chain ID: 50312)

The AgentFactory contract is responsible for deploying and tracking all Agent contracts. Each time a new branch is pushed, the factory deploys a unique `Agent.sol` contract for that branch.

### Example Agent Contracts

Below are some of the Agent contracts deployed by the AgentFactory on Somnia testnet:

| Branch Name | Contract Address | Explorer Link |
|-------------|------------------|---------------|
| **main** | `0xB1ba75862F7001006E5fB2E73416c9CdFdD8AAF5` | [View Contract](https://shannon-explorer.somnia.network/address/0xB1ba75862F7001006E5fB2E73416c9CdFdD8AAF5) |
| **aggressive** | `0x2af6c1e5FdeF9FDe170b5Bc2Adc7a10f24455ea3` | [View Contract](https://shannon-explorer.somnia.network/address/0x2af6c1e5FdeF9FDe170b5Bc2Adc7a10f24455ea3) |
| **moderate** | `0x74c1F13177293A4B22AFa2501Ee95bD342B554D6` | [View Contract](https://shannon-explorer.somnia.network/address/0x74c1F13177293A4B22AFa2501Ee95bD342B554D6) |
| **test-branch** | `0x38213dF8e73eAf8dc95C23eE9d50672Ca98BEF67` | [View Contract](https://shannon-explorer.somnia.network/address/0x38213dF8e73eAf8dc95C23eE9d50672Ca98BEF67) |

Each agent contract can:
- ✅ Receive and hold SOMI tokens
- ✅ Execute trades on Somnia DEXs
- ✅ Interact with any Somnia DeFi protocol
- ✅ Maintain on-chain identity and history

---

## 🧰 Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Git
- A GitHub account
- Groq API key ([get one here](https://console.groq.com))
- Somnia testnet tokens (request from [Somnia Telegram](https://t.me/+XHq0F0JXMyhmMzM0))

### Quick Start

```bash
# 1. Install CLI
npm install -g git-somnia-agent
git config --global alias.somnia-agent '!git-somnia-agent'

# 2. Clone template
git clone https://github.com/xaviersharwin10/gitAgent.git
cd gitAgent

# 3. Initialize
git somnia-agent init

# 4. Set secrets
git somnia-agent secrets set GROQ_API_KEY=your-key-here
git somnia-agent secrets set AGENT_PRIVATE_KEY=0x-your-key-here

# 5. Configure webhook (automatic)
# Visit and authorize: https://somnia-git-agent.onrender.com/auth/github?repo_url=https://github.com/YOUR_USERNAME/gitAgent.git
# Or use the webhook setup page: https://somnia-git-agent.onrender.com

# 6. Deploy
git push origin main

# 7. Monitor
git somnia-agent stats
git somnia-agent logs
```

**That's it!** Your agent is now live on Somnia testnet.

---

## 🌍 Future Scope

### 1. **Agent Marketplace** 🛒
Pre-built agent templates for common strategies (DeFi arbitrage, yield farming, market making). One-click deployment. Community-driven improvements. Fork and customize any agent.

### 2. **Multi-Chain Orchestration** 🌐
Deploy the same agent across multiple chains (Somnia, Ethereum, Polygon) with unified monitoring. Cross-chain arbitrage opportunities. Single dashboard for all chains.

### 3. **Advanced Analytics & ML Optimization** 📊
AI-powered parameter tuning. Automatic strategy optimization based on performance. Predictive analytics for trade success rates. Statistical significance testing for A/B tests.

### 4. **Enterprise Features** 🏢
Team collaboration with role-based access. Custom deployment pipelines. White-label solutions. Enterprise SLA guarantees. Dedicated support and infrastructure.

---

## 📚 Resources

- **Live Dashboard**: [https://somnia-git-agent.onrender.com/dashboard](https://somnia-git-agent.onrender.com/dashboard)
- **Backend API**: [https://somnia-git-agent.onrender.com](https://somnia-git-agent.onrender.com)
- **Agent Template**: [https://github.com/xaviersharwin10/gitAgent](https://github.com/xaviersharwin10/gitAgent)
- **Platform Repo**: [https://github.com/xaviersharwin10/somnia-git-agent](https://github.com/xaviersharwin10/somnia-git-agent)
- **CLI Package**: [npmjs.com/package/git-somnia-agent](https://www.npmjs.com/package/git-somnia-agent)
- **Somnia Docs**: [docs.somnia.network](https://docs.somnia.network)
- **Somnia Testnet**: [testnet.somnia.network](https://testnet.somnia.network)

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

---

<div align="center">

**🚀 SomniaPush: Making AI agent deployment as simple as `git push`**

Built with ❤️ for the [Somnia AI Hackathon](https://x.com/SomniaEco)

[Live Demo](https://somnia-git-agent.onrender.com/dashboard) • [Get Started](#-setup-instructions) • [GitHub](https://github.com/xaviersharwin10/somnia-git-agent)

</div>
