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
    // Two projects because tsconfig.json leaves the tests out, which keeps the jest types
    // out of the config that builds the shipped code. eslint refuses to parse a file no
    // project covers, so without tsconfig.spec.json the tests break the lint run.
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
