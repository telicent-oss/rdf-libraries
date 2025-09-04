#!/usr/bin/env bash
set -e  # Exit on error
set -x  # Print commands and their arguments as they are executed

./scripts/sync-versions.mjs
yarn tscNoEmit && yarn lint && yarn test
