#!/usr/bin/env bash
# set -e  # Exit on error
# set -x  # Print commands and their arguments as they are executed

error_handler() {
  echo "Error occurred at $(date), while executing command: $BASH_COMMAND"
}

trap 'error_handler' ERR

TARGET=$1
shift

# Check if inside an Nx workspace
if [ -f nx.json ]; then
  # Extract the root package name to exclude it from nx run-many to prevent infinite loops
  PACKAGE_NAME=$(node -e "try { console.log(require('./package.json').name); } catch(e) { console.error('Failed to extract package name:', e); process.exit(1); }")
  
  # Run Nx command for all packages except the root, passing additional arguments if provided
  # TODO verify --parallel=1 --skipNxCache=true
  # WHY added to try get CI to pass
  # npx nx run-many --target="$TARGET" --verbose --parallel=1 --skipNxCache=true --exclude="$PACKAGE_NAME" "$@";
  npx lerna exec --parallel --no-bail --ignore "$PACKAGE_NAME" -- "$@"
else
  echo "Not an Nx workspace (nx.json not found), skipping script."
  exit 1
fi