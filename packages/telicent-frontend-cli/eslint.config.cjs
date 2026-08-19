const tsParser = require('@typescript-eslint/parser');
const prettierPlugin = require('eslint-plugin-prettier');
const tsEslintPlugin = require('@typescript-eslint/eslint-plugin');
const simpleImportSortPlugin = require('eslint-plugin-simple-import-sort');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  { ignores: ['build/', 'dist/', '*.json', 'CHANGELOG.md'] },
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parser: tsParser,
      globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    plugins: {
      '@typescript-eslint': tsEslintPlugin,
      prettier: prettierPlugin,
      'simple-import-sort': simpleImportSortPlugin,
    },
    rules: {
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      'no-unused-vars': 'off', // Disable the core rule
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'comma-dangle': ['error', 'always-multiline'],
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      indent: ['error', 2],
      'eol-last': ['error', 'always'],
      'space-before-blocks': ['error', 'always'],
      'keyword-spacing': ['error', { before: true, after: true }],
      'space-infix-ops': 'error',
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'arrow-spacing': ['error', { before: true, after: true }],
      'block-spacing': ['error', 'always'],
      'brace-style': ['error', '1tbs'],
      'key-spacing': ['error', { beforeColon: false, afterColon: true }],
      'no-multi-spaces': 'error',
      'no-trailing-spaces': 'error',
      'spaced-comment': ['error', 'always', { exceptions: ['-'] }],
      'max-len': ['error', { code: 100, tabWidth: 2, ignoreUrls: true }],
      'arrow-parens': ['error', 'always'],
      // Consistent brace style, but allow single-line if-statements without braces (precedent)
      curly: ['error', 'all'],
    },
    files: ['src/**/*', 'scripts/**/*', '*.js', '*.cjs'],
    ignores: ['coverage/', 'node_modules/', 'build/', 'dist/', '*.json', 'CHANGELOG.md'],
  },
];
