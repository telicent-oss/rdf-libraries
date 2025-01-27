#!/usr/bin/env bash
# Example Bash script to open all .js files in the current directory
for file in ./packages/*/scripts/use-links-to-local-packages.sh; do
  code "$file" -r  # -r flag to reuse the window
done