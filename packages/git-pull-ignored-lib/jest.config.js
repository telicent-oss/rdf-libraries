/* eslint-disable */
export default {
  testEnvironment: "node",
  displayName: "@telicent-oss/git-pull-ignored-lib",
  preset: "../../jest.preset.js",
  coverageDirectory: "../../coverage/packages/git-pull-ignored-lib",
  automock: false,
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  transform: {
    // The tsconfig belongs in the transform tuple. Under `globals` it still works but
    // ts-jest prints a deprecation warning on every run.
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.spec.json" }],
  },
  // The shared preset emits html only, so `yarn coverage` printed nothing to the
  // terminal. json-summary is what a CI step reads without parsing the html.
  coverageReporters: ["text", "html", "json-summary"],
  // Each test drives real git repositories in a temp directory, which is slower than
  // the default 5s allows.
  testTimeout: 30_000,
};
