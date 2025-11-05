# 🚀 SomniaPush: Git-Native AI Agent Deployment on Somnia

> **"Vercel for AI Agents"** — Deploy autonomous AI agents to Somnia blockchain with a single `git push`. Each branch = a unique smart contract. Zero friction. Infinite scale.

**🏆 Track:** Infra Agents  
**🌐 Built for:** Somnia AI Hackathon  
**🔗 Live Demo:** [Dashboard](https://somnia-git-agent.onrender.com/dashboard) | [Backend API](https://somnia-git-agent.onrender.com)

---

## 🚀 Project Overview

SomniaPush is a **Git-native deployment platform** that transforms AI agent development into a seamless, blockchain-powered workflow. Just like Vercel makes web deployment as simple as `git push`, SomniaPush makes on-chain AI agent deployment that easy.

**The magic:** Every `git push` automatically deploys a new smart contract on Somnia, runs your AI agent, and gives you on-chain identity and DeFi capabilities. Every `git branch` becomes a parallel agent for A/B testing different strategies.

---

## 💡 Value Proposition

### For Developers
- ✅ **Zero-config deployment** — No manual contract deployment, no complex setup
- ✅ **Git-native workflow** — Use the tools you already know (Git, GitHub)
- ✅ **Instant A/B testing** — Each branch = separate agent contract for parallel testing
- ✅ **Secure secrets** — Encrypted storage with CLI management
- ✅ **Real-time monitoring** — CLI tools and dashboard for live metrics

### For the Somnia Ecosystem
- 🎯 **Increases adoption** — Lowers barrier to entry for deploying on-chain agents
- 🔗 **Drives traffic** — Every agent deployment = new smart contract + transactions
- 💰 **Boosts DeFi activity** — Agents execute trades on Somnia DEXs automatically
- 📈 **Creates network effects** — More agents = more composability = more value
- 🏗️ **Infrastructure layer** — Makes Somnia the easiest chain to deploy AI agents

---

## 🧠 Core Idea / Problem Statement

### The Problem

Deploying AI agents on blockchain is **complex, manual, and high-friction**:

- ❌ Manual smart contract deployment for each agent version
- ❌ No unified way to track which agents are deployed
- ❌ Difficult to test different strategies in parallel
- ❌ Insecure secret management (API keys, private keys)
- ❌ No built-in monitoring or performance tracking
- ❌ Hard to rollback or manage multiple versions

**Result:** Developers spend more time on deployment than on building agents.

### The Innovation

SomniaPush **maps the entire agent lifecycle to Git workflow**:

```
git push → Automatic contract deployment on Somnia
git branch → Separate agent contract for A/B testing  
git revert → Instant rollback
git commit → Version history for agent strategies
```

**This is revolutionary because:**
1. **Git becomes your deployment tool** — No new tools to learn
2. **Each branch = isolated agent** — True parallel testing on-chain
3. **Blockchain-native** — Every agent is a deployed smart contract
4. **Developer-friendly** — CLI tools integrate with your workflow

---

## 🔗 Why Somnia?

### Perfect Alignment with Somnia's Vision

SomniaPush is **built specifically for Somnia** and leverages its unique strengths:

#### 🎯 **Mainnet Launch Readiness**
- Somnia is launching mainnet soon — SomniaPush provides **production-ready infrastructure** for deploying agents at scale
- Our platform is battle-tested on Somnia testnet and ready for mainnet migration

#### ⚡ **Scalability & Performance**
- Somnia's high throughput handles **hundreds of concurrent agent deployments**
- Fast transaction times enable real-time agent interactions
- Low gas costs make micro-transactions viable for AI agents

#### 🔗 **Composability & DeFi Integration**
- **Direct DEX integration** — Agents execute trades on Somnia DEXs (e.g., NIA → USDT swaps)
- **Smart contract composability** — Agents can interact with any Somnia protocol
- **Token management** — Each agent contract can hold/receive SOMI tokens

#### 🏗️ **Infrastructure Track Fit**
- **Reduces deployment friction by 10x** — Makes Somnia the easiest chain for AI agents
- **Increases developer adoption** — Git-native workflow lowers barrier to entry
- **Drives ecosystem growth** — More agents = more transactions = more network activity

### Somnia-Specific Features

1. **On-Chain Agent Registry** (`AgentFactory.sol`)
   - Deploys unique `Agent.sol` contracts on Somnia testnet (Chain ID: 50312)
   - Immutable, blockchain-backed registry of all agents
   - Can recover agent addresses even if backend is lost

2. **Native DEX Integration**
   - Agents execute real swaps on Somnia DEXs (SomniaRouter)
   - Token balance management (NIA, USDT, etc.)
   - Slippage tolerance and transaction optimization

3. **Somnia RPC Integration**
   - Uses `https://dream-rpc.somnia.network`
   - Optimized for Somnia's network characteristics
   - Automatic network verification and error handling

---

## ⚙️ Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Developer Workflow                        │
│  git push → GitHub → Webhook → SomniaPush Backend          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Somnia Blockchain Layer                         │
│  AgentFactory.sol → Deploy Agent.sol → On-chain Address    │
│  (Contract Registry)    (Agent Contract)    (0x...)         │
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

### Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Smart Contracts** | Solidity | `Agent.sol`, `AgentFactory.sol` on Somnia testnet |
| **Backend** | Node.js, Express | Webhook handling, agent management, API |
| **Database** | SQLite | Agent metadata, secrets (encrypted), metrics |
| **Process Manager** | PM2 | Agent lifecycle management |
| **Blockchain** | ethers.js v6 | Somnia testnet interaction |
| **CLI** | Commander.js | Developer tooling (`git somnia-agent`) |
| **AI** | Groq SDK | LLM-powered decision making |
| **Frontend** | HTML/JS | Real-time dashboard |
| **Deployment** | Render.com | Hosted backend service |

### Key Technical Innovations

1. **Branch-based Contract Deployment**
   - Each `git branch` gets a unique `Agent.sol` contract
   - Contract address derived from `ethers.id(repo_url + "/" + branch_name)`
   - Enables true parallel testing on-chain

2. **Secrets Management by `branch_hash`**
   - Secrets stored by stable `branch_hash` (not `agent_id`)
   - Survives Render redeploys (ephemeral storage)
   - Encrypted with AES-256-CBC

3. **Automatic Agent Recovery**
   - Backend recovers agents from blockchain on startup
   - Auto-clones repositories if missing
   - Handles ephemeral storage gracefully

4. **Real DEX Integration**
   - Direct interaction with SomniaRouter contract
   - Token swaps (NIA → USDT) with slippage protection
   - Balance checks and allowance management

---

## 🧰 Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Git
- A GitHub account
- Groq API key ([get one here](https://console.groq.com))
- Somnia testnet tokens (request from [Somnia Telegram](https://t.me/+XHq0F0JXMyhmMzM0))

### Step 1: Install the CLI

```bash
npm install -g git-somnia-agent
git config --global alias.somnia-agent '!git-somnia-agent'
```

### Step 2: Clone the Agent Template

```bash
git clone https://github.com/xaviersharwin10/gitAgent.git
cd gitAgent
```

### Step 3: Initialize SomniaPush

```bash
git somnia-agent init
# This creates .gitagent.json with your repo URL
```

### Step 4: Set Required Secrets

```bash
# Set your Groq API key
git somnia-agent secrets set GROQ_API_KEY=your-groq-key-here

# Set your agent private key (for signing transactions)
git somnia-agent secrets set AGENT_PRIVATE_KEY=0x-your-private-key-here

# Optional: Set custom AI prompt
git somnia-agent secrets set AI_PROMPT="Your custom prompt here"
```

### Step 5: Configure GitHub Webhook

**Option A: Automatic Setup (Recommended)**
1. Visit: `https://somnia-git-agent.onrender.com/auth/github?repo_url=https://github.com/YOUR_USERNAME/gitAgent.git`
2. Authorize GitHub access
3. Webhook is automatically configured!

**Option B: Manual Setup**
1. Go to GitHub → Your Repository → Settings → Webhooks
2. Click "Add webhook"
3. Payload URL: `https://somnia-git-agent.onrender.com/webhook/github/push`
4. Content type: `application/json`
5. Events: Just the `push` event
6. Save webhook

### Step 6: Deploy Your First Agent

```bash
git push origin main
```

**That's it!** Your agent is now:
- ✅ Deployed as a smart contract on Somnia testnet
- ✅ Running and making decisions
- ✅ Visible in the dashboard

### Step 7: Monitor Your Agent

```bash
# Check agent stats
git somnia-agent stats

# View live logs
git somnia-agent logs

# Verify secrets are set
git somnia-agent secrets check
```

### Step 8: Create A/B Test Branches

```bash
# Create a new strategy branch
git checkout -b aggressive-strategy

# Modify agent.ts with your strategy
# ... make changes ...

# Push and deploy
git push origin aggressive-strategy

# Compare performance
git somnia-agent compare main aggressive-strategy
```

---

## 💬 Usage Flow

### Complete User Journey

#### 1. **Developer Sets Up Agent**
```bash
git clone https://github.com/xaviersharwin10/gitAgent.git
cd gitAgent
git somnia-agent init
git somnia-agent secrets set GROQ_API_KEY=...
```

#### 2. **Automatic Webhook Configuration**
- Developer visits OAuth URL
- Authorizes GitHub access
- Webhook automatically configured

#### 3. **First Deployment**
```bash
git push origin main
```
**What happens:**
- GitHub webhook triggers SomniaPush backend
- Backend deploys `Agent.sol` contract on Somnia testnet
- Agent gets on-chain address (e.g., `0x38213dF8e73eAf8dc95C23eE9d50672Ca98BEF67`)
- Backend clones repo, injects secrets, starts agent process
- Agent begins making decisions every 30 seconds

#### 4. **Agent Execution**
- Agent fetches price data (CoinGecko API)
- Makes AI decision using Groq LLM
- Executes trades on Somnia DEX if decision is BUY
- Sends metrics to backend for tracking

#### 5. **Monitoring & Management**
```bash
# Real-time stats
git somnia-agent stats
# Output: Decisions: 150, BUY: 45, Trades: 12, Success Rate: 8.3%

# Live logs
git somnia-agent logs
# Shows: [2025-11-05] 🟢 BUY - Price: $0.3445

# Dashboard
# Visit: https://somnia-git-agent.onrender.com/dashboard
# View: All agents, performance metrics, recent trades with TX hashes
```

#### 6. **A/B Testing**
```bash
# Create new branch
git checkout -b conservative-strategy

# Modify agent.ts (change prompt, thresholds, etc.)
# ... make changes ...

# Deploy as separate agent
git push origin conservative-strategy

# Compare both agents
git somnia-agent compare main conservative-strategy
```

#### 7. **Production Deployment**
- Same workflow works for production
- Agents deployed on Somnia mainnet
- Real transactions, real value

---

## 🌍 Future Scope

### Short-Term Enhancements (Next 3 Months)

1. **Enhanced Monitoring**
   - Real-time alerting for agent failures
   - Performance analytics dashboard
   - Historical trend analysis

2. **Multi-Chain Support**
   - Extend to other EVM chains
   - Cross-chain agent orchestration
   - Unified dashboard for all chains

3. **Advanced A/B Testing**
   - Automatic strategy optimization
   - ML-based parameter tuning
   - Statistical significance testing

4. **Team Collaboration**
   - Multi-user access control
   - Role-based permissions
   - Team dashboards

### Long-Term Vision (6-12 Months)

1. **Agent Marketplace**
   - Pre-built agent templates
   - Strategy sharing and forking
   - Community-driven improvements

2. **Advanced DeFi Integration**
   - Support for more DEX protocols
   - Lending/borrowing integration
   - Yield farming strategies

3. **Enterprise Features**
   - Custom deployment pipelines
   - White-label solutions
   - Enterprise SLA guarantees

4. **AI Model Variety**
   - Support for multiple LLM providers
   - Fine-tuned models per agent
   - Custom model training

5. **Governance & DAO**
   - Community-driven platform development
   - Token-based governance
   - Revenue sharing with agent creators

---

## 👥 Team & Contributions

**SomniaPush Team**

- **Xavier Sharwin** - [GitHub](https://github.com/xaviersharwin10) - Full-stack developer, blockchain integration, smart contract architecture

**Contributions Welcome!**

We're building in the open and welcome contributions. Areas where help is needed:
- Smart contract security audits
- Frontend dashboard improvements
- Documentation and tutorials
- Agent strategy templates
- Testing and bug reports

---

## 🏆 Hackathon Impact Summary

### Why SomniaPush Should Win

#### 🎯 **Innovation** (10/10)
- **First Git-native blockchain agent deployment platform**
- Maps entire agent lifecycle to Git workflow (revolutionary approach)
- Combines version control, CI/CD, and blockchain deployment in one system
- No other platform offers this level of developer experience

#### 📈 **Adoption Potential** (10/10)
- **Massive addressable market**: Every developer who uses Git can deploy agents
- **Low barrier to entry**: Familiar tools (Git, GitHub) = faster adoption
- **Network effects**: More agents = more composability = more value
- **Viral potential**: Developers share their agent setups, driving adoption

#### 💰 **Real-World Utility** (10/10)
- **Production-ready**: Already deployed on Somnia testnet with real contracts
- **Active agents**: Multiple agents running and executing trades
- **Real DeFi integration**: Agents execute actual swaps on Somnia DEXs
- **Scalable**: Can handle hundreds of concurrent agent deployments

#### 🔗 **Somnia Ecosystem Impact** (10/10)
- **Drives traffic**: Every agent = new contract + transactions on Somnia
- **Increases DeFi activity**: Agents execute trades automatically
- **Infrastructure layer**: Makes Somnia the easiest chain for AI agents
- **Mainnet ready**: Battle-tested on testnet, ready for production

#### 🏗️ **Technical Excellence** (10/10)
- **Smart contract architecture**: Factory pattern for efficient deployments
- **Secrets management**: Encrypted, persistent across redeploys
- **Agent recovery**: Handles ephemeral storage gracefully
- **Real-time monitoring**: CLI + dashboard for live metrics

### Competitive Advantages

1. **Only platform that combines Git + Blockchain + AI agents**
2. **Zero-config deployment** — competitors require manual setup
3. **Branch-based A/B testing** — unique parallel testing capability
4. **Production-ready** — not just a demo, actually working
5. **Somnia-specific** — built specifically for Somnia's strengths

### Metrics That Matter

- ✅ **5+ active agents** deployed and running
- ✅ **100+ trades executed** on Somnia testnet
- ✅ **3+ branches** with different strategies (main, aggressive, moderate, test-branch)
- ✅ **Real DEX integration** — agents swap NIA → USDT on SomniaRouter
- ✅ **Production backend** — hosted on Render.com, serving real traffic
- ✅ **CLI published** — available on npm as `git-somnia-agent`

### The Bottom Line

**SomniaPush is not just a hackathon project — it's production infrastructure** that makes Somnia the easiest blockchain to deploy AI agents on. We're not building for the hackathon; we're building for the future of on-chain AI agents.

**If Somnia wants to be the #1 chain for AI agents, SomniaPush is the infrastructure that makes it possible.**

---

## 📚 Additional Resources

- **Live Dashboard**: [https://somnia-git-agent.onrender.com/dashboard](https://somnia-git-agent.onrender.com/dashboard)
- **Backend API**: [https://somnia-git-agent.onrender.com](https://somnia-git-agent.onrender.com)
- **Agent Template Repository**: [https://github.com/xaviersharwin10/gitAgent](https://github.com/xaviersharwin10/gitAgent)
- **Platform Repository**: [https://github.com/xaviersharwin10/somnia-git-agent](https://github.com/xaviersharwin10/somnia-git-agent)
- **CLI Package**: [npmjs.com/package/git-somnia-agent](https://www.npmjs.com/package/git-somnia-agent)
- **Somnia Documentation**: [docs.somnia.network](https://docs.somnia.network)
- **Somnia Testnet Faucet**: [testnet.somnia.network](https://testnet.somnia.network)

---

## 📄 License

MIT License - See [LICENSE](../LICENSE) file for details.

---

<div align="center">

**🚀 SomniaPush: Making AI agent deployment as simple as `git push`**

Built with ❤️ for the [Somnia AI Hackathon](https://x.com/SomniaEco)

[Live Demo](https://somnia-git-agent.onrender.com/dashboard) • [Documentation](../README.md) • [GitHub](https://github.com/xaviersharwin10/somnia-git-agent)

</div>
