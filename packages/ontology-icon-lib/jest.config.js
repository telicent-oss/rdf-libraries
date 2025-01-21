/* eslint-disable */
export default {
  displayName: "@telicent-oss/ontology-icon-lib",
  preset: "../../jest.preset.js",
  coverageDirectory: "../../coverage/packages/ontology-icon-lib",
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
