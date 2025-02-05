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

# Run lerna publish
lerna publish from-package --no-private --yes --concurrency 1