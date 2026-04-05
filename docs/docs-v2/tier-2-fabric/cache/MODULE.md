# @mcv/fabric/cache — Cache Module

**Parent Package:** @mcv/fabric  
**Tier:** 2 (Infrastructure Services)  
**Classification:** INTERNAL  
**Last Updated:** February 8, 2026

---

## Purpose

The `cache` module provides unified caching infrastructure for the MCV ecosystem. It abstracts caching strategies (Redis, in-memory, multi-tier), handles cache invalidation patterns, and provides type-safe cache operations with automatic serialization and TTL management.

**Performance-critical operations depend on this module for sub-millisecond data access.**

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// CORE CACHE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export { 
  cache,              // Default cache instance
  createCache,        // Factory function
  getCache,           // Get by name
} from './cache';

// Cache operations
export { 
  get, 
  set, 
  del, 
  has,
  getMany,
  setMany,
  delMany,
  keys,
  clear,
  incr,
  decr,
} from './operations';

// ═══════════════════════════════════════════════════════════════════════════════
// CACHE STRATEGIES
// ═══════════════════════════════════════════════════════════════════════════════

export { MemoryCache } from './strategies/memory';
export { RedisCache } from './strategies/redis';
export { MultiTierCache } from './strategies/multi-tier';
export { NullCache } from './strategies/null';

// ═══════════════════════════════════════════════════════════════════════════════
// DECORATORS & HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export { cached } from './decorators/cached';
export { memoize } from './decorators/memoize';
export { cacheAside } from './patterns/cache-aside';
export { writeThrough } from './patterns/write-through';
export { writeBehind } from './patterns/write-behind';

// ═══════════════════════════════════════════════════════════════════════════════
// INVALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

export { 
  invalidate,
  invalidatePattern,
  invalidateTag,
  tag,
} from './invalidation';

// ═══════════════════════════════════════════════════════════════════════════════
// REACT HOOKS (CLIENT)
// ═══════════════════════════════════════════════════════════════════════════════

export { useCachedQuery } from './client/hooks/use-cached-query';
export { useCacheInvalidation } from './client/hooks/use-cache-invalidation';
export { CacheProvider } from './client/context/cache-provider';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  Cache,
  CacheConfig,
  CacheOptions,
  CacheEntry,
  CacheStats,
  CacheStrategy,
  SerializeOptions,
  InvalidationRule,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            CACHE MODULE ARCHITECTURE                             │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                           APPLICATION LAYER                                  │ │
│  │                                                                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │   @cached    │  │  cacheAside  │  │ writeThrough │  │  writeBehind │    │ │
│  │  │  decorator   │  │   pattern    │  │   pattern    │  │   pattern    │    │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │ │
│  │         │                 │                 │                 │            │ │
│  │         └─────────────────┼─────────────────┼─────────────────┘            │ │
│  │                           │                 │                              │ │
│  └───────────────────────────┼─────────────────┼──────────────────────────────┘ │
│                              │                 │                                │
│  ┌───────────────────────────┼─────────────────┼──────────────────────────────┐ │
│  │                    CACHE ABSTRACTION LAYER                                  │ │
│  │                           │                 │                               │ │
│  │              ┌────────────▼─────────────────▼────────────┐                 │ │
│  │              │              Cache Interface              │                 │ │
│  │              │                                           │                 │ │
│  │              │  get(key)     set(key, value, options)   │                 │ │
│  │              │  del(key)     has(key)                    │                 │ │
│  │              │  getMany([])  setMany([])                 │                 │ │
│  │              │  incr(key)    decr(key)                   │                 │ │
│  │              │  keys(pattern) clear()                    │                 │ │
│  │              └────────────────────┬──────────────────────┘                 │ │
│  │                                   │                                         │ │
│  └───────────────────────────────────┼─────────────────────────────────────────┘ │
│                                      │                                           │
│  ┌───────────────────────────────────┼─────────────────────────────────────────┐ │
│  │                         STRATEGY LAYER                                       │ │
│  │                                   │                                          │ │
│  │         ┌─────────────────────────┼─────────────────────────┐               │ │
│  │         │                         │                         │               │ │
│  │    ┌────▼──────────┐    ┌─────────▼─────────┐    ┌─────────▼─────────┐     │ │
│  │    │  MemoryCache  │    │    RedisCache     │    │  MultiTierCache   │     │ │
│  │    │               │    │                   │    │                   │     │ │
│  │    │  • LRU        │    │  • Distributed    │    │  L1: Memory       │     │ │
│  │    │  • Fast       │    │  • Persistent     │    │  L2: Redis        │     │ │
│  │    │  • Single-node│    │  • Scalable       │    │  • Read-through   │     │ │
│  │    └───────────────┘    └───────────────────┘    └───────────────────┘     │ │
│  │                                                                              │ │
│  └──────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                    │
│  ┌──────────────────────────────────────────────────────────────────────────────┐ │
│  │                         INVALIDATION LAYER                                    │ │
│  │                                                                               │ │
│  │    ┌──────────────────────────────────────────────────────────────────────┐  │ │
│  │    │                    Tag-Based Invalidation                             │  │ │
│  │    │                                                                       │  │ │
│  │    │   cache.set('user:123', data, { tags: ['user:123', 'users'] })       │  │ │
│  │    │   cache.invalidateTag('user:123')  // Invalidates all tagged entries │  │ │
│  │    │                                                                       │  │ │
│  │    └──────────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                               │ │
│  │    ┌──────────────────────────────────────────────────────────────────────┐  │ │
│  │    │                   Pattern-Based Invalidation                          │  │ │
│  │    │                                                                       │  │ │
│  │    │   cache.invalidatePattern('user:*')  // Glob pattern matching        │  │ │
│  │    │   cache.invalidatePattern('venture:abc:*')                           │  │ │
│  │    │                                                                       │  │ │
│  │    └──────────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                               │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### Cache Interface

