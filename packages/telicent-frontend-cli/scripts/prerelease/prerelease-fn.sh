#!/bin/zsh
prerelease() {
  # Check for dry run flag
  local dry_run=false
  if [[ "$1" == "-n" || "$1" == "--dry-run" ]]; then
    dry_run=true
    echo "=== DRY RUN MODE ==="
  fi

  # 1. fail on uncommitted changes
  if ! git diff-index --quiet HEAD --; then
    cat <<EOF
WARNING: You have uncommitted changes.
Building a prerelease not against a commit can cause confusion

Type "yes" to acknowledge and continue:
EOF

    read -r answer
    if [ "$answer" != "yes" ]; then
      echo "Aborted: please commit or stash changes first."
      exit 1
    fi
  fi
  # 2. extract JIRA ticket
  local current_branch ticket tagNumber nums highest new_branch version base_version new_version
  current_branch=$(git rev-parse --abbrev-ref HEAD)
  
  # Compatible with both bash and zsh
  if [[ $current_branch =~ ([A-Z]+-[0-9]+) ]]; then
    if [[ -n $BASH_VERSION ]]; then
      ticket=${BASH_REMATCH[1]}
    else
      ticket=$match[1]
    fi
  else
    echo "ERROR: no JIRA ticket"; return 1
  fi

  # 3. get current version and strip prerelease tags
  version=$(jq -r .version package.json)
  name=$(jq -r .name package.json)
  base_version=$(echo "$version" | sed -E 's/^([0-9]+\.[0-9]+\.[0-9]+).*/\1/')

  # 4. list matching prerelease branches → nums array
  nums=(
    $(git branch -a --sort=-committerdate \
      | sed 's/^[* ]*//' \
      | grep -E "prerelease/v${base_version}-${ticket}\.[0-9]+$" \
      | grep -oE '[0-9]+$')
  )

  # 5. compute next tagNumber
  if (( ${#nums[@]} )); then
    highest=$(printf '%s\n' "${nums[@]}" | sort -nr | head -n1)
    tagNumber=$(( highest + 1 ))
  else
    tagNumber=0
  fi

  # 6. set values
  new_branch="prerelease/v${base_version}-${ticket}.${tagNumber}"
  new_version="${base_version}-${ticket}.${tagNumber}"

  if $dry_run; then
    echo "Current branch: $current_branch"
    echo "JIRA ticket: $ticket"
    echo "Current version: $version"
    echo "Base version: $base_version"
    echo "Existing tags: ${nums[@]:-none}"
    echo "Next tag number: $tagNumber"
    echo ""
    echo "Would execute:"
    echo "  git checkout -b $new_branch"
    echo "  Update package.json version: $version → $new_version"
    echo "  git add package.json"
    echo "  git commit -m \"chore(prerelease): v${base_version}-${ticket}.${tagNumber}\" --no-verify"
    echo "  git push --no-verify -u origin $new_branch"
    echo "  git checkout -"
    return 0
  fi

  # Execute commands
  git checkout -b "$new_branch"
  jq ".version = \"${new_version}\"" package.json > package.tmp.json && mv package.tmp.json package.json
  git add package.json
  git commit -m "chore(prerelease): v${base_version}-${ticket}.${tagNumber}" --no-verify
  git push --no-verify -u origin "$new_branch"
  git checkout -

  # outtput
  name=$(jq -r .name package.json)

  if [[ $name == @telicent-oss/* ]]; then
    url="https://github.com/orgs/telicent-oss/repositories?type=source&q="
    keyword=${name#@telicent-oss/}
  else
    url="https://github.com/orgs/Telicent-io/repositories?type=source&q="
    keyword=$name
  fi

  # colours
  RED=$(tput setaf 1)
  GREEN=$(tput setaf 2)
  BLUE=$(tput setaf 4)
  RESET=$(tput sgr0)

  echo -e "1. ${BLUE}🔗 OPEN${RESET} ${GREEN}${url}${keyword}${RESET}"
  echo -e "2. ${BLUE}⚙️  NAV${RESET} to ${RED}Actions${RESET} tab"
  echo -e "3. ${BLUE}📄 NAV${RESET} to ${RED}publish.yaml${RESET}"
  echo -e "4. ${BLUE}▶️ RUN${RESET} with: ${GREEN}${new_branch}${RESET}"
}