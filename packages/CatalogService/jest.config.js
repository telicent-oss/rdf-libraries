/* eslint-disable */
export default {
  displayName: "@telicent-oss/catalogservice",
  preset: "../../jest.preset.js",
  coverageDirectory: "../../coverage/packages/CatalogService",
  automock: false,
  setupFiles: ["./setupTests.ts"],
  moduleNameMapper: {
    '^@telicent-oss/sparql-lib$': '<rootDir>/../sparql-lib/src/index.ts'
  },
  globals: {
    "ts-jest": {
      tsconfig: {
        tsconfig: "./tsconfig.spec.json",
      },
    },
  },
};
