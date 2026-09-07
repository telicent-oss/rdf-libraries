import { RuleTester } from "eslint";

import { tailwindLayoutOnly } from "./tailwind-layout-only";

// eslint 8's RuleTester: it takes `parser` as a resolved path and its options as
// `parserOptions`. The visitor API a rule implements is the same in 8 and 9, and the
// plugin's consumers run 9.
const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
});

// RuleTester builds its own describe/it blocks from the cases and throws on any that
// does not behave as declared, so each run IS the assertion. It must be called at module
// level: wrapping it in an `it` nests a describe inside a test, which jest rejects.
ruleTester.run("tailwind-layout-only", tailwindLayoutOnly, {
  valid: [
    { code: '<div className="flex flex-col gap-4 p-4" />' },
    { code: '<div className="items-center justify-between" />' },
    // An arbitrary value is decided by its prefix.
    { code: '<div className="min-w-[420px] max-h-screen" />' },
    // Variants and negative margins leave the utility unchanged.
    { code: '<div className="md:flex hover:gap-2 -mt-2" />' },
    // The text size scale, which the default option permits.
    { code: '<p className="text-sm" />' },
    // Nothing to inspect.
    { code: "<div />" },
    { code: "<div className={styles.root} />" },
    // A non-className attribute is not this rule's business.
    { code: '<div id="font-medium" />' },
    // Nothing left after stripping a variant or a sign, so it names no utility. Allowed
    // on purpose: reporting a typo as a design-system violation sends the reader to the
    // wrong fix.
    { code: '<div className="- md:" />' },
  ],
  invalid: [
    {
      code: '<div className="font-medium" />',
      errors: [{ messageId: "notLayout", data: { value: "font-medium" } }],
    },
    {
      code: '<ul className="list-none" />',
      errors: [{ messageId: "notLayout", data: { value: "list-none" } }],
    },
    // A colour class is not layout either, so this rule catches it too.
    {
      code: '<div className="text-red-500" />',
      errors: [{ messageId: "notLayout", data: { value: "text-red-500" } }],
    },
    // Every offending class is reported, not just the first.
    {
      code: '<div className="flex font-bold shadow-lg" />',
      errors: [
        { messageId: "notLayout", data: { value: "font-bold" } },
        { messageId: "notLayout", data: { value: "shadow-lg" } },
      ],
    },
    // Reached through a conditional expression, not only a plain literal.
    {
      code: '<div className={wide ? "gap-8" : "font-thin"} />',
      errors: [{ messageId: "notLayout", data: { value: "font-thin" } }],
    },
    // A conditional class written as an object key, which is how clsx and cn take one.
    {
      code: '<div className={clsx({ "font-bold": on, "gap-2": true })} />',
      errors: [{ messageId: "notLayout", data: { value: "font-bold" } }],
    },
    // A template literal, which is how a class list with one interpolated value is
    // usually written. The literal chunks either side of the hole are still classes.
    {
      code: "<div className={`flex ${size} font-bold`} />",
      errors: [{ messageId: "notLayout", data: { value: "font-bold" } }],
    },
    // An array hole. `clsx([, "font-bold"])` leaves a null element in the ESTree array,
    // and the walk has to skip it rather than reading `.type` off nothing.
    {
      code: '<div className={clsx([, "font-bold"])} />',
      errors: [{ messageId: "notLayout", data: { value: "font-bold" } }],
    },
    // Reached through a template literal's interpolation rather than its text.
    {
      code: "<div className={`gap-2 ${wide ? 'shadow-lg' : 'p-4'}`} />",
      errors: [{ messageId: "notLayout", data: { value: "shadow-lg" } }],
    },
    // Opting out of the text size scale.
    {
      code: '<p className="text-sm" />',
      options: [{ allowTextSizes: false }],
      errors: [{ messageId: "notLayout", data: { value: "text-sm" } }],
    },
  ],
});

// The allowlist carries only the shortest prefix of each family, because the matcher
// stops at the first dash boundary that hits: `col` already decides `col-span-2`. These
// are the longer forms that must therefore still be allowed.
ruleTester.run("tailwind-layout-only long-form prefixes", tailwindLayoutOnly, {
  valid: [
    { code: '<div className="col-span-2 col-start-1 col-end-3 row-span-2" />' },
    { code: '<div className="overflow-x-auto overflow-y-hidden" />' },
    { code: '<div className="gap-x-4 gap-y-2" />' },
    { code: '<div className="inset-x-0 inset-y-4" />' },
  ],
  invalid: [],
});

// A project can widen the allowlist for a utility it does not carry yet.
ruleTester.run("tailwind-layout-only extraPrefixes", tailwindLayoutOnly, {
  valid: [
    { code: '<div className="columns-3" />', options: [{ extraPrefixes: ["columns"] }] },
    // `text` reaches the allowlist even though the text-size branch answers for every
    // `text-` class, because extraPrefixes is consulted first.
    { code: '<div className="text-red-500" />', options: [{ extraPrefixes: ["text"] }] },
  ],
  invalid: [],
});

