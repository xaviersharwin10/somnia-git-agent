require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');
const SimpleCrypto = require('simple-crypto-js').default;
const { getDatabase } = require('./database.js');
const pm2 = require('pm2');
const shell = require('shelljs');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Enable CORS for dashboard
const cors = require('cors');

// Define the base path where agents will be cloned
const AGENTS_DIR = path.join(__dirname, 'agents');
// Ensure this directory exists
shell.mkdir('-p', AGENTS_DIR);

// AgentFactory ABI
const ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "branchHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "agentAddress",
        "type": "address"
      }
    ],
    "name": "AgentRegistered",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "agents",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_branchHash",
        "type": "bytes32"
      }
    ],
    "name": "registerAgent",
    "outputs": [
      {
        "internalType": "address",
        "name": "agentAddress",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

// Ethers setup - Initialize lazily to avoid startup failures
let provider, wallet, agentFactoryContract;

function getEthersSetup() {
  if (!provider) {
    const rpcUrl = process.env.SOMNIA_RPC_URL || 'https://dream-rpc.somnia.network';
    provider = new ethers.JsonRpcProvider(rpcUrl);
    
    if (!process.env.BACKEND_PRIVATE_KEY) {
      throw new Error('BACKEND_PRIVATE_KEY is required in environment variables');
    }
    
    wallet = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY, provider);
    
    if (!process.env.AGENT_FACTORY_ADDRESS) {
      throw new Error('AGENT_FACTORY_ADDRESS is required in environment variables');
    }
    
    agentFactoryContract = new ethers.Contract(
      process.env.AGENT_FACTORY_ADDRESS,
      ABI,
      wallet
    );
    
    console.log(`✅ Ethers wallet connected: ${wallet.address}`);
    console.log(`✅ Connected to AgentFactory at: ${agentFactoryContract.address}`);
  }
  return { provider, wallet, agentFactoryContract };
}

// Crypto setup
const crypto = new SimpleCrypto(process.env.MASTER_SECRET_KEY || 'default-key-change-me');

// Try to initialize ethers on startup, but don't crash if RPC is unavailable
try {
  getEthersSetup();
} catch (error) {
  console.warn(`⚠️  Ethers setup deferred: ${error.message}`);
  console.warn('   Server will start but agent deployment will fail until RPC is available.');
}

// Helper function to fetch/decrypt secrets and start/reload pm2
async function startOrReloadAgent(agent, agentPath, branch_hash = null) {
  // Get branch_hash from agent object or calculate it
  if (!branch_hash && agent.branch_hash) {
    branch_hash = agent.branch_hash;
  }
  
  if (!branch_hash) {
    // Calculate from agent data if we have repo_url and branch_name
    if (agent.repo_url && agent.branch_name) {
      branch_hash = ethers.id(agent.repo_url + "/" + agent.branch_name);
    } else {
      throw new Error('Cannot determine branch_hash for agent');
    }
  }

  // 1. Fetch and decrypt secrets
  const env = await new Promise((resolve, reject) => {
    const secrets = {
      AGENT_CONTRACT_ADDRESS: agent.agent_address,
      REPO_URL: agent.repo_url || '',
      BRANCH_NAME: agent.branch_name || 'main',
      BACKEND_URL: process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3005}`,
      SOMNIA_RPC_URL: process.env.SOMNIA_RPC_URL || 'https://dream-rpc.somnia.network',
      // We can add other default envs here
    };
    
    // Debug: Log what we're setting
    console.log(`[startOrReloadAgent] Setting env for agent ${agent.id} (${agent.branch_name || 'unknown'}): REPO_URL=${agent.repo_url || 'MISSING'}, BRANCH_NAME=${agent.branch_name || 'MISSING'}`);
    
    // CRITICAL: Ensure repo_url and branch_name are set even if agent object doesn't have them
    if (!secrets.REPO_URL && agent.repo_url) {
      secrets.REPO_URL = agent.repo_url;
      console.log(`[startOrReloadAgent] ✅ Added REPO_URL from agent object: ${agent.repo_url}`);
    }
    if (!secrets.BRANCH_NAME && agent.branch_name) {
      secrets.BRANCH_NAME = agent.branch_name;
      console.log(`[startOrReloadAgent] ✅ Added BRANCH_NAME from agent object: ${agent.branch_name}`);
    }
    
    db.all('SELECT key, encrypted_value FROM secrets WHERE agent_id = ?', [agent.id], (err, rows) => {
      if (err) return reject(err);
      rows.forEach(row => {
        secrets[row.key] = crypto.decrypt(row.encrypted_value);
      });
      
      // Ensure repo_url and branch_name are always set (from agent object if not in secrets)
      if (!secrets.REPO_URL && agent.repo_url) {
        secrets.REPO_URL = agent.repo_url;
      }
      if (!secrets.BRANCH_NAME && agent.branch_name) {
        secrets.BRANCH_NAME = agent.branch_name;
      }
      
      console.log(`[startOrReloadAgent] Final env keys: ${Object.keys(secrets).join(', ')}`);
      console.log(`[startOrReloadAgent] REPO_URL: ${secrets.REPO_URL || '❌ EMPTY - AGENT WON'T SEND METRICS!'}`);
      console.log(`[startOrReloadAgent] BRANCH_NAME: ${secrets.BRANCH_NAME || '❌ EMPTY'}`);
      resolve(secrets);
    });
  });

  // 2. Define PM2 app configuration
  // Use a safe name (remove 0x prefix and use first 16 chars)
  const pm2Name = branch_hash.replace('0x', '').substring(0, 16);
  
  // Use local ts-node from agent's node_modules (resolve symlink to get real path)
  const tsNodeBin = path.join(agentPath, 'node_modules', '.bin', 'ts-node');
  let tsNodePath = tsNodeBin;
  
  if (fs.existsSync(tsNodeBin)) {
    try {
      // Resolve symlink to get actual path
      tsNodePath = fs.realpathSync(tsNodeBin);
    } catch (e) {
      // If resolution fails, use the symlink path
      tsNodePath = tsNodeBin;
    }
  } else {
    // Fallback to global ts-node if local doesn't exist
    tsNodePath = 'ts-node';
  }
  
  const pm2App = {
    name: pm2Name,
    script: path.join(agentPath, 'agent.ts'),
    env: env,
    exec_mode: 'fork',
    interpreter: tsNodePath, // Use ts-node directly (absolute path)
    cwd: agentPath, // Set working directory to agent path (so node_modules are found)
  };

  // 3. Connect to PM2 and start/reload
  return new Promise((resolve, reject) => {
    pm2.connect((err) => {
      if (err) return reject(err);

      // First, try to list processes to check if it exists
      pm2.list((listErr, processList) => {
        if (listErr) return reject(listErr);
        
        const existingProc = processList.find(p => p.name === pm2Name);
        
        if (existingProc) {
          // App exists - delete and restart to ensure env vars are updated
          pm2.delete(pm2Name, (deleteErr) => {
            if (deleteErr) {
              console.warn(`Failed to delete existing process, trying reload: ${deleteErr.message}`);
              // Fallback to reload if delete fails
              pm2.reload(pm2Name, { updateEnv: true }, (reloadErr, proc) => {
                if (reloadErr) {
                  pm2.disconnect();
                  db.run('UPDATE agents SET status = ? WHERE id = ?', ['error', agent.id]);
                  console.error(`Failed to reload agent ${agent.id}:`, reloadErr);
                  return reject(reloadErr);
                }
                pm2.disconnect();
                const pid = proc?.[0]?.pid || existingProc.pid;
                db.run('UPDATE agents SET status = ?, pid = ? WHERE id = ?', ['running', pid, agent.id]);
                console.log(`✅ Agent ${agent.id} (${agent.branch_name}) reloaded with PID ${pid}`);
                resolve(proc || existingProc);
              });
            } else {
              // Start fresh with updated env vars
              pm2.start(pm2App, (startErr, proc) => {
                if (startErr) {
                  pm2.disconnect();
                  db.run('UPDATE agents SET status = ? WHERE id = ?', ['error', agent.id]);
                  console.error(`Failed to restart agent ${agent.id}:`, startErr);
                  return reject(startErr);
                }
                pm2.disconnect();
                const pid = proc?.[0]?.pid;
                if (pid) {
                  db.run('UPDATE agents SET status = ?, pid = ? WHERE id = ?', ['running', pid, agent.id]);
                  console.log(`✅ Agent ${agent.id} (${agent.branch_name}) restarted with PID ${pid} (with updated env vars)`);
                } else {
                  db.run('UPDATE agents SET status = ? WHERE id = ?', ['running', agent.id]);
                  console.log(`✅ Agent ${agent.id} (${agent.branch_name}) restarted (PID not available)`);
                }
                resolve(proc);
              });
            }
          });
        } else {
          // App not found, check if agent directory exists first
          const agentTsPath = path.join(agentPath, 'agent.ts');
          if (!fs.existsSync(agentTsPath)) {
            pm2.disconnect();
            const errorMsg = `Agent file not found: ${agentTsPath}`;
            console.error(`❌ ${errorMsg}`);
            db.run('UPDATE agents SET status = ? WHERE id = ?', ['error', agent.id]);
            return reject(new Error(errorMsg));
          }
          
          // App not found, start it
          console.log(`[PM2] Starting agent ${agent.id} (${agent.branch_name}) at ${agentTsPath}`);
          pm2.start(pm2App, (startErr, proc) => {
            if (startErr) {
              pm2.disconnect();
              // Update status to error if start fails
              db.run('UPDATE agents SET status = ? WHERE id = ?', ['error', agent.id]);
              console.error(`❌ Failed to start agent ${agent.id} (${agent.branch_name}):`, startErr.message || startErr);
              return reject(startErr);
            }
            
            // Update DB with pid and status
            const pid = proc?.[0]?.pid;
            if (pid) {
              db.run('UPDATE agents SET status = ?, pid = ? WHERE id = ?', ['running', pid, agent.id], (updateErr) => {
                if (updateErr) console.error('Error updating status:', updateErr);
              });
              console.log(`✅ Agent ${agent.id} (${agent.branch_name || 'unknown'}) started with PID ${pid}`);
            } else {
              // Even without PID, mark as running if PM2 says it started
              db.run('UPDATE agents SET status = ? WHERE id = ?', ['running', agent.id], (updateErr) => {
                if (updateErr) console.error('Error updating status:', updateErr);
              });
              console.log(`✅ Agent ${agent.id} (${agent.branch_name || 'unknown'}) started (PID not available)`);
            }
            
            pm2.disconnect();
            resolve(proc);
          });
        }
      });
    });
  });
}

