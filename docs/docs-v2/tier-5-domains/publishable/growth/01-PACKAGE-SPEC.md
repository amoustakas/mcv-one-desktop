# @mcv/growth — Package Specification
## Tier 5: PUBLISHABLE Domains

**Package:** `@mcv/growth`  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Executive Summary

`@mcv/growth` provides a comprehensive growth and marketing automation platform for ventures. It encompasses multi-channel marketing campaigns, email marketing, SMS messaging, affiliate/referral programs, marketing attribution, advertising management, SEO tools, social media management, content marketing, creative asset management, educational content delivery, and website/landing page building.

**Key Capabilities:**
- Multi-channel marketing campaign orchestration
- Email marketing with templates, automation, and analytics
- SMS/MMS messaging with carrier compliance
- Affiliate and referral program management
- Multi-touch marketing attribution
- Ad platform integrations (Google, Meta, TikTok)
- SEO auditing and optimization tools
- Social media scheduling and analytics
- Content calendar and asset management
- Learning management system (LMS)
- Website and landing page builder

---

## Strategic Position

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VENTURE APPLICATIONS                               │
│                                                                              │
│    @mcv/commerce    @mcv/nexus    @mcv/people    @mcv/operations            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ growth data & automation
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               @mcv/growth                                    │
│                                                                              │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐     │
│  │ marketing │ │ campaigns │ │   email   │ │    sms    │ │affiliates │     │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘     │
│                                                                              │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐     │
│  │ referrals │ │attribution│ │    ads    │ │    seo    │ │  social   │     │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘     │
│                                                                              │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐                   │
│  │  content  │ │ creative  │ │ education │ │  website  │                   │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
           ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
           │ @mcv/comms  │   │@mcv/storage │   │@mcv/analytics│
           │             │   │             │   │              │
           │ Delivery    │   │ Assets      │   │ Tracking     │
           └─────────────┘   └─────────────┘   └─────────────┘
```

---

## Sub-Modules Overview

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| **marketing** | Core marketing infrastructure, segments, audiences | `Segment`, `Audience`, `MarketingEvent`, `Personalization` |
| **campaigns** | Multi-channel campaign orchestration | `Campaign`, `CampaignMessage`, `Automation`, `Journey` |
| **email-campaigns** | Email marketing with templates and automation | `EmailTemplate`, `EmailCampaign`, `EmailAutomation`, `Subscriber` |
| **sms** | SMS/MMS messaging with compliance | `SMSCampaign`, `SMSTemplate`, `PhoneNumber`, `OptOut` |
| **affiliates** | Affiliate program management | `Affiliate`, `Commission`, `Payout`, `AffiliateLink` |
| **referrals** | Customer referral programs | `ReferralProgram`, `Referral`, `Reward`, `ReferralCode` |
| **attribution** | Multi-touch marketing attribution | `TouchPoint`, `AttributionModel`, `Conversion`, `Channel` |
| **ads** | Advertising platform integrations | `AdAccount`, `AdCampaign`, `AdCreative`, `AdSpend` |
| **seo** | SEO auditing and optimization | `SEOAudit`, `Keyword`, `Backlink`, `SiteHealth` |
| **social** | Social media management | `SocialAccount`, `SocialPost`, `Schedule`, `SocialAnalytics` |
| **content** | Content marketing and calendar | `ContentPiece`, `ContentCalendar`, `ContentIdea`, `ContentWorkflow` |
| **creative** | Creative asset management | `Creative`, `AssetLibrary`, `Brand`, `Template` |
| **education** | Learning management system | `Course`, `Lesson`, `Enrollment`, `Certificate` |
| **website** | Website and landing page builder | `Site`, `Page`, `Block`, `Form`, `Domain` |

---

## Module: marketing

### Purpose

Core marketing infrastructure providing audience segmentation, personalization engine, event tracking, and A/B testing capabilities that power all other growth modules.

### Database Schema

```typescript
// @mcv/growth/marketing/schema.ts
import { pgTable, uuid, text, timestamp, jsonb, boolean, integer, numeric, pgEnum, index } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel/db';

export const segmentTypeEnum = pgEnum('segment_type', [
  'static', 'dynamic', 'predictive'
]);

export const segments = pgTable('growth_segments', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  type: segmentTypeEnum('type').default('dynamic'),
  
  // Dynamic segment conditions
  conditions: jsonb('conditions').$type<SegmentCondition[]>(),
  /*
    conditions: [
      { field: 'lastPurchaseDate', operator: 'within', value: '30d' },
      { field: 'totalSpent', operator: 'gte', value: 100 },
      { field: 'tags', operator: 'contains', value: 'vip' }
    ]
  */
  
  // Static segment members
  memberIds: uuid('member_ids').array(),
  
  // Predictive segment
  modelId: text('model_id'),
  predictionThreshold: numeric('prediction_threshold', { precision: 5, scale: 4 }),
  
  // Stats
  memberCount: integer('member_count').default(0),
  lastCalculatedAt: timestamp('last_calculated_at', { withTimezone: true }),
  
  // Usage
  isActive: boolean('is_active').default(true),
  usedInCampaigns: integer('used_in_campaigns').default(0),
}, (table) => [
  index('growth_segments_venture_idx').on(table.ventureId),
  index('growth_segments_type_idx').on(table.type),
]);

export type SegmentCondition = {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'not_contains' | 
            'starts_with' | 'ends_with' | 'in' | 'not_in' | 'within' | 'before' | 'after' |
            'is_set' | 'is_not_set';
  value: string | number | boolean | string[];
  logicalOperator?: 'AND' | 'OR';
};

export const audiences = pgTable('growth_audiences', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  
  // Composition
  includeSegmentIds: uuid('include_segment_ids').array().default([]),
  excludeSegmentIds: uuid('exclude_segment_ids').array().default([]),
  
  // Additional filters
  additionalFilters: jsonb('additional_filters').$type<SegmentCondition[]>(),
  
  // Suppression
  suppressionListId: uuid('suppression_list_id'),
  globalSuppression: boolean('global_suppression').default(true),
  
  // Stats
  estimatedSize: integer('estimated_size').default(0),
  lastEstimatedAt: timestamp('last_estimated_at', { withTimezone: true }),
  
  // Channel preferences
  preferredChannels: text('preferred_channels').array().default([]),
  
  isActive: boolean('is_active').default(true),
}, (table) => [
  index('growth_audiences_venture_idx').on(table.ventureId),
]);

export const marketingEvents = pgTable('growth_marketing_events', {
  ...baseColumns,
  
  // Event identification
  eventName: text('event_name').notNull(),
  eventCategory: text('event_category'), // pageview, click, conversion, custom
  
  // Subject
  contactId: uuid('contact_id'),
  anonymousId: text('anonymous_id'),
  sessionId: text('session_id'),
  
  // Context
  channel: text('channel'), // web, email, sms, push, social
  source: text('source'),
  medium: text('medium'),
  campaign: text('campaign'),
  
  // Event data
  properties: jsonb('properties').$type<Record<string, unknown>>(),
  
  // Attribution
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  utmContent: text('utm_content'),
  utmTerm: text('utm_term'),
  referrer: text('referrer'),
  
  // Device/Location
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  deviceType: text('device_type'),
  browser: text('browser'),
  os: text('os'),
  country: text('country'),
  region: text('region'),
  city: text('city'),
  
  // Page context
  pageUrl: text('page_url'),
  pageTitle: text('page_title'),
  pagePath: text('page_path'),
  
  // Timing
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
}, (table) => [
  index('growth_events_venture_idx').on(table.ventureId),
  index('growth_events_contact_idx').on(table.contactId),
  index('growth_events_name_idx').on(table.eventName),
  index('growth_events_occurred_idx').on(table.occurredAt),
  index('growth_events_session_idx').on(table.sessionId),
]);

export const personalizationRules = pgTable('growth_personalization_rules', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  
  // Targeting
  audienceId: uuid('audience_id').references(() => audiences.id),
  segmentId: uuid('segment_id').references(() => segments.id),
  conditions: jsonb('conditions').$type<SegmentCondition[]>(),
  
  // Content variations
  variations: jsonb('variations').$type<PersonalizationVariation[]>().notNull(),
  /*
    variations: [
      { 
        id: 'var-1', 
        weight: 50,
        content: { headline: 'Welcome back!', ctaText: 'Continue Shopping' }
      },
      { 
        id: 'var-2', 
        weight: 50,
        content: { headline: 'New arrivals!', ctaText: 'Shop Now' }
      }
    ]
  */
  
  // Targeting location
  targetType: text('target_type').notNull(), // page, component, email, sms
  targetId: text('target_id'),
  targetSelector: text('target_selector'),
  
  // Schedule
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  
  // Priority
  priority: integer('priority').default(0),
  
  // Status
  isActive: boolean('is_active').default(true),
  
  // Stats
  impressions: integer('impressions').default(0),
  conversions: integer('conversions').default(0),
}, (table) => [
  index('growth_personalization_venture_idx').on(table.ventureId),
  index('growth_personalization_active_idx').on(table.isActive),
]);

export type PersonalizationVariation = {
  id: string;
  name?: string;
  weight: number;
  content: Record<string, unknown>;
  impressions?: number;
  conversions?: number;
};

export const abTests = pgTable('growth_ab_tests', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  hypothesis: text('hypothesis'),
  
  // Test configuration
  testType: text('test_type').notNull(), // page, component, email, campaign
  targetId: text('target_id'),
  
  // Variants
  variants: jsonb('variants').$type<ABTestVariant[]>().notNull(),
  controlVariantId: text('control_variant_id'),
  
  // Traffic allocation
  trafficPercentage: integer('traffic_percentage').default(100),
  
  // Goal
  primaryGoal: text('primary_goal').notNull(), // conversion, revenue, engagement
  primaryGoalEvent: text('primary_goal_event'),
  secondaryGoals: jsonb('secondary_goals').$type<string[]>(),
  
  // Statistical settings
  confidenceLevel: integer('confidence_level').default(95),
  minimumSampleSize: integer('minimum_sample_size'),
  
  // Schedule
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  
  // Status
  status: text('status').default('draft'), // draft, running, paused, completed, archived
  winnerVariantId: text('winner_variant_id'),
  
  // Results
  results: jsonb('results').$type<ABTestResults>(),
  
  // Audience
  audienceId: uuid('audience_id'),
}, (table) => [
  index('growth_ab_tests_venture_idx').on(table.ventureId),
  index('growth_ab_tests_status_idx').on(table.status),
]);

export type ABTestVariant = {
  id: string;
  name: string;
  description?: string;
  weight: number;
  content: Record<string, unknown>;
  impressions: number;
  conversions: number;
  revenue?: number;
};

export type ABTestResults = {
  winner?: string;
  confidence: number;
  lift: number;
  pValue: number;
  sampleSize: number;
  duration: number;
  variantStats: Record<string, {
    impressions: number;
    conversions: number;
    conversionRate: number;
    revenue?: number;
    revenuePerVisitor?: number;
  }>;
};

export const suppressionLists = pgTable('growth_suppression_lists', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  
  // Type
  type: text('type').notNull(), // global, campaign, channel
  channel: text('channel'), // email, sms, push
  
  // Entries stored separately for scalability
  entryCount: integer('entry_count').default(0),
  
  isActive: boolean('is_active').default(true),
});

