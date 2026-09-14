import { Rule } from 'eslint';

export declare interface ColourOptions {
    /**
     * Literals and Tailwind classes this project has decided to keep. Each entry should
     * carry a reviewer's reason in the config beside it; the rule does not read reasons.
     */
    allow?: string[];
}

export declare const configs: {
    recommended: typeof recommended;
};

declare const _default: {
    meta: typeof meta;
    rules: typeof rules;
    configs?: unknown;
} & {
    configs: {
        recommended: typeof recommended;
    };
};
export default _default;

/** The default `files` for {@link recommended}, for a config sitting beside `src/`. */
export declare const DEFAULT_FILES: string[];

/** The colour found in a CSS value, or null. Hex first, then functional, then named. */
export declare function findColourLiteral(value: string): string | null;

/**
 * The Tailwind class if it sets a colour, or null.
 *
 * Any variant prefix is dropped first, so `hover:bg-red-500` is read as `bg-red-500`.
 * An arbitrary value in brackets is handed to findColourLiteral, which is what catches
 * `bg-[#fff]`.
 */
export declare function findTailwindColourClass(rawToken: string): string | null;

/**
 * Whether one class is layout, size or spacing.
 *
 * A responsive or state variant (`md:`, `hover:`) and a negative sign both leave the
 * underlying utility unchanged, so they are stripped before the decision. An arbitrary
 * value is decided by its prefix: `min-w-[420px]` by `min-w`. A colon inside the brackets
 * is read as a variant separator, so such a class is reported rather than classified.
 */
export declare function isLayoutUtility(rawClass: string, options?: LayoutOptions): boolean;

export declare interface LayoutOptions {
    allowTextSizes?: boolean;
    extraPrefixes?: string[];
}

export declare const meta: {
    name: string;
    version: string;
};

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
export declare function recommended({ files }?: RecommendedOptions): {
    files: string[];
    plugins: {
        ds: {
            meta: typeof meta;
            rules: typeof rules;
            configs?: unknown;
        };
    };
    rules: {
        "ds/no-colour-literal": string;
        "ds/tailwind-layout-only": string;
        "no-restricted-imports": (string | {
            patterns: {
                group: string[];
                message: string;
            }[];
        })[];
    };
}[];

/**
 * What {@link recommended} takes. The keys are ESLint's own flat-config keys, so what a
 * caller passes reads the same as what it produces, and a key added later needs no new
 * positional argument.
 */
export declare interface RecommendedOptions {
    /** Which files the guardrails apply to. */
    files?: string[];
}

export declare const rules: {
    "no-colour-literal": Rule.RuleModule;
    "tailwind-layout-only": Rule.RuleModule;
};

export { }
