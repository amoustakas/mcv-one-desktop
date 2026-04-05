# ADR-002: Standardized Identifier Strategy (UUIDv7)

**Status:** PROPOSED  
**Date:** February 9, 2026  
**Deciders:** Architecture Team, Database Team  
**Context:**  
The MCV.ONE ecosystem currently suffers from "Identifier Drift":
- **Core Tiers (0-4):** Predominantly use `uuid` (UUIDv4) columns in PostgreSQL.
- **Web3/Commerce (Tier 5):** Use `text` columns storing CUIDs or ULIDs for sortability.
- **Prototype:** Mixed usage, leading to type-casting friction in tRPC routers and Drizzle schemas.

**Problem:**  
1.  **Fragmentation:** Joins between "Core User" (UUID) and "Commerce Order" (ULID) require type casting or string manipulation.
2.  **Performance:** UUIDv4 is random, causing index fragmentation (page splitting) in high-volume INSERT operations (e.g., Events, Audit Logs).
3.  **Sortability:** UUIDv4 is not time-sortable. Sorting by `created_at` is required, adding index overhead.
4.  **Compatibility:** External systems (Payment Gateways, Blockchains) often expect strings, but Postgres is most efficient with native `uuid` types (128-bit integer) vs `text` (variable length).

**Decision:**  
We will standardize on **UUIDv7** stored as the native `uuid` type in PostgreSQL for all Primary Keys across the entire Monorepo (Tiers 0-6).

**Detailed Specification:**

1.  **Database Storage:**
    -   All Primary Keys (`id`) MUST be of type `uuid`.
    -   `text` IDs for PKs are FORBIDDEN unless mirroring an external immutable ID (e.g., Stripe ID, Blockchain Tx Hash).

2.  **Generation Strategy (UUIDv7):**
    -   We adopt **UUIDv7** (time-ordered).
    -   *Why?* It combines the sortability of ULID with the standard binary format of UUID.
    -   It eliminates index fragmentation issues associated with random UUIDv4.
    -   It allows sorting by ID to be roughly equivalent to sorting by Time.

3.  **Schema Implementation (Drizzle):**
    ```typescript
    // @mcv/kernel/db/schema-utils.ts
    import { uuid } from 'drizzle-orm/pg-core';
    import { sql } from 'drizzle-orm';
    
    // Use this standard definition
    export const pk = uuid('id').primaryKey().default(sql`gen_random_uuid_v7()`); 
    // Note: Requires pg_uuidv7 extension or a SQL function polyfill if PG < 17
    ```

4.  **Application Layer:**
    -   TypeScript interfaces use the branded `UUID` type from `@mcv/kernel/types`.
    -   No manual generation in client code (`uuid.v4()`) unless strictly necessary for optimistic UI. Prefer server-side default generation.

5.  **Migration Path:**
    -   **New Tables:** strict UUIDv7.
    -   **Existing Prototype Tables (UUIDv4):** No migration needed (compatible storage).
    -   **Existing Prototype Tables (ULID/CUID):** MUST be migrated to UUIDv7 columns.
        -   *Transition:* Add `uuid` column, backfill, swap PK, drop `text` column.

**Consequences:**

| Pros | Cons |
| :--- | :--- |
| **Unified Type System:** No more `string` vs `UUID` typescript errors. | **Migration Effort:** Prototype modules using CUID/ULID need refactoring. |
| **Performance:** 50%+ faster INSERTs on large tables vs UUIDv4. | **Tooling:** Older SQL clients might look "random" if they don't understand v7 structure (visual only). |
| **Sortable IDs:** `ORDER BY id` works for chronology. | **Polyfill:** Requires a Postgres function for v7 generation until we upgrade to Postgres 17+. |
| **Storage:** 16 bytes (UUID) vs 26+ bytes (ULID text). | |

**Compliance:**  
This ADR applies to all packages in `packages/` and `apps/`. Any deviation requires a specific exception documented in the module's `README.md`.
