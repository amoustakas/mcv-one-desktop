# @mcv/connectors — Package Specification
## Tier 3: External Integrations Layer

**Package:** `@mcv/connectors`  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Executive Summary

`@mcv/connectors` is the external integrations layer of the MCV.ONE SDK. It provides provider-agnostic abstractions over third-party services including email delivery, voice/SMS communications, payment processing, social media APIs, developer tools, and more. Each connector sub-package follows the **adapter pattern** with primary/fallback provider support, credential isolation per venture, and comprehensive webhook handling.

**Key Principle:** Business domains (Tier 5) should never directly integrate with external APIs. All external communication flows through `@mcv/connectors`.

---

## Strategic Position

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TIER 5: BUSINESS DOMAINS                                                   │
│  @mcv/nexus  @mcv/commerce  @mcv/engagement  @mcv/growth  ...               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ uses
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            @mcv/connectors                                   │
│                                                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  email  │ │  voice  │ │payments │ │  oauth  │ │ github  │ │ google  │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│                                                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ social  │ │registrars│ │ payroll │ │accounting│ │webhooks │               │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ depends on
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  TIER 2.5: @mcv/shared  |  TIER 2: @mcv/fabric  |  TIER 1: @mcv/identity    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Sub-Modules Overview

| Module | Primary Provider(s) | Fallback(s) | Purpose |
|--------|---------------------|-------------|---------|
| **email** | SendGrid | Postmark, SES | Transactional & marketing email |
| **voice** | Twilio | Plivo | Voice calls, SMS, IVR |
| **payments** | Stripe | PayPal, Square | Payment processing |
| **oauth** | — | — | OAuth provider abstraction |
| **github** | GitHub API | — | Repository, issues, PRs, Actions |
| **google** | Google APIs | — | Workspace, Calendar, Drive |
| **social** | Twitter, LinkedIn, Meta | — | Social media APIs |
| **registrars** | Namecheap | Cloudflare | Domain registration/DNS |
| **payroll** | Gusto | Rippling | Payroll processing |
| **accounting** | QuickBooks | Xero, Sage | Accounting integration |
| **webhooks** | — | — | Inbound/outbound webhook management |

---

## Common Patterns

### Provider Abstraction Pattern

All connectors follow this pattern for provider abstraction:

```typescript
// Generic provider interface
export interface ProviderAdapter<TConfig, TClient> {
  readonly name: string;
  readonly priority: number;
  
  initialize(config: TConfig): Promise<TClient>;
  healthCheck(): Promise<boolean>;
  getClient(ventureId: string): Promise<TClient>;
}

// Provider registry
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
    operation: (client: ReturnType<T['getClient']> extends Promise<infer C> ? C : never) => Promise<R>
  ): Promise<R> {
    const sortedProviders = [...this.providers.values()].sort((a, b) => b.priority - a.priority);
    
    let lastError: Error | null = null;
    for (const provider of sortedProviders) {
      try {
        const client = await provider.getClient(ventureId);
        return await operation(client);
      } catch (error) {
        lastError = error as Error;
        // Log and continue to fallback
      }
    }
    
    throw lastError ?? new Error('No providers available');
  }
}
```

### Credential Management Pattern

```typescript
// All connectors use the System Vault pattern
export interface ConnectorCredentials {
  ventureId: string;
  provider: string;
  secretResourceName: string;  // Reference to @mcv/secrets vault
  status: 'active' | 'suspended' | 'expired';
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

// Credential loader
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
    throw new ConnectorError('CREDENTIALS_NOT_FOUND', `No ${provider} credentials for venture`);
  }
  
  const secretValue = await secretManager.getSecret(integration.secretResourceName);
  return JSON.parse(secretValue);
}
```

### Webhook Handler Pattern

```typescript
// Standard webhook handler interface
export interface WebhookHandler<TPayload, TEvent> {
  readonly provider: string;
  readonly eventTypes: string[];
  
  validateSignature(req: Request, secret: string): Promise<boolean>;
  parsePayload(req: Request): Promise<TPayload>;
  normalizeEvent(payload: TPayload): TEvent;
  handleEvent(event: TEvent, ventureId: string): Promise<void>;
}
```

---

## Shared Schema: Integrations Table

All connectors share this base table for credential management:

