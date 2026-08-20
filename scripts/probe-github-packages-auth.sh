#!/usr/bin/env bash
# Answers one question before anything is published: does this run have the
# rights to publish @telicent-oss packages to GitHub Packages?
#
# GITHUB_TOKEN is minted per workflow run and needs no administrator to
# provision it, but an organisation can still restrict package creation. This
# tells the two apart instead of leaving a publish failure to be read backwards.
set -uo pipefail

REGISTRY_HOST="npm.pkg.github.com"

if [ -z "${NODE_AUTH_TOKEN:-}" ]; then
  echo "::error title=No token::NODE_AUTH_TOKEN is empty. The workflow must pass secrets.GITHUB_TOKEN."
  exit 1
fi

# A read of a package that does not exist yet. 401/403 means the token is the
# problem; 404 means the token is accepted and the name is simply free.
probe() {
  local pkg="$1"
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' \
    -H "Authorization: Bearer ${NODE_AUTH_TOKEN}" \
    "https://${REGISTRY_HOST}/@telicent-oss%2f${pkg}")
  echo "$code"
}

status=0
for pkg in eslint-plugin-ds pull-gitignored; do
  code=$(probe "$pkg")
  case "$code" in
    404)
      echo "  ${pkg}: HTTP 404 — token accepted, name not yet published. Ready."
      ;;
    200)
      echo "  ${pkg}: HTTP 200 — token accepted, already published."
      ;;
    401)
      echo "::error title=Token rejected::${pkg}: HTTP 401. The token is not accepted by ${REGISTRY_HOST}."
      status=1
      ;;
    403)
      echo "::error title=Forbidden::${pkg}: HTTP 403. The token authenticates but lacks package rights, which usually means an organisation policy blocks it."
      status=1
      ;;
    *)
      echo "::warning title=Unexpected status::${pkg}: HTTP ${code} from ${REGISTRY_HOST}."
      ;;
  esac
done

exit $status
