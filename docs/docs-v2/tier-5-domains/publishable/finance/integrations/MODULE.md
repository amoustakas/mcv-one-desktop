# @mcv/finance/integrations

> **Tier:** 5 — Domain
> **Classification:** Publishable
> **Parent:** @mcv/finance
> **Status:** Stable
> **Version:** 1.0.0
> **Maintainer:** MCV.ONE Finance Team

---

## Purpose

The `@mcv/finance/integrations` module is the connective tissue between MCV.ONE's internal financial suite and the sprawling ecosystem of external financial platforms that modern businesses depend on. It provides a unified adapter layer — a single, consistent API surface — through which the platform communicates with ERPs like QuickBooks, Xero, and NetSuite; bank feed aggregators like Plaid and MX; payment gateways like Stripe, PayPal, and Adyen; payroll systems like ADP and Gusto; tax engines like Avalara and Vertex; and expense management platforms like Expensify and SAP Concur. Rather than forcing each feature module to implement its own bespoke integration logic, this module centralizes connection management, credential storage, data transformation, and synchronization orchestration into a composable, extensible framework.

At its core, the module operates a **sync engine** — a generic, provider-agnostic orchestration layer that manages the full lifecycle of bi-directional data synchronization. Connections are registered in a centralized registry with encrypted credentials stored via pgcrypto in the credential vault. Field mappings translate between external schemas and MCV.ONE's internal data model. Sync jobs are scheduled, executed with configurable retry/backoff strategies, and logged with full audit trails. Conflict resolution strategies (last-write-wins, manual review, field-level merge) handle the inevitable collisions that arise when data flows in both directions. The webhook processor receives inbound events from external platforms, verifies signatures, normalizes payloads into a canonical event format, and routes them through Redpanda for reliable, ordered processing.

The module is designed with multi-tenancy as a first-class concern. Every connection, credential, sync job, and webhook endpoint is scoped to an organization via Supabase Row-Level Security policies. Credentials are encrypted at rest using AES-256-GCM through PostgreSQL's pgcrypto extension, with encryption keys derived per-tenant. OAuth2 tokens are automatically rotated before expiration, and refresh failures trigger alerts through the platform's notification system. The adapter pattern makes it straightforward to add new providers: implement the relevant adapter interface, register it in the provider registry, and the sync engine handles the rest — scheduling, retries, conflict resolution, error reporting, and audit logging all come for free.

---

## Exports

```typescript
// @mcv/finance/integrations — Public Export Map

// ─── Core Services ───────────────────────────────────────────
export { IntegrationService }            from './services/integration.service';
export { SyncEngine }                    from './services/sync-engine.service';
export { ConnectionRegistry }            from './services/connection-registry.service';
export { CredentialVault }               from './services/credential-vault.service';
export { FieldMappingEngine }            from './services/field-mapping-engine.service';
export { WebhookProcessor }              from './services/webhook-processor.service';
export { TransformPipeline }             from './services/transform-pipeline.service';
export { ConflictResolver }              from './services/conflict-resolver.service';
export { SyncScheduler }                 from './services/sync-scheduler.service';
export { ProviderRegistry }              from './services/provider-registry.service';

// ─── ERP Adapters ────────────────────────────────────────────
export { QuickBooksOnlineAdapter }       from './adapters/erp/quickbooks-online.adapter';
export { QuickBooksDesktopAdapter }      from './adapters/erp/quickbooks-desktop.adapter';
export { XeroAdapter }                   from './adapters/erp/xero.adapter';
export { NetSuiteAdapter }              from './adapters/erp/netsuite.adapter';
export { SAPBusinessOneAdapter }        from './adapters/erp/sap-b1.adapter';
export { SageIntacctAdapter }           from './adapters/erp/sage-intacct.adapter';

// ─── Bank Feed Providers ─────────────────────────────────────
export { PlaidProvider }                 from './adapters/bank-feeds/plaid.provider';
export { YodleeProvider }               from './adapters/bank-feeds/yodlee.provider';
export { MXProvider }                    from './adapters/bank-feeds/mx.provider';
export { SaltEdgeProvider }              from './adapters/bank-feeds/salt-edge.provider';

// ─── Payment Gateway Adapters ────────────────────────────────
export { StripeAdapter }                 from './adapters/payments/stripe.adapter';
export { PayPalAdapter }                 from './adapters/payments/paypal.adapter';
export { SquareAdapter }                 from './adapters/payments/square.adapter';
export { AdyenAdapter }                  from './adapters/payments/adyen.adapter';
export { BraintreeAdapter }             from './adapters/payments/braintree.adapter';

// ─── Payroll Adapters ────────────────────────────────────────
export { ADPAdapter }                    from './adapters/payroll/adp.adapter';
export { GustoAdapter }                  from './adapters/payroll/gusto.adapter';
export { RipplingAdapter }              from './adapters/payroll/rippling.adapter';
export { BambooHRAdapter }              from './adapters/payroll/bamboohr.adapter';

// ─── Tax Platform Adapters ───────────────────────────────────
export { AvalaraAdapter }                from './adapters/tax/avalara.adapter';
export { TaxJarAdapter }                from './adapters/tax/taxjar.adapter';
export { VertexAdapter }                 from './adapters/tax/vertex.adapter';

// ─── Expense Platform Adapters ───────────────────────────────
export { ExpensifyAdapter }              from './adapters/expense/expensify.adapter';
export { SAPConcurAdapter }             from './adapters/expense/sap-concur.adapter';
export { BrexAdapter }                   from './adapters/expense/brex.adapter';
export { RampAdapter }                   from './adapters/expense/ramp.adapter';

// ─── tRPC Routers ────────────────────────────────────────────
export { integrationsRouter }            from './routers/integrations.router';
export { connectionsRouter }             from './routers/connections.router';
export { syncRouter }                    from './routers/sync.router';
export { webhooksRouter }                from './routers/webhooks.router';
export { fieldMappingsRouter }           from './routers/field-mappings.router';

// ─── Database Schema ─────────────────────────────────────────
export {
  connections,
  syncJobs,
  syncLogs,
  fieldMappings,
  webhookEndpoints,
  webhookEvents,
  credentials,
  dataTransforms,
  integrationErrors,
  syncSchedules,
}                                        from './schema';

// ─── Types & Interfaces ─────────────────────────────────────
export type { IntegrationServiceConfig } from './types/config.types';
export type {
  Connection, ConnectionStatus,
  ConnectionType, ConnectionHealth,
}                                        from './types/connection.types';
export type {
  SyncJob, SyncJobStatus,
  SyncDirection, SyncMode, SyncResult,
}                                        from './types/sync.types';
export type {
  FieldMapping, FieldMappingRule,
  MappingTransform,
}                                        from './types/field-mapping.types';
export type {
  WebhookEndpoint, WebhookEvent,
  WebhookSignatureConfig,
}                                        from './types/webhook.types';
export type {
  CredentialSet, EncryptedCredential,
  OAuthTokenSet,
}                                        from './types/credential.types';
export type {
  TransformPipelineConfig,
  TransformStep, TransformResult,
}                                        from './types/transform.types';
export type {
  ERPAdapter, ERPEntity,
  ERPSyncCapabilities,
}                                        from './types/erp-adapter.types';
export type {
  BankFeedProvider, BankAccount,
  BankTransaction, InstitutionInfo,
}                                        from './types/bank-feed.types';
export type {
  PaymentGatewayAdapter, PaymentRecord,
  RefundRecord, SettlementBatch,
}                                        from './types/payment-gateway.types';
export type {
  PayrollAdapter, PayRun,
  EmployeeRecord, DeductionMapping,
}                                        from './types/payroll.types';
export type {
  TaxPlatformAdapter, TaxRate, TaxFiling,
  NexusResult, ExemptionCertificate,
}                                        from './types/tax-platform.types';
export type {
  ExpenseAdapter, ExpenseReport,
  ReceiptRecord, ReimbursementStatus,
}                                        from './types/expense.types';
export type {
  ConflictResolutionStrategy,
  ConflictRecord, ConflictResolution,
}                                        from './types/conflict.types';
export type {
  ProviderMetadata, ProviderCapability,
  ProviderStatus,
}                                        from './types/provider.types';
export type {
  IntegrationError, IntegrationErrorCode,
}                                        from './types/error.types';

// ─── Utilities ───────────────────────────────────────────────
export { createAdapter }                 from './utils/adapter-factory';
export { normalizeWebhookEvent }        from './utils/webhook-normalizer';
export { buildFieldMap }                from './utils/field-map-builder';
export { encryptCredential, decryptCredential } from './utils/credential-crypto';
export { retryWithBackoff }             from './utils/retry';
export { rateLimiter }                  from './utils/rate-limiter';
export { currencyNormalizer }           from './utils/currency-normalizer';
export { chartOfAccountsMapper }        from './utils/coa-mapper';
export { fiscalPeriodAligner }          from './utils/fiscal-period-aligner';
```

---

## Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     MCV.ONE Finance Suite                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Accounts │ │Invoicing │ │ Banking  │ │ Payroll  │  ...       │
│  └─────┬────┘ └─────┬────┘ └────┬─────┘ └────┬─────┘           │
│  ══════╪════════════╪══════════╪═══════════╪══════════════════  │
│  ┌─────▼────────────▼──────────▼───────────▼────────────────┐  │
│  │           @mcv/finance/integrations                       │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │          IntegrationService  (Facade)               │  │  │
│  │  └──────┬──────────────┬──────────────┬────────────────┘  │  │
│  │         │              │              │                    │  │
│  │  ┌──────▼─────┐ ┌─────▼──────┐ ┌─────▼───────────┐      │  │
│  │  │ Connection │ │ SyncEngine │ │ Webhook         │      │  │
│  │  │ Registry   │ │            │ │ Processor       │      │  │
│  │  └──────┬─────┘ └─────┬──────┘ └─────┬───────────┘      │  │
│  │         │              │              │                    │  │
│  │  ┌──────▼─────┐ ┌─────▼──────┐ ┌─────▼───────────┐      │  │
│  │  │ Credential │ │ FieldMap   │ │ Transform       │      │  │
│  │  │ Vault      │ │ Engine     │ │ Pipeline        │      │  │
│  │  └──────┬─────┘ └─────┬──────┘ └─────┬───────────┘      │  │
│  │  ═══════╪═════════════╪═══════════════╪═══════════════    │  │
│  │  ┌──────▼─────────────▼───────────────▼───────────────┐  │  │
│  │  │              ProviderRegistry                       │  │  │
│  │  │                                                     │  │  │
│  │  │ ┌───────┐ ┌────────┐ ┌───────┐ ┌───────┐ ┌──────┐ │  │  │
│  │  │ │  ERP  │ │  Bank  │ │ Pay   │ │Payroll│ │ Tax  │ │  │  │
│  │  │ │Adapter│ │  Feed  │ │Gateway│ │Adapter│ │Adapt │ │  │  │
│  │  │ │       │ │Provider│ │Adapter│ │       │ │      │ │  │  │
│  │  │ │• QBO  │ │• Plaid │ │•Stripe│ │• ADP  │ │•Aval │ │  │  │
│  │  │ │• Xero │ │• MX    │ │•PayPal│ │• Gusto│ │•TaxJ │ │  │  │
│  │  │ │• Netsui│ │• Yodlee│ │•Square│ │• Rippl│ │•Vert │ │  │  │
│  │  │ └───────┘ └────────┘ └───────┘ └───────┘ └──────┘ │  │  │
│  │  │ ┌──────────┐                                        │  │  │
│  │  │ │ Expense  │  • Expensify • Concur • Brex • Ramp   │  │  │
│  │  │ └──────────┘                                        │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐  ┌─────────────────┐  ┌──────────────────┐
│ Supabase     │  │ Redpanda        │  │ External APIs    │
│ PostgreSQL   │  │ (Event Stream)  │  │ (QBO, Stripe,    │
│              │  │                 │  │  Plaid, ADP ...) │
│ • connections│  │ • sync.events   │  │                  │
│ • sync_jobs  │  │ • webhook.inb   │  │                  │
│ • credentials│  │ • transform.out │  │                  │
└──────────────┘  └─────────────────┘  └──────────────────┘
```

### Sync Engine Data Flow

```
              ┌──────────────┐
              │ Sync Trigger │  (Scheduled | Manual | Webhook | Realtime)
              └──────┬───────┘
                     │
                     ▼
          ┌──────────────────────┐
          │   SyncScheduler      │  Dedup, rate-limit, enqueue
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  SyncEngine.execute  │
          │  1. Resolve conn     │
          │  2. Decrypt creds    │
          │  3. Health check     │
          │  4. Create job       │
          └──────────┬───────────┘
                     │
              ┌──────┴──────┐
              │             │
         ┌────▼───┐   ┌────▼───┐
         │  PULL  │   │  PUSH  │
         │(Import)│   │(Export)│
         └────┬───┘   └────┬───┘
              │             │
              ▼             ▼
          Adapter.fetch / Adapter.push
              │             │
              └──────┬──────┘
                     ▼
          ┌──────────────────────┐
          │  TransformPipeline   │
          │  • Currency norm     │
          │  • COA mapping       │
          │  • Fiscal align      │
          │  • Custom steps      │
          └──────────┬───────────┘
                     ▼
          ┌──────────────────────┐
          │  FieldMappingEngine  │  External ↔ Internal schema
          └──────────┬───────────┘
                     ▼
          ┌──────────────────────┐
          │  ConflictResolver    │
          │  • last-write-wins   │
          │  • manual-review     │
          │  • field-level-merge │
          └──────────┬───────────┘
                     │
               ┌─────┴──────┐
               │            │
          ┌────▼───┐  ┌─────▼─────┐
          │ Apply  │  │  Queue    │
          │to DB   │  │  Review   │
          └────┬───┘  └─────┬─────┘
               │            │
               └─────┬──────┘
                     ▼
          ┌──────────────────────┐
          │    Audit Logger      │  → sync_logs, Redpanda events
          └──────────────────────┘
