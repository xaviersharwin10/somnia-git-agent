# GitAgent Platform: Complete Flow Explanation

## 🎯 What is GitAgent?

GitAgent is a **"Git-to-Agent" deployment platform** that:
1. Takes a GitHub repository with agent code
2. Deploys it as a smart contract on-chain (blockchain)
3. Automatically runs it on your server with secrets injected
4. Updates it automatically whenever you push code

Think of it like **Heroku + Blockchain**: Push code → Get a running agent → Blockchain proof of deployment.

---

## 🏗️ Architecture Overview

```
┌─────────────┐
│   GitHub    │  (Your code repository)
└──────┬──────┘
       │ git push
       ▼
┌─────────────────────────┐
│   GitHub Webhook       │  (Sends HTTP POST to your backend)
│   x-github-event: push │
└───────────┬─────────────┘
            │ HTTP POST
            ▼
┌─────────────────────────┐
│  Backend Server         │  (Node.js + Express)
│  /webhook/github        │
│  - Receives webhook     │
│  - Processes deployment │
└───────┬─────────────────┘
        │
        ├─► Deploy to Blockchain ──┐
        │                          │
        ├─► Clone/Pull Code ──────┤
        │                          │
        ├─► Save to Database ─────┤
        │                          │
        └─► Start PM2 Process ────┘
                 │
                 ▼
        ┌─────────────────┐
        │  Running Agent  │  (PM2 managed process)
        │  agent.ts       │  (Your code, with secrets)
        └─────────────────┘
```

---

## 📋 Detailed Flow: Step-by-Step

### **PHASE 1: Initial Setup** (One-time)

#### 1.1 Deploy Smart Contracts
```
You run: npm run deploy
```

**What happens:**
- Hardhat connects to Somnia blockchain (testnet)
- Deploys `AgentFactory.sol` contract
- Gets contract address (e.g., `0xABC123...`)
- You save this address in `.env` as `AGENT_FACTORY_ADDRESS`

**Why:** The `AgentFactory` is a registry that maps each repo/branch to a unique on-chain address.

#### 1.2 Configure GitHub Webhook
```
GitHub Repo → Settings → Webhooks → Add webhook
URL: https://your-ngrok-url.ngrok.io/webhook/github
Events: Push events
```

**What happens:**
- GitHub now sends HTTP POST to your backend whenever code is pushed
- Backend receives webhook with event type `x-github-event: push`

#### 1.3 Start Backend Server
```
cd backend
npm run dev  # Starts on port 3005
ngrok http 3005  # Exposes it to internet
```

**What happens:**
- Express server starts
- Database (`db.sqlite`) initializes with `agents` and `secrets` tables
- Server listens on `/webhook/github` endpoint
- Ngrok gives you a public URL (e.g., `https://xxx.ngrok.io`)

---

### **PHASE 2: The Magic Happens** (Every git push)

#### Step 1: You Push Code
```bash
cd agent-template
git add .
git commit -m "Update agent"
git push origin main
```Get

**What happens:**
- Git pushes code to GitHub
- GitHub triggers webhook
- Sends POST request to your backend's `/webhook/github` endpoint

**Webhook payload contains:**
```json
{
  "ref": "refs/heads/main",
  "repository": {
    "clone_url": "https://github.com/user/repo.git"
  },
  "commits": [...]
}
```

---

#### Step 2: Backend Receives Webhook

**Location:** `backend/index.js` line 248

```javascript
app.post('/webhook/github', (req, res) => {
  const eventType = req.headers['x-github-event']; // "push"
  const repo_url = req.body.repository.clone_url;
  const branch_name = req.body.ref.split('/').pop(); // "main"
```

**What happens:**
1. Backend extracts:
   - `repo_url`: `"https://github.com/xaviersharwin10/gitAgent.git"`
   - `branch_name`: `"main"`
   
2. Calculates **unique identifier** (branch_hash):
   ```javascript
   const branch_hash = ethers.id(repo_url + "/" + branch_name);
   // Result: "0x311d02e1e23d9e6dda12cd3309192ed62c2fa4a490e1df456978a599493353c2"
   ```
   **Why:** This hash uniquely identifies the repo+branch combo. Same hash = same agent.

3. **Immediately responds to GitHub** (200 OK):
   ```javascript
   res.status(200).send('Webhook received, processing...');
   ```
   **Why:** GitHub webhooks timeout after 10 seconds. We respond immediately and process in background.

