/* eslint-disable */
export default {
  displayName: "@telicent-oss/catalogservice",
  preset: "../../jest.preset.js",
  coverageDirectory: "../../coverage/packages/CatalogService",
  automock: false,
  setupFiles: ["./setupTests.ts"],
  globals: {
    "ts-jest": {
      tsconfig: {
        tsconfig: "./tsconfig.spec.json",
      },
    },
  },
};
