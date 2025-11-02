#!/usr/bin/env node

const { Command } = require('commander');
const axios = require('axios');
const shell = require('shelljs');
const { createPromptModule } = require('inquirer');
const prompt = createPromptModule();
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const program = new Command();
program.version('1.0.0');

// --- Configuration ---
// This is the *public URL* of our backend (from Day 7)
// For local testing, use http://localhost:3000
// For production, use your deployed backend URL
const API_BASE_URL = 'https://unabortive-davion-refractorily.ngrok-free.dev'; // TODO: Update this URL for production
const CONFIG_FILE = '.gitagent.json';

// --- Helper Functions ---

// Reads the .gitagent.json file
function getConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error(chalk.red(`Error: Not a GitAgent repository. Missing ${CONFIG_FILE}.`));
    console.log(chalk.yellow('Run `git agent init` to get started.'));
    process.exit(1);
  }
  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  return config;
}

// Gets the current git branch
function getCurrentBranch() {
  const branch = shell.exec('git rev-parse --abbrev-ref HEAD', { silent: true }).stdout.trim();
  if (!branch) {
    console.error(chalk.red('Error: Could not determine git branch.'));
    process.exit(1);
  }
  return branch;
}

// Calculate branch_hash (same as backend)
const { ethers } = require('ethers');

function calculateBranchHash(repo_url, branch_name) {
  return ethers.id(repo_url + "/" + branch_name);
}

// Helper function to fetch stats for a specific branch
async function getStats(repo_url, branch_name) {
  try {
    const branch_hash = calculateBranchHash(repo_url, branch_name);
    const url = `${API_BASE_URL}/api/stats/${branch_hash}`;
    const { data } = await axios.get(url);
    return { ...data, branch_name, repo_url };
  } catch (err) {
    console.error(chalk.red(`Error fetching stats for ${branch_name}: ${err.response?.data?.error || err.message}`));
    return null;
  }
}

// --- CLI Commands ---

/**
 * 1. INIT
 * Initializes the project by creating .gitagent.json
 */
program
  .command('init')
  .description('Initialize GitAgent in the current repository')
  .action(async () => {
    if (fs.existsSync(CONFIG_FILE)) {
      console.log(chalk.yellow(`This project is already initialized.`));
      return;
    }

    const answers = await prompt([
      {
        type: 'input',
        name: 'repo_url',
        message: 'What is your GitHub repository URL (e.g., https://github.com/user/repo.git)?',
        default: shell.exec('git remote get-url origin', { silent: true }).stdout.trim(),
      }
    ]);

    if (!answers.repo_url) {
      console.error(chalk.red('Error: Repository URL is required.'));
      return;
    }

    const config = { repo_url: answers.repo_url };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));

    console.log(chalk.green(`✅ ${CONFIG_FILE} created.`));
    console.log('Next steps:');
    console.log(`  1. Add your backend webhook to your GitHub repo settings.`);
    console.log(`  2. Set your secrets: ${chalk.cyan('git agent secrets set GROQ_API_KEY=...')}`);
    console.log(`  3. ${chalk.cyan('git push')} to deploy!`);
  });

/**
 * 2. SECRETS SET
 * Securely sets a secret for the current branch
 */
program
  .command('secrets set <KEY_VALUE>')
  .description('Set a secret for the current branch (e.g., KEY=VALUE)')
  .action(async (keyValue) => {
    // Handle the case where commander might parse this incorrectly
    const fullCommand = process.argv.slice(2).join(' ');
    const match = fullCommand.match(/secrets set (.+)/);
    
    if (!match) {
      console.error(chalk.red('Error: Invalid format. Use KEY=VALUE'));
      return;
    }
    
    const keyValueStr = match[1];
    const [key, ...valueParts] = keyValueStr.split('=');
    const value = valueParts.join('=');

    if (!key || !value) {
      console.error(chalk.red('Error: Invalid format. Use KEY=VALUE'));
      return;
    }

    const config = getConfig();
    const branch_name = getCurrentBranch();

    try {
      console.log(chalk.cyan(`Setting secret ${key} for branch ${branch_name}...`));
      await axios.post(`${API_BASE_URL}/api/secrets`, {
        repo_url: config.repo_url,
        branch_name: branch_name,
        key: key,
        value: value,
      });
      console.log(chalk.green(`✅ Secret ${key} set.`));
    } catch (err) {
      console.error(chalk.red(`Error setting secret: ${err.response?.data?.error || err.message}`));
    }
  });

/**
 * 3. STATS
 * Gets stats for the current branch
 */
program
  .command('stats')
  .description('Get performance stats for the agent on the current branch')
  .action(async () => {
    const config = getConfig();
    const branch_name = getCurrentBranch();

    console.log(chalk.cyan(`📊 Fetching stats for ${branch_name}...`));
    const result = await getStats(config.repo_url, branch_name);

    if (result && result.stats) {
      const s = result.stats;
      console.log(chalk.bold(`\n--- Agent Performance: ${branch_name} ---`));
      console.log(chalk.green(`  Total Decisions:  ${s.total_decisions || 0}`));
      console.log(chalk.cyan(`  BUY Signals:     ${s.buy_count || 0}`));
      console.log(chalk.yellow(`  HOLD Signals:    ${s.hold_count || 0}`));
      console.log(chalk.magenta(`  Trades Executed: ${s.trades_executed || 0}`));
      
      if (s.avg_price) {
        console.log(`\n  Price Statistics:`);
        console.log(`    Average: $${parseFloat(s.avg_price).toFixed(4)}`);
        console.log(`    Min:     $${parseFloat(s.min_price).toFixed(4)}`);
        console.log(`    Max:     $${parseFloat(s.max_price).toFixed(4)}`);
      }
      
      if (s.first_decision && s.last_decision) {
        console.log(`\n  Activity:`);
        console.log(`    First Decision: ${s.first_decision}`);
        console.log(`    Last Decision:  ${s.last_decision}`);
      }
      
      if (s.trades_executed > 0) {
        const successRate = ((s.trades_executed / s.total_decisions) * 100).toFixed(1);
        console.log(chalk.green(`\n  Success Rate: ${successRate}%`));
      }
    } else {
      console.log(chalk.yellow('No metrics available yet. Make some decisions first!'));
    }
  });