// Helper function to get PM2 status
function getPm2Status(branchHash) {
  return new Promise((resolve, reject) => {
    pm2.connect((err) => {
      if (err) return reject(err);
      
      pm2.describe(branchHash, (err, proc) => {
        pm2.disconnect();
        
        if (err || proc.length === 0) return resolve(null); // Not found
        resolve(proc[0].pm2_env.status); // e.g., 'online', 'stopped', 'errored'
      });
    });
  });
}

// Middleware
app.use(cors()); // Enable CORS for dashboard
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies (critical for webhooks)
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Get database instance
const db = getDatabase();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// GitHub OAuth endpoints (Vercel-like automatic webhook setup)
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'gitagent-webhook-secret';

// Initiate GitHub OAuth flow
app.get('/auth/github', (req, res) => {
  if (!GITHUB_CLIENT_ID) {
    return res.status(500).json({ 
      error: 'GitHub OAuth not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.',
      manual_setup: 'https://somnia-git-agent.onrender.com/webhook/github'
    });
  }

  const state = require('crypto').randomBytes(32).toString('hex');
  const redirectUri = `${BACKEND_URL}/auth/github/callback`;
  const scope = 'repo admin:repo_hook'; // Need repo access and webhook management
  
  // Store state temporarily (in production, use Redis or session)
  // For now, we'll pass repo_url as query param
  const repoUrl = req.query.repo_url;
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
    `client_id=${GITHUB_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${state}` +
    (repoUrl ? `&repo_url=${encodeURIComponent(repoUrl)}` : '');
  
  res.redirect(githubAuthUrl);
});

// GitHub OAuth callback - receives code, exchanges for token, sets up webhook
app.get('/auth/github/callback', async (req, res) => {
  const { code, state, repo_url } = req.query;
  
  if (!code) {
    return res.status(400).send('Missing authorization code. <a href="/auth/github">Try again</a>');
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code: code
    }, {
      headers: { 'Accept': 'application/json' }
    });

    const { access_token, token_type } = tokenResponse.data;
    
    if (!access_token) {
      return res.status(400).send('Failed to get access token. <a href="/auth/github">Try again</a>');
    }

    // Get user info
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { 'Authorization': `token ${access_token}` }
    });
    const userId = userResponse.data.login;
    const userEmail = userResponse.data.email || `${userId}@users.noreply.github.com`;

    // Parse repo URL from query or user's repos
    let targetRepoUrl = repo_url || req.query.repo_url;
    
    // If no repo specified, try to find user's repos
    if (!targetRepoUrl) {
      const reposResponse = await axios.get('https://api.github.com/user/repos?per_page=5', {
        headers: { 'Authorization': `token ${access_token}` }
      });
      
      if (reposResponse.data.length > 0) {
        // Use first repo as example
        targetRepoUrl = reposResponse.data[0].clone_url;
      }
    }

    // Encrypt and store token
    const encryptedToken = crypto.encrypt(access_token);
    
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT OR REPLACE INTO github_oauth (user_id, access_token, encrypted_token, repo_url, webhook_configured)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, access_token, encryptedToken, targetRepoUrl, 0],
        function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });

    // Auto-configure webhook if repo URL is known
    if (targetRepoUrl) {
      try {
        // Extract owner/repo from URL (e.g., https://github.com/owner/repo.git)
        const match = targetRepoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
        if (match) {
          const [, owner, repo] = match;
          
          // Check if webhook already exists
          const existingWebhooks = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/hooks`,
            { headers: { 'Authorization': `token ${access_token}` } }
          );

          const webhookUrl = `${BACKEND_URL}/webhook/github`;
          const webhookExists = existingWebhooks.data.some(
            hook => hook.config.url === webhookUrl
          );

          if (!webhookExists) {
            // Create webhook
            await axios.post(
              `https://api.github.com/repos/${owner}/${repo}/hooks`,
              {
                name: 'web',
                active: true,
                events: ['push'],
                config: {
                  url: webhookUrl,
                  content_type: 'json',
                  secret: WEBHOOK_SECRET,
                  insecure_ssl: '0'
                }
              },
              { headers: { 'Authorization': `token ${access_token}` } }
            );

            // Update DB
            await new Promise((resolve, reject) => {
              db.run(
                'UPDATE github_oauth SET webhook_configured = 1 WHERE user_id = ?',
                [userId],
                (err) => err ? reject(err) : resolve()
              );
            });

            res.send(`
              <h1>✅ Successfully Connected!</h1>
              <p>GitHub OAuth authorized for <strong>${userId}</strong></p>
              <p>✅ Webhook automatically configured for <strong>${owner}/${repo}</strong></p>
              <p>Now you can <code>git push</code> and deployments will trigger automatically!</p>
              <hr>
              <p><a href="/dashboard">View Dashboard</a> | <a href="/auth/github?repo_url=${encodeURIComponent(targetRepoUrl)}">Configure Another Repo</a></p>
            `);
            return;
          } else {
            res.send(`
              <h1>✅ Successfully Connected!</h1>
              <p>GitHub OAuth authorized for <strong>${userId}</strong></p>
              <p>ℹ️ Webhook already exists for <strong>${owner}/${repo}</strong></p>
              <p>You're all set! Just <code>git push</code> to deploy.</p>
              <hr>
              <p><a href="/dashboard">View Dashboard</a></p>
            `);
            return;
          }
        }
      } catch (webhookError) {
        console.error('Error setting up webhook:', webhookError.response?.data || webhookError.message);
        // Continue even if webhook setup fails
      }
    }

    res.send(`
      <h1>✅ OAuth Authorized!</h1>
      <p>GitHub connected for <strong>${userId}</strong></p>
      <p>To set up webhook for a specific repo, visit:</p>
      <p><code>/auth/github?repo_url=YOUR_REPO_URL</code></p>
      <hr>
      <p><a href="/dashboard">View Dashboard</a></p>
    `);
  } catch (error) {
    console.error('OAuth callback error:', error.response?.data || error.message);
    res.status(500).send(`
      <h1>❌ Error</h1>
      <p>${error.message}</p>
      <p><a href="/auth/github">Try again</a></p>
    `);
  }
});

