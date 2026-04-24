# RLS Migration Status

**Owner:** ADK integration tracks + Phase-1 Intelligence Router session
**Seeded:** 2026-04-23 (Phase-0 ADK safety hotfix)
**Live status doc:** update this file as each handler graduates past the service-role-bypass era.

## Context

The Phase-1 Intelligence Router (`@mcv/intelligence-sdk/router`) enforces
tenant isolation through Supabase RLS: each substrate table has
`tenant_id uuid not null` + a policy that gates reads/writes on
`current_setting('app.tenant_id')`. The Router calls
`supabase.rpc('set_tenant', { t })` at request boundary to supply the value.

Because a "Big Bang RLS flip" would break the in-flight onboarding session
and any handler that hasn't yet been migrated to call `set_tenant()`, the
initial RLS policies permit a **service-role bypass**:

```sql
CREATE POLICY tenant_isolation ON <table>
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid
         OR current_setting('app.tenant_id', true) IS NULL);
```

When `app.tenant_id` is unset (null), the gate is open — service-role
clients keep working. After every handler that touches the table has been
audited to call `set_tenant()`, the bypass clause gets dropped.

This doc tracks that hardening progress per table.

## Phase-1 retroactive tenant_id migration targets

These tables will receive `tenant_id` in `supabase/migration-intelligence-unification-2026-04-28.sql`:

| Table                          | Added by                 | Hardening status |
|--------------------------------|--------------------------|------------------|
| `agent_drafts`                 | migration-agent-drafts-2026-04-24.sql | bypass live |
| `document_templates`           | onboarding session 1     | bypass live     |
| `document_bundles`             | onboarding session 1     | bypass live     |
| `document_bundle_templates`    | onboarding session 1     | bypass live     |
| `onboarding_invites`           | onboarding session 1     | bypass live     |
| `user_document_requirements`   | onboarding session 1     | bypass live     |
| `user_access_grants`           | onboarding session 1     | bypass live     |
| `agent_memory_longterm` (new)  | Phase-1 migration         | strict (no bypass) |
| `storage_chunks`               | existing                 | bypass live     |
| `project_memory`               | existing (user-scoped)   | N/A (no tenant column — user→tenant join) |
| `naos_interactions`            | M3 agent-fleet           | bypass live     |
| `naos_emotional_state`         | M3 agent-fleet           | bypass live     |
| `naos_relationships`           | M3 agent-fleet           | bypass live     |
| `naos_personality`             | M3 agent-fleet           | bypass live     |
| `event_log`                    | migration-agentic-os-events-2026-04-22.sql | bypass live |
| `kit_audit_log`                | existing                 | bypass live     |

## Handler hardening checklist (graduate past bypass)

Each row below represents an API handler that touches one or more
tenant-scoped tables. A handler is "hardened" when it calls
`set_tenant(<tenant>)` at request boundary so RLS actively enforces.

| Handler                              | Tables touched                  | Status  | Notes |
|--------------------------------------|---------------------------------|---------|-------|
| `api/_handlers/agentic.ts`           | agent_drafts, event_log         | bypass  | Owned by parallel onboarding session — wait for their next landing. |
| `api/_handlers/onboarding.ts`        | onboarding_invites, document_*  | bypass  | Same ownership. |
| `api/_handlers/events.ts`            | event_log, event_subscribers    | bypass  | Harden in Phase-2 event-resolver session. |
| `api/_handlers/knowledge-observer.ts`| agent_memory_longterm           | STRICT  | Phase-1 subscriber, built from the start with `set_tenant()`. |
| `api/_handlers/foundation.ts`        | foundation_* tables             | bypass  | Harden in M5 Foundation Phase 2+3. |
| `api/_handlers/capital.ts`           | capital_* tables                | bypass  | Harden when capital service layer gets multi-tenancy pass. |

## Phase-1 landing (2026-04-23)

Phase-1 Intelligence Router migration `supabase/migration-intelligence-unification-2026-04-28.sql`
SHIPPED on branch `phase-1-intelligence-router-2026-04-23-1934`. What it delivered:

- ✅ **`set_tenant(t uuid)` RPC created** — was missing on master; now live.
- ✅ **`agent_memory_longterm` table created with STRICT RLS** (no bypass clause).
- ✅ **`match_agent_memories` RPC created** (mirrors `match_chunks` pattern).
- ✅ **Retroactive `tenant_id` added to 7 tables** — all backfilled to platform-tenant
  UUID `00000000-0000-0000-0000-000000000000`. T0/T1/T2 restructure remaps per-venture
  tenant_id in a follow-up migration.
- ✅ **4 event_subscribers rows seeded** → `/api/knowledge-observer`.
- ✅ **`api/_handlers/knowledge-observer.ts` ships STRICT from day one.**

## Pre-flight gates for downstream sessions

These must be true before the named session starts work:

- [x] **Before Phase 1 starts:** `packages/workflow-sdk/` exists and exports `WorkflowRunner` with `start()` / `advance()` / `resume()`. Verified 2026-04-23; `DispatchStepContext` extended with optional `intel?: DispatchIntelligence` in this migration.
- [ ] **Before Phase 2 starts:** `event_subscribers` table exists in Supabase. Confirm with:
  ```sql
  SELECT 1 FROM event_subscribers LIMIT 1;
  ```
  Verified 2026-04-23 — table is live (landed in migration-agentic-os-events-2026-04-22.sql).
  Phase-2 work additionally needs `workflow_def_id` column; that's a Phase-2 migration.

- [ ] **Before M3 agent-fleet starts:** this doc has entries for every
  agent-surface handler that will be introduced (`agent-token.ts`,
  `_agent-gateway.ts`, `agent-card.ts`, `a2a-dispatch.ts`). Each must
  enter this table as "STRICT" from day one — no bypass grace period.

## Harden-the-bypass checklist

When a handler graduates past the service-role bypass:

1. Add a `set_tenant()` call at the start of the handler (inside auth check
   but before any SELECT/INSERT/UPDATE).
2. Rebuild and run the handler's smoke tests against a multi-tenant fixture
   to confirm cross-tenant reads/writes are rejected.
3. Flip the entry in the "Handler hardening checklist" table above from
   `bypass` to `STRICT`.
4. When ALL handlers for a given table are STRICT, drop the
   `OR current_setting('app.tenant_id', true) IS NULL` clause from that
   table's policy in a new migration. The table now enforces tenant
   isolation unconditionally.

## Related plans

- `C:\Users\moust\.claude\plans\i-want-to-plan-synchronous-thacker.md` — Phase-1 Intelligence Router schema + retroactive tenant_id
- `C:\Users\moust\.claude\plans\agentic-os-m5-foundation-phase-2-3.md` — parallel-safe with Phase-1
- `C:\Users\moust\.claude\plans\agentic-os-m3-agent-fleet.md` — M3 adds STRICT entries from day one
