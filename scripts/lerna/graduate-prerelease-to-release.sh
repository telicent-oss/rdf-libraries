#!/usr/bin/env bash
# Goal: open the Lerna **wizard** ONLY for prerelease packages,
# so you can choose PATCH (e.g. 1.0.0-xxx → 1.0.1) and avoid 1.0.0 collisions.
# No publish. No conventional-commits. No Corepack gate. **No tags created.**

# 1) Build a comma-separated list of packages whose version contains a hyphen (i.e., prerelease)
PRERELEASE_PKGS=$(
  npx lerna ls --json | node -e '
    const fs=require("fs");
    const pkgs=JSON.parse(fs.readFileSync(0,"utf8"));
    const names=pkgs.filter(p=>!p.private && /-/.test(String(p.version))).map(p=>p.name);
    process.stdout.write(names.join(","));
  '
)

# 2) Run the interactive version **wizard** for just those packages
#    (no auto graduation, no changelog diffing, no push, **no git tags**)
if [ -n "$PRERELEASE_PKGS" ]; then
  COREPACK_ENABLE_PROJECT_SPEC=0 COREPACK_ENABLE_STRICT=0 \
  npx lerna version \
    --force-publish "$PRERELEASE_PKGS" \
    --no-git-tag-version \
    --no-push
else
  echo "No prerelease packages found."
fi