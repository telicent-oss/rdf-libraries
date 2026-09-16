import type { Rule } from "eslint";
import type { TSESTree } from "@typescript-eslint/types";

const NAMED_COLOURS = new Set([
  "aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige", "bisque",
  "black", "blanchedalmond", "blue", "blueviolet", "brown", "burlywood", "cadetblue",
  "chartreuse", "chocolate", "coral", "cornflowerblue", "cornsilk", "crimson", "cyan",
  "darkblue", "darkcyan", "darkgoldenrod", "darkgray", "darkgreen", "darkgrey",
  "darkkhaki", "darkmagenta", "darkolivegreen", "darkorange", "darkorchid", "darkred",
  "darksalmon", "darkseagreen", "darkslateblue", "darkslategray", "darkslategrey",
  "darkturquoise", "darkviolet", "deeppink", "deepskyblue", "dimgray", "dimgrey",
  "dodgerblue", "firebrick", "floralwhite", "forestgreen", "fuchsia", "gainsboro",
  "ghostwhite", "gold", "goldenrod", "gray", "green", "greenyellow", "grey",
  "honeydew", "hotpink", "indianred", "indigo", "ivory", "khaki", "lavender",
  "lavenderblush", "lawngreen", "lemonchiffon", "lightblue", "lightcoral", "lightcyan",
  "lightgoldenrodyellow", "lightgray", "lightgreen", "lightgrey", "lightpink",
  "lightsalmon", "lightseagreen", "lightskyblue", "lightslategray", "lightslategrey",
  "lightsteelblue", "lightyellow", "lime", "limegreen", "linen", "magenta", "maroon",
  "mediumaquamarine", "mediumblue", "mediumorchid", "mediumpurple", "mediumseagreen",
  "mediumslateblue", "mediumspringgreen", "mediumturquoise", "mediumvioletred",
  "midnightblue", "mintcream", "mistyrose", "moccasin", "navajowhite", "navy",
  "oldlace", "olive", "olivedrab", "orange", "orangered", "orchid", "palegoldenrod",
  "palegreen", "paleturquoise", "palevioletred", "papayawhip", "peachpuff", "peru",
  "pink", "plum", "powderblue", "purple", "rebeccapurple", "red", "rosybrown",
  "royalblue", "saddlebrown", "salmon", "sandybrown", "seagreen", "seashell", "sienna",
  "silver", "skyblue", "slateblue", "slategray", "slategrey", "snow", "springgreen",
  "steelblue", "tan", "teal", "thistle", "tomato", "turquoise", "violet", "wheat",
  "white", "whitesmoke", "yellow", "yellowgreen",
]);

/** `black` and `white` carry no shade, so the shade is optional. */
const COLOUR_FAMILIES = new Set([
  "slate", "gray", "zinc", "neutral", "stone", "red", "orange", "amber", "yellow",
  "lime", "green", "emerald", "teal", "cyan", "sky", "blue", "indigo", "violet",
  "purple", "fuchsia", "pink", "rose", "black", "white",
]);

/** Some of these also take a size, such as `text-sm`. The prefix alone is not a colour. */
const COLOUR_PREFIXES = new Set([
  "bg", "text", "border", "ring", "fill", "stroke", "divide", "placeholder",
  "outline", "accent", "caret", "decoration", "shadow", "from", "via", "to",
]);

const HEX = /#[0-9a-f]{3,8}\b/i;
const FUNCTIONAL =
  /\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\s*\([^)]*\)?/i;

export interface ColourOptions {
  allow?: string[];
}

export function findColourLiteral(value: string): string | null {
  const hex = HEX.exec(value);
  if (hex) return hex[0];
  const functional = FUNCTIONAL.exec(value);
  if (functional) return functional[0].trim();
  for (const token of value.toLowerCase().split(/[^a-z]+/)) {
    if (NAMED_COLOURS.has(token)) return token;
  }
  return null;
}

/** Any variant prefix is dropped first, so `hover:bg-red-500` is read as `bg-red-500`. */
export function findTailwindColourClass(rawToken: string): string | null {
  const token = rawToken.slice(rawToken.lastIndexOf(":") + 1);
  const dash = token.indexOf("-");
  if (dash < 1) return null;
  if (!COLOUR_PREFIXES.has(token.slice(0, dash))) return null;
  const rest = token.slice(dash + 1);

  if (rest.startsWith("[") && rest.endsWith("]")) {
    return findColourLiteral(rest.slice(1, -1)) ? token : null;
  }
  const shadeAt = rest.lastIndexOf("-");
  const family = shadeAt === -1 ? rest : rest.slice(0, shadeAt);
  const shade = shadeAt === -1 ? "" : rest.slice(shadeAt + 1);
  if (!COLOUR_FAMILIES.has(family)) return null;
  if (shade !== "" && !/^\d{1,3}$/.test(shade)) return null;
  return token;
}

