import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";
import { describe, it } from "vitest";
import { tailwindLayoutOnly } from "./tailwind-layout-only.js";

const ruleTester = new RuleTester({
  languageOptions: { parser: tsParser, parserOptions: { ecmaFeatures: { jsx: true } } },
});

// RuleTester throws on a failing case, so each run IS the assertion.
describe("tailwind-layout-only", () => {
  it("allows layout, size and spacing; rejects everything else", () => {
    ruleTester.run("tailwind-layout-only", tailwindLayoutOnly, {
      valid: [
        { code: '<div className="flex flex-col gap-4 p-4" />' },
        { code: '<div className="items-center justify-between" />' },
        // An arbitrary value is decided by its prefix.
        { code: '<div className="min-w-[420px] max-h-screen" />' },
        // Variants and negative margins leave the utility unchanged.
        { code: '<div className="md:flex hover:gap-2 -mt-2" />' },
        // The text size scale, which the default option permits.
        { code: '<p className="text-sm" />' },
        // Nothing to inspect.
        { code: "<div />" },
        { code: "<div className={styles.root} />" },
        // A non-className attribute is not this rule's business.
        { code: '<div id="font-medium" />' },
      ],
      invalid: [
        {
          code: '<div className="font-medium" />',
          errors: [{ messageId: "notLayout", data: { value: "font-medium" } }],
        },
        {
          code: '<ul className="list-none" />',
          errors: [{ messageId: "notLayout", data: { value: "list-none" } }],
        },
        // A colour class is not layout either, so this rule catches it too.
        {
          code: '<div className="text-red-500" />',
          errors: [{ messageId: "notLayout", data: { value: "text-red-500" } }],
        },
        // Every offending class is reported, not just the first.
        {
          code: '<div className="flex font-bold shadow-lg" />',
          errors: [
            { messageId: "notLayout", data: { value: "font-bold" } },
            { messageId: "notLayout", data: { value: "shadow-lg" } },
          ],
        },
        // Reached through a conditional expression, not only a plain literal.
        {
          code: '<div className={wide ? "gap-8" : "font-thin"} />',
          errors: [{ messageId: "notLayout", data: { value: "font-thin" } }],
        },
        // A conditional class written as an object key, which is how clsx and cn take one.
        {
          code: '<div className={clsx({ "font-bold": on, "gap-2": true })} />',
          errors: [{ messageId: "notLayout", data: { value: "font-bold" } }],
        },
        // Opting out of the text size scale.
        {
          code: '<p className="text-sm" />',
          options: [{ allowTextSizes: false }],
          errors: [{ messageId: "notLayout", data: { value: "text-sm" } }],
        },
      ],
    });
  });

  it("lets a project widen the allowlist", () => {
    ruleTester.run("tailwind-layout-only", tailwindLayoutOnly, {
      valid: [
        { code: '<div className="columns-3" />', options: [{ extraPrefixes: ["columns"] }] },
      ],
      invalid: [],
    });
  });
});
