#!/bin/sh
set -e
cd "$(dirname "$0")/.."
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d