export const suppressionListEntries = pgTable('growth_suppression_entries', {
  ...baseColumns,
  listId: uuid('list_id').references(() => suppressionLists.id).notNull(),
  
  // Identifier
  identifier: text('identifier').notNull(), // email, phone, contactId
  identifierType: text('identifier_type').notNull(), // email, phone, contact_id
  
  // Reason
  reason: text('reason'),
  reasonCode: text('reason_code'), // unsubscribe, bounce, complaint, manual
  
  // Source
  source: text('source'),
  sourceId: text('source_id'),
  
  addedAt: timestamp('added_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('growth_suppression_list_idx').on(table.listId),
  index('growth_suppression_identifier_idx').on(table.identifier),
]);
```

### Service Implementation

```typescript
// @mcv/growth/marketing/service.ts
import { db, getContext, NotFoundError, ValidationError } from '@mcv/kernel';
import { 
  segments, audiences, marketingEvents, personalizationRules, 
  abTests, suppressionLists, suppressionListEntries 
} from './schema';
import { contacts } from '@mcv/nexus/crm/schema';
import { eq, and, sql, inArray, or, isNull, gte, lte, desc, asc } from 'drizzle-orm';
import type { 
  Segment, CreateSegmentInput, Audience, CreateAudienceInput,
  MarketingEvent, PersonalizationResult, ABTest 
} from './types';

export class SegmentService {
  
  /**
   * Create a new segment
   */
  async create(input: CreateSegmentInput): Promise<Segment> {
    const ctx = getContext();
    
    const [segment] = await db.insert(segments).values({
      ventureId: ctx.venture.id,
      name: input.name,
      description: input.description,
      type: input.type || 'dynamic',
      conditions: input.conditions,
      memberIds: input.memberIds,
      isActive: true,
      createdBy: ctx.user?.id,
      updatedBy: ctx.user?.id,
    }).returning();
    
    // Calculate initial member count
    if (segment.type === 'dynamic') {
      await this.recalculateSegment(segment.id);
    } else if (segment.memberIds) {
      await db.update(segments)
        .set({ memberCount: segment.memberIds.length })
        .where(eq(segments.id, segment.id));
    }
    
    return segment;
  }
  
  /**
   * Recalculate dynamic segment membership
   */
  async recalculateSegment(segmentId: string): Promise<number> {
    const ctx = getContext();
    
    const segment = await db.query.segments.findFirst({
      where: and(
        eq(segments.id, segmentId),
        eq(segments.ventureId, ctx.venture.id)
      ),
    });
    
    if (!segment) {
      throw new NotFoundError('Segment', segmentId);
    }
    
    if (segment.type !== 'dynamic' || !segment.conditions) {
      return segment.memberCount ?? 0;
    }
    
    // Build dynamic query from conditions
    const whereClause = this.buildConditionsQuery(segment.conditions);
    
    const [{ count }] = await db.select({ count: sql<number>`count(*)` })
      .from(contacts)
      .where(and(
        eq(contacts.ventureId, ctx.venture.id),
        isNull(contacts.deletedAt),
        whereClause
      ));
    
    await db.update(segments)
      .set({
        memberCount: count,
        lastCalculatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(segments.id, segmentId));
    
    return count;
  }
  
  /**
   * Check if a contact belongs to a segment
   */
  async isContactInSegment(contactId: string, segmentId: string): Promise<boolean> {
    const ctx = getContext();
    
    const segment = await db.query.segments.findFirst({
      where: and(
        eq(segments.id, segmentId),
        eq(segments.ventureId, ctx.venture.id)
      ),
    });
    
    if (!segment) return false;
    
    if (segment.type === 'static') {
      return segment.memberIds?.includes(contactId) ?? false;
    }
    
    // For dynamic segments, check conditions
    const contact = await db.query.contacts.findFirst({
      where: eq(contacts.id, contactId),
    });
    
    if (!contact) return false;
    
    return this.evaluateConditions(contact, segment.conditions ?? []);
  }
  
  /**
   * Get all contacts in a segment
   */
  async getSegmentMembers(
    segmentId: string, 
    options?: { limit?: number; offset?: number }
  ): Promise<{ members: any[]; total: number }> {
    const ctx = getContext();
    
    const segment = await db.query.segments.findFirst({
      where: and(
        eq(segments.id, segmentId),
        eq(segments.ventureId, ctx.venture.id)
      ),
    });
    
    if (!segment) {
      throw new NotFoundError('Segment', segmentId);
    }
    
    if (segment.type === 'static' && segment.memberIds) {
      const members = await db.query.contacts.findMany({
        where: inArray(contacts.id, segment.memberIds),
        limit: options?.limit || 100,
        offset: options?.offset || 0,
      });
      
      return { members, total: segment.memberIds.length };
    }
    
    // Dynamic segment
    const whereClause = this.buildConditionsQuery(segment.conditions ?? []);
    
    const [{ count }] = await db.select({ count: sql<number>`count(*)` })
      .from(contacts)
      .where(and(
        eq(contacts.ventureId, ctx.venture.id),
        isNull(contacts.deletedAt),
        whereClause
      ));
    
    const members = await db.query.contacts.findMany({
      where: and(
        eq(contacts.ventureId, ctx.venture.id),
        isNull(contacts.deletedAt),
        whereClause
      ),
      limit: options?.limit || 100,
      offset: options?.offset || 0,
    });
    
    return { members, total: count };
  }
  
  private buildConditionsQuery(conditions: SegmentCondition[]): any {
    // Convert segment conditions to Drizzle SQL
    // This is a simplified version - real implementation would handle all operators
    const clauses = conditions.map(cond => {
      const field = contacts[cond.field as keyof typeof contacts];
      if (!field) return sql`TRUE`;
      
      switch (cond.operator) {
        case 'eq':
          return eq(field, cond.value as any);
        case 'gte':
          return gte(field, cond.value as any);
        case 'lte':
          return lte(field, cond.value as any);
        case 'contains':
          return sql`${field}::text ILIKE ${'%' + cond.value + '%'}`;
        case 'in':
          return inArray(field, cond.value as any[]);
        default:
          return sql`TRUE`;
      }
    });
    
    return and(...clauses);
  }
  
  private evaluateConditions(contact: any, conditions: SegmentCondition[]): boolean {
    return conditions.every(cond => {
      const value = contact[cond.field];
      
      switch (cond.operator) {
        case 'eq':
          return value === cond.value;
        case 'neq':
          return value !== cond.value;
        case 'gt':
          return value > cond.value;
        case 'gte':
          return value >= cond.value;
        case 'lt':
          return value < cond.value;
        case 'lte':
          return value <= cond.value;
        case 'contains':
          return String(value).toLowerCase().includes(String(cond.value).toLowerCase());
        case 'in':
          return (cond.value as any[]).includes(value);
        case 'is_set':
          return value !== null && value !== undefined;
        case 'is_not_set':
          return value === null || value === undefined;
        default:
          return true;
      }
    });
  }
}

export class EventTrackingService {
  
  /**
   * Track a marketing event
   */
  async track(event: Partial<MarketingEvent>): Promise<void> {
    const ctx = getContext();
    
    await db.insert(marketingEvents).values({
      ventureId: ctx.venture.id,
      eventName: event.eventName!,
      eventCategory: event.eventCategory,
      contactId: event.contactId,
      anonymousId: event.anonymousId,
      sessionId: event.sessionId,
      channel: event.channel,
      source: event.source,
      medium: event.medium,
      campaign: event.campaign,
      properties: event.properties,
      utmSource: event.utmSource,
      utmMedium: event.utmMedium,
      utmCampaign: event.utmCampaign,
      utmContent: event.utmContent,
      utmTerm: event.utmTerm,
      referrer: event.referrer,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      deviceType: event.deviceType,
      pageUrl: event.pageUrl,
      pageTitle: event.pageTitle,
      pagePath: event.pagePath,
      occurredAt: event.occurredAt || new Date(),
    });
    
    // Process attribution asynchronously
    if (event.contactId) {
      await this.processAttribution(event);
    }
  }
  
  /**
   * Identify an anonymous visitor
   */
  async identify(anonymousId: string, contactId: string): Promise<void> {
    const ctx = getContext();
    
    // Link all anonymous events to the contact
    await db.update(marketingEvents)
      .set({ 
        contactId,
        processedAt: new Date(),
      })
      .where(and(
        eq(marketingEvents.ventureId, ctx.venture.id),
        eq(marketingEvents.anonymousId, anonymousId),
        isNull(marketingEvents.contactId)
      ));
  }
  
  /**
   * Get event stream for a contact
   */
  async getContactEvents(
    contactId: string,
    options?: { limit?: number; eventNames?: string[] }
  ): Promise<MarketingEvent[]> {
    const ctx = getContext();
    
    const conditions = [
      eq(marketingEvents.ventureId, ctx.venture.id),
      eq(marketingEvents.contactId, contactId),
    ];
    
    if (options?.eventNames?.length) {
      conditions.push(inArray(marketingEvents.eventName, options.eventNames));
    }
    
    return db.query.marketingEvents.findMany({
      where: and(...conditions),
      orderBy: [desc(marketingEvents.occurredAt)],
      limit: options?.limit || 100,
    });
  }
  
  private async processAttribution(event: Partial<MarketingEvent>): Promise<void> {
    // Queue attribution processing
    // This will be handled by the attribution module
  }
}

export class PersonalizationService {
  
  /**
   * Get personalized content for a visitor
   */
  async getPersonalization(
    contactId: string | null,
    targetType: string,
    targetId?: string,
    context?: Record<string, unknown>
  ): Promise<PersonalizationResult | null> {
    const ctx = getContext();
    
    // Find matching personalization rules
    const rules = await db.query.personalizationRules.findMany({
      where: and(
        eq(personalizationRules.ventureId, ctx.venture.id),
        eq(personalizationRules.targetType, targetType),
        eq(personalizationRules.isActive, true),
        or(
          isNull(personalizationRules.startDate),
          lte(personalizationRules.startDate, new Date())
        ),
        or(
          isNull(personalizationRules.endDate),
          gte(personalizationRules.endDate, new Date())
        )
      ),
      orderBy: [desc(personalizationRules.priority)],
    });
    
    if (!rules.length) return null;
    
    // Find first matching rule
    for (const rule of rules) {
      const matches = await this.evaluateRule(rule, contactId, context);
      if (matches) {
        // Select variation based on weight
        const variation = this.selectVariation(rule.variations);
        
        // Track impression
        await db.update(personalizationRules)
          .set({ impressions: sql`${personalizationRules.impressions} + 1` })
          .where(eq(personalizationRules.id, rule.id));
        
        return {
          ruleId: rule.id,
          variationId: variation.id,
          content: variation.content,
        };
      }
    }
    
    return null;
  }
  
  /**
   * Track personalization conversion
   */
  async trackConversion(ruleId: string, variationId: string): Promise<void> {
    await db.update(personalizationRules)
      .set({ conversions: sql`${personalizationRules.conversions} + 1` })
      .where(eq(personalizationRules.id, ruleId));
  }
  
  private async evaluateRule(
    rule: any, 
    contactId: string | null,
    context?: Record<string, unknown>
  ): Promise<boolean> {
    // Check audience/segment membership
    if (rule.audienceId && contactId) {
      const audienceService = new AudienceService();
      if (!await audienceService.isContactInAudience(contactId, rule.audienceId)) {
        return false;
      }
    }
    
    if (rule.segmentId && contactId) {
      const segmentService = new SegmentService();
      if (!await segmentService.isContactInSegment(contactId, rule.segmentId)) {
        return false;
      }
    }
    
    // Check additional conditions
    if (rule.conditions?.length) {
      // Evaluate conditions against context
      return rule.conditions.every((cond: any) => {
        const value = context?.[cond.field];
        // Similar evaluation logic as segments
        return true; // Simplified
      });
    }
    
    return true;
  }
  
  private selectVariation(variations: PersonalizationVariation[]): PersonalizationVariation {
    const totalWeight = variations.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const variation of variations) {
      random -= variation.weight;
      if (random <= 0) return variation;
    }
    
    return variations[0];
  }
}

export class ABTestService {
  
  /**
   * Create an A/B test
   */
  async create(input: any): Promise<ABTest> {
    const ctx = getContext();
    
    const [test] = await db.insert(abTests).values({
      ventureId: ctx.venture.id,
      name: input.name,
      description: input.description,
      hypothesis: input.hypothesis,
      testType: input.testType,
      targetId: input.targetId,
      variants: input.variants,
      controlVariantId: input.controlVariantId,
      trafficPercentage: input.trafficPercentage ?? 100,
      primaryGoal: input.primaryGoal,
      primaryGoalEvent: input.primaryGoalEvent,
      secondaryGoals: input.secondaryGoals,
      confidenceLevel: input.confidenceLevel ?? 95,
      minimumSampleSize: input.minimumSampleSize,
      startDate: input.startDate,
      endDate: input.endDate,
      audienceId: input.audienceId,
      status: 'draft',
      createdBy: ctx.user?.id,
    }).returning();
    
    return test;
  }
  
  /**
   * Start an A/B test
   */
  async start(testId: string): Promise<ABTest> {
    const ctx = getContext();
    
    const [test] = await db.update(abTests)
      .set({
        status: 'running',
        startDate: new Date(),
        updatedAt: new Date(),
        updatedBy: ctx.user?.id,
      })
      .where(and(
        eq(abTests.id, testId),
        eq(abTests.ventureId, ctx.venture.id),
        eq(abTests.status, 'draft')
      ))
      .returning();
    
    if (!test) {
      throw new ValidationError('Test not found or already started');
    }
    
    return test;
  }
  
  /**
   * Get variant for a visitor
   */
  async getVariant(testId: string, visitorId: string): Promise<ABTestVariant | null> {
    const ctx = getContext();
    
    const test = await db.query.abTests.findFirst({
      where: and(
        eq(abTests.id, testId),
        eq(abTests.ventureId, ctx.venture.id),
        eq(abTests.status, 'running')
      ),
    });
    
    if (!test) return null;
    
    // Check traffic percentage
    if (this.hashToPercentage(visitorId) > test.trafficPercentage) {
      return null;
    }
    
    // Deterministically assign variant based on visitor ID
    const variantIndex = this.hashToVariant(visitorId, test.variants.length);
    return test.variants[variantIndex];
  }
  
  /**
   * Track test conversion
   */
  async trackConversion(
    testId: string, 
    visitorId: string, 
    revenue?: number
  ): Promise<void> {
    const ctx = getContext();
    
    const test = await db.query.abTests.findFirst({
      where: eq(abTests.id, testId),
    });
    
    if (!test) return;
    
    const variantIndex = this.hashToVariant(visitorId, test.variants.length);
    const updatedVariants = [...test.variants];
    updatedVariants[variantIndex].conversions++;
    if (revenue) {
      updatedVariants[variantIndex].revenue = 
        (updatedVariants[variantIndex].revenue || 0) + revenue;
    }
    
    await db.update(abTests)
      .set({ variants: updatedVariants })
      .where(eq(abTests.id, testId));
  }
  
  /**
   * Calculate test results
   */
  async calculateResults(testId: string): Promise<ABTestResults> {
    const ctx = getContext();
    
    const test = await db.query.abTests.findFirst({
      where: and(
        eq(abTests.id, testId),
        eq(abTests.ventureId, ctx.venture.id)
      ),
    });
    
    if (!test) {
      throw new NotFoundError('ABTest', testId);
    }
    
    const control = test.variants.find(v => v.id === test.controlVariantId);
    if (!control) {
      throw new ValidationError('Control variant not found');
    }
    
    const controlRate = control.impressions > 0 
      ? control.conversions / control.impressions 
      : 0;
    
    let bestVariant = control;
    let bestLift = 0;
    
    const variantStats: Record<string, any> = {};
    
    for (const variant of test.variants) {
      const rate = variant.impressions > 0 
        ? variant.conversions / variant.impressions 
        : 0;
      const lift = controlRate > 0 
        ? ((rate - controlRate) / controlRate) * 100 
        : 0;
      
      variantStats[variant.id] = {
        impressions: variant.impressions,
        conversions: variant.conversions,
        conversionRate: rate * 100,
        revenue: variant.revenue,
        revenuePerVisitor: variant.impressions > 0 
          ? (variant.revenue || 0) / variant.impressions 
          : 0,
      };
      
      if (variant.id !== control.id && lift > bestLift) {
        bestLift = lift;
        bestVariant = variant;
      }
    }
    
    // Calculate statistical significance (simplified)
    const { pValue, confidence } = this.calculateStatisticalSignificance(
      control, 
      bestVariant
    );
    
    const results: ABTestResults = {
      winner: confidence >= test.confidenceLevel ? bestVariant.id : undefined,
      confidence,
      lift: bestLift,
      pValue,
      sampleSize: test.variants.reduce((sum, v) => sum + v.impressions, 0),
      duration: test.startDate 
        ? Math.floor((Date.now() - test.startDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0,
      variantStats,
    };
    
    // Update test with results
    await db.update(abTests)
      .set({ results })
      .where(eq(abTests.id, testId));
    
    return results;
  }
  
  private hashToPercentage(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash % 100);
  }
  
  private hashToVariant(id: string, numVariants: number): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash % numVariants);
  }
  
  private calculateStatisticalSignificance(
    control: ABTestVariant, 
    variant: ABTestVariant
  ): { pValue: number; confidence: number } {
    // Simplified z-test calculation
    const n1 = control.impressions;
    const n2 = variant.impressions;
    const p1 = n1 > 0 ? control.conversions / n1 : 0;
    const p2 = n2 > 0 ? variant.conversions / n2 : 0;
    
    if (n1 === 0 || n2 === 0) {
      return { pValue: 1, confidence: 0 };
    }
    
    const pooledP = (control.conversions + variant.conversions) / (n1 + n2);
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
    
    if (se === 0) {
      return { pValue: 1, confidence: 0 };
    }
    
    const z = Math.abs(p2 - p1) / se;
    
    // Approximate p-value from z-score
    const pValue = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
    const confidence = (1 - 2 * pValue) * 100;
    
    return { pValue, confidence: Math.max(0, Math.min(100, confidence)) };
  }
}