```typescript
interface Cache {
  // Basic operations
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  del(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  
  // Batch operations
  getMany<T>(keys: string[]): Promise<Map<string, T | null>>;
  setMany<T>(entries: Array<{ key: string; value: T; options?: CacheOptions }>): Promise<void>;
  delMany(keys: string[]): Promise<void>;
  
  // Atomic operations
  incr(key: string, delta?: number): Promise<number>;
  decr(key: string, delta?: number): Promise<number>;
  
  // Key management
  keys(pattern: string): Promise<string[]>;
  clear(): Promise<void>;
  
  // Invalidation
  invalidate(key: string): Promise<void>;
  invalidatePattern(pattern: string): Promise<void>;
  invalidateTag(tag: string): Promise<void>;
  
  // Stats
  stats(): Promise<CacheStats>;
}
```

### CacheConfig

```typescript
interface CacheConfig {
  // Strategy
  strategy: 'memory' | 'redis' | 'multi-tier';
  
  // Memory cache settings
  memory?: {
    maxSize: number;                    // Max entries
    maxMemory: number;                  // Max memory in bytes
    evictionPolicy: 'lru' | 'lfu' | 'fifo';
  };
  
  // Redis settings
  redis?: {
    url: string;
    password?: string;
    db?: number;
    keyPrefix?: string;
    tls?: boolean;
  };
  
  // Multi-tier settings
  multiTier?: {
    l1: CacheConfig;                    // Fast layer (memory)
    l2: CacheConfig;                    // Slow layer (redis)
    l1Ttl?: number;                     // L1 TTL (shorter)
    writePolicy: 'write-through' | 'write-behind';
  };
  
  // Default options
  defaults: {
    ttl: number;                        // Default TTL in seconds
    staleWhileRevalidate?: number;      // SWR window
  };
  
  // Serialization
  serializer?: 'json' | 'msgpack' | 'custom';
  compress?: boolean;                   // Compress large values
  compressionThreshold?: number;        // Min size to compress (bytes)
}
```

### CacheOptions

```typescript
interface CacheOptions {
  ttl?: number;                         // Time-to-live in seconds
  tags?: string[];                      // Tags for invalidation
  staleWhileRevalidate?: number;        // Return stale, revalidate in background
  refresh?: () => Promise<unknown>;     // Refresh function for SWR
  compress?: boolean;                   // Override compression
  skipL1?: boolean;                     // Skip memory cache (multi-tier)
}
```

### CacheStats

```typescript
interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;                      // hits / (hits + misses)
  size: number;                         // Current entries
  maxSize: number;                      // Max entries
  memoryUsage: number;                  // Current memory (bytes)
  evictions: number;                    // Total evictions
  avgLatencyMs: number;                 // Average operation latency
}
```

---

## Usage Examples

### Basic Cache Operations

