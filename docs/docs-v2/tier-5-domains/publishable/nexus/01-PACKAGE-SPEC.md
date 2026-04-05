# @mcv/nexus — Package Specification
## Tier 5: Domain Packages (Publishable)

**Package:** `@mcv/nexus`  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Executive Summary

`@mcv/nexus` is the unified customer relationship and communication hub for MCV.ONE. It provides a complete CRM system, omnichannel contact center, document management with e-signatures, conversation threading, call management, form building, support ticketing, and integrated calendar scheduling.

**Nexus is where businesses manage their entire customer lifecycle — from first contact to ongoing relationship.**

---

## Strategic Position

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              @mcv/nexus                                      │
│                    Customer Relationship & Communication Hub                 │
│                                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │     CRM     │ │   Contact   │ │   Conver-   │ │    Calls    │           │
│  │             │ │   Center    │ │   sations   │ │             │           │
│  │ • Contacts  │ │ • Inbox     │ │ • Threads   │ │ • VoIP      │           │
│  │ • Orgs      │ │ • Queues    │ │ • Messages  │ │ • Recording │           │
│  │ • Deals     │ │ • Routing   │ │ • Channels  │ │ • Analytics │           │
│  │ • Pipelines │ │ • Agents    │ │ • History   │ │ • IVR       │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │    Forms    │ │   Support   │ │  Documents  │ │     Sign    │           │
│  │             │ │             │ │             │ │             │           │
│  │ • Builder   │ │ • Tickets   │ │ • Storage   │ │ • E-Sign    │           │
│  │ • Fields    │ │ • SLA       │ │ • Folders   │ │ • Templates │           │
│  │ • Responses │ │ • Knowledge │ │ • Versions  │ │ • Audit     │           │
│  │ • Webhooks  │ │ • Portal    │ │ • Sharing   │ │ • Workflows │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                                              │
│                          ┌─────────────┐                                     │
│                          │   Calendar  │                                     │
│                          │             │                                     │
│                          │ • Events    │                                     │
│                          │ • Booking   │                                     │
│                          │ • Sync      │                                     │
│                          │ • Reminders │                                     │
│                          └─────────────┘                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
           ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
           │ @mcv/comms  │   │ @mcv/storage│   │ @mcv/search │
           │             │   │             │   │             │
           │ Email/SMS   │   │ Files/Media │   │ Full-text   │
           └─────────────┘   └─────────────┘   └─────────────┘
```

---

## Sub-Modules Overview

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| **crm** | Contact, organization, deal, and pipeline management | `Contact`, `Organization`, `Deal`, `Pipeline`, `Activity` |
| **contact-center** | Omnichannel inbox, queue management, agent routing | `Inbox`, `Queue`, `AgentSession`, `Routing` |
| **conversations** | Multi-channel conversation threading and history | `Conversation`, `Message`, `Thread`, `Channel` |
| **calls** | VoIP calling, recording, IVR, and call analytics | `Call`, `Recording`, `IVR`, `CallAnalytics` |
| **forms** | Form builder, field types, submissions, webhooks | `Form`, `FormField`, `Submission`, `FormWebhook` |
| **support** | Ticketing system, SLA management, knowledge base | `Ticket`, `SLA`, `Article`, `Portal` |
| **documents** | Document storage, versioning, folders, sharing | `Document`, `Folder`, `Version`, `Share` |
| **sign** | Electronic signatures, templates, signing workflows | `SignatureRequest`, `Template`, `Signer`, `Audit` |
| **calendar** | Event scheduling, booking pages, calendar sync | `Event`, `BookingPage`, `Availability`, `Reminder` |

---

## Module: crm

### Purpose

Complete customer relationship management system supporting contacts (individuals), organizations (companies), deals (opportunities), pipelines (sales processes), and activities (interactions).

### Data Models

```typescript
// @mcv/nexus/crm/schemas/contact.ts
import { pgTable, uuid, text, timestamp, jsonb, varchar, boolean, integer } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel';
import { organizations } from './organization';

export const contacts = pgTable('nexus_contacts', {
  ...baseColumns,
  
  // Identity
  email: text('email'),
  emailVerified: boolean('email_verified').default(false),
  phone: varchar('phone', { length: 32 }),
  phoneVerified: boolean('phone_verified').default(false),
  
  // Name
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  fullName: varchar('full_name', { length: 200 }).generatedAlwaysAs(
    sql`COALESCE(first_name || ' ' || last_name, first_name, last_name, email)`
  ),
  displayName: varchar('display_name', { length: 100 }),
  
  // Profile
  avatarUrl: text('avatar_url'),
  title: varchar('title', { length: 100 }),
  department: varchar('department', { length: 100 }),
  
  // Organization
  organizationId: uuid('organization_id').references(() => organizations.id),
  
  // Contact Info
  address: jsonb('address').$type<{
    street?: string;
    street2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>(),
  timezone: varchar('timezone', { length: 50 }),
  preferredLanguage: varchar('preferred_language', { length: 10 }),
  
  // Social
  linkedIn: text('linkedin_url'),
  twitter: varchar('twitter_handle', { length: 50 }),
  website: text('website_url'),
  
  // Classification
  status: varchar('status', { length: 20 }).default('active').notNull(),
  type: varchar('type', { length: 50 }), // lead, prospect, customer, partner
  source: varchar('source', { length: 100 }), // how they found us
  sourceDetail: text('source_detail'),
  
  // Scoring
  leadScore: integer('lead_score').default(0),
  engagementScore: integer('engagement_score').default(0),
  healthScore: integer('health_score'),
  
  // Lifecycle
  lifecycleStage: varchar('lifecycle_stage', { length: 50 }),
  firstContactAt: timestamp('first_contact_at', { withTimezone: true }),
  lastContactAt: timestamp('last_contact_at', { withTimezone: true }),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
  convertedAt: timestamp('converted_at', { withTimezone: true }),
  
  // Assignment
  ownerId: uuid('owner_id').references(() => users.id),
  
  // Custom Fields
  customFields: jsonb('custom_fields').$type<Record<string, unknown>>().default({}),
  
  // Tags
  tags: text('tags').array().default([]),
  
  // Marketing
  marketingOptIn: boolean('marketing_opt_in').default(false),
  marketingOptInAt: timestamp('marketing_opt_in_at', { withTimezone: true }),
  unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
  
  // GDPR/Privacy
  consentGiven: boolean('consent_given').default(false),
  consentGivenAt: timestamp('consent_given_at', { withTimezone: true }),
  dataRetentionExempt: boolean('data_retention_exempt').default(false),
});

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [contacts.organizationId],
    references: [organizations.id],
  }),
  owner: one(users, {
    fields: [contacts.ownerId],
    references: [users.id],
  }),
  deals: many(deals),
  activities: many(activities),
  conversations: many(conversationParticipants),
  tickets: many(tickets),
}));
```

```typescript
// @mcv/nexus/crm/schemas/organization.ts
import { pgTable, uuid, text, timestamp, jsonb, varchar, integer, decimal } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel';