export const segmentService = new SegmentService();
export const eventTrackingService = new EventTrackingService();
export const personalizationService = new PersonalizationService();
export const abTestService = new ABTestService();
```

---

## Module: campaigns

### Purpose

Multi-channel campaign orchestration supporting one-time blasts, drip sequences, triggered automations, and customer journey builders.

### Database Schema

```typescript
// @mcv/growth/campaigns/schema.ts
import { pgTable, uuid, text, timestamp, jsonb, boolean, integer, numeric, pgEnum, index } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel/db';
import { segments, audiences } from '../marketing/schema';

export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft', 'scheduled', 'sending', 'active', 'paused', 'completed', 'archived'
]);

export const campaignTypeEnum = pgEnum('campaign_type', [
  'one_time', 'recurring', 'triggered', 'journey'
]);

export const campaigns = pgTable('growth_campaigns', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  
  // Type and status
  type: campaignTypeEnum('type').default('one_time'),
  status: campaignStatusEnum('status').default('draft'),
  
  // Targeting
  audienceId: uuid('audience_id').references(() => audiences.id),
  segmentId: uuid('segment_id').references(() => segments.id),
  estimatedReach: integer('estimated_reach'),
  
  // Channels
  channels: text('channels').array().default([]), // email, sms, push, in_app
  
  // Schedule
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  sendingStartedAt: timestamp('sending_started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  
  // Recurring settings
  recurrenceRule: text('recurrence_rule'), // RRULE format
  lastSentAt: timestamp('last_sent_at', { withTimezone: true }),
  nextSendAt: timestamp('next_send_at', { withTimezone: true }),
  
  // Trigger settings (for triggered campaigns)
  triggerEvent: text('trigger_event'),
  triggerConditions: jsonb('trigger_conditions').$type<TriggerCondition[]>(),
  triggerDelay: integer('trigger_delay_minutes'),
  
  // Goals
  conversionGoal: text('conversion_goal'),
  conversionGoalEvent: text('conversion_goal_event'),
  goalValue: numeric('goal_value', { precision: 15, scale: 2 }),
  
  // Budget
  budgetAmount: numeric('budget_amount', { precision: 15, scale: 2 }),
  budgetCurrency: text('budget_currency').default('USD'),
  spentAmount: numeric('spent_amount', { precision: 15, scale: 2 }).default('0'),
  
  // Stats
  recipientCount: integer('recipient_count').default(0),
  sentCount: integer('sent_count').default(0),
  deliveredCount: integer('delivered_count').default(0),
  openedCount: integer('opened_count').default(0),
  clickedCount: integer('clicked_count').default(0),
  convertedCount: integer('converted_count').default(0),
  unsubscribedCount: integer('unsubscribed_count').default(0),
  bouncedCount: integer('bounced_count').default(0),
  complaintCount: integer('complaint_count').default(0),
  revenue: numeric('revenue', { precision: 15, scale: 2 }).default('0'),
  
  // Settings
  settings: jsonb('settings').$type<CampaignSettings>(),
  
  // Tags and metadata
  tags: text('tags').array().default([]),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
}, (table) => [
  index('growth_campaigns_venture_idx').on(table.ventureId),
  index('growth_campaigns_status_idx').on(table.status),
  index('growth_campaigns_type_idx').on(table.type),
  index('growth_campaigns_scheduled_idx').on(table.scheduledAt),
]);

export type TriggerCondition = {
  field: string;
  operator: string;
  value: unknown;
};

export type CampaignSettings = {
  sendingWindow?: {
    enabled: boolean;
    timezone: string;
    days: number[]; // 0-6
    startHour: number;
    endHour: number;
  };
  throttle?: {
    enabled: boolean;
    maxPerHour: number;
    maxPerDay: number;
  };
  deduplication?: {
    enabled: boolean;
    withinDays: number;
  };
  unsubscribeLink?: boolean;
  trackOpens?: boolean;
  trackClicks?: boolean;
};

export const campaignMessages = pgTable('growth_campaign_messages', {
  ...baseColumns,
  campaignId: uuid('campaign_id').references(() => campaigns.id).notNull(),
  
  // Channel
  channel: text('channel').notNull(), // email, sms, push, in_app
  
  // Content
  name: text('name'),
  subject: text('subject'),
  preheaderText: text('preheader_text'),
  fromName: text('from_name'),
  fromEmail: text('from_email'),
  replyTo: text('reply_to'),
  
  // Body
  bodyHtml: text('body_html'),
  bodyText: text('body_text'),
  bodyJson: jsonb('body_json'), // For structured content (push, in_app)
  
  // Template
  templateId: uuid('template_id'),
  templateVariables: jsonb('template_variables'),
  
  // Personalization
  dynamicContent: jsonb('dynamic_content').$type<DynamicContentBlock[]>(),
  
  // A/B testing
  isVariant: boolean('is_variant').default(false),
  variantName: text('variant_name'),
  variantWeight: integer('variant_weight').default(50),
  
  // Order (for sequences)
  orderIndex: integer('order_index').default(0),
  delayMinutes: integer('delay_minutes'), // Delay from previous message
  
  // Stats
  sentCount: integer('sent_count').default(0),
  deliveredCount: integer('delivered_count').default(0),
  openedCount: integer('opened_count').default(0),
  clickedCount: integer('clicked_count').default(0),
  convertedCount: integer('converted_count').default(0),
  unsubscribedCount: integer('unsubscribed_count').default(0),
  bouncedCount: integer('bounced_count').default(0),
  
  isActive: boolean('is_active').default(true),
}, (table) => [
  index('growth_messages_campaign_idx').on(table.campaignId),
  index('growth_messages_channel_idx').on(table.channel),
]);

export type DynamicContentBlock = {
  id: string;
  type: 'conditional' | 'personalization';
  selector: string; // CSS selector or placeholder
  conditions?: SegmentCondition[];
  content: Record<string, unknown>;
  fallbackContent?: Record<string, unknown>;
};

export const campaignRecipients = pgTable('growth_campaign_recipients', {
  ...baseColumns,
  campaignId: uuid('campaign_id').references(() => campaigns.id).notNull(),
  contactId: uuid('contact_id').notNull(),
  
  // Delivery info
  channel: text('channel').notNull(),
  destination: text('destination').notNull(), // email address, phone, device token
  
  // Status tracking
  status: text('status').default('pending'), // pending, queued, sent, delivered, opened, clicked, converted, failed, bounced, unsubscribed
  
  // Timestamps
  queuedAt: timestamp('queued_at', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  openedAt: timestamp('opened_at', { withTimezone: true }),
  clickedAt: timestamp('clicked_at', { withTimezone: true }),
  convertedAt: timestamp('converted_at', { withTimezone: true }),
  failedAt: timestamp('failed_at', { withTimezone: true }),
  
  // Engagement
  openCount: integer('open_count').default(0),
  clickCount: integer('click_count').default(0),
  
  // Variant (for A/B tests)
  messageId: uuid('message_id'),
  variantId: text('variant_id'),
  
  // Error tracking
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  
  // Provider tracking
  providerId: text('provider_id'),
  providerMessageId: text('provider_message_id'),
  
  // Revenue attribution
  conversionValue: numeric('conversion_value', { precision: 15, scale: 2 }),
  
  metadata: jsonb('metadata'),
}, (table) => [
  index('growth_recipients_campaign_idx').on(table.campaignId),
  index('growth_recipients_contact_idx').on(table.contactId),
  index('growth_recipients_status_idx').on(table.status),
]);

export const automations = pgTable('growth_automations', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  
  // Trigger
  triggerType: text('trigger_type').notNull(), // event, schedule, segment_entry, segment_exit, date_field
  triggerConfig: jsonb('trigger_config').$type<AutomationTrigger>(),
  
  // Audience
  audienceId: uuid('audience_id'),
  segmentId: uuid('segment_id'),
  
  // Entry conditions
  entryConditions: jsonb('entry_conditions').$type<SegmentCondition[]>(),
  
  // Re-entry settings
  allowReentry: boolean('allow_reentry').default(false),
  reentryWaitDays: integer('reentry_wait_days'),
  
  // Steps/workflow
  steps: jsonb('steps').$type<AutomationStep[]>().notNull(),
  
  // Status
  status: text('status').default('draft'), // draft, active, paused, archived
  
  // Stats
  enrolledCount: integer('enrolled_count').default(0),
  completedCount: integer('completed_count').default(0),
  exitedCount: integer('exited_count').default(0),
  convertedCount: integer('converted_count').default(0),
  
  // Goal tracking
  goalEvent: text('goal_event'),
  goalTimeoutDays: integer('goal_timeout_days'),
  
  lastTriggeredAt: timestamp('last_triggered_at', { withTimezone: true }),
}, (table) => [
  index('growth_automations_venture_idx').on(table.ventureId),
  index('growth_automations_status_idx').on(table.status),
]);

