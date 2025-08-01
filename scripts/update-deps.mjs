#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { execSync } from 'child_process'

// 1. Read local package.json
const cwd = process.cwd()
const { name: pkgName, version: pkgVersion } = JSON.parse(
  readFileSync(resolve(cwd, 'package.json'), 'utf-8')
)

// 2. Collect target repo configs from CLI args
const args = process.argv.slice(2)
let repos

if (args[0] === '--file') {
  const fileArg = args[1]
  if (!fileArg) {
    console.error('Error: --file requires a path')
    process.exit(1)
  }
  const filePath = resolve(cwd, fileArg)
  if (!existsSync(filePath)) {
    writeFileSync(filePath, '{}\n')
    console.log(`Created file: ${fileArg}`)
  }
  const fileData = JSON.parse(readFileSync(filePath, 'utf-8'))
  repos = Object.entries(fileData).map(([path, cfg]) => ({
    path,
    postUpdateDependency: cfg.postUpdateDependency,
  }))
} else {
  repos = args.map(path => ({ path, postUpdateDependency: undefined }))
}

if (repos.length === 0) {
  console.error('Usage: node update-deps.js [--file <path>] <repo-path>…')
  process.exit(1)
}

// 3. For each repo, update matching deps to the new version
for (const { path: repo, postUpdateDependency } of repos) {
  const pkgPath = resolve(repo, 'package.json')
  if (!existsSync(pkgPath)) {
    console.warn(`Skipping ${repo}: package.json not found`)
    continue
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  for (const field of ['dependencies', 'devDependencies', 'resolutions']) {
    if (pkg[field]?.[pkgName]) {
      pkg[field][pkgName] = pkgVersion
    }
  }

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  console.log(`✔ Updated ${pkgName}@${pkgVersion} in ${repo}`)

  if (postUpdateDependency) {
    try {
      execSync(postUpdateDependency, { cwd: repo, stdio: 'inherit' })
    } catch (err) {
      console.error(`Error running postUpdateDependency in ${repo}:`, err)
    }
  }
}
