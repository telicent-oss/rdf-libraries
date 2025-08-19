import { resolve } from "path";
import { defineConfig, PluginOption } from "vite";
import dts from "vite-plugin-dts";
import pkg from "./package.json" assert { type: "json" };
import { builtinModules } from "module"; // ← add


const externals = [
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
  ...Object.keys(pkg?.dependencies || {}),
  ...Object.keys(pkg?.peerDependencies || {}),
];

export default defineConfig({
  ssr: {
    target: "node",
    external: externals,
  },
  build: {
    target: "node18",
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "devDependenciesLib",
      formats: ["es", "cjs"],
      fileName: (format) =>
        format === "es" ? "dev-dependencies-lib.es.js" : "dev-dependencies-lib.cjs.js",
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