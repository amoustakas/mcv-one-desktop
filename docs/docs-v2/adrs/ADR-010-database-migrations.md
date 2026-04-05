# ADR-010: Database Migration Strategy (Drizzle Kit)

**Status:** APPROVED
**Date:** March 10, 2026
**Deciders:** Architecture Team, Database Team
**Context:**
MCV.ONE uses Drizzle ORM with 105+ database tables. Schema evolution must be safe, reversible, and zero-downtime across development, staging, and production environments.

**Problem:**
1. **Zero-downtime:** Production migrations cannot lock tables or cause outages.
2. **Multi-tenant impact:** Schema changes affect all 9+ ventures simultaneously.
3. **Rollback safety:** Failed migrations must be reversible without data loss.
4. **Developer experience:** Schema changes should be code-first (TypeScript), not SQL-first.

**Decision:**
We use **Drizzle Kit** for migration generation with a strict workflow that separates development convenience from production safety.

**Environment-Specific Workflow:**

| Environment | Command | Strategy | Safety Level |
|-------------|---------|----------|-------------|
| Local Dev | `pnpm db:push` | Direct schema sync (destructive OK) | Low |
| Staging | `pnpm db:migrate:prod` | Versioned migration files | Medium |
| Production | `pnpm db:migrate:prod` | Versioned + reviewed + approved | High |

**Migration Rules:**

1. **Additive-Only in Production:**
   - Adding columns: MUST be nullable OR have a default value
   - Adding tables: Always safe
   - Adding indexes: Use `CREATE INDEX CONCURRENTLY`
   - Renaming: PROHIBITED — create new, migrate data, drop old (3-step)

2. **Destructive Operations (Separate PR):**
   - Dropping columns: Mark deprecated → remove reads → drop (3 releases)
   - Dropping tables: Confirm zero references → drop
   - Type changes: Create new column → backfill → swap → drop old

3. **Review Requirements:**
   - All migration PRs require `migration-reviewed` label
   - CODEOWNERS: `packages/db/src/migrations/**` → @database-team
   - CI validates: no uncommitted migration files, up/down reversibility

**Migration File Structure:**
```
packages/db/src/migrations/
├── 0000_initial_schema.sql
├── 0001_add_contacts_table.sql
├── 0002_add_ventures_settings.sql
├── ...
└── meta/
    └── _journal.json  (Drizzle migration journal)
```

**Rollback Procedure:**
```bash
# Generate rollback SQL (drizzle-kit doesn't auto-generate rollbacks)
# Each migration PR must include a rollback.sql in the PR description

# Emergency rollback:
psql $DIRECT_DATABASE_URL < rollbacks/0002_rollback.sql
```

**Consequences:**
- Positive: Type-safe schema-as-code, automatic migration generation, zero-downtime compatible
- Negative: Rollbacks are manual (Drizzle Kit limitation), 3-step rename process is slow
- Mitigation: CI enforces migration review, staging catches issues before production
