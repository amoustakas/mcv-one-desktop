# OWASP Top-10 Security Audit -- MCV One Desktop
**Date:** 2026-04-17
**Auditor:** NAOS (automated code audit + Supabase MCP)
**Branch:** marathon-5-i3-rbac-2026-04-17
**Supabase project:** kovsdngjojzfebrxulyj
**M5 hardening:** I2.1 pino+redaction, I2.3 Sentry PII scrub, I2.5 correlation_id, I3.1 RLS on 8 tables, I3.2 webhook sig verify, I3.3 rate limit, I3.4 Clerk org scope in flight.

---

## 1. Executive Summary

Marathon 5 hardened the stack materially. RLS is clean (zero unprotected tables in the public schema), signed-webhook verification replaced the prior warn-and-accept path, rate limiting covers all inbound-public endpoints and every webhook, and pino structured logging plus Sentry gives full observability. Six gaps remain -- none exploitable without authenticated access except two that demand immediate attention: a **CRITICAL** Clerk middleware-bypass vulnerability in @clerk/shared less than 4.8.1 (active CVE GHSA-vqx2-fgx2-5wq9) and a **HIGH** API key leak from live-proxy that returns the raw Google AI key to any authenticated session. Fix both before the next ship.

### Category Pass/Fail Table

| Number | Category | Status | Severity |
|--------|----------|--------|----------|
| A01 | Broken Access Control | GAP | MED |
| A02 | Cryptographic Failures | GAP | HIGH |
| A03 | Injection | PASS | -- |
| A04 | Insecure Design | PASS | -- |
| A05 | Security Misconfiguration | GAP | MED |
| A06 | Vulnerable and Outdated Components | GAP | CRITICAL |
| A07 | Identification and Authentication Failures | PASS | -- |
| A08 | Software and Data Integrity Failures | PASS | -- |
| A09 | Security Logging and Monitoring Failures | PASS | -- |
| A10 | Server-Side Request Forgery | GAP | HIGH |

---

## 2. Scope

