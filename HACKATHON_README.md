# GitAgent: "Vercel for AI Agents"

**Track:** Infra Agents  
**One-Line Pitch:** A "zero-friction," Git-native deployment platform. `git push` is your deploy. `git branch` is your A/B test.

## The Problem

Deploying and managing AI agents is complex, manual, and high-friction. Developers face:

- **Manual Deployment**: Complex setup processes for each agent
- **No A/B Testing**: Difficult to test different agent strategies in parallel
- **Secret Management**: Insecure handling of API keys and credentials
- **Monitoring**: No unified way to track agent performance and logs
- **Scaling**: Hard to manage multiple agent versions and rollbacks

## The Solution

GitAgent solves this by mapping the agent lifecycle to the Git workflow, making AI agent deployment as simple as pushing code.

### Core Features

#### 🚀 `git push` to Deploy
- GitHub webhook triggers automatic agent deployment
- Clones your repository and runs your agent code
- Injects secrets securely as environment variables
- Manages agent lifecycle with PM2 process management

#### 🔄 `git branch` for A/B Testing
- Each branch deploys as a separate, parallel agent
- Compare performance between different strategies
- Easy rollbacks with `git revert`
- Collaborative development with team members

#### 🛠️ The `git agent` CLI
- `git agent init` - Initialize GitAgent in your repository
- `git agent secrets set GROQ_API_KEY=...` - Secure secret management
- `git agent stats` - Real-time agent performance metrics
- `git agent logs` - Live agent output and decisions
- `git agent compare main aggressive` - Side-by-side branch comparison

## Somnia Blockchain Integration ⛓️

**This is NOT just a webhook system. Every agent is a deployed smart contract on Somnia:**

1. **On-Chain Agent Registry** (`AgentFactory.sol`)
   - Deploys unique `Agent.sol` contracts for each repo/branch on Somnia testnet
   - Creates immutable, on-chain identity for each AI agent
   - Tracks all agents in a blockchain-backed registry

2. **Agent Smart Contracts** (`Agent.sol`)
   - Each agent is a deployed contract on Somnia with its own address
   - Agents can receive and hold SOMI tokens (ownable vault)
   - Can execute arbitrary calls to DEXs, DeFi protocols on Somnia
   - Immutable proof of deployment on-chain

3. **Somnia Testnet Deployment**
   - All contracts deployed to Somnia testnet (`chainId: 50312`)
   - Uses Somnia RPC (`https://dream-rpc.somnia.network`)
   - Agents interact with Somnia's DeFi ecosystem
   - **Deployed Contract**: [Add your AgentFactory address after deployment]
   - **Network**: Somnia Testnet (Chain ID: 50312)

4. **Git → Blockchain → AI Pipeline**
   ```
   git push → GitHub webhook → Backend → Deploy Agent.sol on Somnia 
   → Clone code → Run AI agent → Agent can execute trades on Somnia DEXs
   ```

## Architecture Diagram

```
Developer → git push
    ↓
GitHub Webhook → GitAgent Backend
    ↓
Deploy Agent.sol contract on Somnia Testnet
    ↓
Agent gets on-chain address (0x...)
    ↓
Clone code & inject secrets
    ↓
Run AI agent (PM2)
    ↓
Agent can execute trades/DeFi on Somnia via contract.execute()
```

## Live Demo

[Link to 5-Minute Demo Video]

## How it Was Built

**Tech Stack:**
- **Smart Contracts**: Solidity (Agent.sol, AgentFactory.sol)
- **Backend**: Node.js, Express, SQLite
- **Process Management**: PM2
- **Blockchain**: ethers.js, Somnia testnet
- **CLI**: Commander.js, Chalk, Inquirer
- **Deployment**: Docker, GitHub Webhooks
- **AI Integration**: Groq SDK, TypeScript

## Getting Started

1. **Create a new agent:**
   ```bash
   npx create-somnia-agent my-ai-bot
   cd my-ai-bot
   ```

2. **Set up GitAgent:**
   ```bash
   npm install -g git-agent-cli
   git agent init
   git agent secrets set GROQ_API_KEY=your-key
   ```

3. **Deploy:**
   ```bash
   git push origin main
   ```

4. **Monitor:**
   ```bash
   git agent stats
   git agent logs
   ```

## The "Wow" Moment

Create a new branch, modify your AI prompt, and push:

```bash
git checkout -b aggressive
# Edit agent.ts with new prompt
git push origin aggressive
git agent compare main aggressive
```

**Two AI agents running in parallel from the same repository!**

## Why This Matters for Somnia

### 🎯 **Infrastructure Track Fit**
This is infrastructure that makes deploying Somnia agents **10x easier**. Before GitAgent:
- ❌ Manual contract deployment for each agent
- ❌ No way to track which agents are deployed
- ❌ Difficult to manage multiple agent versions
- ❌ No unified deployment workflow

After GitAgent:
- ✅ `git push` auto-deploys agents to Somnia
- ✅ On-chain registry tracks all agents
- ✅ Each branch = separate agent contract
- ✅ Production-ready deployment pipeline

### 🔗 **Somnia-Specific Benefits**
- **On-Chain Identity**: Every agent has a Somnia contract address
- **Token Management**: Agents can hold/receive SOMI tokens
- **DeFi Integration**: Agents can interact with Somnia DEXs/protocols
- **Blockchain-Backed**: Agent registry is immutable on Somnia
- **Recovery**: Can recover agent addresses even if backend is lost

### 💡 **Real-World Use Cases**
1. **DeFi Trading Agents**: Deploy trading bots that execute on Somnia DEXs
2. **A/B Testing Strategies**: Test different AI strategies as separate contracts
3. **Team Collaboration**: Multiple devs can deploy agents from same repo
4. **Production Deployment**: Git-based CI/CD for blockchain agents

This bridges the gap between **Git workflows** (what devs know) and **on-chain agent deployment** (Somnia's future).

## Future Roadmap

- **Multi-chain Support**: Deploy to multiple blockchains
- **Advanced Analytics**: Profit/loss tracking, performance metrics
- **Team Features**: Shared secrets, team dashboards
- **Marketplace**: Pre-built agent templates
- **Auto-scaling**: Dynamic resource allocation based on performance

---

**GitAgent: Making AI agent deployment as simple as `git push`** 🚀
