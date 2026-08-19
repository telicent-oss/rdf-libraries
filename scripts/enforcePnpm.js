#!/usr/bin/env node
// The supply-chain gates in pnpm-workspace.yaml (minimumReleaseAge, trustPolicy,
// verifyDepsBeforeRun, blockExoticSubdeps, deny-by-default build scripts) only exist
// in pnpm 11. Older pnpm ignores those keys silently, so a v11 floor is part of the gate.
const REQUIRED_MAJOR = 11;

if (!/pnpm/.test(process.env.npm_execpath || '')) {
  console.error('You must use pnpm to install dependencies:');
  console.error('  $ pnpm install');
  process.exit(1);
}

const version = process.env.npm_config_user_agent?.match(/pnpm\/(\d+)\.\d+\.\d+/)?.[1];
if (version && Number(version) < REQUIRED_MAJOR) {
  console.error(`pnpm ${version} ignores this repo's supply-chain settings. pnpm ${REQUIRED_MAJOR} or newer is required:`);
  console.error('  $ corepack enable && corepack prepare pnpm@latest-11 --activate');
  process.exit(1);
}