export type AutomationTrigger = {
  event?: string;
  eventConditions?: Record<string, unknown>;
  schedule?: string; // RRULE
  dateField?: string;
  dateOffset?: number; // Days before/after
};

export type AutomationStep = {
  id: string;
  type: 'action' | 'condition' | 'delay' | 'split' | 'goal';
  name?: string;
  
  // Action config
  action?: {
    type: 'send_email' | 'send_sms' | 'send_push' | 'update_contact' | 'add_tag' | 'remove_tag' | 'webhook' | 'add_to_segment' | 'remove_from_segment';
    config: Record<string, unknown>;
  };
  
  // Condition config
  condition?: {
    rules: SegmentCondition[];
    yesStepId: string;
    noStepId: string;
  };
  
  // Delay config
  delay?: {
    type: 'fixed' | 'until_time' | 'until_date_field';
    duration?: number;
    unit?: 'minutes' | 'hours' | 'days' | 'weeks';
    time?: string;
    dateField?: string;
  };
  
  // Split config (A/B testing within automation)
  split?: {
    type: 'random' | 'conditional';
    branches: Array<{
      id: string;
      name: string;
      weight?: number;
      conditions?: SegmentCondition[];
      nextStepId: string;
    }>;
  };
  
  // Goal config
  goal?: {
    event: string;
    conditions?: Record<string, unknown>;
    timeout?: number;
    achievedStepId?: string;
    timeoutStepId?: string;
  };
  
  nextStepId?: string;
  position?: { x: number; y: number }; // For visual editor
};

export const automationEnrollments = pgTable('growth_automation_enrollments', {
  ...baseColumns,
  automationId: uuid('automation_id').references(() => automations.id).notNull(),
  contactId: uuid('contact_id').notNull(),
  
  // Current state
  currentStepId: text('current_step_id'),
  status: text('status').default('active'), // active, paused, completed, exited, goal_achieved
  
  // Timing
  enrolledAt: timestamp('enrolled_at', { withTimezone: true }).defaultNow(),
  nextStepAt: timestamp('next_step_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  exitedAt: timestamp('exited_at', { withTimezone: true }),
  
  // Exit reason
  exitReason: text('exit_reason'),
  
  // Goal tracking
  goalAchievedAt: timestamp('goal_achieved_at', { withTimezone: true }),
  
  // Step history
  stepHistory: jsonb('step_history').$type<StepHistoryEntry[]>(),
  
  // Attribution
  triggerEvent: jsonb('trigger_event'),
  
  metadata: jsonb('metadata'),
}, (table) => [
  index('growth_enrollments_automation_idx').on(table.automationId),
  index('growth_enrollments_contact_idx').on(table.contactId),
  index('growth_enrollments_status_idx').on(table.status),
  index('growth_enrollments_next_step_idx').on(table.nextStepAt),
]);

export type StepHistoryEntry = {
  stepId: string;
  enteredAt: Date;
  exitedAt?: Date;
  outcome?: string;
  data?: Record<string, unknown>;
};

export const journeys = pgTable('growth_journeys', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  
  // Canvas definition
  canvas: jsonb('canvas').$type<JourneyCanvas>().notNull(),
  
  // Entry criteria
  entryType: text('entry_type').notNull(), // segment, event, api
  entryConfig: jsonb('entry_config'),
  
  // Exit criteria
  exitCriteria: jsonb('exit_criteria').$type<SegmentCondition[]>(),
  
  // Settings
  allowReentry: boolean('allow_reentry').default(false),
  globalThrottle: integer('global_throttle_hours'),
  
  // Status
  status: text('status').default('draft'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  
  // Stats
  activeCount: integer('active_count').default(0),
  completedCount: integer('completed_count').default(0),
  convertedCount: integer('converted_count').default(0),
  
  // Version control
  version: integer('version').default(1),
  previousVersionId: uuid('previous_version_id'),
}, (table) => [
  index('growth_journeys_venture_idx').on(table.ventureId),
  index('growth_journeys_status_idx').on(table.status),
]);

export type JourneyCanvas = {
  nodes: JourneyNode[];
  edges: JourneyEdge[];
  settings: Record<string, unknown>;
};

export type JourneyNode = {
  id: string;
  type: 'entry' | 'action' | 'condition' | 'delay' | 'split' | 'goal' | 'exit';
  position: { x: number; y: number };
  data: AutomationStep;
};

export type JourneyEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
};
```

### Service Implementation

```typescript
// @mcv/growth/campaigns/service.ts
import { db, getContext, NotFoundError, ValidationError } from '@mcv/kernel';
import { campaigns, campaignMessages, campaignRecipients, automations, automationEnrollments } from './schema';
import { segments, audiences } from '../marketing/schema';
import { eq, and, sql, isNull, lte, desc, inArray } from 'drizzle-orm';
import { Queue } from 'bullmq';

const campaignQueue = new Queue('campaign-send');
const automationQueue = new Queue('automation-process');

export class CampaignService {
  
  /**
   * Create a new campaign
   */
  async create(input: any): Promise<any> {
    const ctx = getContext();
    
    const [campaign] = await db.insert(campaigns).values({
      ventureId: ctx.venture.id,
      name: input.name,
      description: input.description,
      type: input.type || 'one_time',
      audienceId: input.audienceId,
      segmentId: input.segmentId,
      channels: input.channels || [],
      scheduledAt: input.scheduledAt,
      conversionGoal: input.conversionGoal,
      conversionGoalEvent: input.conversionGoalEvent,
      budgetAmount: input.budgetAmount,
      budgetCurrency: input.budgetCurrency,
      settings: input.settings,
      tags: input.tags,
      status: 'draft',
      createdBy: ctx.user?.id,
    }).returning();
    
    // Create messages if provided
    if (input.messages?.length) {
      for (const msg of input.messages) {
        await db.insert(campaignMessages).values({
          ventureId: ctx.venture.id,
          campaignId: campaign.id,
          channel: msg.channel,
          subject: msg.subject,
          fromName: msg.fromName,
          fromEmail: msg.fromEmail,
          bodyHtml: msg.bodyHtml,
          bodyText: msg.bodyText,
          templateId: msg.templateId,
          createdBy: ctx.user?.id,
        });
      }
    }
    
    // Calculate estimated reach
    await this.updateEstimatedReach(campaign.id);
    
    return campaign;
  }
  
  /**
   * Schedule a campaign for sending
   */
  async schedule(campaignId: string, scheduledAt: Date): Promise<any> {
    const ctx = getContext();
    
    const campaign = await this.getById(campaignId);
    
    if (campaign.status !== 'draft') {
      throw new ValidationError('Only draft campaigns can be scheduled');
    }
    
    // Validate campaign has messages
    const messages = await db.query.campaignMessages.findMany({
      where: eq(campaignMessages.campaignId, campaignId),
    });
    
    if (messages.length === 0) {
      throw new ValidationError('Campaign must have at least one message');
    }
    
    const [updated] = await db.update(campaigns)
      .set({
        status: 'scheduled',
        scheduledAt,
        updatedAt: new Date(),
        updatedBy: ctx.user?.id,
      })
      .where(eq(campaigns.id, campaignId))
      .returning();
    
    // Schedule the job
    await campaignQueue.add('send-campaign', {
      campaignId,
      ventureId: ctx.venture.id,
    }, {
      delay: scheduledAt.getTime() - Date.now(),
      jobId: `campaign-${campaignId}`,
    });
    
    return updated;
  }
  
  /**
   * Send a campaign immediately
   */
  async sendNow(campaignId: string): Promise<any> {
    const ctx = getContext();
    
    const campaign = await this.getById(campaignId);
    
    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      throw new ValidationError('Campaign cannot be sent');
    }
    
    const [updated] = await db.update(campaigns)
      .set({
        status: 'sending',
        sendingStartedAt: new Date(),
        updatedAt: new Date(),
        updatedBy: ctx.user?.id,
      })
      .where(eq(campaigns.id, campaignId))
      .returning();
    
    // Queue immediate send
    await campaignQueue.add('send-campaign', {
      campaignId,
      ventureId: ctx.venture.id,
    }, {
      jobId: `campaign-${campaignId}`,
    });
    
