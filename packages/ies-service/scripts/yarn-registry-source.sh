#!/usr/bin/env bash
set -euo pipefail

echo "== Effective Yarn registry =="
yarnRegistry=$(yarn config get registry 2>/dev/null || echo "(yarn not installed)")
echo "yarn config get registry → $yarnRegistry"
echo

echo "== Environment variables =="
[[ -n "${npm_config_registry:-}" ]] && echo "npm_config_registry=$npm_config_registry"
[[ -n "${YARN_REGISTRY:-}" ]] && echo "YARN_REGISTRY=$YARN_REGISTRY"
echo

echo "== Global config files =="
for file in /etc/yarnrc /etc/yarnrc.conf ~/.yarnrc ~/.npmrc; do
  if [[ -r "$file" ]]; then
    echo "→ $file"
    grep -H '^[[:space:]]*[^#].*registry' "$file" || echo "   (no active registry entry)"
  fi
done
echo

echo "== Project‐level config files (from CWD up to /) =="
dir="$PWD"
while [[ "$dir" != "/" ]]; do
  for file in "$dir/.yarnrc" "$dir/.npmrc"; do
    if [[ -r "$file" ]]; then
      echo "→ $file"
      grep -H '^[[:space:]]*[^#].*registry' "$file" || echo "   (no active registry entry)"
    fi
  done
  dir=$(dirname "$dir")
done
