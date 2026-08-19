#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Determine if we should push changes
PUSH=false
if [ "$1" == "--push" ]; then
  PUSH=true
fi

# Check if the current branch is 'main'
current_branch=$(git symbolic-ref --short HEAD)
if [ "$current_branch" != "main" ]; then
  echo "Bump precondition: must be on main"
  exit 1
fi

# Check if the local branch is up-to-date with the remote
git fetch origin
local_commit=$(git rev-parse @)
remote_commit=$(git rev-parse @{u})
if [ "$local_commit" != "$remote_commit" ]; then
  echo "Bump precondition: must be on head of remote"
  exit 1
fi

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
  echo "Bump precondition: no uncommitted changes"
  exit 1
fi

# Check git hook
.husky/pre-commit
.husky/pre-push

# Create a temporary branch
timestamp=$(date +%Y%m%d%H%M%S)
tmp_branch="temp$timestamp"
git checkout -b "$tmp_branch"

# Generate changelog and bump version
pnpm changelog # Ensure this command includes necessary updates
# Check if there are changes in CHANGELOG.md and package.json
if git diff --quiet --exit-code CHANGELOG.md package.json; then
  echo "No changes in CHANGELOG.md or package.json, skipping commit."
else
  # Stage and commit the changes if there are any
  git add CHANGELOG.md package.json
  git commit -m "chore(release): bump version and update changelog"
fi

# Specify the version bump type (patch, minor, major, etc.)
# Rename the temporary branch to a version-specific branch
# yarn v1 prompted for the new version here; pnpm has no interactive wizard, so
# ask for it and pass it through. BUMP may also be set to patch|minor|major.
if [ -z "${BUMP:-}" ]; then
  printf "New version (or patch|minor|major): " >/dev/tty
  read -r BUMP </dev/tty
fi
if [ -z "$BUMP" ]; then
  echo "No version given; aborting before the version bump." >&2
  exit 1
fi

if [ "$PUSH" == true ]; then
    pnpm version "$BUMP"
    version_branch="version/$(node -e "console.log(require('./package.json').version)")"
else
    pnpm version "$BUMP" --no-git-tag-version
    version_branch="test-version/$(node -e "console.log(require('./package.json').version)")"
fi


if [ "$PUSH" == true ]; then
  # Push to main
  git push origin main
  git push --tags
else
  echo "Dry run: Changes committed locally but not pushed"
fi



# Generate changelog again if needed and commit the changes
pnpm changelog
git add CHANGELOG.md package.json
git commit -m "chore(release): update changelog"



git branch -m "$tmp_branch" "$version_branch"

if [ "$PUSH" == true ]; then
  # Push the renamed branch
  git push origin "$version_branch"
  git push --tags
else
  echo "Dry run: Version branch created but not pushed"
fi

# Checkout back to main
git checkout main

if [ "$PUSH" != true ]; then
  echo "Dry run complete. Use --push to actually push changes to the remote repository."
fi