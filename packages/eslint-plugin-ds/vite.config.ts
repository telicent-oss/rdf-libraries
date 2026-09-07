import { builtinModules, createRequire } from "node:module";
import { resolve } from "node:path";

import { defineConfig, PluginOption } from "vite";
import dts from "vite-plugin-dts";

// require rather than an import attribute. `assert { type: "json" }` still works but is
// the deprecated spelling, and `with` does not: vite 4 loads this config through the
// esbuild CatalogService pins (0.18), which predates `with`. require needs neither.
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
      name: "eslintPluginDs",
      // ESM only. A cjs bundle here is unusable: `type: module` plus a `.js` extension
      // makes node parse it as ESM, so `require` of it returns an empty object rather
      // than failing loudly. Every consumer imports this, so the cjs half was a broken
      // entry point nobody wanted.
      formats: ["es"],
      fileName: () => "eslint-plugin-ds.es.js",
    },
    // No sourcemap: the shipped bundle is unminified ESM that reads as the source, and a
    // map without the .ts files beside it points a consumer at paths that are not there.
    sourcemap: false,
    minify: false,
    rollupOptions: { external: externals },
  },
  plugins: [
    dts({
      entryRoot: "src",
      insertTypesEntry: true,
      exclude: ["**/*.test.*"],
      // One flattened index.d.ts. Left to itself the plugin emits
      // `export { isLayoutUtility } from './rules/tailwind-layout-only'` with no file
      // extension, which a moduleResolution node16/nodenext consumer cannot resolve
      // (TS2834). `skipLibCheck: true` hides the error and silently degrades the export
      // to `any`, and the consumer this is written for is on NodeNext.
      rollupTypes: true,
    }) as PluginOption,
  ],
});
