#!/usr/bin/env bash
set -euo pipefail

# 1. Ensure the Yarn/NPM auth token is set
if [ -z "${YARN_AUTH_TOKEN:-}" ]; then
  echo "Error: YARN_AUTH_TOKEN environment variable is not set. Exiting."
  exit 1
fi

# 2. Configure Yarn registry and token
yarn config set registry "https://registry.npmjs.org/"
echo "//registry.npmjs.org/:_authToken=${YARN_AUTH_TOKEN}" >> ~/.npmrc

yarn lerna run build --stream --no-prefix --concurrency 1  --include-dependencies

# 4. Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
  git_status=$(git status --short)
  echo "Error: Uncommitted changes detected. Commit or stash them before publishing: $git_status"
  exit 1
fi

# 5. Run Lerna from-package with Yarn
yarn lerna publish from-package \
  --registry "https://registry.npmjs.org/" \
  --no-private \
  --yes \
  --concurrency 1 \
  --loglevel silly