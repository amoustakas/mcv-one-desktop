# MCV One Desktop — Deployment Runbook

> Battle-ready procedures for the prod pipeline. Zero ambiguity when production is on fire.
> Last updated: 2026-04-17 | Pipeline: I1.1–I1.6

---

## 1. Deployment Topology

| Surface | Trigger | Workflow | Runtime |
|---|---|---|---|
| **Production** | Merge to `master` | `prod-deploy.yml` | Vercel Fluid Compute |
| **Preview** | PR open / push | `preview-deploy.yml` | Vercel Fluid Compute |
| **CI gate** | PR + push to master | `ci.yml` | ubuntu-latest |
| **Local dev** | Manual | `npm run dev` | Vite on port 3100 |

**Master = production. No staging env. Previews ARE staging.**

### Vercel Cron Jobs (6 active)

| Path | Schedule (UTC) | Purpose |
|---|---|---|
| `/api/compliance-cron` | Every hour (`0 * * * *`) | OFAC/KYC cache refresh |
| `/api/cron-asset-rediscovery` | Daily 06:00 (`0 6 * * *`) | Re-scan all venture-owned digital assets |
| `/api/venture-docs-embed` | Every 30 min (`*/30 * * * *`) | Embed venture docs into pgvector |
| `/api/content-embed` | Every 30 min (`*/30 * * * *`) | Embed CMS/generic content into pgvector |
| `/api/cron-capital-distributions` | Every 5 min (`*/5 * * * *`) | Process pending royalty payouts + dividends |
| `/api/cron-notifications-dispatch` | Every 2 min (`*/2 * * * *`) | Fan out queued notifications (email/SMS/push) |

---

## 2. Standard Deploy (Merge PR to Master)

**This is the only approved path to production.**

1. Open PR against `master`. CI runs automatically (`ci.yml`):
   - ESLint pass
   - `tsc -b && vite build` — real typecheck gate, not `tsc --noEmit`
   - Vitest suite
2. `preview-deploy.yml` fires in parallel. Vercel preview URL posted as a PR comment.
3. Review the preview. **Smoke-test every surface touched by the diff.** CI gates catch types + tests; the preview gate catches runtime.
4. Merge PR → `prod-deploy.yml` triggers on push to `master`.
5. `migration-check` job runs first:
   - Counts `supabase/migration-*.sql` files locally
   - Connects to Supabase (`kovsdngjojzfebrxulyj`) and queries `supabase_migrations.schema_migrations`
   - **Fails hard** if local count > remote count. Deploy aborts.
6. `deploy-prod` job needs `migration-check` to pass, then **pauses** for required-reviewer approval in the `production` GitHub environment.
7. Reviewer approves in GitHub → `vercel deploy --prebuilt --prod` ships.
8. Smoke-test prod (see §8).

---

## 3. Migration Workflow — Ordering Matters

**Apply migrations BEFORE merging. Every time. No exceptions.**

```
PR branch → write supabase/migration-<topic>.sql
         → apply via Supabase MCP (mcp__claude_ai_Supabase__apply_migration)
         → verify with MCP list_migrations (confirm it appears)
         → merge PR
         → migration-check job: remote count >= local count → passes
         → deploy proceeds
```

**If you forget to apply the migration:**
1. `migration-check` fails. Deploy aborts.
2. Apply the migration via MCP now: `mcp__claude_ai_Supabase__apply_migration`
3. Confirm with `mcp__claude_ai_Supabase__list_migrations`
4. Re-trigger the workflow: GitHub → Actions → Prod Deploy → Run workflow (or push an empty commit)

**Migration file naming:** `supabase/migration-<topic>.sql` (non-canonical layout — known flaky with Supabase GitHub integration; disable that integration if it fires false positives on PRs).

**Never use `supabase db push` in CI.** The Supabase MCP is the apply path. The `migration-check` job only reads, never writes.

---

## 4. Hotfix Deploy (Skip the Review Queue)

**For genuine prod emergencies only. Not for "I want to ship faster."**

