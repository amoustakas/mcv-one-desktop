# @mcv/kernel — Technical Architecture
## System Design & Data Flow

**Package:** `@mcv/kernel`  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER                                  │
│                    (Next.js, tRPC, React Server Components)                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ imports
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              @mcv/kernel                                     │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                          PUBLIC API                                    │  │
│  │                                                                        │  │
│  │   db          config        logger        errors        utils          │  │
│  │   types       context                                                  │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│  ┌───────────────────────────────────┼───────────────────────────────────┐  │
│  │                      INTERNAL IMPLEMENTATION                           │  │
│  │                                                                        │  │
│  │   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐               │  │
│  │   │ Drizzle │   │  Zod    │   │  Pino   │   │AsyncLocal│              │  │
│  │   │  ORM    │   │ Schemas │   │ Logger  │   │ Storage │               │  │
│  │   └────┬────┘   └────┬────┘   └────┬────┘   └────┬────┘               │  │
│  │        │             │             │             │                     │  │
│  └────────┼─────────────┼─────────────┼─────────────┼─────────────────────┘  │
│           │             │             │             │                        │
└───────────┼─────────────┼─────────────┼─────────────┼────────────────────────┘
            │             │             │             │
            ▼             ▼             ▼             ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│    PostgreSQL   │ │ Environment │ │   stdout/   │ │   Node.js   │
│   (Supabase)    │ │  Variables  │ │   stderr    │ │   Runtime   │
└─────────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

---

## Component Architecture

### 1. Database Layer (db)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE LAYER                                  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Connection Pool                              │    │
│  │                                                                      │    │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │    │
│  │   │  Conn 1  │  │  Conn 2  │  │  Conn 3  │  │  ...20   │           │    │
│  │   └──────────┘  └──────────┘  └──────────┘  └──────────┘           │    │
│  │                                                                      │    │
│  │   Max: 20 | Idle Timeout: 20s | Connect Timeout: 10s                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Drizzle ORM                                  │    │
│  │                                                                      │    │
│  │   Schema Definition    Query Builder    Transaction Manager          │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      PostgreSQL (Supabase)                           │    │
│  │                                                                      │    │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │    │
│  │   │     RLS      │  │   Triggers   │  │   Functions  │              │    │
│  │   │   Policies   │  │              │  │              │              │    │
│  │   └──────────────┘  └──────────────┘  └──────────────┘              │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Connection Flow

```
Request → Get Connection from Pool → Execute Query → Return to Pool
              │                           │
              │ (if pool exhausted)       │ (on error)
              ▼                           ▼
         Wait in Queue              Rollback & Release
              │
              │ (timeout)
              ▼
         Throw Error
```

#### Transaction Management

```typescript
// Transaction isolation levels
type IsolationLevel = 
  | 'read uncommitted'
  | 'read committed'      // Default
  | 'repeatable read'
  | 'serializable';

// Transaction flow
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   BEGIN     │────▶│   EXECUTE   │────▶│   COMMIT    │
│ TRANSACTION │     │   QUERIES   │     │             │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                           │ (on error)
                           ▼
                    ┌─────────────┐
                    │  ROLLBACK   │
                    │             │
                    └─────────────┘
```

### 2. Configuration Layer (config)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CONFIGURATION FLOW                                 │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      Environment Sources                             │    │
│  │                                                                      │    │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │    │
│  │   │  .env    │  │  .env    │  │  System  │  │  Vault   │           │    │
│  │   │  .local  │  │  .prod   │  │   Env    │  │ (Secrets)│           │    │
│  │   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘           │    │
│  │        │             │             │             │                  │    │
│  │        └─────────────┴──────┬──────┴─────────────┘                  │    │
│  │                             │                                        │    │
│  └─────────────────────────────┼────────────────────────────────────────┘    │
│                                ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                       Zod Validation                                 │    │
│  │                                                                      │    │
│  │   Parse → Validate → Transform → Type-Safe Config Object            │    │
│  │                                                                      │    │
│  │   On Failure: Throw with detailed error messages                    │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                │                                             │
│                                ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                       Cached Config                                  │    │
│  │                                                                      │    │
│  │   Singleton pattern - loaded once, cached for process lifetime      │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Configuration Hierarchy

```
Priority (highest to lowest):
1. System Environment Variables (process.env)
2. .env.local (local overrides, gitignored)
3. .env.{NODE_ENV} (.env.production, .env.staging)
4. .env (base defaults)
5. Schema defaults
```

