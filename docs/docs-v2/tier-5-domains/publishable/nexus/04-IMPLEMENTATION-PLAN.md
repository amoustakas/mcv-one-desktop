# @mcv/nexus — Implementation Plan

**Package:** `@mcv/nexus`
**Tier:** 5 (Domain — Publishable)
**Classification:** PUBLISHABLE
**Document:** 04-IMPLEMENTATION-PLAN.md
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1 — Foundation](#phase-1--foundation-weeks-14)
4. [Phase 2 — Core](#phase-2--core-weeks-58)
5. [Phase 3 — Advanced](#phase-3--advanced-weeks-912)
6. [Phase 4 — Polish & Hardening](#phase-4--polish--hardening-weeks-1314)
7. [Testing Strategy](#testing-strategy)
8. [Acceptance Criteria](#acceptance-criteria)
9. [Risk Matrix](#risk-matrix)
10. [Timeline & Milestones](#timeline--milestones)

---

## Overview

`@mcv/nexus` is the unified customer relationship and communication hub for MCV.ONE. It orchestrates the entire customer lifecycle — from first contact through ongoing relationship management — via **9 tightly integrated submodules**: CRM, Contact Center, Conversations, Calls, Forms, Support, Documents, Sign, and Calendar.

Every business interaction — whether a sales deal closing, a support ticket being resolved, a document being signed, or a meeting being booked — flows through Nexus. It is the connective tissue binding every customer-facing operation into one coherent system.

### Implementation Goals

- **360° Customer View** — Unified contact profiles with full interaction history across all channels
- **Omnichannel Communication** — Email, SMS, live chat, VoIP, WhatsApp, and social messaging in one inbox
- **Pipeline Management** — Kanban-style deal boards with AI-powered scoring and forecasting
- **Intelligent Routing** — Skill-based, round-robin, and priority-weighted ticket and call routing
- **Document Workflows** — Editor, versioning, e-signatures, and collaborative review
- **Self-Service** — Knowledge base, customer portal, booking pages, and embeddable forms
- **Cross-Venture CRM** — Shared contact records and interaction history across all 9 MCV ventures

### Submodule Summary

| # | Submodule | Core Responsibility |
|---|-----------|-------------------|
| 1 | `crm` | Contacts, organizations, deals, pipelines, activities |
| 2 | `contact-center` | Omnichannel inbox, queue management, agent routing, SLA |
| 3 | `conversations` | Multi-channel threading, messaging, read tracking |
| 4 | `calls` | VoIP, recording, IVR, call analytics, dialer |
| 5 | `forms` | Form builder, field types, submissions, webhooks |
| 6 | `support` | Tickets, SLA management, knowledge base, portal |
| 7 | `documents` | Editor, versioning, folders, sharing, collaboration |
| 8 | `sign` | E-signatures, templates, signing workflows, audit trails |
| 9 | `calendar` | Events, booking pages, availability, Google Sync |

---

## Prerequisites

### Infrastructure Dependencies

| Dependency | Purpose | Version |
|-----------|---------|---------|
| `@mcv/kernel` | Database context, base columns, multi-tenancy | ≥1.0.0 |
| `@mcv/auth` | Authentication, RBAC, RLS policies, permissions | ≥1.0.0 |
| `@mcv/comms` | Email (SendGrid), SMS (Twilio), push, WhatsApp | ≥1.0.0 |
| `@mcv/storage` | File storage, CDN delivery, signed URLs | ≥1.0.0 |
| `@mcv/search` | Full-text search (Elasticsearch/Typesense) | ≥1.0.0 |
| `@mcv/realtime` | WebSocket connections, live presence, typing indicators | ≥1.0.0 |
| `@mcv/fabric` | Event bus (Redpanda/Kafka), audit trail | ≥1.0.0 |
| Supabase/PostgreSQL | Primary data store with RLS | 15+ |
| Drizzle ORM | Schema definitions, migrations, queries | ≥0.29.0 |
| Redis | Caching, session state, presence, rate limiting | ≥7.0 |
| BullMQ | Job queues, SLA escalation, reminder scheduling | ≥4.0.0 |
| Zod | Runtime schema validation | ≥3.22.0 |

### External Provider Accounts

| Provider | Submodule | Purpose |
|---------|-----------|---------|
| Twilio | calls | VoIP, call recording, IVR, programmable voice |
| Twilio | conversations | WhatsApp Business API, programmable messaging |
| SendGrid | conversations | Email channel for conversations |
| Google Calendar API | calendar | Calendar sync, availability checking |
| Microsoft Graph API | calendar | Outlook calendar sync |
| DocuSign / HelloSign | sign | E-signature provider fallback |
| Tiptap / ProseMirror | documents | Rich text editor engine |
| Deepgram | calls | Speech-to-text transcription |

### Team & Skills

- 2–3 Backend engineers (Node.js, PostgreSQL, Drizzle ORM, WebSockets)
- 2 Frontend engineers (React, real-time UI, drag-and-drop)
- 1 VoIP specialist (Twilio Programmable Voice, WebRTC)
- 1 QA engineer (end-to-end testing, SLA compliance validation)

---

## Phase 1 — Foundation (Weeks 1–4)

### Objective

Build the foundational CRM, conversation system, basic ticket management, and document management. Establish the data model, core services, and the unified contact record that all other submodules reference.

### 1.1 — Database Schema & Migrations

**Duration:** Week 1
**Submodules:** crm, conversations, support, documents

```typescript
// Example: Contact schema (Drizzle ORM)
import { pgTable, text, uuid, jsonb, boolean, timestamp, integer, decimal } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const contacts = pgTable('contacts', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  type: text('type').notNull(), // 'person' | 'company'
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email'),
  phone: text('phone'),
  company: text('company'),
  jobTitle: text('job_title'),
  leadScore: integer('lead_score').default(0),
  lifecycleStage: text('lifecycle_stage').default('lead'),
  ownerId: text('owner_id'),
  customFields: jsonb('custom_fields').default({}),
  tags: jsonb('tags').default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// RLS Policy
// CREATE POLICY contacts_tenant ON contacts
//   USING (venture_id = current_setting('app.venture_id')::text);

export const deals = pgTable('deals', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  pipelineId: text('pipeline_id').notNull(),
  contactId: text('contact_id'),
  organizationId: text('organization_id'),
  name: text('name').notNull(),
  value: decimal('value', { precision: 15, scale: 2 }),
  currency: text('currency').default('USD'),
  stage: text('stage').notNull(),
  probability: integer('probability'),
  status: text('status').default('open'), // open | won | lost
  expectedCloseDate: timestamp('expected_close_date'),
  actualCloseDate: timestamp('actual_close_date'),
  lostReason: text('lost_reason'),
  ownerId: text('owner_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

**Tasks:**
- [ ] Create CRM schema: contacts, organizations, deals, pipelines, activities, custom_objects
- [ ] Create conversation schema: conversations, messages, conversation_participants
- [ ] Create support schema: tickets, ticket_comments, sla_policies, knowledge_articles, support_groups
- [ ] Create document schema: documents, document_versions, document_templates, document_comments
- [ ] Generate and test migrations against Supabase
- [ ] Apply RLS policies for multi-tenant isolation on all tables
- [ ] Create indexes for high-cardinality queries (contacts by email, deals by pipeline, tickets by status)
- [ ] Seed development data for each venture with realistic contact volumes

### 1.2 — CRM Core (crm)

**Duration:** Weeks 1–3
**Services:** `ContactService`, `OrganizationService`, `DealService`, `PipelineService`, `ActivityService`

```typescript
// Contact service — full lifecycle management
export class ContactService {
  async create(input: CreateContactInput): Promise<Contact> {
    const validated = createContactSchema.parse(input);

    // Duplicate detection
    const duplicates = await this.findDuplicates(validated);
    if (duplicates.length > 0) {
      return { contact: null, duplicates, requiresMerge: true };
    }

    const contact = await this.db.insert(contacts).values({
      ventureId: validated.ventureId,
      type: validated.type,
      firstName: validated.firstName,
      lastName: validated.lastName,
      email: validated.email,
      phone: validated.phone,
      company: validated.company,
      jobTitle: validated.jobTitle,
      lifecycleStage: 'lead',
      customFields: validated.customFields ?? {},
    }).returning();

    // Record activity
    await this.activityService.record({
      contactId: contact[0].id,
      type: 'contact_created',
      ventureId: validated.ventureId,
    });

    // Emit event for cross-domain consumption
    await this.eventBus.emit('nexus.contact.created', {
      contactId: contact[0].id,
      ventureId: validated.ventureId,
      email: validated.email,
    });

    return contact[0];
  }

  async findDuplicates(input: Partial<CreateContactInput>): Promise<Contact[]> {
    const conditions = [];
    if (input.email) {
      conditions.push(eq(contacts.email, input.email));
    }
    if (input.phone) {
      conditions.push(eq(contacts.phone, input.phone));
    }
    if (conditions.length === 0) return [];

    return this.db.select()
      .from(contacts)
      .where(and(
        eq(contacts.ventureId, input.ventureId!),
        or(...conditions),
      ));
  }

  async merge(primaryId: string, duplicateIds: string[]): Promise<Contact> {
    return this.db.transaction(async (tx) => {
      const primary = await this.getById(primaryId);

      for (const dupId of duplicateIds) {
        // Reassign all relationships to primary
        await tx.update(deals).set({ contactId: primaryId }).where(eq(deals.contactId, dupId));
        await tx.update(conversations).set({ contactId: primaryId }).where(eq(conversations.contactId, dupId));
        await tx.update(tickets).set({ contactId: primaryId }).where(eq(tickets.contactId, dupId));

        // Merge custom fields (primary wins on conflicts)
        const dup = await this.getById(dupId);
        const mergedFields = { ...dup.customFields, ...primary.customFields };
        await tx.update(contacts).set({ customFields: mergedFields }).where(eq(contacts.id, primaryId));

        // Soft-delete duplicate
        await tx.update(contacts).set({ mergedIntoId: primaryId, deletedAt: new Date() }).where(eq(contacts.id, dupId));
      }

      return this.getById(primaryId);
    });
  }

  async updateLifecycleStage(contactId: string, stage: LifecycleStage): Promise<Contact> {
    // Validate transition: lead → mql → sql → opportunity → customer → evangelist
    const contact = await this.getById(contactId);
    const validTransitions = LIFECYCLE_TRANSITIONS[contact.lifecycleStage];

    if (!validTransitions.includes(stage)) {
      throw new ValidationError(
        `Cannot transition from ${contact.lifecycleStage} to ${stage}`
      );
    }

    return this.db.update(contacts)
      .set({ lifecycleStage: stage, updatedAt: new Date() })
      .where(eq(contacts.id, contactId))
      .returning();
  }
}
```

**Tasks:**
- [ ] Implement `ContactService` with CRUD, duplicate detection, merge, lifecycle management
- [ ] Implement `OrganizationService` with parent/child hierarchy and health scoring
- [ ] Implement `DealService` with pipeline stage management and probability tracking
- [ ] Implement `PipelineService` with stage definitions, templates, and default pipeline
- [ ] Implement `ActivityService` with unified timeline (calls, emails, notes, meetings, tasks)
- [ ] Build `ContactCard` component with 360° view
- [ ] Build `PipelineKanban` component with drag-and-drop deal management
- [ ] Build `DealBoard` component with deal details panel
- [ ] Build `ActivityTimeline` component showing all interactions
- [ ] Implement lead scoring with behavioural + demographic factors
- [ ] Add full-text search for contacts via `@mcv/search`
- [ ] Implement custom field definitions per venture

### 1.3 — Conversations (conversations)

**Duration:** Weeks 2–3
**Services:** `ConversationService`

```typescript
// Conversation service — multi-channel threading
export class ConversationService {
  async create(input: CreateConversationInput): Promise<Conversation> {
    const validated = createConversationSchema.parse(input);

    const conversation = await this.db.insert(conversations).values({
      ventureId: validated.ventureId,
      contactId: validated.contactId,
      channel: validated.channel, // 'email' | 'sms' | 'whatsapp' | 'live_chat' | 'social'
      subject: validated.subject,
      status: 'open',
      assigneeId: validated.assigneeId,
    }).returning();

    // Add participants
    await this.addParticipant(conversation[0].id, validated.contactId, 'customer');
    if (validated.assigneeId) {
      await this.addParticipant(conversation[0].id, validated.assigneeId, 'agent');
    }

    return conversation[0];
  }

  async sendMessage(input: SendMessageInput): Promise<Message> {
    const validated = sendMessageSchema.parse(input);
    const conversation = await this.getConversation(validated.conversationId);

    const message = await this.db.insert(messages).values({
      conversationId: validated.conversationId,
      senderId: validated.senderId,
      senderType: validated.senderType, // 'agent' | 'customer' | 'system'
      body: validated.body,
      bodyHtml: validated.bodyHtml,
      channel: conversation.channel,
      attachments: validated.attachments ?? [],
    }).returning();

    // Send via appropriate channel
    switch (conversation.channel) {
      case 'email':
        await this.commsService.sendEmail({
          to: conversation.contactEmail,
          subject: `Re: ${conversation.subject}`,
          html: validated.bodyHtml ?? validated.body,
          inReplyTo: conversation.lastMessageId,
        });
        break;
      case 'sms':
        await this.commsService.sendSMS({
          to: conversation.contactPhone,
          body: validated.body,
        });
        break;
      case 'live_chat':
        await this.realtimeService.broadcast(
          `conversation:${validated.conversationId}`,
          { type: 'new_message', message: message[0] },
        );
        break;
    }

    // Update conversation metadata
    await this.db.update(conversations)
      .set({
        lastMessageAt: new Date(),
        lastMessagePreview: validated.body.substring(0, 200),
        messageCount: sql`message_count + 1`,
      })
      .where(eq(conversations.id, validated.conversationId));

    return message[0];
  }

  async markRead(conversationId: string, userId: string): Promise<void> {
    await this.db.update(conversationParticipants)
      .set({ lastReadAt: new Date() })
      .where(and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId),
      ));

    // Broadcast read receipt
    await this.realtimeService.broadcast(
      `conversation:${conversationId}`,
      { type: 'read_receipt', userId, timestamp: new Date() },
    );
  }
}
```

**Tasks:**
- [ ] Implement `ConversationService` with multi-channel threading
- [ ] Build message sending with channel-specific delivery (email, SMS, chat, WhatsApp)
- [ ] Implement real-time message delivery via `@mcv/realtime` WebSockets
- [ ] Build read receipt tracking and typing indicators
- [ ] Implement conversation assignment and transfer
- [ ] Build `ChatWindow` component with real-time messaging
- [ ] Implement file attachment handling via `@mcv/storage`
- [ ] Add message search with full-text indexing
- [ ] Build conversation snooze/archive functionality
- [ ] Implement inbound email parsing (incoming email → conversation thread)

### 1.4 — Basic Ticket Management (support)

**Duration:** Weeks 3–4
**Services:** `TicketService`, `KnowledgeService`

```typescript
// Ticket service — support ticket lifecycle
export class TicketService {
  async create(input: CreateTicketInput): Promise<Ticket> {
    const validated = createTicketSchema.parse(input);

    // Auto-assign based on category and available agents
    const assigneeId = validated.assigneeId ??
      await this.routingService.findBestAgent(validated.ventureId, validated.category);

    const ticket = await this.db.insert(tickets).values({
      ventureId: validated.ventureId,
      contactId: validated.contactId,
      subject: validated.subject,
      description: validated.description,
      category: validated.category,
      priority: validated.priority ?? 'medium',
      status: 'open',
      assigneeId,
      groupId: validated.groupId,
      source: validated.source ?? 'web', // web | email | api | chat
    }).returning();

    // Apply SLA policy
    const slaPolicy = await this.slaService.getApplicablePolicy(
      validated.ventureId,
      validated.priority,
      validated.category,
    );
    if (slaPolicy) {
      await this.slaService.applyToTicket(ticket[0].id, slaPolicy);
    }

    // Create linked conversation
    if (validated.createConversation !== false) {
      await this.conversationService.create({
        ventureId: validated.ventureId,
        contactId: validated.contactId,
        channel: validated.source === 'email' ? 'email' : 'live_chat',
        subject: validated.subject,
        linkedTicketId: ticket[0].id,
      });
    }

    await this.eventBus.emit('nexus.ticket.created', {
      ticketId: ticket[0].id,
      ventureId: validated.ventureId,
      priority: validated.priority,
    });

    return ticket[0];
  }

  async updateStatus(ticketId: string, status: TicketStatus, comment?: string): Promise<Ticket> {
    const ticket = await this.getById(ticketId);
    const validTransitions = TICKET_STATUS_TRANSITIONS[ticket.status];

    if (!validTransitions.includes(status)) {
      throw new ValidationError(`Cannot transition from ${ticket.status} to ${status}`);
    }

    const updated = await this.db.update(tickets)
      .set({
        status,
        resolvedAt: status === 'resolved' ? new Date() : undefined,
        closedAt: status === 'closed' ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticketId))
      .returning();

    if (comment) {
      await this.addComment(ticketId, { body: comment, isInternal: false });
    }

    // Check SLA compliance on resolution
    if (status === 'resolved') {
      await this.slaService.checkResolutionCompliance(ticketId);
    }

    return updated[0];
  }
}
```

**Tasks:**
- [ ] Implement `TicketService` with full lifecycle (create, assign, escalate, resolve, close)
- [ ] Build SLA policy engine with first-response and resolution time tracking
- [ ] Implement ticket comment system with internal/public distinction
- [ ] Build basic agent routing (round-robin within group)
- [ ] Implement `KnowledgeService` for knowledge base article management
- [ ] Build `TicketView` component with conversation thread and activity sidebar
- [ ] Build `KnowledgePortal` component with search and categories
- [ ] Implement ticket-conversation linking (ticket actions reflect in conversation)
- [ ] Add ticket priority escalation via BullMQ scheduled jobs
- [ ] Implement ticket category management with routing rules
- [ ] Build CSAT survey trigger on ticket resolution

### 1.5 — Document Management (documents)

**Duration:** Weeks 3–4
**Services:** `DocumentService`, `FolderService`

```typescript
// Document service — editor, versioning, sharing
export class DocumentService {
  async create(input: CreateDocumentInput): Promise<Document> {
    const validated = createDocumentSchema.parse(input);

    const document = await this.db.insert(documents).values({
      ventureId: validated.ventureId,
      folderId: validated.folderId,
      title: validated.title,
      content: validated.content ?? '',
      contentType: validated.contentType ?? 'rich_text', // rich_text | markdown | pdf
      createdBy: validated.createdBy,
      status: 'draft',
      version: 1,
    }).returning();

    // Create initial version snapshot
    await this.createVersion(document[0].id, {
      content: validated.content ?? '',
      version: 1,
      createdBy: validated.createdBy,
      changeNotes: 'Initial creation',
    });

    // Upload to storage
    if (validated.file) {
      const storagePath = await this.storageService.upload(validated.file, {
        bucket: 'documents',
        path: `${validated.ventureId}/${document[0].id}`,
      });
      await this.db.update(documents)
        .set({ storagePath, mimeType: validated.file.type, fileSize: validated.file.size })
        .where(eq(documents.id, document[0].id));
    }

    return document[0];
  }

  async share(input: ShareDocumentInput): Promise<DocumentShare> {
    const validated = shareDocumentSchema.parse(input);

    // Generate share link with permissions
    const share = await this.db.insert(documentShares).values({
      documentId: validated.documentId,
      sharedWith: validated.userId ?? validated.email,
      shareType: validated.shareType, // 'view' | 'comment' | 'edit'
      expiresAt: validated.expiresAt,
      password: validated.password ? await hash(validated.password) : null,
    }).returning();

    // Send notification
    if (validated.email) {
      await this.commsService.sendEmail({
        to: validated.email,
        template: 'document-shared',
        variables: { documentTitle: (await this.getById(validated.documentId)).title },
      });
    }

    return share[0];
  }

  async getVersionHistory(documentId: string): Promise<DocumentVersion[]> {
    return this.db.select()
      .from(documentVersions)
      .where(eq(documentVersions.documentId, documentId))
      .orderBy(desc(documentVersions.version));
  }
}
```

**Tasks:**
- [ ] Implement `DocumentService` with CRUD, versioning, and rich text content
- [ ] Implement `FolderService` with nested folder hierarchy and permissions
- [ ] Build document versioning with diff tracking
- [ ] Implement document sharing with view/comment/edit permissions
- [ ] Build file upload integration via `@mcv/storage`
- [ ] Build `DocumentExplorer` component with folder tree and file grid
- [ ] Implement document templates for common document types
- [ ] Add collaborative editing support (operational transforms or CRDT)
- [ ] Implement document comments with @mention notifications
- [ ] Add document search via `@mcv/search`

### Phase 1 Deliverables

| Deliverable | Status |
|------------|--------|
| Database schema for 4 submodules (crm, conversations, support, documents) | ⬜ |
| CRM with contacts, organizations, deals, pipelines, and activity timeline | ⬜ |
| Multi-channel conversation system with real-time messaging | ⬜ |
| Ticket management with SLA policies and basic routing | ⬜ |
| Document management with versioning and sharing | ⬜ |
| Knowledge base for self-service support | ⬜ |
| RLS policies and multi-tenant isolation | ⬜ |
| React components: ContactCard, PipelineKanban, ChatWindow, TicketView, DocumentExplorer | ⬜ |
| Unit tests with ≥80% coverage on core services | ⬜ |

---

## Phase 2 — Core (Weeks 5–8)

### Objective

Build the calendar and booking system, form builder, e-signature workflows, VoIP calling, and the full contact center with intelligent routing.

### 2.1 — Calendar & Booking (calendar)

**Duration:** Weeks 5–6
**Services:** `CalendarService`, `BookingService`

```typescript
// Calendar service — events, booking pages, availability
export class CalendarService {
  async createEvent(input: CreateEventInput): Promise<CalendarEvent> {
    const validated = createEventSchema.parse(input);

    const event = await this.db.insert(calendarEvents).values({
      ventureId: validated.ventureId,
      calendarId: validated.calendarId,
      title: validated.title,
      description: validated.description,
      startTime: validated.startTime,
      endTime: validated.endTime,
      timezone: validated.timezone,
      location: validated.location,
      meetingUrl: validated.meetingUrl,
      attendees: validated.attendees,
      recurrence: validated.recurrence,
      reminders: validated.reminders ?? [{ minutes: 15, type: 'notification' }],
    }).returning();

    // Sync to external calendar (Google/Outlook)
    if (validated.syncToExternal) {
      await this.syncQueue.add('calendar-sync', {
        eventId: event[0].id,
        action: 'create',
      });
    }

    // Schedule reminders
    for (const reminder of event[0].reminders) {
      const reminderTime = new Date(event[0].startTime.getTime() - reminder.minutes * 60000);
      await this.reminderQueue.add('event-reminder', {
        eventId: event[0].id,
        type: reminder.type,
      }, { delay: reminderTime.getTime() - Date.now() });
    }

    return event[0];
  }
}

// Booking service — public booking pages
export class BookingService {
  async createBookingPage(input: CreateBookingPageInput): Promise<BookingPage> {
    const validated = bookingPageSchema.parse(input);

    return this.db.insert(bookingPages).values({
      ventureId: validated.ventureId,
      name: validated.name,
      slug: validated.slug,
      duration: validated.duration, // minutes
      bufferBefore: validated.bufferBefore ?? 0,
      bufferAfter: validated.bufferAfter ?? 0,
      availability: validated.availability, // weekly recurring slots
      teamMembers: validated.teamMembers,
      roundRobin: validated.roundRobin ?? false,
      confirmationEmail: validated.confirmationEmail ?? true,
      questions: validated.questions ?? [],
    }).returning();
  }

  async getAvailableSlots(
    bookingPageId: string,
    date: Date,
    timezone: string,
  ): Promise<TimeSlot[]> {
    const page = await this.getBookingPage(bookingPageId);
    const teamCalendars = await this.getTeamCalendars(page.teamMembers);

    // Get existing events for the day
    const dayStart = startOfDay(date, timezone);
    const dayEnd = endOfDay(date, timezone);
    const existingEvents = await this.calendarService.getEvents({
      calendarIds: teamCalendars.map(c => c.id),
      start: dayStart,
      end: dayEnd,
    });

    // Generate slots based on availability rules
    const availableSlots = this.generateSlots(page.availability, date, timezone);

    // Filter out conflicting slots
    return availableSlots.filter(slot =>
      !this.hasConflict(slot, existingEvents, page.bufferBefore, page.bufferAfter)
    );
  }

  async bookAppointment(input: BookAppointmentInput): Promise<Appointment> {
    const validated = bookAppointmentSchema.parse(input);
    const page = await this.getBookingPage(validated.bookingPageId);

    // Verify slot is still available (optimistic locking)
    const available = await this.isSlotAvailable(validated.bookingPageId, validated.startTime);
    if (!available) throw new ConflictError('Slot is no longer available');

    // Assign team member (round-robin if configured)
    const assigneeId = page.roundRobin
      ? await this.getNextRoundRobinMember(page.teamMembers)
      : page.teamMembers[0];

    const appointment = await this.db.insert(appointments).values({
      ventureId: page.ventureId,
      bookingPageId: validated.bookingPageId,
      contactId: validated.contactId,
      assigneeId,
      startTime: validated.startTime,
      endTime: new Date(validated.startTime.getTime() + page.duration * 60000),
      status: 'confirmed',
      answers: validated.answers,
    }).returning();

    // Create calendar event
    await this.calendarService.createEvent({
      ventureId: page.ventureId,
      title: `Meeting with ${validated.contactName}`,
      startTime: validated.startTime,
      endTime: appointment[0].endTime,
      attendees: [assigneeId, validated.contactId],
    });

    // Send confirmation email
    await this.commsService.sendEmail({
      to: validated.contactEmail,
      template: 'booking-confirmation',
      variables: {
        date: format(validated.startTime, 'PPP'),
        time: format(validated.startTime, 'p'),
        duration: `${page.duration} minutes`,
      },
    });

    return appointment[0];
  }
}
```

**Tasks:**
- [ ] Implement `CalendarService` with event CRUD, recurrence, and reminders
- [ ] Implement `BookingService` with public booking pages and slot management
- [ ] Build Google Calendar sync (OAuth, two-way event sync)
- [ ] Build Microsoft Outlook sync (Graph API)
- [ ] Implement round-robin team member assignment
- [ ] Implement availability rules (working hours, date overrides, holidays)
- [ ] Build `CalendarWidget` component with month/week/day views
- [ ] Build `BookingPageEmbed` component for public booking
- [ ] Implement appointment reminders via BullMQ scheduled jobs
- [ ] Add conflict detection for overlapping events
- [ ] Build reschedule/cancel flows with email notifications

### 2.2 — Form Builder (forms)

**Duration:** Weeks 5–6
**Services:** `FormService`, `SubmissionService`

```typescript
// Form service — builder, fields, conditional logic
export class FormService {
  async create(input: CreateFormInput): Promise<Form> {
    const validated = createFormSchema.parse(input);

    return this.db.insert(forms).values({
      ventureId: validated.ventureId,
      name: validated.name,
      slug: validated.slug,
      fields: validated.fields, // FormField[]
      settings: {
        submitButtonText: validated.submitButtonText ?? 'Submit',
        successMessage: validated.successMessage ?? 'Thank you!',
        redirectUrl: validated.redirectUrl,
        notifyEmails: validated.notifyEmails ?? [],
        limitResponses: validated.limitResponses,
        closeDate: validated.closeDate,
      },
      conditionalLogic: validated.conditionalLogic ?? [],
      status: 'draft',
    }).returning();
  }

  async submit(formId: string, input: SubmitFormInput): Promise<FormSubmission> {
    const form = await this.getForm(formId);
    if (form.status !== 'published') throw new ValidationError('Form is not published');

    // Validate submission against field definitions
    const validated = this.validateSubmission(form.fields, input.data);

    // Check response limits
    if (form.settings.limitResponses) {
      const count = await this.getSubmissionCount(formId);
      if (count >= form.settings.limitResponses) {
        throw new ValidationError('Form has reached its response limit');
      }
    }

    const submission = await this.db.insert(formSubmissions).values({
      formId,
      ventureId: form.ventureId,
      data: validated,
      metadata: {
        ip: input.ip,
        userAgent: input.userAgent,
        referrer: input.referrer,
        submittedAt: new Date(),
      },
    }).returning();

    // Trigger webhooks
    await this.triggerWebhooks(formId, submission[0]);

    // Create contact if email field present
    if (validated.email) {
      await this.contactService.createOrUpdate({
        ventureId: form.ventureId,
        email: validated.email,
        firstName: validated.firstName,
        lastName: validated.lastName,
        source: 'form',
        sourceFormId: formId,
      });
    }

    // Notify admins
    if (form.settings.notifyEmails.length > 0) {
      await this.commsService.sendEmail({
        to: form.settings.notifyEmails,
        template: 'form-submission-notification',
        variables: { formName: form.name, data: validated },
      });
    }

    return submission[0];
  }
}
```

**Tasks:**
- [ ] Implement `FormService` with field types (text, email, phone, dropdown, checkbox, file upload, rating, date)
- [ ] Implement `SubmissionService` with validation engine based on field definitions
- [ ] Build conditional logic engine (show/hide fields based on answers)
- [ ] Implement form versioning (edit published forms without breaking existing links)
- [ ] Build webhook integration for form submissions
- [ ] Build `FormBuilderCanvas` component with drag-and-drop field editor
- [ ] Build `FormRenderer` component for public form display
- [ ] Implement form analytics (views, starts, completions, drop-offs)
- [ ] Add spam protection (honeypot, rate limiting, reCAPTCHA)
- [ ] Integrate with CRM (auto-create contacts from submissions)
- [ ] Build quiz mode with scoring and correct answers

### 2.3 — E-Signatures (sign)

**Duration:** Weeks 6–7
**Services:** `SignatureService`

```typescript
// Signature service — e-signature workflows
export class SignatureService {
  async createRequest(input: CreateSignatureRequestInput): Promise<SignatureRequest> {
    const validated = signatureRequestSchema.parse(input);

    const request = await this.db.insert(signatureRequests).values({
      ventureId: validated.ventureId,
      documentId: validated.documentId,
      title: validated.title,
      message: validated.message,
      signers: validated.signers.map((s, i) => ({
        ...s,
        order: i + 1,
        status: 'pending',
      })),
      status: 'sent',
      expiresAt: validated.expiresAt,
    }).returning();

    // Send signing invitation to first signer (or all if parallel)
    const firstSigners = validated.sequential
      ? [validated.signers[0]]
      : validated.signers;

    for (const signer of firstSigners) {
      await this.commsService.sendEmail({
        to: signer.email,
        template: 'signature-request',
        variables: {
          title: validated.title,
          message: validated.message,
          signUrl: `${this.baseUrl}/sign/${request[0].id}?signer=${signer.email}`,
        },
      });
    }

    // Record audit entry
    await this.recordAudit(request[0].id, 'request_created', {
      signerCount: validated.signers.length,
      sequential: validated.sequential,
    });

    return request[0];
  }

  async sign(requestId: string, signerEmail: string, signatureData: SignatureData): Promise<void> {
    const request = await this.getRequest(requestId);
    const signerIndex = request.signers.findIndex(s => s.email === signerEmail);

    if (signerIndex === -1) throw new NotFoundError('Signer not found');
    if (request.signers[signerIndex].status !== 'pending') {
      throw new ValidationError('Already signed');
    }

    // Update signer status
    const updatedSigners = [...request.signers];
    updatedSigners[signerIndex] = {
      ...updatedSigners[signerIndex],
      status: 'signed',
      signedAt: new Date(),
      signatureImage: signatureData.image,
      ipAddress: signatureData.ip,
    };

    await this.db.update(signatureRequests)
      .set({ signers: updatedSigners })
      .where(eq(signatureRequests.id, requestId));

    // Record audit
    await this.recordAudit(requestId, 'signer_signed', {
      email: signerEmail,
      ip: signatureData.ip,
      userAgent: signatureData.userAgent,
    });

    // Check if all signers have signed
    const allSigned = updatedSigners.every(s => s.status === 'signed');
    if (allSigned) {
      await this.completeRequest(requestId);
    } else if (request.sequential) {
      // Send to next signer
      const nextSigner = updatedSigners.find(s => s.status === 'pending');
      if (nextSigner) {
        await this.sendSigningInvitation(requestId, nextSigner);
      }
    }
  }

  private async completeRequest(requestId: string): Promise<void> {
    // Generate signed PDF with all signatures embedded
    const signedPdf = await this.generateSignedDocument(requestId);

    await this.db.update(signatureRequests)
      .set({ status: 'completed', completedAt: new Date(), signedDocumentUrl: signedPdf.url })
      .where(eq(signatureRequests.id, requestId));

    // Notify all parties
    const request = await this.getRequest(requestId);
    for (const signer of request.signers) {
      await this.commsService.sendEmail({
        to: signer.email,
        template: 'signature-completed',
        variables: { title: request.title, downloadUrl: signedPdf.url },
      });
    }

    await this.recordAudit(requestId, 'request_completed', {});
  }
}
```

**Tasks:**
- [ ] Implement `SignatureService` with request creation and signing workflow
- [ ] Build signature capture (typed, drawn, uploaded image)
- [ ] Implement sequential and parallel signing flows
- [ ] Build signed PDF generation with embedded signatures
- [ ] Implement comprehensive audit trail (every action logged with IP, timestamp, user agent)
- [ ] Build `SignatureCanvas` component for signature input
- [ ] Implement signature template system (reusable field placements)
- [ ] Add expiration and reminder scheduling for pending signatures
- [ ] Build signer authentication (email verification, optional SMS OTP)
- [ ] Implement legally compliant e-signature format (UETA/ESIGN Act)

### 2.4 — VoIP Calling (calls)

**Duration:** Weeks 7–8
**Services:** `CallService`, `IvrService`

```typescript
// Call service — VoIP, recording, transcription
export class CallService {
  async initiateCall(input: CreateCallInput): Promise<Call> {
    const validated = callSchema.parse(input);

    // Create Twilio call via @mcv/comms
    const twilioCall = await this.commsService.createCall({
      from: validated.fromNumber,
      to: validated.toNumber,
      recordingEnabled: validated.record ?? true,
      statusCallbackUrl: `${this.webhookUrl}/calls/status`,
    });

    const call = await this.db.insert(calls).values({
      ventureId: validated.ventureId,
      contactId: validated.contactId,
      agentId: validated.agentId,
      direction: 'outbound',
      fromNumber: validated.fromNumber,
      toNumber: validated.toNumber,
      externalCallId: twilioCall.sid,
      status: 'ringing',
      recordingEnabled: validated.record ?? true,
    }).returning();

    // Record activity on contact
    await this.activityService.record({
      contactId: validated.contactId,
      type: 'call_initiated',
      ventureId: validated.ventureId,
      metadata: { callId: call[0].id, direction: 'outbound' },
    });

    return call[0];
  }

  async handleInboundCall(twilioPayload: TwilioInboundPayload): Promise<TwiMLResponse> {
    const call = await this.db.insert(calls).values({
      ventureId: await this.resolveVenture(twilioPayload.To),
      direction: 'inbound',
      fromNumber: twilioPayload.From,
      toNumber: twilioPayload.To,
      externalCallId: twilioPayload.CallSid,
      status: 'ringing',
    }).returning();

    // Check IVR menu for this number
    const ivrMenu = await this.ivrService.getMenuForNumber(twilioPayload.To);
    if (ivrMenu) {
      return this.ivrService.generateTwiML(ivrMenu);
    }

    // Default: route to available agent
    const agent = await this.routingService.findAvailableAgent(call[0].ventureId);
    if (agent) {
      return this.generateConnectTwiML(agent.phoneNumber);
    }

    return this.generateVoicemailTwiML();
  }

  async processRecording(callId: string, recordingUrl: string): Promise<CallRecording> {
    const recording = await this.db.insert(callRecordings).values({
      callId,
      url: recordingUrl,
      status: 'processing',
    }).returning();

    // Queue transcription job
    await this.transcriptionQueue.add('transcribe', {
      recordingId: recording[0].id,
      url: recordingUrl,
    });

    return recording[0];
  }
}
```

**Tasks:**
- [ ] Implement `CallService` with outbound/inbound call management via Twilio
- [ ] Implement `IvrService` with IVR menu builder and TwiML generation
- [ ] Build WebRTC-based browser calling (agent makes calls from browser)
- [ ] Implement call recording with storage in `@mcv/storage`
- [ ] Build call transcription integration (Deepgram)
- [ ] Build `CallDialer` component with keypad, contact lookup, and call controls
- [ ] Implement call transfer (warm and cold transfer)
- [ ] Build call analytics (duration, wait time, outcomes, agent performance)
- [ ] Implement call disposition codes (agent logs call outcome)
- [ ] Add call scripts (guided talking points displayed during call)
- [ ] Build click-to-call from contact cards

### 2.5 — Contact Center Routing (contact-center)

**Duration:** Weeks 7–8
**Services:** `RoutingService`, `SlaService`, `AgentService`

```typescript
// Routing service — intelligent ticket/call/chat routing
export class RoutingService {
  async route(input: RouteInput): Promise<RoutingResult> {
    const validated = routeInputSchema.parse(input);

    // Load routing rules for this venture
    const rules = await this.getRules(validated.ventureId);

    // Evaluate rules in priority order
    for (const rule of rules.sort((a, b) => a.priority - b.priority)) {
      if (this.evaluateConditions(rule.conditions, validated)) {
        const agent = await this.findAgent(rule.routingStrategy, rule.targetGroup, validated);
        if (agent) {
          return {
            agentId: agent.id,
            groupId: rule.targetGroup,
            matchedRule: rule.id,
            strategy: rule.routingStrategy,
          };
        }
      }
    }

    // Fallback: round-robin across all available agents
    return this.fallbackRoute(validated.ventureId);
  }

  private async findAgent(
    strategy: RoutingStrategy,
    groupId: string,
    input: RouteInput,
  ): Promise<AgentSession | null> {
    const availableAgents = await this.agentService.getAvailable(groupId);

    switch (strategy) {
      case 'round_robin':
        return this.roundRobin(availableAgents, groupId);
      case 'least_busy':
        return this.leastBusy(availableAgents);
      case 'skill_based':
        return this.skillBased(availableAgents, input.skills);
      case 'priority_weighted':
        return this.priorityWeighted(availableAgents, input.priority);
      default:
        return availableAgents[0] ?? null;
    }
  }

  private async leastBusy(agents: AgentSession[]): Promise<AgentSession | null> {
    const loads = await Promise.all(
      agents.map(async (agent) => ({
        agent,
        activeCount: await this.getActiveConversationCount(agent.id),
      }))
    );
    loads.sort((a, b) => a.activeCount - b.activeCount);
    return loads[0]?.agent ?? null;
  }
}
```

**Tasks:**
- [ ] Implement `RoutingService` with 4 routing strategies (round-robin, least-busy, skill-based, priority-weighted)
- [ ] Implement `AgentService` with agent status management (online, busy, away, offline)
- [ ] Build routing rule configuration (conditions + strategy + target group)
- [ ] Implement agent capacity limits (max concurrent conversations)
- [ ] Build `InboxPanel` component with unified omnichannel inbox
- [ ] Implement agent session tracking with presence via Redis
- [ ] Build SLA escalation pipeline (automatic escalation on breach)
- [ ] Add working hours configuration per agent/group
- [ ] Implement overflow routing (if primary group busy, route to backup)
- [ ] Build agent performance dashboard (response time, resolution time, CSAT)

### Phase 2 Deliverables

| Deliverable | Status |
|------------|--------|
| Calendar with Google/Outlook sync and booking pages | ⬜ |
| Form builder with conditional logic and submission webhooks | ⬜ |
| E-signature system with audit trails and PDF generation | ⬜ |
| VoIP calling with recording, IVR, and transcription | ⬜ |
| Contact center with intelligent routing and agent management | ⬜ |
| React components: CalendarWidget, BookingPageEmbed, FormBuilderCanvas, SignatureCanvas, CallDialer, InboxPanel | ⬜ |

---

## Phase 3 — Advanced (Weeks 9–12)

### Objective

Implement AI-powered features: intelligent routing, chatbots, sentiment analysis, advanced CRM features (AI deal scoring, forecasting), and cross-venture communication capabilities.

### 3.1 — AI-Powered Routing & Chatbots

**Duration:** Weeks 9–10

```typescript
// AI routing service — intent classification and smart routing
export class AIRoutingService {
  async classifyAndRoute(message: string, context: RoutingContext): Promise<AIRoutingResult> {
    // Classify intent using OpenAI
    const classification = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{
        role: 'system',
        content: `Classify the following customer message into one of these intents:
          billing, technical_support, sales, general_inquiry, complaint, cancellation.
          Also rate urgency 1-5 and detect language.
          Respond in JSON: { intent, urgency, language, confidence }`,
      }, {
        role: 'user',
        content: message,
      }],
      response_format: { type: 'json_object' },
    });

    const { intent, urgency, language, confidence } = JSON.parse(
      classification.choices[0].message.content!
    );

    // Route based on classification
    const routingResult = await this.routingService.route({
      ventureId: context.ventureId,
      intent,
      priority: this.urgencyToPriority(urgency),
      language,
      skills: [intent, language],
    });

    return { ...routingResult, intent, urgency, language, confidence };
  }

  async handleChatbotMessage(
    conversationId: string,
    message: string,
  ): Promise<ChatbotResponse> {
    const conversation = await this.conversationService.getConversation(conversationId);
    const history = await this.conversationService.getMessages(conversationId, { limit: 20 });

    // Check knowledge base for answers
    const kbResults = await this.knowledgeService.semanticSearch(
      message,
      conversation.ventureId,
      { limit: 3 },
    );

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a helpful customer support chatbot. Use the following knowledge base articles to answer:
            ${kbResults.map(r => r.content).join('\n---\n')}
            If you cannot answer confidently, say "Let me connect you with an agent."`,
        },
        ...history.map(m => ({
          role: m.senderType === 'customer' ? 'user' as const : 'assistant' as const,
          content: m.body,
        })),
        { role: 'user', content: message },
      ],
    });

    const botMessage = response.choices[0].message.content!;
    const needsEscalation = botMessage.includes('connect you with an agent');

    // Save bot response as message
    await this.conversationService.sendMessage({
      conversationId,
      senderId: 'chatbot',
      senderType: 'system',
      body: botMessage,
    });

    if (needsEscalation) {
      const routingResult = await this.classifyAndRoute(message, {
        ventureId: conversation.ventureId,
      });
      await this.conversationService.assign(conversationId, routingResult.agentId);
    }

    return { message: botMessage, escalated: needsEscalation };
  }
}
```

**Tasks:**
- [ ] Implement AI intent classification for incoming messages
- [ ] Build knowledge-base-powered chatbot with OpenAI
- [ ] Implement chatbot escalation to human agent with full context transfer
- [ ] Build chatbot conversation flow builder (decision trees + AI hybrid)
- [ ] Implement language detection and auto-routing to language-skilled agents
- [ ] Add chatbot analytics (resolution rate, escalation rate, satisfaction)
- [ ] Build chatbot training interface (fine-tune on venture-specific data)
- [ ] Implement smart reply suggestions for agents (AI-suggested responses)

### 3.2 — Sentiment Analysis

**Duration:** Weeks 10–11

**Tasks:**
- [ ] Implement real-time sentiment analysis on incoming messages
- [ ] Build sentiment tracking over conversation lifecycle (improving/declining)
- [ ] Implement automatic escalation on negative sentiment detection
- [ ] Add sentiment-based SLA priority adjustment
- [ ] Build sentiment dashboard with trends and agent correlation
- [ ] Implement post-resolution sentiment prediction (will this customer churn?)
- [ ] Add sentiment analysis for call transcriptions
- [ ] Build alert system for severely negative interactions

### 3.3 — Advanced CRM Features

**Duration:** Weeks 10–11

```typescript
// AI deal scoring service
export class DealScoringService {
  async scoreDeals(ventureId: string): Promise<ScoredDeal[]> {
    const openDeals = await this.dealService.getOpen(ventureId);
    const scoredDeals: ScoredDeal[] = [];

    for (const deal of openDeals) {
      const factors = await this.computeFactors(deal);
      const score = this.calculateScore(factors);

      scoredDeals.push({
        dealId: deal.id,
        score, // 0-100
        factors,
        recommendation: this.generateRecommendation(factors),
        riskLevel: score < 30 ? 'high' : score < 60 ? 'medium' : 'low',
      });
    }

    return scoredDeals;
  }

  private async computeFactors(deal: Deal): Promise<DealScoreFactors> {
    const activities = await this.activityService.getByDeal(deal.id);
    const contact = deal.contactId ? await this.contactService.getById(deal.contactId) : null;

    return {
      engagementScore: this.computeEngagement(activities), // email opens, meetings, calls
      velocityScore: this.computeVelocity(deal), // time in current stage vs average
      stageProgressionScore: this.computeStageProgression(deal), // linear progression vs back-and-forth
      contactScore: contact ? contact.leadScore : 0,
      dealSizeScore: this.normalizeDealSize(deal.value), // relative to pipeline average
      activityRecencyScore: this.computeRecency(activities), // days since last activity
      competitorPresenceScore: await this.checkCompetitorSignals(deal),
    };
  }
}

// Revenue forecasting
export class ForecastService {
  async generateForecast(
    ventureId: string,
    period: 'monthly' | 'quarterly' | 'yearly',
  ): Promise<Forecast> {
    const deals = await this.dealService.getOpen(ventureId);
    const historicalWinRate = await this.getHistoricalWinRate(ventureId);

    const categories = {
      committed: deals.filter(d => d.probability >= 90),
      bestCase: deals.filter(d => d.probability >= 60 && d.probability < 90),
      pipeline: deals.filter(d => d.probability >= 20 && d.probability < 60),
      upside: deals.filter(d => d.probability < 20),
    };

    return {
      period,
      committed: this.sumValues(categories.committed),
      bestCase: this.sumValues(categories.bestCase) * 0.7 + this.sumValues(categories.committed),
      pipeline: this.sumValues(categories.pipeline) * historicalWinRate,
      total: this.computeWeightedForecast(deals),
      dealCount: deals.length,
      averageDealSize: this.sumValues(deals) / deals.length,
      averageSalesCycle: await this.getAverageSalesCycle(ventureId),
    };
  }
}
```

**Tasks:**
- [ ] Implement AI deal scoring with multi-factor analysis
- [ ] Build revenue forecasting (committed, best-case, pipeline categories)
- [ ] Implement deal velocity tracking (time in stage vs historical average)
- [ ] Build deal rotting detection and alerts
- [ ] Implement smart activity recommendations (suggest next best action)
- [ ] Build duplicate contact detection with ML-powered matching
- [ ] Add lead scoring with behavioural decay
- [ ] Implement custom object system (user-defined CRM entities)
- [ ] Build smart views with saved filters and sharing

### 3.4 — Cross-Venture Communications

**Duration:** Weeks 11–12

**Tasks:**
- [ ] Build unified contact record across ventures (same person, multiple venture relationships)
- [ ] Implement cross-venture activity timeline (see all interactions across ecosystem)
- [ ] Build cross-venture deal handoff (refer deals between ventures)
- [ ] Implement shared knowledge base articles across ventures
- [ ] Build cross-venture reporting (aggregate CRM metrics across all 9 ventures)
- [ ] Implement contact data sharing rules (what's visible cross-venture)
- [ ] Add venture-to-venture conversation forwarding
- [ ] Build unified customer health score across ventures

### 3.5 — Advanced Document Features

**Duration:** Weeks 11–12

**Tasks:**
- [ ] Build AI-powered document summarization
- [ ] Implement document template variables with auto-fill from CRM data
- [ ] Build document approval workflows (review → approve → publish)
- [ ] Implement document analytics (views, time spent, completion rate)
- [ ] Add PDF generation from rich text documents
- [ ] Build document comparison (side-by-side diff between versions)
- [ ] Implement document expiration and access revocation
- [ ] Add bulk document operations (move, share, archive)

### Phase 3 Deliverables

| Deliverable | Status |
|------------|--------|
| AI chatbot with knowledge base integration | ⬜ |
| Intelligent intent classification and routing | ⬜ |
| Real-time sentiment analysis with escalation triggers | ⬜ |
| AI deal scoring and revenue forecasting | ⬜ |
| Cross-venture unified contact records | ⬜ |
| Advanced document workflows and AI features | ⬜ |

---

## Phase 4 — Polish & Hardening (Weeks 13–14)

### Objective

Performance optimization, security hardening, GDPR compliance, documentation, and production readiness.

### 4.1 — Performance Optimization

**Tasks:**
- [ ] Optimize contact search queries (full-text index tuning, query plan analysis)
- [ ] Add Redis caching for CRM dashboard aggregations
- [ ] Implement conversation message pagination with cursor-based loading
- [ ] Optimize real-time message delivery (WebSocket connection pooling)
- [ ] Add database query optimization (EXPLAIN ANALYZE on slow queries)
- [ ] Implement deal pipeline aggregation materialized views
- [ ] Optimize calendar availability computation (pre-compute and cache)
- [ ] Add CDN caching for document and form assets
- [ ] Benchmark: contact search < 200ms, conversation load < 500ms, calendar slots < 300ms

### 4.2 — Security & Compliance

**Tasks:**
- [ ] Audit all RLS policies for proper tenant isolation
- [ ] Implement rate limiting on all public endpoints (form submissions, booking pages)
- [ ] Add GDPR compliance: data export, right to deletion, consent management
- [ ] Implement data retention policies (auto-archive old conversations/tickets)
- [ ] Add audit logging for all CRM data modifications
- [ ] Implement e-signature compliance validation (UETA/ESIGN Act)
- [ ] Add call recording consent management and compliance
- [ ] Implement document access control audit trail
- [ ] Security review of form submission handling (injection prevention)
- [ ] Encrypt sensitive contact data at rest (PII fields)

### 4.3 — Documentation & DevEx

**Tasks:**
- [ ] Write API documentation for all tRPC routes across 9 submodules
- [ ] Create integration guides (Twilio, Google Calendar, SendGrid)
- [ ] Document CRM data model and relationships
- [ ] Write knowledge base article authoring guide
- [ ] Create form builder user guide with best practices
- [ ] Document event types emitted to `@mcv/fabric`
- [ ] Add JSDoc comments for all public service methods
- [ ] Create developer onboarding guide with local setup

### 4.4 — Monitoring & Observability

**Tasks:**
- [ ] Add structured logging for all services
- [ ] Implement health check endpoints for all background workers
- [ ] Add Prometheus metrics (conversation response time, ticket resolution time, call duration)
- [ ] Configure alerts for SLA breaches, queue backlogs, call failures
- [ ] Implement real-time agent dashboard (conversations active, wait time, CSAT)
- [ ] Add provider status monitoring (Twilio, SendGrid health)
- [ ] Build operational dashboard with key Nexus metrics

---

## Testing Strategy

### Unit Tests

| Area | Target Coverage | Key Test Scenarios |
|------|---------------|--------------------|
| Contact lifecycle transitions | 95% | Valid/invalid transitions, merge logic, duplicate detection |
| Deal scoring algorithm | 95% | Factor computation, edge cases, scoring boundaries |
| Ticket SLA computation | 95% | Working hours, holidays, paused tickets, escalation timing |
| Routing strategy selection | 90% | Round-robin fairness, least-busy accuracy, skill matching |
| Form validation engine | 95% | All field types, conditional logic, required fields |
| E-signature workflow | 90% | Sequential/parallel signing, expiration, audit trail |
| Calendar availability | 90% | Timezone conversion, buffer handling, recurrence |

### Integration Tests

```typescript
// Example: Full ticket lifecycle integration test
describe('TicketService — full lifecycle', () => {
  it('should create, assign, escalate, resolve, and survey', async () => {
    // Create ticket
    const ticket = await ticketService.create({
      ventureId: TEST_VENTURE_ID,
      contactId: testContact.id,
      subject: 'Cannot access dashboard',
      category: 'technical_support',
      priority: 'high',
    });
    expect(ticket.status).toBe('open');
    expect(ticket.assigneeId).toBeTruthy(); // auto-assigned

    // SLA should be applied
    const sla = await slaService.getTicketSla(ticket.id);
    expect(sla.firstResponseDeadline).toBeTruthy();

    // Agent responds
    await ticketService.addComment(ticket.id, {
      body: 'Looking into this now.',
      isInternal: false,
      authorId: ticket.assigneeId,
    });

    // SLA first-response should be met
    const updatedSla = await slaService.getTicketSla(ticket.id);
    expect(updatedSla.firstResponseMet).toBe(true);

    // Resolve ticket
    await ticketService.updateStatus(ticket.id, 'resolved', 'Fixed the permissions issue.');

    // CSAT survey should be queued
    const surveyJobs = await csatQueue.getJobs(['waiting']);
    expect(surveyJobs.some(j => j.data.ticketId === ticket.id)).toBe(true);
  });
});
```

### End-to-End Tests

- [ ] Contact lifecycle: create → qualify → create deal → progress through pipeline → close won
- [ ] Conversation flow: customer sends email → auto-creates conversation → agent replies → customer receives
- [ ] Ticket flow: submit via form → auto-route → agent responds → SLA tracked → resolve → CSAT
- [ ] Booking flow: customer visits booking page → selects slot → confirms → calendar event created → reminder sent
- [ ] E-signature flow: create request → send to 3 signers → sequential signing → PDF generated → all notified
- [ ] Call flow: inbound call → IVR menu → route to agent → recording → transcription → disposition

### Load Tests

- [ ] Contact search: 10,000 concurrent searches against 1M contacts < 200ms p95
- [ ] Conversation messaging: 5,000 messages/second through WebSocket
- [ ] Form submissions: 1,000 concurrent submissions with validation
- [ ] Calendar availability: 500 concurrent slot lookups with overlapping checks

---

## Acceptance Criteria

### Phase 1 (Foundation)

- [ ] Contact CRUD works with duplicate detection and merge capability
- [ ] Deal pipeline supports drag-and-drop stage changes with probability auto-update
- [ ] Activity timeline shows all interactions chronologically
- [ ] Multi-channel conversation system delivers messages via email, SMS, and live chat
- [ ] Real-time messaging has < 200ms delivery latency
- [ ] Tickets support full lifecycle with SLA time tracking
- [ ] Knowledge base supports rich text articles with search
- [ ] Document management supports create, version, share with permission control
- [ ] All tables have RLS policies enforcing `venture_id` isolation
- [ ] All inputs validated with Zod schemas

### Phase 2 (Core)

- [ ] Calendar sync with Google Calendar works bidirectionally
- [ ] Booking pages generate correct available slots accounting for buffers and conflicts
- [ ] Round-robin booking distributes fairly across team members
- [ ] Form builder supports 8+ field types with conditional logic
- [ ] E-signature workflow supports sequential and parallel signing with full audit trail
- [ ] VoIP calls connect browser-to-phone with recording and transcription
- [ ] IVR menu routes inbound calls based on keypress selections
- [ ] Contact center routes based on 4 strategies with SLA compliance tracking

### Phase 3 (Advanced)

- [ ] AI chatbot answers 60%+ of common questions without escalation
- [ ] Intent classification achieves ≥85% accuracy on test dataset
- [ ] Sentiment analysis detects negative sentiment within 2 messages
- [ ] Deal scoring correlates with actual win/loss outcomes (≥70% accuracy)
- [ ] Revenue forecast is within 15% of actual revenue for committed category
- [ ] Cross-venture contact lookup resolves in < 500ms

### Phase 4 (Polish)

- [ ] All services have structured logging and health checks
- [ ] No P0 security issues in penetration test
- [ ] GDPR data export completes within 24 hours
- [ ] API documentation covers 100% of public endpoints
- [ ] SLA engine handles timezone-aware business hours correctly

---

## Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Twilio VoIP latency** | Medium | High | Use Twilio Programmable Voice with closest region, implement fallback to PSTN, monitor call quality |
| **Real-time message delivery** | Medium | High | Redis pub/sub with WebSocket fallback, message queue persistence, reconnection logic |
| **Calendar sync conflicts** | High | Medium | Last-write-wins with conflict detection, bidirectional sync with etag tracking, user notification |
| **E-signature legal validity** | Low | Critical | Legal review of UETA/ESIGN compliance, comprehensive audit trail, IP + timestamp logging |
| **AI chatbot hallucination** | High | Medium | Knowledge base grounding, confidence threshold for human escalation, regular accuracy audits |
| **Multi-tenant data leakage** | Low | Critical | Mandatory RLS on all tables, automated policy testing, penetration testing, audit logging |
| **Form spam/abuse** | High | Low | Rate limiting, honeypot fields, reCAPTCHA integration, IP-based blocking |
| **Agent burnout from overload** | Medium | Medium | Capacity limits, automatic overflow routing, workload balancing, break scheduling |
| **External calendar API rate limits** | Medium | Medium | Batch sync, incremental delta updates, webhook-based sync where available |
| **Document size/storage costs** | Medium | Low | File size limits, compression, tiered storage (hot/cold), document archival policies |
| **Call recording storage** | Medium | Medium | Auto-delete after retention period, compression, tiered S3 storage classes |
| **Cross-venture data privacy** | Medium | High | Granular sharing rules, per-venture consent, data minimization in cross-venture views |

---

## Timeline & Milestones

```
Week  1  ┃  2  ┃  3  ┃  4  ┃  5  ┃  6  ┃  7  ┃  8  ┃  9  ┃  10 ┃  11 ┃  12 ┃  13 ┃  14
━━━━━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━
DB Schema ██                                                                              
CRM Core  ██████████████████                                                               
Conversns ░░░░░██████████                                                                  
Tickets   ░░░░░░░░░░██████████                                                             
Documents ░░░░░░░░░░██████████                                                             
Calendar  ░░░░░░░░░░░░░░░░░░░░██████████                                                  
Forms     ░░░░░░░░░░░░░░░░░░░░██████████                                                  
E-Sign    ░░░░░░░░░░░░░░░░░░░░░░░░░██████████                                             
Calls     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████                                       
Contact Ctr░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████                                      
AI Routing░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████                              
Chatbot   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████                              
Sentiment ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████                        
Adv. CRM  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████                        
X-Venture ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████                   
Polish    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████         
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ▲           ▲                     ▲                     ▲              ▲
          M1          M2                    M3                    M4             M5

M1 (Week 1):  Schema complete, migrations applied
M2 (Week 4):  Phase 1 complete — CRM, Conversations, Tickets, Documents live
M3 (Week 8):  Phase 2 complete — Calendar, Forms, E-Sign, Calls, Contact Center
M4 (Week 12): Phase 3 complete — AI routing, Chatbot, Sentiment, Advanced CRM
M5 (Week 14): Phase 4 complete — Production ready, all tests passing
```

### Key Milestones

| Milestone | Date | Criteria |
|-----------|------|----------|
| **M1 — Schema Ready** | Week 1 | All Drizzle schemas defined, migrations passing, RLS applied |
| **M2 — Foundation Live** | Week 4 | CRM core, conversations, tickets, and documents operational |
| **M3 — Communication Hub** | Week 8 | Calendar, forms, e-signatures, calls, and contact center operational |
| **M4 — AI & Cross-Venture** | Week 12 | AI routing, chatbot, sentiment analysis, advanced CRM, cross-venture comms |
| **M5 — Production Ready** | Week 14 | Performance validated, security audited, documentation complete |

### Dependencies Between Phases

```
Phase 1 (Foundation)
  ├── crm (contacts) → Required by all other submodules (contact references)
  ├── conversations → Required by Phase 2 contact-center routing
  └── support (tickets) → Required by Phase 2 SLA and Phase 3 AI routing

Phase 2 (Core)
  ├── calendar (availability) → Required by booking pages
  ├── forms (submissions) → Required by CRM auto-contact creation
  └── calls (recording) → Required by Phase 3 transcription and sentiment

Phase 3 (Advanced)
  ├── AI routing → Requires historical ticket/conversation data from Phases 1 & 2
  └── Cross-venture → Requires stable CRM data model from Phase 1
```

---

*@mcv/nexus — Communication & Collaboration Domain*