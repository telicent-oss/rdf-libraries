#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ ! -d "$ROOT_DIR/packages" ]; then
  echo "Run this from inside the repo (expected ./packages/… folders)." >&2
  exit 1
fi

problem_dirs=()

for package_dir in "$ROOT_DIR"/packages/*; do
  [ -d "$package_dir" ] || continue

  local_nm="$package_dir/node_modules/@telicent-oss"
  [ -d "$local_nm" ] || continue

  real_children=()
  while IFS= read -r entry; do
    [ -L "$entry" ] || real_children+=("$entry")
  done < <(find "$local_nm" -mindepth 1 -maxdepth 1)

  if ((${#real_children[@]})); then
    problem_dirs+=("$local_nm")
    echo "Found concrete installs under: $local_nm"
    for child in "${real_children[@]}"; do
      echo "  • $(basename "$child") (not a symlink)"
    done
    echo
  fi
done

# Nothing to fix → exit quietly
if ((${#problem_dirs[@]} == 0)); then
  echo "No concrete @telicent-oss installs found under packages/*."
  exit 0
fi

echo "Removing these directories reverts packages back to workspace-linked installs."
read -r -p "Delete the @telicent-oss directories listed above? [y/N] " answer
case "$answer" in
  [Yy]*)
    for dir in "${problem_dirs[@]}"; do
      echo "Removing $dir"
      rm -rf "$dir"
    done
    echo "Cleanup complete. Run 'yarn install' from the repo root to re-link workspaces."
    ;;
  *)
    echo "No changes made."
    ;;
esac