### 3. Logging Layer (logger)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              LOGGING FLOW                                    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        Log Call                                      │    │
│  │                                                                      │    │
│  │   logger.info({ userId, action }, 'User logged in')                 │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                │                                             │
│                                ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      Pino Processing                                 │    │
│  │                                                                      │    │
│  │   1. Check log level (skip if below threshold)                      │    │
│  │   2. Merge context (child logger bindings)                          │    │
│  │   3. Add timestamp                                                  │    │
│  │   4. Apply redaction rules (password, token, etc.)                  │    │
│  │   5. Format (JSON or Pretty)                                        │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                │                                             │
│                                ▼                                             │
│  ┌───────────────────┬────────────────────┬────────────────────────────┐    │
│  │   Development     │    Production      │      Observability         │    │
│  │                   │                    │                            │    │
│  │   pino-pretty     │   JSON to stdout   │   → Datadog/Grafana       │    │
│  │   (colorized)     │                    │   → CloudWatch            │    │
│  │                   │                    │   → Logstash              │    │
│  └───────────────────┴────────────────────┴────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Log Entry Structure

```json
{
  "level": "info",
  "time": "2026-02-09T12:00:00.000Z",
  "pid": 12345,
  "hostname": "server-1",
  "requestId": "req_abc123",
  "ventureId": "ven_xyz789",
  "userId": "usr_def456",
  "msg": "User logged in",
  "action": "login",
  "duration": 45
}
```

### 4. Error Handling Layer (errors)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ERROR HANDLING FLOW                                │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      Error Thrown                                    │    │
│  │                                                                      │    │
│  │   throw new NotFoundError('User', userId);                          │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                │                                             │
│                                ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      Error Handler                                   │    │
│  │                                                                      │    │
│  │   1. Check if MCVError (operational) or unknown (programming)       │    │
│  │   2. Log appropriately (error vs fatal)                             │    │
│  │   3. Map to HTTP status code                                        │    │
│  │   4. Serialize for response                                         │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                │                                             │
│           ┌────────────────────┼────────────────────┐                       │
│           ▼                    ▼                    ▼                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  Operational    │  │  Programming    │  │    External     │             │
│  │     Error       │  │     Error       │  │  Service Error  │             │
│  │                 │  │                 │  │                 │             │
│  │ • Expected      │  │ • Unexpected    │  │ • Timeout       │             │
│  │ • Recoverable   │  │ • Bug           │  │ • Rate limited  │             │
│  │ • User-facing   │  │ • Log & alert   │  │ • Retry logic   │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5. Context Layer (context)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CONTEXT PROPAGATION                                 │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      HTTP Request                                    │    │
│  │                                                                      │    │
│  │   Headers: Authorization, X-Venture-ID, X-Request-ID                │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                │                                             │
│                                ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Context Middleware                                │    │
│  │                                                                      │    │
│  │   1. Extract user from session/JWT                                  │    │
│  │   2. Resolve venture from subdomain/header                          │    │
│  │   3. Load permissions from cache/DB                                 │    │
│  │   4. Create MCVContext object                                       │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                │                                             │
│                                ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                   AsyncLocalStorage                                  │    │
│  │                                                                      │    │
│  │   Store context for entire request lifecycle                        │    │
│  │   Available anywhere via getContext()                               │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                │                                             │
│                                ▼                                             │
│  ┌───────────────────┬─────────────────┬───────────────────────────────┐    │
│  │   tRPC Router     │   Service Layer │     Database Layer            │    │
│  │                   │                 │                               │    │
│  │   getContext()    │   getContext()  │     getContext()              │    │
│  │   → user          │   → venture     │     → ventureId for RLS       │    │
│  │   → permissions   │   → logger      │                               │    │
│  └───────────────────┴─────────────────┴───────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Patterns

### Request Lifecycle

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│ Middleware│────▶│  Router  │────▶│ Service  │────▶│    DB    │
│          │     │          │     │          │     │          │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                │                │                │
     │                │                │                │                │
     ▼                ▼                ▼                ▼                ▼
  Request         Context          Validation      Business         Query
   Body           Created          & Parsing        Logic           Execution
                     │                │                │                │
                     │                │                │                │
                     ▼                ▼                ▼                ▼
                  Logger           Type-Safe       Transforms        Results
                 Attached           Input                            
                     │                                                 │
                     └─────────────────────────────────────────────────┘
                                         │
                                         ▼
                                    Response