export const organizations = pgTable('nexus_organizations', {
  ...baseColumns,
  
  // Identity
  name: varchar('name', { length: 200 }).notNull(),
  legalName: varchar('legal_name', { length: 200 }),
  slug: varchar('slug', { length: 100 }).unique(),
  
  // Profile
  logoUrl: text('logo_url'),
  website: text('website'),
  description: text('description'),
  
  // Classification
  industry: varchar('industry', { length: 100 }),
  subIndustry: varchar('sub_industry', { length: 100 }),
  type: varchar('type', { length: 50 }), // prospect, customer, partner, vendor
  size: varchar('size', { length: 50 }), // 1-10, 11-50, 51-200, etc.
  employeeCount: integer('employee_count'),
  
  // Financials
  annualRevenue: decimal('annual_revenue', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  fiscalYearEnd: varchar('fiscal_year_end', { length: 5 }), // MM-DD
  
  // Contact
  phone: varchar('phone', { length: 32 }),
  email: text('email'),
  
  // Address
  billingAddress: jsonb('billing_address').$type<AddressType>(),
  shippingAddress: jsonb('shipping_address').$type<AddressType>(),
  
  // Social
  linkedIn: text('linkedin_url'),
  twitter: varchar('twitter_handle', { length: 50 }),
  facebook: text('facebook_url'),
  
  // Identifiers
  taxId: varchar('tax_id', { length: 50 }),
  dunsNumber: varchar('duns_number', { length: 9 }),
  
  // Scoring
  healthScore: integer('health_score'),
  riskScore: integer('risk_score'),
  
  // Lifecycle
  status: varchar('status', { length: 20 }).default('active').notNull(),
  becameCustomerAt: timestamp('became_customer_at', { withTimezone: true }),
  churnedAt: timestamp('churned_at', { withTimezone: true }),
  
  // Assignment
  ownerId: uuid('owner_id').references(() => users.id),
  teamId: uuid('team_id'),
  
  // Hierarchy
  parentOrganizationId: uuid('parent_organization_id').references(() => organizations.id),
  
  // Custom
  customFields: jsonb('custom_fields').$type<Record<string, unknown>>().default({}),
  tags: text('tags').array().default([]),
});

export type AddressType = {
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  lat?: number;
  lng?: number;
};
```

```typescript
// @mcv/nexus/crm/schemas/deal.ts
import { pgTable, uuid, text, timestamp, varchar, decimal, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel';

export const deals = pgTable('nexus_deals', {
  ...baseColumns,
  
  // Identity
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  
  // Pipeline
  pipelineId: uuid('pipeline_id').references(() => pipelines.id).notNull(),
  stageId: uuid('stage_id').references(() => pipelineStages.id).notNull(),
  
  // Value
  amount: decimal('amount', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  recurringAmount: decimal('recurring_amount', { precision: 15, scale: 2 }),
  recurringPeriod: varchar('recurring_period', { length: 20 }), // monthly, yearly
  
  // Probability
  probability: integer('probability').default(0), // 0-100
  weightedAmount: decimal('weighted_amount', { precision: 15, scale: 2 }).generatedAlwaysAs(
    sql`amount * probability / 100`
  ),
  
  // Dates
  expectedCloseDate: timestamp('expected_close_date', { withTimezone: true }),
  actualCloseDate: timestamp('actual_close_date', { withTimezone: true }),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
  stageChangedAt: timestamp('stage_changed_at', { withTimezone: true }),
  
  // Status
  status: varchar('status', { length: 20 }).default('open').notNull(), // open, won, lost
  lostReason: varchar('lost_reason', { length: 200 }),
  lostReasonDetail: text('lost_reason_detail'),
  competitorId: uuid('competitor_id'),
  
  // Relationships
  contactId: uuid('contact_id').references(() => contacts.id),
  organizationId: uuid('organization_id').references(() => organizations.id),
  
  // Assignment
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  teamId: uuid('team_id'),
  
  // Source
  source: varchar('source', { length: 100 }),
  campaignId: uuid('campaign_id'),
  
  // Custom
  customFields: jsonb('custom_fields').$type<Record<string, unknown>>().default({}),
  tags: text('tags').array().default([]),
  
  // Scoring
  priority: varchar('priority', { length: 20 }).default('medium'),
  score: integer('score'),
});

export const pipelines = pgTable('nexus_pipelines', {
  ...baseColumns,
  
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).default('sales'), // sales, hiring, project
  currency: varchar('currency', { length: 3 }).default('USD'),
  
  // Settings
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  
  // Automation
  automationEnabled: boolean('automation_enabled').default(true),
  
  // Display
  displayOrder: integer('display_order').default(0),
  color: varchar('color', { length: 7 }),
});

export const pipelineStages = pgTable('nexus_pipeline_stages', {
  ...baseColumns,
  
  pipelineId: uuid('pipeline_id').references(() => pipelines.id).notNull(),
  
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  
  // Position
  displayOrder: integer('display_order').notNull(),
  
  // Probability
  probability: integer('probability').default(0), // Default probability when entering stage
  
  // Type
  type: varchar('type', { length: 20 }).default('active'), // active, won, lost
  
  // Automation
  rotDays: integer('rot_days'), // Days until deal is considered "rotting"
  autoMoveAfterDays: integer('auto_move_after_days'),
  autoMoveToStageId: uuid('auto_move_to_stage_id'),
  
  // Display
  color: varchar('color', { length: 7 }),
});

export const activities = pgTable('nexus_activities', {
  ...baseColumns,
  
  // Type
  type: varchar('type', { length: 50 }).notNull(), // call, email, meeting, task, note
  subtype: varchar('subtype', { length: 50 }), // inbound_call, outbound_email, etc.
  
  // Content
  subject: varchar('subject', { length: 200 }),
  description: text('description'),
  
  // Timing
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  durationMinutes: integer('duration_minutes'),
  
  // Status
  status: varchar('status', { length: 20 }).default('pending'), // pending, completed, cancelled
  outcome: varchar('outcome', { length: 50 }), // no_answer, left_voicemail, connected, etc.
  
  // Associations
  contactId: uuid('contact_id').references(() => contacts.id),
  organizationId: uuid('organization_id').references(() => organizations.id),
  dealId: uuid('deal_id').references(() => deals.id),
  
  // Assignment
  ownerId: uuid('owner_id').references(() => users.id),
  assignedTo: uuid('assigned_to').references(() => users.id),
  
  // Related records
  relatedType: varchar('related_type', { length: 50 }),
  relatedId: uuid('related_id'),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
});
```

### Services

```typescript
// @mcv/nexus/crm/services/contact.service.ts
import { db, getContext, NotFoundError, ConflictError, ValidationError } from '@mcv/kernel';
import { contacts, organizations } from '../schemas';
import { eq, and, ilike, or, isNull, sql, desc, asc, inArray } from 'drizzle-orm';
import type { 
  Contact, 
  CreateContactInput, 
  UpdateContactInput,
  ContactFilters,
  ContactSearchResult 
} from '../types';

export class ContactService {
  
  /**
   * Create a new contact
   */
  async create(input: CreateContactInput): Promise<Contact> {
    const ctx = getContext();
    
    // Check for duplicate email within venture
    if (input.email) {
      const existing = await db.query.contacts.findFirst({
        where: and(
          eq(contacts.ventureId, ctx.venture.id),
          eq(contacts.email, input.email.toLowerCase()),
          isNull(contacts.deletedAt)
        ),
      });
      
      if (existing) {
        throw new ConflictError('Contact with this email already exists', 'email');
      }
    }
    
    const [contact] = await db.insert(contacts).values({
      ...input,
      email: input.email?.toLowerCase(),
      ventureId: ctx.venture.id,
      createdBy: ctx.user?.id,
      updatedBy: ctx.user?.id,
      firstContactAt: new Date(),
    }).returning();
    
    // Emit event for automation
    await this.emitEvent('contact.created', contact);
    
    return contact;
  }
  
  /**
   * Get contact by ID
   */
  async getById(id: string): Promise<Contact> {
    const ctx = getContext();
    
    const contact = await db.query.contacts.findFirst({
      where: and(
        eq(contacts.id, id),
        eq(contacts.ventureId, ctx.venture.id),
        isNull(contacts.deletedAt)
      ),
      with: {
        organization: true,
        owner: true,
      },
    });
    
    if (!contact) {
      throw new NotFoundError('Contact', id);
    }
    
    return contact;
  }
  
  /**
   * Update contact
   */
  async update(id: string, input: UpdateContactInput): Promise<Contact> {
    const ctx = getContext();
    
    // Check email uniqueness if changing
    if (input.email) {
      const existing = await db.query.contacts.findFirst({
        where: and(
          eq(contacts.ventureId, ctx.venture.id),
          eq(contacts.email, input.email.toLowerCase()),
          isNull(contacts.deletedAt),
          sql`id != ${id}`
        ),
      });
      
      if (existing) {
        throw new ConflictError('Contact with this email already exists', 'email');
      }
    }
    
    const [contact] = await db.update(contacts)
      .set({
        ...input,
        email: input.email?.toLowerCase(),
        updatedBy: ctx.user?.id,
        updatedAt: new Date(),
      })
      .where(and(
        eq(contacts.id, id),
        eq(contacts.ventureId, ctx.venture.id)
      ))
      .returning();
    
    if (!contact) {
      throw new NotFoundError('Contact', id);
    }
    
    await this.emitEvent('contact.updated', contact);
    
    return contact;
  }
  
  /**
   * Merge duplicate contacts
   */
  async merge(primaryId: string, duplicateIds: string[]): Promise<Contact> {
    const ctx = getContext();
    
    return await db.transaction(async (tx) => {
      // Get all contacts
      const allContacts = await tx.query.contacts.findMany({
        where: and(
          inArray(contacts.id, [primaryId, ...duplicateIds]),
          eq(contacts.ventureId, ctx.venture.id)
        ),
      });
      
      if (allContacts.length !== duplicateIds.length + 1) {
        throw new ValidationError('One or more contacts not found');
      }
      
      const primary = allContacts.find(c => c.id === primaryId)!;
      const duplicates = allContacts.filter(c => c.id !== primaryId);
      
      // Merge data - primary wins for conflicts
      const mergedCustomFields = duplicates.reduce(
        (acc, dup) => ({ ...acc, ...dup.customFields }),
        primary.customFields || {}
      );
      
      const mergedTags = [...new Set([
        ...(primary.tags || []),
        ...duplicates.flatMap(d => d.tags || [])
      ])];
      
      // Update primary with merged data
      await tx.update(contacts)
        .set({
          customFields: mergedCustomFields,
          tags: mergedTags,
          updatedBy: ctx.user?.id,
        })
        .where(eq(contacts.id, primaryId));
      
      // Reassign all related records
      for (const dupId of duplicateIds) {
        // Move deals
        await tx.update(deals)
          .set({ contactId: primaryId })
          .where(eq(deals.contactId, dupId));
        
        // Move activities
        await tx.update(activities)
          .set({ contactId: primaryId })
          .where(eq(activities.contactId, dupId));
        
        // Move conversations
        await tx.update(conversationParticipants)
          .set({ contactId: primaryId })
          .where(eq(conversationParticipants.contactId, dupId));
        
        // Move tickets
        await tx.update(tickets)
          .set({ contactId: primaryId })
          .where(eq(tickets.contactId, dupId));
      }
      
      // Soft delete duplicates
      await tx.update(contacts)
        .set({ deletedAt: new Date() })
        .where(inArray(contacts.id, duplicateIds));
      
      // Log merge history
      await tx.insert(contactMergeHistory).values({
        ventureId: ctx.venture.id,
        primaryContactId: primaryId,
        mergedContactIds: duplicateIds,
        mergedBy: ctx.user?.id,
      });
      
      return this.getById(primaryId);
    });
  }
  
  /**
   * Search contacts with filters
   */
  async search(filters: ContactFilters): Promise<ContactSearchResult> {
    const ctx = getContext();
    
    const conditions = [
      eq(contacts.ventureId, ctx.venture.id),
      isNull(contacts.deletedAt),
    ];
    
    if (filters.query) {
      conditions.push(
        or(
          ilike(contacts.fullName, `%${filters.query}%`),
          ilike(contacts.email, `%${filters.query}%`),
          ilike(contacts.phone, `%${filters.query}%`)
        )!
      );
    }
    
    if (filters.organizationId) {
      conditions.push(eq(contacts.organizationId, filters.organizationId));
    }
    
    if (filters.ownerId) {
      conditions.push(eq(contacts.ownerId, filters.ownerId));
    }
    
    if (filters.status) {
      conditions.push(eq(contacts.status, filters.status));
    }
    
    if (filters.type) {
      conditions.push(eq(contacts.type, filters.type));
    }
    
    if (filters.tags?.length) {
      conditions.push(sql`tags && ${filters.tags}`);
    }
    
    if (filters.lifecycleStage) {
      conditions.push(eq(contacts.lifecycleStage, filters.lifecycleStage));
    }
    
    // Count total
    const [{ count }] = await db.select({ count: sql<number>`count(*)` })
      .from(contacts)
      .where(and(...conditions));
    
    // Get page
    const orderColumn = filters.sortBy === 'name' ? contacts.fullName 
      : filters.sortBy === 'lastActivity' ? contacts.lastActivityAt
      : contacts.createdAt;
    
    const orderFn = filters.sortOrder === 'asc' ? asc : desc;
    
    const results = await db.query.contacts.findMany({
      where: and(...conditions),
      with: {
        organization: true,
        owner: { columns: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: [orderFn(orderColumn)],
      limit: filters.limit || 50,
      offset: ((filters.page || 1) - 1) * (filters.limit || 50),
    });
    
    return {
      data: results,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 50,
        total: count,
        totalPages: Math.ceil(count / (filters.limit || 50)),
        hasNext: (filters.page || 1) * (filters.limit || 50) < count,
        hasPrev: (filters.page || 1) > 1,
      },
    };
  }
  
  /**
   * Update contact engagement score
   */
  async updateEngagementScore(id: string): Promise<void> {
    const ctx = getContext();
    
    // Calculate based on recent activities
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentActivities = await db.select({ count: sql<number>`count(*)` })
      .from(activities)
      .where(and(
        eq(activities.contactId, id),
        sql`created_at > ${thirtyDaysAgo}`
      ));
    
    const emailOpens = await db.select({ count: sql<number>`count(*)` })
      .from(emailEvents)
      .where(and(
        eq(emailEvents.contactId, id),
        eq(emailEvents.type, 'open'),
        sql`created_at > ${thirtyDaysAgo}`
      ));
    
    const score = Math.min(100, 
      recentActivities[0].count * 5 + 
      emailOpens[0].count * 2
    );
    
    await db.update(contacts)
      .set({ 
        engagementScore: score,
        lastActivityAt: new Date(),
      })
      .where(eq(contacts.id, id));
  }
  
  /**
   * Get contact timeline
   */
  async getTimeline(
    contactId: string, 
    options: { limit?: number; before?: Date }
  ): Promise<TimelineEntry[]> {
    const ctx = getContext();
    
    const activities = await db.query.activities.findMany({
      where: and(
        eq(activities.contactId, contactId),
        options.before ? sql`created_at < ${options.before}` : undefined
      ),
      orderBy: [desc(activities.createdAt)],
      limit: options.limit || 50,
    });
    
    const emails = await db.query.emailHistory.findMany({
      where: and(
        eq(emailHistory.contactId, contactId),
        options.before ? sql`created_at < ${options.before}` : undefined
      ),
      orderBy: [desc(emailHistory.createdAt)],
      limit: options.limit || 50,
    });
    
    const deals = await db.query.dealHistory.findMany({
      where: and(
        eq(dealHistory.contactId, contactId),
        options.before ? sql`created_at < ${options.before}` : undefined
      ),
      orderBy: [desc(dealHistory.createdAt)],
      limit: options.limit || 50,
    });
    
    // Merge and sort all timeline entries
    const timeline: TimelineEntry[] = [
      ...activities.map(a => ({ type: 'activity' as const, data: a, timestamp: a.createdAt })),
      ...emails.map(e => ({ type: 'email' as const, data: e, timestamp: e.createdAt })),
      ...deals.map(d => ({ type: 'deal' as const, data: d, timestamp: d.createdAt })),
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
     .slice(0, options.limit || 50);
    
    return timeline;
  }
  
  private async emitEvent(event: string, data: unknown): Promise<void> {
    // Event emission for automation triggers
  }
}

export const contactService = new ContactService();
```

```typescript
// @mcv/nexus/crm/services/deal.service.ts
import { db, getContext, NotFoundError, ValidationError } from '@mcv/kernel';
import { deals, pipelines, pipelineStages, dealHistory, activities } from '../schemas';
import { eq, and, isNull, sql, between } from 'drizzle-orm';
import type { Deal, CreateDealInput, UpdateDealInput, DealFilters, DealForecast } from '../types';

export class DealService {
  
  /**
   * Create a new deal
   */
  async create(input: CreateDealInput): Promise<Deal> {
    const ctx = getContext();
    
    // Validate pipeline and stage
    const stage = await db.query.pipelineStages.findFirst({
      where: and(
        eq(pipelineStages.id, input.stageId),
        eq(pipelineStages.pipelineId, input.pipelineId)
      ),
    });
    
    if (!stage) {
      throw new ValidationError('Invalid pipeline stage');
    }
    
    const [deal] = await db.insert(deals).values({
      ...input,
      ventureId: ctx.venture.id,
      probability: input.probability ?? stage.probability,
      stageChangedAt: new Date(),
      createdBy: ctx.user?.id,
      updatedBy: ctx.user?.id,
    }).returning();
    
    // Create initial history entry
    await this.createHistoryEntry(deal.id, 'created', {
      stage: stage.name,
      amount: deal.amount,
    });
    
    await this.emitEvent('deal.created', deal);
    
    return deal;
  }
  
  /**
   * Move deal to different stage
   */
  async moveToStage(id: string, stageId: string): Promise<Deal> {
    const ctx = getContext();
    
    const deal = await this.getById(id);
    
    const newStage = await db.query.pipelineStages.findFirst({
      where: and(
        eq(pipelineStages.id, stageId),
        eq(pipelineStages.pipelineId, deal.pipelineId)
      ),
    });
    
    if (!newStage) {
      throw new ValidationError('Invalid stage for this pipeline');
    }
    
    const oldStage = await db.query.pipelineStages.findFirst({
      where: eq(pipelineStages.id, deal.stageId),
    });
    
    // Handle won/lost status
    let status = deal.status;
    let actualCloseDate = deal.actualCloseDate;
    
    if (newStage.type === 'won') {
      status = 'won';
      actualCloseDate = new Date();
    } else if (newStage.type === 'lost') {
      status = 'lost';
      actualCloseDate = new Date();
    } else if (deal.status !== 'open') {
      status = 'open';
      actualCloseDate = null;
    }
    
    const [updated] = await db.update(deals)
      .set({
        stageId,
        status,
        actualCloseDate,
        probability: newStage.probability,
        stageChangedAt: new Date(),
        updatedBy: ctx.user?.id,
      })
      .where(eq(deals.id, id))
      .returning();
    
    // Create history entry
    await this.createHistoryEntry(id, 'stage_changed', {
      from: oldStage?.name,
      to: newStage.name,
      fromStageId: deal.stageId,
      toStageId: stageId,
    });
    
    await this.emitEvent('deal.stage_changed', {
      deal: updated,
      from: oldStage,
      to: newStage,
    });
    
    return updated;
  }
  
  /**
   * Win a deal
   */
  async win(id: string, wonDetails?: { notes?: string }): Promise<Deal> {
    const ctx = getContext();
    const deal = await this.getById(id);
    
    // Find won stage
    const wonStage = await db.query.pipelineStages.findFirst({
      where: and(
        eq(pipelineStages.pipelineId, deal.pipelineId),
        eq(pipelineStages.type, 'won')
      ),
    });
    
    if (!wonStage) {
      throw new ValidationError('Pipeline has no won stage configured');
    }
    
    const [updated] = await db.update(deals)
      .set({
        stageId: wonStage.id,
        status: 'won',
        probability: 100,
        actualCloseDate: new Date(),
        updatedBy: ctx.user?.id,
      })
      .where(eq(deals.id, id))
      .returning();
    
    await this.createHistoryEntry(id, 'won', {
      amount: deal.amount,
      notes: wonDetails?.notes,
    });
    
    // Create activity
    await db.insert(activities).values({
      ventureId: ctx.venture.id,
      type: 'deal_won',
      subject: `Deal won: ${deal.name}`,
      description: wonDetails?.notes,
      contactId: deal.contactId,
      organizationId: deal.organizationId,
      dealId: deal.id,
      ownerId: ctx.user?.id,
      status: 'completed',
      completedAt: new Date(),
      createdBy: ctx.user?.id,
    });
    
    await this.emitEvent('deal.won', updated);
    
    return updated;
  }
  
  /**
   * Lose a deal
   */
  async lose(id: string, lostDetails: { reason: string; detail?: string; competitorId?: string }): Promise<Deal> {
    const ctx = getContext();
    const deal = await this.getById(id);
    
    // Find lost stage
    const lostStage = await db.query.pipelineStages.findFirst({
      where: and(
        eq(pipelineStages.pipelineId, deal.pipelineId),
        eq(pipelineStages.type, 'lost')
      ),
    });
    
    if (!lostStage) {
      throw new ValidationError('Pipeline has no lost stage configured');
    }
    
    const [updated] = await db.update(deals)
      .set({
        stageId: lostStage.id,
        status: 'lost',
        probability: 0,
        actualCloseDate: new Date(),
        lostReason: lostDetails.reason,
        lostReasonDetail: lostDetails.detail,
        competitorId: lostDetails.competitorId,
        updatedBy: ctx.user?.id,
      })
      .where(eq(deals.id, id))
      .returning();
    
    await this.createHistoryEntry(id, 'lost', {
      amount: deal.amount,
      reason: lostDetails.reason,
      detail: lostDetails.detail,
    });
    
    await this.emitEvent('deal.lost', updated);
    
    return updated;
  }
  
  /**
   * Get pipeline forecast
   */
  async getForecast(pipelineId: string, options: { 
    startDate: Date; 
    endDate: Date;
    groupBy?: 'week' | 'month' | 'quarter';
  }): Promise<DealForecast> {
    const ctx = getContext();
    
    const activeDeals = await db.query.deals.findMany({
      where: and(
        eq(deals.ventureId, ctx.venture.id),
        eq(deals.pipelineId, pipelineId),
        eq(deals.status, 'open'),
        between(deals.expectedCloseDate, options.startDate, options.endDate),
        isNull(deals.deletedAt)
      ),
      with: {
        stage: true,
      },
    });
    
    // Group by stage
    const byStage = activeDeals.reduce((acc, deal) => {
      const stageId = deal.stageId;
      if (!acc[stageId]) {
        acc[stageId] = {
          stage: deal.stage,
          count: 0,
          totalAmount: 0,
          weightedAmount: 0,
        };
      }
      acc[stageId].count++;
      acc[stageId].totalAmount += Number(deal.amount || 0);
      acc[stageId].weightedAmount += Number(deal.weightedAmount || 0);
      return acc;
    }, {} as Record<string, { stage: any; count: number; totalAmount: number; weightedAmount: number }>);
    
    // Calculate totals
    const totals = {
      count: activeDeals.length,
      totalAmount: activeDeals.reduce((sum, d) => sum + Number(d.amount || 0), 0),
      weightedAmount: activeDeals.reduce((sum, d) => sum + Number(d.weightedAmount || 0), 0),
      avgDealSize: activeDeals.length > 0 
        ? activeDeals.reduce((sum, d) => sum + Number(d.amount || 0), 0) / activeDeals.length 
        : 0,
    };
    
    return {
      pipelineId,
      period: { start: options.startDate, end: options.endDate },
      byStage: Object.values(byStage),
      totals,
      deals: activeDeals,
    };
  }
  
  /**
   * Get deal velocity metrics
   */
  async getVelocityMetrics(pipelineId: string, days: number = 90): Promise<VelocityMetrics> {
    const ctx = getContext();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const wonDeals = await db.query.deals.findMany({
      where: and(
        eq(deals.ventureId, ctx.venture.id),
        eq(deals.pipelineId, pipelineId),
        eq(deals.status, 'won'),
        sql`actual_close_date > ${startDate}`
      ),
    });
    
    const lostDeals = await db.query.deals.findMany({
      where: and(
        eq(deals.ventureId, ctx.venture.id),
        eq(deals.pipelineId, pipelineId),
        eq(deals.status, 'lost'),
        sql`actual_close_date > ${startDate}`
      ),
    });
    
    // Calculate average cycle time
    const cycleTimes = wonDeals.map(d => {
      const created = new Date(d.createdAt);
      const closed = new Date(d.actualCloseDate!);
      return (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    });
    
    const avgCycleTime = cycleTimes.length > 0
      ? cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length
      : 0;
    
    const winRate = (wonDeals.length + lostDeals.length) > 0
      ? (wonDeals.length / (wonDeals.length + lostDeals.length)) * 100
      : 0;
    
    return {
      avgCycleTimeDays: Math.round(avgCycleTime),
      winRate: Math.round(winRate),
      avgDealSize: wonDeals.length > 0
        ? wonDeals.reduce((sum, d) => sum + Number(d.amount || 0), 0) / wonDeals.length
        : 0,
      totalWon: wonDeals.length,
      totalLost: lostDeals.length,
      totalValue: wonDeals.reduce((sum, d) => sum + Number(d.amount || 0), 0),
    };
  }
  
  private async createHistoryEntry(
    dealId: string, 
    action: string, 
    data: Record<string, unknown>
  ): Promise<void> {
    const ctx = getContext();
    await db.insert(dealHistory).values({
      ventureId: ctx.venture.id,
      dealId,
      action,
      data,
      performedBy: ctx.user?.id,
    });
  }
  
  async getById(id: string): Promise<Deal> {
    const ctx = getContext();
    const deal = await db.query.deals.findFirst({
      where: and(
        eq(deals.id, id),
        eq(deals.ventureId, ctx.venture.id),
        isNull(deals.deletedAt)
      ),
      with: {
        pipeline: true,
        stage: true,
        contact: true,
        organization: true,
        owner: { columns: { id: true, name: true, avatarUrl: true } },
      },
    });
    
    if (!deal) {
      throw new NotFoundError('Deal', id);
    }
    
    return deal;
  }
  
  private async emitEvent(event: string, data: unknown): Promise<void> {
    // Event emission
  }
}

export const dealService = new DealService();
```

### Types

```typescript
// @mcv/nexus/crm/types.ts
import type { BaseEntity, PaginatedResult } from '@mcv/kernel';

export interface Contact extends BaseEntity {
  email: string | null;
  emailVerified: boolean;
  phone: string | null;
  phoneVerified: boolean;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  title: string | null;
  department: string | null;
  organizationId: string | null;
  address: AddressType | null;
  timezone: string | null;
  preferredLanguage: string | null;
  linkedIn: string | null;
  twitter: string | null;
  website: string | null;
  status: string;
  type: string | null;
  source: string | null;
  sourceDetail: string | null;
  leadScore: number;
  engagementScore: number;
  healthScore: number | null;
  lifecycleStage: string | null;
  firstContactAt: Date | null;
  lastContactAt: Date | null;
  lastActivityAt: Date | null;
  convertedAt: Date | null;
  ownerId: string | null;
  customFields: Record<string, unknown>;
  tags: string[];
  marketingOptIn: boolean;
  consentGiven: boolean;
}

export interface CreateContactInput {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  title?: string;
  department?: string;
  organizationId?: string;
  address?: AddressType;
  timezone?: string;
  preferredLanguage?: string;
  linkedIn?: string;
  twitter?: string;
  website?: string;
  type?: string;
  source?: string;
  sourceDetail?: string;
  lifecycleStage?: string;
  ownerId?: string;
  customFields?: Record<string, unknown>;
  tags?: string[];
  marketingOptIn?: boolean;
}

export interface UpdateContactInput extends Partial<CreateContactInput> {
  status?: string;
  leadScore?: number;
}

export interface ContactFilters {
  query?: string;
  organizationId?: string;
  ownerId?: string;
  status?: string;
  type?: string;
  tags?: string[];
  lifecycleStage?: string;
  sortBy?: 'name' | 'createdAt' | 'lastActivity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export type ContactSearchResult = PaginatedResult<Contact>;

export interface AddressType {
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  lat?: number;
  lng?: number;
}

export interface Organization extends BaseEntity {
  name: string;
  legalName: string | null;
  slug: string | null;
  logoUrl: string | null;
  website: string | null;
  description: string | null;
  industry: string | null;
  subIndustry: string | null;
  type: string | null;
  size: string | null;
  employeeCount: number | null;
  annualRevenue: string | null;
  currency: string;
  phone: string | null;
  email: string | null;
  billingAddress: AddressType | null;
  shippingAddress: AddressType | null;
  healthScore: number | null;
  riskScore: number | null;
  status: string;
  ownerId: string | null;
  parentOrganizationId: string | null;
  customFields: Record<string, unknown>;
  tags: string[];
}

export interface Deal extends BaseEntity {
  name: string;
  description: string | null;
  pipelineId: string;
  stageId: string;
  amount: string | null;
  currency: string;
  recurringAmount: string | null;
  recurringPeriod: string | null;
  probability: number;
  weightedAmount: string | null;
  expectedCloseDate: Date | null;
  actualCloseDate: Date | null;
  lastActivityAt: Date | null;
  stageChangedAt: Date | null;
  status: 'open' | 'won' | 'lost';
  lostReason: string | null;
  lostReasonDetail: string | null;
  competitorId: string | null;
  contactId: string | null;
  organizationId: string | null;
  ownerId: string;
  teamId: string | null;
  source: string | null;
  campaignId: string | null;
  customFields: Record<string, unknown>;
  tags: string[];
  priority: string;
  score: number | null;
}

export interface Pipeline extends BaseEntity {
  name: string;
  description: string | null;
  type: string;
  currency: string;
  isDefault: boolean;
  isActive: boolean;
  automationEnabled: boolean;
  displayOrder: number;
  color: string | null;
}

export interface PipelineStage extends BaseEntity {
  pipelineId: string;
  name: string;
  description: string | null;
  displayOrder: number;
  probability: number;
  type: 'active' | 'won' | 'lost';
  rotDays: number | null;
  color: string | null;
}

export interface Activity extends BaseEntity {
  type: string;
  subtype: string | null;
  subject: string | null;
  description: string | null;
  scheduledAt: Date | null;
  completedAt: Date | null;
  durationMinutes: number | null;
  status: string;
  outcome: string | null;
  contactId: string | null;
  organizationId: string | null;
  dealId: string | null;
  ownerId: string | null;
  assignedTo: string | null;
  metadata: Record<string, unknown>;
}

export interface TimelineEntry {
  type: 'activity' | 'email' | 'deal' | 'note' | 'call';
  data: unknown;
  timestamp: Date;
}

export interface DealForecast {
  pipelineId: string;
  period: { start: Date; end: Date };
  byStage: Array<{
    stage: PipelineStage;
    count: number;
    totalAmount: number;
    weightedAmount: number;
  }>;
  totals: {
    count: number;
    totalAmount: number;
    weightedAmount: number;
    avgDealSize: number;
  };
  deals: Deal[];
}

export interface VelocityMetrics {
  avgCycleTimeDays: number;
  winRate: number;
  avgDealSize: number;
  totalWon: number;
  totalLost: number;
  totalValue: number;
}
```

---

## Module: contact-center

### Purpose

Omnichannel inbox management with agent queues, intelligent routing, SLA tracking, and performance analytics.

### Data Models

```typescript
// @mcv/nexus/contact-center/schemas/inbox.ts
import { pgTable, uuid, text, timestamp, varchar, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel';

export const inboxes = pgTable('nexus_inboxes', {
  ...baseColumns,
  
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  
  // Channel configuration
  channel: varchar('channel', { length: 50 }).notNull(), // email, chat, phone, social, whatsapp
  channelConfig: jsonb('channel_config').$type<ChannelConfig>(),
  
  // Display
  avatar: text('avatar'),
  color: varchar('color', { length: 7 }),
  
  // Settings
  isEnabled: boolean('is_enabled').default(true),
  autoAssign: boolean('auto_assign').default(true),
  roundRobin: boolean('round_robin').default(true),
  
  // Working hours
  workingHours: jsonb('working_hours').$type<WorkingHours>(),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  
  // SLA
  firstResponseSla: integer('first_response_sla_minutes'),
  resolutionSla: integer('resolution_sla_minutes'),
  
  // Greeting messages
  greetingEnabled: boolean('greeting_enabled').default(true),
  greetingMessage: text('greeting_message'),
  awayMessage: text('away_message'),
  
  // Assignment
  defaultAssigneeId: uuid('default_assignee_id'),
  teamIds: uuid('team_ids').array().default([]),
});

export type ChannelConfig = {
  email?: {
    imapHost: string;
    imapPort: number;
    smtpHost: string;
    smtpPort: number;
    username: string;
    fromName: string;
    fromEmail: string;
  };
  chat?: {
    widgetEnabled: boolean;
    widgetPosition: 'left' | 'right';
    widgetColor: string;
    preChatForm: boolean;
  };
  whatsapp?: {
    phoneNumberId: string;
    businessAccountId: string;
  };
  phone?: {
    twilioSid: string;
    phoneNumber: string;
  };
};

export type WorkingHours = {
  enabled: boolean;
  timezone: string;
  schedule: Array<{
    day: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    enabled: boolean;
    start: string; // HH:mm
    end: string;
  }>;
  holidays: Array<{
    date: string;
    name: string;
  }>;
};

export const queues = pgTable('nexus_queues', {
  ...baseColumns,
  
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  
  inboxId: uuid('inbox_id').references(() => inboxes.id).notNull(),
  
  // Priority
  priority: integer('priority').default(0),
  
  // Routing rules
  routingRules: jsonb('routing_rules').$type<RoutingRule[]>().default([]),
  
  // SLA override
  firstResponseSla: integer('first_response_sla_minutes'),
  resolutionSla: integer('resolution_sla_minutes'),
  
  // Assignment
  assignmentStrategy: varchar('assignment_strategy', { length: 50 }).default('round_robin'),
  maxConcurrentPerAgent: integer('max_concurrent_per_agent').default(5),
  
  // Team
  teamIds: uuid('team_ids').array().default([]),
  agentIds: uuid('agent_ids').array().default([]),
});

export type RoutingRule = {
  id: string;
  name: string;
  conditions: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'starts_with' | 'regex' | 'in';
    value: string | string[];
  }>;
  action: {
    type: 'assign_agent' | 'assign_team' | 'set_priority' | 'add_tag' | 'set_queue';
    value: string;
  };
  order: number;
  enabled: boolean;
};

export const agentSessions = pgTable('nexus_agent_sessions', {
  ...baseColumns,
  
  agentId: uuid('agent_id').references(() => users.id).notNull(),
  inboxId: uuid('inbox_id').references(() => inboxes.id),
  
  // Status
  status: varchar('status', { length: 20 }).default('offline'), // online, away, busy, offline
  statusMessage: text('status_message'),
  
  // Capacity
  maxConcurrent: integer('max_concurrent').default(5),
  currentCount: integer('current_count').default(0),
  
  // Timing
  startedAt: timestamp('started_at', { withTimezone: true }),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  
  // Metrics for this session
  handledCount: integer('handled_count').default(0),
  avgResponseTime: integer('avg_response_time_seconds'),
  satisfactionScore: integer('satisfaction_score'),
});

export const inboxAssignments = pgTable('nexus_inbox_assignments', {
  ...baseColumns,
  
  conversationId: uuid('conversation_id').references(() => conversations.id).notNull(),
  inboxId: uuid('inbox_id').references(() => inboxes.id).notNull(),
  queueId: uuid('queue_id').references(() => queues.id),
  
  // Assignment
  assignedTo: uuid('assigned_to').references(() => users.id),
  assignedAt: timestamp('assigned_at', { withTimezone: true }),
  assignedBy: uuid('assigned_by').references(() => users.id),
  assignmentType: varchar('assignment_type', { length: 20 }), // auto, manual, transfer
  
  // Status
  status: varchar('status', { length: 20 }).default('open'), // open, pending, snoozed, resolved, closed
  priority: varchar('priority', { length: 20 }).default('normal'),
  
  // SLA tracking
  firstResponseDue: timestamp('first_response_due', { withTimezone: true }),
  firstRespondedAt: timestamp('first_responded_at', { withTimezone: true }),
  resolutionDue: timestamp('resolution_due', { withTimezone: true }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  slaBreached: boolean('sla_breached').default(false),
  
  // Snooze
  snoozedUntil: timestamp('snoozed_until', { withTimezone: true }),
  
  // Tags
  tags: text('tags').array().default([]),
});
```

### Services

```typescript
// @mcv/nexus/contact-center/services/routing.service.ts
import { db, getContext, logger } from '@mcv/kernel';
import { queues, agentSessions, inboxAssignments, inboxes } from '../schemas';
import { conversations } from '../../conversations/schemas';
import { eq, and, sql, lt, isNull, asc, desc } from 'drizzle-orm';
import type { Conversation, InboxAssignment, RoutingResult } from '../types';

export class RoutingService {
  
  /**
   * Route a new conversation to the appropriate agent
   */
  async routeConversation(conversationId: string, inboxId: string): Promise<RoutingResult> {
    const ctx = getContext();
    
    const inbox = await db.query.inboxes.findFirst({
      where: eq(inboxes.id, inboxId),
    });
    
    if (!inbox) {
      throw new Error('Inbox not found');
    }
    
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
      with: {
        messages: { limit: 1, orderBy: [desc(messages.createdAt)] },
        contact: true,
      },
    });
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    // Determine queue based on routing rules
    const queue = await this.determineQueue(conversation, inboxId);
    
    // Calculate SLA deadlines
    const slaConfig = queue 
      ? { firstResponse: queue.firstResponseSla, resolution: queue.resolutionSla }
      : { firstResponse: inbox.firstResponseSla, resolution: inbox.resolutionSla };
    
    const now = new Date();
    const firstResponseDue = slaConfig.firstResponse 
      ? new Date(now.getTime() + slaConfig.firstResponse * 60 * 1000)
      : null;
    const resolutionDue = slaConfig.resolution
      ? new Date(now.getTime() + slaConfig.resolution * 60 * 1000)
      : null;
    
    // Find available agent if auto-assign is enabled
    let assignedTo: string | null = null;
    let assignmentType: string = 'unassigned';
    
    if (inbox.autoAssign) {
      assignedTo = await this.findAvailableAgent(inboxId, queue?.id);
      if (assignedTo) {
        assignmentType = 'auto';
        await this.incrementAgentCount(assignedTo);
      }
    }
    
    // Create assignment record
    const [assignment] = await db.insert(inboxAssignments).values({
      ventureId: ctx.venture.id,
      conversationId,
      inboxId,
      queueId: queue?.id,
      assignedTo,
      assignedAt: assignedTo ? now : null,
      assignmentType,
      status: 'open',
      priority: await this.determinePriority(conversation),
      firstResponseDue,
      resolutionDue,
      createdBy: ctx.user?.id,
    }).returning();
    
    logger.info({ 
      conversationId, 
      inboxId, 
      assignedTo,
      queueId: queue?.id 
    }, 'Conversation routed');
    
    return {
      assignment,
      agent: assignedTo ? await this.getAgent(assignedTo) : null,
      queue,
    };
  }
  
  /**
   * Reassign conversation to different agent
   */
  async reassign(
    assignmentId: string, 
    toAgentId: string, 
    options?: { reason?: string; keepHistory?: boolean }
  ): Promise<InboxAssignment> {
    const ctx = getContext();
    
    const assignment = await db.query.inboxAssignments.findFirst({
      where: eq(inboxAssignments.id, assignmentId),
    });
    
    if (!assignment) {
      throw new Error('Assignment not found');
    }
    
    // Decrement old agent count
    if (assignment.assignedTo) {
      await this.decrementAgentCount(assignment.assignedTo);
    }
    
    // Increment new agent count
    await this.incrementAgentCount(toAgentId);
    
    const [updated] = await db.update(inboxAssignments)
      .set({
        assignedTo: toAgentId,
        assignedAt: new Date(),
        assignedBy: ctx.user?.id,
        assignmentType: 'manual',
        updatedBy: ctx.user?.id,
      })
      .where(eq(inboxAssignments.id, assignmentId))
      .returning();
    
    // Log transfer
    await db.insert(assignmentHistory).values({
      ventureId: ctx.venture.id,
      assignmentId,
      fromAgentId: assignment.assignedTo,
      toAgentId,
      reason: options?.reason,
      performedBy: ctx.user?.id,
    });
    
    return updated;
  }
  
  /**
   * Find available agent using round-robin or least-loaded strategy
   */
  private async findAvailableAgent(
    inboxId: string, 
    queueId?: string
  ): Promise<string | null> {
    const ctx = getContext();
    
    // Get queue configuration
    const queue = queueId 
      ? await db.query.queues.findFirst({ where: eq(queues.id, queueId) })
      : null;
    
    const strategy = queue?.assignmentStrategy || 'round_robin';
    const maxConcurrent = queue?.maxConcurrentPerAgent || 5;
    
    // Get online agents for this inbox
    const onlineAgents = await db.query.agentSessions.findMany({
      where: and(
        eq(agentSessions.ventureId, ctx.venture.id),
        or(
          eq(agentSessions.inboxId, inboxId),
          isNull(agentSessions.inboxId)
        ),
        eq(agentSessions.status, 'online'),
        lt(agentSessions.currentCount, sql`max_concurrent`)
      ),
      orderBy: strategy === 'round_robin'
        ? [asc(agentSessions.lastActiveAt)]
        : [asc(agentSessions.currentCount)],
    });
    
    if (onlineAgents.length === 0) {
      return null;
    }
    
    // Filter by queue agent list if specified
    let candidates = onlineAgents;
    if (queue?.agentIds?.length) {
      candidates = onlineAgents.filter(a => queue.agentIds.includes(a.agentId));
    }
    
    if (candidates.length === 0) {
      return null;
    }
    
    return candidates[0].agentId;
  }
  
  /**
   * Determine queue based on routing rules
   */
  private async determineQueue(
    conversation: Conversation, 
    inboxId: string
  ): Promise<Queue | null> {
    const ctx = getContext();
    
    const allQueues = await db.query.queues.findMany({
      where: and(
        eq(queues.ventureId, ctx.venture.id),
        eq(queues.inboxId, inboxId)
      ),
      orderBy: [desc(queues.priority)],
    });
    
    for (const queue of allQueues) {
      if (await this.matchesRoutingRules(conversation, queue.routingRules)) {
        return queue;
      }
    }
    
    return null;
  }
  
  /**
   * Check if conversation matches routing rules
   */
  private async matchesRoutingRules(
    conversation: Conversation,
    rules: RoutingRule[]
  ): Promise<boolean> {
    if (!rules?.length) return false;
    
    const enabledRules = rules
      .filter(r => r.enabled)
      .sort((a, b) => a.order - b.order);
    
    for (const rule of enabledRules) {
      const matches = rule.conditions.every(condition => {
        const value = this.getFieldValue(conversation, condition.field);
        return this.evaluateCondition(value, condition.operator, condition.value);
      });
      
      if (matches) {
        return true;
      }
    }
    
    return false;
  }
  
  private getFieldValue(conversation: any, field: string): any {
    const parts = field.split('.');
    let value = conversation;
    for (const part of parts) {
      value = value?.[part];
    }
    return value;
  }
  
  private evaluateCondition(
    value: any, 
    operator: string, 
    target: string | string[]
  ): boolean {
    switch (operator) {
      case 'equals':
        return value === target;
      case 'contains':
        return String(value).toLowerCase().includes(String(target).toLowerCase());
      case 'starts_with':
        return String(value).toLowerCase().startsWith(String(target).toLowerCase());
      case 'regex':
        return new RegExp(String(target), 'i').test(String(value));
      case 'in':
        return Array.isArray(target) && target.includes(value);
      default:
        return false;
    }
  }
  
  private async determinePriority(conversation: Conversation): Promise<string> {
    // Could be based on contact VIP status, keywords, etc.
    if (conversation.contact?.tags?.includes('vip')) {
      return 'high';
    }
    return 'normal';
  }
  
  private async incrementAgentCount(agentId: string): Promise<void> {
    await db.update(agentSessions)
      .set({ 
        currentCount: sql`current_count + 1`,
        lastActiveAt: new Date(),
      })
      .where(and(
        eq(agentSessions.agentId, agentId),
        eq(agentSessions.status, 'online')
      ));
  }
  
  private async decrementAgentCount(agentId: string): Promise<void> {
    await db.update(agentSessions)
      .set({ 
        currentCount: sql`GREATEST(current_count - 1, 0)`,
      })
      .where(and(
        eq(agentSessions.agentId, agentId),
        eq(agentSessions.status, 'online')
      ));
  }
  
  private async getAgent(agentId: string): Promise<any> {
    return db.query.users.findFirst({
      where: eq(users.id, agentId),
      columns: { id: true, name: true, email: true, avatarUrl: true },
    });
  }
}

export const routingService = new RoutingService();
```

```typescript
// @mcv/nexus/contact-center/services/sla.service.ts
import { db, getContext, logger } from '@mcv/kernel';
import { inboxAssignments } from '../schemas';
import { eq, and, lt, isNull, isNotNull } from 'drizzle-orm';
import type { SlaStatus, SlaMetrics } from '../types';

export class SlaService {
  
  /**
   * Check and update SLA breaches
   */
  async checkSlaBreaches(): Promise<{ breached: number; atRisk: number }> {
    const ctx = getContext();
    const now = new Date();
    const warningThreshold = 15 * 60 * 1000; // 15 minutes warning
    
    // Find breached first response SLAs
    const firstResponseBreaches = await db.update(inboxAssignments)
      .set({ 
        slaBreached: true,
        updatedAt: now,
      })
      .where(and(
        eq(inboxAssignments.ventureId, ctx.venture.id),
        isNull(inboxAssignments.firstRespondedAt),
        isNotNull(inboxAssignments.firstResponseDue),
        lt(inboxAssignments.firstResponseDue, now),
        eq(inboxAssignments.slaBreached, false)
      ))
      .returning();
    
    // Find breached resolution SLAs
    const resolutionBreaches = await db.update(inboxAssignments)
      .set({ 
        slaBreached: true,
        updatedAt: now,
      })
      .where(and(
        eq(inboxAssignments.ventureId, ctx.venture.id),
        isNull(inboxAssignments.resolvedAt),
        isNotNull(inboxAssignments.resolutionDue),
        lt(inboxAssignments.resolutionDue, now),
        eq(inboxAssignments.slaBreached, false)
      ))
      .returning();
    
    const breached = firstResponseBreaches.length + resolutionBreaches.length;
    
    // Find at-risk (within warning threshold)
    const [atRiskResult] = await db.select({ count: sql<number>`count(*)` })
      .from(inboxAssignments)
      .where(and(
        eq(inboxAssignments.ventureId, ctx.venture.id),
        eq(inboxAssignments.slaBreached, false),
        or(
          and(
            isNull(inboxAssignments.firstRespondedAt),
            isNotNull(inboxAssignments.firstResponseDue),
            lt(inboxAssignments.firstResponseDue, new Date(now.getTime() + warningThreshold))
          ),
          and(
            isNull(inboxAssignments.resolvedAt),
            isNotNull(inboxAssignments.resolutionDue),
            lt(inboxAssignments.resolutionDue, new Date(now.getTime() + warningThreshold))
          )
        )
      ));
    
    if (breached > 0) {
      logger.warn({ breached }, 'SLA breaches detected');
    }
    
    return { breached, atRisk: atRiskResult.count };
  }
  
  /**
   * Record first response
   */
  async recordFirstResponse(assignmentId: string): Promise<void> {
    const ctx = getContext();
    
    await db.update(inboxAssignments)
      .set({
        firstRespondedAt: new Date(),
        updatedBy: ctx.user?.id,
      })
      .where(and(
        eq(inboxAssignments.id, assignmentId),
        isNull(inboxAssignments.firstRespondedAt)
      ));
  }
  
  /**
   * Record resolution
   */
  async recordResolution(assignmentId: string): Promise<void> {
    const ctx = getContext();
    
    await db.update(inboxAssignments)
      .set({
        resolvedAt: new Date(),
        status: 'resolved',
        updatedBy: ctx.user?.id,
      })
      .where(eq(inboxAssignments.id, assignmentId));
  }
  
  /**
   * Get SLA status for an assignment
   */
  async getSlaStatus(assignmentId: string): Promise<SlaStatus> {
    const assignment = await db.query.inboxAssignments.findFirst({
      where: eq(inboxAssignments.id, assignmentId),
    });
    
    if (!assignment) {
      throw new Error('Assignment not found');
    }
    
    const now = new Date();
    
    return {
      firstResponse: this.calculateSlaState(
        assignment.firstResponseDue,
        assignment.firstRespondedAt,
        now
      ),
      resolution: this.calculateSlaState(
        assignment.resolutionDue,
        assignment.resolvedAt,
        now
      ),
      isBreached: assignment.slaBreached,
    };
  }
  
  private calculateSlaState(
    due: Date | null,
    completed: Date | null,
    now: Date
  ): SlaState {
    if (!due) {
      return { status: 'none', remaining: null, overdue: null };
    }
    
    if (completed) {
      const met = completed <= due;
      return {
        status: met ? 'met' : 'breached',
        remaining: null,
        overdue: met ? null : completed.getTime() - due.getTime(),
        completedAt: completed,
      };
    }
    
    const remaining = due.getTime() - now.getTime();
    
    if (remaining < 0) {
      return {
        status: 'breached',
        remaining: null,
        overdue: Math.abs(remaining),
      };
    }
    
    const warningThreshold = 15 * 60 * 1000;
    return {
      status: remaining < warningThreshold ? 'at_risk' : 'on_track',
      remaining,
      overdue: null,
    };
  }
  
  /**
   * Get SLA metrics for reporting
   */
  async getMetrics(options: {
    inboxId?: string;
    agentId?: string;
    startDate: Date;
    endDate: Date;
  }): Promise<SlaMetrics> {
    const ctx = getContext();
    
    const conditions = [
      eq(inboxAssignments.ventureId, ctx.venture.id),
      sql`created_at BETWEEN ${options.startDate} AND ${options.endDate}`,
    ];
    
    if (options.inboxId) {
      conditions.push(eq(inboxAssignments.inboxId, options.inboxId));
    }
    
    if (options.agentId) {
      conditions.push(eq(inboxAssignments.assignedTo, options.agentId));
    }
    
    const assignments = await db.query.inboxAssignments.findMany({
      where: and(...conditions),
    });
    
    const total = assignments.length;
    const withFirstResponseSla = assignments.filter(a => a.firstResponseDue);
    const withResolutionSla = assignments.filter(a => a.resolutionDue);
    
    const firstResponseMet = withFirstResponseSla.filter(
      a => a.firstRespondedAt && a.firstRespondedAt <= a.firstResponseDue!
    ).length;
    
    const resolutionMet = withResolutionSla.filter(
      a => a.resolvedAt && a.resolvedAt <= a.resolutionDue!
    ).length;
    
    // Average response times
    const responseTimes = assignments
      .filter(a => a.firstRespondedAt)
      .map(a => a.firstRespondedAt!.getTime() - a.createdAt.getTime());
    
    const avgFirstResponse = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
    
    const resolutionTimes = assignments
      .filter(a => a.resolvedAt)
      .map(a => a.resolvedAt!.getTime() - a.createdAt.getTime());
    
    const avgResolution = resolutionTimes.length > 0
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      : 0;
    
    return {
      total,
      firstResponse: {
        tracked: withFirstResponseSla.length,
        met: firstResponseMet,
        breached: withFirstResponseSla.length - firstResponseMet,
        rate: withFirstResponseSla.length > 0 
          ? (firstResponseMet / withFirstResponseSla.length) * 100 
          : 0,
        avgTimeMs: avgFirstResponse,
      },
      resolution: {
        tracked: withResolutionSla.length,
        met: resolutionMet,
        breached: withResolutionSla.length - resolutionMet,
        rate: withResolutionSla.length > 0
          ? (resolutionMet / withResolutionSla.length) * 100
          : 0,
        avgTimeMs: avgResolution,
      },
    };
  }
}

export const slaService = new SlaService();
```

---

## Module: conversations

### Purpose

Multi-channel conversation threading with message history, channel abstraction, and participant management.

### Data Models

```typescript
// @mcv/nexus/conversations/schemas/conversation.ts
import { pgTable, uuid, text, timestamp, varchar, jsonb, boolean, integer } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel';

export const conversations = pgTable('nexus_conversations', {
  ...baseColumns,
  
  // Identifier
  externalId: varchar('external_id', { length: 200 }), // External system ID
  
  // Channel
  channel: varchar('channel', { length: 50 }).notNull(), // email, chat, phone, whatsapp, sms, social
  channelData: jsonb('channel_data').$type<ChannelData>(),
  
  // Subject/Topic
  subject: varchar('subject', { length: 500 }),
  preview: text('preview'), // Last message preview
  
  // Status
  status: varchar('status', { length: 20 }).default('active'), // active, pending, snoozed, resolved, closed
  
  // Participants
  initiatorType: varchar('initiator_type', { length: 20 }), // contact, user, system
  initiatorId: uuid('initiator_id'),
  
  // Primary contact
  contactId: uuid('contact_id').references(() => contacts.id),
  organizationId: uuid('organization_id').references(() => organizations.id),
  
  // Inbox
  inboxId: uuid('inbox_id').references(() => inboxes.id),
  
  // Metrics
  messageCount: integer('message_count').default(0),
  participantCount: integer('participant_count').default(0),
  
  // Timestamps
  firstMessageAt: timestamp('first_message_at', { withTimezone: true }),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
  lastUserMessageAt: timestamp('last_user_message_at', { withTimezone: true }),
  lastContactMessageAt: timestamp('last_contact_message_at', { withTimezone: true }),
  
  // Waiting status
  waitingOnContact: boolean('waiting_on_contact').default(false),
  waitingSince: timestamp('waiting_since', { withTimezone: true }),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  tags: text('tags').array().default([]),
});

export type ChannelData = {
  email?: {
    threadId: string;
    messageIds: string[];
    inReplyTo?: string;
  };
  chat?: {
    sessionId: string;
    visitorId: string;
    pageUrl?: string;
  };
  whatsapp?: {
    waId: string;
    profileName?: string;
  };
  phone?: {
    callSid: string;
    phoneNumber: string;
    direction: 'inbound' | 'outbound';
  };
};

export const messages = pgTable('nexus_messages', {
  ...baseColumns,
  
  conversationId: uuid('conversation_id').references(() => conversations.id).notNull(),
  
  // Sender
  senderType: varchar('sender_type', { length: 20 }).notNull(), // contact, user, system, bot
  senderId: uuid('sender_id'),
  senderName: varchar('sender_name', { length: 200 }),
  senderAvatar: text('sender_avatar'),
  
  // Content
  contentType: varchar('content_type', { length: 50 }).default('text'), // text, html, markdown, image, file, audio, video, location, template
  content: text('content'),
  contentHtml: text('content_html'),
  
  // Attachments
  attachments: jsonb('attachments').$type<MessageAttachment[]>().default([]),
  
  // External reference
  externalId: varchar('external_id', { length: 200 }),
  
  // Status
  status: varchar('status', { length: 20 }).default('sent'), // draft, sending, sent, delivered, read, failed
  failureReason: text('failure_reason'),
  
  // Delivery tracking
  sentAt: timestamp('sent_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  readAt: timestamp('read_at', { withTimezone: true }),
  
  // Reply reference
  replyToId: uuid('reply_to_id').references(() => messages.id),
  
  // Private notes (internal only)
  isPrivate: boolean('is_private').default(false),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
});

export type MessageAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
};

export const conversationParticipants = pgTable('nexus_conversation_participants', {
  ...baseColumns,
  
  conversationId: uuid('conversation_id').references(() => conversations.id).notNull(),
  
  // Participant
  participantType: varchar('participant_type', { length: 20 }).notNull(), // contact, user
  contactId: uuid('contact_id').references(() => contacts.id),
  userId: uuid('user_id').references(() => users.id),
  
  // Role
  role: varchar('role', { length: 20 }).default('participant'), // initiator, participant, cc, bcc
  
  // Status
  isActive: boolean('is_active').default(true),
  
  // Read tracking
  lastReadAt: timestamp('last_read_at', { withTimezone: true }),
  lastReadMessageId: uuid('last_read_message_id'),
  unreadCount: integer('unread_count').default(0),
  
  // Timestamps
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
  leftAt: timestamp('left_at', { withTimezone: true }),
});
```

### Services

```typescript
// @mcv/nexus/conversations/services/conversation.service.ts
import { db, getContext, NotFoundError } from '@mcv/kernel';
import { conversations, messages, conversationParticipants } from '../schemas';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import type { 
  Conversation, 
  Message, 
  CreateConversationInput,
  SendMessageInput,
  ConversationFilters 
} from '../types';
import { routingService } from '../../contact-center/services/routing.service';
import { slaService } from '../../contact-center/services/sla.service';

export class ConversationService {
  
  /**
   * Create a new conversation
   */
  async create(input: CreateConversationInput): Promise<Conversation> {
    const ctx = getContext();
    
    return await db.transaction(async (tx) => {
      // Create conversation
      const [conversation] = await tx.insert(conversations).values({
        ventureId: ctx.venture.id,
        channel: input.channel,
        channelData: input.channelData,
        subject: input.subject,
        initiatorType: input.initiatorType,
        initiatorId: input.initiatorId,
        contactId: input.contactId,
        organizationId: input.organizationId,
        inboxId: input.inboxId,
        firstMessageAt: new Date(),
        lastMessageAt: new Date(),
        metadata: input.metadata,
        tags: input.tags,
        createdBy: ctx.user?.id,
      }).returning();
      
      // Add initiator as participant
      if (input.contactId) {
        await tx.insert(conversationParticipants).values({
          ventureId: ctx.venture.id,
          conversationId: conversation.id,
          participantType: 'contact',
          contactId: input.contactId,
          role: 'initiator',
          createdBy: ctx.user?.id,
        });
      }
      
      // Route to inbox if specified
      if (input.inboxId) {
        await routingService.routeConversation(conversation.id, input.inboxId);
      }
      
      return conversation;
    });
  }
  
  /**
   * Send a message in a conversation
   */
  async sendMessage(
    conversationId: string, 
    input: SendMessageInput
  ): Promise<Message> {
    const ctx = getContext();
    
    const conversation = await this.getById(conversationId);
    
    return await db.transaction(async (tx) => {
      // Create message
      const [message] = await tx.insert(messages).values({
        ventureId: ctx.venture.id,
        conversationId,
        senderType: input.senderType || (ctx.user ? 'user' : 'system'),
        senderId: input.senderId || ctx.user?.id,
        senderName: input.senderName,
        contentType: input.contentType || 'text',
        content: input.content,
        contentHtml: input.contentHtml,
        attachments: input.attachments,
        replyToId: input.replyToId,
        isPrivate: input.isPrivate || false,
        status: 'sending',
        metadata: input.metadata,
        createdBy: ctx.user?.id,
      }).returning();
      
      // Update conversation
      const preview = input.content 
        ? input.content.substring(0, 200) 
        : `[${input.contentType}]`;
      
      const updateData: any = {
        lastMessageAt: new Date(),
        preview,
        messageCount: sql`message_count + 1`,
        updatedBy: ctx.user?.id,
      };
      
      if (input.senderType === 'user' || ctx.user) {
        updateData.lastUserMessageAt = new Date();
        updateData.waitingOnContact = true;
        updateData.waitingSince = new Date();
      } else {
        updateData.lastContactMessageAt = new Date();
        updateData.waitingOnContact = false;
        updateData.waitingSince = null;
      }
      
      await tx.update(conversations)
        .set(updateData)
        .where(eq(conversations.id, conversationId));
      
      // Update unread counts for other participants
      if (!input.isPrivate) {
        await tx.update(conversationParticipants)
          .set({ unreadCount: sql`unread_count + 1` })
          .where(and(
            eq(conversationParticipants.conversationId, conversationId),
            sql`(contact_id IS NOT NULL AND contact_id != ${input.senderId || ctx.user?.id}) OR (user_id IS NOT NULL AND user_id != ${input.senderId || ctx.user?.id})`
          ));
      }
      
      // Record first response for SLA if this is agent reply
      if (ctx.user && conversation.inboxAssignment?.firstRespondedAt === null) {
        await slaService.recordFirstResponse(conversation.inboxAssignment.id);
      }
      
      // Send via channel (async)
      this.sendViaChannel(conversation, message).catch(err => {
        logger.error({ err, messageId: message.id }, 'Failed to send message via channel');
      });
      
      return message;
    });
  }
  
  /**
   * Get conversation by ID with all relations
   */
  async getById(id: string): Promise<Conversation> {
    const ctx = getContext();
    
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, id),
        eq(conversations.ventureId, ctx.venture.id),
        isNull(conversations.deletedAt)
      ),
      with: {
        contact: true,
        organization: true,
        participants: {
          with: {
            contact: { columns: { id: true, fullName: true, email: true, avatarUrl: true } },
            user: { columns: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        inboxAssignment: {
          with: {
            inbox: true,
            assignedAgent: { columns: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });
    
    if (!conversation) {
      throw new NotFoundError('Conversation', id);
    }
    
    return conversation;
  }
  
  /**
   * Get messages in a conversation
   */
  async getMessages(
    conversationId: string, 
    options: { 
      limit?: number; 
      before?: string; 
      after?: string;
      includePrivate?: boolean;
    } = {}
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    const ctx = getContext();
    
    const conditions = [
      eq(messages.conversationId, conversationId),
      eq(messages.ventureId, ctx.venture.id),
      isNull(messages.deletedAt),
    ];
    
    if (!options.includePrivate && !ctx.user) {
      conditions.push(eq(messages.isPrivate, false));
    }
    
    if (options.before) {
      conditions.push(sql`id < ${options.before}`);
    }
    
    if (options.after) {
      conditions.push(sql`id > ${options.after}`);
    }
    
    const limit = options.limit || 50;
    
    const result = await db.query.messages.findMany({
      where: and(...conditions),
      orderBy: [desc(messages.createdAt)],
      limit: limit + 1,
    });
    
    const hasMore = result.length > limit;
    const messagesResult = hasMore ? result.slice(0, limit) : result;
    
    return {
      messages: messagesResult.reverse(),
      hasMore,
    };
  }
  
  /**
   * Mark messages as read
   */
  async markAsRead(
    conversationId: string, 
    upToMessageId?: string
  ): Promise<void> {
    const ctx = getContext();
    
    if (!ctx.user) return;
    
    // Get latest message if not specified
    let messageId = upToMessageId;
    if (!messageId) {
      const latest = await db.query.messages.findFirst({
        where: eq(messages.conversationId, conversationId),
        orderBy: [desc(messages.createdAt)],
        columns: { id: true },
      });
      messageId = latest?.id;
    }
    
    if (!messageId) return;
    
    await db.update(conversationParticipants)
      .set({
        lastReadAt: new Date(),
        lastReadMessageId: messageId,
        unreadCount: 0,
        updatedBy: ctx.user.id,
      })
      .where(and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, ctx.user.id)
      ));
  }
  
  /**
   * Close/resolve a conversation
   */
  async close(
    id: string, 
    resolution?: { reason?: string; feedback?: string }
  ): Promise<Conversation> {
    const ctx = getContext();
    
    const [updated] = await db.update(conversations)
      .set({
        status: 'closed',
        metadata: sql`metadata || ${JSON.stringify({ resolution })}::jsonb`,
        updatedBy: ctx.user?.id,
      })
      .where(and(
        eq(conversations.id, id),
        eq(conversations.ventureId, ctx.venture.id)
      ))
      .returning();
    
    // Record SLA resolution
    const assignment = await db.query.inboxAssignments.findFirst({
      where: eq(inboxAssignments.conversationId, id),
    });
    
    if (assignment) {
      await slaService.recordResolution(assignment.id);
    }
    
    return updated;
  }
  
  /**
   * Snooze a conversation
   */
  async snooze(id: string, until: Date): Promise<Conversation> {
    const ctx = getContext();
    
    const [updated] = await db.update(conversations)
      .set({
        status: 'snoozed',
        updatedBy: ctx.user?.id,
      })
      .where(eq(conversations.id, id))
      .returning();
    
    // Update inbox assignment
    await db.update(inboxAssignments)
      .set({ 
        status: 'snoozed',
        snoozedUntil: until,
      })
      .where(eq(inboxAssignments.conversationId, id));
    
    return updated;
  }
  
  /**
   * Send message via appropriate channel
   */
  private async sendViaChannel(
    conversation: Conversation, 
    message: Message
  ): Promise<void> {
    // Channel-specific sending logic
    switch (conversation.channel) {
      case 'email':
        await this.sendEmail(conversation, message);
        break;
      case 'chat':
        await this.sendChat(conversation, message);
        break;
      case 'whatsapp':
        await this.sendWhatsApp(conversation, message);
        break;
      // ... other channels
    }
    
    // Update message status
    await db.update(messages)
      .set({ status: 'sent', sentAt: new Date() })
      .where(eq(messages.id, message.id));
  }
  
  private async sendEmail(conversation: Conversation, message: Message): Promise<void> {
    // Email sending implementation
  }
  
  private async sendChat(conversation: Conversation, message: Message): Promise<void> {
    // Real-time chat via websocket
  }
  
  private async sendWhatsApp(conversation: Conversation, message: Message): Promise<void> {
    // WhatsApp Business API
  }
}

export const conversationService = new ConversationService();
```

---

## Module: calls

### Purpose

VoIP calling integration with recording, IVR (Interactive Voice Response), and call analytics.

### Data Models

```typescript
// @mcv/nexus/calls/schemas/call.ts
import { pgTable, uuid, text, timestamp, varchar, integer, boolean, jsonb, decimal } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel';

export const calls = pgTable('nexus_calls', {
  ...baseColumns,
  
  // External ID (Twilio, etc.)
  externalId: varchar('external_id', { length: 100 }),
  provider: varchar('provider', { length: 50 }).default('twilio'),
  
  // Direction
  direction: varchar('direction', { length: 20 }).notNull(), // inbound, outbound
  
  // Endpoints
  fromNumber: varchar('from_number', { length: 32 }).notNull(),
  toNumber: varchar('to_number', { length: 32 }).notNull(),
  
  // Contact/User
  contactId: uuid('contact_id').references(() => contacts.id),
  userId: uuid('user_id').references(() => users.id),
  
  // Conversation link
  conversationId: uuid('conversation_id').references(() => conversations.id),
  
  // Status
  status: varchar('status', { length: 20 }).default('initiated'),
  // initiated, ringing, in-progress, completed, busy, no-answer, failed, canceled
  
  // Timing
  initiatedAt: timestamp('initiated_at', { withTimezone: true }),
  ringingAt: timestamp('ringing_at', { withTimezone: true }),
  answeredAt: timestamp('answered_at', { withTimezone: true }),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  
  // Duration (seconds)
  ringDuration: integer('ring_duration'),
  callDuration: integer('call_duration'),
  totalDuration: integer('total_duration'),
  
  // Recording
  recordingEnabled: boolean('recording_enabled').default(true),
  recordingUrl: text('recording_url'),
  recordingDuration: integer('recording_duration'),
  recordingStatus: varchar('recording_status', { length: 20 }),
  
  // Transcription
  transcriptionEnabled: boolean('transcription_enabled').default(false),
  transcriptionStatus: varchar('transcription_status', { length: 20 }),
  transcription: text('transcription'),
  
  // Quality metrics
  qualityScore: integer('quality_score'),
  signalLevel: integer('signal_level'),
  
  // Disposition
  disposition: varchar('disposition', { length: 50 }), // answered, voicemail, callback, etc.
  dispositionNotes: text('disposition_notes'),
  
  // Cost
  cost: decimal('cost', { precision: 10, scale: 4 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  
  // IVR path
  ivrPath: jsonb('ivr_path').$type<IvrPathEntry[]>().default([]),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
});

export type IvrPathEntry = {
  timestamp: string;
  action: string;
  input?: string;
  menuId?: string;
  result?: string;
};

export const callRecordings = pgTable('nexus_call_recordings', {
  ...baseColumns,
  
  callId: uuid('call_id').references(() => calls.id).notNull(),
  
  // Storage
  url: text('url').notNull(),
  storageProvider: varchar('storage_provider', { length: 50 }),
  storagePath: text('storage_path'),
  
  // Properties
  duration: integer('duration').notNull(), // seconds
  fileSize: integer('file_size'), // bytes
  mimeType: varchar('mime_type', { length: 100 }).default('audio/wav'),
  
  // Processing
  transcriptionId: uuid('transcription_id'),
  analysisId: uuid('analysis_id'),
  
  // Retention
  retainUntil: timestamp('retain_until', { withTimezone: true }),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
});

export const ivrMenus = pgTable('nexus_ivr_menus', {
  ...baseColumns,
  
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  
  // Type
  type: varchar('type', { length: 20 }).default('menu'), // menu, hours, voicemail, queue
  
  // Content
  greeting: text('greeting'), // TTS text or audio URL
  greetingType: varchar('greeting_type', { length: 20 }).default('tts'), // tts, audio
  greetingVoice: varchar('greeting_voice', { length: 50 }),
  greetingAudioUrl: text('greeting_audio_url'),
  
  // Options
  options: jsonb('options').$type<IvrOption[]>().default([]),
  
  // Settings
  timeout: integer('timeout').default(10), // seconds to wait for input
  maxRetries: integer('max_retries').default(3),
  invalidInputMessage: text('invalid_input_message'),
  timeoutMessage: text('timeout_message'),
  
  // Default action
  defaultAction: jsonb('default_action').$type<IvrAction>(),
  
  // Active hours (optional)
  hoursEnabled: boolean('hours_enabled').default(false),
  activeHours: jsonb('active_hours').$type<WorkingHours>(),
  afterHoursAction: jsonb('after_hours_action').$type<IvrAction>(),
  
  // Status
  isActive: boolean('is_active').default(true),
});

export type IvrOption = {
  digit: string; // 1-9, 0, *, #
  label: string;
  action: IvrAction;
};

export type IvrAction = {
  type: 'menu' | 'queue' | 'extension' | 'external' | 'voicemail' | 'hangup' | 'callback';
  targetId?: string;
  number?: string;
  message?: string;
};
```

### Services

```typescript
// @mcv/nexus/calls/services/call.service.ts
import { db, getContext, NotFoundError, logger } from '@mcv/kernel';
import { calls, callRecordings } from '../schemas';
import { eq, and, isNull, desc, sql, between } from 'drizzle-orm';
import type { Call, CreateCallInput, CallFilters, CallAnalytics } from '../types';

export class CallService {
  
  /**
   * Initiate an outbound call
   */
  async initiateCall(input: CreateCallInput): Promise<Call> {
    const ctx = getContext();
    
    // Create call record
    const [call] = await db.insert(calls).values({
      ventureId: ctx.venture.id,
      direction: 'outbound',
      fromNumber: input.fromNumber,
      toNumber: input.toNumber,
      contactId: input.contactId,
      userId: ctx.user?.id,
      conversationId: input.conversationId,
      status: 'initiated',
      initiatedAt: new Date(),
      recordingEnabled: input.recordingEnabled ?? true,
      transcriptionEnabled: input.transcriptionEnabled ?? false,
      metadata: input.metadata,
      createdBy: ctx.user?.id,
    }).returning();
    
    // Initiate via provider
    try {
      const providerResult = await this.initiateViaProvider(call);
      
      await db.update(calls)
        .set({
          externalId: providerResult.callSid,
          status: 'ringing',
          ringingAt: new Date(),
        })
        .where(eq(calls.id, call.id));
      
      return { ...call, externalId: providerResult.callSid, status: 'ringing' };
    } catch (err) {
      await db.update(calls)
        .set({ status: 'failed', metadata: { error: err.message } })
        .where(eq(calls.id, call.id));
      
      throw err;
    }
  }
  
  /**
   * Handle incoming call webhook
   */
  async handleIncomingCall(webhookData: IncomingCallWebhook): Promise<{
    call: Call;
    twimlResponse: string;
  }> {
    const ctx = getContext();
    
    // Look up contact by phone number
    const contact = await db.query.contacts.findFirst({
      where: and(
        eq(contacts.ventureId, ctx.venture.id),
        eq(contacts.phone, webhookData.from)
      ),
    });
    
    // Create call record
    const [call] = await db.insert(calls).values({
      ventureId: ctx.venture.id,
      direction: 'inbound',
      externalId: webhookData.callSid,
      provider: 'twilio',
      fromNumber: webhookData.from,
      toNumber: webhookData.to,
      contactId: contact?.id,
      status: 'ringing',
      initiatedAt: new Date(webhookData.timestamp),
      ringingAt: new Date(),
      recordingEnabled: true,
    }).returning();
    
    // Determine IVR response based on configuration
    const twimlResponse = await this.generateIvrResponse(call, ctx.venture);
    
    return { call, twimlResponse };
  }
  
  /**
   * Handle call status updates
   */
  async handleStatusUpdate(webhookData: CallStatusWebhook): Promise<void> {
    const call = await db.query.calls.findFirst({
      where: eq(calls.externalId, webhookData.callSid),
    });
    
    if (!call) {
      logger.warn({ callSid: webhookData.callSid }, 'Call not found for status update');
      return;
    }
    
    const updates: Partial<typeof calls.$inferInsert> = {
      status: this.mapProviderStatus(webhookData.callStatus),
    };
    
    switch (webhookData.callStatus) {
      case 'in-progress':
        updates.answeredAt = new Date();
        break;
      case 'completed':
        updates.endedAt = new Date();
        updates.callDuration = webhookData.duration;
        updates.totalDuration = this.calculateTotalDuration(call);
        break;
      case 'busy':
      case 'no-answer':
      case 'failed':
      case 'canceled':
        updates.endedAt = new Date();
        break;
    }
    
    await db.update(calls)
      .set(updates)
      .where(eq(calls.id, call.id));
    
    // If call ended, process recording
    if (['completed', 'busy', 'no-answer', 'failed', 'canceled'].includes(webhookData.callStatus)) {
      await this.processCallEnd(call.id);
    }
  }
  
  /**
   * Handle recording ready webhook
   */
  async handleRecordingReady(webhookData: RecordingWebhook): Promise<void> {
    const call = await db.query.calls.findFirst({
      where: eq(calls.externalId, webhookData.callSid),
    });
    
    if (!call) return;
    
    // Save recording
    await db.insert(callRecordings).values({
      ventureId: call.ventureId,
      callId: call.id,
      url: webhookData.recordingUrl,
      duration: webhookData.recordingDuration,
      fileSize: webhookData.recordingSize,
      createdBy: call.createdBy,
    });
    
    await db.update(calls)
      .set({
        recordingUrl: webhookData.recordingUrl,
        recordingDuration: webhookData.recordingDuration,
        recordingStatus: 'ready',
      })
      .where(eq(calls.id, call.id));
    
    // Trigger transcription if enabled
    if (call.transcriptionEnabled) {
      await this.requestTranscription(call.id, webhookData.recordingUrl);
    }
  }
  
  /**
   * Get call analytics
   */
  async getAnalytics(options: {
    startDate: Date;
    endDate: Date;
    groupBy?: 'day' | 'week' | 'month';
    userId?: string;
  }): Promise<CallAnalytics> {
    const ctx = getContext();
    
    const conditions = [
      eq(calls.ventureId, ctx.venture.id),
      between(calls.initiatedAt, options.startDate, options.endDate),
      isNull(calls.deletedAt),
    ];
    
    if (options.userId) {
      conditions.push(eq(calls.userId, options.userId));
    }
    
    // Total calls by direction
    const directionStats = await db.select({
      direction: calls.direction,
      count: sql<number>`count(*)`,
    })
      .from(calls)
      .where(and(...conditions))
      .groupBy(calls.direction);
    
    // Calls by status
    const statusStats = await db.select({
      status: calls.status,
      count: sql<number>`count(*)`,
    })
      .from(calls)
      .where(and(...conditions))
      .groupBy(calls.status);
    
    // Duration stats
    const durationStats = await db.select({
      avgDuration: sql<number>`avg(call_duration)`,
      totalDuration: sql<number>`sum(call_duration)`,
      maxDuration: sql<number>`max(call_duration)`,
      minDuration: sql<number>`min(call_duration)`,
    })
      .from(calls)
      .where(and(...conditions, sql`call_duration > 0`));
    
    // Answer rate
    const totalCalls = directionStats.reduce((sum, d) => sum + d.count, 0);
    const answeredCalls = statusStats.find(s => s.status === 'completed')?.count || 0;
    const answerRate = totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0;
    
    // Time series
    const groupByFormat = options.groupBy === 'month' 
      ? "to_char(initiated_at, 'YYYY-MM')"
      : options.groupBy === 'week'
      ? "to_char(initiated_at, 'YYYY-WW')"
      : "to_char(initiated_at, 'YYYY-MM-DD')";
    
    const timeSeries = await db.select({
      period: sql<string>`${sql.raw(groupByFormat)}`,
      inbound: sql<number>`count(*) filter (where direction = 'inbound')`,
      outbound: sql<number>`count(*) filter (where direction = 'outbound')`,
      answered: sql<number>`count(*) filter (where status = 'completed')`,
      avgDuration: sql<number>`avg(call_duration) filter (where call_duration > 0)`,
    })
      .from(calls)
      .where(and(...conditions))
      .groupBy(sql`${sql.raw(groupByFormat)}`)
      .orderBy(sql`${sql.raw(groupByFormat)}`);
    
    return {
      summary: {
        total: totalCalls,
        inbound: directionStats.find(d => d.direction === 'inbound')?.count || 0,
        outbound: directionStats.find(d => d.direction === 'outbound')?.count || 0,
        answered: answeredCalls,
        missed: statusStats.find(s => s.status === 'no-answer')?.count || 0,
        answerRate: Math.round(answerRate * 100) / 100,
      },
      duration: {
        average: Math.round(durationStats[0]?.avgDuration || 0),
        total: durationStats[0]?.totalDuration || 0,
        max: durationStats[0]?.maxDuration || 0,
        min: durationStats[0]?.minDuration || 0,
      },
      byStatus: statusStats.reduce((acc, s) => {
        acc[s.status] = s.count;
        return acc;
      }, {} as Record<string, number>),
      timeSeries,
    };
  }
  
  /**
   * Generate IVR TwiML response
   */
  private async generateIvrResponse(call: Call, venture: any): Promise<string> {
    // Get active IVR menu for this venture
    const ivrMenu = await db.query.ivrMenus.findFirst({
      where: and(
        eq(ivrMenus.ventureId, call.ventureId),
        eq(ivrMenus.isActive, true)
      ),
    });
    
    if (!ivrMenu) {
      // Default: ring to first available agent
      return `
        <Response>
          <Say>Thank you for calling. Please hold while we connect you.</Say>
          <Dial>
            <Queue>default</Queue>
          </Dial>
        </Response>
      `;
    }
    
    // Check business hours
    if (ivrMenu.hoursEnabled && ivrMenu.activeHours) {
      const isOpen = this.isWithinBusinessHours(ivrMenu.activeHours);
      if (!isOpen && ivrMenu.afterHoursAction) {
        return this.generateActionTwiml(ivrMenu.afterHoursAction, ivrMenu);
      }
    }
    
    // Generate menu TwiML
    return this.generateMenuTwiml(ivrMenu);
  }
  
  private generateMenuTwiml(menu: typeof ivrMenus.$inferSelect): string {
    const greetingElement = menu.greetingType === 'audio'
      ? `<Play>${menu.greetingAudioUrl}</Play>`
      : `<Say voice="${menu.greetingVoice || 'alice'}">${menu.greeting}</Say>`;
    
    const optionsText = menu.options
      .map(opt => `Press ${opt.digit} for ${opt.label}.`)
      .join(' ');
    
    return `
      <Response>
        ${greetingElement}
        <Gather numDigits="1" timeout="${menu.timeout}" action="/api/ivr/handle">
          <Say>${optionsText}</Say>
        </Gather>
        <Say>${menu.timeoutMessage || 'We did not receive any input.'}</Say>
        ${menu.defaultAction ? this.generateActionTwiml(menu.defaultAction, menu) : '<Hangup/>'}
      </Response>
    `;
  }
  
  private generateActionTwiml(action: IvrAction, menu: any): string {
    switch (action.type) {
      case 'menu':
        return `<Redirect>/api/ivr/menu/${action.targetId}</Redirect>`;
      case 'queue':
        return `<Dial><Queue>${action.targetId}</Queue></Dial>`;
      case 'extension':
        return `<Dial>${action.number}</Dial>`;
      case 'external':
        return `<Dial>${action.number}</Dial>`;
      case 'voicemail':
        return `
          <Say>${action.message || 'Please leave a message after the tone.'}</Say>
          <Record maxLength="120" action="/api/ivr/voicemail" />
        `;
      case 'callback':
        return `
          <Say>${action.message || 'We will call you back shortly.'}</Say>
          <Hangup/>
        `;
      case 'hangup':
      default:
        return '<Hangup/>';
    }
  }
  
  private async initiateViaProvider(call: Call): Promise<{ callSid: string }> {
    // Twilio implementation
    const client = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    const twilioCall = await client.calls.create({
      from: call.fromNumber,
      to: call.toNumber,
      url: `${process.env.APP_URL}/api/calls/twiml/${call.id}`,
      statusCallback: `${process.env.APP_URL}/api/calls/status`,
      record: call.recordingEnabled,
    });
    
    return { callSid: twilioCall.sid };
  }
  
  private mapProviderStatus(status: string): string {
    const mapping: Record<string, string> = {
      'queued': 'initiated',
      'ringing': 'ringing',
      'in-progress': 'in-progress',
      'completed': 'completed',
      'busy': 'busy',
      'no-answer': 'no-answer',
      'failed': 'failed',
      'canceled': 'canceled',
    };
    return mapping[status] || status;
  }
  
  private calculateTotalDuration(call: Call): number {
    if (!call.initiatedAt) return 0;
    const endTime = new Date();
    return Math.round((endTime.getTime() - call.initiatedAt.getTime()) / 1000);
  }
  
  private isWithinBusinessHours(hours: WorkingHours): boolean {
    // Business hours check implementation
    return true; // Simplified
  }
  
  private async processCallEnd(callId: string): Promise<void> {
    // Post-call processing
  }
  
  private async requestTranscription(callId: string, audioUrl: string): Promise<void> {
    // Transcription service integration
  }
}

export const callService = new CallService();
```

---

## Module: forms

### Purpose

Form builder with drag-and-drop field configuration, conditional logic, submission handling, and webhook integrations.

### Data Models

```typescript
// @mcv/nexus/forms/schemas/form.ts
import { pgTable, uuid, text, timestamp, varchar, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel';

export const forms = pgTable('nexus_forms', {
  ...baseColumns,
  
  // Identity
  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 100 }),
  description: text('description'),
  
  // Type
  type: varchar('type', { length: 50 }).default('standard'),
  // standard, survey, quiz, registration, contact, feedback
  
  // Status
  status: varchar('status', { length: 20 }).default('draft'), // draft, published, archived
  publishedAt: timestamp('published_at', { withTimezone: true }),
  
  // Settings
  settings: jsonb('settings').$type<FormSettings>().default({}),
  
  // Styling
  theme: jsonb('theme').$type<FormTheme>().default({}),
  customCss: text('custom_css'),
  
  // Success handling
  successMessage: text('success_message'),
  successRedirectUrl: text('success_redirect_url'),
  
  // Notifications
  notifyEmails: text('notify_emails').array().default([]),
  notifyOnSubmission: boolean('notify_on_submission').default(true),
  
  // Limits
  submissionLimit: integer('submission_limit'),
  submissionDeadline: timestamp('submission_deadline', { withTimezone: true }),
  allowMultipleSubmissions: boolean('allow_multiple_submissions').default(true),
  
  // Analytics
  viewCount: integer('view_count').default(0),
  startCount: integer('start_count').default(0),
  submissionCount: integer('submission_count').default(0),
  
  // Integration
  webhookUrl: text('webhook_url'),
  zapierEnabled: boolean('zapier_enabled').default(false),
});

export type FormSettings = {
  requireAuth: boolean;
  showProgressBar: boolean;
  showPageNumbers: boolean;
  shuffleQuestions: boolean;
  allowSaveDraft: boolean;
  enableCaptcha: boolean;
  captchaType: 'recaptcha' | 'hcaptcha' | 'turnstile';
  autosaveInterval: number; // seconds
  submitButtonText: string;
  collectMetadata: boolean;
};

export type FormTheme = {
  primaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  fontSize: string;
  borderRadius: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
};

export const formFields = pgTable('nexus_form_fields', {
  ...baseColumns,
  
  formId: uuid('form_id').references(() => forms.id).notNull(),
  
  // Identity
  name: varchar('name', { length: 100 }).notNull(), // internal name
  label: varchar('label', { length: 500 }).notNull(),
  placeholder: varchar('placeholder', { length: 500 }),
  helpText: text('help_text'),
  
  // Type
  type: varchar('type', { length: 50 }).notNull(),
  // text, textarea, email, phone, number, url, date, time, datetime,
  // select, multiselect, radio, checkbox, rating, scale, file, signature,
  // heading, paragraph, divider, hidden, calculated
  
  // Position
  pageNumber: integer('page_number').default(1),
  displayOrder: integer('display_order').notNull(),
  
  // Validation
  required: boolean('required').default(false),
  validation: jsonb('validation').$type<FieldValidation>().default({}),
  
  // Options (for select, radio, checkbox)
  options: jsonb('options').$type<FieldOption[]>().default([]),
  
  // Configuration
  config: jsonb('config').$type<FieldConfig>().default({}),
  
  // Conditional logic
  conditionalLogic: jsonb('conditional_logic').$type<ConditionalLogic>(),
  
  // Mapping
  contactField: varchar('contact_field', { length: 100 }), // Map to contact field
  customFieldKey: varchar('custom_field_key', { length: 100 }), // Map to custom field
});

export type FieldValidation = {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
  customValidation?: string; // JS expression
};

export type FieldOption = {
  value: string;
  label: string;
  image?: string;
  default?: boolean;
};

export type FieldConfig = {
  // Number fields
  step?: number;
  prefix?: string;
  suffix?: string;
  
  // File fields
  maxFiles?: number;
  maxFileSize?: number; // MB
  allowedTypes?: string[];
  
  // Rating/Scale
  minLabel?: string;
  maxLabel?: string;
  steps?: number;
  showNumbers?: boolean;
  
  // Select
  searchable?: boolean;
  allowCreate?: boolean;
  
  // Date/Time
  minDate?: string;
  maxDate?: string;
  disabledDays?: number[];
  
  // Layout
  columns?: number;
  width?: string;
};

export type ConditionalLogic = {
  enabled: boolean;
  action: 'show' | 'hide' | 'require' | 'skip_to';
  match: 'all' | 'any';
  conditions: Array<{
    fieldId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
    value: string | number | boolean;
  }>;
  skipToFieldId?: string;
};

export const formSubmissions = pgTable('nexus_form_submissions', {
  ...baseColumns,
  
  formId: uuid('form_id').references(() => forms.id).notNull(),
  
  // Submitter
  contactId: uuid('contact_id').references(() => contacts.id),
  userId: uuid('user_id').references(() => users.id),
  
  // Status
  status: varchar('status', { length: 20 }).default('completed'),
  // draft, partial, completed, spam
  
  // Data
  data: jsonb('data').$type<Record<string, unknown>>().notNull(),
  
  // Metadata
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  
  // Analytics
  startedAt: timestamp('started_at', { withTimezone: true }),
  timeToComplete: integer('time_to_complete'), // seconds
  pageViews: integer('page_views').default(1),
  
  // Processing
  processedAt: timestamp('processed_at', { withTimezone: true }),
  processingStatus: varchar('processing_status', { length: 50 }),
  processingError: text('processing_error'),
});

export const formWebhooks = pgTable('nexus_form_webhooks', {
  ...baseColumns,
  
  formId: uuid('form_id').references(() => forms.id).notNull(),
  
  name: varchar('name', { length: 100 }).notNull(),
  url: text('url').notNull(),
  
  // Events
  events: text('events').array().default(['submission.created']),
  
  // Configuration
  method: varchar('method', { length: 10 }).default('POST'),
  headers: jsonb('headers').$type<Record<string, string>>().default({}),
  
  // Authentication
  authType: varchar('auth_type', { length: 20 }), // none, basic, bearer, api_key
  authConfig: jsonb('auth_config').$type<Record<string, string>>(),
  
  // Status
  isActive: boolean('is_active').default(true),
  
  // Stats
  lastTriggeredAt: timestamp('last_triggered_at', { withTimezone: true }),
  successCount: integer('success_count').default(0),
  failureCount: integer('failure_count').default(0),
});
```

### Services

```typescript
// @mcv/nexus/forms/services/form.service.ts
import { db, getContext, NotFoundError, ValidationError } from '@mcv/kernel';
import { forms, formFields, formSubmissions, formWebhooks } from '../schemas';
import { eq, and, isNull, desc, asc } from 'drizzle-orm';
import type { Form, FormField, CreateFormInput, UpdateFormInput, FormWithFields } from '../types';

export class FormService {
  
  /**
   * Create a new form
   */
  async create(input: CreateFormInput): Promise<Form> {
    const ctx = getContext();
    
    const slug = input.slug || this.generateSlug(input.name);
    
    // Check slug uniqueness
    const existing = await db.query.forms.findFirst({
      where: and(
        eq(forms.ventureId, ctx.venture.id),
        eq(forms.slug, slug)
      ),
    });
    
    if (existing) {
      throw new ConflictError('Form with this slug already exists', 'slug');
    }
    
    const [form] = await db.insert(forms).values({
      ventureId: ctx.venture.id,
      name: input.name,
      slug,
      description: input.description,
      type: input.type || 'standard',
      settings: input.settings || {
        requireAuth: false,
        showProgressBar: true,
        showPageNumbers: true,
        shuffleQuestions: false,
        allowSaveDraft: false,
        enableCaptcha: false,
        submitButtonText: 'Submit',
        collectMetadata: true,
      },
      theme: input.theme,
      successMessage: input.successMessage || 'Thank you for your submission!',
      createdBy: ctx.user?.id,
    }).returning();
    
    return form;
  }
  
  /**
   * Get form with all fields
   */
  async getWithFields(id: string): Promise<FormWithFields> {
    const ctx = getContext();
    
    const form = await db.query.forms.findFirst({
      where: and(
        eq(forms.id, id),
        eq(forms.ventureId, ctx.venture.id),
        isNull(forms.deletedAt)
      ),
      with: {
        fields: {
          orderBy: [asc(formFields.pageNumber), asc(formFields.displayOrder)],
        },
        webhooks: {
          where: eq(formWebhooks.isActive, true),
        },
      },
    });
    
    if (!form) {
      throw new NotFoundError('Form', id);
    }
    
    return form;
  }
  
  /**
   * Get form by slug (public access)
   */
  async getBySlug(slug: string, ventureSlug: string): Promise<FormWithFields | null> {
    // This is used for public form rendering
    const form = await db.query.forms.findFirst({
      where: and(
        eq(forms.slug, slug),
        eq(forms.status, 'published'),
        isNull(forms.deletedAt)
      ),
      with: {
        fields: {
          orderBy: [asc(formFields.pageNumber), asc(formFields.displayOrder)],
        },
      },
    });
    
    if (!form) return null;
    
    // Increment view count
    await db.update(forms)
      .set({ viewCount: sql`view_count + 1` })
      .where(eq(forms.id, form.id));
    
    return form;
  }
  
  /**
   * Add field to form
   */
  async addField(formId: string, input: CreateFieldInput): Promise<FormField> {
    const ctx = getContext();
    
    // Get max display order
    const [maxOrder] = await db.select({ max: sql<number>`max(display_order)` })
      .from(formFields)
      .where(and(
        eq(formFields.formId, formId),
        eq(formFields.pageNumber, input.pageNumber || 1)
      ));
    
    const [field] = await db.insert(formFields).values({
      ventureId: ctx.venture.id,
      formId,
      name: input.name || slugify(input.label),
      label: input.label,
      placeholder: input.placeholder,
      helpText: input.helpText,
      type: input.type,
      pageNumber: input.pageNumber || 1,
      displayOrder: input.displayOrder ?? (maxOrder.max || 0) + 1,
      required: input.required || false,
      validation: input.validation,
      options: input.options,
      config: input.config,
      conditionalLogic: input.conditionalLogic,
      contactField: input.contactField,
      customFieldKey: input.customFieldKey,
      createdBy: ctx.user?.id,
    }).returning();
    
    return field;
  }
  
  /**
   * Reorder fields
   */
  async reorderFields(
    formId: string, 
    fieldOrder: Array<{ id: string; pageNumber: number; displayOrder: number }>
  ): Promise<void> {
    const ctx = getContext();
    
    await db.transaction(async (tx) => {
      for (const item of fieldOrder) {
        await tx.update(formFields)
          .set({
            pageNumber: item.pageNumber,
            displayOrder: item.displayOrder,
            updatedBy: ctx.user?.id,
          })
          .where(and(
            eq(formFields.id, item.id),
            eq(formFields.formId, formId)
          ));
      }
    });
  }
  
  /**
   * Publish form
   */
  async publish(id: string): Promise<Form> {
    const ctx = getContext();
    
    // Validate form has fields
    const fieldCount = await db.select({ count: sql<number>`count(*)` })
      .from(formFields)
      .where(eq(formFields.formId, id));
    
    if (fieldCount[0].count === 0) {
      throw new ValidationError('Form must have at least one field before publishing');
    }
    
    const [form] = await db.update(forms)
      .set({
        status: 'published',
        publishedAt: new Date(),
        updatedBy: ctx.user?.id,
      })
      .where(and(
        eq(forms.id, id),
        eq(forms.ventureId, ctx.venture.id)
      ))
      .returning();
    
    return form;
  }
  
  /**
   * Duplicate form
   */
  async duplicate(id: string, newName?: string): Promise<Form> {
    const ctx = getContext();
    
    const original = await this.getWithFields(id);
    
    // Create new form
    const [newForm] = await db.insert(forms).values({
      ventureId: ctx.venture.id,
      name: newName || `${original.name} (Copy)`,
      slug: `${original.slug}-copy-${Date.now()}`,
      description: original.description,
      type: original.type,
      settings: original.settings,
      theme: original.theme,
      successMessage: original.successMessage,
      successRedirectUrl: original.successRedirectUrl,
      notifyEmails: original.notifyEmails,
      status: 'draft',
      createdBy: ctx.user?.id,
    }).returning();
    
    // Copy fields
    if (original.fields.length > 0) {
      const fieldValues = original.fields.map(f => ({
        ventureId: ctx.venture.id,
        formId: newForm.id,
        name: f.name,
        label: f.label,
        placeholder: f.placeholder,
        helpText: f.helpText,
        type: f.type,
        pageNumber: f.pageNumber,
        displayOrder: f.displayOrder,
        required: f.required,
        validation: f.validation,
        options: f.options,
        config: f.config,
        conditionalLogic: f.conditionalLogic,
        contactField: f.contactField,
        customFieldKey: f.customFieldKey,
        createdBy: ctx.user?.id,
      }));
      
      await db.insert(formFields).values(fieldValues);
    }
    
    return newForm;
  }
  
  private generateSlug(name: string): string {
    return slugify(name) + '-' + nanoid(6);
  }
}

export const formService = new FormService();
```

```typescript
// @mcv/nexus/forms/services/submission.service.ts
import { db, getContext, NotFoundError, ValidationError, logger } from '@mcv/kernel';
import { forms, formFields, formSubmissions, formWebhooks } from '../schemas';
import { contacts } from '../../crm/schemas';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import type { FormSubmission, SubmitFormInput, SubmissionFilters } from '../types';

export class SubmissionService {
  
  /**
   * Submit form response
   */
  async submit(formId: string, input: SubmitFormInput): Promise<FormSubmission> {
    const ctx = getContext();
    
    const form = await db.query.forms.findFirst({
      where: and(
        eq(forms.id, formId),
        eq(forms.status, 'published'),
        isNull(forms.deletedAt)
      ),
      with: {
        fields: true,
      },
    });
    
    if (!form) {
      throw new NotFoundError('Form', formId);
    }
    
    // Check submission limits
    if (form.submissionLimit) {
      const currentCount = form.submissionCount || 0;
      if (currentCount >= form.submissionLimit) {
        throw new ValidationError('Form has reached submission limit');
      }
    }
    
    if (form.submissionDeadline && new Date() > form.submissionDeadline) {
      throw new ValidationError('Form submission deadline has passed');
    }
    
    // Validate required fields
    const errors = await this.validateSubmission(form.fields, input.data);
    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
    
    // Spam check
    const isSpam = await this.checkSpam(input);
    
    // Find or create contact
    let contactId = input.contactId;
    if (!contactId && form.fields.some(f => f.contactField)) {
      contactId = await this.findOrCreateContact(form.fields, input.data);
    }
    
    // Create submission
    const [submission] = await db.insert(formSubmissions).values({
      ventureId: form.ventureId,
      formId,
      contactId,
      userId: ctx.user?.id,
      status: isSpam ? 'spam' : 'completed',
      data: input.data,
      submittedAt: new Date(),
      ipAddress: input.metadata?.ipAddress,
      userAgent: input.metadata?.userAgent,
      referrer: input.metadata?.referrer,
      startedAt: input.startedAt,
      timeToComplete: input.startedAt 
        ? Math.round((Date.now() - new Date(input.startedAt).getTime()) / 1000)
        : undefined,
    }).returning();
    
    // Update form stats
    await db.update(forms)
      .set({ submissionCount: sql`submission_count + 1` })
      .where(eq(forms.id, formId));
    
    // Trigger webhooks (async)
    if (!isSpam) {
      this.triggerWebhooks(form.id, submission).catch(err => {
        logger.error({ err, submissionId: submission.id }, 'Webhook trigger failed');
      });
      
      // Send notifications
      if (form.notifyOnSubmission && form.notifyEmails?.length) {
        this.sendNotifications(form, submission).catch(err => {
          logger.error({ err, submissionId: submission.id }, 'Notification send failed');
        });
      }
    }
    
    return submission;
  }
  
  /**
   * Get submissions for a form
   */
  async getSubmissions(
    formId: string, 
    filters: SubmissionFilters
  ): Promise<PaginatedResult<FormSubmission>> {
    const ctx = getContext();
    
    const conditions = [
      eq(formSubmissions.formId, formId),
      eq(formSubmissions.ventureId, ctx.venture.id),
      isNull(formSubmissions.deletedAt),
    ];
    
    if (filters.status) {
      conditions.push(eq(formSubmissions.status, filters.status));
    }
    
    if (filters.startDate) {
      conditions.push(sql`submitted_at >= ${filters.startDate}`);
    }
    
    if (filters.endDate) {
      conditions.push(sql`submitted_at <= ${filters.endDate}`);
    }
    
    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(formSubmissions)
      .where(and(...conditions));
    
    const submissions = await db.query.formSubmissions.findMany({
      where: and(...conditions),
      with: {
        contact: { columns: { id: true, fullName: true, email: true } },
      },
      orderBy: [desc(formSubmissions.submittedAt)],
      limit: filters.limit || 50,
      offset: ((filters.page || 1) - 1) * (filters.limit || 50),
    });
    
    return {
      data: submissions,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 50,
        total: countResult.count,
        totalPages: Math.ceil(countResult.count / (filters.limit || 50)),
        hasNext: (filters.page || 1) * (filters.limit || 50) < countResult.count,
        hasPrev: (filters.page || 1) > 1,
      },
    };
  }
  
  /**
   * Export submissions to CSV
   */
  async exportToCsv(formId: string, filters?: SubmissionFilters): Promise<string> {
    const form = await db.query.forms.findFirst({
      where: eq(forms.id, formId),
      with: { fields: { orderBy: [asc(formFields.displayOrder)] } },
    });
    
    if (!form) {
      throw new NotFoundError('Form', formId);
    }
    
    const submissions = await this.getSubmissions(formId, { 
      ...filters, 
      limit: 10000 
    });
    
    // Build CSV
    const headers = ['Submitted At', 'Status', ...form.fields.map(f => f.label)];
    const rows = submissions.data.map(sub => [
      sub.submittedAt?.toISOString(),
      sub.status,
      ...form.fields.map(f => {
        const value = sub.data[f.name];
        return Array.isArray(value) ? value.join(', ') : String(value ?? '');
      }),
    ]);
    
    const csv = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    
    return csv;
  }
  
  private async validateSubmission(
    fields: FormField[], 
    data: Record<string, unknown>
  ): Promise<Record<string, string[]>> {
    const errors: Record<string, string[]> = {};
    
    for (const field of fields) {
      const value = data[field.name];
      const fieldErrors: string[] = [];
      
      // Required check
      if (field.required && (value === undefined || value === null || value === '')) {
        fieldErrors.push('This field is required');
      }
      
      if (value !== undefined && value !== null && value !== '') {
        // Type-specific validation
        if (field.type === 'email' && typeof value === 'string') {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            fieldErrors.push('Invalid email address');
          }
        }
        
        if (field.validation) {
          if (field.validation.minLength && String(value).length < field.validation.minLength) {
            fieldErrors.push(`Minimum length is ${field.validation.minLength}`);
          }
          if (field.validation.maxLength && String(value).length > field.validation.maxLength) {
            fieldErrors.push(`Maximum length is ${field.validation.maxLength}`);
          }
          if (field.validation.min !== undefined && Number(value) < field.validation.min) {
            fieldErrors.push(`Minimum value is ${field.validation.min}`);
          }
          if (field.validation.max !== undefined && Number(value) > field.validation.max) {
            fieldErrors.push(`Maximum value is ${field.validation.max}`);
          }
          if (field.validation.pattern) {
            const regex = new RegExp(field.validation.pattern);
            if (!regex.test(String(value))) {
              fieldErrors.push(field.validation.patternMessage || 'Invalid format');
            }
          }
        }
      }
      
      if (fieldErrors.length > 0) {
        errors[field.name] = fieldErrors;
      }
    }
    
    return errors;
  }
  
  private async findOrCreateContact(
    fields: FormField[], 
    data: Record<string, unknown>
  ): Promise<string | undefined> {
    const ctx = getContext();
    
    const emailField = fields.find(f => f.contactField === 'email');
    const email = emailField ? data[emailField.name] as string : undefined;
    
    if (!email) return undefined;
    
    // Look for existing contact
    let contact = await db.query.contacts.findFirst({
      where: and(
        eq(contacts.ventureId, ctx.venture.id),
        eq(contacts.email, email.toLowerCase())
      ),
    });
    
    if (!contact) {
      // Create new contact
      const contactData: any = {
        ventureId: ctx.venture.id,
        email: email.toLowerCase(),
        source: 'form',
      };
      
      // Map other fields
      for (const field of fields) {
        if (field.contactField && field.contactField !== 'email') {
          const value = data[field.name];
          if (value !== undefined) {
            contactData[field.contactField] = value;
          }
        }
      }
      
      const [newContact] = await db.insert(contacts).values(contactData).returning();
      contact = newContact;
    }
    
    return contact.id;
  }
  
  private async checkSpam(input: SubmitFormInput): Promise<boolean> {
    // Honeypot check
    if (input.data['_honeypot']) {
      return true;
    }
    
    // Timing check (too fast = bot)
    if (input.startedAt) {
      const duration = Date.now() - new Date(input.startedAt).getTime();
      if (duration < 3000) { // Less than 3 seconds
        return true;
      }
    }
    
    return false;
  }
  
  private async triggerWebhooks(formId: string, submission: FormSubmission): Promise<void> {
    const webhooks = await db.query.formWebhooks.findMany({
      where: and(
        eq(formWebhooks.formId, formId),
        eq(formWebhooks.isActive, true)
      ),
    });
    
    for (const webhook of webhooks) {
      try {
        const response = await fetch(webhook.url, {
          method: webhook.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...webhook.headers,
            ...(webhook.authType === 'bearer' && webhook.authConfig?.token
              ? { 'Authorization': `Bearer ${webhook.authConfig.token}` }
              : {}),
          },
          body: JSON.stringify({
            event: 'submission.created',
            timestamp: new Date().toISOString(),
            form: { id: formId },
            submission: {
              id: submission.id,
              data: submission.data,
              submittedAt: submission.submittedAt,
            },
          }),
        });
        
        await db.update(formWebhooks)
          .set({
            lastTriggeredAt: new Date(),
            successCount: response.ok ? sql`success_count + 1` : undefined,
            failureCount: !response.ok ? sql`failure_count + 1` : undefined,
          })
          .where(eq(formWebhooks.id, webhook.id));
          
      } catch (err) {
        await db.update(formWebhooks)
          .set({
            lastTriggeredAt: new Date(),
            failureCount: sql`failure_count + 1`,
          })
          .where(eq(formWebhooks.id, webhook.id));
      }
    }
  }
  
  private async sendNotifications(form: Form, submission: FormSubmission): Promise<void> {
    // Email notification implementation
  }
}

export const submissionService = new SubmissionService();
```

---

## Module: support

### Purpose

Full ticketing system with SLA management, knowledge base, and customer portal.

### Data Models

```typescript
// @mcv/nexus/support/schemas/ticket.ts
import { pgTable, uuid, text, timestamp, varchar, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel';

export const tickets = pgTable('nexus_tickets', {
  ...baseColumns,
  
  // Reference
  ticketNumber: varchar('ticket_number', { length: 20 }).unique().notNull(),
  
  // Subject/Description
  subject: varchar('subject', { length: 500 }).notNull(),
  description: text('description'),
  descriptionHtml: text('description_html'),
  
  // Status
  status: varchar('status', { length: 20 }).default('open').notNull(),
  // open, pending, on_hold, solved, closed
  
  // Priority
  priority: varchar('priority', { length: 20 }).default('normal'),
  // low, normal, high, urgent
  
  // Type
  type: varchar('type', { length: 50 }), // question, incident, problem, task
  
  // Category
  categoryId: uuid('category_id').references(() => ticketCategories.id),
  
  // Requester
  contactId: uuid('contact_id').references(() => contacts.id),
  organizationId: uuid('organization_id').references(() => organizations.id),
  
  // Assignment
  assigneeId: uuid('assignee_id').references(() => users.id),
  groupId: uuid('group_id').references(() => supportGroups.id),
  
  // Source
  channel: varchar('channel', { length: 50 }).default('web'),
  // web, email, chat, phone, api, social
  
  // Conversation link
  conversationId: uuid('conversation_id').references(() => conversations.id),
  
  // Dates
  firstResponseAt: timestamp('first_response_at', { withTimezone: true }),
  solvedAt: timestamp('solved_at', { withTimezone: true }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  
  // SLA
  slaId: uuid('sla_id').references(() => slaPolices.id),
  firstResponseDue: timestamp('first_response_due', { withTimezone: true }),
  resolutionDue: timestamp('resolution_due', { withTimezone: true }),
  slaBreach: boolean('sla_breach').default(false),
  
  // Satisfaction
  satisfactionRating: integer('satisfaction_rating'), // 1-5
  satisfactionComment: text('satisfaction_comment'),
  satisfactionSentAt: timestamp('satisfaction_sent_at', { withTimezone: true }),
  
  // Related
  parentTicketId: uuid('parent_ticket_id').references(() => tickets.id),
  mergedIntoId: uuid('merged_into_id').references(() => tickets.id),
  
  // Tags
  tags: text('tags').array().default([]),
  
  // Custom
  customFields: jsonb('custom_fields').$type<Record<string, unknown>>().default({}),
});

export const ticketComments = pgTable('nexus_ticket_comments', {
  ...baseColumns,
  
  ticketId: uuid('ticket_id').references(() => tickets.id).notNull(),
  
  // Author
  authorType: varchar('author_type', { length: 20 }).notNull(), // agent, contact, system
  authorId: uuid('author_id'),
  authorName: varchar('author_name', { length: 200 }),
  
  // Content
  body: text('body').notNull(),
  bodyHtml: text('body_html'),
  
  // Visibility
  isPublic: boolean('is_public').default(true),
  
  // Attachments
  attachments: jsonb('attachments').$type<CommentAttachment[]>().default([]),
  
  // Reply info
  via: varchar('via', { length: 50 }), // web, email, api
});

export type CommentAttachment = {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
};

export const slaPolicies = pgTable('nexus_sla_policies', {
  ...baseColumns,
  
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  
  // Targets (in minutes)
  firstResponseTime: integer('first_response_time'),
  nextResponseTime: integer('next_response_time'),
  resolutionTime: integer('resolution_time'),
  
  // Priority overrides
  priorityOverrides: jsonb('priority_overrides').$type<{
    [priority: string]: {
      firstResponseTime?: number;
      resolutionTime?: number;
    };
  }>(),
  
  // Conditions
  conditions: jsonb('conditions').$type<SlaCondition[]>().default([]),
  
  // Business hours
  useBusinessHours: boolean('use_business_hours').default(true),
  businessHoursId: uuid('business_hours_id'),
  
  // Status
  isActive: boolean('is_active').default(true),
  isDefault: boolean('is_default').default(false),
  
  // Order
  priority: integer('priority').default(0),
});

export type SlaCondition = {
  field: string;
  operator: 'is' | 'is_not' | 'contains' | 'in';
  value: string | string[];
};

export const supportGroups = pgTable('nexus_support_groups', {
  ...baseColumns,
  
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  
  // Email
  email: text('email'),
  
  // Default assignment
  defaultAssigneeId: uuid('default_assignee_id').references(() => users.id),
  
  // Settings
  autoAssign: boolean('auto_assign').default(true),
  
  // Members
  memberIds: uuid('member_ids').array().default([]),
});

export const ticketCategories = pgTable('nexus_ticket_categories', {
  ...baseColumns,
  
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }),
  description: text('description'),
  
  // Hierarchy
  parentId: uuid('parent_id').references(() => ticketCategories.id),
  
  // Default assignment
  defaultGroupId: uuid('default_group_id').references(() => supportGroups.id),
  
  // Display
  displayOrder: integer('display_order').default(0),
  icon: varchar('icon', { length: 50 }),
  color: varchar('color', { length: 7 }),
  
  // Status
  isActive: boolean('is_active').default(true),
});

export const knowledgeArticles = pgTable('nexus_knowledge_articles', {
  ...baseColumns,
  
  // Content
  title: varchar('title', { length: 300 }).notNull(),
  slug: varchar('slug', { length: 200 }),
  summary: text('summary'),
  body: text('body').notNull(),
  bodyHtml: text('body_html'),
  
  // Organization
  categoryId: uuid('category_id').references(() => knowledgeCategories.id),
  
  // Status
  status: varchar('status', { length: 20 }).default('draft'),
  // draft, published, archived
  publishedAt: timestamp('published_at', { withTimezone: true }),
  
  // SEO
  metaTitle: varchar('meta_title', { length: 200 }),
  metaDescription: text('meta_description'),
  
  // Visibility
  isPublic: boolean('is_public').default(true),
  restrictedTo: text('restricted_to').array(), // role slugs
  
  // Analytics
  viewCount: integer('view_count').default(0),
  helpfulCount: integer('helpful_count').default(0),
  notHelpfulCount: integer('not_helpful_count').default(0),
  
  // Related
  relatedArticleIds: uuid('related_article_ids').array().default([]),
  
  // Author
  authorId: uuid('author_id').references(() => users.id),
  
  // Search
  searchVector: text('search_vector'), // tsvector for full-text search
});

export const knowledgeCategories = pgTable('nexus_knowledge_categories', {
  ...baseColumns,
  
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }),
  description: text('description'),
  
  // Hierarchy
  parentId: uuid('parent_id').references(() => knowledgeCategories.id),
  
  // Display
  displayOrder: integer('display_order').default(0),
  icon: varchar('icon', { length: 50 }),
  
  // Status
  isPublic: boolean('is_public').default(true),
});
```

### Services

```typescript
// @mcv/nexus/support/services/ticket.service.ts
import { db, getContext, NotFoundError, ValidationError, logger } from '@mcv/kernel';
import { tickets, ticketComments, slaPolicies, supportGroups } from '../schemas';
import { eq, and, isNull, desc, sql, or } from 'drizzle-orm';
import type { 
  Ticket, 
  CreateTicketInput, 
  UpdateTicketInput, 
  TicketFilters,
  TicketWithComments 
} from '../types';

export class TicketService {
  
  /**
   * Create a new ticket
   */
  async create(input: CreateTicketInput): Promise<Ticket> {
    const ctx = getContext();
    
    // Generate ticket number
    const ticketNumber = await this.generateTicketNumber();
    
    // Determine SLA
    const sla = await this.determineSla(input);
    const slaTimes = sla ? this.calculateSlaTimes(sla, input.priority) : null;
    
    // Auto-assign if category has default group
    let groupId = input.groupId;
    let assigneeId = input.assigneeId;
    
    if (input.categoryId && !groupId) {
      const category = await db.query.ticketCategories.findFirst({
        where: eq(ticketCategories.id, input.categoryId),
      });
      if (category?.defaultGroupId) {
        groupId = category.defaultGroupId;
      }
    }
    
    if (groupId && !assigneeId) {
      const group = await db.query.supportGroups.findFirst({
        where: eq(supportGroups.id, groupId),
      });
      if (group?.autoAssign && group.defaultAssigneeId) {
        assigneeId = group.defaultAssigneeId;
      }
    }
    
    const [ticket] = await db.insert(tickets).values({
      ventureId: ctx.venture.id,
      ticketNumber,
      subject: input.subject,
      description: input.description,
      descriptionHtml: input.descriptionHtml,
      status: 'open',
      priority: input.priority || 'normal',
      type: input.type,
      categoryId: input.categoryId,
      contactId: input.contactId,
      organizationId: input.organizationId,
      assigneeId,
      groupId,
      channel: input.channel || 'web',
      conversationId: input.conversationId,
      slaId: sla?.id,
      firstResponseDue: slaTimes?.firstResponseDue,
      resolutionDue: slaTimes?.resolutionDue,
      tags: input.tags,
      customFields: input.customFields,
      createdBy: ctx.user?.id,
    }).returning();
    
    // Create initial comment if description provided
    if (input.description) {
      await db.insert(ticketComments).values({
        ventureId: ctx.venture.id,
        ticketId: ticket.id,
        authorType: input.contactId ? 'contact' : 'agent',
        authorId: input.contactId || ctx.user?.id,
        body: input.description,
        bodyHtml: input.descriptionHtml,
        isPublic: true,
        via: input.channel || 'web',
        createdBy: ctx.user?.id,
      });
    }
    
    // Notify assignee
    if (assigneeId) {
      await this.notifyAssignee(ticket, assigneeId);
    }
    
    return ticket;
  }
  
  /**
   * Add comment to ticket
   */
  async addComment(
    ticketId: string, 
    input: AddCommentInput
  ): Promise<{ ticket: Ticket; comment: TicketComment }> {
    const ctx = getContext();
    
    const ticket = await this.getById(ticketId);
    
    const [comment] = await db.insert(ticketComments).values({
      ventureId: ctx.venture.id,
      ticketId,
      authorType: input.authorType || 'agent',
      authorId: input.authorId || ctx.user?.id,
      authorName: input.authorName,
      body: input.body,
      bodyHtml: input.bodyHtml,
      isPublic: input.isPublic ?? true,
      attachments: input.attachments,
      via: input.via || 'web',
      createdBy: ctx.user?.id,
    }).returning();
    
    // Update ticket
    const updates: any = {
      updatedBy: ctx.user?.id,
    };
    
    // Record first response
    if (!ticket.firstResponseAt && input.authorType === 'agent') {
      updates.firstResponseAt = new Date();
    }
    
    // Update status if pending and agent responds
    if (ticket.status === 'pending' && input.authorType === 'agent') {
      updates.status = 'open';
    }
    
    const [updated] = await db.update(tickets)
      .set(updates)
      .where(eq(tickets.id, ticketId))
      .returning();
    
    // Notify contact if public comment
    if (input.isPublic && ticket.contactId) {
      await this.notifyContact(ticket, comment);
    }
    
    return { ticket: updated, comment };
  }
  
  /**
   * Change ticket status
   */
  async changeStatus(id: string, status: string, reason?: string): Promise<Ticket> {
    const ctx = getContext();
    
    const ticket = await this.getById(id);
    
    const updates: any = {
      status,
      updatedBy: ctx.user?.id,
    };
    
    if (status === 'solved') {
      updates.solvedAt = new Date();
    } else if (status === 'closed') {
      updates.closedAt = new Date();
      
      // Send satisfaction survey if not sent
      if (!ticket.satisfactionSentAt && ticket.contactId) {
        await this.sendSatisfactionSurvey(ticket);
        updates.satisfactionSentAt = new Date();
      }
    }
    
    const [updated] = await db.update(tickets)
      .set(updates)
      .where(eq(tickets.id, id))
      .returning();
    
    // Add system comment
    await db.insert(ticketComments).values({
      ventureId: ctx.venture.id,
      ticketId: id,
      authorType: 'system',
      body: `Status changed to ${status}${reason ? `: ${reason}` : ''}`,
      isPublic: false,
      createdBy: ctx.user?.id,
    });
    
    return updated;
  }
  
  /**
   * Assign ticket
   */
  async assign(
    id: string, 
    assigneeId: string | null, 
    groupId?: string
  ): Promise<Ticket> {
    const ctx = getContext();
    
    const [updated] = await db.update(tickets)
      .set({
        assigneeId,
        groupId: groupId !== undefined ? groupId : undefined,
        updatedBy: ctx.user?.id,
      })
      .where(eq(tickets.id, id))
      .returning();
    
    if (!updated) {
      throw new NotFoundError('Ticket', id);
    }
    
    // Add system comment
    await db.insert(ticketComments).values({
      ventureId: ctx.venture.id,
      ticketId: id,
      authorType: 'system',
      body: assigneeId 
        ? `Ticket assigned to ${(await this.getAssigneeName(assigneeId))}`
        : 'Ticket unassigned',
      isPublic: false,
      createdBy: ctx.user?.id,
    });
    
    // Notify new assignee
    if (assigneeId) {
      await this.notifyAssignee(updated, assigneeId);
    }
    
    return updated;
  }
  
  /**
   * Merge tickets
   */
  async merge(targetId: string, sourceIds: string[]): Promise<Ticket> {
    const ctx = getContext();
    
    return await db.transaction(async (tx) => {
      // Get all tickets
      const allTickets = await tx.query.tickets.findMany({
        where: and(
          or(eq(tickets.id, targetId), inArray(tickets.id, sourceIds)),
          eq(tickets.ventureId, ctx.venture.id)
        ),
        with: { comments: true },
      });
      
      const target = allTickets.find(t => t.id === targetId);
      if (!target) {
        throw new NotFoundError('Ticket', targetId);
      }
      
      const sources = allTickets.filter(t => t.id !== targetId);
      
      // Move comments to target ticket
      for (const source of sources) {
        for (const comment of source.comments || []) {
          await tx.update(ticketComments)
            .set({ ticketId: targetId })
            .where(eq(ticketComments.id, comment.id));
        }
        
        // Mark source as merged
        await tx.update(tickets)
          .set({
            status: 'closed',
            mergedIntoId: targetId,
            closedAt: new Date(),
            updatedBy: ctx.user?.id,
          })
          .where(eq(tickets.id, source.id));
      }
      
      // Add merge comment
      await tx.insert(ticketComments).values({
        ventureId: ctx.venture.id,
        ticketId: targetId,
        authorType: 'system',
        body: `Merged tickets: ${sources.map(s => s.ticketNumber).join(', ')}`,
        isPublic: false,
        createdBy: ctx.user?.id,
      });
      
      return target;
    });
  }
  
  /**
   * Get ticket with comments
   */
  async getWithComments(id: string): Promise<TicketWithComments> {
    const ctx = getContext();
    
    const ticket = await db.query.tickets.findFirst({
      where: and(
        eq(tickets.id, id),
        eq(tickets.ventureId, ctx.venture.id),
        isNull(tickets.deletedAt)
      ),
      with: {
        contact: true,
        organization: true,
        assignee: { columns: { id: true, name: true, avatarUrl: true } },
        group: true,
        category: true,
        comments: {
          orderBy: [asc(ticketComments.createdAt)],
        },
        sla: true,
      },
    });
    
    if (!ticket) {
      throw new NotFoundError('Ticket', id);
    }
    
    return ticket;
  }
  
  /**
   * Search tickets
   */
  async search(filters: TicketFilters): Promise<PaginatedResult<Ticket>> {
    const ctx = getContext();
    
    const conditions = [
      eq(tickets.ventureId, ctx.venture.id),
      isNull(tickets.deletedAt),
      isNull(tickets.mergedIntoId),
    ];
    
    if (filters.query) {
      conditions.push(
        or(
          ilike(tickets.subject, `%${filters.query}%`),
          ilike(tickets.ticketNumber, `%${filters.query}%`)
        )!
      );
    }
    
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        conditions.push(inArray(tickets.status, filters.status));
      } else {
        conditions.push(eq(tickets.status, filters.status));
      }
    }
    
    if (filters.priority) {
      conditions.push(eq(tickets.priority, filters.priority));
    }
    
    if (filters.assigneeId) {
      conditions.push(eq(tickets.assigneeId, filters.assigneeId));
    }
    
    if (filters.groupId) {
      conditions.push(eq(tickets.groupId, filters.groupId));
    }
    
    if (filters.contactId) {
      conditions.push(eq(tickets.contactId, filters.contactId));
    }
    
    if (filters.categoryId) {
      conditions.push(eq(tickets.categoryId, filters.categoryId));
    }
    
    if (filters.slaBreach !== undefined) {
      conditions.push(eq(tickets.slaBreach, filters.slaBreach));
    }
    
    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(tickets)
      .where(and(...conditions));
    
    const results = await db.query.tickets.findMany({
      where: and(...conditions),
      with: {
        contact: { columns: { id: true, fullName: true, email: true } },
        assignee: { columns: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: [desc(tickets.createdAt)],
      limit: filters.limit || 50,
      offset: ((filters.page || 1) - 1) * (filters.limit || 50),
    });
    
    return {
      data: results,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 50,
        total: countResult.count,
        totalPages: Math.ceil(countResult.count / (filters.limit || 50)),
        hasNext: (filters.page || 1) * (filters.limit || 50) < countResult.count,
        hasPrev: (filters.page || 1) > 1,
      },
    };
  }
  
  private async generateTicketNumber(): Promise<string> {
    const ctx = getContext();
    const date = new Date();
    const prefix = date.getFullYear().toString().slice(-2) + 
      String(date.getMonth() + 1).padStart(2, '0');
    
    const [result] = await db.select({ 
      count: sql<number>`count(*) + 1` 
    })
      .from(tickets)
      .where(and(
        eq(tickets.ventureId, ctx.venture.id),
        sql`to_char(created_at, 'YYMM') = ${prefix}`
      ));
    
    return `${prefix}-${String(result.count).padStart(5, '0')}`;
  }
  
  private async determineSla(input: CreateTicketInput): Promise<SlaPolicy | null> {
    const ctx = getContext();
    
    const policies = await db.query.slaPolicies.findMany({
      where: and(
        eq(slaPolicies.ventureId, ctx.venture.id),
        eq(slaPolicies.isActive, true)
      ),
      orderBy: [desc(slaPolicies.priority)],
    });
    
    // Find matching policy
    for (const policy of policies) {
      if (policy.conditions?.length) {
        const matches = policy.conditions.every(condition => {
          const value = (input as any)[condition.field];
          switch (condition.operator) {
            case 'is': return value === condition.value;
            case 'is_not': return value !== condition.value;
            case 'in': return Array.isArray(condition.value) && condition.value.includes(value);
            default: return false;
          }
        });
        if (matches) return policy;
      } else if (policy.isDefault) {
        return policy;
      }
    }
    
    return null;
  }
  
  private calculateSlaTimes(sla: SlaPolicy, priority?: string): {
    firstResponseDue: Date | null;
    resolutionDue: Date | null;
  } {
    const now = new Date();
    
    let firstResponseMinutes = sla.firstResponseTime;
    let resolutionMinutes = sla.resolutionTime;
    
    // Apply priority overrides
    if (priority && sla.priorityOverrides?.[priority]) {
      const override = sla.priorityOverrides[priority];
      if (override.firstResponseTime) firstResponseMinutes = override.firstResponseTime;
      if (override.resolutionTime) resolutionMinutes = override.resolutionTime;
    }
    
    return {
      firstResponseDue: firstResponseMinutes 
        ? new Date(now.getTime() + firstResponseMinutes * 60 * 1000)
        : null,
      resolutionDue: resolutionMinutes
        ? new Date(now.getTime() + resolutionMinutes * 60 * 1000)
        : null,
    };
  }
  
  async getById(id: string): Promise<Ticket> {
    const ctx = getContext();
    const ticket = await db.query.tickets.findFirst({
      where: and(
        eq(tickets.id, id),
        eq(tickets.ventureId, ctx.venture.id),
        isNull(tickets.deletedAt)
      ),
    });
    
    if (!ticket) {
      throw new NotFoundError('Ticket', id);
    }
    
    return ticket;
  }
  
  private async getAssigneeName(id: string): Promise<string> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: { name: true },
    });
    return user?.name || 'Unknown';
  }
  
  private async notifyAssignee(ticket: Ticket, assigneeId: string): Promise<void> {
    // Notification implementation
  }
  
  private async notifyContact(ticket: Ticket, comment: TicketComment): Promise<void> {
    // Email notification to contact
  }
  
  private async sendSatisfactionSurvey(ticket: Ticket): Promise<void> {
    // CSAT survey implementation
  }
}

