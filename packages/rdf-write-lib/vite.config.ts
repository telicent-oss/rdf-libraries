import { resolve } from "path";
import { defineConfig, PluginOption } from "vite";
import dts from "vite-plugin-dts";
import pkg from "./package.json" assert { type: "json" };

const externals = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {})
];

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "rdfWriteLib",
      formats: ["es", "cjs"],
      fileName: (format) =>
        format === "es" ? "rdf-write-lib.es.js" : "rdf-write-lib.cjs.js",
    },
    sourcemap: true,
    minify: false,
    rollupOptions: { external: externals },
  },
  plugins: [
    dts({
      // ensures dist/types/index.d.ts exists
      entryRoot: "src",
      insertTypesEntry: true,
      exclude: ["**/*.test.*", "**/__tests__/**"],
    }) as PluginOption,
  ],
});