```

### Multi-Tenant Query Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   1. Context provides ventureId                                             │
│      const ctx = getContext();                                              │
│      const { ventureId } = ctx.venture;                                     │
│                                                                              │
│   2. Set PostgreSQL session variable                                        │
│      SET app.current_venture_id = '{ventureId}';                           │
│                                                                              │
│   3. RLS policy automatically filters                                       │
│      USING (venture_id = current_setting('app.current_venture_id')::uuid)  │
│                                                                              │
│   4. Query executes with automatic tenant isolation                         │
│      SELECT * FROM users;  -- Only returns current venture's users         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Integration Points

### Upstream Dependencies (External)

| Dependency | Purpose | Connection Method |
|------------|---------|-------------------|
| PostgreSQL (Supabase) | Primary database | Connection string |
| Redis (Upstash) | Caching, sessions | Connection URL |
| Vault (optional) | Secrets management | API |

### Downstream Consumers (SDK Packages)

| Consumer | Kernel Usage |
|----------|--------------|
| @mcv/identity | db, config, logger, context, errors |
| @mcv/fabric | db, config, logger, errors, utils |
| @mcv/shared | db, config, utils, types |
| @mcv/connectors | config, logger, errors |
| @mcv/intelligence | db, config, logger, context |
| All Tier 5 domains | Full kernel dependency |

---

## Performance Considerations

### Connection Pooling

| Setting | Development | Production |
|---------|-------------|------------|
| Max Connections | 5 | 20 |
| Idle Timeout | 60s | 20s |
| Connection Timeout | 30s | 10s |

### Logging Performance

- **Log Level Filtering**: Check log level before formatting
- **Lazy Evaluation**: Use functions for expensive log data
- **Async Writing**: Pino writes asynchronously by default
- **Redaction**: Applied during serialization only

```typescript
// Good - lazy evaluation
logger.debug(() => ({ expensiveData: computeData() }), 'Debug info');

// Avoid in hot paths
logger.trace({ ...largeObject }, 'Detailed trace');
```

### Context Overhead

- AsyncLocalStorage has minimal overhead (~100ns per access)
- Context creation is cheap (object allocation only)
- Permission checks are cached in context object

---

## Security Architecture

### Secrets Management

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SECRETS HIERARCHY                                   │
│                                                                              │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│   │   Development   │     │    Staging      │     │   Production    │       │
│   │                 │     │                 │     │                 │       │
│   │   .env.local    │     │  Vercel Env     │     │  Vercel Env +   │       │
│   │   (gitignored)  │     │                 │     │  Vault          │       │
│   └─────────────────┘     └─────────────────┘     └─────────────────┘       │
│                                                                              │
│   Encryption: AES-256-GCM for stored secrets                                │
│   Key rotation: Supported via versioned keys                                │
│   Access: Minimal privilege principle                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Log Redaction

Automatically redacted fields:
- `password`
- `token`
- `secret`
- `authorization`
- `cookie`
- `apiKey`
- `creditCard`

---

## Failure Modes & Recovery

### Database Connection Failure

```
1. Connection attempt fails
   ↓
2. Retry with exponential backoff (up to 3 attempts)
   ↓
3. If all retries fail → throw ConnectionError
   ↓
4. Health check endpoint reports unhealthy
   ↓
5. Load balancer removes instance from rotation
```

### Configuration Validation Failure

```
1. Environment variable missing/invalid
   ↓
2. Zod validation throws ZodError
   ↓
3. Process exits with detailed error message
   ↓
4. CI/CD prevents deployment
```

---

## Monitoring & Observability

### Metrics Exposed

| Metric | Type | Description |
|--------|------|-------------|
| `db_pool_connections_total` | Gauge | Current pool size |
| `db_pool_connections_waiting` | Gauge | Waiting requests |
| `db_query_duration_seconds` | Histogram | Query execution time |
| `log_messages_total` | Counter | Logs by level |
| `errors_total` | Counter | Errors by code |

### Health Check Endpoint

```typescript
// GET /health
{
  "status": "healthy",
  "version": "1.0.0",
  "checks": {
    "database": { "status": "ok", "latency": 5 },
    "config": { "status": "ok" }
  }
}
```

---

## Related Documentation

- [Package Specification](./01-PACKAGE-SPEC.md)
- [API Reference](./03-API-REFERENCE.md)
- [Implementation Plan](./04-IMPLEMENTATION-PLAN.md)

---

*@mcv/kernel — Technical Architecture v1.0*
