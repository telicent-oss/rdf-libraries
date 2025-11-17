#!/usr/bin/env tsx
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';

interface PackageJson {
  name: string;
  version: string;
}

interface PackageInfo {
  name: string;
  path: string;
  currentVersion: string;
  newVersion: string;
}

function exec(command: string, options = {}): string {
  try {
    return execSync(command, { encoding: 'utf-8', ...options }).trim();
  } catch (error: any) {
    if (options.hasOwnProperty('throwOnError') && !(options as any).throwOnError) {
      return '';
    }
    throw error;
  }
}

function checkUncommittedChanges(): void {
  const status = exec('git status --porcelain');
  if (status) {
    console.error(chalk.red('✗ Uncommitted changes detected. Please commit or stash them first.'));
    console.log(chalk.gray('\nUncommitted files:'));
    console.log(status);
    process.exit(1);
  }
}

function getCurrentBranch(): string {
  return exec('git rev-parse --abbrev-ref HEAD');
}

function getCurrentCommitSHA(): string {
  return exec('git rev-parse --short HEAD');
}

function findPrereleasePackages(): PackageInfo[] {
  const packagesDir = join(process.cwd(), 'packages');
  const packages: PackageInfo[] = [];

  const dirs = readdirSync(packagesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const dir of dirs) {
    const pkgJsonPath = join(packagesDir, dir, 'package.json');
    if (!existsSync(pkgJsonPath)) continue;

    const pkgJson: PackageJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));

    // Check if version contains a dash (prerelease)
    if (pkgJson.version.includes('-')) {
      packages.push({
        name: pkgJson.name,
        path: pkgJsonPath,
        currentVersion: pkgJson.version,
        newVersion: '', // Will be calculated later
      });
    }
  }

  return packages;
}

function incrementPrereleaseVersion(version: string): string {
  // Parse version like "0.0.1-TELFE-1371.30"
  const match = version.match(/^(.+)\.(\d+)$/);
  if (match) {
    const [, base, number] = match;
    return `${base}.${parseInt(number) + 1}`;
  }

  // If no number at end, append .1
  return `${version}.1`;
}

function branchExists(branchName: string): boolean {
  // Check local branches
  const localCheck = exec(`git show-ref --verify --quiet refs/heads/${branchName}`, {
    throwOnError: false
  } as any);
  if (localCheck !== '') return true;

  // Check remote branches
  const remoteCheck = exec(`git ls-remote --heads origin ${branchName}`, {
    throwOnError: false
  } as any);
  return remoteCheck !== '';
}

function createPrereleaseBranchName(currentBranch: string, sha: string): string {
  // Replace slashes with dashes
  const baseName = `prerelease/${currentBranch.replace(/\//g, '-')}`;

  // Check if branch exists
  if (!branchExists(baseName)) {
    return baseName;
  }

  // Append SHA if collision
  return `${baseName}-${sha}`;
}

function displayVersionTable(packages: PackageInfo[]): void {
  console.log(chalk.bold('\n📦 Version Changes:\n'));

  const maxNameLength = Math.max(...packages.map(p => p.name.length), 'Package'.length);
  const maxCurrentLength = Math.max(...packages.map(p => p.currentVersion.length), 'Current'.length);

  // Header
  console.log(
    chalk.cyan('Package'.padEnd(maxNameLength + 2)),
    chalk.cyan('Current'.padEnd(maxCurrentLength + 2)),
    chalk.cyan('New')
  );
  console.log('-'.repeat(maxNameLength + maxCurrentLength + 30));

  // Rows
  for (const pkg of packages) {
    console.log(
      pkg.name.padEnd(maxNameLength + 2),
      chalk.yellow(pkg.currentVersion.padEnd(maxCurrentLength + 2)),
      chalk.green(pkg.newVersion)
    );
  }
  console.log();
}

function printRollbackInstructions(): void {
  console.log(chalk.yellow('\n⚠️  No changes have been made yet.'));
  console.log(chalk.gray('\nTo manually continue:'));
  console.log(chalk.white('  1. Update package.json versions manually'));
  console.log(chalk.white('  2. Create prerelease branch: git checkout -b prerelease/<name>'));
  console.log(chalk.white('  3. Commit changes: git commit -am "chore(prerelease): bump versions"'));
  console.log(chalk.white('  4. Push: git push origin prerelease/<name>'));
  console.log(chalk.white('  5. Trigger GitHub Actions workflow manually\n'));
}