// Main GitHub webhook listener endpoint
// This endpoint handles all events, but routes push events to deployment logic
app.post('/webhook/github', (req, res) => {
  console.log('--- GitHub Webhook Received ---');
  
  // Log the event type from GitHub headers
  const eventType = req.headers['x-github-event'];
  console.log(`Event Type: ${eventType}`);
  
  // Log the delivery ID for tracking
  const deliveryId = req.headers['x-github-delivery'];
  console.log(`Delivery ID: ${deliveryId}`);
  
  // If it's a push event, forward to the push handler (which does deployment)
  if (eventType === 'push') {
    // Forward to push handler - we'll import the handler logic
    // For now, we'll handle it inline by requiring the push handler logic
    // But since it's in the same file, we can just call it directly
    // Actually, let's just manually trigger the push logic here
    
    // Validate required fields
    if (!req.body.repository || !req.body.repository.clone_url) {
      console.error('Error: Missing repository information in webhook payload');
      return res.status(400).send('Missing repository information');
    }

    if (!req.body.ref) {
      console.error('Error: Missing ref information in webhook payload');
      return res.status(400).send('Missing ref information');
    }

    const repo_url = req.body.repository.clone_url;
    const branch_name = req.body.ref.split('/').pop();
    
    if (!branch_name) {
      console.error('Error: Could not extract branch name from ref:', req.body.ref);
      return res.status(400).send('Invalid ref format');
    }

    const branch_hash = ethers.id(repo_url + "/" + branch_name);
    console.log(`Processing push for branch: ${branch_name} (${branch_hash})`);

    // Respond immediately
    res.status(200).send('Webhook received, processing...');

    // Process asynchronously (same logic as /webhook/github/push)
    db.get('SELECT * FROM agents WHERE branch_hash = ?', [branch_hash], async (err, agent) => {
      if (err) {
        console.error('Database error:', err);
        return;
      }

      try {
        const agentPath = path.join(AGENTS_DIR, branch_hash);
        let agentAddress = null;
        let isNewDeployment = false;

        try {
          const { agentFactoryContract: factoryContract } = getEthersSetup();
          agentAddress = await factoryContract.agents(branch_hash);
          
          if (agentAddress && agentAddress !== ethers.ZeroAddress && agentAddress !== "0x0000000000000000000000000000000000000000") {
            console.log(`Agent found on-chain at: ${agentAddress}`);
            
            if (agent) {
              if (agent.agent_address !== agentAddress) {
                db.run('UPDATE agents SET agent_address = ? WHERE id = ?', [agentAddress, agent.id]);
                agent.agent_address = agentAddress;
              }
              
              console.log(`Agent for ${branch_name} already exists. Pulling latest code...`);
              shell.cd(agentPath);
              shell.exec('git pull');
              shell.exec('npm install');
              
              try {
                await startOrReloadAgent(agent, agentPath, branch_hash);
                console.log(`✅ Agent ${branch_name} updated successfully`);
              } catch (pm2Error) {
                console.error(`⚠️ Error starting/reloading agent: ${pm2Error.message}`);
                console.error(`   Agent exists in DB (ID: ${agent.id}), but PM2 process failed to start.`);
                console.error(`   You can manually start it or check PM2 logs.`);
                db.run('UPDATE agents SET status = ? WHERE id = ?', ['error', agent.id]);
              }
              return;
            } else {
              // Agent exists on-chain but not in DB - create DB entry
              console.log(`Agent exists on-chain but not in database. Creating DB entry...`);
              
              const newAgentId = await new Promise((resolve, reject) => {
                db.run('INSERT INTO agents (repo_url, branch_name, branch_hash, agent_address, status) VALUES (?, ?, ?, ?, ?)',
                  [repo_url, branch_name, branch_hash, agentAddress, 'deploying'],
                  function (err) {
                    if (err) return reject(err);
                    resolve(this.lastID);
                  });
              });
              
              agent = { 
                id: newAgentId, 
                agent_address: agentAddress,
                repo_url: repo_url,
                branch_name: branch_name,
                branch_hash: branch_hash
              };
              console.log(`Created DB entry for existing on-chain agent (ID: ${newAgentId})`);
            }
          }
        } catch (checkError) {
          console.warn('Could not check contract state:', checkError.message);
        }

        if (agent) {
          // Check if directory exists, if not clone it
          const dirExists = fs.existsSync(agentPath);
          if (dirExists) {
            console.log(`Agent for ${branch_name} already exists. Pulling latest code...`);
            shell.cd(agentPath);
            shell.exec('git pull');
            shell.exec('npm install');
          } else {
            console.log(`Agent directory doesn't exist. Cloning repository...`);
            shell.exec(`git clone ${repo_url} ${agentPath} --branch ${branch_name}`);
            shell.cd(agentPath);
            shell.exec('npm install');
          }
          
          try {
            await startOrReloadAgent(agent, agentPath, branch_hash);
            console.log(`✅ Agent ${branch_name} updated successfully`);
          } catch (pm2Error) {
            console.error(`⚠️ Error starting/reloading agent: ${pm2Error.message}`);
            console.error(`   Agent exists in DB (ID: ${agent.id}), but PM2 process failed to start.`);
            console.error(`   You can manually start it or check PM2 logs.`);
            // Update status to 'error' but don't fail the webhook
            db.run('UPDATE agents SET status = ? WHERE id = ?', ['error', agent.id]);
          }
        } else {
          console.log(`New branch ${branch_name} detected. Deploying new agent...`);
          
          try {
            const { agentFactoryContract: factoryContract } = getEthersSetup();
            
            if (!agentAddress) {
              console.log(`Registering agent with branch_hash: ${branch_hash}...`);
              try {
                const tx = await factoryContract.registerAgent(branch_hash);
                console.log(`Transaction sent: ${tx.hash}, waiting for confirmation...`);
                const receipt = await tx.wait();
                console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
                agentAddress = await factoryContract.agents(branch_hash);
                isNewDeployment = true;
              } catch (deployError) {
                if (deployError.reason === 'Agent already registered' || 
                    deployError.message?.includes('Agent already registered')) {
                  console.log(`Agent already registered on-chain. Fetching address...`);
                  agentAddress = await factoryContract.agents(branch_hash);
                  isNewDeployment = false;
                } else {
                  throw deployError;
                }
              }
            }
            
            if (!agentAddress || agentAddress === ethers.ZeroAddress || agentAddress === "0x0000000000000000000000000000000000000000") {
              throw new Error("Agent address not found after registration.");
            }
            console.log(`✅ Agent contract found/deployed at: ${agentAddress}`);

            const dirExists = fs.existsSync(agentPath);
            if (dirExists) {
              console.log(`Agent directory exists. Pulling latest code...`);
              shell.cd(agentPath);
              shell.exec('git pull');
              shell.exec('npm install');
            } else {
              console.log(`Cloning repository...`);
              shell.exec(`git clone ${repo_url} ${agentPath} --branch ${branch_name}`);
              shell.cd(agentPath);
              shell.exec('npm install');
            }

            let newAgent;
            const existingAgentInDb = await new Promise((resolve, reject) => {
              db.get('SELECT * FROM agents WHERE branch_hash = ?', [branch_hash], (err, row) => {
                if (err) return reject(err);
                resolve(row);
              });
            });

            if (existingAgentInDb) {
              await new Promise((resolve, reject) => {
                db.run('UPDATE agents SET agent_address = ?, status = ? WHERE id = ?',
                  [agentAddress, 'deploying', existingAgentInDb.id], (err) => {
                    if (err) return reject(err);
                    resolve();
                  });
              });
              newAgent = { 
                ...existingAgentInDb,
                id: existingAgentInDb.id, 
                agent_address: agentAddress,
                repo_url: existingAgentInDb.repo_url || repo_url,
                branch_name: existingAgentInDb.branch_name || branch_name,
                branch_hash: branch_hash
              };
              console.log(`Updated existing agent record in database.`);
            } else {
              const newAgentId = await new Promise((resolve, reject) => {
                db.run('INSERT INTO agents (repo_url, branch_name, branch_hash, agent_address, status) VALUES (?, ?, ?, ?, ?)',
                  [repo_url, branch_name, branch_hash, agentAddress, 'deploying'],
                  function (err) {
                    if (err) return reject(err);
                    resolve(this.lastID);
                  });
              });
              newAgent = { 
                id: newAgentId, 
                agent_address: agentAddress,
                repo_url: repo_url,
                branch_name: branch_name,
                branch_hash: branch_hash
              };
              console.log(`Created new agent record in database.`);
            }

            try {
              await startOrReloadAgent(newAgent, agentPath, branch_hash);
              console.log(`✅ ${isNewDeployment ? 'New agent deployed, cloned, and started' : 'Agent recovered and started'}`);
            } catch (pm2Error) {
              console.error(`⚠️ Error starting/reloading agent: ${pm2Error.message}`);
              console.error(`   Agent created in DB (ID: ${newAgent.id}), but PM2 process failed to start.`);
              console.error(`   You can manually start it or check PM2 logs.`);
              db.run('UPDATE agents SET status = ? WHERE id = ?', ['error', newAgent.id]);
            }
          } catch (contractError) {
            console.error('Error deploying agent contract:', contractError.message);
          }
        }
      } catch (callbackError) {
        console.error('Error in webhook callback:', callbackError);
      }
    });

    return; // Response already sent
  }
  
  // For non-push events, just log
  console.log('Full payload:', JSON.stringify(req.body, null, 2));
  
  if (eventType === 'pull_request') {
    const { action, pull_request, repository } = req.body;
    console.log(`🔀 Pull Request Event:`);
    console.log(`   Action: ${action}`);
    console.log(`   PR #${pull_request?.number}: ${pull_request?.title}`);
    console.log(`   Repository: ${repository?.full_name}`);
  } else if (eventType === 'issues') {
    const { action, issue, repository } = req.body;
    console.log(`🐛 Issue Event:`);
    console.log(`   Action: ${action}`);
    console.log(`   Issue #${issue?.number}: ${issue?.title}`);
    console.log(`   Repository: ${repository?.full_name}`);
  }
  
  // Always respond with 200 OK to acknowledge receipt
  res.status(200).send('Webhook received');
});

