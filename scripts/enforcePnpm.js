#!/usr/bin/env node
import('chalk').then(chalk => {
  if (!/pnpm/.test(process.env.npm_execpath)) {
    console.error(chalk.redBright('You must use pnpm to install dependencies:'));
    console.error('  $ pnpm install');
    process.exit(1);
  }
}).catch(error => {
  console.error('Error loading chalk', error)
})
