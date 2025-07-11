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
    --yes \
    --no-push \
    --no-commit-hooks;

# Display the diff to show what would be committed
git diff && git ls-files --others --exclude-standard | xargs -I {} git diff -- /dev/null {}

# Revert changes
git stash push --include-untracked -- \
    ./packages/*/package.json \
    ./packages/*/CHANGELOG.md