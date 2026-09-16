import { Rule } from 'eslint';

export declare interface ColourOptions {
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

export declare const DEFAULT_FILES: string[];

export declare function findColourLiteral(value: string): string | null;

/** Any variant prefix is dropped first, so `hover:bg-red-500` is read as `bg-red-500`. */
export declare function findTailwindColourClass(rawToken: string): string | null;

/** Whether one Tailwind class is layout, size or spacing. */
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
 * `files` is a parameter because a flat-config pattern resolves against the directory
 * holding the config file. A baked-in `src/**` matches nothing from a config one level
 * up. A block that matches nothing lints green with every guardrail switched off.
 *
 * The `@mui/*` ban is not a rule of this plugin. It ships here anyway, so that a project
 * cannot adopt the other two and miss it.
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

/** The keys are ESLint's own flat-config keys, so a key added later needs no new argument. */
export declare interface RecommendedOptions {
    files?: string[];
}

export declare const rules: {
    "no-colour-literal": Rule.RuleModule;
    "tailwind-layout-only": Rule.RuleModule;
};

export { }
