import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Each test drives real git repositories in a temp directory, which is slower than
    // the default 5s allows.
    testTimeout: 30_000,
    coverage: {
      provider: "v8",
      // Walked from disk, so a source file no test imports counts as uncovered rather
      // than going unmentioned.
      all: true,
      include: ["src/**/*.js"],
      exclude: ["src/**/*.test.js"],
      reporter: ["text", "lcov"],
    },
  },
});
