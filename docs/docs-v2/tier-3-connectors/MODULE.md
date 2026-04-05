# @mcv/connectors — Connectors Module (Tier 3, PUBLISHABLE)

> **External service integrations — accounting software, email providers, GitHub, Google Workspace, OAuth, payment processors, payroll systems, domain registrars, social media, voice/telephony, and webhooks.**

**Package:** `@mcv/connectors`
**Tier:** 3 — External Integrations Layer
**Classification:** PUBLISHABLE
**Version:** 1.0.0
**Depends on:** `@mcv/shared` (Tier 2.5), `@mcv/fabric` (Tier 2), `@mcv/identity` (Tier 1)

---

## Overview

`@mcv/connectors` is the bridge between MCV.ONE and the outside world. Every external API call — whether sending an email, charging a credit card, posting a tweet, or syncing a ledger — flows through this module. It provides **provider-agnostic adapters** over 40+ third-party services, organized into 11 submodules covering the full spectrum of external integrations a multi-venture platform requires.

**Core Design Principles:**

1. **No direct API calls from business domains.** Tier 5 modules never import `stripe`, `twilio`, or `@sendgrid/mail` directly. All external communication is mediated by `@mcv/connectors`.
2. **Provider abstraction with automatic failover.** Each submodule declares a primary provider and zero or more fallbacks. If SendGrid is down, Postmark takes over transparently.
3. **Credential isolation per venture.** Every venture stores its own API keys in the System Vault (`@mcv/secrets`). No cross-venture credential leakage is possible.
4. **Unified webhook handling.** Inbound webhooks from all providers flow through a standardized pipeline: signature validation → payload parsing → event normalization → domain dispatch.
5. **Rate limiting and circuit breaking.** All outbound calls pass through per-provider rate limiters. Sustained failures trip circuit breakers before they cascade.

---

## Architecture Position

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TIER 5: BUSINESS DOMAINS                                                   │
│  @mcv/nexus  @mcv/commerce  @mcv/engagement  @mcv/growth  ...               │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ uses
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            @mcv/connectors                                   │
│                                                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │  email   │ │  voice   │ │payments │ │  oauth   │ │ github   │ │ google   │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│                                                                              │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐           │
│  │ social   │ │registrars│ │ payroll  │ │accounting│ │ webhooks  │           │
│  └─────────┘ └──────────┘ └─────────┘ └──────────┘ └──────────┘           │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ COMMON: ProviderRegistry │ CredentialLoader │ RateLimiter │ Errors  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ depends on
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  TIER 2.5: @mcv/shared  │  TIER 2: @mcv/fabric  │  TIER 1: @mcv/identity   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key architectural rule:** Data flows *down* (Tier 5 → Tier 3 → Tier 2/1), never *up*. Connectors depend on identity (ventures, users) and infrastructure (database, queues, secrets) but are unaware of business domain logic.

---

## Submodule Summary

| Submodule | Primary Provider(s) | Fallback(s) | Purpose |
|-----------|---------------------|-------------|---------|
| **accounting** | QuickBooks | Xero, FreshBooks | Chart of accounts sync, journal entries, invoice push/pull |
| **email** | SendGrid | Postmark, AWS SES | Transactional & marketing email, templates, deliverability |
| **github** | GitHub API v4/REST | — | Repo management, issues, PRs, Actions, webhook handling |
| **google** | Google APIs | — | Calendar, Drive, Sheets, Gmail, OAuth2 service accounts |
| **oauth** | — (framework) | — | OAuth2/OIDC provider abstraction, token lifecycle, PKCE |
| **payments** | Stripe | PayPal, Square | Payment intents, subscriptions, invoicing, refunds, disputes |
| **payroll** | Gusto | ADP, Deel | Salary sync, tax withholding, benefit deductions, pay stubs |
| **registrars** | Namecheap | Cloudflare, GoDaddy | Domain registration, DNS record management, WHOIS |
| **social** | Twitter/X, LinkedIn, Meta | — | Posting, scheduling, analytics, comment moderation, webhooks |
| **voice** | Twilio | Vonage (Plivo) | Voice calls, SMS, IVR trees, call recording, transcription |
| **webhooks** | — (framework) | — | Endpoint registration, payload signing, retry logic, delivery log |

---

## Connector Pattern (Unified Adapter Architecture)

All 11 submodules share the same structural DNA. Understanding this pattern once means understanding every connector.

### Provider Adapter Interface

Every external provider implements a common adapter contract:

```typescript
export interface ProviderAdapter<TConfig, TClient> {
  /** Unique provider name (e.g., 'sendgrid', 'stripe', 'twilio') */
  readonly name: string;

  /** Priority for failover ordering. Higher = preferred. */
  readonly priority: number;

  /** One-time initialization with provider config */
  initialize(config: TConfig): Promise<TClient>;

  /** Heartbeat check — is this provider reachable? */
  healthCheck(): Promise<boolean>;

  /** Get a venture-scoped client instance */
  getClient(ventureId: string): Promise<TClient>;
}
```

### Provider Registry

The registry manages multiple adapters, routes calls to the highest-priority healthy provider, and falls back automatically:

```typescript
export class ProviderRegistry<T extends ProviderAdapter<any, any>> {
  private providers: Map<string, T> = new Map();
  private primaryProvider: string | null = null;

  register(provider: T): void {
    this.providers.set(provider.name, provider);
    if (!this.primaryProvider || provider.priority > this.getProvider(this.primaryProvider)!.priority) {
      this.primaryProvider = provider.name;
    }
  }

  async execute<R>(
    ventureId: string,
    operation: (client: any) => Promise<R>
  ): Promise<R> {
    const sorted = [...this.providers.values()].sort((a, b) => b.priority - a.priority);

    let lastError: Error | null = null;
    for (const provider of sorted) {
      try {
        const client = await provider.getClient(ventureId);
        return await operation(client);
      } catch (error) {
        lastError = error as Error;
        // Log failure, continue to fallback
      }
    }
    throw lastError ?? new Error('No providers available');
  }
}
```

### Credential Management

All provider credentials are stored in the System Vault (`@mcv/secrets`) and referenced via the shared `integrations` table. No raw API keys are stored in application tables.

```typescript
export interface ConnectorCredentials {
  ventureId: string;
  provider: string;
  secretResourceName: string;   // Vault reference
  status: 'active' | 'suspended' | 'expired';
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export async function loadCredentials(
  ventureId: string,
  provider: string
): Promise<Record<string, string>> {
  const integration = await db.query.integrations.findFirst({
    where: and(
      eq(integrations.ventureId, ventureId),
      eq(integrations.provider, provider),
      eq(integrations.status, 'connected')
    )
  });

  if (!integration?.secretResourceName) {
    throw new ConnectorError('CREDENTIALS_NOT_FOUND',
      `No ${provider} credentials for venture`);
  }

  return JSON.parse(await secretManager.getSecret(integration.secretResourceName));
}
```

### Webhook Handler Interface

Every provider that sends webhooks implements this contract:

```typescript
export interface WebhookHandler<TPayload, TEvent> {
  readonly provider: string;
  readonly eventTypes: string[];

  /** Verify signature using provider-specific signing secret */
  validateSignature(req: Request, secret: string): Promise<boolean>;

  /** Parse raw request body into typed payload */
  parsePayload(req: Request): Promise<TPayload>;

  /** Normalize provider-specific payload into domain event */
  normalizeEvent(payload: TPayload): TEvent;

  /** Dispatch normalized event to business logic */
  handleEvent(event: TEvent, ventureId: string): Promise<void>;
}
```

### Rate Limiting

All outbound API calls pass through a per-provider, per-venture token bucket:

```typescript
export class ConnectorRateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();

  async acquire(provider: string, ventureId: string): Promise<void> {
    const key = `${provider}:${ventureId}`;
    const bucket = this.buckets.get(key) ?? this.createBucket(provider);
    await bucket.acquire();   // Blocks until a token is available
  }
}
```

Default limits (configurable per venture):

| Provider | Requests/sec | Burst |
|----------|-------------|-------|
| SendGrid | 100 | 200 |
| Stripe | 100 | 150 |
| Twilio | 100 | 200 |
| GitHub | 30 | 50 |
| Google | 10 | 25 |

### Error Normalization

Provider-specific errors are normalized into a common `ConnectorError` hierarchy:

```typescript
export class ConnectorError extends Error {
  constructor(
    public readonly code: string,          // e.g., 'RATE_LIMITED', 'AUTH_FAILED'
    message: string,
    public readonly provider?: string,
    public readonly retryable: boolean = false,
    public readonly retryAfterMs?: number
  ) {
    super(message);
  }
}

// Subclasses
export class RateLimitError extends ConnectorError { retryable = true; }
export class AuthenticationError extends ConnectorError { retryable = false; }
export class ProviderUnavailableError extends ConnectorError { retryable = true; }
export class ValidationError extends ConnectorError { retryable = false; }
```

---

## Shared Schema: Integrations Table

All connectors share a base table that tracks which providers are connected to which ventures:

