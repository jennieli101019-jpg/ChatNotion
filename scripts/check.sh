#!/usr/bin/env bash
# Syntax-check every extension module, then run the test suite.
#
# The glob covers src/*.js only, so vendored bundles under src/vendor/ are skipped and any
# new module is picked up automatically.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 20 ]; then
  printf 'ChatNotion requires Node.js 20 or newer (found %s)\n' "$(node -v)" >&2
  exit 1
fi

count=0
for module in src/*.js; do
  node --check "$module"
  count=$((count + 1))
done
printf 'Syntax OK: %d modules\n\n' "$count"

node --test
