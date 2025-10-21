#!/usr/bin/env bash
set -euo pipefail
# Note: auth via gh OIDC "trusted-publisher"

# 1. Configure NPM registry
yarn config set registry "https://registry.npmjs.org/"

yarn lerna run build --stream --no-prefix --concurrency 1  --include-dependencies

# 2. Check for uncommitted changes
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

# 3. Run Lerna from-package with Yarn (authenticates via OIDC Trusted Publisher)
yarn lerna publish from-package \
  --registry "https://registry.npmjs.org/" \
  --no-private \
  --yes \
  --concurrency 1 \
  --loglevel silly