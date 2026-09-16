import { RuleTester } from "eslint";

import { findColourLiteral, findTailwindColourClass, noColourLiteral } from "./no-colour-literal";

// eslint 8's RuleTester takes `parser` as a resolved path and its options as
// `parserOptions`. Consumers of this plugin run eslint 9, where a rule's visitor API
// is unchanged.
const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
});

// Must run at module level. Wrapping this in an `it` nests a describe inside a test,
// which jest rejects.
ruleTester.run("no-colour-literal", noColourLiteral, {
  valid: [
    { code: '<div className="flex gap-4 p-2 min-w-[420px]" />' },
    { code: '<p className="text-sm border-2" />' },
    { code: '<div className="grid-cols-2" />' },
    { code: "<div style={{ color: theme.palette.primary.main }} />" },
    { code: "const C = styled.div`color: ${({ theme }) => theme.brand};`;" },
    { code: "const q = sql`select red from t`;" },
    { code: '<div style={{ font: "redacted" }} />' },
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
    {
      code: '<div className="hover:text-slate-700" />',
      errors: [{ messageId: "tailwind", data: { value: "text-slate-700" } }],
    },
    {
      code: '<div className="bg-white" />',
      errors: [{ messageId: "tailwind", data: { value: "bg-white" } }],
    },
    {
      code: '<div className="bg-[#abc]" />',
      errors: [{ messageId: "tailwind", data: { value: "bg-[#abc]" } }],
    },
    {
      code: '<div className={["p-2", "fill-lime-300"]} />',
      errors: [{ messageId: "tailwind", data: { value: "fill-lime-300" } }],
    },
    {
      code: "const C = styled.div`color: #fff;`;",
      errors: [{ messageId: "literal", data: { value: "#fff" } }],
    },
    {
      code: 'const C = styled(Box)({ color: "navy" });',
      errors: [{ messageId: "literal", data: { value: "navy" } }],
    },
    {
      code: '<div className="bg-red-600" />',
      options: [{ allow: ["bg-red-500"] }],
      errors: [{ messageId: "tailwind", data: { value: "bg-red-600" } }],
    },
  ],
});

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
    expect(findTailwindColourClass("bg-red-primary")).toBeNull();
  });
});
