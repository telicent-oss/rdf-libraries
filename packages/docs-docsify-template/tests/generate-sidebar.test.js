'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const TEMPLATE_DIR = path.join(__dirname, '..', 'template');
const SCRIPT_PATH = path.join(TEMPLATE_DIR, 'generate-sidebar.js');
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

function setupRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-docsify-template-test-'));
  fs.cpSync(path.join(FIXTURES_DIR, 'repo'), repoRoot, { recursive: true });

  const siteDir = path.join(repoRoot, 'site');
  fs.cpSync(TEMPLATE_DIR, siteDir, { recursive: true });
  fs.cpSync(path.join(FIXTURES_DIR, 'site.config.json'), path.join(siteDir, 'site.config.json'));

  return { repoRoot, siteDir };
}

function runGenerateSidebar(siteDir) {
  const prevSiteDir = process.env.DOCS_DOCSIFY_TEMPLATE_SITE_DIR;
  process.env.DOCS_DOCSIFY_TEMPLATE_SITE_DIR = siteDir;
  jest.resetModules();
  try {
    require(SCRIPT_PATH);
  } finally {
    if (prevSiteDir === undefined) delete process.env.DOCS_DOCSIFY_TEMPLATE_SITE_DIR;
    else process.env.DOCS_DOCSIFY_TEMPLATE_SITE_DIR = prevSiteDir;
  }
}

describe('template/generate-sidebar.js', () => {
  let repoRoot;
  let siteDir;

  beforeEach(() => {
    ({ repoRoot, siteDir } = setupRepo());
  });

  afterEach(() => {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  it('symlinks site/root back to the repo root', () => {
    runGenerateSidebar(siteDir);

    const rootLink = path.join(siteDir, 'root');
    expect(fs.lstatSync(rootLink).isSymbolicLink()).toBe(true);
    expect(fs.readlinkSync(rootLink)).toBe('..');
    expect(fs.readFileSync(path.join(rootLink, 'README.md'), 'utf8')).toContain('Fixture Repo');
  });

  it('builds _sidebar.md from included docs and skips excluded dirs', () => {
    runGenerateSidebar(siteDir);

    const sidebar = fs.readFileSync(path.join(siteDir, '_sidebar.md'), 'utf8');
    expect(sidebar).toContain('[README](root/README.md)');
    expect(sidebar).toContain('[ARCHITECTURE](root/docs/ARCHITECTURE.md)');
    expect(sidebar).not.toContain('root/site/');
  });

  it('is idempotent: re-running does not fail on an existing symlink', () => {
    runGenerateSidebar(siteDir);
    expect(() => runGenerateSidebar(siteDir)).not.toThrow();
  });

  it('includes any .md file inside a docs/ dir, and files with a guide- prefix', () => {
    fs.mkdirSync(path.join(repoRoot, 'docs', 'notes'), { recursive: true });
    fs.writeFileSync(path.join(repoRoot, 'docs', 'random-notes.md'), '# Random notes');
    fs.writeFileSync(path.join(repoRoot, 'guide-quickstart.md'), '# Guide');

    runGenerateSidebar(siteDir);

    const sidebar = fs.readFileSync(path.join(siteDir, '_sidebar.md'), 'utf8');
    expect(sidebar).toContain('[Random Notes](root/docs/random-notes.md)');
    expect(sidebar).toContain('[Guide Quickstart](root/guide-quickstart.md)');
  });

  it('excludes an unrelated .md file at the repo root', () => {
    fs.writeFileSync(path.join(repoRoot, 'random.md'), '# Random');

    runGenerateSidebar(siteDir);

    const sidebar = fs.readFileSync(path.join(siteDir, '_sidebar.md'), 'utf8');
    expect(sidebar).not.toContain('random.md');
  });

  it('collapses a folder whose only doc is its own README into one link', () => {
    fs.mkdirSync(path.join(repoRoot, 'single-page'));
    fs.writeFileSync(path.join(repoRoot, 'single-page', 'README.md'), '# Single page');

    runGenerateSidebar(siteDir);

    const sidebar = fs.readFileSync(path.join(siteDir, '_sidebar.md'), 'utf8');
    expect(sidebar).toContain('[Single Page](root/single-page/README.md)');
    expect(sidebar).not.toContain('**Single Page**');
  });

  it('falls back to an empty config when site.config.json is missing', () => {
    fs.rmSync(path.join(siteDir, 'site.config.json'));
    expect(() => runGenerateSidebar(siteDir)).not.toThrow();
  });

  it('skips a directory it cannot read instead of throwing', () => {
    const lockedDir = path.join(repoRoot, 'locked');
    fs.mkdirSync(lockedDir);
    fs.chmodSync(lockedDir, 0o000);

    try {
      expect(() => runGenerateSidebar(siteDir)).not.toThrow();
    } finally {
      fs.chmodSync(lockedDir, 0o755);
    }
  });

  it('links htmlSections from site.config.json into the sidebar', () => {
    fs.writeFileSync(
      path.join(siteDir, 'site.config.json'),
      JSON.stringify({
        siteName: 'fixture-repo',
        homepage: 'root/README.md',
        htmlSections: [
          { title: 'Spikes', files: [{ label: 'Walkthrough', path: 'spike.html' }] },
        ],
      }),
    );

    runGenerateSidebar(siteDir);

    const sidebar = fs.readFileSync(path.join(siteDir, '_sidebar.md'), 'utf8');
    expect(sidebar).toContain('**Spikes**');
    expect(sidebar).toContain("[Walkthrough](root/spike.html ':ignore')");
  });
});
