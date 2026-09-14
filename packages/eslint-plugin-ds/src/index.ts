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
// config, so without it both fall back to an anonymous entry.
// Read from the manifest, because release-please bumps that and would leave a literal
// here behind.
export const meta = { name, version };

// The object registered as `ds` below must BE the package's default export. ESLint
// compares plugin identity, so a consumer that spreads `recommended` and also writes
// `plugins: { ds }` gets "Cannot redefine plugin" and refuses to start - no lint run at
// all, rather than a lint error. Object.assign returns the same object it mutates,
// which is what keeps the two the same.
const plugin: { meta: typeof meta; rules: typeof rules; configs?: unknown } = {
  meta,
  rules,
};

/** The default `files` for {@link recommended}, for a config sitting beside `src/`. */
export const DEFAULT_FILES = ["src/**/*.{ts,tsx}"];

/**
 * What {@link recommended} takes. The keys are ESLint's own flat-config keys, so what a
 * caller passes reads the same as what it produces, and a key added later needs no new
 * positional argument.
 */
export interface RecommendedOptions {
  /** Which files the guardrails apply to. */
  files?: string[];
}

/**
 * All three guardrails in one flat-config block.
 *
 * Takes `files` because a flat-config pattern resolves against the directory holding
 * the config file, not the project root. A baked-in `src/**` matches nothing from a
 * config one level up, and a block that matches nothing lints green with every
 * guardrail switched off - the one failure mode nobody notices.
 *
 * The third guardrail is not a rule of this plugin. Banning `@mui/*` needs no custom
 * logic - `no-restricted-imports` already does it - but it belongs with the other two,
 * because a project that adopts one and not the others has a gap it did not choose.
 *
 * Severities differ on purpose. A colour literal has a design-system answer every time,
 * so it fails the build. The other two are judgement calls: whether a Tailwind class has
 * a design-system equivalent, and whether the design system covers the MUI component
 * being reached for. Neither can fail a build without blocking work that has no fix yet.
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
