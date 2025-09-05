#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

const DEST = process.argv[2];
if (!DEST) {
  console.error('usage: gen-index.mjs <package-root>');
  process.exit(1);
}

const esmDir = path.join(DEST, 'esm');

const listJs = async (dir) => {
  try {
    const names = await fs.readdir(dir);
    return names
      .filter(n => n.endsWith('.js'))
      .filter(n => n !== 'index.js')
      .sort();
  } catch {
    return [];
  }
};

const listDts = async (dir) => {
  try {
    const names = await fs.readdir(dir);
    return new Set(
      names.filter(n => n.endsWith('.d.ts')).map(n => n.replace(/\.d\.ts$/, ''))
    );
  } catch {
    return new Set();
  }
};

const iconsEsm = await listJs(esmDir);            // e.g. ["Add.js", "Close.js", ...]
const iconsCjs = await listJs(DEST);              // top-level files
const dtsEsmSet = await listDts(esmDir);
const dtsCjsSet = await listDts(DEST);

// Prefer the intersection available in both formats
const baseNames = Array.from(
  new Set(
    iconsEsm
      .map(n => n.replace(/\.js$/, ''))
      .filter(b => iconsCjs.includes(`${b}.js`))
  )
).sort();

if (baseNames.length === 0) {
  console.error('No icons found to index. Check your manifest and copy step.');
  process.exit(1);
}

const esmIndexJs = baseNames.map(b => `export { default as ${b} } from './${b}.js';`).join('\n') + '\n';
const esmIndexDts = baseNames.map(b => `export { default as ${b} } from './${b}';`).join('\n') + '\n';

// CJS index: assemble object once to be fast
const cjsIndexJs =
  '/* eslint-disable */\n' +
  'module.exports = {\n' +
  baseNames.map(b => `  ${b}: require('./${b}.js').default`).join(',\n') +
  '\n};\n';

const cjsIndexDts = esmIndexDts; // identical declarations work for both

await fs.writeFile(path.join(esmDir, 'index.js'), esmIndexJs);
await fs.writeFile(path.join(esmDir, 'index.d.ts'), esmIndexDts);
await fs.writeFile(path.join(DEST, 'index.js'), cjsIndexJs);
await fs.writeFile(path.join(DEST, 'index.d.ts'), cjsIndexDts);

// Optional sanity: ensure per-file .d.ts exist where possible
const missingEsmDts = baseNames.filter(b => !dtsEsmSet.has(b));
const missingCjsDts = baseNames.filter(b => !dtsCjsSet.has(b));
if (missingEsmDts.length || missingCjsDts.length) {
  console.warn(
    [
      missingEsmDts.length ? `warn: missing esm d.ts for: ${missingEsmDts.join(', ')}` : '',
      missingCjsDts.length ? `warn: missing cjs d.ts for: ${missingCjsDts.join(', ')}` : ''
    ].filter(Boolean).join('\n')
  );
}