#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="$(sed -n 's/.*"version": "\([^"]*\)".*/\1/p' "$ROOT_DIR/manifest.json" | head -n 1)"
OUTPUT_DIR="$ROOT_DIR/dist"
OUTPUT_FILE="$OUTPUT_DIR/ChatNotion-$VERSION.zip"
UNPACKED_DIR="$OUTPUT_DIR/ChatNotion-$VERSION"
STAGING_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$STAGING_DIR"
}
trap cleanup EXIT

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR" "$STAGING_DIR/src" "$STAGING_DIR/icons"
cp "$ROOT_DIR/manifest.json" "$STAGING_DIR/manifest.json"
cp "$ROOT_DIR/LICENSE" "$ROOT_DIR/PRIVACY.md" "$STAGING_DIR/"
# -R so nested asset directories (src/vendor/katex/fonts) ship too.
cp -R "$ROOT_DIR"/src/. "$STAGING_DIR/src/"
cp "$ROOT_DIR"/icons/icon16.png "$ROOT_DIR"/icons/icon32.png "$ROOT_DIR"/icons/icon48.png "$ROOT_DIR"/icons/icon128.png "$STAGING_DIR/icons/"

rm -rf "$UNPACKED_DIR"
mkdir -p "$UNPACKED_DIR"
cp -R "$STAGING_DIR"/. "$UNPACKED_DIR"/

rm -f "$OUTPUT_FILE"
(
  cd "$STAGING_DIR"
  zip -qr "$OUTPUT_FILE" manifest.json LICENSE PRIVACY.md src icons
)

printf '%s\n' "$UNPACKED_DIR"
printf '%s\n' "$OUTPUT_FILE"