export const ticketService = new TicketService();
```

---

## Module: documents

### Purpose

Document management with folders, versioning, sharing, and access control.

### Data Models

```typescript
// @mcv/nexus/documents/schemas/document.ts
import { pgTable, uuid, text, timestamp, varchar, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel';

export const documents = pgTable('nexus_documents', {
  ...baseColumns,
  
  // Identity
  name: varchar('name', { length: 300 }).notNull(),
  slug: varchar('slug', { length: 300 }),
  description: text('description'),
  
  // Organization
  folderId: uuid('folder_id').references(() => folders.id),
  
  // File
  fileType: varchar('file_type', { length: 50 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  fileSize: integer('file_size'), // bytes
  
  // Storage
  storageProvider: varchar('storage_provider', { length: 50 }).default('s3'),
  storagePath: text('storage_path'),
  storageUrl: text('storage_url'),
  
  // Versioning
  currentVersionId: uuid('current_version_id'),
  versionCount: integer('version_count').default(1),
  
  // Status
  status: varchar('status', { length: 20 }).default('active'),
  // active, archived, trashed
  
  // Metadata
  metadata: jsonb('metadata').$type<DocumentMetadata>().default({}),
  tags: text('tags').array().default([]),
  
  // Signature status
  signatureRequired: boolean('signature_required').default(false),
  signatureRequestId: uuid('signature_request_id'),
  signatureStatus: varchar('signature_status', { length: 20 }),
  // pending, partial, completed
  
  // Analytics
  viewCount: integer('view_count').default(0),
  downloadCount: integer('download_count').default(0),
  lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }),
  lastViewedBy: uuid('last_viewed_by'),
  
  // Ownership
  ownerId: uuid('owner_id').references(() => users.id),
});

export type DocumentMetadata = {
  width?: number;
  height?: number;
  duration?: number;
  pageCount?: number;
  author?: string;
  title?: string;
  keywords?: string[];
  createdDate?: string;
  modifiedDate?: string;
};

export const documentVersions = pgTable('nexus_document_versions', {
  ...baseColumns,
  
  documentId: uuid('document_id').references(() => documents.id).notNull(),
  
  // Version info
  versionNumber: integer('version_number').notNull(),
  label: varchar('label', { length: 100 }),
  changelog: text('changelog'),
  
  // File
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  storagePath: text('storage_path'),
  storageUrl: text('storage_url'),
  
  // Hash for dedup/integrity
  fileHash: varchar('file_hash', { length: 64 }),
  
  // Status
  isCurrent: boolean('is_current').default(false),
});

export const folders = pgTable('nexus_folders', {
  ...baseColumns,
  
  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 200 }),
  description: text('description'),
  
  // Hierarchy
  parentId: uuid('parent_id').references(() => folders.id),
  path: text('path'), // materialized path: /parent/child/grandchild
  depth: integer('depth').default(0),
  
  // Display
  color: varchar('color', { length: 7 }),
  icon: varchar('icon', { length: 50 }),
  displayOrder: integer('display_order').default(0),
  
  // Ownership
  ownerId: uuid('owner_id').references(() => users.id),
  
  // Settings
  defaultPermissions: jsonb('default_permissions').$type<FolderPermissions>(),
});

