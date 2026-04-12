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
  echo "  release <key> [session]  Remove a lock (verifies ownership if session given)"
  echo "  exists <key>             Check if lock exists (outputs LOCK_EXISTS/LOCK_MISSING)"
  echo "  list [--exclude-session S]  List locked keys, excluding own session and stale locks"
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
  echo "  lock.sh list"
  exit 1
}

cmd_prune() {
  mkdir -p "$LOCK_DIR"
  for LOCK_FILE in "${LOCK_DIR}/"*.lock; do
    [ -f "$LOCK_FILE" ] || continue
    BASENAME=$(basename "$LOCK_FILE" .lock)

    # Derive identifiers from lock key (issue-N or pr-N)
    ISSUE_NUM=$(echo "$BASENAME" | sed -n 's/^issue-//p')
    PR_NUM=$(echo "$BASENAME" | sed -n 's/^pr-//p')

    local SHOULD_PRUNE=false
    local LABEL=""

    if [ -n "$ISSUE_NUM" ]; then
      WT_PATH="${REPO_ROOT}/.automation/worktrees/${ISSUE_NUM}"
      BRANCH=$(git -c safe.directory="$REPO_ROOT" branch -r --list "origin/fix/issue-${ISSUE_NUM}*" --format='%(refname:short)' | head -1)
      if [ ! -d "$WT_PATH" ] && [ -z "$BRANCH" ]; then
        SHOULD_PRUNE=true
        LABEL="issue-${ISSUE_NUM}"
      fi
    elif [ -n "$PR_NUM" ]; then
      # PR locks: prune if the PR is no longer open
      PR_STATE=$(gh pr view "$PR_NUM" --json state --jq '.state' 2>/dev/null || echo "UNKNOWN")
      if [ "$PR_STATE" != "OPEN" ]; then
        SHOULD_PRUNE=true
        LABEL="pr-${PR_NUM}"
      fi
    fi

    if [ "$SHOULD_PRUNE" = true ]; then
      rm -f "$LOCK_FILE"
      echo "PRUNED: ${LABEL}"
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
    # Lock exists — check if owned by this session (re-acquire scenario)
    local OWNER
    OWNER=$(grep -o '"session": "[^"]*"' "$LOCK_FILE" | cut -d'"' -f4)
    if [ "$OWNER" = "$SESSION" ]; then
      # Update claimed timestamp (touch preserves noclobber safety)
      echo "$META" > "$LOCK_FILE"
      echo "LOCK_REACQUIRED"
      return 0
    fi

    # Lock exists — check if stale
    local LOCK_AGE
    LOCK_AGE=$(( $(date +%s) - $(date +%s -r "$LOCK_FILE") ))
    if [ "$LOCK_AGE" -gt "$STALE_THRESHOLD" ]; then
      rm -f "$LOCK_FILE"
      # Add stole_from to metadata
      META=$(echo "$META" | sed "s/}/, \"stole_from\": \"$OWNER\"}/")
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

cmd_list() {
  local EXCLUDE_SESSION=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --exclude-session) EXCLUDE_SESSION="${2:?--exclude-session requires a value}"; shift 2 ;;
      *) echo "Unknown option: $1"; exit 1 ;;
    esac
  done

  mkdir -p "$LOCK_DIR"
  for LOCK_FILE in "${LOCK_DIR}/"*.lock; do
    [ -f "$LOCK_FILE" ] || continue

    # Skip locks owned by the excluded session (caller's own locks — may resume)
    if [ -n "$EXCLUDE_SESSION" ]; then
      local OWNER
      OWNER=$(grep -o '"session": "[^"]*"' "$LOCK_FILE" | cut -d'"' -f4)
      [ "$OWNER" = "$EXCLUDE_SESSION" ] && continue
    fi

    # Skip stale locks (acquire will steal them anyway — no point filtering here)
    local LOCK_AGE
    LOCK_AGE=$(( $(date +%s) - $(date +%s -r "$LOCK_FILE") ))
    [ "$LOCK_AGE" -gt "$STALE_THRESHOLD" ] && continue

    basename "$LOCK_FILE" .lock
  done
}

cmd_release() {
  local KEY="${1:?Lock key required}"
  local SESSION="${2:-}"
  local FORCE=""

  # Parse optional flags
  if [ "$SESSION" = "--force" ]; then
    FORCE="true"
    SESSION=""
  fi

  local LOCK_FILE="${LOCK_DIR}/${KEY}.lock"
  [ -f "$LOCK_FILE" ] || return 0

  # If session provided, verify ownership before releasing
  if [ -n "$SESSION" ] && [ -z "$FORCE" ]; then
    local OWNER
    OWNER=$(grep -o '"session": "[^"]*"' "$LOCK_FILE" | cut -d'"' -f4)
    if [ "$OWNER" != "$SESSION" ]; then
      echo "LOCK_RELEASE_DENIED (owned by $OWNER)"
      return 1
    fi
  fi

  rm -f "$LOCK_FILE"
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
  list)    shift; cmd_list "$@" ;;
  *)      usage ;;
esac
