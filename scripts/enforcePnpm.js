#!/usr/bin/env node
if (!/pnpm/.test(process.env.npm_execpath)) {
  console.error('You must use pnpm to install dependencies:');
  console.error('  $ pnpm install');
  process.exit(1);
}