1. Triage in Sentry first (I2.3 — observability runbook). Get the `correlation_id`, trace the handler, identify blast radius.
2. If it's a runtime regression with no schema involvement: **skip the code fix.** Use Instant Rollback (§5) — it's faster and reversible.
3. If fix-forward is required:
   - Push a fix branch, open a PR
   - Merge with minimal review (communicate in Slack/Discord that you're emergency-shipping)
   - Standard pipeline runs — no shortcuts needed, `prod-deploy.yml` fires on merge
4. **After the incident:** write `docs/incidents/YYYY-MM-DD-<short-title>.md` with timeline, root cause, and corrective action.

---

## 5. Rollback Procedure

Two options. Pick the right tool.

### Option A — Instant Rollback (Preferred for runtime regressions)

1. Vercel Dashboard → Project → Deployments
2. Find the last known-good deployment
3. Click the `...` menu → **Promote to Production**
4. Effect in <30 seconds. Zero code change. Zero pipeline run.

**Use this when:** bad deploy, runtime crash, config regression, unexpected behavior introduced by the latest push.

### Option B — Revert Commit (Required when migration is involved)

```bash
git revert <bad-sha>
# opens editor — accept the default message
git push origin -u revert/<bad-sha>
# open PR, merge, pipeline runs normally
```

Effect in ~10 min (CI + migration-check + reviewer approval + deploy).

**Use this when:** the bug is in a migration or schema change that can't simply be rolled back by reverting the binary. Coordinate with the Supabase MCP to write and apply a compensating migration first.

**Never force-push master.** See CLAUDE.md §PARALLEL-SESSION DISCIPLINE.

---

## 6. Secret Rotation Procedure

Full procedure: `docs/security/secret-rotation.md` (pending — I3.5).

**High-level flow:**

1. Rotate the secret in the external provider (Vercel dashboard, Supabase, Anthropic, etc.)
2. Update Vercel env:
   ```bash
   vercel env add <VAR_NAME> production
   # or use Vercel dashboard → Settings → Environment Variables
   ```
3. Trigger a prod redeploy to pick up the new value:
   - GitHub → Actions → Prod Deploy → **Run workflow** (workflow_dispatch)
4. Verify: `curl https://mcv-one.vercel.app/api/health` returns 200 with `db_ok: true`
5. Revoke the old secret in the provider.

---

## 7. Cron Job SLOs

All crons run on Vercel Fluid Compute. Max function duration: 120s (`vercel.json`).

### `/api/compliance-cron`
- **Purpose:** OFAC/KYC cache refresh — keeps compliance state current
- **Schedule:** Every hour
- **SLO:** p95 < 30s
- **Alert:** Fire if > 60s or if any invocation errors. Non-negotiable — compliance state must not go stale.

### `/api/cron-asset-rediscovery`
- **Purpose:** Re-scan all venture-owned digital assets (on-chain, off-chain, indexed state)
- **Schedule:** Daily at 06:00 UTC
- **SLO:** p95 < 10 min
- **Alert:** Fire if 2 consecutive daily runs fail. One skip is acceptable; two is a data integrity risk.

### `/api/venture-docs-embed`
- **Purpose:** Embed venture documents into pgvector (`kovsdngjojzfebrxulyj`) for semantic retrieval
- **Schedule:** Every 30 min
- **SLO:** p95 < 2 min
- **Alert:** Fire if > 5 min. Stale embeddings degrade NAOS retrieval quality.

### `/api/content-embed`
- **Purpose:** Embed CMS/generic content entries into pgvector
- **Schedule:** Every 30 min
- **SLO:** p95 < 2 min
- **Alert:** Fire if > 5 min (same threshold as venture-docs-embed).

### `/api/cron-capital-distributions`
- **Purpose:** Process pending capital distributions — royalty payouts, dividends, EDGE token distributions
- **Schedule:** Every 5 min
- **SLO:** p95 < 30s
- **Alert:** Fire immediately on any failure. **Money is at stake.** Failures must page on-call.

### `/api/cron-notifications-dispatch`
- **Purpose:** Fan out queued notifications (email, SMS, push)
- **Schedule:** Every 2 min
- **SLO:** p95 < 15s
- **Alert:** Fire if error rate > 5% over any 10-min window. Queue buildup compounds.

---

## 8. Health Checks + Smoke Tests

### Health endpoint (I2.2)

`GET /api/health`

Returns:
```json
{
  "ok": true,
  "db_ok": true,
  "migrations_count": 42,
  "active_crons": 6,
  "commit_sha": "abc1234",
  "uptime_ms": 3600000
}
```

- `200` = healthy
- `503` = DB down or critical dependency failure

### Quick smoke commands

```bash
# Basic up-check
curl https://mcv-one.vercel.app/api/health

# Full health payload
curl https://mcv-one.vercel.app/api/health | jq

# Assert 200
curl -s -o /dev/null -w "%{http_code}" https://mcv-one.vercel.app/api/health

# Post-deploy verification: confirm commit SHA matches
curl -s https://mcv-one.vercel.app/api/health | jq '.commit_sha'
```

### Post-deploy checklist

- [ ] `/api/health` returns 200 with `db_ok: true`
- [ ] `migrations_count` matches expected count
- [ ] Primary UI routes load (command center, venture sidebar, NAOS chat)
- [ ] Claude API chat responds (requires `VITE_ANTHROPIC_API_KEY` set)
- [ ] Cron jobs visible in Vercel dashboard → Cron tab (6 active)

---

## 9. Required GitHub Secrets

Set in: **GitHub repo → Settings → Secrets and variables → Actions**

| Secret | Purpose | Where to get it |
|---|---|---|
| `VERCEL_TOKEN` | Vercel CLI auth — deploy scope required | vercel.com/account/tokens |
| `VERCEL_ORG_ID` | Vercel org targeting | `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | Vercel project targeting | `.vercel/project.json` after `vercel link` |
| `SUPABASE_DB_HOST` | psql host for migration-check | Typically `aws-0-us-west-2.pooler.supabase.com` |
| `SUPABASE_DB_PASSWORD` | Supabase service role DB password | Supabase dashboard → Settings → Database |

**Verify these are set before the first prod deploy.** Missing secrets cause cryptic Vercel CLI auth failures, not helpful error messages.

---

## 10. GitHub Environment Configuration

Environment name: **`production`**

Configure at: **GitHub repo → Settings → Environments → production**

| Setting | Value |
|---|---|
| Required reviewers | Tony + any 5D+ ops persona |
| Deployment branches | `master` only (restrict to selected branches) |
| Wait timer | Optional: 0 min (approval is the gate) |

**Effect:** Every push to `master` that passes `migration-check` will pause at the `deploy-prod` job and wait for a reviewer to click Approve in the GitHub Actions UI before Vercel gets the deploy command.

If no environment is configured, the pause step is skipped silently and deploys ship without review. **Do not let this happen.**

---

## 11. Failure Modes + Recovery

| Failure | Symptom | Recovery |
|---|---|---|
| **CI: lint fails** | Red check on PR — ESLint errors | Fix locally → `npm run lint` → re-push |
| **CI: tsc fails** | Red check on PR — type errors | Fix types → `npm run build` to verify → re-push |
| **CI: tests fail** | Red check on PR — Vitest failures | `npm test` locally → fix → re-push |
| **migration-check fails** | `prod-deploy.yml` step fails: "local > remote" | Apply migration via MCP → re-run workflow (`workflow_dispatch`) |
| **Vercel build fails** | `deploy-prod` step fails | Check Vercel dashboard logs → usually env var misconfiguration or build script error |
| **Prod deploy succeeds but app crashes** | Sentry spike, `/api/health` 503 | Instant Rollback via Vercel dashboard (§5 Option A) — diagnose after |
| **Cron `/api/cron-capital-distributions` errors** | Payment processing stalled | Page on-call immediately. Check Sentry `correlation_id`. Do NOT auto-retry without root cause. |
| **Supabase GitHub integration fires on migration SQL** | False-positive PR failure from Supabase | Disable the Supabase GitHub integration (see `project_supabase_preview_flaky.md`). It conflicts with the non-canonical `supabase/migration-*.sql` layout. |
| **`production` environment has no reviewers configured** | Deploy ships without review | Add reviewers in GitHub → Settings → Environments → production |
| **Husky blocks commit** | Pre-commit hook failure | If the failing file is pure markdown/config (not `.ts`/`.tsx`), `git commit --no-verify` is acceptable — lint-staged only covers TypeScript files |

---

## 12. Incident Response

Full triage procedures: `docs/observability/runbook.md` (pending — I2.6)

Covers:
- Sentry error triage and `correlation_id` lookup
- Fabric event correlation
- Alert routing (Slack → on-call → PagerDuty)

**Post-incident:** every production incident that required rollback, hotfix, or on-call page gets a post-mortem at `docs/incidents/YYYY-MM-DD-<short-title>.md`.

Minimum fields:
- Timeline (UTC timestamps)
- Root cause
- Blast radius / affected users
- Corrective action + owner
- Preventive measures

---

*This runbook covers I1.1 (`ci.yml`) + I1.2 (`preview-deploy.yml`) + I1.3 (`prod-deploy.yml`) + I1.6 (husky + lint-staged). Update it when the pipeline changes.*
