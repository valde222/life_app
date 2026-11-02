#!/bin/sh
# Builds the PocketBase image and starts a throwaway, hardened server for tests.
# Usage: start-server.sh <container name> <host port>
# Passes PB_USER_EMAIL, PB_USER_PASSWORD, PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD and PB_RATE_LIMITS through.
set -e
cd "$(dirname "$0")/.."
name="$1"
port="$2"

docker build -q -t life-pocketbase:test . >/dev/null
docker rm -f "$name" >/dev/null 2>&1 || true
docker run -d --rm --name "$name" --read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges \
  -v /pb/pb_data -p "$port:8090" \
  -e PB_USER_EMAIL -e PB_USER_PASSWORD -e PB_ADMIN_EMAIL -e PB_ADMIN_PASSWORD -e PB_RATE_LIMITS \
  life-pocketbase:test >/dev/null
timeout 60 sh -c "until wget -q --spider http://localhost:$port/api/health; do sleep 1; done"