```typescript
import { cache } from '@mcv/cache';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Simple get/set
// ═══════════════════════════════════════════════════════════════════════════════

// Set with default TTL
await cache.set('user:123', { id: '123', name: 'John' });

// Set with custom TTL (1 hour)
await cache.set('session:abc', sessionData, { ttl: 3600 });

// Get value
const user = await cache.get<User>('user:123');
if (user) {
  console.log(user.name);
}

// Check existence
if (await cache.has('user:123')) {
  // ...
}

// Delete
await cache.del('user:123');

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: Batch operations
// ═══════════════════════════════════════════════════════════════════════════════

// Set multiple
await cache.setMany([
  { key: 'user:1', value: user1 },
  { key: 'user:2', value: user2 },
  { key: 'user:3', value: user3 },
]);

// Get multiple
const users = await cache.getMany<User>(['user:1', 'user:2', 'user:3']);
// Returns: Map { 'user:1' => User, 'user:2' => User, 'user:3' => null }

// Delete multiple
await cache.delMany(['user:1', 'user:2', 'user:3']);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Atomic counters
// ═══════════════════════════════════════════════════════════════════════════════

// Rate limiting counter
const requests = await cache.incr('rate:user:123', 1);
if (requests === 1) {
  // First request in window - set TTL
  await cache.set('rate:user:123', requests, { ttl: 60 });
}

if (requests > 100) {
  throw new Error('Rate limit exceeded');
}

// View counter
await cache.incr('views:post:456');
const views = await cache.get<number>('views:post:456');
```

### Cache-Aside Pattern

```typescript
import { cacheAside } from '@mcv/cache';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Cache-aside with automatic population
// ═══════════════════════════════════════════════════════════════════════════════

const getUser = cacheAside(
  // Key generator
  (userId: string) => `user:${userId}`,
  // Data loader
  async (userId: string) => {
    return db.query.users.findFirst({ where: eq(users.id, userId) });
  },
  // Options
  { ttl: 300, tags: (userId) => [`user:${userId}`] }
);

// Usage - automatically caches
const user = await getUser('user-123');

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: Stale-while-revalidate
// ═══════════════════════════════════════════════════════════════════════════════

const getExpensiveData = cacheAside(
  () => 'analytics:dashboard',
  async () => {
    return analyticsService.computeDashboardMetrics();
  },
  {
    ttl: 60,                            // Fresh for 1 minute
    staleWhileRevalidate: 300,          // Serve stale for 5 more minutes
  }
);

// First call: computes and caches
const data1 = await getExpensiveData();

// Within 1 minute: returns cached
const data2 = await getExpensiveData();

// After 1-6 minutes: returns stale, triggers background refresh
const data3 = await getExpensiveData();
```

### Cached Decorator

```typescript
import { cached } from '@mcv/cache';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: Method decorator
// ═══════════════════════════════════════════════════════════════════════════════

class UserService {
  @cached({
    key: (userId: string) => `user:${userId}`,
    ttl: 300,
    tags: (userId: string) => [`user:${userId}`, 'users'],
  })
  async getUser(userId: string): Promise<User> {
    return db.query.users.findFirst({ where: eq(users.id, userId) });
  }
  
  @cached({
    key: (ventureId: string) => `venture:${ventureId}:users`,
    ttl: 60,
    tags: (ventureId: string) => [`venture:${ventureId}`, 'users'],
  })
  async getVentureUsers(ventureId: string): Promise<User[]> {
    return db.query.users.findMany({ 
      where: eq(users.ventureId, ventureId) 
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 7: Function wrapper
// ═══════════════════════════════════════════════════════════════════════════════

const cachedGetDeal = cached(
  getDeal,
  {
    key: (dealId: string) => `deal:${dealId}`,
    ttl: 120,
  }
);

const deal = await cachedGetDeal('deal-123');
```

### Tag-Based Invalidation

```typescript
import { cache, invalidateTag } from '@mcv/cache';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 8: Tagging entries
// ═══════════════════════════════════════════════════════════════════════════════

// Cache user with tags
await cache.set('user:123', userData, {
  tags: ['user:123', 'users', 'venture:abc'],
});

// Cache user's deals
await cache.set('user:123:deals', deals, {
  tags: ['user:123', 'deals', 'venture:abc'],
});

// Cache venture data
await cache.set('venture:abc', ventureData, {
  tags: ['venture:abc'],
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 9: Invalidating by tag
// ═══════════════════════════════════════════════════════════════════════════════

// User updated - invalidate all user-related caches
await invalidateTag('user:123');
// Invalidates: 'user:123', 'user:123:deals'

// Venture settings changed - invalidate all venture caches
await invalidateTag('venture:abc');
// Invalidates: 'user:123', 'user:123:deals', 'venture:abc'

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 10: Pattern invalidation
// ═══════════════════════════════════════════════════════════════════════════════

// Clear all user caches
await cache.invalidatePattern('user:*');

// Clear specific venture's caches
await cache.invalidatePattern('venture:abc:*');

// Clear all deal caches
await cache.invalidatePattern('*:deals');
```

