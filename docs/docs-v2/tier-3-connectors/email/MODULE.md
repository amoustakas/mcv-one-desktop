# @mcv/email — Email Connector Module Specification

**Package:** `@mcv/email`
**Tier:** 3 — External Service Connector
**Classification:** PUBLISHABLE
**Version:** 1.0.0
**Last Updated:** February 8, 2026

---

## Table of Contents

1.  [Purpose & Overview](#1-purpose--overview)
2.  [Architecture](#2-architecture)
3.  [Package Structure](#3-package-structure)
4.  [Exports](#4-exports)
5.  [TypeScript Interfaces](#5-typescript-interfaces)
6.  [Database Schema (Drizzle ORM)](#6-database-schema-drizzle-orm)
7.  [Server Services — Deep Dive](#7-server-services--deep-dive)
8.  [Client Hooks (React)](#8-client-hooks-react)
9.  [Built-In Email Templates](#9-built-in-email-templates)
10. [Template Helper Functions](#10-template-helper-functions)
11. [Webhook Integration](#11-webhook-integration)
12. [Code Examples](#12-code-examples)
13. [Environment Variables](#13-environment-variables)
14. [Error Codes](#14-error-codes)
15. [Audit Events](#15-audit-events)
16. [Performance Considerations](#16-performance-considerations)
17. [Security Considerations](#17-security-considerations)
18. [Credential Resolution Chain](#18-credential-resolution-chain)
19. [Dependencies](#19-dependencies)
20. [Related Modules](#20-related-modules)
21. [Migration & Deployment Notes](#21-migration--deployment-notes)

---

## 1. Purpose & Overview

The `@mcv/email` package provides **comprehensive email infrastructure** for the MCV.ONE
ecosystem. It wraps the SendGrid API with per-venture tenant isolation via subusers, supports
both transactional and marketing emails, includes a Handlebars-based template engine with
built-in responsive HTML templates, manages contact lists with suppression handling, tracks
delivery metrics through real-time analytics, and processes SendGrid webhook events for
automated status updates and compliance enforcement.

**This module is the single source of truth for all outbound email operations across
every MCV.ONE venture.**

### Key Capabilities

| Capability                  | Description                                                                                   |
|-----------------------------|-----------------------------------------------------------------------------------------------|
| **Per-Venture Isolation**   | Each venture gets its own SendGrid subuser with dedicated API key, domain auth, and IP warmup |
| **Transactional Emails**    | Welcome, password reset, invoice, notification emails with template rendering                 |
| **Marketing Campaigns**     | Create, schedule, A/B test, and send marketing campaigns to contact lists                     |
| **Template Engine**         | Handlebars-powered templates with MJML support, versioning, and variable injection            |
| **Built-In Templates**      | 6 production-ready responsive email templates (base, welcome, reset, invoice, notification, marketing) |
| **Deliverability**          | Domain authentication (DKIM/SPF/DMARC), IP warmup schedules, reputation scoring               |
| **Analytics**               | Open/click/bounce tracking, engagement timelines, per-campaign and per-venture metrics        |
| **List Management**         | Static/dynamic contact lists, suppression handling (bounces, spam reports, unsubscribes)      |
| **Webhook Processing**      | Real-time SendGrid event webhook processing with ECDSA signature verification                  |
| **Credential Management**   | Three-tier credential resolution: System Vault → subuser API key → master key fallback        |

### Design Philosophy

```
  MULTI-TENANCY FIRST:   Every operation is scoped to a ventureId
  FAIL-SAFE DELIVERY:    Suppression checks before every send; auto-suppress on bounce/spam
  COMPOSABLE TEMPLATES:  Base layout + slot-based rendering; built-in or user-defined
  REAL-TIME TRACKING:    Webhook-driven status pipeline; no polling required
  GRACEFUL DEGRADATION:  Every service handles db === null; returns safe defaults
```

---

## 2. Architecture

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              @mcv/email Package                                       │
│                                                                                       │
│  ┌──────────────────────────┐  ┌──────────────────────────┐  ┌─────────────────────┐ │
│  │      CLIENT LAYER        │  │      SERVER LAYER         │  │   TEMPLATE LAYER    │ │
│  │    (React Hooks)         │  │     (Node Services)       │  │   (Handlebars)      │ │
│  │                          │  │                           │  │                     │ │
│  │  useEmailCampaigns()     │  │  SendGridClientService    │  │  base.template      │ │
│  │  useEmailAnalytics()     │  │  TransactionalService     │  │  welcome.template   │ │
│  │  useEmailTemplates()     │  │  MarketingService         │  │  password-reset     │ │
│  │                          │  │  TemplateService          │  │  invoice.template   │ │
│  │  Calls: /api/email/*     │  │  DeliverabilityService    │  │  notification       │ │
│  │  State: useState/Effect  │  │  ListService              │  │  marketing          │ │
│  │  Pattern: fetch + JSON   │  │  AnalyticsService         │  │                     │ │
│  │                          │  │  WebhookHandlerService    │  │  Helpers:           │ │
│  │                          │  │                           │  │  button(), infoBox() │ │
│  │                          │  │  Auth Utils               │  │  codeBox(), esc()   │ │
│  │                          │  │  (System Vault fallback)  │  │  dataTable()        │ │
│  └──────────┬───────────────┘  └────────────┬──────────────┘  │  toPlainText()      │ │
│             │                               │                 └──────────┬──────────┘ │
│             │          REST API             │                            │             │
└─────────────┼───────────────────────────────┼────────────────────────────┼─────────────┘
              │                               │                            │
              ▼                               ▼                            ▼
     ┌─────────────────┐         ┌────────────────────┐         ┌──────────────────┐
     │  React Frontend │         │   SendGrid API v3  │         │  PostgreSQL DB   │
     │  (Admin Panel)  │         │                    │         │  (via @mcv/db)   │
     │                 │         │  • /v3/mail/send   │         │                  │
     │  Campaign mgmt  │         │  • /v3/subusers    │         │  email_subusers  │
     │  Template editor│         │  • /v3/whitelabel  │         │  email_templates │
     │  Analytics dash │         │  • /v3/api_keys    │         │  email_campaigns │
     │  List manager   │         │  • /v3/stats       │         │  email_sends     │
     │                 │         │  • Webhooks (in)   │         │  email_lists     │
     └─────────────────┘         └────────────────────┘         │  email_suppress. │
                                                                │  email_domains   │
     ┌─────────────────┐         ┌────────────────────┐         │  email_ip_warmup │
     │  @mcv/secrets   │         │  @mcv/integrations │         └──────────────────┘
     │  (System Vault) │         │  (Connection Reg.) │
     │                 │         │                    │
     │  GCP Secret Mgr │         │  sendgrid provider │
     │  Master API key │         │  status: connected │
     └─────────────────┘         └────────────────────┘
```

### Data Flow — Transactional Email Send

```
Application Code (any MCV module)
       │
       ▼
TransactionalService.send(ventureId, options)
       │
       ├──► 1. Extract recipient email (string | { email, name })
       │
       ├──► 2. Check suppression list (emailSuppressions table)
       │         └── If suppressed → return { success: false, error: "suppressed" }
       │
       ├──► 3. Render template (TemplateService.render)
       │         ├── Lookup by ID first, then by name
       │         ├── Apply Handlebars compilation
       │         ├── Merge default variable values
       │         └── Generate HTML + plain text + subject
       │
       ├──► 4. Get venture-specific SendGrid client
       │         └── SendGridClientService.getClient(ventureId)
       │              ├── Cache hit? → Return cached (5-min TTL)
       │              ├── System Vault? → integrations + @mcv/secrets
       │              ├── Subuser key? → emailSubusers.apiKey
       │              └── Fallback → SENDGRID_API_KEY env var
       │
       ├──► 5. Insert email_sends record (status: 'queued')
       │
       ├──► 6. SendGrid API: sgMail.send({ to, from, subject, html, text, ... })
       │         └── customArgs: { ventureId, sendId } for webhook correlation
       │
       ├──► 7. Update email_sends record (status: 'sent', sendgridMessageId)
       │
       └──► 8. Return SendResult { success: true, messageId, sendId }

                    ─── Later (async via webhook) ───

SendGrid Webhook POST /webhooks/sendgrid
       │
       ▼
WebhookHandlerService.processEvent(event)
       │
       ├──► 1. Parse sg_message_id (strip filter suffix)
       ├──► 2. Lookup email_sends by sendgridMessageId
       ├──► 3. Switch on event type:
       │         ├── delivered   → status = 'delivered'
       │         ├── open        → status = 'opened', openedAt (first only)
       │         ├── click       → status = 'clicked', clickedAt, lastClickedUrl
       │         ├── bounce      → status = 'bounced', add to suppression (hard)
       │         ├── dropped     → status = 'dropped', record reason
       │         ├── deferred    → status = 'deferred'
       │         ├── spamreport  → status = 'spam_report', add to suppression
       │         ├── unsubscribe → status = 'unsubscribed', add to suppression
       │         └── processed   → status = 'sent'
       │
       ├──► 4. If send belongs to a campaign → recalculate campaign stats
       │         └── Aggregate SQL: count(*) filter (where status = ...) for each metric
       │
       └──► 5. Update emailCampaigns.stats JSONB
```

### Data Flow — Marketing Campaign Send

```
MarketingService.sendCampaign(campaignId)
       │
       ├──► 1. Validate campaign exists and status is 'draft' or 'scheduled'
       ├──► 2. Set status = 'sending'
       ├──► 3. Load template via TemplateService.getById()
       ├──► 4. Get recipients from lists (getRecipients → contacts join)
       ├──► 5. Load ALL suppressed emails for venture into Set<string>
       ├──► 6. Filter recipients (remove suppressed)
       │
       ├──► 7. Batch loop (BATCH_SIZE = 100):
       │         For each recipient:
       │         ├── Render template with recipient variables
       │         ├── Insert email_sends record (campaignId linked)
       │         ├── sgMail.send() with customArgs { campaignId, ventureId, sendId }
       │         ├── On success: update status = 'sent'
       │         └── On failure: update status = 'dropped'
       │
       ├──► 8. Update campaign: status = 'sent', sentAt, totalRecipients, initial stats
       └──► 9. Return { success: true, totalRecipients }
```

### Entity Relationship Diagram

```
                         ┌──────────────────┐
                         │     ventures     │
                         │     (parent)     │
                         └────────┬─────────┘
                                  │ 1
                    ┌─────────────┼─────────────┬──────────────┐
                    │             │             │              │
                    │ *           │ *           │ *            │ *
           ┌────────┴───────┐  ┌─┴──────────┐ ┌┴───────────┐ ┌┴──────────────┐
           │ email_subusers │  │email_domains│ │email_lists  │ │email_ip_warmup│
           │                │  │             │ │             │ │               │
           │ • username     │  │ • domain    │ │ • name      │ │ • ipAddress   │
           │ • apiKey       │  │ • dkim*     │ │ • type      │ │ • currentDay  │
           │ • status       │  │ • spf*      │ │ • filter    │ │ • schedule    │
           │ • dailyLimit   │  │ • dmarc*    │ │ • count     │ │ • status      │
           └────────────────┘  │ • isDefault │ └─────────────┘ └───────────────┘
                               └─────────────┘
                    │             │
                    │ *           │ *
           ┌────────┴───────┐  ┌─┴────────────────┐
           │email_templates │  │email_suppressions │
           │                │  │                   │
           │ • name         │  │ • email           │
           │ • subject      │  │ • type            │
           │ • htmlContent  │  │ • reason          │
           │ • category     │  └───────────────────┘
           │ • variables    │
           │ • version      │
           └───────┬────────┘
                   │ 1
                   │
                   │ *
           ┌───────┴────────┐
           │email_campaigns │
           │                │
           │ • name/subject │
           │ • listIds      │──── references email_lists (JSONB, not FK)
           │ • status       │
           │ • stats (JSONB)│
           │ • abTestConfig │
           └───────┬────────┘
                   │ 1
                   │
                   │ *
           ┌───────┴────────┐
           │  email_sends   │
           │                │
           │ • toEmail      │
           │ • status       │
           │ • messageId    │
           │ • openedAt     │
           │ • clickedAt    │
           │ • bouncedAt    │
           │ • metadata     │
           └────────────────┘
```

---

## 3. Package Structure

```
packages/email/
├── src/
│   ├── index.ts                              # Re-exports all types from types.ts
│   ├── types.ts                              # All TypeScript interfaces + EmailError class
│   │
│   ├── client/
│   │   ├── index.ts                          # Client barrel exports (hooks + types)
│   │   └── hooks/
│   │       ├── use-email-analytics.ts        # Analytics dashboard hook (metrics, timeline, top campaigns)
│   │       ├── use-email-campaigns.ts        # Campaign CRUD hook (create, send, schedule, pause, cancel)
│   │       └── use-email-templates.ts        # Template management hook (create, edit, preview, render)
│   │
│   └── server/
│       ├── index.ts                          # Server barrel exports (services + templates)
│       ├── services/
│       │   ├── sendgrid-client.service.ts    # Per-venture SendGrid client management (singleton)
│       │   ├── transactional.service.ts      # Transactional email sends + batch sends (singleton)
│       │   ├── marketing.service.ts          # Campaign lifecycle management (singleton)
│       │   ├── template.service.ts           # Template CRUD + Handlebars rendering (singleton)
│       │   ├── deliverability.service.ts     # Domain auth, IP warmup, reputation (singleton)
│       │   ├── list.service.ts               # Contact lists + suppression management (singleton)
│       │   ├── analytics.service.ts          # Metrics, time-series, reports (singleton)
│       │   └── webhook-handler.service.ts    # SendGrid webhook processing (singleton)
│       ├── templates/
│       │   ├── base.template.ts              # Base responsive HTML email layout + utility functions
│       │   ├── welcome.template.ts           # Welcome/onboarding email
│       │   ├── password-reset.template.ts    # Password reset with OTP code support
│       │   ├── invoice.template.ts           # Invoice with line items and payment CTA
│       │   ├── notification.template.ts      # Generic system notification with severity levels
│       │   └── marketing.template.ts         # Flexible marketing email with sections + hero
│       └── utils/
│           └── auth.ts                       # SendGrid credential resolution (Vault → env)
│
└── package.json
```

---

## 4. Exports

### Root Export (`@mcv/email`)

```typescript
// Re-exports everything from types.ts
export * from './types';
```

### Server Export (`@mcv/email/server`)

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// SERVICES (Classes + Singletons)
// ═══════════════════════════════════════════════════════════════════════════════

export { SendGridClientService, sendGridClientService } from './services/sendgrid-client.service';
export { TransactionalService, transactionalService } from './services/transactional.service';
export { MarketingService, marketingService } from './services/marketing.service';
export { TemplateService, templateService } from './services/template.service';
export { DeliverabilityService, deliverabilityService } from './services/deliverability.service';
export { ListService, listService } from './services/list.service';
export { AnalyticsService, analyticsService } from './services/analytics.service';
export { WebhookHandlerService, webhookHandlerService } from './services/webhook-handler.service';

// ═══════════════════════════════════════════════════════════════════════════════
// BUILT-IN TEMPLATES (Render Functions + Types)
// ═══════════════════════════════════════════════════════════════════════════════

export { renderBaseTemplate, button, infoBox, codeBox, dataTable, esc, toPlainText }
  from './templates/base.template';
export type { BaseEmailOptions, EmailContent } from './templates/base.template';

export { renderWelcomeEmail } from './templates/welcome.template';
export type { WelcomeEmailData } from './templates/welcome.template';

export { renderPasswordResetEmail } from './templates/password-reset.template';
export type { PasswordResetEmailData } from './templates/password-reset.template';

export { renderInvoiceEmail } from './templates/invoice.template';
export type { InvoiceEmailData, InvoiceLineItem } from './templates/invoice.template';

export { renderNotificationEmail } from './templates/notification.template';
export type { NotificationEmailData } from './templates/notification.template';

export { renderMarketingEmail } from './templates/marketing.template';
export type { MarketingEmailData, MarketingSection } from './templates/marketing.template';
```

### Client Export (`@mcv/email/client`)

```typescript
export { useEmailCampaigns } from './hooks/use-email-campaigns';
export type { UseEmailCampaignsOptions, UseEmailCampaignsResult, Campaign }
  from './hooks/use-email-campaigns';

export { useEmailAnalytics } from './hooks/use-email-analytics';
export type { UseEmailAnalyticsOptions, UseEmailAnalyticsResult, EmailMetrics, TimelinePoint }
  from './hooks/use-email-analytics';

export { useEmailTemplates } from './hooks/use-email-templates';
export type { UseEmailTemplatesOptions, UseEmailTemplatesResult, EmailTemplateItem, TemplatePreview }
  from './hooks/use-email-templates';
```

---

## 5. TypeScript Interfaces

### 5.1 SendGrid Client Types

```typescript
interface SendGridConfig {
  apiKey: string;
  baseUrl?: string;
}

interface SubuserConfig {
  ventureId: string;
  domain: string;
  username?: string;
}

interface SubuserResult {
  subuserId: string;
  username: string;
  apiKey: string;
}
```

### 5.2 Transactional Email Types

```typescript
interface TransactionalSendOptions {
  to: string | { email: string; name?: string };
  template: string;                    // Template ID (uuid) or name (string)
  variables: Record<string, unknown>;  // Handlebars template variables
  from?: { email: string; name?: string };
  replyTo?: string;
  subject?: string;                    // Override template subject
  attachments?: EmailAttachment[];
  categories?: string[];               // SendGrid categories for filtering
  metadata?: Record<string, unknown>;  // Stored in email_sends.metadata
}

interface EmailAttachment {
  content: string;              // base64-encoded file content
  filename: string;
  type: string;                 // MIME type (e.g., 'application/pdf')
  disposition?: 'attachment' | 'inline';
  contentId?: string;           // For inline images (CID references)
}

interface BatchSendOptions {
  messages: TransactionalSendOptions[];
}

interface SendResult {
  success: boolean;
  messageId?: string;           // SendGrid x-message-id header
  sendId?: string;              // email_sends.id (our DB record)
  error?: string;
}

interface BatchSendResult {
  total: number;
  sent: number;
  failed: number;
  results: SendResult[];
}
```

### 5.3 Marketing / Campaign Types

```typescript
interface CreateCampaignInput {
  name: string;
  subject: string;
  templateId: string;
  listIds?: string[];
  segmentIds?: string[];
  fromEmail: string;
  fromName: string;
  replyTo?: string;
}

interface UpdateCampaignInput {
  name?: string;
  subject?: string;
  templateId?: string;
  listIds?: string[];
  segmentIds?: string[];
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
}

interface AbTestVariant {
  id: string;
  subject?: string;
  templateId?: string;
  weight: number;               // Percentage of traffic (all variants must sum to 100)
}

interface CreateAbTestInput {
  variants: AbTestVariant[];
  testSize: number;             // Percentage of list to use for test (e.g., 20)
  winnerCriteria: 'open_rate' | 'click_rate';
  testDurationHours: number;
}

interface CampaignStatsResult {
  campaignId: string;
  name: string;
  status: string;
  totalRecipients: number;
  sent: number;
  delivered: number;
  deliveryRate: number;         // (delivered / sent) × 100
  opened: number;
  openRate: number;             // (opened / delivered) × 100
  clicked: number;
  clickRate: number;            // (clicked / delivered) × 100
  bounced: number;
  bounceRate: number;           // (bounced / sent) × 100
  unsubscribed: number;
  unsubscribeRate: number;      // (unsubscribed / delivered) × 100
  spamReports: number;
  spamRate: number;             // (spamReports / delivered) × 100
}
```

### 5.4 Template Types

```typescript
interface CreateTemplateInput {
  name: string;
  subject: string;
  htmlContent: string;
  mjmlContent?: string;          // Optional MJML source (for editor round-trip)
  textContent?: string;          // Auto-generated from HTML if omitted
  category: 'transactional' | 'marketing';
  variables?: Array<{
    name: string;
    description?: string;
    defaultValue?: string;
    required?: boolean;
  }>;
}

interface UpdateTemplateInput {
  name?: string;
  subject?: string;
  htmlContent?: string;
  mjmlContent?: string;
  textContent?: string;
  category?: 'transactional' | 'marketing';
  variables?: Array<{
    name: string;
    description?: string;
    defaultValue?: string;
    required?: boolean;
  }>;
  isActive?: boolean;
}

interface RenderResult {
  subject: string;               // Compiled subject with variables injected
  html: string;                  // Compiled HTML body
  text: string;                  // Plain text version
}

interface TemplatePreview {
  subject: string;
  html: string;
  text: string;
  variables: Array<{ name: string; value: string }>;  // Sample values used
}
```

### 5.5 Deliverability Types

```typescript
interface DomainAuthResult {
  domainId: string;
  domain: string;
  dkimRecord: { type: string; host: string; value: string };
  spfRecord: { type: string; host: string; value: string };
  dmarcRecord: { type: string; host: string; value: string };
}

interface DomainVerificationResult {
  domainId: string;
  dkimVerified: boolean;
  spfVerified: boolean;
  dmarcVerified: boolean;
  allVerified: boolean;          // Convenience: dkim && spf && dmarc
}

interface ReputationScore {
  ventureId: string;
  overallScore: number;          // 0-100 (computed from bounce/spam/delivery rates)
  domainScore: number;           // % of domains fully verified
  ipScore: number;               // Currently tied to overallScore
  bounceRate: number;            // Last 30 days
  spamRate: number;              // Last 30 days
  lastCalculatedAt: Date;
}

interface WarmupProgress {
  ipAddress: string;
  currentDay: number;
  totalDays: number;             // Derived from schedule length (default 30)
  currentVolume: number;         // Actual sends today
  targetVolume: number;          // Target sends today
  status: 'warming' | 'warmed' | 'paused';
  percentComplete: number;       // (currentDay / totalDays) × 100
}
```

### 5.6 List Management Types

```typescript
interface CreateListInput {
  name: string;
  description?: string;
  type?: 'static' | 'dynamic';
  dynamicFilter?: Array<{
    field: string;
    operator: 'eq' | 'neq' | 'contains' | 'not_contains' | 'gt' | 'lt' | 'in';
    value: unknown;
  }>;
}

interface UpdateListInput {
  name?: string;
  description?: string;
  dynamicFilter?: Array<{
    field: string;
    operator: 'eq' | 'neq' | 'contains' | 'not_contains' | 'gt' | 'lt' | 'in';
    value: unknown;
  }>;
}

interface AddContactsToListInput {
  listId: string;
  contactIds?: string[];
  emails?: string[];
}

interface SuppressionEntry {
  email: string;
  type: 'bounce' | 'block' | 'spam_report' | 'unsubscribe' | 'invalid';
  reason?: string;
}
```

### 5.7 Analytics Types

```typescript
interface DateRange {
  start: Date;
  end: Date;
}

interface VentureEmailMetrics {
  ventureId: string;
  dateRange: DateRange;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalUnsubscribed: number;
  totalSpamReports: number;
  deliveryRate: number;         // 2 decimal precision (e.g., 98.45)
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
}

interface EngagementTimelinePoint {
  date: string;                  // ISO date string (YYYY-MM-DD)
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
}

interface TopCampaign {
  campaignId: string;
  name: string;
  sentAt: Date | null;
  totalRecipients: number;
  openRate: number;
  clickRate: number;
}

interface BounceReportEntry {
  email: string;
  type: string;
  reason: string;
  bouncedAt: Date;
}

interface UnsubscribeReportEntry {
  email: string;
  campaignId?: string;
  campaignName?: string;
  unsubscribedAt: Date;
}
```

### 5.8 Webhook Types

```typescript
interface SendGridWebhookEvent {
  email: string;
  timestamp: number;             // Unix epoch seconds
  event: 'delivered' | 'open' | 'click' | 'bounce' | 'dropped' |
         'deferred' | 'spamreport' | 'unsubscribe' | 'processed';
  sg_message_id: string;         // May contain filter suffix (stripped on lookup)
  sg_event_id: string;
  category?: string[];
  url?: string;                  // For click events: the clicked URL
  type?: string;                 // For bounce events: 'bounce' | 'blocked'
  reason?: string;               // Bounce/drop reason text
  status?: string;               // SMTP status code
  ip?: string;                   // Recipient IP (opens/clicks)
  useragent?: string;            // Recipient user agent
}
```

### 5.9 Error Types

```typescript
class EmailError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'EmailError';
  }
}

// Internal service error (same shape, used within sendgrid-client.service)
class EmailServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'EmailServiceError';
  }
}
```

### 5.10 Built-In Template Data Types

```typescript
// Base template options (all templates accept these)
interface BaseEmailOptions {
  primaryColor?: string;         // Default: '#3b82f6' (blue-500)
  logoUrl?: string;              // Company logo URL
  companyName?: string;          // Default: 'MCV.ONE'
  supportEmail?: string;         // Default: 'support@mcv.one'
  domain?: string;               // Default: 'mcv.one'
  unsubscribeUrl?: string;       // Shown in footer legal section
  preferencesUrl?: string;       // Email preferences link
}

interface EmailContent {
  subject: string;
  preheader?: string;            // Preview text shown in inbox (hidden in body)
  body: string;                  // HTML body content
  footer?: string;               // Override default footer
}

interface WelcomeEmailData {
  userName: string;
  email: string;
  dashboardUrl: string;
  ventureName?: string;
  features?: string[];           // Bulleted feature list
  helpUrl?: string;
  docsUrl?: string;
}

interface PasswordResetEmailData {
  userName: string;
  resetUrl: string;
  resetCode?: string;            // Optional OTP code (shown in codeBox)
  expiresInMinutes?: number;     // Default: 60
  ipAddress?: string;            // Security: show requesting IP
  userAgent?: string;            // Security: show requesting browser
}

interface InvoiceEmailData {
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;              // ISO 4217 (e.g., 'USD', 'EUR', 'CAD')
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentUrl: string;
  invoicePdfUrl?: string;
  billingAddress?: string;
  notes?: string;
}

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface NotificationEmailData {
  userName: string;
  title: string;                 // Used as email subject
  message: string;
  actionUrl?: string;
  actionLabel?: string;          // Default: 'View Details'
  severity?: 'info' | 'warning' | 'success' | 'error';
  category?: string;             // e.g., 'SECURITY', 'BILLING'
  timestamp?: string;
  metadata?: Array<{ label: string; value: string }>;
}

interface MarketingEmailData {
  headline: string;              // Used as email subject
  subheadline?: string;
  heroImageUrl?: string;
  heroImageAlt?: string;
  sections: MarketingSection[];
  ctaText?: string;
  ctaUrl?: string;
  socialLinks?: Array<{ name: string; url: string }>;
  unsubscribeUrl: string;        // Required for CAN-SPAM compliance
  preferencesUrl?: string;
}

interface MarketingSection {
  title?: string;
  body: string;                  // HTML content
  imageUrl?: string;
  imageAlt?: string;
  ctaText?: string;
  ctaUrl?: string;
}
```

---

## 6. Database Schema (Drizzle ORM)

All tables are defined in `packages/db/src/schema/email.ts`. Every table is scoped to
a `venture_id` with `ON DELETE CASCADE` foreign keys to `ventures`.

### 6.1 Enums

```typescript
export const emailSubuserStatusEnum = pgEnum('email_subuser_status', [
  'active', 'suspended', 'pending', 'deactivated',
]);

export const emailWarmupStatusEnum = pgEnum('email_warmup_status', [
  'warming', 'warmed', 'paused',
]);

export const emailCampaignStatusEnum = pgEnum('email_campaign_status', [
  'draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled',
]);

export const emailSendStatusEnum = pgEnum('email_send_status', [
  'queued', 'sent', 'delivered', 'opened', 'clicked',
  'bounced', 'dropped', 'deferred', 'spam_report', 'unsubscribed',
]);

export const emailTemplateCategoryEnum = pgEnum('email_template_category', [
  'transactional', 'marketing',
]);

export const emailListTypeEnum = pgEnum('email_list_type', [
  'static', 'dynamic',
]);

export const emailSuppressionTypeEnum = pgEnum('email_suppression_type', [
  'bounce', 'block', 'spam_report', 'unsubscribe', 'invalid',
]);
```

### 6.2 Table: `email_subusers`

Per-venture SendGrid subuser accounts for tenant isolation.

| Column               | Type                    | Constraints                      | Description                          |
|----------------------|-------------------------|----------------------------------|--------------------------------------|
| `id`                 | `uuid`                  | PK, `defaultRandom()`           | Unique identifier                    |
| `venture_id`         | `uuid`                  | FK → ventures, NOT NULL, CASCADE | Owning venture                       |
| `sendgrid_subuser_id`| `text`                  | nullable                         | SendGrid external ID                 |
| `username`           | `text`                  | NOT NULL                         | SendGrid subuser username            |
| `api_key`            | `text`                  | nullable                         | Encrypted API key                    |
| `ip_pool_id`         | `text`                  | nullable                         | Assigned IP pool                     |
| `status`             | `email_subuser_status`  | NOT NULL, default `'pending'`    | Account status                       |
| `domain`             | `text`                  | nullable                         | Sending domain                       |
| `dkim_verified`      | `boolean`               | NOT NULL, default `false`        | DKIM verification status             |
| `spf_verified`       | `boolean`               | NOT NULL, default `false`        | SPF verification status              |
| `dmarc_verified`     | `boolean`               | NOT NULL, default `false`        | DMARC verification status            |
| `warmup_status`      | `email_warmup_status`   | nullable                         | IP warmup status                     |
| `daily_limit`        | `integer`               | default `100`                    | Daily send limit                     |
| `created_at`         | `timestamptz`           | NOT NULL, `defaultNow()`         | Creation timestamp                   |
| `updated_at`         | `timestamptz`           | NOT NULL, `defaultNow()`         | Last update timestamp                |

**Indexes:**
- `email_subuser_venture_idx` → `venture_id`
- `email_subuser_username_idx` → `username`

**Relations:**
- `venture: one(ventures)` via `ventureId → ventures.id`

**Inferred Types:**
```typescript
type EmailSubuser = typeof emailSubusers.$inferSelect;
type NewEmailSubuser = typeof emailSubusers.$inferInsert;
```

### 6.3 Table: `email_templates`

Reusable email templates with Handlebars variables and versioning.

| Column           | Type                         | Constraints                    | Description                          |
|------------------|------------------------------|--------------------------------|--------------------------------------|
| `id`             | `uuid`                       | PK, `defaultRandom()`         | Unique identifier                    |
| `venture_id`     | `uuid`                       | FK → ventures, NOT NULL        | Owning venture                       |
| `name`           | `text`                       | NOT NULL                       | Template name (used for lookup)      |
| `subject`        | `text`                       | NOT NULL                       | Subject line (supports Handlebars)   |
| `html_content`   | `text`                       | NOT NULL                       | HTML body (Handlebars template)      |
| `mjml_content`   | `text`                       | nullable                       | MJML source (optional, for editor)   |
| `text_content`   | `text`                       | nullable                       | Plain text fallback                  |
| `category`       | `email_template_category`    | NOT NULL                       | `'transactional'` or `'marketing'`   |
| `variables`      | `jsonb`                      | `$type<EmailTemplateVariable[]>` | Variable definitions               |
| `thumbnail_url`  | `text`                       | nullable                       | Preview thumbnail URL                |
| `is_active`      | `boolean`                    | NOT NULL, default `true`       | Soft delete flag                     |
| `version`        | `integer`                    | NOT NULL, default `1`          | Auto-incremented on update           |
| `created_at`     | `timestamptz`                | NOT NULL                       | Creation timestamp                   |
| `updated_at`     | `timestamptz`                | NOT NULL                       | Last update timestamp                |

**Indexes:**
- `email_template_venture_idx` → `venture_id`
- `email_template_category_idx` → `category`
- `email_template_active_idx` → `(venture_id, is_active)`

**Relations:**
- `venture: one(ventures)`, `campaigns: many(emailCampaigns)`, `sends: many(emailSends)`

**JSONB Sub-Type:**
```typescript
interface EmailTemplateVariable {
  name: string;
  description?: string;
  defaultValue?: string;
  required?: boolean;
}
```

### 6.4 Table: `email_campaigns`

Marketing campaign definitions with A/B test support.

| Column             | Type                        | Constraints                    | Description                          |
|--------------------|-----------------------------|--------------------------------|--------------------------------------|
| `id`               | `uuid`                      | PK                             | Unique identifier                    |
| `venture_id`       | `uuid`                      | FK → ventures, NOT NULL        | Owning venture                       |
| `name`             | `text`                      | NOT NULL                       | Campaign name                        |
| `subject`          | `text`                      | NOT NULL                       | Email subject line                   |
| `template_id`      | `uuid`                      | FK → email_templates, SET NULL | Template reference                   |
| `list_ids`         | `jsonb`                     | `$type<string[]>`, default `[]`| Target list IDs                      |
| `segment_ids`      | `jsonb`                     | `$type<string[]>`, default `[]`| Target segment IDs                   |
| `from_email`       | `text`                      | NOT NULL                       | Sender email                         |
| `from_name`        | `text`                      | NOT NULL                       | Sender name                          |
| `reply_to`         | `text`                      | nullable                       | Reply-to address                     |
| `status`           | `email_campaign_status`     | NOT NULL, default `'draft'`    | Campaign state machine               |
| `scheduled_at`     | `timestamptz`               | nullable                       | Scheduled send time                  |
| `sent_at`          | `timestamptz`               | nullable                       | Actual send time                     |
| `total_recipients` | `integer`                   | default `0`                    | Final recipient count                |
| `stats`            | `jsonb`                     | `$type<EmailCampaignStats>`    | Real-time aggregate metrics          |
| `ab_test_config`   | `jsonb`                     | `$type<EmailAbTestConfig>`     | A/B test configuration               |
| `winner_id`        | `text`                      | nullable                       | Winning A/B variant ID               |
| `created_at`       | `timestamptz`               | NOT NULL                       | Creation timestamp                   |
| `updated_at`       | `timestamptz`               | NOT NULL                       | Last update timestamp                |

**Indexes:**
- `email_campaign_venture_idx` → `venture_id`
- `email_campaign_status_idx` → `status`
- `email_campaign_scheduled_idx` → `scheduled_at`
- `email_campaign_template_idx` → `template_id`

**JSONB Sub-Types:**
```typescript
interface EmailCampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  spamReports: number;
}

interface EmailAbTestConfig {
  variants: Array<{
    id: string;
    subject?: string;
    templateId?: string;
    weight: number;             // Percentage of traffic
  }>;
  testSize: number;             // Percentage of list to test on
  winnerCriteria: 'open_rate' | 'click_rate';
  testDurationHours: number;
}
```

### 6.5 Table: `email_sends`

Individual email send tracking — the core event tracking table. Highest-indexed table.

| Column               | Type                   | Constraints                   | Description                          |
|----------------------|------------------------|-------------------------------|--------------------------------------|
| `id`                 | `uuid`                 | PK                            | Unique identifier                    |
| `venture_id`         | `uuid`                 | FK → ventures, NOT NULL       | Owning venture                       |
| `campaign_id`        | `uuid`                 | FK → email_campaigns, SET NULL| Campaign (null for transactional)    |
| `template_id`        | `uuid`                 | FK → email_templates, SET NULL| Template used                        |
| `to_email`           | `text`                 | NOT NULL                      | Recipient email                      |
| `to_name`            | `text`                 | nullable                      | Recipient display name               |
| `from_email`         | `text`                 | NOT NULL                      | Sender email                         |
| `from_name`          | `text`                 | NOT NULL                      | Sender display name                  |
| `subject`            | `text`                 | NOT NULL                      | Rendered subject line                |
| `status`             | `email_send_status`    | NOT NULL, default `'queued'`  | Current delivery status              |
| `sendgrid_message_id`| `text`                 | nullable                      | SendGrid `x-message-id` for webhook  |
| `contact_id`         | `uuid`                 | nullable                      | CRM contact reference                |
| `metadata`           | `jsonb`                | `$type<Record<string, unknown>>` | Custom metadata + click URLs     |
| `opened_at`          | `timestamptz`          | nullable                      | First open timestamp                 |
| `clicked_at`         | `timestamptz`          | nullable                      | First click timestamp                |
| `bounced_at`         | `timestamptz`          | nullable                      | Bounce timestamp                     |
| `bounce_type`        | `text`                 | nullable                      | Bounce classification                |
| `bounce_reason`      | `text`                 | nullable                      | Bounce/drop reason                   |
| `created_at`         | `timestamptz`          | NOT NULL                      | Record creation (≈ send time)        |

**Indexes (7 total — most of any email table):**
- `email_send_venture_idx` → `venture_id`
- `email_send_campaign_idx` → `campaign_id`
- `email_send_status_idx` → `status`
- `email_send_to_email_idx` → `to_email`
- `email_send_sendgrid_msg_idx` → `sendgrid_message_id`
- `email_send_contact_idx` → `contact_id`
- `email_send_created_idx` → `created_at`

### 6.6 Table: `email_lists`

Contact lists for marketing campaigns (static or dynamic).

| Column           | Type                  | Constraints                    | Description                          |
|------------------|-----------------------|--------------------------------|--------------------------------------|
| `id`             | `uuid`                | PK                             | Unique identifier                    |
| `venture_id`     | `uuid`                | FK → ventures, NOT NULL        | Owning venture                       |
| `name`           | `text`                | NOT NULL                       | List name                            |
| `description`    | `text`                | nullable                       | Description                          |
| `contact_count`  | `integer`             | NOT NULL, default `0`          | Member count                         |
| `type`           | `email_list_type`     | NOT NULL, default `'static'`   | Static or dynamic                    |
| `dynamic_filter` | `jsonb`               | `$type<EmailListDynamicFilter[]>` | Filters for dynamic lists         |
| `created_at`     | `timestamptz`         | NOT NULL                       | Creation timestamp                   |
| `updated_at`     | `timestamptz`         | NOT NULL                       | Last update timestamp                |

**Indexes:** `email_list_venture_idx`, `email_list_type_idx`

**JSONB Sub-Type:**
```typescript
interface EmailListDynamicFilter {
  field: string;
  operator: 'eq' | 'neq' | 'contains' | 'not_contains' | 'gt' | 'lt' | 'in';
  value: unknown;
}
```

### 6.7 Table: `email_suppressions`

Global suppression list per venture — emails that must never receive mail.

| Column       | Type                       | Constraints                    | Description                          |
|--------------|----------------------------|--------------------------------|--------------------------------------|
| `id`         | `uuid`                     | PK                             | Unique identifier                    |
| `venture_id` | `uuid`                     | FK → ventures, NOT NULL        | Owning venture                       |
| `email`      | `text`                     | NOT NULL                       | Suppressed email (stored lowercase)  |
| `type`       | `email_suppression_type`   | NOT NULL                       | Reason category                      |
| `reason`     | `text`                     | nullable                       | Human-readable reason                |
| `created_at` | `timestamptz`              | NOT NULL                       | Suppression timestamp                |

**Indexes:**
- `email_suppression_venture_idx` → `venture_id`
- `email_suppression_email_idx` → `email`
- `email_suppression_type_idx` → `(venture_id, type)` (compound)

### 6.8 Table: `email_domains`

Authenticated sending domains with DNS verification status.

| Column          | Type        | Constraints                    | Description                          |
|-----------------|-------------|--------------------------------|--------------------------------------|
| `id`            | `uuid`      | PK                             | Unique identifier                    |
| `venture_id`    | `uuid`      | FK → ventures, NOT NULL        | Owning venture                       |
| `domain`        | `text`      | NOT NULL                       | Domain name (e.g., `mail.acme.com`)  |
| `dkim_record`   | `text`      | nullable                       | DKIM CNAME value                     |
| `spf_record`    | `text`      | nullable                       | SPF TXT value                        |
| `dmarc_record`  | `text`      | nullable                       | DMARC TXT value                      |
| `dkim_verified`  | `boolean`   | NOT NULL, default `false`      | DKIM verification status             |
| `spf_verified`   | `boolean`   | NOT NULL, default `false`      | SPF verification status              |
| `dmarc_verified` | `boolean`   | NOT NULL, default `false`      | DMARC verification status            |
| `is_default`    | `boolean`   | NOT NULL, default `false`      | Default sending domain for venture   |
| `created_at`    | `timestamptz`| NOT NULL                       | Creation timestamp                   |
| `updated_at`    | `timestamptz`| NOT NULL                       | Last update timestamp                |

**Indexes:** `email_domain_venture_idx`, `email_domain_domain_idx`

### 6.9 Table: `email_ip_warmup`

IP warmup schedules for new dedicated IPs.

| Column          | Type                    | Constraints                    | Description                          |
|-----------------|-------------------------|--------------------------------|--------------------------------------|
| `id`            | `uuid`                  | PK                             | Unique identifier                    |
| `venture_id`    | `uuid`                  | FK → ventures, NOT NULL        | Owning venture                       |
| `ip_address`    | `text`                  | NOT NULL                       | IP being warmed                      |
| `current_day`   | `integer`               | NOT NULL, default `1`          | Current warmup day                   |
| `target_volume` | `integer`               | NOT NULL, default `0`          | Today's target send volume           |
| `actual_volume` | `integer`               | NOT NULL, default `0`          | Today's actual sends                 |
| `status`        | `email_warmup_status`   | NOT NULL, default `'warming'`  | Current warmup state                 |
| `schedule`      | `jsonb`                 | `$type<EmailWarmupScheduleDay[]>` | Full warmup schedule              |
| `started_at`    | `timestamptz`           | nullable                       | Warmup start date                    |
| `created_at`    | `timestamptz`           | NOT NULL                       | Creation timestamp                   |
| `updated_at`    | `timestamptz`           | NOT NULL                       | Last update timestamp                |

**Indexes:** `email_ip_warmup_venture_idx`, `email_ip_warmup_status_idx`

**JSONB Sub-Type:**
```typescript
interface EmailWarmupScheduleDay {
  day: number;
  targetVolume: number;
}
```

**Default warmup schedule algorithm** (exponential ramp, 30 days):
```typescript
const defaultSchedule = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  targetVolume: Math.min(Math.round(50 * Math.pow(1.25, i)), 1_000_000),
}));
// Day 1:       50 emails
// Day 5:      152 emails
// Day 10:     466 emails
// Day 15:   1,430 emails
// Day 20:   4,385 emails
// Day 25:  13,445 emails
// Day 30:  41,235 emails
```

---

## 7. Server Services — Deep Dive

All services are exported as **singleton instances** alongside their classes.
Every public method accepts `ventureId` as its first parameter (multi-tenant scope).
All services handle `db === null` gracefully (return empty results or throw specific errors).

### 7.1 SendGridClientService

**Singleton:** `sendGridClientService`

Per-venture SendGrid client management with 3-tier credential resolution,
client caching, subuser provisioning, and API key rotation.

| Method | Signature | Description |
|---|---|---|
| `createSubuser` | `(ventureId: string, domain: string) → Promise<SubuserResult>` | Provision SendGrid subuser for venture |
| `getClient` | `(ventureId: string) → Promise<typeof sgMail>` | Get configured mail client (cached, 5-min TTL) |
| `getApiClient` | `(ventureId: string) → Promise<typeof sgClient>` | Get raw REST API client |
| `rotateApiKey` | `(ventureId: string) → Promise<{ apiKey: string }>` | Rotate subuser API key (deletes old, creates new) |
| `getSubuser` | `(ventureId: string) → Promise<EmailSubuser \| null>` | Get active subuser record |
| `suspendSubuser` | `(ventureId: string) → Promise<void>` | Disable subuser (SendGrid API + DB) |
| `updateDailyLimit` | `(ventureId: string, limit: number) → Promise<void>` | Update daily send limit |

**Subuser Username Generation:**
```typescript
// Format: mcv_{ventureIdSlice}_{base36Timestamp}
const username = `mcv_${ventureId.replace(/-/g, '').slice(0, 16)}_${Date.now().toString(36)}`;
```

**SendGrid API Key Scopes (provisioned per subuser):**
```typescript
const scopes = [
  'mail.send',
  'mail.batch.create', 'mail.batch.read', 'mail.batch.update', 'mail.batch.delete',
  'sender_verification_eligible',
  'stats.read', 'stats.global.read',
  'suppression.read', 'suppression.create', 'suppression.update', 'suppression.delete',
];
```

**Client Cache Implementation:**
```typescript
private clientCache = new Map<string, CachedClient>();
private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedClient {
  mail: typeof sgMail;
  client: typeof sgClient;
  expiresAt: number;
}
```

### 7.2 TransactionalService

**Singleton:** `transactionalService`

Sends transactional emails (welcome, reset, invoice, etc.) with suppression
checking, template rendering, and per-venture client isolation.

| Method | Signature | Description |
|---|---|---|
| `send` | `(ventureId: string, options: TransactionalSendOptions) → Promise<SendResult>` | Send single transactional email |
| `sendBatch` | `(ventureId: string, options: BatchSendOptions) → Promise<BatchSendResult>` | Send batch (50 per request, parallel within batch) |
| `getStatus` | `(messageId: string) → Promise<{ status, events } \| null>` | Check delivery status + event timeline |
| `getSendHistory` | `(ventureId: string, options?) → Promise<{ items, total }>` | Query send history with status filter |

**Internal Flow for `send()`:**
1. Extract `toEmail` and `toName` from `to` (string or object)
2. Check `isSuppressed(ventureId, toEmail)` → fail fast if suppressed
3. Render template via `templateService.render(template, ventureId, variables)`
4. Resolve `from` address (options → env `SENDGRID_FROM_EMAIL` → `noreply@mcv.one`)
5. Get venture-specific client via `sendGridClientService.getClient(ventureId)`
6. Insert `email_sends` record with status `'queued'`
7. Call `mailClient.send()` with `customArgs: { ventureId, sendId }`
8. Update record to `'sent'` with `sendgridMessageId`
9. Return `{ success: true, messageId, sendId }`

**Batch Processing:**
```
BATCH_SIZE = 50 (SendGrid limit per API request)
Processing: Promise.allSettled() within each batch, sequential across batches
```

### 7.3 MarketingService

**Singleton:** `marketingService`

Full campaign lifecycle: create → update → schedule → send → pause → cancel → delete.
Includes A/B test configuration and real-time stats aggregation.

| Method | Signature | Description |
|---|---|---|
| `createCampaign` | `(ventureId, input: CreateCampaignInput) → EmailCampaign \| null` | Create draft campaign |
| `updateCampaign` | `(campaignId, input: UpdateCampaignInput) → EmailCampaign \| null` | Update (draft/paused only) |
| `scheduleCampaign` | `(campaignId, scheduledAt: Date) → EmailCampaign \| null` | Schedule for future (must be > now) |
| `sendCampaign` | `(campaignId) → { success, totalRecipients, error? }` | Send immediately (draft/scheduled only) |
| `pauseCampaign` | `(campaignId) → EmailCampaign \| null` | Pause sending campaign |
| `cancelCampaign` | `(campaignId) → EmailCampaign \| null` | Cancel (from draft/scheduled/sending/paused) |
| `createAbTest` | `(campaignId, config: CreateAbTestInput) → EmailCampaign \| null` | Add A/B test (draft only, weights must sum to 100) |
| `getCampaignStats` | `(campaignId) → CampaignStatsResult \| null` | Real-time stats from email_sends |
| `listCampaigns` | `(ventureId, options?) → { items, total }` | List campaigns with pagination and status filter |
| `getCampaign` | `(campaignId) → EmailCampaign \| null` | Get single campaign |
| `deleteCampaign` | `(campaignId) → boolean` | Delete (draft only) |

**Campaign State Machine:**
```
          ┌──────────── cancel ─────────────┐
          │                                 │
  draft ──┼──► scheduled ──► sending ──► sent
  │  ▲    │       │              │
  │  │    │       ▼              ▼
  │  │    └──► cancelled      paused ──► (resume → sending)
  │  │
  │  └── update (only in draft/paused)
  │
  └── delete (only in draft)
```

**Real-Time Stats Query (PostgreSQL FILTER aggregates):**
```sql
SELECT
  count(*)::int AS total,
  count(*) FILTER (WHERE status != 'queued')::int AS sent,
  count(*) FILTER (WHERE status IN ('delivered','opened','clicked'))::int AS delivered,
  count(*) FILTER (WHERE opened_at IS NOT NULL)::int AS opened,
  count(*) FILTER (WHERE clicked_at IS NOT NULL)::int AS clicked,
  count(*) FILTER (WHERE status = 'bounced')::int AS bounced,
  count(*) FILTER (WHERE status = 'unsubscribed')::int AS unsubscribed,
  count(*) FILTER (WHERE status = 'spam_report')::int AS spam_reports
FROM email_sends
WHERE campaign_id = $1;
```

### 7.4 TemplateService

**Singleton:** `templateService`

Template CRUD with Handlebars compilation, variable injection, versioning,
preview generation, and duplication.

| Method | Signature | Description |
|---|---|---|
| `create` | `(ventureId, input: CreateTemplateInput) → EmailTemplate \| null` | Create template (auto-generates text from HTML) |
| `update` | `(templateId, input: UpdateTemplateInput) → EmailTemplate \| null` | Update (auto-bumps version) |
| `render` | `(idOrName, ventureId, variables) → RenderResult \| null` | Render by ID first, then by name fallback |
| `renderTemplate` | `(template, variables) → RenderResult` | Render template object directly (sync) |
| `preview` | `(templateId) → TemplatePreview \| null` | Preview with sample data from variable definitions |
| `duplicate` | `(templateId, newName?) → EmailTemplate \| null` | Clone template (starts as inactive, version 1) |
| `listTemplates` | `(ventureId, options?) → { items, total }` | List with category/active filters + pagination |
| `getById` | `(templateId) → EmailTemplate \| null` | Get by ID |
| `deactivate` | `(templateId) → boolean` | Soft delete (sets `isActive = false`) |

**Registered Handlebars Helpers:**
```typescript
Handlebars.registerHelper('formatDate', (date) => {
  // → "January 15, 2026" (en-US, long format)
});

Handlebars.registerHelper('formatCurrency', (amount, currency?) => {
  // → "$1,234.56" (Intl.NumberFormat, default USD)
});

Handlebars.registerHelper('uppercase', (str) => str.toUpperCase());
Handlebars.registerHelper('lowercase', (str) => str.toLowerCase());

Handlebars.registerHelper('ifEquals', function(a, b, opts) {
  return a === b ? opts.fn(this) : opts.inverse(this);
});
```

**HTML-to-PlainText Conversion Pipeline:**
```
Input HTML → strip <style>/<script> → convert <a> to "text (url)" →
<br> → \n → </p> → \n\n → <h*> → \n...\n → strip remaining tags →
decode entities (&nbsp; &amp; etc.) → collapse whitespace → trim
```

### 7.5 DeliverabilityService

**Singleton:** `deliverabilityService`

Domain authentication, DNS record generation, SendGrid whitelabel API integration,
IP warmup management, and reputation scoring.

| Method | Signature | Description |
|---|---|---|
| `authenticateDomain` | `(ventureId, domain) → DomainAuthResult` | Generate DNS records (or return existing) |
| `verifyDomain` | `(domainId) → DomainVerificationResult` | Verify DNS via SendGrid validation API |
| `getReputationScore` | `(ventureId) → ReputationScore` | Calculate reputation (30-day window) |
| `startIpWarmup` | `(ventureId, ip, schedule?) → EmailIpWarmup \| null` | Start warmup (default: 30-day exponential) |
| `getWarmupProgress` | `(ventureId) → WarmupProgress[]` | Get all warmup statuses |
| `getSuppressionList` | `(ventureId, type?, options?) → { items, total }` | Query suppressions with type filter |
| `listDomains` | `(ventureId) → EmailDomain[]` | List authenticated domains |
| `setDefaultDomain` | `(ventureId, domainId) → boolean` | Set default domain (unsets previous) |
| `removeSuppression` | `(ventureId, email) → boolean` | Remove from suppression |

**Reputation Score Formula:**
```
overallScore = 100
  - (bounceRate% × 5)              // Each 1% bounce rate costs 5 points
  - (spamRate% × 20)               // Each 1% spam rate costs 20 points
  - max(0, 100 - deliveryRate%)     // Low delivery rate penalty
  = clamped to [0, 100]

domainScore = (fullyVerifiedDomains / totalDomains) × 100
```

**Domain Authentication DNS Records Generated:**
```
CNAME: s1._domainkey.{domain} → s1.domainkey.u{ventureId[:8]}.wl.sendgrid.net
TXT:   {domain}               → v=spf1 include:sendgrid.net ~all
TXT:   _dmarc.{domain}        → v=DMARC1; p=none; rua=mailto:dmarc@{domain}
```

### 7.6 ListService

**Singleton:** `listService`

Contact list CRUD, contact count management, and suppression list operations.

| Method | Signature | Description |
|---|---|---|
| `createList` | `(ventureId, input: CreateListInput) → EmailList \| null` | Create contact list |
| `updateList` | `(listId, input: UpdateListInput) → EmailList \| null` | Update list metadata |
| `deleteList` | `(listId) → boolean` | Delete list permanently |
| `getList` | `(listId) → EmailList \| null` | Get by ID |
| `listLists` | `(ventureId, options?) → { items, total }` | List with type filter + pagination |
| `updateContactCount` | `(listId, count) → void` | Set absolute contact count |
| `incrementContactCount` | `(listId, delta?) → void` | Increment/decrement count (SQL `+` operator) |
| `addSuppression` | `(ventureId, entry: SuppressionEntry) → void` | Add to suppression (dedup check) |
| `addSuppressions` | `(ventureId, entries) → number` | Bulk add (returns count added) |
| `removeSuppression` | `(ventureId, email, type?) → boolean` | Remove from suppression (optional type filter) |
| `isSuppressed` | `(ventureId, email) → boolean` | Check suppression (lowercase match) |
| `getSuppressions` | `(ventureId, options?) → { items, total }` | Query suppression list |

### 7.7 AnalyticsService

**Singleton:** `analyticsService`

All queries use PostgreSQL `FILTER` clause for single-pass aggregation.

| Method | Signature | Description |
|---|---|---|
| `getCampaignMetrics` | `(campaignId) → metrics \| null` | Per-campaign aggregate counts |
| `getVentureMetrics` | `(ventureId, dateRange) → VentureEmailMetrics` | Venture-wide metrics with rates |
| `getTopPerformingCampaigns` | `(ventureId, limit?) → TopCampaign[]` | Top campaigns sorted by open rate |
| `getEngagementTimeline` | `(ventureId, dateRange) → EngagementTimelinePoint[]` | Daily time-series (date_trunc) |
| `getBounceReport` | `(ventureId, dateRange, options?) → { items, total }` | Bounce details with pagination |
| `getUnsubscribeReport` | `(ventureId, dateRange, options?) → { items, total }` | Unsubscribe details with pagination |
| `getSuppressionSummary` | `(ventureId) → Record<string, number>` | Count of suppressions by type |

**Rate Calculation Precision:**
```typescript
// 2 decimal places using integer math to avoid floating point issues
deliveryRate: Math.round((totalDelivered / sent) * 10000) / 100
// e.g., 9845 / 100 = 98.45%
```

### 7.8 WebhookHandlerService

**Singleton:** `webhookHandlerService`

Processes incoming SendGrid event webhooks, updates email_sends status, auto-adds
to suppression list on bounces/spam/unsubscribes, and recalculates campaign stats.

| Method | Signature | Description |
|---|---|---|
| `processEvents` | `(events: SendGridWebhookEvent[]) → { processed, errors }` | Process batch of events |
| `processEvent` | `(event: SendGridWebhookEvent) → void` | Process single event |
| `verifySignature` | `(publicKey, payload, signature, timestamp) → boolean` | Verify ECDSA webhook signature |

**Event → Status + Side Effects:**

| SendGrid Event  | Status Update          | Side Effects                                        |
|-----------------|------------------------|-----------------------------------------------------|
| `processed`     | `queued` → `sent`      | —                                                    |
| `delivered`     | → `delivered`          | —                                                    |
| `open`          | → `opened`             | Sets `opened_at` (first open only, dedup check)     |
| `click`         | → `clicked`            | Sets `clicked_at`, `opened_at`, `lastClickedUrl` in metadata |
| `bounce`        | → `bounced`            | Sets `bounced_at`, `bounce_type`, `bounce_reason`; auto-suppress (hard bounces) |
| `dropped`       | → `dropped`            | Records drop reason in `bounce_reason`               |
| `deferred`      | → `deferred`           | —                                                    |
| `spamreport`    | → `spam_report`        | Auto-adds to suppression list (type: `spam_report`)  |
| `unsubscribe`   | → `unsubscribed`       | Auto-adds to suppression list (type: `unsubscribe`)  |

**Campaign Stats Auto-Update:**
After every webhook event for a campaign-linked send, the `email_campaigns.stats`
JSONB field is recalculated via aggregate SQL query on `email_sends`.

---

## 8. Client Hooks (React)

All hooks are `'use client'` components using `useState`, `useCallback`, and `useEffect`.
They communicate with the server via `fetch()` to `/api/email/*` REST endpoints.

### 8.1 `useEmailCampaigns(options: UseEmailCampaignsOptions)`

**Options:**
```typescript
interface UseEmailCampaignsOptions {
  ventureId: string;
  status?: string;               // Filter by campaign status
  limit?: number;                // Default: 50
}
```

**Returns:**
```typescript
interface UseEmailCampaignsResult {
  campaigns: Campaign[];
  isLoading: boolean;
  error: Error | null;
  total: number;
  createCampaign: (data) => Promise<Campaign | null>;
  updateCampaign: (id, data) => Promise<Campaign | null>;
  sendCampaign: (id) => Promise<{ success: boolean; error?: string }>;
  scheduleCampaign: (id, scheduledAt) => Promise<Campaign | null>;
  pauseCampaign: (id) => Promise<Campaign | null>;
  cancelCampaign: (id) => Promise<Campaign | null>;
  deleteCampaign: (id) => Promise<boolean>;
  refresh: () => Promise<void>;
}
```

**API Endpoints Used:**
- `GET /api/email/campaigns?ventureId=&limit=&status=`
- `POST /api/email/campaigns` (create)
- `PATCH /api/email/campaigns/:id` (update)
- `POST /api/email/campaigns/:id/send`
- `POST /api/email/campaigns/:id/schedule`
- `POST /api/email/campaigns/:id/pause`
- `POST /api/email/campaigns/:id/cancel`
- `DELETE /api/email/campaigns/:id`

### 8.2 `useEmailAnalytics(options: UseEmailAnalyticsOptions)`

**Options:**
```typescript
interface UseEmailAnalyticsOptions {
  ventureId: string;
  startDate: string;             // ISO date string
  endDate: string;               // ISO date string
  enabled?: boolean;             // Default: true (auto-fetch on mount)
}
```

**Returns:**
```typescript
interface UseEmailAnalyticsResult {
  metrics: EmailMetrics | null;
  timeline: TimelinePoint[];
  topCampaigns: TopCampaign[];
  suppressionSummary: Record<string, number>;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}
```

**Fetches 4 endpoints in parallel via `Promise.allSettled()`:**
- `GET /api/email/analytics/metrics`
- `GET /api/email/analytics/timeline`
- `GET /api/email/analytics/top-campaigns`
- `GET /api/email/analytics/suppressions`

### 8.3 `useEmailTemplates(options: UseEmailTemplatesOptions)`

**Options:**
```typescript
interface UseEmailTemplatesOptions {
  ventureId: string;
  category?: 'transactional' | 'marketing';
  activeOnly?: boolean;
  limit?: number;                // Default: 50
}
```

**Returns:**
```typescript
interface UseEmailTemplatesResult {
  templates: EmailTemplateItem[];
  isLoading: boolean;
  error: Error | null;
  total: number;
  createTemplate: (data) => Promise<EmailTemplateItem | null>;
  updateTemplate: (id, data) => Promise<EmailTemplateItem | null>;
  deleteTemplate: (id) => Promise<boolean>;
  duplicateTemplate: (id, newName?) => Promise<EmailTemplateItem | null>;
  previewTemplate: (id) => Promise<TemplatePreview | null>;
  renderTemplate: (id, variables) => Promise<RenderResult | null>;
  refresh: () => Promise<void>;
}
```

---

## 9. Built-In Email Templates

All templates produce `{ subject: string; html: string; text: string }` with both
rich HTML and plain text variants. They accept `BaseEmailOptions` for branding customization.

### 9.1 Base Template (`renderBaseTemplate`)

The foundation for all email templates. Generates a responsive HTML email layout with:

- **Preheader text** — Hidden preview text for email clients (with `&zwnj;` padding)
- **Gradient header** — Company logo or name on colored background
- **Body section** — 600px max-width container with 40px/32px padding
- **Footer** — Support email + copyright
- **Legal section** — Unsubscribe + email preferences links
- **Outlook compatibility** — `<!--[if mso]>` conditional comments, VML namespaces
- **Mobile responsive** — `@media (max-width: 600px)` breakpoints
- **Dark mode** — `color-scheme: light` meta tag
- **System fonts** — `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ...`

### 9.2 Welcome Email (`renderWelcomeEmail`)

**Use case:** User registration, onboarding
**Subject:** `Welcome to {company}!`
**Features:** CTA button to dashboard, optional feature list, resource links, info box

### 9.3 Password Reset Email (`renderPasswordResetEmail`)

**Use case:** Password recovery flow
**Subject:** `Reset your {company} password`
**Features:** Reset button, optional OTP code box (monospace), expiry warning (info box),
request IP/UA security details

### 9.4 Invoice Email (`renderInvoiceEmail`)

**Use case:** Billing, payment reminders
**Subject:** `Invoice {number} from {company}`
**Features:** Key-value info table, line items table with headers, subtotal/tax/total,
"Pay Now" CTA, optional PDF download link, notes section. Currency formatting via
`Intl.NumberFormat`.

### 9.5 Notification Email (`renderNotificationEmail`)

**Use case:** System alerts, activity notifications
**Subject:** `{title}` (passed directly)
**Features:** Severity icons (ℹ️⚠️✅❌), category/timestamp header, metadata key-value table,
optional action button. Supports 4 severity levels: `info`, `warning`, `success`, `error`.

### 9.6 Marketing Email (`renderMarketingEmail`)

**Use case:** Newsletters, promotions, product announcements
**Subject:** `{headline}` (passed directly)
**Features:** Hero image, multiple content sections with individual CTAs, social media links,
section dividers, global CTA. **Requires `unsubscribeUrl`** for CAN-SPAM compliance.
Custom footer with unsubscribe/preferences links.

---

## 10. Template Helper Functions

Exported from `base.template.ts` for use in custom template composition:

| Function | Signature | Description |
|---|---|---|
| `button(text, url, color?)` | `→ string` | CTA button HTML (centered, 14px padding, 8px radius) |
| `infoBox(content, type?)` | `→ string` | Styled info box with left border. Types: `info` (blue), `warning` (yellow), `success` (green), `error` (red) |
| `codeBox(code)` | `→ string` | Monospace code block (32px font, 6px letter-spacing). For OTPs, verification codes. |
| `dataTable(rows, options?)` | `→ string` | Key-value table (label + value rows, optional header background) |
| `esc(text)` | `→ string` | HTML entity escaping (`& < > " '`). Use for all user-supplied data. |
| `toPlainText(html)` | `→ string` | Strip HTML to plain text. Converts `<a>` to `text (url)`, `<br>` to `\n`, `<li>` to `- item`. |

**Color Constants Used in Templates:**
```
Background:    #f4f4f5 (zinc-100)
Card:          #ffffff
Border:        #e4e4e7 (zinc-200)
Text primary:  #18181b (zinc-900)
Text secondary:#3f3f46 (zinc-700)
Text muted:    #52525b (zinc-600)
Text faint:    #71717a (zinc-500)
Text ghost:    #a1a1aa (zinc-400)
Primary:       #3b82f6 (blue-500) — configurable
```

---

## 11. Webhook Integration

### Endpoint Setup

```typescript
// Express/Next.js API route handler
app.post('/webhooks/sendgrid', async (req, res) => {
  // 1. Verify ECDSA signature
  const isValid = webhookHandlerService.verifySignature(
    process.env.SENDGRID_WEBHOOK_PUBLIC_KEY!,
    JSON.stringify(req.body),
    req.headers['x-twilio-email-event-webhook-signature'] as string,
    req.headers['x-twilio-email-event-webhook-timestamp'] as string,
  );
  if (!isValid) return res.status(403).send('Invalid signature');

  // 2. Process batch
  const result = await webhookHandlerService.processEvents(req.body);
  console.log(`Processed: ${result.processed}, Errors: ${result.errors}`);

  // 3. Always return 200 to prevent SendGrid retries
  res.status(200).send('OK');
});
```

### Signature Verification Implementation

```typescript
verifySignature(publicKey, payload, signature, timestamp): boolean {
  const crypto = require('crypto');
  const timestampPayload = timestamp + payload;
  const decodedSignature = Buffer.from(signature, 'base64');

  const verifier = crypto.createVerify('SHA256');
  verifier.update(timestampPayload);
  verifier.end();

  return verifier.verify(
    { key: publicKey, padding: crypto.constants.RSA_PKCS1_PSS_PADDING },
    decodedSignature
  );
}
```

### Message ID Correlation

SendGrid appends filter suffixes to `sg_message_id`. The webhook handler strips them:
```typescript
const messageId = event.sg_message_id?.split('.')[0];
```

### Auto-Suppression Rules

| Event Type   | Suppression Type | Condition |
|---|---|---|
| `bounce`     | `bounce`         | When `event.type === 'bounce'` or `'blocked'` (hard bounces only) |
| `spamreport` | `spam_report`    | Always                                                            |
| `unsubscribe`| `unsubscribe`    | Always                                                            |

---

## 12. Code Examples

### Example 1: Send a Transactional Welcome Email

```typescript
import { transactionalService } from '@mcv/email/server';

const result = await transactionalService.send(ventureId, {
  to: { email: 'user@example.com', name: 'John Doe' },
  template: 'welcome',
  variables: {
    firstName: 'John',
    activationUrl: 'https://app.mcv.one/activate?token=abc123',
  },
  categories: ['onboarding'],
  metadata: { contactId: 'contact-uuid-here' },
});

if (result.success) {
  console.log(`Email sent: ${result.messageId}`);
  console.log(`DB record: ${result.sendId}`);
} else {
  console.error(`Send failed: ${result.error}`);
}
```

### Example 2: Batch Send Monthly Reports

```typescript
import { transactionalService } from '@mcv/email/server';

const result = await transactionalService.sendBatch(ventureId, {
  messages: users.map(user => ({
    to: { email: user.email, name: user.name },
    template: 'monthly-report',
    variables: {
      firstName: user.firstName,
      reportUrl: `https://app.mcv.one/reports/${user.id}`,
      month: 'January 2026',
    },
    categories: ['reports', 'monthly'],
    metadata: { contactId: user.contactId },
  })),
});

console.log(`Batch results: ${result.sent}/${result.total} sent, ${result.failed} failed`);
// Individual results: result.results[i].success, .messageId, .error
```

### Example 3: Create and Send a Marketing Campaign

```typescript
import { marketingService } from '@mcv/email/server';

// 1. Create campaign
const campaign = await marketingService.createCampaign(ventureId, {
  name: 'January Newsletter',
  subject: "What's New at {{venture}}",
  templateId: 'template-uuid',
  listIds: ['list-uuid-1', 'list-uuid-2'],
  fromEmail: 'news@venture.com',
  fromName: 'Venture News',
  replyTo: 'support@venture.com',
});

// 2. Option A: Schedule for future delivery
await marketingService.scheduleCampaign(
  campaign!.id,
  new Date('2026-01-15T09:00:00Z')
);

// 2. Option B: Send immediately
const result = await marketingService.sendCampaign(campaign!.id);
console.log(`Sent to ${result.totalRecipients} recipients`);

// 3. Check stats
const stats = await marketingService.getCampaignStats(campaign!.id);
console.log(`Open rate: ${stats?.openRate}%, Click rate: ${stats?.clickRate}%`);
```

### Example 4: A/B Test a Campaign Subject Line

```typescript
import { marketingService } from '@mcv/email/server';

// Campaign must be in 'draft' status
const updated = await marketingService.createAbTest(campaignId, {
  variants: [
    { id: 'a', subject: "Don't Miss Our Sale!", weight: 50 },
    { id: 'b', subject: '50% Off Everything Today', weight: 50 },
  ],
  testSize: 20,               // Test on 20% of the list
  winnerCriteria: 'open_rate', // Auto-select winner by open rate
  testDurationHours: 4,        // Test runs for 4 hours, then send winner to remaining 80%
});
```

### Example 5: Create, Render, and Preview a Template

```typescript
import { templateService } from '@mcv/email/server';

// Create with Handlebars variables
const template = await templateService.create(ventureId, {
  name: 'order-confirmation',
  subject: 'Order #{{orderNumber}} Confirmed',
  htmlContent: `
    <h1>Thank you, {{customerName}}!</h1>
    <p>Your order #{{orderNumber}} has been confirmed.</p>
    <p>Total: {{formatCurrency total}}</p>
    <p>Estimated delivery: {{formatDate deliveryDate}}</p>
    {{#ifEquals status "express"}}
      <p>🚀 Express shipping selected!</p>
    {{/ifEquals}}
  `,
  category: 'transactional',
  variables: [
    { name: 'customerName', required: true },
    { name: 'orderNumber', required: true },
    { name: 'total', required: true, defaultValue: '0' },
    { name: 'deliveryDate', description: 'ISO date string' },
    { name: 'status', defaultValue: 'standard' },
  ],
});

// Render with actual data
const rendered = await templateService.render('order-confirmation', ventureId, {
  customerName: 'Jane',
  orderNumber: 'ORD-12345',
  total: 99.99,
  deliveryDate: '2026-02-15',
  status: 'express',
});
// rendered.subject → "Order #ORD-12345 Confirmed"
// rendered.html → "<h1>Thank you, Jane!</h1>..."
// rendered.text → "Thank you, Jane!..."

// Preview with sample/default values
const preview = await templateService.preview(template!.id);
// preview.variables → [{ name: 'customerName', value: '[customerName]' }, ...]
```

### Example 6: Use Built-In Templates Directly (Server-Side Rendering)

```typescript
import {
  renderWelcomeEmail,
  renderPasswordResetEmail,
  renderInvoiceEmail,
  renderNotificationEmail,
} from '@mcv/email/server';

// Welcome email with custom branding
const welcome = renderWelcomeEmail(
  {
    userName: 'Sarah',
    email: 'sarah@example.com',
    dashboardUrl: 'https://app.acme.com/dashboard',
    ventureName: 'Acme Corp',
    features: ['Create projects', 'Invite team members', 'Track analytics'],
    docsUrl: 'https://docs.acme.com',
  },
  {
    primaryColor: '#10b981',      // Custom green branding
    companyName: 'Acme Corp',
    logoUrl: 'https://cdn.acme.com/logo.png',
    supportEmail: 'help@acme.com',
  }
);
// welcome.subject → "Welcome to Acme Corp!"
// welcome.html → Full responsive HTML email
// welcome.text → Plain text version

// Password reset with OTP code
const reset = renderPasswordResetEmail({
  userName: 'Sarah',
  resetUrl: 'https://app.acme.com/reset?token=xyz',
  resetCode: 'A7B3C9',
  expiresInMinutes: 30,
  ipAddress: '192.168.1.1',
  userAgent: 'Chrome 120 / macOS',
});

// Invoice
const invoice = renderInvoiceEmail({
  customerName: 'Acme Corp',
  invoiceNumber: 'INV-2026-0042',
  invoiceDate: 'February 1, 2026',
  dueDate: 'February 15, 2026',
  currency: 'USD',
  lineItems: [
    { description: 'Pro Plan (Monthly)', quantity: 1, unitPrice: 49.00, total: 49.00 },
    { description: 'Extra Seats (×3)', quantity: 3, unitPrice: 10.00, total: 30.00 },
  ],
  subtotal: 79.00,
  tax: 7.90,
  total: 86.90,
  paymentUrl: 'https://pay.acme.com/inv/2026-0042',
  invoicePdfUrl: 'https://cdn.acme.com/invoices/2026-0042.pdf',
  notes: 'Thank you for your continued partnership.',
});
```

### Example 7: Authenticate a Sending Domain

```typescript
import { deliverabilityService } from '@mcv/email/server';

// 1. Generate DNS records
const auth = await deliverabilityService.authenticateDomain(ventureId, 'mail.venture.com');

console.log('Add these DNS records to your domain registrar:');
console.log(`CNAME: ${auth.dkimRecord.host} → ${auth.dkimRecord.value}`);
console.log(`TXT:   ${auth.spfRecord.host} → ${auth.spfRecord.value}`);
console.log(`TXT:   ${auth.dmarcRecord.host} → ${auth.dmarcRecord.value}`);

// 2. After DNS propagation (24-48 hours), verify
const verification = await deliverabilityService.verifyDomain(auth.domainId);
console.log(`DKIM: ${verification.dkimVerified}`);
console.log(`SPF:  ${verification.spfVerified}`);
console.log(`DMARC: ${verification.dmarcVerified}`);
console.log(`All verified: ${verification.allVerified}`);

// 3. Set as default sending domain
if (verification.allVerified) {
  await deliverabilityService.setDefaultDomain(ventureId, auth.domainId);
}
```

### Example 8: Monitor Reputation and IP Warmup

```typescript
import { deliverabilityService } from '@mcv/email/server';

// Check reputation
const score = await deliverabilityService.getReputationScore(ventureId);
console.log(`Overall: ${score.overallScore}/100`);
console.log(`Domain:  ${score.domainScore}/100`);
console.log(`Bounce rate: ${score.bounceRate}%`);
console.log(`Spam rate: ${score.spamRate}%`);

if (score.overallScore < 70) {
  console.warn('⚠️ Reputation degraded — review bounces and spam reports');
}

// Start IP warmup with custom schedule
await deliverabilityService.startIpWarmup(ventureId, '10.0.0.1', [
  { day: 1, targetVolume: 50 },
  { day: 2, targetVolume: 100 },
  { day: 3, targetVolume: 250 },
  { day: 4, targetVolume: 500 },
  { day: 5, targetVolume: 1000 },
  // ... up to 30 days
]);

// Check progress
const progress = await deliverabilityService.getWarmupProgress(ventureId);
for (const ip of progress) {
  console.log(`${ip.ipAddress}: Day ${ip.currentDay}/${ip.totalDays} ` +
    `(${ip.percentComplete}%) — ${ip.currentVolume}/${ip.targetVolume} sent`);
}
```

### Example 9: Manage Suppression Lists

```typescript
import { listService } from '@mcv/email/server';

// Add single suppression
await listService.addSuppression(ventureId, {
  email: 'bad@example.com',
  type: 'invalid',
  reason: 'Mailbox does not exist',
});

// Bulk import suppressions
const added = await listService.addSuppressions(ventureId, [
  { email: 'bounce1@ex.com', type: 'bounce', reason: 'Hard bounce - mailbox full' },
  { email: 'bounce2@ex.com', type: 'bounce', reason: 'Hard bounce - domain not found' },
  { email: 'spam@ex.com', type: 'spam_report', reason: 'User reported as spam' },
]);
console.log(`Added ${added} suppressions`);

// Check before sending (done automatically by TransactionalService)
const suppressed = await listService.isSuppressed(ventureId, 'bad@example.com');
console.log(`Is suppressed: ${suppressed}`); // true

// Remove (e.g., after user re-confirms)
await listService.removeSuppression(ventureId, 'bounce1@ex.com', 'bounce');

// Query with filters
const { items, total } = await listService.getSuppressions(ventureId, {
  type: 'bounce',
  limit: 25,
  offset: 0,
});
```

### Example 10: Query Analytics and Build a Dashboard

```typescript
import { analyticsService } from '@mcv/email/server';

const dateRange = {
  start: new Date('2026-01-01'),
  end: new Date('2026-01-31'),
};

// Venture-wide metrics
const metrics = await analyticsService.getVentureMetrics(ventureId, dateRange);
console.log(`Sent: ${metrics.totalSent} | Delivered: ${metrics.totalDelivered}`);
console.log(`Open rate: ${metrics.openRate}% | Click rate: ${metrics.clickRate}%`);
console.log(`Bounce rate: ${metrics.bounceRate}% | Spam rate: ${metrics.unsubscribeRate}%`);

// Time-series for charting
const timeline = await analyticsService.getEngagementTimeline(ventureId, dateRange);
// timeline = [{ date: '2026-01-01', sent: 150, delivered: 147, opened: 89, ... }, ...]

// Top campaigns
const top = await analyticsService.getTopPerformingCampaigns(ventureId, 5);
top.forEach(c => console.log(`${c.name}: ${c.openRate}% open, ${c.clickRate}% click`));

// Suppression breakdown
const summary = await analyticsService.getSuppressionSummary(ventureId);
// summary = { bounce: 42, spam_report: 3, unsubscribe: 18, invalid: 7 }
```

### Example 11: Provision Full Email Infrastructure for a New Venture

```typescript
import { sendGridClientService, deliverabilityService } from '@mcv/email/server';

async function provisionEmailForVenture(ventureId: string, domain: string) {
  // 1. Create SendGrid subuser (isolated tenant)
  const subuser = await sendGridClientService.createSubuser(ventureId, domain);
  console.log(`Subuser created: ${subuser.username}`);

  // 2. Authenticate domain (generates DNS records)
  const auth = await deliverabilityService.authenticateDomain(ventureId, domain);
  console.log(`DNS records generated for ${domain}`);

  // 3. Start IP warmup (30-day default exponential ramp)
  const warmup = await deliverabilityService.startIpWarmup(ventureId, '192.168.1.100');
  console.log(`IP warmup started: ${warmup?.ipAddress}`);

  // 4. Set conservative daily limit during warmup
  await sendGridClientService.updateDailyLimit(ventureId, 500);
  console.log('Daily limit set to 500');

  return { subuser, auth, warmup };
}
```

### Example 12: Process SendGrid Webhooks

```typescript
import { webhookHandlerService } from '@mcv/email/server';

// Express route handler
app.post('/webhooks/sendgrid', async (req, res) => {
  // Verify signature
  const isValid = webhookHandlerService.verifySignature(
    process.env.SENDGRID_WEBHOOK_PUBLIC_KEY!,
    JSON.stringify(req.body),
    req.headers['x-twilio-email-event-webhook-signature'] as string,
    req.headers['x-twilio-email-event-webhook-timestamp'] as string,
  );

  if (!isValid) {
    console.warn('Invalid webhook signature');
    return res.status(403).send('Invalid signature');
  }

  const result = await webhookHandlerService.processEvents(req.body);
  console.log(`Webhook batch: ${result.processed} processed, ${result.errors} errors`);

  // Always return 200 to avoid SendGrid retries
  res.status(200).send('OK');
});
```

### Example 13: React Hook — Campaign Management UI

```typescript
'use client';
import { useEmailCampaigns } from '@mcv/email/client';

function CampaignDashboard({ ventureId }: { ventureId: string }) {
  const {
    campaigns, isLoading, error, total,
    createCampaign, sendCampaign, deleteCampaign, refresh,
  } = useEmailCampaigns({ ventureId, status: 'draft', limit: 20 });

  const handleCreate = async () => {
    const campaign = await createCampaign({
      name: 'Spring Promo',
      subject: '🌸 Spring Sale — 30% Off!',
      templateId: 'tmpl-uuid',
      listIds: ['list-uuid'],
      fromEmail: 'marketing@acme.com',
      fromName: 'Acme Marketing',
    });
    if (campaign) console.log('Created:', campaign.id);
  };

  const handleSend = async (id: string) => {
    const result = await sendCampaign(id);
    if (result.success) alert('Campaign sent!');
    else alert(`Error: ${result.error}`);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Campaigns ({total})</h1>
      <button onClick={handleCreate}>New Campaign</button>
      {campaigns.map(c => (
        <div key={c.id}>
          <span>{c.name} — {c.status}</span>
          {c.status === 'draft' && (
            <>
              <button onClick={() => handleSend(c.id)}>Send</button>
              <button onClick={() => deleteCampaign(c.id)}>Delete</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Example 14: React Hook — Analytics Dashboard

```typescript
'use client';
import { useEmailAnalytics } from '@mcv/email/client';

function AnalyticsDashboard({ ventureId }: { ventureId: string }) {
  const {
    metrics, timeline, topCampaigns, suppressionSummary,
    isLoading, refresh,
  } = useEmailAnalytics({
    ventureId,
    startDate: '2026-01-01',
    endDate: '2026-01-31',
  });

  if (isLoading || !metrics) return <div>Loading analytics...</div>;

  return (
    <div>
      <h2>Email Analytics — January 2026</h2>
      <div className="grid grid-cols-4 gap-4">
        <Stat label="Sent" value={metrics.totalSent} />
        <Stat label="Open Rate" value={`${metrics.openRate}%`} />
        <Stat label="Click Rate" value={`${metrics.clickRate}%`} />
        <Stat label="Bounce Rate" value={`${metrics.bounceRate}%`} />
      </div>

      <h3>Top Campaigns</h3>
      {topCampaigns.map(c => (
        <div key={c.campaignId}>
          {c.name}: {c.openRate}% open, {c.clickRate}% click
        </div>
      ))}

      <h3>Suppressions</h3>
      <pre>{JSON.stringify(suppressionSummary, null, 2)}</pre>
    </div>
  );
}
```

### Example 15: Marketing Template Composition

```typescript
import { renderMarketingEmail } from '@mcv/email/server';

const email = renderMarketingEmail(
  {
    headline: '🚀 New Features This Month',
    subheadline: "Here's what we've been building for you",
    heroImageUrl: 'https://cdn.acme.com/hero-feb.jpg',
    heroImageAlt: 'February product updates',
    sections: [
      {
        title: 'AI-Powered Analytics',
        body: 'Our new analytics engine uses machine learning to surface actionable insights from your data.',
        imageUrl: 'https://cdn.acme.com/analytics.png',
        ctaText: 'Try It Now',
        ctaUrl: 'https://app.acme.com/analytics',
      },
      {
        title: 'Team Collaboration',
        body: 'Real-time editing, comments, and @mentions are now available in all project views.',
        ctaText: 'Learn More',
        ctaUrl: 'https://docs.acme.com/collab',
      },
    ],
    ctaText: 'Explore All Updates',
    ctaUrl: 'https://app.acme.com/changelog',
    socialLinks: [
      { name: 'Twitter', url: 'https://twitter.com/acme' },
      { name: 'LinkedIn', url: 'https://linkedin.com/company/acme' },
    ],
    unsubscribeUrl: 'https://app.acme.com/unsubscribe?token=xyz',
    preferencesUrl: 'https://app.acme.com/email-prefs?token=xyz',
  },
  {
    primaryColor: '#6366f1',
    companyName: 'Acme Corp',
    logoUrl: 'https://cdn.acme.com/logo-white.png',
  }
);

// email.subject → "🚀 New Features This Month"
// email.html   → Full responsive HTML with hero, sections, social links
// email.text   → Plain text with sections separated by ---
```

---

## 13. Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SENDGRID_API_KEY` | Yes* | — | Master SendGrid API key. *Can be replaced by System Vault credentials. |
| `SENDGRID_FROM_EMAIL` | No | `noreply@mcv.one` | Default sender email (used when `from` is not specified) |
| `SENDGRID_FROM_NAME` | No | `MCV.ONE` | Default sender name |
| `SENDGRID_WEBHOOK_PUBLIC_KEY` | For webhooks | — | SendGrid's ECDSA public key for webhook signature verification |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string (used by `@mcv/db`) |

**System Vault Alternative (preferred for production):**

Instead of `SENDGRID_API_KEY` env var, the master key can be stored in GCP Secret Manager:
```
Secret path: projects/mcv-one-prototype/secrets/mcv-system-sendgrid-master/versions/latest
Format: { "apiKey": "SG.xxxxxxxxxxxxxxx" }
```

Per-venture credentials are stored via the `integrations` table with `provider: 'sendgrid'`
and `secretResourceName` pointing to a GCP Secret Manager path.

---

## 14. Error Codes

| Code | Thrown By | Description |
|---|---|---|
| `SUBUSER_EXISTS` | `SendGridClientService.createSubuser` | Active subuser already exists for this venture |
| `SUBUSER_NOT_FOUND` | `SendGridClientService.rotateApiKey` | No active subuser found for venture |
| `DATABASE_UNAVAILABLE` | Multiple services | Database connection is null/unavailable |
| `INSERT_FAILED` | `SendGridClientService.createSubuser` | Database insert returned no rows |
| `TEMPLATE_NOT_FOUND` | `TransactionalService.send` | Template ID or name not found (via `templateService.render`) |
| `CAMPAIGN_NOT_FOUND` | `MarketingService.*` | Campaign ID not found in database |
| `CAMPAIGN_WRONG_STATE` | `MarketingService.send/update` | Campaign is in wrong state for requested operation |
| `SUPPRESSED` | `TransactionalService.send` | Recipient email is on the venture's suppression list |
| `DOMAIN_NOT_FOUND` | `DeliverabilityService.verifyDomain` | Domain record not found by ID |
| `SENDGRID_API_ERROR` | Multiple services | Upstream SendGrid API returned an error |
| `RENDER_FAILED` | `TemplateService.render` | Handlebars template compilation or rendering failed |

**Error Response Pattern:**
```typescript
// Services return null or { success: false, error: string } for recoverable errors
// Services throw EmailServiceError for unrecoverable errors (missing DB, duplicate subuser)
try {
  const result = await transactionalService.send(ventureId, options);
  if (!result.success) {
    // Recoverable: suppressed, template not found, SendGrid API error
    console.warn(result.error);
  }
} catch (error) {
  // Unrecoverable: database unavailable
  if (error instanceof EmailServiceError) {
    console.error(`[${error.code}] ${error.message}`);
  }
}
```

---

## 15. Audit Events

| Event | Trigger | Payload Data |
|---|---|---|
| `email.subuser.created` | Subuser provisioned via `createSubuser()` | `{ ventureId, username, domain }` |
| `email.subuser.suspended` | Subuser disabled via `suspendSubuser()` | `{ ventureId, username }` |
| `email.subuser.limit_updated` | Daily limit changed via `updateDailyLimit()` | `{ ventureId, oldLimit, newLimit }` |
| `email.apikey.rotated` | API key rotated via `rotateApiKey()` | `{ ventureId, username }` |
| `email.transactional.sent` | Email sent via `transactionalService.send()` | `{ ventureId, toEmail, template, messageId, sendId }` |
| `email.transactional.batch_sent` | Batch sent via `sendBatch()` | `{ ventureId, total, sent, failed }` |
| `email.campaign.created` | Campaign created | `{ ventureId, campaignId, name, subject }` |
| `email.campaign.scheduled` | Campaign scheduled | `{ ventureId, campaignId, scheduledAt }` |
| `email.campaign.sent` | Campaign send completed | `{ ventureId, campaignId, totalRecipients }` |
| `email.campaign.paused` | Campaign paused | `{ ventureId, campaignId }` |
| `email.campaign.cancelled` | Campaign cancelled | `{ ventureId, campaignId }` |
| `email.campaign.deleted` | Draft campaign deleted | `{ ventureId, campaignId }` |
| `email.campaign.abtest_created` | A/B test configured | `{ ventureId, campaignId, variants }` |
| `email.template.created` | Template created | `{ ventureId, templateId, name, category }` |
| `email.template.updated` | Template updated | `{ ventureId, templateId, version }` |
| `email.template.deactivated` | Template soft-deleted | `{ ventureId, templateId }` |
| `email.template.duplicated` | Template cloned | `{ ventureId, sourceTemplateId, newTemplateId }` |
| `email.domain.authenticated` | Domain DNS records generated | `{ ventureId, domain, domainId }` |
| `email.domain.verified` | DNS verification attempted | `{ ventureId, domain, allVerified, dkim, spf, dmarc }` |
| `email.domain.default_set` | Default domain changed | `{ ventureId, domainId, domain }` |
| `email.warmup.started` | IP warmup initiated | `{ ventureId, ipAddress, totalDays }` |
| `email.suppression.added` | Address added to suppression | `{ ventureId, email, type, reason }` |
| `email.suppression.removed` | Address removed from suppression | `{ ventureId, email }` |
| `email.webhook.processed` | Webhook batch processed | `{ processed, errors, eventTypes }` |
| `email.webhook.bounce` | Bounce event received | `{ ventureId, email, bounceType, reason }` |
| `email.webhook.spam_report` | Spam report received | `{ ventureId, email }` |

---

## 16. Performance Considerations

| Area | Implementation | Details |
|---|---|---|
| **Client Caching** | `Map<string, CachedClient>` with 5-min TTL | SendGrid clients cached per venture; avoids repeated DB + Vault lookups |
| **Batch Sending** | 50/request (transactional), 100/batch (marketing) | Respects SendGrid API rate limits |
| **Parallel Sends** | `Promise.allSettled()` within batches | Maximizes throughput within each batch window |
| **Sequential Batches** | `for...of` loop across batch windows | Prevents overwhelming the SendGrid API |
| **Database Indexes** | 7 on `email_sends`, 4 on `email_campaigns` | Optimized for webhook lookups (`sendgrid_message_id`), status queries, and time-range analytics |
| **Compound Indexes** | `(venture_id, type)` on suppressions, `(venture_id, is_active)` on templates | Efficient multi-column filtering |
| **Suppression Pre-Check** | Query before every send | Prevents wasted SendGrid API calls and preserves sender reputation |
| **Bulk Suppression Load** | Load all suppressions into `Set<string>` for campaigns | O(1) lookup per recipient instead of O(n) DB queries |
| **Filter Aggregates** | PostgreSQL `count(*) FILTER (WHERE ...)` | Single-pass aggregate queries replace N separate `count()` calls |
| **Date Truncation** | `date_trunc('day', ...)` with `GROUP BY` | Efficient time-series generation for analytics timeline |
| **Rate Precision** | Integer math: `Math.round(x * 10000) / 100` | Avoids floating-point precision issues in rate calculations |
| **Template Compilation** | `Handlebars.compile()` per render | **Note:** For high-throughput, consider caching compiled templates |
| **HTML-to-Text** | Regex pipeline (no DOM parsing) | Fast text conversion without heavy dependencies |

### Index Summary

| Table | Total Indexes | Key Columns |
|---|---|---|
| `email_sends` | 7 | `venture_id`, `campaign_id`, `status`, `to_email`, `sendgrid_message_id`, `contact_id`, `created_at` |
| `email_campaigns` | 4 | `venture_id`, `status`, `scheduled_at`, `template_id` |
| `email_templates` | 3 | `venture_id`, `category`, `(venture_id, is_active)` |
| `email_suppressions` | 3 | `venture_id`, `email`, `(venture_id, type)` |
| `email_subusers` | 2 | `venture_id`, `username` |
| `email_lists` | 2 | `venture_id`, `type` |
| `email_domains` | 2 | `venture_id`, `domain` |
| `email_ip_warmup` | 2 | `venture_id`, `status` |
| **Total** | **25** | |

---

## 17. Security Considerations

| Concern | Mitigation |
|---|---|
| **API Key Storage** | Keys in `email_subusers.api_key` — should be encrypted at rest via database-level encryption or application-level envelope encryption |
| **Credential Resolution** | Three-tier chain: System Vault (GCP Secret Manager) → subuser table → master env var. Vault preferred for production. |
| **Webhook Verification** | ECDSA signature verification using SendGrid's public key + timestamp to prevent replay attacks |
| **Suppression Compliance** | Auto-suppression on hard bounce, spam report, and unsubscribe events. Enforces CAN-SPAM / GDPR compliance. |
| **Template Injection** | Handlebars auto-escapes HTML by default (`{{var}}`). Raw HTML requires explicit triple-stache (`{{{var}}}`) — use with caution. |
| **Per-Venture Isolation** | Separate SendGrid subusers prevent cross-venture data leakage. Each subuser has scoped API key permissions. |
| **Email Normalization** | Suppression emails stored and compared in lowercase for consistent matching |
| **Rate Limiting** | `daily_limit` field on `email_subusers`; should be enforced before sending (currently advisory) |
| **SendGrid API Scopes** | Subuser API keys have minimal scopes: `mail.send`, `stats.read`, `suppression.*` — no admin access |
| **Password Generation** | `generateSecurePassword()` generates 32-char random passwords for subuser accounts |
| **Webhook Idempotency** | First-open/first-click logic prevents duplicate event processing (`if (!send.openedAt)`) |
| **Error Handling** | Errors logged to console; SendGrid API failures are caught and don't crash the service |
| **No PII Logging** | Email addresses are not logged in error messages (only in DB records) |

---

## 18. Credential Resolution Chain

The `SendGridClientService` resolves API credentials through a priority chain.
This applies to both `getClient()` (mail sending) and `getApiClient()` (REST API):

```
┌─────────────────────────────────────────────────────────────────┐
│                  CREDENTIAL RESOLUTION ORDER                     │
│                                                                  │
│  1. CLIENT CACHE (fastest path)                                  │
│     └── Map<ventureId, CachedClient>                            │
│         TTL: 5 minutes                                           │
│         Contains: sgMail + sgClient instances                    │
│                                                                  │
│  2. SYSTEM VAULT (preferred for production)                      │
│     └── integrations table WHERE provider = 'sendgrid'          │
│         AND status = 'connected' AND venture_id = ?              │
│         → secretResourceName → @mcv/secrets → GCP Secret Mgr   │
│         → JSON.parse → { apiKey: "SG.xxx" }                     │
│                                                                  │
│  3. SUBUSER API KEY (legacy/provisioned)                         │
│     └── email_subusers table WHERE venture_id = ?               │
│         AND status = 'active'                                    │
│         → apiKey column (should be encrypted at rest)            │
│                                                                  │
│  4. MASTER API KEY (shared fallback)                             │
│     └── GCP Secret Manager: mcv-system-sendgrid-master          │
│         OR SENDGRID_API_KEY environment variable                 │
│         ⚠️ Shared across all ventures — not recommended          │
│                                                                  │
│  If all fail: operations use master key (may be empty string)    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 19. Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@sendgrid/mail` | `^7.x` | SendGrid Mail Send API (sgMail.send) |
| `@sendgrid/client` | `^7.x` | SendGrid REST API client (subusers, domains, API keys) |
| `handlebars` | `^4.x` | Template rendering engine (compile + helpers) |
| `@mcv/db` | workspace | Database access (Drizzle ORM + PostgreSQL) |
| `@mcv/secrets` | workspace | GCP Secret Manager integration (SecretManagerService) |

### Internal Package Dependencies

| Package | Relationship |
|---|---|
| `@mcv/db/schema` | Email table definitions (`emailSubusers`, `emailTemplates`, etc.) |
| `@mcv/db/schema` | `integrations` table for System Vault credential lookup |
| `@mcv/db/schema` | `ventures` table for foreign key references |

### Dev Dependencies

| Package | Purpose |
|---|---|
| `typescript` | Type checking and compilation |
| `vitest` | Unit testing framework |

---

## 20. Related Modules

| Module | Tier | Relationship |
|---|---|---|
| `@mcv/db` | Tier 1 (Foundation) | Database layer — all email tables defined in `schema/email.ts` |
| `@mcv/secrets` | Tier 2 (Core) | Credential storage for SendGrid API keys via GCP Secret Manager |
| `@mcv/contacts` (CRM) | Tier 3 (Connector) | Contact data for list membership and campaign recipients |
| `@mcv/notifications` | Tier 3 (Connector) | May trigger transactional emails via this package |
| `@mcv/audit` | Tier 2 (Core) | Audit event logging for all email operations |
| `@mcv/integrations` | Tier 2 (Core) | Integration registry for SendGrid connection status and credential references |
| `@mcv/invoicing` | Tier 3 (Connector) | Uses invoice template for billing emails |
| `@mcv/auth` | Tier 2 (Core) | Uses password-reset and welcome templates |
| `@mcv/intelligence/gateway` | Tier 4 (Intelligence) | May use email analytics for AI-powered campaign optimization |

---

## 21. Migration & Deployment Notes

### Database Migrations

All email tables are created via Drizzle ORM migrations. The schema includes:
- **7 pg enums** (status types, categories)
- **8 tables** (subusers, templates, campaigns, sends, lists, suppressions, domains, ip_warmup)
- **25 indexes** (optimized for webhook lookups, analytics queries, and multi-tenant filtering)
- **6 JSONB columns** (variables, listIds, segmentIds, stats, abTestConfig, schedule, dynamicFilter, metadata)

### SendGrid Setup Checklist

1. ☐ Create SendGrid account and generate master API key
2. ☐ Store master key in GCP Secret Manager (`mcv-system-sendgrid-master`)
3. ☐ Configure webhook URL in SendGrid settings (Event Webhook → POST URL)
4. ☐ Enable all event types: delivered, open, click, bounce, dropped, deferred, spam report, unsubscribe
5. ☐ Enable Signed Event Webhook and save public key as `SENDGRID_WEBHOOK_PUBLIC_KEY`
6. ☐ Set up IP pool for dedicated IPs (optional)
7. ☐ Run database migrations to create email tables

### Scaling Considerations

- **High-volume ventures** should have dedicated subusers with verified domains
- **IP warmup** is essential for new dedicated IPs — start with the default 30-day schedule
- **Template caching** should be implemented for >1000 sends/minute
- **Webhook processing** should be moved to a queue (e.g., Bull/Redis) for >10K events/minute
- **Analytics queries** on large `email_sends` tables benefit from time-based partitioning

---

*This document was generated from source code analysis of `packages/email/src/` (21 TypeScript files)
and `packages/db/src/schema/email.ts` in the MCV.ONE monorepo.*

*Last verified against commit state: February 8, 2026.*
