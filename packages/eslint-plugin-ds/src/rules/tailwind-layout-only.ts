import type { Rule } from "eslint";

const LAYOUT_KEYWORDS = new Set([
  // Every value of `display`. None is written <prefix>-<value>.
  "flex", "grid", "block", "inline", "inline-flex", "inline-block", "inline-grid",
  "contents", "hidden", "flow-root", "list-item",
  "table", "inline-table", "table-caption", "table-cell", "table-row", "table-row-group",
  "table-column", "table-column-group", "table-header-group", "table-footer-group",
  // `grow` and `shrink` are also in LAYOUT_PREFIXES, for the forms that take a value.
  "static", "relative", "absolute", "fixed", "sticky", "grow", "shrink", "isolate",
  "container", "@container",
  // align-content values, named in full. A `content` prefix would also admit
  // `content-['x']`, which is decoration the design system owns.
  "content-normal", "content-center", "content-start", "content-end", "content-between",
  "content-around", "content-evenly", "content-baseline", "content-stretch",
]);

/**
 * Utilities written <prefix>-<value>.
 *
 * Only the shortest prefix of a family belongs here. The matcher returns at the first hit,
 * so `col` already decides `col-span-2`. Adding a shorter prefix retires every longer one
 * under it.
 */
const LAYOUT_PREFIXES = new Set([
  "flex", "items", "justify", "self", "place-items", "place-content", "place-self",
  "order", "basis", "col", "row", "grow", "shrink",
  "grid-cols", "grid-rows", "grid-flow", "auto", "columns", "aspect", "overflow",
  "float", "clear", "box", "table",
  "gap", "space-x", "space-y", "scroll", "translate",
  "m", "mx", "my", "mt", "mr", "mb", "ml", "ms", "me",
  "p", "px", "py", "pt", "pr", "pb", "pl", "ps", "pe",
  "w", "h", "size", "min-w", "max-w", "min-h", "max-h",
  "inset", "top", "right", "bottom", "left", "start", "end", "z",
]);

/**
 * Decoration that opens with a layout prefix, so the prefix scan would let it through.
 *
 * These are the ones known so far, not a closed set. They are checked after
 * `extraPrefixes`, so a caller can still opt in.
 */
const NOT_LAYOUT = new Set(["overflow-ellipsis"]);
const NOT_LAYOUT_PREFIXES = new Set(["inset-ring", "inset-shadow", "box-decoration"]);

// `text-` is both a size and a colour. The bare prefix would let every colour class
// through, so sizes are opted in by name.
const TEXT_SIZES = new Set([
  "xs", "sm", "base", "lg", "xl",
  "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl",
]);

export interface LayoutOptions {
  allowTextSizes?: boolean;
  extraPrefixes?: string[];
}

interface Allowance {
  allowTextSizes: boolean;
  extraPrefixes: ReadonlySet<string>;
}

function allowanceFrom(options: LayoutOptions): Allowance {
  return {
    allowTextSizes: options.allowTextSizes ?? true,
    extraPrefixes: new Set(options.extraPrefixes ?? []),
  };
}

function hasPrefixIn(token: string, prefixes: ReadonlySet<string>): boolean {
  if (prefixes.has(token)) return true;
  for (let dash = token.indexOf("-"); dash > 0; dash = token.indexOf("-", dash + 1)) {
    if (prefixes.has(token.slice(0, dash))) return true;
  }
  return false;
}

/** Whether one Tailwind class is layout, size or spacing. */
export function isLayoutUtility(rawClass: string, options: LayoutOptions = {}): boolean {
  return isAllowedClass(rawClass, allowanceFrom(options));
}