export type FolderPermissions = {
  view: string[]; // role/user ids
  edit: string[];
  upload: string[];
  delete: string[];
  share: string[];
};

export const documentShares = pgTable('nexus_document_shares', {
  ...baseColumns,
  
  // Target
  documentId: uuid('document_id').references(() => documents.id),
  folderId: uuid('folder_id').references(() => folders.id),
  
  // Share type
  shareType: varchar('share_type', { length: 20 }).notNull(),
  // link, email, user, team, public
  
  // Recipient
  recipientEmail: text('recipient_email'),
  recipientUserId: uuid('recipient_user_id'),
  recipientTeamId: uuid('recipient_team_id'),
  
  // Link share
  shareToken: varchar('share_token', { length: 64 }).unique(),
  
  // Permissions
  permission: varchar('permission', { length: 20 }).default('view'),
  // view, comment, edit, full
  allowDownload: boolean('allow_download').default(true),
  allowPrint: boolean('allow_print').default(true),
  
  // Expiration
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  
  // Password protection
  hasPassword: boolean('has_password').default(false),
  passwordHash: varchar('password_hash', { length: 128 }),
  
  // Access tracking
  accessCount: integer('access_count').default(0),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
  
  // Status
  isActive: boolean('is_active').default(true),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
});

export const documentAccess = pgTable('nexus_document_access', {
  ...baseColumns,
  
  documentId: uuid('document_id').references(() => documents.id).notNull(),
  
  // Accessor
  accessorType: varchar('accessor_type', { length: 20 }).notNull(),
  // user, contact, anonymous
  accessorId: uuid('accessor_id'),
  accessorEmail: text('accessor_email'),
  accessorIp: varchar('accessor_ip', { length: 45 }),
  
  // Action
  action: varchar('action', { length: 20 }).notNull(),
  // view, download, print, edit
  
  // Share reference
  shareId: uuid('share_id').references(() => documentShares.id),
  
  // Metadata
  userAgent: text('user_agent'),
  duration: integer('duration'), // seconds viewed
});
```

### Services

```typescript
// @mcv/nexus/documents/services/document.service.ts
import { db, getContext, NotFoundError, UnauthorizedError } from '@mcv/kernel';
import { documents, documentVersions, folders, documentShares, documentAccess } from '../schemas';
import { eq, and, isNull, desc, asc, sql } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';
import type { 
  Document, 
  DocumentVersion, 
  Folder,
  CreateDocumentInput,
  ShareDocumentInput,
  DocumentWithVersions 
} from '../types';

