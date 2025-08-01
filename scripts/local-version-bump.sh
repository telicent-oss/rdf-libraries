#!/usr/bin/env bash
set -euo pipefail

# -----------------------------------------------------------------------------
# Script: local-version-bump.sh
#
# For the current Git branch, determine a semantic version and update package.json:
#   • Versioned branches: */vX.Y.Z       → sync to X.Y.Z
#   • Ticket branches:   TICKET/...      → append or bump prerelease "-TICKET.N"
#
# Flags:
#   -n, --dry-run    → show intended changes without modifying files
#   --git            → after bump, git-add & git-commit with chore(prerelease)
# -----------------------------------------------------------------------------

DRY_RUN=false
GIT_COMMIT=false

# parse flags
while [[ $# -gt 0 ]]; do
  case $1 in
    -n|--dry-run)
      DRY_RUN=true
      shift
      ;;
    --git)
      GIT_COMMIT=true
      shift
      ;;
    *)
      echo "Unknown flag: $1"
      exit 1
      ;;
  esac
done

# determine_semantic_version:
#  • reads current branch
#  • if branch ends with /vX.Y.Z, returns X.Y.Z
#  • if branch is TICKET/…, returns current-version-TICKET.N (or bump N if already present)
#  • returns non-zero if no rule matches
determine_semantic_version() {
  local git_branch current_version ticket_id release_base prerelease_number new_sem_ver
  git_branch=$(git rev-parse --abbrev-ref HEAD)

  # versioned branches: ends with /vX.Y.Z
  if [[ "$git_branch" == */v* ]]; then
    new_sem_ver=${git_branch##*/v}
    if [[ "$new_sem_ver" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[A-Za-z0-9\.]+)?$ ]]; then
      echo "$new_sem_ver"
      return 0
    fi
  fi

  # ticket branches: TICKET/... 
  if [[ "$git_branch" == */* ]]; then
    ticket_id=${git_branch%%/*}
    current_version=$(jq -r .version package.json)

    # if already suffixed with -TICKET.N, bump N
    if [[ "$current_version" =~ ^([0-9]+\.[0-9]+\.[0-9]+)-${ticket_id}\.([0-9]+)$ ]]; then
      release_base=${BASH_REMATCH[1]}
      prerelease_number=${BASH_REMATCH[2]}
      new_sem_ver="${release_base}-${ticket_id}.$((prerelease_number+1))"
    else
      # first prerelease for this ticket
      new_sem_ver="${current_version}-${ticket_id}.0"
    fi

    echo "$new_sem_ver"
    return 0
  fi

  # no matching branch pattern
  return 1
}

# sync_version: update package.json to target_sem_ver
# commits if --git provided
# !WARNING THIS IS NOT AN APPROPRIATE APPROACH FOR REAL PUBLISHING
# Something chage-aware and dependency-aware would be needed
# e.g. `npx lerna version patch --yes` 
sync_version() {
  local target_sem_ver current_version
  target_sem_ver=$1
  current_version=$(jq -r .version package.json)
  [[ "$current_version" == "$target_sem_ver" ]] && return 0

  if $DRY_RUN; then
    echo "Would update version: $current_version → $target_sem_ver"
  else
    jq --arg v "$target_sem_ver" '.version = $v' package.json > tmp && mv tmp package.json
  fi

  if $GIT_COMMIT; then
    if $DRY_RUN; then
      echo "Would git add --all"
      echo "Would git commit -m \"chore(prerelease): v${target_sem_ver}\" --no-verify"
    else
      git add --all
      git commit -m "chore(prerelease): v${target_sem_ver}" --no-verify
    fi
  fi
}

# main entrypoint
main() {
  if sem_ver=$(determine_semantic_version); then
    sync_version "$sem_ver"
  else
    # no action for other branches
    echo "No version rule for branch '$(git rev-parse --abbrev-ref HEAD)'"
    return 0
  fi
}

main

# -----------------------------------------------------------------------------
# Example transformations:
#
# 1) Branch "v2.3.4"
#    • determine_semantic_version:
#         git_branch = "v2.3.4"
#         matches versioned branch → new_sem_ver = "2.3.4"
#    • sync_version updates to "2.3.4"
#
# 2) Branch "feature/v1.0.1-beta"
#    • git_branch = "feature/v1.0.1-beta"
#    • matches versioned branch → new_sem_ver = "1.0.1-beta"
#
# 3) Branch "TELFE-123/my-feature"
#    • git_branch = "TELFE-123/my-feature"
#    • ticket_id = "TELFE-123"
#    • current_version = "1.0.0"
#    • no existing "-TELFE-123.N" suffix → new_sem_ver = "1.0.0-TELFE-123.0"
#
# 4) Branch "TELFE-123/another-change" when version already "1.0.0-TELFE-123.0"
#    • current_version matches suffix → release_base = "1.0.0", prerelease_number = 0
#    • new_sem_ver = "1.0.0-TELFE-123.1"
# -----------------------------------------------------------------------------