    return updated;
  }
  
  /**
   * Process campaign sending
   */
  async processSend(campaignId: string): Promise<void> {
    const ctx = getContext();
    
    const campaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, campaignId),
      with: {
        messages: true,
        audience: true,
        segment: true,
      },
    });
    
    if (!campaign) {
      throw new NotFoundError('Campaign', campaignId);
    }
    
    // Get recipients from audience/segment
    const recipients = await this.getRecipients(campaign);
    
    // Update recipient count
    await db.update(campaigns)
      .set({ recipientCount: recipients.length })
      .where(eq(campaigns.id, campaignId));
    
    // Create recipient records and queue sends
    const batchSize = 1000;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      await db.insert(campaignRecipients).values(
        batch.map(r => ({
          ventureId: campaign.ventureId,
          campaignId,
          contactId: r.contactId,
          channel: r.channel,
          destination: r.destination,
          messageId: r.messageId,
          status: 'queued',
          queuedAt: new Date(),
        }))
      );
      
      // Queue actual send jobs
      for (const recipient of batch) {
        await campaignQueue.add('send-message', {
          campaignId,
          recipientId: recipient.id,
          channel: recipient.channel,
        });
      }
    }
    
    await db.update(campaigns)
      .set({ status: 'active' })
      .where(eq(campaigns.id, campaignId));
  }
  
  /**
   * Pause a running campaign
   */
  async pause(campaignId: string): Promise<any> {
    const ctx = getContext();
    
    const [updated] = await db.update(campaigns)
      .set({
        status: 'paused',
        updatedAt: new Date(),
        updatedBy: ctx.user?.id,
      })
      .where(and(
        eq(campaigns.id, campaignId),
        eq(campaigns.ventureId, ctx.venture.id),
        inArray(campaigns.status, ['sending', 'active'])
      ))
      .returning();
    
    if (!updated) {
      throw new ValidationError('Campaign cannot be paused');
    }
    
    return updated;
  }
  
  /**
   * Resume a paused campaign
   */
  async resume(campaignId: string): Promise<any> {
    const ctx = getContext();
    
    const [updated] = await db.update(campaigns)
      .set({
        status: 'active',
        updatedAt: new Date(),
        updatedBy: ctx.user?.id,
      })
      .where(and(
        eq(campaigns.id, campaignId),
        eq(campaigns.ventureId, ctx.venture.id),
        eq(campaigns.status, 'paused')
      ))
      .returning();
    
    if (!updated) {
      throw new ValidationError('Campaign cannot be resumed');
    }
    
    return updated;
  }
  
  /**
   * Track campaign event
   */
  async trackEvent(
    recipientId: string, 
    event: 'delivered' | 'opened' | 'clicked' | 'converted' | 'unsubscribed' | 'bounced' | 'complained',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const recipient = await db.query.campaignRecipients.findFirst({
      where: eq(campaignRecipients.id, recipientId),
    });
    
    if (!recipient) return;
    
    const updates: any = {
      updatedAt: new Date(),
    };
    
    switch (event) {
      case 'delivered':
        updates.status = 'delivered';
        updates.deliveredAt = new Date();
        break;
      case 'opened':
        if (!recipient.openedAt) {
          updates.openedAt = new Date();
          updates.status = 'opened';
        }
        updates.openCount = sql`${campaignRecipients.openCount} + 1`;
        break;
      case 'clicked':
        if (!recipient.clickedAt) {
          updates.clickedAt = new Date();
          updates.status = 'clicked';
        }
        updates.clickCount = sql`${campaignRecipients.clickCount} + 1`;
        break;
      case 'converted':
        updates.status = 'converted';
        updates.convertedAt = new Date();
        updates.conversionValue = metadata?.value;
        break;
      case 'unsubscribed':
        updates.status = 'unsubscribed';
        break;
      case 'bounced':
        updates.status = 'bounced';
        updates.failedAt = new Date();
        updates.errorCode = metadata?.code;
        updates.errorMessage = metadata?.message;
        break;
      case 'complained':
        updates.status = 'complained';
        break;
    }
    
    await db.update(campaignRecipients)
      .set(updates)
      .where(eq(campaignRecipients.id, recipientId));
    
    // Update campaign stats
    await this.updateStats(recipient.campaignId);
  }
  
  /**
   * Get campaign analytics
   */
  async getAnalytics(campaignId: string): Promise<any> {
    const ctx = getContext();
    
    const campaign = await this.getById(campaignId);
    
    // Calculate rates
    const deliveryRate = campaign.recipientCount > 0 
      ? (campaign.deliveredCount / campaign.recipientCount) * 100 
      : 0;
    
    const openRate = campaign.deliveredCount > 0 
      ? (campaign.openedCount / campaign.deliveredCount) * 100 
      : 0;
    
    const clickRate = campaign.deliveredCount > 0 
      ? (campaign.clickedCount / campaign.deliveredCount) * 100 
      : 0;
    
    const conversionRate = campaign.deliveredCount > 0 
      ? (campaign.convertedCount / campaign.deliveredCount) * 100 
      : 0;
    
    const unsubscribeRate = campaign.deliveredCount > 0 
      ? (campaign.unsubscribedCount / campaign.deliveredCount) * 100 
      : 0;
    
    const bounceRate = campaign.recipientCount > 0 
      ? (campaign.bouncedCount / campaign.recipientCount) * 100 
      : 0;
    
    // Get click breakdown by link
    const linkClicks = await db.execute(sql`
      SELECT 
        (metadata->>'link') as link,
        COUNT(*) as clicks
      FROM growth_campaign_recipients
      WHERE campaign_id = ${campaignId}
        AND clicked_at IS NOT NULL
      GROUP BY metadata->>'link'
      ORDER BY clicks DESC
      LIMIT 20
    `);
    
    // Get engagement over time
    const engagement = await db.execute(sql`
      SELECT 
        DATE_TRUNC('hour', delivered_at) as hour,
        COUNT(*) FILTER (WHERE delivered_at IS NOT NULL) as delivered,
        COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened,
        COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as clicked
      FROM growth_campaign_recipients
      WHERE campaign_id = ${campaignId}
      GROUP BY hour
      ORDER BY hour
    `);
    
    return {
      overview: {
        recipientCount: campaign.recipientCount,
        sentCount: campaign.sentCount,
        deliveredCount: campaign.deliveredCount,
        openedCount: campaign.openedCount,
        clickedCount: campaign.clickedCount,
        convertedCount: campaign.convertedCount,
        unsubscribedCount: campaign.unsubscribedCount,
        bouncedCount: campaign.bouncedCount,
        revenue: campaign.revenue,
      },
      rates: {
        deliveryRate,
        openRate,
        clickRate,
        conversionRate,
        unsubscribeRate,
        bounceRate,
      },
      linkClicks: linkClicks.rows,
      engagement: engagement.rows,
    };
  }
  
  private async getById(campaignId: string) {
    const ctx = getContext();
    
    const campaign = await db.query.campaigns.findFirst({
      where: and(
        eq(campaigns.id, campaignId),
        eq(campaigns.ventureId, ctx.venture.id)
      ),
    });
    
    if (!campaign) {
      throw new NotFoundError('Campaign', campaignId);
    }
    
    return campaign;
  }
  
  private async updateEstimatedReach(campaignId: string): Promise<void> {
    const campaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, campaignId),
    });
    
    if (!campaign) return;
    
    let estimatedReach = 0;
    
    if (campaign.audienceId) {
      const audience = await db.query.audiences.findFirst({
        where: eq(audiences.id, campaign.audienceId),
      });
      estimatedReach = audience?.estimatedSize ?? 0;
    } else if (campaign.segmentId) {
      const segment = await db.query.segments.findFirst({
        where: eq(segments.id, campaign.segmentId),
      });
      estimatedReach = segment?.memberCount ?? 0;
    }
    
    await db.update(campaigns)
      .set({ estimatedReach })
      .where(eq(campaigns.id, campaignId));
  }
  
  private async getRecipients(campaign: any): Promise<any[]> {
    // Get contacts from audience or segment
    // Apply suppression lists
    // Return formatted recipients
    return [];
  }
  
  private async updateStats(campaignId: string): Promise<void> {
    // Aggregate stats from recipients table
    const stats = await db.execute(sql`
      SELECT 
        COUNT(*) as recipient_count,
        COUNT(*) FILTER (WHERE sent_at IS NOT NULL) as sent_count,
        COUNT(*) FILTER (WHERE delivered_at IS NOT NULL) as delivered_count,
        COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened_count,
        COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as clicked_count,
        COUNT(*) FILTER (WHERE converted_at IS NOT NULL) as converted_count,
        COUNT(*) FILTER (WHERE status = 'unsubscribed') as unsubscribed_count,
        COUNT(*) FILTER (WHERE status = 'bounced') as bounced_count,
        COUNT(*) FILTER (WHERE status = 'complained') as complaint_count,
        COALESCE(SUM(conversion_value), 0) as revenue
      FROM growth_campaign_recipients
      WHERE campaign_id = ${campaignId}
    `);
    
    const row = stats.rows[0];
    
    await db.update(campaigns)
      .set({
        recipientCount: row.recipient_count,
        sentCount: row.sent_count,
        deliveredCount: row.delivered_count,
        openedCount: row.opened_count,
        clickedCount: row.clicked_count,
        convertedCount: row.converted_count,
        unsubscribedCount: row.unsubscribed_count,
        bouncedCount: row.bounced_count,
        complaintCount: row.complaint_count,
        revenue: row.revenue,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, campaignId));
  }
}

export class AutomationService {
  
  /**
   * Create an automation
   */
  async create(input: any): Promise<any> {
    const ctx = getContext();
    
    const [automation] = await db.insert(automations).values({
      ventureId: ctx.venture.id,
      name: input.name,
      description: input.description,
      triggerType: input.triggerType,
      triggerConfig: input.triggerConfig,
      audienceId: input.audienceId,
      segmentId: input.segmentId,
      entryConditions: input.entryConditions,
      allowReentry: input.allowReentry ?? false,
      reentryWaitDays: input.reentryWaitDays,
      steps: input.steps,
      goalEvent: input.goalEvent,
      goalTimeoutDays: input.goalTimeoutDays,
      status: 'draft',
      createdBy: ctx.user?.id,
    }).returning();
    
    return automation;
  }
  
  /**
   * Activate an automation
   */
  async activate(automationId: string): Promise<any> {
    const ctx = getContext();
    
    const [updated] = await db.update(automations)
      .set({
        status: 'active',
        updatedAt: new Date(),
        updatedBy: ctx.user?.id,
      })
      .where(and(
        eq(automations.id, automationId),
        eq(automations.ventureId, ctx.venture.id),
        eq(automations.status, 'draft')
      ))
      .returning();
    
    if (!updated) {
      throw new ValidationError('Automation cannot be activated');
    }
    
    return updated;
  }
  
  /**
   * Enroll a contact in an automation
   */
  async enroll(automationId: string, contactId: string, triggerEvent?: any): Promise<any> {
    const ctx = getContext();
    
    const automation = await db.query.automations.findFirst({
      where: and(
        eq(automations.id, automationId),
        eq(automations.status, 'active')
      ),
    });
    
    if (!automation) {
      throw new NotFoundError('Automation', automationId);
    }
    
    // Check if already enrolled
    const existing = await db.query.automationEnrollments.findFirst({
      where: and(
        eq(automationEnrollments.automationId, automationId),
        eq(automationEnrollments.contactId, contactId),
        eq(automationEnrollments.status, 'active')
      ),
    });
    
    if (existing) {
      if (!automation.allowReentry) {
        throw new ValidationError('Contact already enrolled in this automation');
      }
    }
    
    // Find first step
    const firstStep = automation.steps.find(s => s.type === 'action' || !s.type);
    
    const [enrollment] = await db.insert(automationEnrollments).values({
      ventureId: ctx.venture.id,
      automationId,
      contactId,
      currentStepId: firstStep?.id,
      status: 'active',
      triggerEvent,
      stepHistory: [],
      createdBy: ctx.user?.id,
    }).returning();
    
    // Update stats
    await db.update(automations)
      .set({ 
        enrolledCount: sql`${automations.enrolledCount} + 1`,
        lastTriggeredAt: new Date(),
      })
      .where(eq(automations.id, automationId));
    
    // Queue first step processing
    await automationQueue.add('process-step', {
      enrollmentId: enrollment.id,
      stepId: firstStep?.id,
    });
    
    return enrollment;
  }
  
  /**
   * Process automation step
   */
  async processStep(enrollmentId: string, stepId: string): Promise<void> {
    const enrollment = await db.query.automationEnrollments.findFirst({
      where: eq(automationEnrollments.id, enrollmentId),
      with: { automation: true },
    });
    
    if (!enrollment || enrollment.status !== 'active') return;
    
    const step = enrollment.automation.steps.find(s => s.id === stepId);
    if (!step) return;
    
    // Update step history
    const stepHistory = [...(enrollment.stepHistory || []), {
      stepId,
      enteredAt: new Date(),
    }];
    
    switch (step.type) {
      case 'action':
        await this.executeAction(enrollment, step);
        // Move to next step
        if (step.nextStepId) {
          await this.scheduleNextStep(enrollmentId, step.nextStepId);
        } else {
          await this.completeEnrollment(enrollmentId);
        }
        break;
        
      case 'delay':
        const delayMs = this.calculateDelay(step.delay!);
        await automationQueue.add('process-step', {
          enrollmentId,
          stepId: step.nextStepId,
        }, { delay: delayMs });
        
        await db.update(automationEnrollments)
          .set({
            nextStepAt: new Date(Date.now() + delayMs),
            stepHistory,
          })
          .where(eq(automationEnrollments.id, enrollmentId));
        break;
        
      case 'condition':
        const contact = await db.query.contacts.findFirst({
          where: eq(contacts.id, enrollment.contactId),
        });
        
        const conditionMet = this.evaluateConditions(contact, step.condition!.rules);
        const nextStepId = conditionMet 
          ? step.condition!.yesStepId 
          : step.condition!.noStepId;
        
        await this.scheduleNextStep(enrollmentId, nextStepId);
        break;
        
      case 'split':
        // Random or conditional split
        const branch = this.selectBranch(enrollment, step.split!);
        await this.scheduleNextStep(enrollmentId, branch.nextStepId);
        break;
        
      case 'goal':
        // Set up goal tracking
        await db.update(automationEnrollments)
          .set({ 
            currentStepId: stepId,
            stepHistory,
          })
          .where(eq(automationEnrollments.id, enrollmentId));
        break;
    }
  }
  
  private async executeAction(enrollment: any, step: any): Promise<void> {
    const action = step.action!;
    
    switch (action.type) {
      case 'send_email':
        // Send email via email service
        break;
      case 'send_sms':
        // Send SMS via SMS service
        break;
      case 'add_tag':
        await db.execute(sql`
          UPDATE nexus_contacts
          SET tags = array_append(tags, ${action.config.tag})
          WHERE id = ${enrollment.contactId}
        `);
        break;
      case 'remove_tag':
        await db.execute(sql`
          UPDATE nexus_contacts
          SET tags = array_remove(tags, ${action.config.tag})
          WHERE id = ${enrollment.contactId}
        `);
        break;
      case 'webhook':
        // Call webhook
        break;
    }
  }
  
  private calculateDelay(delay: any): number {
    if (delay.type === 'fixed') {
      const multipliers: Record<string, number> = {
        minutes: 60 * 1000,
        hours: 60 * 60 * 1000,
        days: 24 * 60 * 60 * 1000,
        weeks: 7 * 24 * 60 * 60 * 1000,
      };
      return delay.duration * (multipliers[delay.unit] || 60000);
    }
    return 0;
  }
  
  private evaluateConditions(contact: any, rules: any[]): boolean {
    // Similar to segment condition evaluation
    return true;
  }
  
  private selectBranch(enrollment: any, split: any): any {
    if (split.type === 'random') {
      const totalWeight = split.branches.reduce((sum: number, b: any) => sum + (b.weight || 1), 0);
      let random = Math.random() * totalWeight;
      
      for (const branch of split.branches) {
        random -= branch.weight || 1;
        if (random <= 0) return branch;
      }
      return split.branches[0];
    }
    
    // Conditional split
    for (const branch of split.branches) {
      if (branch.conditions && this.evaluateConditions(null, branch.conditions)) {
        return branch;
      }
    }
    return split.branches[split.branches.length - 1]; // Default branch
  }
  
