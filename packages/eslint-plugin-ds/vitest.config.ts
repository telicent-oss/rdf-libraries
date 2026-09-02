import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      // Walked from disk, so a source file no test imports counts as uncovered rather
      // than going unmentioned. Without it v8 reports only what the tests loaded, and a
      // rule nobody exercised would not appear at all.
      all: true,
      include: ["src/**/*.js"],
      exclude: ["src/**/*.test.js"],
      reporter: ["text", "lcov"],
    },
  },
});
