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
    project: "./tsconfig.json",
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
