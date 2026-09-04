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

export declare function isLayoutUtility(rawClass: string, options?: LayoutOptions): boolean;

export declare type LayoutOptions = {
    allowTextSizes?: boolean;
    extraPrefixes?: string[];
};

export declare const meta: {
    name: string;
    version: string;
};

export declare const rules: {
    "tailwind-layout-only": Rule.RuleModule;
};

export { }
