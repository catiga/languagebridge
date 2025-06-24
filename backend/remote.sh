#!/bin/sh
set -e

REMOTE_HOST="contabo"
REMOTE_DIR="/data/langbridge"

echo "start building......"
ssh "${REMOTE_HOST}" "cd ${REMOTE_DIR}/source/languagebridge/backend && ./build.sh"

echo "restart application......"
ssh "${REMOTE_HOST}" "cd ${REMOTE_DIR}/server && ./start.sh"

echo "finished"