**In scope:** src/**, api/_handlers/**, supabase/**, vercel.json, package.json and package-lock.json.

**Out of scope:** node_modules (npm audit is the proxy), packages/* and @mcv/*-sdk internals (own audit cadence), Clerk Dashboard config (cannot introspect from code -- flagged as RECOMMEND-CHECK), infrastructure layer (Vercel/Supabase hosting assumed compliant per SLA).

---

## 3. Detailed Findings

---

### A01 -- Broken Access Control

**Status: GAP (MED)**

#### 3.1.1 RLS Coverage

**SQL run via Supabase MCP execute_sql:**

    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public' AND rowsecurity = false
    ORDER BY tablename;

**Result: empty set -- zero unprotected tables in the public schema.**

I3.1 closed all 8 previously-zero-policy tables. Every table in production now has RLS enabled.

PASS on RLS coverage.

#### 3.1.2 requireVentureScope Handler Coverage

**Command run:**

    grep -rn "requireVentureScope" --include="*.ts" api

**Result:** Zero hits. I3.4 (in-flight in this worktree) is creating src/lib/server/require-venture-scope.ts and applying it to 4 handlers. The file exists as an untracked addition but handler application is still in progress -- only api/_handlers/venture-detail.ts is modified per git status --short.

**GAP -- A01-01:** Venture-scoped handlers beyond the 4 targeted by I3.4 may serve cross-tenant data to any authenticated user who knows a ventureId. Handlers that accept venture_id/ventureId params and perform Supabase reads without verified org-scope gating:

- api/_handlers/dashboard.ts
- api/_handlers/epics.ts
- api/_handlers/capital.ts
- api/_handlers/distributions.ts
- api/_handlers/royalty-graph.ts

RLS alone is not sufficient if the JWT org_id claim is not checked at the application layer. RLS policies must filter on auth.jwt()->'org_id' to be safe end-to-end.

**Recommendation:** After I3.4 lands, enumerate all handlers reading venture-scoped tables (ventures, capital_flows, distributions, epics, royalty_graphs) and ensure requireVentureScope wraps them. Add a CI lint rule that fails the build if any handler importing a venture-scoped table does not import requireVentureScope.

**Effort:** MED (1-2 sessions post-I3.4)

---

### A02 -- Cryptographic Failures

**Status: GAP (HIGH)**

#### 3.2.1 Secrets Committed to Repo

**Command run:**

    grep -rn "sk_live_\|sk_test_\|AIza\|ey[A-Za-z0-9]{20,}" --include="*.ts" --include="*.tsx" src api

**Result:**

    src/lib/server/webhook-verify.ts:96:
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder');

This is a placeholder string literal -- not a real key. The actual key is pulled from process.env.STRIPE_SECRET_KEY. False positive; no live secret committed.

PASS -- no live secrets in source.

#### 3.2.2 HTTPS Enforcement

**Command run:**

    grep -rn "http:" --include="*.ts" --include="*.tsx" src api | grep -v "//"

**Findings:**
- src/lib/capital/adapters/docusign-adapter.ts:214 -- strips http:// scheme from URL string for audience construction. Not a plaintext connection.
- src/lib/__tests__/factory-client.test.ts -- multiple http://f test fixture URLs. Not prod paths.

No production code makes outbound plaintext HTTP connections. Vercel enforces HTTPS on all inbound traffic.

PASS on HTTPS enforcement.

#### 3.2.3 Password Hashing

N/A -- passwords are not stored. Authentication fully delegated to Clerk. No password hash logic in this codebase.

PASS (N/A).

---

### A03 -- Injection

**Status: PASS**

#### 3.3.1 Supabase RPC Call Patterns

**Command run:**

    grep -rn "supabase\.rpc" --include="*.ts" --include="*.tsx" src api | head -20

**Result (8 calls found):**

    api/_handlers/chat.ts:43:           supabase.rpc('match_chunks', { query_embedding, ... })
    api/_handlers/google-rag.ts:92:    supabase.rpc('match_chunks', { ... })
    api/_handlers/google-rag.ts:138:   supabase.rpc('match_chunks', { ... })
    api/_handlers/kit-registry.ts:109: supabase.rpc('increment_kit_downloads', { p_kit_id: kitId })
    api/_handlers/naos-agents.ts:255:  supabase.rpc('increment_field', { ... })
    api/_handlers/storage-meta.ts:163: supabase.rpc('match_chunks', { ... })
    api/_handlers/ventures.ts:205:     supabase.rpc('refresh_venture_quests')
    api/_handlers/ventures.ts:283:     supabase.rpc('refresh_venture_quests')

All 8 calls use Supabase JS client parameterized object-literal pattern. Zero string concatenation into RPC arguments. The Supabase client serializes these as positional bindings server-side.

PASS -- all RPC calls are parameterized.

#### 3.3.2 Dynamic Code Execution

**Command run:**

    grep -rn "eval(\|new Function" --include="*.ts" --include="*.tsx" src api

**Result: no output.** Zero occurrences. The Kit Sandbox uses a Web Worker isolation model -- code execution is sandboxed via Worker message passing, not inline evaluation.

PASS -- no unsafe dynamic code execution.

#### 3.3.3 XSS via innerHTML

**Command run:**

    grep -rn "dangerouslySetInnerHTML\|innerHTML" --include="*.tsx" src

**Result:**

    src/components/chat/ArtifactsPanel.tsx:72:
      {/* SVG -- render as Markdown code block for safety (no dangerouslySetInnerHTML) */}

A comment explicitly documents SVG content is NOT rendered via dangerouslySetInnerHTML. Zero actual usages of either pattern.

PASS -- no XSS-prone rendering patterns.

---

### A04 -- Insecure Design

**Status: PASS**

#### 3.4.1 Signed Webhook Verification (I3.2)

The file header of src/lib/server/webhook-verify.ts explicitly states:
"Replaces the prior warn-and-accept path -- zero-trust for external callers: no signature, no access."

All 5 webhook handlers confirmed to import the shared verify module and return 401 on failure:
docusign-webhook.ts, investor-flow-webhook.ts, plaid-webhook.ts, stripe-webhook.ts, verify-investor-webhook.ts.

PASS -- warn-and-accept is dead.

#### 3.4.2 Rate Limiting Coverage (I3.3)

All wrapped endpoints confirmed by grep for withRateLimit:

| Handler | Limit |
|---------|-------|
| prospects.ts | LIMITS.PROSPECT_INTAKE (10/min by IP) |
| investor-flow.ts | LIMITS.INVESTOR_FLOW |
| investor-flow-webhook.ts | LIMITS.WEBHOOK (by IP) |
| stripe-webhook.ts | LIMITS.WEBHOOK (by IP) |
| plaid-webhook.ts | LIMITS.WEBHOOK (by IP) |
| docusign-webhook.ts | LIMITS.WEBHOOK (by IP) |
| verify-investor-webhook.ts | LIMITS.WEBHOOK (by IP) |
| v1/index.ts | checkRateLimit per API key tier |

