import { resolve } from "path";
import { defineConfig, PluginOption } from "vite";
import dts from "vite-plugin-dts";
import packageJSON from "./package.json";

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
      external: Object.keys(packageJSON.dependencies || {}),
    },
    minify: false
  },
  plugins: [
    // Generate types
    dts({ insertTypesEntry: true }) as PluginOption
  ]
});