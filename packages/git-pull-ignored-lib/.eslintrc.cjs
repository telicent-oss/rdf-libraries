const exclude = require('../../tsconfig.base.json').exclude;

module.exports =  {
  plugins: [
    "@typescript-eslint/eslint-plugin",
    "eslint-plugin-tsdoc"
  ],
  extends:  [
    'plugin:@typescript-eslint/recommended'
  ],
  ignorePatterns: exclude,
  parser:  '@typescript-eslint/parser',
  parserOptions: {
    // Both projects, unlike the siblings' single "./tsconfig.json": tsconfig.json
    // excludes the tests so tsc does not need the jest types, and eslint lints them
    // anyway. A file in neither project fails to parse rather than going unlinted.
    project: ["./tsconfig.json", "./tsconfig.spec.json"],
    tsconfigRootDir: __dirname,
    ecmaVersion: 2018,
    sourceType: "module"
  },
  rules: {
    "tsdoc/syntax": "warn",
    "@typescript-eslint/no-floating-promises": ["error", {
      "ignoreVoid": false,
      "ignoreIIFE": false
    }]
  }
};
