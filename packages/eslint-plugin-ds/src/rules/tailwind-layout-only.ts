import type { Rule } from "eslint";

const LAYOUT_KEYWORDS = new Set([
  "flex", "grid", "block", "inline", "inline-flex", "inline-block", "contents", "hidden",
  "static", "relative", "absolute", "fixed", "sticky", "grow", "shrink", "isolate",
]);

/**
 * Utilities written <prefix>-<value>, where the value is a length, count or fraction.
 *
 * Only the SHORTEST prefix of a family belongs here. The matcher scans a class's dash
 * boundaries left to right and returns at the first hit, so `col` already decides
 * `col-span-2`, and an entry for `col-span` would never be read.
 *
 * A longer form is needed only where the short one is absent: `grid-cols` (there is no
 * `grid` prefix, only the keyword), `place-items`, `min-w`, `space-x`. Adding a shorter
 * prefix silently retires every longer one under it.
 */
const LAYOUT_PREFIXES = new Set([
  "flex", "items", "justify", "self", "content", "place-items", "place-content", "place-self",
  "order", "basis", "col", "row",
  "grid-cols", "grid-rows", "aspect", "overflow",
  "gap", "space-x", "space-y",
  "m", "mx", "my", "mt", "mr", "mb", "ml", "ms", "me",
  "p", "px", "py", "pt", "pr", "pb", "pl", "ps", "pe",
  "w", "h", "size", "min-w", "max-w", "min-h", "max-h",
  "inset", "top", "right", "bottom", "left", "z",
]);

// `text-` is two things: a size (`text-sm`) and a colour (`text-red-500`). Allowing the
// bare prefix would let every colour class through, so sizes are opted in by name and
// `allowTextSizes: false` turns even those off for a project whose design system owns
// typography outright.
const TEXT_SIZES = new Set([
  "xs", "sm", "base", "lg", "xl",
  "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl",
]);

export type LayoutOptions = {
  allowTextSizes?: boolean;
  extraPrefixes?: string[];
};

/**
 * Whether one class is layout, size or spacing.
 *
 * A responsive or state variant (`md:`, `hover:`) and a negative sign both leave the
 * underlying utility unchanged, so they are stripped before the decision. Arbitrary
 * values need no special case: `min-w-[420px]` is decided by `min-w`, and what sits in
 * the brackets cannot change the category.
 */
/**
 * Whether any dash-delimited prefix of `token` is in `prefixes`, scanning left to right
 * and stopping at the first hit, which is what makes the shortest prefix of a family the
 * only one that can be read.
 */
function hasPrefixIn(token: string, prefixes: ReadonlySet<string>): boolean {
  for (let dash = token.indexOf("-"); dash > 0; dash = token.indexOf("-", dash + 1)) {
    if (prefixes.has(token.slice(0, dash))) return true;
  }
  return false;
}

export function isLayoutUtility(rawClass: string, options: LayoutOptions = {}): boolean {
  const { allowTextSizes = true, extraPrefixes = [] } = options;
  const token = rawClass.slice(rawClass.lastIndexOf(":") + 1).replace(/^-/, "");
  // Nothing left after stripping a variant and a sign, so the class was `-` or `md:`.
  // Neither names a utility, and reporting a typo as a design-system violation would send
  // the reader to the wrong fix.
  if (token === "") return true;
  if (LAYOUT_KEYWORDS.has(token)) return true;
  // Before the `text-` branch, which answers for every `text-` class and would otherwise
  // make `extraPrefixes: ["text"]` dead configuration.
  if (hasPrefixIn(token, new Set(extraPrefixes))) return true;
  if (token.startsWith("text-")) {
    return allowTextSizes && TEXT_SIZES.has(token.slice("text-".length));
  }
  return hasPrefixIn(token, LAYOUT_PREFIXES);
}

/**
 * The JSX node shapes are reached through `estree` unions that do not carry JSX, so this
 * walks a loose shape rather than casting at each of the dozen sites below.
 */
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
    for (const quasi of (current.quasis as LooseNode[] | undefined) ?? []) {
      const cooked = (quasi.value as { cooked?: string } | undefined)?.cooked;
      onString(cooked ?? "", quasi);
    }
    for (const expression of (current.expressions as unknown[] | undefined) ?? []) {
      collectStrings(expression, onString);
    }
    return;
  }
  for (const key of ["expression", "left", "right", "test", "consequent", "alternate"]) {
    if (current[key]) collectStrings(current[key], onString);
  }
  for (const key of ["elements", "arguments", "expressions"]) {
    for (const child of (current[key] as unknown[] | undefined) ?? []) {
      collectStrings(child, onString);
    }
  }
  for (const property of (current.properties as LooseNode[] | undefined) ?? []) {
    // The key, not only the value: `clsx({ "font-bold": on })` is the idiomatic way to
    // write a conditional class, and there the class name is the key.
    if (property.key) collectStrings(property.key, onString);
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
        'Tailwind class "{{value}}" is not layout, size or spacing. The design system owns typography, colour and decoration, so use a DS component or its sx prop. If this really is layout, add its prefix to the rule\'s extraPrefixes option.',
    },
  },
  create(context) {
    const options: LayoutOptions = context.options[0] ?? {};
    return {
      JSXAttribute(node: unknown) {
        const attribute = node as LooseNode;
        const nameNode = attribute.name as LooseNode | undefined;
        const name = nameNode?.type === "JSXIdentifier" ? (nameNode.name as string) : "";
        if (name !== "className" || attribute.value === null) return;
        collectStrings(attribute.value, (text, at) => {
          for (const rawClass of text.split(/\s+/)) {
            if (rawClass === "" || isLayoutUtility(rawClass, options)) continue;
            context.report({
              node: at as never,
              messageId: "notLayout",
              data: { value: rawClass },
            });
          }
        });
      },
    } as Rule.RuleListener;
  },
};
