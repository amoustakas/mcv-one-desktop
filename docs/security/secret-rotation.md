# Secret Rotation Runbook

**Project:** MCV One Desktop  
**Maintained by:** Security / Ops (owner: Tony)  
**Last reviewed:** 2026-04-17  
**Rotation log:** `docs/security/rotations.log`

---

## 1. Rotation Cadence

| Category | Secrets | Interval | Immediate Trigger |
|---|---|---|---|
| **Auth (Clerk)** | `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `VITE_CLERK_PUBLISHABLE_KEY` | 180 days | Suspected compromise, employee departure |
| **Database (Supabase)** | `SUPABASE_SERVICE_KEY` | 90 days | Provider incident, leaked commit |
| **Payments (Stripe)** | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | 180 days | Unsigned payloads in webhook logs |
| **Payments (Plaid)** | `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_WEBHOOK_SECRET` | 180 days | Unsigned payloads in webhook logs |
| **AI — Anthropic** | `ANTHROPIC_API_KEY` | 180 days | Unexpected usage spike in console |
| **AI — Google** | `GOOGLE_AI_KEY` | 180 days | Unexpected usage spike |
| **AI — Voice** | `DEEPGRAM_API_KEY`, `ELEVENLABS_API_KEY` | 180 days | Unexpected usage spike |
| **Deploy tokens** | `VERCEL_TOKEN`, `CLOUDFLARE_API_TOKEN` | 90 days | Employee departure, suspicious deploy activity |
| **Automation** | `N8N_API_KEY` | 90 days | Employee departure |
| **RPC URLs** | `SOLANA_RPC_URL` | On provider change | Rate-limit breach, provider compromise |

### Force-Immediate Triggers (any category)

- Key appeared in a git commit (committed, PR diff, CI log — real or suspected)
- Employee or contractor offboarding
- Provider posts a security incident bulletin
- Auth failure spikes in Supabase `audit_log` or Clerk API logs
- Unusual IP/geo activity in provider dashboards
- Webhook logs show payloads missing or failing signature verification

---

## 2. General Procedure

Apply this 8-step template to every secret. **Do not skip steps or reorder them.**

### Step 1 — Generate new secret (provider side)

Log into the provider dashboard and create a new secret. **Leave the old secret active.** Do not revoke it yet — step 6 depends on a graceful rollover window.

### Step 2 — Update `.env.example` if key name changed

Only update the structure (key name, comment). Never commit actual values. If the secret was renamed, run:

```bash
# In repo root
grep -r "OLD_KEY_NAME" src/ api/ --include="*.ts" --include="*.tsx"
# Update all references, then commit the rename separately
```

### Step 3 — Update Vercel prod env

```bash
vercel env rm KEY_NAME production
vercel env add KEY_NAME production
# paste new value when prompted
```

Or: Vercel Dashboard → Project → Settings → Environment Variables → Edit → Production.

### Step 4 — Update preview + development envs

```bash
vercel env add KEY_NAME preview
vercel env add KEY_NAME development
```

Skip if the secret is only used in production handlers (e.g., `SUPABASE_SERVICE_KEY`, payment processors).

### Step 5 — Update GitHub Actions secrets

For secrets consumed by CI/CD workflows (`VERCEL_TOKEN`, `SUPABASE_DB_PASSWORD`, `STRIPE_WEBHOOK_SECRET` — see `docs/deployment/runbook.md` for the full CI secrets list):

> Repo → Settings → Secrets and variables → Actions → update relevant secret.

### Step 6 — Trigger prod redeploy

```bash
# Via GitHub Actions workflow_dispatch
gh workflow run prod-deploy.yml --ref master
```

Or push a no-op commit. Wait for green deploy — new env var is now live.

### Step 7 — Revoke old secret

Return to the provider dashboard and revoke / delete the old secret. Only do this **after** step 6's health check passes.

### Step 8 — Verify

```bash
curl -s https://mcv-one.vercel.app/api/health | jq .
```

Expected: `200 OK`. Then smoke-test the affected flow end-to-end (e.g., send a test webhook, make a test API call, authenticate a test user).

### Rotation log entry

Append one line to `docs/security/rotations.log` (see §4 for format).

---

## 3. Provider-Specific Procedures

### 3.1 Clerk

**Dashboard:** https://dashboard.clerk.com

#### `CLERK_SECRET_KEY`

1. API Keys → "Add new secret key" → name it (e.g., `mcv-desktop-2026-07`).
2. Copy new key.
3. Run §2 steps 3-6 with `CLERK_SECRET_KEY`.
4. After redeploy green: revoke old key in Clerk dashboard.
5. Grace window: 24h (Clerk does not auto-expire old keys on rotate).

#### `CLERK_WEBHOOK_SECRET`

> Note: this key is created by I3.4 (webhook handler). Ensure it is present in `.env.example` and Vercel env before rotation.

1. Clerk Dashboard → Webhooks → select the MCV Desktop endpoint.
2. "Regenerate signing secret" → copy new value.
3. Run §2 steps 3-6 with `CLERK_WEBHOOK_SECRET`.
4. Verify: use Clerk's "Send test event" — confirm 200 from `/api/webhooks/clerk`.
5. Old secret is invalidated immediately on regenerate — no grace window. **Redeploy must be green before you click regenerate.**

#### `VITE_CLERK_PUBLISHABLE_KEY`

This key is baked into the Vite bundle at build time. Rotating it requires a full prod build + deploy — plan accordingly:

1. Rotate in Clerk Dashboard (API Keys → Publishable keys → roll).
2. Update Vercel env (prod + preview + development).
3. Trigger prod redeploy — the new bundle will embed the new key.
4. Verify auth flow end-to-end (sign in, JWT validation).
5. Old publishable key: Clerk keeps it valid for 7 days automatically.

---

### 3.2 Supabase

**Dashboard:** https://supabase.com/dashboard/project/kovsdngjojzfebrxulyj/settings/api

#### `SUPABASE_SERVICE_KEY` (service_role key)

1. Settings → API → "service_role" row → "Reveal" → note current last 3 chars for the log.
2. Click "Rotate" (or contact Supabase support if button is absent for your plan).
3. Copy new key.
4. Run §2 steps 3-6 with `SUPABASE_SERVICE_KEY`.
5. After redeploy green: confirm old key rejected (test a direct API call with the old key — expect 401).

**CAUTION — JWT secret vs service_role key:**  
Supabase has two distinct secrets:
- **JWT secret** (Settings → API → JWT Secret): rotating this **invalidates ALL existing user sessions** system-wide. Coordinate with Clerk JWT bridge (`docs/supabase-auth.md`). Only rotate JWT secret during a maintenance window. Clerk's JWT template (`mcv-supabase`) may need to be re-verified after rotation.
- **service_role key** (`SUPABASE_SERVICE_KEY`): safe to rotate without user impact. This is the key used by server-side handlers.

Prefer rotating the service_role key on schedule. Treat JWT secret rotation as a break-glass event.

---

### 3.3 Stripe

**Dashboard:** https://dashboard.stripe.com/apikeys

#### `STRIPE_SECRET_KEY`

1. Developers → API keys → "Create restricted key" (preferred) or use the standard secret key.
2. Copy new key (`sk_live_...`).
3. Run §2 steps 3-6 with `STRIPE_SECRET_KEY`.
4. After redeploy green: revoke old key. Grace window: 24h is safe.
5. Verify: Stripe Dashboard → Events → confirm recent webhook deliveries succeed.

#### `STRIPE_WEBHOOK_SECRET`

1. Developers → Webhooks → select the MCV Desktop endpoint.
2. "Signing secret" section → "Roll secret".
3. Stripe automatically keeps the old secret valid for **24 hours** after rolling. Use this window.
4. Copy new secret (`whsec_...`).
5. Run §2 steps 3-6 with `STRIPE_WEBHOOK_SECRET`.
6. After redeploy green: use "Send test webhook" to confirm new secret validates.
7. After 24h: old secret expires automatically (no manual revoke needed).

---

### 3.4 Plaid

**Dashboard:** https://dashboard.plaid.com/team/keys

#### `PLAID_CLIENT_ID` + `PLAID_SECRET`

1. Team → Keys → "Create new key".
2. Update both `PLAID_CLIENT_ID` and `PLAID_SECRET` in Vercel env (§2 steps 3-6).
3. Revoke old key pair after redeploy green. Grace: 24h.

> `PLAID_ENV` (`sandbox`/`development`/`production`) is not a secret — no rotation needed.

#### `PLAID_WEBHOOK_SECRET`

This is the HMAC-SHA256 fallback secret used for synthetic/dev webhook replay (I3.2). ES256 JWT verification uses Plaid's public JWK fetched per-request — no rotation needed on our side.

1. Plaid Dashboard → Webhooks → select endpoint → "Roll signing secret".
2. Copy new value.
3. Run §2 steps 3-6 with `PLAID_WEBHOOK_SECRET`.
4. Verify: send a test webhook from Plaid dashboard → confirm 200 from the handler.

---

### 3.5 AI Provider Keys

Standard procedure: provider dashboard → create new key → §2 steps 3-6 → revoke old.

#### `ANTHROPIC_API_KEY`

- Dashboard: https://console.anthropic.com/settings/keys
- Create new key → update Vercel → redeploy → revoke old.
- Grace: keys are independent — old key stays valid until explicitly deleted.
- Verify: send a chat message in MCV Desktop → confirm Claude responds.

#### `GOOGLE_AI_KEY`

- Dashboard: https://aistudio.google.com/app/apikey
- Create new key → update Vercel → redeploy → revoke old.
- Verify: trigger a Gemini long-context operation → confirm response.

#### `DEEPGRAM_API_KEY`

- Dashboard: https://console.deepgram.com/project/[PROJECT_ID]/api-keys
- Create new key → update Vercel → redeploy → revoke old.
- Verify: voice STT session in MCV Desktop.

#### `ELEVENLABS_API_KEY`

- Dashboard: https://elevenlabs.io/app/settings/api-keys
- Create new key → update Vercel → redeploy → revoke old.
- Verify: TTS playback in MCV Desktop.

---

### 3.6 Vercel Deploy Token

**Dashboard:** https://vercel.com/account/tokens

1. Create new token → name it `mcv-desktop-ci-YYYY-MM`.
2. Update GitHub Actions secret `VERCEL_TOKEN` (repo → Settings → Secrets → Actions).
3. Trigger a preview deploy to verify CI picks up the new token.
4. Revoke old token in Vercel account settings.
5. Grace: 24h is safe (CI jobs in flight will drain).

---

### 3.7 Solana RPC URL

`SOLANA_RPC_URL` is not rotated on a schedule. Swap it when:

- Provider (Helius, QuickNode, public RPC) changes pricing, deprecates the endpoint, or posts an incident.
- Sustained rate-limit errors appear in Supabase logs or Vercel function logs.
- You switch from free public RPC to a dedicated node.

Procedure: update `SOLANA_RPC_URL` in Vercel env → redeploy. No revoke step (URLs are not secrets in the key-management sense, but treat them as sensitive if they carry API tokens in the URL string).

---

### 3.8 Cloudflare

**Dashboard:** https://dash.cloudflare.com/profile/api-tokens

#### `CLOUDFLARE_API_TOKEN`

1. Profile → API Tokens → "Create Token".
2. Use the "Edit Cloudflare Workers" template, scope to the MCV account.
3. Copy new token.
4. Update Vercel env (§2 steps 3-6) with `CLOUDFLARE_API_TOKEN`.
5. If `CLOUDFLARE_OAUTH_CLIENT_ID` / `CLOUDFLARE_OAUTH_CLIENT_SECRET` are affected: rotate in the same window — they are OAuth app credentials, not API tokens.
6. Revoke old token from Cloudflare dashboard.
7. Verify: trigger a Workers deploy or KV read to confirm new token works.

> `CLOUDFLARE_ACCOUNT_ID` is a public identifier — not a secret, no rotation needed.

### 3.9 n8n

**Location:** self-hosted at `N8N_BASE_URL`

1. n8n UI → Settings → API Keys → create new key.
2. Update `N8N_API_KEY` in Vercel env (§2 steps 3-6).
3. Revoke old key in n8n settings.
4. Verify: trigger an n8n workflow from MCV Desktop → confirm execution.

---

## 4. Rotation Log Format

All rotations must be logged in `docs/security/rotations.log`. Append one line per rotation. **Never write full key values.**

```
YYYY-MM-DDTHH:MM:SSZ | SECRET_NAME | rotated-by | reason | new key tail: ...XYZ (last 3) | old revoked YYYY-MM-DDTHH:MM:SSZ
```

**Example:**

```
2026-04-17T14:33:00Z | CLERK_SECRET_KEY | tony | scheduled (180-day cycle) | new key tail: ...a42 | old revoked 2026-04-18T14:33:00Z
2026-04-17T14:45:00Z | SUPABASE_SERVICE_KEY | tony | scheduled (90-day cycle) | new key tail: ...f91 | old revoked 2026-04-17T14:50:00Z
2026-04-17T15:02:00Z | STRIPE_WEBHOOK_SECRET | tony | unsigned payload alert | new key tail: ...3b8 | old expires automatically 2026-04-18T15:02:00Z
```

Rules:
- Last-3-chars is for audit trail only. It does not expose the full secret.
- "rotated-by" is the person who performed the rotation (name or GitHub handle).
- "reason" is one of: `scheduled (N-day cycle)`, `employee departure`, `suspected compromise`, `provider incident`, `unsigned payload alert`, `unusual log activity`, `other: <detail>`.
- Log entries are append-only. Never edit or delete existing entries.

---

## 5. Emergency Rotation — Leaked Key Drill

Use this playbook when a key is confirmed or suspected to have leaked (committed to git, posted in Slack, appeared in a log).

### 1. Declare incident

Post in `#incidents` (channel pending — use direct message to Tony + Devon until channel exists):

