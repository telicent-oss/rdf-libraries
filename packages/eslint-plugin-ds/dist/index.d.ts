import { Rule } from 'eslint';

/**
 * A flat config a consumer can spread, so the rule is turned on in one line instead of
 * three. The plugin is registered under the same name ESLint prints in a resolved config.
 */
export declare const configs: {
    recommended: {
        plugins: {
            "@telicent-oss/ds": {
                meta: {
                    name: string;
                    version: string;
                };
                rules: {
                    "tailwind-layout-only": Rule.RuleModule;
                };
            };
        };
        rules: {
            "@telicent-oss/ds/tailwind-layout-only": string;
        };
    };
};

declare const _default: {
    configs: {
        recommended: {
            plugins: {
                "@telicent-oss/ds": {
                    meta: {
                        name: string;
                        version: string;
                    };
                    rules: {
                        "tailwind-layout-only": Rule.RuleModule;
                    };
                };
            };
            rules: {
                "@telicent-oss/ds/tailwind-layout-only": string;
            };
        };
    };
    meta: {
        name: string;
        version: string;
    };
    rules: {
        "tailwind-layout-only": Rule.RuleModule;
    };
};
export default _default;

/**
 * Whether one class is layout, size or spacing.
 *
 * A responsive or state variant (`md:`, `hover:`) and a negative sign both leave the
 * underlying utility unchanged, so they are stripped before the decision. Arbitrary
 * values need no special case: `min-w-[420px]` is decided by `min-w`, and what sits in
 * the brackets cannot change the category.
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

export declare const rules: {
    "tailwind-layout-only": Rule.RuleModule;
};

export { }
