# @telicent-oss/eslint-plugin-ds

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Node Version](https://img.shields.io/badge/node-%5E20.19.0%20%7C%7C%20%3E%3D22.12.0-brightgreen.svg)

ESLint rules enforcing the Telicent design system manifest.

## Install

Install it from this repository:

```bash
pnpm add -D "telicent-oss/rdf-libraries#path:/packages/eslint-plugin-ds"
```

pnpm records the commit it resolved, so the dependency is pinned. Once the name is
published, this becomes:

```bash
pnpm add -D @telicent-oss/eslint-plugin-ds
```

## `tailwind-layout-only`

The manifest allows Tailwind for layout, size and spacing, and gives typography, colour
and decoration to the design system. This rule reports any class outside that allowance.

It sees string literals and template quasis reachable from a `className` attribute. A class
that arrives through a variable, a tagged template, a spread, or a helper defined in another
file is not inspected, so the rule catches what is written at the call site rather than
everything that reaches the DOM.

```js
import ds from "@telicent-oss/eslint-plugin-ds";

export default [
  {
    files: ["src/**/*.tsx"],
    plugins: { "@telicent-oss/ds": ds },
    rules: { "@telicent-oss/ds/tailwind-layout-only": "error" },
  },
];
```

Allowed, by an allowlist rather than a blocklist: Tailwind's utility surface grows with
every release, so a blocklist silently stops covering what it has never heard of.

```
flex flex-col items-center justify-between   gap-4 p-4 -mt-2 space-y-2
w-full min-w-[420px] max-h-screen            absolute inset-0 z-10 overflow-auto
```

Reported:

```
font-medium   text-red-500   shadow-lg   list-none   rounded-md   opacity-50
```

A responsive or state variant and a negative sign are stripped before the decision, so
`md:hover:flex` and `-mt-2` behave as `flex` and `mt-2`. An arbitrary value needs no
special case: `min-w-[420px]` is decided by `min-w`.

### Options

| Option | Default | Effect |
| --- | --- | --- |
| `allowTextSizes` | `true` | Permits the `text-{xs…9xl}` size scale. Set `false` where the design system owns font size outright. |
| `extraPrefixes` | `[]` | Additional prefixes to treat as layout, for a utility the allowlist does not carry yet. |

`text-` is the one prefix that cannot be allowed wholesale: it spans both size
(`text-sm`) and colour (`text-red-500`), so sizes are opted in by name.

## Tests

`src/rules/*.test.js` drive ESLint's own `RuleTester`, which throws on any case that does
not behave as declared, so each run is the assertion.

```bash
pnpm test
```
