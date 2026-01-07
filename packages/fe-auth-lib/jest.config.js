/* eslint-disable */
export default {
  testEnvironment: "jsdom",
  displayName: "@telicent-oss/fe-auth-lib",
  preset: "../../jest.preset.js",
  coverageDirectory: "../../coverage/packages/fe-auth-lib",
  coverageReporters: ["html", "text", "lcov"],
  automock: false,
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.spec.json",
    },
  },
};