  private async scheduleNextStep(enrollmentId: string, stepId: string): Promise<void> {
    await automationQueue.add('process-step', {
      enrollmentId,
      stepId,
    });
    
    await db.update(automationEnrollments)
      .set({ currentStepId: stepId })
      .where(eq(automationEnrollments.id, enrollmentId));
  }
  
  private async completeEnrollment(enrollmentId: string): Promise<void> {
    await db.update(automationEnrollments)
      .set({
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(automationEnrollments.id, enrollmentId));
    
    const enrollment = await db.query.automationEnrollments.findFirst({
      where: eq(automationEnrollments.id, enrollmentId),
    });
    
    if (enrollment) {
      await db.update(automations)
        .set({ completedCount: sql`${automations.completedCount} + 1` })
        .where(eq(automations.id, enrollment.automationId));
    }
  }
}

export const campaignService = new CampaignService();
export const automationService = new AutomationService();
```

---

## Module: email-campaigns

### Purpose

Email marketing module with template management, rich content editor, deliverability tools, and advanced email analytics.

### Database Schema

```typescript
// @mcv/growth/email-campaigns/schema.ts
import { pgTable, uuid, text, timestamp, jsonb, boolean, integer, numeric, index } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel/db';

export const emailTemplates = pgTable('growth_email_templates', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  
  // Template content
  subject: text('subject'),
  preheaderText: text('preheader_text'),
  bodyHtml: text('body_html'),
  bodyText: text('body_text'),
  bodyJson: jsonb('body_json'), // For drag-drop editor
  
  // Thumbnail
  thumbnailUrl: text('thumbnail_url'),
  
  // Category
  category: text('category'), // promotional, transactional, newsletter, welcome, etc.
  tags: text('tags').array().default([]),
  
  // Template type
  isSystem: boolean('is_system').default(false),
  isPublic: boolean('is_public').default(false),
  
  // Versioning
  version: integer('version').default(1),
  
  // Usage stats
  usedCount: integer('used_count').default(0),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
}, (table) => [
  index('growth_email_templates_venture_idx').on(table.ventureId),
  index('growth_email_templates_category_idx').on(table.category),
]);

export const emailSendingDomains = pgTable('growth_email_domains', {
  ...baseColumns,
  domain: text('domain').notNull(),
  
  // Verification status
  verificationStatus: text('verification_status').default('pending'), // pending, verified, failed
  verificationToken: text('verification_token'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  
  // DNS records
  dkimRecords: jsonb('dkim_records'),
  spfVerified: boolean('spf_verified').default(false),
  dmarcVerified: boolean('dmarc_verified').default(false),
  
  // Sending identity
  defaultFromName: text('default_from_name'),
  defaultFromEmail: text('default_from_email'),
  defaultReplyTo: text('default_reply_to'),
  
  // Reputation
  reputationScore: integer('reputation_score'),
  bounceRate: numeric('bounce_rate', { precision: 5, scale: 2 }),
  complaintRate: numeric('complaint_rate', { precision: 5, scale: 2 }),
  
  // Settings
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
}, (table) => [
  index('growth_email_domains_venture_idx').on(table.ventureId),
]);

export const emailSubscribers = pgTable('growth_email_subscribers', {
  ...baseColumns,
  email: text('email').notNull(),
  contactId: uuid('contact_id'),
  
  // Subscription status
  status: text('status').default('subscribed'), // subscribed, unsubscribed, cleaned, complained
  
  // Lists
  listIds: uuid('list_ids').array().default([]),
  
  // Preferences
  preferences: jsonb('preferences').$type<{
    frequency?: 'daily' | 'weekly' | 'monthly';
    categories?: string[];
    formats?: ('html' | 'text')[];
  }>(),
  
  // Engagement
  lastEmailSentAt: timestamp('last_email_sent_at', { withTimezone: true }),
  lastEmailOpenedAt: timestamp('last_email_opened_at', { withTimezone: true }),
  lastEmailClickedAt: timestamp('last_email_clicked_at', { withTimezone: true }),
  emailsSent: integer('emails_sent').default(0),
  emailsOpened: integer('emails_opened').default(0),
  emailsClicked: integer('emails_clicked').default(0),
  
  // Subscription history
  subscribedAt: timestamp('subscribed_at', { withTimezone: true }),
  unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
  unsubscribeReason: text('unsubscribe_reason'),
  
  // Double opt-in
  confirmationToken: text('confirmation_token'),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  
  // Source
  source: text('source'),
  sourceId: text('source_id'),
  
  // IP and consent
  signupIp: text('signup_ip'),
  consentText: text('consent_text'),
}, (table) => [
  index('growth_subscribers_venture_idx').on(table.ventureId),
  index('growth_subscribers_email_idx').on(table.email),
  index('growth_subscribers_status_idx').on(table.status),
]);

export const emailLists = pgTable('growth_email_lists', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  
  // Type
  type: text('type').default('manual'), // manual, segment, dynamic
  
  // For dynamic lists
  segmentId: uuid('segment_id'),
  conditions: jsonb('conditions'),
  
  // Stats
  subscriberCount: integer('subscriber_count').default(0),
  
  // Double opt-in
  requireDoubleOptIn: boolean('require_double_opt_in').default(false),
  confirmationTemplateId: uuid('confirmation_template_id'),
  
  // Welcome email
  sendWelcomeEmail: boolean('send_welcome_email').default(false),
  welcomeTemplateId: uuid('welcome_template_id'),
  
  isActive: boolean('is_active').default(true),
}, (table) => [
  index('growth_email_lists_venture_idx').on(table.ventureId),
]);

export const emailBounces = pgTable('growth_email_bounces', {
  ...baseColumns,
  email: text('email').notNull(),
  subscriberId: uuid('subscriber_id'),
  
  // Bounce type
  bounceType: text('bounce_type').notNull(), // hard, soft, complaint
  bounceSubtype: text('bounce_subtype'), // general, invalid, blocked, etc.
  
  // Details
  diagnosticCode: text('diagnostic_code'),
  errorMessage: text('error_message'),
  
  // Source
  campaignId: uuid('campaign_id'),
  messageId: text('message_id'),
  
  bouncedAt: timestamp('bounced_at', { withTimezone: true }).notNull(),
}, (table) => [
  index('growth_bounces_venture_idx').on(table.ventureId),
  index('growth_bounces_email_idx').on(table.email),
]);
```

### Service Implementation

```typescript
// @mcv/growth/email-campaigns/service.ts
import { db, getContext, NotFoundError, ValidationError } from '@mcv/kernel';
import { emailTemplates, emailSendingDomains, emailSubscribers, emailLists, emailBounces } from './schema';
import { eq, and, sql, inArray, isNull, ilike, desc } from 'drizzle-orm';
import * as mjml from 'mjml';

export class EmailTemplateService {
  
  /**
   * Create an email template
   */
  async create(input: any): Promise<any> {
    const ctx = getContext();
    
    // If bodyJson provided, compile to HTML
    let bodyHtml = input.bodyHtml;
    let bodyText = input.bodyText;
    
    if (input.bodyJson) {
      const { html, text } = await this.compileTemplate(input.bodyJson);
      bodyHtml = html;
      bodyText = text;
    }
    
    const [template] = await db.insert(emailTemplates).values({
      ventureId: ctx.venture.id,
      name: input.name,
      description: input.description,
      subject: input.subject,
      preheaderText: input.preheaderText,
      bodyHtml,
      bodyText,
      bodyJson: input.bodyJson,
      category: input.category,
      tags: input.tags,
      createdBy: ctx.user?.id,
    }).returning();
    
    return template;
  }
  
  /**
   * Render a template with personalization data
   */
  async render(templateId: string, data: Record<string, unknown>): Promise<{
    subject: string;
    bodyHtml: string;
    bodyText: string;
  }> {
    const ctx = getContext();
    
    const template = await db.query.emailTemplates.findFirst({
      where: and(
        eq(emailTemplates.id, templateId),
        eq(emailTemplates.ventureId, ctx.venture.id)
      ),
    });
    
    if (!template) {
      throw new NotFoundError('EmailTemplate', templateId);
    }
    
    // Replace merge tags
    const subject = this.replaceMergeTags(template.subject || '', data);
    const bodyHtml = this.replaceMergeTags(template.bodyHtml || '', data);
    const bodyText = this.replaceMergeTags(template.bodyText || '', data);
    
    // Track usage
    await db.update(emailTemplates)
      .set({
        usedCount: sql`${emailTemplates.usedCount} + 1`,
        lastUsedAt: new Date(),
      })
      .where(eq(emailTemplates.id, templateId));
    
    return { subject, bodyHtml, bodyText };
  }
  
  /**
   * Preview template with sample data
   */
  async preview(templateId: string, sampleData?: Record<string, unknown>): Promise<{
    subject: string;
    bodyHtml: string;
    bodyText: string;
    previewText: string;
  }> {
    const defaultData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      company: 'Acme Inc',
      unsubscribeUrl: 'https://example.com/unsubscribe',
      preferencesUrl: 'https://example.com/preferences',
      ...sampleData,
    };
    
    const rendered = await this.render(templateId, defaultData);
    
    return {
      ...rendered,
      previewText: this.extractPreviewText(rendered.bodyHtml),
    };
  }
  
  private async compileTemplate(bodyJson: any): Promise<{ html: string; text: string }> {
    // Convert editor JSON to MJML then to HTML
    const mjmlContent = this.jsonToMjml(bodyJson);
    const { html } = mjml(mjmlContent);
    
    // Generate plain text version
    const text = this.htmlToText(html);
    
    return { html, text };
  }
  
  private jsonToMjml(json: any): string {
    // Convert drag-drop editor format to MJML
    // This is a simplified version
    let mjmlContent = '<mjml><mj-body>';
    
    for (const section of json.sections || []) {
      mjmlContent += '<mj-section>';
      for (const column of section.columns || []) {
        mjmlContent += '<mj-column>';
        for (const block of column.blocks || []) {
          switch (block.type) {
            case 'text':
              mjmlContent += `<mj-text>${block.content}</mj-text>`;
              break;
            case 'image':
              mjmlContent += `<mj-image src="${block.src}" />`;
              break;
            case 'button':
              mjmlContent += `<mj-button href="${block.href}">${block.text}</mj-button>`;
              break;
          }
        }
        mjmlContent += '</mj-column>';
      }
      mjmlContent += '</mj-section>';
    }
    
    mjmlContent += '</mj-body></mjml>';
    return mjmlContent;
  }
  
  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  private replaceMergeTags(content: string, data: Record<string, unknown>): string {
    return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return String(data[key] || match);
    });
  }
  
  private extractPreviewText(html: string): string {
    // Extract first 100 characters of text content
    const text = this.htmlToText(html);
    return text.substring(0, 100) + '...';
  }
}

export class EmailSubscriberService {
  
