#!/bin/bash

PROJECT_DIR="/data/langbridge/frontend/dist"  # Next.js 编译后的项目根目录
LOG_FILE="$PROJECT_DIR/output.log"
PROCESS_NAME="next start"
PORT=3000

cd "$PROJECT_DIR"

# 查找是否已有 next start 在运行
PID=$(pgrep -f "$PROCESS_NAME")

if [ -n "$PID" ]; then
  echo "Killing existing Next.js process with PID $PID"
  kill -9 $PID
  sleep 2
else
  echo "No existing Next.js process found"
fi

echo "Starting new Next.js server on port $PORT"
nohup yarn start -p $PORT > "$LOG_FILE" 2>&1 &

# 检查是否启动成功
NEW_PID=$(pgrep -f "$PROCESS_NAME")
if [ -n "$NEW_PID" ]; then
  echo "Next.js started successfully with PID $NEW_PID"
else
  echo "Failed to start Next.js"
fi