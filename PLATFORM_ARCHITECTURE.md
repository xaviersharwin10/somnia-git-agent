# GitAgent Platform Architecture

## 🔄 How Multiple Repositories Work

### Current Setup

**One Backend Instance = One Platform**

- Multiple users can use the same GitAgent backend instance
- Each user:
  1. Forks/clones the `agent-template` repository
  2. Creates their own GitHub repository (e.g., `github.com/user1/my-agent`)
  3. Configures webhook pointing to the GitAgent backend URL
  4. Pushes code → Backend deploys their agent

- **All agents are stored in the same backend database**
- **Dashboard shows ALL agents from ALL repositories** using that backend

### Database Structure

The `agents` table stores:
- `repo_url`: Which repository the agent came from (e.g., `github.com/user1/my-agent`)
- `branch_name`: Which branch (e.g., `main`, `aggressive`)
- `branch_hash`: Unique identifier (hash of `repo_url + branch_name`)
- `agent_address`: On-chain contract address on Somnia

### Example Scenario

**User A's Repository:**
- `github.com/userA/trading-bot` → `main` branch → Agent deployed ✅
- `github.com/userA/trading-bot` → `aggressive` branch → Agent deployed ✅

**User B's Repository:**
- `github.com/userB/defi-agent` → `main` branch → Agent deployed ✅

**Dashboard shows:** All 3 agents from both users!

---

## 📦 How Dependency Management Works

### The Problem
Users clone the template and add new imports like:
```typescript
import { SomniaSDK } from 'somnia-sdk';
import { SomeOtherPackage } from 'some-other-package';
```

### The Solution

**Step 1: User installs locally**
```bash
cd agent-template
npm install somnia-sdk --save
# This updates package.json automatically
```

**Step 2: User commits and pushes**
```bash
git add package.json package-lock.json agent.ts
git commit -m "Add Somnia SDK"
git push origin main
```

**Step 3: Backend automatically installs**
When the webhook is triggered:
1. Backend clones/pulls the repo
2. Backend runs `npm install` (reads `package.json`)
3. All dependencies from `package.json` are installed
4. Agent runs with all dependencies available

### Key Points

✅ **Automatically handled:** Backend runs `npm install` on every push  
✅ **No manual steps:** Just commit `package.json` and push  
✅ **TypeScript support:** Works with any npm package  
✅ **Version locking:** `package-lock.json` ensures consistent versions

### Example Flow

```
User adds: import axios from 'axios';
↓
npm install axios --save  (updates package.json)
↓
git add package.json package-lock.json
git commit -m "Add axios"
git push
↓
Backend webhook triggered
↓
Backend runs: npm install  (installs axios + all dependencies)
↓
Agent runs successfully with axios available
```

---

## 🦄 Somnia DEX Integration

### How It Works

The agent can now execute **real swaps** on Somnia DEX using the `SomniaRouter` contract.

### Configuration

Set these secrets via `git agent secrets set`:

```bash
git agent secrets set SOMNIA_ROUTER_ADDRESS=0x...
git agent secrets set TOKEN_IN_ADDRESS=0x...      # e.g., wSTT
git agent secrets set TOKEN_OUT_ADDRESS=0x...      # e.g., USDC
git agent secrets set AGENT_PRIVATE_KEY=0x...      # For signing transactions
```

### Implementation

The agent:
1. Checks if DEX is configured (router address + tokens)
2. Gets token balance from wallet
3. Calculates swap amount (e.g., 1% of balance)
4. Gets expected output via `router.getAmountsOut()`
5. Approves router to spend tokens
6. Executes swap via `router.swapExactTokensForTokens()`
7. Records metrics with transaction hash

### Fallback Behavior

If DEX not configured:
- Falls back to simple token transfer (sends SOMI to contract)
- Still proves on-chain execution
- Still records metrics

### Reference

Based on: [Somnia DEX Tutorial](https://docs.somnia.network/developer/building-dapps/example-applications/building-a-simple-dex-on-somnia)

---

## 🏗️ Production Improvements (Future)

### Multi-Repository Isolation

**Option 1: Filter by Repository**
- Dashboard could filter agents by `repo_url`
- Users see only their own agents
- Backend API: `/api/agents?repo_url=github.com/user/repo`

**Option 2: User Authentication**
- Add user accounts
- Link repositories to users
- Dashboard shows only user's agents

**Option 3: Separate Backend Instances**
- Each user runs their own backend
- Complete isolation
- More complex deployment

### Current Implementation (Hackathon)

✅ Shows all agents (demonstrates platform capability)  
✅ No user accounts needed (simpler for demo)  
✅ Works for multiple repositories out-of-the-box  
✅ Perfect for showcasing "multi-agent" functionality

---

## 📊 Dashboard Behavior

### What It Shows

The dashboard at `/dashboard` displays:
- **Agent List:** All agents from all repositories using this backend
- **Performance Metrics:** Side-by-side comparison
- **Live Logs:** From selected agent
- **Stats:** Real-time decision counts, trades, success rates

### Identification

Agents are identified by:
- **Branch name** (e.g., `main`, `aggressive`)
- **Repository URL** (in database, shown in API responses)
- **Contract address** (on-chain)

For multiple repos with same branch name, you can distinguish by:
- Contract address
- Repository URL (in agent details)
- Metrics/trading history

---

## 🚀 Summary

**Dependency Management:**
- ✅ Automatic via `npm install` on push
- ✅ Users add packages to `package.json`
- ✅ Backend handles installation

**Multi-Repository:**
- ✅ All repos share one backend instance
- ✅ Dashboard shows all agents
- ✅ Perfect for hackathon demo

**DEX Integration:**
- ✅ Real swaps via SomniaRouter
- ✅ Configurable via secrets
- ✅ Fallback for demo mode

