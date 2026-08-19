#!/bin/bash

# Output the version of VS Code CLI
code --version

echo "Starting VSCODE extension check..."

# List of extensions to verify
extensions=(
    "dbaeumer.vscode-eslint"
    "esbenp.prettier-vscode"
)

# Function to check if an extension is installed
check_extension() {
    local extension=$1
    echo "    Checking: $extension"
    # Use grep to find the extension and handle output manually to avoid SIGPIPE
    if code --list-extensions | grep $extension > /dev/null; then
        echo "    Installed: $extension"
    else
        echo "    Not installed: $extension"
    fi
}

# Iterate over each extension and check it
for ext in "${extensions[@]}"; do
    check_extension $ext
done

echo "    Extension check completed."