### Multi-Tier Cache

```typescript
import { createCache } from '@mcv/cache';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 11: Configure multi-tier cache
// ═══════════════════════════════════════════════════════════════════════════════

const cache = createCache({
  strategy: 'multi-tier',
  multiTier: {
    l1: {
      strategy: 'memory',
      memory: {
        maxSize: 10000,
        maxMemory: 100 * 1024 * 1024,  // 100MB
        evictionPolicy: 'lru',
      },
    },
    l2: {
      strategy: 'redis',
      redis: {
        url: process.env.REDIS_URL,
        keyPrefix: 'cache:',
      },
    },
    l1Ttl: 30,                          // L1 entries expire in 30s
    writePolicy: 'write-through',
  },
  defaults: {
    ttl: 300,
  },
});

// Reads check L1 first, then L2
// Writes go to both L1 and L2 (write-through)

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 12: Skip L1 for large objects
// ═══════════════════════════════════════════════════════════════════════════════

// Large objects bypass memory cache
await cache.set('large:data', largeObject, { 
  skipL1: true,
  ttl: 3600,
});
```

### React Hooks

```tsx
import { useCachedQuery, useCacheInvalidation } from '@mcv/cache/client';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 13: Cached query hook
// ═══════════════════════════════════════════════════════════════════════════════

function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, error, refetch } = useCachedQuery(
    `user:${userId}`,
    () => api.getUser(userId),
    {
      ttl: 300,
      staleWhileRevalidate: 600,
    }
  );
  
  if (isLoading) return <Skeleton />;
  if (error) return <Error error={error} />;
  
  return (
    <div>
      <h1>{data.name}</h1>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 14: Cache invalidation hook
// ═══════════════════════════════════════════════════════════════════════════════

function UserEditForm({ userId }: { userId: string }) {
  const { invalidate, invalidateTag } = useCacheInvalidation();
  
  const handleSave = async (data: UserUpdateInput) => {
    await api.updateUser(userId, data);
    
    // Invalidate specific cache
    await invalidate(`user:${userId}`);
    
    // Or invalidate by tag
    await invalidateTag(`user:${userId}`);
  };
  
  return <form onSubmit={handleSave}>...</form>;
}
```

---

## Cache Key Conventions

```typescript
// Recommended key format: {entity}:{id}:{relation?}
const KEY_PATTERNS = {
  // Entity by ID
  user: (id: string) => `user:${id}`,
  deal: (id: string) => `deal:${id}`,
  venture: (id: string) => `venture:${id}`,
  
  // Entity relations
  userDeals: (userId: string) => `user:${userId}:deals`,
  ventureUsers: (ventureId: string) => `venture:${ventureId}:users`,
  
  // Computed/aggregated data
  dashboardMetrics: (ventureId: string) => `venture:${ventureId}:metrics`,
  
  // Session/auth data
  session: (token: string) => `session:${token}`,
  
  // Rate limiting
  rateLimit: (userId: string, action: string) => `rate:${action}:${userId}`,
};
```

---

## Performance Considerations

### Latency Targets

| Operation | Memory | Redis | Multi-tier |
|-----------|--------|-------|------------|
| Get (hit) | < 0.1ms | < 1ms | < 0.1ms (L1) |
| Get (miss) | < 0.1ms | < 1ms | < 1ms (L2) |
| Set | < 0.1ms | < 1ms | < 1ms |
| Batch (10) | < 0.5ms | < 2ms | < 2ms |

### Memory Guidelines

| Entries | Memory Estimate |
|---------|-----------------|
| 10,000 | ~50MB |
| 100,000 | ~500MB |
| 1,000,000 | ~5GB |

---

## Environment Variables

```bash
# Redis configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0
CACHE_KEY_PREFIX=mcv:

# Cache settings
CACHE_STRATEGY=multi-tier
CACHE_DEFAULT_TTL=300
CACHE_L1_MAX_SIZE=10000
CACHE_L1_MAX_MEMORY=104857600
CACHE_COMPRESSION_ENABLED=true
CACHE_COMPRESSION_THRESHOLD=1024
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| ioredis | ^5.x | Redis client |
| lru-cache | ^10.x | In-memory LRU cache |
| msgpack-lite | ^0.1.x | Binary serialization |
| zlib | (built-in) | Compression |

---

*@mcv/fabric/cache — High-Performance Caching Module*