export class DocumentService {
  
  /**
   * Upload a new document
   */
  async upload(input: CreateDocumentInput, file: File): Promise<Document> {
    const ctx = getContext();
    
    // Generate file hash for deduplication
    const fileBuffer = await file.arrayBuffer();
    const fileHash = createHash('sha256').update(Buffer.from(fileBuffer)).digest('hex');
    
    // Upload to storage
    const storagePath = `${ctx.venture.id}/documents/${Date.now()}-${file.name}`;
    const storageUrl = await this.uploadToStorage(storagePath, file);
    
    return await db.transaction(async (tx) => {
      // Create document
      const [document] = await tx.insert(documents).values({
        ventureId: ctx.venture.id,
        name: input.name || file.name,
        description: input.description,
        folderId: input.folderId,
        fileType: this.getFileType(file.type),
        mimeType: file.type,
        fileSize: file.size,
        storagePath,
        storageUrl,
        tags: input.tags,
        ownerId: ctx.user?.id,
        createdBy: ctx.user?.id,
      }).returning();
      
      // Create first version
      const [version] = await tx.insert(documentVersions).values({
        ventureId: ctx.venture.id,
        documentId: document.id,
        versionNumber: 1,
        label: 'Initial version',
        fileSize: file.size,
        mimeType: file.type,
        storagePath,
        storageUrl,
        fileHash,
        isCurrent: true,
        createdBy: ctx.user?.id,
      }).returning();
      
      // Update document with version reference
      await tx.update(documents)
        .set({ currentVersionId: version.id })
        .where(eq(documents.id, document.id));
      
      // Extract metadata (async)
      this.extractMetadata(document.id, file).catch(err => {
        logger.error({ err, documentId: document.id }, 'Metadata extraction failed');
      });
      
      return { ...document, currentVersionId: version.id };
    });
  }
  
