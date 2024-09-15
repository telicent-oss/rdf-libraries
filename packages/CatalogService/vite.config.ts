import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    minify: false,
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      name: '@telicent-oss/catalogservice',
    }
  },
  plugins: [dts({ insertTypesEntry: true })]
});