function updatePackageVersions(packages: PackageInfo[]): void {
  for (const pkg of packages) {
    const pkgJson = JSON.parse(readFileSync(pkg.path, 'utf-8'));
    pkgJson.version = pkg.newVersion;
    writeFileSync(pkg.path, JSON.stringify(pkgJson, null, 2) + '\n');
    console.log(chalk.green(`✓ Updated ${pkg.name} to ${pkg.newVersion}`));
  }
}

function printSuccessOutput(branchName: string, packages: PackageInfo[]): void {
  console.log(chalk.green.bold('\n✓ Prerelease created successfully!\n'));
  console.log(chalk.cyan('Branch:'), chalk.white(branchName));
  console.log(chalk.cyan('Packages:'));
  for (const pkg of packages) {
    console.log(chalk.white(`  - ${pkg.name}@${pkg.newVersion}`));
  }

  console.log(chalk.yellow('\n📋 Next steps:'));
  console.log(chalk.white('  The prerelease branch has been pushed to remote.'));
  console.log(chalk.white('  GitHub Actions will automatically publish the packages.'));
  console.log(chalk.white('  Or manually trigger the workflow at:'));
  console.log(chalk.cyan('  https://github.com/Telicent-oss/rdf-libraries/actions/workflows/publish-nx.yml\n'));
}

async function main() {
  console.log(chalk.bold.blue('\n🚀 Create Prerelease\n'));

  // 1. Pre-flight checks
  checkUncommittedChanges();
  const currentBranch = getCurrentBranch();
  const currentSHA = getCurrentCommitSHA();

  console.log(chalk.gray(`Current branch: ${currentBranch}`));
  console.log(chalk.gray(`Current commit: ${currentSHA}\n`));

  // 2. Find prerelease packages
  const allPrereleasePackages = findPrereleasePackages();

  if (allPrereleasePackages.length === 0) {
    console.log(chalk.yellow('⚠️  No packages with prerelease versions found.'));
    console.log(chalk.gray('Prerelease versions contain a dash (e.g., 1.0.0-alpha.1)\n'));
    process.exit(0);
  }

  // 3. Interactive package selection
  const { selectedPackages } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedPackages',
      message: 'Select packages to include in prerelease:',
      choices: allPrereleasePackages.map(pkg => ({
        name: `${pkg.name} (${pkg.currentVersion})`,
        value: pkg.name,
        checked: true,
      })),
    },
  ]);

  if (selectedPackages.length === 0) {
    console.log(chalk.yellow('\n⚠️  No packages selected. Exiting.\n'));
    process.exit(0);
  }

  // 4. Calculate new versions
  const packagesToUpdate = allPrereleasePackages
    .filter(pkg => selectedPackages.includes(pkg.name))
    .map(pkg => ({
      ...pkg,
      newVersion: incrementPrereleaseVersion(pkg.currentVersion),
    }));

  // 5. Display version changes and ask for confirmation
  displayVersionTable(packagesToUpdate);

  const { confirmVersions } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmVersions',
      message: 'Proceed with these version bumps?',
      default: true,
    },
  ]);

  if (!confirmVersions) {
    console.log(chalk.red('\n✗ Cancelled by user.'));
    printRollbackInstructions();
    process.exit(0);
  }

  // 6. Update package.json files
  console.log(chalk.blue('\n📝 Updating package.json files...'));
  updatePackageVersions(packagesToUpdate);

  // 7. Create prerelease branch
  const branchName = createPrereleaseBranchName(currentBranch, currentSHA);
  console.log(chalk.blue(`\n🌿 Creating branch: ${branchName}`));
  exec(`git checkout -b ${branchName}`);

  // 8. Commit changes
  console.log(chalk.blue('\n💾 Committing version changes...'));
  exec('git add packages/*/package.json');
  const commitMessage = `chore(prerelease): bump to ${packagesToUpdate.map(p => p.newVersion).join(', ')}`;
  exec(`git commit -m "${commitMessage}"`);

  // 9. Push to remote
  console.log(chalk.blue(`\n⬆️  Pushing to origin/${branchName}...`));
  exec(`git push origin ${branchName} --no-verify`);

  // 10. Return to original branch
  console.log(chalk.blue(`\n↩️  Returning to ${currentBranch}...`));
  exec(`git checkout ${currentBranch}`);

  // 11. Print success output
  printSuccessOutput(branchName, packagesToUpdate);
}

main().catch((error) => {
  console.error(chalk.red('\n✗ Error:'), error.message);
  process.exit(1);
});
