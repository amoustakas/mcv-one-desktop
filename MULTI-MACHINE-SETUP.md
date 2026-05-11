# MCV Ecosystem — Multi-Machine Setup

Clone-and-run guide for picking up MCV One Desktop + the rest of the core ecosystem on **laptop + backup PC** while the main workstation is offline.

Captured 2026-05-07 by Claude during cross-machine recovery. Last verified
local↔remote sync: see [`project_multi_machine_recovery_2026_05_07.md`](../../.claude/projects/c--Users-moust-mcv-one-desktop/memory/project_multi_machine_recovery_2026_05_07.md) memory.

---

## 1) Required toolchain (per LAW 3 — Stack Unity)

Pin these on every machine before cloning. Any drift → `pnpm install` will
explode in non-obvious ways.

| Tool | Version | Notes |
|---|---|---|
| Node.js | **22 LTS** | not 18, not 20 — workspace-arch Phase A locked this |
| pnpm | **9.15.0** | `corepack enable && corepack prepare pnpm@9.15.0 --activate` |
| Git | 2.40+ | worktree support required |
| Rust + Cargo | stable | only for `mcv-gg/apps/mcv-gg-desktop` (Tauri) |
| GitHub CLI (`gh`) | 2.40+ | `gh auth login --web` once per machine |
| Supabase CLI | latest | optional, for local DB workflows |
| Vercel CLI | optional | `npm i -g vercel` for `vercel env pull` |

After install:

```bash
node --version    # v22.x.x
pnpm --version    # 9.15.0
gh auth status    # ✓ Logged in to github.com account amoustakas
```

---

## 2) Clone the core ecosystem

All repos are private under `amoustakas/`. Clone in this order — `mcv-one-desktop`
expects `@mcv/*` packages from `mcv-core-triangle`, so triangle first.

```bash
# Pick a base dir on the new machine, then:
mkdir -p ~/mcv && cd ~/mcv

# Tier 0 — contract layer (cross-venture SDKs)
gh repo clone amoustakas/mcv-core-triangle

# Tier 1 — primary desktop cockpit
gh repo clone amoustakas/mcv-one-desktop

# Tier 1 — RWA venture (Futurestate)
gh repo clone amoustakas/futurestate

# Tier 1 — Web3/gaming venture
gh repo clone amoustakas/mcv-gg

# Tier 1 — Marketing site (sovereign Three Doors voice)
gh repo clone amoustakas/mcv-one-marketing

# Tier 1 — Marketplace SDK (Sovereign Edition v3.1.0)
gh repo clone amoustakas/mcv-marketplace

# Tier 2 — Local AI factory (Antigravity / Genkit / Ollama)
gh repo clone amoustakas/mcv-local-ai-factory mcv-factory

# Tier 2 — MCV One legacy production codebase
gh repo clone amoustakas/mcv mcv-legacy
# After clone, switch to the production code:
git -C mcv-legacy checkout mcv-one-production-codebase
```

---

## 3) Branch checkout — match the active state

Some repos have important non-main work that's not yet PR-merged.

```bash
# mcv-one-desktop — Phase D-desktop adoption (open PR #76)
git -C mcv-one-desktop checkout phase-d-desktop-adoption-2026-04-25

# mcv-gg — Tauri desktop super-admin command center (Phase 1–7 marathon)
git -C mcv-gg checkout feature/mcv-gg-desktop-bootstrap

# mcv-one-marketing — main has session 7 OG rasterization;
# safety branch has the in-progress devtools/lineagePalette + ActIIIPin work:
git -C mcv-one-marketing checkout safety/snapshot-2026-05-07-pre-multi-machine
```

Open PRs to be aware of (review/merge from any machine via `gh pr ...`):

- `amoustakas/mcv-one-desktop` **#76** — Phase D-desktop adoption
- `amoustakas/mcv-core-triangle` **#44** — Invite protocol + marketing event taxonomy
- `amoustakas/mcv-core-triangle` **#46** — Publish 8 `@mcv/*-config` to GitHub Packages
- `amoustakas/mcv-gg` **#24, #28, #30** — studio charts / warforge fabric / triangle-gaps doc
- `amoustakas/futurestate` **#7** — Bills-pay Stripe Connect Transfer (FS-1 Wave 4A)

---

## 4) Per-repo `pnpm install` order

Triangle first (publishes `@mcv/*-config`), then the consumers:

```bash
( cd mcv-core-triangle && pnpm install )
( cd mcv-one-desktop && pnpm install )
( cd futurestate && pnpm install )           # may need .npmrc hoist for Prisma
( cd mcv-gg && pnpm install )
( cd mcv-one-marketing && npm install --legacy-peer-deps )  # @theatre/r3f peer conflicts
( cd mcv-marketplace/sdk && npm install )    # SDK-only; infra/ + programs/ are Terraform/Anchor
```

---

