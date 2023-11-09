
const nxPreset = require('@nx/jest/preset').default;
module.exports = { ...nxPreset, preset: "ts-jest", testEnvironment: "node" }
