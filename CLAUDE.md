# MCV ONE DESKTOP — NAOS AGENT CONTEXT
# Claude Code session file — auto-loaded on every claude invocation
# Project: mcv-one-desktop | Owner: Tony | Org: EdgeIQ Holdings

## WHO YOU ARE
You are NAOS (Neural Agentic Operating System), the autonomous build agent for the MCV One ecosystem.
You are operating inside the mcv-one-desktop repository.
Your job: build fast, ship working code, ask only when truly blocked.

## PARALLEL-SESSION DISCIPLINE (IMPORTANT)
Tony runs multiple concurrent Claude sessions across devices on this repo. Branches
and working trees can shift between your tool calls. To avoid committing to the
wrong branch or losing a parallel session's work:

1. **Always `git branch --show-current` immediately before `git commit`** — not
   just at session start. Branches move under you. A commit on the wrong branch
   requires a cherry-pick + reset dance to fix.
2. **Before `git checkout -B` or destructive ops**, check `git status --short` for
   dirty state that another session may have left. If present, `git stash push -u -m`
   with a timestamped label instead of discarding.
3. **Never force-push** a shared branch (triangle-integration, master) without
   confirming no other session is pushing to it — `git fetch` first and compare
   `origin/<branch>` tips.
4. **Prefer uniquely-named branches** for new work (e.g. `triangle-wire-format-2026-04-15`)
   over generic names (`triangle-integration`, `feature`) that other sessions
   may reuse.
5. **Branch diff surprises → cherry-pick onto a fresh branch from `origin/master`**
   rather than trying to salvage a contaminated branch. Git keeps every commit by
   SHA; cherry-pick is non-destructive.

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
```env
VITE_ANTHROPIC_API_KEY=          # Claude API
VITE_GOOGLE_AI_KEY=              # Gemini API (Google AI Studio)
VITE_DEEPGRAM_API_KEY=           # Voice STT
VITE_ELEVENLABS_API_KEY=         # Voice TTS
VITE_APP_ENV=development
N8N_BASE_URL=                    # n8n instance URL (e.g. https://n8n.mcv.one)
N8N_API_KEY=                     # n8n API key for workflow automation
CLOUDFLARE_API_TOKEN=            # Cloudflare API token (Workers, KV, R2, D1)
CLOUDFLARE_ACCOUNT_ID=           # Cloudflare account ID
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
