# @mcv/kernel/errors — Error Handling Module

**Parent Package:** @mcv/kernel  
**Classification:** INTERNAL  
**Last Updated:** February 9, 2026

---

## Purpose

The `errors` module provides standardized error types, error codes, and error handling utilities for consistent error management across the MCV.ONE SDK.

---

## Key Features

- **Typed Error Codes**: Categorized error codes for all scenarios
- **HTTP Mapping**: Automatic status code mapping
- **Serialization**: JSON-safe error representation
- **Operational vs Programming**: Distinguish expected vs unexpected errors
- **Stack Traces**: Captured for debugging
- **Error Chaining**: Preserve cause for debugging

---

## Exports

```typescript
// Base
export { MCVError } from './base';
export { ErrorCode } from './base';

// Specialized Errors
export { NotFoundError } from './specialized';
export { ValidationError } from './specialized';
export { UnauthorizedError } from './specialized';
export { UnauthenticatedError } from './specialized';
export { ConflictError } from './specialized';
export { RateLimitError } from './specialized';
export { ExternalServiceError } from './specialized';

// Handler
export { handleError } from './handler';
export { isOperationalError } from './handler';
export { withErrorHandling } from './handler';
```

---

## Error Codes

### 1xxx — Authentication/Authorization

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| 1001 | UNAUTHENTICATED | 401 | No valid credentials |
| 1002 | UNAUTHORIZED | 403 | Insufficient permissions |
| 1003 | TOKEN_EXPIRED | 401 | Token has expired |
| 1004 | INVALID_CREDENTIALS | 401 | Wrong username/password |
| 1005 | SESSION_EXPIRED | 401 | Session no longer valid |
| 1006 | MFA_REQUIRED | 401 | MFA verification needed |

### 2xxx — Validation

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| 2001 | VALIDATION_ERROR | 400 | Input validation failed |
| 2002 | INVALID_INPUT | 400 | Malformed input |
| 2003 | MISSING_REQUIRED_FIELD | 400 | Required field missing |
| 2004 | INVALID_FORMAT | 400 | Wrong format |

### 3xxx — Resource

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| 3001 | NOT_FOUND | 404 | Resource not found |
| 3002 | ALREADY_EXISTS | 409 | Resource already exists |
| 3003 | CONFLICT | 409 | Conflicting operation |
| 3004 | GONE | 410 | Resource deleted |

### 4xxx — Business Logic

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| 4001 | BUSINESS_RULE_VIOLATION | 422 | Business rule not met |
| 4002 | INSUFFICIENT_FUNDS | 422 | Not enough balance |
| 4003 | LIMIT_EXCEEDED | 422 | Limit reached |
| 4004 | OPERATION_NOT_ALLOWED | 422 | Operation forbidden |
| 4005 | QUOTA_EXCEEDED | 422 | Quota exhausted |

### 5xxx — External Services

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| 5001 | EXTERNAL_SERVICE_ERROR | 502 | External service failed |
| 5002 | TIMEOUT | 504 | Request timed out |
| 5003 | RATE_LIMITED | 429 | Too many requests |
| 5004 | SERVICE_UNAVAILABLE | 503 | Service down |

### 6xxx — System

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| 6001 | INTERNAL_ERROR | 500 | Unexpected error |
| 6002 | DATABASE_ERROR | 500 | Database failure |
| 6003 | CONFIGURATION_ERROR | 500 | Config issue |
| 6004 | NOT_IMPLEMENTED | 501 | Not yet implemented |

---

## MCVError Class

```typescript
class MCVError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly cause?: Error;
  public readonly isOperational: boolean;
  
  constructor(
    message: string,
    code: ErrorCode,
    options?: {
      statusCode?: number;
      details?: Record<string, unknown>;
      cause?: Error;
      isOperational?: boolean;
    }
  );
}
```

### Usage

```typescript
import { MCVError, ErrorCode } from '@mcv/kernel';

throw new MCVError(
  'Payment processing failed',
  ErrorCode.EXTERNAL_SERVICE_ERROR,
  {
    details: { provider: 'stripe', chargeId: 'ch_123' },
    cause: originalError,
  }
);
```

---

## Specialized Errors

### NotFoundError

