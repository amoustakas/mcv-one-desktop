# @mcv/growth/sms

> SMS & MMS Marketing — Broadcast campaigns, two-way conversations, automation triggers, carrier-grade compliance, and multi-provider delivery orchestration.

**Domain:** `growth` · **Module:** `sms` · **Tier:** 5 (Domain)
**Package:** `@mcv/growth/sms`
**Since:** 0.12.0
**Status:** Stable
**Maintainers:** MCV Growth Team

---

## Table of Contents

- [Purpose](#purpose)
- [Exports](#exports)
- [Architecture](#architecture)
  - [Send Pipeline](#send-pipeline)
  - [Inbound Routing](#inbound-routing)
  - [Provider Failover](#provider-failover)
- [Core Interfaces](#core-interfaces)
  - [SMSService](#smsservice)
  - [SMSCampaign](#smscampaign)
  - [SMSMessage](#smsmessage)
  - [SMSAutomation](#smsautomation)
  - [SMSProvider](#smsprovider)
  - [SMSCompliance](#smscompliance)
  - [ShortCode](#shortcode)
  - [SMSAnalytics](#smsanalytics)
  - [InboundHandler](#inboundhandler)
  - [SMSTemplate](#smstemplate)
  - [SMSConversation](#smsconversation)
  - [PhoneNumberInfo](#phonenumberinfo)
- [Database Schemas](#database-schemas)
  - [sms_campaigns](#sms_campaigns)
  - [sms_messages](#sms_messages)
  - [sms_templates](#sms_templates)
  - [sms_automations](#sms_automations)
  - [sms_providers](#sms_providers)
  - [sms_phone_numbers](#sms_phone_numbers)
  - [sms_opt_ins](#sms_opt_ins)
  - [sms_conversations](#sms_conversations)
  - [sms_keywords](#sms_keywords)
  - [sms_analytics](#sms_analytics)
- [Code Examples](#code-examples)
  - [1. Send a Simple Campaign](#1-send-a-simple-campaign)
  - [2. MMS with Media Attachment](#2-mms-with-media-attachment)
  - [3. Two-Way Conversation with Keyword Routing](#3-two-way-conversation-with-keyword-routing)
  - [4. Abandoned Cart SMS Automation](#4-abandoned-cart-sms-automation)
  - [5. Compliance-Checked Send with Quiet Hours](#5-compliance-checked-send-with-quiet-hours)
  - [6. Provider Failover Configuration](#6-provider-failover-configuration)
  - [7. Phone Number Validation & Carrier Lookup](#7-phone-number-validation--carrier-lookup)
  - [8. Campaign Analytics & Attribution](#8-campaign-analytics--attribution)
- [Error Codes](#error-codes)
- [Security](#security)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [Testing](#testing)

---

## Purpose

`@mcv/growth/sms` is the SMS and MMS marketing engine for the MCV.ONE platform. It provides a complete, carrier-grade messaging infrastructure that abstracts away the complexity of multiple telephony providers, regulatory compliance across jurisdictions, and the operational challenges of high-volume message delivery.

### What It Does

**Campaign Management** — Create, schedule, and send broadcast SMS/MMS campaigns to audience segments. Supports send-time optimization that delivers messages at the optimal local time for each recipient's timezone, A/B testing of message variants, and drip sequences that space messages over configurable intervals.

**Two-Way Messaging** — Handle inbound SMS with keyword-based routing, conversational flows that maintain state across exchanges, and seamless handoff to human agents when automated responses are insufficient. Conversations are threaded and persisted for compliance and analytics.

**Automation Integration** — Plug SMS into journey orchestration flows managed by `@mcv/growth/journeys`. Trigger messages on events like abandoned carts, appointment reminders, shipping updates, welcome sequences, and re-engagement campaigns. Supports conditional branching based on delivery status and recipient responses.

**Multi-Provider Delivery** — Route messages through Twilio, Vonage (Nexmo), MessageBird, or Plivo with automatic failover, cost-based routing optimization per destination country, and throughput balancing across providers. Provider health is monitored continuously with circuit breakers preventing cascade failures.

**Regulatory Compliance** — Enforce TCPA, CTIA, and carrier-specific regulations including opt-in/opt-out management (STOP/START/HELP keywords), quiet hours per timezone, consent tracking with audit trails, 10DLC campaign registration, and Do-Not-Call (DNC) list integration. Compliance checks are mandatory and cannot be bypassed.

**Analytics & Attribution** — Track delivery rates, click-through rates on shortened URLs, opt-out rates, conversion attribution with configurable windows, cost per message by provider and destination, and ROI calculations that tie SMS spend to revenue events.

### What It Does NOT Do

- **Voice calls** — See `@mcv/growth/voice` for IVR, call tracking, and voice broadcasts
- **Push notifications** — See `@mcv/growth/push` for mobile and web push
- **Email** — See `@mcv/growth/email` for email campaigns and transactional email
- **WhatsApp / RCS** — See `@mcv/growth/chat` for OTT messaging channels
- **Journey orchestration** — See `@mcv/growth/journeys` for cross-channel flow building (this module provides the SMS execution layer)

### Design Principles

1. **Compliance is non-negotiable** — Every outbound message passes through the compliance pipeline. There is no "skip compliance" flag. Consent must be verified, quiet hours enforced, and opt-outs honored before any message is queued for delivery.

2. **Provider-agnostic** — Business logic never references a specific provider. The `SMSProvider` interface abstracts all provider-specific behavior. Switching providers or adding new ones requires zero changes to campaign or automation code.

3. **Multi-tenant by default** — All data is scoped by `tenant_id` via Supabase Row-Level Security (RLS). A tenant cannot read, modify, or even detect the existence of another tenant's campaigns, numbers, or messages.

4. **Eventual delivery** — SMS is inherently asynchronous. The system is designed around eventual delivery with status callbacks, retry logic, and dead-letter handling. No API call blocks on actual carrier delivery.

5. **Cost awareness** — Every routing decision considers cost. The system tracks per-message costs by provider and destination, enables budget caps per campaign, and surfaces cost data in analytics.

---

## Exports

```typescript
// === Core Service ===
export { SMSService }              from './services/sms.service';
export { SMSServiceImpl }          from './services/sms.service.impl';

// === Campaigns ===
export { CampaignService }         from './services/campaign.service';
export { CampaignScheduler }       from './services/campaign-scheduler.service';
export { SendTimeOptimizer }       from './services/send-time-optimizer.service';
export { ABTestService }           from './services/ab-test.service';

// === Messaging ===
export { MessageSender }           from './services/message-sender.service';
export { MessageBuilder }          from './services/message-builder.service';
export { TemplateRenderer }        from './services/template-renderer.service';
export { URLShortener }            from './services/url-shortener.service';
export { MediaOptimizer }          from './services/media-optimizer.service';

// === Two-Way / Inbound ===
export { InboundRouter }           from './services/inbound-router.service';
export { KeywordHandler }          from './services/keyword-handler.service';
export { ConversationManager }     from './services/conversation-manager.service';
export { AgentHandoff }            from './services/agent-handoff.service';

// === Automation ===
export { SMSAutomationService }    from './services/sms-automation.service';
export { TriggerEvaluator }        from './services/trigger-evaluator.service';
export { JourneyAdapter }          from './services/journey-adapter.service';

// === Providers ===
export { ProviderRegistry }        from './providers/provider-registry';
export { ProviderRouter }          from './providers/provider-router';
export { TwilioProvider }          from './providers/twilio.provider';
export { VonageProvider }          from './providers/vonage.provider';
export { MessageBirdProvider }     from './providers/messagebird.provider';
export { PlivoProvider }           from './providers/plivo.provider';

// === Compliance ===
export { ComplianceService }       from './services/compliance.service';
export { OptInManager }            from './services/opt-in-manager.service';
export { QuietHoursEnforcer }      from './services/quiet-hours-enforcer.service';
export { ConsentTracker }          from './services/consent-tracker.service';
export { DNCListService }          from './services/dnc-list.service';
export { TenDLCRegistrar }         from './services/ten-dlc-registrar.service';

// === Phone Numbers ===
export { PhoneNumberService }      from './services/phone-number.service';
export { NumberValidator }         from './services/number-validator.service';
export { CarrierLookup }           from './services/carrier-lookup.service';
export { NumberPoolManager }       from './services/number-pool-manager.service';
export { ShortCodeManager }        from './services/short-code-manager.service';

// === Analytics ===
export { SMSAnalyticsService }     from './services/sms-analytics.service';
export { DeliveryTracker }         from './services/delivery-tracker.service';
export { ClickTracker }            from './services/click-tracker.service';
export { ConversionAttributor }    from './services/conversion-attributor.service';
export { CostCalculator }          from './services/cost-calculator.service';

// === tRPC Router ===
export { smsRouter }               from './trpc/sms.router';
export { campaignRouter }          from './trpc/campaign.router';
export { conversationRouter }      from './trpc/conversation.router';
export { analyticsRouter }         from './trpc/analytics.router';
export { complianceRouter }        from './trpc/compliance.router';
export { phoneNumberRouter }       from './trpc/phone-number.router';

// === Schemas (Drizzle) ===
export * from './db/schema';

// === Types ===
export type { SMSCampaign }        from './types/campaign';
export type { SMSMessage }         from './types/message';
export type { SMSTemplate }        from './types/template';
export type { SMSAutomation }      from './types/automation';
export type { SMSProvider }        from './types/provider';
export type { SMSCompliance }      from './types/compliance';
export type { ShortCode }          from './types/short-code';
export type { SMSAnalytics }       from './types/analytics';
export type { InboundHandler }     from './types/inbound';
export type { SMSConversation }    from './types/conversation';
export type { PhoneNumberInfo }    from './types/phone-number';
export type { ProviderConfig }     from './types/provider-config';
export type { DeliveryStatus }     from './types/delivery-status';
export type { ComplianceResult }   from './types/compliance-result';
export type { SendResult }         from './types/send-result';
export type { CampaignStats }      from './types/campaign-stats';

// === Constants ===
export { SMS_ERRORS }              from './constants/errors';
export { SMS_EVENTS }              from './constants/events';
export { CARRIER_LIMITS }          from './constants/carrier-limits';
export { DEFAULT_QUIET_HOURS }     from './constants/quiet-hours';
export { COUNTRY_CODES }           from './constants/country-codes';
```

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        @mcv/growth/sms                              │
│                                                                     │
│  ┌─────────────┐   ┌──────────────┐   ┌────────────────────────┐   │
│  │  tRPC API   │   │  Journey     │   │  Webhook Ingress       │   │
│  │  (Client)   │   │  Adapter     │   │  (Provider Callbacks)  │   │
│  └──────┬──────┘   └──────┬───────┘   └───────────┬────────────┘   │
│         │                 │                        │                │
│         ▼                 ▼                        ▼                │
│  ┌──────────────────────────────────┐   ┌──────────────────────┐   │
│  │         SMSService               │   │   InboundRouter      │   │
│  │  • createCampaign()              │   │   • routeMessage()   │   │
│  │  • sendMessage()                 │   │   • matchKeyword()   │   │
│  │  • scheduleCampaign()            │   │   • handoffToAgent() │   │
│  │  • getCampaignStats()            │   │   • autoReply()      │   │
│  └──────────────┬───────────────────┘   └──────────┬───────────┘   │
│                 │                                   │               │
│                 ▼                                   ▼               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Compliance Pipeline                        │   │
│  │  ┌─────────┐ ┌───────────┐ ┌────────────┐ ┌──────────────┐  │   │
│  │  │ Consent │→│ Opt-Out   │→│ Quiet Hours│→│ DNC Check    │  │   │
│  │  │ Check   │ │ Check     │ │ Check      │ │              │  │   │
│  │  └─────────┘ └───────────┘ └────────────┘ └──────────────┘  │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                       │
│                             ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   Message Builder                             │   │
│  │  • Merge fields  • Conditional content  • URL shortening      │   │
│  │  • Media optimization  • Segment encoding  • Coupon injection │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                       │
│                             ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   Provider Router                             │   │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────────┐ ┌──────────┐     │   │
│  │  │  Twilio  │ │  Vonage  │ │ MessageBird │ │  Plivo   │     │   │
│  │  └──────────┘ └──────────┘ └─────────────┘ └──────────┘     │   │
│  │  • Cost routing  • Failover  • Circuit breakers  • Health    │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                       │
│                             ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   Delivery Tracker                            │   │
│  │  • Status callbacks  • Retry queue  • Dead letter  • Events  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Send Pipeline

The send pipeline processes every outbound SMS/MMS message through a deterministic sequence of stages. Each stage can halt the pipeline with a specific error code, ensuring compliance and data integrity.

```
                          ┌───────────────────┐
                          │   Send Request     │
                          │  (API / Journey /  │
                          │   Automation)      │
                          └─────────┬─────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  Stage 1: Input Validation     │
                    │  • Phone format (E.164)        │
                    │  • Message length (160/1600)   │
                    │  • Media type/size (MMS)       │
                    │  • Template variable presence   │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  Stage 2: Phone Normalization   │
                    │  • libphonenumber parse         │
                    │  • Country code resolution      │
                    │  • Number type detection         │
                    │    (mobile/landline/VoIP)       │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  Stage 3: Compliance Check      │
                    │  • Consent verification          │
                    │  • Opt-out status (STOP check)  │
                    │  • DNC list match               │
                    │  • Quiet hours enforcement       │
                    │  • Rate limit per recipient      │
                    │  • Campaign frequency cap        │
                    └───────────────┬───────────────┘
                                    │
                             ┌──────┴──────┐
                             │  Pass?      │
                             └──────┬──────┘
                              No    │    Yes
                              │     │     │
                              ▼     │     ▼
                    ┌──────────┐    │  ┌───────────────────────────┐
                    │ Reject   │    │  │ Stage 4: Message Render    │
                    │ + Log    │    │  │ • Template merge fields    │
                    └──────────┘    │  │ • Conditional blocks       │
                                   │  │ • URL shortening + track   │
                                   │  │ • Coupon code injection    │
                                   │  │ • Segment count check      │
                                   │  └───────────────┬───────────┘
                                   │                   │
                                   │                   ▼
                                   │  ┌───────────────────────────┐
                                   │  │ Stage 5: Media Processing  │
                                   │  │ • Image resize per carrier │
                                   │  │ • Format conversion        │
                                   │  │ • CDN upload + signed URL  │
                                   │  │ • (skipped for plain SMS)  │
                                   │  └───────────────┬───────────┘
                                   │                   │
                                   │                   ▼
                                   │  ┌───────────────────────────┐
                                   │  │ Stage 6: Provider Routing  │
                                   │  │ • Destination country      │
                                   │  │ • Cost optimization        │
                                   │  │ • Provider health status   │
                                   │  │ • Throughput balancing     │
                                   │  │ • Number pool selection    │
                                   │  └───────────────┬───────────┘
                                   │                   │
                                   │                   ▼
                                   │  ┌───────────────────────────┐
                                   │  │ Stage 7: Dispatch          │
                                   │  │ • Provider API call        │
                                   │  │ • Queue for scheduled      │
                                   │  │ • Retry on transient fail  │
                                   │  │ • Dead letter on permanent │
                                   │  └───────────────┬───────────┘
                                   │                   │
                                   │                   ▼
                                   │  ┌───────────────────────────┐
                                   │  │ Stage 8: Post-Send         │
                                   │  │ • Record in sms_messages   │
                                   │  │ • Update campaign stats    │
                                   │  │ • Emit delivery event      │
                                   │  │ • Debit cost from budget   │
                                   │  └───────────────────────────┘
```

#### Pipeline Guarantees

- **Idempotent** — Duplicate send requests (same `idempotency_key`) are detected and deduplicated at Stage 1.
- **Atomic compliance** — All compliance checks in Stage 3 are evaluated as a single unit. A message either passes all checks or is rejected entirely.
- **Ordered within recipient** — Messages to the same recipient from the same campaign are delivered in order. Cross-campaign ordering is not guaranteed.
- **At-least-once delivery** — The system retries transient failures. Providers handle deduplication at the carrier level.

### Inbound Routing

Inbound SMS messages arrive via provider webhooks and are routed through a matching pipeline:

```
┌──────────────────────┐
│  Provider Webhook     │
│  (Twilio/Vonage/etc) │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Webhook Validator    │
│  • Signature check    │
│  • Replay protection  │
│  • Rate limiting      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Tenant Resolution    │
│  • Match by TO number │
│  • Lookup phone_number│
│    → tenant_id        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Keyword Matching     │
│  (case-insensitive)   │
│                       │
│  STOP → OptOutManager │
│  START → OptInManager │
│  HELP → HelpResponse  │
│  Custom → KeywordFlow │
└──────────┬───────────┘
           │
    ┌──────┴──────────┐
    │ Active           │
    │ Conversation?    │
    └──────┬──────────┘
     Yes   │    No
      │    │     │
      ▼    │     ▼
┌──────────┐  ┌────────────────────┐
│ Continue  │  │ Default Handler     │
│ Convo     │  │ • Auto-reply        │
│ Flow      │  │ • Agent queue       │
└──────────┘  │ • Ignore (config)   │
              └────────────────────┘
```

#### Keyword Matching Rules

1. **System keywords** (`STOP`, `STOPALL`, `UNSUBSCRIBE`, `CANCEL`, `END`, `QUIT`, `START`, `SUBSCRIBE`, `UNSTOP`, `HELP`, `INFO`) are always matched first and cannot be overridden by tenant-defined keywords.
2. **Tenant keywords** are matched case-insensitively with leading/trailing whitespace trimmed.
3. **Exact match** takes priority over **prefix match** (e.g., keyword `DEAL` matches before `DEALS`).
4. If no keyword matches and an active conversation exists for the `(from_number, to_number)` pair with activity within the conversation TTL (default: 24 hours), the message is routed to the conversation handler.
5. If no keyword and no active conversation, the tenant's default inbound handler is invoked.

### Provider Failover

The provider router implements a priority-based failover strategy with circuit breakers:

```
┌─────────────────────────────────────────────────┐
│              Provider Router                      │
│                                                   │
│  Route Selection:                                │
│  1. Filter by destination support                │
│  2. Filter by health (circuit breaker open?)     │
│  3. Sort by: priority → cost → throughput        │
│  4. Select top provider                          │
│                                                   │
│  Circuit Breaker (per provider):                 │
│  ┌─────────┐     5 failures    ┌────────┐       │
│  │ CLOSED  │ ───────────────→ │  OPEN  │       │
│  │ (okay)  │                   │ (skip) │       │
│  └─────────┘                   └───┬────┘       │
│       ▲                            │             │
│       │   success    ┌──────────┐  │ 60s        │
│       └─────────────│HALF-OPEN │◄─┘             │
│                      │(1 probe) │                │
│                      └──────────┘                │
│                                                   │
│  Failover Sequence:                              │
│  Primary fails → Secondary → Tertiary → DLQ     │
└─────────────────────────────────────────────────┘
```

**Circuit breaker parameters** (configurable per provider):

| Parameter | Default | Description |
|-----------|---------|-------------|
| `failureThreshold` | 5 | Consecutive failures to trip |
| `resetTimeoutMs` | 60000 | Time before half-open probe |
| `halfOpenMax` | 1 | Probes allowed in half-open |
| `monitorWindow` | 30000 | Rolling window for failure count |

---

## Core Interfaces

### SMSService

The primary facade for all SMS operations. All methods are tenant-scoped — the `tenantId` is extracted from the authenticated tRPC context.

```typescript
interface SMSService {
  // === Campaign Management ===

  /**
   * Create a new SMS campaign in draft state.
   * The campaign is not sent until explicitly scheduled or triggered.
   */
  createCampaign(input: CreateCampaignInput): Promise<SMSCampaign>;

  /**
   * Update a draft or paused campaign.
   * Cannot update a campaign that is currently sending or completed.
   * @throws SMS_CAMPAIGN_NOT_EDITABLE if campaign state disallows edits.
   */
  updateCampaign(campaignId: string, input: UpdateCampaignInput): Promise<SMSCampaign>;

  /**
   * Schedule a campaign for future delivery.
   * If sendTimeOptimization is enabled, messages are spread across
   * timezones to arrive at the specified local time for each recipient.
   */
  scheduleCampaign(campaignId: string, schedule: CampaignSchedule): Promise<SMSCampaign>;

  /**
   * Cancel a scheduled campaign.
   * Messages already dispatched to providers cannot be recalled.
   * Returns the count of messages successfully cancelled.
   */
  cancelCampaign(campaignId: string): Promise<{ cancelled: number; alreadySent: number }>;

  /**
   * Pause a sending campaign. Queued messages are held; in-flight messages complete.
   */
  pauseCampaign(campaignId: string): Promise<SMSCampaign>;

  /**
   * Resume a paused campaign from where it left off.
   */
  resumeCampaign(campaignId: string): Promise<SMSCampaign>;

  /**
   * Delete a draft campaign. Sent campaigns are archived, not deleted.
   * @throws SMS_CAMPAIGN_NOT_DELETABLE if campaign has sent messages.
   */
  deleteCampaign(campaignId: string): Promise<void>;

  /**
   * Get campaign by ID with current statistics.
   */
  getCampaign(campaignId: string): Promise<SMSCampaign & { stats: CampaignStats }>;

  /**
   * List campaigns with filtering, sorting, and pagination.
   */
  listCampaigns(filters: CampaignFilters): Promise<PaginatedResult<SMSCampaign>>;

  // === Direct Messaging ===

  /**
   * Send a single SMS/MMS message.
   * The message passes through the full compliance pipeline.
   * Returns immediately with a message ID; delivery is asynchronous.
   */
  sendMessage(input: SendMessageInput): Promise<SendResult>;

  /**
   * Send a batch of messages (up to 10,000 per call).
   * Messages are queued and processed with configurable throughput.
   */
  sendBatch(input: SendBatchInput): Promise<BatchResult>;

  /**
   * Get message by ID with delivery status history.
   */
  getMessage(messageId: string): Promise<SMSMessage>;

  /**
   * List messages with filtering by campaign, status, recipient, date range.
   */
  listMessages(filters: MessageFilters): Promise<PaginatedResult<SMSMessage>>;

  // === Templates ===

  /**
   * Create a reusable message template with merge fields.
   */
  createTemplate(input: CreateTemplateInput): Promise<SMSTemplate>;

  /**
   * Render a template with provided data, returning the final message text.
   * Useful for preview before send.
   */
  renderTemplate(templateId: string, data: Record<string, unknown>): Promise<string>;

  /**
   * List templates with optional tag and search filters.
   */
  listTemplates(filters: TemplateFilters): Promise<PaginatedResult<SMSTemplate>>;

  // === Conversations ===

  /**
   * Get an active conversation by ID.
   */
  getConversation(conversationId: string): Promise<SMSConversation>;

  /**
   * List conversations with filters (status, assignee, date range).
   */
  listConversations(filters: ConversationFilters): Promise<PaginatedResult<SMSConversation>>;

  /**
   * Reply to a conversation. The reply is sent from the same number
   * that received the inbound message.
   */
  replyToConversation(conversationId: string, message: string): Promise<SendResult>;

  /**
   * Assign a conversation to a human agent.
   */
  assignConversation(conversationId: string, agentId: string): Promise<void>;

  /**
   * Close a conversation. Further inbound messages start a new conversation.
   */
  closeConversation(conversationId: string): Promise<void>;

  // === Analytics ===

  /**
   * Get aggregated analytics for a campaign.
   */
  getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics>;

  /**
   * Get account-level analytics for a date range.
   */
  getAccountAnalytics(dateRange: DateRange): Promise<AccountAnalytics>;

  /**
   * Get per-message delivery funnel data.
   */
  getDeliveryFunnel(campaignId: string): Promise<DeliveryFunnel>;
}
```

#### Supporting Types for SMSService

```typescript
interface CreateCampaignInput {
  /** Human-readable campaign name */
  name: string;
  /** Campaign type — affects compliance rules applied */
  type: 'promotional' | 'transactional' | 'conversational';
  /** Template ID or inline message body */
  templateId?: string;
  body?: string;
  /** Media URLs for MMS (max 10, total < 5MB) */
  mediaUrls?: string[];
  /** Audience segment ID from @mcv/growth/audiences */
  segmentId?: string;
  /** Or explicit list of phone numbers (E.164) */
  recipients?: string[];
  /** Phone number or short code to send from */
  fromNumberId?: string;
  /** Merge data mapping — keys match template variables */
  mergeDataSource?: 'segment_attributes' | 'custom';
  /** Custom merge data keyed by recipient phone */
  mergeData?: Record<string, Record<string, unknown>>;
  /** A/B test variants */
  variants?: CampaignVariant[];
  /** Tags for organization */
  tags?: string[];
  /** Budget cap in USD — campaign pauses when reached */
  budgetCap?: number;
  /** Max messages per second throughput */
  maxThroughput?: number;
}

interface CampaignSchedule {
  /** When to start sending (ISO 8601) */
  sendAt: string;
  /** Optimize send time per recipient timezone */
  sendTimeOptimization?: boolean;
  /** Target local time if optimization enabled (HH:mm) */
  targetLocalTime?: string;
  /** Timezone for non-optimized sends */
  timezone?: string;
}

interface SendMessageInput {
  /** Recipient phone number (E.164 format) */
  to: string;
  /** Message body (max 1600 chars for concatenated SMS) */
  body: string;
  /** Media URLs for MMS */
  mediaUrls?: string[];
  /** From number ID (uses default if not specified) */
  fromNumberId?: string;
  /** Idempotency key for deduplication */
  idempotencyKey?: string;
  /** Custom metadata attached to the message */
  metadata?: Record<string, string>;
  /** Callback URL for delivery status updates */
  statusCallbackUrl?: string;
  /** Schedule for future delivery */
  sendAt?: string;
  /** Priority: high for transactional, normal for marketing */
  priority?: 'high' | 'normal' | 'low';
}

interface SendResult {
  /** Unique message ID */
  messageId: string;
  /** Current status */
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'rejected';
  /** If rejected, the reason */
  rejectionReason?: string;
  /** Rejection error code */
  rejectionCode?: string;
  /** Provider used for delivery */
  providerId?: string;
  /** Estimated cost in USD */
  estimatedCost?: number;
  /** Number of SMS segments */
  segmentCount?: number;
}

interface CampaignStats {
  totalRecipients: number;
  sent: number;
  delivered: number;
  failed: number;
  rejected: number;
  clicked: number;
  optedOut: number;
  replied: number;
  pending: number;
  deliveryRate: number;
  clickRate: number;
  optOutRate: number;
  replyRate: number;
  totalCost: number;
  costPerDelivered: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  roi: number;
}
```

### SMSCampaign

Represents a single SMS/MMS marketing campaign with its full lifecycle state.

```typescript
interface SMSCampaign {
  /** UUID primary key */
  id: string;
  /** Owning tenant */
  tenantId: string;
  /** Human-readable name */
  name: string;
  /** Campaign type affecting compliance rules */
  type: 'promotional' | 'transactional' | 'conversational';
  /** Current lifecycle state */
  status: CampaignStatus;
  /** Template reference or inline body */
  templateId: string | null;
  body: string | null;
  /** MMS media URLs */
  mediaUrls: string[];
  /** Audience segment reference */
  segmentId: string | null;
  /** Sending phone number/short code */
  fromNumberId: string;
  /** Schedule configuration */
  schedule: CampaignSchedule | null;
  /** A/B test configuration */
  abTest: ABTestConfig | null;
  /** Budget cap in USD */
  budgetCap: number | null;
  /** Max send throughput (messages/second) */
  maxThroughput: number;
  /** Custom tags */
  tags: string[];
  /** Custom metadata */
  metadata: Record<string, string>;
  /** Audit timestamps */
  createdAt: string;
  updatedAt: string;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  /** Who created/updated */
  createdBy: string;
  updatedBy: string;
}

type CampaignStatus =
  | 'draft'       // Not yet configured for send
  | 'scheduled'   // Queued for future send
  | 'sending'     // Actively dispatching messages
  | 'paused'      // Temporarily halted
  | 'completed'   // All messages processed
  | 'cancelled'   // Explicitly cancelled
  | 'failed';     // System failure during send

interface ABTestConfig {
  /** Variants with their weight distribution */
  variants: CampaignVariant[];
  /** Percentage of audience for test (0-100) */
  testPercentage: number;
  /** Metric to determine winner */
  winnerMetric: 'delivery_rate' | 'click_rate' | 'reply_rate' | 'conversion_rate';
  /** Hours to wait before selecting winner */
  testDurationHours: number;
  /** Auto-send winner to remaining audience */
  autoSendWinner: boolean;
}

interface CampaignVariant {
  id: string;
  name: string;
  body: string;
  mediaUrls?: string[];
  weight: number; // 0-100, must sum to 100 across variants
}
```

### SMSMessage

Represents a single SMS or MMS message — sent or received.

```typescript
interface SMSMessage {
  /** UUID primary key */
  id: string;
  tenantId: string;
  /** Associated campaign (null for ad-hoc or inbound) */
  campaignId: string | null;
  /** Automation that triggered this message */
  automationId: string | null;
  /** Conversation thread */
  conversationId: string | null;
  /** Direction */
  direction: 'outbound' | 'inbound';
  /** Sender number (E.164) */
  from: string;
  /** Recipient number (E.164) */
  to: string;
  /** Message body */
  body: string;
  /** MMS media attachments */
  mediaUrls: string[];
  /** SMS or MMS */
  messageType: 'sms' | 'mms';
  /** Number of SMS segments (for billing) */
  segmentCount: number;
  /** Current delivery status */
  status: MessageStatus;
  /** Status history with timestamps */
  statusHistory: StatusEvent[];
  /** Provider that handled delivery */
  providerId: string | null;
  /** Provider's message ID */
  providerMessageId: string | null;
  /** Cost in USD */
  cost: number | null;
  /** Error code if failed */
  errorCode: string | null;
  /** Error description */
  errorMessage: string | null;
  /** Shortened URLs with click tracking */
  trackedUrls: TrackedUrl[];
  /** Idempotency key */
  idempotencyKey: string | null;
  /** Custom metadata */
  metadata: Record<string, string>;
  /** Timestamps */
  createdAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
}

type MessageStatus =
  | 'queued'      // In send queue
  | 'sending'     // Dispatched to provider
  | 'sent'        // Provider accepted
  | 'delivered'   // Carrier confirmed delivery
  | 'undelivered' // Carrier could not deliver
  | 'failed'      // Provider rejected
  | 'rejected'    // Compliance check failed
  | 'cancelled';  // Cancelled before send

interface StatusEvent {
  status: MessageStatus;
  timestamp: string;
  providerStatus?: string;
  errorCode?: string;
  errorMessage?: string;
}

interface TrackedUrl {
  originalUrl: string;
  shortUrl: string;
  shortCode: string;
  clicks: number;
  firstClickAt: string | null;
  lastClickAt: string | null;
}
```

### SMSAutomation

Defines automated SMS triggers that fire in response to events.

```typescript
interface SMSAutomation {
  id: string;
  tenantId: string;
  /** Human-readable name */
  name: string;
  /** Whether this automation is active */
  enabled: boolean;
  /** Trigger event type */
  trigger: AutomationTrigger;
  /** Conditions that must be met (AND logic) */
  conditions: AutomationCondition[];
  /** Message configuration */
  message: AutomationMessage;
  /** Delay before sending after trigger */
  delay: AutomationDelay | null;
  /** Max sends per recipient in a rolling window */
  frequencyCap: FrequencyCap | null;
  /** Journey ID if this automation is part of a journey */
  journeyId: string | null;
  /** Step ID within the journey */
  journeyStepId: string | null;
  /** Statistics */
  stats: {
    triggered: number;
    sent: number;
    delivered: number;
    clicked: number;
    converted: number;
    suppressed: number;
  };
  createdAt: string;
  updatedAt: string;
}

type AutomationTrigger =
  | { type: 'event'; eventName: string; source?: string }
  | { type: 'segment_enter'; segmentId: string }
  | { type: 'segment_exit'; segmentId: string }
  | { type: 'schedule'; cron: string; timezone: string }
  | { type: 'inbound_sms'; keyword?: string }
  | { type: 'webhook'; webhookId: string }
  | { type: 'api'; }; // Triggered via API call

interface AutomationCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'not_contains' | 'in' | 'not_in' | 'exists' | 'not_exists';
  value: unknown;
}

interface AutomationMessage {
  templateId?: string;
  body?: string;
  mediaUrls?: string[];
  fromNumberId?: string;
}

interface AutomationDelay {
  value: number;
  unit: 'minutes' | 'hours' | 'days';
  /** Smart delay: wait until next occurrence of this local time */
  untilTime?: string; // HH:mm
  /** Smart delay: wait until this day of week */
  untilDay?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
}

interface FrequencyCap {
  maxSends: number;
  windowDays: number;
}
```

### SMSProvider

The abstraction layer for telephony providers. Each provider implements this interface.

```typescript
interface SMSProvider {
  /** Unique provider identifier */
  readonly id: string;
  /** Human-readable name */
  readonly name: string;
  /** Countries this provider can deliver to (ISO 3166-1 alpha-2) */
  readonly supportedCountries: string[];
  /** Whether this provider supports MMS */
  readonly supportsMms: boolean;
  /** Max message segments supported */
  readonly maxSegments: number;
  /** Max media size in bytes for MMS */
  readonly maxMediaSizeBytes: number;
  /** Supported media types for MMS */
  readonly supportedMediaTypes: string[];

  /**
   * Send a single SMS/MMS message via this provider.
   * @returns Provider-specific message ID and cost.
   */
  send(message: ProviderSendRequest): Promise<ProviderSendResponse>;

  /**
   * Send a batch of messages (if provider supports batch API).
   * Falls back to sequential sends if not supported.
   */
  sendBatch(messages: ProviderSendRequest[]): Promise<ProviderSendResponse[]>;

  /**
   * Query the delivery status of a previously sent message.
   */
  getStatus(providerMessageId: string): Promise<ProviderMessageStatus>;

  /**
   * Validate a webhook callback from this provider.
   * Checks signature, timestamp, and payload integrity.
   */
  validateWebhook(request: WebhookRequest): Promise<boolean>;

  /**
   * Parse a provider-specific webhook payload into a normalized format.
   */
  parseWebhook(request: WebhookRequest): Promise<NormalizedWebhookEvent>;

  /**
   * Look up carrier information for a phone number.
   */
  lookupCarrier(phoneNumber: string): Promise<CarrierInfo>;

  /**
   * Get current provider health status.
   */
  healthCheck(): Promise<ProviderHealth>;

  /**
   * Estimate the cost of sending to a destination.
   * @param destination Country code (e.g., 'US', 'GB')
   * @param messageType 'sms' or 'mms'
   */
  estimateCost(destination: string, messageType: 'sms' | 'mms'): Promise<number>;
}

interface ProviderSendRequest {
  to: string;
  from: string;
  body: string;
  mediaUrls?: string[];
  statusCallbackUrl?: string;
  idempotencyKey?: string;
  metadata?: Record<string, string>;
}

interface ProviderSendResponse {
  providerMessageId: string;
  status: 'queued' | 'sent' | 'failed';
  cost: number;
  segmentCount: number;
  errorCode?: string;
  errorMessage?: string;
}

interface ProviderHealth {
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  errorRate: number;
  lastChecked: string;
}

interface CarrierInfo {
  carrier: string;
  type: 'mobile' | 'landline' | 'voip' | 'toll_free' | 'unknown';
  countryCode: string;
  networkCode: string | null;
  isMobile: boolean;
}
```

### SMSCompliance

Handles all regulatory compliance checks for SMS messaging.

```typescript
interface SMSCompliance {
  /**
   * Run the full compliance check for an outbound message.
   * Returns a result indicating pass/fail with specific reasons.
   */
  checkOutbound(request: ComplianceCheckRequest): Promise<ComplianceResult>;

  /**
   * Record opt-in consent for a phone number.
   * @param method How consent was obtained (web form, keyword, paper, etc.)
   */
  recordOptIn(input: OptInInput): Promise<void>;

  /**
   * Process an opt-out request (typically from STOP keyword).
   * This is irreversible until the recipient opts back in.
   */
  processOptOut(phoneNumber: string, tenantId: string): Promise<void>;

  /**
   * Check if a phone number has active opt-in consent.
   */
  hasConsent(phoneNumber: string, tenantId: string, campaignType: string): Promise<boolean>;

  /**
   * Check if sending is allowed right now (quiet hours).
   * @param recipientTimezone IANA timezone identifier
   */
  isWithinSendingHours(recipientTimezone: string, tenantId: string): Promise<boolean>;

  /**
   * Check DNC (Do-Not-Call) list.
   */
  isOnDNCList(phoneNumber: string): Promise<boolean>;

  /**
   * Get the compliance audit trail for a phone number.
   */
  getConsentHistory(phoneNumber: string, tenantId: string): Promise<ConsentEvent[]>;

  /**
   * Register a 10DLC campaign with the carrier registry.
   */
  register10DLC(input: TenDLCRegistrationInput): Promise<TenDLCRegistration>;

  /**
   * Get 10DLC registration status.
   */
  get10DLCStatus(registrationId: string): Promise<TenDLCRegistration>;
}

interface ComplianceCheckRequest {
  tenantId: string;
  to: string;
  campaignType: 'promotional' | 'transactional' | 'conversational';
  campaignId?: string;
}

interface ComplianceResult {
  allowed: boolean;
  checks: ComplianceCheckDetail[];
  /** If not allowed, the primary reason */
  reason?: string;
  /** Error code for the rejection */
  code?: string;
}

interface ComplianceCheckDetail {
  check: 'consent' | 'opt_out' | 'quiet_hours' | 'dnc_list' | 'rate_limit' | 'frequency_cap' | 'number_type' | 'country_allowed';
  passed: boolean;
  reason?: string;
  metadata?: Record<string, unknown>;
}

interface OptInInput {
  phoneNumber: string;
  tenantId: string;
  /** How consent was obtained */
  method: 'web_form' | 'sms_keyword' | 'paper_form' | 'pos' | 'api' | 'import' | 'verbal';
  /** What types of messages they consented to */
  campaignTypes: ('promotional' | 'transactional' | 'conversational')[];
  /** URL or reference to the consent form/language */
  consentSource?: string;
  /** IP address of the consenting party (for web forms) */
  ipAddress?: string;
  /** Timestamp of consent (defaults to now) */
  consentedAt?: string;
  /** Free-text notes about how consent was obtained */
  notes?: string;
}

interface ConsentEvent {
  id: string;
  phoneNumber: string;
  tenantId: string;
  type: 'opt_in' | 'opt_out' | 'opt_in_update';
  method: string;
  campaignTypes: string[];
  consentSource: string | null;
  ipAddress: string | null;
  notes: string | null;
  createdAt: string;
}

interface TenDLCRegistrationInput {
  /** Brand information */
  brand: {
    name: string;
    ein: string;
    website: string;
    vertical: string;
    stockExchange?: string;
    stockTicker?: string;
  };
  /** Campaign use case */
  useCase: {
    description: string;
    sampleMessages: string[];
    messageFlow: string;
    optInKeywords: string[];
    optOutKeywords: string[];
    helpKeywords: string[];
    optInMessage: string;
    optOutMessage: string;
    helpMessage: string;
  };
}

interface TenDLCRegistration {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  brandId: string;
  campaignId: string;
  registeredAt: string;
  approvedAt: string | null;
  rejectedReason: string | null;
  throughputLimit: number | null;
}
```

### ShortCode

Represents a dedicated or shared short code for sending and receiving SMS.

```typescript
interface ShortCode {
  id: string;
  tenantId: string;
  /** The short code number (e.g., "12345") */
  code: string;
  /** Country this short code operates in */
  countryCode: string;
  /** Dedicated to this tenant or shared */
  type: 'dedicated' | 'shared';
  /** Associated provider */
  providerId: string;
  /** Current status */
  status: 'pending' | 'active' | 'suspended' | 'deactivated';
  /** Keywords reserved on this short code (for shared codes) */
  reservedKeywords: string[];
  /** Monthly cost in USD */
  monthlyCost: number;
  /** Throughput limit (messages per second) */
  throughputLimit: number;
  /** Supported message types */
  capabilities: ('sms' | 'mms')[];
  /** Vanity code name if applicable */
  vanityName: string | null;
  createdAt: string;
  activatedAt: string | null;
}
```

### SMSAnalytics

Comprehensive analytics for SMS marketing performance.

```typescript
interface SMSAnalytics {
  /**
   * Get campaign-level performance metrics.
   */
  getCampaignMetrics(campaignId: string): Promise<CampaignMetrics>;

  /**
   * Get account-level metrics over a date range.
   */
  getAccountMetrics(dateRange: DateRange, granularity: Granularity): Promise<TimeSeriesMetrics>;

  /**
   * Get delivery funnel breakdown.
   */
  getDeliveryFunnel(campaignId: string): Promise<DeliveryFunnel>;

  /**
   * Get opt-out trend data.
   */
  getOptOutTrend(dateRange: DateRange, granularity: Granularity): Promise<TimeSeriesData>;

  /**
   * Get click analytics for tracked URLs in a campaign.
   */
  getClickAnalytics(campaignId: string): Promise<ClickAnalytics>;

  /**
   * Get conversion attribution data.
   * Matches SMS sends to conversion events within the attribution window.
   */
  getConversionAttribution(campaignId: string, attributionWindow?: number): Promise<ConversionData>;

  /**
   * Get cost breakdown by provider, country, and message type.
   */
  getCostBreakdown(dateRange: DateRange): Promise<CostBreakdown>;

  /**
   * Get provider performance comparison.
   */
  getProviderPerformance(dateRange: DateRange): Promise<ProviderPerformanceData[]>;

  /**
   * Export analytics data as CSV.
   */
  exportAnalytics(params: ExportParams): Promise<{ downloadUrl: string; expiresAt: string }>;
}

interface CampaignMetrics {
  campaignId: string;
  /** Send funnel */
  totalRecipients: number;
  queued: number;
  sent: number;
  delivered: number;
  undelivered: number;
  failed: number;
  rejected: number;
  /** Engagement */
  clicked: number;
  replied: number;
  optedOut: number;
  converted: number;
  /** Rates (0-1) */
  deliveryRate: number;
  clickRate: number;      // clicks / delivered
  replyRate: number;      // replies / delivered
  optOutRate: number;     // opt-outs / delivered
  conversionRate: number; // conversions / delivered
  /** Financial */
  totalCost: number;
  costPerMessage: number;
  costPerDelivered: number;
  costPerClick: number;
  costPerConversion: number;
  revenue: number;
  roi: number; // (revenue - cost) / cost
  /** Timing */
  averageDeliveryTimeMs: number;
  medianDeliveryTimeMs: number;
  p95DeliveryTimeMs: number;
}

interface DeliveryFunnel {
  stages: {
    name: string;
    count: number;
    percentage: number;
    dropoff: number;
  }[];
  /** Funnel: queued → sent → delivered → clicked → converted */
}

interface CostBreakdown {
  total: number;
  byProvider: { providerId: string; providerName: string; cost: number; messageCount: number }[];
  byCountry: { countryCode: string; countryName: string; cost: number; messageCount: number }[];
  byType: { type: 'sms' | 'mms'; cost: number; messageCount: number }[];
  byDay: { date: string; cost: number; messageCount: number }[];
}

type Granularity = 'hour' | 'day' | 'week' | 'month';

interface TimeSeriesMetrics {
  granularity: Granularity;
  dataPoints: {
    timestamp: string;
    sent: number;
    delivered: number;
    clicked: number;
    optedOut: number;
    cost: number;
  }[];
}
```

### InboundHandler

Processes inbound SMS messages and routes them to the appropriate handler.

```typescript
interface InboundHandler {
  /**
   * Handle an inbound SMS message from a provider webhook.
   * This is the entry point for all inbound message processing.
   */
  handleInbound(event: InboundSMSEvent): Promise<InboundResult>;

  /**
   * Register a keyword handler for a specific keyword on a number.
   */
  registerKeyword(input: RegisterKeywordInput): Promise<void>;

  /**
   * Remove a keyword handler.
   */
  removeKeyword(numberId: string, keyword: string): Promise<void>;

  /**
   * List registered keywords for a number.
   */
  listKeywords(numberId: string): Promise<KeywordRegistration[]>;

  /**
   * Set the default handler for unmatched inbound messages.
   */
  setDefaultHandler(numberId: string, handler: DefaultHandlerConfig): Promise<void>;
}

interface InboundSMSEvent {
  /** Provider that received the message */
  providerId: string;
  /** Provider's message ID */
  providerMessageId: string;
  /** Sender's phone number (E.164) */
  from: string;
  /** Receiving phone number (E.164) */
  to: string;
  /** Message body */
  body: string;
  /** MMS media URLs */
  mediaUrls: string[];
  /** Timestamp from provider */
  timestamp: string;
  /** Raw provider payload for debugging */
  rawPayload: Record<string, unknown>;
}

interface InboundResult {
  /** Whether the message was processed successfully */
  handled: boolean;
  /** How the message was routed */
  route: 'system_keyword' | 'custom_keyword' | 'conversation' | 'default_handler' | 'unhandled';
  /** Auto-reply sent (if any) */
  replySent: boolean;
  /** Reply message ID */
  replyMessageId?: string;
  /** Conversation ID (new or existing) */
  conversationId?: string;
}

interface RegisterKeywordInput {
  numberId: string;
  keyword: string;
  /** Response to send when keyword is received */
  autoReply?: string;
  /** Automation to trigger */
  automationId?: string;
  /** URL to forward the message to */
  webhookUrl?: string;
  /** Tags to apply to the sender's contact */
  applyTags?: string[];
  /** Add sender to a segment */
  addToSegmentId?: string;
}

interface KeywordRegistration {
  id: string;
  numberId: string;
  keyword: string;
  autoReply: string | null;
  automationId: string | null;
  webhookUrl: string | null;
  applyTags: string[];
  addToSegmentId: string | null;
  matchCount: number;
  createdAt: string;
}

interface DefaultHandlerConfig {
  /** What to do with unmatched messages */
  action: 'auto_reply' | 'create_conversation' | 'forward_webhook' | 'ignore';
  /** Auto-reply text */
  autoReplyText?: string;
  /** Webhook URL for forwarding */
  webhookUrl?: string;
  /** Whether to create a conversation for agent review */
  createConversation?: boolean;
}
```

### SMSTemplate

Reusable message templates with merge fields and conditional content.

```typescript
interface SMSTemplate {
  id: string;
  tenantId: string;
  /** Template name */
  name: string;
  /** Template body with merge field syntax: {{field_name}} */
  body: string;
  /** MMS media URLs (can also contain merge fields) */
  mediaUrls: string[];
  /** Extracted merge field names */
  mergeFields: string[];
  /** Conditional content blocks */
  conditionals: ConditionalBlock[];
  /** Character count (without merge fields) */
  baseCharCount: number;
  /** Estimated segment count */
  estimatedSegments: number;
  /** Tags for organization */
  tags: string[];
  /** Preview with sample data */
  sampleData: Record<string, string>;
  /** Usage statistics */
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ConditionalBlock {
  /** Condition field and operator */
  condition: {
    field: string;
    operator: 'eq' | 'neq' | 'exists' | 'not_exists' | 'gt' | 'lt';
    value?: unknown;
  };
  /** Content to insert if condition is true */
  trueContent: string;
  /** Content to insert if condition is false */
  falseContent: string;
}
```

### SMSConversation

Represents a two-way SMS conversation thread.

```typescript
interface SMSConversation {
  id: string;
  tenantId: string;
  /** Contact's phone number */
  contactPhone: string;
  /** Our phone number */
  ourPhone: string;
  /** Current conversation status */
  status: 'active' | 'waiting_reply' | 'assigned' | 'closed';
  /** Assigned agent (if any) */
  assignedAgentId: string | null;
  /** Contact name (if resolved) */
  contactName: string | null;
  /** Contact ID from @mcv/crm */
  contactId: string | null;
  /** Last message preview */
  lastMessagePreview: string;
  lastMessageAt: string;
  lastMessageDirection: 'inbound' | 'outbound';
  /** Total message count */
  messageCount: number;
  /** Tags applied to this conversation */
  tags: string[];
  /** Custom metadata */
  metadata: Record<string, string>;
  /** Conversation started via */
  source: 'inbound' | 'campaign_reply' | 'automation_reply' | 'agent_initiated';
  createdAt: string;
  closedAt: string | null;
}
```

### PhoneNumberInfo

Phone number validation and carrier information.

```typescript
interface PhoneNumberInfo {
  /** Original input number */
  raw: string;
  /** E.164 formatted number */
  e164: string;
  /** National formatted number */
  national: string;
  /** International formatted number */
  international: string;
  /** ISO 3166-1 alpha-2 country code */
  countryCode: string;
  /** Country calling code (e.g., 1 for US) */
  callingCode: string;
  /** Phone number type */
  type: 'mobile' | 'fixed_line' | 'fixed_line_or_mobile' | 'voip' | 'toll_free' | 'premium_rate' | 'shared_cost' | 'personal' | 'pager' | 'uan' | 'unknown';
  /** Whether this is a valid phone number */
  valid: boolean;
  /** Whether this number can receive SMS */
  smsCapable: boolean;
  /** Whether this number can receive MMS */
  mmsCapable: boolean;
  /** Carrier information (requires carrier lookup) */
  carrier: CarrierInfo | null;
  /** Timezone(s) for this number */
  timezones: string[];
  /** Geographic region (if available) */
  region: string | null;
}
```

---

## Database Schemas

All tables use Supabase PostgreSQL with Row-Level Security (RLS) policies enforcing tenant isolation. Every table includes `tenant_id` as part of its primary access pattern and RLS policy.

### sms_campaigns

```sql
CREATE TABLE sms_campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('promotional', 'transactional', 'conversational')),
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'scheduled', 'sending', 'paused', 'completed', 'cancelled', 'failed')),
  template_id     UUID REFERENCES sms_templates(id),
  body            TEXT,
  media_urls      JSONB NOT NULL DEFAULT '[]'::jsonb,
  segment_id      UUID,                       -- References @mcv/growth/audiences segments
  from_number_id  UUID NOT NULL REFERENCES sms_phone_numbers(id),
  schedule        JSONB,                       -- CampaignSchedule object
  ab_test         JSONB,                       -- ABTestConfig object
  budget_cap      NUMERIC(10, 4),
  max_throughput  INTEGER NOT NULL DEFAULT 10, -- messages per second
  tags            TEXT[] NOT NULL DEFAULT '{}',
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by      UUID NOT NULL REFERENCES users(id),
  updated_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_at    TIMESTAMPTZ,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,

  -- Ensure either template or body is provided
  CONSTRAINT campaign_has_content CHECK (template_id IS NOT NULL OR body IS NOT NULL)
);

-- RLS Policy
ALTER TABLE sms_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sms_campaigns
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Indexes
CREATE INDEX idx_sms_campaigns_tenant_status ON sms_campaigns(tenant_id, status);
CREATE INDEX idx_sms_campaigns_scheduled ON sms_campaigns(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_sms_campaigns_tenant_created ON sms_campaigns(tenant_id, created_at DESC);
CREATE INDEX idx_sms_campaigns_tags ON sms_campaigns USING GIN(tags);
```

**Drizzle Schema:**

```typescript
import { pgTable, uuid, text, jsonb, numeric, integer, timestamp, check } from 'drizzle-orm/pg-core';

export const smsCampaigns = pgTable('sms_campaigns', {
  id:            uuid('id').primaryKey().defaultRandom(),
  tenantId:      uuid('tenant_id').notNull().references(() => tenants.id),
  name:          text('name').notNull(),
  type:          text('type').notNull(),
  status:        text('status').notNull().default('draft'),
  templateId:    uuid('template_id').references(() => smsTemplates.id),
  body:          text('body'),
  mediaUrls:     jsonb('media_urls').notNull().default([]),
  segmentId:     uuid('segment_id'),
  fromNumberId:  uuid('from_number_id').notNull().references(() => smsPhoneNumbers.id),
  schedule:      jsonb('schedule'),
  abTest:        jsonb('ab_test'),
  budgetCap:     numeric('budget_cap', { precision: 10, scale: 4 }),
  maxThroughput: integer('max_throughput').notNull().default(10),
  tags:          text('tags').array().notNull().default([]),
  metadata:      jsonb('metadata').notNull().default({}),
  createdBy:     uuid('created_by').notNull().references(() => users.id),
  updatedBy:     uuid('updated_by').notNull().references(() => users.id),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  scheduledAt:   timestamp('scheduled_at', { withTimezone: true }),
  startedAt:     timestamp('started_at', { withTimezone: true }),
  completedAt:   timestamp('completed_at', { withTimezone: true }),
});
```

### sms_messages

```sql
CREATE TABLE sms_messages (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES tenants(id),
  campaign_id          UUID REFERENCES sms_campaigns(id),
  automation_id        UUID REFERENCES sms_automations(id),
  conversation_id      UUID REFERENCES sms_conversations(id),
  direction            TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  from_number          TEXT NOT NULL,  -- E.164
  to_number            TEXT NOT NULL,  -- E.164
  body                 TEXT NOT NULL,
  media_urls           JSONB NOT NULL DEFAULT '[]'::jsonb,
  message_type         TEXT NOT NULL CHECK (message_type IN ('sms', 'mms')),
  segment_count        INTEGER NOT NULL DEFAULT 1,
  status               TEXT NOT NULL DEFAULT 'queued'
                       CHECK (status IN ('queued', 'sending', 'sent', 'delivered', 'undelivered', 'failed', 'rejected', 'cancelled')),
  status_history       JSONB NOT NULL DEFAULT '[]'::jsonb,
  provider_id          TEXT,
  provider_message_id  TEXT,
  cost                 NUMERIC(10, 6),
  error_code           TEXT,
  error_message        TEXT,
  tracked_urls         JSONB NOT NULL DEFAULT '[]'::jsonb,
  idempotency_key      TEXT,
  metadata             JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at              TIMESTAMPTZ,
  delivered_at         TIMESTAMPTZ,
  failed_at            TIMESTAMPTZ,

  -- Idempotency constraint
  CONSTRAINT unique_idempotency UNIQUE (tenant_id, idempotency_key)
);

-- RLS Policy
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sms_messages
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Indexes
CREATE INDEX idx_sms_messages_tenant_campaign ON sms_messages(tenant_id, campaign_id);
CREATE INDEX idx_sms_messages_tenant_status ON sms_messages(tenant_id, status);
CREATE INDEX idx_sms_messages_conversation ON sms_messages(conversation_id, created_at);
CREATE INDEX idx_sms_messages_to_number ON sms_messages(to_number, created_at DESC);
CREATE INDEX idx_sms_messages_provider_id ON sms_messages(provider_message_id) WHERE provider_message_id IS NOT NULL;
CREATE INDEX idx_sms_messages_created ON sms_messages(tenant_id, created_at DESC);
CREATE INDEX idx_sms_messages_direction ON sms_messages(tenant_id, direction, created_at DESC);

-- Partial index for pending delivery status polling
CREATE INDEX idx_sms_messages_pending ON sms_messages(provider_id, provider_message_id)
  WHERE status IN ('queued', 'sending', 'sent');
```

**Drizzle Schema:**

```typescript
export const smsMessages = pgTable('sms_messages', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  tenantId:           uuid('tenant_id').notNull().references(() => tenants.id),
  campaignId:         uuid('campaign_id').references(() => smsCampaigns.id),
  automationId:       uuid('automation_id').references(() => smsAutomations.id),
  conversationId:     uuid('conversation_id').references(() => smsConversations.id),
  direction:          text('direction').notNull(),
  fromNumber:         text('from_number').notNull(),
  toNumber:           text('to_number').notNull(),
  body:               text('body').notNull(),
  mediaUrls:          jsonb('media_urls').notNull().default([]),
  messageType:        text('message_type').notNull(),
  segmentCount:       integer('segment_count').notNull().default(1),
  status:             text('status').notNull().default('queued'),
  statusHistory:      jsonb('status_history').notNull().default([]),
  providerId:         text('provider_id'),
  providerMessageId:  text('provider_message_id'),
  cost:               numeric('cost', { precision: 10, scale: 6 }),
  errorCode:          text('error_code'),
  errorMessage:       text('error_message'),
  trackedUrls:        jsonb('tracked_urls').notNull().default([]),
  idempotencyKey:     text('idempotency_key'),
  metadata:           jsonb('metadata').notNull().default({}),
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  sentAt:             timestamp('sent_at', { withTimezone: true }),
  deliveredAt:        timestamp('delivered_at', { withTimezone: true }),
  failedAt:           timestamp('failed_at', { withTimezone: true }),
});
```

### sms_templates

```sql
CREATE TABLE sms_templates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  name                TEXT NOT NULL,
  body                TEXT NOT NULL,
  media_urls          JSONB NOT NULL DEFAULT '[]'::jsonb,
  merge_fields        TEXT[] NOT NULL DEFAULT '{}',
  conditionals        JSONB NOT NULL DEFAULT '[]'::jsonb,
  base_char_count     INTEGER NOT NULL DEFAULT 0,
  estimated_segments  INTEGER NOT NULL DEFAULT 1,
  tags                TEXT[] NOT NULL DEFAULT '{}',
  sample_data         JSONB NOT NULL DEFAULT '{}'::jsonb,
  usage_count         INTEGER NOT NULL DEFAULT 0,
  last_used_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_template_name UNIQUE (tenant_id, name)
);

-- RLS
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sms_templates
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Indexes
CREATE INDEX idx_sms_templates_tenant ON sms_templates(tenant_id, name);
CREATE INDEX idx_sms_templates_tags ON sms_templates USING GIN(tags);
```

### sms_automations

```sql
CREATE TABLE sms_automations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  name             TEXT NOT NULL,
  enabled          BOOLEAN NOT NULL DEFAULT false,
  trigger_config   JSONB NOT NULL,        -- AutomationTrigger
  conditions       JSONB NOT NULL DEFAULT '[]'::jsonb, -- AutomationCondition[]
  message_config   JSONB NOT NULL,        -- AutomationMessage
  delay_config     JSONB,                 -- AutomationDelay
  frequency_cap    JSONB,                 -- FrequencyCap
  journey_id       UUID,                  -- Reference to @mcv/growth/journeys
  journey_step_id  UUID,
  stats            JSONB NOT NULL DEFAULT '{"triggered":0,"sent":0,"delivered":0,"clicked":0,"converted":0,"suppressed":0}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE sms_automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sms_automations
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Indexes
CREATE INDEX idx_sms_automations_tenant ON sms_automations(tenant_id, enabled);
CREATE INDEX idx_sms_automations_journey ON sms_automations(journey_id) WHERE journey_id IS NOT NULL;
```

### sms_providers

```sql
CREATE TABLE sms_providers (
  id                   TEXT PRIMARY KEY,     -- e.g., 'twilio', 'vonage'
  tenant_id            UUID NOT NULL REFERENCES tenants(id),
  name                 TEXT NOT NULL,
  type                 TEXT NOT NULL CHECK (type IN ('twilio', 'vonage', 'messagebird', 'plivo')),
  enabled              BOOLEAN NOT NULL DEFAULT true,
  priority             INTEGER NOT NULL DEFAULT 100,    -- Lower = higher priority
  config               JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Encrypted credentials reference
  supported_countries  TEXT[] NOT NULL DEFAULT '{}',
  supports_mms         BOOLEAN NOT NULL DEFAULT false,
  cost_rates           JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Per-country cost rates
  health_status        TEXT NOT NULL DEFAULT 'healthy'
                       CHECK (health_status IN ('healthy', 'degraded', 'down')),
  circuit_breaker      JSONB NOT NULL DEFAULT '{"state":"closed","failures":0}'::jsonb,
  last_health_check    TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE sms_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sms_providers
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Indexes
CREATE INDEX idx_sms_providers_tenant_enabled ON sms_providers(tenant_id, enabled, priority);
```

### sms_phone_numbers

```sql
CREATE TABLE sms_phone_numbers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  phone_number     TEXT NOT NULL,         -- E.164 format
  friendly_name    TEXT,
  type             TEXT NOT NULL CHECK (type IN ('long_code', 'short_code', 'toll_free')),
  country_code     TEXT NOT NULL,         -- ISO 3166-1 alpha-2
  provider_id      TEXT NOT NULL REFERENCES sms_providers(id),
  capabilities     TEXT[] NOT NULL DEFAULT '{sms}',  -- sms, mms, voice
  status           TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('pending', 'active', 'suspended', 'released')),
  -- 10DLC registration for US long codes
  ten_dlc_campaign_id TEXT,
  ten_dlc_status   TEXT CHECK (ten_dlc_status IN ('unregistered', 'pending', 'approved', 'rejected')),
  -- Shared short code info
  is_shared        BOOLEAN NOT NULL DEFAULT false,
  shared_keywords  TEXT[] NOT NULL DEFAULT '{}',
  -- Throughput
  throughput_limit  INTEGER NOT NULL DEFAULT 1,  -- messages per second
  monthly_cost     NUMERIC(10, 4),
  -- Metadata
  metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_phone_tenant UNIQUE (tenant_id, phone_number)
);

-- RLS
ALTER TABLE sms_phone_numbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sms_phone_numbers
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Indexes
CREATE INDEX idx_sms_phone_numbers_tenant ON sms_phone_numbers(tenant_id, status);
CREATE INDEX idx_sms_phone_numbers_lookup ON sms_phone_numbers(phone_number);
```

### sms_opt_ins

```sql
CREATE TABLE sms_opt_ins (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  phone_number     TEXT NOT NULL,           -- E.164
  status           TEXT NOT NULL DEFAULT 'opted_in'
                   CHECK (status IN ('opted_in', 'opted_out')),
  campaign_types   TEXT[] NOT NULL DEFAULT '{promotional,transactional}',
  -- Consent provenance
  method           TEXT NOT NULL CHECK (method IN ('web_form', 'sms_keyword', 'paper_form', 'pos', 'api', 'import', 'verbal')),
  consent_source   TEXT,                    -- URL or reference to consent form
  ip_address       INET,                   -- IP of web opt-in
  notes            TEXT,
  -- Timestamps
  opted_in_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  opted_out_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Only one active record per tenant+phone
  CONSTRAINT unique_opt_in UNIQUE (tenant_id, phone_number)
);

-- RLS
ALTER TABLE sms_opt_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sms_opt_ins
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Indexes
CREATE INDEX idx_sms_opt_ins_lookup ON sms_opt_ins(tenant_id, phone_number, status);
CREATE INDEX idx_sms_opt_ins_status ON sms_opt_ins(tenant_id, status);

-- Consent audit log (append-only)
CREATE TABLE sms_consent_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  phone_number     TEXT NOT NULL,
  event_type       TEXT NOT NULL CHECK (event_type IN ('opt_in', 'opt_out', 'opt_in_update')),
  method           TEXT NOT NULL,
  campaign_types   TEXT[],
  consent_source   TEXT,
  ip_address       INET,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sms_consent_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sms_consent_log
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE INDEX idx_sms_consent_log_lookup ON sms_consent_log(tenant_id, phone_number, created_at DESC);
```

### sms_conversations

```sql
CREATE TABLE sms_conversations (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID NOT NULL REFERENCES tenants(id),
  contact_phone          TEXT NOT NULL,         -- E.164
  our_phone              TEXT NOT NULL,         -- E.164
  status                 TEXT NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active', 'waiting_reply', 'assigned', 'closed')),
  assigned_agent_id      UUID REFERENCES users(id),
  contact_name           TEXT,
  contact_id             UUID,                  -- Reference to @mcv/crm contacts
  last_message_preview   TEXT,
  last_message_at        TIMESTAMPTZ,
  last_message_direction TEXT CHECK (last_message_direction IN ('inbound', 'outbound')),
  message_count          INTEGER NOT NULL DEFAULT 0,
  tags                   TEXT[] NOT NULL DEFAULT '{}',
  metadata               JSONB NOT NULL DEFAULT '{}'::jsonb,
  source                 TEXT NOT NULL CHECK (source IN ('inbound', 'campaign_reply', 'automation_reply', 'agent_initiated')),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at              TIMESTAMPTZ,

  -- One active conversation per contact+number pair
  CONSTRAINT unique_active_convo UNIQUE (tenant_id, contact_phone, our_phone)
    WHERE (status != 'closed')
);

-- RLS
ALTER TABLE sms_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sms_conversations
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Indexes
CREATE INDEX idx_sms_conversations_tenant ON sms_conversations(tenant_id, status, last_message_at DESC);
CREATE INDEX idx_sms_conversations_agent ON sms_conversations(assigned_agent_id, status)
  WHERE assigned_agent_id IS NOT NULL;
CREATE INDEX idx_sms_conversations_contact ON sms_conversations(tenant_id, contact_phone);
```

### sms_keywords

```sql
CREATE TABLE sms_keywords (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  number_id         UUID NOT NULL REFERENCES sms_phone_numbers(id),
  keyword           TEXT NOT NULL,            -- Case-insensitive matching
  auto_reply        TEXT,
  automation_id     UUID REFERENCES sms_automations(id),
  webhook_url       TEXT,
  apply_tags        TEXT[] NOT NULL DEFAULT '{}',
  add_to_segment_id UUID,
  match_count       INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One keyword per number
  CONSTRAINT unique_keyword_per_number UNIQUE (number_id, keyword)
);

-- RLS
ALTER TABLE sms_keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sms_keywords
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Indexes
CREATE INDEX idx_sms_keywords_number ON sms_keywords(number_id, keyword);
```

### sms_analytics

```sql
CREATE TABLE sms_analytics (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  campaign_id      UUID REFERENCES sms_campaigns(id),
  -- Time bucket for aggregation
  period_start     TIMESTAMPTZ NOT NULL,
  period_end       TIMESTAMPTZ NOT NULL,
  granularity      TEXT NOT NULL CHECK (granularity IN ('hour', 'day', 'week', 'month')),
  -- Send metrics
  total_queued     INTEGER NOT NULL DEFAULT 0,
  total_sent       INTEGER NOT NULL DEFAULT 0,
  total_delivered  INTEGER NOT NULL DEFAULT 0,
  total_undelivered INTEGER NOT NULL DEFAULT 0,
  total_failed     INTEGER NOT NULL DEFAULT 0,
  total_rejected   INTEGER NOT NULL DEFAULT 0,
  -- Engagement metrics
  total_clicked    INTEGER NOT NULL DEFAULT 0,
  total_replied    INTEGER NOT NULL DEFAULT 0,
  total_opted_out  INTEGER NOT NULL DEFAULT 0,
  total_converted  INTEGER NOT NULL DEFAULT 0,
  -- Financial metrics
  total_cost       NUMERIC(12, 6) NOT NULL DEFAULT 0,
  total_revenue    NUMERIC(12, 4) NOT NULL DEFAULT 0,
  -- Delivery timing (milliseconds)
  avg_delivery_ms  INTEGER,
  p50_delivery_ms  INTEGER,
  p95_delivery_ms  INTEGER,
  p99_delivery_ms  INTEGER,
  -- Provider breakdown
  provider_stats   JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Country breakdown
  country_stats    JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Computed at aggregation time
  computed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE sms_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sms_analytics
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Indexes
CREATE INDEX idx_sms_analytics_tenant_period ON sms_analytics(tenant_id, period_start, granularity);
CREATE INDEX idx_sms_analytics_campaign ON sms_analytics(campaign_id, period_start)
  WHERE campaign_id IS NOT NULL;

-- URL click tracking
CREATE TABLE sms_url_clicks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  message_id      UUID NOT NULL REFERENCES sms_messages(id),
  campaign_id     UUID REFERENCES sms_campaigns(id),
  short_code      TEXT NOT NULL,
  original_url    TEXT NOT NULL,
  clicked_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address      INET,
  user_agent      TEXT,
  referrer        TEXT,
  country_code    TEXT,
  device_type     TEXT
);

ALTER TABLE sms_url_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sms_url_clicks
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE INDEX idx_sms_url_clicks_message ON sms_url_clicks(message_id);
CREATE INDEX idx_sms_url_clicks_campaign ON sms_url_clicks(campaign_id, clicked_at);
CREATE INDEX idx_sms_url_clicks_short_code ON sms_url_clicks(short_code);
```

---

## Code Examples

### 1. Send a Simple Campaign

Create and schedule a promotional SMS campaign to a customer segment.

```typescript
import { SMSService } from '@mcv/growth/sms';
import { inject } from '@mcv/di';

async function launchFlashSaleCampaign() {
  const sms = inject(SMSService);

  // Create the campaign
  const campaign = await sms.createCampaign({
    name: 'Flash Sale - 24 Hour Only',
    type: 'promotional',
    body: '🔥 FLASH SALE! {{first_name}}, get {{discount}}% off everything for the next 24 hours! Shop now: {{shop_url}} Reply STOP to opt out.',
    segmentId: 'seg_active_customers_90d',
    fromNumberId: 'pn_us_toll_free_main',
    tags: ['flash-sale', 'q1-2026'],
    budgetCap: 500.00,    // $500 max spend
    maxThroughput: 50,    // 50 msgs/sec
  });

  console.log(`Campaign created: ${campaign.id} (status: ${campaign.status})`);
  // Campaign created: cmp_abc123 (status: draft)

  // Schedule for optimal send time
  const scheduled = await sms.scheduleCampaign(campaign.id, {
    sendAt: '2026-02-10T10:00:00-05:00',
    sendTimeOptimization: true,
    targetLocalTime: '10:00',  // 10 AM in each recipient's timezone
  });

  console.log(`Scheduled for: ${scheduled.scheduledAt}`);
  // Scheduled for: 2026-02-10T10:00:00-05:00

  // Check estimated audience size before it goes out
  const preview = await sms.getCampaign(campaign.id);
  console.log(`Will send to ~${preview.stats.totalRecipients} recipients`);
  // Will send to ~12,450 recipients

  return campaign.id;
}
```

### 2. MMS with Media Attachment

Send a rich media MMS campaign with image optimization.

```typescript
import { SMSService, MediaOptimizer } from '@mcv/growth/sms';
import { inject } from '@mcv/di';

async function sendProductLaunchMMS() {
  const sms = inject(SMSService);
  const media = inject(MediaOptimizer);

  // Optimize media for MMS delivery
  // Carriers have different size limits (600KB-1.2MB typically)
  const optimized = await media.optimize({
    url: 'https://cdn.example.com/products/new-sneaker-hero.jpg',
    targetSizeKB: 500,     // Stay under most carrier limits
    format: 'jpeg',
    maxWidth: 1080,
    maxHeight: 1080,
    quality: 85,
  });

  console.log(`Optimized: ${optimized.originalSizeKB}KB → ${optimized.optimizedSizeKB}KB`);
  // Optimized: 2400KB → 480KB

  // Create MMS campaign
  const campaign = await sms.createCampaign({
    name: 'New Sneaker Launch - VIP Early Access',
    type: 'promotional',
    body: '👟 {{first_name}}, you\'re getting FIRST access! Our new AeroStep drops tomorrow. Use code {{vip_code}} for 20% off.\n\nShop early: {{product_url}}',
    mediaUrls: [optimized.cdnUrl],
    segmentId: 'seg_vip_sneakerheads',
    fromNumberId: 'pn_us_10dlc_marketing',
    tags: ['product-launch', 'sneakers', 'vip'],
  });

  // Send immediately (no scheduling)
  await sms.scheduleCampaign(campaign.id, {
    sendAt: new Date().toISOString(),
    timezone: 'America/New_York',
  });

  return campaign.id;
}
```

### 3. Two-Way Conversation with Keyword Routing

Set up keyword-based auto-replies and conversational flows.

```typescript
import { InboundHandler, ConversationManager, SMSService } from '@mcv/growth/sms';
import { inject } from '@mcv/di';

async function setupKeywordsAndConversations() {
  const inbound = inject(InboundHandler);
  const convo = inject(ConversationManager);
  const sms = inject(SMSService);

  // Register keywords on our short code
  const shortCodeNumberId = 'pn_us_short_code_54321';

  // Keyword: "DEALS" → auto-reply + add to deals segment
  await inbound.registerKeyword({
    numberId: shortCodeNumberId,
    keyword: 'DEALS',
    autoReply: 'Welcome to exclusive deals! You\'ll receive our best offers. Reply STOP to unsubscribe anytime.',
    addToSegmentId: 'seg_deals_subscribers',
    applyTags: ['deals-subscriber', 'sms-keyword-deals'],
  });

  // Keyword: "ORDER" → trigger automation to look up recent order
  await inbound.registerKeyword({
    numberId: shortCodeNumberId,
    keyword: 'ORDER',
    automationId: 'auto_order_status_lookup',
    autoReply: 'Looking up your most recent order... We\'ll text you the details in a moment!',
  });

  // Keyword: "AGENT" → create conversation and assign to support queue
  await inbound.registerKeyword({
    numberId: shortCodeNumberId,
    keyword: 'AGENT',
    autoReply: 'Connecting you with a support agent. You\'ll hear from us shortly!',
  });

  // Set default handler for unmatched messages
  await inbound.setDefaultHandler(shortCodeNumberId, {
    action: 'create_conversation',
    createConversation: true,
    autoReplyText: 'Thanks for your message! A team member will get back to you soon. For quick help, text DEALS, ORDER, or AGENT.',
  });

  // List all active conversations
  const conversations = await sms.listConversations({
    status: 'active',
    limit: 20,
    sortBy: 'last_message_at',
    sortOrder: 'desc',
  });

  console.log(`Active conversations: ${conversations.total}`);

  // Reply to a conversation as an agent
  if (conversations.items.length > 0) {
    const latest = conversations.items[0];
    await sms.replyToConversation(
      latest.id,
      `Hi ${latest.contactName || 'there'}! Thanks for reaching out. How can I help you today?`
    );
  }

  // List all registered keywords
  const keywords = await inbound.listKeywords(shortCodeNumberId);
  console.log('Registered keywords:', keywords.map(k => k.keyword));
  // Registered keywords: ['DEALS', 'ORDER', 'AGENT']
}
```

### 4. Abandoned Cart SMS Automation

Set up an automated SMS sequence triggered by cart abandonment events.

```typescript
import { SMSAutomationService, SMSService } from '@mcv/growth/sms';
import { inject } from '@mcv/di';

async function setupAbandonedCartSMS() {
  const automations = inject(SMSAutomationService);

  // First reminder — 1 hour after cart abandonment
  const reminder1 = await automations.create({
    name: 'Abandoned Cart - 1 Hour Reminder',
    enabled: true,
    trigger: {
      type: 'event',
      eventName: 'cart.abandoned',
      source: 'ecommerce',
    },
    conditions: [
      // Only trigger if cart value > $25
      { field: 'cart.total', operator: 'gte', value: 25.00 },
      // Only for known customers with phone
      { field: 'contact.phone', operator: 'exists', value: true },
      // Don't send if they already purchased
      { field: 'contact.has_purchased_since_abandon', operator: 'eq', value: false },
    ],
    message: {
      body: 'Hey {{first_name}}! You left some great items in your cart ({{cart_item_count}} items, ${{cart_total}}). Complete your order before they\'re gone: {{cart_url}}',
      fromNumberId: 'pn_us_10dlc_transactional',
    },
    delay: {
      value: 1,
      unit: 'hours',
    },
    frequencyCap: {
      maxSends: 3,      // Max 3 abandoned cart texts per recipient
      windowDays: 30,   // In a 30-day window
    },
  });

  // Second reminder — 24 hours, with discount incentive
  const reminder2 = await automations.create({
    name: 'Abandoned Cart - 24h Discount Nudge',
    enabled: true,
    trigger: {
      type: 'event',
      eventName: 'cart.abandoned',
      source: 'ecommerce',
    },
    conditions: [
      { field: 'cart.total', operator: 'gte', value: 50.00 },
      { field: 'contact.phone', operator: 'exists', value: true },
      { field: 'contact.has_purchased_since_abandon', operator: 'eq', value: false },
      // Only send if they didn't click the first reminder
      { field: 'contact.clicked_abandon_cart_sms', operator: 'eq', value: false },
    ],
    message: {
      body: '{{first_name}}, your cart is waiting! Here\'s 10% off to sweeten the deal. Use code COMEBACK10 at checkout: {{cart_url}}\n\nExpires in 24h ⏰',
      fromNumberId: 'pn_us_10dlc_transactional',
    },
    delay: {
      value: 24,
      unit: 'hours',
    },
    frequencyCap: {
      maxSends: 1,      // Only one discount nudge
      windowDays: 30,
    },
  });

  console.log(`Created automations: ${reminder1.id}, ${reminder2.id}`);

  // Check automation stats
  const stats = await automations.getStats(reminder1.id);
  console.log(`Reminder 1 stats:`, {
    triggered: stats.triggered,
    sent: stats.sent,
    delivered: stats.delivered,
    clicked: stats.clicked,
    converted: stats.converted,
    conversionRate: (stats.converted / stats.delivered * 100).toFixed(1) + '%',
  });
}
```

### 5. Compliance-Checked Send with Quiet Hours

Demonstrate the compliance pipeline including consent verification and quiet hours.

```typescript
import { SMSService, ComplianceService, QuietHoursEnforcer } from '@mcv/growth/sms';
import { inject } from '@mcv/di';

async function sendWithComplianceChecks() {
  const sms = inject(SMSService);
  const compliance = inject(ComplianceService);
  const quietHours = inject(QuietHoursEnforcer);

  const recipientPhone = '+14155551234';
  const tenantId = 'tenant_abc123';

  // === Manual compliance check (informational — send() does this automatically) ===

  // Check consent
  const hasConsent = await compliance.hasConsent(recipientPhone, tenantId, 'promotional');
  console.log(`Has promotional consent: ${hasConsent}`);
  // Has promotional consent: true

  // Check quiet hours (recipient is in Pacific timezone)
  const canSend = await quietHours.isWithinSendingHours('America/Los_Angeles', tenantId);
  console.log(`Within sending hours: ${canSend}`);
  // Within sending hours: false (it's 9 PM PT — after quiet hours start)

  // Get full compliance check
  const check = await compliance.checkOutbound({
    tenantId,
    to: recipientPhone,
    campaignType: 'promotional',
  });

  console.log('Compliance result:', {
    allowed: check.allowed,
    checks: check.checks.map(c => `${c.check}: ${c.passed ? '✓' : '✗'} ${c.reason || ''}`),
  });
  // Compliance result: {
  //   allowed: false,
  //   checks: [
  //     'consent: ✓',
  //     'opt_out: ✓',
  //     'quiet_hours: ✗ Recipient timezone America/Los_Angeles is in quiet hours (21:00-08:00)',
  //     'dnc_list: ✓',
  //     'rate_limit: ✓',
  //     'frequency_cap: ✓',
  //   ]
  // }

  // Attempting to send will be rejected by the compliance pipeline
  const result = await sms.sendMessage({
    to: recipientPhone,
    body: 'Check out our new arrivals! 🛍️ Shop now: https://example.com/new',
    fromNumberId: 'pn_us_toll_free_main',
  });

  console.log(`Send result: ${result.status}`);
  // Send result: rejected
  console.log(`Rejection: ${result.rejectionCode} - ${result.rejectionReason}`);
  // Rejection: SMS_QUIET_HOURS - Message blocked by quiet hours enforcement

  // === Record new opt-in with full provenance ===

  await compliance.recordOptIn({
    phoneNumber: '+14155559999',
    tenantId,
    method: 'web_form',
    campaignTypes: ['promotional', 'transactional'],
    consentSource: 'https://example.com/signup?ref=homepage_banner',
    ipAddress: '203.0.113.42',
    notes: 'Signed up via homepage banner opt-in form',
  });

  // View consent history
  const history = await compliance.getConsentHistory('+14155559999', tenantId);
  console.log(`Consent events: ${history.length}`);
  history.forEach(event => {
    console.log(`  ${event.createdAt}: ${event.type} via ${event.method}`);
  });
}
```

### 6. Provider Failover Configuration

Configure multi-provider routing with cost optimization and failover.

```typescript
import { ProviderRegistry, ProviderRouter, TwilioProvider, VonageProvider, PlivoProvider } from '@mcv/growth/sms';
import { inject } from '@mcv/di';

async function configureProviders() {
  const registry = inject(ProviderRegistry);
  const router = inject(ProviderRouter);

  // Register providers with configuration
  await registry.register({
    id: 'twilio_primary',
    name: 'Twilio (Primary)',
    type: 'twilio',
    enabled: true,
    priority: 10,  // Highest priority (lowest number)
    config: {
      accountSid: process.env.TWILIO_ACCOUNT_SID!,
      authToken: process.env.TWILIO_AUTH_TOKEN!,     // Encrypted at rest
      statusCallbackUrl: 'https://api.example.com/webhooks/sms/twilio/status',
    },
    supportedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR'],
    supportsMms: true,
    costRates: {
      US: { sms: 0.0079, mms: 0.0200 },
      CA: { sms: 0.0085, mms: 0.0220 },
      GB: { sms: 0.0420, mms: 0.0650 },
      AU: { sms: 0.0550, mms: null },  // No MMS support in AU
    },
  });

  await registry.register({
    id: 'vonage_secondary',
    name: 'Vonage (Secondary)',
    type: 'vonage',
    enabled: true,
    priority: 20,
    config: {
      apiKey: process.env.VONAGE_API_KEY!,
      apiSecret: process.env.VONAGE_API_SECRET!,
      statusCallbackUrl: 'https://api.example.com/webhooks/sms/vonage/status',
    },
    supportedCountries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IN', 'BR'],
    supportsMms: false,
    costRates: {
      US: { sms: 0.0068 },  // Cheaper for US SMS
      CA: { sms: 0.0075 },
      GB: { sms: 0.0380 },
      IN: { sms: 0.0035 },
      BR: { sms: 0.0120 },
    },
  });

  await registry.register({
    id: 'plivo_tertiary',
    name: 'Plivo (Tertiary)',
    type: 'plivo',
    enabled: true,
    priority: 30,
    config: {
      authId: process.env.PLIVO_AUTH_ID!,
      authToken: process.env.PLIVO_AUTH_TOKEN!,
      statusCallbackUrl: 'https://api.example.com/webhooks/sms/plivo/status',
    },
    supportedCountries: ['US', 'CA', 'GB', 'IN'],
    supportsMms: true,
    costRates: {
      US: { sms: 0.0060, mms: 0.0180 },  // Cheapest US option
      IN: { sms: 0.0020 },
    },
  });

  // Configure routing strategy
  await router.configure({
    strategy: 'cost_optimized', // 'priority' | 'cost_optimized' | 'round_robin' | 'weighted'

    // Override: always use Twilio for MMS (best carrier support)
    overrides: [
      {
        condition: { messageType: 'mms' },
        providerId: 'twilio_primary',
        fallback: true, // Still failover if Twilio is down
      },
    ],

    // Circuit breaker settings
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeoutMs: 60_000,
      halfOpenMax: 1,
      monitorWindow: 30_000,
    },

    // Retry configuration
    retry: {
      maxAttempts: 3,
      backoffMs: [1000, 5000, 15000],
      retryableErrors: ['PROVIDER_TIMEOUT', 'PROVIDER_5XX', 'RATE_LIMITED'],
    },
  });

  // Check provider health
  const health = await router.getHealthStatus();
  console.log('Provider health:');
  health.forEach(p => {
    console.log(`  ${p.name}: ${p.status} (latency: ${p.latencyMs}ms, error rate: ${(p.errorRate * 100).toFixed(1)}%)`);
  });
  // Provider health:
  //   Twilio (Primary): healthy (latency: 45ms, error rate: 0.1%)
  //   Vonage (Secondary): healthy (latency: 62ms, error rate: 0.3%)
  //   Plivo (Tertiary): degraded (latency: 180ms, error rate: 2.1%)

  // Test routing decisions
  const usRoute = await router.selectProvider({ destination: 'US', messageType: 'sms' });
  console.log(`US SMS route: ${usRoute.providerId} (cost: $${usRoute.estimatedCost})`);
  // US SMS route: plivo_tertiary (cost: $0.006) — cheapest available

  const usMmsRoute = await router.selectProvider({ destination: 'US', messageType: 'mms' });
  console.log(`US MMS route: ${usMmsRoute.providerId} (cost: $${usMmsRoute.estimatedCost})`);
  // US MMS route: twilio_primary (cost: $0.02) — MMS override

  const inRoute = await router.selectProvider({ destination: 'IN', messageType: 'sms' });
  console.log(`India SMS route: ${inRoute.providerId} (cost: $${inRoute.estimatedCost})`);
  // India SMS route: plivo_tertiary (cost: $0.002) — cheapest for India
}
```

### 7. Phone Number Validation & Carrier Lookup

Validate phone numbers, detect types, and look up carrier information.

```typescript
import { PhoneNumberService, NumberValidator, CarrierLookup } from '@mcv/growth/sms';
import { inject } from '@mcv/di';

async function validateAndLookup() {
  const phoneService = inject(PhoneNumberService);
  const validator = inject(NumberValidator);
  const carrier = inject(CarrierLookup);

  // === Validate a phone number ===
  const info = await validator.validate('+1 (415) 555-1234');

  console.log('Phone number info:', {
    valid: info.valid,
    e164: info.e164,                     // +14155551234
    national: info.national,             // (415) 555-1234
    international: info.international,   // +1 415-555-1234
    countryCode: info.countryCode,       // US
    type: info.type,                     // mobile
    smsCapable: info.smsCapable,         // true
    mmsCapable: info.mmsCapable,         // true
    timezones: info.timezones,           // ['America/Los_Angeles']
    region: info.region,                 // California
  });

  // === Batch validation (for import/upload) ===
  const numbers = [
    '+14155551234',
    '+442071234567',
    '+1800FLOWERS',    // Vanity number
    'not-a-number',
    '+919876543210',
  ];

  const results = await validator.validateBatch(numbers);
  results.forEach(r => {
    console.log(`${r.raw} → ${r.valid ? r.e164 : 'INVALID'} (${r.type})`);
  });
  // +14155551234 → +14155551234 (mobile)
  // +442071234567 → +442071234567 (fixed_line)
  // +1800FLOWERS → +18003569377 (toll_free)
  // not-a-number → INVALID (unknown)
  // +919876543210 → +919876543210 (mobile)

  // === Carrier lookup ===
  const carrierInfo = await carrier.lookup('+14155551234');
  console.log('Carrier:', {
    carrier: carrierInfo.carrier,         // 'T-Mobile USA'
    type: carrierInfo.type,               // 'mobile'
    networkCode: carrierInfo.networkCode, // '310260'
    isMobile: carrierInfo.isMobile,       // true
  });

  // === Batch carrier lookup with DNC check ===
  const contactNumbers = ['+14155551234', '+14155555678', '+14155559999'];

  const lookupResults = await phoneService.enrichBatch(contactNumbers, {
    includeCarrier: true,
    checkDNC: true,
    checkOptIn: true,
    tenantId: 'tenant_abc123',
  });

  lookupResults.forEach(r => {
    console.log(`${r.e164}: carrier=${r.carrier?.carrier || 'unknown'}, type=${r.type}, DNC=${r.onDNCList}, opted_in=${r.hasOptIn}`);
  });
  // +14155551234: carrier=T-Mobile USA, type=mobile, DNC=false, opted_in=true
  // +14155555678: carrier=AT&T, type=mobile, DNC=false, opted_in=true
  // +14155559999: carrier=Comcast, type=voip, DNC=true, opted_in=false

  // === Number type filtering for campaigns ===
  // Filter out landlines and VoIP numbers that can't receive SMS
  const smsSendable = lookupResults.filter(r =>
    r.type === 'mobile' && !r.onDNCList && r.hasOptIn
  );
  console.log(`SMS-capable contacts: ${smsSendable.length}/${contactNumbers.length}`);
}
```

### 8. Campaign Analytics & Attribution

Pull comprehensive analytics and attribute conversions to SMS campaigns.

```typescript
import { SMSAnalyticsService, CostCalculator } from '@mcv/growth/sms';
import { inject } from '@mcv/di';

async function analyzeCampaignPerformance() {
  const analytics = inject(SMSAnalyticsService);
  const costs = inject(CostCalculator);

  const campaignId = 'cmp_flash_sale_feb2026';

  // === Campaign metrics ===
  const metrics = await analytics.getCampaignMetrics(campaignId);

  console.log('Campaign Performance:', {
    // Delivery funnel
    sent: metrics.sent,
    delivered: metrics.delivered,
    deliveryRate: `${(metrics.deliveryRate * 100).toFixed(1)}%`,

    // Engagement
    clicked: metrics.clicked,
    clickRate: `${(metrics.clickRate * 100).toFixed(2)}%`,
    replied: metrics.replied,
    replyRate: `${(metrics.replyRate * 100).toFixed(2)}%`,

    // Health
    optedOut: metrics.optedOut,
    optOutRate: `${(metrics.optOutRate * 100).toFixed(2)}%`,

    // Revenue
    conversions: metrics.conversions,
    conversionRate: `${(metrics.conversionRate * 100).toFixed(2)}%`,
    revenue: `$${metrics.revenue.toFixed(2)}`,

    // Cost efficiency
    totalCost: `$${metrics.totalCost.toFixed(2)}`,
    costPerDelivered: `$${metrics.costPerDelivered.toFixed(4)}`,
    costPerClick: `$${metrics.costPerClick.toFixed(2)}`,
    costPerConversion: `$${metrics.costPerConversion.toFixed(2)}`,
    roi: `${(metrics.roi * 100).toFixed(0)}%`,

    // Delivery timing
    avgDeliveryTime: `${metrics.averageDeliveryTimeMs}ms`,
    p95DeliveryTime: `${metrics.p95DeliveryTimeMs}ms`,
  });
  // Campaign Performance: {
  //   sent: 12450,
  //   delivered: 11830,
  //   deliveryRate: '95.0%',
  //   clicked: 2130,
  //   clickRate: '18.01%',
  //   replied: 342,
  //   replyRate: '2.89%',
  //   optedOut: 47,
  //   optOutRate: '0.40%',
  //   conversions: 478,
  //   conversionRate: '4.04%',
  //   revenue: '$23,900.00',
  //   totalCost: '$98.75',
  //   costPerDelivered: '$0.0083',
  //   costPerClick: '$0.05',
  //   costPerConversion: '$0.21',
  //   roi: '24098%',
  //   avgDeliveryTime: '1200ms',
  //   p95DeliveryTime: '4500ms',
  // }

  // === Delivery funnel ===
  const funnel = await analytics.getDeliveryFunnel(campaignId);
  console.log('\nDelivery Funnel:');
  funnel.stages.forEach(stage => {
    const bar = '█'.repeat(Math.round(stage.percentage / 2));
    console.log(`  ${stage.name.padEnd(15)} ${stage.count.toString().padStart(6)} (${(stage.percentage).toFixed(1)}%) ${bar}`);
  });
  // Delivery Funnel:
  //   queued           12450 (100.0%) ██████████████████████████████████████████████████
  //   sent             12420 (99.8%)  █████████████████████████████████████████████████
  //   delivered        11830 (95.0%)  ███████████████████████████████████████████████
  //   clicked           2130 (18.0%)  █████████
  //   converted          478 (4.0%)   ██

  // === Conversion attribution ===
  const attribution = await analytics.getConversionAttribution(campaignId, 72); // 72-hour window

  console.log('\nConversion Attribution (72h window):', {
    directConversions: attribution.direct,
    assistedConversions: attribution.assisted,
    totalRevenue: `$${attribution.totalRevenue.toFixed(2)}`,
    avgOrderValue: `$${attribution.averageOrderValue.toFixed(2)}`,
    topConvertedProducts: attribution.topProducts.slice(0, 3).map(p => p.name),
  });

  // === Cost breakdown ===
  const costBreakdown = await analytics.getCostBreakdown({
    start: '2026-02-01',
    end: '2026-02-28',
  });

  console.log('\nCost Breakdown:');
  console.log(`  Total: $${costBreakdown.total.toFixed(2)}`);
  console.log('  By Provider:');
  costBreakdown.byProvider.forEach(p => {
    console.log(`    ${p.providerName}: $${p.cost.toFixed(2)} (${p.messageCount} msgs)`);
  });
  console.log('  By Country:');
  costBreakdown.byCountry.forEach(c => {
    console.log(`    ${c.countryName}: $${c.cost.toFixed(2)} (${c.messageCount} msgs)`);
  });

  // === Time-series metrics ===
  const timeSeries = await analytics.getAccountMetrics(
    { start: '2026-02-01', end: '2026-02-28' },
    'day'
  );

  console.log('\nDaily Send Volume (first 5 days):');
  timeSeries.dataPoints.slice(0, 5).forEach(dp => {
    console.log(`  ${dp.timestamp}: sent=${dp.sent}, delivered=${dp.delivered}, cost=$${dp.cost.toFixed(2)}`);
  });

  // === Export to CSV ===
  const exportResult = await analytics.exportAnalytics({
    campaignId,
    format: 'csv',
    includeMessageLevel: true,  // Individual message data
    dateRange: { start: '2026-02-10', end: '2026-02-11' },
  });

  console.log(`\nExport ready: ${exportResult.downloadUrl}`);
  console.log(`Expires: ${exportResult.expiresAt}`);
}
```

---

## Error Codes

All error codes are prefixed with `SMS_` and are available via the `SMS_ERRORS` constant.

| Code | HTTP | Description | Retryable |
|------|------|-------------|-----------|
| `SMS_INVALID_PHONE` | 400 | Phone number is not valid or not in E.164 format | No |
| `SMS_PHONE_NOT_MOBILE` | 400 | Phone number is a landline or other non-SMS-capable type | No |
| `SMS_MESSAGE_TOO_LONG` | 400 | Message exceeds maximum length (1600 chars for concatenated SMS) | No |
| `SMS_INVALID_MEDIA` | 400 | MMS media URL is invalid, inaccessible, or exceeds size limits | No |
| `SMS_UNSUPPORTED_MEDIA_TYPE` | 400 | MMS media type is not supported (e.g., video/mp4 over 30s) | No |
| `SMS_TEMPLATE_NOT_FOUND` | 404 | Referenced template does not exist or is not accessible | No |
| `SMS_TEMPLATE_RENDER_ERROR` | 400 | Template rendering failed — missing required merge fields | No |
| `SMS_CAMPAIGN_NOT_FOUND` | 404 | Campaign ID does not exist or is not accessible by this tenant | No |
| `SMS_CAMPAIGN_NOT_EDITABLE` | 409 | Campaign is in a state that does not allow edits (sending/completed) | No |
| `SMS_CAMPAIGN_NOT_DELETABLE` | 409 | Campaign has sent messages and cannot be deleted (archive instead) | No |
| `SMS_NO_CONSENT` | 403 | Recipient has not opted in to this type of messaging | No |
| `SMS_OPTED_OUT` | 403 | Recipient has opted out (STOP) — cannot send until they opt back in | No |
| `SMS_QUIET_HOURS` | 429 | Message blocked by quiet hours enforcement for recipient's timezone | Yes (delayed) |
| `SMS_DNC_LIST` | 403 | Recipient is on the Do-Not-Call list | No |
| `SMS_RATE_LIMITED` | 429 | Per-recipient rate limit exceeded (too many messages in time window) | Yes |
| `SMS_FREQUENCY_CAP` | 429 | Campaign/automation frequency cap reached for this recipient | No |
| `SMS_BUDGET_EXCEEDED` | 402 | Campaign budget cap has been reached | No |
| `SMS_NO_FROM_NUMBER` | 400 | No sending number configured or available for this destination | No |
| `SMS_NUMBER_NOT_ACTIVE` | 400 | The specified sending number is not in active status | No |
| `SMS_PROVIDER_ERROR` | 502 | Provider returned an error — check `errorMessage` for details | Yes |
| `SMS_PROVIDER_TIMEOUT` | 504 | Provider did not respond within the timeout period | Yes |
| `SMS_ALL_PROVIDERS_DOWN` | 503 | All configured providers are unavailable (circuit breakers open) | Yes |
| `SMS_DUPLICATE_MESSAGE` | 409 | Message with this idempotency key was already sent | No |
| `SMS_COUNTRY_NOT_SUPPORTED` | 400 | No provider configured to deliver to the destination country | No |
| `SMS_10DLC_REQUIRED` | 403 | US A2P messaging requires 10DLC registration — register first | No |
| `SMS_10DLC_PENDING` | 403 | 10DLC registration is pending approval — cannot send yet | No |
| `SMS_CONVERSATION_CLOSED` | 409 | Cannot reply to a closed conversation | No |
| `SMS_SEGMENT_EMPTY` | 400 | The target audience segment has no members with phone numbers | No |
| `SMS_WEBHOOK_INVALID_SIGNATURE` | 401 | Inbound webhook signature validation failed | No |
| `SMS_NUMBER_POOL_EXHAUSTED` | 503 | All numbers in the sending pool are at throughput capacity | Yes |

### Error Response Format

```typescript
interface SMSError {
  code: string;       // e.g., 'SMS_NO_CONSENT'
  message: string;    // Human-readable description
  details?: {
    phoneNumber?: string;
    providerId?: string;
    providerError?: string;
    retryAfter?: string;  // ISO 8601 for retryable errors
    [key: string]: unknown;
  };
}
```

### Error Handling Example

```typescript
import { SMSService, SMS_ERRORS } from '@mcv/growth/sms';
import { TRPCError } from '@trpc/server';

try {
  const result = await sms.sendMessage({
    to: '+14155551234',
    body: 'Hello!',
  });
} catch (error) {
  if (error instanceof TRPCError) {
    const smsError = error.cause as SMSError;

    switch (smsError.code) {
      case SMS_ERRORS.QUIET_HOURS:
        // Schedule for next available window
        console.log(`Retry after: ${smsError.details?.retryAfter}`);
        break;

      case SMS_ERRORS.OPTED_OUT:
        // Remove from campaign audience
        console.log('Recipient opted out — removing from audience');
        break;

      case SMS_ERRORS.PROVIDER_ERROR:
        // Log provider error for debugging
        console.error(`Provider ${smsError.details?.providerId}: ${smsError.details?.providerError}`);
        break;

      case SMS_ERRORS.ALL_PROVIDERS_DOWN:
        // Alert ops team
        console.error('CRITICAL: All SMS providers are down');
        break;

      default:
        console.error(`SMS error: ${smsError.code} - ${smsError.message}`);
    }
  }
}
```

---

## Security

### Tenant Isolation

All SMS data is strictly isolated per tenant using Supabase Row-Level Security (RLS). Every table has a `tenant_id` column with an RLS policy that filters rows to the authenticated tenant:

```sql
-- Applied to all sms_* tables
CREATE POLICY tenant_isolation ON <table>
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

The `app.tenant_id` session variable is set by the tRPC middleware before any database query executes. There is no application-level bypass — RLS is enforced at the database layer.

### Credential Management

- **Provider API keys** (Twilio auth tokens, Vonage secrets, etc.) are stored as encrypted references in the `sms_providers.config` JSONB column. The actual secrets are stored in the platform's secrets manager (`@mcv/secrets`) and decrypted only at the moment of provider API calls.
- **Encryption at rest** — All credential fields use AES-256-GCM encryption with tenant-specific encryption keys derived from a master key via HKDF.
- **No logging of secrets** — Provider credentials are explicitly excluded from all log output. The `ProviderConfig` type uses a branded `Secret<string>` type that redacts itself in `toString()` and `JSON.stringify()`.

### Webhook Security

Inbound webhooks from providers are validated before processing:

| Provider | Validation Method |
|----------|-------------------|
| Twilio | HMAC-SHA1 signature via `X-Twilio-Signature` header, validated against auth token |
| Vonage | JWT signature verification or shared secret HMAC |
| MessageBird | HMAC-SHA256 signature via `MessageBird-Signature` header |
| Plivo | HMAC-SHA1 signature via `X-Plivo-Signature-V2` header |

Additional protections:
- **Replay prevention** — Webhook timestamps must be within ±5 minutes of server time.
- **IP allowlisting** — Optional per-provider IP allowlist for webhook source addresses.
- **Rate limiting** — Webhook endpoints are rate-limited to prevent abuse (1000 req/min per provider).

### Phone Number Privacy

- Phone numbers in E.164 format are treated as PII (Personally Identifiable Information).
- Phone numbers are **never logged in full** — only the last 4 digits appear in application logs: `+1******1234`.
- Analytics aggregations strip individual phone numbers — only aggregate counts are stored.
- The `sms_messages` table supports a configurable retention policy. After the retention period, message bodies and phone numbers are redacted while preserving aggregate statistics.

### Consent & Compliance Security

- **Immutable consent log** — The `sms_consent_log` table is append-only. Opt-in and opt-out events cannot be modified or deleted. This provides a complete audit trail for regulatory inquiries.
- **Compliance bypass prevention** — The compliance pipeline is implemented as middleware in the send pipeline. There is no API parameter, feature flag, or configuration option to skip compliance checks.
- **Quiet hours enforcement** uses the IANA timezone database and accounts for DST transitions.

### Data Retention

| Data Type | Default Retention | Configurable |
|-----------|-------------------|--------------|
| Message bodies | 90 days | Yes (30-365 days) |
| Message metadata | 2 years | Yes (1-5 years) |
| Delivery status | 2 years | Yes (1-5 years) |
| Consent log | Indefinite | No (regulatory requirement) |
| Analytics aggregates | 5 years | Yes (2-10 years) |
| URL click data | 1 year | Yes (90 days-3 years) |
| Conversation history | 1 year | Yes (90 days-3 years) |

### Rate Limiting

| Scope | Limit | Window |
|-------|-------|--------|
| Per-recipient (promotional) | 3 messages | 24 hours |
| Per-recipient (transactional) | 10 messages | 1 hour |
| Per-tenant send rate | Configurable (default 100/sec) | Rolling |
| Per-number throughput | Provider-dependent (1-100/sec) | Rolling |
| Webhook ingress | 1000 requests | 1 minute per provider |
| API rate limit | 500 requests | 1 minute per tenant |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMS_ENABLED` | No | `true` | Master switch to enable/disable SMS module |
| `TWILIO_ACCOUNT_SID` | If using Twilio | — | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | If using Twilio | — | Twilio Auth Token (encrypted) |
| `VONAGE_API_KEY` | If using Vonage | — | Vonage API Key |
| `VONAGE_API_SECRET` | If using Vonage | — | Vonage API Secret (encrypted) |
| `MESSAGEBIRD_API_KEY` | If using MessageBird | — | MessageBird API Key (encrypted) |
| `PLIVO_AUTH_ID` | If using Plivo | — | Plivo Auth ID |
| `PLIVO_AUTH_TOKEN` | If using Plivo | — | Plivo Auth Token (encrypted) |
| `SMS_WEBHOOK_BASE_URL` | Yes | — | Base URL for provider webhook callbacks (e.g., `https://api.example.com/webhooks/sms`) |
| `SMS_URL_SHORTENER_DOMAIN` | No | `s.mcv.one` | Domain for shortened/tracked URLs |
| `SMS_DEFAULT_QUIET_HOURS_START` | No | `21:00` | Default quiet hours start (local time, 24h format) |
| `SMS_DEFAULT_QUIET_HOURS_END` | No | `08:00` | Default quiet hours end (local time, 24h format) |
| `SMS_MAX_THROUGHPUT` | No | `100` | Maximum global send throughput (messages/second) |
| `SMS_RETRY_MAX_ATTEMPTS` | No | `3` | Maximum retry attempts for transient failures |
| `SMS_RETRY_BACKOFF_MS` | No | `1000,5000,15000` | Comma-separated retry backoff delays in ms |
| `SMS_CIRCUIT_BREAKER_THRESHOLD` | No | `5` | Consecutive failures to trip circuit breaker |
| `SMS_CIRCUIT_BREAKER_RESET_MS` | No | `60000` | Circuit breaker reset timeout in ms |
| `SMS_MESSAGE_RETENTION_DAYS` | No | `90` | Days to retain message bodies before redaction |
| `SMS_ANALYTICS_RETENTION_YEARS` | No | `5` | Years to retain analytics aggregates |
| `SMS_DNC_LIST_URL` | No | — | URL to fetch external DNC list (updated daily) |
| `SMS_CARRIER_LOOKUP_CACHE_TTL` | No | `86400` | Carrier lookup cache TTL in seconds (default 24h) |
| `SMS_COST_ALERT_THRESHOLD` | No | — | Monthly cost threshold in USD to trigger alerts |
| `SMS_10DLC_ENABLED` | No | `true` | Enforce 10DLC registration for US A2P messaging |
| `SMS_LOG_LEVEL` | No | `info` | Logging level for SMS module (`debug`, `info`, `warn`, `error`) |

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/db` | Supabase client, Drizzle ORM, connection pool, RLS context |
| `@mcv/trpc` | tRPC router registration, middleware, authentication context |
| `@mcv/auth` | Tenant authentication, user identity, permission checks |
| `@mcv/secrets` | Encrypted credential storage and retrieval |
| `@mcv/events` | Event bus for publish/subscribe (delivery events, automation triggers) |
| `@mcv/queue` | Background job queue for scheduled sends, retries, and batch processing |
| `@mcv/cdn` | CDN upload for MMS media assets |
| `@mcv/analytics` | Shared analytics infrastructure (time-series storage, aggregation) |
| `@mcv/growth/audiences` | Audience segment resolution for campaign targeting |
| `@mcv/growth/journeys` | Journey orchestration integration (automation adapter) |
| `@mcv/crm` | Contact resolution for conversation enrichment |
| `@mcv/logging` | Structured logging with PII redaction |
| `@mcv/monitoring` | Metrics, health checks, alerting integration |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `twilio` | `^5.x` | Twilio REST API client — send SMS/MMS, status queries, webhook validation |
| `@vonage/server-sdk` | `^3.x` | Vonage API client — SMS delivery, number insights |
| `messagebird` | `^4.x` | MessageBird API client — SMS delivery, lookup |
| `plivo` | `^4.x` | Plivo API client — SMS/MMS delivery, number management |
| `libphonenumber-js` | `^1.x` | Phone number parsing, validation, formatting, type detection (Google libphonenumber port) |
| `drizzle-orm` | `^0.30.x` | SQL query builder and ORM for PostgreSQL |
| `zod` | `^3.x` | Runtime schema validation for API inputs and webhook payloads |
| `ioredis` | `^5.x` | Redis client for rate limiting, caching, circuit breaker state |
| `bull` | `^4.x` | Job queue for scheduled sends, retries, and batch processing |
| `sharp` | `^0.33.x` | Image processing for MMS media optimization (resize, format conversion) |
| `nanoid` | `^5.x` | Short URL code generation |
| `date-fns-tz` | `^2.x` | Timezone-aware date operations for quiet hours and send-time optimization |

---

## Testing

### Unit Tests

Unit tests cover all business logic in isolation using mocked providers and database layers.

```bash
# Run all SMS unit tests
pnpm test --filter @mcv/growth/sms

# Run specific test suite
pnpm test --filter @mcv/growth/sms -- --grep "ComplianceService"

# Run with coverage
pnpm test --filter @mcv/growth/sms -- --coverage
```

#### Key Test Suites

| Suite | File | Covers |
|-------|------|--------|
| Compliance Pipeline | `compliance.service.test.ts` | Consent checks, opt-out enforcement, quiet hours, DNC list, rate limits |
| Message Builder | `message-builder.service.test.ts` | Template rendering, merge fields, conditional content, URL shortening, segment counting |
| Provider Router | `provider-router.test.ts` | Cost optimization, failover logic, circuit breakers, health checks |
| Number Validator | `number-validator.test.ts` | Phone parsing, E.164 normalization, type detection, edge cases |
| Inbound Router | `inbound-router.test.ts` | Keyword matching, system keywords, conversation routing, default handlers |
| Campaign Scheduler | `campaign-scheduler.test.ts` | Scheduled sends, send-time optimization, timezone distribution, pause/resume |
| Send Pipeline | `send-pipeline.test.ts` | End-to-end send flow, idempotency, error handling, status tracking |
| Analytics | `sms-analytics.test.ts` | Metric aggregation, delivery funnel, cost breakdown, time-series |

#### Example Unit Test

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComplianceService } from './compliance.service';
import { createMockDb, createMockTenantContext } from '@mcv/testing';

describe('ComplianceService', () => {
  let compliance: ComplianceService;
  let db: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    db = createMockDb();
    compliance = new ComplianceService(db);
  });

  describe('checkOutbound', () => {
    it('should reject when recipient has opted out', async () => {
      db.query.smsOptIns.findFirst.mockResolvedValue({
        status: 'opted_out',
        phone_number: '+14155551234',
      });

      const result = await compliance.checkOutbound({
        tenantId: 'tenant_123',
        to: '+14155551234',
        campaignType: 'promotional',
      });

      expect(result.allowed).toBe(false);
      expect(result.code).toBe('SMS_OPTED_OUT');
      expect(result.checks.find(c => c.check === 'opt_out')?.passed).toBe(false);
    });

    it('should reject during quiet hours for promotional messages', async () => {
      // Mock: recipient is in a timezone where it's 10 PM
      db.query.smsOptIns.findFirst.mockResolvedValue({
        status: 'opted_in',
        campaign_types: ['promotional'],
      });

      // Simulate 10 PM in recipient's timezone
      vi.setSystemTime(new Date('2026-02-09T22:00:00-08:00'));

      const result = await compliance.checkOutbound({
        tenantId: 'tenant_123',
        to: '+14155551234',
        campaignType: 'promotional',
      });

      expect(result.allowed).toBe(false);
      expect(result.code).toBe('SMS_QUIET_HOURS');
    });

    it('should allow transactional messages during quiet hours', async () => {
      db.query.smsOptIns.findFirst.mockResolvedValue({
        status: 'opted_in',
        campaign_types: ['transactional'],
      });

      vi.setSystemTime(new Date('2026-02-09T22:00:00-08:00'));

      const result = await compliance.checkOutbound({
        tenantId: 'tenant_123',
        to: '+14155551234',
        campaignType: 'transactional',  // Transactional exempt from quiet hours
      });

      expect(result.allowed).toBe(true);
    });

    it('should check all compliance rules and return details', async () => {
      db.query.smsOptIns.findFirst.mockResolvedValue({
        status: 'opted_in',
        campaign_types: ['promotional'],
      });

      const result = await compliance.checkOutbound({
        tenantId: 'tenant_123',
        to: '+14155551234',
        campaignType: 'promotional',
      });

      // Should have checked all rules
      const checkNames = result.checks.map(c => c.check);
      expect(checkNames).toContain('consent');
      expect(checkNames).toContain('opt_out');
      expect(checkNames).toContain('quiet_hours');
      expect(checkNames).toContain('dnc_list');
      expect(checkNames).toContain('rate_limit');
    });
  });
});
```

### Integration Tests

Integration tests use a real Supabase instance (test project) and mock provider APIs via `msw` (Mock Service Worker).

```bash
# Run integration tests
pnpm test:integration --filter @mcv/growth/sms

# Run with specific provider mock
SMS_TEST_PROVIDER=twilio pnpm test:integration --filter @mcv/growth/sms
```

#### Integration Test Coverage

| Test | Description |
|------|-------------|
| Campaign lifecycle | Create → schedule → send → complete with real DB |
| Provider failover | Simulate primary provider failure, verify failover |
| Inbound webhook flow | Mock Twilio webhook → parse → route → auto-reply |
| Opt-in/opt-out cycle | Web form opt-in → receive campaign → STOP → verify blocked |
| Batch send | 1000-message batch with compliance filtering and provider routing |
| Conversation thread | Inbound → auto-reply → agent reply → close |
| 10DLC registration | Registration submission and status polling |
| Analytics aggregation | Send messages → trigger aggregation → verify metrics |

### Load Tests

```bash
# Run load tests (requires k6)
k6 run tests/load/sms-send-throughput.js --vus 50 --duration 60s
k6 run tests/load/sms-webhook-ingress.js --vus 100 --duration 30s
```

| Scenario | Target | Threshold |
|----------|--------|-----------|
| Single message send | < 200ms p95 | < 500ms p99 |
| Batch send (1000 msgs) | < 2s total | < 5s p99 |
| Webhook ingress | < 50ms p95 | < 100ms p99 |
| Campaign creation | < 300ms p95 | < 500ms p99 |
| Analytics query | < 500ms p95 | < 1s p99 |
| Compliance check | < 20ms p95 | < 50ms p99 |

### Test Fixtures

The module provides test fixtures for use in other modules that depend on SMS:

```typescript
import { createTestSMSService, createTestMessage, createTestCampaign } from '@mcv/growth/sms/testing';

// Create a mock SMS service that records all sends
const testSms = createTestSMSService();

// Create test fixtures
const campaign = createTestCampaign({
  name: 'Test Campaign',
  type: 'promotional',
  status: 'completed',
});

const message = createTestMessage({
  direction: 'outbound',
  status: 'delivered',
  to: '+14155551234',
});

// Assert sends
await testSms.sendMessage({ to: '+14155551234', body: 'Test' });
expect(testSms.getSentMessages()).toHaveLength(1);
expect(testSms.getSentMessages()[0].to).toBe('+14155551234');
```

---

*Last updated: 2026-02-09*
*Module version: 0.12.0*
*Generated from source — do not edit directly*