```
INCIDENT: [SECRET_NAME] suspected/confirmed leaked
Source: [commit SHA / Slack message / log URL]
Time discovered: [ISO timestamp]
Owner taking action: [name]
```

### 2. Rotate in provider — no grace window

Generate a new secret in the provider dashboard. Mark the old one for **immediate revocation** — do not apply the normal 24h grace period. Assume the leaked key is being actively exploited.

### 3. Update Vercel env + trigger redeploy

```bash
vercel env rm SECRET_NAME production
vercel env add SECRET_NAME production
# paste new value
gh workflow run prod-deploy.yml --ref master
```

**Expect 2-5 minutes of handler errors** as old Vercel deploys drain. This is acceptable in an incident.

### 4. Revoke old key immediately

Return to the provider dashboard. Revoke the old key the moment the new Vercel deploy is green. Do not wait.

### 5. Audit the exposure window

Review logs for any usage of the leaked key between the suspected leak time and revocation:

| System | Where to look |
|---|---|
| Supabase | Dashboard → Logs → API or `select * from auth.audit_log_entries` |
| Stripe | Dashboard → Developers → Events → filter by date/key |
| Clerk | Dashboard → Logs → filter by API key |
| Anthropic | Console → Usage → filter by key |
| Vercel | Function logs → filter for auth errors or unexpected callers |

