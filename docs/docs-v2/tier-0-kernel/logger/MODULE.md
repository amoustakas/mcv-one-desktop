# @mcv/kernel/logger — Logger Module

**Parent Package:** @mcv/kernel  
**Classification:** INTERNAL  
**Last Updated:** February 9, 2026

---

## Purpose

The `logger` module provides structured logging using Pino with context propagation, automatic redaction of sensitive data, and environment-aware formatting.

---

## Key Features

- **Structured Logging**: JSON output with consistent schema
- **Log Levels**: trace, debug, info, warn, error, fatal
- **Context Propagation**: Child loggers inherit context
- **Automatic Redaction**: Sensitive fields masked
- **Pretty Printing**: Human-readable output for development
- **Request Scoping**: Attach requestId, userId, ventureId

---

## Exports

```typescript
// Core Logger
export { logger } from './index';

// Logger Factories
export { createLogger } from './index';
export { createRequestLogger } from './index';

// Types
export type { Logger } from 'pino';
```

---

## Log Levels

| Level | Value | Use Case |
|-------|-------|----------|
| `trace` | 10 | Detailed debugging (method entry/exit) |
| `debug` | 20 | Development debugging (queries, API calls) |
| `info` | 30 | Normal operations (requests, jobs) |
| `warn` | 40 | Potential issues (deprecations, retries) |
| `error` | 50 | Errors requiring attention |
| `fatal` | 60 | System failures (startup errors) |

---

## Usage

### Basic Logging

```typescript
import { logger } from '@mcv/kernel';

// Simple message
logger.info('Server started');

// With context object
logger.info({ port: 3000 }, 'Server listening');

// With error
logger.error({ err: error }, 'Failed to process request');
```

### Child Loggers

```typescript
import { createLogger } from '@mcv/kernel';

// Module-specific logger
const paymentLogger = createLogger({ module: 'payments' });
paymentLogger.info({ orderId: 'ord_123' }, 'Processing payment');
// Output includes: { module: 'payments', orderId: 'ord_123', msg: '...' }

// Further child
const stripeLogger = paymentLogger.child({ provider: 'stripe' });
stripeLogger.info('Charge created');
// Output includes: { module: 'payments', provider: 'stripe', msg: '...' }
```

### Request Loggers

```typescript
import { createRequestLogger } from '@mcv/kernel';

// Create logger for a specific request
const reqLogger = createRequestLogger(
  'req_abc123',      // requestId
  'ven_xyz789',      // ventureId (optional)
  'usr_def456'       // userId (optional)
);

reqLogger.info('Request received');
// Output includes: { requestId, ventureId, userId, timestamp, msg: '...' }
```

---

## Log Entry Schema

### JSON Format (Production)

```json
{
  "level": "info",
  "time": "2026-02-09T12:00:00.000Z",
  "pid": 12345,
  "hostname": "server-1",
  "requestId": "req_abc123",
  "ventureId": "ven_xyz789",
  "userId": "usr_def456",
  "module": "payments",
  "msg": "Payment processed",
  "orderId": "ord_123",
  "amount": 9999,
  "duration": 45
}
```

### Pretty Format (Development)

```
[12:00:00.000] INFO: Payment processed
    requestId: req_abc123
    ventureId: ven_xyz789
    orderId: ord_123
    amount: 9999
```

---

## Automatic Redaction

Sensitive fields are automatically masked:

```typescript
logger.info({
  user: {
    email: 'user@example.com',
    password: 'secret123',     // Will be redacted
  },
  authorization: 'Bearer xyz', // Will be redacted
  apiKey: 'sk_live_abc',       // Will be redacted
});

// Output:
// {
//   user: { email: 'user@example.com', password: '[REDACTED]' },
//   authorization: '[REDACTED]',
//   apiKey: '[REDACTED]'
// }
```

### Redacted Fields

- `password`
- `token`
- `secret`
- `authorization`
- `cookie`
- `apiKey`
- `creditCard`
- `ssn`
- Any field ending with `Password`, `Secret`, `Token`, `Key`

---

## Configuration

### Environment Variables

```bash
# Log level (trace|debug|info|warn|error|fatal)
LOG_LEVEL=info

# Output format (json|pretty)
LOG_FORMAT=json
```

### Recommended Settings

| Environment | LOG_LEVEL | LOG_FORMAT |
|-------------|-----------|------------|
| Development | debug | pretty |
| Staging | debug | json |
| Production | info | json |

---

## Best Practices

### Do

```typescript
// Include relevant context
logger.info({ userId, orderId, amount }, 'Order placed');

// Log errors with err property (auto-serialized)
logger.error({ err: error, requestId }, 'Request failed');

// Use appropriate levels
logger.debug({ query }, 'Executing database query');
logger.info({ userId }, 'User logged in');
logger.warn({ attemptCount: 3 }, 'Rate limit approaching');
```

### Don't

```typescript
// Don't log sensitive data
logger.info({ password: user.password }); // BAD

// Don't use console.log
console.log('Debug:', data); // BAD - use logger.debug

// Don't stringify errors manually
logger.error({ error: error.message }); // BAD - use { err: error }

// Don't log in hot paths without level check
if (logger.isLevelEnabled('trace')) {
  logger.trace({ data: expensiveComputation() }, 'Trace');
}
```

---

## Integration with tRPC

```typescript
// middleware/logger.ts
import { createRequestLogger } from '@mcv/kernel';

export const loggerMiddleware = t.middleware(async ({ ctx, next, path }) => {
  const reqLogger = createRequestLogger(
    ctx.requestId,
    ctx.venture?.id,
    ctx.user?.id
  );
  
  const start = Date.now();
  
  try {
    const result = await next({ ctx: { ...ctx, logger: reqLogger } });
    
    reqLogger.info(
      { path, duration: Date.now() - start },
      'Request completed'
    );
    
    return result;
  } catch (error) {
    reqLogger.error(
      { err: error, path, duration: Date.now() - start },
      'Request failed'
    );
    throw error;
  }
});
```

---

## Log Aggregation

Logs are designed for easy aggregation in:

- **Datadog**: JSON logs ingested directly
- **CloudWatch**: Structured JSON parsing
- **Grafana Loki**: Label extraction from JSON
- **ELK Stack**: Logstash JSON parsing

### Sample Datadog Query

```
@level:error @module:payments @ventureId:ven_xyz
```

---

## Performance

### Lazy Evaluation

```typescript
// Expensive data only computed if level enabled
logger.debug(() => ({
  heavyData: computeExpensiveData(),
}), 'Debug with heavy data');
```

### Async Transport

Pino uses asynchronous logging by default:
- Logs are buffered and written asynchronously
- Main thread is not blocked
- Small memory overhead for buffer

---

## Testing

### Capturing Logs

```typescript
import { vi } from 'vitest';
import { logger } from '@mcv/kernel';

describe('MyService', () => {
  const infoSpy = vi.spyOn(logger, 'info');
  
  afterEach(() => {
    infoSpy.mockClear();
  });
  
  it('logs on success', async () => {
    await myService.doSomething();
    
    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'something' }),
      'Something done'
    );
  });
});
```

### Silencing in Tests

```typescript
// vitest.setup.ts
import { logger } from '@mcv/kernel';

// Set to silent level for tests
logger.level = 'silent';
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| pino | ^8.x | Core logging |
| pino-pretty | ^10.x | Pretty formatting (dev) |

---

*@mcv/kernel/logger — Logger Module*
