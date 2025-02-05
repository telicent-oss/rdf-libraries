#!/usr/bin/env bash

# Check if NODE_AUTH_TOKEN is set
if [ -z "$NODE_AUTH_TOKEN" ]; then
    echo "Error: NODE_AUTH_TOKEN is not set. Exiting."
    exit 1
fi

yarn build

# Check for uncommitted changes in the git working directory
if ! git diff-index --quiet HEAD --; then
    echo "Error: Uncommitted changes detected. Please commit or stash them."
    exit 1
fi


# Detect the registry from npm config.
REGISTRY=$(npm config get registry || echo "https://registry.npmjs.org/")

echo "Using registry: $REGISTRY"
echo "Checking local versions against the registry..."

# Loop over all Lerna packages, extracting name and version from package.json
npx lerna list --json | jq -c '.[]' | while read -r pkg; do
  NAME=$(echo "$pkg" | jq -r '.name')
  VERSION=$(echo "$pkg" | jq -r '.version')

  echo "==> Checking $NAME@$VERSION..."

  # Attempt to fetch all versions of this package from the registry
  REGISTRY_VERSIONS="$(npm view "$NAME" versions --json 2>/dev/null || echo "[]")"

  # Check if the local version is in the JSON array of published versions
  if echo "$REGISTRY_VERSIONS" | grep -q "\"$VERSION\""; then
    echo "    Already published in registry."
  else
    echo "    NOT published in registry (Lerna from-package would publish this version)."
  fi
done


# Run lerna publish
lerna publish \
    --no-private --yes --exact --conventional-commits --no-git-tag-version --concurrency 1;
