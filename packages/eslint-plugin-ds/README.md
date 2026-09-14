## @telicent-oss/eslint-plugin-ds

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Node Version](https://img.shields.io/badge/node-%5E20.19.0%20%7C%7C%20%3E%3D22.12.0-brightgreen.svg)

ESLint rules enforcing the Telicent design system manifest: colour comes from the theme, and Tailwind may do layout, size and spacing only.

## Background

Two rules, plus one ban that needs no rule of its own:

| Guardrail | Reports |
| --- | --- |
| `no-colour-literal` | A hex, `rgb()`-style or named CSS colour, and any Tailwind colour class |
| `tailwind-layout-only` | Any Tailwind class outside layout, size and spacing |
| `no-restricted-imports` on `@mui/*` | Reaching past the design system to MUI |

`tailwind-layout-only` works from an allowlist, because Tailwind adds utilities every
release and a blocklist would miss them. `no-colour-literal` works from a list of
colours, which CSS does not add to.

## Install

```sh
pnpm add -D "telicent-oss/rdf-libraries#path:/packages/eslint-plugin-ds"
```

pnpm pins the commit it resolved. Once the name is published, drop the path:
`pnpm add -D @telicent-oss/eslint-plugin-ds`.

## Usage

All three guardrails, at the severities they are meant to run at:

```js
import parser from "@typescript-eslint/parser";
import ds from "@telicent-oss/eslint-plugin-ds";

export default [
  { files: ["src/**/*.{ts,tsx}"], languageOptions: { parser } },
  ...ds.configs.recommended(),
];
```

`recommended` is a function taking ESLint's own config keys:

```js
...ds.configs.recommended({ files: ["apps/hello-world/src/**/*.{ts,tsx}"] })
```

**Pass `files` unless your config sits beside `src/`.** A flat-config pattern resolves
against the directory the config file is in, so the default `src/**` matches nothing from
a config one level up - a monorepo root, say - and a block that matches nothing lints
green with every guardrail switched off.

The block carries rules and `files`, and nothing else. It supplies no parser, so it goes
after a config that does - on its own it reports every `.tsx` as a parsing error. It is
spread rather than imported as a preset, so a later entry can override any of it, and
registering the plugin yourself as well is fine: the object it registers is this
package's default export, so ESLint sees one plugin, not two.

One rule on its own, naming the plugin and the severity yourself:

```js
import ds from "@telicent-oss/eslint-plugin-ds";

export default [
  {
    files: ["src/**/*.tsx"],
    plugins: { ds },
    rules: { "ds/tailwind-layout-only": ["error", { allowTextSizes: false }] },
  },
];
```

### Severities in `recommended`

`no-colour-literal` is an **error**: a colour literal has a design-system answer every
time. The other two are **warnings**, because each is a judgement call - whether a
Tailwind class has a design-system equivalent, and whether the design system covers the
MUI component being reached for. Failing a build on either blocks work that has no fix
yet.

## no-colour-literal

Colour comes from the design system theme. Reported wherever it is written:

```jsx
<div style={{ color: "#ff0000" }} />        // hex
<div sx={{ borderColor: "rgb(1 2 3)" }} />  // rgb, hsl, oklch and the rest
<div style={{ background: "navy" }} />      // a named CSS colour
<div className="bg-red-500" />              // a Tailwind colour class
<div className="hover:bg-[#abc]" />         // a variant, and a hex inside a class
styled.div`color: #fff;`                    // emotion and MUI styled, both forms
```

Not reported: `text-sm` and `border-2`, which are sizes on a prefix that also takes a
colour, and anything read from the theme.

### Options

| Option | Default | Effect |
| --- | --- | --- |
| `allow` | `[]` | Literals and Tailwind classes to permit, matched exactly. Give each entry a reason in a comment beside it; the rule does not read reasons. |

### Limits

Like `tailwind-layout-only`, it reads what is written. It does not follow a variable, and
it does not descend into a function call, so a colour class inside `clsx(...)` is not
reported. `styled.div({ ... })` - the object form on a member expression - is not read
either; the tagged-template form and `styled(Thing)({ ... })` both are.

## tailwind-layout-only

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
`findColourLiteral(cssValue)` and `findTailwindColourClass(rawClass)` do the same for
`no-colour-literal`, each returning the match or `null`.

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