```typescript
export const integrations = pgTable('integrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),

  // Provider identification
  provider: text('provider').notNull(),           // 'sendgrid', 'stripe', 'github', etc.
  providerAccountId: text('provider_account_id'), // External account ID

  // Credentials (vault reference)
  secretResourceName: text('secret_resource_name'),

  // Status
  status: integrationStatusEnum('status').notNull().default('pending'),
  statusMessage: text('status_message'),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),

  // Scopes and permissions
  scopes: jsonb('scopes').$type<string[]>().default([]),

  // Provider-specific metadata
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),

  // Webhook config
  webhookUrl: text('webhook_url'),
  webhookSecret: text('webhook_secret'),

  // Audit
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
});

export const integrationSyncLogs = pgTable('integration_sync_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  integrationId: uuid('integration_id').notNull().references(() => integrations.id, { onDelete: 'cascade' }),
  operation: text('operation').notNull(),     // 'sync', 'push', 'pull', 'webhook'
  status: text('status', { enum: ['success', 'partial', 'failed'] }).notNull(),
  recordsProcessed: integer('records_processed').default(0),
  recordsFailed: integer('records_failed').default(0),
  errorDetails: jsonb('error_details').$type<{ message: string; stack?: string }[]>(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
});
```

---

## Submodule Deep Dives

---

### 1. accounting — Accounting Software Integration

**Purpose:** Bidirectional synchronization with accounting platforms. Push invoices, pull chart of accounts, sync journal entries, reconcile bank transactions.

**Providers:**

| Provider | Priority | Capabilities |
|----------|----------|-------------|
| **QuickBooks Online** | 100 | Full GL sync, invoicing, expense tracking, bank feeds |
| **Xero** | 80 | Multi-currency, project tracking, payroll (AU/NZ/UK) |
| **FreshBooks** | 60 | Time tracking, proposals, simplified double-entry |

**Key Entities:**

- **Chart of Accounts** — Synced account tree (assets, liabilities, equity, revenue, expenses). Mapped between MCV's internal ledger and provider-specific account IDs.
- **Journal Entries** — Double-entry transactions pushed to the GL. Each entry has debit/credit lines, date, memo, and reference number.
- **Invoices** — Customer invoices created in MCV and synced to the accounting provider. Status updates (sent, viewed, paid, overdue) flow back via webhook.
- **Bills & Expenses** — Vendor bills and expense records pulled from the provider for reconciliation.
- **Tax Codes** — Tax rate mappings between MCV tax engine and provider tax codes.
- **Bank Transactions** — Bank feed data pulled for reconciliation with internal records.

**Schema Highlights:**

```typescript
export const accountingAccounts = pgTable('accounting_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  name: text('name').notNull(),
  code: text('code'),
  type: text('type').notNull(),              // 'asset', 'liability', 'equity', 'revenue', 'expense'
  subType: text('sub_type'),                 // 'bank', 'accounts_receivable', 'cogs', etc.
  currency: text('currency').default('USD'),
  currentBalance: integer('current_balance'),
  isActive: boolean('is_active').default(true),
  parentAccountId: uuid('parent_account_id'),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const accountingJournalEntries = pgTable('accounting_journal_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  provider: text('provider').notNull(),
  providerEntryId: text('provider_entry_id'),
  entryDate: timestamp('entry_date', { withTimezone: true }).notNull(),
  memo: text('memo'),
  referenceNumber: text('reference_number'),
  status: text('status', { enum: ['draft', 'posted', 'voided'] }).default('draft'),
  lines: jsonb('lines').$type<{
    accountId: string;
    description: string;
    debit: number;
    credit: number;
  }[]>().notNull(),
  totalDebit: integer('total_debit').notNull(),
  totalCredit: integer('total_credit').notNull(),
  syncStatus: text('sync_status', { enum: ['pending', 'synced', 'failed'] }).default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const accountingInvoices = pgTable('accounting_invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  provider: text('provider').notNull(),
  providerInvoiceId: text('provider_invoice_id'),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email'),
  invoiceNumber: text('invoice_number'),
  issueDate: timestamp('issue_date', { withTimezone: true }).notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  status: text('status', { enum: ['draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'voided'] }).default('draft'),
  subtotal: integer('subtotal').notNull(),
  taxAmount: integer('tax_amount').default(0),
  total: integer('total').notNull(),
  amountPaid: integer('amount_paid').default(0),
  currency: text('currency').default('USD'),
  lineItems: jsonb('line_items').$type<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    accountId?: string;
    taxCodeId?: string;
  }[]>().notNull(),
  syncStatus: text('sync_status', { enum: ['pending', 'synced', 'failed'] }).default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

**Service API:**

```typescript
export class AccountingService {
  // Chart of Accounts
  async syncChartOfAccounts(ventureId: string): Promise<SyncResult>;
  async getAccounts(ventureId: string, filters?: AccountFilters): Promise<AccountingAccount[]>;
  async mapAccount(ventureId: string, internalId: string, providerAccountId: string): Promise<void>;

  // Journal Entries
  async createJournalEntry(ventureId: string, input: CreateJournalEntryInput): Promise<JournalEntry>;
  async syncJournalEntry(ventureId: string, entryId: string): Promise<SyncResult>;
  async listJournalEntries(ventureId: string, dateRange: DateRange): Promise<JournalEntry[]>;

  // Invoices
  async pushInvoice(ventureId: string, invoiceId: string): Promise<SyncResult>;
  async pullInvoices(ventureId: string, since?: Date): Promise<SyncResult>;
  async getInvoiceStatus(ventureId: string, invoiceId: string): Promise<InvoiceStatus>;

  // Reconciliation
  async reconcileBankTransactions(ventureId: string, accountId: string): Promise<ReconciliationResult>;

  // Full sync
  async fullSync(ventureId: string): Promise<FullSyncResult>;
}
```

**tRPC Router:** `accountingRouter` — `syncAccounts`, `listAccounts`, `createJournalEntry`, `pushInvoice`, `pullInvoices`, `reconcile`, `getSyncStatus`

---

### 2. email — Email Delivery & Management

**Purpose:** Provider-agnostic email delivery with template rendering, domain verification, deliverability tracking, bounce handling, suppression lists, and campaign management.

**Providers:**

| Provider | Priority | Strengths |
|----------|----------|-----------|
| **SendGrid** | 100 | Full feature set, subuser isolation, marketing campaigns |
| **Postmark** | 80 | Excellent transactional deliverability, fast delivery |
| **AWS SES** | 60 | Cost-effective at scale, deep AWS integration |

**Key Entities:**

- **Email Domains** — Sending domains per venture with SPF, DKIM, DMARC verification status.
- **Email Templates** — Versioned templates with Handlebars-style variable interpolation. Supports HTML, MJML, and React Email source types.
- **Email Sends** — Log of every email sent. Tracks status through the full lifecycle: queued → sent → delivered → opened → clicked.
- **Email Events** — Granular event log from provider webhooks (opens, clicks, bounces, spam complaints).
- **Suppressions** — Per-venture suppression list (hard bounces, spam complaints, unsubscribes). Checked before every send.
- **Campaigns** — Bulk marketing sends with audience segmentation, A/B testing, throttling, and aggregate stats.

**Schema Highlights:**

```typescript
// Sending domains with DNS verification
export const emailDomains = pgTable('email_domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  domain: text('domain').notNull(),
  verified: boolean('verified').default(false),
  spfVerified: boolean('spf_verified').default(false),
  dkimVerified: boolean('dkim_verified').default(false),
  dmarcVerified: boolean('dmarc_verified').default(false),
  defaultFromEmail: text('default_from_email'),
  defaultFromName: text('default_from_name'),
  isDefault: boolean('is_default').default(false),
  // ...
});

// Complete send log
export const emailSends = pgTable('email_sends', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  provider: emailProviderEnum('provider').notNull(),
  providerMessageId: text('provider_message_id'),
  fromEmail: text('from_email').notNull(),
  toEmail: text('to_email').notNull(),
  subject: text('subject').notNull(),
  templateId: uuid('template_id'),
  status: emailStatusEnum('status').notNull().default('queued'),
  type: emailTypeEnum('type').notNull().default('transactional'),
  idempotencyKey: text('idempotency_key'),
  // ...
});

// Suppression list
export const emailSuppressions = pgTable('email_suppressions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  email: text('email').notNull(),
  type: bounceTypeEnum('type').notNull(),   // 'hard', 'soft', 'spam', 'unsubscribe'
  source: text('source').notNull(),         // 'bounce', 'complaint', 'unsubscribe', 'manual'
  isActive: boolean('is_active').default(true),
  // ...
});
```

**Service API:**

```typescript
export class EmailService {
  // Sending
  async send(ventureId: string, input: SendEmailInput): Promise<EmailResult>;
  async sendBulk(ventureId: string, input: SendBulkEmailInput): Promise<BulkEmailResult>;

  // Templates
  async createTemplate(ventureId: string, input: CreateTemplateInput): Promise<EmailTemplate>;
  async getTemplate(ventureId: string, slug: string): Promise<EmailTemplate | null>;
  async listTemplates(ventureId: string, filters?: TemplateFilters): Promise<EmailTemplate[]>;
  async updateTemplate(ventureId: string, id: string, input: UpdateTemplateInput): Promise<EmailTemplate>;

  // Domains
  async addDomain(ventureId: string, domain: string): Promise<EmailDomain>;
  async verifyDomain(ventureId: string, domainId: string): Promise<EmailDomain>;
  async getDefaultDomain(ventureId: string): Promise<EmailDomain | null>;

  // Suppressions
  async isEmailSuppressed(ventureId: string, email: string): Promise<boolean>;
  async addSuppression(ventureId: string, input: AddSuppressionInput): Promise<void>;
  async removeSuppression(ventureId: string, email: string, removedBy: string): Promise<void>;

