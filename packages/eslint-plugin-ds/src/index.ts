import { name, version } from "../package.json";

import { tailwindLayoutOnly } from "./rules/tailwind-layout-only";

export { isLayoutUtility } from "./rules/tailwind-layout-only";
export type { LayoutOptions } from "./rules/tailwind-layout-only";

export const rules = {
  "tailwind-layout-only": tailwindLayoutOnly,
};

// ESLint names the plugin from meta when it builds cache keys and prints a resolved
// config, so without it both fall back to an anonymous entry. Read from the manifest,
// because release-please bumps that and would leave a literal here behind.
export const meta = { name, version };

const plugin = { meta, rules };

/**
 * A flat config a consumer can spread, so the rule is turned on in one line instead of
 * three. The plugin is registered under the same name ESLint prints in a resolved config.
 */
export const configs = {
  recommended: {
    plugins: { "@telicent-oss/ds": plugin },
    rules: { "@telicent-oss/ds/tailwind-layout-only": "error" },
  },
};

export default { ...plugin, configs };
