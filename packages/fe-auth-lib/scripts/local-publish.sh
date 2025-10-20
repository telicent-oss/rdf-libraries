#!/usr/bin/env zsh
set -euo pipefail

DRY_RUN=false
GIT=false

# parse flags
while [[ $# -gt 0 ]]; do
  case $1 in
    -n|--dry-run) DRY_RUN=true; shift ;;
    --git)        GIT=true;      shift ;;
    *)            echo "Unknown flag: $1"; exit 1 ;;
  esac
done

get_branch_semver() {
  local br sem
  br=$(git rev-parse --abbrev-ref HEAD)
  [[ "$br" == */v* ]] || return 1
  sem=${br##*/v}
  [[ "$sem" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[A-Za-z0-9\.]+)?$ ]] && print "$sem"
}

sync_version() {
  local target current
  target=$1
  current=$(jq -r .version package.json)
  [[ "$current" == "$target" ]] && return

  $DRY_RUN && echo "Would update version: $current → $target" || \
    ( jq --arg v "$target" '.version = $v' package.json > tmp && mv tmp package.json )

  if $GIT; then
    $DRY_RUN && echo "Would git add --all" && echo "Would git commit -m \"chore(prerelease): v${target}\" --no-verify" || \
      ( git add --all && git commit -m "chore(prerelease): v${target}" --no-verify )
  fi
}

bump_prerelease() {
  if $DRY_RUN; then
    echo "Would run: npm version prerelease --no-git-tag-version"
    $GIT && echo "Would git add --all" && echo "Would git commit -m \"chore(prerelease): <newver>\" --no-verify"
  else
    newver=$(npm version prerelease --no-git-tag-version)
    if $GIT; then
      git add --all
      git commit -m "chore(prerelease): ${newver}" --no-verify
    fi
  fi
}

publish_prerelease() {
  if $DRY_RUN; then
    echo "Would run: yarn build"
    echo "Would run: npm publish --registry http://localhost:4873 --prepatch"
  else
    yarn build
    npm publish --registry http://localhost:4873 --prepatch
  fi
}

main() {
  if sem=$(get_branch_semver); then
    sync_version "$sem"
  else
    bump_prerelease
  fi
  publish_prerelease
}

main