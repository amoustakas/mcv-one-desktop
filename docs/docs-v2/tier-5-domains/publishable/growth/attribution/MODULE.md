# @mcv/growth/attribution

> Marketing attribution engine for the MCV.ONE platform — track every touchpoint, model every conversion, and understand which channels actually drive growth.

**Package:** `@mcv/growth/attribution`
**Layer:** Domain · Growth
**Since:** 0.14.0
**Status:** Stable
**Maintainers:** MCV Growth Team

---

## Table of Contents

- [Purpose](#purpose)
- [Exports](#exports)
- [Architecture](#architecture)
- [Core Interfaces](#core-interfaces)
- [Database Schemas](#database-schemas)
- [Code Examples](#code-examples)
- [Error Codes](#error-codes)
- [Security](#security)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [Testing](#testing)

---

## Purpose

Attribution answers the hardest question in marketing: **what's working?**

Every dollar spent on ads, every blog post published, every email sent — they all generate touchpoints. But when a customer finally converts, which touchpoint deserves the credit? The first one that introduced them? The last one before purchase? All of them equally? Or some weighted combination that reflects reality?

`@mcv/growth/attribution` provides a complete marketing attribution system that:

1. **Collects touchpoints** — UTM parameters, referrer headers, ad click identifiers (gclid, fbclid, ttclid), direct visits, organic searches, social referrals, email clicks, and custom events are captured server-side with full privacy compliance.

2. **Builds customer journeys** — Every anonymous visitor and identified user accumulates a chronological timeline of interactions. When anonymous sessions merge with identified users, journeys unify automatically.

3. **Runs attribution models** — Six built-in models (first-touch, last-touch, linear, time-decay, position-based, data-driven) distribute conversion credit across touchpoints. Custom models can be registered.

4. **Generates reports** — Channel contribution, campaign ROI, assisted conversions, path analysis, time-to-conversion distributions, and cross-channel comparisons — all queryable via tRPC and exportable.

5. **Streams in real-time** — Redpanda-powered stream processing attributes conversions within seconds, with provisional attribution that adjusts as more data arrives.

6. **Feeds downstream systems** — Attribution data flows to ad platforms (Meta CAPI, Google Ads), analytics dashboards, CRM records, and finance systems for ROAS calculation.

7. **Respects privacy** — Server-side tracking eliminates cookie dependency. Consent management integrates with `@mcv/compliance`. IP anonymization, data retention policies, and GDPR/CCPA right-to-deletion are built in.

### Why not use Google Analytics / third-party attribution?

| Concern | Third-Party | @mcv/growth/attribution |
|---|---|---|
| Data ownership | Vendor-controlled | Your Supabase database |
| Cross-platform | Limited to their ecosystem | Unified across all channels |
| Privacy | Cookie-dependent, consent issues | Server-side, cookieless capable |
| Customization | Fixed models | Custom models, custom channels |
| Real-time | Hours of delay | Sub-second with Redpanda |
| Multi-tenant | Not supported | RLS-isolated per tenant |
| Raw data access | Sampled/aggregated | Full touchpoint-level data |
| Cost | Per-hit pricing | Flat infrastructure cost |

### Design Principles

- **Every touchpoint is immutable** — Once recorded, touchpoints are append-only. Attribution results are recalculated, never touchpoints.
- **Models are pluggable** — The attribution engine accepts any function that distributes credit across touchpoints. Built-in models cover common needs; custom models handle edge cases.
- **Privacy by default** — No PII is stored in touchpoints unless explicitly configured. IP addresses are anonymized. Consent status gates collection.
- **Multi-tenant isolation** — All queries are RLS-scoped. Tenant A never sees Tenant B's data. Period.
- **Eventual consistency for attribution** — Touchpoints are collected synchronously. Attribution calculation is asynchronous. Reports reflect the latest completed calculation cycle.

---

## Exports

```typescript
// === Core Service ===
export { AttributionService }              from './services/attribution.service';
export { TouchpointCollector }             from './services/touchpoint-collector';
export { JourneyBuilder }                  from './services/journey-builder';
export { AttributionEngine }               from './services/attribution-engine';
export { AttributionReporter }             from './services/attribution-reporter';

// === Attribution Models ===
export { FirstTouchModel }                 from './models/first-touch';
export { LastTouchModel }                  from './models/last-touch';
export { LinearModel }                     from './models/linear';
export { TimeDecayModel }                  from './models/time-decay';
export { PositionBasedModel }              from './models/position-based';
export { DataDrivenModel }                 from './models/data-driven';
export { createCustomModel }               from './models/custom';

// === Touchpoint Parsers ===
export { UTMParser }                       from './parsers/utm';
export { ReferrerParser }                  from './parsers/referrer';
export { ClickIdParser }                   from './parsers/click-id';
export { ChannelClassifier }               from './parsers/channel-classifier';

// === Stream Processing ===
export { AttributionStreamProcessor }      from './streams/attribution-processor';
export { TouchpointIngestionStream }       from './streams/touchpoint-ingestion';
export { ConversionStream }                from './streams/conversion-stream';

// === Data Integration ===
export { MetaCAPIConnector }               from './integrations/meta-capi';
export { GoogleAdsConnector }              from './integrations/google-ads';
export { CRMAttributionSync }              from './integrations/crm-sync';
export { FinanceExporter }                 from './integrations/finance-export';

// === tRPC Router ===
export { attributionRouter }               from './router';
export type { AttributionRouter }          from './router';

// === Database ===
export {
  touchpoints,
  conversions,
  attributionResults,
  customerJourneys,
  channelGroups,
  attributionModels,
  attributionWindows,
  conversionDefinitions,
}                                          from './schema';

// === Types ===
export type {
  Touchpoint,
  TouchpointCreate,
  TouchpointSource,
  TouchpointType,
  Conversion,
  ConversionCreate,
  ConversionDefinition,
  ConversionValue,
  AttributionModel,
  AttributionModelType,
  AttributionModelConfig,
  AttributionResult,
  AttributionCredit,
  CustomerJourney,
  JourneyTouchpoint,
  JourneyStage,
  AttributionReport,
  ChannelContribution,
  CampaignComparison,
  AssistedConversion,
  PathAnalysis,
  ChannelGroup,
  ChannelGroupRule,
  ChannelGroupMatch,
  AttributionWindow,
  AttributionWindowConfig,
  WindowType,
  TouchpointFilter,
  ConversionFilter,
  AttributionQuery,
  ReportTimeRange,
  ReportGranularity,
  AttributionConfig,
  PrivacyConfig,
  ConsentStatus,
  DataRetentionPolicy,
  StreamConfig,
  IntegrationConfig,
  CAPIEvent,
  ROASCalculation,
}                                          from './types';

// === Validators ===
export {
  touchpointSchema,
  conversionSchema,
  attributionQuerySchema,
  channelGroupSchema,
  attributionWindowSchema,
  conversionDefinitionSchema,
  reportFilterSchema,
}                                          from './validators';

// === Constants ===
export {
  DEFAULT_ATTRIBUTION_WINDOW_DAYS,
  DEFAULT_MODEL_TYPE,
  BUILT_IN_CHANNEL_GROUPS,
  SUPPORTED_CLICK_IDS,
  UTM_PARAMETERS,
  MAX_TOUCHPOINTS_PER_JOURNEY,
  ATTRIBUTION_STREAM_TOPIC,
}                                          from './constants';

// === Errors ===
export {
  AttributionError,
  TouchpointError,
  ConversionError,
  ModelError,
  JourneyError,
  WindowError,
  IntegrationError,
  PrivacyError,
}                                          from './errors';
```

---

## Architecture

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TOUCHPOINT COLLECTION LAYER                         │
│                                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │   UTM    │  │ Referrer │  │ Click ID │  │  Direct  │  │   Custom     │ │
│  │  Parser  │  │  Parser  │  │  Parser  │  │ Detector │  │   Events     │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘ │
│       │              │             │              │               │         │
│       └──────────────┴─────────────┴──────────────┴───────────────┘         │
│                                    │                                        │
│                          ┌─────────▼─────────┐                              │
│                          │ Channel Classifier │                              │
│                          └─────────┬─────────┘                              │
│                                    │                                        │
│                          ┌─────────▼─────────┐                              │
│                          │    Privacy Gate    │                              │
│                          │  (consent check)   │                              │
│                          └─────────┬─────────┘                              │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
            ┌──────────┐    ┌──────────────┐   ┌──────────────┐
            │ Supabase │    │   Redpanda   │   │  Journey     │
            │   (raw   │    │  (streaming  │   │  Builder     │
            │  store)  │    │   topics)    │   │  (in-memory) │
            └────┬─────┘    └──────┬───────┘   └──────┬───────┘
                 │                 │                   │
                 │                 │                   │
┌────────────────┼─────────────────┼───────────────────┼──────────────────────┐
│                │    ATTRIBUTION ENGINE               │                      │
│                ▼                 ▼                   ▼                      │
│  ┌──────────────────┐  ┌────────────────┐  ┌────────────────────┐          │
│  │  Batch Processor │  │ Stream Proc.   │  │ Journey Assembler  │          │
│  │  (scheduled)     │  │ (real-time)    │  │ (merge & dedupe)   │          │
│  └────────┬─────────┘  └───────┬────────┘  └────────┬───────────┘          │
│           │                    │                     │                      │
│           └────────────────────┴─────────────────────┘                      │
│                                │                                            │
│                    ┌───────────▼────────────┐                               │
│                    │   Model Executor       │                               │
│                    │                        │                               │
│                    │  ┌─────────────────┐   │                               │
│                    │  │ First Touch     │   │                               │
│                    │  │ Last Touch      │   │                               │
│                    │  │ Linear          │   │                               │
│                    │  │ Time Decay      │   │                               │
│                    │  │ Position-Based  │   │                               │
│                    │  │ Data-Driven     │   │                               │
│                    │  │ Custom...       │   │                               │
│                    │  └─────────────────┘   │                               │
│                    └───────────┬────────────┘                               │
│                                │                                            │
│                    ┌───────────▼────────────┐                               │
│                    │  Attribution Results   │                               │
│                    │  (credit assignments)  │                               │
│                    └───────────┬────────────┘                               │
└────────────────────────────────┼────────────────────────────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────────────────┐
│                    REPORTING & INTEGRATION LAYER                            │
│                                │                                            │
│           ┌────────────────────┼────────────────────┐                       │
│           │                    │                    │                       │
│           ▼                    ▼                    ▼                       │
│  ┌─────────────────┐  ┌──────────────┐   ┌──────────────────┐              │
│  │  Report Engine  │  │ Integration  │   │  tRPC Router     │              │
│  │                 │  │  Connectors  │   │  (API layer)     │              │
│  │  • Channel      │  │              │   │                  │              │
│  │  • Campaign     │  │  • Meta CAPI │   │  • query         │              │
│  │  • ROI          │  │  • Google    │   │  • configure     │              │
│  │  • Path         │  │  • CRM      │   │  • report        │              │
│  │  • Assisted     │  │  • Finance  │   │  • export        │              │
│  └─────────────────┘  └──────────────┘   └──────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

#### Touchpoint Collector

The `TouchpointCollector` is the entry point for all attribution data. It receives raw HTTP request data (or custom event payloads) and extracts structured touchpoint information:

```
Request arrives → Extract UTMs → Parse referrer → Detect click IDs
    → Classify channel → Check consent → Store touchpoint
```

- **UTM Parser** — Extracts `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` from query strings. Normalizes casing and trims whitespace.
- **Referrer Parser** — Analyzes `document.referrer` or `Referer` header. Identifies search engines, social networks, known domains. Falls back to "referral" for unknown domains.
- **Click ID Parser** — Detects platform-specific click identifiers: `gclid` (Google), `fbclid` (Meta), `ttclid` (TikTok), `li_fat_id` (LinkedIn), `msclkid` (Microsoft), `twclid` (Twitter/X), `dclid` (Google Display), `wbraid`/`gbraid` (Google app campaigns).
- **Channel Classifier** — Applies channel grouping rules to categorize touchpoints into channels: Paid Search, Paid Social, Organic Search, Organic Social, Email, Direct, Referral, Display, Video, Affiliate, SMS, Push, or custom channels.
- **Privacy Gate** — Checks consent status before storing touchpoints. If consent is not granted for marketing tracking, the touchpoint is either dropped or stored in anonymized form depending on configuration.

#### Journey Builder

The `JourneyBuilder` assembles individual touchpoints into coherent customer journeys:

- **Session Stitching** — Groups touchpoints by session using configurable session timeout (default: 30 minutes of inactivity).
- **Identity Resolution** — Links anonymous sessions to identified users when login/signup occurs. Merges pre-authentication touchpoints into the authenticated user's journey.
- **Deduplication** — Removes duplicate touchpoints from page reloads, double-clicks, and redirect chains.
- **Journey Stages** — Tags journey phases: Awareness → Consideration → Decision → Conversion. Stages are inferred from touchpoint patterns and configurable rules.
- **Cross-Device** — When user IDs are available, merges journeys across devices and browsers.

#### Attribution Engine

The `AttributionEngine` is the computational core. It takes a customer journey and a conversion event, selects the configured attribution model, and produces credit assignments:

- **Model Selection** — Each tenant configures a default model. Individual reports can override the model. Multiple models can run simultaneously for comparison.
- **Window Application** — Before running the model, touchpoints outside the attribution window are excluded. Different windows can apply to different channels (e.g., 7-day window for paid search, 30-day for display).
- **Credit Distribution** — The model outputs a set of `AttributionCredit` objects, each assigning a fractional credit (0.0–1.0) to a touchpoint. Credits always sum to 1.0 per conversion.
- **Value Assignment** — Conversion value is distributed proportionally to credit. A $100 conversion with 40% credit to paid search = $40 attributed to paid search.

#### Attribution Models — Deep Dive

**First-Touch Attribution**
```
Touchpoints:  [Google Ads] → [Blog Post] → [Email] → [Direct] → CONVERSION
Credits:       1.0            0.0           0.0        0.0
```
All credit goes to the first touchpoint in the journey. Best for understanding which channels drive initial awareness. Simple but ignores the nurturing process.

**Last-Touch Attribution**
```
Touchpoints:  [Google Ads] → [Blog Post] → [Email] → [Direct] → CONVERSION
Credits:       0.0            0.0           0.0        1.0
```
All credit goes to the last touchpoint before conversion. Default in many analytics tools. Best for understanding what closes deals. Ignores everything that came before.

**Linear Attribution**
```
Touchpoints:  [Google Ads] → [Blog Post] → [Email] → [Direct] → CONVERSION
Credits:       0.25           0.25          0.25       0.25
```
Equal credit to every touchpoint. Democratic but naive. Useful as a baseline comparison.

**Time-Decay Attribution**
```
Touchpoints:  [Google Ads] → [Blog Post] → [Email] → [Direct] → CONVERSION
               (30 days ago)  (14 days ago) (3 days ago) (today)
Credits:       0.10           0.15          0.30       0.45
```
More credit to touchpoints closer to conversion. Uses exponential decay with configurable half-life (default: 7 days). Reflects the intuition that recent interactions matter more.

**Position-Based (U-Shaped) Attribution**
```
Touchpoints:  [Google Ads] → [Blog Post] → [Email] → [Direct] → CONVERSION
Credits:       0.40           0.10          0.10       0.40
```
40% to first touch, 40% to last touch, remaining 20% distributed evenly among middle touchpoints. Recognizes that introduction and closing are most important while still crediting the middle.

**Data-Driven (Markov Chain) Attribution**
```
Touchpoints:  [Google Ads] → [Blog Post] → [Email] → [Direct] → CONVERSION
Credits:       0.35           0.25          0.28       0.12
```
Uses Markov chain analysis on aggregate journey data to calculate the removal effect of each channel. If removing "Email" from all journeys reduces conversions by 28%, email gets 28% credit (normalized). Requires sufficient data volume (minimum 200 conversions recommended). Recalculated periodically as new data arrives.

The Markov chain approach:
1. Build a transition matrix from all observed journeys (converting and non-converting)
2. For each channel, calculate the conversion probability with and without that channel
3. The "removal effect" = drop in conversion probability when the channel is removed
4. Normalize removal effects across all channels to sum to 1.0
5. Apply normalized credits to individual conversions

#### Stream Processing

Real-time attribution uses Redpanda for event streaming:

- **Touchpoint Ingestion Topic** (`attribution.touchpoints.v1`) — Raw touchpoints are published as they arrive. Consumers build in-memory journey state.
- **Conversion Topic** (`attribution.conversions.v1`) — Conversion events trigger immediate attribution calculation using the current journey state.
- **Attribution Results Topic** (`attribution.results.v1`) — Computed attribution credits are published for downstream consumers (dashboards, CAPI connectors, CRM sync).

Stream processing provides **provisional attribution** — results are available immediately but may be adjusted during the next batch recalculation cycle (which considers late-arriving touchpoints, identity merges, and model recalibration).

#### Reporting Layer

The `AttributionReporter` generates structured reports from attribution results:

- **Channel Contribution** — Revenue and conversions attributed to each channel, with trend over time.
- **Campaign Comparison** — Side-by-side performance of campaigns within a channel, including cost and ROAS when spend data is available.
- **Assisted Conversions** — Touchpoints that participated in conversions but didn't receive last-touch credit. Critical for understanding upper-funnel value.
- **Path Analysis** — Most common conversion paths, average path length, branching points.
- **Time-to-Conversion** — Distribution of time from first touch to conversion, segmented by channel.
- **Model Comparison** — Same data through different attribution models side-by-side.

---

## Core Interfaces

### Touchpoint

```typescript
/**
 * A single interaction between a user and a marketing channel.
 * Touchpoints are the atomic unit of attribution data.
 */
interface Touchpoint {
  /** Unique touchpoint identifier */
  id: string;

  /** Tenant ID for multi-tenant isolation */
  tenantId: string;

  /** Anonymous visitor ID (cookie or fingerprint-based) */
  visitorId: string;

  /** Identified user ID (null until authentication) */
  userId: string | null;

  /** Session ID grouping related touchpoints */
  sessionId: string;

  /** When this touchpoint occurred */
  timestamp: Date;

  /** Classification of the touchpoint source */
  source: TouchpointSource;

  /** The type of interaction */
  type: TouchpointType;

  /** Channel group this touchpoint belongs to */
  channelGroup: string;

  /** UTM parameters, if present */
  utm: {
    source: string | null;
    medium: string | null;
    campaign: string | null;
    term: string | null;
    content: string | null;
  };

  /** Ad platform click identifiers */
  clickIds: {
    gclid: string | null;
    fbclid: string | null;
    ttclid: string | null;
    msclkid: string | null;
    li_fat_id: string | null;
    twclid: string | null;
    dclid: string | null;
    wbraid: string | null;
    gbraid: string | null;
    custom: Record<string, string>;
  };

  /** Referrer information */
  referrer: {
    url: string | null;
    domain: string | null;
    type: 'search' | 'social' | 'email' | 'referral' | 'internal' | 'none';
  };

  /** Page URL where the touchpoint was captured */
  landingPage: string;

  /** Device and browser information (anonymized) */
  device: {
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    browser: string;
  };

  /** Geographic information (derived from anonymized IP) */
  geo: {
    country: string | null;
    region: string | null;
    city: string | null;
  };

  /** Custom properties for extensibility */
  properties: Record<string, unknown>;

  /** Consent status at time of capture */
  consentStatus: ConsentStatus;

  /** Whether IP was anonymized */
  ipAnonymized: boolean;

  /** Creation timestamp */
  createdAt: Date;
}

/**
 * Source classification for a touchpoint.
 */
interface TouchpointSource {
  /** Raw source value (e.g., 'google', 'facebook', 'newsletter') */
  raw: string;

  /** Normalized source category */
  category: 'paid' | 'organic' | 'direct' | 'referral' | 'email' | 'social' | 'affiliate' | 'push' | 'sms' | 'display' | 'video' | 'other';

  /** Whether this is a paid source */
  isPaid: boolean;

  /** Ad platform, if applicable */
  adPlatform: 'google' | 'meta' | 'tiktok' | 'linkedin' | 'microsoft' | 'twitter' | 'pinterest' | null;
}

/**
 * Type of touchpoint interaction.
 */
type TouchpointType =
  | 'pageview'          // Standard page visit
  | 'click'             // Ad click
  | 'impression'        // Ad impression (for view-through)
  | 'email_open'        // Email opened
  | 'email_click'       // Email link clicked
  | 'social_engagement' // Social media interaction
  | 'form_submit'       // Form submission (non-conversion)
  | 'video_view'        // Video content viewed
  | 'download'          // Content download
  | 'custom';           // Custom interaction type

/**
 * Payload for creating a new touchpoint.
 */
interface TouchpointCreate {
  visitorId: string;
  userId?: string;
  sessionId: string;
  url: string;
  referrer?: string;
  queryParams?: Record<string, string>;
  type?: TouchpointType;
  device?: {
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    browser: string;
  };
  ip?: string;
  properties?: Record<string, unknown>;
  consentGranted: boolean;
}
```

### Conversion

```typescript
/**
 * A conversion event — the outcome that attribution models attribute to touchpoints.
 */
interface Conversion {
  /** Unique conversion identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** The conversion definition this event matches */
  definitionId: string;

  /** User who converted */
  userId: string;

  /** Visitor ID (links to pre-auth touchpoints) */
  visitorId: string;

  /** When the conversion occurred */
  timestamp: Date;

  /** Conversion type label */
  type: string;

  /** Monetary value of the conversion */
  value: ConversionValue;

  /** Whether this is a micro-conversion */
  isMicro: boolean;

  /** Order/transaction ID for deduplication */
  transactionId: string | null;

  /** Products or items involved */
  items: ConversionItem[];

  /** Custom conversion properties */
  properties: Record<string, unknown>;

  /** Attribution results for this conversion (populated after attribution runs) */
  attribution: AttributionResult | null;

  /** Creation timestamp */
  createdAt: Date;
}

/**
 * Monetary value of a conversion.
 */
interface ConversionValue {
  /** Numeric amount */
  amount: number;

  /** ISO 4217 currency code */
  currency: string;

  /** Amount normalized to tenant's base currency */
  normalizedAmount: number;

  /** Exchange rate used for normalization */
  exchangeRate: number;
}

/**
 * Line items in a conversion (e.g., products purchased).
 */
interface ConversionItem {
  /** Item identifier */
  itemId: string;

  /** Item name */
  name: string;

  /** Item category */
  category: string;

  /** Quantity */
  quantity: number;

  /** Unit price */
  price: number;
}

/**
 * Configurable conversion definition.
 * Defines what constitutes a "conversion" for attribution purposes.
 */
interface ConversionDefinition {
  /** Unique definition identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Human-readable name */
  name: string;

  /** Conversion type key */
  type: string;

  /** Description of what this conversion represents */
  description: string;

  /** The event name or action that triggers this conversion */
  triggerEvent: string;

  /** Additional conditions for the trigger */
  triggerConditions: Record<string, unknown>;

  /** Default value if no explicit value is provided */
  defaultValue: number;

  /** Currency for default value */
  defaultCurrency: string;

  /** Whether this is a micro-conversion */
  isMicro: boolean;

  /** Attribution model to use (overrides tenant default) */
  modelOverride: AttributionModelType | null;

  /** Attribution window override */
  windowOverride: AttributionWindowConfig | null;

  /** Whether this definition is active */
  isActive: boolean;

  /** Creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;
}
```

### Attribution Model

```typescript
/**
 * Available attribution model types.
 */
type AttributionModelType =
  | 'first_touch'
  | 'last_touch'
  | 'linear'
  | 'time_decay'
  | 'position_based'
  | 'data_driven'
  | 'custom';

/**
 * Configuration for an attribution model.
 */
interface AttributionModelConfig {
  /** Model type */
  type: AttributionModelType;

  /** Display name */
  name: string;

  /** Model-specific parameters */
  params: AttributionModelParams;
}

/**
 * Model-specific parameters.
 */
type AttributionModelParams =
  | FirstTouchParams
  | LastTouchParams
  | LinearParams
  | TimeDecayParams
  | PositionBasedParams
  | DataDrivenParams
  | CustomModelParams;

interface FirstTouchParams {
  type: 'first_touch';
  /** Whether to use the first touchpoint of the first session or the very first touchpoint */
  scope: 'first_session' | 'first_touchpoint';
}

interface LastTouchParams {
  type: 'last_touch';
  /** Whether to exclude direct visits as "last touch" */
  excludeDirect: boolean;
}

interface LinearParams {
  type: 'linear';
  /** No additional params — equal distribution */
}

interface TimeDecayParams {
  type: 'time_decay';
  /** Half-life in days — touchpoints lose 50% credit after this many days */
  halfLifeDays: number;
  /** Minimum credit percentage for very old touchpoints (prevents zero credits) */
  minCreditPercent: number;
}

interface PositionBasedParams {
  type: 'position_based';
  /** Credit weight for the first touchpoint (0.0–1.0) */
  firstTouchWeight: number;
  /** Credit weight for the last touchpoint (0.0–1.0) */
  lastTouchWeight: number;
  /** Remaining weight is distributed evenly among middle touchpoints */
}

interface DataDrivenParams {
  type: 'data_driven';
  /** Minimum number of conversions required for reliable results */
  minConversions: number;
  /** How often to recalculate the Markov chain (in hours) */
  recalculationIntervalHours: number;
  /** Number of historical days to include in the Markov chain calculation */
  lookbackDays: number;
  /** Fallback model when insufficient data is available */
  fallbackModel: Exclude<AttributionModelType, 'data_driven' | 'custom'>;
}

interface CustomModelParams {
  type: 'custom';
  /** Unique key for the custom model */
  modelKey: string;
  /** Custom parameters passed to the model function */
  config: Record<string, unknown>;
}

/**
 * The attribution model interface that all models implement.
 */
interface AttributionModel {
  /** Model type identifier */
  type: AttributionModelType;

  /** Human-readable model name */
  name: string;

  /**
   * Distribute conversion credit across touchpoints.
   *
   * @param touchpoints - Ordered list of touchpoints in the journey (chronological)
   * @param conversion - The conversion event being attributed
   * @param config - Model configuration
   * @returns Array of credit assignments, one per touchpoint. Credits must sum to 1.0.
   */
  calculate(
    touchpoints: Touchpoint[],
    conversion: Conversion,
    config: AttributionModelConfig,
  ): AttributionCredit[];
}

/**
 * Credit assignment for a single touchpoint.
 */
interface AttributionCredit {
  /** Touchpoint ID receiving credit */
  touchpointId: string;

  /** Fractional credit (0.0–1.0) */
  credit: number;

  /** Attributed conversion value (conversion.value.normalizedAmount * credit) */
  attributedValue: number;

  /** Channel group of the credited touchpoint */
  channelGroup: string;

  /** Campaign of the credited touchpoint */
  campaign: string | null;

  /** Source of the credited touchpoint */
  source: string;

  /** Medium of the credited touchpoint */
  medium: string | null;

  /** Position in the journey (0-indexed) */
  position: number;

  /** Whether this is the first touchpoint */
  isFirstTouch: boolean;

  /** Whether this is the last touchpoint */
  isLastTouch: boolean;

  /** Time between this touchpoint and conversion */
  timeToConversion: number;
}
```

### Customer Journey

```typescript
/**
 * A customer's complete journey from first interaction to conversion (or current state).
 */
interface CustomerJourney {
  /** Unique journey identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** User ID (null if still anonymous) */
  userId: string | null;

  /** Visitor ID */
  visitorId: string;

  /** All touchpoints in chronological order */
  touchpoints: JourneyTouchpoint[];

  /** Number of sessions in the journey */
  sessionCount: number;

  /** Number of unique channels encountered */
  channelCount: number;

  /** Duration from first touchpoint to latest touchpoint (ms) */
  durationMs: number;

  /** Current journey stage */
  currentStage: JourneyStage;

  /** Whether the journey has resulted in a conversion */
  hasConverted: boolean;

  /** Conversion IDs associated with this journey */
  conversionIds: string[];

  /** First touchpoint timestamp */
  firstTouchAt: Date;

  /** Latest touchpoint timestamp */
  lastTouchAt: Date;

  /** Journey creation timestamp */
  createdAt: Date;

  /** Last updated timestamp */
  updatedAt: Date;
}

/**
 * A touchpoint within a journey context, enriched with journey-relative metadata.
 */
interface JourneyTouchpoint {
  /** Reference to the touchpoint */
  touchpoint: Touchpoint;

  /** Position in the journey (0-indexed) */
  position: number;

  /** Time since the previous touchpoint (ms) */
  timeSincePrevious: number | null;

  /** Time until the next touchpoint (ms) */
  timeUntilNext: number | null;

  /** Whether this started a new session */
  isSessionStart: boolean;

  /** Journey stage at this touchpoint */
  stage: JourneyStage;

  /** Whether this is a channel switch from the previous touchpoint */
  isChannelSwitch: boolean;
}

/**
 * Journey stage classification.
 */
type JourneyStage =
  | 'awareness'       // First interactions, top of funnel
  | 'consideration'   // Research phase, multiple touchpoints
  | 'decision'        // Close to conversion, high-intent signals
  | 'conversion'      // Conversion occurred
  | 'post_conversion' // Touchpoints after initial conversion
  | 'unknown';        // Cannot determine stage
```

### Attribution Report

```typescript
/**
 * A generated attribution report.
 */
interface AttributionReport {
  /** Report identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Report type */
  type: 'channel_contribution' | 'campaign_comparison' | 'assisted_conversions' | 'path_analysis' | 'time_to_conversion' | 'model_comparison';

  /** Time range covered by the report */
  timeRange: ReportTimeRange;

  /** Attribution model used */
  model: AttributionModelType;

  /** Conversion definition filter (null = all conversions) */
  conversionDefinitionId: string | null;

  /** Report data (varies by type) */
  data: ChannelContribution[] | CampaignComparison[] | AssistedConversion[] | PathAnalysis | TimeToConversionData | ModelComparisonData;

  /** Summary statistics */
  summary: ReportSummary;

  /** Generation timestamp */
  generatedAt: Date;

  /** Cache expiration */
  expiresAt: Date;
}

/**
 * Channel contribution data.
 */
interface ChannelContribution {
  /** Channel group name */
  channel: string;

  /** Number of conversions attributed (fractional, since credit is distributed) */
  conversions: number;

  /** Total attributed revenue */
  revenue: number;

  /** Percentage of total conversions */
  conversionShare: number;

  /** Percentage of total revenue */
  revenueShare: number;

  /** Number of touchpoints in this channel */
  touchpoints: number;

  /** Number of unique users who interacted with this channel */
  uniqueUsers: number;

  /** Average position in journey when this channel appears */
  avgPosition: number;

  /** How often this channel is the first touch */
  firstTouchRate: number;

  /** How often this channel is the last touch */
  lastTouchRate: number;

  /** Cost data (if available from ad platform integration) */
  cost: number | null;

  /** Return on ad spend (revenue / cost) */
  roas: number | null;

  /** Cost per acquisition (cost / conversions) */
  cpa: number | null;

  /** Trend data */
  trend: TrendPoint[];
}

/**
 * Campaign comparison data.
 */
interface CampaignComparison {
  /** Campaign name */
  campaign: string;

  /** Channel this campaign belongs to */
  channel: string;

  /** Source */
  source: string;

  /** Medium */
  medium: string | null;

  /** Attributed conversions */
  conversions: number;

  /** Attributed revenue */
  revenue: number;

  /** Cost (if available) */
  cost: number | null;

  /** ROAS */
  roas: number | null;

  /** CPA */
  cpa: number | null;

  /** Number of touchpoints */
  touchpoints: number;

  /** Conversion rate (conversions / unique users who saw this campaign) */
  conversionRate: number;

  /** Trend data */
  trend: TrendPoint[];
}

/**
 * Assisted conversion analysis.
 */
interface AssistedConversion {
  /** Channel group */
  channel: string;

  /** Number of conversions where this channel assisted (touched but didn't get last-touch credit) */
  assistedConversions: number;

  /** Number of conversions where this channel got last-touch credit */
  lastTouchConversions: number;

  /** Ratio of assisted to last-touch (> 1 means more assisting than closing) */
  assistRatio: number;

  /** Total assisted conversion value */
  assistedValue: number;

  /** Total last-touch conversion value */
  lastTouchValue: number;
}

/**
 * Path analysis data.
 */
interface PathAnalysis {
  /** Most common conversion paths */
  topPaths: ConversionPath[];

  /** Average path length (number of touchpoints) */
  avgPathLength: number;

  /** Median path length */
  medianPathLength: number;

  /** Path length distribution */
  pathLengthDistribution: { length: number; count: number; conversionRate: number }[];

  /** Channel transition probabilities */
  transitionMatrix: { from: string; to: string; probability: number }[];
}

/**
 * A specific conversion path.
 */
interface ConversionPath {
  /** Ordered list of channels in the path */
  channels: string[];

  /** Number of conversions following this exact path */
  conversions: number;

  /** Total revenue from this path */
  revenue: number;

  /** Average time to conversion for this path (ms) */
  avgTimeToConversion: number;

  /** Percentage of total conversions */
  share: number;
}

/**
 * Time range for reports.
 */
interface ReportTimeRange {
  /** Start of the reporting period */
  start: Date;

  /** End of the reporting period */
  end: Date;

  /** Granularity of trend data within the range */
  granularity: ReportGranularity;

  /** Timezone for date bucketing */
  timezone: string;
}

type ReportGranularity = 'hour' | 'day' | 'week' | 'month' | 'quarter';

/**
 * A single data point in a trend series.
 */
interface TrendPoint {
  /** Period start date */
  date: Date;

  /** Value for this period */
  value: number;

  /** Change from previous period (percentage) */
  changePercent: number | null;
}

/**
 * Summary statistics for a report.
 */
interface ReportSummary {
  /** Total conversions in the period */
  totalConversions: number;

  /** Total revenue in the period */
  totalRevenue: number;

  /** Total touchpoints in the period */
  totalTouchpoints: number;

  /** Unique converting users */
  uniqueConverters: number;

  /** Average conversion value */
  avgConversionValue: number;

  /** Overall conversion rate */
  conversionRate: number;

  /** Total cost (if spend data available) */
  totalCost: number | null;

  /** Blended ROAS */
  blendedRoas: number | null;

  /** Blended CPA */
  blendedCpa: number | null;
}
```

### Channel Group

```typescript
/**
 * A channel group definition with matching rules.
 */
interface ChannelGroup {
  /** Unique identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Channel group name (e.g., 'Paid Search', 'Organic Social') */
  name: string;

  /** Display color for reports */
  color: string;

  /** Icon identifier */
  icon: string;

  /** Matching rules evaluated in order — first match wins */
  rules: ChannelGroupRule[];

  /** Priority for rule evaluation (lower = higher priority) */
  priority: number;

  /** Whether this is a system-defined group (not deletable) */
  isSystem: boolean;

  /** Whether this group is active */
  isActive: boolean;

  /** Creation timestamp */
  createdAt: Date;
}

/**
 * A rule for matching touchpoints to channel groups.
 */
interface ChannelGroupRule {
  /** Rule identifier */
  id: string;

  /** Field to match against */
  field: 'source' | 'medium' | 'campaign' | 'referrer_domain' | 'click_id' | 'utm_source' | 'utm_medium';

  /** Match operator */
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'matches_regex' | 'in_list';

  /** Value to match */
  value: string;

  /** Whether match is case-sensitive */
  caseSensitive: boolean;
}

/**
 * Result of channel group matching.
 */
interface ChannelGroupMatch {
  /** Matched channel group */
  channelGroup: ChannelGroup;

  /** Which rule matched */
  matchedRule: ChannelGroupRule;

  /** Confidence of the match (1.0 for exact, lower for fuzzy) */
  confidence: number;
}
```

### Attribution Window

```typescript
/**
 * Attribution window configuration.
 */
interface AttributionWindow {
  /** Unique identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Window name */
  name: string;

  /** Whether this is the default window */
  isDefault: boolean;

  /** Window configuration */
  config: AttributionWindowConfig;

  /** Channel-specific overrides */
  channelOverrides: ChannelWindowOverride[];

  /** Creation timestamp */
  createdAt: Date;
}

/**
 * Configuration for an attribution window.
 */
interface AttributionWindowConfig {
  /** Click-through attribution window in days */
  clickWindowDays: number;

  /** View-through (impression) attribution window in days */
  viewWindowDays: number;

  /** Whether to include view-through attribution */
  includeViewThrough: boolean;

  /** Maximum number of touchpoints to consider per journey */
  maxTouchpoints: number;
}

/**
 * Channel-specific window override.
 */
interface ChannelWindowOverride {
  /** Channel group ID this override applies to */
  channelGroupId: string;

  /** Channel group name (for display) */
  channelGroupName: string;

  /** Overridden click window in days */
  clickWindowDays: number;

  /** Overridden view window in days */
  viewWindowDays: number;
}

/**
 * Window type classification.
 */
type WindowType = 'click' | 'view' | 'engagement';
```

### Attribution Service

```typescript
/**
 * Main service facade for the attribution module.
 */
interface AttributionService {
  // === Touchpoint Operations ===

  /**
   * Record a new touchpoint from a page visit or interaction.
   */
  recordTouchpoint(input: TouchpointCreate): Promise<Touchpoint>;

  /**
   * Record a batch of touchpoints (e.g., from delayed client-side collection).
   */
  recordTouchpoints(inputs: TouchpointCreate[]): Promise<Touchpoint[]>;

  /**
   * Get all touchpoints for a visitor.
   */
  getTouchpointsByVisitor(visitorId: string, filter?: TouchpointFilter): Promise<Touchpoint[]>;

  /**
   * Get all touchpoints for an identified user.
   */
  getTouchpointsByUser(userId: string, filter?: TouchpointFilter): Promise<Touchpoint[]>;

  // === Conversion Operations ===

  /**
   * Record a conversion event and trigger attribution calculation.
   */
  recordConversion(input: ConversionCreate): Promise<Conversion>;

  /**
   * Get conversions with their attribution results.
   */
  getConversions(filter: ConversionFilter): Promise<Conversion[]>;

  /**
   * Get a single conversion with full attribution detail.
   */
  getConversion(conversionId: string): Promise<Conversion | null>;

  // === Journey Operations ===

  /**
   * Get the customer journey for a user.
   */
  getJourney(userId: string): Promise<CustomerJourney | null>;

  /**
   * Get the customer journey for an anonymous visitor.
   */
  getJourneyByVisitor(visitorId: string): Promise<CustomerJourney | null>;

  /**
   * Merge an anonymous visitor's journey into an identified user's journey.
   * Called on login/signup to stitch pre-auth touchpoints.
   */
  mergeJourney(visitorId: string, userId: string): Promise<CustomerJourney>;

  // === Attribution Operations ===

  /**
   * Run attribution for a specific conversion using the specified model.
   */
  attributeConversion(
    conversionId: string,
    model?: AttributionModelType,
  ): Promise<AttributionResult>;

  /**
   * Run batch attribution for all unattributed conversions.
   */
  runBatchAttribution(options?: {
    model?: AttributionModelType;
    since?: Date;
    dryRun?: boolean;
  }): Promise<BatchAttributionResult>;

  /**
   * Recalculate attribution for a time range (e.g., after model change).
   */
  recalculateAttribution(
    timeRange: ReportTimeRange,
    model: AttributionModelType,
  ): Promise<BatchAttributionResult>;

  // === Reporting ===

  /**
   * Generate a channel contribution report.
   */
  getChannelContribution(query: AttributionQuery): Promise<AttributionReport>;

  /**
   * Generate a campaign comparison report.
   */
  getCampaignComparison(query: AttributionQuery): Promise<AttributionReport>;

  /**
   * Generate an assisted conversions report.
   */
  getAssistedConversions(query: AttributionQuery): Promise<AttributionReport>;

  /**
   * Generate a path analysis report.
   */
  getPathAnalysis(query: AttributionQuery): Promise<AttributionReport>;

  /**
   * Generate a time-to-conversion report.
   */
  getTimeToConversion(query: AttributionQuery): Promise<AttributionReport>;

  /**
   * Compare attribution results across different models.
   */
  compareModels(
    query: AttributionQuery,
    models: AttributionModelType[],
  ): Promise<AttributionReport>;

  // === Configuration ===

  /**
   * Get or update channel group definitions.
   */
  getChannelGroups(): Promise<ChannelGroup[]>;
  upsertChannelGroup(group: Partial<ChannelGroup> & { name: string }): Promise<ChannelGroup>;
  deleteChannelGroup(groupId: string): Promise<void>;

  /**
   * Get or update attribution windows.
   */
  getAttributionWindows(): Promise<AttributionWindow[]>;
  upsertAttributionWindow(window: Partial<AttributionWindow> & { name: string }): Promise<AttributionWindow>;

  /**
   * Get or update conversion definitions.
   */
  getConversionDefinitions(): Promise<ConversionDefinition[]>;
  upsertConversionDefinition(def: Partial<ConversionDefinition> & { name: string; type: string }): Promise<ConversionDefinition>;
  deleteConversionDefinition(defId: string): Promise<void>;

  /**
   * Get or update the tenant's attribution configuration.
   */
  getConfig(): Promise<AttributionConfig>;
  updateConfig(config: Partial<AttributionConfig>): Promise<AttributionConfig>;

  // === Integration ===

  /**
   * Send attributed conversions to Meta Conversions API.
   */
  syncToMetaCAPI(conversionIds: string[]): Promise<IntegrationSyncResult>;

  /**
   * Send attributed conversions to Google Ads.
   */
  syncToGoogleAds(conversionIds: string[]): Promise<IntegrationSyncResult>;

  /**
   * Export attribution data for finance/ROAS calculations.
   */
  exportForFinance(query: AttributionQuery): Promise<FinanceExport>;

  // === Privacy ===

  /**
   * Delete all touchpoints and attribution data for a user (GDPR right to deletion).
   */
  deleteUserData(userId: string): Promise<DataDeletionResult>;

  /**
   * Anonymize touchpoints for a visitor (remove PII, keep aggregated data).
   */
  anonymizeVisitor(visitorId: string): Promise<void>;

  /**
   * Update consent status and retroactively apply to collected data.
   */
  updateConsent(visitorId: string, consent: ConsentStatus): Promise<void>;
}
```

### Supporting Types

```typescript
/**
 * Attribution result for a single conversion.
 */
interface AttributionResult {
  /** Result identifier */
  id: string;

  /** Conversion ID this result belongs to */
  conversionId: string;

  /** Model used for this attribution */
  model: AttributionModelType;

  /** Individual credit assignments */
  credits: AttributionCredit[];

  /** Number of touchpoints considered */
  touchpointsConsidered: number;

  /** Number of touchpoints excluded (outside window, filtered, etc.) */
  touchpointsExcluded: number;

  /** Attribution window applied */
  windowApplied: AttributionWindowConfig;

  /** Whether this is a provisional (real-time) or final (batch) result */
  isProvisional: boolean;

  /** Calculation timestamp */
  calculatedAt: Date;

  /** Version (incremented on recalculation) */
  version: number;
}

/**
 * Result of a batch attribution run.
 */
interface BatchAttributionResult {
  /** Number of conversions processed */
  conversionsProcessed: number;

  /** Number of conversions successfully attributed */
  conversionsAttributed: number;

  /** Number of conversions that failed attribution */
  conversionsFailed: number;

  /** Number of conversions skipped (no touchpoints in window) */
  conversionsSkipped: number;

  /** Processing duration in milliseconds */
  durationMs: number;

  /** Model used */
  model: AttributionModelType;

  /** Errors encountered */
  errors: { conversionId: string; error: string }[];
}

/**
 * Filter for querying touchpoints.
 */
interface TouchpointFilter {
  /** Date range */
  since?: Date;
  until?: Date;

  /** Channel groups to include */
  channelGroups?: string[];

  /** Touchpoint types to include */
  types?: TouchpointType[];

  /** Sources to include */
  sources?: string[];

  /** Campaigns to include */
  campaigns?: string[];

  /** Limit results */
  limit?: number;

  /** Offset for pagination */
  offset?: number;

  /** Sort order */
  orderBy?: 'timestamp_asc' | 'timestamp_desc';
}

/**
 * Filter for querying conversions.
 */
interface ConversionFilter {
  /** Date range */
  since?: Date;
  until?: Date;

  /** Conversion types */
  types?: string[];

  /** Conversion definition IDs */
  definitionIds?: string[];

  /** User IDs */
  userIds?: string[];

  /** Minimum conversion value */
  minValue?: number;

  /** Maximum conversion value */
  maxValue?: number;

  /** Include attribution results */
  includeAttribution?: boolean;

  /** Attribution model for included results */
  attributionModel?: AttributionModelType;

  /** Limit */
  limit?: number;

  /** Offset */
  offset?: number;
}

/**
 * Query parameters for attribution reports.
 */
interface AttributionQuery {
  /** Time range */
  timeRange: ReportTimeRange;

  /** Attribution model */
  model?: AttributionModelType;

  /** Conversion definition filter */
  conversionDefinitionId?: string;

  /** Channel groups to include (null = all) */
  channelGroups?: string[];

  /** Minimum number of conversions for inclusion */
  minConversions?: number;

  /** Include cost data from ad platforms */
  includeCost?: boolean;

  /** Include trend data */
  includeTrend?: boolean;

  /** Compare with previous period */
  comparePreviousPeriod?: boolean;
}

/**
 * Tenant-level attribution configuration.
 */
interface AttributionConfig {
  /** Tenant ID */
  tenantId: string;

  /** Default attribution model */
  defaultModel: AttributionModelType;

  /** Default attribution model config */
  defaultModelConfig: AttributionModelConfig;

  /** Default attribution window */
  defaultWindow: AttributionWindowConfig;

  /** Session timeout in minutes */
  sessionTimeoutMinutes: number;

  /** Privacy configuration */
  privacy: PrivacyConfig;

  /** Whether real-time attribution is enabled */
  realtimeEnabled: boolean;

  /** Data retention policy */
  retention: DataRetentionPolicy;

  /** Integration configurations */
  integrations: IntegrationConfig[];
}

/**
 * Privacy configuration.
 */
interface PrivacyConfig {
  /** Whether to anonymize IP addresses */
  anonymizeIp: boolean;

  /** Whether consent is required before collecting touchpoints */
  requireConsent: boolean;

  /** What to do when consent is not granted */
  noConsentBehavior: 'drop' | 'anonymize' | 'collect_minimal';

  /** Whether to respect Do Not Track header */
  respectDnt: boolean;

  /** PII fields to exclude from touchpoint storage */
  excludeFields: string[];

  /** Whether to enable cookieless tracking (server-side only) */
  cookielessMode: boolean;
}

/**
 * Data retention policy.
 */
interface DataRetentionPolicy {
  /** How long to keep raw touchpoints (days) */
  touchpointRetentionDays: number;

  /** How long to keep individual attribution results (days) */
  attributionRetentionDays: number;

  /** How long to keep aggregated reports (days) */
  reportRetentionDays: number;

  /** Whether to auto-anonymize old data instead of deleting */
  anonymizeInsteadOfDelete: boolean;
}

/**
 * Consent status for privacy compliance.
 */
interface ConsentStatus {
  /** Whether marketing tracking is consented */
  marketing: boolean;

  /** Whether analytics tracking is consented */
  analytics: boolean;

  /** Timestamp of consent decision */
  timestamp: Date;

  /** Consent source (e.g., 'cookie_banner', 'settings_page') */
  source: string;

  /** Consent version (for re-consent on policy changes) */
  version: string;
}

/**
 * Integration configuration for external platforms.
 */
interface IntegrationConfig {
  /** Platform identifier */
  platform: 'meta_capi' | 'google_ads' | 'tiktok' | 'linkedin' | 'crm' | 'finance';

  /** Whether this integration is enabled */
  enabled: boolean;

  /** Platform-specific credentials (encrypted at rest) */
  credentials: Record<string, string>;

  /** Sync frequency */
  syncFrequency: 'realtime' | 'hourly' | 'daily';

  /** Which conversion types to sync */
  conversionTypes: string[];

  /** Last successful sync timestamp */
  lastSyncAt: Date | null;
}

/**
 * Result of an integration sync operation.
 */
interface IntegrationSyncResult {
  /** Platform synced to */
  platform: string;

  /** Number of events sent */
  eventsSent: number;

  /** Number of events accepted by the platform */
  eventsAccepted: number;

  /** Number of events rejected */
  eventsRejected: number;

  /** Rejection details */
  rejections: { conversionId: string; reason: string }[];

  /** Sync timestamp */
  syncedAt: Date;
}

/**
 * ROAS calculation export for finance.
 */
interface ROASCalculation {
  /** Channel */
  channel: string;

  /** Campaign (null for channel-level) */
  campaign: string | null;

  /** Total attributed revenue */
  revenue: number;

  /** Total spend */
  spend: number;

  /** ROAS (revenue / spend) */
  roas: number;

  /** Incremental ROAS (compared to baseline) */
  incrementalRoas: number | null;

  /** Profit (revenue - spend) */
  profit: number;

  /** Time period */
  period: { start: Date; end: Date };
}

/**
 * Result of GDPR data deletion.
 */
interface DataDeletionResult {
  /** Number of touchpoints deleted */
  touchpointsDeleted: number;

  /** Number of journey records deleted */
  journeysDeleted: number;

  /** Number of attribution results deleted */
  attributionResultsDeleted: number;

  /** Number of conversions anonymized (not deleted — needed for aggregate reporting) */
  conversionsAnonymized: number;

  /** Deletion timestamp */
  deletedAt: Date;

  /** Confirmation token for audit trail */
  confirmationToken: string;
}
```

---

## Database Schemas

### touchpoints

The core fact table. Stores every captured marketing interaction. Partitioned by `created_at` (monthly) for query performance.

```typescript
import { pgTable, text, timestamp, jsonb, boolean, uuid, index, pgPolicy } from 'drizzle-orm/pg-core';

export const touchpoints = pgTable(
  'attribution_touchpoints',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    visitorId: text('visitor_id').notNull(),
    userId: uuid('user_id').references(() => users.id),
    sessionId: text('session_id').notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    type: text('type').notNull().default('pageview'),

    // Source classification
    channelGroup: text('channel_group').notNull(),
    sourceRaw: text('source_raw'),
    sourceCategory: text('source_category').notNull(),
    isPaid: boolean('is_paid').notNull().default(false),
    adPlatform: text('ad_platform'),

    // UTM parameters
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    utmTerm: text('utm_term'),
    utmContent: text('utm_content'),

    // Click IDs (stored individually for indexing)
    gclid: text('gclid'),
    fbclid: text('fbclid'),
    ttclid: text('ttclid'),
    msclkid: text('msclkid'),
    customClickIds: jsonb('custom_click_ids').$type<Record<string, string>>().default({}),

    // Referrer
    referrerUrl: text('referrer_url'),
    referrerDomain: text('referrer_domain'),
    referrerType: text('referrer_type'),

    // Landing page
    landingPage: text('landing_page').notNull(),

    // Device info (anonymized)
    deviceType: text('device_type'),
    deviceOs: text('device_os'),
    deviceBrowser: text('device_browser'),

    // Geo info (derived from anonymized IP)
    geoCountry: text('geo_country'),
    geoRegion: text('geo_region'),
    geoCity: text('geo_city'),

    // Privacy
    consentMarketing: boolean('consent_marketing').notNull().default(false),
    consentAnalytics: boolean('consent_analytics').notNull().default(false),
    ipAnonymized: boolean('ip_anonymized').notNull().default(true),

    // Custom properties
    properties: jsonb('properties').$type<Record<string, unknown>>().default({}),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // Performance indexes
    tenantVisitorIdx: index('idx_tp_tenant_visitor').on(table.tenantId, table.visitorId),
    tenantUserIdx: index('idx_tp_tenant_user').on(table.tenantId, table.userId),
    tenantSessionIdx: index('idx_tp_tenant_session').on(table.tenantId, table.sessionId),
    tenantTimestampIdx: index('idx_tp_tenant_timestamp').on(table.tenantId, table.timestamp),
    tenantChannelIdx: index('idx_tp_tenant_channel').on(table.tenantId, table.channelGroup),
    tenantCampaignIdx: index('idx_tp_tenant_campaign').on(table.tenantId, table.utmCampaign),
    gclidIdx: index('idx_tp_gclid').on(table.gclid),
    fbclidIdx: index('idx_tp_fbclid').on(table.fbclid),

    // RLS policy
    tenantIsolation: pgPolicy('touchpoints_tenant_isolation', {
      as: 'permissive',
      for: 'all',
      using: sql`tenant_id = current_setting('app.tenant_id')::uuid`,
    }),
  }),
);
```

### conversions

Records conversion events with their monetary values. Links to touchpoints through attribution results.

```typescript
export const conversions = pgTable(
  'attribution_conversions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    definitionId: uuid('definition_id').notNull().references(() => conversionDefinitions.id),
    userId: uuid('user_id').notNull().references(() => users.id),
    visitorId: text('visitor_id').notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    type: text('type').notNull(),

    // Value
    valueAmount: numeric('value_amount', { precision: 12, scale: 2 }).notNull(),
    valueCurrency: text('value_currency').notNull().default('USD'),
    normalizedAmount: numeric('normalized_amount', { precision: 12, scale: 2 }).notNull(),
    exchangeRate: numeric('exchange_rate', { precision: 10, scale: 6 }).notNull().default('1.000000'),

    // Classification
    isMicro: boolean('is_micro').notNull().default(false),
    transactionId: text('transaction_id'),

    // Items
    items: jsonb('items').$type<ConversionItem[]>().default([]),

    // Custom properties
    properties: jsonb('properties').$type<Record<string, unknown>>().default({}),

    // Attribution status
    attributionStatus: text('attribution_status').notNull().default('pending'),
    lastAttributedAt: timestamp('last_attributed_at', { withTimezone: true }),
    attributionVersion: integer('attribution_version').notNull().default(0),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantTimestampIdx: index('idx_conv_tenant_timestamp').on(table.tenantId, table.timestamp),
    tenantUserIdx: index('idx_conv_tenant_user').on(table.tenantId, table.userId),
    tenantTypeIdx: index('idx_conv_tenant_type').on(table.tenantId, table.type),
    tenantStatusIdx: index('idx_conv_tenant_status').on(table.tenantId, table.attributionStatus),
    transactionIdx: index('idx_conv_transaction').on(table.tenantId, table.transactionId),

    tenantIsolation: pgPolicy('conversions_tenant_isolation', {
      as: 'permissive',
      for: 'all',
      using: sql`tenant_id = current_setting('app.tenant_id')::uuid`,
    }),
  }),
);
```

### attribution_results

Stores the computed attribution credit assignments. Each row is one touchpoint's credit for one conversion. This is the junction table between touchpoints and conversions.

```typescript
export const attributionResults = pgTable(
  'attribution_results',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    conversionId: uuid('conversion_id').notNull().references(() => conversions.id, { onDelete: 'cascade' }),
    touchpointId: uuid('touchpoint_id').notNull().references(() => touchpoints.id),
    model: text('model').notNull(),

    // Credit assignment
    credit: numeric('credit', { precision: 6, scale: 5 }).notNull(),
    attributedValue: numeric('attributed_value', { precision: 12, scale: 2 }).notNull(),

    // Denormalized touchpoint context (for fast reporting)
    channelGroup: text('channel_group').notNull(),
    campaign: text('campaign'),
    source: text('source'),
    medium: text('medium'),

    // Position context
    position: integer('position').notNull(),
    isFirstTouch: boolean('is_first_touch').notNull().default(false),
    isLastTouch: boolean('is_last_touch').notNull().default(false),
    timeToConversion: bigint('time_to_conversion', { mode: 'number' }).notNull(),

    // Metadata
    isProvisional: boolean('is_provisional').notNull().default(false),
    version: integer('version').notNull().default(1),
    calculatedAt: timestamp('calculated_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    conversionIdx: index('idx_ar_conversion').on(table.conversionId),
    touchpointIdx: index('idx_ar_touchpoint').on(table.touchpointId),
    tenantModelIdx: index('idx_ar_tenant_model').on(table.tenantId, table.model),
    tenantChannelIdx: index('idx_ar_tenant_channel').on(table.tenantId, table.channelGroup),
    tenantCampaignIdx: index('idx_ar_tenant_campaign').on(table.tenantId, table.campaign),
    conversionModelUnique: uniqueIndex('idx_ar_conv_tp_model').on(
      table.conversionId,
      table.touchpointId,
      table.model,
      table.version,
    ),

    tenantIsolation: pgPolicy('attribution_results_tenant_isolation', {
      as: 'permissive',
      for: 'all',
      using: sql`tenant_id = current_setting('app.tenant_id')::uuid`,
    }),
  }),
);
```

### customer_journeys

Materialized journey records. Rebuilt periodically from touchpoints. Used for journey visualization and path analysis.

```typescript
export const customerJourneys = pgTable(
  'attribution_customer_journeys',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    userId: uuid('user_id').references(() => users.id),
    visitorId: text('visitor_id').notNull(),

    // Journey summary
    touchpointCount: integer('touchpoint_count').notNull().default(0),
    sessionCount: integer('session_count').notNull().default(0),
    channelCount: integer('channel_count').notNull().default(0),
    durationMs: bigint('duration_ms', { mode: 'number' }).notNull().default(0),

    // Stage
    currentStage: text('current_stage').notNull().default('awareness'),
    hasConverted: boolean('has_converted').notNull().default(false),
    conversionIds: jsonb('conversion_ids').$type<string[]>().default([]),

    // Timeline
    firstTouchAt: timestamp('first_touch_at', { withTimezone: true }).notNull(),
    lastTouchAt: timestamp('last_touch_at', { withTimezone: true }).notNull(),

    // Channel path (ordered list of channels visited)
    channelPath: jsonb('channel_path').$type<string[]>().default([]),

    // Full touchpoint IDs (ordered)
    touchpointIds: jsonb('touchpoint_ids').$type<string[]>().default([]),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantUserIdx: index('idx_cj_tenant_user').on(table.tenantId, table.userId),
    tenantVisitorIdx: index('idx_cj_tenant_visitor').on(table.tenantId, table.visitorId),
    tenantConvertedIdx: index('idx_cj_tenant_converted').on(table.tenantId, table.hasConverted),
    tenantStageIdx: index('idx_cj_tenant_stage').on(table.tenantId, table.currentStage),

    tenantIsolation: pgPolicy('journeys_tenant_isolation', {
      as: 'permissive',
      for: 'all',
      using: sql`tenant_id = current_setting('app.tenant_id')::uuid`,
    }),
  }),
);
```

### channel_groups

Configurable channel grouping rules. System defaults are seeded on tenant creation.

```typescript
export const channelGroups = pgTable(
  'attribution_channel_groups',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    name: text('name').notNull(),
    color: text('color').notNull().default('#6B7280'),
    icon: text('icon').notNull().default('channel'),
    rules: jsonb('rules').$type<ChannelGroupRule[]>().notNull(),
    priority: integer('priority').notNull().default(100),
    isSystem: boolean('is_system').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantNameUnique: uniqueIndex('idx_cg_tenant_name').on(table.tenantId, table.name),
    tenantPriorityIdx: index('idx_cg_tenant_priority').on(table.tenantId, table.priority),

    tenantIsolation: pgPolicy('channel_groups_tenant_isolation', {
      as: 'permissive',
      for: 'all',
      using: sql`tenant_id = current_setting('app.tenant_id')::uuid`,
    }),
  }),
);
```

### attribution_models

Stores model configurations per tenant, including custom model definitions.

```typescript
export const attributionModels = pgTable(
  'attribution_models',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    type: text('type').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    params: jsonb('params').$type<AttributionModelParams>().notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),

    // Data-driven model state
    markovMatrix: jsonb('markov_matrix').$type<Record<string, Record<string, number>>>(),
    lastTrainedAt: timestamp('last_trained_at', { withTimezone: true }),
    trainingSampleSize: integer('training_sample_size'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantTypeIdx: index('idx_am_tenant_type').on(table.tenantId, table.type),
    tenantDefaultIdx: index('idx_am_tenant_default').on(table.tenantId, table.isDefault),

    tenantIsolation: pgPolicy('models_tenant_isolation', {
      as: 'permissive',
      for: 'all',
      using: sql`tenant_id = current_setting('app.tenant_id')::uuid`,
    }),
  }),
);
```

### attribution_windows

Configurable lookback windows for attribution.

```typescript
export const attributionWindows = pgTable(
  'attribution_windows',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    name: text('name').notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    clickWindowDays: integer('click_window_days').notNull().default(30),
    viewWindowDays: integer('view_window_days').notNull().default(1),
    includeViewThrough: boolean('include_view_through').notNull().default(false),
    maxTouchpoints: integer('max_touchpoints').notNull().default(100),
    channelOverrides: jsonb('channel_overrides').$type<ChannelWindowOverride[]>().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantNameUnique: uniqueIndex('idx_aw_tenant_name').on(table.tenantId, table.name),

    tenantIsolation: pgPolicy('windows_tenant_isolation', {
      as: 'permissive',
      for: 'all',
      using: sql`tenant_id = current_setting('app.tenant_id')::uuid`,
    }),
  }),
);
```

### conversion_definitions

Configurable definitions of what constitutes a "conversion."

```typescript
export const conversionDefinitions = pgTable(
  'attribution_conversion_definitions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    name: text('name').notNull(),
    type: text('type').notNull(),
    description: text('description'),
    triggerEvent: text('trigger_event').notNull(),
    triggerConditions: jsonb('trigger_conditions').$type<Record<string, unknown>>().default({}),
    defaultValue: numeric('default_value', { precision: 12, scale: 2 }).notNull().default('0.00'),
    defaultCurrency: text('default_currency').notNull().default('USD'),
    isMicro: boolean('is_micro').notNull().default(false),
    modelOverride: text('model_override'),
    windowOverride: jsonb('window_override').$type<AttributionWindowConfig>(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantTypeUnique: uniqueIndex('idx_cd_tenant_type').on(table.tenantId, table.type),
    tenantEventIdx: index('idx_cd_tenant_event').on(table.tenantId, table.triggerEvent),

    tenantIsolation: pgPolicy('conv_defs_tenant_isolation', {
      as: 'permissive',
      for: 'all',
      using: sql`tenant_id = current_setting('app.tenant_id')::uuid`,
    }),
  }),
);
```

### SQL Views for Reporting

```sql
-- Materialized view: Channel performance (refreshed hourly)
CREATE MATERIALIZED VIEW mv_channel_performance AS
SELECT
  ar.tenant_id,
  ar.channel_group,
  ar.model,
  date_trunc('day', c.timestamp AT TIME ZONE 'UTC') AS day,
  SUM(ar.credit) AS attributed_conversions,
  SUM(ar.attributed_value) AS attributed_revenue,
  COUNT(DISTINCT c.id) AS conversion_count,
  COUNT(DISTINCT ar.touchpoint_id) AS touchpoint_count,
  COUNT(DISTINCT c.user_id) AS unique_users,
  AVG(ar.credit) AS avg_credit,
  AVG(ar.time_to_conversion) AS avg_time_to_conversion
FROM attribution_results ar
JOIN attribution_conversions c ON ar.conversion_id = c.id
WHERE ar.is_provisional = false
GROUP BY ar.tenant_id, ar.channel_group, ar.model, day
WITH DATA;

CREATE UNIQUE INDEX idx_mv_cp_unique
  ON mv_channel_performance (tenant_id, channel_group, model, day);

-- Materialized view: Campaign performance (refreshed hourly)
CREATE MATERIALIZED VIEW mv_campaign_performance AS
SELECT
  ar.tenant_id,
  ar.channel_group,
  ar.campaign,
  ar.source,
  ar.medium,
  ar.model,
  date_trunc('day', c.timestamp AT TIME ZONE 'UTC') AS day,
  SUM(ar.credit) AS attributed_conversions,
  SUM(ar.attributed_value) AS attributed_revenue,
  COUNT(DISTINCT c.id) AS conversion_count,
  COUNT(DISTINCT c.user_id) AS unique_users
FROM attribution_results ar
JOIN attribution_conversions c ON ar.conversion_id = c.id
WHERE ar.is_provisional = false
  AND ar.campaign IS NOT NULL
GROUP BY ar.tenant_id, ar.channel_group, ar.campaign, ar.source, ar.medium, ar.model, day
WITH DATA;

CREATE UNIQUE INDEX idx_mv_camp_unique
  ON mv_campaign_performance (tenant_id, channel_group, campaign, source, medium, model, day);

-- Function: Refresh materialized views
CREATE OR REPLACE FUNCTION refresh_attribution_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_channel_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_campaign_performance;
END;
$$ LANGUAGE plpgsql;
```

---

## Code Examples

### Example 1: Recording a Touchpoint from an HTTP Request

```typescript
import { AttributionService } from '@mcv/growth/attribution';

// Middleware or API route handler that captures touchpoints
async function handlePageView(req: Request, service: AttributionService) {
  const url = new URL(req.url);
  const queryParams: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  const touchpoint = await service.recordTouchpoint({
    visitorId: req.cookies.get('_mcv_vid') ?? generateVisitorId(),
    userId: req.auth?.userId,
    sessionId: req.cookies.get('_mcv_sid') ?? generateSessionId(),
    url: req.url,
    referrer: req.headers.get('referer') ?? undefined,
    queryParams,
    type: 'pageview',
    device: {
      type: detectDeviceType(req.headers.get('user-agent')),
      os: detectOS(req.headers.get('user-agent')),
      browser: detectBrowser(req.headers.get('user-agent')),
    },
    ip: req.headers.get('x-forwarded-for') ?? req.socket.remoteAddress,
    consentGranted: req.cookies.get('_mcv_consent') === 'granted',
  });

  console.log(`Touchpoint recorded: ${touchpoint.id}`);
  console.log(`  Channel: ${touchpoint.channelGroup}`);
  console.log(`  Source: ${touchpoint.source.raw}`);
  console.log(`  Campaign: ${touchpoint.utm.campaign ?? 'none'}`);

  // Example output:
  // Touchpoint recorded: tp_abc123
  //   Channel: Paid Search
  //   Source: google
  //   Campaign: spring_sale_2026
}
```

### Example 2: Recording a Conversion and Getting Attribution

```typescript
import { AttributionService } from '@mcv/growth/attribution';

async function handlePurchase(
  userId: string,
  visitorId: string,
  order: { id: string; total: number; currency: string; items: any[] },
  service: AttributionService,
) {
  // Record the conversion
  const conversion = await service.recordConversion({
    userId,
    visitorId,
    type: 'purchase',
    transactionId: order.id,
    value: {
      amount: order.total,
      currency: order.currency,
    },
    items: order.items.map((item) => ({
      itemId: item.sku,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      price: item.price,
    })),
    properties: {
      paymentMethod: 'credit_card',
      couponCode: order.couponCode ?? null,
    },
  });

  // Attribution is calculated automatically on conversion recording.
  // Fetch the conversion with attribution results:
  const attributed = await service.getConversion(conversion.id);

  if (attributed?.attribution) {
    console.log(`Conversion ${conversion.id} attributed:`);
    console.log(`  Model: ${attributed.attribution.model}`);
    console.log(`  Touchpoints considered: ${attributed.attribution.touchpointsConsidered}`);

    for (const credit of attributed.attribution.credits) {
      console.log(
        `  ${credit.channelGroup} (${credit.campaign ?? 'direct'}): ` +
        `${(credit.credit * 100).toFixed(1)}% = $${credit.attributedValue.toFixed(2)}`
      );
    }
  }

  // Example output:
  // Conversion conv_xyz789 attributed:
  //   Model: position_based
  //   Touchpoints considered: 4
  //   Paid Search (spring_sale_2026): 40.0% = $40.00
  //   Organic Social (none): 10.0% = $10.00
  //   Email (weekly_newsletter): 10.0% = $10.00
  //   Direct (direct): 40.0% = $40.00
}
```

### Example 3: Configuring Channel Groups

```typescript
import { AttributionService } from '@mcv/growth/attribution';

async function configureChannelGroups(service: AttributionService) {
  // Create a custom channel group for branded search
  await service.upsertChannelGroup({
    name: 'Branded Search',
    color: '#4F46E5',
    icon: 'search-brand',
    priority: 5, // Higher priority (lower number) than generic Paid Search
    rules: [
      {
        id: 'branded-campaign-rule',
        field: 'utm_campaign',
        operator: 'contains',
        value: 'brand',
        caseSensitive: false,
      },
      {
        id: 'branded-term-rule',
        field: 'utm_term' as any, // Extended field
        operator: 'matches_regex',
        value: '(mcv|mcvone|mcv\\.one)',
        caseSensitive: false,
      },
    ],
  });

  // Create a channel group for influencer partnerships
  await service.upsertChannelGroup({
    name: 'Influencer',
    color: '#EC4899',
    icon: 'users',
    priority: 15,
    rules: [
      {
        id: 'influencer-source-rule',
        field: 'utm_source',
        operator: 'starts_with',
        value: 'influencer_',
        caseSensitive: false,
      },
      {
        id: 'influencer-medium-rule',
        field: 'utm_medium',
        operator: 'equals',
        value: 'influencer',
        caseSensitive: false,
      },
    ],
  });

  // List all channel groups with their rules
  const groups = await service.getChannelGroups();
  for (const group of groups) {
    console.log(`${group.name} (priority: ${group.priority}, system: ${group.isSystem})`);
    for (const rule of group.rules) {
      console.log(`  ${rule.field} ${rule.operator} "${rule.value}"`);
    }
  }

  // Example output:
  // Branded Search (priority: 5, system: false)
  //   utm_campaign contains "brand"
  //   utm_term matches_regex "(mcv|mcvone|mcv\.one)"
  // Paid Search (priority: 10, system: true)
  //   medium equals "cpc"
  //   medium equals "ppc"
  // Paid Social (priority: 11, system: true)
  //   source in_list "facebook,instagram,twitter,linkedin,tiktok"
  //   medium equals "paid_social"
  // ...
}
```

### Example 4: Generating a Channel Contribution Report

```typescript
import { AttributionService } from '@mcv/growth/attribution';

async function generateMonthlyReport(service: AttributionService) {
  const report = await service.getChannelContribution({
    timeRange: {
      start: new Date('2026-01-01T00:00:00Z'),
      end: new Date('2026-01-31T23:59:59Z'),
      granularity: 'week',
      timezone: 'America/New_York',
    },
    model: 'position_based',
    includeCost: true,
    includeTrend: true,
    comparePreviousPeriod: true,
  });

  console.log('=== Channel Contribution Report ===');
  console.log(`Period: ${report.timeRange.start.toISOString()} — ${report.timeRange.end.toISOString()}`);
  console.log(`Model: ${report.model}`);
  console.log('');

  // Summary
  const s = report.summary;
  console.log(`Total Conversions: ${s.totalConversions}`);
  console.log(`Total Revenue: $${s.totalRevenue.toFixed(2)}`);
  console.log(`Total Cost: $${s.totalCost?.toFixed(2) ?? 'N/A'}`);
  console.log(`Blended ROAS: ${s.blendedRoas?.toFixed(2) ?? 'N/A'}x`);
  console.log(`Avg Conversion Value: $${s.avgConversionValue.toFixed(2)}`);
  console.log('');

  // Channel breakdown
  const channels = report.data as ChannelContribution[];
  console.log('Channel              | Conversions | Revenue    | ROAS  | CPA');
  console.log('---------------------|-------------|------------|-------|--------');
  for (const ch of channels) {
    console.log(
      `${ch.channel.padEnd(20)} | ` +
      `${ch.conversions.toFixed(1).padStart(11)} | ` +
      `$${ch.revenue.toFixed(2).padStart(9)} | ` +
      `${ch.roas?.toFixed(1).padStart(4) ?? ' N/A'}x | ` +
      `$${ch.cpa?.toFixed(2).padStart(6) ?? '   N/A'}`
    );
  }

  // Example output:
  // === Channel Contribution Report ===
  // Period: 2026-01-01T00:00:00.000Z — 2026-01-31T23:59:59.000Z
  // Model: position_based
  //
  // Total Conversions: 1,247
  // Total Revenue: $124,700.00
  // Total Cost: $31,450.00
  // Blended ROAS: 3.96x
  // Avg Conversion Value: $99.96
  //
  // Channel              | Conversions | Revenue    | ROAS  | CPA
  // ---------------------|-------------|------------|-------|--------
  // Paid Search          |       412.3 | $41,230.00 |  4.2x | $ 24.21
  // Organic Search       |       287.1 | $28,710.00 |  N/Ax |    N/A
  // Email                |       198.5 | $19,850.00 |  N/Ax |    N/A
  // Paid Social          |       156.8 | $15,680.00 |  2.8x | $ 35.71
  // Direct               |       102.4 | $10,240.00 |  N/Ax |    N/A
  // Referral             |        54.2 |  $5,420.00 |  N/Ax |    N/A
  // Organic Social       |        35.7 |  $3,570.00 |  N/Ax |    N/A
}
```

### Example 5: Comparing Attribution Models

```typescript
import { AttributionService } from '@mcv/growth/attribution';

async function compareModels(service: AttributionService) {
  const report = await service.compareModels(
    {
      timeRange: {
        start: new Date('2026-01-01T00:00:00Z'),
        end: new Date('2026-01-31T23:59:59Z'),
        granularity: 'month',
        timezone: 'UTC',
      },
    },
    ['first_touch', 'last_touch', 'linear', 'time_decay', 'position_based', 'data_driven'],
  );

  const data = report.data as ModelComparisonData;

  console.log('=== Model Comparison: Revenue Attribution by Channel ===\n');

  // Build comparison table
  const channels = data.channels;
  const models = data.models;

  // Header
  const header = 'Channel'.padEnd(20) + models.map((m) => m.padEnd(14)).join('');
  console.log(header);
  console.log('-'.repeat(header.length));

  for (const channel of channels) {
    let row = channel.name.padEnd(20);
    for (const model of models) {
      const value = channel.revenueByModel[model];
      row += `$${value.toFixed(0).padStart(12)}  `;
    }
    console.log(row);
  }

  // Example output:
  // === Model Comparison: Revenue Attribution by Channel ===
  //
  // Channel             first_touch   last_touch    linear        time_decay    position_based data_driven
  // ----------------------------------------------------------------------------------------------------
  // Paid Search         $52,340       $38,120       $41,230       $39,880       $41,230        $43,560
  // Organic Search      $31,200       $24,890       $28,710       $26,340       $28,710        $27,890
  // Email               $8,420        $28,450       $19,850       $24,120       $19,850        $21,340
  // Paid Social         $18,940       $12,340       $15,680       $13,980       $15,680        $14,560
  // Direct              $3,800        $15,900       $10,240       $13,120       $10,240        $9,870
  // Referral            $7,500        $3,200        $5,420        $4,160        $5,420         $4,980
  // Organic Social      $2,500        $1,800        $3,570        $3,100        $3,570         $2,500
}
```

### Example 6: Setting Up Real-Time Attribution with Redpanda

```typescript
import {
  AttributionStreamProcessor,
  TouchpointIngestionStream,
  ConversionStream,
} from '@mcv/growth/attribution';

async function setupRealtimeAttribution() {
  // Initialize stream processor
  const processor = new AttributionStreamProcessor({
    brokers: [process.env.REDPANDA_BROKER!],
    consumerGroupId: 'attribution-engine',
    touchpointTopic: 'attribution.touchpoints.v1',
    conversionTopic: 'attribution.conversions.v1',
    resultsTopic: 'attribution.results.v1',
    defaultModel: 'position_based',
    windowConfig: {
      clickWindowDays: 30,
      viewWindowDays: 1,
      includeViewThrough: false,
      maxTouchpoints: 100,
    },
  });

  // Register event handlers
  processor.on('touchpoint', (touchpoint) => {
    console.log(`[Stream] Touchpoint ingested: ${touchpoint.id} → ${touchpoint.channelGroup}`);
  });

  processor.on('conversion', (conversion) => {
    console.log(`[Stream] Conversion detected: ${conversion.id} ($${conversion.value.amount})`);
  });

  processor.on('attribution', (result) => {
    console.log(`[Stream] Attribution computed for conversion ${result.conversionId}:`);
    for (const credit of result.credits) {
      console.log(
        `  ${credit.channelGroup}: ${(credit.credit * 100).toFixed(1)}% ($${credit.attributedValue.toFixed(2)})`
      );
    }
  });

  processor.on('error', (error) => {
    console.error(`[Stream] Attribution error:`, error);
  });

  // Start processing
  await processor.start();
  console.log('Real-time attribution processor started');

  // Produce a touchpoint event (from your web server)
  const ingestion = new TouchpointIngestionStream({
    brokers: [process.env.REDPANDA_BROKER!],
    topic: 'attribution.touchpoints.v1',
  });

  await ingestion.publish({
    tenantId: 'tenant_abc',
    visitorId: 'vis_12345',
    sessionId: 'sess_67890',
    url: 'https://example.com/pricing?utm_source=google&utm_medium=cpc&utm_campaign=spring_sale',
    referrer: 'https://www.google.com/search?q=example+pricing',
    timestamp: new Date(),
    consentGranted: true,
  });

  // Later, produce a conversion event
  const conversionStream = new ConversionStream({
    brokers: [process.env.REDPANDA_BROKER!],
    topic: 'attribution.conversions.v1',
  });

  await conversionStream.publish({
    tenantId: 'tenant_abc',
    userId: 'user_abc',
    visitorId: 'vis_12345',
    type: 'purchase',
    value: { amount: 99.99, currency: 'USD' },
    transactionId: 'order_123',
    timestamp: new Date(),
  });

  // The processor will automatically:
  // 1. Match the conversion to the visitor's journey
  // 2. Apply the attribution model
  // 3. Publish results to the results topic
  // 4. Store provisional results in the database
}
```

### Example 7: Integrating with Meta Conversions API (CAPI)

```typescript
import { AttributionService, MetaCAPIConnector } from '@mcv/growth/attribution';

async function setupMetaCAPI(service: AttributionService) {
  // Configure Meta CAPI integration
  await service.updateConfig({
    integrations: [
      {
        platform: 'meta_capi',
        enabled: true,
        credentials: {
          pixelId: process.env.META_PIXEL_ID!,
          accessToken: process.env.META_CAPI_ACCESS_TOKEN!,
          testEventCode: process.env.META_TEST_EVENT_CODE, // Optional for testing
        },
        syncFrequency: 'realtime',
        conversionTypes: ['purchase', 'signup', 'add_to_cart'],
      },
    ],
  });

  // Manual sync for specific conversions
  const result = await service.syncToMetaCAPI([
    'conv_abc123',
    'conv_def456',
    'conv_ghi789',
  ]);

  console.log(`Meta CAPI sync complete:`);
  console.log(`  Events sent: ${result.eventsSent}`);
  console.log(`  Accepted: ${result.eventsAccepted}`);
  console.log(`  Rejected: ${result.eventsRejected}`);

  if (result.rejections.length > 0) {
    console.log(`  Rejection details:`);
    for (const rejection of result.rejections) {
      console.log(`    ${rejection.conversionId}: ${rejection.reason}`);
    }
  }

  // The Meta CAPI connector sends server-side events that include:
  // - Event name (Purchase, Lead, etc.)
  // - Event time
  // - User data (hashed email, phone, fbp, fbc — if available)
  // - Custom data (value, currency, content_ids)
  // - Event source URL
  // - Action source (always 'website' for web conversions)

  // Example output:
  // Meta CAPI sync complete:
  //   Events sent: 3
  //   Accepted: 3
  //   Rejected: 0
}

// Direct CAPI connector usage for advanced scenarios
async function advancedCAPIUsage() {
  const capi = new MetaCAPIConnector({
    pixelId: process.env.META_PIXEL_ID!,
    accessToken: process.env.META_CAPI_ACCESS_TOKEN!,
  });

  // Send a custom event
  await capi.sendEvent({
    eventName: 'Purchase',
    eventTime: Math.floor(Date.now() / 1000),
    userData: {
      em: hashSHA256('user@example.com'), // Hashed email
      ph: hashSHA256('+1234567890'),      // Hashed phone
      fbc: 'fb.1.1234567890.AbCdEfGh',   // Facebook click ID cookie
      fbp: 'fb.1.1234567890.1234567890',  // Facebook browser ID cookie
      clientIpAddress: '0.0.0.0',         // Anonymized
      clientUserAgent: req.headers['user-agent'],
    },
    customData: {
      value: 99.99,
      currency: 'USD',
      contentIds: ['prod_123'],
      contentType: 'product',
    },
    eventSourceUrl: 'https://example.com/thank-you',
    actionSource: 'website',
  });
}
```

### Example 8: GDPR-Compliant Data Deletion

```typescript
import { AttributionService } from '@mcv/growth/attribution';

async function handleGDPRDeletionRequest(
  userId: string,
  service: AttributionService,
) {
  console.log(`Processing GDPR deletion request for user ${userId}...`);

  // Step 1: Check what data exists
  const journey = await service.getJourney(userId);
  if (journey) {
    console.log(`Found journey with ${journey.touchpoints.length} touchpoints`);
    console.log(`Conversions: ${journey.conversionIds.length}`);
  }

  // Step 2: Delete all personal data
  const result = await service.deleteUserData(userId);

  console.log(`Deletion complete:`);
  console.log(`  Touchpoints deleted: ${result.touchpointsDeleted}`);
  console.log(`  Journeys deleted: ${result.journeysDeleted}`);
  console.log(`  Attribution results deleted: ${result.attributionResultsDeleted}`);
  console.log(`  Conversions anonymized: ${result.conversionsAnonymized}`);
  console.log(`  Confirmation token: ${result.confirmationToken}`);
  console.log(`  Deleted at: ${result.deletedAt.toISOString()}`);

  // Note: Conversions are anonymized, not deleted, to preserve aggregate
  // reporting accuracy. The user_id is set to null and all PII is removed.
  // The conversion value and channel attribution are retained for aggregate stats.

  // Step 3: Also anonymize any visitor sessions associated with this user
  const touchpoints = await service.getTouchpointsByUser(userId);
  const visitorIds = [...new Set(touchpoints.map((tp) => tp.visitorId))];

  for (const visitorId of visitorIds) {
    await service.anonymizeVisitor(visitorId);
    console.log(`Anonymized visitor session: ${visitorId}`);
  }

  // Step 4: Store audit trail
  // The confirmation token should be stored in your compliance audit log
  // as proof that the deletion was processed.

  return {
    success: true,
    confirmationToken: result.confirmationToken,
    deletedAt: result.deletedAt,
  };

  // Example output:
  // Processing GDPR deletion request for user user_abc...
  // Found journey with 23 touchpoints
  // Conversions: 3
  // Deletion complete:
  //   Touchpoints deleted: 23
  //   Journeys deleted: 1
  //   Attribution results deleted: 12
  //   Conversions anonymized: 3
  //   Confirmation token: gdpr_del_a1b2c3d4e5f6
  //   Deleted at: 2026-02-08T15:30:00.000Z
  // Anonymized visitor session: vis_12345
  // Anonymized visitor session: vis_67890
}
```

---

## Error Codes

All errors extend from `AttributionError` and include a machine-readable `code`, a human-readable `message`, and optional `details` object.

| Code | Name | HTTP | Description |
|---|---|---|---|
| `ATTR_TOUCHPOINT_INVALID` | Invalid Touchpoint | 400 | Touchpoint payload failed validation. Missing required fields or invalid format. |
| `ATTR_TOUCHPOINT_DUPLICATE` | Duplicate Touchpoint | 409 | A touchpoint with the same visitor, session, timestamp, and URL already exists. |
| `ATTR_TOUCHPOINT_CONSENT_DENIED` | Consent Not Granted | 403 | Touchpoint collection blocked because marketing consent was not granted and `requireConsent` is enabled. |
| `ATTR_TOUCHPOINT_RATE_LIMITED` | Rate Limited | 429 | Too many touchpoints from the same visitor in a short period. Possible bot traffic. |
| `ATTR_TOUCHPOINT_NOT_FOUND` | Touchpoint Not Found | 404 | The specified touchpoint ID does not exist or is not accessible in this tenant. |
| `ATTR_CONVERSION_INVALID` | Invalid Conversion | 400 | Conversion payload failed validation. Missing user ID, invalid value, or unknown type. |
| `ATTR_CONVERSION_DUPLICATE` | Duplicate Conversion | 409 | A conversion with the same transaction ID already exists for this tenant. Deduplication prevented double-counting. |
| `ATTR_CONVERSION_NO_TOUCHPOINTS` | No Touchpoints | 422 | Cannot attribute conversion — no touchpoints found within the attribution window for this user. |
| `ATTR_CONVERSION_NOT_FOUND` | Conversion Not Found | 404 | The specified conversion ID does not exist or is not accessible in this tenant. |
| `ATTR_CONVERSION_DEFINITION_NOT_FOUND` | Definition Not Found | 404 | The specified conversion definition ID does not exist or is inactive. |
| `ATTR_MODEL_INVALID` | Invalid Model | 400 | The specified attribution model type is not recognized or not configured. |
| `ATTR_MODEL_INSUFFICIENT_DATA` | Insufficient Data | 422 | Data-driven model requires more conversion data to produce reliable results. Falls back to the configured fallback model. |
| `ATTR_MODEL_CALCULATION_FAILED` | Calculation Failed | 500 | Attribution model threw an unexpected error during credit calculation. |
| `ATTR_MODEL_CREDITS_INVALID` | Invalid Credits | 500 | Model returned credits that don't sum to 1.0 or contain negative values. Internal consistency check failed. |
| `ATTR_JOURNEY_NOT_FOUND` | Journey Not Found | 404 | No customer journey exists for the specified user or visitor. |
| `ATTR_JOURNEY_MERGE_CONFLICT` | Journey Merge Conflict | 409 | Cannot merge visitor journey into user journey — the user already has a journey from a different visitor. Manual resolution required. |
| `ATTR_JOURNEY_TOO_LARGE` | Journey Too Large | 422 | Journey exceeds the maximum touchpoint count (`maxTouchpoints`). Oldest touchpoints are trimmed. |
| `ATTR_WINDOW_INVALID` | Invalid Window | 400 | Attribution window configuration is invalid. Click window must be ≥ 1 day, view window must be ≥ 0 days. |
| `ATTR_WINDOW_NOT_FOUND` | Window Not Found | 404 | The specified attribution window ID does not exist. |
| `ATTR_CHANNEL_GROUP_INVALID` | Invalid Channel Group | 400 | Channel group configuration is invalid. Rules cannot be empty, and regex patterns must be valid. |
| `ATTR_CHANNEL_GROUP_SYSTEM` | System Group Protected | 403 | Cannot delete or rename a system-defined channel group. You can modify its rules or deactivate it. |
| `ATTR_CHANNEL_GROUP_NOT_FOUND` | Channel Group Not Found | 404 | The specified channel group ID does not exist. |
| `ATTR_REPORT_TIMEOUT` | Report Timeout | 504 | Report generation exceeded the maximum allowed time. Reduce the time range or simplify filters. |
| `ATTR_REPORT_NO_DATA` | No Report Data | 404 | No attribution data found for the specified query parameters and time range. |
| `ATTR_INTEGRATION_AUTH_FAILED` | Integration Auth Failed | 401 | Authentication with external platform failed. Check API credentials. |
| `ATTR_INTEGRATION_RATE_LIMITED` | Integration Rate Limited | 429 | External platform rate limit reached. Events will be retried automatically. |
| `ATTR_INTEGRATION_SYNC_FAILED` | Integration Sync Failed | 502 | Failed to sync data with external platform. Check network connectivity and platform status. |
| `ATTR_PRIVACY_DELETION_FAILED` | Deletion Failed | 500 | GDPR data deletion request could not be fully completed. Partial deletion may have occurred. Retry required. |
| `ATTR_PRIVACY_ANONYMIZATION_FAILED` | Anonymization Failed | 500 | Data anonymization process failed. The original data remains intact. |
| `ATTR_CONFIG_INVALID` | Invalid Configuration | 400 | Tenant attribution configuration is invalid. Check model parameters, window settings, and privacy config. |
| `ATTR_STREAM_CONNECTION_FAILED` | Stream Connection Failed | 503 | Cannot connect to Redpanda broker for real-time attribution. Falling back to batch processing. |
| `ATTR_STREAM_DESERIALIZATION_ERROR` | Stream Deserialization Error | 400 | Received a malformed message on an attribution stream topic. Message skipped. |
| `ATTR_BATCH_PARTIAL_FAILURE` | Batch Partial Failure | 207 | Batch attribution completed with some failures. Check the `errors` array for details. |
| `ATTR_TENANT_NOT_CONFIGURED` | Tenant Not Configured | 412 | Attribution has not been configured for this tenant. Call `updateConfig()` first. |

### Error Handling Pattern

```typescript
import { AttributionError, TouchpointError } from '@mcv/growth/attribution';

try {
  await service.recordTouchpoint(input);
} catch (error) {
  if (error instanceof TouchpointError) {
    switch (error.code) {
      case 'ATTR_TOUCHPOINT_CONSENT_DENIED':
        // Expected — user hasn't consented. Log silently.
        logger.debug('Touchpoint skipped: no consent', { visitorId: input.visitorId });
        break;

      case 'ATTR_TOUCHPOINT_DUPLICATE':
        // Expected — page reload or double-click. Ignore.
        break;

      case 'ATTR_TOUCHPOINT_RATE_LIMITED':
        // Possible bot. Flag for review.
        await flagSuspiciousVisitor(input.visitorId);
        break;

      case 'ATTR_TOUCHPOINT_INVALID':
        // Bug in our code. Alert.
        logger.error('Invalid touchpoint payload', { error: error.details, input });
        break;

      default:
        throw error;
    }
  } else if (error instanceof AttributionError) {
    // Generic attribution error
    logger.error('Attribution error', { code: error.code, message: error.message });
  } else {
    throw error;
  }
}
```

---

## Security

### Multi-Tenant Isolation

All database tables enforce Row-Level Security (RLS) policies scoped to `tenant_id`. The tenant context is set via `app.tenant_id` PostgreSQL session variable, injected by the Supabase middleware layer:

```sql
-- Every query is automatically filtered
SET app.tenant_id = '<tenant-uuid>';

-- RLS policy on every table
CREATE POLICY tenant_isolation ON attribution_touchpoints
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

**Guarantees:**
- Tenant A's touchpoints are invisible to Tenant B's queries
- Cross-tenant joins are impossible at the database level
- Even raw SQL access (if somehow obtained) cannot bypass RLS
- Superuser access requires explicit RLS bypass (`SET ROLE`)

### API Authorization

The tRPC router enforces role-based access control:

| Operation | Required Role | Notes |
|---|---|---|
| Record touchpoint | `public` (via API key) | API key scoped to tenant |
| Record conversion | `public` (via API key) | Deduplicated by transaction ID |
| View reports | `growth:read` | Dashboard access |
| Configure models | `growth:admin` | Changes affect all future attribution |
| Configure channels | `growth:admin` | Changes affect classification |
| Manage integrations | `growth:admin` | Credentials access |
| Delete user data | `compliance:admin` | GDPR deletion requests |
| Batch recalculation | `growth:admin` | Resource-intensive operation |
| Export finance data | `finance:read` | Cross-domain access |

### Data Protection

**Touchpoint PII handling:**
- IP addresses are truncated to /24 (IPv4) or /48 (IPv6) before storage when `anonymizeIp` is enabled (default: true)
- User-Agent strings are parsed into device type/OS/browser categories — the raw string is not stored
- Exact page URLs may contain PII in query parameters — configurable URL sanitization strips specified parameters
- Email addresses in UTM parameters are detected and hashed automatically
- No cookies are set by the attribution module — it reads existing cookies set by the host application

**Click ID handling:**
- Click IDs (gclid, fbclid, etc.) are stored for deduplication and platform integration
- They are considered pseudonymous identifiers under GDPR
- They are included in GDPR deletion requests
- They are not shared between tenants

**Credential security:**
- Integration credentials (API keys, access tokens) are encrypted at rest using AES-256-GCM
- Credentials are never included in API responses — only a masked preview (`****last4`)
- Credential rotation is supported without downtime
- Service account permissions follow least-privilege principle

### Rate Limiting

Touchpoint ingestion is rate-limited per visitor to prevent abuse:

| Tier | Limit | Window | Action |
|---|---|---|---|
| Normal | 100 touchpoints | 1 minute | Accept |
| Elevated | 101–500 touchpoints | 1 minute | Accept with warning flag |
| Suspicious | 501+ touchpoints | 1 minute | Reject with `ATTR_TOUCHPOINT_RATE_LIMITED` |

Batch API endpoints (report generation, recalculation) have per-tenant concurrency limits:

| Operation | Max Concurrent | Timeout |
|---|---|---|
| Report generation | 5 | 30 seconds |
| Batch attribution | 1 | 10 minutes |
| Data export | 2 | 5 minutes |

### Audit Trail

All configuration changes are logged to the audit table:

```typescript
interface AttributionAuditEntry {
  id: string;
  tenantId: string;
  userId: string;
  action: 'config_update' | 'model_change' | 'channel_group_update' | 'window_update' |
          'definition_update' | 'integration_update' | 'data_deletion' | 'batch_recalculation';
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  ip: string;
  userAgent: string;
  timestamp: Date;
}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ATTRIBUTION_ENABLED` | No | `true` | Master switch for the attribution module. Set to `false` to disable all collection and processing. |
| `ATTRIBUTION_DEFAULT_MODEL` | No | `position_based` | Default attribution model type for new tenants. One of: `first_touch`, `last_touch`, `linear`, `time_decay`, `position_based`, `data_driven`. |
| `ATTRIBUTION_DEFAULT_CLICK_WINDOW_DAYS` | No | `30` | Default click-through attribution window in days. |
| `ATTRIBUTION_DEFAULT_VIEW_WINDOW_DAYS` | No | `1` | Default view-through attribution window in days. |
| `ATTRIBUTION_SESSION_TIMEOUT_MINUTES` | No | `30` | Inactivity timeout for session grouping. |
| `ATTRIBUTION_MAX_TOUCHPOINTS_PER_JOURNEY` | No | `500` | Maximum touchpoints stored per customer journey. Oldest are trimmed when exceeded. |
| `ATTRIBUTION_BATCH_INTERVAL_MINUTES` | No | `60` | How often the batch attribution processor runs. |
| `ATTRIBUTION_BATCH_SIZE` | No | `1000` | Number of conversions processed per batch iteration. |
| `ATTRIBUTION_REALTIME_ENABLED` | No | `false` | Enable real-time attribution via Redpanda stream processing. |
| `ATTRIBUTION_IP_ANONYMIZE` | No | `true` | Whether to anonymize IP addresses before storage. |
| `ATTRIBUTION_REQUIRE_CONSENT` | No | `true` | Whether marketing consent is required before storing touchpoints. |
| `ATTRIBUTION_NO_CONSENT_BEHAVIOR` | No | `anonymize` | Behavior when consent is not granted: `drop`, `anonymize`, or `collect_minimal`. |
| `ATTRIBUTION_RESPECT_DNT` | No | `true` | Whether to honor the Do Not Track browser header. |
| `ATTRIBUTION_COOKIELESS_MODE` | No | `false` | Enable cookieless (fully server-side) attribution mode. |
| `ATTRIBUTION_TOUCHPOINT_RETENTION_DAYS` | No | `365` | Days to retain raw touchpoint data. |
| `ATTRIBUTION_RESULT_RETENTION_DAYS` | No | `730` | Days to retain individual attribution results. |
| `ATTRIBUTION_REPORT_RETENTION_DAYS` | No | `1095` | Days to retain cached report data. |
| `ATTRIBUTION_REPORT_TIMEOUT_MS` | No | `30000` | Maximum time allowed for report generation (milliseconds). |
| `ATTRIBUTION_RATE_LIMIT_PER_MINUTE` | No | `100` | Maximum touchpoints per visitor per minute. |
| `ATTRIBUTION_MV_REFRESH_INTERVAL_MINUTES` | No | `60` | How often to refresh materialized views. |
| `ATTRIBUTION_DATA_DRIVEN_MIN_CONVERSIONS` | No | `200` | Minimum conversions required for data-driven model reliability. |
| `ATTRIBUTION_DATA_DRIVEN_LOOKBACK_DAYS` | No | `90` | Historical window for Markov chain calculation. |
| `ATTRIBUTION_DATA_DRIVEN_RECALC_HOURS` | No | `24` | How often to retrain the data-driven model. |
| `REDPANDA_BROKER` | If realtime | — | Redpanda broker address(es) for stream processing. Comma-separated for multiple brokers. |
| `REDPANDA_SASL_USERNAME` | If realtime | — | SASL username for Redpanda authentication. |
| `REDPANDA_SASL_PASSWORD` | If realtime | — | SASL password for Redpanda authentication. |
| `META_PIXEL_ID` | If Meta CAPI | — | Meta Pixel ID for Conversions API integration. |
| `META_CAPI_ACCESS_TOKEN` | If Meta CAPI | — | Meta Conversions API access token. |
| `META_TEST_EVENT_CODE` | No | — | Meta test event code for CAPI debugging (remove in production). |
| `GOOGLE_ADS_CUSTOMER_ID` | If Google Ads | — | Google Ads customer ID for conversion upload. |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | If Google Ads | — | Google Ads API developer token. |
| `GOOGLE_ADS_OAUTH_CLIENT_ID` | If Google Ads | — | OAuth client ID for Google Ads API. |
| `GOOGLE_ADS_OAUTH_CLIENT_SECRET` | If Google Ads | — | OAuth client secret for Google Ads API. |
| `GOOGLE_ADS_OAUTH_REFRESH_TOKEN` | If Google Ads | — | OAuth refresh token for Google Ads API. |
| `ATTRIBUTION_ENCRYPTION_KEY` | Yes | — | AES-256 key for encrypting integration credentials at rest. Must be exactly 32 bytes (64 hex chars). |

---

## Dependencies

### Internal Dependencies

| Package | Purpose | Import Path |
|---|---|---|
| `@mcv/db` | Drizzle ORM, database connection, migration utilities | `@mcv/db` |
| `@mcv/auth` | Authentication context, user identity, tenant resolution | `@mcv/auth` |
| `@mcv/compliance` | Consent management, GDPR utilities, audit logging | `@mcv/compliance` |
| `@mcv/events` | Platform event bus for cross-module communication | `@mcv/events` |
| `@mcv/queue` | Job queue for batch attribution processing | `@mcv/queue` |
| `@mcv/cache` | Report caching and materialized view management | `@mcv/cache` |
| `@mcv/crypto` | Encryption utilities for credential storage | `@mcv/crypto` |
| `@mcv/telemetry` | Metrics, tracing, and logging | `@mcv/telemetry` |
| `@mcv/config` | Configuration management and environment variables | `@mcv/config` |
| `@mcv/shared/types` | Shared type definitions (tenants, users, etc.) | `@mcv/shared/types` |
| `@mcv/shared/validators` | Shared validation schemas (dates, UUIDs, etc.) | `@mcv/shared/validators` |

### External Dependencies

| Package | Version | Purpose | License |
|---|---|---|---|
| `drizzle-orm` | `^0.36.x` | Database ORM and query builder | Apache-2.0 |
| `@trpc/server` | `^11.x` | Type-safe API layer | MIT |
| `zod` | `^3.x` | Schema validation for inputs | MIT |
| `kafkajs` | `^2.x` | Redpanda/Kafka client for stream processing | MIT |
| `ua-parser-js` | `^2.x` | User-Agent string parsing for device detection | MIT |
| `tldts` | `^6.x` | Top-level domain extraction for referrer parsing | MIT |
| `date-fns` | `^4.x` | Date manipulation for time decay and windowing | MIT |
| `decimal.js` | `^10.x` | Precise decimal arithmetic for credit calculations | MIT |
| `crypto-js` | `^4.x` | SHA-256 hashing for PII (email, phone) before CAPI sync | MIT |
| `ioredis` | `^5.x` | Redis client for caching and rate limiting | MIT |
| `prom-client` | `^15.x` | Prometheus metrics for monitoring | Apache-2.0 |

### Peer Dependencies

| Package | Version | Notes |
|---|---|---|
| `@supabase/supabase-js` | `^2.x` | Required for Supabase RLS and real-time subscriptions |
| `typescript` | `^5.5` | Required for type inference |

---

## Testing

### Test Structure

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── models/
│   │   │   ├── first-touch.test.ts
│   │   │   ├── last-touch.test.ts
│   │   │   ├── linear.test.ts
│   │   │   ├── time-decay.test.ts
│   │   │   ├── position-based.test.ts
│   │   │   └── data-driven.test.ts
│   │   ├── parsers/
│   │   │   ├── utm.test.ts
│   │   │   ├── referrer.test.ts
│   │   │   ├── click-id.test.ts
│   │   │   └── channel-classifier.test.ts
│   │   ├── services/
│   │   │   ├── touchpoint-collector.test.ts
│   │   │   ├── journey-builder.test.ts
│   │   │   ├── attribution-engine.test.ts
│   │   │   └── attribution-reporter.test.ts
│   │   └── validators/
│   │       ├── touchpoint.test.ts
│   │       ├── conversion.test.ts
│   │       └── config.test.ts
│   ├── integration/
│   │   ├── attribution-flow.test.ts
│   │   ├── channel-classification.test.ts
│   │   ├── journey-merge.test.ts
│   │   ├── batch-attribution.test.ts
│   │   ├── report-generation.test.ts
│   │   ├── privacy-compliance.test.ts
│   │   └── multi-tenant-isolation.test.ts
│   ├── e2e/
│   │   ├── full-attribution-pipeline.test.ts
│   │   ├── realtime-attribution.test.ts
│   │   ├