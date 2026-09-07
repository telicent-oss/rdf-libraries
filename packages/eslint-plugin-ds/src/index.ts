import { name, version } from "../package.json";

import { tailwindLayoutOnly } from "./rules/tailwind-layout-only";

export { isLayoutUtility } from "./rules/tailwind-layout-only";
export type { LayoutOptions } from "./rules/tailwind-layout-only";

export const rules = {
  "tailwind-layout-only": tailwindLayoutOnly,
};

// ESLint names the plugin from meta when it builds cache keys and prints a resolved
// config, so without it both fall back to an anonymous entry.
// Read from the manifest, because release-please bumps that and would leave a literal
// here behind. The build inlines both strings, so the SHIPPED copy can still go stale
// against a bumped package.json: `verify-dist` in CI is what catches that.
export const meta = { name, version };

export default { meta, rules };
