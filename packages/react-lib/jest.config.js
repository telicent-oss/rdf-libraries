/* eslint-disable */
export default {
  testEnvironment: 'jsdom',
  displayName: "@telicent-oss/react-lib",
  preset: "../../jest.preset.js",
  coverageDirectory: "../../coverage/packages/react-lib",
  automock: false,
  // for tsx
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  // for tsx
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  globals: {
    "ts-jest": {
      tsconfig: "./tsconfig.spec.json",
    },
  },
};
