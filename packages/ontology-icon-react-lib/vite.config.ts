import { resolve } from "path";
import { defineConfig, PluginOption } from "vite";
import dts from "vite-plugin-dts";
import packageJSON from './package.json';

const dtsPlugin = dts({ insertTypesEntry: true }) as unknown as PluginOption
export default defineConfig({
  build: {
    minify: false,
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@telicent-oss/ontology-icon-react-lib',
      fileName: 'index'
    },
    rollupOptions: {
      external: packageJSON.externalDependencies,
    },
  },
  plugins: [dtsPlugin],
});