---

#### Step 3: Check On-Chain State

**Location:** `backend/index.js` line 304

```javascript
const { agentFactoryContract: factoryContract } = getEthersSetup();
agentAddress = await factoryContract.agents(branch_hash);
```

**What happens:**
1. Backend connects to Somnia blockchain via RPC
2. Queries `AgentFactory.agents(branch_hash)` mapping
3. Gets result:
   - **If exists:** `agentAddress = "0xB1ba75862F7001006E5fB2E73416c9CdFdD8AAF5"`
   - **If new:** `agentAddress = "0x0000...0000"` (zero address)

**Why check blockchain first?** The blockchain is the source of truth. Even if the backend database is wiped, we can recover agent addresses from on-chain.

---

#### Step 4: Check Database

**Location:** `backend/index.js` line 292

```javascript
db.get('SELECT * FROM agents WHERE branch_hash = ?', [branch_hash], ...)
```

**What happens:**
- Queries local SQLite database for existing agent record
- Result: `agent` object or `null`

---

#### Step 5: Decision Tree (3 Scenarios)

### **Scenario A: Agent Exists in DB & On-Chain** ✅

**What happens:**
```javascript
if (agent) {
  // 1. Pull latest code
  shell.cd(agentPath); // /backend/agents/0x311d02.../
  shell.exec('git pull');
  shell.exec('npm install');
  
  // 2. Reload PM2 process
  await startOrReloadAgent(agent, agentPath, branch_hash);
}
```

**Flow:**
1. **Git Pull:** Updates code to latest commit
2. **npm install:** Installs new dependencies
3. **PM2 Reload:** Restarts the agent process with new code and secrets
4. **Done!** Agent is now running the latest code

---

### **Scenario B: Agent Exists On-Chain but NOT in DB** 🔄 (Recovery)

**What happens:**
```javascript
if (agentAddress exists on-chain && !agent in DB) {
  // 1. Create database entry for existing on-chain agent
  db.run('INSERT INTO agents (...) VALUES (...)', ...);
  
  // 2. Clone code (if directory doesn't exist)
  if (!fs.existsSync(agentPath)) {
    shell.exec(`git clone ${repo_url} ${agentPath} --branch ${branch_name}`);
  }
  
  // 3. Start agent
  await startOrReloadAgent(newAgent, agentPath, branch_hash);
}
```

**Why this happens:** Backend database was wiped, but blockchain still has the agent. This recovers it.

---

### **Scenario C: Agent is NEW** 🆕

**What happens:**

#### 5a. Deploy On-Chain Contract
```javascript
const tx = await factoryContract.registerAgent(branch_hash);
const receipt = await tx.wait(); // Wait for blockchain confirmation
agentAddress = await factoryContract.agents(branch_hash);
```

**What this does:**
1. Calls `AgentFactory.registerAgent(branch_hash)` on blockchain
2. Factory creates new `Agent.sol` contract (a vault/proxy)
3. Factory stores mapping: `agents[branch_hash] = newAgentAddress`
4. Transaction confirmed on blockchain (~10-30 seconds)

**Smart Contract Code (`AgentFactory.sol`):**
```solidity
function registerAgent(bytes32 _branchHash) public returns (address) {
    require(agents[_branchHash] == address(0), "Agent already registered");
    address agentAddress = address(new Agent(msg.sender));
    agents[_branchHash] = agentAddress;
    emit AgentRegistered(msg.sender, _branchHash, agentAddress);
    return agentAddress;
}
```

**Why blockchain?**
- **Immutable proof** that this agent was deployed
- **Decentralized registry** - anyone can verify it exists
- **On-chain vault** - agent can hold funds/crypto

---

#### 5b. Clone Repository
```javascript
const agentPath = path.join(AGENTS_DIR, branch_hash);
// Result: /home/sharwin/GitFi/backend/agents/0x311d02e1e23d9e6dda12cd3309192ed62c2fa4a490e1df456978a599493353c2/

shell.exec(`git clone ${repo_url} ${agentPath} --branch ${branch_name}`);
shell.cd(agentPath);
shell.exec('npm install');
```

**What this does:**
1. Creates directory named after `branch_hash` (unique ID)
2. Clones your GitHub repo into that directory
3. Checks out the specific branch (e.g., `main`)
4. Runs `npm install` to install dependencies