// `content` is align-content, and its values are named in full. Carried as a prefix it
// also admitted `content-['x']`, which sets the CSS content property.
ruleTester.run("tailwind-layout-only align-content", tailwindLayoutOnly, {
  valid: [{ code: '<div className="content-center content-between" />' }],
  invalid: [
    {
      code: "<div className=\"content-['x']\" />",
      errors: [{ messageId: "notLayout", data: { value: "content-['x']" } }],
    },
  ],
});

// `clsx({ underline: on })` and `clsx({ "underline": on })` are the same class written two
// ways. The unquoted form is an Identifier rather than a Literal, and every decoration
// utility that is also a valid JS identifier (`underline`, `italic`, `shadow`, `ring`,
// `uppercase`, `truncate`) is written that way.
ruleTester.run("tailwind-layout-only identifier keys", tailwindLayoutOnly, {
  valid: [
    { code: "<div className={clsx({ flex: yes, hidden: no })} />" },
    // A computed key names no class; whatever `key` holds is not readable here.
    { code: "<div className={clsx({ [key]: on })} />" },
  ],
  invalid: [
    {
      code: "<div className={clsx({ underline: isLink, shadow: on })} />",
      errors: [
        { messageId: "notLayout", data: { value: "underline" } },
        { messageId: "notLayout", data: { value: "shadow" } },
      ],
    },
    {
      // Shorthand: the key is the whole property.
      code: "<div className={clsx({ underline })} />",
      errors: [{ messageId: "notLayout", data: { value: "underline" } }],
    },
  ],
});

// Decoration that opens with a layout prefix, which the prefix scan would let through.
// Two of these carry a colour, which is what the rule exists to stop.
ruleTester.run("tailwind-layout-only decoration under a layout prefix", tailwindLayoutOnly, {
  valid: [
    // The layout families those prefixes exist for.
    { code: '<div className="inset-0 -inset-x-1 inset-y-4 overflow-x-auto" />' },
    // A caller can still opt in, because the deny is checked after extraPrefixes.
    { code: '<div className="inset-shadow-sm" />', options: [{ extraPrefixes: ["inset-shadow"] }] },
  ],
  invalid: [
    {
      code: '<div className="inset-ring-red-500" />',
      errors: [{ messageId: "notLayout", data: { value: "inset-ring-red-500" } }],
    },
    {
      code: '<div className="inset-shadow-red-500/50" />',
      errors: [{ messageId: "notLayout", data: { value: "inset-shadow-red-500/50" } }],
    },
    {
      code: '<div className="overflow-ellipsis" />',
      errors: [{ messageId: "notLayout", data: { value: "overflow-ellipsis" } }],
    },
  ],
});

// Plainly layout, and it must stay allowed. Each false report is a team's reason to switch
// the rule off, and `shrink-0` is among the most-typed flex classes there is.
ruleTester.run("tailwind-layout-only layout that was reported", tailwindLayoutOnly, {
  valid: [
    { code: '<div className="shrink-0 grow-0 grow-[2]" />' },
    { code: '<div className="container @container" />' },
    { code: '<div className="inline-grid flow-root table table-cell list-item" />' },
    { code: '<div className="float-left clear-both box-border" />' },
    { code: '<div className="start-0 end-0" />' },
    { code: '<div className="grid-flow-col auto-cols-fr auto-rows-min columns-2" />' },
    { code: '<div className="scroll-mt-4 translate-x-2" />' },
    { code: '<div className="hover:-translate-y-1" />' },
  ],
  invalid: [],
});

// `!important`: leading in Tailwind 3, trailing in 4. It changes nothing about which
// property the class sets, so it cannot change the verdict either.
ruleTester.run("tailwind-layout-only important marker", tailwindLayoutOnly, {
  valid: [{ code: '<div className="!flex flex! !p-4 md:!flex" />' }],
  invalid: [
    {
      code: '<div className="!font-bold" />',
      errors: [{ messageId: "notLayout", data: { value: "!font-bold" } }],
    },
  ],
});

// A class with no dash in it can be named in extraPrefixes, which is what the rule's own
// error message tells the reader to do.
ruleTester.run("tailwind-layout-only extraPrefixes without a dash", tailwindLayoutOnly, {
  valid: [{ code: '<div className="truncate" />', options: [{ extraPrefixes: ["truncate"] }] }],
  invalid: [
    {
      code: '<div className="truncate" />',
      errors: [{ messageId: "notLayout", data: { value: "truncate" } }],
    },
  ],
});

// box-decoration-* controls how a box-shadow breaks across lines. The `box` prefix is
// there for box-sizing, and admitted it.
ruleTester.run("tailwind-layout-only box-decoration", tailwindLayoutOnly, {
  valid: [{ code: '<div className="box-border box-content" />' }],
  invalid: [
    {
      code: '<div className="box-decoration-clone" />',
      errors: [{ messageId: "notLayout", data: { value: "box-decoration-clone" } }],
    },
  ],
});
