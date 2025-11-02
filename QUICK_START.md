# ⚡ Quick Start Guide - Get Running in 10 Minutes

## 🎯 Quick Setup Steps

### 1️⃣ Deploy Contract (2 minutes)
```bash
cd /home/sharwin/GitFi
export PRIVATE_KEY="your-key-here"
npx hardhat run scripts/deploy.js --network somnia
# Copy the AgentFactory address!
```

### 2️⃣ Configure Backend (2 minutes)
```bash
cd backend
cp env.example .env
# Edit .env with:
# - BACKEND_PRIVATE_KEY (same as above)
# - AGENT_FACTORY_ADDRESS (from step 1)
# - MASTER_SECRET_KEY (run: openssl rand -base64 32)
npm run dev
```

### 3️⃣ Expose with ngrok (1 minute)
```bash
# In new terminal
ngrok http 3000
# Copy the https:// URL!
```

### 4️⃣ Create GitHub Repo (2 minutes)
```bash
cd agent-template
git init
git add .
git commit -m "Initial commit"
# Create repo on GitHub, then:
git remote add origin https://github.com/username/repo.git
git push -u origin main
```

### 5️⃣ Add Webhook (1 minute)
- GitHub → Settings → Webhooks → Add webhook
- URL: `https://your-ngrok-url.ngrok.io/webhook/github/push`
- Events: Just push
- Save

### 6️⃣ Install CLI & Set Secrets (2 minutes)
```bash
cd git-agent-cli
npm link

cd ../agent-template
git agent init
git agent secrets set GROQ_API_KEY=sk-your-key-here
```

### 7️⃣ Deploy! 🚀
```bash
git push origin main
# Watch the backend terminal for deployment!
```

## ✅ Done! Your agent is now running!

For detailed instructions, see `COMPLETE_SETUP_GUIDE.md`
