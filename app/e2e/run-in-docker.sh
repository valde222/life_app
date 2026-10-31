#!/bin/sh
# Runs the end-to-end tests inside Playwright's image, for machines without Chromium's system libraries (WSL).
set -e
cd "$(dirname "$0")/.."
repo="$(cd .. && pwd)"
. ./e2e/user.env

docker build -q -t life-pocketbase:e2e ../pocketbase >/dev/null
docker rm -f life-e2e-pocketbase >/dev/null 2>&1 || true
docker run -d --rm --name life-e2e-pocketbase -p 8091:8090 \
  -e PB_USER_EMAIL="$E2E_EMAIL" -e PB_USER_PASSWORD="$E2E_PASSWORD" -e PB_RATE_LIMITS=off life-pocketbase:e2e >/dev/null
trap 'docker stop life-e2e-pocketbase >/dev/null' EXIT

docker run --rm --network host --ipc host --user "$(id -u):$(id -g)" -e HOME=/tmp \
  -e E2E_POCKETBASE_RUNNING=1 -v "$repo":/repo -w /repo/app \
  mcr.microsoft.com/playwright:v1.64.1-noble npx playwright test "$@"
