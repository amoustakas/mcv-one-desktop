# ADR-006: Multi-Tenancy Implementation

**Status:** APPROVED
**Date:** March 10, 2026
**Deciders:** Architecture Team, Database Team
**Context:**
MCV.ONE serves 9+ ventures from a single codebase and database. Each venture must have complete data isolation while sharing infrastructure and platform modules.

**Problem:**
1. **Data isolation:** Venture A must never see Venture B's data — legally and functionally.
2. **Shared infrastructure:** Separate databases per venture is operationally expensive at 9+ ventures.
3. **Cross-venture operations:** Super admins need to operate across all ventures.
4. **Performance:** Tenant filtering must not degrade query performance.

**Decision:**
We implement **shared-database, shared-schema multi-tenancy** using PostgreSQL Row-Level Security (RLS) with `venture_id` as the discriminator column.

**Implementation:**

1. **Every table** with tenant-scoped data includes `venture_id UUID NOT NULL`.
2. **RLS policies** enforce isolation at the database level — even if application code has a bug, the database prevents cross-tenant access.
3. **Venture context** is set via PostgreSQL session variable (`SET LOCAL app.current_venture_id`) at the start of every request.
4. **tRPC middleware** propagates venture context from the authenticated session to the database layer.

**Schema Pattern:**
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID NOT NULL REFERENCES ventures(id),
  -- ... other columns
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_venture ON contacts(venture_id);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY venture_isolation ON contacts
  FOR ALL USING (venture_id = current_setting('app.current_venture_id')::uuid);
```

**Middleware Chain:**
```
Request → Auth (verify session) → Venture Context (set venture_id) → RLS Active → Route Handler
```

**Exceptions (Shared Tables):**
- `ventures` — the venture registry itself
- `users` — users can belong to multiple ventures
- `venture_memberships` — maps users to ventures
- `system_config` — platform-wide settings

**Performance Considerations:**
- Composite indexes: `(venture_id, <filter_column>)` on all frequently queried tables
- PgBouncer: Transaction mode with `SET LOCAL` (session variables scoped to transaction)
- Connection pooling: 20 connections per app instance via PgBouncer

**Consequences:**
- Positive: Strong isolation, simple ops (one database), efficient queries with composite indexes
- Negative: All queries must include venture context (enforced by middleware), migrations affect all tenants
- Risk Mitigation: Integration tests verify isolation for every CRUD operation