// Additional webhook endpoints for different event types
app.post('/webhook/github/push', async (req, res) => {
  // Set a timeout to ensure we always respond
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      console.error('Webhook processing timeout - sending 200 to GitHub');
      res.status(200).send('Webhook received (processing in background)');
    }
  }, 25000); // 25 second timeout (GitHub expects response within 30s)

  // Track if response was sent
  let responseSent = false;

  const sendResponse = (status, message) => {
    if (!responseSent && !res.headersSent) {
      responseSent = true;
      clearTimeout(timeout);
      res.status(status).send(message);
    }
  };

  try {
    // Validate required fields
    if (!req.body.repository || !req.body.repository.clone_url) {
      console.error('Error: Missing repository information in webhook payload');
      return sendResponse(400, 'Missing repository information');
    }

    if (!req.body.ref) {
      console.error('Error: Missing ref information in webhook payload');
      return sendResponse(400, 'Missing ref information');
    }

    const repo_url = req.body.repository.clone_url;
    const branch_name = req.body.ref.split('/').pop();
    
    if (!branch_name) {
      console.error('Error: Could not extract branch name from ref:', req.body.ref);
      return sendResponse(400, 'Invalid ref format');
    }

    const branch_hash = ethers.id(repo_url + "/" + branch_name);

    console.log(`Processing push for branch: ${branch_name} (${branch_hash})`);

    // Respond immediately to GitHub to prevent timeout
    sendResponse(200, 'Webhook received, processing...');

    // Process asynchronously
    db.get('SELECT * FROM agents WHERE branch_hash = ?', [branch_hash], async (err, agent) => {
      if (err) {
        console.error('Database error:', err);
        return; // Response already sent, just log
      }

      try {
        const agentPath = path.join(AGENTS_DIR, branch_hash);

        // Check contract first to see if agent exists on-chain (even if not in DB)
        let agentAddress = null;
        let isNewDeployment = false;

        try {
          const { agentFactoryContract: factoryContract } = getEthersSetup();
          const onChainAddress = await factoryContract.agents(branch_hash);
          
          // Check if agent exists on-chain
          if (onChainAddress && onChainAddress !== ethers.ZeroAddress && onChainAddress !== "0x0000000000000000000000000000000000000000") {
            agentAddress = onChainAddress; // Set it here
            console.log(`Agent found on-chain at: ${agentAddress}`);
            
            // If agent exists in DB, proceed with update
            if (agent) {
              // Make sure DB has correct address (in case it changed)
              if (agent.agent_address !== agentAddress) {
                db.run('UPDATE agents SET agent_address = ? WHERE id = ?', [agentAddress, agent.id]);
                agent.agent_address = agentAddress;
              }
              
              // --- 1. AGENT EXISTS: UPDATE (PULL) ---
              console.log(`Agent for ${branch_name} already exists. Pulling latest code...`);
              shell.cd(agentPath);
              shell.exec('git pull');
              shell.exec('npm install'); // Re-run install for any new dependencies

              // Now, reload the process with secrets
              await startOrReloadAgent(agent, agentPath, branch_hash);
              console.log(`✅ Agent ${branch_name} updated successfully`);
              return;
            } else {
              // Agent exists on-chain but not in DB - recover from blockchain
              console.log(`Agent exists on-chain but not in database. Recovering...`);
              // We'll use the agentAddress we just found below
            }
          }
        } catch (checkError) {
          console.warn('Could not check contract state:', checkError.message);
          // Continue with DB check logic - agentAddress remains null
        }

        if (agent) {
          // --- 1. AGENT EXISTS IN DB: UPDATE (PULL) ---
          console.log(`Agent for ${branch_name} already exists. Pulling latest code...`);
          shell.cd(agentPath);
          shell.exec('git pull');
          shell.exec('npm install'); // Re-run install for any new dependencies

          // Now, reload the process with secrets
          await startOrReloadAgent(agent, agentPath, branch_hash);
          console.log(`✅ Agent ${branch_name} updated successfully`);

        } else {
          // --- 2. NEW AGENT: DEPLOY (CLONE) ---
          console.log(`New branch ${branch_name} detected. Deploying new agent...`);

          try {
            // 2a. Get ethers setup (lazy initialization)
            const { agentFactoryContract: factoryContract } = getEthersSetup();
            
            // 2b. If we don't have an address yet, try to get it from chain first, then register if needed
            if (!agentAddress || agentAddress === ethers.ZeroAddress || agentAddress === "0x0000000000000000000000000000000000000000") {
              // Check if agent already exists on-chain (double-check)
              agentAddress = await factoryContract.agents(branch_hash);
              
              if (!agentAddress || agentAddress === ethers.ZeroAddress || agentAddress === "0x0000000000000000000000000000000000000000") {
                // Agent doesn't exist, register it
                console.log(`Registering agent with branch_hash: ${branch_hash}...`);
                try {
                  const tx = await factoryContract.registerAgent(branch_hash);
                  console.log(`Transaction sent: ${tx.hash}, waiting for confirmation...`);
                  const receipt = await tx.wait();
                  console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
                  
                  // Wait a bit for state to propagate, then get agent address
                  await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
                  agentAddress = await factoryContract.agents(branch_hash);
                  isNewDeployment = true;
                } catch (deployError) {
                  // Check if error is "Agent already registered"
                  if (deployError.reason === 'Agent already registered' || 
                      deployError.message?.includes('Agent already registered')) {
                    console.log(`Agent already registered on-chain. Fetching address...`);
                    // Try again after a short delay
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    agentAddress = await factoryContract.agents(branch_hash);
                    isNewDeployment = false;
                  } else {
                    throw deployError; // Re-throw if it's a different error
                  }
                }
              } else {
                console.log(`Agent already exists on-chain at: ${agentAddress}`);
                isNewDeployment = false;
              }
            }
            
            if (!agentAddress || agentAddress === ethers.ZeroAddress || agentAddress === "0x0000000000000000000000000000000000000000") {
              throw new Error("Agent address not found after registration. Transaction may have failed.");
            }
            console.log(`✅ Agent contract found/deployed at: ${agentAddress}`);

            // 2c. Clone or pull code (check if directory exists)
            const dirExists = fs.existsSync(agentPath);
            if (dirExists) {
              console.log(`Agent directory exists. Pulling latest code...`);
              shell.cd(agentPath);
              shell.exec('git pull');
              shell.exec('npm install');
            } else {
              console.log(`Cloning repository...`);
              shell.exec(`git clone ${repo_url} ${agentPath} --branch ${branch_name}`);
              shell.cd(agentPath);
              shell.exec('npm install');
            }

            // 2d. Save to DB (or update if recovering from blockchain)
            let newAgent;
            const existingAgentInDb = await new Promise((resolve, reject) => {
              db.get('SELECT * FROM agents WHERE branch_hash = ?', [branch_hash], (err, row) => {
                if (err) return reject(err);
                resolve(row);
              });
            });

            if (existingAgentInDb) {
              // Update existing record
              await new Promise((resolve, reject) => {
                db.run(
                  'UPDATE agents SET agent_address = ?, status = ? WHERE id = ?',
                  [agentAddress, 'deploying', existingAgentInDb.id],
                  (err) => {
                    if (err) return reject(err);
                    resolve();
                  }
                );
              });
              newAgent = { 
                ...existingAgentInDb,
                id: existingAgentInDb.id, 
                agent_address: agentAddress,
                repo_url: existingAgentInDb.repo_url || repo_url,
                branch_name: existingAgentInDb.branch_name || branch_name,
                branch_hash: branch_hash
              };
              console.log(`Updated existing agent record in database.`);
            } else {
              // Insert new record
              const newAgentId = await new Promise((resolve, reject) => {
                db.run(
                  'INSERT INTO agents (repo_url, branch_name, branch_hash, agent_address, status) VALUES (?, ?, ?, ?, ?)',
                  [repo_url, branch_name, branch_hash, agentAddress, 'deploying'],
                  function (err) { // Must use function() to get this.lastID
                    if (err) return reject(err);
                    resolve(this.lastID);
                  }
                );
              });
              newAgent = { 
                id: newAgentId, 
                agent_address: agentAddress,
                repo_url: repo_url,
                branch_name: branch_name,
                branch_hash: branch_hash
              };
              console.log(`Created new agent record in database.`);
            }

            // 2e. Start the process with secrets
            await startOrReloadAgent(newAgent, agentPath, branch_hash);
            console.log(`✅ ${isNewDeployment ? 'New agent deployed, cloned, and started' : 'Agent recovered and started'}`);
          } catch (contractError) {
            console.error('Error deploying agent contract:', contractError);
            
            // Log the error but don't send response (already sent)
            if (contractError.message.includes('getaddrinfo') || 
                contractError.message.includes('network') ||
                contractError.code === 'EAI_AGAIN') {
              console.error('❌ Cannot connect to blockchain RPC');
            } else {
              console.error('❌ Error deploying agent contract:', contractError.message);
            }
          }
        }
      } catch (callbackError) {
        console.error('Error in webhook callback:', callbackError);
        // Response already sent, just log
      }
    });
  } catch (error) {
    console.error('Error in webhook processing:', error);
    // Response already sent, just log the error
  }
});

