import { readFileSync } from "node:fs";
import { join } from "node:path";

import plugin, { configs, isLayoutUtility, meta, rules } from "./index";

describe("plugin", () => {
  // Read from disk rather than imported, so this still fails if the source goes back to a
  // literal version.
  it("reports itself as the package it was published as", () => {
    const manifest = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf8"));
    expect(meta).toEqual({ name: manifest.name, version: manifest.version });
  });

  // A rule reachable through the named export but not the default one is invisible to a
  // config written either of the two ways ESLint accepts.
  it("exposes the same rules through both exports", () => {
    expect(Object.keys(plugin.rules)).toEqual(Object.keys(rules));
    expect(Object.keys(rules)).toEqual(["no-colour-literal", "tailwind-layout-only"]);
  });

  // The recommended block is what most projects consume, so a rule that is not named
  // there ships switched off no matter how good it is.
  it("switches every rule on in the recommended config", () => {
    const [block] = configs.recommended();
    for (const rule of Object.keys(rules)) {
      expect(block.rules).toHaveProperty(`ds/${rule}`);
    }
  });

  // The severities, not only the names. A colour literal has a design-system answer
  // every time, so it fails a build; the other two are judgement calls and cannot.
  // Demoting the first is the silent way this config stops doing its job.
  it("keeps each guardrail at the severity it is meant to run at", () => {
    const [block] = configs.recommended();
    const severity = (entry: unknown) => (Array.isArray(entry) ? entry[0] : entry);
    expect(severity(block.rules["ds/no-colour-literal"])).toBe("error");
    expect(severity(block.rules["ds/tailwind-layout-only"])).toBe("warn");
    // Not a rule of this plugin, so nothing else would catch it going missing.
    expect(severity(block.rules["no-restricted-imports"])).toBe("warn");
  });

  // ESLint compares plugin identity when a config registers one twice, so a `ds` here
  // that is not this package's default export makes "spread recommended AND register
  // ds yourself" a startup crash rather than a working config.
  it("registers the same object it exports by default", () => {
    const [block] = configs.recommended();
    expect(block.plugins.ds).toBe(plugin);
  });

  // A flat-config `files` pattern resolves against the config file's own directory, so a
  // project whose config does not sit beside src/ has to say where its source is. A
  // baked-in pattern would match nothing there and lint green with nothing switched on.
  it("scopes to the files it is given, and to src/ when given none", () => {
    expect(configs.recommended()[0].files).toEqual(["src/**/*.{ts,tsx}"]);
    const scoped = configs.recommended({ files: ["app/src/**/*.tsx"] });
    expect(scoped[0].files).toEqual(["app/src/**/*.tsx"]);
    // Same rules either way: `files` is the only thing the argument changes.
    expect(scoped[0].rules).toEqual(configs.recommended()[0].rules);
  });
});

// isLayoutUtility is exported for callers that want the classification without ESLint,
// so it is called here the way they would: one class, no options.
describe("isLayoutUtility", () => {
  it("classifies without being given options", () => {
    expect(isLayoutUtility("gap-4")).toBe(true);
    expect(isLayoutUtility("font-bold")).toBe(false);
    // The text size scale, which is on by default.
    expect(isLayoutUtility("text-sm")).toBe(true);
    expect(isLayoutUtility("text-red-500")).toBe(false);
  });
});
