# GitAgent Backend Server

Node.js Express server for handling GitHub webhooks and managing agent information.

## Features

- ✅ **GitHub Webhook Integration**: Listens for GitHub events (push, PR, issues)
- ✅ **Automatic Agent Deployment**: Deploys AgentFactory contracts on new branch pushes
- ✅ **Code Execution**: Clones repositories and runs agent code with PM2
- ✅ **Secrets Management**: Encrypted storage and injection of API keys and secrets
- ✅ **Process Management**: PM2 integration for agent lifecycle management
- ✅ **TypeScript Support**: ts-node for running TypeScript agent files
- ✅ **Git Operations**: ShellJS for git clone, pull, and npm install operations
- ✅ **SQLite Database**: Stores agent and secrets information
- ✅ **Express Server**: RESTful API with proper middleware
- ✅ **Blockchain Integration**: Ethers.js for contract interaction
- ✅ **Development Ready**: Nodemon for hot reloading
- ✅ **Error Handling**: Comprehensive error handling and logging
- ✅ **Health Checks**: Health endpoint for monitoring

## Database Schema

### Agents Table
- `id`: Primary key (auto-increment)
- `repo_url`: Repository URL
- `branch_name`: Branch name
- `branch_hash`: Unique hash (ethers.utils.id(repo_url + "/" + branch_name))
- `agent_address`: Deployed agent contract address
- `status`: Agent status ('deploying', 'running', 'error')
- `pid`: Process ID from PM2
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### Secrets Table
- `id`: Primary key (auto-increment)
- `agent_id`: Foreign key to agents table
- `key`: Secret key name
- `encrypted_value`: Encrypted secret value
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## API Endpoints

### Health Check
```
GET /health
```
Returns server health status and uptime.

### GitHub Webhooks
```
POST /webhook/github
```
Main webhook endpoint for all GitHub events.

```
POST /webhook/github/push
```
**Complete Agent Lifecycle**: 
- Deploys new Agent contracts when new branches are pushed
- Clones repository code to local filesystem
- Installs dependencies with `npm install`
- Starts agent process with PM2 and injected secrets
- Updates existing agents with `git pull` and restarts them

```
POST /webhook/github/pr
```
Specific endpoint for pull request events.

### Agent Management
```
GET /api/agents
```
**List All Agents**: Returns all deployed agents with their status and metadata.

```
GET /api/agents/:id
```
**Get Agent Details**: Returns detailed information about a specific agent.

```
POST /api/agents/:id/restart
```
**Restart Agent**: Restarts a specific agent with fresh secrets and code.

### Stats & Monitoring
```
GET /api/stats/:repo_url/:branch_name
```
**Get Agent Stats**: Returns comprehensive stats for a specific agent including:
- Branch name and PM2 status
- Agent contract address
- On-chain balance in SOMI

```
GET /api/logs/:repo_url/:branch_name
```
**Get Agent Logs**: Returns the last 50 lines of agent logs from PM2.

### Secrets Management
```
POST /api/secrets
```
**Encrypted Secret Storage**: Securely store API keys and secrets for agents.

**Request Body:**
```json
{
  "repo_url": "https://github.com/user/repo.git",
  "branch_name": "main",
  "key": "API_KEY",
  "value": "your-secret-value"
}
```

**Response:**
```json
{
  "success": true,
  "agent_id": 1,
  "key": "API_KEY"
}
```

## Getting Started

### Prerequisites
- Node.js (version 16+)
- npm

### Installation
```bash
cd backend
npm install
```

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Your backend's deployer wallet private key
BACKEND_PRIVATE_KEY=your-private-key-here

# The RPC URL for the Somnia Testnet
SOMNIA_RPC_URL=https://dream-rpc.somnia.network

# The factory address from Day 1
AGENT_FACTORY_ADDRESS=your-deployed-factory-address

# A strong, random string for encrypting secrets
MASTER_SECRET_KEY=your-master-secret-key-here

# Server Configuration
PORT=3000
```

## Testing with ngrok

1. Start the server:
   ```bash
   npm run dev
   ```

2. In another terminal, expose with ngrok:
   ```bash
   ngrok http 3000
   ```

3. Use the ngrok URL for your GitHub webhook configuration.

## Webhook Configuration

Configure your GitHub repository webhook to point to:
- **URL**: `https://your-ngrok-url.ngrok.io/webhook/github`
- **Content Type**: `application/json`
- **Events**: Select the events you want to receive (push, pull_request, issues)

## Logging

The server logs all webhook events with detailed information:
- Event type and delivery ID
- Repository and branch information
- Commit details for push events
- PR/Issue details for respective events

## Database

The SQLite database (`db.sqlite`) is automatically created on first run with the proper schema. The database file will be created in the backend directory.

## Dependencies

- **express**: Web server framework
- **sqlite3**: SQLite database driver
- **ethers**: Ethereum library for blockchain interaction
- **simple-crypto-js**: Encryption library for secrets
- **pm2**: Process manager for agent lifecycle
- **shelljs**: Shell command execution for git operations
- **ts-node**: TypeScript execution for agent code
- **nodemon**: Development server with hot reloading

## Agent Code Structure

Your agent repositories should contain:

1. **Entry Point**: `agent.ts` - The main TypeScript file that will be executed
2. **Package.json**: Dependencies and scripts for your agent
3. **Environment Variables**: Your agent will receive:
   - `AGENT_CONTRACT_ADDRESS`: The deployed agent contract address
   - Any secrets you've stored via the `/api/secrets` endpoint

**Example agent.ts:**
```typescript
console.log('Agent starting...');
console.log('Contract Address:', process.env.AGENT_CONTRACT_ADDRESS);
console.log('API Key:', process.env.API_KEY); // If you stored this secret

// Your agent logic here
setInterval(() => {
  console.log('Agent running...');
}, 5000);
```

