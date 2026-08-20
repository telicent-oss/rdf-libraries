import { defineConfig } from "vitest/config";

// Plain ESM JavaScript, so the glob has to include .js. Each test drives real git
// repositories in a temp directory, which is slower than the default 5s allows.
export default defineConfig({
  test: {
    include: ["src/**/*.test.js"],
    testTimeout: 30_000,
  },
});
