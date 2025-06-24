#!/bin/bash

PROJECT_DIR="/data/langbridge/frontend/dist"
LOG_FILE="$PROJECT_DIR/output.log"
PORT=3000

cd "$PROJECT_DIR"

# 判断是否有 next-server 在运行
PID=$(pgrep -f "next-server")

if [ -n "$PID" ]; then
  echo "Killing existing Next.js process with PID $PID"
  kill -9 $PID
  sleep 2
else
  echo "No existing Next.js process found"
fi

# 检查端口是否占用（双保险）
EXISTING_PORT_PID=$(lsof -ti tcp:$PORT)
if [ -n "$EXISTING_PORT_PID" ]; then
  echo "Port $PORT is in use by PID $EXISTING_PORT_PID, killing it..."
  kill -9 $EXISTING_PORT_PID
  sleep 1
fi

echo "Starting new Next.js server on port $PORT"
nohup yarn start -p $PORT > "$LOG_FILE" 2>&1 &

sleep 2
NEW_PID=$(pgrep -f "next-server")
if [ -n "$NEW_PID" ]; then
  echo "Next.js started successfully with PID $NEW_PID"
else
  echo "❌ Failed to start Next.js"
fi