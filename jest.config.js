import { getJestProjects } from "@nx/jest";
import { pathsToModuleNameMapper } from "ts-jest/utils";
import { compilerOptions } from "./tsconfig"; // Adjust the path to your tsconfig

export default {
  projects: getJestProjects(),
  testEnvironment: "node",
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: "<rootDir>",
  }),
};