```

### Webhook Processing Flow

```
External ──POST──▶ /api/webhooks/{provider}/{endpointId}
                         │
                         ▼
              ┌────────────────────┐
              │ WebhookProcessor   │
              │ 1. Rate limit      │
              │ 2. Parse body      │
              │ 3. Lookup endpoint │
              │ 4. Verify sig      │
              └────────┬───────────┘
                       │
                ┌──────┴──────┐
                │             │
           ┌────▼───┐   ┌────▼─────┐
           │ VALID  │   │ INVALID  │ → 403 + log
           └────┬───┘   └──────────┘
                │
                ▼
     ┌────────────────────┐
     │  Event Normalizer  │  Provider-specific → canonical format
     └────────┬───────────┘
              ▼
     ┌────────────────────┐
     │ Idempotency Check  │  Skip duplicates via idempotency_key
     └────────┬───────────┘
              ▼
     ┌────────────────────┐
     │ Redpanda Producer  │  Topic: finance.webhook.inbound
     └────────┬───────────┘
              ▼
     Respond 200 OK (async processing downstream)
```

---

## Core Interfaces

### Connection

```typescript
interface Connection {
  id: string;
  orgId: string;
  createdBy: string;
  name: string;
  description?: string;
  provider: string;
  type: ConnectionType;
  status: ConnectionStatus;
  health: ConnectionHealth;
  credentialId: string;
  config: Record<string, unknown>;
  externalAccountId?: string;
  externalAccountName?: string;
  scopes?: string[];
  enabledEntities: string[];
  defaultSyncDirection: SyncDirection;
  defaultConflictStrategy: ConflictResolutionStrategy;
  rateLimit: {
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
    currentWindow: { minute: number; hour: number; resetAt: Date };
  };
  lastSync?: {
    jobId: string;
    completedAt: Date;
    recordsSynced: number;
    direction: SyncDirection;
  };
  connectedAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

type ConnectionType =
  | 'erp' | 'bank-feed' | 'payment-gateway'
  | 'payroll' | 'tax-platform' | 'expense-platform';

type ConnectionStatus =
  | 'pending' | 'active' | 'inactive'
  | 'error' | 'revoked' | 'disconnected';

interface ConnectionHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastCheckedAt?: Date;
  latencyMs?: number;
  error?: string;
  consecutiveFailures: number;
  providerStatus?: 'operational' | 'degraded' | 'outage';
}
```

### SyncJob

```typescript
interface SyncJob {
  id: string;
  orgId: string;
  connectionId: string;
  status: SyncJobStatus;
  direction: SyncDirection;
  mode: SyncMode;
  entityTypes: string[];
  trigger: 'scheduled' | 'manual' | 'webhook' | 'retry' | 'realtime';
  triggerWebhookEventId?: string;
  retryOfJobId?: string;
  retryAttempt: number;
  maxRetries: number;
  cursor?: {
    token?: string;
    lastSyncedAt?: Date;
    lastSyncedId?: string;
    page?: number;
  };
  progress: {
    totalRecords?: number;
    processedRecords: number;
    successRecords: number;
    failedRecords: number;
    skippedRecords: number;
    conflictRecords: number;
    percentComplete?: number;
  };
  conflicts: ConflictRecord[];
  errors: Array<{
    entityType: string;
    entityId?: string;
    code: IntegrationErrorCode;
    message: string;
    details?: Record<string, unknown>;
    timestamp: Date;
  }>;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
  initiatedBy?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

type SyncJobStatus =
  | 'pending' | 'running' | 'completed'
  | 'partial' | 'failed' | 'cancelled' | 'retrying';

type SyncDirection = 'pull' | 'push' | 'bidirectional';

type SyncMode = 'full' | 'incremental' | 'selective';

interface SyncResult {
  jobId: string;
  status: SyncJobStatus;
  direction: SyncDirection;
  progress: SyncJob['progress'];
  conflicts: ConflictRecord[];
  errors: SyncJob['errors'];
  durationMs: number;
  nextScheduledAt?: Date;
}
```

### FieldMapping

```typescript
interface FieldMapping {
  id: string;
  orgId: string;
  connectionId: string;
  entityType: string;
  name: string;
  direction: 'inbound' | 'outbound' | 'bidirectional';
  rules: FieldMappingRule[];
  defaults: Record<string, unknown>;
  ignoredFields: string[];
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

interface FieldMappingRule {
  /** Source field path (dot-notation, e.g. 'line_items[].amount') */
  source: string;
  /** Target field path in MCV.ONE schema */
  target: string;
  transform?: MappingTransform;
  required: boolean;
  defaultValue?: unknown;
  validation?: {
    type?: 'string' | 'number' | 'boolean' | 'date' | 'enum';
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
}

type MappingTransform =
  | { type: 'direct' }
  | { type: 'rename' }
  | { type: 'cast'; to: 'string' | 'number' | 'boolean' | 'date' }
  | { type: 'format'; pattern: string }
  | { type: 'dateFormat'; from: string; to: string }
  | { type: 'currencyConvert'; from: string; to: string }
  | { type: 'lookup'; table: string; key: string; value: string }
  | { type: 'enum'; mapping: Record<string, string> }
  | { type: 'concat'; fields: string[]; separator: string }
  | { type: 'split'; delimiter: string; index: number }
  | { type: 'math'; expression: string }
  | { type: 'conditional'; condition: string; then: unknown; else: unknown }
  | { type: 'custom'; fn: string };
```

### WebhookEndpoint & WebhookEvent

```typescript
interface WebhookEndpoint {
  id: string;
  orgId: string;
  connectionId: string;
  provider: string;
  path: string;
  signingSecretId: string;
  signatureConfig: WebhookSignatureConfig;
  subscribedEvents: string[];
  isActive: boolean;
  stats: {
    totalReceived: number;
    totalProcessed: number;
    totalFailed: number;
    lastReceivedAt?: Date;
    lastProcessedAt?: Date;
    averageProcessingMs: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface WebhookSignatureConfig {
  algorithm: 'hmac-sha256' | 'hmac-sha512' | 'rsa-sha256' | 'ed25519';
  headerName: string;
  encoding: 'hex' | 'base64';
  prefix?: string;
  timestampHeader?: string;
  maxTimestampAge?: number;
  options?: Record<string, unknown>;
}

interface WebhookEvent {
  id: string;
  orgId: string;
  endpointId: string;
  connectionId: string;
  provider: string;
  providerEventId?: string;
  eventType: string;
  entityType: string;
  externalEntityId?: string;
  internalEntityId?: string;
  rawPayload: Record<string, unknown>;
  normalizedPayload?: Record<string, unknown>;
  status: 'received' | 'processing' | 'processed' | 'failed' | 'skipped';
  idempotencyKey: string;
  attempts: number;
  error?: { code: IntegrationErrorCode; message: string; details?: Record<string, unknown> };
  syncJobId?: string;
  sourceIp: string;
  headers: Record<string, string>;
  receivedAt: Date;
  processedAt?: Date;
  createdAt: Date;
}
```

### CredentialVault

```typescript
interface CredentialVault {
  /** Encrypt and store credentials for a connection. */
  store(params: {
    orgId: string;
    connectionId: string;
    provider: string;
    credentials: CredentialSet;
  }): Promise<{ credentialId: string }>;

  /** Decrypt and retrieve credentials (within RLS scope). */
  retrieve(params: {
    orgId: string;
    credentialId: string;
  }): Promise<CredentialSet>;

  /** Rotate OAuth tokens using stored refresh token. */
  rotateOAuthTokens(params: {
    orgId: string;
    credentialId: string;
  }): Promise<OAuthTokenSet>;

  /** Securely erase credentials on disconnect. */
  revoke(params: {
    orgId: string;
    credentialId: string;
  }): Promise<void>;

  /** Check credential validity and expiration. */
  validate(params: {
    orgId: string;
    credentialId: string;
  }): Promise<{ valid: boolean; expiresAt?: Date; needsRotation: boolean }>;

  /** List all credential metadata for an org (no secrets). */
  list(params: {
    orgId: string;
    type?: ConnectionType;
  }): Promise<Array<{
    credentialId: string;
    connectionId: string;
    provider: string;
    type: ConnectionType;
    createdAt: Date;
    expiresAt?: Date;
    needsRotation: boolean;
  }>>;
}

type CredentialSet =
  | OAuthCredentialSet
  | ApiKeyCredentialSet
  | BasicAuthCredentialSet
  | CertificateCredentialSet;

interface OAuthCredentialSet {
  type: 'oauth2';
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresAt?: Date;
  scopes: string[];
  idToken?: string;
  metadata?: Record<string, unknown>;
}

interface ApiKeyCredentialSet {
  type: 'api-key';
  apiKey: string;
  apiSecret?: string;
  metadata?: Record<string, unknown>;
}

interface BasicAuthCredentialSet {
  type: 'basic';
  username: string;
  password: string;
  metadata?: Record<string, unknown>;
}

interface CertificateCredentialSet {
  type: 'certificate';
  certificate: string;
  privateKey: string;
  passphrase?: string;
  metadata?: Record<string, unknown>;
}

interface OAuthTokenSet {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresAt?: Date;
  scopes: string[];
}
```

### TransformPipeline

```typescript
interface TransformPipeline {
  /** Execute a full transform pipeline on a dataset. */
  transform(params: {
    orgId: string;
    connectionId: string;
    entityType: string;
    direction: 'inbound' | 'outbound';
    data: Record<string, unknown>[];
    config?: TransformPipelineConfig;
  }): Promise<TransformResult>;

  /** Validate data against target schema without transforming. */
  validate(params: {
    orgId: string;
    entityType: string;
    data: Record<string, unknown>[];
    schema: 'internal' | 'external';
    provider: string;
  }): Promise<{
    valid: boolean;
    errors: Array<{ index: number; field: string; message: string; value: unknown }>;
  }>;

  /** Preview a transform without persisting results. */
  preview(params: {
    orgId: string;
    connectionId: string;
    entityType: string;
    direction: 'inbound' | 'outbound';
    sampleData: Record<string, unknown>[];
  }): Promise<{
    input: Record<string, unknown>[];
    output: Record<string, unknown>[];
    warnings: string[];
  }>;
}

interface TransformPipelineConfig {
  steps: TransformStep[];
  errorHandling: 'stop' | 'skip' | 'collect';
  batchSize: number;
  verbose: boolean;
}

type TransformStep =
  | { type: 'currency-normalize'; targetCurrency: string; rateSource: 'ecb' | 'openexchangerates' | 'custom' }
  | { type: 'coa-map'; chartId: string; unmappedAction: 'skip' | 'error' | 'default' }
  | { type: 'fiscal-period-align'; fiscalYearStart: number; periodType: 'monthly' | 'quarterly' }
  | { type: 'field-map'; mappingId: string }
  | { type: 'filter'; condition: string }
  | { type: 'deduplicate'; keys: string[] }
  | { type: 'aggregate'; groupBy: string[]; aggregations: Record<string, 'sum' | 'count' | 'avg' | 'min' | 'max'> }
  | { type: 'enrich'; source: string; lookupKey: string; fields: string[] }
  | { type: 'validate'; schema: Record<string, unknown> }
  | { type: 'custom'; handler: string; config?: Record<string, unknown> };

interface TransformResult {
  records: Record<string, unknown>[];
  failed: Array<{ index: number; record: Record<string, unknown>; error: string }>;
  warnings: string[];
  stats: {
    inputCount: number;
    outputCount: number;
    failedCount: number;
    skippedCount: number;
    durationMs: number;
  };
}
```

### ERPAdapter

```typescript
interface ERPAdapter {
  readonly provider: string;
  readonly displayName: string;
  readonly capabilities: ERPSyncCapabilities;

  initialize(params: { connection: Connection; credentials: CredentialSet }): Promise<void>;

  testConnection(): Promise<{ success: boolean; latencyMs: number; error?: string; metadata?: Record<string, unknown> }>;

  fetch(params: {
    entityType: ERPEntity;
    since?: Date;
    cursor?: string;
    limit?: number;
    filters?: Record<string, unknown>;
  }): Promise<{
    records: Record<string, unknown>[];
    cursor?: string;
    hasMore: boolean;
    totalCount?: number;
  }>;

  push(params: {
    entityType: ERPEntity;
    records: Record<string, unknown>[];
    mode: 'create' | 'update' | 'upsert';
  }): Promise<{
    created: number;
    updated: number;
    failed: Array<{ index: number; error: string; record: Record<string, unknown> }>;
    externalIds: Record<string, string>;
  }>;

  delete(params: {
    entityType: ERPEntity;
    externalIds: string[];
  }): Promise<{
    deleted: number;
    failed: Array<{ externalId: string; error: string }>;
  }>;

  getSchema(entityType: ERPEntity): Promise<{
    fields: Array<{
      name: string; type: string; required: boolean; readOnly: boolean;
      description?: string; enumValues?: string[];
    }>;
    relationships: Array<{
      field: string; relatedEntity: string; type: 'one-to-one' | 'one-to-many' | 'many-to-one';
    }>;
  }>;

  handleOAuthCallback?(params: { code: string; state: string; redirectUri: string }): Promise<OAuthTokenSet>;
  getOAuthUrl?(params: { redirectUri: string; state: string; scopes: string[] }): string;
  disconnect(): Promise<void>;
}

type ERPEntity =
  | 'customers' | 'vendors' | 'invoices' | 'bills'
  | 'payments' | 'credit-notes' | 'journal-entries' | 'accounts'
  | 'items' | 'purchase-orders' | 'sales-orders' | 'tax-rates'
  | 'currencies' | 'departments' | 'classes' | 'locations'
  | 'employees' | 'time-entries';

interface ERPSyncCapabilities {
  entities: Record<ERPEntity, {
    pull: boolean; push: boolean; delete: boolean;
    webhooks: boolean; incremental: boolean; batchSize: number;
  }>;
  supportsWebhooks: boolean;
  supportsChangeTracking: boolean;
  maxBatchSize: number;
  rateLimitPerMinute: number;
  authMethods: ('oauth2' | 'api-key' | 'basic' | 'certificate')[];
}
```

### BankFeedProvider

```typescript
interface BankFeedProvider {
  readonly provider: string;
  readonly displayName: string;

  createLinkSession(params: {
    orgId: string; userId: string; institutionId?: string;
    products: ('transactions' | 'balances' | 'identity' | 'investments')[];
    redirectUri: string; metadata?: Record<string, unknown>;
  }): Promise<{ linkToken: string; expiration: Date; sessionUrl?: string }>;

  exchangeToken(params: {
    publicToken: string; metadata?: Record<string, unknown>;
  }): Promise<{ accessToken: string; itemId: string; accounts: BankAccount[] }>;

  getAccounts(params: { accessToken: string }): Promise<BankAccount[]>;

  getTransactions(params: {
    accessToken: string; accountIds?: string[];
    startDate: Date; endDate: Date; cursor?: string; count?: number;
  }): Promise<{
    transactions: BankTransaction[]; cursor?: string;
    hasMore: boolean; totalTransactions?: number;
  }>;

  getBalances(params: {
    accessToken: string; accountIds?: string[];
  }): Promise<Array<{
    accountId: string; current: number; available?: number;
    limit?: number; currency: string; lastUpdated: Date;
  }>>;

  searchInstitutions(params: {
    query: string; country?: string; limit?: number;
  }): Promise<InstitutionInfo[]>;

  removeLink(params: { accessToken: string }): Promise<void>;

  handleWebhook(params: {
    headers: Record<string, string>; body: Record<string, unknown>;
  }): Promise<{ eventType: string; itemId: string; data: Record<string, unknown> }>;
}

interface BankAccount {
  accountId: string;
  name: string;
  officialName?: string;
  type: 'checking' | 'savings' | 'credit' | 'loan' | 'investment' | 'mortgage' | 'other';
  subtype?: string;
  mask?: string;
  currency: string;
  currentBalance?: number;
  availableBalance?: number;
  creditLimit?: number;
  institution: { id: string; name: string };
}

interface BankTransaction {
  transactionId: string;
  accountId: string;
  amount: number;
  currency: string;
  date: Date;
  authorizedDate?: Date;
  merchantName?: string;
  description: string;
  category?: string[];
  pending: boolean;
  type: 'debit' | 'credit' | 'transfer' | 'fee' | 'interest' | 'other';
  paymentChannel: 'online' | 'in-store' | 'atm' | 'other';
  location?: {
    address?: string; city?: string; region?: string;
    postalCode?: string; country?: string; lat?: number; lon?: number;
  };
  metadata?: Record<string, unknown>;
}

interface InstitutionInfo {
  id: string;
  name: string;
  country: string;
  url?: string;
  logoUrl?: string;
  primaryColor?: string;
  products: string[];
  routingNumbers?: string[];
}
```

### PaymentGatewayAdapter

```typescript
interface PaymentGatewayAdapter {
  readonly provider: string;
  readonly displayName: string;

  initialize(params: { connection: Connection; credentials: CredentialSet }): Promise<void>;

  fetchPayments(params: {
    since?: Date; until?: Date; cursor?: string; limit?: number;
    status?: ('succeeded' | 'pending' | 'failed' | 'refunded' | 'disputed')[];
  }): Promise<{ payments: PaymentRecord[]; cursor?: string; hasMore: boolean }>;

  fetchRefunds(params: {
    since?: Date; until?: Date; cursor?: string; limit?: number;
  }): Promise<{ refunds: RefundRecord[]; cursor?: string; hasMore: boolean }>;

  fetchSettlements(params: {
    since?: Date; until?: Date; cursor?: string; limit?: number;
  }): Promise<{ settlements: SettlementBatch[]; cursor?: string; hasMore: boolean }>;

  getPayment(externalId: string): Promise<PaymentRecord | null>;

  reconcile(params: {
    startDate: Date; endDate: Date;
    internalPayments: Array<{ id: string; externalId: string; amount: number; currency: string }>;
  }): Promise<{
    matched: Array<{ internalId: string; externalId: string }>;
    unmatchedInternal: string[];
    unmatchedExternal: string[];
    discrepancies: Array<{
      internalId: string; externalId: string; field: string;
      internalValue: unknown; externalValue: unknown;
    }>;
  }>;

  verifyWebhook(params: {
    headers: Record<string, string>; body: string | Buffer; signingSecret: string;
  }): boolean;

  disconnect(): Promise<void>;
}

interface PaymentRecord {
  externalId: string;
  amount: number;        // Smallest currency unit (cents)
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'refunded' | 'partially_refunded' | 'disputed' | 'cancelled';
  paymentMethod: 'card' | 'bank_transfer' | 'wallet' | 'crypto' | 'other';
  paymentMethodDetails?: {
    brand?: string; last4?: string; expMonth?: number; expYear?: number;
    bankName?: string; walletType?: string;
  };
  customer?: { externalId: string; email?: string; name?: string };
  description?: string;
  fee?: number;
  netAmount?: number;
  refunds?: RefundRecord[];
  dispute?: {
    id: string; status: 'needs_response' | 'under_review' | 'won' | 'lost';
    amount: number; reason: string; dueDate?: Date;
  };
  settlementId?: string;
  createdAt: Date;
  capturedAt?: Date;
  metadata?: Record<string, unknown>;
}

interface RefundRecord {
  externalId: string;
  paymentExternalId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
  reason?: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

interface SettlementBatch {
  externalId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'in_transit' | 'paid' | 'failed' | 'cancelled';
  transactionCount: number;
  grossAmount: number;
  totalFees: number;
  netAmount: number;
  destination?: { bankName?: string; last4?: string; type?: string };
  periodStart: Date;
  periodEnd: Date;
  arrivalDate?: Date;
  createdAt: Date;
}
```

### PayrollAdapter

```typescript
interface PayrollAdapter {
  readonly provider: string;
  readonly displayName: string;

  initialize(params: { connection: Connection; credentials: CredentialSet }): Promise<void>;

  fetchEmployees(params: {
    since?: Date; cursor?: string; limit?: number;
    status?: ('active' | 'terminated' | 'on_leave')[];
  }): Promise<{ employees: EmployeeRecord[]; cursor?: string; hasMore: boolean }>;

  fetchPayRuns(params: {
    since?: Date; until?: Date; cursor?: string; limit?: number;
    status?: ('draft' | 'pending' | 'processed' | 'paid')[];
  }): Promise<{ payRuns: PayRun[]; cursor?: string; hasMore: boolean }>;

  fetchDeductions(params: { employeeId?: string }): Promise<DeductionMapping[]>;

  fetchTaxForms(params: {
    employeeId?: string; year: number; formType?: string[];
  }): Promise<Array<{
    formType: string; employeeId: string; year: number;
    status: 'draft' | 'filed' | 'corrected'; documentUrl?: string;
    data: Record<string, unknown>;
  }>>;

  testConnection(): Promise<{ success: boolean; companyName?: string; error?: string }>;
  disconnect(): Promise<void>;
}

interface EmployeeRecord {
  externalId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  status: 'active' | 'terminated' | 'on_leave' | 'pending';
  department?: string;
  jobTitle?: string;
  compensationType: 'salary' | 'hourly';
  payRate?: number;
  currency?: string;
  payFrequency?: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
  startDate?: Date;
  terminationDate?: Date;
  workLocation?: { state?: string; country?: string };
  metadata?: Record<string, unknown>;
}

interface PayRun {
  externalId: string;
  payPeriodStart: Date;
  payPeriodEnd: Date;
  checkDate: Date;
  status: 'draft' | 'pending' | 'processing' | 'processed' | 'paid' | 'voided';
  type: 'regular' | 'off_cycle' | 'bonus' | 'correction';
  totals: {
    grossPay: number; netPay: number;
    employeeTaxes: number; employerTaxes: number;
    employeeDeductions: number; employerContributions: number;
    currency: string;
  };
  employeeCount: number;
  payStubs?: Array<{
    employeeExternalId: string;
    grossPay: number; netPay: number;
    taxes: Array<{ name: string; amount: number; type: 'employee' | 'employer' }>;
    deductions: Array<{ name: string; amount: number; type: 'pre_tax' | 'post_tax' }>;
    earnings: Array<{ name: string; hours?: number; amount: number; type: string }>;
  }>;
  metadata?: Record<string, unknown>;
}

interface DeductionMapping {
  externalId: string;
  name: string;
  category: 'health_insurance' | 'dental' | 'vision' | '401k' | 'hsa' | 'fsa' | 'life_insurance' | 'other';
  preTax: boolean;
  calculationType: 'flat' | 'percentage' | 'hourly';
  amount?: number;
  employerMatch?: { type: 'flat' | 'percentage'; amount: number; maxAmount?: number };
  applicableTo: 'all' | 'selected';
  employeeIds?: string[];
}
```

### TaxPlatformAdapter & ExpenseAdapter

```typescript
interface TaxPlatformAdapter {
  readonly provider: string;
  readonly displayName: string;

  initialize(params: { connection: Connection; credentials: CredentialSet }): Promise<void>;

  calculateTax(params: {
    lineItems: Array<{ id: string; amount: number; quantity: number; taxCode?: string; description?: string }>;
    fromAddress: TaxAddress;
    toAddress: TaxAddress;
    customerExemptionId?: string;
    transactionDate: Date;
    currency: string;
    documentType: 'sale' | 'return' | 'purchase';
  }): Promise<{
    totalTax: number;
    lineItems: Array<{ id: string; taxAmount: number; taxRate: number; taxDetails: TaxRate[] }>;
    jurisdiction: string;
  }>;

  commitTransaction(params: { transactionId: string; documentCode: string }): Promise<{ success: boolean; documentId: string }>;
  voidTransaction(params: { documentId: string; reason: string }): Promise<{ success: boolean }>;
  detectNexus(params: { orgId: string; year: number }): Promise<NexusResult[]>;
  getExemptionCertificates(params: { customerId?: string; state?: string }): Promise<ExemptionCertificate[]>;
  createExemptionCertificate(params: {
    customerId: string;
    certificate: Omit<ExemptionCertificate, 'id' | 'createdAt'>;
  }): Promise<ExemptionCertificate>;
  getTaxCodes(params: { search?: string; limit?: number }): Promise<Array<{ code: string; name: string; description: string; category: string }>>;
  testConnection(): Promise<{ success: boolean; error?: string }>;
  disconnect(): Promise<void>;
}

interface TaxAddress { line1: string; line2?: string; city: string; region: string; postalCode: string; country: string; }

interface TaxRate {
  jurisdiction: string;
  jurisdictionType: 'country' | 'state' | 'county' | 'city' | 'special';
  rate: number;
  taxName: string;
  taxType: 'sales' | 'use' | 'vat' | 'gst' | 'excise';
}

interface NexusResult {
  state: string;
  country: string;
  hasNexus: boolean;
  nexusType: 'physical' | 'economic' | 'both' | 'none';
  details: {
    transactionCount: number; transactionVolume: number;
    economicThreshold?: number; transactionThreshold?: number; exceededAt?: Date;
  };
  recommendation: string;
}

interface ExemptionCertificate {
  id: string;
  customerId: string;
  certificateNumber: string;
  exemptionType: 'resale' | 'government' | 'nonprofit' | 'manufacturing' | 'agriculture' | 'other';
  states: string[];
  validFrom: Date;
  validTo?: Date;
  status: 'active' | 'expired' | 'revoked' | 'pending_review';
  documentUrl?: string;
  createdAt: Date;
}

interface ExpenseAdapter {
  readonly provider: string;
  readonly displayName: string;

  initialize(params: { connection: Connection; credentials: CredentialSet }): Promise<void>;

  fetchExpenseReports(params: {
    since?: Date; until?: Date; cursor?: string; limit?: number;
    status?: ('draft' | 'submitted' | 'approved' | 'reimbursed' | 'rejected')[];
  }): Promise<{ reports: ExpenseReport[]; cursor?: string; hasMore: boolean }>;

  fetchReceipts(params: {
    reportId?: string; since?: Date; cursor?: string; limit?: number;
  }): Promise<{ receipts: ReceiptRecord[]; cursor?: string; hasMore: boolean }>;

  getReimbursementStatus(params: { reportIds: string[] }): Promise<ReimbursementStatus[]>;

  fetchPolicies(): Promise<Array<{
    id: string; name: string;
    categories: Array<{ id: string; name: string; glCode?: string; limit?: number; requiresReceipt: boolean }>;
  }>>;

  testConnection(): Promise<{ success: boolean; error?: string }>;
  disconnect(): Promise<void>;
}

interface ExpenseReport {
  externalId: string;
  title: string;
  submitter: { externalId: string; name: string; email: string };
  status: 'draft' | 'submitted' | 'approved' | 'reimbursed' | 'rejected';
  totalAmount: number;
  currency: string;
  lineItemCount: number;
  policyId?: string;
  submittedAt?: Date;
  approvedAt?: Date;
  approvedBy?: { name: string; email: string };
  comments?: string;
  metadata?: Record<string, unknown>;
}

interface ReceiptRecord {
  externalId: string;
  reportId?: string;
  merchant: string;
  amount: number;
  currency: string;
  date: Date;
  category?: string;
  description?: string;
  receiptImageUrl?: string;
  autoScanned: boolean;
  paymentMethod?: 'corporate_card' | 'personal' | 'cash' | 'other';
  cardTransactionId?: string;
  taxAmount?: number;
  billable: boolean;
  project?: string;
  violations?: string[];
  metadata?: Record<string, unknown>;
}

interface ReimbursementStatus {
  reportId: string;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  amount: number;
  currency: string;
  paidAt?: Date;
  paymentMethod?: string;
  transactionId?: string;
}
```

### IntegrationService (Facade)

```typescript
interface IntegrationService {
  // ─── Connection Management ─────────────────────────────────
  connect(params: {
    orgId: string; userId: string; provider: string; type: ConnectionType;
    name: string; config?: Record<string, unknown>; scopes?: string[];
    redirectUri?: string;
  }): Promise<{ connectionId: string; authorizationUrl?: string; status: ConnectionStatus }>;

  completeOAuthConnection(params: {
    connectionId: string; code: string; state: string;
  }): Promise<Connection>;

  disconnect(params: { orgId: string; connectionId: string }): Promise<void>;

  listConnections(params: {
    orgId: string; type?: ConnectionType; status?: ConnectionStatus; provider?: string;
  }): Promise<Connection[]>;

  getConnection(params: { orgId: string; connectionId: string }): Promise<Connection>;
  healthCheck(params: { orgId: string; connectionId: string }): Promise<ConnectionHealth>;

  // ─── Sync Operations ───────────────────────────────────────
  sync(params: {
    orgId: string; connectionId: string; direction: SyncDirection;
    mode: SyncMode; entityTypes?: string[];
    options?: { dryRun?: boolean; conflictStrategy?: ConflictResolutionStrategy; since?: Date };
  }): Promise<SyncJob>;

  getSyncStatus(params: { orgId: string; jobId: string }): Promise<SyncJob>;
  cancelSync(params: { orgId: string; jobId: string }): Promise<void>;
  listSyncHistory(params: {
    orgId: string; connectionId: string; limit?: number; cursor?: string;
  }): Promise<{ jobs: SyncJob[]; cursor?: string; hasMore: boolean }>;

  // ─── Field Mapping ─────────────────────────────────────────
  configureFieldMapping(params: {
    orgId: string; connectionId: string; entityType: string;
    mapping: Omit<FieldMapping, 'id' | 'orgId' | 'connectionId' | 'createdAt' | 'updatedAt'>;
  }): Promise<FieldMapping>;

  getFieldMappings(params: {
    orgId: string; connectionId: string; entityType?: string;
  }): Promise<FieldMapping[]>;

  previewMapping(params: {
    orgId: string; connectionId: string; entityType: string;
    sampleData: Record<string, unknown>[];
  }): Promise<{ input: Record<string, unknown>[]; output: Record<string, unknown>[]; warnings: string[] }>;

  // ─── Webhook Management ────────────────────────────────────
  registerWebhook(params: {
    orgId: string; connectionId: string; events: string[];
  }): Promise<WebhookEndpoint>;

  listWebhooks(params: { orgId: string; connectionId?: string }): Promise<WebhookEndpoint[]>;

  listWebhookEvents(params: {
    orgId: string; endpointId: string; limit?: number;
    cursor?: string; status?: WebhookEvent['status'];
  }): Promise<{ events: WebhookEvent[]; cursor?: string; hasMore: boolean }>;

  // ─── Provider Discovery ────────────────────────────────────
  listProviders(params?: { type?: ConnectionType; search?: string }): Promise<ProviderMetadata[]>;
  getProvider(provider: string): Promise<ProviderMetadata>;
}
```

---

## Database Schemas

```typescript
import {
  pgTable, uuid, text, varchar, timestamp, jsonb, boolean,
  integer, index, uniqueIndex, pgPolicy, bigint,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── Connections ──────────────────────────────────────────────

export const connections = pgTable(
  'fin_integration_connections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    createdBy: uuid('created_by').notNull().references(() => users.id),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    provider: varchar('provider', { length: 100 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(),
    status: varchar('status', { length: 30 }).notNull().default('pending'),
    healthStatus: varchar('health_status', { length: 30 }).default('unknown'),
    healthLastCheckedAt: timestamp('health_last_checked_at', { withTimezone: true }),
    healthLatencyMs: integer('health_latency_ms'),
    healthError: text('health_error'),
    healthConsecutiveFailures: integer('health_consecutive_failures').default(0),
    credentialId: uuid('credential_id').references(() => credentials.id),
    config: jsonb('config').default({}),
    externalAccountId: varchar('external_account_id', { length: 255 }),
    externalAccountName: varchar('external_account_name', { length: 255 }),
    scopes: jsonb('scopes').default([]),
    enabledEntities: jsonb('enabled_entities').default([]),
    defaultSyncDirection: varchar('default_sync_direction', { length: 30 }).default('pull'),
    defaultConflictStrategy: varchar('default_conflict_strategy', { length: 30 }).default('last-write-wins'),
    rateLimitConfig: jsonb('rate_limit_config').default({}),
    lastSyncJobId: uuid('last_sync_job_id'),
    lastSyncCompletedAt: timestamp('last_sync_completed_at', { withTimezone: true }),
    lastSyncRecordCount: integer('last_sync_record_count'),
    connectedAt: timestamp('connected_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_fin_conn_org').on(table.orgId),
    index('idx_fin_conn_provider').on(table.provider),
    index('idx_fin_conn_status').on(table.status),
    uniqueIndex('idx_fin_conn_org_provider_ext')
      .on(table.orgId, table.provider, table.externalAccountId)
      .where(sql`deleted_at IS NULL`),
    pgPolicy('fin_connections_rls', {
      for: 'all',
      using: sql`org_id = current_setting('app.current_org_id')::uuid`,
    }),
  ],
);

// ─── Credentials (Encrypted) ─────────────────────────────────

export const credentials = pgTable(
  'fin_integration_credentials',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    connectionId: uuid('connection_id').notNull(),
    provider: varchar('provider', { length: 100 }).notNull(),
    type: varchar('type', { length: 30 }).notNull(),
    encryptedPayload: text('encrypted_payload').notNull(),
    encryptionVersion: integer('encryption_version').notNull().default(1),
    encryptionKeyId: varchar('encryption_key_id', { length: 100 }).notNull(),
    encryptionIv: text('encryption_iv').notNull(),
    encryptionTag: text('encryption_tag').notNull(),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    lastRotatedAt: timestamp('last_rotated_at', { withTimezone: true }),
    rotationFailures: integer('rotation_failures').default(0),
    lastRotationError: text('last_rotation_error'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_fin_creds_org').on(table.orgId),
    index('idx_fin_creds_conn').on(table.connectionId),
    index('idx_fin_creds_expiry').on(table.accessTokenExpiresAt),
    pgPolicy('fin_credentials_rls', {
      for: 'all',
      using: sql`org_id = current_setting('app.current_org_id')::uuid`,
    }),
  ],
);

// ─── Sync Jobs ────────────────────────────────────────────────

export const syncJobs = pgTable(
  'fin_integration_sync_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    connectionId: uuid('connection_id').notNull().references(() => connections.id),
    status: varchar('status', { length: 30 }).notNull().default('pending'),
    direction: varchar('direction', { length: 30 }).notNull(),
    mode: varchar('mode', { length: 30 }).notNull(),
    entityTypes: jsonb('entity_types').default([]),
    trigger: varchar('trigger', { length: 30 }).notNull(),
    triggerWebhookEventId: uuid('trigger_webhook_event_id'),
    retryOfJobId: uuid('retry_of_job_id'),
    retryAttempt: integer('retry_attempt').default(0),
    maxRetries: integer('max_retries').default(3),
    cursor: jsonb('cursor'),
    progressTotal: integer('progress_total'),
    progressProcessed: integer('progress_processed').default(0),
    progressSuccess: integer('progress_success').default(0),
    progressFailed: integer('progress_failed').default(0),
    progressSkipped: integer('progress_skipped').default(0),
    progressConflicts: integer('progress_conflicts').default(0),
    conflicts: jsonb('conflicts').default([]),
    errors: jsonb('errors').default([]),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    durationMs: integer('duration_ms'),
    initiatedBy: uuid('initiated_by'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_fin_sync_org').on(table.orgId),
    index('idx_fin_sync_conn').on(table.connectionId),
    index('idx_fin_sync_status').on(table.status),
    index('idx_fin_sync_created').on(table.createdAt),
    index('idx_fin_sync_conn_status').on(table.connectionId, table.status),
    pgPolicy('fin_sync_jobs_rls', {
      for: 'all',
      using: sql`org_id = current_setting('app.current_org_id')::uuid`,
    }),
  ],
);

// ─── Sync Logs ────────────────────────────────────────────────

export const syncLogs = pgTable(
  'fin_integration_sync_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull(),
    syncJobId: uuid('sync_job_id').notNull().references(() => syncJobs.id),
    connectionId: uuid('connection_id').notNull(),
    entityType: varchar('entity_type', { length: 100 }).notNull(),
    externalId: varchar('external_id', { length: 255 }),
    internalId: uuid('internal_id'),
    action: varchar('action', { length: 30 }).notNull(),
    direction: varchar('direction', { length: 30 }).notNull(),
    beforeSnapshot: jsonb('before_snapshot'),
    afterSnapshot: jsonb('after_snapshot'),
    changesSummary: jsonb('changes_summary'),
    error: jsonb('error'),
    durationMs: integer('duration_ms'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_fin_slog_job').on(table.syncJobId),
    index('idx_fin_slog_entity').on(table.entityType),
    index('idx_fin_slog_ext_id').on(table.externalId),
    index('idx_fin_slog_created').on(table.createdAt),
    pgPolicy('fin_sync_logs_rls', {
      for: 'all',
      using: sql`org_id = current_setting('app.current_org_id')::uuid`,
    }),
  ],
);

// ─── Field Mappings ───────────────────────────────────────────

export const fieldMappings = pgTable(
  'fin_integration_field_mappings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull(),
    connectionId: uuid('connection_id').notNull().references(() => connections.id),
    entityType: varchar('entity_type', { length: 100 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    direction: varchar('direction', { length: 30 }).notNull(),
    rules: jsonb('rules').default([]),
    defaults: jsonb('defaults').default({}),
    ignoredFields: jsonb('ignored_fields').default([]),
    isActive: boolean('is_active').default(true),
    version: integer('version').default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_fin_fmap_conn').on(table.connectionId),
    uniqueIndex('idx_fin_fmap_conn_entity').on(table.connectionId, table.entityType, table.direction),
    pgPolicy('fin_field_mappings_rls', {
      for: 'all',
      using: sql`org_id = current_setting('app.current_org_id')::uuid`,
    }),
  ],
);

// ─── Webhook Endpoints ────────────────────────────────────────

export const webhookEndpoints = pgTable(
  'fin_integration_webhook_endpoints',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull(),
    connectionId: uuid('connection_id').notNull().references(() => connections.id),
    provider: varchar('provider', { length: 100 }).notNull(),
    path: varchar('path', { length: 500 }).notNull(),
    signingSecretId: uuid('signing_secret_id').notNull(),
    signatureConfig: jsonb('signature_config').notNull(),
    subscribedEvents: jsonb('subscribed_events').default([]),
    isActive: boolean('is_active').default(true),
    statsTotalReceived: bigint('stats_total_received', { mode: 'number' }).default(0),
    statsTotalProcessed: bigint('stats_total_processed', { mode: 'number' }).default(0),
    statsTotalFailed: bigint('stats_total_failed', { mode: 'number' }).default(0),
    statsLastReceivedAt: timestamp('stats_last_received_at', { withTimezone: true }),
    statsAvgProcessingMs: integer('stats_avg_processing_ms'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_fin_whep_conn').on(table.connectionId),
    uniqueIndex('idx_fin_whep_path').on(table.path),
    pgPolicy('fin_webhook_endpoints_rls', {
      for: 'all',
      using: sql`org_id = current_setting('app.current_org_id')::uuid`,
    }),
  ],
);

// ─── Webhook Events ───────────────────────────────────────────

export const webhookEvents = pgTable(
  'fin_integration_webhook_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull(),
    endpointId: uuid('endpoint_id').notNull().references(() => webhookEndpoints.id),
    connectionId: uuid('connection_id').notNull(),
    provider: varchar('provider', { length: 100 }).notNull(),
    providerEventId: varchar('provider_event_id', { length: 255 }),
    eventType: varchar('event_type', { length: 200 }).notNull(),
    entityType: varchar('entity_type', { length: 100 }),
    externalEntityId: varchar('external_entity_id', { length: 255 }),
    internalEntityId: uuid('internal_entity_id'),
    rawPayload: jsonb('raw_payload').notNull(),
    normalizedPayload: jsonb('normalized_payload'),
    status: varchar('status', { length: 30 }).notNull().default('received'),
    idempotencyKey: varchar('idempotency_key', { length: 500 }).notNull(),
    attempts: integer('attempts').default(0),
    error: jsonb('error'),
    syncJobId: uuid('sync_job_id'),
    sourceIp: varchar('source_ip', { length: 45 }),
    headers: jsonb('headers').default({}),
    receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_fin_whev_endpoint').on(table.endpointId),
    index('idx_fin_whev_status').on(table.status),
    uniqueIndex('idx_fin_whev_idempotency').on(table.idempotencyKey),
    index('idx_fin_whev_received').on(table.receivedAt),
    pgPolicy('fin_webhook_events_rls', {
      for: 'all',
      using: sql`org_id = current_setting('app.current_org_id')::uuid`,
    }),
  ],
);

// ─── Data Transforms ──────────────────────────────────────────

export const dataTransforms = pgTable(
  'fin_integration_data_transforms',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull(),
    connectionId: uuid('connection_id').notNull().references(() => connections.id),
    entityType: varchar('entity_type', { length: 100 }).notNull(),
    direction: varchar('direction', { length: 30 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    steps: jsonb('steps').default([]),
    errorHandling: varchar('error_handling', { length: 30 }).default('skip'),
    batchSize: integer('batch_size').default(100),
    isActive: boolean('is_active').default(true),
    version: integer('version').default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_fin_dtx_conn').on(table.connectionId),
    pgPolicy('fin_data_transforms_rls', {
      for: 'all',
      using: sql`org_id = current_setting('app.current_org_id')::uuid`,
    }),
  ],
);

// ─── Integration Errors ───────────────────────────────────────

export const integrationErrors = pgTable(
  'fin_integration_errors',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull(),
    connectionId: uuid('connection_id').notNull(),
    syncJobId: uuid('sync_job_id'),
    webhookEventId: uuid('webhook_event_id'),
    code: varchar('code', { length: 100 }).notNull(),
    severity: varchar('severity', { length: 20 }).notNull(),
    message: text('message').notNull(),
    details: jsonb('details'),
    entityType: varchar('entity_type', { length: 100 }),
    externalId: varchar('external_id', { length: 255 }),
    internalId: uuid('internal_id'),
    stackTrace: text('stack_trace'),
    resolved: boolean('resolved').default(false),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolvedBy: uuid('resolved_by'),
    resolution: text('resolution'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_fin_ierr_conn').on(table.connectionId),
    index('idx_fin_ierr_code').on(table.code),
    index('idx_fin_ierr_severity').on(table.severity),
    index('idx_fin_ierr_resolved').on(table.resolved),
    index('idx_fin_ierr_created').on(table.createdAt),
    pgPolicy('fin_integration_errors_rls', {
      for: 'all',
      using: sql`org_id = current_setting('app.current_org_id')::uuid`,
    }),
  ],
);

// ─── Sync Schedules ───────────────────────────────────────────

export const syncSchedules = pgTable(
  'fin_integration_sync_schedules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull(),
    connectionId: uuid('connection_id').notNull().references(() => connections.id),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    cronExpression: varchar('cron_expression', { length: 100 }).notNull(),
    timezone: varchar('timezone', { length: 100 }).default('UTC'),
    direction: varchar('direction', { length: 30 }).notNull(),
    mode: varchar('mode', { length: 30 }).notNull(),
    entityTypes: jsonb('entity_types').default([]),
    conflictStrategy: varchar('conflict_strategy', { length: 30 }).default('last-write-wins'),
    isActive: boolean('is_active').default(true),
    lastRunAt: timestamp('last_run_at', { withTimezone: true }),
    lastRunJobId: uuid('last_run_job_id'),
    nextRunAt: timestamp('next_run_at', { withTimezone: true }),
    failureCount: integer('failure_count').default(0),
    maxConsecutiveFailures: integer('max_consecutive_failures').default(5),
    pausedOnFailure: boolean('paused_on_failure').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_fin_sched_conn').on(table.connectionId),
    index('idx_fin_sched_next').on(table.nextRunAt),
    index('idx_fin_sched_active').on(table.isActive),
    pgPolicy('fin_sync_schedules_rls', {
      for: 'all',
      using: sql`org_id = current_setting('app.current_org_id')::uuid`,
    }),
  ],
);
```

---

## Code Examples

### Example 1: Connecting to QuickBooks Online (OAuth2 Flow)

```typescript
import { IntegrationService } from '@mcv/finance/integrations';

// Step 1: Initiate the OAuth2 connection
const { connectionId, authorizationUrl } = await integrationService.connect({
  orgId: ctx.orgId,
  userId: ctx.userId,
  provider: 'quickbooks-online',
  type: 'erp',
  name: 'Our QuickBooks Company',
  scopes: ['com.intuit.quickbooks.accounting'],
  redirectUri: 'https://app.mcv.one/integrations/callback',
  config: { environment: 'production', minorVersion: '65' },
});

// Step 2: Redirect user to authorizationUrl in browser
// ... user authorizes in QuickBooks ...

// Step 3: Handle the OAuth callback
const connection = await integrationService.completeOAuthConnection({
  connectionId,
  code: callbackParams.code,
  state: callbackParams.state,
});

console.log(`Connected to ${connection.externalAccountName}`);
// → "Connected to Acme Corporation"

// Step 4: Run initial full sync to import all data
const syncJob = await integrationService.sync({
  orgId: ctx.orgId,
  connectionId: connection.id,
  direction: 'pull',
  mode: 'full',
  entityTypes: ['customers', 'invoices', 'payments', 'accounts'],
});

console.log(`Initial sync started: ${syncJob.id}`);

// Step 5: Monitor sync progress
const status = await integrationService.getSyncStatus({
  orgId: ctx.orgId,
  jobId: syncJob.id,
});

console.log(`Progress: ${status.progress.processedRecords}/${status.progress.totalRecords}`);

// Step 6: Set up recurring sync
await syncScheduler.create({
  orgId: ctx.orgId,
  connectionId: connection.id,
  name: 'Hourly QBO Sync',
  cronExpression: '0 * * * *',
  timezone: 'America/New_York',
  direction: 'bidirectional',
  mode: 'incremental',
  entityTypes: ['customers', 'invoices', 'payments'],
  conflictStrategy: 'last-write-wins',
});
```

### Example 2: Linking Bank Accounts via Plaid

```typescript
import { IntegrationService, PlaidProvider } from '@mcv/finance/integrations';

// Step 1: Create a Plaid Link session
const plaid = providerRegistry.get<BankFeedProvider>('plaid');

const linkSession = await plaid.createLinkSession({
  orgId: ctx.orgId,
  userId: ctx.userId,
  products: ['transactions', 'balances'],
  redirectUri: 'https://app.mcv.one/banking/link-callback',
  metadata: { clientName: 'MCV.ONE' },
});

// Step 2: Frontend opens Plaid Link with the token
// plaidLink.open({ token: linkSession.linkToken });

// Step 3: Exchange public token for permanent access
const { accessToken, itemId, accounts } = await plaid.exchangeToken({
  publicToken: callbackParams.publicToken,
});

// Step 4: Create the connection record
const connection = await integrationService.connect({
  orgId: ctx.orgId,
  userId: ctx.userId,
  provider: 'plaid',
  type: 'bank-feed',
  name: `${accounts[0].institution.name} - Linked Accounts`,
  config: { itemId, accountIds: accounts.map(a => a.accountId) },
});

console.log(`Linked ${accounts.length} accounts from ${accounts[0].institution.name}`);

// Step 5: Fetch transactions
const { transactions } = await plaid.getTransactions({
  accessToken,
  startDate: new Date('2024-01-01'),
  endDate: new Date(),
  count: 500,
});

console.log(`Imported ${transactions.length} transactions`);

// Step 6: Fetch balances
const balances = await plaid.getBalances({ accessToken });
for (const bal of balances) {
  console.log(`Account ${bal.accountId}: $${bal.current} ${bal.currency}`);
}

// Step 7: Schedule daily import
await syncScheduler.create({
  orgId: ctx.orgId,
  connectionId: connection.id,
  name: 'Daily Bank Transaction Import',
  cronExpression: '0 6 * * *',
  timezone: 'America/New_York',
  direction: 'pull',
  mode: 'incremental',
  entityTypes: ['transactions', 'balances'],
});
```

### Example 3: Syncing Payments from Stripe

```typescript
import { IntegrationService, StripeAdapter } from '@mcv/finance/integrations';

const stripe = providerRegistry.get<PaymentGatewayAdapter>('stripe');

// Fetch recent payments
const { payments, hasMore } = await stripe.fetchPayments({
  since: new Date('2024-12-01'),
  limit: 100,
  status: ['succeeded', 'refunded'],
});

console.log(`Fetched ${payments.length} payments`);

for (const payment of payments) {
  console.log(
    `${payment.externalId}: $${(payment.amount / 100).toFixed(2)} ${payment.currency} ` +
    `| ${payment.status} | Fee: $${((payment.fee ?? 0) / 100).toFixed(2)}`
  );
}

// Reconcile with internal records
const reconciliation = await stripe.reconcile({
  startDate: new Date('2024-12-01'),
  endDate: new Date('2024-12-31'),
  internalPayments: await getInternalPayments(ctx.orgId, '2024-12'),
});

console.log(`Matched: ${reconciliation.matched.length}`);
console.log(`Unmatched Internal: ${reconciliation.unmatchedInternal.length}`);
console.log(`Unmatched External: ${reconciliation.unmatchedExternal.length}`);
console.log(`Discrepancies: ${reconciliation.discrepancies.length}`);

for (const disc of reconciliation.discrepancies) {
  console.warn(
    `Discrepancy on ${disc.field}: internal=${disc.internalValue}, stripe=${disc.externalValue}`
  );
}

// Fetch settlement/payout data
const { settlements } = await stripe.fetchSettlements({
  since: new Date('2024-12-01'),
  until: new Date('2024-12-31'),
});

for (const s of settlements) {
  console.log(
    `Settlement ${s.externalId}: $${(s.netAmount / 100).toFixed(2)} ` +
    `(${s.transactionCount} txns, ${s.status})`
  );
}
```

### Example 4: Importing Payroll Data from Gusto

```typescript
import { GustoAdapter } from '@mcv/finance/integrations';

const gusto = providerRegistry.get<PayrollAdapter>('gusto');

// Fetch employees
const { employees } = await gusto.fetchEmployees({ status: ['active'] });
console.log(`Found ${employees.length} active employees`);

for (const emp of employees) {
  console.log(
    `${emp.firstName} ${emp.lastName} | ${emp.jobTitle ?? 'N/A'} | ` +
    `${emp.compensationType}: $${emp.payRate ?? 'N/A'}`
  );
}

// Fetch recent pay runs
const { payRuns } = await gusto.fetchPayRuns({
  since: new Date('2024-10-01'),
  status: ['processed', 'paid'],
});

for (const run of payRuns) {
  console.log(
    `Pay Run: ${run.payPeriodStart.toISOString().slice(0, 10)} → ` +
    `${run.payPeriodEnd.toISOString().slice(0, 10)} | ` +
    `Gross: $${run.totals.grossPay.toFixed(2)} | Net: $${run.totals.netPay.toFixed(2)}`
  );
}

// Generate journal entry from pay run
const latest = payRuns[0];
const journalEntry = {
  date: latest.checkDate,
  memo: `Payroll ${latest.payPeriodStart.toISOString().slice(0, 10)} to ${latest.payPeriodEnd.toISOString().slice(0, 10)}`,
  lines: [
    { account: 'Salary Expense', debit: latest.totals.grossPay },
    { account: 'Payroll Tax Expense (Employer)', debit: latest.totals.employerTaxes },
    { account: 'Employee Tax Withholdings', credit: latest.totals.employeeTaxes },
    { account: 'Employee Deductions', credit: latest.totals.employeeDeductions },
    { account: 'Payroll Clearing', credit: latest.totals.netPay },
  ],
};

// Fetch W-2s for tax season
const taxForms = await gusto.fetchTaxForms({ year: 2024, formType: ['W-2'] });
console.log(`Retrieved ${taxForms.length} W-2 forms for 2024`);
```

### Example 5: Tax Rate Lookup with Avalara

```typescript
import { AvalaraAdapter } from '@mcv/finance/integrations';

const avalara = providerRegistry.get<TaxPlatformAdapter>('avalara');

// Calculate tax for a sale
const taxResult = await avalara.calculateTax({
  lineItems: [
    { id: 'line-1', amount: 99.99, quantity: 2, taxCode: 'P0000000', description: 'Widget Pro' },
    { id: 'line-2', amount: 49.99, quantity: 1, taxCode: 'SW054000', description: 'Widget Cloud Annual' },
  ],
  fromAddress: {
    line1: '100 Ravine Lane NE', city: 'Bainbridge Island',
    region: 'WA', postalCode: '98110', country: 'US',
  },
  toAddress: {
    line1: '512 S Mangum St', city: 'Durham',
    region: 'NC', postalCode: '27701', country: 'US',
  },
  transactionDate: new Date(),
  currency: 'USD',
  documentType: 'sale',
});

console.log(`Total Tax: $${taxResult.totalTax.toFixed(2)}`);

for (const item of taxResult.lineItems) {
  console.log(`  ${item.id}: $${item.taxAmount.toFixed(2)} (${(item.taxRate * 100).toFixed(3)}%)`);
  for (const detail of item.taxDetails) {
    console.log(`    ${detail.jurisdictionType} (${detail.jurisdiction}): ${detail.taxName} @ ${(detail.rate * 100).toFixed(3)}%`);
  }
}

// Detect nexus obligations
const nexusResults = await avalara.detectNexus({ orgId: ctx.orgId, year: 2024 });

for (const result of nexusResults.filter(r => r.hasNexus)) {
  console.log(
    `${result.state}: ${result.nexusType} nexus — ` +
    `${result.details.transactionCount} txns, $${result.details.transactionVolume.toFixed(2)} | ` +
    `${result.recommendation}`
  );
}

// Create exemption certificate
const cert = await avalara.createExemptionCertificate({
  customerId: 'cust-123',
  certificate: {
    certificateNumber: 'NC-RESALE-2024-001',
    exemptionType: 'resale',
    states: ['NC'],
    validFrom: new Date('2024-01-01'),
    validTo: new Date('2024-12-31'),
    status: 'active',
  },
});

console.log(`Created certificate: ${cert.id} (${cert.certificateNumber})`);
```

### Example 6: Processing Inbound Webhooks

```typescript
import { WebhookProcessor, normalizeWebhookEvent } from '@mcv/finance/integrations';

// Register a webhook endpoint for Stripe
const endpoint = await integrationService.registerWebhook({
  orgId: ctx.orgId,
  connectionId: stripeConnectionId,
  events: [
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'charge.refunded',
    'payout.paid',
    'charge.dispute.created',
  ],
});

console.log(`Webhook URL: https://api.mcv.one${endpoint.path}`);

// ─── Webhook handler (API route) ────────────────────────────

// POST /api/webhooks/stripe/:endpointId
export async function handleStripeWebhook(req: Request) {
  const endpointId = req.params.endpointId;
  const rawBody = await req.text();

  try {
    const result = await webhookProcessor.receive({
      endpointId,
      headers: Object.fromEntries(req.headers.entries()),
      rawBody,
      sourceIp: req.headers.get('x-forwarded-for') ?? req.socket.remoteAddress,
    });

    console.log(`Webhook received: ${result.eventType} (${result.status})`);

    // The processor handles:
    // 1. Signature verification (using Stripe-Signature header)
    // 2. Idempotency deduplication
    // 3. Event normalization to canonical format
    // 4. Publishing to Redpanda for async processing
    // 5. Persisting the raw + normalized event to DB

    return new Response('OK', { status: 200 });
  } catch (err) {
    if (err.code === 'WEBHOOK_SIGNATURE_INVALID') {
      return new Response('Invalid signature', { status: 403 });
    }
    if (err.code === 'WEBHOOK_DUPLICATE') {
      return new Response('Already processed', { status: 200 });
    }
    console.error('Webhook processing error:', err);
    return new Response('Internal error', { status: 500 });
  }
}

// ─── Downstream webhook event consumer ──────────────────────

// Redpanda consumer: finance.webhook.inbound
webhookConsumer.on('message', async (event: WebhookEvent) => {
  switch (event.eventType) {
    case 'payment_intent.succeeded': {
      // Trigger an incremental pull sync for this specific payment
      await integrationService.sync({
        orgId: event.orgId,
        connectionId: event.connectionId,
        direction: 'pull',
        mode: 'selective',
        entityTypes: ['payments'],
        options: { since: event.receivedAt },
      });
      break;
    }
    case 'charge.dispute.created': {
      // Alert the finance team about the new dispute
      await notificationService.send({
        orgId: event.orgId,
        channel: 'finance-alerts',
        severity: 'high',
        title: 'New Payment Dispute',
        message: `Dispute created for charge ${event.externalEntityId}`,
        data: event.normalizedPayload,
      });
      break;
    }
  }
});
```

### Example 7: Configuring Field Mappings

```typescript
import { IntegrationService, buildFieldMap } from '@mcv/finance/integrations';

// Configure how QuickBooks invoices map to MCV.ONE invoices
const mapping = await integrationService.configureFieldMapping({
  orgId: ctx.orgId,
  connectionId: qboConnectionId,
  entityType: 'invoices',
  mapping: {
    name: 'QBO Invoice Mapping v2',
    direction: 'bidirectional',
    rules: [
      // Direct mappings
      { source: 'DocNumber', target: 'invoiceNumber', transform: { type: 'direct' }, required: true },
      { source: 'TxnDate', target: 'issueDate', transform: { type: 'dateFormat', from: 'YYYY-MM-DD', to: 'ISO8601' }, required: true },
      { source: 'DueDate', target: 'dueDate', transform: { type: 'dateFormat', from: 'YYYY-MM-DD', to: 'ISO8601' }, required: true },

      // Currency conversion
      { source: 'TotalAmt', target: 'totalAmount', transform: { type: 'currencyConvert', from: 'CurrencyRef.value', to: 'USD' }, required: true },

      // Enum mapping
      {
        source: 'PrintStatus',
        target: 'printStatus',
        transform: {
          type: 'enum',
          mapping: { NeedToPrint: 'pending', PrintComplete: 'printed', NotSet: 'none' },
        },
        required: false,
      },

      // Nested field with lookup
      {
        source: 'CustomerRef.value',
        target: 'customerId',
        transform: { type: 'lookup', table: 'customer_id_map', key: 'qbo_id', value: 'mcv_id' },
        required: true,
      },

      // Line items (array mapping)
      { source: 'Line[].Amount', target: 'lineItems[].amount', transform: { type: 'direct' }, required: true },
      { source: 'Line[].Description', target: 'lineItems[].description', transform: { type: 'direct' }, required: false },
      {
        source: 'Line[].SalesItemLineDetail.ItemRef.value',
        target: 'lineItems[].productId',
        transform: { type: 'lookup', table: 'item_id_map', key: 'qbo_id', value: 'mcv_id' },
        required: false,
      },
      {
        source: 'Line[].SalesItemLineDetail.TaxCodeRef.value',
        target: 'lineItems[].taxCode',
        transform: { type: 'lookup', table: 'tax_code_map', key: 'qbo_code', value: 'mcv_code' },
        required: false,
      },

      // Computed field
      {
        source: 'Balance',
        target: 'amountDue',
        transform: { type: 'direct' },
        required: false,
      },

      // Conditional transform
      {
        source: 'EmailStatus',
        target: 'emailSent',
        transform: {
          type: 'conditional',
          condition: "value === 'EmailSent'",
          then: true,
          else: false,
        },
        required: false,
      },
    ],
    defaults: {
      currency: 'USD',
      status: 'draft',
    },
    ignoredFields: ['MetaData', 'SyncToken', 'domain', 'sparse'],
    isActive: true,
    version: 2,
  },
});

// Preview how the mapping transforms sample data
const preview = await integrationService.previewMapping({
  orgId: ctx.orgId,
  connectionId: qboConnectionId,
  entityType: 'invoices',
  sampleData: [
    {
      DocNumber: 'INV-1042',
      TxnDate: '2024-12-15',
      DueDate: '2025-01-14',
      TotalAmt: 1250.00,
      Balance: 1250.00,
      CurrencyRef: { value: 'USD' },
      CustomerRef: { value: '142' },
      PrintStatus: 'NeedToPrint',
      EmailStatus: 'NotSent',
      Line: [
        {
          Amount: 1000.00,
          Description: 'Consulting services',
          SalesItemLineDetail: { ItemRef: { value: '17' }, TaxCodeRef: { value: 'TAX' } },
        },
        { Amount: 250.00, Description: 'Travel expenses' },
      ],
    },
  ],
});

console.log('Preview output:', JSON.stringify(preview.output, null, 2));
console.log('Warnings:', preview.warnings);
```

### Example 8: Building a Custom Adapter

```typescript
import type { ERPAdapter, ERPEntity, ERPSyncCapabilities, Connection, CredentialSet, OAuthTokenSet } from '@mcv/finance/integrations';
import { retryWithBackoff, rateLimiter } from '@mcv/finance/integrations';

/**
 * Custom ERP adapter for a hypothetical "AcmeERP" system.
 * Demonstrates the pattern for adding new providers.
 */
export class AcmeERPAdapter implements ERPAdapter {
  readonly provider = 'acme-erp';
  readonly displayName = 'Acme ERP';
  readonly capabilities: ERPSyncCapabilities = {
    entities: {
      customers: { pull: true, push: true, delete: false, webhooks: true, incremental: true, batchSize: 100 },
      invoices:  { pull: true, push: true, delete: false, webhooks: true, incremental: true, batchSize: 50 },
      payments:  { pull: true, push: false, delete: false, webhooks: true, incremental: true, batchSize: 100 },
      accounts:  { pull: true, push: false, delete: false, webhooks: false, incremental: false, batchSize: 200 },
      vendors:   { pull: true, push: true, delete: false, webhooks: false, incremental: true, batchSize: 100 },
      // ... remaining entities set to all false
    } as any,
    supportsWebhooks: true,
    supportsChangeTracking: true,
    maxBatchSize: 200,
    rateLimitPerMinute: 60,
    authMethods: ['oauth2'],
  };

  private client: AcmeClient | null = null;
  private limiter = rateLimiter({ maxPerMinute: 60 });

  async initialize(params: { connection: Connection; credentials: CredentialSet }): Promise<void> {
    if (params.credentials.type !== 'oauth2') {
      throw new Error('Acme ERP requires OAuth2 credentials');
    }
    this.client = new AcmeClient({
      baseUrl: params.connection.config.baseUrl as string,
      accessToken: params.credentials.accessToken,
    });
  }

  async testConnection() {
    const start = Date.now();
    try {
      await this.client!.get('/api/v1/company');
      return { success: true, latencyMs: Date.now() - start };
    } catch (err: any) {
      return { success: false, latencyMs: Date.now() - start, error: err.message };
    }
  }

  async fetch(params: {
    entityType: ERPEntity; since?: Date; cursor?: string; limit?: number;
  }) {
    await this.limiter.acquire();

    const response = await retryWithBackoff(
      () => this.client!.get(`/api/v1/${params.entityType}`, {
        params: {
          since: params.since?.toISOString(),
          cursor: params.cursor,
          limit: params.limit ?? 100,
        },
      }),
      { maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 30000 },
    );

    return {
      records: response.data.items,
      cursor: response.data.nextCursor,
      hasMore: !!response.data.nextCursor,
      totalCount: response.data.totalCount,
    };
  }

  async push(params: {
    entityType: ERPEntity;
    records: Record<string, unknown>[];
    mode: 'create' | 'update' | 'upsert';
  }) {
    await this.limiter.acquire();

    const results = { created: 0, updated: 0, failed: [] as any[], externalIds: {} as Record<string, string> };

    // Batch records according to capability limits
    const batchSize = this.capabilities.entities[params.entityType]?.batchSize ?? 100;
    for (let i = 0; i < params.records.length; i += batchSize) {
      const batch = params.records.slice(i, i + batchSize);
      try {
        const response = await retryWithBackoff(
          () => this.client!.post(`/api/v1/${params.entityType}/batch`, {
            mode: params.mode,
            records: batch,
          }),
          { maxRetries: 2, baseDelayMs: 2000 },
        );
        results.created += response.data.created;
        results.updated += response.data.updated;
        Object.assign(results.externalIds, response.data.idMap);
      } catch (err: any) {
        batch.forEach((record, idx) => {
          results.failed.push({ index: i + idx, error: err.message, record });
        });
      }
    }

    return results;
  }

  async delete(params: { entityType: ERPEntity; externalIds: string[] }) {
    // Acme ERP doesn't support deletes — soft-delete on their side
    return { deleted: 0, failed: params.externalIds.map(id => ({ externalId: id, error: 'Delete not supported' })) };
  }

  async getSchema(entityType: ERPEntity) {
    const response = await this.client!.get(`/api/v1/${entityType}/schema`);
    return response.data;
  }

  getOAuthUrl(params: { redirectUri: string; state: string; scopes: string[] }): string {
    const url = new URL('https://auth.acme-erp.com/oauth/authorize');
    url.searchParams.set('client_id', process.env.ACME_ERP_CLIENT_ID!);
    url.searchParams.set('redirect_uri', params.redirectUri);
    url.searchParams.set('state', params.state);
    url.searchParams.set('scope', params.scopes.join(' '));
    url.searchParams.set('response_type', 'code');
    return url.toString();
  }

  async handleOAuthCallback(params: { code: string; state: string; redirectUri: string }): Promise<OAuthTokenSet> {
    const response = await fetch('https://auth.acme-erp.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: params.code,
        redirect_uri: params.redirectUri,
        client_id: process.env.ACME_ERP_CLIENT_ID,
        client_secret: process.env.ACME_ERP_CLIENT_SECRET,
      }),
    });
    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      scopes: data.scope.split(' '),
    };
  }