Document any suspicious calls in the post-mortem.

### 6. Post-mortem

Within 48 hours, create `docs/incidents/YYYY-MM-DD-secret-leak-<name>.md` covering:

- Timeline (discovery → rotation → revocation)
- Root cause (how did the key leak?)
- Impact assessment (what was accessed?)
- Remediation steps taken
- Process changes to prevent recurrence

---

## 6. Testing Rotation Without Prod Risk

### AI keys

Rotate the key. Run both the old and new keys in provider dashboards for 24h. Compare usage graphs — confirm all traffic migrated to the new key before revoking old.

### Webhook secrets (Stripe, Plaid, Clerk)

During the grace window (old key still valid):
1. Send a test webhook from the provider dashboard using the **new** signing secret.
2. Confirm the handler returns 200.
3. Send a test webhook using the **old** signing secret (if the provider allows selecting the key for test events).
4. Confirm the handler also returns 200 during the grace period.
5. After grace period: confirm old-signature payloads return 400/401.

### Supabase service_role key

If a staging Supabase project is available:
1. Rotate the staging project's service_role key first.
2. Run the full API surface against staging.
3. Promote the procedure to prod once staging verifies clean.

If no staging project: proceed with prod rotation using the §2 7-step procedure, with a maintenance window notice to internal users.

