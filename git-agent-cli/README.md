# GitAgent CLI

This is the command-line tool for interacting with the GitAgent platform.

## Installation

### Quick Install (For Users)
```bash
# Install globally from GitHub
npm install -g git-agent-cli

# Or clone and install locally
git clone https://github.com/xaviersharwin10/somnia-git-agent.git
cd somnia-git-agent/git-agent-cli
npm install -g .
```

### Development
```bash
npm link
```

## Commands

* `git agent init` - Initialize GitAgent in a repo.
* `git agent secrets set <KEY=VALUE>` - Set a secret for the current branch.
* `git agent stats` - Get real-time stats for the current branch's agent.
* `git agent logs` - Get the last 50 lines of agent logs.
* `git agent compare <branch1> <branch2>` - Compare performance between two branches.

## Features

- 🚀 **Easy Initialization**: Interactive setup with sensible defaults
- 🔐 **Secure Secrets**: Encrypted secret storage per branch
- 📊 **Real-time Monitoring**: Live stats and logs from running agents
- 🔄 **Branch Comparison**: Side-by-side performance comparison
- 🎨 **Beautiful Output**: Color-coded messages and clear feedback
- ⚡ **Fast**: Lightweight and responsive CLI experience

## Usage

### Initialize a Repository

```bash
git agent init
```

This will:
- Create a `.gitagent.json` file in your repository
- Prompt for your GitHub repository URL
- Provide next steps for deployment

### Set Secrets

```bash
git agent secrets set GROQ_API_KEY=sk-your-key-here
git agent secrets set AI_PROMPT="You are an aggressive trader"
```

Secrets are encrypted and stored securely for the current branch.

### Get Agent Information

```bash
git agent stats    # Get performance stats
git agent logs     # Get agent logs
```

### Compare Branches

```bash
git agent compare main feature-branch
```

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
git agent --help
```

## Features

- 🚀 **Easy Initialization**: Interactive setup with sensible defaults
- 🔐 **Secure Secrets**: Encrypted secret storage per branch
- 📊 **Agent Monitoring**: Stats and logs for deployed agents
- 🔄 **Branch Comparison**: Compare performance across branches
- 🎨 **Beautiful Output**: Color-coded messages and clear feedback
- ⚡ **Fast**: Lightweight and responsive CLI experience

## Requirements

- Node.js 16+
- Git repository
- GitAgent backend running (for full functionality)






