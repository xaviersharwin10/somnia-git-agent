# ✅ Webhook Response Verification Guide

## What You're Seeing (GOOD!)

**GitHub Webhook Response:**
```
Status: 200 OK
Body: "Webhook received, processing..."
```

This means:
- ✅ GitHub received a valid response (no more ngrok errors!)
- ✅ Backend is responding quickly (within milliseconds)
- ✅ Processing happens in the background

## What Should Happen Next

After the webhook response, check your **backend terminal logs**. You should see:

### For New Agents:
```
Processing push for branch: main (0x...)
New branch main detected. Deploying new agent...
Registering agent with branch_hash: 0x...
Transaction sent: 0x..., waiting for confirmation...
Transaction confirmed in block 12345
✅ Agent contract found/deployed at: 0x...
Cloning repository...
Agent directory exists. Pulling latest code...
Created new agent record in database.
✅ New agent deployed, cloned, and started
Agent 1 started with PID 12345
```

### For Existing Agents:
```
Processing push for branch: main (0x...)
Agent found on-chain at: 0x...
Agent for main already exists. Pulling latest code...
✅ Agent main updated successfully
Agent 1 reloaded with PID 12345
```

## How to Verify Everything Worked

### 1. Check Backend Terminal
Look for the logs above. If you see errors, note them down.

### 2. Check Database
```bash
cd /home/sharwin/GitFi/backend
sqlite3 db.sqlite "SELECT * FROM agents;"
```

You should see your agent with:
- `repo_url`: Your GitHub repo URL
- `branch_name`: main
- `agent_address`: The deployed contract address
- `status`: running

### 3. Check PM2 Processes
```bash
pm2 list
```

You should see a process running with:
- Name: The branch_hash
- Status: online
- PID: Process ID

### 4. Check Agent Logs
```bash
pm2 logs <process-name-or-id>
```

You should see your agent's output (AI decisions, price updates, etc.)

## Troubleshooting

### If you see NO logs after webhook:
- Check if backend server is running
- Check backend terminal for errors
- Verify database is accessible

### If you see errors in logs:
- **RPC errors**: Check internet connection, verify RPC URL
- **Git clone errors**: Check repository is public or credentials are set
- **PM2 errors**: Check PM2 is installed (`npm install -g pm2`)
- **Database errors**: Check file permissions on `db.sqlite`

### If agent doesn't start:
- Check secrets are set: `SELECT * FROM secrets WHERE agent_id = 1;`
- Check agent.ts file exists in cloned repo
- Check PM2 logs for specific errors

## Expected Flow

1. **GitHub Push** → Webhook sent
2. **Backend receives** → Responds immediately ✅ (What you're seeing)
3. **Background processing starts**:
   - Check/register contract
   - Clone/pull repository
   - Install dependencies
   - Start PM2 process
4. **Agent runs** → Makes AI decisions every 30 seconds

## Summary

✅ **"Webhook received, processing..."** = Everything working correctly!

The backend is:
- Responding to GitHub properly
- Processing your deployment in the background
- Logging everything to console

**Check your backend terminal** to see the full deployment process! 🚀
