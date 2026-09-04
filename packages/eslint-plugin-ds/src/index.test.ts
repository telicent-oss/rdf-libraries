import plugin, { configs, isLayoutUtility, meta, rules } from "./index";

import { name, version } from "../package.json";

describe("plugin", () => {
  // ESLint keys its cache on meta.name and prints meta.version in a resolved config, so
  // both are read from the manifest rather than written out here, where release-please
  // would bump one and not the other.
  it("reports itself as the package it was published as", () => {
    expect(meta).toEqual({ name, version });
  });

  // A rule reachable through the named export but not the default one is invisible to a
  // config written either of the two ways ESLint accepts.
  it("exposes the same rules through both exports", () => {
    expect(Object.keys(plugin.rules)).toEqual(Object.keys(rules));
    expect(Object.keys(rules)).toEqual(["tailwind-layout-only"]);
  });

  // The recommended config names the rule in prose, so a rename that misses it ships a
  // config referring to a rule that does not exist.
  it("turns on every rule it ships in the recommended config", () => {
    expect(Object.keys(configs.recommended.rules)).toEqual(
      Object.keys(rules).map((rule) => `@telicent-oss/ds/${rule}`),
    );
    expect(configs.recommended.plugins["@telicent-oss/ds"].meta).toBe(meta);
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
