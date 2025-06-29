#!/bin/sh
set -e

PROJECT_DIR="/data/langbridge/source/languagebridge/backend" 
OUTPUT_DIR="/data/langbridge/server"
BINARY_NAME="lb-api"

echo "switch direction：$PROJECT_DIR"
cd "$PROJECT_DIR"

echo "pull code for update..."
git fetch origin
git reset --hard origin/main
git clean -fd

echo "start compiling..."
export CGO_ENABLED=1
export GOOS=linux
export GOARCH=amd64

go build -o "$OUTPUT_DIR/$BINARY_NAME" main.go
echo "compiled successfully and moved app to $OUTPUT_DIR/$BINARY_NAME"