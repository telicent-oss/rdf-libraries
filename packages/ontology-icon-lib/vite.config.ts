import { resolve } from "path";
import { defineConfig, PluginOption } from "vite";
import dts from "vite-plugin-dts";
import packageJSON from "./package.json";

export default defineConfig({
  build: {
    // Produce multiple build formats
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "ontologyIconLib", // name used for UMD/IIFE scripts
      formats: ["es", "cjs", "umd"], // or ["es", "cjs", "umd"] for UMD
      fileName: (format) => {
        if (format === "es") return "ontology-icon-lib.es.js";
        if (format === "cjs") return "ontology-icon-lib.cjs.js"; 
        return "ontology-icon-lib.umd.js";
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
    dts({ insertTypesEntry: true }) as PluginOption
  ]
});