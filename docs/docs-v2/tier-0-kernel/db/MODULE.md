# @mcv/kernel/db — Database Module

**Parent Package:** @mcv/kernel  
**Classification:** INTERNAL  
**Last Updated:** February 9, 2026

---

## Purpose

The `db` module provides database connectivity, schema definitions, and query utilities using Drizzle ORM with PostgreSQL (Supabase).

---

## Key Features

- **Connection Pooling**: Managed pool with 20 max connections
- **Type-Safe Queries**: Full TypeScript inference from schemas
- **Transaction Support**: ACID transactions with rollback
- **Multi-Tenant Base**: `ventureId` on all tables with RLS
- **Soft Deletes**: `deletedAt` pattern for data recovery
- **Audit Fields**: Automatic `createdAt`, `updatedAt` tracking

---

## Exports

```typescript
// Client
export { db } from './client';
export { withTransaction } from './client';

// Schema Helpers
export { baseColumns } from './base';
export { createTable } from './base';

// Query Helpers
export { notDeleted, forVenture, activeInVenture, softDelete } from './helpers';

// Migrations
export { runMigrations, generateMigration, getMigrationStatus } from './migrate';

// Schema (re-exported)
export * as schema from './schema';
```

---

## Database Schema Pattern

### Base Columns

Every table in the MCV.ONE system includes these columns:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `venture_id` | UUID (FK) | Tenant isolation |
| `created_at` | Timestamp | Record creation time |
| `updated_at` | Timestamp | Last modification time |
| `created_by` | UUID (FK) | User who created |
| `updated_by` | UUID (FK) | User who last modified |
| `deleted_at` | Timestamp | Soft delete marker |

### Example Table Definition

```typescript
import { createTable } from '@mcv/kernel/db';
import { varchar, integer, boolean, jsonb } from 'drizzle-orm/pg-core';

export const products = createTable('products', {
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  price: integer('price').notNull(), // Store in cents
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata'),
});
```

---

## Connection Configuration

```typescript
// Environment variables
DATABASE_URL=postgresql://user:pass@host:5432/db
DATABASE_POOL_SIZE=20
DATABASE_SSL=true
```

### Pool Settings

| Setting | Development | Production |
|---------|-------------|------------|
| Max Connections | 5 | 20 |
| Idle Timeout | 60s | 20s |
| Connect Timeout | 30s | 10s |

---

## Transaction Usage

```typescript
import { db, withTransaction } from '@mcv/kernel';
import { schema } from '@mcv/kernel';

// Simple transaction
const result = await withTransaction(async (tx) => {
  // All queries in this block are transactional
  const order = await tx.insert(schema.orders).values({
    ventureId: ctx.venture.id,
    customerId: customer.id,
    total: 9999,
  }).returning();
  
  await tx.insert(schema.orderItems).values(
    items.map(item => ({
      orderId: order[0].id,
      productId: item.productId,
      quantity: item.quantity,
    }))
  );
  
  return order[0];
});

// Transaction will rollback on any error
```

---

## Query Helpers

### Filtering Active Records

```typescript
import { db, schema, activeInVenture } from '@mcv/kernel';

// Get all non-deleted records for current venture
const products = await db
  .select()
  .from(schema.products)
  .where(activeInVenture(schema.products, ventureId));
```

### Soft Delete

```typescript
import { softDelete } from '@mcv/kernel';

// Soft delete a record (sets deleted_at)
await softDelete(schema.products, productId);

// Hard delete (use sparingly)
await db.delete(schema.products).where(eq(schema.products.id, productId));
```

---

## Row-Level Security (RLS)

### Policy Template

```sql
-- Enable RLS on table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Venture isolation policy
CREATE POLICY "products_venture_isolation" ON products
  FOR ALL
  USING (venture_id = current_setting('app.current_venture_id')::uuid);

-- Exclude soft-deleted records
CREATE POLICY "products_exclude_deleted" ON products
  FOR SELECT
  USING (deleted_at IS NULL);
```

### Setting Venture Context

```typescript
// Before queries, set the current venture
await db.execute(sql`
  SET app.current_venture_id = ${ventureId}
`);
```

---

## Migrations

### Running Migrations

```bash
# Run all pending migrations
pnpm db:migrate

# Generate new migration
pnpm db:generate
```

### Programmatic Migration

```typescript
import { runMigrations, getMigrationStatus } from '@mcv/kernel';

// Check status
const status = await getMigrationStatus();
console.log('Applied:', status.applied);
console.log('Pending:', status.pending);

// Run migrations
await runMigrations();
```

---

## Performance Considerations

### Connection Pool

- Monitor `db_pool_connections_waiting` metric
- Increase pool size if requests queue frequently
- Use connection for single query, return to pool

### Query Optimization

```typescript
// Good: Select only needed columns
const users = await db
  .select({ id: schema.users.id, email: schema.users.email })
  .from(schema.users);

// Avoid: Select all columns when not needed
const users = await db.select().from(schema.users);
```

### Batch Operations

```typescript
// Good: Batch insert
await db.insert(schema.items).values(itemsArray);

// Avoid: Loop with individual inserts
for (const item of items) {
  await db.insert(schema.items).values(item);
}
```

---

## Testing

### Test Database

```typescript
// vitest.setup.ts
import { db } from '@mcv/kernel';

beforeEach(async () => {
  // Clean up test data
  await db.delete(schema.testTable);
});

afterAll(async () => {
  // Close connections
  await db.$client.end();
});
```

### Fixtures

```typescript
// fixtures/products.ts
export async function createTestProduct(overrides = {}) {
  const [product] = await db.insert(schema.products).values({
    ventureId: TEST_VENTURE_ID,
    name: 'Test Product',
    slug: `test-${Date.now()}`,
    price: 1000,
    ...overrides,
  }).returning();
  
  return product;
}
```

---

## Error Handling

| Error | Cause | Handling |
|-------|-------|----------|
| Connection refused | DB unreachable | Retry with backoff |
| Unique violation | Duplicate key | Throw ConflictError |
| Foreign key violation | Missing reference | Throw ValidationError |
| Query timeout | Slow query | Review query performance |

```typescript
import { DatabaseError } from '@mcv/kernel';

try {
  await db.insert(schema.users).values(userData);
} catch (error) {
  if (error.code === '23505') { // Unique violation
    throw new ConflictError('Email already exists', 'email');
  }
  throw error;
}
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| drizzle-orm | ^0.29.x | ORM |
| postgres | ^3.4.x | PostgreSQL driver |
| drizzle-kit | ^0.20.x | Migrations (dev) |

---

*@mcv/kernel/db — Database Module*
