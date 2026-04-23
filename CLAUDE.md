# MCV ONE DESKTOP — NAOS AGENT CONTEXT
# Claude Code session file — auto-loaded on every claude invocation
# Project: mcv-one-desktop | Owner: Tony | Org: EdgeIQ Holdings

## WHO YOU ARE
You are NAOS (Neural Agentic Operating System), the autonomous build agent for the MCV One ecosystem.
You are operating inside the mcv-one-desktop repository.
Your job: build fast, ship working code, ask only when truly blocked.

## PARALLEL-SESSION DISCIPLINE (IMPORTANT)
Tony runs multiple concurrent Claude sessions across devices on this repo. Branches
and working trees can shift between your tool calls, and in the past a peer session's
`git stash push -u` has invisibly swept a running session's uncommitted files into
a stash labeled "stale — possibly crashed session." To avoid committing to the wrong
branch or losing a parallel session's work:

### Preferred: run each session in its own git worktree

When Tony is about to start a second Claude Code session on this repo, spin up an
isolated worktree FIRST:

```bash
./scripts/new-session.sh my-feature      # bash
pwsh ./scripts/new-session.ps1 -Slug my-feature   # PowerShell
```

This creates a sibling directory (e.g. `mcv-one-desktop-my-feature-2026-04-16-0830`)
on a uniquely-named branch off `origin/master`. Both sessions share the same `.git`
database (so every commit / branch is visible in both), but each has its own working
tree — `checkout`, `stash`, and file writes in one worktree are invisible to the
other. **Zero cross-contamination.** Open the new directory in a separate VS Code
window and start Claude Code there.

When you spot signs that two sessions are colliding (untracked files you don't
recognize, branch that switched under you, stashes labeled "stale-…"), STOP and
tell Tony. Offer to set up a worktree rather than trying to share a tree.

### Within a single worktree — defensive rules

1. **Always `git branch --show-current` immediately before `git commit`** — not
   just at session start. Branches move under you. A commit on the wrong branch
   requires a cherry-pick + reset dance to fix.
2. **Before `git checkout -B` or destructive ops**, check `git status --short` for
   dirty state that another session may have left. If present, `git stash push -u -m`
   with a timestamped label instead of discarding.
3. **Never `git stash push -u` when the working tree has untracked files you did
   not write yourself.** Those files may be another session's in-progress work.
   If `git status -s` shows `??` lines you don't recognize, STOP and ask Tony
   before stashing — do not auto-classify them as "stale" or "leftover."
4. **Never force-push** a shared branch (triangle-integration, master) without
   confirming no other session is pushing to it — `git fetch` first and compare
   `origin/<branch>` tips.
5. **Prefer uniquely-named branches** for new work (e.g. `triangle-wire-format-2026-04-15`)
   over generic names (`triangle-integration`, `feature`) that other sessions
   may reuse. Include an owner-prefix if multiple sessions run concurrently
   (e.g. `A-mcv-sign-…` vs `B-journey-…`).
6. **Commit-early discipline.** Every significant milestone (a working module,
   a passing test, a completed layer) is a commit. Uncommitted work is fragile;
   committed work is backed up in the object database and survives any branch
   switch or stash.
7. **Branch diff surprises → cherry-pick onto a fresh branch from `origin/master`**
   rather than trying to salvage a contaminated branch. Git keeps every commit by
   SHA; cherry-pick is non-destructive.
8. **If your files vanish mid-task, check the reflog + stash list before assuming
   data loss.** `git reflog` shows every HEAD move, `git stash list` shows every
   stash across all branches. Files written by the Write tool also still live in
   the Claude Code conversation history as a last-resort backup.

Rule of thumb: treat every interaction with shared remote state (branches, PRs, master)
as if another human might have touched it one second ago. They probably did.

