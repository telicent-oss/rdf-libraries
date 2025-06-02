#!/usr/bin/env bash
set -e

for file in packages/*/package.json; do
  [ -f "$file" ] || continue
  echo "Updating $file"
  
  if [ false ]; then
    # Use jq to add or overwrite the scripts
    jq '.scripts.prepublish = "yarn lint && yarn test" |
        .scripts.prepublishOnly = "yarn build"' \
      "$file" > "$file.tmp" && mv "$file.tmp" "$file"
  fi

  if [ false ]; then
    # Use jq to add or overwrite the scripts
    jq '.devDependencies.eslint = "^8.56.0"' \
      "$file" > "$file.tmp" && mv "$file.tmp" "$file"
  fi

  if [ true ]; then
    jq '.publishConfig.access = "public"' \
      "$file" > "$file.tmp" && mv "$file.tmp" "$file"
  fi
done

echo "Done!"