  async disconnect(): Promise<void> {
    this.client = null;
  }
}

// Register the custom adapter with the provider registry
providerRegistry.register('acme-erp', {
  metadata: {
    provider: 'acme-erp',
    displayName: 'Acme ERP',
    description: 'Integration with Acme ERP system',
    type: 'erp',
    logoUrl: '/integrations/logos/acme-erp.svg',
    docsUrl: 'https://docs.mcv.one/integrations/acme-erp',
    status: 'stable',
    authMethods: ['oauth2'],
  },
  factory: () => new AcmeERPAdapter(),
});
```

---

## Error Codes

| Code | Severity | Description |
|------|----------|-------------|
| `INT_CONN_NOT_FOUND` | error | Connection not found or not accessible within the org scope |
| `INT_CONN_INACTIVE` | warning | Connection is inactive/paused; operation requires an active connection |
| `INT_CONN_REVOKED` | error | Access has been revoked on the provider side; user must re-authorize |
| `INT_CONN_HEALTH_FAIL` | warning | Connection health check failed; provider may be experiencing issues |
| `INT_CRED_EXPIRED` | error | OAuth access token has expired and automatic rotation failed |
| `INT_CRED_REFRESH_FAIL` | critical | OAuth refresh token is invalid/expired; user must re-authorize |
| `INT_CRED_DECRYPT_FAIL` | critical | Failed to decrypt stored credentials; possible key rotation issue |
| `INT_CRED_MISSING` | error | No credentials found for the specified connection |
| `INT_SYNC_ALREADY_RUNNING` | warning | A sync job is already running for this connection; cannot start another |
| `INT_SYNC_RATE_LIMITED` | warning | Provider API rate limit reached; sync will retry after cooldown |
| `INT_SYNC_TIMEOUT` | error | Sync job exceeded maximum execution time |
| `INT_SYNC_CONFLICT` | warning | Data conflict detected during bidirectional sync; requires resolution |
| `INT_SYNC_PARTIAL_FAIL` | warning | Sync completed but some records failed to process |
| `INT_SYNC_CANCELLED` | info | Sync job was cancelled by user |
| `INT_MAPPING_INVALID` | error | Field mapping configuration is invalid; check source/target paths |
| `INT_MAPPING_LOOKUP_MISS` | warning | Lookup transform failed; no matching value found in lookup table |
| `INT_WEBHOOK_SIGNATURE_INVALID` | error | Webhook signature verification failed; potential spoofing attempt |
| `INT_WEBHOOK_DUPLICATE` | info | Webhook event already processed (idempotency dedup) |
| `INT_WEBHOOK_ENDPOINT_INACTIVE` | warning | Webhook received for an inactive endpoint |
| `INT_WEBHOOK_PROCESSING_FAIL` | error | Failed to process webhook event after maximum retry attempts |
| `INT_TRANSFORM_FAIL` | error | Data transformation pipeline failed; check transform step configuration |
| `INT_TRANSFORM_CURRENCY_FAIL` | error | Currency normalization failed; exchange rate unavailable |
| `INT_TRANSFORM_COA_UNMAPPED` | warning | Account code has no mapping in the chart of accounts |
| `INT_PROVIDER_NOT_FOUND` | error | Requested integration provider is not registered |
| `INT_PROVIDER_UNAVAILABLE` | error | Provider API is down or unreachable |
| `INT_ADAPTER_INIT_FAIL` | error | Failed to initialize the provider adapter |
| `INT_ENTITY_NOT_SUPPORTED` | error | The requested entity type is not supported by this provider |
| `INT_SCHEDULE_MAX_FAILURES` | critical | Sync schedule paused after exceeding max consecutive failures |
| `INT_BATCH_TOO_LARGE` | error | Batch size exceeds provider's maximum limit |
| `INT_FISCAL_PERIOD_MISMATCH` | warning | Source fiscal period does not align with target; data may be offset |

---

## Security

### Credential Encryption

All credentials are encrypted at rest using **AES-256-GCM** through PostgreSQL's `pgcrypto` extension. The encryption architecture ensures that even database administrators cannot read credential values without the application-layer encryption keys.

```
                    ┌──────────────────┐
                    │  Master Key      │  Stored in env var or HSM
                    │  (AES-256)       │  Never touches the database
                    └────────┬─────────┘
                             │
                      HKDF derivation
                             │
                    ┌────────▼─────────┐
                    │  Org Key         │  Derived: HKDF(masterKey, orgId)
                    │  (per-tenant)    │  Computed in application memory
                    └────────┬─────────┘
                             │
                    AES-256-GCM encrypt
                             │
               ┌─────────────▼──────────────┐
               │  Encrypted Credential       │
               │                             │
               │  encrypted_payload (cipher) │
               │  encryption_iv   (nonce)    │
               │  encryption_tag  (auth tag) │
               │  encryption_key_id          │
               │  encryption_version         │
               └─────────────────────────────┘
```

**Key properties:**

- **Per-tenant isolation**: Each org gets a unique derived encryption key. Compromising one org's data doesn't affect others.
- **Authenticated encryption**: GCM mode provides both confidentiality and integrity. Tampered ciphertext is detected and rejected.
- **Key rotation support**: The `encryption_version` and `encryption_key_id` fields allow rolling to new master keys without downtime. Old credentials are re-encrypted lazily on next access.
- **No plaintext in logs**: Credential decryption happens only in application memory. The ORM layer never logs decrypted values. Debug logging redacts all credential fields.

### OAuth Token Rotation

OAuth2 tokens have limited lifetimes. The module proactively rotates tokens before expiration:

```typescript
// Automated rotation runs as a scheduled job
// Checks for tokens expiring within the next 15 minutes
const ROTATION_BUFFER_MS = 15 * 60 * 1000;

async function rotateExpiringTokens() {
  const expiring = await db
    .select()
    .from(credentials)
    .where(
      and(
        eq(credentials.type, 'oauth2'),
        lt(credentials.accessTokenExpiresAt, new Date(Date.now() + ROTATION_BUFFER_MS)),
        isNotNull(credentials.accessTokenExpiresAt),
      ),
    );

  for (const cred of expiring) {
    try {
      await credentialVault.rotateOAuthTokens({
        orgId: cred.orgId,
        credentialId: cred.id,
      });
    } catch (err) {
      // Track rotation failures — after 3 consecutive failures,
      // mark the connection as 'error' and notify the user
      await db
        .update(credentials)
        .set({
          rotationFailures: sql`rotation_failures + 1`,
          lastRotationError: err.message,
        })
        .where(eq(credentials.id, cred.id));

      if (cred.rotationFailures + 1 >= 3) {
        await connectionRegistry.updateStatus(cred.connectionId, 'error');
        await notificationService.send({
          orgId: cred.orgId,
          severity: 'high',
          title: 'Integration Credential Expired',
          message: `Please re-authorize your ${cred.provider} connection.`,
        });
      }
    }
  }
}
```

### Webhook Signature Verification

Every inbound webhook is verified before processing. The module supports multiple signature algorithms:

```typescript
function verifyWebhookSignature(params: {
  rawBody: string | Buffer;
  signature: string;
  secret: string;
  config: WebhookSignatureConfig;
}): boolean {
  const { rawBody, signature, secret, config } = params;

  // Strip prefix (e.g., 'sha256=')
  const rawSignature = config.prefix
    ? signature.replace(config.prefix, '')
    : signature;

  switch (config.algorithm) {
    case 'hmac-sha256': {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest(config.encoding);
      return crypto.timingSafeEqual(
        Buffer.from(rawSignature, config.encoding),
        Buffer.from(expected, config.encoding),
      );
    }
    case 'hmac-sha512': {
      const expected = crypto
        .createHmac('sha512', secret)
        .update(rawBody)
        .digest(config.encoding);
      return crypto.timingSafeEqual(
        Buffer.from(rawSignature, config.encoding),
        Buffer.from(expected, config.encoding),
      );
    }
    // ... rsa-sha256 and ed25519 variants
  }

  // Replay protection: verify timestamp is within maxTimestampAge
  if (config.timestampHeader && config.maxTimestampAge) {
    const timestamp = parseInt(headers[config.timestampHeader], 10);
    const age = Math.abs(Date.now() / 1000 - timestamp);
    if (age > config.maxTimestampAge) {
      throw new IntegrationError('INT_WEBHOOK_SIGNATURE_INVALID', 'Webhook timestamp too old');
    }
  }

  return false;
}
```

### Row-Level Security

All tables enforce RLS via the `app.current_org_id` session variable:

```sql
-- Applied to every table in this module
ALTER TABLE fin_integration_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY fin_connections_rls ON fin_integration_connections
  FOR ALL
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- The application sets this at the start of every request:
SET LOCAL app.current_org_id = '550e8400-e29b-41d4-a716-446655440000';
```

**RLS guarantees:**
- Org A can never see Org B's connections, credentials, sync jobs, or webhook events
- Even raw SQL queries are filtered; RLS is enforced at the PostgreSQL level
- The `app.current_org_id` setting is injected by the Supabase middleware layer before any query executes
- Admin/service-role queries bypass RLS only through explicit `security_definer` functions

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `INTEGRATION_MASTER_KEY` | **Yes** | — | AES-256 master encryption key for credential vault (base64-encoded, 32 bytes) |
| `INTEGRATION_KEY_VERSION` | No | `1` | Current master key version (increment when rotating) |
| `QUICKBOOKS_CLIENT_ID` | No | — | QuickBooks OAuth2 client ID |
| `QUICKBOOKS_CLIENT_SECRET` | No | — | QuickBooks OAuth2 client secret |
| `QUICKBOOKS_ENVIRONMENT` | No | `production` | `sandbox` or `production` |
| `XERO_CLIENT_ID` | No | — | Xero OAuth2 client ID |
| `XERO_CLIENT_SECRET` | No | — | Xero OAuth2 client secret |
| `NETSUITE_ACCOUNT_ID` | No | — | NetSuite account ID |
| `NETSUITE_CONSUMER_KEY` | No | — | NetSuite OAuth1 consumer key |
| `NETSUITE_CONSUMER_SECRET` | No | — | NetSuite OAuth1 consumer secret |
| `SAP_B1_SERVICE_URL` | No | — | SAP Business One Service Layer URL |
| `SAGE_INTACCT_SENDER_ID` | No | — | Sage Intacct Web Services sender ID |
| `SAGE_INTACCT_SENDER_PASSWORD` | No | — | Sage Intacct Web Services sender password |
| `PLAID_CLIENT_ID` | No | — | Plaid API client ID |
| `PLAID_SECRET` | No | — | Plaid API secret |
| `PLAID_ENVIRONMENT` | No | `production` | `sandbox`, `development`, or `production` |
| `YODLEE_CLIENT_ID` | No | — | Yodlee API client ID |
| `YODLEE_SECRET` | No | — | Yodlee API secret |
| `MX_CLIENT_ID` | No | — | MX API client ID |
| `MX_API_KEY` | No | — | MX API key |
| `SALT_EDGE_APP_ID` | No | — | Salt Edge application ID |
| `SALT_EDGE_SECRET` | No | — | Salt Edge secret |
| `STRIPE_SECRET_KEY` | No | — | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | No | — | Stripe webhook signing secret |
| `PAYPAL_CLIENT_ID` | No | — | PayPal OAuth2 client ID |
| `PAYPAL_CLIENT_SECRET` | No | — | PayPal OAuth2 client secret |
| `PAYPAL_ENVIRONMENT` | No | `live` | `sandbox` or `live` |
| `SQUARE_ACCESS_TOKEN` | No | — | Square API access token |
| `ADYEN_API_KEY` | No | — | Adyen API key |
| `ADYEN_MERCHANT_ACCOUNT` | No | — | Adyen merchant account name |
| `BRAINTREE_MERCHANT_ID` | No | — | Braintree merchant ID |
| `BRAINTREE_PUBLIC_KEY` | No | — | Braintree public key |
| `BRAINTREE_PRIVATE_KEY` | No | — | Braintree private key |
| `ADP_CLIENT_ID` | No | — | ADP OAuth2 client ID |
| `ADP_CLIENT_SECRET` | No | — | ADP OAuth2 client secret |
| `GUSTO_CLIENT_ID` | No | — | Gusto OAuth2 client ID |
| `GUSTO_CLIENT_SECRET` | No | — | Gusto OAuth2 client secret |
| `RIPPLING_API_KEY` | No | — | Rippling API key |
| `BAMBOOHR_API_KEY` | No | — | BambooHR API key |
| `BAMBOOHR_SUBDOMAIN` | No | — | BambooHR company subdomain |
| `AVALARA_ACCOUNT_ID` | No | — | Avalara AvaTax account ID |
| `AVALARA_LICENSE_KEY` | No | — | Avalara AvaTax license key |
| `AVALARA_ENVIRONMENT` | No | `production` | `sandbox` or `production` |
| `TAXJAR_API_TOKEN` | No | — | TaxJar API token |
| `VERTEX_CLIENT_ID` | No | — | Vertex OAuth2 client ID |
| `VERTEX_CLIENT_SECRET` | No | — | Vertex OAuth2 client secret |
| `EXPENSIFY_PARTNER_USER_ID` | No | — | Expensify integration partner user ID |
| `EXPENSIFY_PARTNER_SECRET` | No | — | Expensify integration partner secret |
| `SAP_CONCUR_CLIENT_ID` | No | — | SAP Concur OAuth2 client ID |
| `SAP_CONCUR_CLIENT_SECRET` | No | — | SAP Concur OAuth2 client secret |
| `BREX_API_KEY` | No | — | Brex API key |
| `RAMP_CLIENT_ID` | No | — | Ramp OAuth2 client ID |
| `RAMP_CLIENT_SECRET` | No | — | Ramp OAuth2 client secret |
| `REDPANDA_BROKERS` | **Yes** | — | Redpanda broker list (comma-separated) |
| `REDPANDA_SASL_USERNAME` | No | — | Redpanda SASL username |
| `REDPANDA_SASL_PASSWORD` | No | — | Redpanda SASL password |
| `INTEGRATION_SYNC_CONCURRENCY` | No | `5` | Max concurrent sync jobs per org |
| `INTEGRATION_WEBHOOK_TIMEOUT_MS` | No | `30000` | Max time to process a single webhook event |
| `INTEGRATION_RETRY_MAX_ATTEMPTS` | No | `3` | Default max retry attempts for failed syncs |
| `INTEGRATION_RETRY_BASE_DELAY_MS` | No | `1000` | Base delay for exponential backoff |
| `INTEGRATION_RETRY_MAX_DELAY_MS` | No | `300000` | Maximum delay between retries (5 min) |
| `INTEGRATION_TOKEN_ROTATION_BUFFER_MS` | No | `900000` | Rotate tokens this many ms before expiry (15 min) |
| `INTEGRATION_HEALTH_CHECK_INTERVAL_MS` | No | `300000` | Health check interval for active connections (5 min) |
| `OPENEXCHANGERATES_APP_ID` | No | — | Open Exchange Rates API key (for currency conversion) |

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/core` | Base utilities, error classes, logging, config |
| `@mcv/auth` | Authentication context, org/user resolution |
| `@mcv/db` | Supabase client, Drizzle ORM setup, migrations |
| `@mcv/events` | Redpanda producer/consumer, event schemas |
| `@mcv/notifications` | Alert delivery for credential failures, sync errors |
| `@mcv/finance/accounts` | Chart of accounts for COA mapping |
| `@mcv/finance/banking` | Bank account records for bank feed linking |
| `@mcv/finance/invoicing` | Invoice records for ERP sync |
| `@mcv/finance/payments` | Payment records for gateway sync |
| `@mcv/finance/payroll` | Payroll records for payroll system import |
| `@mcv/finance/expenses` | Expense records for expense platform sync |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.34` | Database ORM and schema definitions |
| `@trpc/server` | `^11` | tRPC router definitions |
| `zod` | `^3.23` | Runtime schema validation |
| `node-cron` | `^3.0` | Cron expression parsing for sync schedules |
| `plaid` | `^26` | Plaid Node.js SDK |
| `stripe` | `^17` | Stripe Node.js SDK |
| `xero-node` | `^7` | Xero Node.js SDK |
| `intuit-oauth` | `^4` | QuickBooks OAuth2 client |
| `node-quickbooks` | `^2.0` | QuickBooks API client |
| `@paypal/paypal-server-sdk` | `^1` | PayPal REST SDK |
| `square` | `^38` | Square Node.js SDK |
| `@adyen/api-library` | `^18` | Adyen API client |
| `braintree` | `^3.24` | Braintree Node.js SDK |
| `avatax` | `^24` | Avalara AvaTax SDK |
| `taxjar` | `^4` | TaxJar API client |
| `kafkajs` | `^2.2` | Redpanda/Kafka client |
| `p-queue` | `^8` | Promise-based concurrency control |
| `p-retry` | `^6` | Retry with exponential backoff |
| `bottleneck` | `^2.19` | Rate limiter |
| `croner` | `^8` | Cron scheduling |
| `fast-xml-parser` | `^4.5` | XML parsing (NetSuite, SAP, SOAP APIs) |
| `csv-parse` | `^5.6` | CSV parsing for bank feed imports |
| `date-fns` | `^4` | Date manipulation for fiscal period alignment |
| `dinero.js` | `^2` | Money/currency arithmetic |

---

## Testing

### Unit Tests

Unit tests cover individual services and utilities in isolation, with all external dependencies mocked.

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FieldMappingEngine } from '../services/field-mapping-engine.service';

describe('FieldMappingEngine', () => {
  let engine: FieldMappingEngine;

  beforeEach(() => {
    engine = new FieldMappingEngine();
  });

  it('should map direct fields', async () => {
    const result = await engine.map({
      data: { DocNumber: 'INV-1042', TotalAmt: 1250.00 },
      rules: [
        { source: 'DocNumber', target: 'invoiceNumber', transform: { type: 'direct' }, required: true },
        { source: 'TotalAmt', target: 'totalAmount', transform: { type: 'direct' }, required: true },
      ],
    });

    expect(result).toEqual({
      invoiceNumber: 'INV-1042',
      totalAmount: 1250.00,
    });
  });

  it('should apply enum transforms', async () => {
    const result = await engine.map({
      data: { PrintStatus: 'NeedToPrint' },
      rules: [{
        source: 'PrintStatus',
        target: 'printStatus',
        transform: {
          type: 'enum',
          mapping: { NeedToPrint: 'pending', PrintComplete: 'printed' },
        },
        required: false,
      }],
    });

    expect(result.printStatus).toBe('pending');
  });

  it('should handle missing required fields', async () => {
    await expect(engine.map({
      data: {},
      rules: [{ source: 'DocNumber', target: 'invoiceNumber', transform: { type: 'direct' }, required: true }],
    })).rejects.toThrow('Required field DocNumber is missing');
  });

  it('should use default values for optional missing fields', async () => {
    const result = await engine.map({
      data: {},
      rules: [{
        source: 'Currency',
        target: 'currency',
        transform: { type: 'direct' },
        required: false,
        defaultValue: 'USD',
      }],
    });

    expect(result.currency).toBe('USD');
  });

  it('should handle nested array mappings', async () => {
    const result = await engine.map({
      data: {
        Line: [
          { Amount: 100.00, Description: 'Item A' },
          { Amount: 200.00, Description: 'Item B' },
        ],
      },
      rules: [
        { source: 'Line[].Amount', target: 'lineItems[].amount', transform: { type: 'direct' }, required: true },
        { source: 'Line[].Description', target: 'lineItems[].description', transform: { type: 'direct' }, required: false },
      ],
    });

    expect(result.lineItems).toHaveLength(2);
    expect(result.lineItems[0]).toEqual({ amount: 100.00, description: 'Item A' });
  });
});

describe('ConflictResolver', () => {
  it('should resolve with last-write-wins strategy', async () => {
    const resolver = new ConflictResolver();
    const result = await resolver.resolve({
      strategy: 'last-write-wins',
      internal: { name: 'Old Name', updatedAt: new Date('2024-01-01') },
      external: { name: 'New Name', updatedAt: new Date('2024-06-15') },
      fields: ['name'],
    });

    expect(result.resolution).toBe('external');
    expect(result.resolvedData.name).toBe('New Name');
  });

  it('should queue manual review conflicts', async () => {
    const resolver = new ConflictResolver();
    const result = await resolver.resolve({
      strategy: 'manual-review',
      internal: { amount: 100 },
      external: { amount: 150 },
      fields: ['amount'],
    });

    expect(result.resolution).toBe('pending');
    expect(result.requiresReview).toBe(true);
  });
});

describe('Credential encryption', () => {
  it('should encrypt and decrypt credentials roundtrip', async () => {
    const original: OAuthCredentialSet = {
      type: 'oauth2',
      accessToken: 'sk_test_abc123',
      refreshToken: 'rt_test_xyz789',
      tokenType: 'Bearer',
      expiresAt: new Date('2025-01-01'),
      scopes: ['read', 'write'],
    };

    const encrypted = await encryptCredential(original, testOrgKey);
    expect(encrypted.encryptedPayload).not.toContain('sk_test_abc123');

    const decrypted = await decryptCredential(encrypted, testOrgKey);
    expect(decrypted).toEqual(original);
  });

  it('should detect tampered ciphertext', async () => {
    const encrypted = await encryptCredential(testCredentials, testOrgKey);
    encrypted.encryptedPayload = encrypted.encryptedPayload.slice(0, -4) + 'XXXX';

    await expect(decryptCredential(encrypted, testOrgKey)).rejects.toThrow();
  });
});
```

### Integration Tests

Integration tests verify end-to-end flows against real (sandbox) APIs and the test database.

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { IntegrationService } from '../services/integration.service';
import { createTestDb, cleanupTestDb } from '@mcv/db/test-utils';

describe('Integration Service E2E', () => {
  let service: IntegrationService;
  let testDb: TestDb;

  beforeAll(async () => {
    testDb = await createTestDb();
    service = new IntegrationService({ db: testDb.client });
  });

  afterAll(async () => {
    await cleanupTestDb(testDb);
  });

  it('should complete full QuickBooks sandbox connection flow', async () => {
    // This test uses QBO sandbox credentials
    const { connectionId, authorizationUrl } = await service.connect({
      orgId: testOrg.id,
      userId: testUser.id,
      provider: 'quickbooks-online',
      type: 'erp',
      name: 'Test QBO Connection',
      config: { environment: 'sandbox' },
    });

    expect(connectionId).toBeDefined();
    expect(authorizationUrl).toContain('appcenter.intuit.com');

    // Simulate OAuth callback with sandbox tokens
    const connection = await service.completeOAuthConnection({
      connectionId,
      code: SANDBOX_AUTH_CODE,
      state: extractState(authorizationUrl!),
    });

    expect(connection.status).toBe('active');
    expect(connection.externalAccountName).toBeDefined();

    // Run an incremental sync
    const syncJob = await service.sync({
      orgId: testOrg.id,
      connectionId: connection.id,
      direction: 'pull',
      mode: 'incremental',
      entityTypes: ['customers'],
    });

    // Wait for completion (with timeout)
    const result = await waitForSync(service, testOrg.id, syncJob.id, 30000);
    expect(result.status).toBe('completed');
    expect(result.progress.successRecords).toBeGreaterThan(0);
  });

  it('should enforce RLS between organizations', async () => {
    // Create a connection in org A
    const connA = await service.connect({
      orgId: orgA.id, userId: userA.id,
      provider: 'stripe', type: 'payment-gateway', name: 'Org A Stripe',
    });

    // Attempt to access it from org B — should fail
    await expect(
      service.getConnection({ orgId: orgB.id, connectionId: connA.connectionId })
    ).rejects.toThrow('INT_CONN_NOT_FOUND');
  });

  it('should handle webhook processing end-to-end', async () => {
    const endpoint = await service.registerWebhook({
      orgId: testOrg.id,
      connectionId: stripeConnectionId,
      events: ['payment_intent.succeeded'],
    });

    // Simulate a Stripe webhook
    const payload = JSON.stringify({
      id: 'evt_test_123',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_test_456', amount: 5000, currency: 'usd' } },
    });

    const signature = generateStripeSignature(payload, testWebhookSecret);

    const result = await webhookProcessor.receive({
      endpointId: endpoint.id,
      headers: { 'stripe-signature': signature },
      rawBody: payload,
      sourceIp: '127.0.0.1',
    });

    expect(result.status).toBe('received');
    expect(result.eventType).toBe('payment_intent.succeeded');

    // Verify the event was persisted
    const events = await service.listWebhookEvents({
      orgId: testOrg.id,
      endpointId: endpoint.id,
    });

    expect(events.events).toHaveLength(1);
    expect(events.events[0].providerEventId).toBe('evt_test_123');
  });
});
```

### Mock Adapters

For testing modules that depend on `@mcv/finance/integrations` without hitting real APIs:

```typescript
import type { ERPAdapter, PaymentGatewayAdapter, BankFeedProvider } from '@mcv/finance/integrations';

/**
 * Mock ERP adapter for testing. Returns predictable data
 * and records all calls for assertion.
 */
export class MockERPAdapter implements ERPAdapter {
  readonly provider = 'mock-erp';
  readonly displayName = 'Mock ERP';
  readonly capabilities = createMockCapabilities();