## 5) Environment variables — server-only LLM keys (Phase-0 safety enforced)

**`VITE_*` prefix on LLM/voice keys is BANNED** — Vite bundles those into public
JS. ESLint + CI block this. Use server-only names below in each repo's `.env`.

### `mcv-one-desktop/.env`

```env
# Server-only — DO NOT prefix VITE_
ANTHROPIC_API_KEY=
GOOGLE_AI_KEY=
DEEPGRAM_API_KEY=
ELEVENLABS_API_KEY=

# Browser-safe
VITE_APP_ENV=development

# Server-only — never had VITE_
N8N_BASE_URL=
N8N_API_KEY=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
AGENT_SIGNING_KEY=

# Supabase (project: kovsdngjojzfebrxulyj — MCV Desktop, us-west-2)
SUPABASE_URL=https://kovsdngjojzfebrxulyj.supabase.co
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=    # ⚠ verify this is a real service_role key, not anon
```

### `futurestate/apps/investor/.env.local`

See `Futurestate/apps/investor/.env.example`. Includes Clerk, Stripe, Plaid,
MCV Sign, MCV Triangle URLs (`IDENTITY_URL`, `FABRIC_URL`, `INTELLIGENCE_URL`,
`INTERNAL_SERVICE_SECRET`).

### `mcv-gg/apps/*/env`

Each app has its own `.env.example`. The Tauri desktop uses OS keyring for
secrets — see `apps/mcv-gg-desktop/README.md`.

### Pulling existing values from Vercel

If a repo is Vercel-linked:

```bash
vercel link
vercel env pull .env.local
```

---

## 6) First-run smoke test — does each repo boot?

```bash
# mcv-one-desktop — Vite dev on port 5173
( cd mcv-one-desktop && pnpm dev )

# Futurestate investor app
( cd futurestate/apps/investor && pnpm dev )

# mcv-gg studio
( cd mcv-gg/apps/studio && pnpm dev )

# mcv-one-marketing
( cd mcv-one-marketing && npm run dev )

# Local AI factory (port 7004 per memory)
( cd mcv-factory && pnpm dev )
```

---

## 7) Parallel-session discipline (LAW 9)

If you'll run more than one Claude Code session against any repo on the same
machine, **always spin up a worktree first**:

```bash
# In mcv-one-desktop:
./scripts/new-session.sh my-feature
# Creates ~/mcv/mcv-one-desktop-my-feature-2026-05-07-HHMM on a unique branch
```

Cross-machine: the `.git` object DB lives under each machine's clone, so commits
from the laptop only become visible to the backup PC after `git push` + `git fetch`.
Treat `master`/`main` as shared remote state — `git fetch` before any push.

---

## 8) Stale-on-disk worktree dirs from 2026-05-07 cleanup

These directories on the **main workstation** are git-retired but locked by
file handles. Once the workstation is healthy, close any VS Code window
pointing at them and:

```bash
rm -rf "C:/Users/moust/Documents/GitHub/Futurestate-mcv-sign-signer-page"
rm -rf "C:/Users/moust/Documents/GitHub/Futurestate-phase-d-2026-04-25"
rm -rf "c:/Users/moust/mcv-gg-phase-d-2026-04-25"
# Plus any of these mcv-gg ghosts that re-surfaced via prune:
#   mcv-gg-insights / mcv-gg-royalties / mcv-gg-telemetry / mcv-gg-warforge-detail
```

These don't exist on the laptop or backup PC — they're a workstation-only artifact.

---

## 9) Memory & context preservation across machines

`C:/Users/moust/.claude/projects/c--Users-moust-mcv-one-desktop/memory/MEMORY.md`
is the index. It lives in the user profile, not the repo, so each machine has
its own. To sync notable learnings, copy the topic `.md` files between machines'
`memory/` dirs (or sync that directory via OneDrive/Dropbox if you want
auto-sync).

LAW-tier memories you don't want to lose:
- `feedback_multi_version_preservation.md` (LAW 1)
- `feedback_infinite_personalized_frontends.md` (LAW 2)
- `feedback_stack_unity_principle.md` (LAW 3)
- `project_mcv_dev_toolbar_vision.md` (LAW 4)
- `feedback_cockpit_access_discipline.md` (LAW 5)
- `feedback_end_to_end_runtime_verification.md` (LAW 6)
- `feedback_symmetric_contract_validation.md` (LAW 7)
- `feedback_platform_native_over_custom_ci.md` (LAW 8)
- `feedback_worktree_first.md` + `feedback_parallel_session_safety_contract.md` (LAW 9)

---

## 10) When the main workstation is back online

Re-clone is not necessary — the repos are still there. Just:

```bash
cd ~/mcv-one-desktop && git fetch origin --prune && git status
# repeat for every repo
```

If you committed work on the laptop, fetch + merge/rebase from origin on the
workstation and you're back in sync.