/**
 * 4. LOGS
 * Gets logs for the current branch
 */
program
  .command('logs')
  .description('Get logs for the agent on the current branch')
  .action(async () => {
    const config = getConfig();
    const branch_name = getCurrentBranch();

    try {
      console.log(chalk.cyan(`Fetching logs for ${branch_name}...`));
      const url = `${API_BASE_URL}/api/logs/${encodeURIComponent(config.repo_url)}/${encodeURIComponent(branch_name)}`;
      const { data } = await axios.get(url);

      console.log(chalk.bold(`--- Last 50 Logs: ${branch_name} ---`));
      if (data.logs && data.logs.length > 0) {
        data.logs.forEach(line => console.log(line));
      } else {
        console.log(chalk.yellow('No logs found.'));
      }
    } catch (err) {
      console.error(chalk.red(`Error fetching logs: ${err.response?.data?.error || err.message}`));
    }
  });

/**
 * 5. COMPARE
 * Compares two branches side-by-side
 */
program
  .command('compare <branch1> <branch2>')
  .description('Compare the performance of two agent branches')
  .action(async (branch1, branch2) => {
    const config = getConfig();

    console.log(chalk.cyan(`📊 Comparing ${chalk.bold(branch1)} vs ${chalk.bold(branch2)}...`));

    const [result1, result2] = await Promise.all([
      getStats(config.repo_url, branch1),
      getStats(config.repo_url, branch2)
    ]);

    if (!result1 || !result2 || !result1.stats || !result2.stats) {
      console.error(chalk.red('Could not fetch stats for comparison.'));
      if (!result1) console.log(chalk.yellow(`  ${branch1}: No metrics available`));
      if (!result2) console.log(chalk.yellow(`  ${branch2}: No metrics available`));
      return;
    }

    const s1 = result1.stats;
    const s2 = result2.stats;

    console.log(chalk.bold('\n--- Side-by-Side Agent Comparison ---\n'));
    
    // Create comparison table
    const metrics = [
      { label: 'Total Decisions', v1: s1.total_decisions || 0, v2: s2.total_decisions || 0, format: (v) => v.toString() },
      { label: 'BUY Signals', v1: s1.buy_count || 0, v2: s2.buy_count || 0, format: (v) => chalk.cyan(v.toString()) },
      { label: 'HOLD Signals', v1: s1.hold_count || 0, v2: s2.hold_count || 0, format: (v) => chalk.yellow(v.toString()) },
      { label: 'Trades Executed', v1: s1.trades_executed || 0, v2: s2.trades_executed || 0, format: (v) => chalk.magenta(v.toString()) },
      { label: 'Avg Price', v1: s1.avg_price || 0, v2: s2.avg_price || 0, format: (v) => `$${parseFloat(v).toFixed(4)}` },
      { label: 'Success Rate', 
        v1: s1.total_decisions ? ((s1.trades_executed / s1.total_decisions) * 100).toFixed(1) : '0.0', 
        v2: s2.total_decisions ? ((s2.trades_executed / s2.total_decisions) * 100).toFixed(1) : '0.0',
        format: (v) => chalk.green(`${v}%`)
      },
    ];

    console.log(`| ${'Metric'.padEnd(18)} | ${chalk.bold(branch1.padEnd(25))} | ${chalk.bold(branch2.padEnd(25))} |`);
    console.log('|' + '-'.repeat(20) + '|' + '-'.repeat(27) + '|' + '-'.repeat(27) + '|');
    
    metrics.forEach(m => {
      const v1Str = m.format(m.v1);
      const v2Str = m.format(m.v2);
      console.log(`| ${m.label.padEnd(18)} | ${v1Str.padEnd(25)} | ${v2Str.padEnd(25)} |`);
    });

    // Determine winner
    console.log('\n' + chalk.bold('🏆 Winner Analysis:'));
    if ((s1.trades_executed || 0) > (s2.trades_executed || 0)) {
      console.log(chalk.green(`  ${branch1} has executed more trades`));
    } else if ((s2.trades_executed || 0) > (s1.trades_executed || 0)) {
      console.log(chalk.green(`  ${branch2} has executed more trades`));
    } else {
      console.log(chalk.yellow(`  Both branches have similar trade execution`));
    }

    if (s1.total_decisions && s2.total_decisions) {
      const rate1 = (s1.trades_executed / s1.total_decisions) * 100;
      const rate2 = (s2.trades_executed / s2.total_decisions) * 100;
      if (rate1 > rate2) {
        console.log(chalk.green(`  ${branch1} has better success rate (${rate1.toFixed(1)}% vs ${rate2.toFixed(1)}%)`));
      } else if (rate2 > rate1) {
        console.log(chalk.green(`  ${branch2} has better success rate (${rate2.toFixed(1)}% vs ${rate1.toFixed(1)}%)`));
      }
    }
  });

// --- Parse and Run ---
program.parse(process.argv);






