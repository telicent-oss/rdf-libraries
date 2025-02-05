#!/usr/bin/env bash
set -euo pipefail

##
# 1. Ensure npm token is set
##
if [ -z "${NODE_AUTH_TOKEN:-}" ]; then
  echo "Error: NODE_AUTH_TOKEN environment variable is not set. Exiting."
  exit 1
fi

# Configure npm to use the token
npm config set //registry.npmjs.org/:_authToken "$NODE_AUTH_TOKEN"
npm config get registry
# Verify authentication
echo "Checking npm authentication..."
if ! npm whoami &> /dev/null; then
  echo "Error: npm whoami failed. Token may be invalid or missing required permissions."
  exit 1
fi
echo "Authenticated as $(npm whoami)."

##
# 2. Optional build step before publishing
##
echo "Building packages..."
yarn build

##
# 3. Check for uncommitted changes
##
if ! git diff-index --quiet HEAD --; then
  echo "Error: Uncommitted changes detected. Please commit or stash them before publishing."
  exit 1
fi

##
# 4. Compare local versions against the registry
##
REGISTRY_URL=$(npm config get registry || echo "https://registry.npmjs.org/")
echo "Using registry: $REGISTRY_URL"
echo "Comparing local versions to what's published..."

PACKAGES_JSON=$(npx lerna list --json)
echo "$PACKAGES_JSON" | jq -c '.[]' | while read -r pkg; do
  NAME=$(echo "$pkg" | jq -r '.name')
  VERSION=$(echo "$pkg" | jq -r '.version')

  echo "==> Checking $NAME@$VERSION..."
  VERSIONS_JSON=$(npm view "$NAME" versions --json 2>/dev/null || echo "[]")

  if echo "$VERSIONS_JSON" | grep -q "\"$VERSION\""; then
    echo "    Already published on $REGISTRY_URL."
  else
    echo "    NOT published on $REGISTRY_URL (Lerna from-package will publish this version)."
  fi
done

##
# 5. Publish using Lerna from-package
##
echo "Running lerna publish..."
lerna publish from-package \
  --no-private \
  --yes \
  --concurrency 1 \
  --loglevel silly