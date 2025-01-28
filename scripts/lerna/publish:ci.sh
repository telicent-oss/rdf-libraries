#!/usr/bin/env bash
# Check for uncommitted changes in the git working directory
if ! git diff-index --quiet HEAD --; then
    echo "Error: Uncommitted changes detected. Please commit or stash them."
    exit 1
fi

# Run lerna publish
lerna publish \
    --no-private --yes --exact --conventional-commits --no-git-tag-version --concurrency 1;