app.post('/webhook/github/pr', (req, res) => {
  console.log('--- GitHub PR Webhook Received ---');
  console.log(`Event Type: ${req.headers['x-github-event']}`);
  console.log('PR payload:', JSON.stringify(req.body, null, 2));
  res.status(200).send('PR webhook received');
});

// Manual trigger endpoint for testing
app.post('/api/agents/manual-trigger', async (req, res) => {
  const { repo_url, branch_name } = req.body;
  
  if (!repo_url || !branch_name) {
    return res.status(400).json({ error: 'repo_url and branch_name are required' });
  }

  const branch_hash = ethers.id(repo_url + "/" + branch_name);
  
  try {
    // Create a mock request object to trigger the deployment logic
    const mockReq = {
      body: {
        repository: { clone_url: repo_url },
        ref: `refs/heads/${branch_name}`
      },
      headers: { 'x-github-event': 'push' }
    };
    const mockRes = {
      status: (code) => ({
        send: (msg) => console.log(`Response: ${code} - ${msg}`)
      })
    };
    
    // Reuse the webhook logic
    console.log(`Manual trigger for ${repo_url} / ${branch_name}`);
    
    db.get('SELECT * FROM agents WHERE branch_hash = ?', [branch_hash], async (err, agent) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (agent) {
        return res.json({ message: 'Agent already exists', agent });
      }

      // Process deployment (simplified version)
      const agentPath = path.join(AGENTS_DIR, branch_hash);
      let agentAddress = null;

      try {
        const { agentFactoryContract: factoryContract } = getEthersSetup();
        
        agentAddress = await factoryContract.agents(branch_hash);
        
        if (!agentAddress || agentAddress === ethers.ZeroAddress) {
          const tx = await factoryContract.registerAgent(branch_hash);
          const receipt = await tx.wait();
          agentAddress = await factoryContract.agents(branch_hash);
        }

        if (!agentAddress || agentAddress === ethers.ZeroAddress) {
          return res.status(500).json({ error: 'Failed to get agent address' });
        }

        const dirExists = fs.existsSync(agentPath);
        if (!dirExists) {
          shell.exec(`git clone ${repo_url} ${agentPath} --branch ${branch_name}`);
          shell.cd(agentPath);
          shell.exec('npm install');
        }

        const newAgentId = await new Promise((resolve, reject) => {
          db.run('INSERT INTO agents (repo_url, branch_name, branch_hash, agent_address, status) VALUES (?, ?, ?, ?, ?)',
            [repo_url, branch_name, branch_hash, agentAddress, 'deploying'],
            function (err) {
              if (err) return reject(err);
              resolve(this.lastID);
            });
        });

        const newAgent = { 
          id: newAgentId, 
          agent_address: agentAddress,
          repo_url: repo_url,
          branch_name: branch_name,
          branch_hash: branch_hash
        };
        await startOrReloadAgent(newAgent, agentPath, branch_hash);

        res.json({ success: true, agent_id: newAgentId, agent_address: agentAddress });
      } catch (error) {
        console.error('Manual trigger error:', error);
        res.status(500).json({ error: error.message });
      }
    });
  } catch (error) {
    console.error('Manual trigger error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Agent management endpoints
app.get('/api/agents', async (req, res) => {
  const repo_url = req.query.repo_url; // Optional filter by repository
  
  let query = 'SELECT id, repo_url, branch_name, branch_hash, agent_address, status, pid, created_at FROM agents';
  const params = [];
  
  if (repo_url) {
    query += ' WHERE repo_url = ?';
    params.push(repo_url);
  }
  
  query += ' ORDER BY created_at DESC';
  
  db.all(query, params, async (err, rows) => {
    if (err) {
      console.error('Error fetching agents:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Sync status from PM2 for agents that should be running
    if (rows && rows.length > 0) {
      try {
        await new Promise((resolve) => {
          pm2.connect((connectErr) => {
            if (connectErr) {
              // PM2 not available - that's okay, return agents as-is
              resolve();
              return;
            }
            
            pm2.list((listErr, processList) => {
              if (listErr) {
                pm2.disconnect();
                resolve();
                return;
              }
              
              // Update status based on PM2 state
              const updatePromises = rows.map((agent) => {
                return new Promise((resolveUpdate) => {
                  if (agent.status === 'deploying' || agent.status === 'running') {
                    const pm2Name = agent.branch_hash.replace('0x', '').substring(0, 16);
                    const pm2Proc = processList.find(p => p.name === pm2Name);
                    
                    if (pm2Proc) {
                      // PM2 process exists - check if it's actually running
                      if (pm2Proc.pm2_env.status === 'online') {
                        if (agent.status !== 'running') {
                          db.run('UPDATE agents SET status = ?, pid = ? WHERE id = ?', 
                            ['running', pm2Proc.pid, agent.id], () => {
                            agent.status = 'running';
                            resolveUpdate();
                          });
                        } else {
                          resolveUpdate();
                        }
                      } else if (pm2Proc.pm2_env.status === 'stopped' || pm2Proc.pm2_env.status === 'errored') {
                        if (agent.status !== 'error') {
                          db.run('UPDATE agents SET status = ? WHERE id = ?', ['error', agent.id], () => {
                            agent.status = 'error';
                            resolveUpdate();
                          });
                        } else {
                          resolveUpdate();
                        }
                      } else {
                        resolveUpdate();
                      }
                    } else if (agent.status === 'running') {
                      // PM2 process not found but DB says running - mark as error
                      db.run('UPDATE agents SET status = ? WHERE id = ?', ['error', agent.id], () => {
                        agent.status = 'error';
                        resolveUpdate();
                      });
                    } else {
                      resolveUpdate();
                    }
                  } else {
                    resolveUpdate();
                  }
                });
              });
              
              Promise.all(updatePromises).then(() => {
                pm2.disconnect();
                resolve();
              });
            });
          });
        });
      } catch (syncError) {
        console.warn('Error syncing PM2 status:', syncError.message);
      }
    }
    
    res.json({ agents: rows });
  });
});

app.get('/api/agents/:id', (req, res) => {
  const agentId = req.params.id;
  db.get('SELECT * FROM agents WHERE id = ?', [agentId], (err, agent) => {
    if (err) {
      console.error('Error fetching agent:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json({ agent });
  });
});

app.post('/api/agents/:id/restart', (req, res) => {
  const agentId = req.params.id;
  db.get('SELECT * FROM agents WHERE id = ?', [agentId], async (err, agent) => {
    if (err) {
      console.error('Error fetching agent:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    try {
      const agentPath = path.join(AGENTS_DIR, agent.branch_hash);
      
      // Ensure agent has all required fields
      if (!agent.repo_url || !agent.branch_name) {
        console.log(`Agent ${agentId} missing repo_url/branch_name, fetching from DB...`);
        const fullAgent = await new Promise((resolve, reject) => {
          db.get('SELECT * FROM agents WHERE id = ?', [agentId], (err, row) => {
            if (err) return reject(err);
            resolve(row);
          });
        });
        Object.assign(agent, fullAgent);
      }
      
      await startOrReloadAgent(agent, agentPath, agent.branch_hash);
      res.json({ success: true, message: 'Agent restarted' });
    } catch (error) {
      console.error('Error restarting agent:', error);
      res.status(500).json({ error: 'Failed to restart agent' });
    }
  });
});

// Restart agent by branch_hash
app.post('/api/agents/branch/:branch_hash/restart', (req, res) => {
  const branch_hash = req.params.branch_hash;
  db.get('SELECT * FROM agents WHERE branch_hash = ?', [branch_hash], async (err, agent) => {
    if (err) {
      console.error('Error fetching agent:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    try {
      const agentPath = path.join(AGENTS_DIR, agent.branch_hash);
      
      // Ensure agent has all fields
      if (!agent.repo_url || !agent.branch_name) {
        return res.status(400).json({ 
          error: 'Agent missing repo_url or branch_name', 
          agent: { id: agent.id, repo_url: agent.repo_url, branch_name: agent.branch_name } 
        });
      }
      
      console.log(`[RESTART] Restarting agent: ${agent.branch_name} with REPO_URL=${agent.repo_url}`);
      await startOrReloadAgent(agent, agentPath, agent.branch_hash);
      res.json({ 
        success: true, 
        message: 'Agent restarted', 
        agent: { 
          branch_name: agent.branch_name, 
          branch_hash,
          repo_url: agent.repo_url
        } 
      });
    } catch (error) {
      console.error('Error restarting agent:', error);
      res.status(500).json({ error: 'Failed to restart agent', details: error.message });
    }
  });
});

// Restart all agents (useful for fixing issues)
app.post('/api/agents/restart-all', async (req, res) => {
  try {
    db.all('SELECT * FROM agents', async (err, agents) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      const results = [];
      for (const agent of agents) {
        try {
          const agentPath = path.join(AGENTS_DIR, agent.branch_hash);
          if (fs.existsSync(path.join(agentPath, 'agent.ts'))) {
            await startOrReloadAgent(agent, agentPath, agent.branch_hash);
            results.push({ agent: agent.branch_name, status: 'restarted' });
          } else {
            results.push({ agent: agent.branch_name, status: 'skipped', reason: 'agent.ts not found' });
          }
        } catch (error) {
          results.push({ agent: agent.branch_name, status: 'error', error: error.message });
        }
      }
      
      res.json({ success: true, results });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stats endpoint
app.get('/api/stats/:repo_url/:branch_name', async (req, res) => {
  const { repo_url, branch_name } = req.params;
  const branch_hash = ethers.id(repo_url + "/" + branch_name);

  try {
    db.get('SELECT agent_address FROM agents WHERE branch_hash = ?', [branch_hash], async (err, agent) => {
      if (err) throw new Error(err);
      if (!agent) return res.status(404).json({ error: 'Agent not found' });

      // 1. Get on-chain balance
      const balance = await provider.getBalance(agent.agent_address);

      // 2. Get pm2 status
      const pm2Status = await getPm2Status(branch_hash);

      // 3. Get basic agent info (in a real app, you'd add P/L, etc.)
      const stats = {
        branch: branch_name,
        status: pm2Status || 'unknown',
        agent_address: agent.agent_address,
        balance: ethers.formatEther(balance) + " SOMI",
      };

      res.status(200).json(stats);
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).send('Internal server error');
  }
});

// Logs endpoint by branch_hash (simpler for dashboard)
app.get('/api/logs/:branch_hash', (req, res) => {
  const { branch_hash } = req.params;
  
  // Remove 0x prefix and get first 16 chars for PM2 name
  const pm2Name = branch_hash.replace('0x', '').substring(0, 16);
  
  // PM2 logs location - try multiple paths (local dev vs production)
  const possibleLogPaths = [
    path.join(process.env.HOME || process.env.USERPROFILE || '/tmp', '.pm2', 'logs', `${pm2Name}-out.log`),
    path.join('/tmp', '.pm2', 'logs', `${pm2Name}-out.log`),
    path.join(process.cwd(), '.pm2', 'logs', `${pm2Name}-out.log`)
  ];
  
  let logPath = possibleLogPaths.find(p => fs.existsSync(p)) || possibleLogPaths[0];

  try {
    if (fs.existsSync(logPath)) {
      const logs = fs.readFileSync(logPath, 'utf8');
      const lastLines = logs.split('\n').slice(-100).filter(line => line.trim()); // Get last 100 lines
      res.status(200).json({ logs: lastLines });
    } else {
      // Try error log too
      const errorLogPath = path.join(process.env.HOME || process.env.USERPROFILE || '/tmp', '.pm2', 'logs', `${pm2Name}-error.log`);
      if (fs.existsSync(errorLogPath)) {
        const logs = fs.readFileSync(errorLogPath, 'utf8');
        const lastLines = logs.split('\n').slice(-50).filter(line => line.trim());
        res.status(200).json({ logs: lastLines, source: 'error' });
      } else {
        // If no PM2 logs, return recent metrics as logs
        db.get('SELECT id FROM agents WHERE branch_hash = ?', [branch_hash], (err, agent) => {
          if (err || !agent) {
            return res.status(404).json({ error: 'Agent not found' });
          }
          
          db.all(
            'SELECT decision, price, timestamp, trade_executed, trade_tx_hash FROM metrics WHERE agent_id = ? ORDER BY timestamp DESC LIMIT 50',
            [agent.id],
            (err, metrics) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }
              
              if (metrics.length === 0) {
                return res.status(200).json({ 
                  logs: ['No logs available yet. Agent may be starting up or waiting for first decision.'],
                  source: 'metrics',
                  note: 'PM2 logs not available. Showing metrics instead.'
                });
              }
              
              // Convert metrics to log-like format
              const logLines = metrics.map(m => {
                const timestamp = new Date(m.timestamp).toISOString();
                const tradeInfo = m.trade_executed ? ` [Trade: ${m.trade_tx_hash?.substring(0, 10)}...]` : '';
                return `[${timestamp}] ${m.decision} - Price: $${m.price?.toFixed(4) || 'N/A'}${tradeInfo}`;
              });
              
              res.status(200).json({ 
                logs: logLines,
                source: 'metrics',
                note: 'PM2 logs not available. Showing recent decisions from metrics.'
              });
            }
          );
        });
      }
    }
  } catch (error) {
    console.error('Error getting logs:', error);
    res.status(500).send('Internal server error');
  }
});

// Legacy logs endpoint (for compatibility)
app.get('/api/logs/:repo_url/:branch_name', (req, res) => {
  const { repo_url, branch_name } = req.params;
  const branch_hash = ethers.id(repo_url + "/" + branch_name);
  // Redirect to new endpoint
  res.redirect(`/api/logs/${branch_hash}`);
});

// Serve dashboard
app.get('/dashboard', (req, res) => {
  const dashboardPath = path.join(__dirname, '..', 'dashboard', 'index.html');
  if (fs.existsSync(dashboardPath)) {
    res.sendFile(dashboardPath);
  } else {
    res.status(404).send('Dashboard not found');
  }
});

// Metrics endpoint - Agents can post their decisions/transactions here
app.post('/api/metrics', async (req, res) => {
  const { repo_url, branch_name, decision, price, trade_executed, trade_tx_hash, trade_amount } = req.body;

  if (!repo_url || !branch_name || !decision) {
    return res.status(400).json({ error: 'Missing required fields: repo_url, branch_name, decision' });
  }

  const branch_hash = ethers.id(repo_url + "/" + branch_name);

  try {
    // Find the agent in the DB
    db.get('SELECT id FROM agents WHERE branch_hash = ?', [branch_hash], async (err, agent) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // If agent doesn't exist, try to find it on-chain and create DB entry
      if (!agent) {
        console.log(`Agent ${branch_hash} not found in DB, checking blockchain...`);
        try {
          const { agentFactoryContract: factoryContract } = getEthersSetup();
          const agentAddress = await factoryContract.agents(branch_hash);
          
          if (agentAddress && agentAddress !== ethers.ZeroAddress && agentAddress !== "0x0000000000000000000000000000000000000000") {
            console.log(`Agent found on-chain at ${agentAddress}, creating DB entry...`);
            // Create agent entry in database
            db.run(
              'INSERT INTO agents (repo_url, branch_name, branch_hash, agent_address, status) VALUES (?, ?, ?, ?, ?)',
              [repo_url, branch_name, branch_hash, agentAddress, 'running'],
              function (err) {
                if (err) {
                  console.error('Error creating agent entry:', err);
                  return res.status(500).json({ error: 'Failed to create agent entry' });
                }
                
                // Now save the metric
                db.run(
                  'INSERT INTO metrics (agent_id, decision, price, trade_executed, trade_tx_hash, trade_amount) VALUES (?, ?, ?, ?, ?, ?)',
                  [this.lastID, decision, price || null, trade_executed ? 1 : 0, trade_tx_hash || null, trade_amount || null],
                  function (err) {
                    if (err) {
                      console.error('Error inserting metric:', err);
                      return res.status(500).json({ error: 'Failed to save metric' });
                    }
                    res.status(201).json({ success: true, metric_id: this.lastID });
                  }
                );
              }
            );
          } else {
            console.log(`Agent ${branch_hash} not found on-chain either`);
            return res.status(404).json({ error: 'Agent not found. Please deploy agent first via webhook.' });
          }
        } catch (blockchainError) {
          console.error('Error checking blockchain:', blockchainError);
          return res.status(500).json({ error: 'Failed to check blockchain for agent' });
        }
        return; // Exit early, response will be sent in callback
      }

      // Agent exists, insert metric normally
      db.run(
        'INSERT INTO metrics (agent_id, decision, price, trade_executed, trade_tx_hash, trade_amount) VALUES (?, ?, ?, ?, ?, ?)',
        [agent.id, decision, price || null, trade_executed ? 1 : 0, trade_tx_hash || null, trade_amount || null],
        function (err) {
          if (err) {
            console.error('Error inserting metric:', err);
            return res.status(500).json({ error: 'Failed to save metric' });
          }
          res.status(201).json({ success: true, metric_id: this.lastID });
        }
      );
    });
  } catch (error) {
    console.error('Error saving metric:', error);
    res.status(500).send('Internal server error');
  }
});

// Get metrics for an agent
app.get('/api/metrics/:branch_hash', (req, res) => {
  const { branch_hash } = req.params;

  try {
    db.get('SELECT id FROM agents WHERE branch_hash = ?', [branch_hash], (err, agent) => {
      if (err || !agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      db.all(
        'SELECT * FROM metrics WHERE agent_id = ? ORDER BY timestamp DESC LIMIT 100',
        [agent.id],
        (err, metrics) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json({ metrics });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get stats for an agent (aggregated metrics)
app.get('/api/stats/:branch_hash', (req, res) => {
  const { branch_hash } = req.params;

  try {
    db.get('SELECT id FROM agents WHERE branch_hash = ?', [branch_hash], (err, agent) => {
      if (err || !agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Get aggregated stats
      db.get(`
        SELECT 
          COUNT(*) as total_decisions,
          SUM(CASE WHEN decision LIKE '%BUY%' THEN 1 ELSE 0 END) as buy_count,
          SUM(CASE WHEN decision LIKE '%HOLD%' THEN 1 ELSE 0 END) as hold_count,
          SUM(CASE WHEN trade_executed = 1 THEN 1 ELSE 0 END) as trades_executed,
          AVG(price) as avg_price,
          MIN(price) as min_price,
          MAX(price) as max_price,
          MIN(timestamp) as first_decision,
          MAX(timestamp) as last_decision
        FROM metrics 
        WHERE agent_id = ?
      `, [agent.id], (err, stats) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ stats: stats || {} });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Secrets management endpoint
app.post('/api/secrets', (req, res) => {
  const { repo_url, branch_name, key, value } = req.body;

  if (!repo_url || !branch_name || !key || !value) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const branch_hash = ethers.id(repo_url + "/" + branch_name);

  try {
    // 1. Find the agent in the DB
    db.get('SELECT id FROM agents WHERE branch_hash = ?', [branch_hash], (err, agent) => {
      if (err) throw new Error(err);
      if (!agent) {
        return res.status(404).json({ error: 'Agent for this repo/branch not found. Please push the branch first.' });
      }

      // 2. Encrypt the secret
      const encrypted_value = crypto.encrypt(value);

      // 3. Save the secret
      db.run(
        'INSERT INTO secrets (agent_id, key, encrypted_value) VALUES (?, ?, ?)',
        [agent.id, key, encrypted_value],
        (err) => {
          if (err) throw new Error(err);
          console.log(`Secret ${key} added for agent ${agent.id}`);
          res.status(201).json({ success: true, agent_id: agent.id, key: key });
        }
      );
    });
  } catch (error) {
    console.error('Error setting secret:', error);
    res.status(500).send('Internal server error');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Express Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Startup recovery: Recover agents from blockchain if database is empty
async function recoverAgentsFromBlockchain() {
  try {
    // Check if database is empty
    const agentCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM agents', (err, row) => {
        if (err) return reject(err);
        resolve(row?.count || 0);
      });
    });

    if (agentCount > 0) {
      console.log(`✅ Database has ${agentCount} agent(s), skipping recovery`);
      return;
    }

    console.log('🔍 Database is empty, checking blockchain for existing agents...');
    
    // Known agents to recover (add more as needed)
    const knownAgents = [
      { repo_url: 'https://github.com/xaviersharwin10/gitAgent.git', branch_name: 'main' },
      { repo_url: 'https://github.com/xaviersharwin10/gitAgent.git', branch_name: 'aggressive' },
      { repo_url: 'https://github.com/xaviersharwin10/gitAgent.git', branch_name: 'moderate' }
    ];

    const { agentFactoryContract: factoryContract } = getEthersSetup();
    let recovered = 0;

    for (const agentInfo of knownAgents) {
      try {
        const branch_hash = ethers.id(agentInfo.repo_url + "/" + agentInfo.branch_name);
        const agentAddress = await factoryContract.agents(branch_hash);
        
        if (agentAddress && agentAddress !== ethers.ZeroAddress && agentAddress !== "0x0000000000000000000000000000000000000000") {
          // Check if already in DB
          const existing = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM agents WHERE branch_hash = ?', [branch_hash], (err, row) => {
              if (err) return reject(err);
              resolve(row);
            });
          });

          if (!existing) {
            // Create DB entry
            const recoveredAgentId = await new Promise((resolve, reject) => {
              db.run(
                'INSERT INTO agents (repo_url, branch_name, branch_hash, agent_address, status) VALUES (?, ?, ?, ?, ?)',
                [agentInfo.repo_url, agentInfo.branch_name, branch_hash, agentAddress, 'deploying'],
                function (err) {
                  if (err) return reject(err);
                  resolve(this.lastID);
                }
              );
            });
            
            console.log(`✅ Recovered agent: ${agentInfo.branch_name} (${agentAddress})`);
            
            // Auto-start recovered agent
            try {
              const agentPath = path.join(AGENTS_DIR, branch_hash);
              const recoveredAgent = {
                id: recoveredAgentId,
                repo_url: agentInfo.repo_url,
                branch_name: agentInfo.branch_name,
                branch_hash: branch_hash,
                agent_address: agentAddress,
                status: 'deploying'
              };
              
              // Check if agent directory exists (needs to be cloned first)
              if (fs.existsSync(agentPath) && fs.existsSync(path.join(agentPath, 'agent.ts'))) {
                await startOrReloadAgent(recoveredAgent, agentPath, branch_hash);
                console.log(`🚀 Started recovered agent: ${agentInfo.branch_name}`);
              } else {
                console.log(`ℹ️ Agent directory not found for ${agentInfo.branch_name}, will start on next push`);
              }
            } catch (startError) {
              console.warn(`⚠️ Could not start recovered agent ${agentInfo.branch_name}:`, startError.message);
            }
            
            recovered++;
          }
        }
      } catch (error) {
        console.warn(`⚠️ Could not recover agent ${agentInfo.branch_name}:`, error.message);
      }
    }

    if (recovered > 0) {
      console.log(`🎉 Recovered ${recovered} agent(s) from blockchain`);
    } else {
      console.log('ℹ️ No agents found on blockchain to recover');
    }
  } catch (error) {
    console.error('❌ Error during startup recovery:', error);
  }
}

// Start the server
app.listen(PORT, async () => {
  console.log('🚀 GitAgent Backend Server Started');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📥 GitHub webhook: http://localhost:${PORT}/webhook/github`);
  
  // Recover agents from blockchain on startup
  await recoverAgentsFromBlockchain();
  
  console.log('⏳ Waiting for GitHub webhooks...');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

module.exports = app;
