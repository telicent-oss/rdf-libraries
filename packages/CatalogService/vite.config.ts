import { resolve } from "path";
import { defineConfig, PluginOption } from "vite";
import dts from "vite-plugin-dts";

const dtsPlugin = dts({ insertTypesEntry: true }) as unknown as PluginOption
export default defineConfig({
  build: {
    minify: false,
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      name: '@telicent-oss/catalogservice',
    }
  },
  plugins: [dtsPlugin]
});
