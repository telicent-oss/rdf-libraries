#!/usr/bin/env bash
echo "WARNING: This script is illustrative only."
echo "(which local packages are linked depends on the dev task)"


# Modify for your specific needs and local code
# Usage: $0 link or $0 unlink
action=$1

if [ "$action" != "link" ] && [ "$action" != "unlink" ]; then
    echo "Usage: $0 link|unlink"
    exit 1
fi

yarn $action react
yarn $action react-dom