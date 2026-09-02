#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const covRoot = path.join(repoRoot, "coverage");
const packagesDir = path.join(covRoot, "packages");
const tmpDir = path.join(covRoot, ".nyc_output");
const reportDir = path.join(covRoot, "merged");

if (!fs.existsSync(packagesDir)) {
  console.error(`No per-package coverage at ${packagesDir}. Run \`yarn coverage\` first.`);
  process.exit(1);
}

fs.rmSync(tmpDir, { recursive: true, force: true });
fs.rmSync(reportDir, { recursive: true, force: true });
fs.mkdirSync(tmpDir, { recursive: true });

let collected = 0;
for (const pkg of fs.readdirSync(packagesDir)) {
  const src = path.join(packagesDir, pkg, "coverage-final.json");
  if (!fs.existsSync(src)) continue;
  fs.copyFileSync(src, path.join(tmpDir, `${pkg}.json`));
  collected++;
}

if (collected === 0) {
  console.error("No coverage-final.json files found. Did tests run with --coverageReporters=json?");
  process.exit(1);
}

const result = spawnSync(
  "npx",
  [
    "nyc",
    "report",
    `--temp-dir=${tmpDir}`,
    `--report-dir=${reportDir}`,
    "--reporter=html",
    "--reporter=text-summary",
    "--reporter=lcov",
  ],
  { stdio: "inherit", cwd: repoRoot }
);

if (result.status !== 0) process.exit(result.status ?? 1);

console.log(`\nMerged HTML report: ${path.join(reportDir, "index.html")}`);
console.log(`Merged from ${collected} package(s).`);
