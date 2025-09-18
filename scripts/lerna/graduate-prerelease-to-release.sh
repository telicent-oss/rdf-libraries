#!/usr/bin/env bash
# Graduate prereleases → release, then run `yarn version` (Yarn v1)
# - Only targets packages already on prerelease (x.y.z-*)
# - Interactive per package (wizard). No git tags, no push.
# - Fixes stdin issue: the wizard always reads from the TTY.
# - macOS (bash 3.2) + Ubuntu compatible (no readarray/mapfile used)

set -euo pipefail

err(){ printf "ERROR: %s\n" "$*\n" >&2; exit 1; }
has(){ command -v "$1" >/dev/null 2>&1; }

has node || err "Missing: node"
has yarn || err "Missing: yarn"
has npx  || err "Missing: npx"
has git  || err "Missing: git"
[ -f lerna.json ]   || err "Run from repo root (lerna.json not found)"
[ -f package.json ] || err "Run from repo root (package.json not found)"

if ! git diff --quiet || ! git diff --cached --quiet; then
  [ "${ALLOW_DIRTY:-0}" = "1" ] || err "Working tree not clean. Commit/stash or set ALLOW_DIRTY=1"
fi

JSON="$(npx -y lerna ls --json --no-private 2>/dev/null || true)"
[ -n "$JSON" ] || err "No packages found via Lerna"

# Build a tab-delimited list: name<TAB>location<TAB>version for prerelease packages
LINES="$(
  node -e '
    const fs=require("fs");
    const list=JSON.parse(fs.readFileSync(0,"utf8"));
    for (const p of list) {
      if (p && p.name && p.location && /-/.test(String(p.version||""))) {
        console.log(p.name + "\t" + p.location + "\t" + p.version);
      }
    }
  ' <<<"$JSON"
)"

[ -n "$LINES" ] || { echo "No prerelease packages found. Nothing to do."; exit 0; }

echo "Prerelease packages:"
echo "--------------------"
echo "$LINES" | awk -F'\t' '{printf "  %s  (%s)\n", $1, $3}'
echo "--------------------"
echo

# Option: non-interactive bump (patch|minor|major|prerelease). If not set → wizard per package.
BUMP="${BUMP:-}"; case "$BUMP" in ""|patch|minor|major|prerelease) ;; *) err "Invalid BUMP=$BUMP";; esac

# Feed the loop from FD 3 so FD 0 (stdin) stays as the TTY for yarn's prompt.
exec 3<<<"$LINES"
while IFS=$'\t' read -r name loc ver <&3; do
  [ -n "$name" ] || continue
  [ -d "$loc" ]  || err "Missing package dir for $name: $loc"

  base="${ver%%-*}"   # e.g. 1.2.3-rc.4 -> 1.2.3
  echo "→ $name  $ver  →  $base (strip prerelease), then yarn version…"

  (
    cd "$loc"

    # 1) Write base version into package.json (remove prerelease suffix)
    node -e '
      const fs=require("fs");
      const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
      const v=String(pkg.version||"");
      const base=v.includes("-") ? v.split("-")[0] : v;
      if(!base) { process.stderr.write("Empty version in package.json\n"); process.exit(1); }
      if (base !== v) {
        pkg.version=base;
        fs.writeFileSync("package.json", JSON.stringify(pkg,null,2)+"\n");
      }
    '

    # 2) Yarn v1: run version wizard (reads from the TTY), or non-interactive if BUMP is set
    if [ -n "$BUMP" ]; then
      # Non-interactive: bump kind, no tags
      yarn version "--$BUMP" --no-git-tag-version >/dev/null </dev/tty
    else
      # Interactive: wizard asks "New version:"; user types e.g. 1.2.4
      yarn version --no-git-tag-version </dev/tty
    fi

    printf "   new version: %s\n" "$(node -p 'require("./package.json").version')"
  )
done
exec 3<&-

# Optional single commit (off by default)
if [ "${COMMIT:-0}" = "1" ]; then
  git add -A
  git commit -m "chore(release): graduate prereleases and run yarn version" || true
fi

echo
echo "Done. Prerelease suffixes removed first; yarn version run per package; no tags created; nothing pushed."