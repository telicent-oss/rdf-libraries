#!/usr/bin/env bash
# Publishes the packages whose npmjs.org names are not provisioned yet to
# GitHub Packages. Interim; deleted along with its workflow once the npmjs.org
# names exist.
#
# Deliberately not lerna. `lerna publish from-package` selects every workspace
# package missing from the target registry, which against an empty GitHub
# Packages registry is all 15, and lerna's publish command takes no package
# filter. pnpm can name exactly the two.
set -euo pipefail

REGISTRY="https://npm.pkg.github.com"

# The only list of what this interim arrangement covers.
PACKAGES=(
  "@telicent-oss/eslint-plugin-ds"
  "@telicent-oss/pull-gitignored"
)

filters=()
for pkg in "${PACKAGES[@]}"; do
  filters+=(--filter "$pkg")
done

# --no-git-checks: pnpm's default publish branch is master, so publishing from
# main or a ticket branch fails the branch check without it.
# No --provenance: that is an npmjs.org attestation and GitHub Packages has no
# equivalent.
# No --force: an already-published version should be skipped, not replaced.
args=(-r publish "${filters[@]}" --registry "$REGISTRY" --no-git-checks)

if [ "${PUBLISH:-false}" != "true" ]; then
  echo "Dry run. Re-run with the publish input checked to publish for real."
  args+=(--dry-run)
fi

# The gate. Nothing here runs in CI, so verifying and publishing are one step
# rather than a habit someone has to remember in the right order.
echo "Verifying before publish"
pnpm -r "${filters[@]}" run lint
pnpm -r "${filters[@]}" run test

echo "Target registry: $REGISTRY"
printf 'Packages: %s\n' "${PACKAGES[*]}"
pnpm "${args[@]}"
