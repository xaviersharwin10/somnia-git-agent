# GitAgent Dashboard Setup Guide

## 🎨 Dashboard Features

Your GitAgent platform now has a **beautiful, real-time dashboard** that shows:

1. **📋 Active Agents** - List of all deployed agents with status
2. **💰 Real-time Price & Decisions** - Live SOMI price and AI trading decisions
3. **📊 Live Agent Logs** - Real-time streaming of agent logs

## 🚀 Setup Steps

### 1. Install New Dependencies

```bash
# Backend needs cors
cd backend
npm install cors

# Agent template needs axios for price feed
cd ../agent-template
npm install axios
```

### 2. Restart Backend

```bash
cd backend
# Stop current server (Ctrl+C) then:
npm run dev
```

### 3. Push Agent Template Updates

```bash
cd agent-template
git add .
git commit -m "Add real price feed and update model"
git push origin main
```

This will:
- Update the agent with real CoinGecko price feed (~$0.40 for SOMI)
- Use the correct Groq model (`llama-3.1-8b-instant`)
- Auto-reload the agent via webhook

### 4. Open Dashboard

**Option A: Via Backend Route**
```
http://localhost:3005/dashboard
```

**Option B: Direct File**
Open `dashboard/index.html` in your browser, but make sure to change `API_BASE` in the script if needed.

## 📊 Dashboard Features

### Real-time Updates
- **Agents list** refreshes every 10 seconds
- **Logs** refresh every 5 seconds
- **Price & decisions** extracted automatically from logs

### Color-Coded Logs
- 🟢 **Green** - Success messages, BUY signals
- 🔵 **Blue** - Info messages (PriceFeed, AI Decision)
- 🔴 **Red** - Errors

### Statistics
- Last SOMI price
- Total decisions made
- Total BUY signals
- Latest decision (BUY/HOLD)

## 🔧 Configuration

If your backend runs on a different port, edit `dashboard/index.html`:

```javascript
const API_BASE = 'http://localhost:3005'; // Change this
```

## 🎯 Next Steps

1. **Test the dashboard** - Open http://localhost:3005/dashboard
2. **Watch real prices** - See actual SOMI prices from CoinGecko
3. **Monitor decisions** - Watch your AI agent make trading decisions
4. **Check logs** - Debug and monitor in real-time

## 📝 Notes

- **Price Feed**: Uses CoinGecko API with fallback to ~$0.40 if API fails
- **CORS**: Enabled in backend for dashboard access
- **Logs Endpoint**: New `/api/logs/:branch_hash` endpoint for easier access
- **Auto-refresh**: Dashboard updates automatically

Enjoy your **production-ready GitAgent platform with beautiful UI**! 🎉

