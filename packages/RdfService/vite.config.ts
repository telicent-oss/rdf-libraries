import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

module.exports = defineConfig({
  build: {
    minify: false,
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      name: '@telicent-oss/rdfservice',
    }
  },
  plugins: [dts({ insertTypesEntry: true })]
});
