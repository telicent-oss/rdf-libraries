#!/usr/bin/env bash
yarn build

# Check for uncommitted changes in the git working directory
if ! git diff-index --quiet HEAD --; then
    echo "Error: Uncommitted changes detected. Please commit or stash them."
    exit 1
fi

# Run lerna publish
lerna publish from-package --no-private --yes --no-private  --concurrency 1