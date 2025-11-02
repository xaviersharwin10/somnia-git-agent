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

// Helper function to fetch stats for a specific branch
async function getStats(repo_url, branch_name) {
  try {
    const url = `${API_BASE_URL}/api/stats/${encodeURIComponent(repo_url)}/${encodeURIComponent(branch_name)}`;
    const { data } = await axios.get(url);
    return data;
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
  .description('Get stats for the agent on the current branch')
  .action(async () => {
    const config = getConfig();
    const branch_name = getCurrentBranch();

    console.log(chalk.cyan(`Fetching stats for ${branch_name}...`));
    const stats = await getStats(config.repo_url, branch_name);

    if (stats) {
      console.log(chalk.bold(`--- Agent Stats: ${stats.branch} ---`));
      console.log(chalk.green(`  Status:  ${stats.status.toUpperCase()}`));
      console.log(`  Balance: ${chalk.yellow(stats.balance)}`);
      console.log(`  Address: ${stats.agent_address}`);
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
 * Compares two branches
 */
program
  .command('compare <branch1> <branch2>')
  .description('Compare the performance of two agent branches')
  .action(async (branch1, branch2) => {
    const config = getConfig();

    console.log(chalk.cyan(`Comparing ${branch1} vs ${branch2}...`));

    const [stats1, stats2] = await Promise.all([
      getStats(config.repo_url, branch1),
      getStats(config.repo_url, branch2)
    ]);

    if (!stats1 || !stats2) {
      console.error(chalk.red('Could not fetch stats for comparison.'));
      return;
    }

    console.log(chalk.bold('--- Agent Comparison ---'));
    console.log(`| Metric        | ${chalk.bold(branch1.padEnd(20))} | ${chalk.bold(branch2.padEnd(20))} |`);
    console.log('|---------------|------------------------|------------------------|');
    console.log(`| Status        | ${stats1.status.padEnd(20)} | ${stats2.status.padEnd(20)} |`);
    console.log(`| Balance (SOMI) | ${chalk.yellow(stats1.balance.padEnd(20))} | ${chalk.yellow(stats2.balance.padEnd(20))} |`);
    console.log(`| Address       | ${stats1.agent_address.substring(0, 20)}... | ${stats2.agent_address.substring(0, 20)}... |`);
  });

// --- Parse and Run ---
program.parse(process.argv);






