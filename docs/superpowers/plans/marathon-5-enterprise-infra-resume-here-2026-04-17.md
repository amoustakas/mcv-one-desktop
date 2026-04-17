# Marathon #5 — Enterprise Infrastructure · Resume-Here Status (post-compact)

**Stopped:** 2026-04-17 after M1+M2+M3+M4 all merged. Factory cockpit integration (M4 PR #56) is the last thing on master.
**Resume target:** Dispatch M5 Batch 1 (CI/CD foundation + observability scaffolding + RLS policy backfill) using the pre-flight data below.

---

## TL;DR

4 marathons shipped. Factory cockpit integration live. Antigravity session still building the Factory runtime (`c:\Users\moust\mcv`) + nav wiring in parallel. **Marathon #5** scope: CI/CD + observability + RBAC hardening + signed-webhook verification for `mcv-one-desktop` as the production reference app.

## State at compact time

- **Master HEAD:** `258ebbb` (PR #56 merge commit)
- **Merged PRs:** #47/#48/#49 (M1) · #50/#51/#52 (M2) · #53/#54/#55 (M3) · #56 (M4) — **10 PRs, 67 tasks total**
- **Migrations applied (13):** crown_entities · prospect_profile_operator · ventures_expansion · capital_round_ventures · venture_corporate_stack · domain_registry · agent_persona_dimensions · tasks_mode · research_dossier · capital_activities_activity_type_widen · persona_xp_event · persona_achievement · persona_xp_trigger
- **Supabase prod seed state:** 7 raising ventures · 2 sovereign crowns · 22 Corporate Stack rows · 9 domains · 2 operator prospects · 3 research dossiers · 13 Hit Squad personas (all dim-tagged) · 28 XP events · 3 achievements · 1 demo distribution · 1 public open round
- **Antigravity session:** actively scaffolding `c:\Users\moust\mcv` (Factory runtime on port 7004) + uncommitted work on main worktree (`App.tsx`, `NavRail.tsx`, `navigation.ts`, `CommandCenter.tsx`, `FactoryHeartbeat.tsx`, `api/_handlers/factory.ts`, `view-meta.ts`). **Stay out of these files** in M5.
- **Worktrees:** 14 still on disk (M1 T1/T2/T3 + M2 T4/T5/T6 + M3 T7/T8/T9 + M4 + 2 unrelated agent-* + main + the soon-to-create M5 ones). Cleanup is safe post-M5; do NOT clean up mid-marathon.

## Playbook (13 rules — memory: `feedback_marathon_execution_playbook.md`)

Use exactly as before. Key reminders:
- Pre-flight `information_schema.columns` + `pg_constraint` for every table touched
- 5-wide parallel batches, Opus for architecture / Sonnet for mechanical
- Speculative next-batch dispatch while current runs
- `pnpm build` (tsc -b) as the real gate, NOT `tsc --noEmit -p tsconfig.json`
- Contract-test-first for every cross-layer wire
- `git commit <specific-path>` positional arg to bypass sweep collisions in shared worktrees
- Ledger ↔ denormalized invariant: every denorm bump gets a compensating ledger row
- One-shot worktree + junction setup at marathon start

## Pre-flight findings (captured at compact time)

### No CI/CD exists yet

- **`.github/workflows/`** — directory does NOT exist. M5 creates the whole pipeline from zero.
- **`vercel.json`** — present. Single catchall `api/[...slug].ts` function, 120s maxDuration. 6 cron jobs already running prod:
  - `/api/compliance-cron` hourly
  - `/api/cron-asset-rediscovery` daily 06:00
  - `/api/venture-docs-embed` every 30 min
  - `/api/content-embed` every 30 min
  - `/api/cron-capital-distributions` every 5 min
  - `/api/cron-notifications-dispatch` every 2 min
- **No observability deps installed**: no sentry, pino, otel, @vercel/analytics, winston, axiom, datadog. Clean slate for M5 I2.
- **`package.json` scripts present**: `build`, `test`, `test:coverage`, `lint`, `turbo:build`, `turbo:lint`, `turbo:typecheck`, `smoke:triangle`. `build` = `tsc -b && vite build` (matches playbook gate).
- **132 API handlers** under `api/_handlers/` — large observability surface for I2.
- **88 env vars** in `.env.example` — big prod config contract; I1 needs to audit which are set in Vercel.

### RLS state (30 M-era tables, all RLS-enabled, coverage uneven)

**ZERO policies (service-role-only writes — M5 I3 closes these):**
- `capital_round_ventures`
- `domain_registry`
- `persona_achievement`
- `persona_xp_event`
- `research_dossier`
- `venture_accounts`
- `venture_brand_kits`
- `venture_jurisdictions`

**1 policy (minimal — likely "select for authenticated user"):** agent_activity_log · agent_persona · capital_distribution_leg · capital_legal_entity · capital_royalty_graph · capital_royalty_graph_layer · payment_intents · payment_processor_config · payment_records · prospect_journey · prospect_journey_step · prospect_profile · tasks

**2+ policies (multi-role or read/write split):** capital_activities · capital_commitments · capital_distribution_recipients · capital_distributions · capital_investor_profile · capital_rounds · epics · payment_events · ventures

### Parallel session DO NOT TOUCH list (Antigravity owns)

- `src/App.tsx`
- `src/stores/navigation.ts`
- `src/components/NavRail.tsx`
- `src/views/CommandCenter.tsx`
- `src/lib/view-meta.ts`
- `src/components/factory/FactoryHeartbeat.tsx`
- `api/_handlers/factory.ts`

---

## Marathon #5 Proposed Scope (3 tranches · ~18 tasks)

### I1 — Deployment + CI/CD (6 tasks)

Goal: every PR auto-typechecks, tests, builds, and optionally deploys a preview. Merges to master trigger prod deploy.

- **I1.1 (Opus)** — `.github/workflows/ci.yml`: pnpm install (with cache) → lint → tsc -b → vitest run → vite build. Runs on `pull_request` + `push` to master. Matrix: Node 20, ubuntu-latest.
- **I1.2 (Sonnet)** — `.github/workflows/preview-deploy.yml`: on PR open/update, deploy Vercel preview via `vercel` CLI + comment URL on PR.
- **I1.3 (Opus)** — `.github/workflows/prod-deploy.yml`: on merge to master, deploy to prod with required-reviewer approval via `environments`. Guard with migration-applied check (query Supabase for schema_migrations count matching `supabase/migration-*.sql` file count).
- **I1.4 (Sonnet)** — `docs/deployment/runbook.md`: prod deploy / rollback / hotfix / secret rotation procedures. Include the 6 Vercel cron jobs' SLOs.
- **I1.5 (Sonnet)** — Environment variable audit: script that diffs `.env.example` against a `.env.prod.required` whitelist, fails build if missing. Vercel env sync script.
- **I1.6 (Opus)** — Pre-commit hooks via husky + lint-staged: run tsc on staged `.ts(x)` files, prevent commits that fail tsc. Install in `package.json` postinstall so fresh clones get it automatically.

### I2 — Observability + Telemetry (6 tasks)

Goal: every handler emits structured logs + metrics; client errors routed to Sentry; correlation_id propagates across the stack.

- **I2.1 (Opus)** — Structured logger: add `pino` + helper `src/lib/server/logger.ts` with `correlation_id` context. Patch all 132 `api/_handlers/*.ts` — minimum: request_in / request_out / error. Use the T3.6-style coordination: open as a single PR touching all handlers since they all share the pattern.
- **I2.2 (Sonnet)** — Health endpoint: `api/_handlers/health.ts` returns `{ ok, db_ok, migrations_count, active_crons, commit_sha, uptime_ms }`. Wired into the catchall. For uptime monitors.
- **I2.3 (Opus)** — Sentry client + server integration. Client: `@sentry/react` with venture_id tag from navigation store. Server: `@sentry/node` in handlers for unhandled errors. Filter PII before send.
- **I2.4 (Sonnet)** — Vercel Analytics: `@vercel/analytics` client. Core Web Vitals dashboard. Web-vitals custom instrumentation for the Factory Console view (load time, flow-run latency).
- **I2.5 (Opus)** — Correlation ID propagation: existing `capital_activities.correlation_id` + Fabric `MCVEvent.correlationId` are already in place. Add middleware that reads/generates correlation_id per request, attaches to logger context, forwards on outbound calls (Factory, Triangle, Stripe, Plaid). Contract-tested.
- **I2.6 (Sonnet)** — `docs/observability/runbook.md`: how to find a correlation_id across logs + Sentry + Fabric events. Incident response playbook. Alert thresholds.

### I3 — RBAC + Security Hardening (6 tasks)

Goal: investor portal users can only read their own commits/profile; operators see their venture; MCV admin sees all. Webhook signatures properly verified.

- **I3.1 (Opus)** — Supabase RLS policies migration for the 8 zero-policy tables (`domain_registry`, `venture_*`, `research_dossier`, `persona_xp_event`, `persona_achievement`, `capital_round_ventures`). Policy shape: `authenticated` role reads venture-scoped rows + their own, service-role bypasses. Pre-flight: read `auth.jwt()->>'venture_scope'` pattern from existing capital policies.
- **I3.2 (Opus)** — Signed-webhook verification for `api/_handlers/investor-flow-webhook.ts` (M2 T6.4). Replace "warn and accept" with: Stripe `Stripe.webhooks.constructEvent` · Plaid Webhook-Verification-Key · USDC on-chain confirmation via RPC. Structured errors per processor. Contract tests with mock payloads + signature fixtures.
- **I3.3 (Sonnet)** — Rate limiting middleware: `@upstash/ratelimit` or simple in-memory sliding window for Vercel. Limits: investor-flow endpoints 30/min per IP, prospect-intake 10/min per IP, webhook endpoints 100/min per processor.
- **I3.4 (Opus)** — Clerk organizations wire: `venture_id` on org metadata → enforce on api handlers via `requireVentureScope(req, venture_id)` helper. Update `api/_handlers/capital.ts`, `prospects.ts`, `venture-detail.ts`, `distributions.ts`, `investor-flow.ts`. Contract test the enforcement.
- **I3.5 (Sonnet)** — Secret rotation runbook in `docs/security/`: Stripe keys, Supabase service-role, Clerk secrets, Gemini keys. Vercel env update procedures. Audit log of last-rotated timestamps.
- **I3.6 (Sonnet)** — OWASP Top-10 audit pass: A1 injection (Supabase parameterized queries ✓, check direct `supabase.rpc` calls), A2 auth (Clerk+RLS), A3 sensitive data (log redaction from I2.1), A5 misconfig (`/health` doesn't leak secrets), A7 XSS (React auto-escapes, audit unsafe-HTML prop usage across components), A10 SSRF (Factory proxy should allowlist only `:7004`). Write findings into `docs/security/owasp-audit-2026-04-17.md`.

### Phase exit

- All 3 tranches merged to master
- Vercel prod deploys run from the new pipeline (not manual)
- Sentry receives client + server errors with correlation_id
- All 30 M-era tables have ≥ 1 RLS policy
- Webhook handler cryptographically verifies signatures (no more "warn and accept")
- Rate limits enforced on public endpoints
- `docs/deployment/`, `docs/observability/`, `docs/security/` all exist with runbooks

---

## Dispatch plan (5-wide batches)

### Worktree setup (one-shot, after compact resume)

```bash
cd /c/Users/moust/mcv-one-desktop
git fetch origin master
git worktree add ../mcv-one-desktop-m5-i1-cicd -b marathon-5-i1-cicd-2026-04-17 origin/master
git worktree add ../mcv-one-desktop-m5-i2-observability -b marathon-5-i2-observability-2026-04-17 origin/master
git worktree add ../mcv-one-desktop-m5-i3-rbac -b marathon-5-i3-rbac-2026-04-17 origin/master

# Junction node_modules into each
(cd ../mcv-one-desktop-m5-i1-cicd && cmd //c "mklink /J node_modules ..\\mcv-one-desktop\\node_modules")
(cd ../mcv-one-desktop-m5-i2-observability && cmd //c "mklink /J node_modules ..\\mcv-one-desktop\\node_modules")
(cd ../mcv-one-desktop-m5-i3-rbac && cmd //c "mklink /J node_modules ..\\mcv-one-desktop\\node_modules")
```

### Batch 1 — 5-wide foundation

Dispatch concurrently:

1. **I1.1** (Opus, worktree `m5-i1-cicd`) — `.github/workflows/ci.yml` full pipeline
2. **I1.6** (Opus, worktree `m5-i1-cicd`) — husky + lint-staged (runs in parallel; different file)
3. **I2.1** (Opus, worktree `m5-i2-observability`) — pino + logger helper + patch all 132 handlers
4. **I3.1** (Opus, worktree `m5-i3-rbac`) — RLS policies migration for 8 zero-policy tables
5. **I2.2** (Sonnet, worktree `m5-i2-observability`) — `/api/health` endpoint

### Batch 2 — 5-wide build-out

6. **I1.2** (Sonnet, worktree `m5-i1-cicd`) — Vercel preview deploy workflow
7. **I1.3** (Opus, worktree `m5-i1-cicd`) — prod deploy workflow with migration check
8. **I2.3** (Opus, worktree `m5-i2-observability`) — Sentry client + server
9. **I2.5** (Opus, worktree `m5-i2-observability`) — correlation_id propagation + middleware
10. **I3.2** (Opus, worktree `m5-i3-rbac`) — webhook signature verification

### Batch 3 — 5-wide polish

11. **I1.4** (Sonnet, worktree `m5-i1-cicd`) — deployment runbook
12. **I1.5** (Sonnet, worktree `m5-i1-cicd`) — env var audit script
13. **I2.4** (Sonnet, worktree `m5-i2-observability`) — Vercel Analytics + Web Vitals instrumentation
14. **I2.6** (Sonnet, worktree `m5-i2-observability`) — observability runbook
15. **I3.3** (Sonnet, worktree `m5-i3-rbac`) — rate limiting middleware

### Batch 4 — 3-wide closeout

16. **I3.4** (Opus, worktree `m5-i3-rbac`) — Clerk org + `requireVentureScope` helper
17. **I3.5** (Sonnet, worktree `m5-i3-rbac`) — secret rotation runbook
18. **I3.6** (Sonnet, worktree `m5-i3-rbac`) — OWASP audit doc

### Final

- Push 3 M5 branches
- Open 3 PRs (I1/I2/I3)
- Merge in order: I1 (CI/CD) → I2 (observability) → I3 (RBAC) — I1 merging first lets I2 and I3 benefit from the CI pipeline validating their PRs
- Sanity run: trigger a preview deploy from a throwaway PR, confirm Sentry captures a forced error, confirm RLS rejects an unauthenticated read on `research_dossier`
- Full confirmation sweep

## Post-compact resume command

> Pick up Marathon #5 from the status doc `docs/superpowers/plans/marathon-5-enterprise-infra-resume-here-2026-04-17.md`. Master is at `258ebbb`. Set up 3 M5 worktrees (I1/I2/I3) per the Dispatch plan → Worktree setup block. Pre-flight sweep already captured in this doc — no need to re-verify. Dispatch Batch 1 immediately (5-wide: I1.1 + I1.6 + I2.1 + I3.1 + I2.2) using the pre-flight context below. Playbook rules 1-13 apply. Antigravity parallel session continues — DO NOT TOUCH the 7 files in the "DO NOT TOUCH" list above. RIP.

## Brand voice reminder

Aggressive · decisive · production-grade · hive-mind · founder-family legacy. Apply to all commits, runbook prose, incident-response copy. No corporate-sanitized language. MCV voice is Tony's voice.
