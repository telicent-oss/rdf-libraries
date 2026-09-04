const LAYOUT_KEYWORDS = /* @__PURE__ */ new Set([
  "flex",
  "grid",
  "block",
  "inline",
  "inline-flex",
  "inline-block",
  "contents",
  "hidden",
  "static",
  "relative",
  "absolute",
  "fixed",
  "sticky",
  "grow",
  "shrink",
  "isolate"
]);
const LAYOUT_PREFIXES = /* @__PURE__ */ new Set([
  "flex",
  "items",
  "justify",
  "self",
  "content",
  "place-items",
  "place-content",
  "place-self",
  "order",
  "basis",
  "col",
  "row",
  "grid-cols",
  "grid-rows",
  "aspect",
  "overflow",
  "gap",
  "space-x",
  "space-y",
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
  "z"
]);
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
function hasPrefixIn(token, prefixes) {
  for (let dash = token.indexOf("-"); dash > 0; dash = token.indexOf("-", dash + 1)) {
    if (prefixes.has(token.slice(0, dash)))
      return true;
  }
  return false;
}
function isLayoutUtility(rawClass, options = {}) {
  const { allowTextSizes = true, extraPrefixes = [] } = options;
  const token = rawClass.slice(rawClass.lastIndexOf(":") + 1).replace(/^-/, "");
  if (token === "")
    return true;
  if (LAYOUT_KEYWORDS.has(token))
    return true;
  if (hasPrefixIn(token, new Set(extraPrefixes)))
    return true;
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
    if (property.key)
      collectStrings(property.key, onString);
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
      notLayout: `Tailwind class "{{value}}" is not layout, size or spacing. The design system owns typography, colour and decoration, so use a DS component or its sx prop. If this really is layout, add its prefix to the rule's extraPrefixes option.`
    }
  },
  create(context) {
    const options = context.options[0] ?? {};
    return {
      JSXAttribute(node) {
        const attribute = node;
        const nameNode = attribute.name;
        const name = nameNode?.type === "JSXIdentifier" ? nameNode.name : "";
        if (name !== "className" || attribute.value === null)
          return;
        collectStrings(attribute.value, (text, at) => {
          for (const rawClass of text.split(/\s+/)) {
            if (rawClass === "" || isLayoutUtility(rawClass, options))
              continue;
            context.report({
              node: at,
              messageId: "notLayout",
              data: { value: rawClass }
            });
          }
        });
      }
    };
  }
};
const rules = {
  "tailwind-layout-only": tailwindLayoutOnly
};
const meta = {
  name: "@telicent-oss/eslint-plugin-ds",
  version: "0.0.1"
};
const index = { meta, rules };
export {
  index as default,
  isLayoutUtility,
  meta,
  rules
};
//# sourceMappingURL=eslint-plugin-ds.es.js.map
