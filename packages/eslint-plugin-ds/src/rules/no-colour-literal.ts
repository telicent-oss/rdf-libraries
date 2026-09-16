import type { Rule } from "eslint";
import type { TSESTree } from "@typescript-eslint/types";

/**
 * Every CSS named colour. Matched as a whole word, so `red` in `border-red solid` is a
 * hit and `redirect` is not.
 */
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

/**
 * Tailwind's colour families. `black` and `white` are here too, and they carry no
 * shade, which is why the shade is optional below.
 */
const COLOUR_FAMILIES = new Set([
  "slate", "gray", "zinc", "neutral", "stone", "red", "orange", "amber", "yellow",
  "lime", "green", "emerald", "teal", "cyan", "sky", "blue", "indigo", "violet",
  "purple", "fuchsia", "pink", "rose", "black", "white",
]);

/**
 * Utility prefixes that can take a colour. Several take a size as well - `text-sm`,
 * `border-2` - so a class counts only once its remainder parses as a colour.
 */
const COLOUR_PREFIXES = new Set([
  "bg", "text", "border", "ring", "fill", "stroke", "divide", "placeholder",
  "outline", "accent", "caret", "decoration", "shadow", "from", "via", "to",
]);

const HEX = /#[0-9a-f]{3,8}\b/i;
const FUNCTIONAL =
  /\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\s*\([^)]*\)?/i;

export interface ColourOptions {
  /**
   * Literals and Tailwind classes this project has decided to keep. Each entry should
   * carry a reviewer's reason in the config beside it; the rule does not read reasons.
   */
  allow?: string[];
}

/** The colour found in a CSS value, or null. Hex first, then functional, then named. */
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

/**
 * The Tailwind class if it sets a colour, or null.
 *
 * Any variant prefix is dropped first, so `hover:bg-red-500` is read as `bg-red-500`.
 * An arbitrary value in brackets is handed to findColourLiteral, which is what catches
 * `bg-[#fff]`.
 */
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
 * eslint types its own nodes on plain ESTree, which has no JSX members, so a rule that
 * visits JSX cannot use `Rule.Node` to read them. The AST is the same object either way;
 * only the two sets of declarations differ. So the nodes are read as `TSESTree`, which
 * does describe JSX, and converted back at the single point eslint demands its own type.
 */
const report = (
  context: Rule.RuleContext,
  at: TSESTree.Node,
  messageId: string,
  value: string,
): void => context.report({ node: at as unknown as Rule.Node, messageId, data: { value } });

/** Every string reachable from a node, with the node each one came from. */
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

/** True for the two emotion and MUI forms: styled.div and styled(Thing). */
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
      // The whole value as well as the match: a project allowing `rgb(0 0 0 / 40%)`
      // writes that, not the substring the regex happened to return.
      if (hit === null || allowed.has(hit) || allowed.has(value)) return;
      report(context, at, "literal", hit);
    };

    // Each handler takes `unknown` because eslint's listener type is keyed on its own
    // ESTree node names, which do not include the JSX ones. The visitor key is what
    // guarantees the node's type; the cast records it.
    return {
      JSXAttribute(node: unknown) {
        const attribute = node as TSESTree.JSXAttribute;
        const name = attribute.name.type === "JSXIdentifier" ? attribute.name.name : "";

        // sx and style are both CSS-value objects, so their strings are CSS values.
        if (name === "sx" || name === "style") {
          if (attribute.value?.type === "JSXExpressionContainer") {
            walkStrings(attribute.value.expression, reportLiteral);
          }
          return;
        }
        if (name !== "className") return;

        // className holds class names, so its strings are split and read as Tailwind.
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
        // styled(Thing)({ color: "red" }) only. styled.div({ ... }) has a member-expression
        // callee and is NOT read here, matching the rule this was ported from.
        const call = node as TSESTree.CallExpression;
        const callee = call.callee;
        if (callee.type !== "CallExpression") return;
        if (callee.callee.type !== "Identifier" || callee.callee.name !== "styled") return;
        for (const argument of call.arguments) walkStrings(argument, reportLiteral);
      },
    };
  },
};
