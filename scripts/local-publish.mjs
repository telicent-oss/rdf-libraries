#!/usr/bin/env node
/**
 * local-publish.mjs
 * BIG UPDATE: Oct 21 2025 (4a7830c6) not battle tested (remove this line after 3+ months of use)
 *
 * Behavior
 * - Normal run:
 *     1) Select ONE source package.
 *     2) Bump source version (branch-driven) via local-version-bump.sh.
 *     3) Update only the dependents' ranges on the source to the new version. 
 *     4) Compute affected set = source + dependents (transitive).
 *     5) Add dependency-closure so builds have prerequisites available.
 *     6) Topo-build all in closure; publish only the affected set in topo order.
 *
 * - --dry-run:
 *     • Only run version bumps on the affected set (source + dependents).
 *     • No range updates, no build, no publish.
 *
 * Flags:
 *   --dry-run
 *   --git
 *   --yes
 *   --range=^|~|exact  (how dependents reference the source; default ^) [ignored in --dry-run]
 *
 * NOTE on "It still builds everything":
 *   Some package "build" scripts trigger monorepo-wide builds (e.g. `lerna run build`,
 *   `nx run-many`, or `tsc -b` with project references). To hard-stop the fan-out,
 *   this script computes an *isolated* build command per package:
 *     - If the package build script looks global (lerna/nx/tsc -b) OR is missing,
 *       we fall back to a local-only TypeScript compile:
 *         • prefer:   yarn tsc -p tsconfig.build.json
 *         • fallback: yarn tsc -p tsconfig.json
 *     - Otherwise, we run: yarn workspace "<name>" run build
 *   This guarantees we only build the intended workspace.
 */

import { sync as globSync } from "glob";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import inquirer from "inquirer";
import { execaCommandSync } from "execa";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = path.resolve(__dirname, ".."); // repo root

const CACHE_FILE = path.resolve(ROOT, ".prevSelections.gitignored.json");
const DRY_RUN = process.argv.includes("--dry-run");
const GIT = process.argv.includes("--git");
const YES = process.argv.includes("--yes");

const rangeArg = (() => {
  const m = process.argv.find(a => a.startsWith("--range="));
  const v = m ? m.split("=")[1] : "^";
  if (!["^", "~", "exact"].includes(v)) {
    console.error(`--range must be one of ^, ~, exact. Got: ${v}`);
    process.exit(2);
  }
  return v;
})();
const applyRange = (version) => (rangeArg === "exact" ? version : `${rangeArg}${version}`);

const DOMAIN = "🏠➡️📦";

// --- FS helpers ---------------------------------------------------------------
const readJSON = (file) => JSON.parse(fs.readFileSync(file, "utf-8"));
const writeJSON = (file, obj) => fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n");
const run = (cmd, cwd) => execaCommandSync(cmd, { cwd, stdio: "inherit", shell: true });
const runAtRoot = (cmd) => run(cmd, ROOT);
const pkgNameVer = (dir) => {
  const j = readJSON(path.join(dir, "package.json"));
  return { name: j.name, version: j.version };
};

// Build a strictly isolated build command for a package
const isolatedBuildCmdFor = (node) => {
  const pkgPath = path.join(node.dir, "package.json");
  const pkg = readJSON(pkgPath);
  const buildScript = String(pkg.scripts?.build ?? "");
  const hasTsconfigBuild = fs.existsSync(path.join(node.dir, "tsconfig.build.json"));
  const hasTsconfig = fs.existsSync(path.join(node.dir, "tsconfig.json"));

  const looksGlobal =
    /\blerna\s+run\b/.test(buildScript) ||
    /\bnx\s+run-many\b/.test(buildScript) ||
    /\btsc\b.*\b(-b|--build)\b/.test(buildScript) ||
    buildScript.length === 0;

  if (looksGlobal) {
    if (hasTsconfigBuild) return `yarn tsc -p tsconfig.build.json`;
    if (hasTsconfig) return `yarn tsc -p tsconfig.json`;
    // Last-resort: still scope to single workspace to avoid fan-out (may fail if no script)
    return `yarn workspace "${node.name}" run build`;
  }

  // Script looks safe; run it scoped to this workspace only.
  return `yarn workspace "${node.name}" run build`;
};

