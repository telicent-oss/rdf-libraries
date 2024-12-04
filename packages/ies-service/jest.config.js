/* eslint-disable */
export default {
  displayName: "@telicent-oss/ies-service",
  preset: "../../jest.preset.js",
  coverageDirectory: "../../coverage/packages/ies-service",
  automock: false,
  globals: {
    "ts-jest": {
      tsconfig: {
        tsconfig: "./tsconfig.spec.json",
      },
    },
  },
};
