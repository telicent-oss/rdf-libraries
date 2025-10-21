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

// 3. Validate all paths upfront - fail fast if any are invalid
console.log(`\n🔍 Validating ${repos.length} target repo(s)...`)
const invalidPaths = []
for (const { path: repo } of repos) {
  const pkgPath = resolve(repo, 'package.json')
  const absolutePath = resolve(cwd, repo)
  if (!existsSync(pkgPath)) {
    invalidPaths.push({ repo, pkgPath, absolutePath })
  } else {
    console.log(`  ✓ ${repo}`)
  }
}

if (invalidPaths.length > 0) {
  console.error('\n❌ ERROR: Invalid repo path(s) found in updateDeps.gitignored.json:\n')
  for (const { repo, pkgPath, absolutePath } of invalidPaths) {
    console.error(`  Path: ${repo}`)
    console.error(`  Absolute: ${absolutePath}`)
    console.error(`  Looking for: ${pkgPath}`)
    console.error(`  Status: NOT FOUND\n`)
  }
  console.error('📝 Next steps:')
  console.error('  1. Verify the target repositories exist')
  console.error('  2. Update updateDeps.gitignored.json with correct relative paths')
  console.error(`  3. Paths should be relative to: ${cwd}\n`)
  process.exit(1)
}

console.log(`\n✅ All paths validated. Updating dependencies...\n`)

// 4. For each repo, update matching deps to the new version
for (const { path: repo, postUpdateDependency } of repos) {
  const pkgPath = resolve(repo, 'package.json')

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