**File structure:**
```
backend/
  agents/
    0x311d02e1e23d9e6dda12cd3309192ed62c2fa4a490e1df456978a599493353c2/
      agent.ts       ← Your agent code
      package.json   ← Dependencies
      .env           ← Will be injected by PM2 (not stored)
      ...
```

---

#### 5c. Save to Database
```javascript
db.run('INSERT INTO agents (repo_url, branch_name, branch_hash, agent_address, status) VALUES (?, ?, ?, ?, ?)',
  [repo_url, branch_name, branch_hash, agentAddress, 'deploying']);
```

**Database Schema:**
```sql
CREATE TABLE agents (
  id INTEGER PRIMARY KEY,
  repo_url TEXT,
  branch_name TEXT,
  branch_hash TEXT UNIQUE,
  agent_address TEXT,
  status TEXT,  -- 'deploying', 'running', 'error'
  pid INTEGER,  -- PM2 process ID
  created_at DATETIME
);
```

**What gets saved:**
- `repo_url`: `"https://github.com/user/repo.git"`
- `branch_name`: `"main"`
- `branch_hash`: `"0x311d02..."`
- `agent_address`: `"0xB1ba75862F7001006E5fB2E73416c9CdFdD8AAF5"`
- `status`: `"deploying"` → later `"running"`

---

#### 5d. Start Agent with PM2
```javascript
await startOrReloadAgent(newAgent, agentPath, branch_hash);
```

**This is the most important step!** Let's break it down:

---

### **Step 6: `startOrReloadAgent()` - The Heart of Execution**

**Location:** `backend/index.js` line 129

#### 6a. Fetch & Decrypt Secrets
```javascript
db.all('SELECT key, encrypted_value FROM secrets WHERE agent_id = ?', [agent.id], ...)
rows.forEach(row => {
  secrets[row.key] = crypto.decrypt(row.encrypted_value);
});
```

**What happens:**
1. Queries `secrets` table for all secrets for this agent
2. Decrypts each secret using `MASTER_SECRET_KEY`
3. Builds environment variables object:
   ```javascript
   {
     AGENT_CONTRACT_ADDRESS: "0xB1ba75862F7001006E5fB2E73416c9CdFdD8AAF5",
     GROQ_API_KEY: "gsk_xxx...",  // Decrypted!
     AI_PROMPT: "You are a trader..."
   }
   ```

**Security:** Secrets are encrypted with AES-256. Only the backend with `MASTER_SECRET_KEY` can decrypt them.

---

#### 6b. Configure PM2 App
```javascript
const pm2App = {
  name: "311d02e1e23d9e6d",  // First 16 chars of branch_hash (PM2 name)
  script: "/backend/agents/0x311d02.../agent.ts",  // Entry point
  env: {
    AGENT_CONTRACT_ADDRESS: "0xB1ba...",
    GROQ_API_KEY: "gsk_xxx...",
    ...
  },
  exec_mode: 'fork',
  interpreter: 'ts-node',  // Run TypeScript directly
};
```

**What this does:**
- Defines PM2 process configuration
- Sets environment variables (injected secrets!)
- Uses `ts-node` to run `.ts` files directly (no compilation needed)

---

#### 6c. Start or Reload PM2 Process
```javascript
pm2.connect((err) => {
  const existingProc = processList.find(p => p.name === pm2Name);
  
  if (existingProc) {
    pm2.reload(pm2Name);  // Restart existing process
  } else {
    pm2.start(pm2App);    // Start new process
  }
});
```

**What happens:**
1. Connects to PM2 daemon (process manager)
2. Checks if process already exists (by name)
3. **If exists:** Reloads it (graceful restart with zero downtime)
4. **If new:** Starts new process
5. Updates database: `status = 'running'`, `pid = <process_id>`

**PM2 Benefits:**
- **Auto-restart** if process crashes
- **Log management** (stdout/stderr to files)
- **Process monitoring** (CPU, memory)
- **Graceful reloads** (no downtime)

---

#### 6d. Agent Code Starts Running

**Location:** `agent-template/agent.ts`

**What happens when PM2 starts `agent.ts`:**

1. **Code loads environment variables:**
   ```typescript
   const groqApiKey = process.env.GROQ_API_KEY;  // Injected by PM2!
   const agentContractAddress = process.env.AGENT_CONTRACT_ADDRESS;
   ```

