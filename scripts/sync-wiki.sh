#!/usr/bin/env bash
set -euo pipefail

STORIES_DIR="dev-stories"

if [ -z "${WIKI_TOKEN:-}" ] || [ -z "${WIKI_REPO:-}" ]; then
  echo "Error: WIKI_TOKEN and WIKI_REPO env vars required"
  exit 1
fi

WIKI_URL="https://x-access-token:${WIKI_TOKEN}@github.com/${WIKI_REPO}.wiki.git"
WIKI_DIR=$(mktemp -d)
trap 'rm -rf "$WIKI_DIR"' EXIT

[ -d "$STORIES_DIR" ] || { echo "No dev-stories directory"; exit 0; }

# --- Clone wiki repo ---
if git clone --depth 1 "$WIKI_URL" "$WIKI_DIR" 2>/dev/null; then
  echo "Wiki cloned"
else
  echo "Wiki empty or new, initializing"
  git init "$WIKI_DIR"
  git -C "$WIKI_DIR" remote add origin "$WIKI_URL"
fi

# --- Copy new/modified stories ---
while IFS= read -r -d '' story; do
  name="${story##*/}"
  name="${name%.md}"
  target="$WIKI_DIR/${name}.md"
  if ! diff -q "$story" "$target" > /dev/null 2>&1; then
    cp "$story" "$target"
    echo "  Updated: $name"
  fi
done < <(find "$STORIES_DIR" -name '*.md' -print0 | sort -z)

# --- Delete removed stories ---
for page in "$WIKI_DIR"/*.md; do
  [ -f "$page" ] || continue
  name="${page##*/}"
  name="${name%.md}"
  [[ "$name" == "Home" || "$name" == "_Sidebar" ]] && continue
  if ! find "$STORIES_DIR" -name "${name}.md" -print -quit | grep -q .; then
    git -C "$WIKI_DIR" rm -f "${name}.md" 2>/dev/null || rm -f "$page"
    echo "  Removed: $name"
  fi
done
