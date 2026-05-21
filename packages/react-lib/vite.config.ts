import { resolve } from "path";
import { defineConfig, PluginOption } from "vite";
import dts from "vite-plugin-dts";
import packageJSON from "./package.json";

// Anything declared as a (peer)dependency must stay external so the published
// dist `import`s/`require`s it instead of inlining a private copy. This is
// critical for `react`/`react-dom`: bundling them would force a nested React
// onto consumers and break apps on a different React major.
const pkg = packageJSON as {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};
const externalPackages = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];
// Match the bare package id and any subpath (e.g. `react/jsx-runtime`).
const isExternal = (id: string) =>
  externalPackages.some((pkg) => id === pkg || id.startsWith(`${pkg}/`));

export default defineConfig({
  build: {
    // Produce multiple build formats
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "reactLib", // name used for UMD/IIFE scripts
      formats: ["es", "cjs"], // or ["es", "cjs", "umd"] if you truly want UMD
      fileName: (format) => {
        // Control the actual file names
        if (format === "es") return "react-lib.es.js";
        if (format === "cjs") return "react-lib.cjs.js"; 
        return "react-lib.umd.js"; // uncomment if needed
      }
    },
    sourcemap: true,
    rollupOptions: {
      // Mark peer deps / externals here to keep them out of the bundle
      external: isExternal,
    },
    minify: false
  },
  plugins: [
    // Generate types
    dts({ insertTypesEntry: true }) as PluginOption
  ]
});