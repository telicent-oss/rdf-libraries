#!/usr/bin/env bash
# Check for uncommitted changes in the git working directory
if ! git diff-index --quiet HEAD --; then
    echo "Error: Uncommitted changes detected. Please commit or stash them."
    exit 1
fi

# Run lerna version
lerna version \
    --no-private --yes --exact --conventional-commits --no-git-tag-version \
    --no-push --no-commit-hooks --ignore-changes @telicent-oss/catalogservice;

# Display the diff to show what would be committed
git diff

# Revert changes
git stash push --include-untracked -- \
    ./packages/*/package.json \
    ./packages/*/CHANGELOG.md