# @mcv/connectors — Technical Architecture
## Tier 3: External Integrations

**Package:** `@mcv/connectors`  
**Classification:** PUBLISHABLE  
**Last Updated:** February 8, 2026

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CONNECTOR LAYER                                    │
│                                                                              │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│   │  OAuth  │ │  Email  │ │  Voice  │ │ Payments│ │ Webhooks│ │ Social  │  │
│   └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘  │
│        │           │           │           │           │           │        │
│   ┌────┴───────────┴───────────┴───────────┴───────────┴───────────┴────┐   │
│   │                     UNIFIED CONNECTOR INTERFACE                      │   │
│   │                                                                      │   │
│   │  • Connection Management      • Rate Limiting                        │   │
│   │  • Credential Storage         • Retry Logic                          │   │
│   │  • Webhook Processing         • Error Normalization                  │   │
│   │  • Health Monitoring          • Usage Tracking                       │   │
│   │                                                                      │   │
│   └──────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
└──────────────────────────────────────┼───────────────────────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
             ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
             │   Google    │    │   Stripe    │    │   Twilio    │
             │   APIs      │    │   API       │    │   API       │
             └─────────────┘    └─────────────┘    └─────────────┘
```

---

## Connector Design Principles

### 1. Unified Interface

All connectors implement a common interface:

```typescript
interface Connector<TConfig, TClient> {
  // Lifecycle
  connect(config: TConfig): Promise<TClient>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Health
  healthCheck(): Promise<HealthStatus>;
  
  // Metadata
  getName(): string;
  getVersion(): string;
  getCapabilities(): string[];
}
```

### 2. Credential Management

```typescript
// Credentials stored encrypted via @mcv/fabric/secrets
interface ConnectorCredentials {
  type: 'oauth' | 'apiKey' | 'basic' | 'certificate';
  ventureId: string;
  providerId: string;
  credentials: EncryptedPayload;
  scopes?: string[];
  expiresAt?: Date;
  refreshToken?: EncryptedPayload;
}
```

### 3. Rate Limiting

```typescript
// Per-provider rate limit configuration
const rateLimits = {
  google: { requests: 100, window: '1m' },
  stripe: { requests: 100, window: '1s' },
  twilio: { requests: 1, window: '1s' },
};
```

---

## Module Architecture

### OAuth Module

Handles OAuth 2.0 / OIDC flows for all providers:

```
┌─────────────────────────────────────────────────────────┐
│                    OAuth Flow                            │
│                                                          │
│  User ──▶ Initiate ──▶ Provider ──▶ Callback ──▶ Token  │
│                           │                              │
│                    ┌──────┴──────┐                       │
│                    │ Token Store │                       │
│                    │ (encrypted) │                       │
│                    └─────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

### Webhook Module

Processes inbound webhooks from external services:

```
┌─────────────────────────────────────────────────────────┐
│                  Webhook Processing                      │
│                                                          │
│  External ──▶ Verify ──▶ Parse ──▶ Route ──▶ Handler    │
│                 │                                        │
│          ┌──────┴──────┐                                 │
│          │  Signature  │                                 │
│          │ Validation  │                                 │
│          └─────────────┘                                 │
└─────────────────────────────────────────────────────────┘
```

---

## Provider Implementations

| Provider | Module | Capabilities |
|----------|--------|--------------|
| Google | google | Workspace, Calendar, Drive, Gmail |
| GitHub | github | Repos, Issues, Actions, Webhooks |
| Stripe | payments | Payments, Subscriptions, Invoices |
| Twilio | voice | SMS, Voice, WhatsApp |
| SendGrid | email | Transactional, Marketing emails |
| Slack | social | Messaging, Notifications |
| QuickBooks | accounting | Invoicing, Expenses |

---

## Error Handling

```typescript
// Normalized error format across all connectors
interface ConnectorError {
  code: string;           // e.g., 'RATE_LIMITED', 'AUTH_EXPIRED'
  message: string;
  provider: string;       // e.g., 'google', 'stripe'
  retryable: boolean;
  retryAfter?: number;    // ms
  originalError?: unknown;
}
```

---

## Health Monitoring

```typescript
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;        // ms
  lastChecked: Date;
  details?: {
    rateLimit: { remaining: number; reset: Date };
    quotaUsed: number;
  };
}
```

---

## Dependencies

| Package | Purpose |
|---------|---------|
| @mcv/kernel | Core utilities |
| @mcv/identity | OAuth session management |
| @mcv/fabric | Secrets, events, queue |

---

*@mcv/connectors — Technical Architecture*
