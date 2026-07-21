/* eslint-disable */
module.exports = {
  displayName: '@telicent-oss/docs-docsify-template',
  testEnvironment: 'node',
  coverageDirectory: '../../coverage/packages/docs-docsify-template',
  collectCoverageFrom: ['template/generate-sidebar.js'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