  /**
   * Upload new version
   */
  async uploadVersion(
    documentId: string, 
    file: File, 
    changelog?: string
  ): Promise<DocumentVersion> {
    const ctx = getContext();
    
    const document = await this.getById(documentId);
    
    // Check permission
    if (!await this.canEdit(documentId)) {
      throw new UnauthorizedError('Cannot edit this document');
    }
    
    const fileBuffer = await file.arrayBuffer();
    const fileHash = createHash('sha256').update(Buffer.from(fileBuffer)).digest('hex');
    
    const storagePath = `${ctx.venture.id}/documents/${documentId}/v${document.versionCount + 1}-${file.name}`;
    const storageUrl = await this.uploadToStorage(storagePath, file);
    
    return await db.transaction(async (tx) => {
      // Mark previous version as not current
      await tx.update(documentVersions)
        .set({ isCurrent: false })
        .where(eq(documentVersions.documentId, documentId));
      
      // Create new version
      const [version] = await tx.insert(documentVersions).values({
        ventureId: ctx.venture.id,
        documentId,
        versionNumber: document.versionCount + 1,
        changelog,
        fileSize: file.size,
        mimeType: file.type,
        storagePath,
        storageUrl,
        fileHash,
        isCurrent: true,
        createdBy: ctx.user?.id,
      }).returning();
      
      // Update document
      await tx.update(documents)
        .set({
          currentVersionId: version.id,
          versionCount: document.versionCount + 1,
          fileSize: file.size,
          mimeType: file.type,
          storagePath,
          storageUrl,
          updatedBy: ctx.user?.id,
        })
        .where(eq(documents.id, documentId));
      
      return version;
    });
  }
  
