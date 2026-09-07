const name = "@telicent-oss/eslint-plugin-ds";
const version = "0.0.1";
const LAYOUT_KEYWORDS = /* @__PURE__ */ new Set([
  // Every value of `display`, spelled out, because none of them is written <prefix>-<value>.
  "flex",
  "grid",
  "block",
  "inline",
  "inline-flex",
  "inline-block",
  "inline-grid",
  "contents",
  "hidden",
  "flow-root",
  "list-item",
  "table",
  "inline-table",
  "table-caption",
  "table-cell",
  "table-row",
  "table-row-group",
  "table-column",
  "table-column-group",
  "table-header-group",
  "table-footer-group",
  // position, isolation, and the bare forms of flex-grow and flex-shrink. `grow` and
  // `shrink` appear in LAYOUT_PREFIXES too, for the forms that do take a value (`grow-0`).
  "static",
  "relative",
  "absolute",
  "fixed",
  "sticky",
  "grow",
  "shrink",
  "isolate",
  // The container class and the container-query root, which is where a `@lg:` variant
  // measures from.
  "container",
  "@container",
  // align-content, named in full rather than carried as a `content` prefix. The prefix
  // would also admit `content-['x']`, which sets the CSS content property and is exactly
  // the decoration the design system owns.
  "content-normal",
  "content-center",
  "content-start",
  "content-end",
  "content-between",
  "content-around",
  "content-evenly",
  "content-baseline",
  "content-stretch"
]);
const LAYOUT_PREFIXES = /* @__PURE__ */ new Set([
  "flex",
  "items",
  "justify",
  "self",
  "place-items",
  "place-content",
  "place-self",
  "order",
  "basis",
  "col",
  "row",
  "grow",
  "shrink",
  "grid-cols",
  "grid-rows",
  "grid-flow",
  "auto",
  "columns",
  "aspect",
  "overflow",
  "float",
  "clear",
  "box",
  "table",
  "gap",
  "space-x",
  "space-y",
  "scroll",
  "translate",
  "m",
  "mx",
  "my",
  "mt",
  "mr",
  "mb",
  "ml",
  "ms",
  "me",
  "p",
  "px",
  "py",
  "pt",
  "pr",
  "pb",
  "pl",
  "ps",
  "pe",
  "w",
  "h",
  "size",
  "min-w",
  "max-w",
  "min-h",
  "max-h",
  "inset",
  "top",
  "right",
  "bottom",
  "left",
  "start",
  "end",
  "z"
]);
const NOT_LAYOUT = /* @__PURE__ */ new Set(["overflow-ellipsis"]);
const NOT_LAYOUT_PREFIXES = /* @__PURE__ */ new Set(["inset-ring", "inset-shadow", "box-decoration"]);
const TEXT_SIZES = /* @__PURE__ */ new Set([
  "xs",
  "sm",
  "base",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
  "6xl",
  "7xl",
  "8xl",
  "9xl"
]);
function allowanceFrom(options) {
  return {
    allowTextSizes: options.allowTextSizes ?? true,
    extraPrefixes: new Set(options.extraPrefixes ?? [])
  };
}
function hasPrefixIn(token, prefixes) {
  if (prefixes.has(token))
    return true;
  for (let dash = token.indexOf("-"); dash > 0; dash = token.indexOf("-", dash + 1)) {
    if (prefixes.has(token.slice(0, dash)))
      return true;
  }
  return false;
}
function isLayoutUtility(rawClass, options = {}) {
  return isAllowedClass(rawClass, allowanceFrom(options));
}
function isAllowedClass(rawClass, allowance) {
  const { allowTextSizes, extraPrefixes } = allowance;
  const token = rawClass.slice(rawClass.lastIndexOf(":") + 1).replace(/^!/, "").replace(/!$/, "").replace(/^-/, "");
  if (token === "")
    return true;
  if (LAYOUT_KEYWORDS.has(token))
    return true;
  if (hasPrefixIn(token, extraPrefixes))
    return true;
  if (NOT_LAYOUT.has(token) || hasPrefixIn(token, NOT_LAYOUT_PREFIXES))
    return false;
  if (token.startsWith("text-")) {
    return allowTextSizes && TEXT_SIZES.has(token.slice("text-".length));
  }
  return hasPrefixIn(token, LAYOUT_PREFIXES);
}
function collectStrings(node, onString) {
  if (node === null || typeof node !== "object")
    return;
  const current = node;
  if (current.type === "Literal" && typeof current.value === "string") {
    onString(current.value, current);
    return;
  }
  if (current.type === "TemplateLiteral") {
    for (const quasi of current.quasis ?? []) {
      const cooked = quasi.value?.cooked;
      onString(cooked ?? "", quasi);
    }
    for (const expression of current.expressions ?? []) {
      collectStrings(expression, onString);
    }
    return;
  }
  for (const key of ["expression", "left", "right", "test", "consequent", "alternate"]) {
    if (current[key])
      collectStrings(current[key], onString);
  }
  for (const key of ["elements", "arguments", "expressions"]) {
    for (const child of current[key] ?? []) {
      collectStrings(child, onString);
    }
  }
  for (const property of current.properties ?? []) {
    const key = property.key;
    if (key?.type === "Identifier" && property.computed !== true) {
      onString(key.name, key);
    } else if (key) {
      collectStrings(key, onString);
    }
    if (property.value)
      collectStrings(property.value, onString);
  }
}
const tailwindLayoutOnly = {
  meta: {
    type: "problem",
    docs: {
      description: "Tailwind may do layout, size and spacing. Typography, colour and decoration come from the design system."
    },
    schema: [
      {
        type: "object",
        properties: {
          allowTextSizes: { type: "boolean" },
          extraPrefixes: { type: "array", items: { type: "string" } }
        },
        additionalProperties: false
      }
    ],
    messages: {
      notLayout: `Tailwind class "{{value}}" is not layout, size or spacing. The design system owns typography, colour and decoration, so use a DS component or its sx prop. If this really is layout, add it to the rule's extraPrefixes option.`
    }
  },
  create(context) {
    const allowance = allowanceFrom(context.options[0] ?? {});
    const listeners = {
      JSXAttribute(node) {
        const attribute = node;
        const nameNode = attribute.name;
        const name2 = nameNode?.type === "JSXIdentifier" ? nameNode.name : "";
        if (name2 !== "className" || attribute.value === null)
          return;
        collectStrings(attribute.value, (text, at) => {
          for (const rawClass of text.split(/\s+/)) {
            if (rawClass === "" || isAllowedClass(rawClass, allowance))
              continue;
            context.report({
              // `at` is inside a JSX attribute, and the estree unions ESLint's types are
              // built from carry no JSX, so there is no node type here to annotate with.
              node: at,
              messageId: "notLayout",
              data: { value: rawClass }
            });
          }
        });
      }
    };
    return listeners;
  }
};
const rules = {
  "tailwind-layout-only": tailwindLayoutOnly
};
const meta = { name, version };
const index = { meta, rules };
export {
  index as default,
  isLayoutUtility,
  meta,
  rules
};
