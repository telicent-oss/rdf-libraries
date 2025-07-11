#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// --- Argument Parsing ---
const rawArgs = process.argv.slice(2)
const scopeArgs = rawArgs.filter(arg => arg.startsWith('--scope='))
const repos = rawArgs.filter(arg => !arg.startsWith('--scope='))

if (repos.length === 0) {
  console.error('Usage: node update-deps.mjs --scope=<pkg1> [--scope=<pkg2> …] <repo-path> [<repo-path> …]')
  process.exit(1)
}

// Collect scope names from "--scope=..." flags
const scopes = scopeArgs.map(arg => arg.slice('--scope='.length))
if (scopes.length === 0) {
  console.error('Error: At least one --scope=<package-name> must be provided')
  process.exit(1)
}

// --- Resolve Versions for Each Scoped Package ---
const cwd = process.cwd()
const scopeVersionMap = {}

for (const pkgName of scopes) {
  // Attempt to read node_modules/<pkgName>/package.json to find version
  const nodePkgPath = resolve(cwd, 'node_modules', pkgName, 'package.json')
  if (!existsSync(nodePkgPath)) {
    console.error(`Error: Cannot find "${pkgName}" in node_modules. Ensure it's installed locally.`)
    process.exit(1)
  }
  const { version } = JSON.parse(readFileSync(nodePkgPath, 'utf-8'))
  scopeVersionMap[pkgName] = version
}

// Fields to update in each target repo's package.json
const fieldsToCheck = ['dependencies', 'devDependencies', 'resolutions']

// --- Iterate Over Each Repo Path and Patch Dependencies ---
for (const repo of repos) {
  const pkgPath = resolve(repo, 'package.json')
  if (!existsSync(pkgPath)) {
    console.warn(`Skipping ${repo}: package.json not found`)
    continue
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  let didUpdate = false

  for (const field of fieldsToCheck) {
    const depSection = pkg[field]
    if (!depSection) continue

    for (const [pkgName, version] of Object.entries(scopeVersionMap)) {
      if (Object.prototype.hasOwnProperty.call(depSection, pkgName)) {
        depSection[pkgName] = version
        didUpdate = true
        console.log(`✔ ${repo}: set ${pkgName}@${version} in "${field}"`)
      }
    }
  }

  if (didUpdate) {
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  } else {
    console.log(`ℹ️  No matching dependencies in ${repo}`)
  }
}
