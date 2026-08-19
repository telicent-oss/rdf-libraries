module.exports = {
  types: [
    { type: 'build', section: 'Build System' },
    { type: 'ci', section: 'CI' },
    { type: 'docs', section: 'Documentation' },
    { type: 'feat', section: 'Features' },
    { type: 'update', section: 'Updates' },
    { type: 'style', section: 'Style' },
    { type: 'fix', section: 'Bug Fixes' },
    { type: 'perf', section: 'Performance' },
    { type: 'refactor', section: 'Refactor' },
  ],
  commitUrlFormat: 'https://telicent-oss/telicent-frontend-cli/commit/{{hash}}',
  compareUrlFormat:
    'https://telicent-oss/telicent-frontend-cli/compare/{{previousTag}}...{{currentTag}}',
  issueUrlFormat: 'https://telicent-oss/telicent-frontend-cli/issues/{{id}}',
  userUrlFormat: 'https://github.com/{{user}}',
};
