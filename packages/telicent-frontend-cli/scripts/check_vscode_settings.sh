#!/bin/bash

# Define an array of potential paths to search for settings.json
potential_paths=(
    "$HOME/.config/Code/User/settings.json"  # Default Linux path
    "$HOME/Library/Application Support/Code/User/settings.json"  # macOS path
    "/mnt/c/Users/$USER/AppData/Roaming/Code/User/settings.json"  # Windows WSL path
    "/c/Users/$USER/AppData/Roaming/Code/User/settings.json"  # Windows Git Bash or CMD path
    "/mnt/c/Users/$USER/.vscode/User/settings.json"  # Windows WSL with VSCode Insiders path
    "/c/Users/$USER/.vscode-insiders/User/settings.json"  # Windows Git Bash or CMD with VSCode Insiders path
)

# Check each potential path for settings.json
for path in "${potential_paths[@]}"; do
    if [ -f "$path" ]; then
        SETTINGS_FILE="$path"
        break
    fi
done

# If settings.json is not found, print an error message and exit
if [ -z "$SETTINGS_FILE" ]; then
    echo "settings.json not found."
    exit 1
fi

# Read settings.json and extract relevant settings
settings=$(cat "$SETTINGS_FILE")

# Define the expected settings
expected_settings=$(cat <<EOF
{
  "eslint.enable": true,
  "eslint.packageManager": "npm",
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "editor.codeActionsOnSave.source.fixAll.eslint": true,
  "editor.formatOnSave": true,
  "prettier.enable": true,
  "files.autoSave": "onFocusChange"
}
EOF
)

# Function to compare settings
compare_settings() {
    local actual_value=$(echo "$settings" | jq -r ".$1")
    local expected_value=$(echo "$expected_settings" | jq -r ".$1")
    if [ "$actual_value" == "$expected_value" ]; then
        echo "$1: OK"
    else
        echo "$1: MISMATCH (Expected: $expected_value, Actual: $actual_value)"
    fi
}

# Check each setting
compare_settings "eslint.enable"
compare_settings "eslint.packageManager"
compare_settings "eslint.validate"
compare_settings "editor.codeActionsOnSave.source.fixAll.eslint"
compare_settings "editor.formatOnSave"
compare_settings "prettier.enable"
compare_settings "files.autoSave"
