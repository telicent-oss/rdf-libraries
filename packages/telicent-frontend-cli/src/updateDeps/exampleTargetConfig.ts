export const exampleTargetConfig = {
  '../project-to-update': {
    // the key existence is important
  },
  '../project-to-update-and-install': {
    postUpdateDependency: 'yarn local-install',
  },
};
