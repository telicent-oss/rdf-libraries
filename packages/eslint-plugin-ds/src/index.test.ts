import { readFileSync } from "node:fs";
import { join } from "node:path";

import plugin, { isLayoutUtility, meta, rules } from "./index";

describe("plugin", () => {
  // ESLint keys its cache on meta.name and prints meta.version in a resolved config. Both
  // come from package.json rather than a literal, so a release-please bump cannot leave
  // the source behind; the build inlines them, and `verify-dist` in CI is what stops a
  // stale bundle shipping. Read from disk here, not imported, so the test would still fail
  // if the source went back to a literal.
  it("reports itself as the package it was published as", () => {
    const manifest = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf8"));
    expect(meta).toEqual({ name: manifest.name, version: manifest.version });
  });

  // A rule reachable through the named export but not the default one is invisible to a
  // config written either of the two ways ESLint accepts.
  it("exposes the same rules through both exports", () => {
    expect(Object.keys(plugin.rules)).toEqual(Object.keys(rules));
    expect(Object.keys(rules)).toEqual(["tailwind-layout-only"]);
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
