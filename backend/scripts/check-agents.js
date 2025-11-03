// Script to check agent status and restart them if needed
const pm2 = require('pm2');
const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');
const { getDatabase } = require('../database.js');

const AGENTS_DIR = path.join(__dirname, '..', 'agents');

async function checkAndFixAgents() {
  const db = getDatabase();
  
  return new Promise((resolve) => {
    pm2.connect((connectErr) => {
      if (connectErr) {
        console.error('PM2 connect error:', connectErr);
        resolve();
        return;
      }
      
      pm2.list((listErr, processList) => {
        if (listErr) {
          console.error('PM2 list error:', listErr);
          pm2.disconnect();
          resolve();
          return;
        }
        
        db.all('SELECT * FROM agents', async (err, agents) => {
          if (err) {
            console.error('DB error:', err);
            pm2.disconnect();
            resolve();
            return;
          }
          
          console.log(`\n=== Checking ${agents.length} agents ===\n`);
          
          for (const agent of agents) {
            const pm2Name = agent.branch_hash.replace('0x', '').substring(0, 16);
            const pm2Proc = processList.find(p => p.name === pm2Name);
            const agentPath = path.join(AGENTS_DIR, agent.branch_hash);
            
            console.log(`Agent: ${agent.branch_name}`);
            console.log(`  Branch hash: ${agent.branch_hash.substring(0, 20)}...`);
            console.log(`  PM2 name: ${pm2Name}`);
            console.log(`  Status in DB: ${agent.status}`);
            console.log(`  Repo URL: ${agent.repo_url || 'MISSING!'}`);
            console.log(`  Branch name: ${agent.branch_name || 'MISSING!'}`);
            console.log(`  Agent path exists: ${fs.existsSync(agentPath)}`);
            console.log(`  Agent.ts exists: ${fs.existsSync(path.join(agentPath, 'agent.ts'))}`);
            
            if (pm2Proc) {
              console.log(`  PM2 status: ${pm2Proc.pm2_env.status}`);
              console.log(`  PM2 PID: ${pm2Proc.pid}`);
              console.log(`  PM2 restarts: ${pm2Proc.pm2_env.restart_time}`);
            } else {
              console.log(`  PM2 process: NOT FOUND`);
            }
            
            console.log('');
          }
          
          pm2.disconnect();
          resolve();
        });
      });
    });
  });
}

checkAndFixAgents().then(() => {
  console.log('\n✅ Check complete');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

