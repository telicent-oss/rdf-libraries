#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
// ANSI escape codes for colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
};


// Path to the configuration file
const configPath = path.join(__dirname, '..', '..', '.github', 'release-please-config.json');
const packagesDir = path.join(__dirname, '..', '..', 'packages');

// Read the configuration file
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Extract package paths from the config
const configuredPackages = Object.keys(config.packages);

// Read directories under ./packages/
const directories = fs.readdirSync(packagesDir)
  .filter(item => fs.statSync(path.join(packagesDir, item)).isDirectory())
  .map(dir => `packages/${dir}/`);

// Compare directories with configured packages
const missing = directories.filter(dir => !configuredPackages.includes(dir));

if (missing.length > 0) {
  console.error(`${colors.red}Error: The following directories are not listed in .github/release-please-config.json:${colors.reset}`);
  missing.forEach(dir => console.error(`    ${colors.red}${dir}${colors.reset}`));
  process.exit(1);
} else {
  console.log(`${colors.green}All packages are correctly listed in the configuration file.${colors.reset}`);
}