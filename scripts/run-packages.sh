#!/usr/bin/env bash
set -e

TARGET=$1
shift

# To get consistent package.json scripts, must exclude root package to avoid nx infinite loops
if [ -f nx.json ]; then
  PACKAGE_NAME=$(node -e "console.log(require('./package.json').name)")
  nx run-many --target=$TARGET --all --verbose --exclude=$PACKAGE_NAME $@;
fi
