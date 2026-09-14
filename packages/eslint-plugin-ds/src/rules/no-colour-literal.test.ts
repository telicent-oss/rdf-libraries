import { RuleTester } from "eslint";

import { findColourLiteral, findTailwindColourClass, noColourLiteral } from "./no-colour-literal";

// eslint 8's RuleTester: it takes `parser` as a resolved path and its options as
// `parserOptions`. The visitor API a rule implements is the same in 8 and 9, and the
// plugin's consumers run 9.
const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
});

// RuleTester builds its own describe/it blocks from the cases and throws on any that
// does not behave as declared, so each run IS the assertion. It must be called at module
// level: wrapping it in an `it` nests a describe inside a test, which jest rejects.
ruleTester.run("no-colour-literal", noColourLiteral, {
  valid: [
    // Layout, size and spacing stay Tailwind's, which is the other rule's subject.
    { code: '<div className="flex gap-4 p-2 min-w-[420px]" />' },
    // A size on a prefix that also takes a colour.
    { code: '<p className="text-sm border-2" />' },
    // A family name that is not a colour utility.
    { code: '<div className="grid-cols-2" />' },
    // Colour read from the theme, which is the whole point of the rule.
    { code: "<div style={{ color: theme.palette.primary.main }} />" },
    { code: "const C = styled.div`color: ${({ theme }) => theme.brand};`;" },
    // A non-styled tagged template is nobody's business here.
    { code: "const q = sql`select red from t`;" },
    // The word appears, but not as a whole token.
    { code: '<div style={{ font: "redacted" }} />' },
    // Allowed by the project, named either as the match or as the whole value.
    {
      code: '<div style={{ color: "#ff0000" }} />',
      options: [{ allow: ["#ff0000"] }],
    },
    {
      code: '<div className="bg-red-500" />',
      options: [{ allow: ["bg-red-500"] }],
    },
  ],
  invalid: [
    {
      code: '<div style={{ color: "#ff0000" }} />',
      errors: [{ messageId: "literal", data: { value: "#ff0000" } }],
    },
    {
      code: '<div sx={{ borderColor: "rgb(1 2 3)" }} />',
      errors: [{ messageId: "literal", data: { value: "rgb(1 2 3)" } }],
    },
    {
      code: '<div style={{ background: "rebeccapurple" }} />',
      errors: [{ messageId: "literal", data: { value: "rebeccapurple" } }],
    },
    {
      code: '<div className="bg-red-500" />',
      errors: [{ messageId: "tailwind", data: { value: "bg-red-500" } }],
    },
    // A variant prefix is dropped before the class is read.
    {
      code: '<div className="hover:text-slate-700" />',
      errors: [{ messageId: "tailwind", data: { value: "text-slate-700" } }],
    },
    // No shade, because black and white carry none.
    {
      code: '<div className="bg-white" />',
      errors: [{ messageId: "tailwind", data: { value: "bg-white" } }],
    },
    // An arbitrary value, which is where a hex hides inside a class.
    {
      code: '<div className="bg-[#abc]" />',
      errors: [{ messageId: "tailwind", data: { value: "bg-[#abc]" } }],
    },
    // Class names reached through an expression, not a plain string.
    {
      code: '<div className={["p-2", "fill-lime-300"]} />',
      errors: [{ messageId: "tailwind", data: { value: "fill-lime-300" } }],
    },
    // Both emotion forms: the tagged template and the object argument.
    {
      code: "const C = styled.div`color: #fff;`;",
      errors: [{ messageId: "literal", data: { value: "#fff" } }],
    },
    {
      code: 'const C = styled(Box)({ color: "navy" });',
      errors: [{ messageId: "literal", data: { value: "navy" } }],
    },
    // The allow option is exact, so a different shade is still reported.
    {
      code: '<div className="bg-red-600" />',
      options: [{ allow: ["bg-red-500"] }],
      errors: [{ messageId: "tailwind", data: { value: "bg-red-600" } }],
    },
  ],
});

// Both helpers are exported for callers that want the classification without ESLint, so
// they are called here the way those callers would.
describe("findColourLiteral", () => {
  it("finds a colour whichever way it is written", () => {
    expect(findColourLiteral("#abc")).toBe("#abc");
    expect(findColourLiteral("oklch(0.7 0.1 200)")).toBe("oklch(0.7 0.1 200)");
    expect(findColourLiteral("1px solid teal")).toBe("teal");
  });

  it("returns null when there is none", () => {
    expect(findColourLiteral("1px solid")).toBeNull();
    expect(findColourLiteral("redirect")).toBeNull();
  });
});

describe("findTailwindColourClass", () => {
  it("reads the colour classes", () => {
    expect(findTailwindColourClass("bg-sky-400")).toBe("bg-sky-400");
    expect(findTailwindColourClass("md:hover:ring-black")).toBe("ring-black");
  });

  it("leaves sizes and non-colour prefixes alone", () => {
    expect(findTailwindColourClass("text-sm")).toBeNull();
    expect(findTailwindColourClass("gap-4")).toBeNull();
    // A shade that is not a number, so the remainder does not parse as a colour.
    expect(findTailwindColourClass("bg-red-primary")).toBeNull();
  });
});