  // Call recording for assertions
  public calls: Array<{ method: string; params: any }> = [];

  // Configurable responses
  public mockData: Record<string, Record<string, unknown>[]> = {
    customers: [
      { id: 'CUST-001', name: 'Acme Corp', email: 'billing@acme.com' },
      { id: 'CUST-002', name: 'Globex Inc', email: 'ap@globex.com' },
    ],
    invoices: [
      { id: 'INV-001', customer: 'CUST-001', amount: 1000, status: 'open' },
      { id: 'INV-002', customer: 'CUST-002', amount: 2500, status: 'paid' },
    ],
  };

  async initialize() { this.calls.push({ method: 'initialize', params: {} }); }

  async testConnection() {
    this.calls.push({ method: 'testConnection', params: {} });
    return { success: true, latencyMs: 42 };
  }

  async fetch(params: { entityType: string; limit?: number }) {
    this.calls.push({ method: 'fetch', params });
    const records = this.mockData[params.entityType] ?? [];
    return { records, cursor: undefined, hasMore: false, totalCount: records.length };
  }

  async push(params: { entityType: string; records: any[]; mode: string }) {
    this.calls.push({ method: 'push', params });
    const externalIds: Record<string, string> = {};
    params.records.forEach((r, i) => { externalIds[i.toString()] = `EXT-${i}`; });
    return { created: params.records.length, updated: 0, failed: [], externalIds };
  }

