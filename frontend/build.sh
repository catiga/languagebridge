#!/bin/sh
set -e

PROJECT_DIR="/data/langbridge/source/languagebridge/frontend"
OUTPUT_DIR="/data/langbridge/frontend/dist"

echo "📁 enter project directory: $PROJECT_DIR"
cd "$PROJECT_DIR"

echo "🔄 pull code for update..."
git pull

echo "📦 install dependency..."
if [ -f "yarn.lock" ]; then
  yarn install
else
  npm install
fi

echo "⚙️ start to compile..."
npm run build

echo "🧹 clean the previous cached file..."
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

echo "📁 move app to target directory..."
cp -r build/* "$OUTPUT_DIR/"

echo "✅ successfully deploy to $OUTPUT_DIR"