#!/bin/sh
# Runs the end-to-end tests inside Playwright's image, for machines without Chromium's system libraries (WSL).
set -e
cd "$(dirname "$0")/.."
repo="$(cd .. && pwd)"
. ./e2e/user.env

PB_USER_EMAIL="$E2E_EMAIL" PB_USER_PASSWORD="$E2E_PASSWORD" PB_ADMIN_EMAIL="$E2E_ADMIN_EMAIL" \
  PB_ADMIN_PASSWORD="$E2E_ADMIN_PASSWORD" PB_RATE_LIMITS=off \
  ../pocketbase/tests/start-server.sh life-e2e-pocketbase 8091
trap 'docker stop life-e2e-pocketbase >/dev/null' EXIT

docker run --rm --network host --ipc host --user "$(id -u):$(id -g)" -e HOME=/tmp \
  -e E2E_POCKETBASE_RUNNING=1 -e VISUAL -v "$repo":/repo -w /repo/app \
  mcr.microsoft.com/playwright:v1.64.1-noble npx playwright test "$@"
