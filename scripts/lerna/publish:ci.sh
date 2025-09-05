#!/usr/bin/env bash
set -euo pipefail

# 1. Ensure the Yarn/NPM auth token is set
if [ -z "${YARN_AUTH_TOKEN:-}" ]; then
  echo "Error: YARN_AUTH_TOKEN environment variable is not set. Exiting."
  exit 1
fi

# 2. Configure Yarn registry and token
yarn config set registry "https://registry.npmjs.org/"
echo "//registry.npmjs.org/:_authToken=${YARN_AUTH_TOKEN}" >> ~/.npmrc

yarn lerna run build --stream --no-prefix --concurrency 1  --include-dependencies

# 4. Check for uncommitted changes
git update-index -q --refresh || true
if ! git diff-index --quiet HEAD --; then
  echo "::error title=Uncommitted changes detected::Commit or stash them before publishing."

  # Always show a concise, machine-stable list in CI logs
  echo "::group::git status --porcelain (working tree)"
  git -c core.quotePath=false status --porcelain=v1 --untracked-files=all || true
  echo "::endgroup::"

  # Also show names + change types for quick scanning
  echo "::group::git diff --name-status (tracked changes)"
  git diff --name-status --relative || true
  echo "::endgroup::"

  # Write to GitHub Step Summary if available
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    {
      echo "### Uncommitted changes"
      echo
      echo '```text'
      git -c core.quotePath=false status --porcelain=v1 --untracked-files=all || true
      echo '```'
      echo
      echo "#### Tracked file changes"
      echo
      echo '```text'
      git diff --name-status --relative || true
      echo '```'
    } >> "$GITHUB_STEP_SUMMARY"
  fi

  exit 1
fi

# 5. Run Lerna from-package with Yarn
yarn lerna publish from-package \
  --registry "https://registry.npmjs.org/" \
  --no-private \
  --yes \
  --concurrency 1 \
  --loglevel silly