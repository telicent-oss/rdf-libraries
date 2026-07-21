#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

// Override hook for the package's smoke test, which runs this script
// in-process against a temp fixture tree instead of the real site/.
const SITE_DIR = process.env.DOCS_DOCSIFY_TEMPLATE_SITE_DIR || __dirname;
const REPO_ROOT = path.resolve(SITE_DIR, '..');
const SYMLINK_PATH = path.join(SITE_DIR, 'root');
const SIDEBAR_PATH = path.join(SITE_DIR, '_sidebar.md');
const CONFIG_PATH = path.join(SITE_DIR, 'site.config.json');

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return {};
  }
}

const config = loadConfig();

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'coverage', '.cache',
  'specs', 'pm', 'experiments', '.claude', '.specify', '.gemini', '.codex',
  'commit-plan', 'storybook-static', 'playwright-report', 'e2e',
  'project-management', '__tests__', '__mocks__', 'fixtures', '.archived',
  'site', 'vendor',
  ...(config.extraSkipDirs || []),
]);

const INCLUDE_NAMES = new Set([
  'README.md', 'Readme.md', 'ARCHITECTURE.md', 'CHANGELOG.md',
  'ONBOARDING.md', 'VIOLATIONS.md',
  'DEPLOYMENT.md', 'LOCAL_TESTING.md', 'TODO.md',
  'quickstart.md', 'architecture.md', 'mental-model.md',
  'data-flow.md', 'motivation.md', 'api.md',
  ...(config.extraIncludeNames || []),
]);

const SKIP_FILENAME_SUBSTRINGS = [
  'plan', 'task', 'refactor', 'research', 'spec', 'idea',
  'future', 'contributing',
  ...(config.extraSkipFilenameSubstrings || []),
];

// HTML pages to integrate, supplied per-repo via site.config.json's
// htmlSections. Each entry becomes its own sidebar section; links use
// docsify ':ignore' so the browser opens the HTML directly.
const HTML_SECTIONS = config.htmlSections || [];

function shouldSkipDir(name) {
  if (SKIP_DIRS.has(name)) return true;
  if (name.startsWith('.')) return true;
  if (name.includes('gitignored')) return true;
  return false;
}

function shouldIncludeFile(filename, inDocsDir) {
  if (/\.gitignored/.test(filename)) return false;
  if (/^FAIL\./.test(filename)) return false;
  if (/^NEEDS-ACTION\./.test(filename)) return false;
  if (/^LEAF\./.test(filename)) return false;
  if (filename === 'CLAUDE.md' || filename === 'AGENTS.md' || filename === 'NEXT.md') return false;
  const lower = filename.toLowerCase();
  if (SKIP_FILENAME_SUBSTRINGS.some(s => lower.includes(s))) return false;
  if (/\blog\b/i.test(filename)) return false;
  if (INCLUDE_NAMES.has(filename)) return true;
  if (inDocsDir) return true;
  if (filename.startsWith('guide-')) return true;
  return false;
}

function humanize(name) {
  return name
    .replace(/\.md$/, '')
    .replace(/\.html$/, '')
    .replace(/^[\d]+[\.\-]?\s*/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

// Extract link target from a single sidebar line, e.g. "(root/foo/README.md)"
function extractLink(line) {
  const m = line.match(/\((root\/[^)]+)\)/);
  return m ? m[1] : null;
}

function walk(dir, repoRelDir, depth, inDocsDir) {
  const lines = [];

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return lines;
  }

  const files = [];
  const dirs = [];

  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      if (!shouldSkipDir(entry.name)) dirs.push(entry.name);
    } else if (entry.name.endsWith('.md')) {
      const isRootLog = repoRelDir === '' && entry.name === 'log.md';
      if (isRootLog || shouldIncludeFile(entry.name, inDocsDir)) {
        files.push(entry.name);
      }
    }
  }

  files.sort();
  dirs.sort();

  const indent = '  '.repeat(depth);

  for (const file of files) {
    const label = humanize(file);
    const rel = repoRelDir ? `${repoRelDir}/${file}` : file;
    lines.push(`${indent}- [${label}](root/${rel})`);
  }

  for (const d of dirs) {
    const subDir = path.join(dir, d);
    const subRel = repoRelDir ? `${repoRelDir}/${d}` : d;
    const childInDocsDir = inDocsDir || d === 'docs';
    const subLines = walk(subDir, subRel, depth + 1, childInDocsDir);

    if (subLines.length === 0) continue;

    // Collapse: folder whose only content is a single README.md link
    if (
      subLines.length === 1 &&
      subLines[0].includes('[README]') &&
      subLines[0].includes('(root/')
    ) {
      const link = extractLink(subLines[0]);
      lines.push(`${indent}- [${humanize(d)}](${link})`);
    } else {
      lines.push(`${indent}- **${humanize(d)}**`);
      lines.push(...subLines);
    }
  }

  return lines;
}

function htmlSectionLines() {
  const lines = [];
  for (const section of HTML_SECTIONS) {
    lines.push(`- **${section.title}**`);
    for (const f of section.files) {
      lines.push(`  - [${f.label}](root/${f.path} ':ignore')`);
    }
  }
  return lines;
}

function ensureSymlink() {
  try {
    fs.lstatSync(SYMLINK_PATH);
  } catch {
    fs.symlinkSync('..', SYMLINK_PATH);
    console.log('Created symlink: site/root -> ..');
  }
}

function main() {
  ensureSymlink();

  const mdLines = walk(REPO_ROOT, '', 0, false);
  const htmlLines = htmlSectionLines();
  const all = [...mdLines, ...htmlLines];

  fs.writeFileSync(SIDEBAR_PATH, all.join('\n') + '\n');

  const mdCount = mdLines.filter(l => l.includes('](root/')).length;
  const htmlCount = htmlLines.filter(l => l.includes('](root/')).length;
  console.log(`Sidebar: ${mdCount} docs + ${htmlCount} HTML pages → ${SIDEBAR_PATH}`);
}

main();
