import { builtinModules, createRequire } from "node:module";
import { resolve } from "node:path";

import { defineConfig, PluginOption } from "vite";
import dts from "vite-plugin-dts";

// require, not an import attribute. Vite 4 loads this config through esbuild 0.18,
// pinned by CatalogService, which predates `with`. `assert` works but is deprecated.
const pkg = createRequire(import.meta.url)("./package.json");

const externals = [
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
  ...Object.keys(pkg?.dependencies || {}),
  ...Object.keys(pkg?.peerDependencies || {}),
];

export default defineConfig({
  ssr: { target: "node", external: externals },
  build: {
    target: "node20",
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "gitPullIgnoredLib",
      // ESM only. `type: module` makes node parse a `.js` cjs bundle as ESM, so
      // `require` of it returns an empty object instead of failing.
      formats: ["es"],
      fileName: () => "git-pull-ignored-lib.es.js",
    },
    // No sourcemap: the .ts files are not shipped, so a map points at paths that are
    // not there.
    sourcemap: false,
    minify: false,
    rollupOptions: { external: externals },
  },
  plugins: [
    dts({
      entryRoot: "src",
      insertTypesEntry: true,
      exclude: ["**/*.test.*"],
    }) as PluginOption,
  ],
});
