#!/bin/sh
# Renders every diagram with the Mermaid CLI; a diagram that doesn't parse fails, and so does a file without exactly one.
# Usage: scripts/check-diagrams.sh [folder to keep the rendered images in]
set -eu
cd "$(dirname "$0")/.."
image=minlag/mermaid-cli:11.12.0@sha256:bad64c9d9ad917c8dfbe9d9e9c162b96f6615ff019b37058638d16eb27ce7783
out=$(mktemp -d "${1:-${TMPDIR:-/tmp}}/render.XXXXXX")
chmod 777 "$out"
failed=0
for file in docs/diagrams/*.md; do
  name=$(basename "$file" .md)
  [ "$name" = README ] && continue
  blocks=$(grep -c '^```mermaid$' "$file" || true)
  if [ "$blocks" != 1 ]; then
    echo "FAIL $file: $blocks Mermaid blocks, expected 1"
    failed=1
    continue
  fi
  if docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp -v "$PWD/docs/diagrams":/in:ro -v "$out":/out "$image" \
    -i "/in/$name.md" -o "/out/$name.md" -e png -s 2 >"$out/$name.log" 2>&1 \
    && ls "$out/$name"-*.png >/dev/null 2>&1; then
    echo "ok   $file"
  else
    echo "FAIL $file"
    cat "$out/$name.log"
    failed=1
  fi
done
exit "$failed"
