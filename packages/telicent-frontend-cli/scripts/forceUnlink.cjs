#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Function to delete the package directory
const deletePackage = (scope, packageName) => {
  const dirPath = path.join(process.env.HOME, '.config/yarn/link', scope, packageName);

  // Check if the directory exists
  if (fs.existsSync(dirPath)) {
    // Remove the directory recursively
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`Deleted: ${dirPath}`);
  } else {
    console.error(`Directory not found: ${dirPath}`);
  }
};

// Read the package.json and process the package name
const processPackageName = () => {
  const packageJson = require('../package.json'); // Adjust the path as necessary
  const [scope, packageName] = packageJson.name.split('/');

  if (scope && packageName) {
    deletePackage(scope, packageName);
  } else {
    console.error('Invalid package name format.');
  }
};

processPackageName();
