#!/usr/bin/env bash
# grab-cookie-line.sh — print the curl line containing -b/--cookie; fail otherwise
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <file>" >&2
  exit 2
fi

FILE="$1"
if [[ ! -f "$FILE" ]]; then
  echo "File not found: $FILE" >&2
  exit 1
fi

LINE="$(grep -E -m1 '(^|[[:space:]])(-b|--cookie)([[:space:]]|$)' "$FILE" || true)"
if [[ -z "$LINE" ]]; then
  echo "No -b/--cookie line found in $FILE" >&2
  exit 1
fi

echo "$LINE"