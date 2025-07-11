#!/usr/bin/env bash
set -euo pipefail

license="LICENSE"
[[ -f "$license" ]] || { echo "ERROR: $license not found" >&2; exit 1; }

for dir in packages/*/; do
  [[ -d "$dir" ]] || continue
  cp -pf "$license" "$dir" \
    || { echo "FAIL: could not copy to $dir" >&2; exit 1; }
  echo "Copied LICENSE → ${dir%/}"
done

echo "Done!"
