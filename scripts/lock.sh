#!/usr/bin/env bash
# Lock operations for /implement-issue pipeline.
# Always resolves REPO_ROOT internally — safe to call from any CWD (including worktrees).

set -euo pipefail

# Resolve main repo root (first entry in worktree list is always the main repo)
REPO_ROOT=$(git -c safe.directory="$(pwd)" worktree list --porcelain | head -1 | sed -n 's/^worktree //p')
LOCK_DIR="${REPO_ROOT}/.automation/locks"
STALE_THRESHOLD=7200  # 2 hours in seconds

usage() {
  echo "Usage: lock.sh <command> [args]"
  echo ""
  echo "Commands:"
  echo "  prune                    Remove stale locks (no worktree, no remote branch)"
  echo "  acquire <key> <session>  Atomically acquire a lock (outputs LOCK_ACQUIRED/LOCK_STOLEN/LOCK_BUSY)"
  echo "  release <key>            Remove a lock file"
  echo "  exists <key>             Check if lock exists (outputs LOCK_EXISTS/LOCK_MISSING)"
  echo ""
  echo "Options for acquire:"
  echo "  --pr <N>                 Include PR number in lock metadata"
  echo "  --issue <N>              Include issue number in lock metadata (in addition to key)"
  echo ""
  echo "Examples:"
  echo "  lock.sh prune"
  echo "  lock.sh acquire issue-606 abc-123"
  echo "  lock.sh acquire pr-42 abc-123 --pr 42 --issue 606"
  echo "  lock.sh release issue-606"
  echo "  lock.sh exists issue-606"
  exit 1
}

cmd_prune() {
  mkdir -p "$LOCK_DIR"
  for LOCK_FILE in "${LOCK_DIR}/issue-*.lock"; do
    [ -f "$LOCK_FILE" ] || continue
    ISSUE_NUM=$(basename "$LOCK_FILE" .lock | sed 's/issue-//')
    WT_PATH="${REPO_ROOT}/.automation/worktrees/${ISSUE_NUM}"
    BRANCH=$(git -c safe.directory="$REPO_ROOT" branch -r --list "origin/fix/issue-${ISSUE_NUM}*" --format='%(refname:short)' | head -1)
    if [ ! -d "$WT_PATH" ] && [ -z "$BRANCH" ]; then
      rm -f "$LOCK_FILE"
      echo "PRUNED: issue-${ISSUE_NUM}"
    fi
  done
}

cmd_acquire() {
  local KEY="${1:?Lock key required}"
  local SESSION="${2:?Session ID required}"
  shift 2

  # Parse optional flags
  local PR_NUM=""
  local ISSUE_NUM=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --pr) PR_NUM="${2:?--pr requires a value}"; shift 2 ;;
      --issue) ISSUE_NUM="${2:?--issue requires a value}"; shift 2 ;;
      *) echo "Unknown option: $1"; exit 1 ;;
    esac
  done

  mkdir -p "$LOCK_DIR"
  local LOCK_FILE="${LOCK_DIR}/${KEY}.lock"
  local NOW
  NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)

  # Build lock metadata JSON
  local META="{\"session\": \"$SESSION\", \"claimed\": \"$NOW\""
  [ -n "$PR_NUM" ] && META="$META, \"pr\": $PR_NUM"
  [ -n "$ISSUE_NUM" ] && META="$META, \"issue\": $ISSUE_NUM"
  META="$META}"

  # Atomic lock acquisition via noclobber
  if ( set -o noclobber; echo "$META" > "$LOCK_FILE" ) 2>/dev/null; then
    echo "LOCK_ACQUIRED"
  else
    # Lock exists — check if stale
    local LOCK_AGE
    LOCK_AGE=$(( $(date +%s) - $(date +%s -r "$LOCK_FILE") ))
    if [ "$LOCK_AGE" -gt "$STALE_THRESHOLD" ]; then
      local OLD_SESSION
      OLD_SESSION=$(grep -o '"session": "[^"]*"' "$LOCK_FILE" | cut -d'"' -f4)
      rm -f "$LOCK_FILE"
      # Add stole_from to metadata
      META=$(echo "$META" | sed "s/}/, \"stole_from\": \"$OLD_SESSION\"}/")
      if ( set -o noclobber; echo "$META" > "$LOCK_FILE" ) 2>/dev/null; then
        echo "LOCK_STOLEN (stale: ${LOCK_AGE}s)"
      else
        echo "LOCK_STEAL_FAILED"
      fi
    else
      echo "LOCK_BUSY"
    fi
  fi
}

cmd_release() {
  local KEY="${1:?Lock key required}"
  rm -f "${LOCK_DIR}/${KEY}.lock"
}

cmd_exists() {
  local KEY="${1:?Lock key required}"
  if [ -f "${LOCK_DIR}/${KEY}.lock" ]; then
    echo "LOCK_EXISTS"
  else
    echo "LOCK_MISSING"
  fi
}

case "${1:-}" in
  prune)   shift; cmd_prune "$@" ;;
  acquire) shift; cmd_acquire "$@" ;;
  release) shift; cmd_release "$@" ;;
  exists)  shift; cmd_exists "$@" ;;
  *)      usage ;;
esac
