import { defineConfig } from "vitest/config";

// This package is plain ESM JavaScript, so the test glob has to include .js. The
// inherited config only looks for .ts and .tsx.
export default defineConfig({
  test: {
    include: ["src/**/*.test.js"],
  },
});
