import { readFileSync } from "node:fs";
import { join } from "node:path";

import plugin, { configs, isLayoutUtility, meta, rules } from "./index";

describe("plugin", () => {
  // Read from disk, so this still fails if the source goes back to a literal version.
  it("reports itself as the package it was published as", () => {
    const manifest = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf8"));
    expect(meta).toEqual({ name: manifest.name, version: manifest.version });
  });

  it("exposes the same rules through both exports", () => {
    expect(Object.keys(plugin.rules)).toEqual(Object.keys(rules));
    expect(Object.keys(rules)).toEqual(["no-colour-literal", "tailwind-layout-only"]);
  });

  it("switches every rule on in the recommended config", () => {
    const [block] = configs.recommended();
    for (const rule of Object.keys(rules)) {
      expect(block.rules).toHaveProperty(`ds/${rule}`);
    }
  });

  it("keeps each guardrail at the severity it is meant to run at", () => {
    const [block] = configs.recommended();
    const severity = (entry: unknown) => (Array.isArray(entry) ? entry[0] : entry);
    expect(severity(block.rules["ds/no-colour-literal"])).toBe("error");
    expect(severity(block.rules["ds/tailwind-layout-only"])).toBe("warn");
    // Not a rule of this plugin, so no other test would catch it going missing.
    expect(severity(block.rules["no-restricted-imports"])).toBe("warn");
  });

  it("registers the same object it exports by default", () => {
    const [block] = configs.recommended();
    expect(block.plugins.ds).toBe(plugin);
  });

  it("scopes to the files it is given, and to src/ when given none", () => {
    expect(configs.recommended()[0].files).toEqual(["src/**/*.{ts,tsx}"]);
    const scoped = configs.recommended({ files: ["app/src/**/*.tsx"] });
    expect(scoped[0].files).toEqual(["app/src/**/*.tsx"]);
    expect(scoped[0].rules).toEqual(configs.recommended()[0].rules);
  });
});

// Called the way a caller outside ESLint would: one class, no options.
describe("isLayoutUtility", () => {
  it("classifies without being given options", () => {
    expect(isLayoutUtility("gap-4")).toBe(true);
    expect(isLayoutUtility("font-bold")).toBe(false);
    // The text size scale is allowed by default.
    expect(isLayoutUtility("text-sm")).toBe(true);
    expect(isLayoutUtility("text-red-500")).toBe(false);
  });
});
