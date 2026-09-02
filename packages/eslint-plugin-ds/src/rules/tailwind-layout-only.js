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

/**
 * Whether one class is layout, size or spacing.
 *
 * A responsive or state variant (`md:`, `hover:`) and a negative sign both leave the
 * underlying utility unchanged, so they are stripped before the decision. Arbitrary
 * values need no special case: `min-w-[420px]` is decided by `min-w`, and what sits in
 * the brackets cannot change the category.
 */
export function isLayoutUtility(rawClass, options = {}) {
  const { allowTextSizes = true, extraPrefixes = [] } = options;
  const token = rawClass.slice(rawClass.lastIndexOf(":") + 1).replace(/^-/, "");
  // Nothing left after stripping a variant and a sign, so the class was `-` or `md:`.
  // Neither names a utility, and reporting a typo as a design-system violation would send
  // the reader to the wrong fix.
  if (token === "") return true;
  if (LAYOUT_KEYWORDS.has(token)) return true;
  if (token.startsWith("text-")) {
    return allowTextSizes && TEXT_SIZES.has(token.slice("text-".length));
  }
  for (let dash = token.indexOf("-"); dash > 0; dash = token.indexOf("-", dash + 1)) {
    const prefix = token.slice(0, dash);
    if (LAYOUT_PREFIXES.has(prefix) || extraPrefixes.includes(prefix)) return true;
  }
  return false;
}

function collectStrings(node, onString) {
  if (node === null || typeof node !== "object") return;
  if (node.type === "Literal" && typeof node.value === "string") {
    onString(node.value, node);
    return;
  }
  if (node.type === "TemplateLiteral") {
    for (const quasi of node.quasis) onString(quasi.value.cooked ?? "", quasi);
    for (const expression of node.expressions) collectStrings(expression, onString);
    return;
  }
  for (const key of ["expression", "left", "right", "test", "consequent", "alternate"]) {
    if (node[key]) collectStrings(node[key], onString);
  }
  for (const key of ["elements", "arguments", "expressions"]) {
    for (const child of node[key] ?? []) collectStrings(child, onString);
  }
  for (const property of node.properties ?? []) {
    // The key, not only the value: `clsx({ "font-bold": on })` is the idiomatic way to
    // write a conditional class, and there the class name is the key.
    if (property.key) collectStrings(property.key, onString);
    if (property.value) collectStrings(property.value, onString);
  }
}

export const tailwindLayoutOnly = {
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
    const options = context.options[0] ?? {};
    return {
      JSXAttribute(node) {
        const name = node.name.type === "JSXIdentifier" ? node.name.name : "";
        if (name !== "className" || node.value === null) return;
        collectStrings(node.value, (text, at) => {
          for (const rawClass of text.split(/\s+/)) {
            if (rawClass === "" || isLayoutUtility(rawClass, options)) continue;
            context.report({ node: at, messageId: "notLayout", data: { value: rawClass } });
          }
        });
      },
    };
  },
};