```typescript
// @mcv/connectors/schema/integrations.ts
import { pgTable, text, timestamp, jsonb, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { ventures } from '@mcv/identity/schema';

export const integrationStatusEnum = pgEnum('integration_status', [
  'pending',
  'connected',
  'error',
  'suspended',
  'expired'
]);

export const integrations = pgTable('integrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  
  // Provider identification
  provider: text('provider').notNull(),  // e.g., 'sendgrid', 'stripe', 'github'
  providerAccountId: text('provider_account_id'),  // External account ID
  
  // Credentials (stored in vault, referenced here)
  secretResourceName: text('secret_resource_name'),
  
  // Status
  status: integrationStatusEnum('status').notNull().default('pending'),
  statusMessage: text('status_message'),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  
  // Scopes and permissions granted
  scopes: jsonb('scopes').$type<string[]>().default([]),
  
  // Provider-specific metadata
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  
  // Webhook configuration
  webhookUrl: text('webhook_url'),
  webhookSecret: text('webhook_secret'),
  
  // Audit
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
});

export const integrationsRelations = relations(integrations, ({ one }) => ({
  venture: one(ventures, {
    fields: [integrations.ventureId],
    references: [ventures.id],
  }),
}));

// Integration sync logs
export const integrationSyncLogs = pgTable('integration_sync_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  integrationId: uuid('integration_id').notNull().references(() => integrations.id, { onDelete: 'cascade' }),
  
  operation: text('operation').notNull(),  // 'sync', 'push', 'pull', 'webhook'
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

# Module: email

## Purpose

Provider-agnostic email delivery with SendGrid as primary, Postmark and AWS SES as fallbacks. Supports transactional email, marketing campaigns, template management, and deliverability tracking.

## Providers

| Provider | Priority | Features |
|----------|----------|----------|
| **SendGrid** | 100 | Primary - Full feature set, subuser isolation |
| **Postmark** | 80 | Fallback - Excellent deliverability |
| **AWS SES** | 60 | Fallback - Cost-effective at scale |

## Schema

```typescript
// @mcv/connectors/email/schema.ts
import { pgTable, text, timestamp, jsonb, uuid, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { ventures } from '@mcv/identity/schema';
import { integrations } from '../schema/integrations';

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export const emailProviderEnum = pgEnum('email_provider', ['sendgrid', 'postmark', 'ses']);

export const emailStatusEnum = pgEnum('email_status', [
  'queued',
  'sent',
  'delivered',
  'opened',
  'clicked',
  'bounced',
  'dropped',
  'spam',
  'unsubscribed',
  'failed'
]);

export const emailTypeEnum = pgEnum('email_type', [
  'transactional',
  'marketing',
  'notification',
  'system'
]);

export const bounceTypeEnum = pgEnum('bounce_type', [
  'hard',
  'soft',
  'spam',
  'unsubscribe'
]);

// ═══════════════════════════════════════════════════════════════════════════════
// TABLES
// ═══════════════════════════════════════════════════════════════════════════════

// Sending domains per venture
export const emailDomains = pgTable('email_domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  integrationId: uuid('integration_id').references(() => integrations.id),
  
  domain: text('domain').notNull(),
  subdomain: text('subdomain'),  // e.g., 'mail' for mail.betedge.app
  
  // Verification status
  verified: boolean('verified').default(false),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  
  // DNS records
  spfRecord: text('spf_record'),
  spfVerified: boolean('spf_verified').default(false),
  dkimRecord: text('dkim_record'),
  dkimVerified: boolean('dkim_verified').default(false),
  dmarcRecord: text('dmarc_record'),
  dmarcVerified: boolean('dmarc_verified').default(false),
  
  // Default sender
  defaultFromName: text('default_from_name'),
  defaultFromEmail: text('default_from_email'),
  defaultReplyTo: text('default_reply_to'),
  
  isDefault: boolean('is_default').default(false),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Email templates
export const emailTemplates = pgTable('email_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  
  // Template identification
  slug: text('slug').notNull(),  // Unique per venture
  name: text('name').notNull(),
  description: text('description'),
  
  // Template type
  type: emailTypeEnum('type').notNull().default('transactional'),
  category: text('category'),  // e.g., 'auth', 'billing', 'marketing'
  
  // Content
  subject: text('subject').notNull(),
  htmlContent: text('html_content').notNull(),
  textContent: text('text_content'),
  
  // React Email / MJML source
  sourceType: text('source_type', { enum: ['react', 'mjml', 'html'] }).default('html'),
  sourceCode: text('source_code'),
  
  // Variables schema (JSON Schema for validation)
  variablesSchema: jsonb('variables_schema').$type<Record<string, unknown>>(),
  
  // Versioning
  version: integer('version').default(1),
  isActive: boolean('is_active').default(true),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  
  // Provider template IDs (for provider-side templates)
  providerTemplateIds: jsonb('provider_template_ids').$type<Record<string, string>>(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
});

// Email sends (log of all emails sent)
export const emailSends = pgTable('email_sends', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  
  // Provider tracking
  provider: emailProviderEnum('provider').notNull(),
  providerMessageId: text('provider_message_id'),
  
  // Sender/recipient
  fromEmail: text('from_email').notNull(),
  fromName: text('from_name'),
  toEmail: text('to_email').notNull(),
  toName: text('to_name'),
  replyTo: text('reply_to'),
  
  // CC/BCC
  ccEmails: jsonb('cc_emails').$type<string[]>().default([]),
  bccEmails: jsonb('bcc_emails').$type<string[]>().default([]),
  
  // Content
  subject: text('subject').notNull(),
  templateId: uuid('template_id').references(() => emailTemplates.id),
  templateVariables: jsonb('template_variables').$type<Record<string, unknown>>(),
  
  // Type and category
  type: emailTypeEnum('type').notNull().default('transactional'),
  category: text('category'),
  
  // Status tracking
  status: emailStatusEnum('status').notNull().default('queued'),
  statusUpdatedAt: timestamp('status_updated_at', { withTimezone: true }),
  
  // Error handling
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0),
  
  // Campaign reference (for marketing emails)
  campaignId: uuid('campaign_id'),
  
  // Idempotency
  idempotencyKey: text('idempotency_key'),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  tags: jsonb('tags').$type<string[]>().default([]),
  
  // Related entities
  userId: uuid('user_id'),
  contactId: uuid('contact_id'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
});

// Email events (opens, clicks, bounces, etc.)
export const emailEvents = pgTable('email_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  emailSendId: uuid('email_send_id').references(() => emailSends.id, { onDelete: 'cascade' }),
  
  provider: emailProviderEnum('provider').notNull(),
  providerEventId: text('provider_event_id'),
  
  eventType: text('event_type').notNull(),  // 'delivered', 'opened', 'clicked', 'bounced', etc.
  
  // Event-specific data
  url: text('url'),  // For click events
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  
  // Bounce details
  bounceType: bounceTypeEnum('bounce_type'),
  bounceReason: text('bounce_reason'),
  
  // Raw payload from provider
  rawPayload: jsonb('raw_payload').$type<Record<string, unknown>>(),
  
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Suppression list (bounces, unsubscribes, spam complaints)
export const emailSuppressions = pgTable('email_suppressions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  
  email: text('email').notNull(),
  
  // Suppression type
  type: bounceTypeEnum('type').notNull(),
  reason: text('reason'),
  
  // Source of suppression
  source: text('source', { enum: ['bounce', 'complaint', 'unsubscribe', 'manual', 'import'] }).notNull(),
  sourceEmailSendId: uuid('source_email_send_id').references(() => emailSends.id),
  
  // Reactivation
  isActive: boolean('is_active').default(true),
  reactivatedAt: timestamp('reactivated_at', { withTimezone: true }),
  reactivatedBy: uuid('reactivated_by'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Email campaigns (for marketing/bulk sends)
export const emailCampaigns = pgTable('email_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  
  name: text('name').notNull(),
  description: text('description'),
  
  // Template
  templateId: uuid('template_id').references(() => emailTemplates.id),
  subject: text('subject').notNull(),
  
  // From details
  fromEmail: text('from_email').notNull(),
  fromName: text('from_name'),
  replyTo: text('reply_to'),
  
  // Audience
  audienceQuery: jsonb('audience_query').$type<Record<string, unknown>>(),  // Segment filter
  audienceCount: integer('audience_count'),
  
  // Scheduling
  status: text('status', { 
    enum: ['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled'] 
  }).notNull().default('draft'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  
  // Throttling
  sendRatePerMinute: integer('send_rate_per_minute').default(100),
  
  // Stats
  totalSent: integer('total_sent').default(0),
  totalDelivered: integer('total_delivered').default(0),
  totalOpened: integer('total_opened').default(0),
  totalClicked: integer('total_clicked').default(0),
  totalBounced: integer('total_bounced').default(0),
  totalUnsubscribed: integer('total_unsubscribed').default(0),
  totalSpam: integer('total_spam').default(0),
  
  // A/B testing
  isABTest: boolean('is_ab_test').default(false),
  abTestVariants: jsonb('ab_test_variants').$type<{
    subject?: string;
    templateId?: string;
    percentage: number;
  }[]>(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
});

// ═══════════════════════════════════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════════════════════════════════

export const emailSendsIndexes = {
  ventureStatus: index('idx_email_sends_venture_status').on(emailSends.ventureId, emailSends.status),
  ventureCreated: index('idx_email_sends_venture_created').on(emailSends.ventureId, emailSends.createdAt),
  providerMessageId: index('idx_email_sends_provider_message').on(emailSends.provider, emailSends.providerMessageId),
  toEmail: index('idx_email_sends_to_email').on(emailSends.ventureId, emailSends.toEmail),
  idempotency: uniqueIndex('idx_email_sends_idempotency').on(emailSends.ventureId, emailSends.idempotencyKey),
};

export const emailSuppressionsIndexes = {
  ventureEmail: uniqueIndex('idx_email_suppressions_venture_email').on(emailSuppressions.ventureId, emailSuppressions.email),
  ventureActive: index('idx_email_suppressions_venture_active').on(emailSuppressions.ventureId, emailSuppressions.isActive),
};
```

## Services

```typescript
// @mcv/connectors/email/services/email.service.ts
import { db, eq, and, desc, sql } from '@mcv/db';
import { emailSends, emailTemplates, emailSuppressions, emailDomains } from '../schema';
import { SendGridProvider } from '../providers/sendgrid.provider';
import { PostmarkProvider } from '../providers/postmark.provider';
import { SESProvider } from '../providers/ses.provider';
import { ProviderRegistry } from '../../common/provider-registry';
import { auditLog } from '@mcv/audit';
import type { 
  SendEmailInput, 
  SendBulkEmailInput, 
  EmailResult,
  EmailTemplate,
  EmailDomain 
} from '../types';

export class EmailService {
  private readonly registry: ProviderRegistry<EmailProvider>;
  
  constructor() {
    this.registry = new ProviderRegistry<EmailProvider>();
    this.registry.register(new SendGridProvider());
    this.registry.register(new PostmarkProvider());
    this.registry.register(new SESProvider());
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SENDING
  // ═══════════════════════════════════════════════════════════════════════════
  
  async send(ventureId: string, input: SendEmailInput): Promise<EmailResult> {
    // Check suppression list
    const suppressed = await this.isEmailSuppressed(ventureId, input.to);
    if (suppressed) {
      return { 
        success: false, 
        error: 'EMAIL_SUPPRESSED',
        message: 'Recipient is on suppression list' 
      };
    }
    
    // Resolve template if provided
    let htmlContent = input.htmlContent;
    let textContent = input.textContent;
    let subject = input.subject;
    
    if (input.templateSlug) {
      const template = await this.getTemplate(ventureId, input.templateSlug);
      if (!template) {
        throw new EmailError('TEMPLATE_NOT_FOUND', `Template ${input.templateSlug} not found`);
      }
      
      htmlContent = this.renderTemplate(template.htmlContent, input.variables ?? {});
      textContent = template.textContent 
        ? this.renderTemplate(template.textContent, input.variables ?? {}) 
        : undefined;
      subject = subject ?? this.renderTemplate(template.subject, input.variables ?? {});
    }
    
    // Get default domain
    const domain = await this.getDefaultDomain(ventureId);
    const fromEmail = input.from ?? domain?.defaultFromEmail;
    const fromName = input.fromName ?? domain?.defaultFromName;
    
    if (!fromEmail) {
      throw new EmailError('NO_SENDER', 'No sender email configured');
    }
    
    // Create send record
    const [sendRecord] = await db.insert(emailSends).values({
      ventureId,
      provider: 'sendgrid', // Will be updated by actual provider
      fromEmail,
      fromName,
      toEmail: input.to,
      toName: input.toName,
      replyTo: input.replyTo ?? domain?.defaultReplyTo,
      ccEmails: input.cc ?? [],
      bccEmails: input.bcc ?? [],
      subject: subject!,
      templateId: input.templateId,
      templateVariables: input.variables,
      type: input.type ?? 'transactional',
      category: input.category,
      status: 'queued',
      idempotencyKey: input.idempotencyKey,
      userId: input.userId,
      contactId: input.contactId,
      metadata: input.metadata,
      tags: input.tags ?? [],
    }).returning();
    
    try {
      // Send via provider registry (with automatic failover)
      const result = await this.registry.execute(ventureId, async (client) => {
        return client.send({
          from: { email: fromEmail, name: fromName },
          to: { email: input.to, name: input.toName },
          subject: subject!,
          html: htmlContent,
          text: textContent,
          replyTo: input.replyTo ?? domain?.defaultReplyTo,
          cc: input.cc,
          bcc: input.bcc,
          headers: input.headers,
          attachments: input.attachments,
          tags: input.tags,
          metadata: {
            sendId: sendRecord.id,
            ventureId,
            ...input.metadata,
          },
        });
      });
      
      // Update send record
      await db.update(emailSends)
        .set({
          provider: result.provider,
          providerMessageId: result.messageId,
          status: 'sent',
          sentAt: new Date(),
        })
        .where(eq(emailSends.id, sendRecord.id));
      
      // Audit log
      await auditLog({
        ventureId,
        action: 'email.sent',
        resourceType: 'email_send',
        resourceId: sendRecord.id,
        details: {
          to: input.to,
          subject: subject!,
          provider: result.provider,
        },
      });
      
      return { 
        success: true, 
        messageId: result.messageId,
        sendId: sendRecord.id,
        provider: result.provider,
      };
    } catch (error) {
      // Update send record with error
      await db.update(emailSends)
        .set({
          status: 'failed',
          errorCode: (error as any).code,
          errorMessage: (error as Error).message,
        })
        .where(eq(emailSends.id, sendRecord.id));
      
      throw error;
    }
  }
  
  async sendBulk(ventureId: string, input: SendBulkEmailInput): Promise<{
    total: number;
    succeeded: number;
    failed: number;
    results: EmailResult[];
  }> {
    const results: EmailResult[] = [];
    let succeeded = 0;
    let failed = 0;
    
    // Process in batches
    const batchSize = 100;
    for (let i = 0; i < input.recipients.length; i += batchSize) {
      const batch = input.recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (recipient) => {
        try {
          const result = await this.send(ventureId, {
            ...input,
            to: recipient.email,
            toName: recipient.name,
            variables: { ...input.variables, ...recipient.variables },
          });
          succeeded++;
          return result;
        } catch (error) {
          failed++;
          return { 
            success: false, 
            error: (error as Error).message,
            recipient: recipient.email,
          };
        }
      });
      
      results.push(...await Promise.all(batchPromises));
      
      // Respect rate limits
      if (i + batchSize < input.recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second between batches
      }
    }
    
    return {
      total: input.recipients.length,
      succeeded,
      failed,
      results,
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════════
  
  async createTemplate(ventureId: string, input: CreateTemplateInput): Promise<EmailTemplate> {
    const [template] = await db.insert(emailTemplates).values({
      ventureId,
      slug: input.slug,
      name: input.name,
      description: input.description,
      type: input.type ?? 'transactional',
      category: input.category,
      subject: input.subject,
      htmlContent: input.htmlContent,
      textContent: input.textContent,
      sourceType: input.sourceType ?? 'html',
      sourceCode: input.sourceCode,
      variablesSchema: input.variablesSchema,
      createdBy: input.createdBy,
    }).returning();
    
    return template;
  }
  
  async getTemplate(ventureId: string, slug: string): Promise<EmailTemplate | null> {
    return db.query.emailTemplates.findFirst({
      where: and(
        eq(emailTemplates.ventureId, ventureId),
        eq(emailTemplates.slug, slug),
        eq(emailTemplates.isActive, true)
      ),
    });
  }
  
  async listTemplates(ventureId: string, filters?: TemplateFilters): Promise<EmailTemplate[]> {
    let query = db.select().from(emailTemplates)
      .where(eq(emailTemplates.ventureId, ventureId))
      .orderBy(desc(emailTemplates.updatedAt));
    
    if (filters?.type) {
      query = query.where(eq(emailTemplates.type, filters.type));
    }
    if (filters?.category) {
      query = query.where(eq(emailTemplates.category, filters.category));
    }
    
    return query;
  }
  
  async updateTemplate(ventureId: string, id: string, input: UpdateTemplateInput): Promise<EmailTemplate> {
    const [template] = await db.update(emailTemplates)
      .set({
        ...input,
        version: sql`${emailTemplates.version} + 1`,
        updatedAt: new Date(),
      })
      .where(and(
        eq(emailTemplates.id, id),
        eq(emailTemplates.ventureId, ventureId)
      ))
      .returning();
    
    return template;
  }
  
  private renderTemplate(template: string, variables: Record<string, unknown>): string {
    // Simple Handlebars-style variable replacement
    return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
      const value = key.trim().split('.').reduce((obj: any, k: string) => obj?.[k], variables);
      return value !== undefined ? String(value) : '';
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DOMAINS
  // ═══════════════════════════════════════════════════════════════════════════
  
  async addDomain(ventureId: string, domain: string): Promise<EmailDomain> {
    // Create domain record
    const [domainRecord] = await db.insert(emailDomains).values({
      ventureId,
      domain,
      subdomain: 'mail',
    }).returning();
    
    // Provision with provider
    await this.registry.execute(ventureId, async (client) => {
      const dnsRecords = await client.authenticateDomain(domain);
      
      await db.update(emailDomains)
        .set({
          spfRecord: dnsRecords.spf,
          dkimRecord: dnsRecords.dkim,
          dmarcRecord: dnsRecords.dmarc,
        })
        .where(eq(emailDomains.id, domainRecord.id));
    });
    
    return domainRecord;
  }
  
  async verifyDomain(ventureId: string, domainId: string): Promise<EmailDomain> {
    const domain = await db.query.emailDomains.findFirst({
      where: and(
        eq(emailDomains.id, domainId),
        eq(emailDomains.ventureId, ventureId)
      ),
    });
    
    if (!domain) throw new EmailError('DOMAIN_NOT_FOUND', 'Domain not found');
    
    const verification = await this.registry.execute(ventureId, async (client) => {
      return client.verifyDomain(domain.domain);
    });
    
    await db.update(emailDomains)
      .set({
        verified: verification.verified,
        verifiedAt: verification.verified ? new Date() : null,
        spfVerified: verification.spfVerified,
        dkimVerified: verification.dkimVerified,
        dmarcVerified: verification.dmarcVerified,
        updatedAt: new Date(),
      })
      .where(eq(emailDomains.id, domainId));
    
    return { ...domain, ...verification };
  }
  
  async getDefaultDomain(ventureId: string): Promise<EmailDomain | null> {
    return db.query.emailDomains.findFirst({
      where: and(
        eq(emailDomains.ventureId, ventureId),
        eq(emailDomains.isDefault, true)
      ),
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SUPPRESSIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  async isEmailSuppressed(ventureId: string, email: string): Promise<boolean> {
    const suppression = await db.query.emailSuppressions.findFirst({
      where: and(
        eq(emailSuppressions.ventureId, ventureId),
        eq(emailSuppressions.email, email.toLowerCase()),
        eq(emailSuppressions.isActive, true)
      ),
    });
    
    return !!suppression;
  }
  
  async addSuppression(ventureId: string, input: AddSuppressionInput): Promise<void> {
    await db.insert(emailSuppressions)
      .values({
        ventureId,
        email: input.email.toLowerCase(),
        type: input.type,
        reason: input.reason,
        source: input.source,
        sourceEmailSendId: input.sourceEmailSendId,
      })
      .onConflictDoUpdate({
        target: [emailSuppressions.ventureId, emailSuppressions.email],
        set: {
          isActive: true,
          type: input.type,
          reason: input.reason,
          source: input.source,
        },
      });
  }
  
  async removeSuppression(ventureId: string, email: string, removedBy: string): Promise<void> {
    await db.update(emailSuppressions)
      .set({
        isActive: false,
        reactivatedAt: new Date(),
        reactivatedBy: removedBy,
      })
      .where(and(
        eq(emailSuppressions.ventureId, ventureId),
        eq(emailSuppressions.email, email.toLowerCase())
      ));
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════════
  
  async getAnalytics(ventureId: string, dateRange: DateRange): Promise<EmailAnalytics> {
    const stats = await db.select({
      status: emailSends.status,
      count: sql<number>`count(*)::int`,
    })
      .from(emailSends)
      .where(and(
        eq(emailSends.ventureId, ventureId),
        gte(emailSends.createdAt, dateRange.start),
        lte(emailSends.createdAt, dateRange.end)
      ))
      .groupBy(emailSends.status);
    
    const statsMap = Object.fromEntries(stats.map(s => [s.status, s.count]));
    
    const total = Object.values(statsMap).reduce((a, b) => a + b, 0);
    const delivered = statsMap.delivered ?? 0;
    const opened = statsMap.opened ?? 0;
    const clicked = statsMap.clicked ?? 0;
    const bounced = statsMap.bounced ?? 0;
    
    return {
      total,
      delivered,
      opened,
      clicked,
      bounced,
      deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
      clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
      bounceRate: total > 0 ? (bounced / total) * 100 : 0,
    };
  }
}

export const emailService = new EmailService();
```

## API (tRPC Procedures)

```typescript
// @mcv/connectors/email/router.ts
import { router, protectedProcedure, ventureAdminProcedure } from '@mcv/api';
import { z } from 'zod';
import { emailService } from './services/email.service';

export const emailRouter = router({
  // ═══════════════════════════════════════════════════════════════════════════
  // SENDING
  // ═══════════════════════════════════════════════════════════════════════════
  
  send: protectedProcedure
    .input(z.object({
      to: z.string().email(),
      toName: z.string().optional(),
      subject: z.string().optional(),
      htmlContent: z.string().optional(),
      textContent: z.string().optional(),
      templateSlug: z.string().optional(),
      variables: z.record(z.unknown()).optional(),
      from: z.string().email().optional(),
      fromName: z.string().optional(),
      replyTo: z.string().email().optional(),
      cc: z.array(z.string().email()).optional(),
      bcc: z.array(z.string().email()).optional(),
      type: z.enum(['transactional', 'marketing', 'notification', 'system']).optional(),
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      metadata: z.record(z.unknown()).optional(),
      attachments: z.array(z.object({
        filename: z.string(),
        content: z.string(), // base64
        contentType: z.string(),
      })).optional(),
      idempotencyKey: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return emailService.send(ctx.venture.id, {
        ...input,
        userId: ctx.user.id,
      });
    }),
  
  sendBulk: protectedProcedure
    .input(z.object({
      recipients: z.array(z.object({
        email: z.string().email(),
        name: z.string().optional(),
        variables: z.record(z.unknown()).optional(),
      })),
      subject: z.string().optional(),
      templateSlug: z.string().optional(),
      variables: z.record(z.unknown()).optional(),
      from: z.string().email().optional(),
      fromName: z.string().optional(),
      type: z.enum(['transactional', 'marketing', 'notification', 'system']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return emailService.sendBulk(ctx.venture.id, input);
    }),
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════════
  
  listTemplates: protectedProcedure
    .input(z.object({
      type: z.enum(['transactional', 'marketing', 'notification', 'system']).optional(),
      category: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return emailService.listTemplates(ctx.venture.id, input);
    }),
  
  getTemplate: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return emailService.getTemplate(ctx.venture.id, input.slug);
    }),
  
  createTemplate: ventureAdminProcedure
    .input(z.object({
      slug: z.string().regex(/^[a-z0-9-]+$/),
      name: z.string(),
      description: z.string().optional(),
      type: z.enum(['transactional', 'marketing', 'notification', 'system']).optional(),
      category: z.string().optional(),
      subject: z.string(),
      htmlContent: z.string(),
      textContent: z.string().optional(),
      sourceType: z.enum(['react', 'mjml', 'html']).optional(),
      sourceCode: z.string().optional(),
      variablesSchema: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return emailService.createTemplate(ctx.venture.id, {
        ...input,
        createdBy: ctx.user.id,
      });
    }),
  
  updateTemplate: ventureAdminProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().optional(),
      description: z.string().optional(),
      subject: z.string().optional(),
      htmlContent: z.string().optional(),
      textContent: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      return emailService.updateTemplate(ctx.venture.id, id, updates);
    }),
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DOMAINS
  // ═══════════════════════════════════════════════════════════════════════════
  
  listDomains: protectedProcedure
    .query(async ({ ctx }) => {
      return db.query.emailDomains.findMany({
        where: eq(emailDomains.ventureId, ctx.venture.id),
      });
    }),
  
  addDomain: ventureAdminProcedure
    .input(z.object({ domain: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return emailService.addDomain(ctx.venture.id, input.domain);
    }),
  
  verifyDomain: ventureAdminProcedure
    .input(z.object({ domainId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return emailService.verifyDomain(ctx.venture.id, input.domainId);
    }),
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SUPPRESSIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  checkSuppression: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      return { suppressed: await emailService.isEmailSuppressed(ctx.venture.id, input.email) };
    }),
  
  addSuppression: ventureAdminProcedure
    .input(z.object({
      email: z.string().email(),
      type: z.enum(['hard', 'soft', 'spam', 'unsubscribe']),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await emailService.addSuppression(ctx.venture.id, {
        ...input,
        source: 'manual',
      });
      return { success: true };
    }),
  
  removeSuppression: ventureAdminProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      await emailService.removeSuppression(ctx.venture.id, input.email, ctx.user.id);
      return { success: true };
    }),
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════════
  
  getAnalytics: protectedProcedure
    .input(z.object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
    }))
    .query(async ({ ctx, input }) => {
      return emailService.getAnalytics(ctx.venture.id, {
        start: new Date(input.startDate),
        end: new Date(input.endDate),
      });
    }),
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HISTORY
  // ═══════════════════════════════════════════════════════════════════════════
  
  listSends: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(20),
      status: z.enum(['queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed']).optional(),
      type: z.enum(['transactional', 'marketing', 'notification', 'system']).optional(),
      toEmail: z.string().optional(),
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const filters = input ?? {};
      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? 20;
      
      // Build query...
      const results = await db.query.emailSends.findMany({
        where: eq(emailSends.ventureId, ctx.venture.id),
        orderBy: desc(emailSends.createdAt),
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      
      return {
        data: results,
        pagination: {
          page,
          pageSize,
          // total count...
        },
      };
    }),
});
```

---

# Module: voice

## Purpose

Voice and SMS communications via Twilio (primary) with Plivo fallback. Supports inbound/outbound calls, SMS, IVR trees, call recording, transcription, and conference calling.

## Providers

| Provider | Priority | Features |
|----------|----------|----------|
| **Twilio** | 100 | Full feature set - Voice, SMS, IVR, Flex |
| **Plivo** | 80 | Cost-effective alternative |

## Schema

```typescript
// @mcv/connectors/voice/schema.ts
import { pgTable, text, timestamp, jsonb, uuid, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { ventures } from '@mcv/identity/schema';
import { integrations } from '../schema/integrations';

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export const voiceProviderEnum = pgEnum('voice_provider', ['twilio', 'plivo']);

export const phoneNumberTypeEnum = pgEnum('phone_number_type', [
  'local',
  'mobile',
  'tollfree',
  'shortcode'
]);

export const phoneNumberStatusEnum = pgEnum('phone_number_status', [
  'pending',
  'active',
  'suspended',
  'released'
]);

export const callDirectionEnum = pgEnum('call_direction', ['inbound', 'outbound']);

export const callStatusEnum = pgEnum('call_status', [
  'queued',
  'ringing',
  'in-progress',
  'completed',
  'busy',
  'no-answer',
  'canceled',
  'failed'
]);

export const smsDirectionEnum = pgEnum('sms_direction', ['inbound', 'outbound']);

export const smsStatusEnum = pgEnum('sms_status', [
  'queued',
  'sending',
  'sent',
  'delivered',
  'failed',
  'undelivered',
  'received'
]);

export const ivrNodeTypeEnum = pgEnum('ivr_node_type', [
  'menu',
  'gather',
  'say',
  'play',
  'dial',
  'voicemail',
  'transfer',
  'hangup',
  'goto'
]);

// ═══════════════════════════════════════════════════════════════════════════════
// TABLES
// ═══════════════════════════════════════════════════════════════════════════════

// Sub-accounts per venture
export const voiceAccounts = pgTable('voice_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  integrationId: uuid('integration_id').references(() => integrations.id),
  
  provider: voiceProviderEnum('provider').notNull(),
  providerAccountSid: text('provider_account_sid').notNull(),
  providerAuthToken: text('provider_auth_token'),  // Encrypted
  
  friendlyName: text('friendly_name'),
  status: text('status', { enum: ['active', 'suspended', 'closed'] }).default('active'),
  
  // Usage limits
  dailySmsLimit: integer('daily_sms_limit').default(1000),
  dailyCallMinutesLimit: integer('daily_call_minutes_limit').default(600),
  
  // Webhook URLs
  smsWebhookUrl: text('sms_webhook_url'),
  voiceWebhookUrl: text('voice_webhook_url'),
  statusCallbackUrl: text('status_callback_url'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Phone numbers
export const phoneNumbers = pgTable('phone_numbers', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  voiceAccountId: uuid('voice_account_id').references(() => voiceAccounts.id),
  
  provider: voiceProviderEnum('provider').notNull(),
  providerPhoneNumberSid: text('provider_phone_number_sid'),
  
  phoneNumber: text('phone_number').notNull(),  // E.164 format
  friendlyName: text('friendly_name'),
  
  type: phoneNumberTypeEnum('type').notNull(),
  country: text('country').notNull(),  // ISO 3166-1 alpha-2
  locality: text('locality'),
  region: text('region'),
  
  // Capabilities
  canSms: boolean('can_sms').default(false),
  canMms: boolean('can_mms').default(false),
  canVoice: boolean('can_voice').default(false),
  canFax: boolean('can_fax').default(false),
  
  status: phoneNumberStatusEnum('status').notNull().default('pending'),
  
  // Configuration
  smsUrl: text('sms_url'),
  smsMethod: text('sms_method', { enum: ['GET', 'POST'] }).default('POST'),
  voiceUrl: text('voice_url'),
  voiceMethod: text('voice_method', { enum: ['GET', 'POST'] }).default('POST'),
  statusCallback: text('status_callback'),
  
  // IVR assignment
  ivrTreeId: uuid('ivr_tree_id'),
  
  // Monthly cost
  monthlyCost: integer('monthly_cost'),  // In cents
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Call records
export const calls = pgTable('calls', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  phoneNumberId: uuid('phone_number_id').references(() => phoneNumbers.id),
  
  provider: voiceProviderEnum('provider').notNull(),
  providerCallSid: text('provider_call_sid'),
  parentCallSid: text('parent_call_sid'),  // For child legs
  
  direction: callDirectionEnum('direction').notNull(),
  status: callStatusEnum('status').notNull().default('queued'),
  
  fromNumber: text('from_number').notNull(),
  toNumber: text('to_number').notNull(),
  
  // Timing
  startTime: timestamp('start_time', { withTimezone: true }),
  endTime: timestamp('end_time', { withTimezone: true }),
  duration: integer('duration'),  // Seconds
  
  // Answering machine detection
  answeredBy: text('answered_by', { enum: ['human', 'machine', 'fax', 'unknown'] }),
  
  // Recording
  recordingEnabled: boolean('recording_enabled').default(false),
  recordingUrl: text('recording_url'),
  recordingSid: text('recording_sid'),
  recordingDuration: integer('recording_duration'),
  
  // Transcription
  transcriptionEnabled: boolean('transcription_enabled').default(false),
  transcriptionText: text('transcription_text'),
  transcriptionStatus: text('transcription_status', { 
    enum: ['pending', 'completed', 'failed'] 
  }),
  
  // IVR path taken
  ivrPath: jsonb('ivr_path').$type<{ nodeId: string; input: string; timestamp: Date }[]>(),
  
  // Pricing
  price: text('price'),
  priceUnit: text('price_unit'),
  
  // Related entities
  userId: uuid('user_id'),
  contactId: uuid('contact_id'),
  agentId: uuid('agent_id'),  // For call center
  
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// SMS messages
export const smsMessages = pgTable('sms_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  phoneNumberId: uuid('phone_number_id').references(() => phoneNumbers.id),
  
  provider: voiceProviderEnum('provider').notNull(),
  providerMessageSid: text('provider_message_sid'),
  
  direction: smsDirectionEnum('direction').notNull(),
  status: smsStatusEnum('status').notNull().default('queued'),
  
  fromNumber: text('from_number').notNull(),
  toNumber: text('to_number').notNull(),
  
  body: text('body').notNull(),
  numSegments: integer('num_segments').default(1),
  
  // MMS
  mediaUrls: jsonb('media_urls').$type<string[]>().default([]),
  numMedia: integer('num_media').default(0),
  
  // Error handling
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  
  // Pricing
  price: text('price'),
  priceUnit: text('price_unit'),
  
  // Conversation threading
  conversationId: uuid('conversation_id'),
  
  // Related entities
  userId: uuid('user_id'),
  contactId: uuid('contact_id'),
  
  sentAt: timestamp('sent_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// IVR trees
export const ivrTrees = pgTable('ivr_trees', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  
  name: text('name').notNull(),
  description: text('description'),
  
  // Entry point node
  entryNodeId: text('entry_node_id').notNull(),
  
  // All nodes in the tree
  nodes: jsonb('nodes').$type<IvrNode[]>().notNull(),
  
  isActive: boolean('is_active').default(true),
  version: integer('version').default(1),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
});

// IVR node definition (embedded in ivrTrees.nodes)
export interface IvrNode {
  id: string;
  type: 'menu' | 'gather' | 'say' | 'play' | 'dial' | 'voicemail' | 'transfer' | 'hangup' | 'goto';
  
  // Say/Play
  text?: string;
  voice?: string;
  language?: string;
  audioUrl?: string;
  
  // Gather
  inputType?: 'dtmf' | 'speech' | 'dtmf speech';
  numDigits?: number;
  timeout?: number;
  
  // Menu options (DTMF digit -> next node)
  options?: Record<string, string>;
  
  // Dial
  dialNumber?: string;
  dialTimeout?: number;
  record?: boolean;
  
  // Transfer
  transferTo?: string;
  transferType?: 'warm' | 'cold';
  
  // Voicemail
  maxLength?: number;
  transcribe?: boolean;
  
  // Navigation
  nextNodeId?: string;
  fallbackNodeId?: string;
}

// Recordings
export const recordings = pgTable('recordings', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  callId: uuid('call_id').references(() => calls.id),
  
  provider: voiceProviderEnum('provider').notNull(),
  providerRecordingSid: text('provider_recording_sid'),
  
  url: text('url'),
  duration: integer('duration'),  // Seconds
  channels: integer('channels').default(1),
  
  // Storage (if copied to our storage)
  storagePath: text('storage_path'),
  storageProvider: text('storage_provider'),
  
  // Transcription
  transcriptionText: text('transcription_text'),
  transcriptionStatus: text('transcription_status', {
    enum: ['pending', 'processing', 'completed', 'failed']
  }),
  transcriptionConfidence: real('transcription_confidence'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
});

// Conversations (for SMS threading)
export const voiceConversations = pgTable('voice_conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  
  phoneNumberId: uuid('phone_number_id').references(() => phoneNumbers.id),
  participantNumber: text('participant_number').notNull(),  // External number
  
  // Related contact
  contactId: uuid('contact_id'),
  
  // Last message
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
  lastMessageDirection: smsDirectionEnum('last_message_direction'),
  lastMessagePreview: text('last_message_preview'),
  
  // Unread tracking
  unreadCount: integer('unread_count').default(0),
  
  // Status
  status: text('status', { enum: ['active', 'archived', 'blocked'] }).default('active'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

## Services

```typescript
// @mcv/connectors/voice/services/voice.service.ts
import { TwilioProvider } from '../providers/twilio.provider';
import { PlivoProvider } from '../providers/plivo.provider';
import { ProviderRegistry } from '../../common/provider-registry';
import type {
  InitiateCallInput,
  SendSmsInput,
  CallResult,
  SmsResult,
  AvailableNumber,
  SearchNumbersInput,
} from '../types';

export class VoiceService {
  private readonly registry: ProviderRegistry<VoiceProvider>;
  
  constructor() {
    this.registry = new ProviderRegistry<VoiceProvider>();
    this.registry.register(new TwilioProvider());
    this.registry.register(new PlivoProvider());
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CALLS
  // ═══════════════════════════════════════════════════════════════════════════
  
  async initiateCall(ventureId: string, input: InitiateCallInput): Promise<CallResult> {
    // Create call record
    const [callRecord] = await db.insert(calls).values({
      ventureId,
      provider: 'twilio',
      direction: 'outbound',
      status: 'queued',
      fromNumber: input.from,
      toNumber: input.to,
      recordingEnabled: input.record ?? false,
      transcriptionEnabled: input.transcribe ?? false,
      metadata: input.metadata,
    }).returning();
    
    try {
      const result = await this.registry.execute(ventureId, async (client) => {
        return client.initiateCall({
          ...input,
          statusCallback: `${config.webhookBaseUrl}/voice/status/${callRecord.id}`,
          recordingStatusCallback: input.record 
            ? `${config.webhookBaseUrl}/voice/recording/${callRecord.id}`
            : undefined,
        });
      });
      
      await db.update(calls)
        .set({
          provider: result.provider,
          providerCallSid: result.callSid,
          status: 'ringing',
        })
        .where(eq(calls.id, callRecord.id));
      
      return {
        success: true,
        callId: callRecord.id,
        callSid: result.callSid,
        provider: result.provider,
      };
    } catch (error) {
      await db.update(calls)
        .set({ status: 'failed' })
        .where(eq(calls.id, callRecord.id));
      throw error;
    }
  }
  
  async endCall(ventureId: string, callId: string): Promise<void> {
    const call = await db.query.calls.findFirst({
      where: and(eq(calls.id, callId), eq(calls.ventureId, ventureId)),
    });
    
    if (!call?.providerCallSid) throw new VoiceError('CALL_NOT_FOUND', 'Call not found');
    
    await this.registry.execute(ventureId, async (client) => {
      await client.endCall(call.providerCallSid);
    });
    
    await db.update(calls)
      .set({ status: 'completed', endTime: new Date() })
      .where(eq(calls.id, callId));
  }
  
  async transferCall(
    ventureId: string, 
    callId: string, 
    input: TransferCallInput
  ): Promise<void> {
    const call = await db.query.calls.findFirst({
      where: and(eq(calls.id, callId), eq(calls.ventureId, ventureId)),
    });
    
    if (!call?.providerCallSid) throw new VoiceError('CALL_NOT_FOUND', 'Call not found');
    
    await this.registry.execute(ventureId, async (client) => {
      await client.transferCall(call.providerCallSid, input);
    });
  }
  
  async generateTwiml(ventureId: string, actions: TwimlAction[]): Promise<string> {
    const twiml = new TwimlBuilder();
    
    for (const action of actions) {
      switch (action.type) {
        case 'say':
          twiml.say(action.text, { voice: action.voice, language: action.language });
          break;
        case 'play':
          twiml.play(action.url, { loop: action.loop });
          break;
        case 'dial':
          twiml.dial(action.number, { 
            callerId: action.callerId,
            timeout: action.timeout,
            record: action.record,
          });
          break;
        case 'gather':
          const gather = twiml.gather({
            input: action.input,
            numDigits: action.numDigits,
            timeout: action.timeout,
            action: action.action,
          });
          if (action.nested) {
            // Recursively add nested actions
            for (const nested of action.nested) {
              if (nested.type === 'say') gather.say(nested.text);
              if (nested.type === 'play') gather.play(nested.url);
            }
          }
          break;
        case 'record':
          twiml.record({
            maxLength: action.maxLength,
            playBeep: action.playBeep,
            transcribe: action.transcribe,
            action: action.action,
          });
          break;
        case 'hangup':
          twiml.hangup();
          break;
        case 'pause':
          twiml.pause({ length: action.length });
          break;
        case 'redirect':
          twiml.redirect(action.url, { method: action.method });
          break;
      }
    }
    
    return twiml.toString();
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SMS
  // ═══════════════════════════════════════════════════════════════════════════
  
  async sendSms(ventureId: string, input: SendSmsInput): Promise<SmsResult> {
    // Find or create conversation
    let conversation = await db.query.voiceConversations.findFirst({
      where: and(
        eq(voiceConversations.ventureId, ventureId),
        eq(voiceConversations.participantNumber, input.to)
      ),
    });
    
    if (!conversation) {
      [conversation] = await db.insert(voiceConversations).values({
        ventureId,
        participantNumber: input.to,
        contactId: input.contactId,
      }).returning();
    }
    
    // Create SMS record
    const [smsRecord] = await db.insert(smsMessages).values({
      ventureId,
      provider: 'twilio',
      direction: 'outbound',
      status: 'queued',
      fromNumber: input.from,
      toNumber: input.to,
      body: input.body,
      mediaUrls: input.mediaUrls ?? [],
      numMedia: input.mediaUrls?.length ?? 0,
      conversationId: conversation.id,
      userId: input.userId,
      contactId: input.contactId,
      metadata: input.metadata,
    }).returning();
    
    try {
      const result = await this.registry.execute(ventureId, async (client) => {
        return client.sendSms({
          ...input,
          statusCallback: `${config.webhookBaseUrl}/sms/status/${smsRecord.id}`,
        });
      });
      
      await db.update(smsMessages)
        .set({
          provider: result.provider,
          providerMessageSid: result.messageSid,
          status: 'sending',
          numSegments: result.numSegments,
          sentAt: new Date(),
        })
        .where(eq(smsMessages.id, smsRecord.id));
      
      // Update conversation
      await db.update(voiceConversations)
        .set({
          lastMessageAt: new Date(),
          lastMessageDirection: 'outbound',
          lastMessagePreview: input.body.slice(0, 100),
        })
        .where(eq(voiceConversations.id, conversation.id));
      
      return {
        success: true,
        messageId: smsRecord.id,
        messageSid: result.messageSid,
        provider: result.provider,
        numSegments: result.numSegments,
      };
    } catch (error) {
      await db.update(smsMessages)
        .set({
          status: 'failed',
          errorCode: (error as any).code,
          errorMessage: (error as Error).message,
        })
        .where(eq(smsMessages.id, smsRecord.id));
      throw error;
    }
  }
  
  async sendBulkSms(ventureId: string, input: BulkSmsInput): Promise<BulkSmsResult> {
    const results: SmsResult[] = [];
    let succeeded = 0;
    let failed = 0;
    
    for (const recipient of input.recipients) {
      try {
        const result = await this.sendSms(ventureId, {
          ...input,
          to: recipient,
        });
        results.push(result);
        succeeded++;
      } catch (error) {
        results.push({
          success: false,
          error: (error as Error).message,
          recipient,
        });
        failed++;
      }
      
      // Rate limiting - 1 message per 50ms
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return { total: input.recipients.length, succeeded, failed, results };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PHONE NUMBERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  async searchAvailableNumbers(
    ventureId: string, 
    input: SearchNumbersInput
  ): Promise<AvailableNumber[]> {
    return this.registry.execute(ventureId, async (client) => {
      return client.searchAvailableNumbers(input);
    });
  }
  
  async purchaseNumber(ventureId: string, phoneNumber: string): Promise<PhoneNumber> {
    const result = await this.registry.execute(ventureId, async (client) => {
      return client.purchaseNumber(phoneNumber, {
        smsUrl: `${config.webhookBaseUrl}/sms/inbound/${ventureId}`,
        voiceUrl: `${config.webhookBaseUrl}/voice/inbound/${ventureId}`,
        statusCallback: `${config.webhookBaseUrl}/voice/status/${ventureId}`,
      });
    });
    
    const [numberRecord] = await db.insert(phoneNumbers).values({
      ventureId,
      provider: result.provider,
      providerPhoneNumberSid: result.phoneSid,
      phoneNumber: result.phoneNumber,
      type: result.type,
      country: result.country,
      locality: result.locality,
      region: result.region,
      canSms: result.capabilities.sms,
      canMms: result.capabilities.mms,
      canVoice: result.capabilities.voice,
      status: 'active',
      smsUrl: `${config.webhookBaseUrl}/sms/inbound/${ventureId}`,
      voiceUrl: `${config.webhookBaseUrl}/voice/inbound/${ventureId}`,
    }).returning();
    
    return numberRecord;
  }
  
  async releaseNumber(ventureId: string, phoneNumberId: string): Promise<void> {
    const phoneNumber = await db.query.phoneNumbers.findFirst({
      where: and(
        eq(phoneNumbers.id, phoneNumberId),
        eq(phoneNumbers.ventureId, ventureId)
      ),
    });
    
    if (!phoneNumber) throw new VoiceError('NUMBER_NOT_FOUND', 'Phone number not found');
    
    await this.registry.execute(ventureId, async (client) => {
      await client.releaseNumber(phoneNumber.providerPhoneNumberSid!);
    });
    
    await db.update(phoneNumbers)
      .set({ status: 'released', updatedAt: new Date() })
      .where(eq(phoneNumbers.id, phoneNumberId));
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // IVR
  // ═══════════════════════════════════════════════════════════════════════════
  
  async createIvrTree(ventureId: string, input: CreateIvrTreeInput): Promise<IvrTree> {
    // Validate the tree structure
    this.validateIvrTree(input.nodes, input.entryNodeId);
    
    const [tree] = await db.insert(ivrTrees).values({
      ventureId,
      name: input.name,
      description: input.description,
      entryNodeId: input.entryNodeId,
      nodes: input.nodes,
      createdBy: input.createdBy,
    }).returning();
    
    return tree;
  }
  
  async executeIvrNode(
    ventureId: string, 
    treeId: string, 
    nodeId: string,
    input?: string
  ): Promise<{ twiml: string; nextNodeId?: string }> {
    const tree = await db.query.ivrTrees.findFirst({
      where: and(eq(ivrTrees.id, treeId), eq(ivrTrees.ventureId, ventureId)),
    });
    
    if (!tree) throw new VoiceError('IVR_NOT_FOUND', 'IVR tree not found');
    
    const node = tree.nodes.find(n => n.id === nodeId);
    if (!node) throw new VoiceError('NODE_NOT_FOUND', 'IVR node not found');
    
    const twiml = new TwimlBuilder();
    let nextNodeId: string | undefined;
    
    switch (node.type) {
      case 'menu':
      case 'gather':
        const gather = twiml.gather({
          input: node.inputType ?? 'dtmf',
          numDigits: node.numDigits ?? 1,
          timeout: node.timeout ?? 5,
          action: `${config.webhookBaseUrl}/ivr/${ventureId}/${treeId}/${nodeId}/gather`,
        });
        if (node.text) gather.say(node.text, { voice: node.voice });
        if (node.audioUrl) gather.play(node.audioUrl);
        
        // Handle input if provided (from gather callback)
        if (input && node.options) {
          nextNodeId = node.options[input] ?? node.fallbackNodeId;
        }
        break;
        
      case 'say':
        twiml.say(node.text!, { voice: node.voice, language: node.language });
        nextNodeId = node.nextNodeId;
        break;
        
      case 'play':
        twiml.play(node.audioUrl!);
        nextNodeId = node.nextNodeId;
        break;
        
      case 'dial':
        twiml.dial(node.dialNumber!, {
          timeout: node.dialTimeout,
          record: node.record,
        });
        nextNodeId = node.nextNodeId;
        break;
        
      case 'voicemail':
        twiml.record({
          maxLength: node.maxLength ?? 120,
          playBeep: true,
          transcribe: node.transcribe,
          action: `${config.webhookBaseUrl}/ivr/${ventureId}/${treeId}/voicemail`,
        });
        break;
        
      case 'transfer':
        if (node.transferType === 'warm') {
          // Warm transfer - agent stays on the line
          const dial = twiml.dial({
            action: `${config.webhookBaseUrl}/ivr/${ventureId}/${treeId}/transfer-complete`,
          });
          dial.number(node.transferTo!);
        } else {
          // Cold transfer - direct redirect
          twiml.dial(node.transferTo!);
        }
        break;
        
      case 'hangup':
        twiml.hangup();
        break;
        
      case 'goto':
        nextNodeId = node.nextNodeId;
        break;
    }
    
    // If there's a next node and no explicit redirect
    if (nextNodeId) {
      twiml.redirect(`${config.webhookBaseUrl}/ivr/${ventureId}/${treeId}/${nextNodeId}`);
    }
    
    return { twiml: twiml.toString(), nextNodeId };
  }
  
  private validateIvrTree(nodes: IvrNode[], entryNodeId: string): void {
    const nodeIds = new Set(nodes.map(n => n.id));
    
    if (!nodeIds.has(entryNodeId)) {
      throw new VoiceError('INVALID_IVR', 'Entry node not found in nodes');
    }
    
    for (const node of nodes) {
      // Check all referenced nodes exist
      if (node.nextNodeId && !nodeIds.has(node.nextNodeId)) {
        throw new VoiceError('INVALID_IVR', `Node ${node.id} references missing node ${node.nextNodeId}`);
      }
      if (node.fallbackNodeId && !nodeIds.has(node.fallbackNodeId)) {
        throw new VoiceError('INVALID_IVR', `Node ${node.id} references missing fallback ${node.fallbackNodeId}`);
      }
      if (node.options) {
        for (const [key, targetId] of Object.entries(node.options)) {
          if (!nodeIds.has(targetId)) {
            throw new VoiceError('INVALID_IVR', `Node ${node.id} option ${key} references missing node ${targetId}`);
          }
        }
      }
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RECORDINGS
  // ═══════════════════════════════════════════════════════════════════════════
  
  async getRecording(ventureId: string, recordingId: string): Promise<Recording> {
    const recording = await db.query.recordings.findFirst({
      where: and(
        eq(recordings.id, recordingId),
        eq(recordings.ventureId, ventureId)
      ),
    });
    
    if (!recording) throw new VoiceError('RECORDING_NOT_FOUND', 'Recording not found');
    return recording;
  }
  
  async transcribeRecording(ventureId: string, recordingId: string): Promise<string> {
    const recording = await this.getRecording(ventureId, recordingId);
    
    await db.update(recordings)
      .set({ transcriptionStatus: 'processing' })
      .where(eq(recordings.id, recordingId));
    
    try {
      const result = await this.registry.execute(ventureId, async (client) => {
        return client.transcribeRecording(recording.providerRecordingSid!);
      });
      
      await db.update(recordings)
        .set({
          transcriptionText: result.text,
          transcriptionStatus: 'completed',
          transcriptionConfidence: result.confidence,
        })
        .where(eq(recordings.id, recordingId));
      
      return result.text;
    } catch (error) {
      await db.update(recordings)
        .set({ transcriptionStatus: 'failed' })
        .where(eq(recordings.id, recordingId));
      throw error;
    }
  }
  
  async deleteRecording(ventureId: string, recordingId: string): Promise<void> {
    const recording = await this.getRecording(ventureId, recordingId);
    
    await this.registry.execute(ventureId, async (client) => {
      await client.deleteRecording(recording.providerRecordingSid!);
    });
    
    await db.delete(recordings).where(eq(recordings.id, recordingId));
  }
}

export const voiceService = new VoiceService();
```

## API (tRPC Procedures)

```typescript
// @mcv/connectors/voice/router.ts
import { router, protectedProcedure, ventureAdminProcedure } from '@mcv/api';
import { z } from 'zod';
import { voiceService } from './services/voice.service';

export const voiceRouter = router({
  // ═══════════════════════════════════════════════════════════════════════════
  // CALLS
  // ═══════════════════════════════════════════════════════════════════════════
  
  initiateCall: protectedProcedure
    .input(z.object({
      to: z.string(),
      from: z.string(),
      url: z.string().url().optional(),
      twiml: z.string().optional(),
      record: z.boolean().optional(),
      transcribe: z.boolean().optional(),
      machineDetection: z.enum(['Enable', 'DetectMessageEnd']).optional(),
      timeout: z.number().min(5).max(120).optional(),
      metadata: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return voiceService.initiateCall(ctx.venture.id, input);
    }),
  
  endCall: protectedProcedure
    .input(z.object({ callId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await voiceService.endCall(ctx.venture.id, input.callId);
      return { success: true };
    }),
  
  transferCall: protectedProcedure
    .input(z.object({
      callId: z.string().uuid(),
      to: z.string(),
      type: z.enum(['warm', 'cold']).default('cold'),
      announceUrl: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { callId, ...transferInput } = input;
      await voiceService.transferCall(ctx.venture.id, callId, transferInput);
      return { success: true };
    }),
  
  getCall: protectedProcedure
    .input(z.object({ callId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return db.query.calls.findFirst({
        where: and(eq(calls.id, input.callId), eq(calls.ventureId, ctx.venture.id)),
      });
    }),
  
  listCalls: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(20),
      direction: z.enum(['inbound', 'outbound']).optional(),
      status: z.enum(['queued', 'ringing', 'in-progress', 'completed', 'failed']).optional(),
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      // Implementation...
    }),
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SMS
  // ═══════════════════════════════════════════════════════════════════════════
  
  sendSms: protectedProcedure
    .input(z.object({
      to: z.string(),
      from: z.string(),
      body: z.string().max(1600),
      mediaUrls: z.array(z.string().url()).max(10).optional(),
      metadata: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return voiceService.sendSms(ctx.venture.id, {
        ...input,
        userId: ctx.user.id,
      });
    }),
  
  sendBulkSms: protectedProcedure
    .input(z.object({
      recipients: z.array(z.string()).max(1000),
      from: z.string(),
      body: z.string().max(1600),
      mediaUrls: z.array(z.string().url()).max(10).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return voiceService.sendBulkSms(ctx.venture.id, input);
    }),
  
  listMessages: protectedProcedure
    .input(z.object({
      conversationId: z.string().uuid().optional(),
      direction: z.enum(['inbound', 'outbound']).optional(),
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(50),
    }).optional())
    .query(async ({ ctx, input }) => {
      // Implementation...
    }),
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PHONE NUMBERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  searchNumbers: protectedProcedure
    .input(z.object({
      country: z.string().length(2).default('US'),
      type: z.enum(['local', 'mobile', 'tollfree']).optional(),
      areaCode: z.string().optional(),
      contains: z.string().optional(),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      return voiceService.searchAvailableNumbers(ctx.venture.id, input);
    }),
  
  purchaseNumber: ventureAdminProcedure
    .input(z.object({ phoneNumber: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return voiceService.purchaseNumber(ctx.venture.id, input.phoneNumber);
    }),
  
  releaseNumber: ventureAdminProcedure
    .input(z.object({ phoneNumberId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await voiceService.releaseNumber(ctx.venture.id, input.phoneNumberId);
      return { success: true };
    }),
  
  listNumbers: protectedProcedure
    .query(async ({ ctx }) => {
      return db.query.phoneNumbers.findMany({
        where: and(
          eq(phoneNumbers.ventureId, ctx.venture.id),
          eq(phoneNumbers.status, 'active')
        ),
      });
    }),
  
  // ═══════════════════════════════════════════════════════════════════════════
  // IVR
  // ═══════════════════════════════════════════════════════════════════════════
  
  createIvrTree: ventureAdminProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      entryNodeId: z.string(),
      nodes: z.array(z.object({
        id: z.string(),
        type: z.enum(['menu', 'gather', 'say', 'play', 'dial', 'voicemail', 'transfer', 'hangup', 'goto']),
        text: z.string().optional(),
        voice: z.string().optional(),
        language: z.string().optional(),
        audioUrl: z.string().url().optional(),
        inputType: z.enum(['dtmf', 'speech', 'dtmf speech']).optional(),
        numDigits: z.number().optional(),
        timeout: z.number().optional(),
        options: z.record(z.string()).optional(),
        dialNumber: z.string().optional(),
        dialTimeout: z.number().optional(),
        record: z.boolean().optional(),
        transferTo: z.string().optional(),
        transferType: z.enum(['warm', 'cold']).optional(),
        maxLength: z.number().optional(),
        transcribe: z.boolean().optional(),
        nextNodeId: z.string().optional(),
        fallbackNodeId: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      return voiceService.createIvrTree(ctx.venture.id, {
        ...input,
        createdBy: ctx.user.id,
      });
    }),
  
  listIvrTrees: protectedProcedure
    .query(async ({ ctx }) => {
      return db.query.ivrTrees.findMany({
        where: eq(ivrTrees.ventureId, ctx.venture.id),
      });
    }),
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RECORDINGS
  // ═══════════════════════════════════════════════════════════════════════════
  
  getRecording: protectedProcedure
    .input(z.object({ recordingId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return voiceService.getRecording(ctx.venture.id, input.recordingId);
    }),
  
  transcribeRecording: protectedProcedure
    .input(z.object({ recordingId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const text = await voiceService.transcribeRecording(ctx.venture.id, input.recordingId);
      return { text };
    }),
  
  deleteRecording: ventureAdminProcedure
    .input(z.object({ recordingId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await voiceService.deleteRecording(ctx.venture.id, input.recordingId);
      return { success: true };
    }),
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CONVERSATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  listConversations: protectedProcedure
    .input(z.object({
      status: z.enum(['active', 'archived', 'blocked']).optional(),
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(20),
    }).optional())
    .query(async ({ ctx, input }) => {
      return db.query.voiceConversations.findMany({
        where: eq(voiceConversations.ventureId, ctx.venture.id),
        orderBy: desc(voiceConversations.lastMessageAt),
      });
    }),
  
  getConversation: protectedProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const conversation = await db.query.voiceConversations.findFirst({
        where: and(
          eq(voiceConversations.id, input.conversationId),
          eq(voiceConversations.ventureId, ctx.venture.id)
        ),
      });
      
      if (!conversation) throw new TRPCError({ code: 'NOT_FOUND' });
      
      const messages = await db.query.smsMessages.findMany({
        where: eq(smsMessages.conversationId, conversation.id),
        orderBy: desc(smsMessages.createdAt),
        limit: 100,
      });
      
      return { conversation, messages };
    }),
});
```

---

# Module: payments

## Purpose

Payment processing abstraction with Stripe as primary, PayPal and Square as alternatives. Handles payment intents, subscriptions, invoicing, refunds, disputes, and Connect (marketplace) payments.

## Providers

| Provider | Priority | Features |
|----------|----------|----------|
| **Stripe** | 100 | Full feature set - Cards, ACH, Subscriptions, Connect |
| **PayPal** | 80 | Alternative - PayPal, Venmo |
| **Square** | 60 | Alternative - POS, in-person |

## Schema

```typescript
// @mcv/connectors/payments/schema.ts
import { pgTable, text, timestamp, jsonb, uuid, integer, boolean, pgEnum, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { ventures } from '@mcv/identity/schema';
import { users } from '@mcv/identity/schema';
import { integrations } from '../schema/integrations';

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export const paymentProviderEnum = pgEnum('payment_provider', ['stripe', 'paypal', 'square']);

export const paymentIntentStatusEnum = pgEnum('payment_intent_status', [
  'requires_payment_method',
  'requires_confirmation',
  'requires_action',
  'processing',
  'requires_capture',
  'succeeded',
  'canceled'
]);

export const paymentMethodTypeEnum = pgEnum('payment_method_type', [
  'card',
  'bank_transfer',
  'ach',
  'sepa',
  'ideal',
  'paypal',
  'crypto',
  'wallet'
]);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused'
]);

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'open',
  'paid',
  'void',
  'uncollectible'
]);

export const refundStatusEnum = pgEnum('refund_status', [
  'pending',
  'succeeded',
  'failed',
  'canceled'
]);

export const disputeStatusEnum = pgEnum('dispute_status', [
  'warning_needs_response',
  'warning_under_review',
  'needs_response',
  'under_review',
  'charge_refunded',
  'won',
  'lost'
]);

// ═══════════════════════════════════════════════════════════════════════════════
// TABLES
// ═══════════════════════════════════════════════════════════════════════════════

// Payment customers (synced from provider)
export const paymentCustomers = pgTable('payment_customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  
  // MCV user link
  userId: uuid('user_id').references(() => users.id),
  
  // Provider IDs
  provider: paymentProviderEnum('provider').notNull(),
  providerCustomerId: text('provider_customer_id').notNull(),
  
  // Customer details
  email: text('email'),
  name: text('name'),
  phone: text('phone'),
  
  // Address
  addressLine1: text('address_line_1'),
  addressLine2: text('address_line_2'),
  city: text('city'),
  state: text('state'),
  postalCode: text('postal_code'),
  country: text('country'),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, string>>(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Payment methods
export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  customerId: uuid('customer_id').notNull().references(() => paymentCustomers.id, { onDelete: 'cascade' }),
  
  provider: paymentProviderEnum('provider').notNull(),
  providerMethodId: text('provider_method_id').notNull(),
  
  type: paymentMethodTypeEnum('type').notNull(),
  
  // Card details
  last4: text('last_4'),
  brand: text('brand'),  // visa, mastercard, amex, etc.
  expiryMonth: integer('expiry_month'),
  expiryYear: integer('expiry_year'),
  funding: text('funding'),  // credit, debit, prepaid
  
  // Bank details (for ACH/SEPA)
  bankName: text('bank_name'),
  accountLast4: text('account_last_4'),
  routingNumber: text('routing_number'),
  
  // Status
  isDefault: boolean('is_default').default(false),
  isValid: boolean('is_valid').default(true),
  
  // Billing address
  billingAddressLine1: text('billing_address_line_1'),
  billingCity: text('billing_city'),
  billingPostalCode: text('billing_postal_code'),
  billingCountry: text('billing_country'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Payment intents
export const paymentIntents = pgTable('payment_intents', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  customerId: uuid('customer_id').references(() => paymentCustomers.id),
  
  provider: paymentProviderEnum('provider').notNull(),
  providerIntentId: text('provider_intent_id').notNull(),
  
  // Amount
  amount: integer('amount').notNull(),  // In smallest currency unit
  currency: text('currency').notNull().default('usd'),
  
  // Status
  status: paymentIntentStatusEnum('status').notNull(),
  
  // Payment method
  paymentMethodId: uuid('payment_method_id').references(() => paymentMethods.id),
  paymentMethodType: paymentMethodTypeEnum('payment_method_type'),
  
  // Capture mode
  captureMethod: text('capture_method', { enum: ['automatic', 'manual'] }).default('automatic'),
  
  // Error tracking
  lastErrorCode: text('last_error_code'),
  lastErrorMessage: text('last_error_message'),
  
  // Description
  description: text('description'),
  statementDescriptor: text('statement_descriptor'),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, string>>(),
  
  // Idempotency
  idempotencyKey: text('idempotency_key'),
  
  // Receipt
  receiptEmail: text('receipt_email'),
  receiptNumber: text('receipt_number'),
  
  canceledAt: timestamp('canceled_at', { withTimezone: true }),
  succeededAt: timestamp('succeeded_at', { withTimezone: true }),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Payment transactions (successful charges)
export const paymentTransactions = pgTable('payment_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  intentId: uuid('intent_id').references(() => paymentIntents.id),
  customerId: uuid('customer_id').references(() => paymentCustomers.id),
  
  provider: paymentProviderEnum('provider').notNull(),
  providerChargeId: text('provider_charge_id'),
  providerBalanceTransactionId: text('provider_balance_transaction_id'),
  
  // Amounts
  amount: integer('amount').notNull(),
  fee: integer('fee').default(0),
  net: integer('net').notNull(),
  currency: text('currency').notNull().default('usd'),
  
  // Status
  status: text('status', { 
    enum: ['succeeded', 'pending', 'failed', 'refunded', 'partially_refunded'] 
  }).notNull(),
  
  // Description
  description: text('description'),
  
  // Refund tracking
  refundedAmount: integer('refunded_amount').default(0),
  
  // Dispute
  disputed: boolean('disputed').default(false),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, string>>(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Products and prices
export const paymentProducts = pgTable('payment_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  
  provider: paymentProviderEnum('provider').notNull(),
  providerProductId: text('provider_product_id').notNull(),
  
  name: text('name').notNull(),
  description: text('description'),
  
  // Product type
  type: text('type', { enum: ['service', 'good'] }).default('service'),
  
  // Images
  images: jsonb('images').$type<string[]>().default([]),
  
  // Status
  active: boolean('active').default(true),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, string>>(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const paymentPrices = pgTable('payment_prices', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  productId: uuid('product_id').notNull().references(() => paymentProducts.id, { onDelete: 'cascade' }),
  
  provider: paymentProviderEnum('provider').notNull(),
  providerPriceId: text('provider_price_id').notNull(),
  
  // Pricing
  type: text('type', { enum: ['one_time', 'recurring'] }).notNull(),
  unitAmount: integer('unit_amount'),  // In smallest currency unit
  currency: text('currency').notNull().default('usd'),
  
  // Recurring details
  interval: text('interval', { enum: ['day', 'week', 'month', 'year'] }),
  intervalCount: integer('interval_count').default(1),
  
  // Tiers (for usage-based pricing)
  billingScheme: text('billing_scheme', { enum: ['per_unit', 'tiered'] }).default('per_unit'),
  tiers: jsonb('tiers').$type<{
    upTo: number | null;
    unitAmount: number;
    flatAmount?: number;
  }[]>(),
  tiersMode: text('tiers_mode', { enum: ['graduated', 'volume'] }),
  
  // Trial
  trialPeriodDays: integer('trial_period_days'),
  
  // Status
  active: boolean('active').default(true),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, string>>(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Subscriptions
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  customerId: uuid('customer_id').notNull().references(() => paymentCustomers.id),
  
  provider: paymentProviderEnum('provider').notNull(),
  providerSubscriptionId: text('provider_subscription_id').notNull(),
  
  // Status
  status: subscriptionStatusEnum('status').notNull(),
  
  // Pricing
  priceId: uuid('price_id').references(() => paymentPrices.id),
  quantity: integer('quantity').default(1),
  
  // Billing cycle
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  
  // Dates
  startDate: timestamp('start_date', { withTimezone: true }),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  canceledAt: timestamp('canceled_at', { withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  
  // Trial
  trialStart: timestamp('trial_start', { withTimezone: true }),
  trialEnd: timestamp('trial_end', { withTimezone: true }),
  
  // Payment
  defaultPaymentMethodId: uuid('default_payment_method_id').references(() => paymentMethods.id),
  latestInvoiceId: uuid('latest_invoice_id'),
  
  // Collection
  collectionMethod: text('collection_method', { enum: ['charge_automatically', 'send_invoice'] }).default('charge_automatically'),
  daysUntilDue: integer('days_until_due'),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, string>>(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Invoices
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  customerId: uuid('customer_id').notNull().references(() => paymentCustomers.id),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id),
  
  provider: paymentProviderEnum('provider').notNull(),
  providerInvoiceId: text('provider_invoice_id').notNull(),
  
  // Invoice number
  number: text('number'),
  
  // Status
  status: invoiceStatusEnum('status').notNull(),
  
  // Amounts
  subtotal: integer('subtotal'),
  tax: integer('tax').default(0),
  total: integer('total'),
  amountDue: integer('amount_due'),
  amountPaid: integer('amount_paid'),
  amountRemaining: integer('amount_remaining'),
  currency: text('currency').notNull().default('usd'),
  
  // Dates
  dueDate: timestamp('due_date', { withTimezone: true }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  voidedAt: timestamp('voided_at', { withTimezone: true }),
  
  // URLs
  hostedInvoiceUrl: text('hosted_invoice_url'),
  invoicePdf: text('invoice_pdf'),
  
  // Description
  description: text('description'),
  footer: text('footer'),
  
  // Collection
  collectionMethod: text('collection_method'),
  attemptCount: integer('attempt_count').default(0),
  nextPaymentAttempt: timestamp('next_payment_attempt', { withTimezone: true }),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, string>>(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Invoice line items
export const invoiceLineItems = pgTable('invoice_line_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  
  provider: paymentProviderEnum('provider').notNull(),
  providerLineItemId: text('provider_line_item_id'),
  
  // Item details
  description: text('description'),
  quantity: integer('quantity').default(1),
  unitAmount: integer('unit_amount'),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull().default('usd'),
  
  // Period (for subscriptions)
  periodStart: timestamp('period_start', { withTimezone: true }),
  periodEnd: timestamp('period_end', { withTimezone: true }),
  
  // References
  priceId: uuid('price_id').references(() => paymentPrices.id),
  
  // Proration
  proration: boolean('proration').default(false),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Refunds
export const refunds = pgTable('refunds', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  transactionId: uuid('transaction_id').notNull().references(() => paymentTransactions.id),
  
  provider: paymentProviderEnum('provider').notNull(),
  providerRefundId: text('provider_refund_id').notNull(),
  
  // Amount
  amount: integer('amount').notNull(),
  currency: text('currency').notNull().default('usd'),
  
  // Status
  status: refundStatusEnum('status').notNull(),
  
  // Reason
  reason: text('reason', { enum: ['duplicate', 'fraudulent', 'requested_by_customer', 'other'] }),
  failureReason: text('failure_reason'),
  
  // Description
  description: text('description'),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, string>>(),
  
  // Who initiated
  refundedBy: uuid('refunded_by').references(() => users.id),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Disputes
export const disputes = pgTable('disputes', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  transactionId: uuid('transaction_id').notNull().references(() => paymentTransactions.id),
  
  provider: paymentProviderEnum('provider').notNull(),
  providerDisputeId: text('provider_dispute_id').notNull(),
  
  // Amount
  amount: integer('amount').notNull(),
  currency: text('currency').notNull().default('usd'),
  
  // Status
  status: disputeStatusEnum('status').notNull(),
  
  // Reason
  reason: text('reason'),
  
  // Evidence deadline
  evidenceDueBy: timestamp('evidence_due_by', { withTimezone: true }),
  
  // Evidence submitted
  evidenceSubmitted: boolean('evidence_submitted').default(false),
  evidenceSubmittedAt: timestamp('evidence_submitted_at', { withTimezone: true }),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Stripe Connect accounts (for marketplace)
export const connectedAccounts = pgTable('connected_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  
  // Account owner
  userId: uuid('user_id').references(() => users.id),
  organizationId: uuid('organization_id'),
  
  provider: paymentProviderEnum('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  
  // Account type
  type: text('type', { enum: ['standard', 'express', 'custom'] }).notNull(),
  
  // Status
  detailsSubmitted: boolean('details_submitted').default(false),
  chargesEnabled: boolean('charges_enabled').default(false),
  payoutsEnabled: boolean('payouts_enabled').default(false),
  
  // Business info
  businessType: text('business_type'),
  country: text('country'),
  defaultCurrency: text('default_currency'),
  
  // Requirements
  currentlyDue: jsonb('currently_due').$type<string[]>(),
  eventuallyDue: jsonb('eventually_due').$type<string[]>(),
  pastDue: jsonb('past_due').$type<string[]>(),
  
  // Onboarding URLs
  onboardingUrl: text('onboarding_url'),
  dashboardUrl: text('dashboard_url'),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, string>>(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Payouts (to connected accounts or bank accounts)
export const payouts = pgTable('payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  connectedAccountId: uuid('connected_account_id').references(() => connectedAccounts.id),
  
  provider: paymentProviderEnum('provider').notNull(),
  providerPayoutId: text('provider_payout_id').notNull(),
  
  // Amount
  amount: integer('amount').notNull(),
  currency: text('currency').notNull().default('usd'),
  
  // Status
  status: text('status', { 
    enum: ['pending', 'in_transit', 'paid', 'failed', 'canceled'] 
  }).notNull(),
  
  // Destination
  destinationType: text('destination_type', { enum: ['bank_account', 'card'] }),
  destinationLast4: text('destination_last_4'),
  
  // Timing
  arrivalDate: timestamp('arrival_date', { withTimezone: true }),
  
  // Failure
  failureCode: text('failure_code'),
  failureMessage: text('failure_message'),
  
  // Description
  description: text('description'),
  statementDescriptor: text('statement_descriptor'),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, string>>(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

## Services

```typescript
// @mcv/connectors/payments/services/payments.service.ts
import { StripeProvider } from '../providers/stripe.provider';
import { PayPalProvider } from '../providers/paypal.provider';
import { SquareProvider } from '../providers/square.provider';
import { ProviderRegistry } from '../../common/provider-registry';
import type {
  CreatePaymentIntentInput,
  CreateSubscriptionInput,
  CreateCheckoutSessionInput,
  CreateRefundInput,
  PaymentIntentResult,
  SubscriptionResult,
  CheckoutSessionResult,
} from '../types';

export class PaymentsService {
  private readonly registry: ProviderRegistry<PaymentProvider>;
  
  constructor() {
    this.registry = new ProviderRegistry<PaymentProvider>();
    this.registry.register(new StripeProvider());
    this.registry.register(new PayPalProvider());
    this.registry.register(new SquareProvider());
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PAYMENT INTENTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  async createPaymentIntent(
    ventureId: string, 
    input: CreatePaymentIntentInput
  ): Promise<PaymentIntentResult> {
    // Create local record first
    const [intent] = await db.insert(paymentIntents).values({
      ventureId,
      provider: 'stripe', // Will be updated
      providerIntentId: '',
      amount: input.amount,
      currency: input.currency ?? 'usd',
      status: 'requires_payment_method',
      customerId: input.customerId,
      description: input.description,
      statementDescriptor: input.statementDescriptor,
      metadata: input.metadata,
      idempotencyKey: input.idempotencyKey,
      captureMethod: input.captureMethod ?? 'automatic',
    }).returning();
    
    try {
      const result = await this.registry.execute(ventureId, async (client) => {
        const customer = input.customerId 
          ? await this.getCustomer(ventureId, input.customerId)
          : null;
        
        return client.createPaymentIntent({
          amount: input.amount,
          currency: input.currency ?? 'usd',
          customer: customer?.providerCustomerId,
          description: input.description,
          statementDescriptor: input.statementDescriptor,
          metadata: {
            intentId: intent.id,
            ventureId,
            ...input.metadata,
          },
          captureMethod: input.captureMethod,
          setupFutureUsage: input.setupFutureUsage,
          paymentMethodTypes: input.paymentMethodTypes,
        });
      });
      
      await db.update(paymentIntents)
        .set({
          provider: result.provider,
          providerIntentId: result.intentId,
          status: result.status,
        })
        .where(eq(paymentIntents.id, intent.id));
      
      return {
        success: true,
        intentId: intent.id,
        providerIntentId: result.intentId,
        clientSecret: result.clientSecret,
        status: result.status,
        provider: result.provider,
      };
    } catch (error) {
      await db.update(paymentIntents)
        .set({
          status: 'canceled',
          lastErrorCode: (error as any).code,
          lastErrorMessage: (error as Error).message,
        })
        .where(eq(paymentIntents.id, intent.id));
      throw error;
    }
  }
  
  async confirmPaymentIntent(
    ventureId: string,
    intentId: string,
    paymentMethodId?: string
  ): Promise<PaymentIntentResult> {
    const intent = await this.getPaymentIntent(ventureId, intentId);
    
    const result = await this.registry.execute(ventureId, async (client) => {
      const method = paymentMethodId
        ? await this.getPaymentMethod(ventureId, paymentMethodId)
        : null;
      
      return client.confirmPaymentIntent(
        intent.providerIntentId,
        method?.providerMethodId
      );
    });
    
    await db.update(paymentIntents)
      .set({
        status: result.status,
        paymentMethodId: paymentMethodId,
        updatedAt: new Date(),
        succeededAt: result.status === 'succeeded' ? new Date() : null,
      })
      .where(eq(paymentIntents.id, intentId));
    
    // Create transaction record if succeeded
    if (result.status === 'succeeded') {
      await db.insert(paymentTransactions).values({
        ventureId,
        intentId,
        customerId: intent.customerId,
        provider: intent.provider,
        providerChargeId: result.chargeId,
        amount: intent.amount,
        fee: result.fee ?? 0,
        net: intent.amount - (result.fee ?? 0),
        currency: intent.currency,
        status: 'succeeded',
        description: intent.description,
        metadata: intent.metadata,
      });
    }
    
    return {
      success: result.status === 'succeeded',
      intentId,
      providerIntentId: intent.providerIntentId,
      status: result.status,
      provider: intent.provider,
    };
  }
  
  async capturePaymentIntent(
    ventureId: string,
    intentId: string,
    amount?: number
  ): Promise<PaymentIntentResult> {
    const intent = await this.getPaymentIntent(ventureId, intentId);
    
    if (intent.status !== 'requires_capture') {
      throw new PaymentError('INVALID_STATE', 'Payment intent not ready for capture');
    }
    
    const result = await this.registry.execute(ventureId, async (client) => {
      return client.capturePaymentIntent(intent.providerIntentId, amount);
    });
    
    await db.update(paymentIntents)
      .set({
        status: 'succeeded',
        succeededAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(paymentIntents.id, intentId));
    
    // Create transaction
    await db.insert(paymentTransactions).values({
      ventureId,
      intentId,
      customerId: intent.customerId,
      provider: intent.provider,
      providerChargeId: result.chargeId,
      amount: amount ?? intent.amount,
      fee: result.fee ?? 0,
      net: (amount ?? intent.amount) - (result.fee ?? 0),
      currency: intent.currency,
      status: 'succeeded',
      description: intent.description,
      metadata: intent.metadata,
    });
    
    return {
      success: true,
      intentId,
      providerIntentId: intent.providerIntentId,
      status: 'succeeded',
      provider: intent.provider,
    };
  }
  
  async cancelPaymentIntent(ventureId: string, intentId: string): Promise<void> {
    const intent = await this.getPaymentIntent(ventureId, intentId);
    
    await this.registry.execute(ventureId, async (client) => {
      return client.cancelPaymentIntent(intent.providerIntentId);
    });
    
    await db.update(paymentIntents)
      .set({
        status: 'canceled',
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(paymentIntents.id, intentId));
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SUBSCRIPTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  async createSubscription(
    ventureId: string,
    input: CreateSubscriptionInput
  ): Promise<SubscriptionResult> {
    const customer = await this.getCustomer(ventureId, input.customerId);
    const price = await this.getPrice(ventureId, input.priceId);
    
    const result = await this.registry.execute(ventureId, async (client) => {
      const paymentMethod = input.paymentMethodId
        ? await this.getPaymentMethod(ventureId, input.paymentMethodId)
        : null;
      
      return client.createSubscription({
        customerId: customer.providerCustomerId,
        priceId: price.providerPriceId,
        quantity: input.quantity,
        paymentMethodId: paymentMethod?.providerMethodId,
        trialPeriodDays: input.trialPeriodDays ?? price.trialPeriodDays,
        metadata: {
          ventureId,
          ...input.metadata,
        },
        cancelAtPeriodEnd: input.cancelAtPeriodEnd,
        collectionMethod: input.collectionMethod,
      });
    });
    
    const [subscription] = await db.insert(subscriptions).values({
      ventureId,
      customerId: input.customerId,
      provider: result.provider,
      providerSubscriptionId: result.subscriptionId,
      status: result.status,
      priceId: input.priceId,
      quantity: input.quantity,
      currentPeriodStart: result.currentPeriodStart,
      currentPeriodEnd: result.currentPeriodEnd,
      startDate: result.startDate,
      trialStart: result.trialStart,
      trialEnd: result.trialEnd,
      defaultPaymentMethodId: input.paymentMethodId,
      collectionMethod: input.collectionMethod ?? 'charge_automatically',
      cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? false,
      metadata: input.metadata,
    }).returning();
    
    return {
      success: true,
      subscriptionId: subscription.id,
      providerSubscriptionId: result.subscriptionId,
      status: result.status,
      clientSecret: result.clientSecret,
      provider: result.provider,
    };
  }
  
  async cancelSubscription(
    ventureId: string,
    subscriptionId: string,
    immediately = false
  ): Promise<void> {
    const subscription = await this.getSubscription(ventureId, subscriptionId);
    
    await this.registry.execute(ventureId, async (client) => {
      if (immediately) {
        return client.cancelSubscriptionImmediately(subscription.providerSubscriptionId);
      } else {
        return client.cancelSubscriptionAtPeriodEnd(subscription.providerSubscriptionId);
      }
    });
    
    await db.update(subscriptions)
      .set({
        status: immediately ? 'canceled' : subscription.status,
        cancelAtPeriodEnd: !immediately,
        canceledAt: new Date(),
        endedAt: immediately ? new Date() :