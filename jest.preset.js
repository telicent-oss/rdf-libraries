
const nxPreset = require('@nx/jest/preset').default;
module.exports = {
  ...nxPreset, preset: "ts-jest", testEnvironment: "node",
  exclude: [
    "/node_modules/",
    ".*\\/dist\\/.*"
    // Add any other directories you want Jest to ignore
  ],
  moduleResolution: "node",
  isolatedModules: true
}
