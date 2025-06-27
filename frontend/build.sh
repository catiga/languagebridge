#!/bin/sh

PROJECT_DIR="/data/langbridge/source/languagebridge/frontend"
OUTPUT_DIR="/data/langbridge/frontend/dist"

echo "📁 进入项目目录: $PROJECT_DIR"
cd "$PROJECT_DIR"

echo "🔄 拉取最新代码..."
git fetch origin
git reset --hard origin/main
git clean -fd

echo "📦 安装依赖..."
if [ -f "yarn.lock" ]; then
  yarn install
else
  npm install
fi

echo "⚙️ 编译构建..."
npm run build

echo "🧹 清理目标目录: $OUTPUT_DIR"
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

echo "📁 拷贝运行所需文件到目标目录..."
for item in .next public package.json next.config.js; do
  if [ -e "$item" ]; then
    cp -r "$item" "$OUTPUT_DIR/"
  else
    echo "⚠️ 跳过不存在的文件或目录: $item"
  fi
done

cp -r node_modules "$OUTPUT_DIR/"

echo "✅ 构建完成，运行所需文件已复制至 $OUTPUT_DIR"