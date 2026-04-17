# MCV One Desktop — Observability Runbook

> **Audience:** Oncall engineers, NAOS build agents, anyone triaging a prod incident.
> **Rule:** Every failure has a `correlation_id`. Find it first. Everything else follows.

---

## 1. Observability Stack Overview

All telemetry flows from a single root: the `correlation_id` minted at the Vercel edge on
every inbound request. From that point forward, every log line, Sentry event, Fabric publish,
and DB write carries that ID. Incidents become a grep, not a guess.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  USER BROWSER                                                               │
│  ┌────────────────────┐  ┌─────────────────────┐  ┌──────────────────────┐ │
│  │  Sentry (client)   │  │  Vercel Analytics   │  │  web-vitals beacon   │ │
│  │  render errors     │  │  pageviews + CWV    │  │  → /api/web-vitals   │ │
│  │  replay-on-error   │  │  anonymised         │  │  → pino log          │ │
│  └────────┬───────────┘  └─────────────────────┘  └──────────────────────┘ │
│           │ correlation_id in Sentry tags                                   │
└───────────┼─────────────────────────────────────────────────────────────────┘
            │  HTTP  x-correlation-id header (inbound + outbound)
            ▼
┌───────────────────────────────────────────────────────────────┐
│  VERCEL HANDLER  (api/_handlers/*.ts)                         │
│  • pino: request_in / request_out / error                     │
│  • AsyncLocalStorage carries correlation_id through ALS ctx   │
│  • Sentry (@sentry/node) catches unhandled exceptions         │
│  • fetchWithCorrelation injects x-correlation-id outbound     │
└──────┬────────────────┬──────────────────┬────────────────────┘
       │                │                  │
       ▼                ▼                  ▼
┌──────────────┐ ┌────────────┐  ┌─────────────────────────────┐
│  Supabase    │ │  Triangle  │  │  Factory (port 7004)        │
│  Postgres    │ │  (kernel)  │  │  Genkit / Ollama / Gemini   │
│  audit cols  │ │  events    │  │  flow-run latency tracked   │
│  capital_    │ │  w/ cid    │  │  via trackTiming()          │
│  activities  │ │            │  │                             │
│  agent_      │ └────────────┘  └─────────────────────────────┘
│  activity_   │
│  log         │
└──────────────┘

Every hop: correlation_id propagated via x-correlation-id header or DB column.
```

---

## 2. What We Emit

### pino Structured Logs (`src/lib/server/logger.ts`)

Three canonical event shapes — every handler emits all three:

| Event | Key Fields |
|---|---|
| `request_in` | `correlation_id`, `path`, `method`, `service`, `env`, `commit` |
| `request_out` | `correlation_id`, `path`, `method`, `status`, `duration_ms` |
| `error` | `correlation_id`, `path`, `err.message`, `err.stack` |

Base fields on every line: `service: 'mcv-one-desktop'`, `env`, `commit` (8-char SHA).

PII redaction: see §6.

### Sentry

- **Client** (`@sentry/react`): React render errors, unhandled promise rejections,
  replay-on-error session traces (buffer starts on first error, ships on crash).
- **Server** (`@sentry/node`): handler unhandled exceptions. Tags: `venture_id`,
  `correlation_id`, `handler`.
- **PII scrub**: `beforeSend` drops `authorization`, `cookie`, `x-api-key` headers +
  all cookies from `event.request.cookies` before transmission.

### Vercel Analytics

Anonymised pageviews + Core Web Vitals (LCP, INP, CLS, FCP, TTFB). No PII.
Visible in the project dashboard → Analytics tab. No custom events here — use
`trackTiming()` for custom performance spans.

### web-vitals sendBeacon → `/api/web-vitals` → pino

`web-vitals` library fires a `sendBeacon` POST to `/api/web-vitals` on page unload.
Handler at `api/_handlers/web-vitals.ts` parses the payload and emits a pino
`request_out`-style log so web vitals land in the same log stream as handler telemetry.
Downstream aggregator can correlate CWV regressions with backend latency spikes.

### Custom Timings (`trackTiming()`)

High-value paths currently instrumented:

- Factory flow-run latency (ms from trigger → result)
- Factory console mount time
- Investor flow submission round-trip

Use sparingly — see §8 for when to add new timings.

### Fabric Events

Every `MCVEvent<T>` envelope must carry `.correlationId` when published inside a
request scope. Business domains: `capital.*`, `venture.*`, `persona.*`. These are
the audit trail for intent, not execution. Cross-reference with Supabase writes.

### Supabase Audit Tables

| Table | `correlation_id` column | When written |
|---|---|---|
| `public.capital_activities` | `correlation_id` | Every capital flow mutation |
| `public.agent_activity_log` | `correlation_id` | Agent tool invocations |

These tables are the ground truth for "what actually happened in the DB" when a
handler claims it ran.

---

## 3. Incident Response — Finding a `correlation_id`

### Step 1: Recover the ID

**From Sentry** (fastest for engineer-detected incidents):
1. Open the issue in Sentry.
2. Tags panel → copy `correlation_id`.

**From a user report** (user-facing symptoms):
1. Ask the user to open DevTools → Network tab.
2. Click any failed or slow request to the `/api/` prefix.
3. Response Headers → `x-correlation-id`. Copy the value.

**From prod log stream** (if you're already tailing logs):
Every pino line contains `"correlation_id":"<uuid>"` — grep or filter on it.

---

### Step 2: Follow the ID

**Vercel logs:**
```bash
# Stream recent logs filtered to the correlation_id
vercel logs --filter="<correlation_id>"

# Or with the Vercel CLI project flag
vercel logs mcv-one-desktop --filter="<correlation_id>"
```

**Supabase audit tables:**
```sql
-- Capital activities for this request
SELECT activity_type, status, amount_cents, error_message, created_at
FROM public.capital_activities
WHERE correlation_id = '<correlation_id>'
ORDER BY created_at;

-- Agent tool calls for this request
SELECT agent_id, tool_name, duration_ms, error, created_at
FROM public.agent_activity_log
WHERE correlation_id = '<correlation_id>'
ORDER BY created_at;
```

**Fabric events (stub — storage location TBD):**
```sql
-- Once Fabric event store is wired:
SELECT event_type, payload, published_at
FROM fabric.events
WHERE correlation_id = '<correlation_id>'
ORDER BY published_at;
```

**Sentry:**
- Issues → search tag: `correlation_id:<value>`
- Replays tab → filter session by correlation_id tag (requires replay-on-error to
  have fired for this session)

**Triangle / Factory:**
Both services accept `x-correlation-id` inbound (via `fetchWithCorrelation`) and
log it locally. Check each service's log stream with the same correlation_id filter.

---

## 4. Alert Thresholds — What Pages Oncall

### Sentry Alerts
| Condition | Action |
|---|---|
| New issue fingerprint, `production` env, 1 user affected | Post to `#alerts-prod` Slack |
| Same issue, 10+ users affected in 1 hour | Page oncall engineer |
| Any error on `cron-capital-distributions` handler | Page immediately (money at stake) |

Configure in: Sentry project → Alerts → Issue Alerts.

### `/api/health` Uptime Monitor
- External monitor (UptimeRobot or Better Uptime — TBD, see §11) polls every 60 s.
- Monitor URL: `https://mcv-one-desktop.vercel.app/api/health`
- Expected response: `{ "ok": true }` + HTTP 200.
- **2 consecutive failures → page oncall.**
- Health response includes: `ok`, `db_ok`, `migrations_count`, `active_crons`,
  `commit_sha`, `uptime_ms`, `ts`. If `db_ok: false` in a healthy HTTP 200,
  treat it as a soft page.

### Handler Error Rate
pino logs stream to log aggregator (Axiom or Datadog — see §11).
- Alert: `error` event rate > 1% of `request_in` events in any rolling 5-min window.
- Scope: per `path` field so `/api/health` noise doesn't mask `/api/distributions/execute`.

### Cron SLOs
Per the deployment runbook (`docs/deployment/runbook.md` §7):
- `cron-capital-distributions` — must complete within 90 s. Timeout = page.
- `cron-notifications-dispatch` — soft SLO 120 s. Timeout = Slack warning.
- `compliance-cron` — must complete. Failure = Slack + manual review trigger.

### Capital-Critical Rule
**Any unhandled error, timeout, or non-2xx response on `/api/cron-capital-distributions`
or `/api/distributions` pages immediately.** Do not wait for user reports. Money is at stake.

---

## 5. Standard Diagnostic Queries

Paste these into your log aggregator's SQL interface or Supabase SQL editor.
Adjust table/column names to match your aggregator's schema.

```sql
-- ── HANDLER ERROR COUNTS — last hour ──────────────────────────────────────
-- Assumes logs replicated to a log_events table.
-- Adjust for Axiom (APL), Datadog (DQL), or Vercel log drain schema.
SELECT
  path,
  COUNT(*) AS err_count
FROM log_events
WHERE event = 'error'
  AND ts > now() - interval '1 hour'
GROUP BY path
ORDER BY err_count DESC;

-- ── P95 LATENCY BY HANDLER — last hour ────────────────────────────────────
SELECT
  path,
  ROUND(
    percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)
  ) AS p95_ms,
  COUNT(*) AS req_count
FROM log_events
WHERE event = 'request_out'
  AND ts > now() - interval '1 hour'
GROUP BY path
HAVING percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms) > 2000
ORDER BY p95_ms DESC;

-- ── CAPITAL FAILURES — last 24 hours ──────────────────────────────────────
SELECT
  activity_type,
  correlation_id,
  status,
  error_message,
  created_at
FROM public.capital_activities
WHERE created_at > now() - interval '1 day'
  AND (error_message IS NOT NULL OR status = 'failed')
ORDER BY created_at DESC
LIMIT 50;

-- ── AGENT ERRORS — last hour ───────────────────────────────────────────────
SELECT
  agent_id,
  tool_name,
  error,
  correlation_id,
  created_at
FROM public.agent_activity_log
WHERE created_at > now() - interval '1 hour'
  AND error IS NOT NULL
ORDER BY created_at DESC
LIMIT 50;

-- ── TRACE ALL EVENTS FOR ONE CORRELATION_ID ───────────────────────────────
-- Cross-system view (Supabase side only — add Fabric join when storage lands)
SELECT
  'capital_activities' AS source,
  activity_type AS event_type,
  status,
  error_message AS detail,
  created_at
FROM public.capital_activities
WHERE correlation_id = '<your-correlation-id>'
UNION ALL
SELECT
  'agent_activity_log' AS source,
  tool_name AS event_type,
  CASE WHEN error IS NOT NULL THEN 'error' ELSE 'ok' END AS status,
  error AS detail,
  created_at
FROM public.agent_activity_log
WHERE correlation_id = '<your-correlation-id>'
ORDER BY created_at;
```

---

## 6. PII + Redaction Rules

### pino `redact.paths` (exact list from `src/lib/server/logger.ts`)

```
*.authorization
*.cookie
*.token
*.api_key
*.apiKey
*.password
*.secret
req.headers.authorization
req.headers.cookie
```

Censor value: `[REDACTED]`. All redaction is done at the pino layer — values never
reach the log stream or log aggregator.

### Sentry `beforeSend` scrub

Drops from `event.request.headers`: `authorization`, `cookie`, `x-api-key`.
Drops all entries from `event.request.cookies`.

### Rules for New Handlers

1. **Never log raw request bodies.** If you need to log a body field for debugging,
   explicitly pick the non-sensitive keys.
2. If a new handler passes tokens or secrets through its log context, add the exact
   dotted path to `redact.paths` in `src/lib/server/logger.ts` before merging.
3. Sentry: if your handler processes financial PII (SSN, bank account, card numbers),
   add a field-level scrub in `beforeSend` for those keys — don't rely on the
   generic header scrub.
4. Run `grep -r "api_key\|password\|secret\|token" src/lib/server/logger.ts` in CI
   to assert no literal values are constructed before logging.

---

## 7. `correlation_id` Propagation Contract

This is the law. Deviating breaks cross-stack incident triage.

### Inbound (Vercel handlers)

```
Priority 1: x-correlation-id header
Priority 2: x-request-id header (legacy fallback)
Priority 3: generate crypto.randomUUID()
```

Resolved in `src/lib/server/correlation.ts` → `resolveCorrelationId()`.
Handlers MUST call `runWithCorrelation(cid, handler)` to activate the ALS context
so all downstream calls inherit the ID automatically.

### Outbound (any fetch leaving the process)

Use `fetchWithCorrelation()` (wraps native `fetch`). When an ALS context is active,
it auto-injects `x-correlation-id` on every outbound request — Triangle, Factory,
Stripe, Plaid, Supabase REST, external webhooks — all get tagged.

Do not manually set `x-correlation-id` on outbound calls. Let the wrapper do it.
Manual sets can silently diverge from the ALS-carried ID.

### Database Writes

When a handler writes to `capital_activities` or `agent_activity_log`, it MUST
populate the `correlation_id` column with `getActiveCorrelationId()`. If the column
is nullable and you omit it, the row becomes untriageable.

### Fabric Events

Every `MCVEvent<T>` published within a request scope MUST have `.correlationId` set:

```typescript
import { getActiveCorrelationId } from '@/lib/server/correlation';

const event: MCVEvent<CapitalPayload> = {
  type: 'capital.distribution.initiated',
  correlationId: getActiveCorrelationId() ?? crypto.randomUUID(),
  payload: { ... },
};
```

Never publish a Fabric event with `correlationId: undefined` inside a handler.

### Response Header

Every handler response MUST echo the correlation_id in the `x-correlation-id`
response header. This is how users can self-serve the ID from DevTools without
needing Sentry access.

---

## 8. Timing Instrumentation — When to Add Custom Timings

### DO add `trackTiming()` when:

- A user gesture triggers a path that crosses **more than one network hop** before
  the user sees a result (e.g., investor flow submission → Vercel handler →
  Supabase → Triangle → response).
- A Factory flow-run is initiated from the UI — latency here directly affects
  perceived agent responsiveness.
- A client-side computation takes **>100ms** and could affect INP (Interaction to
  Next Paint). Examples: large dataset sort, client-side RAG re-ranking.
- A new critical-path feature ships and you need a baseline before optimizing.

### Do NOT add `trackTiming()` for:

- Simple button clicks with no async work (< 1 network hop, synchronous state update).
- Third-party library initialization (Sentry, Clerk, Supabase client) — they emit
  their own spans.
- Background polling (e.g., presence heartbeat) — log latency in pino instead;
  don't pollute timing dashboards with noise.
- Development-only diagnostics — remove before merging or gate behind `IS_DEV`.

### Format

```typescript
import { trackTiming } from '@/lib/timings';

const end = trackTiming('factory.flow_run');
await runFactoryFlow(params);
end(); // emits timing event with duration_ms
```

---

## 9. Runbook Cross-References

| Topic | Document |
|---|---|
| Deployment procedures, cron SLOs, rollback | `docs/deployment/runbook.md` (I1.4) |
| Secret rotation (API keys, Supabase service role, Sentry DSN) | `docs/security/secret-rotation.md` (I3.5 — in flight) |
| Incident post-mortems | `docs/incidents/YYYY-MM-DD-<slug>.md` |
| Capital flow architecture + five-tuple primitive | `docs/capital/capital-flow-taxonomy.md` |
| Supabase auth / JWT bridge | `docs/supabase-auth.md` |

When I3.5 lands, link it here explicitly. Until then, secret rotation is handled
ad-hoc per the deployment runbook's emergency procedures section.

---

## 10. Example: Walking a Prod Incident End-to-End

**Report:** "My capital distribution has been stuck in `processing` for 20 minutes."

**14:48:03** — Oncall gets the Sentry page (10+ users, `cron-capital-distributions`).

**14:48:45** — Engineer opens the Sentry issue. Tags panel: `correlation_id: a3f9c2d1-77e4-4b8a-b012-9e3d45f18c7a`. Copied.

**14:49:10** — Runs:
```bash
vercel logs mcv-one-desktop --filter="a3f9c2d1-77e4-4b8a-b012-9e3d45f18c7a"
```
Sees `request_in` on `POST /api/distributions/execute` at `14:32:01.441Z`.
Next matching line: `request_out` at `14:34:09.887Z` — `duration_ms: 128446`.
Handler took over 2 minutes. That's the smoking gun.

**14:50:22** — Queries Supabase:
```sql
SELECT id, activity_type, status, correlation_id, created_at, error_message
FROM public.capital_activities
WHERE correlation_id = 'a3f9c2d1-77e4-4b8a-b012-9e3d45f18c7a';
```
Returns one row: `status: 'processing'`, `started_at: 14:32:01`, `error_message: null`.
Distribution is alive but frozen — the RPC ran but never committed.

**14:51:40** — Digs into the handler trace. `execute_distribution` RPC fired.
Logs show it loaded the royalty graph for venture `warforge`. One layer has
`bps: 12500` (125% — impossible, should be ≤ 10000). Validation skipped because
the CHECK constraint was missing from the `royalty_graph_layers` table.

**14:53:00** — Emergency action per playbook rule #13:
```sql
-- Rollback the frozen distribution
UPDATE public.capital_distributions
SET status = 'failed', error_message = 'royalty bps overflow — manual rollback'
WHERE correlation_id = 'a3f9c2d1-77e4-4b8a-b012-9e3d45f18c7a';

-- Compensating ledger entry
INSERT INTO public.ledger_entries (...)
VALUES (...);  -- per ops playbook rule #13 format
```

**14:55:00** — Adds the missing constraint:
```sql
ALTER TABLE public.royalty_graph_layers
  ADD CONSTRAINT royalty_bps_max CHECK (bps <= 10000);
```

**15:02:00** — Files `docs/incidents/2026-04-17-royalty-bps-overflow.md`.
Distribution re-queued and completes successfully at 15:03:41.

**Lessons filed:** Missing DB-level CHECK constraint on `bps`. Contract test added.
Monitoring added: alert if any `royalty_graph_layers.bps > 10000` row exists at
cron-distributions run time.

---

## 11. Tools + Dashboards

| Tool | URL / Notes |
|---|---|
| **Sentry** | https://sentry.io/organizations/edgeiq/ — stub, confirm org slug |
| **Vercel Analytics** | Vercel project dashboard → Analytics tab |
| **Vercel Logs** | `vercel logs mcv-one-desktop` or Vercel dashboard → Logs tab |
| **Supabase** | https://supabase.com/dashboard/project/kovsdngjojzfebrxulyj |
| **Uptime monitor** | **TBD** — recommend Better Uptime or UptimeRobot. Configure against `/api/health`. 60 s interval, 2-failure page threshold. |
| **Log aggregator** | **TBD** — Vercel logs have 30-day retention. For longer retention or structured queries, ship to **Axiom** (cheapest, Vercel-native integration) or Datadog. Set up a log drain in Vercel project settings → Integrations. |

### Setting Up the Log Drain (Axiom — recommended)
1. Vercel project settings → Integrations → Browse → Axiom.
2. Connect. Vercel streams all function logs to Axiom automatically.
3. In Axiom: create a dataset `mcv-one-desktop-prod`.
4. Import the alert queries from §5 as saved queries.
5. Wire `error` event rate alert → Slack webhook → `#alerts-prod`.

---

*Last updated: 2026-04-17 — Marathon #5 I2.6*
*Owner: NAOS / oncall rotation*
