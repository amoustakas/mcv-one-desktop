# @mcv/kernel/config — Configuration Module

**Parent Package:** @mcv/kernel  
**Classification:** INTERNAL  
**Last Updated:** February 9, 2026

---

## Purpose

The `config` module provides centralized, type-safe configuration management with Zod validation, environment variable loading, and secrets encryption.

---

## Key Features

- **Schema Validation**: Zod-based validation with detailed error messages
- **Type Safety**: Full TypeScript inference for config values
- **Environment Hierarchy**: Layered env file loading
- **Secrets Management**: AES-256-GCM encryption for sensitive values
- **Singleton Pattern**: Configuration loaded once, cached

---

## Exports

```typescript
// Core
export { config } from './loader';
export { getConfig } from './loader';
export { loadConfig } from './loader';

// Schema
export { configSchema } from './schema';
export type { Config } from './schema';

// Helpers
export { isProduction } from './helpers';
export { isDevelopment } from './helpers';
export { isStaging } from './helpers';

// Secrets
export { encrypt } from './secrets';
export { decrypt } from './secrets';
export { generateKey } from './secrets';
export { hash } from './secrets';
```

---

## Configuration Schema

### Environment Variables

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `NODE_ENV` | enum | No | development | Environment mode |
| `PORT` | number | No | 3000 | Server port |
| `DATABASE_URL` | string | Yes | - | PostgreSQL connection |
| `DATABASE_POOL_SIZE` | number | No | 20 | Connection pool size |
| `SUPABASE_URL` | string | Yes | - | Supabase project URL |
| `SUPABASE_ANON_KEY` | string | Yes | - | Supabase anon key |
| `SUPABASE_SERVICE_KEY` | string | Yes | - | Supabase service key |
| `REDIS_URL` | string | No | - | Redis connection |
| `LOG_LEVEL` | enum | No | info | Logging level |
| `LOG_FORMAT` | enum | No | json | Log output format |
| `JWT_SECRET` | string | Yes | - | JWT signing secret (32+ chars) |
| `ENCRYPTION_KEY` | string | Yes | - | AES encryption key (64 hex chars) |

### Schema Definition

```typescript
import { z } from 'zod';

export const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().min(1).max(65535).default(3000),
  HOST: z.string().default('0.0.0.0'),
  
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_SIZE: z.coerce.number().min(1).max(100).default(20),
  DATABASE_SSL: z.coerce.boolean().default(true),
  
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1),
  
  REDIS_URL: z.string().url().optional(),
  
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
  
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ENCRYPTION_KEY: z.string().length(64),
  
  ENABLE_DEBUG_MODE: z.coerce.boolean().default(false),
  ENABLE_TELEMETRY: z.coerce.boolean().default(true),
});

export type Config = z.infer<typeof configSchema>;
```

---

## Usage

### Accessing Configuration

```typescript
import { config, getConfig } from '@mcv/kernel';

// Direct access (cached)
console.log(config.DATABASE_URL);
console.log(config.LOG_LEVEL);

// Type-safe getter
const poolSize = getConfig('DATABASE_POOL_SIZE');
const supabaseUrl = getConfig('SUPABASE_URL');
```

### Environment Checks

```typescript
import { isProduction, isDevelopment, isStaging } from '@mcv/kernel';

if (isProduction()) {
  // Production-only code
}

if (isDevelopment()) {
  // Development-only code
}
```

---

## Environment File Hierarchy

Configuration is loaded in this order (later overrides earlier):

```
1. .env                    (base defaults)
2. .env.{NODE_ENV}         (.env.production, .env.staging)
3. .env.local              (local overrides, gitignored)
4. System environment      (process.env)
```

### Example Files

```bash
# .env (committed)
LOG_LEVEL=info
LOG_FORMAT=json
DATABASE_POOL_SIZE=20

# .env.development (committed)
LOG_LEVEL=debug
LOG_FORMAT=pretty
DATABASE_POOL_SIZE=5

# .env.local (gitignored)
DATABASE_URL=postgresql://localhost:5432/mcv_dev
JWT_SECRET=local-development-secret-key-32chars
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Production (environment variables, not files)
DATABASE_URL=postgresql://...
JWT_SECRET=production-secret-...
```

---

## Secrets Management

### Encrypting Secrets

```typescript
import { encrypt, decrypt, generateKey } from '@mcv/kernel';

// Generate a new encryption key
const key = generateKey();
console.log('New key:', key); // 64 hex characters

// Encrypt a secret
const keyBuffer = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
const encrypted = encrypt('my-api-key', keyBuffer);
// Result: "iv:authTag:ciphertext" format

// Decrypt a secret
const decrypted = decrypt(encrypted, keyBuffer);
console.log(decrypted); // "my-api-key"
```

### Hashing Values

```typescript
import { hash } from '@mcv/kernel';

// One-way hash (SHA-256)
const hashedValue = hash('sensitive-data');
// Returns hex-encoded hash
```

---

## Validation Errors

When configuration validation fails, detailed errors are thrown:

```
Configuration validation failed:
- DATABASE_URL: Required
- JWT_SECRET: String must contain at least 32 character(s)
- ENCRYPTION_KEY: String must contain exactly 64 character(s)
```

### Handling Validation

```typescript
import { loadConfig } from '@mcv/kernel';

try {
  const config = loadConfig();
} catch (error) {
  console.error('Config error:', error.message);
  process.exit(1);
}
```

---

## Adding New Config Variables

1. **Add to schema:**
```typescript
// config/schema.ts
export const configSchema = z.object({
  // ... existing
  NEW_FEATURE_ENABLED: z.coerce.boolean().default(false),
  NEW_API_KEY: z.string().optional(),
});
```

2. **Update .env.example:**
```bash
# .env.example
NEW_FEATURE_ENABLED=false
NEW_API_KEY=your-api-key-here
```

3. **Use in code:**
```typescript
const isEnabled = getConfig('NEW_FEATURE_ENABLED');
```

---

## Security Considerations

### Never Commit

- `.env.local`
- `.env.production`
- Any file with real secrets

### Required in .gitignore

```gitignore
.env.local
.env.*.local
.env.production
```

### Key Rotation

```typescript
// Generate new key
const newKey = generateKey();

// Re-encrypt all secrets with new key
const oldKeyBuffer = Buffer.from(OLD_ENCRYPTION_KEY, 'hex');
const newKeyBuffer = Buffer.from(newKey, 'hex');

const decrypted = decrypt(encryptedSecret, oldKeyBuffer);
const reEncrypted = encrypt(decrypted, newKeyBuffer);
```

---

## Testing

### Mocking Config

```typescript
import { vi } from 'vitest';

vi.mock('@mcv/kernel', async () => {
  const actual = await vi.importActual('@mcv/kernel');
  return {
    ...actual,
    config: {
      DATABASE_URL: 'postgresql://test:5432/test',
      LOG_LEVEL: 'error',
      // ... test values
    },
  };
});
```

### Testing Validation

```typescript
import { configSchema } from '@mcv/kernel/config/schema';

describe('configSchema', () => {
  it('requires DATABASE_URL', () => {
    const result = configSchema.safeParse({});
    expect(result.success).toBe(false);
  });
  
  it('validates JWT_SECRET length', () => {
    const result = configSchema.safeParse({
      ...validConfig,
      JWT_SECRET: 'short',
    });
    expect(result.success).toBe(false);
  });
});
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| zod | ^3.22.x | Schema validation |
| dotenv | ^16.x | Env file loading |

---

*@mcv/kernel/config — Configuration Module*