  // Analytics
  async getAnalytics(ventureId: string, dateRange: DateRange): Promise<EmailAnalytics>;
}
```

**Send flow:** Check suppression list → resolve template → render variables → get default domain → create send record → execute via ProviderRegistry (with auto-failover) → update record with provider message ID → audit log.

**tRPC Router:** `emailRouter` — `send`, `sendBulk`, `listTemplates`, `getTemplate`, `createTemplate`, `updateTemplate`, `listDomains`, `addDomain`, `verifyDomain`, `checkSuppression`, `addSuppression`, `removeSuppression`, `getAnalytics`, `listSends`

---

### 3. github — GitHub API Integration

**Purpose:** Full GitHub integration for developer-facing ventures — repository management, issue tracking, pull request automation, GitHub Actions, and webhook event processing.

**Providers:**

| Provider | Priority | API |
|----------|----------|-----|
| **GitHub** | 100 | REST API v3 + GraphQL v4 |

**Key Entities:**

- **GitHub Installations** — GitHub App installations per venture. Tracks installation ID, permissions, and repository access.
- **Repositories** — Synced repo metadata (name, visibility, default branch, language stats).
- **Issues** — Issue tracking with label sync, assignee management, and milestone tracking.
- **Pull Requests** — PR lifecycle management — creation, review requests, status checks, merge.
- **Webhooks** — Inbound GitHub webhook events (push, PR, issue, release, etc.) with signature verification.
- **Actions** — GitHub Actions workflow triggers and status monitoring.

**Schema Highlights:**

```typescript
export const githubInstallations = pgTable('github_installations', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  installationId: integer('installation_id').notNull(),
  accountLogin: text('account_login').notNull(),
  accountType: text('account_type', { enum: ['User', 'Organization'] }).notNull(),
  permissions: jsonb('permissions').$type<Record<string, string>>(),
  repositorySelection: text('repository_selection', { enum: ['all', 'selected'] }),
  suspendedAt: timestamp('suspended_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const githubRepositories = pgTable('github_repositories', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  installationId: uuid('installation_id').references(() => githubInstallations.id),
  repoId: integer('repo_id').notNull(),          // GitHub numeric ID
  fullName: text('full_name').notNull(),           // 'owner/repo'
  name: text('name').notNull(),
  owner: text('owner').notNull(),
  visibility: text('visibility', { enum: ['public', 'private', 'internal'] }).notNull(),
  defaultBranch: text('default_branch').default('main'),
  language: text('language'),
  description: text('description'),
  htmlUrl: text('html_url'),
  lastPushAt: timestamp('last_push_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const githubPullRequests = pgTable('github_pull_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  repositoryId: uuid('repository_id').references(() => githubRepositories.id),
  prNumber: integer('pr_number').notNull(),
  title: text('title').notNull(),
  state: text('state', { enum: ['open', 'closed', 'merged'] }).notNull(),
  authorLogin: text('author_login'),
  baseBranch: text('base_branch').notNull(),
  headBranch: text('head_branch').notNull(),
  isDraft: boolean('is_draft').default(false),
  additions: integer('additions'),
  deletions: integer('deletions'),
  changedFiles: integer('changed_files'),
  mergedAt: timestamp('merged_at', { withTimezone: true }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const githubWebhookEvents = pgTable('github_webhook_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  eventType: text('event_type').notNull(),       // 'push', 'pull_request', 'issues', etc.
  action: text('action'),                         // 'opened', 'closed', 'synchronize', etc.
  deliveryId: text('delivery_id').notNull(),      // X-GitHub-Delivery header
  repositoryFullName: text('repository_full_name'),
  senderLogin: text('sender_login'),
  payload: jsonb('payload').$type<Record<string, unknown>>(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

**Service API:**

```typescript
export class GitHubService {
  // Installations
  async getInstallation(ventureId: string): Promise<GitHubInstallation>;
  async syncInstallation(ventureId: string): Promise<SyncResult>;

  // Repositories
  async listRepos(ventureId: string, filters?: RepoFilters): Promise<Repository[]>;
  async getRepo(ventureId: string, owner: string, repo: string): Promise<Repository>;
  async syncRepos(ventureId: string): Promise<SyncResult>;

  // Issues
  async createIssue(ventureId: string, repo: string, input: CreateIssueInput): Promise<Issue>;
  async updateIssue(ventureId: string, repo: string, issueNumber: number, input: UpdateIssueInput): Promise<Issue>;
  async listIssues(ventureId: string, repo: string, filters?: IssueFilters): Promise<Issue[]>;
  async addIssueComment(ventureId: string, repo: string, issueNumber: number, body: string): Promise<Comment>;

  // Pull Requests
  async createPR(ventureId: string, repo: string, input: CreatePRInput): Promise<PullRequest>;
  async mergePR(ventureId: string, repo: string, prNumber: number, method?: MergeMethod): Promise<MergeResult>;
  async requestReview(ventureId: string, repo: string, prNumber: number, reviewers: string[]): Promise<void>;
  async listPRs(ventureId: string, repo: string, filters?: PRFilters): Promise<PullRequest[]>;

  // Actions
  async triggerWorkflow(ventureId: string, repo: string, workflowId: string, ref: string, inputs?: Record<string, string>): Promise<void>;
  async getWorkflowRuns(ventureId: string, repo: string, workflowId: string): Promise<WorkflowRun[]>;

  // Webhooks
  async handleWebhook(ventureId: string, event: string, deliveryId: string, payload: unknown): Promise<void>;
}
```

**tRPC Router:** `githubRouter` — `listRepos`, `getRepo`, `syncRepos`, `createIssue`, `updateIssue`, `listIssues`, `createPR`, `mergePR`, `listPRs`, `triggerWorkflow`, `getWorkflowRuns`

---

### 4. google — Google Workspace Integration

**Purpose:** Google Workspace integration covering Calendar, Drive, Sheets, and Gmail. OAuth2 authorization flows, service account support, and real-time sync via Google Push Notifications.

**Providers:**

| Provider | Priority | APIs |
|----------|----------|------|
| **Google APIs** | 100 | Calendar API v3, Drive API v3, Sheets API v4, Gmail API v1 |

**Key Entities:**

- **Google Connections** — OAuth2 connections per user/venture. Stores access/refresh tokens, granted scopes, and token expiry.
- **Calendar Events** — Synced calendar events with bidirectional create/update/delete.
- **Drive Files** — File metadata and sharing permissions. Upload, download, and permission management.
- **Sheets** — Read/write access to Google Sheets data. Used for bulk data imports/exports.
- **Gmail** — Send emails through Gmail API, label management, thread reading (with user consent).

**Schema Highlights:**

```typescript
export const googleConnections = pgTable('google_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  userId: uuid('user_id').notNull(),
  googleAccountId: text('google_account_id').notNull(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  accessToken: text('access_token').notNull(),    // Encrypted in vault
  refreshToken: text('refresh_token'),             // Encrypted in vault
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
  scopes: jsonb('scopes').$type<string[]>().default([]),
  status: text('status', { enum: ['active', 'expired', 'revoked'] }).default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const googleCalendarEvents = pgTable('google_calendar_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  connectionId: uuid('connection_id').references(() => googleConnections.id),
  googleEventId: text('google_event_id').notNull(),
  calendarId: text('calendar_id').notNull(),       // 'primary' or specific calendar ID
  summary: text('summary'),
  description: text('description'),
  location: text('location'),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  isAllDay: boolean('is_all_day').default(false),
  status: text('status', { enum: ['confirmed', 'tentative', 'cancelled'] }).default('confirmed'),
  attendees: jsonb('attendees').$type<{ email: string; responseStatus: string }[]>(),
  recurrence: jsonb('recurrence').$type<string[]>(),
  htmlLink: text('html_link'),
  syncToken: text('sync_token'),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const googleDriveFiles = pgTable('google_drive_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  connectionId: uuid('connection_id').references(() => googleConnections.id),
  googleFileId: text('google_file_id').notNull(),
  name: text('name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: bigint('size', { mode: 'number' }),
  parentFolderId: text('parent_folder_id'),
  webViewLink: text('web_view_link'),
  iconLink: text('icon_link'),
  thumbnailLink: text('thumbnail_link'),
  owners: jsonb('owners').$type<{ email: string; displayName: string }[]>(),
  shared: boolean('shared').default(false),
  trashed: boolean('trashed').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

**Service API:**

```typescript
export class GoogleService {
  // OAuth
  async getAuthUrl(ventureId: string, userId: string, scopes: string[]): Promise<string>;
  async handleCallback(ventureId: string, userId: string, code: string): Promise<GoogleConnection>;
  async refreshToken(connectionId: string): Promise<void>;
  async revokeConnection(connectionId: string): Promise<void>;

  // Calendar
  async listCalendars(connectionId: string): Promise<Calendar[]>;
  async listEvents(connectionId: string, calendarId: string, timeRange: DateRange): Promise<CalendarEvent[]>;
  async createEvent(connectionId: string, calendarId: string, input: CreateEventInput): Promise<CalendarEvent>;
  async updateEvent(connectionId: string, eventId: string, input: UpdateEventInput): Promise<CalendarEvent>;
  async deleteEvent(connectionId: string, eventId: string): Promise<void>;
  async syncEvents(connectionId: string, calendarId: string): Promise<SyncResult>;

  // Drive
  async listFiles(connectionId: string, folderId?: string, query?: string): Promise<DriveFile[]>;
  async uploadFile(connectionId: string, input: UploadFileInput): Promise<DriveFile>;
  async downloadFile(connectionId: string, fileId: string): Promise<Buffer>;
  async shareFile(connectionId: string, fileId: string, email: string, role: ShareRole): Promise<void>;
  async createFolder(connectionId: string, name: string, parentId?: string): Promise<DriveFile>;

  // Sheets
  async readSheet(connectionId: string, spreadsheetId: string, range: string): Promise<any[][]>;
  async writeSheet(connectionId: string, spreadsheetId: string, range: string, values: any[][]): Promise<void>;
  async appendSheet(connectionId: string, spreadsheetId: string, range: string, values: any[][]): Promise<void>;
  async createSpreadsheet(connectionId: string, title: string): Promise<{ spreadsheetId: string; url: string }>;

  // Gmail
  async sendGmail(connectionId: string, input: SendGmailInput): Promise<{ messageId: string }>;
  async listThreads(connectionId: string, query?: string): Promise<GmailThread[]>;
  async getThread(connectionId: string, threadId: string): Promise<GmailThread>;
}
```

**tRPC Router:** `googleRouter` — `getAuthUrl`, `handleCallback`, `revokeConnection`, `listCalendars`, `listEvents`, `createEvent`, `updateEvent`, `deleteEvent`, `listFiles`, `uploadFile`, `shareFile`, `readSheet`, `writeSheet`, `sendGmail`

---

### 5. oauth — OAuth2/OIDC Provider Framework

**Purpose:** Generic OAuth2 and OpenID Connect provider framework. Used by `google`, `github`, `social`, and any connector that requires OAuth-based authentication. Manages authorization flows (code + PKCE), token storage, automatic refresh, and provider registration.

**This is not a connector itself** — it's the shared authentication infrastructure that other connectors build on.

**Key Entities:**

- **OAuth Providers** — Registered provider configurations (client ID, secret, authorization/token endpoints, scopes).
- **OAuth States** — CSRF-safe authorization state parameters with expiry.
- **OAuth Tokens** — Encrypted access/refresh token pairs with automatic refresh scheduling.
- **OAuth Sessions** — Tracks which user/venture has active tokens for which provider.

**Schema Highlights:**

```typescript
export const oauthProviders = pgTable('oauth_providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id'),               // null = global provider
  name: text('name').notNull(),                  // 'google', 'github', 'twitter', etc.
  displayName: text('display_name').notNull(),
  clientId: text('client_id').notNull(),
  clientSecretRef: text('client_secret_ref'),    // Vault reference
  authorizationUrl: text('authorization_url').notNull(),
  tokenUrl: text('token_url').notNull(),
  userInfoUrl: text('user_info_url'),
  revokeUrl: text('revoke_url'),
  jwksUri: text('jwks_uri'),                     // For OIDC ID token validation
  scopes: jsonb('scopes').$type<string[]>().default([]),
  pkceRequired: boolean('pkce_required').default(false),
  responseType: text('response_type').default('code'),
  additionalParams: jsonb('additional_params').$type<Record<string, string>>(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const oauthStates = pgTable('oauth_states', {
  id: uuid('id').primaryKey().defaultRandom(),
  state: text('state').notNull().unique(),
  codeVerifier: text('code_verifier'),            // PKCE
  ventureId: uuid('venture_id').notNull(),
  userId: uuid('user_id').notNull(),
  providerId: uuid('provider_id').references(() => oauthProviders.id),
  redirectUri: text('redirect_uri').notNull(),
  scopes: jsonb('scopes').$type<string[]>(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const oauthTokens = pgTable('oauth_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  userId: uuid('user_id').notNull(),
  providerId: uuid('provider_id').references(() => oauthProviders.id),
  providerAccountId: text('provider_account_id'),
  accessTokenRef: text('access_token_ref').notNull(),    // Vault reference
  refreshTokenRef: text('refresh_token_ref'),             // Vault reference
  tokenType: text('token_type').default('Bearer'),
  scopes: jsonb('scopes').$type<string[]>().default([]),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  lastRefreshedAt: timestamp('last_refreshed_at', { withTimezone: true }),
  status: text('status', { enum: ['active', 'expired', 'revoked'] }).default('active'),
  idTokenClaims: jsonb('id_token_claims').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

**Service API:**

```typescript
export class OAuthService {
  // Provider Registry
  async registerProvider(input: RegisterProviderInput): Promise<OAuthProvider>;
  async getProvider(name: string, ventureId?: string): Promise<OAuthProvider>;
  async listProviders(ventureId?: string): Promise<OAuthProvider[]>;

  // Authorization Flow
  async generateAuthUrl(ventureId: string, userId: string, providerName: string, options?: AuthUrlOptions): Promise<string>;
  async handleCallback(state: string, code: string): Promise<OAuthToken>;
  async validateState(state: string): Promise<OAuthState>;

  // Token Management
  async getToken(ventureId: string, userId: string, providerName: string): Promise<OAuthToken | null>;
  async refreshToken(tokenId: string): Promise<OAuthToken>;
  async revokeToken(tokenId: string): Promise<void>;
  async getValidAccessToken(ventureId: string, userId: string, providerName: string): Promise<string>;

  // Token refresh scheduler
  async scheduleRefresh(tokenId: string, expiresAt: Date): Promise<void>;
  async processExpiredTokens(): Promise<number>;  // Cron job
}
```

**Authorization flow:**
1. `generateAuthUrl()` — Creates state record, generates PKCE code verifier/challenge if required, builds authorization URL.
2. User redirected to provider → grants consent → redirected back with `code` + `state`.
3. `handleCallback()` — Validates state (CSRF protection), exchanges code for tokens, stores encrypted tokens in vault, returns token record.
4. Background scheduler monitors `expiresAt` and calls `refreshToken()` proactively.

**tRPC Router:** `oauthRouter` — `listProviders`, `getAuthUrl`, `handleCallback`, `getConnection`, `revokeConnection`, `listConnections`

---

### 6. payments — Payment Processing

**Purpose:** Full payment processing abstraction — payment intents, customers, subscriptions, invoicing, refunds, disputes, connected accounts (marketplace), and payouts. Stripe-first with PayPal and Square fallbacks.

**Providers:**

| Provider | Priority | Capabilities |
|----------|----------|-------------|
| **Stripe** | 100 | Cards, ACH, subscriptions, Connect, invoicing, disputes |
| **PayPal** | 80 | PayPal balance, Venmo, buyer protection |
| **Square** | 60 | POS integration, in-person payments |

**Key Entities:**

- **Payment Customers** — Provider-synced customer records linked to MCV users. Store provider customer IDs.
- **Payment Methods** — Cards, bank accounts, wallets. Last-4 digits stored locally; full details in provider's vault.
- **Payment Intents** — The core payment lifecycle object. Created → confirmed → captured/canceled.
- **Transactions** — Successful charges with amount, fee, net, and refund tracking.
- **Products & Prices** — Catalog synced with provider. One-time and recurring pricing with tiered/volume support.
- **Subscriptions** — Recurring billing with trial periods, proration, and pause/cancel support.
- **Invoices** — Generated invoices with line items, tax calculations, and PDF links.
- **Refunds** — Full or partial refunds with reason tracking and audit trail.
- **Disputes** — Chargeback/dispute management with evidence deadline tracking.
- **Connected Accounts** — Stripe Connect accounts for marketplace payments (standard/express/custom).
- **Payouts** — Payouts to connected accounts or bank accounts.

**Schema Highlights:**

```typescript
// Payment intents — the core object
export const paymentIntents = pgTable('payment_intents', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  customerId: uuid('customer_id'),
  provider: paymentProviderEnum('provider').notNull(),
  providerIntentId: text('provider_intent_id').notNull(),
  amount: integer('amount').notNull(),           // Smallest currency unit (cents)
  currency: text('currency').notNull().default('usd'),
  status: paymentIntentStatusEnum('status').notNull(),
  captureMethod: text('capture_method', { enum: ['automatic', 'manual'] }).default('automatic'),
  metadata: jsonb('metadata').$type<Record<string, string>>(),
  idempotencyKey: text('idempotency_key'),
  // ...
});

// Subscriptions
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  customerId: uuid('customer_id').notNull(),
  provider: paymentProviderEnum('provider').notNull(),
  providerSubscriptionId: text('provider_subscription_id').notNull(),
  status: subscriptionStatusEnum('status').notNull(),
  priceId: uuid('price_id'),
  quantity: integer('quantity').default(1),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  trialStart: timestamp('trial_start', { withTimezone: true }),
  trialEnd: timestamp('trial_end', { withTimezone: true }),
  // ...
});

// Connected accounts for marketplace
export const connectedAccounts = pgTable('connected_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  userId: uuid('user_id'),
  provider: paymentProviderEnum('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  type: text('type', { enum: ['standard', 'express', 'custom'] }).notNull(),
  chargesEnabled: boolean('charges_enabled').default(false),
  payoutsEnabled: boolean('payouts_enabled').default(false),
  currentlyDue: jsonb('currently_due').$type<string[]>(),
  // ...
});
```

**Service API:**

```typescript
export class PaymentsService {
  // Payment Intents
  async createPaymentIntent(ventureId: string, input: CreatePaymentIntentInput): Promise<PaymentIntentResult>;
  async confirmPaymentIntent(ventureId: string, intentId: string, paymentMethodId?: string): Promise<PaymentIntentResult>;
  async capturePaymentIntent(ventureId: string, intentId: string, amount?: number): Promise<PaymentIntentResult>;
  async cancelPaymentIntent(ventureId: string, intentId: string): Promise<void>;

  // Customers
  async createCustomer(ventureId: string, input: CreateCustomerInput): Promise<PaymentCustomer>;
  async getCustomer(ventureId: string, customerId: string): Promise<PaymentCustomer>;
  async updateCustomer(ventureId: string, customerId: string, input: UpdateCustomerInput): Promise<PaymentCustomer>;

  // Payment Methods
  async attachPaymentMethod(ventureId: string, customerId: string, methodId: string): Promise<PaymentMethod>;
  async detachPaymentMethod(ventureId: string, methodId: string): Promise<void>;
  async listPaymentMethods(ventureId: string, customerId: string): Promise<PaymentMethod[]>;

  // Subscriptions
  async createSubscription(ventureId: string, input: CreateSubscriptionInput): Promise<SubscriptionResult>;
  async cancelSubscription(ventureId: string, subscriptionId: string, immediately?: boolean): Promise<void>;
  async updateSubscription(ventureId: string, subscriptionId: string, input: UpdateSubscriptionInput): Promise<void>;
  async pauseSubscription(ventureId: string, subscriptionId: string): Promise<void>;
  async resumeSubscription(ventureId: string, subscriptionId: string): Promise<void>;

  // Refunds
  async createRefund(ventureId: string, input: CreateRefundInput): Promise<Refund>;

  // Disputes
  async getDispute(ventureId: string, disputeId: string): Promise<Dispute>;
  async submitEvidence(ventureId: string, disputeId: string, evidence: DisputeEvidence): Promise<void>;

  // Connected Accounts (Marketplace)
  async createConnectedAccount(ventureId: string, input: CreateConnectedAccountInput): Promise<ConnectedAccount>;
  async getOnboardingLink(ventureId: string, accountId: string): Promise<string>;
  async createTransfer(ventureId: string, input: CreateTransferInput): Promise<Transfer>;

  // Checkout Sessions
  async createCheckoutSession(ventureId: string, input: CreateCheckoutSessionInput): Promise<CheckoutSessionResult>;
}
```

**Payment flow:** Create intent (amount, currency, customer) → client-side confirmation (Stripe Elements / PayPal Button) → webhook confirms success → transaction record created → receipt email sent (via `email` submodule).

**tRPC Router:** `paymentsRouter` — `createPaymentIntent`, `confirmPayment`, `capturePayment`, `cancelPayment`, `createCustomer`, `createSubscription`, `cancelSubscription`, `createRefund`, `getDispute`, `submitEvidence`, `createCheckoutSession`, `createConnectedAccount`, `getOnboardingLink`

---

### 7. payroll — Payroll Provider Integration

**Purpose:** Payroll provider integration for ventures with employees or contractors. Synchronize employee data, salary information, tax withholdings, benefit deductions, and pay run history.

**Providers:**

| Provider | Priority | Capabilities |
|----------|----------|-------------|
| **Gusto** | 100 | US payroll, benefits, onboarding, compliance |
| **ADP** | 80 | Enterprise payroll, multi-country, extensive reporting |
| **Deel** | 60 | International contractors, EOR, crypto payouts |

**Key Entities:**

- **Payroll Connections** — Provider connections per venture with sync configuration.
- **Employees** — Synced employee records (name, email, department, employment type, hire date).
- **Compensations** — Salary/hourly rate records per employee with effective dates.
- **Pay Runs** — Payroll run history (pay period, gross/net/taxes/deductions, check date).
- **Tax Withholdings** — Federal, state, and local tax withholding configurations.
- **Benefits** — Benefit enrollments (health, dental, 401k, etc.) with deduction amounts.
- **Contractors** — Contractor records for 1099 reporting.

**Schema Highlights:**

```typescript
export const payrollEmployees = pgTable('payroll_employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  provider: text('provider').notNull(),
  providerEmployeeId: text('provider_employee_id').notNull(),
  userId: uuid('user_id'),                       // Link to MCV user
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email'),
  department: text('department'),
  jobTitle: text('job_title'),
  employmentType: text('employment_type', { enum: ['full_time', 'part_time', 'contractor', 'temporary'] }).notNull(),
  status: text('status', { enum: ['active', 'terminated', 'on_leave'] }).default('active'),
  hireDate: timestamp('hire_date', { withTimezone: true }),
  terminationDate: timestamp('termination_date', { withTimezone: true }),
  workLocation: text('work_location'),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const payrollPayRuns = pgTable('payroll_pay_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  provider: text('provider').notNull(),
  providerPayRunId: text('provider_pay_run_id'),
  payPeriodStart: timestamp('pay_period_start', { withTimezone: true }).notNull(),
  payPeriodEnd: timestamp('pay_period_end', { withTimezone: true }).notNull(),
  checkDate: timestamp('check_date', { withTimezone: true }).notNull(),
  status: text('status', { enum: ['draft', 'pending', 'processed', 'funded', 'completed', 'failed'] }).default('draft'),
  totalGross: integer('total_gross').notNull(),
  totalTaxes: integer('total_taxes').notNull(),
  totalDeductions: integer('total_deductions').notNull(),
  totalNet: integer('total_net').notNull(),
  employeeCount: integer('employee_count').notNull(),
  lineItems: jsonb('line_items').$type<{
    employeeId: string;
    grossPay: number;
    federalTax: number;
    stateTax: number;
    localTax: number;
    socialSecurity: number;
    medicare: number;
    benefitDeductions: number;
    otherDeductions: number;
    netPay: number;
  }[]>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const payrollBenefits = pgTable('payroll_benefits', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  provider: text('provider').notNull(),
  employeeId: uuid('employee_id').references(() => payrollEmployees.id),
  benefitType: text('benefit_type', { enum: ['health', 'dental', 'vision', '401k', 'hsa', 'fsa', 'life', 'disability', 'commuter', 'other'] }).notNull(),
  planName: text('plan_name'),
  coverageTier: text('coverage_tier'),           // 'employee', 'employee+spouse', 'family'
  employeeDeduction: integer('employee_deduction'),
  employerContribution: integer('employer_contribution'),
  frequency: text('frequency', { enum: ['per_paycheck', 'monthly', 'annual'] }).default('per_paycheck'),
  effectiveDate: timestamp('effective_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  status: text('status', { enum: ['active', 'pending', 'terminated'] }).default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

**Service API:**

```typescript
export class PayrollService {
  // Employees
  async syncEmployees(ventureId: string): Promise<SyncResult>;
  async listEmployees(ventureId: string, filters?: EmployeeFilters): Promise<PayrollEmployee[]>;
  async getEmployee(ventureId: string, employeeId: string): Promise<PayrollEmployee>;

  // Compensations
  async getCompensation(ventureId: string, employeeId: string): Promise<Compensation>;
  async listCompensations(ventureId: string): Promise<Compensation[]>;

  // Pay Runs
  async syncPayRuns(ventureId: string, dateRange?: DateRange): Promise<SyncResult>;
  async listPayRuns(ventureId: string, dateRange?: DateRange): Promise<PayRun[]>;
  async getPayRunDetails(ventureId: string, payRunId: string): Promise<PayRunDetails>;

  // Tax Withholdings
  async getTaxWithholdings(ventureId: string, employeeId: string): Promise<TaxWithholdings>;

  // Benefits
  async syncBenefits(ventureId: string): Promise<SyncResult>;
  async listBenefits(ventureId: string, employeeId?: string): Promise<Benefit[]>;

  // Payroll Totals
  async getPayrollSummary(ventureId: string, dateRange: DateRange): Promise<PayrollSummary>;

  // Full sync
  async fullSync(ventureId: string): Promise<FullSyncResult>;
}
```

**tRPC Router:** `payrollRouter` — `syncEmployees`, `listEmployees`, `getEmployee`, `syncPayRuns`, `listPayRuns`, `getPayRunDetails`, `syncBenefits`, `listBenefits`, `getPayrollSummary`

---

### 8. registrars — Domain Registrar Integration

**Purpose:** Domain registration, renewal, transfer, and DNS record management across multiple registrars. Powers the venture white-labeling and custom domain features.

**Providers:**

| Provider | Priority | Capabilities |
|----------|----------|-------------|
| **Namecheap** | 100 | Domain registration, DNS, WHOIS privacy |
| **Cloudflare** | 80 | At-cost domains, DNS, SSL, CDN integration |
| **GoDaddy** | 60 | Largest registrar, wide TLD support |

**Key Entities:**

- **Domains** — Registered domain records with registrar, registration/expiry dates, auto-renew status, lock status, and WHOIS privacy.
- **DNS Records** — A, AAAA, CNAME, MX, TXT, SRV, NS records per domain with TTL and proxy settings.
- **Domain Transfers** — Transfer-in/out workflow with auth code management and status tracking.
- **SSL Certificates** — Certificate provisioning status (often via Cloudflare or Let's Encrypt).

**Schema Highlights:**

```typescript
export const domains = pgTable('domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  provider: text('provider').notNull(),
  providerDomainId: text('provider_domain_id'),
  domainName: text('domain_name').notNull(),
  tld: text('tld').notNull(),                     // 'com', 'io', 'app', etc.
  registrationDate: timestamp('registration_date', { withTimezone: true }),
  expirationDate: timestamp('expiration_date', { withTimezone: true }),
  autoRenew: boolean('auto_renew').default(true),
  locked: boolean('locked').default(true),
  whoisPrivacy: boolean('whois_privacy').default(true),
  nameservers: jsonb('nameservers').$type<string[]>(),
  status: text('status', {
    enum: ['active', 'pending', 'expired', 'redemption', 'transferring', 'suspended']
  }).default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const dnsRecords = pgTable('dns_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  domainId: uuid('domain_id').notNull().references(() => domains.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  providerRecordId: text('provider_record_id'),
  type: text('type', {
    enum: ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV', 'NS', 'CAA', 'ALIAS']
  }).notNull(),
  name: text('name').notNull(),                    // '@', 'www', 'mail', etc.
  value: text('value').notNull(),
  ttl: integer('ttl').default(3600),
  priority: integer('priority'),                    // For MX records
  proxied: boolean('proxied').default(false),       // Cloudflare proxy
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const domainTransfers = pgTable('domain_transfers', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  domainId: uuid('domain_id').references(() => domains.id),
  direction: text('direction', { enum: ['in', 'out'] }).notNull(),
  fromProvider: text('from_provider'),
  toProvider: text('to_provider'),
  authCode: text('auth_code'),                     // Encrypted
  status: text('status', {
    enum: ['pending', 'initiated', 'in_progress', 'completed', 'failed', 'cancelled']
  }).default('pending'),
  initiatedAt: timestamp('initiated_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

**Service API:**

```typescript
export class RegistrarService {
  // Domain Registration
  async checkAvailability(domain: string): Promise<DomainAvailability>;
  async searchDomains(query: string, tlds?: string[]): Promise<DomainSuggestion[]>;
  async registerDomain(ventureId: string, domain: string, options?: RegisterOptions): Promise<Domain>;
  async renewDomain(ventureId: string, domainId: string, years?: number): Promise<Domain>;
  async getDomain(ventureId: string, domainId: string): Promise<Domain>;
  async listDomains(ventureId: string): Promise<Domain[]>;

  // DNS Management
  async listDnsRecords(ventureId: string, domainId: string): Promise<DnsRecord[]>;
  async createDnsRecord(ventureId: string, domainId: string, input: CreateDnsRecordInput): Promise<DnsRecord>;
  async updateDnsRecord(ventureId: string, recordId: string, input: UpdateDnsRecordInput): Promise<DnsRecord>;
  async deleteDnsRecord(ventureId: string, recordId: string): Promise<void>;

  // Transfers
  async initiateTransferIn(ventureId: string, domain: string, authCode: string): Promise<DomainTransfer>;
  async getTransferStatus(ventureId: string, transferId: string): Promise<DomainTransfer>;
  async cancelTransfer(ventureId: string, transferId: string): Promise<void>;

  // WHOIS
  async getWhoisInfo(domain: string): Promise<WhoisInfo>;
  async toggleWhoisPrivacy(ventureId: string, domainId: string, enabled: boolean): Promise<void>;

  // Nameservers
  async updateNameservers(ventureId: string, domainId: string, nameservers: string[]): Promise<void>;

  // Domain lock
  async setDomainLock(ventureId: string, domainId: string, locked: boolean): Promise<void>;
}
```

**tRPC Router:** `registrarsRouter` — `checkAvailability`, `searchDomains`, `registerDomain`, `renewDomain`, `listDomains`, `getDomain`, `listDnsRecords`, `createDnsRecord`, `updateDnsRecord`, `deleteDnsRecord`, `initiateTransfer`, `getTransferStatus`, `updateNameservers`

---

### 9. social — Social Media Integration

**Purpose:** Unified social media API integration for content publishing, scheduling, analytics, comment management, and webhook-based notifications across all major platforms.

**Providers:**

| Provider | Priority | APIs |
|----------|----------|------|
| **Twitter/X** | 100 | API v2, OAuth 2.0 PKCE |
| **LinkedIn** | 90 | Marketing API, OpenID Connect |
| **Meta (Facebook/Instagram)** | 90 | Graph API v18, Instagram Basic Display |
| **TikTok** | 70 | Content Posting API, Login Kit |

**Key Entities:**

- **Social Accounts** — Connected social media accounts per venture with OAuth tokens and profile metadata.
- **Social Posts** — Published or scheduled posts with per-platform content variants (character limits, media formats).
- **Social Media** — Uploaded images/videos with platform-specific processing status.
- **Social Analytics** — Engagement metrics (impressions, reach, likes, comments, shares, clicks) per post and aggregate.
- **Social Comments** — Inbound comments/mentions synced from platforms for moderation.
- **Social Webhooks** — Platform webhook subscriptions and event processing.

**Schema Highlights:**

```typescript
export const socialAccounts = pgTable('social_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  platform: text('platform', {
    enum: ['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok']
  }).notNull(),
  accountId: text('account_id').notNull(),         // Platform-specific account ID
  username: text('username'),
  displayName: text('display_name'),
  profileImageUrl: text('profile_image_url'),
  followerCount: integer('follower_count'),
  oauthTokenId: uuid('oauth_token_id'),            // Reference to oauth.oauthTokens
  permissions: jsonb('permissions').$type<string[]>(),
  status: text('status', { enum: ['active', 'expired', 'revoked', 'suspended'] }).default('active'),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const socialPosts = pgTable('social_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  socialAccountId: uuid('social_account_id').references(() => socialAccounts.id),
  platform: text('platform').notNull(),
  platformPostId: text('platform_post_id'),        // Set after publishing
  content: text('content').notNull(),
  contentVariants: jsonb('content_variants').$type<Record<string, string>>(),
  mediaIds: jsonb('media_ids').$type<string[]>().default([]),
  hashtags: jsonb('hashtags').$type<string[]>().default([]),
  mentions: jsonb('mentions').$type<string[]>().default([]),
  link: text('link'),
  status: text('status', {
    enum: ['draft', 'scheduled', 'publishing', 'published', 'failed', 'deleted']
  }).default('draft'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  errorMessage: text('error_message'),
  // Engagement metrics (updated via sync)
  impressions: integer('impressions').default(0),
  reach: integer('reach').default(0),
  likes: integer('likes').default(0),
  comments: integer('comments').default(0),
  shares: integer('shares').default(0),
  clicks: integer('clicks').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
});

export const socialComments = pgTable('social_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  postId: uuid('post_id').references(() => socialPosts.id),
  platform: text('platform').notNull(),
  platformCommentId: text('platform_comment_id').notNull(),
  authorName: text('author_name'),
  authorUsername: text('author_username'),
  authorProfileUrl: text('author_profile_url'),
  content: text('content').notNull(),
  parentCommentId: uuid('parent_comment_id'),      // For threaded replies
  sentiment: text('sentiment', { enum: ['positive', 'neutral', 'negative'] }),
  isHidden: boolean('is_hidden').default(false),
  repliedAt: timestamp('replied_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

**Service API:**

```typescript
export class SocialService {
  // Accounts
  async connectAccount(ventureId: string, platform: string): Promise<string>;   // Returns OAuth URL
  async disconnectAccount(ventureId: string, accountId: string): Promise<void>;
  async listAccounts(ventureId: string): Promise<SocialAccount[]>;
  async syncAccountMetrics(ventureId: string, accountId: string): Promise<void>;

  // Publishing
  async createPost(ventureId: string, input: CreatePostInput): Promise<SocialPost>;
  async publishPost(ventureId: string, postId: string): Promise<SocialPost>;
  async schedulePost(ventureId: string, postId: string, scheduledAt: Date): Promise<SocialPost>;
  async deletePost(ventureId: string, postId: string): Promise<void>;
  async crossPost(ventureId: string, input: CrossPostInput): Promise<SocialPost[]>;

  // Media
  async uploadMedia(ventureId: string, platform: string, file: Buffer, mimeType: string): Promise<SocialMedia>;

  // Analytics
  async getPostAnalytics(ventureId: string, postId: string): Promise<PostAnalytics>;
  async getAccountAnalytics(ventureId: string, accountId: string, dateRange: DateRange): Promise<AccountAnalytics>;
  async getAggregateAnalytics(ventureId: string, dateRange: DateRange): Promise<AggregateAnalytics>;

  // Comments
  async listComments(ventureId: string, postId: string): Promise<SocialComment[]>;
  async replyToComment(ventureId: string, commentId: string, content: string): Promise<SocialComment>;
  async hideComment(ventureId: string, commentId: string): Promise<void>;
  async syncComments(ventureId: string, postId: string): Promise<SyncResult>;

  // Scheduled publishing (cron)
  async processScheduledPosts(): Promise<number>;
  async syncPostMetrics(): Promise<number>;
}
```

**tRPC Router:** `socialRouter` — `connectAccount`, `disconnectAccount`, `listAccounts`, `createPost`, `publishPost`, `schedulePost`, `deletePost`, `crossPost`, `getPostAnalytics`, `getAccountAnalytics`, `listComments`, `replyToComment`, `hideComment`

---

### 10. voice — VoIP & Telephony

**Purpose:** Voice and SMS communications with IVR tree support, call recording, transcription, and conversation threading. Powers the platform's telephony features — customer support lines, automated dialers, SMS marketing, and 2FA.

**Providers:**

| Provider | Priority | Capabilities |
|----------|----------|-------------|
| **Twilio** | 100 | Voice, SMS, IVR, Flex, Verify, recording, transcription |
| **Vonage (Plivo)** | 80 | Cost-effective voice/SMS, number insight |

**Key Entities:**

- **Voice Accounts** — Provider sub-accounts per venture with webhook URLs and usage limits.
- **Phone Numbers** — Purchased phone numbers with capabilities (SMS, MMS, voice, fax), type (local/mobile/tollfree/shortcode), and IVR assignment.
- **Calls** — Call records with direction, status, timing, recording, transcription, and IVR path taken.
- **SMS Messages** — Inbound and outbound SMS with conversation threading, segment counting, and MMS media URLs.
- **IVR Trees** — Visual IVR builder data model with menu nodes, gather inputs, say/play actions, dial, voicemail, transfer, and hangup.
- **Recordings** — Call recordings with optional transcription and configurable retention.
- **Conversations** — SMS conversation threads grouping messages by participant number.

**Schema Highlights:**

```typescript
// Phone numbers with capabilities
export const phoneNumbers = pgTable('phone_numbers', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  provider: voiceProviderEnum('provider').notNull(),
  phoneNumber: text('phone_number').notNull(),     // E.164 format
  type: phoneNumberTypeEnum('type').notNull(),     // local, mobile, tollfree, shortcode
  country: text('country').notNull(),
  canSms: boolean('can_sms').default(false),
  canVoice: boolean('can_voice').default(false),
  canMms: boolean('can_mms').default(false),
  status: phoneNumberStatusEnum('status').default('active'),
  ivrTreeId: uuid('ivr_tree_id'),
  monthlyCost: integer('monthly_cost'),            // Cents
  // ...
});

// IVR tree — visual call flow builder
export const ivrTrees = pgTable('ivr_trees', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  name: text('name').notNull(),
  entryNodeId: text('entry_node_id').notNull(),
  nodes: jsonb('nodes').$type<IvrNode[]>().notNull(),
  isActive: boolean('is_active').default(true),
  version: integer('version').default(1),
  // ...
});

// IVR node types: menu, gather, say, play, dial, voicemail, transfer, hangup, goto
export interface IvrNode {
  id: string;
  type: 'menu' | 'gather' | 'say' | 'play' | 'dial' | 'voicemail' | 'transfer' | 'hangup' | 'goto';
  text?: string;
  voice?: string;
  audioUrl?: string;
  inputType?: 'dtmf' | 'speech' | 'dtmf speech';
  numDigits?: number;
  options?: Record<string, string>;    // DTMF digit → next node ID
  dialNumber?: string;
  transferTo?: string;
  transferType?: 'warm' | 'cold';
  nextNodeId?: string;
  fallbackNodeId?: string;
}

// Call records with full lifecycle
export const calls = pgTable('calls', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  provider: voiceProviderEnum('provider').notNull(),
  direction: callDirectionEnum('direction').notNull(),
  status: callStatusEnum('status').notNull(),
  fromNumber: text('from_number').notNull(),
  toNumber: text('to_number').notNull(),
  duration: integer('duration'),                    // Seconds
  recordingEnabled: boolean('recording_enabled').default(false),
  recordingUrl: text('recording_url'),
  transcriptionText: text('transcription_text'),
  ivrPath: jsonb('ivr_path').$type<{ nodeId: string; input: string }[]>(),
  price: text('price'),
  // ...
});

// SMS conversations
export const voiceConversations = pgTable('voice_conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  phoneNumberId: uuid('phone_number_id'),
  participantNumber: text('participant_number').notNull(),
  contactId: uuid('contact_id'),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
  unreadCount: integer('unread_count').default(0),
  status: text('status', { enum: ['active', 'archived', 'blocked'] }).default('active'),
  // ...
});
```

**Service API:**

```typescript
export class VoiceService {
  // Calls
  async initiateCall(ventureId: string, input: InitiateCallInput): Promise<CallResult>;
  async endCall(ventureId: string, callId: string): Promise<void>;
  async transferCall(ventureId: string, callId: string, input: TransferCallInput): Promise<void>;
  async generateTwiml(ventureId: string, actions: TwimlAction[]): Promise<string>;

  // SMS
  async sendSms(ventureId: string, input: SendSmsInput): Promise<SmsResult>;
  async sendBulkSms(ventureId: string, input: BulkSmsInput): Promise<BulkSmsResult>;

  // Phone Numbers
  async searchAvailableNumbers(ventureId: string, input: SearchNumbersInput): Promise<AvailableNumber[]>;
  async purchaseNumber(ventureId: string, phoneNumber: string): Promise<PhoneNumber>;
  async releaseNumber(ventureId: string, phoneNumberId: string): Promise<void>;

  // IVR
  async createIvrTree(ventureId: string, input: CreateIvrTreeInput): Promise<IvrTree>;
  async executeIvrNode(ventureId: string, treeId: string, nodeId: string, input?: string): Promise<{ twiml: string }>;

  // Recordings
  async getRecording(ventureId: string, recordingId: string): Promise<Recording>;
  async transcribeRecording(ventureId: string, recordingId: string): Promise<string>;
  async deleteRecording(ventureId: string, recordingId: string): Promise<void>;

  // Conversations
  async listConversations(ventureId: string, filters?: ConversationFilters): Promise<Conversation[]>;
  async getConversation(ventureId: string, conversationId: string): Promise<ConversationWithMessages>;
}
```

**IVR execution flow:** Inbound call hits phone number → lookup assigned IVR tree → execute entry node → generate TwiML → Twilio renders voice prompt → user presses DTMF digit → callback hits next node → repeat until hangup/transfer/voicemail.

**tRPC Router:** `voiceRouter` — `initiateCall`, `endCall`, `transferCall`, `sendSms`, `sendBulkSms`, `searchNumbers`, `purchaseNumber`, `releaseNumber`, `createIvrTree`, `listIvrTrees`, `getRecording`, `transcribeRecording`, `listConversations`, `getConversation`, `listCalls`, `listMessages`

---

### 11. webhooks — Generic Webhook Framework

**Purpose:** Infrastructure-level webhook management for both inbound (receiving from external providers) and outbound (sending to customer endpoints). Provides endpoint registration, payload signing (HMAC-SHA256), delivery with exponential backoff retry, and a complete delivery log.

**This submodule serves two roles:**
1. **Inbound dispatcher** — Routes incoming webhooks from all provider submodules through signature validation, parsing, normalization, and domain event dispatch.
2. **Outbound framework** — Lets ventures register webhook endpoints to receive platform events (e.g., "payment.succeeded", "order.created").

**Key Entities:**

- **Webhook Endpoints** — Customer-registered HTTPS endpoints with event subscriptions, signing secrets, and status.
- **Webhook Events** — Outbound event records with typed payload and delivery status.
- **Webhook Deliveries** — Individual delivery attempts with HTTP status, response body, latency, and retry scheduling.
- **Webhook Signing Secrets** — Per-endpoint HMAC secrets for payload signing.
- **Inbound Webhook Logs** — Log of all inbound provider webhooks received and processed.

**Schema Highlights:**

```typescript
export const webhookEndpoints = pgTable('webhook_endpoints', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  url: text('url').notNull(),
  description: text('description'),
  signingSecretRef: text('signing_secret_ref').notNull(),  // Vault reference
  events: jsonb('events').$type<string[]>().notNull(),     // ['payment.succeeded', 'order.created', '*']
  status: text('status', { enum: ['active', 'disabled', 'failing'] }).default('active'),
  apiVersion: text('api_version'),
  metadata: jsonb('metadata').$type<Record<string, string>>(),
  // Health tracking
  lastDeliveredAt: timestamp('last_delivered_at', { withTimezone: true }),
  lastFailedAt: timestamp('last_failed_at', { withTimezone: true }),
  consecutiveFailures: integer('consecutive_failures').default(0),
  disabledReason: text('disabled_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
});

export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  eventType: text('event_type').notNull(),         // 'payment.succeeded'
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  apiVersion: text('api_version'),
  idempotencyKey: text('idempotency_key'),
  // Delivery status
  totalEndpoints: integer('total_endpoints').default(0),
  totalDelivered: integer('total_delivered').default(0),
  totalFailed: integer('total_failed').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => webhookEvents.id),
  endpointId: uuid('endpoint_id').notNull().references(() => webhookEndpoints.id),
  // Delivery details
  status: text('status', { enum: ['pending', 'success', 'failed', 'exhausted'] }).default('pending'),
  httpStatusCode: integer('http_status_code'),
  responseBody: text('response_body'),
  responseHeaders: jsonb('response_headers').$type<Record<string, string>>(),
  latencyMs: integer('latency_ms'),
  // Retry logic
  attemptNumber: integer('attempt_number').default(1),
  maxAttempts: integer('max_attempts').default(5),
  nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
  // Error
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const inboundWebhookLogs = pgTable('inbound_webhook_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id'),
  provider: text('provider').notNull(),
  eventType: text('event_type'),
  signatureValid: boolean('signature_valid'),
  payload: jsonb('payload').$type<Record<string, unknown>>(),
  headers: jsonb('headers').$type<Record<string, string>>(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  processingError: text('processing_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

**Service API:**

```typescript
export class WebhookService {
  // Endpoint Management
  async createEndpoint(ventureId: string, input: CreateEndpointInput): Promise<WebhookEndpoint>;
  async updateEndpoint(ventureId: string, endpointId: string, input: UpdateEndpointInput): Promise<WebhookEndpoint>;
  async deleteEndpoint(ventureId: string, endpointId: string): Promise<void>;
  async listEndpoints(ventureId: string): Promise<WebhookEndpoint[]>;
  async rotateSigningSecret(ventureId: string, endpointId: string): Promise<{ secret: string }>;
  async testEndpoint(ventureId: string, endpointId: string): Promise<TestResult>;

  // Event Dispatching
  async dispatchEvent(ventureId: string, eventType: string, payload: unknown): Promise<WebhookEvent>;
  async replayEvent(ventureId: string, eventId: string): Promise<void>;

  // Delivery Management
  async getDeliveries(ventureId: string, eventId: string): Promise<WebhookDelivery[]>;
  async retryDelivery(ventureId: string, deliveryId: string): Promise<void>;

  // Inbound Processing
  async processInbound(provider: string, req: Request): Promise<void>;

  // Background Jobs
  async processRetries(): Promise<number>;                          // Cron: every minute
  async disableFailingEndpoints(threshold?: number): Promise<number>; // Cron: every hour
  async cleanupOldDeliveries(retentionDays?: number): Promise<number>; // Cron: daily
}
```

**Outbound signing flow:**
1. Event dispatched → matched against endpoint subscriptions.
2. For each matching endpoint: serialize payload → compute HMAC-SHA256 with endpoint's signing secret → set `X-Webhook-Signature` header.
3. POST to endpoint URL with 5-second timeout.
4. 2xx = success. 4xx/5xx = schedule retry with exponential backoff (30s, 2m, 15m, 1h, 4h).
5. After 5 consecutive failures, endpoint auto-disabled with notification.

**Retry schedule:** `[30s, 2min, 15min, 1hr, 4hr]` — configurable per endpoint.

**tRPC Router:** `webhooksRouter` — `createEndpoint`, `updateEndpoint`, `deleteEndpoint`, `listEndpoints`, `rotateSecret`, `testEndpoint`, `listEvents`, `getEvent`, `getDeliveries`, `retryDelivery`, `replayEvent`

---

## Cross-Module Integration

### How Business Domains Use Connectors

```typescript
// @mcv/commerce (Tier 5) uses @mcv/connectors/payments
import { paymentsService } from '@mcv/connectors/payments';

async function processCheckout(ventureId: string, cart: Cart) {
  const intent = await paymentsService.createPaymentIntent(ventureId, {
    amount: cart.total,
    currency: cart.currency,
    customerId: cart.customerId,
    metadata: { orderId: cart.orderId },
  });
  return intent.clientSecret;  // Sent to frontend for Stripe Elements
}

// @mcv/engagement (Tier 5) uses @mcv/connectors/email
import { emailService } from '@mcv/connectors/email';

async function sendWelcomeEmail(ventureId: string, user: User) {
  await emailService.send(ventureId, {
    to: user.email,
    templateSlug: 'welcome',
    variables: { firstName: user.firstName, loginUrl: '...' },
    type: 'transactional',
  });
}

// @mcv/nexus (Tier 5) uses @mcv/connectors/webhooks
import { webhookService } from '@mcv/connectors/webhooks';

async function onOrderCreated(ventureId: string, order: Order) {
  await webhookService.dispatchEvent(ventureId, 'order.created', {
    id: order.id,
    total: order.total,
    items: order.items.length,
    createdAt: order.createdAt,
  });
}
```

### Inter-Connector Dependencies

```
oauth ◄──── google, github, social   (OAuth2 token management)
email ◄──── payments, payroll         (Receipts, pay stubs)
webhooks ◄── payments, github, social (Inbound webhook processing)
```

- **`oauth`** is the foundation — `google`, `github`, and `social` all delegate token management to the OAuth submodule.
- **`email`** is the notification channel — `payments` sends receipts, `payroll` sends pay stubs.
- **`webhooks`** processes inbound events from all providers and dispatches outbound events to customer endpoints.

---

## Exported Interfaces

```typescript
// @mcv/connectors/index.ts — Public API surface

// Services (singletons)
export { emailService } from './email/services/email.service';
export { voiceService } from './voice/services/voice.service';
export { paymentsService } from './payments/services/payments.service';
export { oauthService } from './oauth/services/oauth.service';
export { githubService } from './github/services/github.service';
export { googleService } from './google/services/google.service';
export { socialService } from './social/services/social.service';
export { registrarService } from './registrars/services/registrar.service';
export { payrollService } from './payroll/services/payroll.service';
export { accountingService } from './accounting/services/accounting.service';
export { webhookService } from './webhooks/services/webhook.service';

// tRPC Routers
export { emailRouter } from './email/router';
export { voiceRouter } from './voice/router';
export { paymentsRouter } from './payments/router';
export { oauthRouter } from './oauth/router';
export { githubRouter } from './github/router';
export { googleRouter } from './google/router';
export { socialRouter } from './social/router';
export { registrarsRouter } from './registrars/router';
export { payrollRouter } from './payroll/router';
export { accountingRouter } from './accounting/router';
export { webhooksRouter } from './webhooks/router';

// Common patterns
export { ProviderRegistry } from './common/provider-registry';
export { ConnectorError, RateLimitError, AuthenticationError } from './common/errors';
export { loadCredentials } from './common/credentials';
export { ConnectorRateLimiter } from './common/rate-limiter';

// Shared schema
export { integrations, integrationSyncLogs } from './schema/integrations';

// Types
export type { ProviderAdapter, WebhookHandler, ConnectorCredentials } from './common/types';
```

---

## Configuration

All connector configuration flows through environment variables and the `integrations` table:

```typescript
// @mcv/connectors/config.ts
export const connectorConfig = {
  // Global
  webhookBaseUrl: env.WEBHOOK_BASE_URL,           // https://api.mcv.one/webhooks

  // Email
  email: {
    defaultProvider: env.EMAIL_PROVIDER ?? 'sendgrid',
    sendgrid: {
      apiKey: '{{vault:sendgrid-api-key}}',       // Per-venture override via integrations table
      subUserPrefix: 'mcv-',
    },
    postmark: {
      serverToken: '{{vault:postmark-server-token}}',
    },
    ses: {
      region: env.AWS_SES_REGION ?? 'us-east-1',
      accessKeyId: '{{vault:aws-ses-access-key}}',
      secretAccessKey: '{{vault:aws-ses-secret-key}}',
    },
  },

  // Voice
  voice: {
    defaultProvider: env.VOICE_PROVIDER ?? 'twilio',
    twilio: {
      accountSid: '{{vault:twilio-account-sid}}',
      authToken: '{{vault:twilio-auth-token}}',
    },
  },

  // Payments
  payments: {
    defaultProvider: env.PAYMENT_PROVIDER ?? 'stripe',
    stripe: {
      secretKey: '{{vault:stripe-secret-key}}',
      publishableKey: env.STRIPE_PUBLISHABLE_KEY,
      webhookSecret: '{{vault:stripe-webhook-secret}}',
    },
  },

  // GitHub
  github: {
    appId: env.GITHUB_APP_ID,
    privateKey: '{{vault:github-app-private-key}}',
    webhookSecret: '{{vault:github-webhook-secret}}',
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: '{{vault:github-client-secret}}',
  },

  // Google
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: '{{vault:google-client-secret}}',
    serviceAccountKey: '{{vault:google-service-account-key}}',
  },

  // Rate Limiting
  rateLimiting: {
    sendgrid: { perSecond: 100, burst: 200 },
    stripe: { perSecond: 100, burst: 150 },
    twilio: { perSecond: 100, burst: 200 },
    github: { perSecond: 30, burst: 50 },
    google: { perSecond: 10, burst: 25 },
  },

  // Webhook Delivery
  webhooks: {
    deliveryTimeoutMs: 5000,
    maxRetries: 5,
    retrySchedule: [30_000, 120_000, 900_000, 3_600_000, 14_400_000],
    failureDisableThreshold: 10,
    deliveryRetentionDays: 30,
  },
};
```

---

## Security

### Credential Encryption

All API keys, OAuth tokens, and webhook secrets are stored in the System Vault (`@mcv/secrets`), never in application database tables. The `integrations` table stores only a `secretResourceName` that references the vault entry.

### Venture Isolation

Every database query is scoped by `ventureId`. There is no API path through which Venture A can access Venture B's credentials, send records, or call history. This is enforced at the service layer and reinforced by RLS policies.

### Webhook Signature Validation

All inbound webhooks are validated using provider-specific signing:

| Provider | Method |
|----------|--------|
| Stripe | HMAC-SHA256 via `stripe-signature` header |
| GitHub | HMAC-SHA256 via `X-Hub-Signature-256` header |
| SendGrid | Event Webhook Verification via public key |
| Twilio | Request URL signature validation |
| PayPal | Webhook ID + transmission signature |

All outbound webhooks are signed with per-endpoint HMAC-SHA256 secrets.

### Scoped Permissions

Connectors respect the venture's permission model. Admin-level operations (domain verification, number purchase, endpoint creation) require `ventureAdminProcedure`. Standard operations (send email, initiate call) require `protectedProcedure` with appropriate role checks.

### Audit Logging

All connector operations emit audit log entries via `@mcv/audit`:

```typescript
await auditLog({
  ventureId,
  action: 'email.sent',
  resourceType: 'email_send',
  resourceId: sendRecord.id,
  details: { to: input.to, subject, provider },
});
```

---

## Background Jobs

| Job | Schedule | Submodule | Description |
|-----|----------|-----------|-------------|
| `processScheduledPosts` | Every minute | social | Publish scheduled social media posts |
| `syncPostMetrics` | Every 15 min | social | Pull engagement metrics from platforms |
| `processWebhookRetries` | Every minute | webhooks | Retry failed outbound webhook deliveries |
| `disableFailingEndpoints` | Every hour | webhooks | Auto-disable endpoints with sustained failures |
| `cleanupDeliveryLogs` | Daily at 3 AM | webhooks | Purge delivery logs older than retention period |
| `refreshExpiringTokens` | Every 5 min | oauth | Proactively refresh tokens expiring within 10 min |
| `syncPayrollData` | Daily at 6 AM | payroll | Pull latest pay run and employee data |
| `syncAccountingData` | Every 4 hours | accounting | Bidirectional sync with accounting providers |
| `verifyEmailDomains` | Every 6 hours | email | Re-check DNS verification for unverified domains |
| `syncCalendarEvents` | Every 15 min | google | Incremental calendar event sync |

---

## Testing Strategy

```
Unit Tests         — Service methods with mocked providers
Integration Tests  — Provider adapters against sandbox/test accounts
Webhook Tests      — Signature validation with known test payloads
E2E Tests          — Full send/receive flows in staging environment
```

**Provider sandboxes used:**
- Stripe Test Mode (sk_test_*)
- SendGrid Sandbox Mode
- Twilio Test Credentials
- GitHub Test App Installation
- Google API with test/sandbox project

---

*@mcv/connectors — External Integration Layer*
