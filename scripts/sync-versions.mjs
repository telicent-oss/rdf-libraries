#!/usr/bin/env node
/**
 * Sync inter-package dependency versions across a monorepo.
 * - Scans all package.json (excluding node_modules, dist, build, coverage, .git)
 * - For deps pointing to another in-repo package, rewrites range to:
 *     ^<version> (default) | ~<version> | <version> (exact) | workspace:* (if you insist)
 *
 * Usage:
 *   node scripts/sync-versions.mjs               # default: --range=^
 *   node scripts/sync-versions.mjs --range=~     # tilde ranges
 *   node scripts/sync-versions.mjs --range=exact # pin exact
 *   node scripts/sync-versions.mjs --range=workspace # writes "workspace:*"
 *   node scripts/sync-versions.mjs --dry         # preview only
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const IGNORE_DIRS = new Set(["node_modules", ".git", "dist", "build", "coverage", "out"]);
const FIELDS = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies", "resolutions"];

const args = new Map(process.argv.slice(2).map(a => {
  const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
  return m ? [m[1], m[2] ?? "true"] : [a, "true"];
}));
const rangeMode = (args.get("range") ?? "^").toLowerCase();
const dryRun = args.has("dry");

const rangeOf = (version) => {
  switch (rangeMode) {
    case "exact": return version;
    case "~": return `~${version}`;
    case "^": return `^${version}`;
    case "workspace": return "workspace:*"; // Yarn v1 won't understand this
    default: throw new Error(`Unsupported --range=${rangeMode}`);
  }
};

async function* walk(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      if (IGNORE_DIRS.has(e.name)) continue;
      yield* walk(path.join(dir, e.name));
    } else if (e.isFile() && e.name === "package.json") {
      yield path.join(dir, e.name);
    }
  }
}

const readJSON = async (file) => JSON.parse(await fs.promises.readFile(file, "utf8"));
const writeJSON = async (file, data) => fs.promises.writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");

// 1) Collect all packages (name -> version)
const pkgFiles = [];
for await (const p of walk(ROOT)) pkgFiles.push(p);

const nameToVersion = new Map();
for (const file of pkgFiles) {
  try {
    const json = await readJSON(file);
    if (json?.name && json?.version) nameToVersion.set(json.name, json.version);
  } catch {
    // ignore malformed package.json
  }
}

// 2) Rewrite dependency ranges
let filesChanged = 0;
let entriesChanged = 0;

for (const file of pkgFiles) {
  const json = await readJSON(file);
  const selfName = json?.name;

  let changed = false;
  for (const field of FIELDS) {
    const deps = json[field];
    if (!deps) continue;

    for (const dep of Object.keys(deps)) {
      if (!nameToVersion.has(dep)) continue;         // not an in-repo package
      if (dep === selfName) continue;                // don't self-depend
      const desired = rangeMode === "workspace" ? "workspace:*" : rangeOf(nameToVersion.get(dep));
      if (deps[dep] !== desired) {
        deps[dep] = desired;
        changed = true;
        entriesChanged++;
      }
    }
  }

  if (changed && !dryRun) {
    await writeJSON(file, json);
    filesChanged++;
  }
}

console.log(`${dryRun ? "[dry]" : "[write]"} updated ${filesChanged} package.json file(s), ${entriesChanged} entry(ies).`);