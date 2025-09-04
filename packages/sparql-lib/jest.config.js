/* eslint-disable */
export default {
  testEnvironment: 'node',
  displayName: "@telicent-oss/sparql-lib",
  preset: "../../jest.preset.js",
  coverageDirectory: "../../coverage/packages/sparql-lib",
  automock: false,
  // for tsx
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  // for tsx
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.spec.json",
    },
  },
};
