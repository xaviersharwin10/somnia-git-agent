#!/usr/bin/env node

const shell = require('shelljs');
const chalk = require('chalk').default;
const path = require('path');

// Get the project name from command line arguments
const projectName = process.argv[2];

// Handle help command
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(chalk.cyan('create-somnia-agent'));
  console.log('');
  console.log('Usage:');
  console.log('  npx create-somnia-agent <project-name>');
  console.log('');
  console.log('Options:');
  console.log('  -h, --help     Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  npx create-somnia-agent my-ai-bot');
  console.log('  npx create-somnia-agent trading-agent');
  process.exit(0);
}

if (!projectName) {
  console.error(chalk.red('Error: Please provide a project name.'));
  console.log(chalk.yellow('Usage: npx create-somnia-agent <project-name>'));
  console.log(chalk.yellow('Run with --help for more information.'));
  process.exit(1);
}

// Check if directory already exists
if (shell.test('-d', projectName)) {
  console.error(chalk.red(`Error: Directory '${projectName}' already exists.`));
  process.exit(1);
}

console.log(chalk.cyan(`Creating Somnia AI agent project: ${projectName}...`));

// Prefer local template copy for local development; fall back to clone if TEMPLATE_REPO is provided
const envTemplateRepo = process.env.TEMPLATE_REPO; // Optional override
const localTemplatePath = path.resolve(__dirname, '..', 'agent-template');

// Ensure destination exists
shell.mkdir('-p', projectName);

if (shell.test('-d', localTemplatePath)) {
  // Copy from local template
  if (shell.cp('-R', path.join(localTemplatePath, '.'), projectName).code !== 0) {
    console.error(chalk.red('Error: Failed to copy local agent-template.'));
    process.exit(1);
  }
} else if (envTemplateRepo) {
  // Clone from provided template repository
  const cloneCommand = `git clone ${envTemplateRepo} ${projectName}`;
  if (shell.exec(cloneCommand).code !== 0) {
    console.error(chalk.red('Error: Failed to clone the template repository.'));
    console.log(chalk.yellow('Make sure you have git installed and TEMPLATE_REPO is a valid URL.'));
    process.exit(1);
  }
} else {
  console.error(chalk.red('Error: Could not find local agent-template and no TEMPLATE_REPO provided.'));
  console.log(chalk.yellow('Either:'));
  console.log(chalk.yellow('  1) Place an `agent-template/` directory next to `create-somnia-agent/`, or'));
  console.log(chalk.yellow('  2) Set TEMPLATE_REPO to a git URL, e.g. export TEMPLATE_REPO=https://github.com/you/agent-template.git'));
  process.exit(1);
}

// Change to the new directory
shell.cd(projectName);

// Remove the .git folder to start fresh (if exists)
if (shell.test('-d', '.git')) {
  shell.rm('-rf', '.git');
}

console.log(chalk.green(`✅ Successfully created ${projectName}!`));
console.log('');
console.log(chalk.bold('Next steps:'));
console.log(chalk.cyan(`  cd ${projectName}`));
console.log(chalk.cyan('  npm install'));
console.log(chalk.cyan('  npm install -g git-somnia-agent'));
console.log(chalk.cyan('  git init'));
console.log(chalk.cyan('  git add .'));
console.log(chalk.cyan('  git commit -m "Initial commit"'));
console.log(chalk.cyan('  # Create a new repository on GitHub and push'));
console.log(chalk.cyan('  git remote add origin <your-github-repo-url>'));
console.log(chalk.cyan('  git push -u origin main'));
console.log('');
console.log(chalk.bold('Then set up SomniaPush:'));
console.log(chalk.cyan('  git somnia-agent init'));
console.log(chalk.cyan('  git somnia-agent secrets set GROQ_API_KEY=your-key-here'));
console.log(chalk.cyan('  git push  # This will deploy your agent!'));
console.log('');
console.log(chalk.green('Happy coding! 🚀'));
