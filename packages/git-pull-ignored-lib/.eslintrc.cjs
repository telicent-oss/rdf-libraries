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
    // Two projects, because tsconfig.json leaves the tests out. eslint refuses to parse
    // a file no project covers, so the tests need tsconfig.spec.json here.
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
