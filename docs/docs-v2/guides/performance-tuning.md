# Performance Tuning Guide

**Version**: 1.0 | **Date**: January 26, 2026

---

## Overview

This guide provides performance optimization techniques for the MCV.ONE Super Admin platform. It covers database optimization, caching strategies, rendering performance, and monitoring.

---

## Table of Contents

1. [Performance Targets](#performance-targets)
2. [Database Optimization](#database-optimization)
3. [Caching Strategies](#caching-strategies)
4. [Frontend Performance](#frontend-performance)
5. [API Performance](#api-performance)
6. [Bundle Optimization](#bundle-optimization)
7. [Monitoring & Profiling](#monitoring--profiling)

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to First Byte (TTFB) | < 200ms | Server response time |
| First Contentful Paint (FCP) | < 1.5s | Initial render |
| Largest Contentful Paint (LCP) | < 2.5s | Main content visible |
| Cumulative Layout Shift (CLS) | < 0.1 | Visual stability |
| First Input Delay (FID) | < 100ms | Interactivity |
| API Response (P95) | < 500ms | Backend latency |
| Database Query (P95) | < 100ms | Query execution |

---

## Database Optimization

### Query Optimization

```typescript
// GOOD: Select only needed columns
const users = await db
  .select({
    id: schema.users.id,
    name: schema.users.name,
    email: schema.users.email,
  })
  .from(schema.users)
  .where(eq(schema.users.ventureSlug, 'betedge'));

// BAD: Selecting all columns
const users = await db.select().from(schema.users);

// GOOD: Use indexes for filtering
// Ensure index exists: CREATE INDEX idx_users_venture ON users(venture_slug);
const users = await db.query.users.findMany({
  where: eq(schema.users.ventureSlug, 'betedge'),
});

// GOOD: Paginated queries
const pageSize = 20;
const page = 1;

const [users, [{ count }]] = await Promise.all([
  db.select()
    .from(schema.users)
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .orderBy(desc(schema.users.createdAt)),
  db.select({ count: sql<number>`count(*)` }).from(schema.users),
]);
```

### Index Strategy

```sql
-- Primary indexes (created by Drizzle)
-- users.id (primary key)
-- ventures.slug (primary key)

-- Foreign key indexes
CREATE INDEX idx_venture_users_user ON venture_users(user_id);
CREATE INDEX idx_venture_users_venture ON venture_users(venture_slug);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_venture ON audit_logs(venture_slug);

-- Composite indexes for common queries
CREATE INDEX idx_users_venture_tier ON users(venture_slug, tier);
CREATE INDEX idx_audit_logs_venture_action ON audit_logs(venture_slug, action, created_at DESC);

-- Partial indexes for active records
CREATE INDEX idx_users_active ON users(email) WHERE deleted_at IS NULL;

-- Full-text search index
CREATE INDEX idx_users_search ON users USING gin(to_tsvector('english', name || ' ' || email));
```

### Connection Pooling

```typescript
// packages/db/src/client.ts
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;

// Optimized connection pool settings
const sql = postgres(connectionString, {
  max: 10,                    // Maximum connections
  idle_timeout: 20,           // Close idle connections after 20s
  connect_timeout: 10,        // Connection timeout
  prepare: true,              // Use prepared statements
  transform: {
    undefined: null,          // Transform undefined to null
  },
});
```

### Query Analysis

```typescript
// Debug slow queries in development
import { db } from '@mcv/db';

// Enable query logging
const originalExecute = db.execute.bind(db);

db.execute = async (query) => {
  const start = performance.now();
  const result = await originalExecute(query);
  const duration = performance.now() - start;

  if (duration > 100) {
    console.warn(`Slow query (${duration.toFixed(2)}ms):`, query);
  }

  return result;
};
```

---

## Caching Strategies

### Redis Caching

```typescript
// src/lib/cache.ts
import { redis } from './redis';

// Cache patterns
export const cache = {
  // Simple key-value cache
  async get<T>(key: string): Promise<T | null> {
    return redis.get<T>(key);
  },

  async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
    await redis.set(key, value, { ex: ttlSeconds });
  },

  // Cache with automatic refresh
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds = 3600
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const data = await fetcher();
    await this.set(key, data, ttlSeconds);
    return data;
  },

  // Cache with stale-while-revalidate
  async getStaleWhileRevalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds = 3600,
    staleSeconds = 60
  ): Promise<T> {
    const cached = await redis.get<{ data: T; timestamp: number }>(key);
    const now = Date.now();

    if (cached) {
      const age = (now - cached.timestamp) / 1000;

      // If stale, trigger background refresh
      if (age > ttlSeconds - staleSeconds) {
        fetcher().then(data => {
          redis.set(key, { data, timestamp: Date.now() }, { ex: ttlSeconds });
        });
      }

      return cached.data;
    }

    const data = await fetcher();
    await redis.set(key, { data, timestamp: now }, { ex: ttlSeconds });
    return data;
  },

  // Invalidate cache
  async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },
};
```

### Cache Key Patterns

```typescript
// src/lib/cache-keys.ts
export const cacheKeys = {
  // User data
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,

  // Venture data
  venture: (slug: string) => `venture:${slug}`,
  ventureUsers: (slug: string) => `venture:${slug}:users`,

  // List queries with pagination
  usersList: (ventureSlug: string, page: number) =>
    `users:list:${ventureSlug}:page:${page}`,

  // Aggregations
  ventureStats: (slug: string) => `venture:${slug}:stats`,

  // Session data
  session: (sessionId: string) => `session:${sessionId}`,
};

// TTL settings
export const cacheTTL = {
  user: 300,          // 5 minutes
  venture: 3600,      // 1 hour
  stats: 60,          // 1 minute
  session: 86400,     // 24 hours
};
```

### Request Memoization

```typescript
// src/lib/memoize.ts
const requestCache = new Map<string, Promise<unknown>>();

export function memoizeRequest<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  // Check if request is already in flight
  const existing = requestCache.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  // Create new request
  const promise = fn().finally(() => {
    requestCache.delete(key);
  });

  requestCache.set(key, promise);
  return promise;
}

// Usage - prevents duplicate concurrent requests
const user = await memoizeRequest(`user:${id}`, () => userService.findById(id));
```

---

## Frontend Performance

### Code Splitting

```typescript
// Dynamic imports for heavy components
import dynamic from 'next/dynamic';

// Lazy load heavy components
const Chart = dynamic(() => import('@/components/ui/chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Charts don't need SSR
});

const DataTable = dynamic(() => import('@/components/ui/data-table'), {
  loading: () => <TableSkeleton />,
});

// Route-based code splitting (automatic with App Router)
// Each page in /app is automatically code-split
```

### Image Optimization

```typescript
// Always use next/image
import Image from 'next/image';

// Optimized image component
export function Avatar({ src, name, size = 40 }) {
  return (
    <Image
      src={src}
      alt={name}
      width={size}
      height={size}
      className="rounded-full"
      placeholder="blur"
      blurDataURL="/placeholder.svg"
    />
  );
}

// For external images, configure domains in next.config.js
module.exports = {
  images: {
    remotePatterns: [
      { hostname: '*.supabase.co' },
      { hostname: 'avatars.githubusercontent.com' },
    ],
  },
};
```

### React Optimization

```typescript
// Memoize expensive computations
import { useMemo, useCallback, memo } from 'react';

// Memoize computed values
function Dashboard({ data }) {
  const chartData = useMemo(() =>
    processChartData(data),
    [data]
  );

  return <Chart data={chartData} />;
}

// Memoize callbacks
function UserList({ onSelect }) {
  const handleSelect = useCallback((user) => {
    onSelect(user.id);
  }, [onSelect]);

  return <List onItemClick={handleSelect} />;
}

// Memoize components
const UserCard = memo(function UserCard({ user }) {
  return (
    <div className="card">
      <span>{user.name}</span>
    </div>
  );
});
```

### Virtualization

```typescript
// For long lists, use virtualization
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedList({ items }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Estimated row height
    overscan: 5, // Render 5 extra items outside viewport
  });

  return (
    <div ref={parentRef} className="h-[500px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ListItem item={items[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## API Performance

### Batch Operations

```typescript
// packages/api/src/routers/users.router.ts

// GOOD: Batch operations
export const usersRouter = createTRPCRouter({
  // Batch fetch multiple users
  getMany: protectedProcedure
    .input(z.object({ ids: z.array(z.string().uuid()).max(100) }))
    .query(async ({ input }) => {
      return db.query.users.findMany({
        where: inArray(schema.users.id, input.ids),
      });
    }),

  // Batch update
  updateMany: adminProcedure
    .input(z.object({
      updates: z.array(z.object({
        id: z.string().uuid(),
        data: userUpdateSchema,
      })).max(50),
    }))
    .mutation(async ({ input }) => {
      await db.transaction(async (tx) => {
        for (const { id, data } of input.updates) {
          await tx.update(schema.users)
            .set(data)
            .where(eq(schema.users.id, id));
        }
      });
    }),
});
```

### Response Compression

```typescript
// next.config.js
module.exports = {
  compress: true,
  // Additional compression for API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Content-Encoding', value: 'gzip' },
        ],
      },
    ];
  },
};
```

### Parallel Data Fetching

```typescript
// Server Component with parallel fetching
export default async function DashboardPage({ params }) {
  // Fetch in parallel
  const [user, ventures, stats, notifications] = await Promise.all([
    getUser(params.userId),
    getVentures(),
    getStats(),
    getNotifications(params.userId),
  ]);

  return (
    <Dashboard
      user={user}
      ventures={ventures}
      stats={stats}
      notifications={notifications}
    />
  );
}
```

---

## Bundle Optimization

### Analyze Bundle Size

```bash
# Generate bundle analysis
ANALYZE=true pnpm build

# Check for large dependencies
npx bundle-buddy .next/analyze/client.html
```

### Tree Shaking

```typescript
// GOOD: Import specific functions
import { format, parseISO } from 'date-fns';

// BAD: Import entire library
import * as dateFns from 'date-fns';

// GOOD: Import specific icons
import { Home, Settings, User } from 'lucide-react';

// BAD: Import all icons
import * as Icons from 'lucide-react';
```

### next.config.js Optimization

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
module.exports = {
  // Enable React strict mode
  reactStrictMode: true,

  // Optimize production builds
  productionBrowserSourceMaps: false,

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Optimize packages
  experimental: {
    optimizePackageImports: ['lucide-react', '@heroui/react', 'date-fns'],
  },

  // Webpack optimization
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle server-only modules on client
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};
```

---

## Monitoring & Profiling

### Vercel Speed Insights

```typescript
// src/app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Custom Performance Metrics

```typescript
// src/lib/metrics.ts
export function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();

  return fn().finally(() => {
    const duration = performance.now() - start;

    // Report to analytics
    if (typeof window !== 'undefined') {
      window.performance.measure(name, {
        start,
        end: start + duration,
      });
    }

    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`);
    }
  });
}

// Usage
const data = await measureAsync('fetchDashboardData', () =>
  fetchDashboardData()
);
```

### Database Query Monitoring

```typescript
// Track slow queries
import * as Sentry from '@sentry/nextjs';

export async function monitoredQuery<T>(
  name: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const span = Sentry.startSpan({ name, op: 'db.query' });

  try {
    const result = await queryFn();
    span?.setStatus('ok');
    return result;
  } catch (error) {
    span?.setStatus('error');
    throw error;
  } finally {
    span?.end();
  }
}
```

---

## Performance Checklist

### Before Deployment

- [ ] Bundle size < 300KB (initial JS)
- [ ] No blocking resources in critical path
- [ ] Images optimized and lazy loaded
- [ ] Fonts preloaded
- [ ] Database queries indexed
- [ ] Caching configured

### Regular Audits

- [ ] Run Lighthouse (weekly)
- [ ] Check Vercel Speed Insights (daily)
- [ ] Review slow queries (weekly)
- [ ] Analyze bundle changes (per PR)

---

*MCV Global Consortium - Performance Tuning Guide*
