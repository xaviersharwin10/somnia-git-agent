# 🚀 Complete GitAgent Platform Setup Guide

This guide walks you through setting up and running the entire GitAgent platform from scratch.

## Prerequisites

- Node.js 16+ installed
- A GitHub account
- A wallet with testnet tokens (for Somnia testnet)
- Groq API key (free from https://console.groq.com/)
- ngrok account (free from https://ngrok.com/)

---

## Step 1: Deploy the AgentFactory Contract

### 1.1 Navigate to the contracts directory
```bash
cd /home/sharwin/GitFi
```

### 1.2 Deploy to Somnia Testnet
```bash
# First, make sure you have a .env file or set PRIVATE_KEY as environment variable
export PRIVATE_KEY="your-private-key-without-0x-prefix"

# Deploy the AgentFactory
npx hardhat run scripts/deploy.js --network somnia
```

### 1.3 Copy the AgentFactory Address
You'll see output like:
```
✅ AgentFactory deployed to: 0x1234567890abcdef...
```
**Copy this address** - you'll need it for Step 2!

---

## Step 2: Set Up the Backend Server

### 2.1 Navigate to backend directory
```bash
cd /home/sharwin/GitFi/backend
```

### 2.2 Create .env file
```bash
cp env.example .env
```

### 2.3 Fill in the .env file
Edit `.env` with your actual values:

```env
# Your wallet's private key (the one you used in Step 1, without 0x)
BACKEND_PRIVATE_KEY=your-private-key-here

# Somnia RPC (already correct)
SOMNIA_RPC_URL=https://dream-rpc.somnia.network

# The AgentFactory address from Step 1.3
AGENT_FACTORY_ADDRESS=0x1234567890abcdef...

# Generate a random secret key
MASTER_SECRET_KEY=$(openssl rand -base64 32)
# Or manually: paste a long random string

PORT=3000
```

### 2.4 Start the backend server
```bash
npm run dev
```

You should see:
```
🚀 GitAgent Backend Server Started
📡 Server running on port 3000
✅ Database initialization completed
```

**Keep this terminal running!**

---

## Step 3: Expose Backend with ngrok

### 3.1 Install ngrok (if not installed)
```bash
# On Linux
sudo snap install ngrok
# Or download from https://ngrok.com/download
```

### 3.2 Sign up and get auth token
1. Go to https://ngrok.com/
2. Sign up for free account
3. Get your authtoken from dashboard

### 3.3 Configure ngrok
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### 3.4 Start ngrok tunnel
Open a **NEW terminal** and run:
```bash
ngrok http 3000
```

You'll see output like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

**Copy the https:// URL** (e.g., `https://abc123.ngrok.io`) - you'll need this for Step 5!

**Keep this terminal running too!**

---

## Step 4: Create a GitHub Repository

### 4.1 Push the agent-template to GitHub
```bash
cd /home/sharwin/GitFi/agent-template
git init
git add .
git commit -m "Initial commit: GitAgent AI trading bot template"

# Create a new repository on GitHub first, then:
git remote add origin https://github.com/yourusername/your-repo-name.git
git branch -M main
git push -u origin main
```

### 4.2 Make sure your repository is public (or has webhook access)
- Go to your GitHub repository settings
- Ensure webhooks can be added

---

## Step 5: Configure GitHub Webhook

### 5.1 Go to Repository Settings
1. Navigate to your GitHub repository
2. Click **Settings** → **Webhooks** → **Add webhook**

### 5.2 Configure the Webhook
- **Payload URL**: `https://abc123.ngrok.io/webhook/github/push` (use your ngrok URL)
- **Content type**: `application/json`
- **Secret**: (optional, leave empty for now)
- **Events**: Select **Just the push event**
- Click **Add webhook**

### 5.3 Test the Webhook
GitHub will send a test payload. Check your backend terminal - you should see:
```
--- GitHub Webhook Received ---
```

---

## Step 6: Install the GitAgent CLI

### 6.1 Navigate to CLI directory
```bash
cd /home/sharwin/GitFi/git-agent-cli
```

### 6.2 Install globally (for development, use npm link)
```bash
npm link
```

This makes `git-agent` command available globally.

### 6.3 Test the CLI
```bash
git agent --help
```

You should see the help menu!

---

## Step 7: Initialize Your Repository

### 7.1 Navigate to your agent repository
```bash
cd /home/sharwin/GitFi/agent-template
# Or wherever your cloned repository is
```

### 7.2 Run init command
```bash
git agent init
```

This will:
- Ask for your GitHub repository URL (auto-detected)
- Create `.gitagent.json` file

### 7.3 Update CLI API URL (if needed)
Edit `/home/sharwin/GitFi/git-agent-cli/index.js`:
```javascript
const API_BASE_URL = 'https://abc123.ngrok.io'; // Your ngrok URL
```

---

## Step 8: Set Your Secrets

### 8.1 Get a Groq API Key
1. Go to https://console.groq.com/
2. Sign up/login
3. Create an API key
4. Copy the key (starts with `sk-...`)

### 8.2 Set the secret via CLI
```bash
cd /home/sharwin/GitFi/agent-template
git agent secrets set GROQ_API_KEY=sk-your-actual-groq-key-here
```

You should see:
```
Setting secret GROQ_API_KEY for branch main...
✅ Secret GROQ_API_KEY set.
```

### 8.3 (Optional) Set custom AI prompt
```bash
git agent secrets set AI_PROMPT="You are an aggressive degen trader. Should I 'BUY' or 'HOLD'?"
```

---

## Step 9: Deploy Your Agent!

### 9.1 Make a commit and push
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 9.2 Watch the Magic Happen! ✨

**In your backend terminal**, you should see:
```
Processing push for branch: main (0x1234...)
New branch main detected. Deploying new agent...
✅ New agent deployed! Contract address: 0xabcd...
Agent saved to database.
Agent 1 started with PID 12345
```

**In your ngrok terminal**, you'll see the webhook request come through.

---

## Step 10: Verify Everything is Working

### 10.1 Check agent is running
```bash
# In backend directory
pm2 list
```

You should see your agent process running!

### 10.2 Check agent logs
```bash
pm2 logs <agent-name>
```

Or check the backend logs for agent output.

### 10.3 Check the database
```bash
cd /home/sharwin/GitFi/backend
# Check agents table
sqlite3 db.sqlite "SELECT * FROM agents;"
```

---

## 🎉 That's It! Your Agent is Live!

### What Happens Next:
1. Every `git push` triggers the webhook
2. Backend pulls latest code
3. PM2 reloads the agent with fresh code and secrets
4. Agent continues making AI trading decisions every 30 seconds

### Useful Commands:
```bash
# Check agent status via CLI (when Day 7 endpoints are ready)
git agent stats
git agent logs

# View all agents
curl http://localhost:3000/api/agents

# Restart an agent
curl -X POST http://localhost:3000/api/agents/1/restart
```

---

## 🔧 Troubleshooting

### Backend won't start
- Check `.env` file has all required variables
- Make sure port 3000 is not in use
- Check database permissions

### ngrok not working
- Verify authtoken is set
- Check firewall settings
- Try a different port

### Webhook not triggering
- Check ngrok URL is correct in GitHub settings
- Verify backend is running
- Check backend logs for incoming requests

### Agent not deploying
- Check backend has enough testnet tokens
- Verify AgentFactory address is correct
- Check PM2 is installed (`npm install -g pm2`)

### Secrets not working
- Verify secret was set for correct branch
- Check backend MASTER_SECRET_KEY matches
- Verify API_BASE_URL in CLI matches ngrok URL

---

## 📝 Summary Checklist

- [ ] AgentFactory contract deployed
- [ ] Backend .env configured
- [ ] Backend server running on port 3000
- [ ] ngrok tunnel active
- [ ] GitHub repository created and pushed
- [ ] GitHub webhook configured
- [ ] CLI installed and linked
- [ ] Repository initialized with `git agent init`
- [ ] Secrets set via CLI
- [ ] Code pushed to trigger deployment
- [ ] Agent running and making decisions!

🎊 **Congratulations! You have a fully functional GitAgent platform!** 🎊
