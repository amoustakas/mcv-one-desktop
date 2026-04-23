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

## Pre-flight gates for downstream sessions

These must be true before the named session starts work:

- [ ] **Before Phase 1 starts:** `packages/workflow-sdk/` exists and exports `WorkflowRunner` with `start()` / `advance()` / `resume()`. Confirm with:
  ```bash
  ls packages/workflow-sdk/src/runner.ts && \
    grep -q "export.*WorkflowRunner" packages/workflow-sdk/src/runner.ts
  ```

- [ ] **Before Phase 2 starts:** `event_subscribers` table exists in Supabase. Confirm with:
  ```sql
  SELECT 1 FROM event_subscribers LIMIT 1;
  ```
  If the table doesn't exist, Phase-2 event-resolver work is blocked on
  `migration-agentic-os-events-2026-04-22.sql` landing first.

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
