<#
.SYNOPSIS
    MCV Ecosystem — one-command machine setup (PowerShell / Windows)
.DESCRIPTION
    Mirror of tools/setup-machine.sh for Windows native PowerShell.
    Pins Node 22 + pnpm 9.15.0, clones the 7 core repos, sets up .env stubs.
.EXAMPLE
    .\tools\setup-machine.ps1
.EXAMPLE
    .\tools\setup-machine.ps1 -BaseDir 'C:\mcv' -SkipInstall
#>
[CmdletBinding()]
param(
    [string]$BaseDir = (Join-Path $HOME 'mcv'),
    [string]$NodeVersion = '22',
    [string]$PnpmVersion = '9.15.0',
    [string]$GhOwner = 'amoustakas',
    [switch]$SkipClone,
    [switch]$SkipInstall
)

$ErrorActionPreference = 'Stop'

# Repos: @{ name; defaultBranch; checkoutBranch; category }
$Repos = @(
    @{ name = 'mcv-core-triangle';     defaultBranch = 'main';   checkoutBranch = '';                                       category = 'contract-layer' },
    @{ name = 'mcv-one-desktop';       defaultBranch = 'master'; checkoutBranch = '';                                       category = 'cockpit' },
    @{ name = 'futurestate';           defaultBranch = 'master'; checkoutBranch = '';                                       category = 'venture-rwa' },
    @{ name = 'mcv-gg';                defaultBranch = 'main';   checkoutBranch = 'feature/mcv-gg-desktop-bootstrap';       category = 'venture-web3' },
    @{ name = 'mcv-one-marketing';     defaultBranch = 'main';   checkoutBranch = '';                                       category = 'marketing' },
    @{ name = 'mcv-marketplace';       defaultBranch = 'main';   checkoutBranch = '';                                       category = 'sdk' },
    @{ name = 'mcv-local-ai-factory';  defaultBranch = 'master'; checkoutBranch = '';                                       category = 'factory' }
)

function Write-Stage([string]$msg) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $msg" -ForegroundColor Cyan
}

# ─── PRE-FLIGHT ─────────────────────────────────────────────────────────
Write-Stage "MCV Ecosystem setup — base: $BaseDir"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "git not installed. Install from https://git-scm.com or 'winget install Git.Git'"
}
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "GitHub CLI (gh) not installed. 'winget install GitHub.cli'"
}

# Auth check — non-interactive probe
$ghAuth = & gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Stage "GitHub CLI not authenticated. Running gh auth login..."
    gh auth login
}

# ─── TOOLCHAIN ──────────────────────────────────────────────────────────
Write-Stage "Verifying toolchain (Node $NodeVersion + pnpm $PnpmVersion)..."

$needNode = $true
if (Get-Command node -ErrorAction SilentlyContinue) {
    $current = & node --version
    if ($current -match "^v$NodeVersion") { $needNode = $false }
}

if ($needNode) {
    if (Get-Command fnm -ErrorAction SilentlyContinue) {
        & fnm install $NodeVersion
        & fnm use $NodeVersion
    } elseif (Get-Command nvm -ErrorAction SilentlyContinue) {
        & nvm install $NodeVersion
        & nvm use $NodeVersion
    } elseif (Get-Command volta -ErrorAction SilentlyContinue) {
        & volta install "node@$NodeVersion"
    } else {
        throw "No node version manager. Install fnm via 'winget install Schniz.fnm' or use nvm-windows."
    }
}

# Corepack pins pnpm
& corepack enable
& corepack prepare "pnpm@$PnpmVersion" --activate

Write-Stage "Toolchain: node=$(node --version), pnpm=$(pnpm --version)"

# ─── CLONE ──────────────────────────────────────────────────────────────
if (-not $SkipClone) {
    if (-not (Test-Path $BaseDir)) { New-Item -ItemType Directory -Path $BaseDir | Out-Null }
    Set-Location $BaseDir

    foreach ($r in $Repos) {
        $checkoutMsg = if ($r.checkoutBranch) { ", checkout: $($r.checkoutBranch)" } else { "" }
        Write-Stage "[$($r.category)] $($r.name) (default: $($r.defaultBranch)$checkoutMsg)"

        $repoPath = Join-Path $BaseDir $r.name
        if (Test-Path (Join-Path $repoPath '.git')) {
            Write-Stage "  already cloned, fetching..."
            & git -C $repoPath fetch origin --prune
        } else {
            & gh repo clone "$GhOwner/$($r.name)" -- --depth=1
        }

        if ($r.checkoutBranch) {
            $checkoutResult = & git -C $repoPath checkout $r.checkoutBranch 2>&1
            if ($LASTEXITCODE -ne 0) {
                & git -C $repoPath checkout -b $r.checkoutBranch "origin/$($r.checkoutBranch)"
            }
        }
    }
}

# ─── ENV TEMPLATES ──────────────────────────────────────────────────────
Write-Stage "Checking .env templates (you'll need to fill these in)..."

$desktopEnv = Join-Path $BaseDir 'mcv-one-desktop\.env.local'
if (-not (Test-Path $desktopEnv)) {
    $desktopEnvBody = @'
# ── Server-only LLM/voice keys (Phase-0 safety: NO VITE_ prefix on these) ──
ANTHROPIC_API_KEY=
GOOGLE_AI_KEY=
DEEPGRAM_API_KEY=
ELEVENLABS_API_KEY=

# ── Browser-safe ──
VITE_APP_ENV=development

# ── Server-only (no VITE_ prefix) ──
N8N_BASE_URL=
N8N_API_KEY=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
AGENT_SIGNING_KEY=

# ── Supabase (project: kovsdngjojzfebrxulyj) ──
SUPABASE_URL=https://kovsdngjojzfebrxulyj.supabase.co
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
'@
    Set-Content -Path $desktopEnv -Value $desktopEnvBody -Encoding UTF8
    Write-Stage "  created $desktopEnv"
}

# ─── INSTALL ────────────────────────────────────────────────────────────
if (-not $SkipInstall) {
    foreach ($r in $Repos) {
        $repoPath = Join-Path $BaseDir $r.name
        if (Test-Path (Join-Path $repoPath 'package.json')) {
            Write-Stage "[install] $($r.name)"
            Push-Location $repoPath
            try {
                & pnpm install --frozen-lockfile=false
            } catch {
                Write-Stage "  install warned (continuing): $_"
            } finally {
                Pop-Location
            }
        }
    }
}

# ─── SMOKE ──────────────────────────────────────────────────────────────
Write-Stage "Smoke summary:"
foreach ($r in $Repos) {
    $repoPath = Join-Path $BaseDir $r.name
    if (Test-Path (Join-Path $repoPath '.git')) {
        $branch = & git -C $repoPath branch --show-current
        $head = & git -C $repoPath rev-parse --short HEAD
        Write-Host "  ✓ $($r.name) @ $branch ($head)"
    }
}

@'

═════════════════════════════════════════════════════════════
MCV Ecosystem setup complete.

Next steps:
1. Fill .env.local files with your API keys (see <repo>\.env.example for templates)
2. cd ~\mcv\mcv-one-desktop ; pnpm dev    # boot the cockpit
3. gh pr list --repo amoustakas/mcv-one-desktop   # see open PRs
4. Read MULTI-MACHINE-SETUP.md for full per-repo workflow

Happy ripping. <3
═════════════════════════════════════════════════════════════
'@ | Write-Host
