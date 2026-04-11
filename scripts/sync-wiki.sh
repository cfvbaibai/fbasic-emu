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

# --- Parse frontmatter ---
METADATA=$(mktemp)
trap 'rm -rf "$WIKI_DIR" "$METADATA"' EXIT

month_num() {
  case "$1" in
    January) echo 01;; February) echo 02;; March) echo 03;; April) echo 04;;
    May) echo 05;; June) echo 06;; July) echo 07;; August) echo 08;;
    September) echo 09;; October) echo 10;; November) echo 11;; December) echo 12;;
  esac
}

while IFS= read -r -d '' story; do
  name="${story##*/}"
  name="${name%.md}"
  title=$(sed -n '1{s/^# //;p}' "$story")
  date_line=$(grep '^\*\*Date:\*\*' "$story" | head -1 | sed 's/^\*\*Date:\*\* *//')
  result_line=$(grep '^\*\*Result:\*\*' "$story" | head -1 | sed 's/^\*\*Result:\*\* *//')

  month_name=$(echo "$date_line" | awk '{print $1}')
  day=$(echo "$date_line" | awk '{print $2}' | tr -d ',')
  year=$(echo "$date_line" | awk '{print $NF}')

  sort_key="${year}-$(month_num "$month_name")-$(printf '%02d' "$((10#$day))")"
  month_year="${month_name} ${year}"

  echo "${sort_key}|${name}|${title}|${result_line}|${month_year}"
done < <(find "$STORIES_DIR" -name '*.md' -print0 | sort -z) > "$METADATA"

# --- Generate Home.md ---
{
  echo "# Dev Stories"
  echo ""
  echo "Engineering narratives from the F-BASIC IDE project."
  echo ""
  echo "---"

  current_month=""
  while IFS='|' read -r _ name title result month_year; do
    if [[ "$month_year" != "$current_month" ]]; then
      [ -n "$current_month" ] && { echo ""; echo ""; }
      echo "## $month_year"
      echo ""
      current_month="$month_year"
    fi
    echo "- **[${title}](${name})** — ${result}"
  done < <(sort -t'|' -k1 -r "$METADATA")

  echo ""
  echo "---"
  echo ""
  echo "*Stories are auto-synced from the main repository via GitHub Actions.*"
} > "$WIKI_DIR/Home.md"

# --- Generate _Sidebar.md ---
{
  echo "## Dev Stories"
  echo ""
  echo "**[Home](Home)**"

  current_month=""
  while IFS='|' read -r _ name title result month_year; do
    if [[ "$month_year" != "$current_month" ]]; then
      [ -n "$current_month" ] && { echo ""; echo ""; }
      echo "### $month_year"
      echo ""
      current_month="$month_year"
    fi
    echo "- [${title}](${name})"
  done < <(sort -t'|' -k1 -r "$METADATA")
} > "$WIKI_DIR/_Sidebar.md"

# --- Commit and push ---
git -C "$WIKI_DIR" add -A

if git -C "$WIKI_DIR" diff --cached --quiet; then
  echo "No changes to sync"
  exit 0
fi

git -C "$WIKI_DIR" commit -m "sync: update dev stories $(date -u +%Y-%m-%d)"
git -C "$WIKI_DIR" pull --rebase origin master 2>/dev/null || true
git -C "$WIKI_DIR" push origin master
echo "Wiki synced successfully"
