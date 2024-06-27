const { getJestProjects } = require("@nx/jest");
const { pathsToModuleNameMapper } = require("ts-jest/utils");
const { compilerOptions } = require("./tsconfig"); // Adjust the path to your tsconfig

module.exports = {
  projects: getJestProjects(),
  testEnvironment: "node",
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: "<rootDir>",
  }),
};
