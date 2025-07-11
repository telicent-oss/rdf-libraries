#!/usr/bin/env bash
yarn build

# Check for uncommitted changes in the git working directory
if ! git diff-index --quiet HEAD --; then
    echo "Error: Uncommitted changes detected. Please commit or stash them."
    exit 1
fi

# Run lerna version
lerna version \
    --no-private \
    --conventional-commits \
    --no-git-tag-version \
    --concurrency 1 \
    --no-commit-hooks \
    $@;

./scripts/lerna/check-versions.sh