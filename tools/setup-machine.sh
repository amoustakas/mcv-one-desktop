#!/usr/bin/env bash
# MCV Ecosystem — one-command machine setup
# Drop this on a fresh machine. Bring your auth tokens. Take coffee.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/amoustakas/mcv-one-desktop/master/tools/setup-machine.sh | bash
#   # OR after cloning mcv-one-desktop:
#   ./tools/setup-machine.sh [--base-dir ~/mcv] [--skip-clone] [--skip-install]

set -euo pipefail

# ─── CONFIG ───────────────────────────────────────────────────────────
BASE_DIR="${MCV_BASE_DIR:-$HOME/mcv}"
NODE_VERSION="22"
PNPM_VERSION="9.15.0"
GH_OWNER="${GH_OWNER:-amoustakas}"
SKIP_CLONE=false
SKIP_INSTALL=false

# Repos to clone — name, default branch, post-clone branch (if any), category
# format: "repo-name|default-branch|optional-checkout-branch|category"
REPOS=(
  "mcv-core-triangle|main||contract-layer"
  "mcv-one-desktop|master||cockpit"
  "futurestate|master||venture-rwa"
  "mcv-gg|main|feature/mcv-gg-desktop-bootstrap|venture-web3"
  "mcv-one-marketing|main||marketing"
  "mcv-marketplace|main||sdk"
  "mcv-local-ai-factory|master||factory"
)

# ─── ARGS ──────────────────────────────────────────────────────────────
while [ $# -gt 0 ]; do
  case "$1" in
    --base-dir) BASE_DIR="$2"; shift 2 ;;
    --skip-clone) SKIP_CLONE=true; shift ;;
    --skip-install) SKIP_INSTALL=true; shift ;;
    --gh-owner) GH_OWNER="$2"; shift 2 ;;
    -h|--help)
      grep '^#' "$0" | head -20
      exit 0
      ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

log() { echo "[$(date +%H:%M:%S)] $*"; }
err() { echo "ERROR: $*" >&2; exit 1; }

# ─── PRE-FLIGHT ────────────────────────────────────────────────────────
log "MCV Ecosystem setup — base: $BASE_DIR"

command -v git >/dev/null || err "git not installed"
command -v gh  >/dev/null || err "GitHub CLI (gh) not installed — install from https://cli.github.com"

if ! gh auth status >/dev/null 2>&1; then
  log "GitHub CLI not authenticated. Running gh auth login..."
  gh auth login
fi

# ─── TOOLCHAIN ─────────────────────────────────────────────────────────
log "Verifying toolchain (Node $NODE_VERSION + pnpm $PNPM_VERSION)..."

if ! command -v node >/dev/null || [[ ! "$(node --version)" =~ ^v$NODE_VERSION ]]; then
  log "Installing Node $NODE_VERSION via nvm/fnm/volta..."
  if command -v fnm >/dev/null; then
    fnm install "$NODE_VERSION" && fnm use "$NODE_VERSION"
  elif command -v nvm >/dev/null; then
    nvm install "$NODE_VERSION" && nvm use "$NODE_VERSION"
  elif command -v volta >/dev/null; then
    volta install "node@$NODE_VERSION"
  else
    err "No node version manager found. Install fnm: https://github.com/Schniz/fnm"
  fi
fi

# Corepack handles pnpm version pinning
corepack enable
corepack prepare "pnpm@$PNPM_VERSION" --activate

log "Toolchain: node=$(node --version), pnpm=$(pnpm --version)"

# ─── CLONE ─────────────────────────────────────────────────────────────
if [ "$SKIP_CLONE" = false ]; then
  mkdir -p "$BASE_DIR"
  cd "$BASE_DIR"

  for entry in "${REPOS[@]}"; do
    IFS='|' read -r name default_branch checkout_branch category <<< "$entry"
    log "[$category] $name (default: $default_branch${checkout_branch:+, checkout: $checkout_branch})"
    if [ -d "$name/.git" ]; then
      log "  already cloned, fetching..."
      git -C "$name" fetch origin --prune
    else
      gh repo clone "$GH_OWNER/$name" -- --depth=1
    fi
    if [ -n "$checkout_branch" ]; then
      git -C "$name" checkout "$checkout_branch" 2>/dev/null \
        || git -C "$name" checkout -b "$checkout_branch" "origin/$checkout_branch"
    fi
  done
fi

# ─── ENV TEMPLATES ─────────────────────────────────────────────────────
log "Checking .env templates (you'll need to fill these in)..."

write_env_if_missing() {
  local path="$1"
  local template="$2"
  if [ ! -f "$path" ]; then
    log "  creating $path from template"
    echo "$template" > "$path"
  else
    log "  exists: $path (not overwriting)"
  fi
}

# Example for mcv-one-desktop — extend per repo
write_env_if_missing "$BASE_DIR/mcv-one-desktop/.env.local" "$(cat <<'EOF'
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
EOF
)"

# ─── INSTALL ───────────────────────────────────────────────────────────
if [ "$SKIP_INSTALL" = false ]; then
  for entry in "${REPOS[@]}"; do
    IFS='|' read -r name default_branch checkout_branch category <<< "$entry"
    if [ -f "$BASE_DIR/$name/package.json" ]; then
      log "[install] $name"
      ( cd "$BASE_DIR/$name" && pnpm install --frozen-lockfile=false ) || log "  install warned (continuing)"
    fi
  done
fi

# ─── SMOKE ─────────────────────────────────────────────────────────────
log "Smoke summary:"
for entry in "${REPOS[@]}"; do
  IFS='|' read -r name _ _ _ <<< "$entry"
  if [ -d "$BASE_DIR/$name/.git" ]; then
    branch=$(git -C "$BASE_DIR/$name" branch --show-current)
    head=$(git -C "$BASE_DIR/$name" rev-parse --short HEAD)
    echo "  ✓ $name @ $branch ($head)"
  fi
done

cat <<'EOF'

═════════════════════════════════════════════════════════════
MCV Ecosystem setup complete.

Next steps:
1. Fill .env.local files with your API keys (see ~/mcv/<repo>/.env.example for templates)
2. cd ~/mcv/mcv-one-desktop && pnpm dev    # boot the cockpit
3. gh pr list --repo amoustakas/mcv-one-desktop   # see open PRs
4. Read MULTI-MACHINE-SETUP.md for full per-repo workflow

Happy ripping. <3
═════════════════════════════════════════════════════════════
EOF
