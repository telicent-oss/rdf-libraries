import { builtinModules } from "node:module";
import { resolve } from "node:path";

import { defineConfig, PluginOption } from "vite";
import dts from "vite-plugin-dts";

import pkg from "./package.json" assert { type: "json" };

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
      // ESM only. A cjs bundle here is unusable: `type: module` plus a `.js` extension
      // makes node parse it as ESM, so `require` of it returns an empty object rather
      // than failing loudly. Every consumer imports this, so the cjs half was a broken
      // entry point nobody wanted.
      formats: ["es"],
      fileName: () => "git-pull-ignored-lib.es.js",
    },
    sourcemap: true,
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
