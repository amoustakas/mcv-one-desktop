#!/usr/bin/env bash
# scripts/new-session.sh
#
# Spin up an isolated worktree for a parallel Claude Code / Cursor
# session. Prevents the "two sessions stomping each other's files"
# class of bug where one session's `git stash push -u` or `git checkout`
# invisibly vanishes another session's in-flight edits.
#
# Usage:
#   ./scripts/new-session.sh              # auto-named session
#   ./scripts/new-session.sh naos-feature # custom slug
#
# After running, open the printed path in a SEPARATE VS Code window
# (File → New Window → Open Folder → paste path) and start Claude Code
# in it. Same .git, same commits, different working tree.

set -euo pipefail

SLUG="${1:-session}"
TIMESTAMP="$(date +%Y-%m-%d-%H%M)"
BRANCH="${SLUG}-${TIMESTAMP}"
PARENT="$(cd "$(dirname "$0")/../.." && pwd)"
WORKTREE_DIR="${PARENT}/mcv-one-desktop-${SLUG}-${TIMESTAMP}"

echo "=== Creating worktree ==="
echo "  branch:    ${BRANCH}"
echo "  path:      ${WORKTREE_DIR}"
echo "  base:      origin/master"
echo ""

# Fetch first so the new branch starts from the freshest master.
git fetch origin master --quiet

# -b creates the branch off origin/master in one atomic operation.
git worktree add -b "${BRANCH}" "${WORKTREE_DIR}" origin/master

echo ""
echo "✓ Worktree ready."
echo ""
echo "Next steps:"
echo "  1. Open a new VS Code window:"
echo "       code \"${WORKTREE_DIR}\""
echo "  2. Start Claude Code in that window."
echo "  3. When done: cd back here and run:"
echo "       git worktree remove \"${WORKTREE_DIR}\""
echo "       git branch -d ${BRANCH}    # if already merged"
echo ""
echo "Active worktrees:"
git worktree list