// --- Repo scan → graph --------------------------------------------------------
const repoPkgs = globSync("./packages/*", { cwd: ROOT }).filter((dir) =>
  fs.existsSync(path.join(ROOT, dir, "package.json"))
);
if (!repoPkgs.length) {
  console.error(`${DOMAIN} Error: no packages found under ./packages/*`);
  process.exit(1);
}

function buildGraph() {
  const nodes = new Map(); // name -> { name, dir, version, deps:Set<internalName> }
  for (const relDir of repoPkgs) {
    const dir = path.join(ROOT, relDir);
    const j = readJSON(path.join(dir, "package.json"));
    nodes.set(j.name, { name: j.name, dir, version: j.version, deps: new Set() });
  }
  for (const n of nodes.values()) {
    const j = readJSON(path.join(n.dir, "package.json"));
    const fields = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
    for (const f of fields) {
      const d = j[f] || {};
      for (const depName of Object.keys(d)) {
        if (nodes.has(depName) && depName !== n.name) n.deps.add(depName);
      }
    }
  }
  return nodes;
}

function reverseAdj(nodes) {
  const rev = new Map([...nodes.keys()].map((k) => [k, new Set()]));
  for (const n of nodes.values()) for (const d of n.deps) rev.get(d).add(n.name);
  return rev;
}

function dependentClosure(nodes, root) {
  const rev = reverseAdj(nodes);
  const out = new Set();
  const q = [root];
  while (q.length) {
    const cur = q.shift();
    for (const dep of rev.get(cur) || []) {
      if (!out.has(dep)) {
        out.add(dep);
        q.push(dep);
      }
    }
  }
  return out; // excludes root
}

function dependencyClosure(nodes, setIn) {
  const out = new Set(setIn);
  const stack = [...setIn];
  while (stack.length) {
    const cur = stack.pop();
    const n = nodes.get(cur);
    if (!n) continue;
    for (const d of n.deps) {
      if (!out.has(d)) {
        out.add(d);
        stack.push(d);
      }
    }
  }
  return out;
}

function topoSort(nodes, subset) {
  const S = new Set(subset);
  const inDeg = new Map();
  for (const name of S) inDeg.set(name, 0);
  for (const name of S) {
    for (const d of nodes.get(name).deps) {
      if (S.has(d)) inDeg.set(name, inDeg.get(name) + 1);
    }
  }
  const q = [];
  for (const [n, deg] of inDeg) if (deg === 0) q.push(n);
  const order = [];
  while (q.length) {
    const n = q.shift();
    order.push(n);
    // decrement in-deg of dependents of n
    for (const [cand, node] of nodes) {
      if (!S.has(cand)) continue;
      if (node.deps.has(n)) {
        const deg = inDeg.get(cand) - 1;
        inDeg.set(cand, deg);
        if (deg === 0) q.push(cand);
      }
    }
  }
  if (order.length !== S.size) {
    const remaining = [...S].filter((n) => !order.includes(n));
    throw new Error(`Cycle detected among: ${remaining.join(", ")}`);
  }
  return order;
}

// Update only dependents’ ranges on the source package (direct edges only)
function updateDependentRanges(sourceName, newVersion, nodes) {
  const rangeVersion = applyRange(newVersion);
  const fields = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies", "resolutions"];
  const changedFiles = [];

  const dependents = dependentClosure(nodes, sourceName);
  for (const depName of dependents) {
    const dir = nodes.get(depName).dir;
    const pkgPath = path.join(dir, "package.json");
    const json = readJSON(pkgPath);

    let touched = false;
    for (const f of fields) {
      const deps = json[f];
      if (deps && Object.prototype.hasOwnProperty.call(deps, sourceName)) {
        if (deps[sourceName] !== rangeVersion) {
          deps[sourceName] = rangeVersion;
          touched = true;
        }
      }
    }
    if (touched) {
      writeJSON(pkgPath, json);
      changedFiles.push({ name: depName, pkgPath });
    }
  }
  return changedFiles;
}

