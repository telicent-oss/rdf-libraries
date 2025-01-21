/* eslint-disable */
export default {
  testEnvironment: "jsdom",
  displayName: "@telicent-oss/ontology-icon-react-lib",
  preset: "../../jest.preset.js",
  coverageDirectory: "../../coverage/packages/ontology-icon-react-lib",
  automock: false,
  setupFilesAfterEnv: ["<rootDir>/setupTests.js"],
  // moduleNameMapper
  // for tsx
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  // for tsx
  transform: {
    "tsx?$": [
      "ts-jest",
      {
        tsconfig: "./tsconfig.spec.json",
      },
    ],
  },
};
