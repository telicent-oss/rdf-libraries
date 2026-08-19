// update-deps.ts
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import c from 'chalk';
import { execSync } from 'child_process';
import { CTA, ERROR, SKIPPED, WARNING } from '../constants.js';
import { exampleTargetConfig } from './exampleTargetConfig.js';

type RepoConfig = { path: string; postUpdateDependency?: string };

export type UpdateDepsOptions = {
  source: string;
  target: string;
  skipPostUpdateDependency?: boolean;
  skipUpdateDependency?: boolean;
};

const exampleTargetConfigStr = JSON.stringify(exampleTargetConfig, null, 2);
const exampleTargetConfigBrightStr = c.cyanBright(exampleTargetConfigStr);
const EXAMPLE = `
Example:
${exampleTargetConfigBrightStr}`;

const getInstructions = (target: string) => `
${CTA} - fill out ${c.cyanBright(target)}
${EXAMPLE}`;

export const updateDeps = (options: UpdateDepsOptions): void => {
  const cwd = process.cwd();
  const pkgJsonPath = resolve(cwd, options.source);
  if (!existsSync(pkgJsonPath)) {
    console.error(`${ERROR}: source not found (${options.source})`);
    process.exit(1);
  }
  const { name: pkgName, version: pkgVersion } = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));

  const cfgPath = resolve(cwd, options.target);
  if (!existsSync(cfgPath)) {
    writeFileSync(cfgPath, '{}\n');
    console.log(`Created file: ${options.target}`);
    console.log(getInstructions(options.target));
    process.exit(1);
  }
  const cfg = JSON.parse(readFileSync(cfgPath, 'utf-8'));
  const repos: RepoConfig[] = Object.entries(cfg).map(([path, c]: any) => ({
    path,
    postUpdateDependency: c.postUpdateDependency,
  }));

  if (repos.length === 0) {
    console.error(`${ERROR}: no repos in config`);
    console.log(getInstructions(options.target));
    process.exit(1);
  }

  for (const { path: repo, postUpdateDependency } of repos) {
    const repoPkg = resolve(repo, 'package.json');
    if (!existsSync(repoPkg)) {
      console.warn(`${WARNING} NO ACTION TAKEN —  ${repo}: package.json not found`);
    }
    const json = JSON.parse(readFileSync(repoPkg, 'utf-8'));
    if (options.skipUpdateDependency) {
      console.log(`${SKIPPED} updateDependency (--skip-updateDependency)`);
    } else {
      for (const field of ['dependencies', 'devDependencies', 'resolutions'] as const) {
        if (json[field]?.[pkgName]) {
          json[field][pkgName] = pkgVersion;
        }
      }
    }
    writeFileSync(repoPkg, JSON.stringify(json, null, 2) + '\n');
    console.log(`✔ Updated ${pkgName}@${pkgVersion} in ${repo}`);
    if (options.skipPostUpdateDependency) {
      console.log(`${SKIPPED} postUpdateDependency (--skip-postUpdateDependency)`);
    } else if (postUpdateDependency) {
      try {
        execSync(postUpdateDependency, { cwd: repo, stdio: 'inherit' });
      } catch (err) {
        console.error(`Error in ${repo} postUpdate:`, err);
      }
    }
  }
};