  async delete(params: { entityType: string; externalIds: string[] }) {
    this.calls.push({ method: 'delete', params });
    return { deleted: params.externalIds.length, failed: [] };
  }

  async getSchema(entityType: string) {
    this.calls.push({ method: 'getSchema', params: { entityType } });
    return { fields: [], relationships: [] };
  }

  async disconnect() { this.calls.push({ method: 'disconnect', params: {} }); }

  // Test helpers
  reset() { this.calls = []; }
  getCallsFor(method: string) { return this.calls.filter(c => c.method === method); }
}

/**
 * Mock Payment Gateway for testing payment sync and reconciliation.
 */
export class MockPaymentGatewayAdapter implements PaymentGatewayAdapter {
  readonly provider = 'mock-gateway';
  readonly displayName = 'Mock Payment Gateway';

  public mockPayments: PaymentRecord[] = [
    {
      externalId: 'pay_001',
      amount: 5000,
      currency: 'usd',
      status: 'succeeded',
      paymentMethod: 'card',
      paymentMethodDetails: { brand: 'visa', last4: '4242' },
      fee: 175,
      netAmount: 4825,
      createdAt: new Date('2024-12-01'),
    },
    {
      externalId: 'pay_002',
      amount: 10000,
      currency: 'usd',
      status: 'succeeded',
      paymentMethod: 'bank_transfer',
      fee: 100,
      netAmount: 9900,
      createdAt: new Date('2024-12-15'),
    },
  ];

