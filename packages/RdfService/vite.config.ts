import { resolve } from "path";
import { defineConfig, PluginOption } from "vite";
import dts from "vite-plugin-dts";

const dtsPlugin = dts({ insertTypesEntry: true }) as unknown as PluginOption
module.exports = defineConfig({
  build: {
    minify: false,
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      name: '@telicent-oss/rdfservice',
    }
  },
  plugins: [dtsPlugin]
});
