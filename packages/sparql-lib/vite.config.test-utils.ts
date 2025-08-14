import { resolve } from "path";
import { defineConfig, PluginOption } from "vite";
import dts from "vite-plugin-dts";
import pkg from "./package.json" assert { type: "json" };
import { builtinModules } from "module";

const nodeBuiltins = [
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
];

const externals = [
  ...Object.keys(pkg?.dependencies || {}),
  ...Object.keys(pkg?.peerDependencies || {}),
  ...Object.keys(pkg?.devDependencies || {}),
  ...nodeBuiltins,
  "testcontainers",
];

export default defineConfig({
  build: {
    outDir: "dist/test-utils",
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/testUtils/index.ts"),
      name: "sparqlLibTestUtils",
      formats: ["es", "cjs"],
      fileName: (format) =>
        format === "es"
          ? "sparql-lib-test-utils.es.js"
          : "sparql-lib-test-utils.cjs.js",
    },
    // Compile for Node; avoid browser polyfills
    target: "node18",
    sourcemap: true,
    minify: false,
    rollupOptions: {
      // Keep ALL Node things and deps out of the bundle
      external: (id) => {
        if (externals.includes(id)) return true;
        if (id.startsWith("testcontainers")) return true;
        if (nodeBuiltins.some((m) => id === m || id.startsWith(`${m}/`))) return true;
        // treat bare imports as external; only bundle relative/absolute paths
        return !id.startsWith(".") && !id.startsWith("/") && !id.startsWith("\0");
      },
    },
  },
  plugins: [
    dts({
      entryRoot: "src/testUtils",
      outDir: "dist/test-utils/types",
      insertTypesEntry: true,
      exclude: ["**/*.test.*", "**/__tests__/**"],
    }) as PluginOption,
  ],
});