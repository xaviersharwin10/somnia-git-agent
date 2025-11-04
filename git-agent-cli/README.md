# SomniaPush CLI

**Built for the Somnia AI Hackathon** - Command-line tool for interacting with the SomniaPush platform on Somnia blockchain.

SomniaPush makes deploying AI agents on Somnia as simple as `git push`. This CLI lets you manage your Somnia agents directly from the command line.

## Installation

### Quick Install (For Users)

**Option 1: Install from npm (Recommended - after publishing)**
```bash
npm install -g git-somnia-agent

# Set up Git alias to use as 'git somnia-agent'
git config --global alias.somnia-agent '!git-somnia-agent'

# Then use:
git somnia-agent stats
git somnia-agent compare main aggressive
```

**Option 2: Install from GitHub (Current)**
```bash
git clone https://github.com/xaviersharwin10/somnia-git-agent.git
cd somnia-git-agent/git-agent-cli
npm install -g .

# Set up Git alias
git config --global alias.somnia-agent '!git-somnia-agent'
```

### Development
```bash
npm link
```

## Commands

* `git somnia-agent init` - Initialize SomniaPush in your repository.
* `git somnia-agent secrets set <KEY=VALUE>` - Set a secret for the current branch (e.g., `GROQ_API_KEY=sk-...`).
* `git somnia-agent stats` - Get real-time stats for the current branch's agent on Somnia.
* `git somnia-agent logs` - Get the last 50 lines of agent logs.
* `git somnia-agent compare <branch1> <branch2>` - Compare performance between two agent branches.

**Note**: After installing, you need to set up the Git alias once:
```bash
git config --global alias.somnia-agent '!git-somnia-agent'
```

Then you can use `git somnia-agent` as shown above.

## Features

- 🚀 **Easy Initialization**: Interactive setup with sensible defaults
- 🔐 **Secure Secrets**: Encrypted secret storage per branch for Somnia agents
- 📊 **Real-time Monitoring**: Live stats and logs from agents running on Somnia
- 🔄 **Branch Comparison**: Side-by-side performance comparison for A/B testing
- ⛓️ **Somnia Integration**: Works with agents deployed on Somnia testnet
- 🎨 **Beautiful Output**: Color-coded messages and clear feedback
- ⚡ **Fast**: Lightweight and responsive CLI experience

## Somnia Blockchain Integration

This CLI works with SomniaPush platform that deploys AI agents as smart contracts on **Somnia testnet**:
- Each agent branch = separate smart contract on Somnia
- Agents can execute trades on Somnia DEXs
- On-chain agent registry via AgentFactory contract
- Full blockchain integration for autonomous agents

## Usage

### Initialize a Repository

```bash
git somnia-agent init
```

This will:
- Create a `.gitagent.json` file in your repository
- Prompt for your GitHub repository URL
- Provide next steps for deployment to Somnia

### Set Secrets

```bash
git somnia-agent secrets set GROQ_API_KEY=sk-your-key-here
git somnia-agent secrets set AGENT_PRIVATE_KEY=0x...
git somnia-agent secrets set AI_PROMPT="You are an aggressive trader"
```

Secrets are encrypted and stored securely for the current branch. These are injected into your agent when deployed on Somnia.

### Get Agent Information

```bash
git somnia-agent stats    # Get performance stats from Somnia agents
git somnia-agent logs     # Get agent logs
```

### Compare Branches

Compare different agent strategies deployed on Somnia:
```bash
git somnia-agent compare main aggressive
```

This shows side-by-side comparison of agent performance metrics.

## Configuration

The CLI creates a `.gitagent.json` file in your repository root:

```json
{
  "repo_url": "https://github.com/username/repo.git"
}
```

## Development

To test the CLI locally:

```bash
npm link
git somnia-agent --help
```

## About Somnia AI Hackathon

This CLI is part of **SomniaPush** - an infrastructure project for the Somnia AI Hackathon that makes deploying AI agents on Somnia blockchain as simple as `git push`.

**Track**: Infra Agents  
**Repository**: https://github.com/xaviersharwin10/somnia-git-agent  
**Live Dashboard**: https://somnia-git-agent.onrender.com/dashboard

## Requirements

- Node.js 16+
- Git repository
- SomniaPush backend (production: https://somnia-git-agent.onrender.com)






