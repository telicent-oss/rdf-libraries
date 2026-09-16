const name = "@telicent-oss/eslint-plugin-ds";
const version = "0.0.1";
const NAMED_COLOURS = /* @__PURE__ */ new Set([
  "aliceblue",
  "antiquewhite",
  "aqua",
  "aquamarine",
  "azure",
  "beige",
  "bisque",
  "black",
  "blanchedalmond",
  "blue",
  "blueviolet",
  "brown",
  "burlywood",
  "cadetblue",
  "chartreuse",
  "chocolate",
  "coral",
  "cornflowerblue",
  "cornsilk",
  "crimson",
  "cyan",
  "darkblue",
  "darkcyan",
  "darkgoldenrod",
  "darkgray",
  "darkgreen",
  "darkgrey",
  "darkkhaki",
  "darkmagenta",
  "darkolivegreen",
  "darkorange",
  "darkorchid",
  "darkred",
  "darksalmon",
  "darkseagreen",
  "darkslateblue",
  "darkslategray",
  "darkslategrey",
  "darkturquoise",
  "darkviolet",
  "deeppink",
  "deepskyblue",
  "dimgray",
  "dimgrey",
  "dodgerblue",
  "firebrick",
  "floralwhite",
  "forestgreen",
  "fuchsia",
  "gainsboro",
  "ghostwhite",
  "gold",
  "goldenrod",
  "gray",
  "green",
  "greenyellow",
  "grey",
  "honeydew",
  "hotpink",
  "indianred",
  "indigo",
  "ivory",
  "khaki",
  "lavender",
  "lavenderblush",
  "lawngreen",
  "lemonchiffon",
  "lightblue",
  "lightcoral",
  "lightcyan",
  "lightgoldenrodyellow",
  "lightgray",
  "lightgreen",
  "lightgrey",
  "lightpink",
  "lightsalmon",
  "lightseagreen",
  "lightskyblue",
  "lightslategray",
  "lightslategrey",
  "lightsteelblue",
  "lightyellow",
  "lime",
  "limegreen",
  "linen",
  "magenta",
  "maroon",
  "mediumaquamarine",
  "mediumblue",
  "mediumorchid",
  "mediumpurple",
  "mediumseagreen",
  "mediumslateblue",
  "mediumspringgreen",
  "mediumturquoise",
  "mediumvioletred",
  "midnightblue",
  "mintcream",
  "mistyrose",
  "moccasin",
  "navajowhite",
  "navy",
  "oldlace",
  "olive",
  "olivedrab",
  "orange",
  "orangered",
  "orchid",
  "palegoldenrod",
  "palegreen",
  "paleturquoise",
  "palevioletred",
  "papayawhip",
  "peachpuff",
  "peru",
  "pink",
  "plum",
  "powderblue",
  "purple",
  "rebeccapurple",
  "red",
  "rosybrown",
  "royalblue",
  "saddlebrown",
  "salmon",
  "sandybrown",
  "seagreen",
  "seashell",
  "sienna",
  "silver",
  "skyblue",
  "slateblue",
  "slategray",
  "slategrey",
  "snow",
  "springgreen",
  "steelblue",
  "tan",
  "teal",
  "thistle",
  "tomato",
  "turquoise",
  "violet",
  "wheat",
  "white",
  "whitesmoke",
  "yellow",
  "yellowgreen"
]);
const COLOUR_FAMILIES = /* @__PURE__ */ new Set([
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "black",
  "white"
]);
const COLOUR_PREFIXES = /* @__PURE__ */ new Set([
  "bg",
  "text",
  "border",
  "ring",
  "fill",
  "stroke",
  "divide",
  "placeholder",
  "outline",
  "accent",
  "caret",
  "decoration",
  "shadow",
  "from",
  "via",
  "to"
]);
const HEX = /#[0-9a-f]{3,8}\b/i;
const FUNCTIONAL = /\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\s*\([^)]*\)?/i;
function findColourLiteral(value) {
  const hex = HEX.exec(value);
  if (hex)
    return hex[0];
  const functional = FUNCTIONAL.exec(value);
  if (functional)
    return functional[0].trim();
  for (const token of value.toLowerCase().split(/[^a-z]+/)) {
    if (NAMED_COLOURS.has(token))
      return token;
  }
  return null;
}
function findTailwindColourClass(rawToken) {
  const token = rawToken.slice(rawToken.lastIndexOf(":") + 1);
  const dash = token.indexOf("-");
  if (dash < 1)
    return null;
  if (!COLOUR_PREFIXES.has(token.slice(0, dash)))
    return null;
  const rest = token.slice(dash + 1);
  if (rest.startsWith("[") && rest.endsWith("]")) {
    return findColourLiteral(rest.slice(1, -1)) ? token : null;
  }
  const shadeAt = rest.lastIndexOf("-");
  const family = shadeAt === -1 ? rest : rest.slice(0, shadeAt);
  const shade = shadeAt === -1 ? "" : rest.slice(shadeAt + 1);
  if (!COLOUR_FAMILIES.has(family))
    return null;
  if (shade !== "" && !/^\d{1,3}$/.test(shade))
    return null;
  return token;
}
const report = (context, at, messageId, value) => context.report({ node: at, messageId, data: { value } });
function walkStrings(node, visit) {
  if (!node)
    return;
  if (node.type === "Literal" && typeof node.value === "string") {
    visit(node.value, node);
    return;
  }
  if (node.type === "TemplateLiteral") {
    for (const quasi of node.quasis)
      visit(quasi.value.cooked ?? "", quasi);
    return;
  }
  if (node.type === "ObjectExpression") {
    for (const property of node.properties) {
      if (property.type === "Property")
        walkStrings(property.value, visit);
      else
        walkStrings(property.argument, visit);
    }
    return;
  }
  if (node.type === "ArrayExpression") {
    for (const element of node.elements)
      walkStrings(element, visit);
  }
}
function isStyledTag(tag) {
  if (tag.type === "CallExpression") {
    return tag.callee.type === "Identifier" && tag.callee.name === "styled";
  }
  return tag.type === "MemberExpression" && tag.object.type === "Identifier" && tag.object.name === "styled";
}
const noColourLiteral = {
  meta: {
    type: "problem",
    docs: {
      description: "Colour comes from the design system theme, never a literal or a Tailwind colour class."
    },
    schema: [
      {
        type: "object",
        properties: { allow: { type: "array", items: { type: "string" } } },
        additionalProperties: false
      }
    ],
    messages: {
      literal: 'Colour literal "{{value}}" - read colour from the design system theme instead. If the theme genuinely has no token for it, allow it in your eslint config: the ds/no-colour-literal rule takes an `allow` list. Put the reason beside the entry.',
      tailwind: 'Tailwind colour class "{{value}}" - set colour through the design system theme. Tailwind may still do layout, size and spacing. If the theme genuinely has no token for it, allow it in your eslint config: the ds/no-colour-literal rule takes an `allow` list. Put the reason beside the entry.'
    }
  },
  create(context) {
    const allowed = new Set(context.options[0]?.allow ?? []);
    const reportLiteral = (value, at) => {
      const hit = findColourLiteral(value);
      if (hit === null || allowed.has(hit) || allowed.has(value))
        return;
      report(context, at, "literal", hit);
    };
    return {
      JSXAttribute(node) {
        const attribute = node;
        const name2 = attribute.name.type === "JSXIdentifier" ? attribute.name.name : "";
        if (name2 === "sx" || name2 === "style") {
          if (attribute.value?.type === "JSXExpressionContainer") {
            walkStrings(attribute.value.expression, reportLiteral);
          }
          return;
        }
        if (name2 !== "className")
          return;
        const strings = [];
        const value = attribute.value;
        if (value?.type === "Literal" && typeof value.value === "string") {
          strings.push([value.value, value]);
        } else if (value?.type === "JSXExpressionContainer") {
          walkStrings(value.expression, (text, at) => strings.push([text, at]));
        }
        for (const [text, at] of strings) {
          for (const rawToken of text.split(/\s+/)) {
            if (rawToken === "")
              continue;
            const hit = findTailwindColourClass(rawToken);
            if (hit === null || allowed.has(hit))
              continue;
            report(context, at, "tailwind", hit);
          }
        }
      },
      TaggedTemplateExpression(node) {
        const expression = node;
        if (!isStyledTag(expression.tag))
          return;
        for (const chunk of expression.quasi.quasis) {
          reportLiteral(chunk.value.cooked ?? "", chunk);
        }
      },
      CallExpression(node) {
        const call = node;
        const callee = call.callee;
        if (callee.type !== "CallExpression")
          return;
        if (callee.callee.type !== "Identifier" || callee.callee.name !== "styled")
          return;
        for (const argument of call.arguments)
          walkStrings(argument, reportLiteral);
      }
    };
  }
};
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
  "no-colour-literal": noColourLiteral,
  "tailwind-layout-only": tailwindLayoutOnly
};
const meta = { name, version };
const plugin = {
  meta,
  rules
};
const DEFAULT_FILES = ["src/**/*.{ts,tsx}"];
function recommended({ files = DEFAULT_FILES } = {}) {
  return [
    {
      files,
      plugins: { ds: plugin },
      rules: {
        "ds/no-colour-literal": "error",
        "ds/tailwind-layout-only": "warn",
        "no-restricted-imports": [
          "warn",
          {
            patterns: [
              {
                group: ["@mui/*", "@mui/*/*"],
                message: "Use @telicent-oss/ds instead (icons: @telicent-oss/mui-icons-material). Look the component up in the design system's manifest rather than guessing a name."
              }
            ]
          }
        ]
      }
    }
  ];
}
const configs = {
  recommended
};
const index = Object.assign(plugin, { configs });
export {
  DEFAULT_FILES,
  configs,
  index as default,
  findColourLiteral,
  findTailwindColourClass,
  isLayoutUtility,
  meta,
  recommended,
  rules
};
