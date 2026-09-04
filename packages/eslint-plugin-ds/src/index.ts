import { tailwindLayoutOnly } from "./rules/tailwind-layout-only";

export { isLayoutUtility } from "./rules/tailwind-layout-only";
export type { LayoutOptions } from "./rules/tailwind-layout-only";

export const rules = {
  "tailwind-layout-only": tailwindLayoutOnly,
};

// ESLint names the plugin from meta when it builds cache keys and prints a resolved
// config, so without it both fall back to an anonymous entry.
export const meta = {
  name: "@telicent-oss/eslint-plugin-ds",
  version: "0.0.1",
};

export default { meta, rules };
