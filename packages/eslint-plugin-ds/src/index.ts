import { name, version } from "../package.json";

import { noColourLiteral } from "./rules/no-colour-literal";
import { tailwindLayoutOnly } from "./rules/tailwind-layout-only";

export { isLayoutUtility } from "./rules/tailwind-layout-only";
export type { LayoutOptions } from "./rules/tailwind-layout-only";
export { findColourLiteral, findTailwindColourClass } from "./rules/no-colour-literal";
export type { ColourOptions } from "./rules/no-colour-literal";

export const rules = {
  "no-colour-literal": noColourLiteral,
  "tailwind-layout-only": tailwindLayoutOnly,
};

// ESLint names the plugin from meta when it builds cache keys and prints a resolved
// config. Without it, both fall back to an anonymous entry. The name and version come
// from the manifest, because release-please bumps that and would leave a literal behind.
export const meta = { name, version };

// The object registered as `ds` below must BE the package's default export. ESLint
// compares plugin identity. A consumer that spreads `recommended` and also writes
// `plugins: { ds }` otherwise gets "Cannot redefine plugin", and ESLint refuses to
// start. Object.assign keeps the two the same object.
const plugin: { meta: typeof meta; rules: typeof rules; configs?: unknown } = {
  meta,
  rules,
};

export const DEFAULT_FILES = ["src/**/*.{ts,tsx}"];

/** The keys are ESLint's own flat-config keys, so a key added later needs no new argument. */
export interface RecommendedOptions {
  files?: string[];
}

/**
 * All three guardrails in one flat-config block.
 *
 * `files` is a parameter because a flat-config pattern resolves against the directory
 * holding the config file. A baked-in `src/**` matches nothing from a config one level
 * up. A block that matches nothing lints green with every guardrail switched off.
 *
 * The `@mui/*` ban is not a rule of this plugin. It ships here anyway, so that a project
 * cannot adopt the other two and miss it.
 */
export function recommended({ files = DEFAULT_FILES }: RecommendedOptions = {}) {
  return [
    {
      files,
      plugins: { ds: plugin },
      rules: {
        "ds/no-colour-literal": "error",
        "ds/tailwind-layout-only": "warn",
        "no-restricted-imports": [
          "warn",
          {
            patterns: [
              {
                group: ["@mui/*", "@mui/*/*"],
                message:
                  "Use @telicent-oss/ds instead (icons: @telicent-oss/mui-icons-material). Look the component up in the design system's manifest rather than guessing a name.",
              },
            ],
          },
        ],
      },
    },
  ];
}

export const configs = {
  recommended,
};

export default Object.assign(plugin, { configs });
