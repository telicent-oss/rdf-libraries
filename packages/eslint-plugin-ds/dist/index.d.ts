import { Rule } from 'eslint';

declare const _default: {
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

export declare const rules: {
    "tailwind-layout-only": Rule.RuleModule;
};

export { }
