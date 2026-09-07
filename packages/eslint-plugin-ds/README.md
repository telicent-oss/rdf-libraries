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
    rules: { "@telicent-oss/ds/tailwind-layout-only": ["error", { allowTextSizes: false }] },
  },
];
```

The plugin name is the consumer's to choose: `illustrative/hello-world` in the generator
registers it as `ds` and runs it at `warn`, because a design-system violation there is a
note to the developer rather than a broken build.

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

### What it does not see

The rule reads the class names written inside the `className` attribute. It does not
resolve variables, so a class list built above the JSX passes:

```jsx
const classes = clsx("text-red-500");
<div className={classes} />        // not flagged
<div className={clsx("text-red-500")} />   // flagged
```

Resolving that needs scope or type analysis the rule deliberately does not do. Treat a
clean run as "nothing inline is wrong", not as full enforcement.

## Tests

`src/rules/*.test.ts` drive ESLint's own `RuleTester`, which throws on any case that does
not behave as declared, so each run is the assertion. jest with ts-jest, through the
repo's `jest.preset.js`, the same as every other package here.

```bash
yarn test
yarn coverage
```

## Classifying without ESLint

`isLayoutUtility(rawClass, options?)` answers the same question the rule asks, for one
class at a time, and takes the same `LayoutOptions` the rule takes. A codemod or a check of
a class list held in data can use it without loading ESLint.

```js
import { isLayoutUtility } from "@telicent-oss/eslint-plugin-ds";

isLayoutUtility("gap-4");                                  // true
isLayoutUtility("text-red-500");                           // false
isLayoutUtility("columns-3", { extraPrefixes: ["columns"] }); // true
```

It answers true for a class that names no utility at all (`-`, `md:`), matching the rule:
reporting a typo as a design-system violation sends the reader to the wrong fix.