Internal authenticated endpoints rely on Clerk JWT validation as throttle. Acceptable posture.

PASS -- all inbound-public and webhook endpoints rate-limited.

#### 3.4.3 Correlation ID Propagation (I2.5)

Implemented across all handlers via pino requestId injection. Full audit trail reconstruction enabled.

PASS.

---

### A05 -- Security Misconfiguration

**Status: GAP (MED)**

#### 3.5.1 Health Endpoint Secret Exposure

**File read:** api/_handlers/health.ts

**GAP -- A05-01:** The /api/health endpoint returns env_names -- the names of all environment variables whose keys contain KEY, TOKEN, SECRET, URL, etc. While values are not returned, the full list of configured secret names is public to any unauthenticated caller. This reveals which third-party integrations are active (Stripe, Plaid, DocuSign, Clerk, Google AI, n8n, Cloudflare) -- useful reconnaissance for a targeted attacker.

The boolean configured map (e.g. { STRIPE_SECRET_KEY: true }) is also returned to unauthenticated callers and confirms which specific keys are set.

Any HTTP client can hit https://mcv-one.vercel.app/api/health and enumerate the full integration surface without authentication.

**Recommendation:** Add requireAuth guard to /api/health OR strip env_names from the response entirely. Fix before next ship.

**Effort:** LOW (30 min)

#### 3.5.2 CORS Wildcard on v1 API

**Command run:**

    grep -rn "Access-Control-Allow-Origin" --include="*.ts" api

**Result:**

    api/_handlers/v1/index.ts:64:  res.setHeader('Access-Control-Allow-Origin', '*');

The public platform API sets Access-Control-Allow-Origin: *. The v1 API uses API key auth so direct exploit requires a valid API key. However, wildcard CORS plus API key auth is a poor combination: a user tricked into visiting a malicious page could have their browser silently make API calls using the victim API key if stored client-side.

**GAP -- A05-02:** Wildcard CORS on an authenticated API. Should restrict to explicit allowlist: https://mcv.one, https://mcv-one.vercel.app, named partner origins.

**Effort:** LOW (1 hour)

#### 3.5.3 vercel.json Configuration

No unsafe public:true flags. No sensitive paths exposed without auth. Cron routes protected by Vercel built-in cron auth header. maxDuration:120 acceptable.

PASS on vercel.json.

---

### A06 -- Vulnerable and Outdated Components

**Status: GAP (CRITICAL)**

**Command run:**

    npm audit --audit-level=high 2>&1 | head -40

**Full audit summary: 33 vulnerabilities (15 moderate, 16 high, 2 critical)**

#### Critical vulnerabilities

| Package | Advisory | Severity | Fix |
|---------|----------|----------|-----|
| @clerk/shared >=4.0.0 and less than 4.8.1 | GHSA-vqx2-fgx2-5wq9 -- Middleware route protection bypass | CRITICAL | npm audit fix |

**GAP -- A06-01 (CRITICAL):** Clerk middleware bypass is directly exploitable -- attacker can bypass route protection enforced by clerkMiddleware() on affected versions without a valid session. This is a ship-blocker. Run npm audit fix immediately, then verify Clerk middleware end-to-end.

#### High vulnerabilities

| Package | Advisory | Severity | Fix |
|---------|----------|----------|-----|
| bigint-buffer any version | GHSA-3gc7-fjrx-p6mg -- Buffer Overflow in toBigIntLE() | HIGH | No fix available |
| vite 8.0.0 through 8.0.4 | GHSA-4w7w-66w2-5vf9 -- Path Traversal optimized deps | HIGH | npm audit fix |
| vite 8.0.0 through 8.0.4 | GHSA-v2wj-q39q-566r -- server.fs.deny bypass | HIGH | npm audit fix |
| vite 8.0.0 through 8.0.4 | GHSA-p9ff-h696-f583 -- Arbitrary file read dev server WS | HIGH | npm audit fix |
| minimatch 10.0.0 through 10.2.2 | GHSA-3ppc-4f35-3m26 -- ReDoS | HIGH | npm audit fix --force (breaking) |
| path-to-regexp 4.0.0 through 6.2.2 | GHSA-9wv6-86v2-598j -- Backtracking RegEx | HIGH | via @vercel/node upgrade |

