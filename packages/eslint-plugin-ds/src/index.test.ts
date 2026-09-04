import { readFileSync } from "node:fs";
import { join } from "node:path";

import plugin, { isLayoutUtility, meta, rules } from "./index";

const manifest = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf8"));

describe("plugin", () => {
  // meta.version is a literal, and release-please bumps package.json without touching
  // source. So the two drift apart silently, and the version ESLint prints in a resolved
  // config stops matching the version that was installed.
  it("reports the version the package was published as", () => {
    expect(meta.version).toBe(manifest.version);
  });

  it("names itself the same as the package, which is how ESLint keys its cache", () => {
    expect(meta.name).toBe(manifest.name);
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
