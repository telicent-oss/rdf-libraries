/* eslint-disable */
export default {
  testEnvironment: "node",
  displayName: "@telicent-oss/git-pull-ignored-lib",
  preset: "../../jest.preset.js",
  coverageDirectory: "../../coverage/packages/git-pull-ignored-lib",
  automock: false,
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  transform: {
    // The tsconfig goes in the transform tuple. Under `globals` ts-jest prints a
    // deprecation warning on every run.
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.spec.json" }],
  },
  // The shared preset emits html only. `text` prints to the terminal. `json-summary`
  // is what a CI step reads.
  coverageReporters: ["text", "html", "json-summary"],
  // Each test drives real git repositories in a temp directory. The default 5s is
  // not enough.
  testTimeout: 30_000,
};
