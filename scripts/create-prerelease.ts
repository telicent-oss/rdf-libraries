#!/usr/bin/env tsx
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';

interface PackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface PackageInfo {
  name: string;
  path: string;
  currentVersion: string;
  newVersion: string;
  isPrerelease: boolean;
  hasPrereleaseDeps: boolean;
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

function extractJiraTicket(branchName: string): string {
  // Match pattern like TELFE-1371, CORE-123, etc.
  const match = branchName.match(/([A-Z]+-\d+)/);
  if (!match) {
    console.error(chalk.red('✗ No JIRA ticket found in branch name.'));
    console.log(chalk.gray(`Branch: ${branchName}`));
    console.log(chalk.gray('Expected format: TICKET-123/feature-name or feature/TICKET-123\n'));
    process.exit(1);
  }
  return match[1];
}

function findAllPackages(): Map<string, PackageInfo> {
  const packagesDir = join(process.cwd(), 'packages');
  const packages = new Map<string, PackageInfo>();

  const dirs = readdirSync(packagesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const dir of dirs) {
    const pkgJsonPath = join(packagesDir, dir, 'package.json');
    if (!existsSync(pkgJsonPath)) continue;

    const pkgJson: PackageJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
    const isPrerelease = pkgJson.version.includes('-');

    packages.set(pkgJson.name, {
      name: pkgJson.name,
      path: pkgJsonPath,
      currentVersion: pkgJson.version,
      newVersion: '',
      isPrerelease,
      hasPrereleaseDeps: false, // Will be calculated
    });
  }

  return packages;
}

function detectPrereleaseDependencies(packages: Map<string, PackageInfo>): void {
  const packagesDir = join(process.cwd(), 'packages');
  const dirs = readdirSync(packagesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const dir of dirs) {
    const pkgJsonPath = join(packagesDir, dir, 'package.json');
    if (!existsSync(pkgJsonPath)) continue;

    const pkgJson: PackageJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
    const pkgInfo = packages.get(pkgJson.name);
    if (!pkgInfo) continue;

    // Check all dependencies
    const allDeps = {
      ...pkgJson.dependencies,
      ...pkgJson.devDependencies,
    };

    // Look for sibling packages with prerelease versions
    for (const depName of Object.keys(allDeps)) {
      if (depName.startsWith('@telicent-oss/')) {
        const depInfo = packages.get(depName);
        if (depInfo && depInfo.isPrerelease) {
          pkgInfo.hasPrereleaseDeps = true;
          break;
        }
      }
    }
  }
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

function createPrereleaseVersion(version: string, ticket: string): string {
  // Convert stable version like "1.0.0" to "1.0.0-TICKET.0"
  return `${version}-${ticket}.0`;
}

function calculateNewVersion(pkg: PackageInfo, ticket: string): string {
  if (pkg.isPrerelease) {
    // Already prerelease - increment build number
    return incrementPrereleaseVersion(pkg.currentVersion);
  } else {
    // Stable version - add ticket prerelease tag
    return createPrereleaseVersion(pkg.currentVersion, ticket);
  }
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
    const badge = pkg.isPrerelease ? chalk.gray('[prerelease]') : chalk.blue('[stable→prerelease]');
    console.log(
      pkg.name.padEnd(maxNameLength + 2),
      chalk.yellow(pkg.currentVersion.padEnd(maxCurrentLength + 2)),
      chalk.green(pkg.newVersion),
      badge
    );
  }
  console.log();
}

function printRollbackInstructions(): void {
  console.log(chalk.yellow('\n⚠️  No changes have been made yet.'));
  console.log(chalk.gray('\nTo manually continue:'));
  console.log(chalk.white('  1. Update package.json versions manually'));
  console.log(chalk.white('  2. Commit changes: git commit -am "chore(prerelease): bump versions"'));
  console.log(chalk.white('  3. Create prerelease branch: git checkout -b prerelease/<name>'));
  console.log(chalk.white('  4. Push prerelease branch: git push origin prerelease/<name>'));
  console.log(chalk.white('  5. Return to feature branch: git checkout -'));
  console.log(chalk.white('  6. Trigger GitHub Actions workflow manually\n'));
}

function updatePackageVersions(packages: PackageInfo[]): void {
  for (const pkg of packages) {
    const pkgJson = JSON.parse(readFileSync(pkg.path, 'utf-8'));
    pkgJson.version = pkg.newVersion;
    writeFileSync(pkg.path, JSON.stringify(pkgJson, null, 2) + '\n');
    console.log(chalk.green(`✓ Updated ${pkg.name} to ${pkg.newVersion}`));
  }
}

function printSuccessOutput(branchName: string, packages: PackageInfo[], featureBranch: string): void {
  console.log(chalk.green.bold('\n✓ Prerelease created successfully!\n'));

  console.log(chalk.cyan('Feature branch:'), chalk.white(featureBranch), chalk.gray('(committed, not pushed)'));
  console.log(chalk.cyan('Prerelease branch:'), chalk.white(branchName), chalk.gray('(pushed to remote)'));

  console.log(chalk.cyan('\nPackages:'));
  for (const pkg of packages) {
    console.log(chalk.white(`  - ${pkg.name}@${pkg.newVersion}`));
  }

  console.log(chalk.yellow('\n📋 Next steps:'));
  console.log(chalk.white('  1. The prerelease branch has been pushed to remote.'));
  console.log(chalk.white('  2. GitHub Actions will automatically publish the packages.'));
  console.log(chalk.white('  3. Your feature branch has the version bumps committed (not pushed).'));
  console.log(chalk.white('  4. Push your feature branch when ready: ') + chalk.cyan(`git push origin ${featureBranch}`));
  console.log(chalk.white('\n  Or manually trigger the workflow at:'));
  console.log(chalk.cyan('  https://github.com/Telicent-oss/rdf-libraries/actions/workflows/publish-nx.yml\n'));
}

async function main() {
  console.log(chalk.bold.blue('\n🚀 Create Prerelease\n'));

  // 1. Pre-flight checks
  checkUncommittedChanges();
  const currentBranch = getCurrentBranch();
  const currentSHA = getCurrentCommitSHA();
  const jiraTicket = extractJiraTicket(currentBranch);

  console.log(chalk.gray(`Current branch: ${currentBranch}`));
  console.log(chalk.gray(`JIRA ticket: ${jiraTicket}`));
  console.log(chalk.gray(`Current commit: ${currentSHA}\n`));

  // 2. Find ALL packages and detect dependencies
  const allPackages = findAllPackages();
  detectPrereleaseDependencies(allPackages);

  const packageList = Array.from(allPackages.values());

  if (packageList.length === 0) {
    console.log(chalk.yellow('⚠️  No packages found in monorepo.\n'));
    process.exit(0);
  }

  // 3. Interactive package selection with smart preselection
  const { selectedPackages } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedPackages',
      message: 'Select packages to include in prerelease:',
      choices: packageList.map(pkg => {
        let label = `${pkg.name} (${pkg.currentVersion})`;
        if (pkg.isPrerelease) {
          label += chalk.gray(' [prerelease]');
        } else if (pkg.hasPrereleaseDeps) {
          label += chalk.yellow(' [has prerelease deps]');
        }

        return {
          name: label,
          value: pkg.name,
          checked: pkg.isPrerelease || pkg.hasPrereleaseDeps,
        };
      }),
    },
  ]);

  if (selectedPackages.length === 0) {
    console.log(chalk.yellow('\n⚠️  No packages selected. Exiting.\n'));
    process.exit(0);
  }

  // 4. Calculate new versions
  const packagesToUpdate = packageList
    .filter(pkg => selectedPackages.includes(pkg.name))
    .map(pkg => ({
      ...pkg,
      newVersion: calculateNewVersion(pkg, jiraTicket),
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

  // 7. Commit to feature branch (current branch)
  console.log(chalk.blue('\n💾 Committing version changes to feature branch...'));
  exec('git add packages/*/package.json');
  const commitMessage = `chore(prerelease): bump to ${packagesToUpdate.map(p => p.newVersion).join(', ')}`;
  exec(`git commit -m "${commitMessage}"`);
  console.log(chalk.green(`✓ Committed to ${currentBranch}`));

  // 8. Create prerelease branch from HEAD
  const branchName = createPrereleaseBranchName(currentBranch, currentSHA);
  console.log(chalk.blue(`\n🌿 Creating prerelease branch: ${branchName}`));
  exec(`git checkout -b ${branchName}`);

  // 9. Push prerelease branch to remote
  console.log(chalk.blue(`\n⬆️  Pushing to origin/${branchName}...`));
  exec(`git push origin ${branchName} --no-verify`);

  // 10. Return to feature branch
  console.log(chalk.blue(`\n↩️  Returning to ${currentBranch}...`));
  exec(`git checkout ${currentBranch}`);

  // 11. Print success output
  printSuccessOutput(branchName, packagesToUpdate, currentBranch);
}

main().catch((error) => {
  console.error(chalk.red('\n✗ Error:'), error.message);
  process.exit(1);
});
