# Wave-5D Cleanup Sweep: crm_contacts → contacts Rename Plan

**Status**: Research + Planning Only (No Code Changes)
**Discovered**: Session 13 Wave 0 preflight (silently 404'ing queries against prod Supabase)
**Real Table**: `contacts` (schema.sql) — 14 columns: id, user_id, venture_id, name, email, phone, company, role, type, status, tags, notes, metadata, last_contacted, created_at
**Ghost Table**: `crm_contacts` — never existed; Session 10+ capital code invented it

---

## 1. Complete Reference Enumeration

### A. Real Query Call Sites (`.from('crm_contacts')`) — **13 occurrences**

| File | Line | Context | Type | Gap |
|------|------|---------|------|-----|
| api/_handlers/capital.ts | 381,642,800,874 | link-plaid/stripe, get-contact, verify-investor | SELECT | **full_name** (doesn't exist; table has `name`) |
| api/_handlers/capital.ts | 905,929,935,951,957 | metadata stamp/read ops | UPDATE/SELECT | metadata OK |
| src/lib/capital/adapters/plaid-adapter.ts | 72 | auto-match on plaid_account_id | SELECT | id OK |
| src/lib/capital/adapters/stripe-adapter.ts | 123 | auto-match on stripe_customer_id | SELECT | id OK |
| packages/capital-sdk/src/dashboard-service.ts | 155 | fetch contact names | SELECT | name OK |
| packages/capital-sdk/src/tax-export.ts | 175 | join for 1099/T5 export | SELECT | **country** (doesn't exist; critical for tax forms) |

### B. Join Syntax & Type References — **3 occurrences**

- tax-export.ts line 59: Type interface `crm_contacts: { name, email, country }`
- tax-export.ts lines 194–196: Data accessor `raw.crm_contacts?.name`

### C. Documentation & Comments — **9 occurrences**

- supabase/migration-mcv-sign.sql line 82: Wave-5D tracking comment
- supabase/migration-capital.sql line 62: "satellite on crm_contacts"
- docs/capital/LEGACY_ADAPTERS.md lines 117, 373: Metadata stamping pattern
- docs/capital/ECOSYSTEM.md line 143: "capital_investor_profile on crm_contacts"
- src/components/stripe/StripeCustomerLinkButton.tsx line 9: JSDoc
- src/components/plaid/PlaidLinkButton.tsx line 15: JSDoc
- scripts/seed-capital-epics.ts lines 186,188,199,207,260,291: Epic criteria (6 refs)
- packages/kits-sdk/src/builtin/capital-kit.ts lines 509,697,709: Parameter descriptions

---

## 2. Classification & Risk Matrix

### Category A: Real Queries (MUST RENAME) — **13 sites**

**Risk**: HIGH (queries silently 404 when table doesn't exist)

- **api/_handlers/capital.ts** (9 sites): Read/write `id, full_name, email, metadata`
  - **BLOCKER**: `full_name` column doesn't exist in real `contacts` table
  - **Resolution**: Update queries to use `name` (the real column)

- **plaid-adapter.ts** (1 site): Read `id` only
  - **Status**: Safe rename; no column mismatch

- **stripe-adapter.ts** (1 site): Read `id` only
  - **Status**: Safe rename; no column mismatch

- **dashboard-service.ts** (1 site): Read `id, name`
  - **Status**: Safe rename; both columns exist

- **tax-export.ts** (1 site): Join on `name, email, country`
  - **BLOCKER**: `country` column doesn't exist in real `contacts` table
  - **Resolution**: Move country to `capital_investor_profile` satellite (cleaner; tax metadata belongs there)

### Category B: Type Interfaces — **2 sites**

**Risk**: MEDIUM (type system assumes `crm_contacts` join alias)

- tax-export.ts line 59: Rename type property `crm_contacts` to `contacts`

### Category C: Documentation — **9 sites**

**Risk**: LOW (purely informational)

- Batch rename references for consistency

---

## 3. Data-Model Gaps (BLOCKING)

### Gap 1: `full_name` Column Missing

- **Code reads**: api/_handlers/capital.ts `.select('id, full_name, email')`
- **Real table**: Has only `name` (not `full_name`)
- **Action**: Update all queries to `.select('id, name, email')` (simplest fix)

### Gap 2: `country` Column Missing

- **Code reads**: tax-export.ts joins `.select(..., crm_contacts(name, email, country))`
- **Real table**: No `country` column
- **Action**: Add `country` to `capital_investor_profile` table; update tax-export to join through investor profile instead of raw contacts

### Gap 3: No FK Constraint

- **Current**: capital_investor_profile.contact_id has no explicit FK
- **Action**: Add `ALTER TABLE capital_investor_profile ADD CONSTRAINT fk_contact_id FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;`

---

## 4. Safe Rename Order

### Phase 1: SDK & Types (Low-Risk)
1. tax-export.ts: Update type from `crm_contacts` to `contacts`, adjust for `country` column relocation
2. dashboard-service.ts: Rename `.from('crm_contacts')` to `.from('contacts')`
3. scripts/seed-capital-epics.ts: Update epic acceptance criteria

### Phase 2: Adapter Layer (Medium-Risk)
1. plaid-adapter.ts: Rename query + update test mock
2. stripe-adapter.ts: Rename query + update test mock

### Phase 3: Core Handler (High-Risk)
1. api/_handlers/capital.ts: All 9 query sites — rename table + change `full_name` to `name`
2. StripeCustomerLinkButton.tsx: Update JSDoc
3. PlaidLinkButton.tsx: Update JSDoc

### Phase 4: Documentation (Batch)
1. Migration comments
2. Architecture docs
3. Kit SDK parameter docs

---

## 5. Integration Test Strategy

### Existing Tests to Update
- tax-export.test.ts: Change mock `crm_contacts: {...}` to `contacts: {...}`
- plaid-adapter.test.ts: Change table name check from `crm_contacts` to `contacts`
- stripe-adapter.test.ts: Same table name check

### New E2E Tests (Wave-5D Acceptance)
1. **Plaid Link Flow**: Seed contact → call link-plaid-account → verify metadata.plaid_account_id stamped
2. **Stripe Link Flow**: Seed contact → call link-stripe-customer → verify metadata.stripe_customer_id stamped
3. **Investor Profile Fetch**: Seed investor + contact → list-investors → verify name returned
4. **Tax Export E2E**: Seed distribution + recipient + contact + investor profile → generateTaxExport() → verify jurisdiction included in CSV

---

## 6. Execution Checklist

- [ ] Verify schema: Add `country` to `capital_investor_profile` OR decide to backfill from metadata
- [ ] Update tax-export.ts to join through investor profile for country
- [ ] Phase 1 Rename: tax-export, dashboard, epics
- [ ] Phase 2 Rename: plaid/stripe adapters + test mocks
- [ ] Phase 3 Rename: core handler (change full_name → name) + components
- [ ] Phase 4 Rename: docs
- [ ] Integration tests: All E2E pass against preview Supabase branch
- [ ] Code review & merge
- [ ] Monitor prod: Zero remaining crm_contacts references

---

## Summary

**Total References**: 20 files, 40+ occurrences (13 queries, 2 types, 9 docs)
**Critical Path**: Fix full_name + country gaps → Rename queries (3 phases) → Integration tests
**No-Go Blockers**: If country cannot be migrated to investor profile, tax export breaks; if full_name not aliased, linking workflows break
**Timeline**: ~2–3 sessions (schema changes + 3 code phases + integration testing)

**Bridge View**: NOT RECOMMENDED (cannot add computed columns; blocks FK; masks issue)

---

## 7. Resolution (Session 13e, 2026-04-16)

**Decision**: Reverse the original direction. Instead of renaming 20 files of
application code to match the DB, **rename the DB table to match the code**
and leave a backward-compat view for pre-Session-10 callers.

**Trigger**: Tony's edit to `supabase/migration-mcv-sign.sql` reverted the
`signing_envelope_signers.contact_id` FK target from `contacts(id)` back to
`crm_contacts(id)`. That FK direction is a tell — the canonical name going
forward is `crm_contacts`.

### Why this beats the 20-file rename plan

| Axis | 20-file code rename | DB rename + view (this) |
| --- | --- | --- |
| Diff surface | 20 files, 40+ edits | 1 SQL file |
| Test churn | Update every mock | Zero mock changes |
| Risk of missed call site | High | Zero — view catches them |
| Schema gaps (full_name, country) | Still need separate migration | Rolled into same migration |
| Rollback | Revert 20 commits | `DROP VIEW` + `ALTER TABLE RENAME` |
| Time to ship | 2–3 sessions | 1 session |

### Migration file

`supabase/migration-rename-contacts-to-crm-contacts.sql` — a single
transactional migration that:

1. `ALTER TABLE contacts RENAME TO crm_contacts` — preserves all 3 inbound
   FKs (activities, deals, signing_envelope_signers), RLS policy, realtime
   publication membership, and indexes. Postgres `RENAME` is oid-stable.
2. `ADD COLUMN full_name TEXT GENERATED ALWAYS AS (name) STORED` — zero-drift
   mirror; single source of truth remains `name`; no write-path triggers.
3. `ADD COLUMN country TEXT` — nullable jurisdiction code for tax export
   (1099/T5). Callers backfill; null-safe in tax-export.ts already.
4. `CREATE OR REPLACE VIEW contacts AS SELECT * FROM crm_contacts` —
   simple single-table view; Postgres marks it auto-updatable, so legacy
   `.from('contacts').insert(...)` / `.update(...)` / `.delete(...)` all
   keep working unchanged.

### What this invalidates from sections 1–6 above

- **Section 4 "Safe Rename Order"** — DROPPED. No code rename needed. All
  40+ call sites continue to work because `crm_contacts` now exists and
  `contacts` is a view.
- **Section 5 "Integration Test Strategy"** — update to verify the view
  write-through path instead of changing mocks.
- **Section 6 "Execution Checklist"** — collapsed to: apply migration,
  smoke-test both names, monitor prod for missing-column errors on
  `full_name` / `country` callers.
- **"Bridge View: NOT RECOMMENDED"** note — reversed. The view IS
  recommended because:
  - Postgres auto-updatable simple views support write-through natively
  - `full_name` as a GENERATED column (not a view-computed column) means
    the FK-blocking concern doesn't apply — the FK lives on the base
    table `crm_contacts`, which now has all columns code expects

### Residual cleanup (non-blocking, future session)

- Pre-Session-10 code that writes `.from('contacts').insert(...)` should
  eventually migrate to the canonical name. Optional trigger to log such
  writes to an advisory table is sketched in the migration comments but
  not implemented — add only if Tony wants visibility into the migration
  tail.
- Consider tightening RLS past the current `USING (true)` permissive
  policy once Clerk JWT bridge is exercised broadly (tracked separately).

### Apply status

- **PR branch**: `marathon-13e-contacts-to-crm-contacts`
- **Not yet applied to prod**. Migration is staged for Tony's manual apply
  via Supabase MCP after PR review.
