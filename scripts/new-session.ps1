# scripts/new-session.ps1
#
# PowerShell version of new-session.sh — spins up an isolated worktree
# for a parallel Claude Code / Cursor session on Windows.
#
# Usage (from repo root):
#   pwsh ./scripts/new-session.ps1                  # auto-named
#   pwsh ./scripts/new-session.ps1 -Slug naos-feat  # custom slug
#
# After running, open the printed path in a SEPARATE VS Code window
# and start Claude Code there. Same .git, same commits, different tree.

param(
    [string]$Slug = "session"
)

$ErrorActionPreference = "Stop"

$Timestamp = Get-Date -Format "yyyy-MM-dd-HHmm"
$Branch    = "$Slug-$Timestamp"
$Parent    = (Resolve-Path "$PSScriptRoot\..\..").Path
$Worktree  = Join-Path $Parent "mcv-one-desktop-$Slug-$Timestamp"

Write-Host "=== Creating worktree ===" -ForegroundColor Cyan
Write-Host "  branch:    $Branch"
Write-Host "  path:      $Worktree"
Write-Host "  base:      origin/master"
Write-Host ""

git fetch origin master --quiet
git worktree add -b $Branch $Worktree origin/master

Write-Host ""
Write-Host "✓ Worktree ready." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Open a new VS Code window:"
Write-Host "       code `"$Worktree`""
Write-Host "  2. Start Claude Code in that window."
Write-Host "  3. When done, from this repo:"
Write-Host "       git worktree remove `"$Worktree`""
Write-Host "       git branch -d $Branch    # if merged"
Write-Host ""
Write-Host "Active worktrees:"
git worktree list
