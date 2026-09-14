import type { Rule } from "eslint";

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

type LooseNode = Record<string, unknown> & { type?: string };
type OnString = (text: string, at: LooseNode) => void;

/** Every string reachable from a node, with the node each one came from. */
function walkStrings(node: unknown, visit: OnString): void {
  if (node === null || typeof node !== "object") return;
  const current = node as LooseNode;
  if (current.type === "Literal" && typeof current.value === "string") {
    visit(current.value, current);
    return;
  }
  if (current.type === "TemplateLiteral") {
    for (const quasi of (current.quasis as LooseNode[] | undefined) ?? []) {
      const cooked = (quasi.value as { cooked?: string } | undefined)?.cooked;
      visit(cooked ?? "", quasi);
    }
    return;
  }
  if (current.type === "ObjectExpression") {
    for (const property of (current.properties as LooseNode[] | undefined) ?? []) {
      if (property.type === "Property") walkStrings(property.value, visit);
      else if (property.type === "SpreadElement") walkStrings(property.argument, visit);
    }
    return;
  }
  if (current.type === "ArrayExpression") {
    for (const element of (current.elements as unknown[] | undefined) ?? []) {
      walkStrings(element, visit);
    }
  }
}

/** True for the two emotion and MUI forms: styled.div and styled(Thing). */
function isStyledTag(tag: LooseNode | undefined): boolean {
  if (!tag) return false;
  const callee = tag.callee as LooseNode | undefined;
  if (tag.type === "CallExpression" && callee?.type === "Identifier") {
    return callee.name === "styled";
  }
  const object = tag.object as LooseNode | undefined;
  return tag.type === "MemberExpression" && object?.type === "Identifier" && object.name === "styled";
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
      context.report({
        node: at as unknown as Rule.Node,
        messageId: "literal",
        data: { value: hit },
      });
    };

    return {
      JSXAttribute(node: unknown) {
        const attribute = node as LooseNode;
        const nameNode = attribute.name as LooseNode | undefined;
        const name = nameNode?.type === "JSXIdentifier" ? (nameNode.name as string) : "";

        // sx and style are both CSS-value objects, so their strings are CSS values.
        if (name === "sx" || name === "style") {
          const value = attribute.value as LooseNode | undefined;
          if (value?.type === "JSXExpressionContainer") {
            walkStrings(value.expression, reportLiteral);
          }
          return;
        }
        if (name !== "className") return;

        // className holds class names, so its strings are split and read as Tailwind.
        const value = attribute.value as LooseNode | undefined;
        const strings: [string, LooseNode][] = [];
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
            context.report({
              node: at as unknown as Rule.Node,
              messageId: "tailwind",
              data: { value: hit },
            });
          }
        }
      },

      TaggedTemplateExpression(node: unknown) {
        const expression = node as LooseNode;
        if (!isStyledTag(expression.tag as LooseNode | undefined)) return;
        const quasi = expression.quasi as LooseNode | undefined;
        for (const chunk of (quasi?.quasis as LooseNode[] | undefined) ?? []) {
          const cooked = (chunk.value as { cooked?: string } | undefined)?.cooked;
          reportLiteral(cooked ?? "", chunk);
        }
      },

      CallExpression(node: unknown) {
        // styled(Thing)({ color: "red" }) only. styled.div({ ... }) has a member-expression
        // callee and is NOT read here, matching the rule this was ported from.
        const call = node as LooseNode;
        const callee = call.callee as LooseNode | undefined;
        const inner = callee?.callee as LooseNode | undefined;
        if (callee?.type !== "CallExpression" || inner?.type !== "Identifier") return;
        if (inner.name !== "styled") return;
        for (const argument of (call.arguments as unknown[] | undefined) ?? []) {
          walkStrings(argument, reportLiteral);
        }
      },
    };
  },
};