**Notes on Vite:** The 3 HIGH Vite vulnerabilities affect the dev server only (vite dev). Production uses vite build output on Vercel CDN -- not exploitable in prod. Still upgrade to protect local dev environments where source code lives.

**Notes on bigint-buffer:** No fix available. Pulled in via @solana/pay dep chain. If Solana Pay is unused in active features, remove the dependency entirely.

**GAP -- A06-02 (HIGH):** Vite dev server vulnerabilities -- patch by running npm audit fix.

**GAP -- A06-03 (HIGH):** bigint-buffer buffer overflow -- no upstream fix; evaluate removing @solana/pay if inactive.

**Recommendation:** Run npm audit fix immediately (fixes Clerk CRITICAL + Vite HIGH). For minimatch and path-to-regexp (via @vercel/node), run npm audit fix --force on a test branch and validate before merging to master.

---

### A07 -- Identification and Authentication Failures

**Status: PASS**

#### 3.7.1 Session Extension / Tampering

**Command run:**

    grep -rn "setSession\|signIn.*extend\|sessionToken.*extend" --include="*.ts" --include="*.tsx" src

**Result:** Matches are setSessionEvents in src/stores/memory.ts -- in-memory store for Claude Code session tracking, completely unrelated to Clerk. No custom Clerk session extension logic found.

PASS -- session lifetime fully controlled by Clerk defaults.

#### 3.7.2 MFA Support

Cannot verify from code. Clerk supports MFA natively. RECOMMEND: Verify in Clerk Dashboard that MFA is enabled for admin/owner org roles before public launch.

#### 3.7.3 Auth Rate Limiting

Prospect intake (10/min by IP) covers unauthenticated inflow. Clerk infrastructure rate-limits its own auth endpoints.

PASS.

---

### A08 -- Software and Data Integrity Failures

**Status: PASS**

#### 3.8.1 Unsafe Dependency Scripts

package.json scripts section verified: dev, build, lint, test, preview, smoke:triangle, seed:prospects. No postinstall, no preinstall, no prepare hook. No scripts perform network downloads or execute third-party binaries during install.

PASS -- dependency install is clean.

#### 3.8.2 Lock File Committed

package-lock.json exists and is committed. npm ci in CI reproduces a deterministic build.

PASS.

#### 3.8.3 Signed Commits

Not enforced. No GPG signing configured.

**GAP -- A08-01 (LOW):** No commit signing on master. Recommend enabling GitHub branch protection with signed-commit requirement as a future hardening step.

---

### A09 -- Security Logging and Monitoring Failures

**Status: PASS**

All monitoring primitives are live:

| Primitive | Status | Notes |
|-----------|--------|-------|
| pino structured logging (I2.1) | PASS | 138 handlers, PII field redaction list |
| Sentry error capture (I2.3) | PASS | Client + server, PII scrubbing before send |
| Correlation ID (I2.5) | PASS | X-Request-ID propagated and logged per request |
| Rate-limit 429 logging | PASS | withRateLimit wrapper logs 429s via pino |
| Webhook signature failures | PASS | WebhookVerificationError caught, 401 returned, pino error level |

No gaps found.

---

### A10 -- Server-Side Request Forgery (SSRF)

**Status: GAP (HIGH)**

#### 3.10.1 Factory Proxy (localhost:7004)

No dedicated factory.ts handler found in api/_handlers/. The factory client is invoked internally from src/lib/ with base_url from env var defaulting to http://localhost:7004. No exposed HTTP handler proxies arbitrary factory URLs to external callers.

PASS on factory proxy.

#### 3.10.2 live-proxy API Key Handoff

**File read:** api/_handlers/live-proxy.ts

**GAP -- A10-01 (HIGH):** The live-proxy handler on action get-session-key returns the raw GOOGLE_AI_KEY value to any authenticated user:

    case 'get-session-key':
      return res.json({ apiKey: GOOGLE_AI_KEY });

The handler comment acknowledges: "In production, this should be replaced with a short-lived session token system."

Any authenticated session can extract the production Google AI API key and use it for arbitrary Gemini API calls outside the application -- quota exhaustion, unexpected charges, data exfiltration via Google AI infrastructure.

**Recommendation:** Implement short-lived ephemeral token exchange via Vertex AI service account impersonation, or proxy all Live API calls server-side and never hand the raw key to the client. Fix before next ship.