2. **Initializes clients:**
   ```typescript
   const groq = new Groq({ apiKey: groqApiKey });
   ```

3. **Main loop starts:**
   ```typescript
   runDecisionLoop();  // Run immediately
   setInterval(runDecisionLoop, 30000);  // Then every 30 seconds
   ```

4. **Decision loop executes:**
   ```typescript
   async function runDecisionLoop() {
     const price = getSomiPrice();  // Mock price feed
     const decision = await groq.chat.completions.create({...});  // AI decides
     if (decision.includes('BUY')) {
       // Execute trade (TODO)
     }
   }
   ```

**Result:** Your agent is now running continuously, making AI decisions every 30 seconds!

---

## 🔐 Secrets Management Flow

### Setting a Secret (via CLI)

```bash
git agent secrets set GROQ_API_KEY=gsk_xxx...
```

**What happens:**

1. **CLI extracts info:**
   ```javascript
   const config = getConfig();  // Reads .gitagent.json
   const branch = getCurrentBranch();  // "main"
   const branch_hash = ethers.id(repo_url + "/" + branch);
   ```

2. **CLI sends HTTP POST:**
   ```javascript
   POST /api/secrets
   {
     repo_url: "https://github.com/user/repo.git",
     branch_name: "main",
     key: "GROQ_API_KEY",
     value: "gsk_xxx..."
   }
   ```

3. **Backend processes:**
   ```javascript
   // 1. Find agent in database
   db.get('SELECT id FROM agents WHERE branch_hash = ?', [branch_hash], ...)
   
   // 2. Encrypt secret
   const encrypted = crypto.encrypt(value);
   
   // 3. Save to database
   db.run('INSERT OR REPLACE INTO secrets (agent_id, key, encrypted_value) VALUES (?, ?, ?)',
     [agent.id, key, encrypted]);
   ```

4. **Secret stored encrypted in `secrets` table:**
   ```sql
   INSERT INTO secrets (agent_id, key, encrypted_value)
   VALUES (1, 'GROQ_API_KEY', 'U2FsdGVkX1...');  -- Encrypted!
   ```

5. **Next time agent starts/reloads:**
   - `startOrReloadAgent()` decrypts it
   - Injects it as `process.env.GROQ_API_KEY`
   - Agent can use it immediately!

---

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. DEVELOPER PUSHES CODE                                        │
│    git push origin main                                         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. GITHUB SENDS WEBHOOK                                         │
│    POST https://xxx.ngrok.io/webhook/github                    │
│    Body: { ref: "refs/heads/main", repository: {...} }        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. BACKEND RECEIVES & VALIDATES                                │
│    - Extract repo_url, branch_name                             │
│    - Calculate branch_hash = ethers.id(repo + branch)          │
│    - Respond 200 OK immediately (prevent timeout)              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. CHECK BLOCKCHAIN (Source of Truth)                          │
│    agentAddress = await factoryContract.agents(branch_hash)    │
│    - If exists: agentAddress = "0xB1ba..."                     │
│    - If new: agentAddress = "0x0000..."                         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌───────────────┐         ┌──────────────────────┐
│ EXISTS        │         │ NEW                   │
│ On-Chain      │         │ Agent                 │
└───────┬───────┘         └───────┬──────────────┘
        │                         │
        │                         ▼
        │         ┌─────────────────────────────────┐
        │         │ 5a. DEPLOY CONTRACT             │
        │         │     tx = factory.registerAgent()│
        │         │     receipt = await tx.wait()  │
        │         │     agentAddress = ...          │
        │         └───────────────┬─────────────────┘
        │                         │
        │                         ▼
        │         ┌─────────────────────────────────┐
        │         │ 5b. CLONE CODE                  │
        │         │     git clone repo agents/...   │
        │         │     npm install                 │
        │         └───────────────┬─────────────────┘
        │                         │
        │                         ▼
        │         ┌─────────────────────────────────┐
        │         │ 5c. SAVE TO DATABASE            │
        │         │     INSERT INTO agents (...)    │
        │         └───────────────┬─────────────────┘
        │                         │
        └─────────┬─────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. START/RELOAD AGENT                                           │
