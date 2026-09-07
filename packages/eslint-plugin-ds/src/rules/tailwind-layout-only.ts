import type { Rule } from "eslint";

const LAYOUT_KEYWORDS = new Set([
  // display, in full: every value of it is layout, and none of them takes a value.
  "flex", "grid", "block", "inline", "inline-flex", "inline-block", "inline-grid",
  "contents", "hidden", "flow-root", "list-item",
  "table", "inline-table", "table-caption", "table-cell", "table-row", "table-row-group",
  "table-column", "table-column-group", "table-header-group", "table-footer-group",
  "static", "relative", "absolute", "fixed", "sticky", "grow", "shrink", "isolate",
  // The container class and the container-query root, which is where a `@lg:` variant
  // measures from.
  "container", "@container",
  // align-content, named in full rather than carried as a `content` prefix. The prefix
  // would also admit `content-['x']`, which sets the CSS content property and is exactly
  // the decoration the design system owns.
  "content-normal", "content-center", "content-start", "content-end", "content-between",
  "content-around", "content-evenly", "content-baseline", "content-stretch",
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
 * Decoration that shares its opening prefix with something layout, so the prefix scan
 * would otherwise let it through. `inset-ring-red-500` and `inset-shadow-red-500/50` are
 * box-shadows with a colour, admitted by `inset`; `overflow-ellipsis` is text-overflow,
 * admitted by `overflow`. Checked after `extraPrefixes`, so a caller can still opt in.
 */
const NOT_LAYOUT = new Set(["overflow-ellipsis"]);
const NOT_LAYOUT_PREFIXES = new Set(["inset-ring", "inset-shadow"]);

// `text-` is two things: a size (`text-sm`) and a colour (`text-red-500`). Allowing the
// bare prefix would let every colour class through, so sizes are opted in by name and
// `allowTextSizes: false` turns even those off for a project whose design system owns
// typography outright.
const TEXT_SIZES = new Set([
  "xs", "sm", "base", "lg", "xl",
  "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl",
]);

export interface LayoutOptions {
  allowTextSizes?: boolean;
  extraPrefixes?: string[];
}

/**
 * `LayoutOptions` with the defaults filled in and `extraPrefixes` built into the set the
 * matcher wants. Built once per lint run rather than per class name.
 */
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

/**
 * Whether `token` or any dash-delimited prefix of it is in `prefixes`. The scan runs left
 * to right and stops at the first hit, which is what makes the shortest prefix of a family
 * the only one that can be read.
 *
 * The whole token counts, so a class with no dash can be listed. Without that,
 * `extraPrefixes: ["container"]` was dead configuration while the rule's own message told
 * the reader to write it.
 */
function hasPrefixIn(token: string, prefixes: ReadonlySet<string>): boolean {
  if (prefixes.has(token)) return true;
  for (let dash = token.indexOf("-"); dash > 0; dash = token.indexOf("-", dash + 1)) {
    if (prefixes.has(token.slice(0, dash))) return true;
  }
  return false;
}

/**
 * Whether one class is layout, size or spacing.
 *
 * A responsive or state variant (`md:`, `hover:`) and a negative sign both leave the
 * underlying utility unchanged, so they are stripped before the decision. Arbitrary
 * values need no special case: `min-w-[420px]` is decided by `min-w`, and what sits in
 * the brackets cannot change the category.
 */
export function isLayoutUtility(rawClass: string, options: LayoutOptions = {}): boolean {
  return isAllowedClass(rawClass, allowanceFrom(options));
}

function isAllowedClass(rawClass: string, allowance: Allowance): boolean {
  const { allowTextSizes, extraPrefixes } = allowance;
  const token = rawClass
    .slice(rawClass.lastIndexOf(":") + 1)
    // `!important`, written `!flex` in Tailwind 3 and `flex!` in 4. Neither changes which
    // property the class sets, so both come off before the decision.
    .replace(/^!/, "")
    .replace(/!$/, "")
    .replace(/^-/, "");
  // Nothing left after stripping a variant, an important marker and a sign, so the class
  // was `-`, `!` or `md:`.
  // Neither names a utility, and reporting a typo as a design-system violation would send
  // the reader to the wrong fix.
  if (token === "") return true;
  if (LAYOUT_KEYWORDS.has(token)) return true;
  // Before the `text-` branch, which answers for every `text-` class and would otherwise
  // make `extraPrefixes: ["text"]` dead configuration.
  if (hasPrefixIn(token, extraPrefixes)) return true;
  if (NOT_LAYOUT.has(token) || hasPrefixIn(token, NOT_LAYOUT_PREFIXES)) return false;
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
    // write a conditional class, and there the class name is the key. An unquoted key is
    // an Identifier rather than a Literal, and `{ underline: on }` is both a valid
    // identifier and a decoration utility, so reading only the quoted form missed the
    // shorter spelling of the same thing.
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
              // `at` is inside a JSX attribute, and the estree unions ESLint's types are
              // built from carry no JSX, so there is no node type here to annotate with.
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