// --- Main ---------------------------------------------------------------------
(async () => {
  // Select ONE source
  const prev = fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8")) : [];
  const choices = repoPkgs.map((dir) => ({ name: dir, checked: prev.includes(dir) }));

  let selected = [];
  if (prev.length && YES) {
    selected = prev;
  } else {
    const ans = await inquirer.prompt([
      { type: "checkbox", name: "selected", message: "Select packages (first is SOURCE)", choices },
    ]);
    selected = ans.selected;
  }
  if (!selected.length) {
    console.error(`${DOMAIN} Nothing selected.`);
    process.exit(1);
  }
  fs.writeFileSync(CACHE_FILE, JSON.stringify(selected, null, 2));

  const sourceDirRel = selected[0];
  const sourceDir = path.join(ROOT, sourceDirRel);
  const { name: sourceName, version: sourceVerBefore } = pkgNameVer(sourceDir);

  // 1) Bump SOURCE version
  run(
    [
      path.resolve(__dirname, "local-version-bump.sh"),
      ...(GIT ? ["--git"] : []),
    ].join(" "),
    sourceDir
  );
  const { version: sourceVersion } = pkgNameVer(sourceDir);
  console.log(`${DOMAIN} Source: ${sourceName} ${sourceVerBefore} → ${sourceVersion}`);

  // Graph after bump
  const nodes0 = buildGraph();

  // Determine affected set (source + all dependents)
  const dependents = dependentClosure(nodes0, sourceName);
  const affectedNames = new Set([sourceName, ...dependents]);

  // --dry-run: ONLY bump versions for affected set; finish.
  if (DRY_RUN) {
    const order = topoSort(nodes0, affectedNames); // deps first
    for (const pkgName of order) {
      if (pkgName === sourceName) continue; // already bumped
      const dir = nodes0.get(pkgName).dir;
      console.log(`${DOMAIN} [dry] bump ${pkgName}`);
      run(path.resolve(__dirname, "local-version-bump.sh"), dir);
    }
    console.log(`${DOMAIN} [dry] Done (versions bumped only; no range updates, no build, no publish).`);
    return;
  }

  // 2) Update ONLY dependents’ ranges on the source
  const rangeChanges = updateDependentRanges(sourceName, sourceVersion, nodes0);
  const changedDependents = new Set(rangeChanges.map((c) => c.name));
  // Affected set = source + those dependents that actually declare a range to source
  const affected = new Set([sourceName, ...changedDependents]);

  // 3) Include dependency-closure so builds have prerequisites available
  const nodes1 = buildGraph(); // reload after range edits
  const withDeps = dependencyClosure(nodes1, affected);

  // 4) Topological build order
  const buildOrder = topoSort(nodes1, withDeps);

  // 5) Bump versions for the affected set so they can publish
  for (const pkgName of buildOrder) {
    if (!affected.has(pkgName)) continue;
    if (pkgName === sourceName) continue; // already bumped
    const dir = nodes1.get(pkgName).dir;
    run(
      [
        path.resolve(__dirname, "local-version-bump.sh"),
        ...(GIT ? ["--git"] : []),
      ].join(" "),
      dir
    );
  }

  // 6) Build in topo order (deps first) — ISOLATED per package (no fan-out)
  for (const pkgName of buildOrder) {
    const node = nodes1.get(pkgName);
    const cmd = isolatedBuildCmdFor(node);
    console.log(`${DOMAIN} build ${pkgName}  →  ${cmd}`);
    runAtRoot(cmd);
  }

  // 7) Publish ONLY the affected set (source + changed dependents), in topo order — workspace-scoped
  for (const pkgName of buildOrder) {
    if (!affected.has(pkgName)) continue;
    console.log(`${DOMAIN} publish ${pkgName}`);
    runAtRoot(`yarn workspace "${pkgName}" run local-publish`);
  }

  console.log(`${DOMAIN} Done.`);
})().catch((e) => {
  console.error(e?.stack || e);
  process.exit(1);
});