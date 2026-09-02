import { readFileSync } from "node:fs";
// URL comes from node:url too, so this file needs no node globals in the lint config.
import { URL, fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import plugin, { meta, rules } from "./index.js";

const manifest = JSON.parse(
  readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8"),
);

describe("plugin", () => {
  // meta.version is a literal, and release-please bumps package.json without touching
  // source. So the two drift apart silently, and the version ESLint prints in a resolved
  // config stops matching the version that was installed. Asserted rather than read at
  // runtime: importing JSON from source would tie the plugin to an import-attributes
  // syntax that this package's own `engines` range does not cover end to end.
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