  /**
   * Create share link
   */
  async createShare(
    documentId: string, 
    input: ShareDocumentInput
  ): Promise<{ share: DocumentShare; url: string }> {
    const ctx = getContext();
    
    const document = await this.getById(documentId);
    
    // Generate share token
    const shareToken = randomBytes(32).toString('hex');
    
    let passwordHash: string | undefined;
    if (input.password) {
      passwordHash = await this.hashPassword(input.password);
    }
    
    const [share] = await db.insert(documentShares).values({
      ventureId: ctx.venture.id,
      documentId,
      shareType: input.shareType,
      recipientEmail: input.recipientEmail,
      recipientUserId: input.recipientUserId,
      shareToken,
      permission: input.permission || 'view',
      allowDownload: input.allowDownload ?? true,
      allowPrint: input.allowPrint ?? true,
      expiresAt: input.expiresAt,
      hasPassword: !!input.password,
      passwordHash,
      createdBy: ctx.user?.id,
    }).returning();
    
    const shareUrl = `${process.env.APP_URL}/share/${shareToken}`;
    
    // Send email if email share
    if (input.shareType === 'email' && input.recipientEmail) {
      await this.sendShareEmail(document, share, shareUrl, input.message);
    }
    
    return { share, url: shareUrl };
  }
  