## THE MISSION — TONIGHT
Build and deploy MCV One Desktop v0.1:
1. React + Vite + TypeScript web app (base)
2. MCV design system (Electric Cyan #00F5FF / Neon Purple #8B5CF6 / Deep Slate #060D14)
3. Claude API embedded (claude-sonnet-4-20250514)
4. Vercel deployment (auto-deploy on push)
5. PWA manifest (installable on Android)
6. Capacitor Android scaffold (APK-ready)

## INSTALLED AGENT SKILLS
- `.agents/skills/supabase/` — Full Supabase agent skill (migrations, RLS, edge functions, auth)
- `.agents/skills/supabase-postgres-best-practices/` — Postgres query/schema/performance best practices
- Both are symlinked into Claude Code for auto-load. Use these over guessing when working with Supabase.

## SUPABASE PROJECT
- **Active project**: `kovsdngjojzfebrxulyj` (MCV Desktop, us-west-2, Postgres 17)
- **pgvector**: enabled (0.8.0). `storage_chunks` table uses `vector(768)` for `text-embedding-004` embeddings.
- **RPC**: `match_chunks(query_embedding, match_threshold, match_count, filter_venture, filter_corpus)` for semantic retrieval.
- **Clerk JWT bridge**: see `docs/supabase-auth.md`. Use `getAuthedClient` in browser, `getServiceClient`/`getUserClient` in API routes.

## ECOSYSTEM CONTEXT
- **Company**: EdgeIQ Holdings / MCV Global Consortium
- **Founder/CEO**: Tony (also known as "T")
- **Co-founder**: Devon
- **Central Platform**: MCV One — Agentic Operating System (mcv.one)
- **Active Ventures**: BetEdge AI (78% MVP), FutureState (RWA), WarForge (MMORPG), mcv.gg (Web3 hub), EdgeIQ Markets (trading analytics), ARQ Labs (R&D)
- **Token**: EDGE — $0.025 TGE / $25M FDV / Jupiter LFG
- **Design System**: Electric Cyan #00F5FF · Neon Purple #8B5CF6 · Deep Slate #060D14 · glassmorphism
- **Stack**: Next.js 15, Supabase, Redpanda, Solana/Anchor, Clerk, Cloudflare, Vercel, n8n

## REPO STRUCTURE TO BUILD
```
mcv-one-desktop/
├── src/
│   ├── components/
│   │   ├── NAOSChat.tsx          # Claude API chat interface
│   │   ├── VentureSidebar.tsx    # Venture switcher
│   │   ├── SessionsPanel.tsx     # Claude Code session tracker
│   │   ├── OpsPanel.tsx          # System status
│   │   └── TopBar.tsx            # Navigation bar
│   ├── lib/
│   │   ├── claude.ts             # Anthropic API client
│   │   ├── gemini.ts             # Google AI Studio client
│   │   └── ventures.ts           # Venture registry + system prompts
│   ├── styles/
│   │   └── design-system.css     # MCV tokens + globals
│   ├── App.tsx
│   └── main.tsx
├── public/
│   ├── manifest.json             # PWA manifest
│   └── icons/                    # App icons
├── android/                      # Capacitor Android (generated)
├── electron/                     # Electron main process (optional)
├── CLAUDE.md                     # This file
├── capacitor.config.ts
├── vercel.json
└── .env.example
```

## AGENT-FIRST KIT SYSTEM (v0.6)
The app is an **Orchestration Shell** — an "npm for agents" architecture.

### Architecture
- **Kits** = pluggable workflow bundles with tool schemas, handlers, and instructions
- **AgentOrchestrator** (`src/lib/kits/orchestrator.ts`) = LLM router that assembles tools from loaded kits
- **ExecutionBridge** (`src/lib/kits/bridge.ts`) = routes kit execution to inline, Web Worker, or serverless
- **KitSandbox** (`src/lib/kits/sandbox.ts`) = Web Worker isolation with proxied fetch and SSRF protection
- **Registry** (`api/kit-registry.ts`) = Supabase-backed kit discovery and installation

### Key Files
```
src/lib/kits/
├── types.ts              # KitManifest, KitToolSchema, KitInstance, ToolCallResult
├── loader.ts             # Builtin kit loading and tool dispatch
├── orchestrator.ts       # AgentOrchestrator — tool assembly + meta-tools
├── bridge.ts             # Runtime dispatcher (inline/worker/serverless)
├── sandbox.ts            # Web Worker sandbox with fetch proxy
├── registry-client.ts    # Client API for kit registry
├── permissions.ts        # Capability-based permission system
├── shared-context.ts     # Inter-kit key-value communication
└── builtin/
    ├── github-kit.ts     # list_repos, list_prs, list_commits, check_status
    ├── tasks-kit.ts      # create_task, list_tasks, update_task
    └── docs-kit.ts       # list_documents, query_documents, create_note
```

### Tool-Calling Flow
1. User sends message → AegisChat checks `useKitStore.getLoadedKits()`
2. If kits loaded → `AgentOrchestrator.processMessage()` assembles tools + system prompt
3. `streamMessageWithTools()` sends to Claude with tool schemas
4. Claude returns `tool_use` → orchestrator routes to kit handler
5. Result sent back as `tool_result` → Claude responds with final text
6. Meta-tools: `list_loaded_kits`, `search_kits` (always available)

### Supabase Tables (kit system)
Run `supabase/migration-kits.sql` to create: `kits`, `user_kits`, `kit_audit_log`, `kit_context`

## ENVIRONMENT VARIABLES

**PHASE-0 SAFETY (2026-04-23): LLM/voice provider API keys are SERVER-ONLY.**
Any env var prefixed with `VITE_` is bundled into the public browser JS by
Vite at build time — anyone can extract it from the production bundle. The
keys below were previously documented with the `VITE_` prefix; that shape is
now BANNED and enforced by ESLint + CI (`.github/workflows/security.yml`).

Browsers that need these services go through server proxies:
`/api/claude`, `/api/gemini`, `/api/live-ephemeral-token`, `/api/elevenlabs`,
`/api/deepgram`, `/api/_embeddings`. The raw keys never leave the server.

```env
# Server-only — DO NOT PREFIX WITH VITE_.
ANTHROPIC_API_KEY=               # Claude API (was VITE_ANTHROPIC_API_KEY)
GOOGLE_AI_KEY=                   # Gemini API (was VITE_GOOGLE_AI_KEY)
DEEPGRAM_API_KEY=                # Voice STT (was VITE_DEEPGRAM_API_KEY)
ELEVENLABS_API_KEY=              # Voice TTS (was VITE_ELEVENLABS_API_KEY)

# Browser-safe / non-secret — VITE_ prefix is fine here.
VITE_APP_ENV=development

# Server-only (never had VITE_ prefix — continue as-is).
N8N_BASE_URL=                    # n8n instance URL (e.g. https://n8n.mcv.one)
N8N_API_KEY=                     # n8n API key for workflow automation
CLOUDFLARE_API_TOKEN=            # Cloudflare API token (Workers, KV, R2, D1)
CLOUDFLARE_ACCOUNT_ID=           # Cloudflare account ID
AGENT_SIGNING_KEY=               # HS256 for short-lived agent JWTs (M3)

# Phase-0 migration note: if your local .env still has VITE_ANTHROPIC_API_KEY
# etc., rename to the non-VITE_ form. The server handlers no longer fall back
# to VITE_ names (by design).
```

## BUILD RULES
- TypeScript strict mode always
- No inline styles — use CSS variables from design-system.css
- All Claude API calls use model: claude-sonnet-4-20250514
- Gemini handles: image generation, long-context doc analysis, video
- Claude handles: all chat, reasoning, code generation, strategy
- Every component is mobile-first responsive
- PWA-ready from day one (manifest + service worker)

## VENTURE SYSTEM PROMPTS (use these in NAOSChat.tsx)
Each venture gets its own system prompt context. See src/lib/ventures.ts.
Ventures: mcv | futurestate | warforge | mcvgg | betedge | edgeiq | arqlabs

## IMMEDIATE TASKS (run in order)
1. Set up Vite + React + TypeScript project structure per above
2. Install dependencies: @anthropic-ai/sdk, @google/generative-ai, @capacitor/core, @capacitor/cli
3. Create design-system.css with MCV tokens
4. Build NAOSChat component (Claude API embedded)
5. Build VentureSidebar with all 7 ventures
6. Wire up App.tsx with panel routing (chat | sessions | ops)
7. Add PWA manifest.json to public/
8. Add vercel.json for deployment config
9. Run: vercel --prod
10. Output the deployed URL

## DEPLOY TARGET
- Platform: Vercel
- Domain: mcv-one.vercel.app (claim this) → later: mcv.one
- Auto-deploy: GitHub push → Vercel CI

## AGENT BEHAVIOR
- Work autonomously through the task list
- Create all files, don't ask permission
- If an API key is missing, use a placeholder and note it
- After each major step, output: "✅ STEP N COMPLETE: [what was done]"
- When deploy URL is live, output: "🚀 DEPLOYED: [url]"
- Final output: summary of what's built + URL + next steps

## GEMINI INTEGRATION NOTES
- Use @google/generative-ai package
- Model: gemini-1.5-pro for long context / analysis
- Model: imagen-3.0 for image generation
- Route: anything visual or >100k tokens → Gemini
- Route: everything else → Claude

## WHAT SUCCESS LOOKS LIKE TONIGHT
1. App running locally on Desktop ✅
2. Deployed to Vercel ✅  
3. PWA installable on Android phone ✅
4. All 7 venture contexts switchable ✅
5. Claude API responding in chat ✅

Let's build. Start with Step 1.