  /**
   * Subscribe an email to a list
   */
  async subscribe(input: {
    email: string;
    listIds: string[];
    contactId?: string;
    source?: string;
    signupIp?: string;
    consentText?: string;
  }): Promise<any> {
    const ctx = getContext();
    
    // Check if email already exists
    let subscriber = await db.query.emailSubscribers.findFirst({
      where: and(
        eq(emailSubscribers.ventureId, ctx.venture.id),
        eq(emailSubscribers.email, input.email.toLowerCase())
      ),
    });
    
    if (subscriber) {
      // Update existing subscriber
      const newListIds = [...new Set([...(subscriber.listIds || []), ...input.listIds])];
      
      const [updated] = await db.update(emailSubscribers)
        .set({
          listIds: newListIds,
          status: 'subscribed',
          subscribedAt: new Date(),
          unsubscribedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(emailSubscribers.id, subscriber.id))
        .returning();
      
      subscriber = updated;
    } else {
      // Create new subscriber
      const [created] = await db.insert(emailSubscribers).values({
        ventureId: ctx.venture.id,
        email: input.email.toLowerCase(),
        contactId: input.contactId,
        listIds: input.listIds,
        status: 'subscribed',
        subscribedAt: new Date(),
        source: input.source,
        signupIp: input.signupIp,
        consentText: input.consentText,
        createdBy: ctx.user?.id,
      }).returning();
      
      subscriber = created;
    }
    
    // Check if any list requires double opt-in
    const lists = await db.query.emailLists.findMany({
      where: inArray(emailLists.id, input.listIds),
    });
    
    const requiresConfirmation = lists.some(l => l.requireDoubleOptIn);
    
    if (requiresConfirmation) {
      await this.sendConfirmationEmail(subscriber);
    } else {
      // Send welcome emails
      for (const list of lists) {
        if (list.sendWelcomeEmail && list.welcomeTemplateId) {
          await this.sendWelcomeEmail(subscriber, list);
        }
      }
    }
    
    // Update list counts
    await this.updateListCounts(input.listIds);
    
    return subscriber;
  }
  
  /**
   * Unsubscribe from all or specific lists
   */
  async unsubscribe(email: string, reason?: string, listIds?: string[]): Promise<void> {
    const ctx = getContext();
    
    const subscriber = await db.query.emailSubscribers.findFirst({
      where: and(
        eq(emailSubscribers.ventureId, ctx.venture.id),
        eq(emailSubscribers.email, email.toLowerCase())
      ),
    });
    
    if (!subscriber) return;
    
    if (listIds?.length) {
      // Unsubscribe from specific lists
      const newListIds = (subscriber.listIds || []).filter(id => !listIds.includes(id));
      
      await db.update(emailSubscribers)
        .set({
          listIds: newListIds,
          status: newListIds.length > 0 ? 'subscribed' : 'unsubscribed',
          unsubscribedAt: newListIds.length === 0 ? new Date() : null,
          unsubscribeReason: reason,
          updatedAt: new Date(),
        })
        .where(eq(emailSubscribers.id, subscriber.id));
      
      await this.updateListCounts(listIds);
    } else {
      // Global unsubscribe
      await db.update(emailSubscribers)
        .set({
          status: 'unsubscribed',
          listIds: [],
          unsubscribedAt: new Date(),
          unsubscribeReason: reason,
          updatedAt: new Date(),
        })
        .where(eq(emailSubscribers.id, subscriber.id));
      
      if (subscriber.listIds?.length) {
        await this.updateListCounts(subscriber.listIds);
      }
    }
    
    // Add to suppression list
    await this.addToSuppressionList(email, 'unsubscribe');
  }
  
  /**
   * Handle bounce
   */
  async handleBounce(input: {
    email: string;
    bounceType: 'hard' | 'soft' | 'complaint';
    bounceSubtype?: string;
    diagnosticCode?: string;
    campaignId?: string;
    messageId?: string;
  }): Promise<void> {
    const ctx = getContext();
    
    // Record bounce
    await db.insert(emailBounces).values({
      ventureId: ctx.venture.id,
      email: input.email.toLowerCase(),
      bounceType: input.bounceType,
      bounceSubtype: input.bounceSubtype,
      diagnosticCode: input.diagnosticCode,
      campaignId: input.campaignId,
      messageId: input.messageId,
      bouncedAt: new Date(),
    });
    
    // Update subscriber status for hard bounces
    if (input.bounceType === 'hard' || input.bounceType === 'complaint') {
      await db.update(emailSubscribers)
        .set({
          status: input.bounceType === 'complaint' ? 'complained' : 'cleaned',
          updatedAt: new Date(),
        })
        .where(and(
          eq(emailSubscribers.ventureId, ctx.venture.id),
          eq(emailSubscribers.email, input.email.toLowerCase())
        ));
      
      // Add to suppression list
      await this.addToSuppressionList(input.email, input.bounceType);
    }
  }
  
  /**
   * Confirm double opt-in
   */
  async confirmSubscription(token: string): Promise<any> {
    const subscriber = await db.query.emailSubscribers.findFirst({
      where: eq(emailSubscribers.confirmationToken, token),
    });
    
    if (!subscriber) {
      throw new ValidationError('Invalid confirmation token');
    }
    
    const [confirmed] = await db.update(emailSubscribers)
      .set({
        confirmedAt: new Date(),
        confirmationToken: null,
        status: 'subscribed',
        updatedAt: new Date(),
      })
      .where(eq(emailSubscribers.id, subscriber.id))
      .returning();
    
    // Send welcome emails
    const lists = await db.query.emailLists.findMany({
      where: inArray(emailLists.id, subscriber.listIds || []),
    });
    
    for (const list of lists) {
      if (list.sendWelcomeEmail && list.welcomeTemplateId) {
        await this.sendWelcomeEmail(confirmed, list);
      }
    }
    
    return confirmed;
  }
  
  private async sendConfirmationEmail(subscriber: any): Promise<void> {
    const token = crypto.randomUUID();
    
    await db.update(emailSubscribers)
      .set({ confirmationToken: token })
      .where(eq(emailSubscribers.id, subscriber.id));
    
    // Send confirmation email via email service
  }
  
  private async sendWelcomeEmail(subscriber: any, list: any): Promise<void> {
    // Send welcome email via email service
  }
  
  private async addToSuppressionList(email: string, reason: string): Promise<void> {
    // Add to global suppression list
  }
  
  private async updateListCounts(listIds: string[]): Promise<void> {
    for (const listId of listIds) {
      const [{ count }] = await db.select({ count: sql<number>`count(*)` })
        .from(emailSubscribers)
        .where(sql`${listId} = ANY(list_ids) AND status = 'subscribed'`);
      
      await db.update(emailLists)
        .set({ subscriberCount: count })
        .where(eq(emailLists.id, listId));
    }
  }
}

export const emailTemplateService = new EmailTemplateService();
export const emailSubscriberService = new EmailSubscriberService();
```

---

## Module: sms

### Purpose

SMS/MMS messaging with carrier compliance, number management, opt-out handling, and conversation threading.

### Database Schema

```typescript
// @mcv/growth/sms/schema.ts
import { pgTable, uuid, text, timestamp, jsonb, boolean, integer, numeric, index } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel/db';

export const smsPhoneNumbers = pgTable('growth_sms_phone_numbers', {
  ...baseColumns,
  phoneNumber: text('phone_number').notNull(),
  friendlyName: text('friendly_name'),
  
  // Provider
  provider: text('provider').notNull(), // twilio, bandwidth, vonage
  providerNumberId: text('provider_number_id'),
  
  // Type
  numberType: text('number_type').notNull(), // local, toll_free, short_code
  country: text('country').default('US'),
  
  // Capabilities
  canSms: boolean('can_sms').default(true),
  canMms: boolean('can_mms').default(false),
  canVoice: boolean('can_voice').default(false),
  
  // Registration (for A2P 10DLC)
  campaignId: text('campaign_id'),
  brandId: text('brand_id'),
  registrationStatus: text('registration_status'), // pending, approved, rejected
  
  // Settings
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  
  // Rate limits
  dailyLimit: integer('daily_limit'),
  monthlyLimit: integer('monthly_limit'),
  sentToday: integer('sent_today').default(0),
  sentThisMonth: integer('sent_this_month').default(0),
}, (table) => [
  index('growth_sms_numbers_venture_idx').on(table.ventureId),
]);

export const smsTemplates = pgTable('growth_sms_templates', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  
  // Content
  body: text('body').notNull(),
  mediaUrls: text('media_urls').array().default([]), // For MMS
  
  // Category
  category: text('category'), // promotional, transactional, otp
  
  // Carrier approval (for short codes)
  carrierApproved: boolean('carrier_approved').default(false),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  
  // Stats
  usedCount: integer('used_count').default(0),
  
  isActive: boolean('is_active').default(true),
}, (table) => [
  index('growth_sms_templates_venture_idx').on(table.ventureId),
]);