---

## 7. Tooling — Future Improvements

These are stubs. Not yet implemented.

| Tool | Description | Status |
|---|---|---|
| `scripts/rotate-secret.ts` | Wraps the 8-step procedure: validates provider auth, updates Vercel env, triggers redeploy, prompts to revoke, writes log entry | Pending |
| Monthly audit cron | Alert when any secret's last rotation date in `rotations.log` exceeds the cadence interval | Pending |
| HashiCorp Vault / Doppler / 1Password SCIM | Centralized secret management with automatic rotation and audit trail | Evaluate Q3 2026 |
| `scripts/audit-env.ts` | Diff `.env.example` against Vercel env vars to catch undeclared or stale keys | Pending |

---

## 8. Cross-References

| Document | Path |
|---|---|
| Deployment runbook | `docs/deployment/runbook.md` |
| Observability runbook (for detecting leaked-key usage in logs) | `docs/observability/runbook.md` |
| Supabase auth + Clerk JWT bridge | `docs/supabase-auth.md` |
| OWASP audit (I3.6, in flight) | `docs/security/owasp-audit-2026-04-17.md` |
| CI secrets list (I1.4) | `docs/deployment/runbook.md` — CI Secrets section |
| Webhook signature verification (I3.2) | `src/lib/server/` — Stripe + Plaid handlers |
| RLS policy runbook (I3.1) | `docs/security/` — Supabase RLS migration notes |