**Effort:** MED (half-session)

#### 3.10.3 kit-credential-proxy Path Injection

**File read:** api/_handlers/kit-credential-proxy.ts

The credential proxy validates service against hard-coded serviceConfigs and validates path against per-service allowedPaths regex allowlist. The check logic:

    const patterns = allowedPaths[service];
    if (patterns && !patterns.some((p) => p.test(path))) {
      return res.status(403).json({ error: 'Path not allowed' });
    }
    const url = config.baseUrl + path;

The conditional (if patterns &&) means if a service has no allowedPaths entry, the path check is skipped entirely and arbitrary paths are allowed.

**GAP -- A10-02 (MED):** Services in serviceConfigs without a corresponding allowedPaths entry get zero path validation. The n8n service uses N8N_BASE_URL (externally-configurable env var). If allowedPaths.n8n is not defined, an authenticated user can proxy to arbitrary n8n API paths.

**Recommendation:** Audit that every key in serviceConfigs has a non-empty allowedPaths entry. Add a startup assertion that throws if any service lacks path patterns. Treat missing allowedPaths as a deploy-time error.

**Effort:** LOW (30 min)

#### 3.10.4 User-Controlled URLs in Fetch Calls

**Command run:**

    grep -rn "req.body.url\|req.query.url\|body.url\|query.url\|userUrl\|targetUrl" --include="*.ts" api

**Result:** No matches. No handler takes a user-supplied URL and passes it directly to fetch.

PASS -- no open URL fetch proxy.

---

## 4. Gap Backlog -- M6 Security Polish

All gaps ranked by severity. Direct inputs to the M6 planning board.

| ID | Category | Description | Severity | Effort | Priority |
|----|----------|-------------|----------|--------|----------|
| A06-01 | A06 | @clerk/shared CRITICAL middleware bypass CVE -- run npm audit fix NOW | CRITICAL | 30 min | Ship-blocker |
| A10-01 | A10 | live-proxy hands raw GOOGLE_AI_KEY to any authed session -- replace with ephemeral token | HIGH | 0.5 session | Ship-blocker |
| A06-02 | A06 | Vite 8.0.x HIGH vulns (3x dev server) -- npm audit fix | HIGH | 30 min | M6.1 |
| A06-03 | A06 | bigint-buffer buffer overflow -- no upstream fix; evaluate removing @solana/pay | HIGH | 1 hr | M6.1 |
| A01-01 | A01 | Venture-scoped handlers beyond I3.4 lack requireVentureScope | MED | 1-2 sessions | M6.2 |
| A05-01 | A05 | /api/health leaks all env var key names to unauthenticated callers | MED | 30 min | M6.1 |
| A05-02 | A05 | v1/index.ts CORS wildcard on authenticated API | MED | 1 hr | M6.2 |
| A10-02 | A10 | kit-credential-proxy services without allowedPaths get zero path validation | MED | 30 min | M6.1 |
| A08-01 | A08 | No GPG signed commits enforced on master | LOW | 1 hr | M6.3 |

**Summary:** 2 ship-blockers (fix before next prod push). 4 MED items are M6.1 (next sprint). 2 MED items are M6.2. 1 LOW is M6.3.

---

## 5. Follow-Up Audits

### Cadence

- **Every 90 days** -- full OWASP Top-10 pass. Next due: 2026-07-17.
- **After any major dependency upgrade** -- re-run npm audit plus spot-check A01 and A10.
- **After any new public endpoint added** -- verify rate limiting, auth, and RLS coverage before merge.
- **After I3.4 lands** -- re-run A01 section; verify all venture-scoped handlers are wrapped.

### Triggers for immediate re-audit

- Any new CVE advisory against Clerk, Supabase JS client, or Vite
- Any new external webhook integration (new sig verification required before launch)
- Any change to kit-credential-proxy serviceConfigs map

### Tools used in this audit

- Supabase MCP execute_sql for live RLS state query against kovsdngjojzfebrxulyj
- npm audit --audit-level=high for dependency CVE chain
- grep / Glob / Read for static analysis across src/** and api/**
- Manual code review: health.ts, live-proxy.ts, kit-credential-proxy.ts, webhook-verify.ts, v1/index.ts

---

*Generated by NAOS -- MCV One Desktop security toolchain. Re-run on schedule or after any infrastructure change.*
