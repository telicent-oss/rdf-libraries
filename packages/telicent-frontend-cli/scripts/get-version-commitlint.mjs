#!/usr/bin/env node

import { readFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJson = JSON.parse(readFileSync(`${__dirname}/../package.json`, 'utf8'));
const version = packageJson.devDependencies['@commitlint/cli'];

if (!version) {
  console.error('Error: @commitlint/cli is not listed in devDependencies');
  process.exit(1);
}

// Strip non-numeric characters like ^ or ~
console.log(version.replace(/[^\d.]/g, ''));
