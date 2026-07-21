# @telicent-oss/docs-docsify-template

*Monorepo Location: `./packages/docs-docsify-template`*

A docsify site setup that avoids the two things that usually make a docsify
site look bad out of the box:

- **The sidebar doesn't auto-explode.** Stock docsify lists every `h2`/`h3`
  from every page in the left nav, which reads as a wall of tiny headings.
  This kit sets `subMaxLevel: 0`, so the sidebar only shows the curated file
  list in `_sidebar.md` (generated for you by `generate-sidebar.js`).
- **The per-page heading outline moves to its own panel** on the right,
  instead of being crammed into that same left nav.

It also wires up the Vue docsify theme, Prism syntax highlighting (with a
GitHub-ish palette for code blocks), Mermaid diagram rendering, a
copy-code button, and image zoom — all via CDN, no build step.

## What's in `template/`

| File | Purpose |
|---|---|
| `index.html` | The docsify shell. Reads `site.config.json` at load time — you never edit this file. |
| `generate-sidebar.js` | Walks the repo, builds `_sidebar.md` from README/CHANGELOG/architecture-style docs it finds, and symlinks `site/root -> ..` so those files are servable. Also config-driven via `site.config.json`. |
| `site.config.json` | The only file you edit: site name, homepage doc, and any repo-specific inclusions/exclusions. |
| `package.json` | `build` (regenerate the sidebar) and `serve` (regenerate + serve locally) scripts, plus the `docsify-cli` devDependency. |
| `gitignore` | Ignore rules for the two generated artifacts (`_sidebar.md`, `root`). Rename to `.gitignore` after copying — see step 1. |

## Using it in a repo

1. Copy `template/*` into a `site/` folder at the root of the target repo,
   then restore the leading dot on the ignore file (npm ships it as
   `gitignore` because it strips a literal `.gitignore` from published
   packages):
   ```sh
   mkdir -p site
   cp -r node_modules/@telicent-oss/docs-docsify-template/template/. site/
   mv site/gitignore site/.gitignore
   ```
2. Edit `site/site.config.json`:
   - `siteName` — shown in the sidebar header.
   - `homepage` — the doc shown at `/`, as a `root/`-relative path (defaults
     to `root/README.md`).
   - `htmlSections` (optional) — any standalone HTML pages (e.g. rendered
     spike walkthroughs) to link into the sidebar as their own section:
     `[{ "title": "...", "files": [{ "label": "...", "path": "..." }] }]`.
   - `extraSkipDirs` / `extraIncludeNames` / `extraSkipFilenameSubstrings`
     (optional) — repo-specific additions to the built-in skip/include
     rules in `generate-sidebar.js`.
3. From `site/`: `npm install` (or `yarn`/`pnpm install`, matching the host
   repo), then `npm run serve` to preview, or `npm run build` to just
   regenerate `_sidebar.md` (e.g. in a Pages-deploy CI step).

`site/` is a plain folder, not a workspace member — it doesn't need to be
listed in the host repo's workspaces glob.

`generate-sidebar.js` writes two generated artifacts into `site/` on every
run: `_sidebar.md` and a `root` symlink back to the host repo. The copied
`site/.gitignore` (step 1) covers both, so they land in `site/` but never get
committed.

## Why a copied template rather than a runtime dependency

Docsify sites are static files served directly (e.g. by GitHub Pages) —
there's no bundler step that could resolve `index.html`/`generate-sidebar.js`
out of `node_modules` at request time. Publishing this as a package still
gets you a versioned, shared source of truth to copy from and diff against;
each consuming repo's `site/` is a customized copy, not a live link.
