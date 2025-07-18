import { resolve } from "path";
import { defineConfig, PluginOption } from "vite";
import dts from "vite-plugin-dts";
import path from "path";
import fs from "fs";

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "package.json"), "utf-8")
);

const peerDeps = packageJson.peerDependencies
  ? Object.keys(packageJson.peerDependencies)
  : [];

const dtsPlugin = dts({ insertTypesEntry: true }) as unknown as PluginOption;
export default defineConfig({
  build: {
    minify: false,
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "@telicent-oss/ontology-icon-react-lib",
      fileName: "index",
    },
    rollupOptions: {
      external: peerDeps,
    },
  },
  plugins: [dtsPlugin],
});
