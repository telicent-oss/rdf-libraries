## @telicent-oss/eslint-plugin-ds

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Node Version](https://img.shields.io/badge/node-%5E20.19.0%20%7C%7C%20%3E%3D22.12.0-brightgreen.svg)

ESLint rules enforcing the Telicent design system manifest: Tailwind may do layout, size and spacing, and nothing else.

## Background

The one rule, `tailwind-layout-only`, reports any class outside that allowance.
Typography, colour and decoration belong to the design system.

It works from an allowlist. Tailwind adds utilities every release, and a blocklist would
miss them.

## Build / Install

```sh
pnpm add -D "telicent-oss/rdf-libraries#path:/packages/eslint-plugin-ds"
```

pnpm pins the commit it resolved. Once the name is published, drop the path:
`pnpm add -D @telicent-oss/eslint-plugin-ds`.

## Usage

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

The plugin name and the severity are the consumer's to choose.

Allowed:

```
flex flex-col items-center justify-between   gap-4 p-4 -mt-2 space-y-2 scroll-mt-4
w-full min-w-[420px] max-h-screen            absolute inset-0 z-10 overflow-auto
shrink-0 grow container inline-grid table    float-left clear-both box-border start-0
```

Reported:

```
font-medium   text-red-500   shadow-lg   list-none   rounded-md   opacity-50
```

A variant, a negative sign and an `!important` marker come off before the decision, so
`md:hover:flex`, `-mt-2` and `!flex` read as `flex`, `mt-2` and `flex`. Arbitrary values
follow their prefix: `min-w-[420px]` is decided by `min-w`.

`inset-ring-*` and `inset-shadow-*` are box-shadows with a colour, and `overflow-ellipsis`
is text-overflow. The `inset` and `overflow` prefixes would admit all three, so they are
denied.

### Options

| Option | Default | Effect |
| --- | --- | --- |
| `allowTextSizes` | `true` | Permits the `text-{xs…9xl}` size scale. `text-` spans size (`text-sm`) and colour (`text-red-500`), so sizes are opted in by name. Set `false` where the design system owns font size. |
| `extraPrefixes` | `[]` | Prefixes or whole class names to treat as layout. `["grid-flow"]` allows `grid-flow-col`; `["truncate"]` allows exactly `truncate`. |

### Limits

The rule reads what is written inside a `className` attribute. It does not resolve
variables, so a class list built above the JSX passes:

```jsx
const classes = clsx("text-red-500");
<div className={classes} />                // not flagged
<div className={clsx("text-red-500")} />   // flagged
<div className={clsx({ underline })} />    // flagged: an object key counts, quoted or not
```

A clean run means nothing inline is wrong. Resolving the variable case needs scope or type
analysis the rule does not do.

## API

`isLayoutUtility(rawClass, options?)` answers the same question for one class, with the
same options, so a codemod or a check over class names held in data needs no ESLint.

```js
import { isLayoutUtility } from "@telicent-oss/eslint-plugin-ds";

isLayoutUtility("gap-4");                                     // true
isLayoutUtility("text-red-500");                              // false
isLayoutUtility("columns-3", { extraPrefixes: ["columns"] });  // true
```

It answers true for a class that names no utility at all (`-`, `md:`), matching the rule:
reporting a typo as a design-system violation sends the reader to the wrong fix.

## Tests

The repo itself uses yarn, so from a clone of it:

```sh
yarn test
yarn coverage
```

`src/rules/*.test.ts` drive ESLint's own `RuleTester`.