type OnString = (text: string, at: TSESTree.Node) => void;

/**
 * eslint declares its nodes on plain ESTree, which has no JSX members. The AST objects are
 * the same, so this rule reads nodes as `TSESTree` and casts back here.
 */
const report = (
  context: Rule.RuleContext,
  at: TSESTree.Node,
  messageId: string,
  value: string,
): void => context.report({ node: at as unknown as Rule.Node, messageId, data: { value } });

function walkStrings(node: TSESTree.Node | null | undefined, visit: OnString): void {
  if (!node) return;
  if (node.type === "Literal" && typeof node.value === "string") {
    visit(node.value, node);
    return;
  }
  if (node.type === "TemplateLiteral") {
    for (const quasi of node.quasis) visit(quasi.value.cooked ?? "", quasi);
    return;
  }
  if (node.type === "ObjectExpression") {
    for (const property of node.properties) {
      if (property.type === "Property") walkStrings(property.value, visit);
      else walkStrings(property.argument, visit);
    }
    return;
  }
  if (node.type === "ArrayExpression") {
    for (const element of node.elements) walkStrings(element, visit);
  }
}

function isStyledTag(tag: TSESTree.Expression): boolean {
  if (tag.type === "CallExpression") {
    return tag.callee.type === "Identifier" && tag.callee.name === "styled";
  }
  return (
    tag.type === "MemberExpression" &&
    tag.object.type === "Identifier" &&
    tag.object.name === "styled"
  );
}

export const noColourLiteral: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Colour comes from the design system theme, never a literal or a Tailwind colour class.",
    },
    schema: [
      {
        type: "object",
        properties: { allow: { type: "array", items: { type: "string" } } },
        additionalProperties: false,
      },
    ],
    messages: {
      literal:
        'Colour literal "{{value}}" - read colour from the design system theme instead. If the theme genuinely has no token for it, allow it in your eslint config: the ds/no-colour-literal rule takes an `allow` list. Put the reason beside the entry.',
      tailwind:
        'Tailwind colour class "{{value}}" - set colour through the design system theme. Tailwind may still do layout, size and spacing. If the theme genuinely has no token for it, allow it in your eslint config: the ds/no-colour-literal rule takes an `allow` list. Put the reason beside the entry.',
    },
  },
  create(context) {
    const allowed = new Set((context.options[0] as ColourOptions | undefined)?.allow ?? []);

    const reportLiteral: OnString = (value, at) => {
      const hit = findColourLiteral(value);
      // A project allowing `rgb(0 0 0 / 40%)` writes the whole value, not the match.
      if (hit === null || allowed.has(hit) || allowed.has(value)) return;
      report(context, at, "literal", hit);
    };

    return {
      JSXAttribute(node: unknown) {
        const attribute = node as TSESTree.JSXAttribute;
        const name = attribute.name.type === "JSXIdentifier" ? attribute.name.name : "";

        if (name === "sx" || name === "style") {
          if (attribute.value?.type === "JSXExpressionContainer") {
            walkStrings(attribute.value.expression, reportLiteral);
          }
          return;
        }
        if (name !== "className") return;

        const strings: [string, TSESTree.Node][] = [];
        const value = attribute.value;
        if (value?.type === "Literal" && typeof value.value === "string") {
          strings.push([value.value, value]);
        } else if (value?.type === "JSXExpressionContainer") {
          walkStrings(value.expression, (text, at) => strings.push([text, at]));
        }
        for (const [text, at] of strings) {
          for (const rawToken of text.split(/\s+/)) {
            if (rawToken === "") continue;
            const hit = findTailwindColourClass(rawToken);
            if (hit === null || allowed.has(hit)) continue;
            report(context, at, "tailwind", hit);
          }
        }
      },

      TaggedTemplateExpression(node: unknown) {
        const expression = node as TSESTree.TaggedTemplateExpression;
        if (!isStyledTag(expression.tag)) return;
        for (const chunk of expression.quasi.quasis) {
          reportLiteral(chunk.value.cooked ?? "", chunk);
        }
      },

      CallExpression(node: unknown) {
        // styled.div({ ... }) is deliberately not read here. The rule this was ported
        // from ignored it too.
        const call = node as TSESTree.CallExpression;
        const callee = call.callee;
        if (callee.type !== "CallExpression") return;
        if (callee.callee.type !== "Identifier" || callee.callee.name !== "styled") return;
        for (const argument of call.arguments) walkStrings(argument, reportLiteral);
      },
    };
  },
};