function isAllowedClass(rawClass: string, allowance: Allowance): boolean {
  const { allowTextSizes, extraPrefixes } = allowance;
  const token = rawClass
    .slice(rawClass.lastIndexOf(":") + 1)
    // `!important` is written `!flex` in Tailwind 3 and `flex!` in 4.
    .replace(/^!/, "")
    .replace(/!$/, "")
    .replace(/^-/, "");
  // The class was `-`, `!` or `md:`. It names no utility, so the rule says nothing.
  // Reporting a typo as a design-system violation sends the reader to the wrong fix.
  if (token === "") return true;
  if (LAYOUT_KEYWORDS.has(token)) return true;
  // Before the `text-` branch, which would otherwise make `extraPrefixes: ["text"]` dead.
  if (hasPrefixIn(token, extraPrefixes)) return true;
  if (NOT_LAYOUT.has(token) || hasPrefixIn(token, NOT_LAYOUT_PREFIXES)) return false;
  if (token.startsWith("text-")) {
    return allowTextSizes && TEXT_SIZES.has(token.slice("text-".length));
  }
  return hasPrefixIn(token, LAYOUT_PREFIXES);
}

/** ESLint's node types come from `estree`, which has no JSX in it. */
type LooseNode = Record<string, unknown> & { type?: string };

type OnString = (text: string, at: LooseNode) => void;

function collectStrings(node: unknown, onString: OnString): void {
  if (node === null || typeof node !== "object") return;
  const current = node as LooseNode;
  if (current.type === "Literal" && typeof current.value === "string") {
    onString(current.value, current);
    return;
  }
  if (current.type === "TemplateLiteral") {
    // `cooked` is a text chunk with its escapes resolved.
    for (const quasi of (current.quasis as LooseNode[] | undefined) ?? []) {
      const cooked = (quasi.value as { cooked?: string } | undefined)?.cooked;
      onString(cooked ?? "", quasi);
    }
    for (const expression of (current.expressions as unknown[] | undefined) ?? []) {
      collectStrings(expression, onString);
    }
    return;
  }
  // The fields a class name hangs off. Supporting another shape means adding its field
  // name here.
  for (const key of ["expression", "left", "right", "test", "consequent", "alternate"]) {
    if (current[key]) collectStrings(current[key], onString);
  }
  for (const key of ["elements", "arguments", "expressions"]) {
    for (const child of (current[key] as unknown[] | undefined) ?? []) {
      collectStrings(child, onString);
    }
  }
  for (const property of (current.properties as LooseNode[] | undefined) ?? []) {
    // In `clsx({ "font-bold": on })` the class name is the key. An unquoted key is an
    // Identifier rather than a Literal.
    const key = property.key as LooseNode | undefined;
    if (key?.type === "Identifier" && property.computed !== true) {
      onString(key.name as string, key);
    } else if (key) {
      collectStrings(key, onString);
    }
    if (property.value) collectStrings(property.value, onString);
  }
}

export const tailwindLayoutOnly: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Tailwind may do layout, size and spacing. Typography, colour and decoration come from the design system.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowTextSizes: { type: "boolean" },
          extraPrefixes: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      notLayout:
        'Tailwind class "{{value}}" is not layout, size or spacing. The design system owns typography, colour and decoration, so use a DS component or its sx prop. If this really is layout, add it to the rule\'s extraPrefixes option.',
    },
  },
  create(context) {
    const allowance = allowanceFrom(context.options[0] ?? {});
    const listeners: Rule.RuleListener = {
      JSXAttribute(node: unknown) {
        const attribute = node as LooseNode;
        const nameNode = attribute.name as LooseNode | undefined;
        const name = nameNode?.type === "JSXIdentifier" ? (nameNode.name as string) : "";
        if (name !== "className" || attribute.value === null) return;
        collectStrings(attribute.value, (text, at) => {
          for (const rawClass of text.split(/\s+/)) {
            if (rawClass === "" || isAllowedClass(rawClass, allowance)) continue;
            context.report({
              // `at` is a JSX node, which ESLint's estree-based types cannot name.
              node: at as unknown as Rule.Node,
              messageId: "notLayout",
              data: { value: rawClass },
            });
          }
        });
      },
    };
    return listeners;
  },
};