  /**
   * Access shared document
   */
  async accessShared(
    shareToken: string, 
    password?: string
  ): Promise<{ document: Document; share: DocumentShare }> {
    const share = await db.query.documentShares.findFirst({
      where: and(
        eq(documentShares.shareToken, shareToken),
        eq(documentShares.isActive, true)
      ),
    });
    
    if (!share) {
      throw new NotFoundError('Share', shareToken);
    }
    
    // Check expiration
    if (share.expiresAt && new Date() > share.expiresAt) {
      throw new UnauthorizedError('Share link has expired');
    }
    
    // Check password
    if (share.hasPassword) {
      if (!password) {
        throw new UnauthorizedError('Password required');
      }
      if (!await this.verifyPassword(password, share.passwordHash!)) {
        throw new UnauthorizedError('Invalid password');
      }
    }
    
    const document = await this.getById(share.documentId!);
    
    // Record access
    await db.insert(documentAccess).values({
      ventureId: document.ventureId,
      documentId: document.id,
      accessorType: 'anonymous',
      action: 'view',
      shareId: share.id,
    });
    
    // Update access count
    await db.update(documentShares)
      .set({
        accessCount: sql`access_count + 1`,
        lastAccessedAt: new Date(),
      })
      .where(eq(documentShares.id, share.id));
    
    return { document, share };
  }
  
  /**
   * Move document to folder
   */
  async move(documentId: string, folderId: string | null): Promise<Document> {
    const ctx = getContext();
    
    if (folderId) {
      // Verify folder exists and user has access
      const folder = await db.query.folders.findFirst({
        where: and(
          eq(folders.id, folderId),
          eq(folders.ventureId, ctx.venture.id)
        ),
      });
      
      if (!folder) {
        throw new NotFoundError('Folder', folderId);
      }
    }
    
    const [updated] = await db.update(documents)
      .set({
        folderId,
        updatedBy: ctx.user?.id,
      })
      .where(eq(documents.id, documentId))
      .returning();
    
    return updated;
  }
  
  /**
   * Get folder contents
   */
  async getFolderContents(
    folderId: string | null,
    options: { includeSubfolders?: boolean } = {}
  ): Promise<{ folders: Folder[]; documents: Document[] }> {
    const ctx = getContext();
    
    const folderConditions = [
      eq(folders.ventureId, ctx.venture.id),
      isNull(folders.deletedAt),
    ];
    
    if (folderId === null) {
      folderConditions.push(isNull(folders.parentId));
    } else {
      folderConditions.push(eq(folders.parentId, folderId));
    }
    
    const subfolders = await db.query.folders.findMany({
      where: and(...folderConditions),
      orderBy: [asc(folders.displayOrder), asc(folders.name)],
    });
    
    const documentConditions = [
      eq(documents.ventureId, ctx.venture.id),
      eq(documents.status, 'active'),
      isNull(documents.deletedAt),
    ];
    
    if (folderId === null) {
      documentConditions.push(isNull(documents.folderId));
    } else {
      documentConditions.push(eq(documents.folderId, folderId));
    }
    
    const docs = await db.query.documents.findMany({
      where: and(...documentConditions),
      orderBy: [desc(documents.createdAt)],
    });
    
    return { folders: subfolders, documents: docs };
  }
  
  /**
   * Search documents
   */
  async search(query: string, filters?: DocumentFilters): Promise<Document[]> {
    const ctx = getContext();
    
    const conditions = [
      eq(documents.ventureId, ctx.venture.id),
      eq(documents.status, 'active'),
      isNull(documents.deletedAt),
      or(
        ilike(documents.name, `%${query}%`),
        ilike(documents.description, `%${query}%`),
        sql`tags @> ARRAY[${query}]`
      ),
    ];
    
    if (filters?.fileType) {
      conditions.push(eq(documents.fileType, filters.fileType));
    }
    
    if (filters?.folderId) {
      conditions.push(eq(documents.folderId, filters.folderId));
    }
    
    return db.query.documents.findMany({
      where: and(...conditions),
      orderBy: [desc(documents.createdAt)],
      limit: filters?.limit || 50,
    });
  }
  
  async getById(id: string): Promise<Document> {
    const ctx = getContext();
    
    const document = await db.query.documents.findFirst({
      where: and(
        eq(documents.id, id),
        eq(documents.ventureId, ctx.venture.id),
        isNull(documents.deletedAt)
      ),
    });
    
    if (!document) {
      throw new NotFoundError('Document', id);
    }
    
    return document;
  }
  
  private getFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
    if (mimeType.includes('document') || mimeType.includes('word')) return 'document';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
    return 'other';
  }
  
  private async uploadToStorage(path: string, file: File): Promise<string> {
    // Storage upload implementation (S3, etc.)
    return `https://storage.example.com/${path}`;
  }
  
  private async extractMetadata(documentId: string, file: File): Promise<void> {
    // Metadata extraction implementation
  }
  
  private async canEdit(documentId: string): Promise<boolean> {
    const ctx = getContext();
    const document = await this.getById(documentId);
    return document.ownerId === ctx.user?.id || ctx.hasPermission('documents.edit');
  }
  
  private async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcrypt');
    return bcrypt.hash(password, 10);
  }
  
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(password, hash);
  }
  
  private async sendShareEmail(
    document: Document, 
    share: DocumentShare, 
    url: string,
    message?: string
  ): Promise<void> {
    // Email sending implementation
  }
}

export const documentService = new DocumentService();
```

---

## Module: sign

### Purpose

Electronic signature workflows with templates, multi-signer support, and audit trails.

See: [sign/MODULE.md](./sign/MODULE.md) for detailed documentation.

---

## Module: calendar

### Purpose

Event scheduling, booking pages, calendar sync (Google, Outlook), and automated reminders.

See: [calendar/MODULE.md](./calendar/MODULE.md) for detailed documentation.

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/kernel` | Core utilities, database, context |
| `@mcv/comms` | Email sending, SMS, notifications |
| `@mcv/storage` | File storage abstraction |
| `@mcv/search` | Full-text search |
| `@mcv/realtime` | WebSocket for live chat |
| `@mcv/auth` | Authentication, permissions |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `twilio` | ^4.x | Phone calls, SMS |
| `@google-cloud/speech` | ^6.x | Call transcription |
| `google-auth-library` | ^9.x | Calendar sync |
| `@microsoft/microsoft-graph-client` | ^3.x | Outlook sync |
| `pdf-lib` | ^1.x | PDF manipulation for signatures |

---

## Package Exports

```typescript
// @mcv/nexus/index.ts

// CRM
export { contactService, ContactService } from './crm/services/contact.service';
export { organizationService, OrganizationService } from './crm/services/organization.service';
export { dealService, DealService } from './crm/services/deal.service';
export { pipelineService, PipelineService } from './crm/services/pipeline.service';
export { activityService, ActivityService } from './crm/services/activity.service';
export * from './crm/types';

// Contact Center
export { routingService, RoutingService } from './contact-center/services/routing.service';
export { slaService, SlaService } from './contact-center/services/sla.service';
export { agentService, AgentService } from './contact-center/services/agent.service';
export * from './contact-center/types';

// Conversations
export { conversationService, ConversationService } from './conversations/services/conversation.service';
export * from './conversations/types';

// Calls
export { callService, CallService } from './calls/services/call.service';
export { ivrService, IvrService } from './calls/services/ivr.service';
export * from './calls/types';

// Forms
export { formService, FormService } from './forms/services/form.service';
export { submissionService, SubmissionService } from './forms/services/submission.service';
export * from './forms/types';

// Support
export { ticketService, TicketService } from './support/services/ticket.service';
export { knowledgeService, KnowledgeService } from './support/services/knowledge.service';
export * from './support/types';

// Documents
export { documentService, DocumentService } from './documents/services/document.service';
export { folderService, FolderService } from './documents/services/folder.service';
export * from './documents/types';

// Sign
export { signatureService, SignatureService } from './sign/services/signature.service';
export * from './sign/types';

// Calendar
export { calendarService, CalendarService } from './calendar/services/calendar.service';
export { bookingService, BookingService } from './calendar/services/booking.service';
export * from './calendar/types';
```

---

## Related Documentation

- [crm Module Details](./crm/MODULE.md)
- [contact-center Module Details](./contact-center/MODULE.md)
- [conversations Module Details](./conversations/MODULE.md)
- [calls Module Details](./calls/MODULE.md)
- [forms Module Details](./forms/MODULE.md)
- [support Module Details](./support/MODULE.md)
- [documents Module Details](./documents/MODULE.md)
- [sign Module Details](./sign/MODULE.md)
- [calendar Module Details](./calendar/MODULE.md)

---

*@mcv/nexus — The Customer Relationship & Communication Hub*