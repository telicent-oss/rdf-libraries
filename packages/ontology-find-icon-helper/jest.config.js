/* eslint-disable */
export default {
  displayName: "@telicent-oss/ontology-find-icon-helper",
  preset: "../../jest.preset.js",
  coverageDirectory: "../../coverage/packages/ontology-find-icon-helper",
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
