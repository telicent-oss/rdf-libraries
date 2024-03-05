import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

module.exports = defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      name: '@telicent-oss/ontologyservice',
    }
  },
  plugins: [dts({ insertTypesEntry: true })]
});