```typescript
import { NotFoundError } from '@mcv/kernel';

// With resource and ID
throw new NotFoundError('User', 'usr_abc123');
// Message: "User with id 'usr_abc123' not found"

// Resource only
throw new NotFoundError('Configuration');
// Message: "Configuration not found"
```

### ValidationError

```typescript
import { ValidationError } from '@mcv/kernel';

throw new ValidationError('Invalid input', {
  email: ['Invalid email format'],
  age: ['Must be at least 18', 'Must be a number'],
});
```

### UnauthorizedError

```typescript
import { UnauthorizedError } from '@mcv/kernel';

throw new UnauthorizedError('Admin access required');
// HTTP 403
```

### UnauthenticatedError

```typescript
import { UnauthenticatedError } from '@mcv/kernel';

throw new UnauthenticatedError('Please log in');
// HTTP 401
```

### ConflictError

```typescript
import { ConflictError } from '@mcv/kernel';

throw new ConflictError('Email already registered', 'email');
```

### RateLimitError

```typescript
import { RateLimitError } from '@mcv/kernel';

throw new RateLimitError(60); // Retry after 60 seconds
```

### ExternalServiceError

```typescript
import { ExternalServiceError } from '@mcv/kernel';

throw new ExternalServiceError(
  'stripe',
  'Failed to create charge',
  stripeError
);
```

---

## Error Handler

### handleError Function

```typescript
import { handleError } from '@mcv/kernel';

try {
  await riskyOperation();
} catch (error) {
  const { statusCode, body } = handleError(error);
  
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### Response Format

```json
{
  "error": "User with id 'usr_123' not found",
  "code": 3001,
  "details": {
    "resource": "User",
    "id": "usr_123"
  }
}
```

---

## Operational vs Programming Errors

### Operational Errors

Expected errors that can be handled:
- User not found
- Validation failed
- Insufficient permissions
- Rate limited

```typescript
const error = new NotFoundError('User', id);
error.isOperational; // true
```

### Programming Errors

Unexpected bugs that should crash/alert:
- Null pointer exceptions
- Type errors
- Logic errors

```typescript
const error = new Error('Unexpected null');
isOperationalError(error); // false
```

---

## Error Chaining

```typescript
try {
  await externalService.call();
} catch (cause) {
  throw new ExternalServiceError(
    'payment-gateway',
    'Payment failed',
    cause // Original error preserved
  );
}

// Later in error handler
if (error.cause) {
  logger.error({ originalError: error.cause }, 'Root cause');
}
```

---

## Integration with tRPC

```typescript
import { TRPCError } from '@trpc/server';
import { MCVError, ErrorCode } from '@mcv/kernel';

// In procedure
throw new TRPCError({
  code: 'NOT_FOUND',
  message: 'User not found',
  cause: new NotFoundError('User', userId),
});

// Error formatter
export const errorFormatter = ({ error, shape }) => {
  if (error.cause instanceof MCVError) {
    return {
      ...shape,
      data: {
        ...shape.data,
        mcvCode: error.cause.code,
        details: error.cause.details,
      },
    };
  }
  return shape;
};
```

---

## Best Practices

### Do

```typescript
// Throw specific errors
throw new NotFoundError('Order', orderId);

// Include helpful details
throw new ValidationError('Invalid request', {
  price: ['Must be positive'],
});

// Chain errors
throw new MCVError('Failed to save', ErrorCode.DATABASE_ERROR, {
  cause: dbError,
});
```

### Don't

```typescript
// Don't throw generic Error
throw new Error('Something went wrong'); // BAD

// Don't swallow errors
try { ... } catch (e) { /* silence */ } // BAD

// Don't expose internal details in production
throw new MCVError(dbError.message, ...); // BAD - might leak SQL
```

---

## Testing

```typescript
import { NotFoundError, ValidationError } from '@mcv/kernel';

describe('UserService', () => {
  it('throws NotFoundError for missing user', async () => {
    await expect(userService.get('invalid'))
      .rejects.toThrow(NotFoundError);
  });
  
  it('throws ValidationError for invalid email', async () => {
    await expect(userService.create({ email: 'bad' }))
      .rejects.toThrow(ValidationError);
  });
});
```

---

*@mcv/kernel/errors — Error Handling Module*
