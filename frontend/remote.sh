#!/bin/sh
set -e

REMOTE_HOST="contabo"
REMOTE_DIR="/data/langbridge"

echo "start building......"
ssh "${REMOTE_HOST}" "cd ${REMOTE_DIR}/source/languagebridge/frontend && ./build.sh"

echo "restart application......"
ssh "${REMOTE_HOST}" "cd ${REMOTE_DIR}/frontend/dist && ./start.sh"

echo "finished"