#!/usr/bin/env
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Function to run the `tefe help` command and get the output
const getTefeHelp = () => {
  return new Promise((resolve, reject) => {
    exec('./dist/bin/tefe.js help', (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        reject(`Stderr: ${stderr}`);
        return;
      }
      resolve(stdout);
    });
  });
};

// Function to format and update README.md
const updateReadme = async () => {
  try {
    const helpOutput = await getTefeHelp();

    const formattedOutput = '```\n' + helpOutput + '\n```';

    // Read README.md
    const readmePath = path.join(__dirname, '../README.md');
    const readmeContentOrig = await fs.readFile(readmePath, 'utf8');
    let readmeContent = readmeContentOrig;

    // Replace content between <!-- help --> and <!-- /help -->
    readmeContent = readmeContent.replace(
      /(<!-- help -->)[\s\S]*?(<!-- \/help -->)/,
      `$1\n${formattedOutput}\n$2`,
    );
    // Do some light formatting
    readmeContent = readmeContent
      .split(os.EOL)
      .map((line) => line.trimEnd())
      .join(os.EOL);
    const NAME_VERSION_NAME_REGEX = /tefe \d+\.\d+\.\d+(-[a-zA-Z0-9]+)?/;
    readmeContent = readmeContent
      .split(os.EOL)
      .filter((line) => !NAME_VERSION_NAME_REGEX.test(line))
      .join(os.EOL);

    if (readmeContentOrig !== readmeContent) {
      console.error(
        'EXITING....README.md needed updating, and was modified. Verify modification and commit.',
      );
      await fs.writeFile(readmePath, readmeContent);
      process.exit(1);
    }
    // Write back to README.md
    console.log('README.md is up to date.');
  } catch (error) {
    console.error('EXITING....README.md failed to update README.md:', error);
    process.exit(1);
  }
};

updateReadme();
