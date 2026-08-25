import js from "@eslint/js";

// Flat config, and the only one in this repo: every other package here lints through an
// .eslintrc.cjs. Plain ESM JavaScript, so there is no typed-linting block, which would
// need a tsconfig program this package has no TypeScript to feed.
export default [
  { ignores: ["node_modules/**"] },
  {
    files: ["src/**/*.js"],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-console": "error",
    },
  },
];