  async initialize() {}

  async fetchPayments(params: any) {
    let filtered = this.mockPayments;
    if (params.since) filtered = filtered.filter(p => p.createdAt >= params.since);
    if (params.status) filtered = filtered.filter(p => params.status.includes(p.status));
    return { payments: filtered, cursor: undefined, hasMore: false };
  }

  async fetchRefunds() { return { refunds: [], cursor: undefined, hasMore: false }; }
  async fetchSettlements() { return { settlements: [], cursor: undefined, hasMore: false }; }
  async getPayment(id: string) { return this.mockPayments.find(p => p.externalId === id) ?? null; }

  async reconcile(params: any) {
    return {
      matched: params.internalPayments.map((ip: any) => ({
        internalId: ip.id,
        externalId: ip.externalId,
      })),
      unmatchedInternal: [],
      unmatchedExternal: [],
      discrepancies: [],
    };
  }

  verifyWebhook() { return true; }
  async disconnect() {}
}

/**
 * Usage in consumer module tests:
 */
// In test setup:
providerRegistry.register('mock-erp', {
  metadata: { provider: 'mock-erp', displayName: 'Mock', type: 'erp', status: 'test' },
  factory: () => new MockERPAdapter(),
});

// In test:
const adapter = providerRegistry.get<MockERPAdapter>('mock-erp');
adapter.mockData.customers.push({ id: 'CUST-003', name: 'Test Co' });

await integrationService.sync({
  orgId: testOrg.id,
  connectionId: mockConnection.id,
  direction: 'pull',
  mode: 'full',
  entityTypes: ['customers'],
});

expect(adapter.getCallsFor('fetch')).toHaveLength(1);
```

---

*This module is part of the MCV.ONE Finance suite. For questions or contributions, see the [Finance Integration Guide](https://docs.mcv.one/guides/finance-integrations) or contact the Finance Team.*