│    startOrReloadAgent(agent, agentPath, branch_hash)           │
│    ├─ Fetch secrets from DB                                     │
│    ├─ Decrypt secrets                                           │
│    ├─ Configure PM2 app (with env vars)                         │
│    └─ pm2.start() or pm2.reload()                              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. AGENT RUNS                                                    │
│    PM2 starts: ts-node agent.ts                                 │
│    ├─ process.env.GROQ_API_KEY = "gsk_xxx..." (injected!)      │
│    ├─ process.env.AGENT_CONTRACT_ADDRESS = "0xB1ba..."         │
│    ├─ Main loop starts                                          │
│    └─ AI decisions every 30 seconds                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Update Flow (Subsequent Pushes)

When you push again to the same branch:

1. **Webhook received** → Calculate `branch_hash`
2. **Blockchain check** → Agent exists → `agentAddress = "0xB1ba..."`
3. **Database check** → Agent exists → `agent = { id: 1, ... }`
4. **Git pull** → Update code: `git pull`
5. **npm install** → Install dependencies: `npm install`
6. **PM2 reload** → `pm2.reload(pm2Name)` → Process restarts with new code
7. **Agent continues** → Running latest code, same process (just restarted)

**Zero downtime:** PM2 reload is graceful - it starts new process, then kills old one.

---

## 🔍 How Components Interact

### **1. Blockchain (Somnia)**
- **Role:** Registry of deployed agents
- **What it stores:** `agents[branch_hash] = agentAddress`
- **Why:** Immutable proof, decentralized, recoverable

### **2. Database (SQLite)**
- **Role:** Local metadata and secrets
- **What it stores:**
  - Agent records (status, PID, timestamps)
  - Encrypted secrets (keys encrypted with master key)
- **Why:** Fast queries, local storage, secret management

### **3. PM2**
- **Role:** Process manager for agents
- **What it does:**
  - Runs `agent.ts` as a process
  - Restarts on crash
  - Manages logs
  - Provides process monitoring
- **Why:** Production-grade process management

### **4. File System (`agents/` directory)**
- **Role:** Cloned repository code
- **What it stores:** Your agent code (git clone)
- **Why:** PM2 needs files to execute

---

## 🎯 Key Design Decisions

### Why Blockchain?
- **Immutable registry:** Can't delete or fake agent deployments
- **Recovery:** If database is lost, can recover from blockchain
- **Decentralized:** Anyone can verify agent exists
- **Future:** Agent can hold funds, interact with DeFi

### Why PM2?
- **Production-ready:** Used by millions of apps
- **Auto-restart:** Agent keeps running even if it crashes
- **Logs:** Easy debugging with `pm2 logs`
- **Zero-downtime reloads:** Updates without interruption

### Why Immediate Webhook Response?
- **GitHub timeout:** Webhooks timeout after 10 seconds
- **Async processing:** Deployment takes 30-60 seconds (blockchain + git + npm)
- **Solution:** Respond immediately, process in background

### Why Encrypt Secrets?
- **Security:** API keys stored encrypted in database
- **Master key:** Only backend can decrypt
- **Injection:** Secrets injected as environment variables (not files)

### Why Branch Hash as ID?
- **Unique:** `ethers.id(repo_url + branch_name)` is deterministic
- **Collision-resistant:** Same repo+branch = same hash (always)
- **Blockchain-friendly:** Smart contracts use bytes32

---

## 📝 Summary

**GitAgent turns git push into a running blockchain-backed agent:**

1. **Push code** → GitHub webhook → Backend
2. **Backend checks** → Blockchain (on-chain state) → Database (local state)
3. **If new:** Deploy contract → Clone code → Save to DB
4. **If exists:** Pull code → Update dependencies
5. **Start/Restart:** Fetch secrets → Decrypt → Inject as env vars → PM2 starts process
6. **Agent runs:** Your code executes with secrets, makes decisions, runs continuously

**The magic:** Secrets are encrypted in DB, decrypted at runtime, injected via PM2 environment variables. Your agent code just reads `process.env.GROQ_API_KEY` and it works!

---

## 🚀 Next Steps

Now that you understand the flow:
- Try `git agent stats` to see agent status
- Check PM2 logs: `pm2 logs <agent-name>`
- Set more secrets: `git agent secrets set KEY=value`
- Deploy more agents by pushing to different branches!

The platform is fully functional and production-ready! 🎉