export const smsMessages = pgTable('growth_sms_messages', {
  ...baseColumns,
  
  // Numbers
  fromNumber: text('from_number').notNull(),
  toNumber: text('to_number').notNull(),
  
  // Content
  body: text('body').notNull(),
  mediaUrls: text('media_urls').array().default([]),
  numSegments: integer('num_segments').default(1),
  
  // Direction
  direction: text('direction').notNull(), // outbound, inbound
  
  // Status
  status: text('status').default('queued'), // queued, sending, sent, delivered, failed, undelivered
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  
  // Provider tracking
  providerMessageId: text('provider_message_id'),
  
  // Related entities
  contactId: uuid('contact_id'),
  campaignId: uuid('campaign_id'),
  automationId: uuid('automation_id'),
  
  // Timing
  sentAt: timestamp('sent_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  
  // Cost
  cost: numeric('cost', { precision: 10, scale: 4 }),
  currency: text('currency').default('USD'),
  
  // Conversation threading
  conversationId: uuid('conversation_id'),
  isReply: boolean('is_reply').default(false),
}, (table) => [
  index('growth_sms_messages_venture_idx').on(table.ventureId),
  index('growth_sms_messages_to_idx').on(table.toNumber),
  index('growth_sms_messages_campaign_idx').on(table.campaignId),
  index('growth_sms_messages_conversation_idx').on(table.conversationId),
]);

export const smsOptOuts = pgTable('growth_sms_opt_outs', {
  ...baseColumns,
  phoneNumber: text('phone_number').notNull(),
  
  // Opt-out type
  type: text('type').default('global'), // global, list, keyword
  listId: uuid('list_id'),
  keyword: text('keyword'),
  
  // Source
  source: text('source'), // reply, api, carrier
  sourceMessageId: uuid('source_message_id'),
  
  optedOutAt: timestamp('opted_out_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('growth_sms_opt_outs_venture_idx').on(table.ventureId),
  index('growth_sms_opt_outs_phone_idx').on(table.phoneNumber),
]);

export const smsConversations = pgTable('growth_sms_conversations', {
  ...baseColumns,
  
  // Participants
  fromNumber: text('from_number').notNull(),
  toNumber: text('to_number').notNull(),
  contactId: uuid('contact_id'),
  
  // Status
  status: text('status').default('open'), // open, closed, archived
  
  // Last message
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
  lastMessagePreview: text('last_message_preview'),
  
  // Message counts
  inboundCount: integer('inbound_count').default(0),
  outboundCount: integer('outbound_count').default(0),
  
  // Assignment
  assignedTo: uuid('assigned_to'),
  
  metadata: jsonb('metadata'),
}, (table) => [
  index('growth_sms_conversations_venture_idx').on(table.ventureId),
  index('growth_sms_conversations_contact_idx').on(table.contactId),
]);
```

---

## Module: affiliates

### Purpose

Complete affiliate program management with multi-tier commissions, link tracking, payout processing, and fraud detection.

### Database Schema

```typescript
// @mcv/growth/affiliates/schema.ts
import { pgTable, uuid, text, timestamp, jsonb, boolean, integer, numeric, index } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel/db';

export const affiliatePrograms = pgTable('growth_affiliate_programs', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  slug: text('slug').notNull(),
  
  // Commission structure
  commissionType: text('commission_type').notNull(), // percentage, fixed, tiered
  defaultCommissionRate: numeric('default_commission_rate', { precision: 10, scale: 4 }),
  defaultCommissionAmount: numeric('default_commission_amount', { precision: 10, scale: 2 }),
  
  // Tiered commissions
  tiers: jsonb('tiers').$type<CommissionTier[]>(),
  /*
    tiers: [
      { minRevenue: 0, maxRevenue: 1000, rate: 10 },
      { minRevenue: 1000, maxRevenue: 5000, rate: 15 },
      { minRevenue: 5000, rate: 20 },
    ]
  */
  
  // Multi-level settings
  multiLevel: boolean('multi_level').default(false),
  maxLevels: integer('max_levels').default(1),
  levelRates: jsonb('level_rates').$type<number[]>(), // [10, 5, 2] = 10% L1, 5% L2, 2% L3
  
  // Cookie settings
  cookieDuration: integer('cookie_duration_days').default(30),
  
  // Attribution
  attributionModel: text('attribution_model').default('last_click'), // first_click, last_click, linear
  
  // Minimum payout
  minimumPayout: numeric('minimum_payout', { precision: 10, scale: 2 }).default('50'),
  payoutCurrency: text('payout_currency').default('USD'),
  
  // Payment schedule
  payoutFrequency: text('payout_frequency').default('monthly'), // weekly, bi_weekly, monthly
  payoutDelay: integer('payout_delay_days').default(30), // Hold period for refunds
  
  // Status
  isActive: boolean('is_active').default(true),
  
  // Approval
  requireApproval: boolean('require_approval').default(true),
  autoApproveThreshold: integer('auto_approve_threshold'),
  
  // Terms
  termsUrl: text('terms_url'),
  
  // Assets
  bannerUrls: text('banner_urls').array().default([]),
  landingPageUrl: text('landing_page_url'),
}, (table) => [
  index('growth_affiliate_programs_venture_idx').on(table.ventureId),
]);

export type CommissionTier = {
  minRevenue?: number;
  maxRevenue?: number;
  minReferrals?: number;
  maxReferrals?: number;
  rate?: number;
  amount?: number;
};

export const affiliates = pgTable('growth_affiliates', {
  ...baseColumns,
  programId: uuid('program_id').references(() => affiliatePrograms.id).notNull(),
  
  // Identity
  userId: uuid('user_id'),
  contactId: uuid('contact_id'),
  email: text('email').notNull(),
  name: text('name'),
  company: text('company'),
  
  // Affiliate code
  affiliateCode: text('affiliate_code').notNull(),
  
  // Custom commission override
  customCommissionRate: numeric('custom_commission_rate', { precision: 10, scale: 4 }),
  customCommissionAmount: numeric('custom_commission_amount', { precision: 10, scale: 2 }),
  
  // Multi-level
  parentAffiliateId: uuid('parent_affiliate_id').references(() => affiliates.id),
  level: integer('level').default(1),
  
  // Status
  status: text('status').default('pending'), // pending, approved, active, suspended, rejected
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  approvedBy: uuid('approved_by'),
  
  // Payment info
  payoutMethod: text('payout_method'), // paypal, bank_transfer, check
  payoutDetails: jsonb('payout_details'), // encrypted
  
  // Stats
  totalClicks: integer('total_clicks').default(0),
  totalReferrals: integer('total_referrals').default(0),
  totalRevenue: numeric('total_revenue', { precision: 15, scale: 2 }).default('0'),
  totalCommissions: numeric('total_commissions', { precision: 15, scale: 2 }).default('0'),
  totalPaid: numeric('total_paid', { precision: 15, scale: 2 }).default('0'),
  pendingBalance: numeric('pending_balance', { precision: 15, scale: 2 }).default('0'),
  availableBalance: numeric('available_balance', { precision: 15, scale: 2 }).default('0'),
  
  // Fraud score
  fraudScore: integer('fraud_score').default(0),
  
  // Notes
  internalNotes: text('internal_notes'),
  
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
}, (table) => [
  index('growth_affiliates_program_idx').on(table.programId),
  index('growth_affiliates_code_idx').on(table.affiliateCode),
  index('growth_affiliates_parent_idx').on(table.parentAffiliateId),
]);

export const affiliateLinks = pgTable('growth_affiliate_links', {
  ...baseColumns,
  affiliateId: uuid('affiliate_id').references(() => affiliates.id).notNull(),
  
  // Link details
  name: text('name'),
  destinationUrl: text('destination_url').notNull(),
  shortCode: text('short_code').notNull(),
  
  // UTM parameters
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  
  // Stats
  clickCount: integer('click_count').default(0),
  uniqueClickCount: integer('unique_click_count').default(0),
  conversionCount: integer('conversion_count').default(0),
  revenue: numeric('revenue', { precision: 15, scale: 2 }).default('0'),
  
  isActive: boolean('is_active').default(true),
}, (table) => [
  index('growth_affiliate_links_affiliate_idx').on(table.affiliateId),
  index('growth_affiliate_links_short_code_idx').on(table.shortCode),
]);

export const affiliateClicks = pgTable('growth_affiliate_clicks', {
  ...baseColumns,
  affiliateLinkId: uuid('affiliate_link_id').references(() => affiliateLinks.id).notNull(),
  affiliateId: uuid('affiliate_id').references(() => affiliates.id).notNull(),
  
  // Tracking
  visitorId: text('visitor_id'),
  sessionId: text('session_id'),
  
  // Source
  referrer: text('referrer'),
  landingPage: text('landing_page'),
  
  // Device info
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  deviceType: text('device_type'),
  browser: text('browser'),
  os: text('os'),
  
  // Geo
  country: text('country'),
  region: text('region'),
  city: text('city'),
  
  // Conversion
  converted: boolean('converted').default(false),
  conversionId: uuid('conversion_id'),
  
  clickedAt: timestamp('clicked_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('growth_affiliate_clicks_link_idx').on(table.affiliateLinkId),
  index('growth_affiliate_clicks_affiliate_idx').on(table.affiliateId),
  index('growth_affiliate_clicks_visitor_idx').on(table.visitorId),
]);

export const affiliateCommissions = pgTable('growth_affiliate_commissions', {
  ...baseColumns,
  affiliateId: uuid('affiliate_id').references(() => affiliates.id).notNull(),
  programId: uuid('program_id').references(() => affiliatePrograms.id).notNull(),
  
  // Related entities
  orderId: uuid('order_id'),
  subscriptionId: uuid('subscription_id'),
  clickId: uuid('click_id'),
  
  // Customer
  customerId: uuid('customer_id'),
  customerEmail: text('customer_email'),
  
  // Commission details
  type: text('type').notNull(), // sale, subscription, renewal, refund
  level: integer('level').default(1), // MLM level
  orderAmount: numeric('order_amount', { precision: 15, scale: 2 }).notNull(),
  commissionRate: numeric('commission_rate', { precision: 10, scale: 4 }),
  commissionAmount: numeric('commission_amount', { precision: 10, scale: 2 }).notNull(),
  
  // Currency
  currency: text('currency').default('USD'),
  
  // Status
  status: text('status').default('pending'), // pending, approved, paid, declined, refunded
  
  // Timing
  availableAt: timestamp('available_at', { withTimezone: true }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  approvedBy: uuid('approved_by'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  
  // Payout reference
  payoutId: uuid('payout_id'),
  
  // Refund tracking
  originalCommissionId: uuid('original_commission_id'),
  
  notes: text('notes'),
}, (table) => [
  index('growth_affiliate_commissions_affiliate_idx').on(table.affiliateId),
  index('growth_affiliate_commissions_status_idx').on(table.status),
  index('growth_affiliate_commissions_payout_idx').on(table.payoutId),
]);

export const affiliatePayouts = pgTable('growth_affiliate_payouts', {
  ...baseColumns,
  affiliateId: uuid('affiliate_id').references(() => affiliates.id).notNull(),
  
  // Amount
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currency: text('currency').default('USD'),
  
  // Fees
  feeAmount: numeric('fee_amount', { precision: 10, scale: 2 }).default('0'),
  netAmount: numeric('net_amount', { precision: 15, scale: 2 }).notNull(),
  
  // Payment method
  payoutMethod: text('payout_method').notNull(),
  payoutDetails: jsonb('payout_details'),
  
  // Status
  status: text('status').default('pending'), // pending, processing, completed, failed
  
  // Provider tracking
  providerPayoutId: text('provider_payout_id'),
  providerResponse: jsonb('provider_response'),
  
  // Timing
  initiatedAt: timestamp('initiated_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  failedAt: timestamp('failed_at', { withTimezone: true }),
  failureReason: text('failure_reason'),
  
  // Commission count
  commissionCount: integer('commission_count').default(0),
  
  notes: text('notes'),
}, (table) => [
  index('growth_affiliate_payouts_affiliate_idx').on(table.affiliateId),
  index('growth_affiliate_payouts_status_idx').on(table.status),
]);
```

---

## Module: referrals

### Purpose

Customer referral programs with viral mechanics, reward distribution, and referral tracking.

### Database Schema

```typescript
// @mcv/growth/referrals/schema.ts
import { pgTable, uuid, text, timestamp, jsonb, boolean, integer, numeric, index } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel/db';

export const referralPrograms = pgTable('growth_referral_programs', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  
  // Rewards
  referrerReward: jsonb('referrer_reward').$type<ReferralReward>().notNull(),
  refereeReward: jsonb('referee_reward').$type<ReferralReward>(),
  
  // Conditions
  minimumPurchase: numeric('minimum_purchase', { precision: 10, scale: 2 }),
  requiredAction: text('required_action').default('purchase'), // signup, purchase, subscription
  
  // Limits
  maxRewardsPerReferrer: integer('max_rewards_per_referrer'),
  maxRewardsPerDay: integer('max_rewards_per_day'),
  maxRewardsTotal: integer('max_rewards_total'),
  
  // Expiration
  referralLinkExpiry: integer('referral_link_expiry_days'),
  rewardExpiry: integer('reward_expiry_days'),
  
  // Status
  isActive: boolean('is_active').default(true),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  
  // Custom messaging
  emailSubject: text('email_subject'),
  emailBody: text('email_body'),
  shareMessage: text('share_message'),
  
  // Stats
  totalReferrals: integer('total_referrals').default(0),
  successfulReferrals: integer('successful_referrals').default(0),
  totalRewardsGiven: numeric('total_rewards_given', { precision: 15, scale: 2 }).default('0'),
}, (table) => [
  index('growth_referral_programs_venture_idx').on(table.ventureId),
]);

export type ReferralReward = {
  type: 'discount_percent' | 'discount_fixed' | 'credit' | 'free_product' | 'free_month' | 'points';
  value: number;
  currency?: string;
  productId?: string;
  maxValue?: number;
  oneTimeUse?: boolean;
};

export const referralCodes = pgTable('growth_referral_codes', {
  ...baseColumns,
  programId: uuid('program_id').references(() => referralPrograms.id).notNull(),
  
  // Owner
  referrerId: uuid('referrer_id').notNull(), // contactId or userId
  referrerType: text('referrer_type').notNull(), // contact, user
  
  // Code
  code: text('code').notNull(),
  
  // Stats
  shareCount: integer('share_count').default(0),
  clickCount: integer('click_count').default(0),
  signupCount: integer('signup_count').default(0),
  conversionCount: integer('conversion_count').default(0),
  rewardCount: integer('reward_count').default(0),
  
  // Status
  isActive: boolean('is_active').default(true),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
}, (table) => [
  index('growth_referral_codes_program_idx').on(table.programId),
  index('growth_referral_codes_code_idx').on(table.code),
  index('growth_referral_codes_referrer_idx').on(table.referrerId),
]);

export const referrals = pgTable('growth_referrals', {
  ...baseColumns,
  programId: uuid('program_id').references(() => referralPrograms.id).notNull(),
  codeId: uuid('code_id').references(() => referralCodes.id).notNull(),
  
  // Parties
  referrerId: uuid('referrer_id').notNull(),
  refereeId: uuid('referee_id').notNull(),
  refereeEmail: text('referee_email'),
  
  // Status
  status: text('status').default('pending'), // pending, qualified, rewarded, expired, cancelled
  
  // Qualification
  qualificationAction: text('qualification_action'), // signup, purchase, etc.
  qualificationData: jsonb('qualification_data'),
  qualifiedAt: timestamp('qualified_at', { withTimezone: true }),
  
  // Rewards
  referrerRewardId: uuid('referrer_reward_id'),
  refereeRewardId: uuid('referee_reward_id'),
  rewardedAt: timestamp('rewarded_at', { withTimezone: true }),
  
  // Attribution
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  
  expiresAt: timestamp('expires_at', { withTimezone: true }),
}, (table) => [
  index('growth_referrals_program_idx').on(table.programId),
  index('growth_referrals_referrer_idx').on(table.referrerId),
  index('growth_referrals_referee_idx').on(table.refereeId),
  index('growth_referrals_status_idx').on(table.status),
]);

export const referralRewards = pgTable('growth_referral_rewards', {
  ...baseColumns,
  referralId: uuid('referral_id').references(() => referrals.id).notNull(),
  recipientId: uuid('recipient_id').notNull(),
  
  // Reward details
  rewardType: text('reward_type').notNull(),
  rewardValue: numeric('reward_value', { precision: 10, scale: 2 }).notNull(),
  rewardCurrency: text('reward_currency'),
  
  // Delivery
  deliveryMethod: text('delivery_method'), // coupon_code, account_credit, email
  couponCode: text('coupon_code'),
  
  // Status
  status: text('status').default('pending'), // pending, delivered, redeemed, expired
  
  // Usage
  redeemedAt: timestamp('redeemed_at', { withTimezone: true }),
  orderId: uuid('order_id'),
  
  expiresAt: timestamp('expires_at', { withTimezone: true }),
}, (table) => [
  index('growth_referral_rewards_referral_idx').on(table.referralId),
  index('growth_referral_rewards_recipient_idx').on(table.recipientId),
]);
```

---

## Module: attribution

### Purpose

Multi-touch marketing attribution with multiple models, conversion tracking, and ROI analysis.

### Database Schema

```typescript
// @mcv/growth/attribution/schema.ts
import { pgTable, uuid, text, timestamp, jsonb, boolean, integer, numeric, index } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel/db';

export const attributionModels = pgTable('growth_attribution_models', {
  ...baseColumns,
  name: text('name').notNull(),
  description: text('description'),
  
  // Model type
  type: text('type').notNull(), // first_touch, last_touch, linear, time_decay, position_based, custom
  
  // Custom model config
  config: jsonb('config').$type<AttributionModelConfig>(),
  
  // Lookback window
  lookbackDays: integer('lookback_days').default(30),
  
  // Conversion events
  conversionEvents: text('conversion_events').array().default([]),
  
  isDefault: boolean('is