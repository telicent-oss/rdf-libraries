#!/usr/bin/env node

// Import Commander and other necessary modules
import { program } from 'commander';
import { config } from '../config/config.js';

import info from '../info/info.js';
import '../autoupdate.js';
import { readJsonAtInternal } from '../utils/readJsonAtInternal.js';
import { runScript } from '../utils/runScript.js';
import { PACKAGE_JSON } from '../constants.js';
import npmrcAuthToken from '../npmrcAuthToken/index.js';
import { hookPrecommit } from '../hookPrecommit/hookPrecommit.js';
import { hookPostinstall } from '../hookPostinstall/hookPostinstall.js';
import { updateDeps } from '../updateDeps/index.js';
import { exampleTargetConfig } from '../updateDeps/exampleTargetConfig.js';

program
  .command('version')
  .description('read version')
  .action(() => console.log(readJsonAtInternal(PACKAGE_JSON).version));

program.command('info').description('Get context to help CLI developers').action(info);

program
  .command('hook-precommit')
  .description('Telicent frontend precommit hook')
  .action(hookPrecommit);

program
  .command('hook-postinstall')
  .description('Telicent frontend postinstall hook')
  .action(hookPostinstall);

program
  .command('config')
  .description('Show current directoryʼs ./tefe.config.json')
  .option('--init', 'Try create ./tefe.config.json')
  .action(config);

program
  .command('npmrc-authtoken')
  .description(
    'Fetch NPM configuration tokens from the nearest npmrc file (WARNING: Has limitations see extractTokens.ts TODO)',
  )
  .argument(
    '[value]',
    'The token key to fetch. Requires env/script var UNMASK=true to output actual value',
  )
  .action(npmrcAuthToken);

// TODO split updateDeps from postUpdateDeps
program
  .command('update-deps')
  .description(
    `Take name & version in source/package.json - and update in dependencies found in targetConfig.json`,
  )
  .addHelpText(
    'after',
    `\n\nExample of targetConfig.json:\n\n${JSON.stringify(exampleTargetConfig, null, 2)}`,
  )
  .requiredOption('-s, --source <package.json>', 'location of source package.json')
  .requiredOption('-t, --target <updateDepsConfig.json>', 'location of config file')
  .option('--skip-postUpdateDependency', `Ignore "postUpdateDependency" commands in targetConfig.json (useful for sequencing commands in mono-repos)`)
  .option('--skip-updateDependency', `Ignore "updateDependency" (useful for sequencing commands in mono-repos)`)
  .action(updateDeps);

program
  .command('docker-build')
  .description("Locally builds/scans FE App's Dockerfile")
  .summary('docker build')
  .action(runScript('../../scripts/docker/build'));

program
  .command('docker-run')
  .description("Locally runs FE app's local container")
  .summary('docker run')
  .action(runScript('../../scripts/docker/run'));

program
  .command('docker-open')
  .description('Locally opens FE app in local container')
  .summary('open app in docker')
  .action(runScript('../../scripts/docker/open'));

program
  .command('prerelease')
  .description(
    'If branch includes JIRA ticket number - Then derive and push a prerelease branch for easy manual call of publish.yml ',
  )
  .summary('push prerelease branch')
  .action(runScript('../../scripts/prerelease/run'));

// Parse and execute the commands
try {
  program.parse(process.argv);
} catch (error) {
  console.error(`Parse error ${error}`);
}

process.on('uncaughtException', (error) => {
  console.error(`uncaughtException ${error}`);
  process.exit(1);
});
