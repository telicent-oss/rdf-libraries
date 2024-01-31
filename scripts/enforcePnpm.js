#!/usr/bin/env node
const chalk = require('chalk');
if (!/pnpm/.test(process.env.npm_execpath)) {
  console.error(chalk.redBright('You must use pnpm to install dependencies:'));
  console.error('  $ pnpm install');
  process.exit(1);
}