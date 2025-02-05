#!/usr/bin/env bash
set -euo pipefail

#######################################
# 1. Ensure the Yarn/NPM auth token is set
#######################################
if [ -z "${YARN_AUTH_TOKEN:-}" ]; then
  echo "Error: YARN_AUTH_TOKEN environment variable is not set. Exiting."
  exit 1
fi

#######################################
# 2. Configure Yarn registry and token
#######################################
# Yarn v1 uses registry.yarnpkg.com by default, so override it:
yarn config set registry "https://registry.npmjs.org/"

# Add the token to .npmrc (read by Yarn and underlying npm calls)
echo "//registry.npmjs.org/:_authToken=${YARN_AUTH_TOKEN}" >> ~/.npmrc

#######################################
# 3. Build (optional) - If your repo needs a build step here, do it
#######################################
echo "Building packages..."
yarn build  # remove or adjust if not needed

#######################################
# 4. Check for uncommitted changes (optional but recommended)
#######################################
if ! git diff-index --quiet HEAD --; then
  echo "Error: Uncommitted changes detected. Commit or stash them before publishing."
  exit 1
fi

#######################################
# 5. Run Lerna from-package with Yarn
#######################################
echo "Running Lerna publish in from-package mode (Yarn 1.22.x) ..."
# --npm-client yarn ensures it uses Yarn for underlying dependency or lifecycle script calls
yarn lerna publish from-package \
  --npm-client yarn \
  --registry "https://registry.npmjs.org/" \
  --no-private \
  --yes \
  --concurrency 1 \
  --loglevel silly