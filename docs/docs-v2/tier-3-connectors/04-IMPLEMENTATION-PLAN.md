# @mcv/connectors — Implementation Plan
## Tier 3: External Integrations

**Package:** `@mcv/connectors`  
**Classification:** PUBLISHABLE  
**Last Updated:** February 8, 2026

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| OAuth module with token management | P0 | 5d | @mcv/identity |
| Webhook ingestion framework | P0 | 3d | @mcv/fabric |
| Credential encryption/storage | P0 | 2d | @mcv/fabric/secrets |
| Rate limiter implementation | P1 | 2d | - |
| Error normalization layer | P1 | 1d | - |

### Phase 2: Core Connectors (Week 3-4)

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Google Workspace (Calendar, Drive, Gmail) | P0 | 5d | OAuth module |
| Stripe payments/subscriptions | P0 | 4d | OAuth module |
| Twilio SMS/Voice | P0 | 3d | OAuth module |
| SendGrid email | P1 | 2d | OAuth module |

### Phase 3: Extended Connectors (Week 5-6)

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| GitHub integration | P1 | 3d | OAuth module |
| Slack integration | P1 | 2d | OAuth module |
| QuickBooks accounting | P2 | 3d | OAuth module |
| Microsoft 365 | P2 | 4d | OAuth module |

### Phase 4: Polish & Testing (Week 7-8)

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Integration tests | P0 | 5d | All connectors |
| Documentation | P0 | 3d | - |
| Admin UI for connections | P1 | 4d | @mcv/ui |
| Health dashboard | P1 | 2d | - |

---

## Database Schema

```typescript
// oauth_connections table
export const oauthConnections = createTable('oauth_connections', {
  provider: varchar('provider', { length: 50 }).notNull(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  userId: uuid('user_id').references(() => users.id),
  
  // Tokens (encrypted)
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  tokenType: varchar('token_type', { length: 50 }),
  expiresAt: timestamp('expires_at'),
  
  // Scopes & Profile
  scopes: jsonb('scopes').default([]),
  profile: jsonb('profile'),
  
  // Status
  status: varchar('status', { length: 20 }).default('active'),
  lastUsedAt: timestamp('last_used_at'),
  lastErrorAt: timestamp('last_error_at'),
  lastError: text('last_error'),
});

// webhook_endpoints table
export const webhookEndpoints = createTable('webhook_endpoints', {
  provider: varchar('provider', { length: 50 }).notNull(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  
  events: jsonb('events').default([]),
  url: varchar('url', { length: 500 }).notNull(),
  secret: varchar('secret', { length: 255 }),
  
  status: varchar('status', { length: 20 }).default('active'),
  lastDeliveryAt: timestamp('last_delivery_at'),
});

// webhook_deliveries table (for debugging)
export const webhookDeliveries = createTable('webhook_deliveries', {
  endpointId: uuid('endpoint_id').references(() => webhookEndpoints.id),
  
  event: varchar('event', { length: 100 }).notNull(),
  payload: jsonb('payload'),
  
  status: varchar('status', { length: 20 }).notNull(),
  statusCode: integer('status_code'),
  response: text('response'),
  
  attemptCount: integer('attempt_count').default(1),
  nextRetryAt: timestamp('next_retry_at'),
});
```

---

## API Endpoints

```typescript
// OAuth
POST   /api/connectors/oauth/:provider/initiate
GET    /api/connectors/oauth/:provider/callback
DELETE /api/connectors/oauth/:provider/revoke

// Connections
GET    /api/connectors/connections
GET    /api/connectors/connections/:id
DELETE /api/connectors/connections/:id

// Webhooks
POST   /api/webhooks/:provider
GET    /api/connectors/webhooks
POST   /api/connectors/webhooks
DELETE /api/connectors/webhooks/:id

// Health
GET    /api/connectors/health
GET    /api/connectors/:provider/health
```

---

## Environment Variables

```bash
# OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=

# Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Voice/SMS
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Email
SENDGRID_API_KEY=

# Accounting
QUICKBOOKS_CLIENT_ID=
QUICKBOOKS_CLIENT_SECRET=
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| OAuth success rate | > 99% |
| Webhook delivery rate | > 99.5% |
| API latency (P95) | < 500ms |
| Error rate | < 0.1% |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Provider API changes | High | Version pinning, abstraction layer |
| Rate limiting | Medium | Queue + backoff, request batching |
| Token expiration | Medium | Proactive refresh, retry logic |
| Webhook failures | Medium | Retry queue, dead letter handling |

---

*@mcv/connectors — Implementation Plan*
