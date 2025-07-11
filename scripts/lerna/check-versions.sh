#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "Checking package versions are valid"
echo

lerna ls --json | jq -r '.[] | "\(.name) \(.version) \(.location)"' | while read -r pkg_name pkg_version pkg_location; do
  # Only check if package.json has been changed relative to HEAD
  if git diff --quiet HEAD "$pkg_location/package.json"; then
    echo "$pkg_name"
    printf "      SKIP package.json not changed"
    echo
    continue
  fi

  registry_version=$(npm show "$pkg_name" version 2>/dev/null | xargs || echo "")

  if [ -z "$registry_version" ]; then
    echo "$pkg_name"
    printf "      Not published -> $pkg_version ${GREEN}OK - First time publish${NC}"
  else
    if npx semver -r ">$registry_version" "$pkg_version" >/dev/null 2>&1; then
      echo "$pkg_name"
      printf "      $registry_version -> $pkg_version ${GREEN}OK${NC}"
    else
      echo "$pkg_name"
      printf "      $registry_version -> $pkg_version ${RED}INVALID - bump then run${NC} ./scripts/lerna/check-versions.sh"
    fi
  fi
  echo
done