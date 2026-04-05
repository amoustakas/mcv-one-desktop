# @mcv/nexus — Customer Relationship & Communication Hub

**Parent Package:** @mcv/nexus (Tier 5 Domain — Composite)  
**Tier:** 5 (Domain Packages — Publishable)  
**Classification:** PUBLISHABLE  
**Last Updated:** February 9, 2026

---

## Purpose

`@mcv/nexus` is the unified customer relationship and communication hub for MCV.ONE. It orchestrates the entire customer lifecycle — from first contact through ongoing relationship management — via nine tightly integrated submodules: CRM, Contact Center, Conversations, Calls, Forms, Support, Documents, Sign, and Calendar.

**Nexus is not a single package directory.** It is a domain composed of features spanning multiple packages, unified under one cohesive namespace. Every business interaction — whether a sales deal closing, a support ticket being resolved, a document being signed, or a meeting being booked — flows through Nexus.

**Why "Nexus"?** A nexus is a connection or series of connections linking two or more things. This domain is exactly that: the connective tissue binding every customer-facing operation into one coherent system.

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// CRM — Contacts, Organizations, Deals, Pipelines, Activities
// ═══════════════════════════════════════════════════════════════════════════════

export { contactService, ContactService } from './crm/services/contact.service';
export { organizationService, OrganizationService } from './crm/services/organization.service';
export { dealService, DealService } from './crm/services/deal.service';
export { pipelineService, PipelineService } from './crm/services/pipeline.service';
export { activityService, ActivityService } from './crm/services/activity.service';
export * from './crm/types';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTACT CENTER — Inbox, Queues, Agent Routing, SLA
// ═══════════════════════════════════════════════════════════════════════════════

export { routingService, RoutingService } from './contact-center/services/routing.service';
export { slaService, SlaService } from './contact-center/services/sla.service';
export { agentService, AgentService } from './contact-center/services/agent.service';
export * from './contact-center/types';

// ═══════════════════════════════════════════════════════════════════════════════
// CONVERSATIONS — Multi-Channel Threading & Messaging
// ═══════════════════════════════════════════════════════════════════════════════

export { conversationService, ConversationService } from './conversations/services/conversation.service';
export * from './conversations/types';

// ═══════════════════════════════════════════════════════════════════════════════
// CALLS — VoIP, Recording, IVR, Analytics
// ═══════════════════════════════════════════════════════════════════════════════

export { callService, CallService } from './calls/services/call.service';
export { ivrService, IvrService } from './calls/services/ivr.service';
export * from './calls/types';

// ═══════════════════════════════════════════════════════════════════════════════
// FORMS — Builder, Submissions, Webhooks, Analytics
// ═══════════════════════════════════════════════════════════════════════════════

export { formService, FormService } from './forms/services/form.service';
export { submissionService, SubmissionService } from './forms/services/submission.service';
export * from './forms/types';

// ═══════════════════════════════════════════════════════════════════════════════
// SUPPORT — Tickets, SLA, Knowledge Base, Portal
// ═══════════════════════════════════════════════════════════════════════════════

export { ticketService, TicketService } from './support/services/ticket.service';
export { knowledgeService, KnowledgeService } from './support/services/knowledge.service';
export * from './support/types';

// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENTS — Storage, Versioning, Folders, Sharing
// ═══════════════════════════════════════════════════════════════════════════════

export { documentService, DocumentService } from './documents/services/document.service';
export { folderService, FolderService } from './documents/services/folder.service';
export * from './documents/types';

// ═══════════════════════════════════════════════════════════════════════════════
// SIGN — E-Signatures, Templates, Audit Trails
// ═══════════════════════════════════════════════════════════════════════════════

export { signatureService, SignatureService } from './sign/services/signature.service';
export * from './sign/types';

// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR — Events, Booking Pages, Sync, Reminders
// ═══════════════════════════════════════════════════════════════════════════════

export { calendarService, CalendarService } from './calendar/services/calendar.service';
export { bookingService, BookingService } from './calendar/services/booking.service';
export * from './calendar/types';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

// CRM
export { useContacts } from './crm/client/hooks/use-contacts';
export { useContact } from './crm/client/hooks/use-contact';
export { useDeals } from './crm/client/hooks/use-deals';
export { usePipeline } from './crm/client/hooks/use-pipeline';
export { useTimeline } from './crm/client/hooks/use-timeline';

// Contact Center
export { useInbox } from './contact-center/client/hooks/use-inbox';
export { useAgentSession } from './contact-center/client/hooks/use-agent-session';
export { useSlaStatus } from './contact-center/client/hooks/use-sla-status';

// Conversations
export { useConversation } from './conversations/client/hooks/use-conversation';
export { useMessages } from './conversations/client/hooks/use-messages';

// Calls
export { useCallControls } from './calls/client/hooks/use-call-controls';
export { useCallAnalytics } from './calls/client/hooks/use-call-analytics';

// Forms
export { useFormBuilder } from './forms/client/hooks/use-form-builder';
export { useFormSubmissions } from './forms/client/hooks/use-form-submissions';

// Support
export { useTickets } from './support/client/hooks/use-tickets';
export { useKnowledgeBase } from './support/client/hooks/use-knowledge-base';

// Documents
export { useDocuments } from './documents/client/hooks/use-documents';
export { useFolders } from './documents/client/hooks/use-folders';

// Calendar
export { useCalendar } from './calendar/client/hooks/use-calendar';
export { useBookingPage } from './calendar/client/hooks/use-booking-page';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { ContactCard } from './crm/client/components/contact-card';
export { DealBoard } from './crm/client/components/deal-board';
export { PipelineKanban } from './crm/client/components/pipeline-kanban';
export { ActivityTimeline } from './crm/client/components/activity-timeline';
export { InboxPanel } from './contact-center/client/components/inbox-panel';
export { ChatWindow } from './conversations/client/components/chat-window';
export { CallDialer } from './calls/client/components/call-dialer';
export { FormRenderer } from './forms/client/components/form-renderer';
export { FormBuilderCanvas } from './forms/client/components/form-builder-canvas';
export { TicketView } from './support/client/components/ticket-view';
export { KnowledgePortal } from './support/client/components/knowledge-portal';
export { DocumentExplorer } from './documents/client/components/document-explorer';
export { SignatureCanvas } from './sign/client/components/signature-canvas';
export { CalendarWidget } from './calendar/client/components/calendar-widget';
export { BookingPageEmbed } from './calendar/client/components/booking-page-embed';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  CONTACT_LIFECYCLE_STAGES,
  DEAL_STATUSES,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  CONVERSATION_CHANNELS,
  CALL_STATUSES,
  FORM_FIELD_TYPES,
  DOCUMENT_STATUSES,
  CALENDAR_TYPES,
  APPOINTMENT_STATUSES,
  AGENT_STATUSES,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // CRM
  Contact, CreateContactInput, UpdateContactInput, ContactFilters,
  Organization, Deal, CreateDealInput, Pipeline, PipelineStage,
  Activity, TimelineEntry, DealForecast, VelocityMetrics,

  // Contact Center
  Inbox, Queue, AgentSession, InboxAssignment, RoutingResult,
  SlaStatus, SlaMetrics, RoutingRule, ChannelConfig, WorkingHours,

  // Conversations
  Conversation, Message, ConversationParticipant,
  CreateConversationInput, SendMessageInput, MessageAttachment,

  // Calls
  Call, CreateCallInput, CallRecording, IvrMenu, IvrOption, IvrAction,
  CallAnalytics, CallFilters,

  // Forms
  Form, FormField, FormSubmission, FormWebhook,
  CreateFormInput, SubmitFormInput, FieldValidation, ConditionalLogic,

  // Support
  Ticket, TicketComment, SlaPolicy, SupportGroup, TicketCategory,
  KnowledgeArticle, CreateTicketInput, TicketFilters,

  // Documents
  Document, DocumentVersion, Folder, DocumentShare,
  CreateDocumentInput, ShareDocumentInput, FolderPermissions,

  // Sign
  SignatureRequest, SignatureTemplate, Signer, SignatureAudit,

  // Calendar
  CalendarEvent, BookingPage, Availability, Appointment,
  AppointmentReminder, RoundRobinConfig,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                @mcv/nexus                                                │
│                  Customer Relationship & Communication Hub                                │
│                                                                                          │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                             CRM LAYER                                              │  │
│  │                                                                                    │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │  │
│  │  │   Contacts   │  │ Organizations│  │    Deals     │  │  Pipelines   │          │  │
│  │  │              │  │              │  │              │  │              │          │  │
│  │  │ • People     │  │ • Companies  │  │ • Kanban     │  │ • Stages    │          │  │
│  │  │ • Scoring    │  │ • Hierarchy  │  │ • Forecasts  │  │ • Automation│          │  │
│  │  │ • Lifecycle  │  │ • Revenue    │  │ • Velocity   │  │ • Rotting   │          │  │
│  │  │ • Merge      │  │ • Health     │  │ • AI Score   │  │ • Templates │          │  │
│  │  │ • GDPR       │  │ • Risk       │  │ • Won/Lost   │  │ • Views     │          │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │  │
│  │         │                 │                 │                 │                    │  │
│  │         └─────────────────┴─────────────────┴─────────────────┘                    │  │
│  │                                    │                                                │  │
│  │                           Activities + Custom Objects                               │  │
│  │                                    │                                                │  │
│  └────────────────────────────────────┼────────────────────────────────────────────────┘  │
│                                       │                                                   │
│  ┌────────────────────────────────────▼────────────────────────────────────────────────┐  │
│  │                        COMMUNICATION LAYER                                          │  │
│  │                                                                                     │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │  │
│  │  │   Contact    │  │ Conversations│  │    Calls     │  │   Support    │           │  │
│  │  │   Center     │  │              │  │              │  │              │           │  │
│  │  │              │  │ • Threading  │  │ • VoIP       │  │ • Tickets    │           │  │
│  │  │ • Inbox      │  │ • Multi-ch   │  │ • Recording  │  │ • SLA        │           │  │
│  │  │ • Queues     │  │ • Messages   │  │ • IVR        │  │ • Knowledge  │           │  │
│  │  │ • Routing    │  │ • Read Track │  │ • Transcribe │  │ • Portal     │           │  │
│  │  │ • Agents     │  │ • Channels   │  │ • Analytics  │  │ • CSAT       │           │  │
│  │  │ • SLA Track  │  │ • Snooze     │  │ • Dialer     │  │ • Merge      │           │  │
│  │  │ • CSAT       │  │              │  │ • Scripts    │  │ • Categories │           │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │  │
│  │         │                 │                 │                 │                     │  │
│  │         └─────────────────┴─────────────────┴─────────────────┘                     │  │
│  │                                    │                                                 │  │
│  └────────────────────────────────────┼─────────────────────────────────────────────────┘  │
│                                       │                                                    │
│  ┌────────────────────────────────────▼─────────────────────────────────────────────────┐ │
│  │                         CONTENT & SCHEDULING LAYER                                    │ │
│  │                                                                                       │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │ │
│  │  │    Forms     │  │  Documents   │  │     Sign     │  │   Calendar   │             │ │
│  │  │              │  │              │  │              │  │              │             │ │
│  │  │ • Builder    │  │ • Editor     │  │ • E-Sign     │  │ • Events     │             │ │
│  │  │ • Fields     │  │ • Templates  │  │ • Templates  │  │ • Booking    │             │ │
│  │  │ • Submissions│  │ • Versions   │  │ • Audit      │  │ • Round Robin│             │ │
│  │  │ • Webhooks   │  │ • Sharing    │  │ • Workflows  │  │ • Google Sync│             │ │
│  │  │ • Analytics  │  │ • Comments   │  │ • PDF Gen    │  │ • Reminders  │             │ │
│  │  │ • Quiz Mode  │  │ • AI Suggest │  │ • Multi-sign │  │ • Overrides  │             │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘             │ │
│  │                                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                            │
│                              CROSS-CUTTING CONCERNS                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  Multi-tenancy (ventureId)  │  RLS Policies  │  Custom Fields  │  Audit Logging    │  │
│  │  GDPR/Privacy Compliance    │  Webhook Events │  Search Indexing │  File Storage    │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                          │                                                 │
└──────────────────────────────────────────┼─────────────────────────────────────────────────┘
                                           │
                     ┌─────────────────────┼─────────────────────┐
                     │                     │                     │
                     ▼                     ▼                     ▼
              ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
              │ @mcv/comms  │       │ @mcv/storage│       │ @mcv/search │
              │             │       │             │       │             │
              │ Email/SMS/  │       │ S3/R2/Local │       │ Full-text   │
              │ Push/WhatsApp│      │ Files/Media │       │ Elasticsearch│
              └─────────────┘       └─────────────┘       └─────────────┘
                     │                     │                     │
                     ▼                     ▼                     ▼
              ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
              │ @mcv/realtime│      │ @mcv/auth   │       │ @mcv/kernel │
              │              │      │             │       │             │
              │ WebSocket    │      │ Permissions │       │ DB, Context │
              │ Live updates │      │ RLS, RBAC   │       │ Base cols   │
              └─────────────┘       └─────────────┘       └─────────────┘
```

### Data Flow — Contact Lifecycle

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │                   CONTACT LIFECYCLE                          │
                    │                                                              │
  Form Submission ──┼──▶ Contact Created ──▶ Lead Score ──▶ Deal Created          │
  Booking Page   ──┤                           │                │                 │
  Manual Import  ──┤                           │                │                 │
  API / Webhook  ──┘                           ▼                ▼                 │
                                    ┌──────────────────┐  Pipeline Stages         │
                                    │ Engagement Track │       │                  │
                                    │ • Email opens    │       │ Won ──▶ Customer │
                                    │ • Page visits    │       │ Lost ──▶ Archive │
                                    │ • Form fills     │       │                  │
                                    │ • Call logs      │       │                  │
                                    └──────────────────┘       │                  │
                                             │                 │                  │
                                             ▼                 ▼                  │
                                    ┌──────────────────────────────┐              │
                                    │     Ongoing Relationship     │              │
                                    │ • Support tickets            │              │
                                    │ • Conversation history       │              │
                                    │ • Document sharing           │              │
                                    │ • Calendar scheduling        │              │
                                    │ • Satisfaction surveys       │              │
                                    └──────────────────────────────┘              │
                    └─────────────────────────────────────────────────────────────┘
```

---

## Sub-Modules Overview

| Module | Purpose | Key Tables | Key Services |
|--------|---------|------------|-------------|
| **crm** | Contact, organization, deal, and pipeline management | `contacts`, `organizations`, `deals`, `pipelines`, `activities`, `custom_objects`, `deal_scores`, `forecasts` | `ContactService`, `DealService`, `PipelineService` |
| **contact-center** | Omnichannel inbox, queue management, agent routing | `agent_status`, `dialer_campaigns`, `sla_policies`, `channel_configs`, `csat_surveys` | `RoutingService`, `SlaService`, `AgentService` |
| **conversations** | Multi-channel conversation threading and history | `conversations`, `messages`, `conversation_participants` | `ConversationService` |
| **calls** | VoIP calling, recording, IVR, and call analytics | `calls`, `call_recordings`, `ivr_menus`, `call_scripts`, `call_dispositions` | `CallService`, `IvrService` |
| **forms** | Form builder, field types, submissions, webhooks | `forms`, `form_fields`, `form_submissions`, `form_analytics`, `form_versions` | `FormService`, `SubmissionService` |
| **support** | Ticketing system, SLA management, knowledge base | `tickets`, `ticket_comments`, `sla_policies`, `knowledge_articles`, `support_groups` | `TicketService`, `KnowledgeService` |
| **documents** | Document editor, versioning, sharing, collaboration | `documents`, `document_templates`, `document_versions`, `document_comments`, `document_assets` | `DocumentService`, `FolderService` |
| **sign** | Electronic signatures, templates, signing workflows | `signature_requests`, `signature_templates`, `signers`, `signature_audit` | `SignatureService` |
| **calendar** | Event scheduling, booking pages, calendar sync | `calendars`, `appointments`, `booking_pages`, `calendar_availability`, `round_robin_config` | `CalendarService`, `BookingService` |

---

## Module: CRM

### Purpose

Complete customer relationship management system supporting contacts (individuals), organizations (companies), deals (opportunities), pipelines (sales processes), activities (interactions), custom objects, AI-powered deal scoring, revenue forecasting, duplicate detection, smart views, and lead scoring with decay.

### Key Features

- **Contact Management** — Full lifecycle from lead → MQL → SQL → customer → evangelist → churned
- **Organization Hierarchy** — Parent/child company relationships with health and risk scoring
- **Deal Pipeline** — Kanban board with probability weighting, rotting detection, and auto-move
- **AI Deal Scoring** — ML-powered win probability with risk signals and factor breakdown
- **Revenue Forecasting** — Monthly/quarterly/yearly forecasts with commit, best-case, and pipeline categories
- **Duplicate Detection** — Configurable matching rules with threshold-based auto-merge
- **Smart Views** — Saved filters, sorts, and column configs per user or shared
- **Lead Scoring** — Behavioral + demographic + firmographic scoring with decay over time
- **Custom Objects** — User-defined entities with typed fields and polymorphic relationships
- **Activity Timeline** — Unified view of calls, emails, meetings, tasks, notes, and deal changes

### DB Schema — contacts (Base)

```sql
-- From: packages/db/src/schema/contacts.ts
CREATE TABLE contacts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id     UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  type           TEXT NOT NULL,                     -- 'person' | 'company'
  first_name     TEXT,
  last_name      TEXT,
  email          TEXT,
  phone          TEXT,
  company        TEXT,
  job_title      TEXT,
  lead_score     INTEGER DEFAULT 0,
  lifecycle_stage TEXT DEFAULT 'lead',              -- lead → marketing_qualified → sales_qualified
                                                    -- → opportunity → customer → evangelist → churned
  owner_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  custom_fields  JSONB DEFAULT '{}',               -- ContactCustomFields
  tags           JSONB DEFAULT '[]',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_contacts_venture ON contacts(venture_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_owner ON contacts(owner_id);
CREATE INDEX idx_contacts_type ON contacts(type);
CREATE INDEX idx_contacts_lifecycle_stage ON contacts(lifecycle_stage);
CREATE INDEX idx_contacts_venture_type ON contacts(venture_id, type);
CREATE INDEX idx_contacts_venture_lifecycle ON contacts(venture_id, lifecycle_stage);
CREATE INDEX idx_contacts_venture_owner ON contacts(venture_id, owner_id);
CREATE INDEX idx_contacts_lead_score ON contacts(lead_score);
```

### DB Schema — deals

```sql
-- From: packages/db/src/schema/deals.ts
CREATE TABLE deals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id          UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  pipeline_id         UUID NOT NULL REFERENCES pipelines(id) ON DELETE RESTRICT,
  contact_id          UUID REFERENCES contacts(id) ON DELETE SET NULL,
  organization_id     UUID REFERENCES organizations(id) ON DELETE SET NULL,
  name                TEXT NOT NULL,
  value               DECIMAL(15,2),
  currency            TEXT DEFAULT 'USD',
  stage               TEXT NOT NULL,
  probability         INTEGER,                       -- 0-100
  status              TEXT DEFAULT 'open',            -- open | won | lost
  expected_close_date DATE,
  actual_close_date   DATE,
  lost_reason         TEXT,
  owner_id            UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deals_venture ON deals(venture_id);
CREATE INDEX idx_deals_pipeline ON deals(pipeline_id);
CREATE INDEX idx_deals_contact ON deals(contact_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_venture_status ON deals(venture_id, status);
CREATE INDEX idx_deals_venture_pipeline ON deals(venture_id, pipeline_id);
CREATE INDEX idx_deals_expected_close ON deals(expected_close_date);
```

### DB Schema — pipelines

```sql
-- From: packages/db/src/schema/pipelines.ts
CREATE TABLE pipelines (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id  UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  stages      JSONB NOT NULL,                        -- PipelineStage[]
  is_default  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PipelineStage JSON structure:
-- { name: string, order: number, probability: number }

CREATE INDEX idx_pipelines_venture ON pipelines(venture_id);
CREATE INDEX idx_pipelines_venture_default ON pipelines(venture_id, is_default);
```

### DB Schema — CRM V2 (Advanced)

```sql
-- From: packages/db/src/schema/crm-v2.ts

-- Custom Objects: user-defined CRM entities
CREATE TABLE custom_objects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id  UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  plural_name TEXT NOT NULL,
  slug        TEXT NOT NULL,
  icon        TEXT,
  color       TEXT,
  fields      JSONB NOT NULL DEFAULT '[]',           -- CustomObjectFieldDef[]
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (venture_id, slug)
);

-- Custom Object Records
CREATE TABLE custom_object_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id  UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  object_id   UUID NOT NULL REFERENCES custom_objects(id) ON DELETE CASCADE,
  data        JSONB NOT NULL DEFAULT '{}',
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Polymorphic Object Relationships
CREATE TABLE object_relationships (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id          UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  source_object_type  TEXT NOT NULL,                 -- contact | organization | deal | custom
  source_object_id    UUID NOT NULL,
  target_object_type  TEXT NOT NULL,
  target_object_id    UUID NOT NULL,
  relationship_type   TEXT NOT NULL,                 -- belongs_to | has_many | many_to_many
  label               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Deal Scoring
CREATE TABLE deal_scores (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id             UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  venture_id          UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  score               INTEGER NOT NULL DEFAULT 0,
  confidence          DECIMAL(5,2),
  factors             JSONB NOT NULL DEFAULT '[]',   -- ScoringFactor[]
  predicted_close_date DATE,
  predicted_amount    DECIMAL(15,2),
  win_probability     DECIMAL(5,2),
  risk_level          TEXT DEFAULT 'medium',         -- low | medium | high
  signals             JSONB NOT NULL DEFAULT '[]',   -- ScoringSignal[]
  scored_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Revenue Forecasts
CREATE TABLE forecasts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  period          TEXT NOT NULL,                     -- monthly | quarterly | yearly
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  pipeline_id     UUID REFERENCES pipelines(id) ON DELETE SET NULL,
  owner_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  forecast_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  weighted_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  best_case       DECIMAL(15,2) NOT NULL DEFAULT 0,
  worst_case      DECIMAL(15,2) NOT NULL DEFAULT 0,
  closed_won_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  status          TEXT DEFAULT 'open',               -- open | closed
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Forecast Items (deal → forecast mapping)
CREATE TABLE forecast_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_id UUID NOT NULL REFERENCES forecasts(id) ON DELETE CASCADE,
  deal_id     UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  amount      DECIMAL(15,2) NOT NULL DEFAULT 0,
  probability INTEGER,
  category    TEXT NOT NULL DEFAULT 'pipeline',      -- commit | best_case | pipeline | omitted
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Duplicate Detection Rules
CREATE TABLE duplicate_rules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id   UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  object_type  TEXT NOT NULL,                        -- contact | organization
  match_fields JSONB NOT NULL DEFAULT '[]',          -- string[][] (groups of fields to match)
  threshold    INTEGER NOT NULL DEFAULT 80,          -- 0-100 similarity threshold
  auto_merge   BOOLEAN NOT NULL DEFAULT false,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Merge History (audit trail for merges)
CREATE TABLE merge_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id  UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  object_type TEXT NOT NULL,                         -- contact | organization
  survivor_id UUID NOT NULL,
  merged_id   UUID NOT NULL,
  merged_data JSONB NOT NULL DEFAULT '{}',
  merged_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Smart Views (saved filter/sort/column configs)
CREATE TABLE smart_views (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id  UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  object_type TEXT NOT NULL,                         -- contact | organization | deal | custom
  filters     JSONB NOT NULL DEFAULT '[]',           -- SmartViewFilter[]
  sort_by     JSONB NOT NULL DEFAULT '[]',           -- SmartViewSort[]
  columns     JSONB NOT NULL DEFAULT '[]',           -- SmartViewColumn[]
  is_default  BOOLEAN NOT NULL DEFAULT false,
  is_shared   BOOLEAN NOT NULL DEFAULT false,
  owner_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead Scoring Rules (configurable per venture)
CREATE TABLE lead_scoring_rules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id    UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,                       -- behavioral | demographic | firmographic
  rules         JSONB NOT NULL DEFAULT '[]',         -- ScoringRuleCondition[]
  max_score     INTEGER NOT NULL DEFAULT 100,
  decay_enabled BOOLEAN NOT NULL DEFAULT false,
  decay_days    INTEGER DEFAULT 30,
  decay_percent INTEGER DEFAULT 10,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Computed Contact Scores
CREATE TABLE contact_scores (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id        UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE UNIQUE,
  venture_id        UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  total_score       INTEGER NOT NULL DEFAULT 0,
  behavioral_score  INTEGER NOT NULL DEFAULT 0,
  demographic_score INTEGER NOT NULL DEFAULT 0,
  firmographic_score INTEGER NOT NULL DEFAULT 0,
  breakdown         JSONB NOT NULL DEFAULT '{"rules":[]}', -- ScoreBreakdown
  last_activity_at  TIMESTAMPTZ,
  scored_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enhanced Pipeline Stages
CREATE TABLE pipeline_stages_v2 (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id     UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  venture_id      UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  position        INTEGER NOT NULL DEFAULT 0,
  probability     INTEGER DEFAULT 0,
  rotting_days    INTEGER,                           -- days before deal "rots"
  required_fields JSONB NOT NULL DEFAULT '[]',       -- string[]
  automations     JSONB NOT NULL DEFAULT '[]',       -- StageAutomation[]
  color           TEXT,
  is_won          BOOLEAN NOT NULL DEFAULT false,
  is_lost         BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### CRM Interfaces

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Create and manage contacts
// ═══════════════════════════════════════════════════════════════════════════════

import { contactService } from '@mcv/nexus';

// Create a new contact
const contact = await contactService.create({
  email: 'jane.doe@acmecorp.com',
  firstName: 'Jane',
  lastName: 'Doe',
  title: 'VP of Engineering',
  organizationId: 'org-uuid-acme',
  type: 'prospect',
  source: 'website',
  lifecycleStage: 'marketing_qualified',
  tags: ['enterprise', 'tech'],
  customFields: { referralSource: 'partner-webinar' },
});

// Search contacts with complex filters
const results = await contactService.search({
  query: 'acme',
  status: 'active',
  type: 'prospect',
  lifecycleStage: 'sales_qualified',
  tags: ['enterprise'],
  sortBy: 'lastActivity',
  sortOrder: 'desc',
  page: 1,
  limit: 25,
});

console.log(`Found ${results.pagination.total} contacts`);

// Merge duplicate contacts
const merged = await contactService.merge('primary-uuid', [
  'duplicate-uuid-1',
  'duplicate-uuid-2',
]);
// All deals, activities, conversations, and tickets are reassigned to primary

// Get unified contact timeline
const timeline = await contactService.getTimeline('contact-uuid', { limit: 50 });
for (const entry of timeline) {
  console.log(`[${entry.type}] ${entry.timestamp}: ${JSON.stringify(entry.data)}`);
}
```

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: Deal pipeline management with forecasting
// ═══════════════════════════════════════════════════════════════════════════════

import { dealService } from '@mcv/nexus';

// Create a deal
const deal = await dealService.create({
  name: 'Acme Corp Enterprise License',
  pipelineId: 'pipeline-uuid',
  stageId: 'stage-discovery-uuid',
  amount: '50000.00',
  currency: 'USD',
  probability: 30,
  expectedCloseDate: new Date('2026-04-15'),
  contactId: 'contact-jane-uuid',
  organizationId: 'org-acme-uuid',
  source: 'inbound',
  tags: ['enterprise', 'annual'],
});

// Move deal through pipeline stages
await dealService.moveToStage(deal.id, 'stage-proposal-uuid');
// Automatically updates probability, creates history entry, triggers automation

// Win the deal
await dealService.win(deal.id, { notes: 'Signed 3-year contract' });
// Creates activity, updates contact lifecycle, emits deal.won event

// Get pipeline forecast
const forecast = await dealService.getForecast('pipeline-uuid', {
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-03-31'),
  groupBy: 'month',
});

console.log(`Pipeline: ${forecast.totals.count} deals`);
console.log(`Total value: $${forecast.totals.totalAmount}`);
console.log(`Weighted: $${forecast.totals.weightedAmount}`);

// Get velocity metrics
const velocity = await dealService.getVelocityMetrics('pipeline-uuid', 90);
console.log(`Win rate: ${velocity.winRate}%`);
console.log(`Avg cycle: ${velocity.avgCycleTimeDays} days`);
console.log(`Avg deal size: $${velocity.avgDealSize}`);
```

---

## Module: Contact Center

### Purpose

Omnichannel inbox management with agent queues, intelligent routing (round-robin, skills-based, least-busy, priority), SLA tracking, predictive dialer campaigns, supervisor monitoring (silent/whisper/barge), CSAT surveys, and per-channel configuration.

### Key Features

- **Agent Presence** — Real-time status tracking (available, busy, on_call, in_wrap_up, on_break, offline)
- **Multi-Channel Routing** — SMS, email, phone, WhatsApp, Facebook, Instagram, webchat, Slack
- **Predictive Dialer** — Power, predictive, and preview dialer campaigns with abandon rate targeting
- **Supervisor Monitoring** — Silent monitor, whisper coach, and barge-in modes
- **SLA Policies** — Priority-based targets with escalation chains and business hours awareness
- **CSAT Surveys** — Post-interaction satisfaction scoring (1-5) and NPS (0-10) with feedback
- **Call Scripts** — Branching agent scripts with configurable steps
- **Call Dispositions** — Custom outcomes with required notes and follow-up triggers

### DB Schema — Contact Center

```sql
-- From: packages/db/src/schema/contact-center.ts

-- Agent Real-Time Presence
CREATE TABLE agent_status (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id               UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  user_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status                   TEXT NOT NULL DEFAULT 'offline',
  -- available | busy | on_call | in_wrap_up | on_break | offline
  current_conversation_id  UUID REFERENCES conversations(id) ON DELETE SET NULL,
  current_call_sid         TEXT,
  status_changed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  break_reason             TEXT,
  auto_logout_at           TIMESTAMPTZ,
  daily_call_count         INTEGER DEFAULT 0 NOT NULL,
  daily_talk_time_seconds  INTEGER DEFAULT 0 NOT NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (venture_id, user_id)
);

-- Dialer Campaigns (Power / Predictive / Preview)
CREATE TABLE dialer_campaigns (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id             UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name                   TEXT NOT NULL,
  type                   TEXT NOT NULL,              -- power | predictive | preview
  status                 TEXT NOT NULL DEFAULT 'draft', -- draft | active | paused | completed
  contact_list_id        UUID,
  caller_id              TEXT,
  max_concurrent_calls   INTEGER DEFAULT 1 NOT NULL,
  dial_ratio             REAL DEFAULT 1.0 NOT NULL,
  abandon_rate_target    REAL DEFAULT 0.03 NOT NULL,
  max_ring_time          INTEGER DEFAULT 30 NOT NULL,
  max_retries            INTEGER DEFAULT 3 NOT NULL,
  retry_interval         INTEGER DEFAULT 3600 NOT NULL, -- seconds
  call_disposition       JSONB,                      -- CampaignDispositionConfig
  schedule               JSONB,                      -- CampaignSchedule
  stats                  JSONB DEFAULT '{"total":0,"connected":0,"voicemail":0,"busy":0,"noAnswer":0,"failed":0}',
  script_id              UUID,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dialer Queue Entries
CREATE TABLE dialer_queue_entries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id       UUID NOT NULL REFERENCES dialer_campaigns(id) ON DELETE CASCADE,
  contact_id        UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'pending', -- pending | dialing | connected | completed | skipped | retry
  attempts          INTEGER DEFAULT 0 NOT NULL,
  last_attempt_at   TIMESTAMPTZ,
  next_retry_at     TIMESTAMPTZ,
  disposition       TEXT,
  disposition_notes TEXT,
  assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Call Scripts (branching agent guides)
CREATE TABLE call_scripts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id  UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  steps       JSONB DEFAULT '[]' NOT NULL,           -- ScriptStep[]
  is_active   BOOLEAN DEFAULT true NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Call Dispositions (configurable outcomes)
CREATE TABLE call_dispositions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id             UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name                   TEXT NOT NULL,
  color                  TEXT,
  icon                   TEXT,
  requires_notes         BOOLEAN DEFAULT false NOT NULL,
  requires_follow_up     BOOLEAN DEFAULT false NOT NULL,
  follow_up_default_days INTEGER,
  trigger_workflow_id    UUID,
  is_active              BOOLEAN DEFAULT true NOT NULL,
  sort_order             INTEGER DEFAULT 0 NOT NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CSAT Surveys
CREATE TABLE csat_surveys (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id        UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  conversation_id   UUID REFERENCES conversations(id) ON DELETE SET NULL,
  call_record_id    UUID,
  contact_id        UUID REFERENCES contacts(id) ON DELETE SET NULL,
  agent_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  channel           TEXT,                            -- sms | email | phone | whatsapp | ...
  score             INTEGER,                         -- 1-5
  nps_score         INTEGER,                         -- 0-10
  feedback          TEXT,
  sent_at           TIMESTAMPTZ,
  responded_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supervisor Monitoring Sessions
CREATE TABLE supervisor_sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id     UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  supervisor_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  call_sid       TEXT,
  mode           TEXT NOT NULL,                      -- silent_monitor | whisper | barge
  started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at       TIMESTAMPTZ
);

-- SLA Policies
CREATE TABLE sla_policies (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id             UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name                   TEXT NOT NULL,
  first_response_target  INTEGER NOT NULL,           -- seconds
  resolution_target      INTEGER NOT NULL,           -- seconds
  business_hours_only    BOOLEAN DEFAULT false NOT NULL,
  priority               TEXT NOT NULL DEFAULT 'medium', -- low | medium | high | urgent
  escalate_after         JSONB DEFAULT '[]',         -- EscalationEntry[]
  is_active              BOOLEAN DEFAULT true NOT NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Channel Configurations (per-venture, per-channel)
CREATE TABLE channel_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  channel         TEXT NOT NULL,                     -- sms | email | phone | whatsapp | ...
  is_enabled      BOOLEAN DEFAULT true NOT NULL,
  config          JSONB DEFAULT '{}',                -- ChannelSpecificConfig
  auto_assign     BOOLEAN DEFAULT true NOT NULL,
  routing_method  TEXT DEFAULT 'round_robin' NOT NULL, -- round_robin | skills_based | least_busy | priority
  welcome_message TEXT,
  away_message    TEXT,
  business_hours  JSONB,                             -- ChannelBusinessHours
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (venture_id, channel)
);
```

### Contact Center Interfaces

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Conversation routing and agent management
// ═══════════════════════════════════════════════════════════════════════════════

import { routingService, slaService } from '@mcv/nexus';

// Route a new conversation
const result = await routingService.routeConversation(
  'conversation-uuid',
  'inbox-uuid'
);

console.log(`Assigned to: ${result.agent?.name || 'Unassigned'}`);
console.log(`Queue: ${result.queue?.name || 'Default'}`);
console.log(`Assignment type: ${result.assignment.assignmentType}`);

// SLA monitoring
const slaStatus = await slaService.getSlaStatus('assignment-uuid');
console.log(`First response: ${slaStatus.firstResponse.status}`); // on_track | at_risk | breached
console.log(`Resolution: ${slaStatus.resolution.status}`);

if (slaStatus.firstResponse.remaining) {
  console.log(`Time remaining: ${slaStatus.firstResponse.remaining / 60000} minutes`);
}

// Batch SLA breach check (called by cron)
const breachReport = await slaService.checkSlaBreaches();
console.log(`Breached: ${breachReport.breached}, At risk: ${breachReport.atRisk}`);

// Get SLA metrics for reporting
const metrics = await slaService.getMetrics({
  inboxId: 'inbox-uuid',
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-31'),
});

console.log(`First response met: ${metrics.firstResponse.rate}%`);
console.log(`Avg first response: ${metrics.firstResponse.avgTimeMs / 1000}s`);
console.log(`Resolution rate: ${metrics.resolution.rate}%`);
```

---

## Module: Conversations

### Purpose

Multi-channel conversation threading with message history, channel abstraction, participant management, read tracking, and snooze capabilities. Every communication across email, chat, phone, WhatsApp, and SMS is unified into a single threaded view.

### Key Features

- **Omnichannel Threading** — Single conversation view across email, chat, phone, WhatsApp, SMS
- **Message Types** — Text, HTML, markdown, images, files, audio, video, location, templates
- **Participant Tracking** — Contact and user participants with role (initiator, CC, BCC)
- **Read Receipts** — Per-participant unread counts and last-read message tracking
- **Private Notes** — Internal-only messages invisible to contacts
- **Channel Delivery** — Automatic dispatch via appropriate channel (SMTP, Twilio, WhatsApp API)
- **SLA Integration** — First response recording for inbox assignments

### DB Schema — Conversations

```sql
-- From: packages/db/src/schema/conversations.ts

CREATE TABLE conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
  channel         TEXT NOT NULL,                     -- email | sms | voice | chat | whatsapp
  status          TEXT NOT NULL DEFAULT 'open',      -- open | pending | resolved | closed
  priority        TEXT DEFAULT 'normal',             -- low | normal | high | urgent
  subject         TEXT,
  assigned_to     UUID REFERENCES users(id) ON DELETE SET NULL,
  queue_id        UUID REFERENCES queues(id) ON DELETE SET NULL,
  first_response_at TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}',                -- ConversationMetadata
  tags            JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14 indexes for venture isolation, status filtering, and feed queries
CREATE INDEX idx_conversations_venture ON conversations(venture_id);
CREATE INDEX idx_conversations_contact ON conversations(contact_id);
CREATE INDEX idx_conversations_assigned ON conversations(assigned_to);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_queue ON conversations(queue_id);
CREATE INDEX idx_conversations_venture_status ON conversations(venture_id, status);
CREATE INDEX idx_conversations_venture_channel ON conversations(venture_id, channel);
CREATE INDEX idx_conversations_venture_priority ON conversations(venture_id, priority);
CREATE INDEX idx_conversations_venture_assigned ON conversations(venture_id, assigned_to);
CREATE INDEX idx_conversations_venture_queue ON conversations(venture_id, queue_id);
CREATE INDEX idx_conversations_venture_created ON conversations(venture_id, created_at);
CREATE INDEX idx_conversations_venture_updated ON conversations(venture_id, updated_at);
CREATE INDEX idx_conversations_open_venture ON conversations(venture_id, status, priority);
```

### Conversations Interfaces

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Multi-channel conversations
// ═══════════════════════════════════════════════════════════════════════════════

import { conversationService } from '@mcv/nexus';

// Create a conversation from an inbound email
const conversation = await conversationService.create({
  channel: 'email',
  channelData: {
    email: { threadId: 'gmail-thread-id', messageIds: ['msg-1'] },
  },
  subject: 'Question about pricing',
  initiatorType: 'contact',
  contactId: 'contact-uuid',
  inboxId: 'inbox-uuid',
  tags: ['pricing', 'enterprise'],
});

// Send an agent reply
const message = await conversationService.sendMessage(conversation.id, {
  content: 'Hi Jane! I\'d be happy to help with pricing. Our enterprise plan starts at...',
  contentType: 'text',
  senderType: 'user',
});
// Automatically: updates conversation.lastMessageAt, records first response for SLA,
// increments unread counts for other participants, sends via SMTP for email channel

// Send a private internal note
await conversationService.sendMessage(conversation.id, {
  content: 'This is a high-value prospect — escalate to VP if they ask for custom pricing.',
  isPrivate: true,
});

// Mark messages as read
await conversationService.markAsRead(conversation.id);

// Get paginated messages
const { messages, hasMore } = await conversationService.getMessages(conversation.id, {
  limit: 50,
  includePrivate: true, // agents see private notes
});

// Snooze conversation until next week
await conversationService.snooze(conversation.id, new Date('2026-02-15'));
```

---

## Module: Calls

### Purpose

VoIP calling integration with Twilio, call recording, IVR (Interactive Voice Response) menus, call analytics, transcription, and cost tracking. Supports both inbound and outbound calls with full lifecycle webhook handling.

### Key Features

- **VoIP Integration** — Twilio-powered inbound/outbound calls with SID tracking
- **IVR Builder** — Multi-level menus with TTS or audio greetings, business hours routing
- **Call Recording** — Automatic recording with storage and retention management
- **Transcription** — Speech-to-text via Google Cloud Speech or Twilio
- **Call Analytics** — Direction, status, duration, answer rate with time-series breakdowns
- **Disposition Tracking** — Agent-set outcomes (qualified, not_interested, callback, etc.)
- **Cost Tracking** — Per-call cost in USD with provider cost passthrough

### DB Schema — Calls

```sql
-- From: packages/db/src/schema/calls.ts

CREATE TABLE calls (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id       UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  conversation_id  UUID,                             -- links to unified conversation
  contact_id       UUID REFERENCES contacts(id) ON DELETE SET NULL,
  agent_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  direction        TEXT NOT NULL,                    -- inbound | outbound
  status           TEXT NOT NULL DEFAULT 'initiated',
  -- initiated | ringing | in_progress | on_hold | completed | no_answer | busy | failed | voicemail
  from_number      TEXT NOT NULL,
  to_number        TEXT NOT NULL,
  twilio_sid       TEXT,                             -- for webhook lookups
  recording_sid    TEXT,
  duration_seconds INTEGER,
  recording_url    TEXT,
  transcription    TEXT,
  voicemail_url    TEXT,
  disposition      TEXT,                             -- agent-set outcome
  notes            TEXT,
  queued_at        TIMESTAMPTZ,
  answered_at      TIMESTAMPTZ,
  ended_at         TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_calls_venture ON calls(venture_id);
CREATE INDEX idx_calls_contact ON calls(contact_id);
CREATE INDEX idx_calls_agent ON calls(agent_id);
CREATE INDEX idx_calls_twilio ON calls(twilio_sid);  -- critical for real-time webhooks
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_calls_venture_status ON calls(venture_id, status);
CREATE INDEX idx_calls_venture_agent ON calls(venture_id, agent_id);
CREATE INDEX idx_calls_venture_direction ON calls(venture_id, direction);
CREATE INDEX idx_calls_created_at ON calls(created_at);
```

### Calls Interfaces

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: VoIP call management and analytics
// ═══════════════════════════════════════════════════════════════════════════════

import { callService } from '@mcv/nexus';

// Initiate an outbound call
const call = await callService.initiateCall({
  fromNumber: '+14155551234',
  toNumber: '+14155555678',
  contactId: 'contact-uuid',
  recordingEnabled: true,
  transcriptionEnabled: true,
});
// Creates call record, initiates via Twilio, returns { ...call, status: 'ringing' }

// Handle incoming call webhook (called by Twilio)
const { call: inboundCall, twimlResponse } = await callService.handleIncomingCall({
  callSid: 'CA123...',
  from: '+14155559999',
  to: '+14155551234',
  timestamp: new Date().toISOString(),
});
// Looks up contact by phone, creates call record, generates IVR TwiML response

// Get call analytics for the month
const analytics = await callService.getAnalytics({
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-31'),
  groupBy: 'day',
});

console.log(`Total calls: ${analytics.summary.total}`);
console.log(`Answer rate: ${analytics.summary.answerRate}%`);
console.log(`Avg duration: ${analytics.duration.average}s`);
console.log(`Inbound: ${analytics.summary.inbound}`);
console.log(`Outbound: ${analytics.summary.outbound}`);
```

---

## Module: Forms

### Purpose

Form builder with drag-and-drop field configuration, conditional logic, multi-step forms, quiz/survey mode, submission handling, spam detection, contact auto-creation, webhook integrations, and detailed per-step analytics.

### Key Features

- **28 Field Types** — text, email, phone, textarea, number, select, multi_select, checkbox, radio, date, datetime, time, file, image, rating, NPS, scale, hidden, HTML, signature, payment, address, name, heading, paragraph, divider, spacer
- **Conditional Logic** — Show/hide/require fields based on other answers (all/any matching)
- **Multi-Step Forms** — Step-by-step with progress bar, back navigation, partial save
- **Quiz Mode** — Scoring, passing threshold, time limits, randomized questions
- **Embed Types** — Inline, popup, slide-in, full-page, chat widget
- **Analytics** — Views, starts, completions, conversion rate, per-step dropoff, per-field error rates, device breakdown
- **Contact Mapping** — Auto-create or update CRM contacts from form field mappings
- **Spam Protection** — Honeypot fields, timing checks, reCAPTCHA integration
- **Version History** — Full snapshot of form at each published version

### DB Schema — Forms

```sql
-- From: packages/db/src/schema/forms.ts

CREATE TABLE forms (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id       UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  created_by_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  description      TEXT,
  slug             TEXT,
  type             TEXT NOT NULL DEFAULT 'form',     -- form | survey | quiz
  status           TEXT NOT NULL DEFAULT 'draft',    -- draft | published | archived | closed
  version          INTEGER NOT NULL DEFAULT 1,
  published_version INTEGER,
  published_at     TIMESTAMPTZ,
  settings         JSONB DEFAULT '{}',               -- FormSettings
  styling          JSONB DEFAULT '{}',               -- FormStyling
  submission_count INTEGER NOT NULL DEFAULT 0,
  view_count       INTEGER NOT NULL DEFAULT 0,
  folder_id        UUID,
  tags             TEXT[] DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at      TIMESTAMPTZ
);

CREATE TABLE form_fields (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id               UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  type                  TEXT NOT NULL,                -- 28 field types
  label                 TEXT NOT NULL,
  name                  TEXT NOT NULL,
  placeholder           TEXT,
  help_text             TEXT,
  default_value         TEXT,
  position              INTEGER NOT NULL DEFAULT 0,
  step_index            INTEGER NOT NULL DEFAULT 0,
  width                 TEXT DEFAULT 'full',
  column_span           INTEGER DEFAULT 1,
  required              BOOLEAN NOT NULL DEFAULT false,
  hidden                BOOLEAN NOT NULL DEFAULT false,
  read_only             BOOLEAN NOT NULL DEFAULT false,
  validation            JSONB DEFAULT '{}',           -- FieldValidation
  conditional_logic     JSONB,                        -- ConditionalLogic
  options               JSONB DEFAULT '[]',           -- FieldOption[]
  contact_field_mapping TEXT,                         -- maps to CRM contact field
  custom_field_key      TEXT,
  correct_answer        TEXT,                         -- quiz mode
  points                INTEGER DEFAULT 0,            -- quiz scoring
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE form_submissions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id                  UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  venture_id               UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  contact_id               UUID REFERENCES contacts(id) ON DELETE SET NULL,
  data                     JSONB NOT NULL DEFAULT '{}',
  form_version             INTEGER NOT NULL DEFAULT 1,
  source                   TEXT NOT NULL DEFAULT 'direct', -- embed | direct | workflow | api | import
  referrer_url             TEXT,
  ip_address               TEXT,
  user_agent               TEXT,
  completed_steps          INTEGER NOT NULL DEFAULT 0,
  total_steps              INTEGER NOT NULL DEFAULT 1,
  is_partial               BOOLEAN NOT NULL DEFAULT false,
  score                    INTEGER,                   -- quiz score
  max_score                INTEGER,
  passed                   BOOLEAN,
  is_read                  BOOLEAN NOT NULL DEFAULT false,
  is_spam                  BOOLEAN NOT NULL DEFAULT false,
  notes                    TEXT,
  confirmed                BOOLEAN NOT NULL DEFAULT false,
  confirmed_at             TIMESTAMPTZ,
  file_urls                JSONB DEFAULT '{}',
  started_at               TIMESTAMPTZ,
  submitted_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  completion_time_seconds  INTEGER
);

CREATE TABLE form_analytics (
  id                             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id                        UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  date                           DATE NOT NULL,
  views                          INTEGER NOT NULL DEFAULT 0,
  unique_views                   INTEGER NOT NULL DEFAULT 0,
  starts                         INTEGER NOT NULL DEFAULT 0,
  completions                    INTEGER NOT NULL DEFAULT 0,
  partial_submissions            INTEGER NOT NULL DEFAULT 0,
  conversion_rate                REAL NOT NULL DEFAULT 0,
  start_rate                     REAL NOT NULL DEFAULT 0,
  completion_rate                REAL NOT NULL DEFAULT 0,
  avg_completion_time_seconds    INTEGER,
  median_completion_time_seconds INTEGER,
  source_breakdown               JSONB DEFAULT '{}',
  dropoff_by_step                JSONB DEFAULT '[]',
  field_completion_rates         JSONB DEFAULT '{}',
  device_breakdown               JSONB DEFAULT '{"desktop":0,"mobile":0,"tablet":0}',
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE form_versions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id       UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  version       INTEGER NOT NULL,
  name          TEXT NOT NULL,
  fields        JSONB NOT NULL DEFAULT '[]',
  settings      JSONB DEFAULT '{}',
  styling       JSONB DEFAULT '{}',
  change_note   TEXT,
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Forms Interfaces

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: Form builder and submissions
// ═══════════════════════════════════════════════════════════════════════════════

import { formService, submissionService } from '@mcv/nexus';

// Create a lead capture form
const form = await formService.create({
  name: 'Enterprise Demo Request',
  type: 'standard',
  settings: {
    requireAuth: false,
    showProgressBar: true,
    enableCaptcha: true,
    captchaType: 'turnstile',
    submitButtonText: 'Request Demo',
    collectMetadata: true,
  },
  successMessage: 'Thanks! Our team will reach out within 24 hours.',
});

// Add fields
await formService.addField(form.id, {
  type: 'email', label: 'Work Email', required: true,
  contactField: 'email',
});
await formService.addField(form.id, {
  type: 'text', label: 'Full Name', required: true,
  contactField: 'firstName',
});
await formService.addField(form.id, {
  type: 'select', label: 'Company Size', required: true,
  options: [
    { id: '1', label: '1-50', value: '1-50' },
    { id: '2', label: '51-200', value: '51-200' },
    { id: '3', label: '201-1000', value: '201-1000' },
    { id: '4', label: '1000+', value: '1000+' },
  ],
});
await formService.addField(form.id, {
  type: 'textarea', label: 'What are you looking to solve?',
  config: { maxLength: 500 },
});

// Publish the form
await formService.publish(form.id);

// Submit a form response (public endpoint)
const submission = await submissionService.submit(form.id, {
  data: {
    work_email: 'jane@acmecorp.com',
    full_name: 'Jane Doe',
    company_size: '201-1000',
    what_are_you_looking_to_solve: 'Unified customer communication platform',
  },
  metadata: { ipAddress: '192.168.1.1', userAgent: 'Chrome/120' },
});
// Validates fields, checks spam, auto-creates/updates CRM contact,
// triggers webhooks, sends notification emails

// Export submissions to CSV
const csv = await submissionService.exportToCsv(form.id, {
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-31'),
});
```

---

## Module: Support

### Purpose

Full ticketing system with auto-incrementing ticket numbers (YYMM-00001), SLA management with priority-based targets, knowledge base with full-text search, support groups with auto-assignment, ticket merging, satisfaction surveys, and a customer-facing portal.

### Key Features

- **Ticket Lifecycle** — open → pending → on_hold → solved → closed with automatic CSAT on close
- **SLA Engine** — Priority overrides, business hours awareness, escalation chains (notify, reassign, escalate)
- **Knowledge Base** — Categorized articles with public/restricted visibility, helpful/not-helpful voting
- **Support Groups** — Team-based assignment with auto-assign to default assignee
- **Ticket Merging** — Merge duplicates with comment reassignment and audit trail
- **Satisfaction Surveys** — Auto-sent on ticket close with 1-5 star rating and comments
- **Category Hierarchy** — Nested ticket categories with default group assignment
- **Multi-Channel Intake** — Web, email, chat, phone, API, social media sources

### Support Interfaces

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 7: Ticket management with SLA
// ═══════════════════════════════════════════════════════════════════════════════

import { ticketService } from '@mcv/nexus';

// Create a support ticket
const ticket = await ticketService.create({
  subject: 'Cannot access dashboard after password reset',
  description: 'After resetting my password, I keep getting redirected to the login page...',
  priority: 'high',
  type: 'incident',
  contactId: 'contact-uuid',
  channel: 'email',
  tags: ['auth', 'password-reset'],
});

console.log(`Ticket: ${ticket.ticketNumber}`);         // e.g., "2602-00042"
console.log(`SLA first response: ${ticket.firstResponseDue}`);
console.log(`SLA resolution: ${ticket.resolutionDue}`);
console.log(`Assigned to: ${ticket.assigneeId}`);       // auto-assigned via group

// Add an agent reply (public comment)
const { ticket: updated, comment } = await ticketService.addComment(ticket.id, {
  body: 'Hi! I can see the issue in our logs. Can you try clearing your browser cache?',
  isPublic: true,
  via: 'web',
});
// Records first response time for SLA tracking

// Add internal note
await ticketService.addComment(ticket.id, {
  body: 'Known issue from AUTH-1234. Escalate to backend team if cache clear doesn\'t work.',
  isPublic: false,
});

// Merge duplicate tickets
await ticketService.merge(ticket.id, ['dup-ticket-1', 'dup-ticket-2']);
// Moves all comments to target, marks sources as closed with merged_into reference

// Close and trigger CSAT survey
await ticketService.changeStatus(ticket.id, 'solved');
// Auto-sends satisfaction survey to contact
```

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 8: Knowledge base management
// ═══════════════════════════════════════════════════════════════════════════════

import { knowledgeService } from '@mcv/nexus';

// Create a knowledge article
const article = await knowledgeService.create({
  title: 'How to Reset Your Password',
  slug: 'reset-password',
  summary: 'Step-by-step guide to resetting your MCV.ONE password.',
  body: '## Step 1: Navigate to Login Page\n\nClick the "Forgot Password" link...',
  categoryId: 'category-account-uuid',
  isPublic: true,
  metaTitle: 'Password Reset Guide | MCV.ONE Help',
  metaDescription: 'Learn how to reset your password in 3 simple steps.',
});

// Publish the article
await knowledgeService.publish(article.id);

// Track helpfulness
await knowledgeService.recordFeedback(article.id, { helpful: true });
await knowledgeService.recordFeedback(article.id, { helpful: false });
```

---

## Module: Documents

### Purpose

Block-based document editor inspired by Notion/PandaDoc with reusable templates, version history with diff tracking, inline commenting, AI-powered content suggestions, reusable content assets, variable/merge field resolution from CRM data, and concurrent editing locks.

### Key Features

- **Block-Based Editor** — 25+ block types: heading, paragraph, image, table, pricing_table, signature_block, video, columns, callout, code, quote, checklist, embed, variable, product_card, payment_schedule, timeline, comparison_table, FAQ, and more
- **Document Templates** — Category-based (invoice, proposal, estimate, contract, report, custom) with variable definitions
- **Version History** — Every save creates a version with change description and author
- **Inline Comments** — Block-level comments with threading and resolution tracking
- **AI Content Suggestions** — Rewrite, expand, summarize, translate, tone change, grammar with confidence scores
- **Reusable Assets** — Text snippets, images, logos, signatures, clauses, pricing tables, headers, footers
- **Merge Fields** — Variables resolved from CRM contact/deal data (e.g., `{{contact.firstName}}`)
- **Editing Locks** — Pessimistic locking to prevent concurrent edit conflicts
- **Document Lifecycle** — draft → review → approved → published → archived

### DB Schema — Document Editor

```sql
-- From: packages/db/src/schema/document-editor.ts

CREATE TABLE document_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id    UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  category      document_template_category NOT NULL DEFAULT 'custom',
  -- invoice | proposal | estimate | contract | report | custom
  description   TEXT,
  thumbnail_url TEXT,
  blocks        JSONB NOT NULL DEFAULT '[]',         -- DocumentBlock[]
  variables     JSONB DEFAULT '[]',                  -- DocumentVariableDefinition[]
  is_public     BOOLEAN DEFAULT false,
  is_system     BOOLEAN DEFAULT false,
  version       INTEGER NOT NULL DEFAULT 1,
  created_by    UUID,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE documents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id        UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  template_id       UUID REFERENCES document_templates(id) ON DELETE SET NULL,
  parent_type       document_parent_type NOT NULL DEFAULT 'standalone',
  -- invoice | proposal | estimate | standalone
  parent_id         UUID,                            -- links to parent entity
  title             TEXT NOT NULL,
  status            document_status NOT NULL DEFAULT 'draft',
  -- draft | review | approved | published | archived
  blocks            JSONB NOT NULL DEFAULT '[]',     -- DocumentBlock[]
  variables         JSONB DEFAULT '{}',              -- resolved variable values
  collaborators     JSONB DEFAULT '[]',              -- DocumentCollaborator[]
  locked_by         UUID,                            -- editing lock
  locked_at         TIMESTAMPTZ,
  version           INTEGER NOT NULL DEFAULT 1,
  published_version INTEGER,
  published_at      TIMESTAMPTZ,
  metadata          JSONB,
  created_by        UUID,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE document_versions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id        UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version            INTEGER NOT NULL,
  blocks             JSONB NOT NULL,                 -- full snapshot
  changed_by         UUID,
  change_description TEXT,
  created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE document_comments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id       UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  block_id          TEXT,                            -- specific block reference
  user_id           UUID NOT NULL,
  content           TEXT NOT NULL,
  resolved_at       TIMESTAMPTZ,
  resolved_by       UUID,
  parent_comment_id UUID,                            -- threading
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE document_assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id  UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        document_asset_type NOT NULL,
  -- text_snippet | image | logo | signature | clause | pricing_table | header | footer
  content     JSONB NOT NULL,
  tags        TEXT[] DEFAULT '{}',
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_by  UUID,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ai_content_suggestions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id       UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  block_id          TEXT NOT NULL,
  suggestion_type   ai_suggestion_type NOT NULL,
  -- rewrite | expand | summarize | translate | tone_change | grammar
  original_content  TEXT NOT NULL,
  suggested_content TEXT NOT NULL,
  status            ai_suggestion_status NOT NULL DEFAULT 'pending',
  -- pending | accepted | rejected | expired
  confidence        NUMERIC(5,4),
  created_at        TIMESTAMPTZ DEFAULT now(),
  responded_at      TIMESTAMPTZ
);
```

### Documents Interfaces

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 9: Document editor and version management
// ═══════════════════════════════════════════════════════════════════════════════

import { documentService } from '@mcv/nexus';

// Upload a document
const doc = await documentService.upload(
  {
    name: 'Q1 Sales Proposal - Acme Corp',
    description: 'Enterprise license proposal',
    folderId: 'folder-proposals-uuid',
    tags: ['proposal', 'enterprise', 'acme'],
  },
  proposalFile // File object
);

// Upload a new version
const newVersion = await documentService.uploadVersion(
  doc.id,
  revisedProposalFile,
  'Updated pricing per client feedback'
);

// Create a share link (password-protected, expires in 7 days)
const { share, url } = await documentService.createShare(doc.id, {
  shareType: 'link',
  permission: 'view',
  allowDownload: true,
  allowPrint: false,
  password: 'secure123',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
});

console.log(`Share URL: ${url}`);
// → https://app.mcv.one/share/abc123def456...

// Access shared document (public endpoint)
const { document, share: shareInfo } = await documentService.accessShared(
  'abc123def456...',
  'secure123'
);
// Records access in document_access table, increments access count

// Browse folder contents
const contents = await documentService.getFolderContents('folder-uuid');
console.log(`${contents.folders.length} subfolders, ${contents.documents.length} documents`);
```

---

## Module: Sign

### Purpose

Electronic signature workflows with templates, multi-signer support, signing order enforcement, and comprehensive audit trails for legal compliance. Integrates tightly with the Documents module for proposal and contract signing.

### Key Features

- **Signature Requests** — Create requests from documents or templates with multiple signers
- **Multi-Signer Workflow** — Sequential or parallel signing with order enforcement
- **Signature Fields** — Drag-and-drop placement of signature, initial, date, text fields on documents
- **Audit Trail** — Every action logged: created, viewed, signed, declined, voided, expired
- **PDF Generation** — Final signed document rendered as PDF with embedded signatures
- **Templates** — Reusable signing templates with pre-configured field placements
- **Reminders** — Automated email/SMS reminders for pending signatures
- **Legal Compliance** — IP address, timestamp, and device info captured for each signature

### Sign Interfaces

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 10: E-signature workflow
// ═══════════════════════════════════════════════════════════════════════════════

import { signatureService } from '@mcv/nexus';

// Create a signature request
const request = await signatureService.createRequest({
  documentId: 'document-contract-uuid',
  title: 'Service Agreement - Acme Corp',
  message: 'Please review and sign this service agreement.',
  signers: [
    {
      email: 'jane@acmecorp.com',
      name: 'Jane Doe',
      role: 'client',
      order: 1, // sign first
    },
    {
      email: 'john@mcv.one',
      name: 'John Smith',
      role: 'company',
      order: 2, // sign after client
    },
  ],
  fields: [
    { type: 'signature', page: 5, x: 100, y: 600, signerIndex: 0 },
    { type: 'date', page: 5, x: 400, y: 600, signerIndex: 0 },
    { type: 'signature', page: 5, x: 100, y: 700, signerIndex: 1 },
    { type: 'date', page: 5, x: 400, y: 700, signerIndex: 1 },
  ],
  expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
});

// Check signing status
const status = await signatureService.getStatus(request.id);
console.log(`Status: ${status.status}`);              // pending | partial | completed | voided
console.log(`Signed: ${status.signedCount}/${status.totalSigners}`);

// Get audit trail
const audit = await signatureService.getAuditTrail(request.id);
for (const entry of audit) {
  console.log(`[${entry.timestamp}] ${entry.action} by ${entry.actorEmail} from ${entry.ipAddress}`);
}
```

---

## Module: Calendar

### Purpose

Event scheduling with multiple calendar types (personal, round-robin, collective, class, service), customizable booking pages, availability management with overrides, multi-provider sync (Google Calendar, Outlook), round-robin assignment, and automated reminders.

### Key Features

- **Calendar Types** — Personal (1:1), round-robin (team), collective (all-must-attend), class (1-to-many), service (resource-based)
- **Booking Pages** — Public embeddable pages with custom branding, form fields, and redirect
- **Availability** — Per-user weekly schedules with date-specific overrides (blocked days, custom hours)
- **Round-Robin** — Four distribution modes: availability, equal, priority, weighted
- **Appointment Lifecycle** — scheduled → confirmed → completed/cancelled/no_show/rescheduled
- **Reminders** — Email and SMS reminders at configurable intervals
- **Google Calendar Sync** — Two-way sync with encrypted OAuth token storage
- **Attendees** — Multi-attendee appointments with RSVP tracking (pending, accepted, declined)

### DB Schema — Calendar

```sql
-- From: packages/db/src/schema/calendar.ts

CREATE TABLE calendars (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  description     TEXT,
  type            TEXT NOT NULL DEFAULT 'personal',  -- personal | round_robin | collective | class | service
  timezone        TEXT NOT NULL DEFAULT 'UTC',
  team_member_ids JSONB DEFAULT '[]',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  color           TEXT DEFAULT '#3b82f6',
  settings        JSONB NOT NULL,                    -- CalendarSettings
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (venture_id, slug)
);

-- CalendarSettings: { defaultDuration, minNotice, maxAdvance, bufferBefore,
--   bufferAfter, maxPerDay, maxPerSlot, requiresApproval, allowReschedule,
--   allowCancel, cancelDeadline }

CREATE TABLE calendar_availability (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  day_of_week SMALLINT NOT NULL,                     -- 0=Sunday, 6=Saturday
  start_time  TEXT NOT NULL,                         -- HH:mm
  end_time    TEXT NOT NULL,                         -- HH:mm
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE calendar_overrides (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  date        DATE NOT NULL,
  is_blocked  BOOLEAN NOT NULL DEFAULT false,
  start_time  TEXT,                                  -- null if blocked
  end_time    TEXT,                                  -- null if blocked
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE appointments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id         UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  calendar_id        UUID NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  contact_id         UUID REFERENCES contacts(id) ON DELETE SET NULL,
  assigned_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  title              TEXT NOT NULL,
  description        TEXT,
  start_time         TIMESTAMPTZ NOT NULL,
  end_time           TIMESTAMPTZ NOT NULL,
  duration           INTEGER NOT NULL,               -- minutes
  status             TEXT NOT NULL DEFAULT 'scheduled',
  -- scheduled | confirmed | completed | cancelled | no_show | rescheduled
  meeting_location   TEXT,
  meeting_url        TEXT,
  meeting_type       TEXT DEFAULT 'video',            -- in_person | phone | video | custom
  notes              TEXT,
  cancellation_reason TEXT,
  rescheduled_from_id UUID,
  source             TEXT NOT NULL DEFAULT 'manual',  -- booking_page | manual | workflow | api
  custom_fields      JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE appointment_reminders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id  UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,                      -- email | sms
  scheduled_at    TIMESTAMPTZ NOT NULL,
  sent_at         TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'pending',    -- pending | sent | failed
  template_id     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE appointment_attendees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id  UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending',    -- pending | accepted | declined
  responded_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (appointment_id, user_id)
);

CREATE TABLE round_robin_config (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id               UUID NOT NULL REFERENCES calendars(id) ON DELETE CASCADE UNIQUE,
  distribution_mode         TEXT NOT NULL DEFAULT 'availability',
  -- availability | equal | priority | weighted
  weights                   JSONB DEFAULT '{}',       -- userId → weight
  priorities                JSONB DEFAULT '{}',       -- userId → priority
  skip_if_busy              BOOLEAN NOT NULL DEFAULT true,
  reassign_on_decline       BOOLEAN NOT NULL DEFAULT true,
  book_with_assigned_user   BOOLEAN NOT NULL DEFAULT false,
  last_assigned_user_id     UUID,
  assignment_counts         JSONB DEFAULT '{}',       -- userId → count
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE booking_pages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id       UUID NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  venture_id        UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  slug              TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  description       TEXT,
  logo_url          TEXT,
  primary_color     TEXT DEFAULT '#3b82f6',
  background_color  TEXT DEFAULT '#ffffff',
  show_timezone     BOOLEAN NOT NULL DEFAULT true,
  show_avatar       BOOLEAN NOT NULL DEFAULT true,
  custom_css        TEXT,
  form_fields       JSONB DEFAULT '[]',              -- BookingFormField[]
  confirmation_message TEXT,
  redirect_url      TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE google_calendar_sync (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  venture_id            UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  google_account_email  TEXT NOT NULL,
  access_token          TEXT NOT NULL,               -- encrypted
  refresh_token         TEXT NOT NULL,               -- encrypted
  calendar_ids          JSONB DEFAULT '[]',
  sync_enabled          BOOLEAN NOT NULL DEFAULT true,
  last_sync_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, venture_id)
);
```

### Calendar Interfaces

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 11: Calendar and booking page management
// ═══════════════════════════════════════════════════════════════════════════════

import { calendarService, bookingService } from '@mcv/nexus';

// Create a round-robin sales calendar
const calendar = await calendarService.create({
  name: 'Sales Discovery Calls',
  type: 'round_robin',
  timezone: 'America/New_York',
  teamMemberIds: ['user-alice', 'user-bob', 'user-carol'],
  settings: {
    defaultDuration: 30,
    minNotice: 120,          // 2 hours notice
    maxAdvance: 30,          // 30 days ahead
    bufferBefore: 5,
    bufferAfter: 10,
    maxPerDay: 8,
    requiresApproval: false,
    allowReschedule: true,
    allowCancel: true,
    cancelDeadline: 60,      // 1 hour before
  },
});

// Configure round-robin distribution
await calendarService.configureRoundRobin(calendar.id, {
  distributionMode: 'weighted',
  weights: { 'user-alice': 2, 'user-bob': 1, 'user-carol': 1 }, // Alice gets 2x
  skipIfBusy: true,
  reassignOnDecline: true,
});

// Set team availability
await calendarService.setAvailability(calendar.id, 'user-alice', [
  { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }, // Monday
  { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' }, // Tuesday
  { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' }, // Wednesday
  { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' }, // Thursday
  { dayOfWeek: 5, startTime: '09:00', endTime: '12:00' }, // Friday half-day
]);

// Block specific dates
await calendarService.addOverride(calendar.id, 'user-alice', {
  date: '2026-02-16',
  isBlocked: true,
  reason: 'Company offsite',
});

// Create a public booking page
const bookingPage = await bookingService.createPage({
  calendarId: calendar.id,
  slug: 'sales-discovery',
  title: 'Book a Discovery Call',
  description: 'Learn how MCV.ONE can help your business.',
  primaryColor: '#6366f1',
  formFields: [
    { name: 'company', label: 'Company Name', type: 'text', required: true },
    { name: 'role', label: 'Your Role', type: 'select', required: true,
      options: ['C-Suite', 'VP/Director', 'Manager', 'Individual Contributor'] },
  ],
});

console.log(`Booking URL: https://app.mcv.one/book/${bookingPage.slug}`);
```

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 12: Appointment booking and reminder management
// ═══════════════════════════════════════════════════════════════════════════════

import { bookingService } from '@mcv/nexus';

// Book an appointment (public endpoint from booking page)
const appointment = await bookingService.bookAppointment({
  calendarId: 'calendar-uuid',
  contactId: 'contact-uuid',
  startTime: new Date('2026-02-12T14:00:00-05:00'),
  duration: 30,
  meetingType: 'video',
  customFields: { company: 'Acme Corp', role: 'VP/Director' },
  source: 'booking_page',
});
// Round-robin assigns to least-loaded team member, creates Zoom link,
// schedules reminders, syncs to Google Calendar

console.log(`Assigned to: ${appointment.assignedUserId}`);
console.log(`Meeting URL: ${appointment.meetingUrl}`);

// Reschedule
const rescheduled = await bookingService.reschedule(appointment.id, {
  newStartTime: new Date('2026-02-13T10:00:00-05:00'),
  reason: 'Conflict with another meeting',
});
// Creates new appointment linked to original, cancels old reminders, sends new ones

// Cancel
await bookingService.cancel(appointment.id, {
  reason: 'No longer needed',
  notifyContact: true,
});
```

---

## Cross-Module Integration Examples

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 13: Full customer journey — form → contact → deal → call → ticket
// ═══════════════════════════════════════════════════════════════════════════════

import {
  submissionService, contactService, dealService,
  callService, ticketService, conversationService,
} from '@mcv/nexus';

// 1. Lead fills out a form
const submission = await submissionService.submit('demo-request-form', {
  data: {
    email: 'ceo@newcustomer.com',
    name: 'Alex Rivera',
    company: 'NewCustomer Inc',
    budget: '50k-100k',
  },
});
// Contact auto-created: { id: 'contact-alex', lifecycleStage: 'lead' }

// 2. Sales rep qualifies the lead
await contactService.update('contact-alex', {
  lifecycleStage: 'sales_qualified',
  type: 'prospect',
  ownerId: 'sales-rep-uuid',
});

// 3. Create a deal in the pipeline
const deal = await dealService.create({
  name: 'NewCustomer Inc - Platform License',
  pipelineId: 'sales-pipeline',
  stageId: 'stage-discovery',
  amount: '75000',
  contactId: 'contact-alex',
  expectedCloseDate: new Date('2026-06-01'),
});

// 4. Sales rep calls the prospect
const call = await callService.initiateCall({
  fromNumber: '+14155551234',
  toNumber: '+14155559876',
  contactId: 'contact-alex',
  conversationId: deal.conversationId, // linked conversation
});

// 5. After becoming a customer, they file a support ticket
const ticket = await ticketService.create({
  subject: 'Onboarding: need API access',
  contactId: 'contact-alex',
  priority: 'normal',
  type: 'task',
  channel: 'web',
});
```

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 14: Document → Sign → Calendar flow
// ═══════════════════════════════════════════════════════════════════════════════

import { documentService, signatureService, bookingService } from '@mcv/nexus';

// 1. Create a proposal document from template
const proposal = await documentService.createFromTemplate('proposal-template-uuid', {
  title: 'Service Proposal - Acme Corp',
  variables: {
    'company.name': 'Acme Corp',
    'contact.name': 'Jane Doe',
    'pricing.plan': 'Enterprise',
    'pricing.amount': '$50,000/year',
  },
});

// 2. Send for signature
const signRequest = await signatureService.createRequest({
  documentId: proposal.id,
  title: 'Service Agreement',
  signers: [
    { email: 'jane@acmecorp.com', name: 'Jane Doe', role: 'client', order: 1 },
  ],
});

// 3. Once signed, auto-book onboarding call
signatureService.onSigned(signRequest.id, async () => {
  await bookingService.bookAppointment({
    calendarId: 'onboarding-calendar',
    contactId: 'contact-jane-uuid',
    startTime: nextAvailableSlot, // calculated from availability
    duration: 60,
    meetingType: 'video',
    title: 'Onboarding Call - Acme Corp',
    source: 'workflow',
  });
});
```

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 15: Contact center → conversation → support ticket escalation
// ═══════════════════════════════════════════════════════════════════════════════

import { routingService, conversationService, ticketService, slaService } from '@mcv/nexus';

// 1. Inbound WhatsApp message creates conversation
const conversation = await conversationService.create({
  channel: 'whatsapp',
  channelData: { whatsapp: { waId: '14155559999', profileName: 'Jane' } },
  contactId: 'contact-jane-uuid',
  inboxId: 'whatsapp-inbox-uuid',
});

// 2. Route to available agent
const routing = await routingService.routeConversation(
  conversation.id,
  'whatsapp-inbox-uuid'
);

// 3. Agent determines issue needs escalation → create ticket
const ticket = await ticketService.create({
  subject: 'Billing discrepancy on invoice #INV-2026-042',
  description: 'Customer reports being charged twice for February subscription.',
  priority: 'high',
  contactId: 'contact-jane-uuid',
  conversationId: conversation.id, // links ticket to chat history
  channel: 'whatsapp',
  tags: ['billing', 'duplicate-charge'],
});

// 4. SLA clock starts ticking
const sla = await slaService.getSlaStatus(routing.assignment.id);
console.log(`First response due in: ${sla.firstResponse.remaining! / 60000} minutes`);
```

---

## Performance Considerations

### Latency Targets

| Operation | Target | P99 |
|-----------|--------|-----|
| Contact lookup by ID | < 5ms | < 15ms |
| Contact search (paginated) | < 50ms | < 200ms |
| Deal pipeline view | < 30ms | < 100ms |
| Conversation message send | < 100ms | < 300ms |
| Form submission | < 50ms | < 150ms |
| Calendar slot availability | < 30ms | < 100ms |
| Ticket creation with SLA | < 50ms | < 150ms |
| Document upload (10MB) | < 2s | < 5s |
| Call webhook handling | < 20ms | < 50ms |

### Throughput

| Metric | Small Deployment | Enterprise |
|--------|------------------|------------|
| Contacts per venture | 50,000 | 5,000,000+ |
| Conversations/day | 500 | 50,000+ |
| Form submissions/day | 1,000 | 100,000+ |
| Calls/day | 200 | 20,000+ |
| Documents per venture | 10,000 | 1,000,000+ |
| Appointments/day | 100 | 10,000+ |

### Optimization Strategies

1. **Index-heavy design** — Every foreign key and common filter combination has a dedicated index
2. **Denormalized counters** — `submissionCount`, `messageCount`, `viewCount` avoid COUNT(*) queries
3. **JSONB for flexibility** — Custom fields, settings, and metadata stored as JSONB with GIN indexes
4. **Materialized paths** — Folder hierarchy uses materialized path (`/parent/child/grandchild`) for efficient tree queries
5. **Cursor-based pagination** — Messages and timelines use `before`/`after` cursors instead of OFFSET
6. **Generated columns** — `fullName` and `weightedAmount` are computed by PostgreSQL, not application code
7. **Async processing** — Webhook triggers, email notifications, and transcription run out-of-band
8. **Connection pooling** — Shared PgBouncer pool across all submodules
9. **Read replicas** — Analytics, search, and reporting queries target read replicas
10. **RLS (Row-Level Security)** — Venture isolation enforced at the database level

---

## Security Considerations

### Multi-Tenancy & Data Isolation

- **Row-Level Security (RLS)**: Every table includes `venture_id` with RLS policies enforcing isolation
- **Context propagation**: `getContext()` provides `venture.id` and `user.id` for every service call
- **No cross-venture queries**: All services filter by `ventureId` in every query

### Data Privacy & GDPR

- **Consent tracking**: Contact records include `consent_given`, `consent_given_at`, `data_retention_exempt`
- **Marketing opt-in/out**: `marketing_opt_in`, `marketing_opt_in_at`, `unsubscribed_at` fields
- **Data export**: Contact timeline and all related records exportable for GDPR Subject Access Requests
- **Right to erasure**: Soft delete with cascade to conversations, deals, tickets, and submissions
- **Data retention**: Configurable per-venture retention policies with `data_retention_exempt` override

### Access Control

- **Permission-based**: Every mutation checks `ctx.hasPermission('resource.action')`
- **Owner-based**: Document edit restricted to owner or users with `documents.edit` permission
- **Share tokens**: Random 32-byte hex tokens for document sharing, not guessable UUIDs
- **Password-protected shares**: bcrypt-hashed passwords for sensitive document links
- **Expiring shares**: Optional expiration dates on document share links

### Credential Security

- **OAuth tokens**: Google Calendar sync tokens stored encrypted at rest
- **Twilio credentials**: Account SID and Auth Token from environment variables, never stored in DB
- **Webhook secrets**: Authentication configs stored in JSONB with masked display in UI
- **API key rotation**: External service keys managed via environment variables with zero-downtime rotation

### Input Validation

- **Form submissions**: Server-side validation mirrors client-side (required, minLength, maxLength, pattern, etc.)
- **Email normalization**: All email addresses lowercased before storage and comparison
- **SQL injection prevention**: Drizzle ORM parameterized queries — no raw SQL concatenation
- **XSS prevention**: Content sanitization on message HTML and document block HTML
- **File upload validation**: MIME type checking, file size limits, virus scanning (via storage layer)

---

## Audit Events

| Event | Category | Description |
|-------|----------|-------------|
| `contact.created` | crm | New contact created |
| `contact.updated` | crm | Contact record modified |
| `contact.merged` | crm | Duplicate contacts merged |
| `contact.deleted` | crm | Contact soft-deleted |
| `organization.created` | crm | New organization created |
| `deal.created` | crm | New deal created in pipeline |
| `deal.stage_changed` | crm | Deal moved to different stage |
| `deal.won` | crm | Deal marked as won |
| `deal.lost` | crm | Deal marked as lost |
| `pipeline.created` | crm | New pipeline created |
| `conversation.created` | messaging | New conversation started |
| `conversation.closed` | messaging | Conversation resolved/closed |
| `message.sent` | messaging | Message sent in conversation |
| `message.failed` | messaging | Message delivery failed |
| `call.initiated` | calls | Outbound call initiated |
| `call.completed` | calls | Call completed |
| `call.recording.ready` | calls | Call recording available |
| `call.transcription.ready` | calls | Call transcription completed |
| `inbox.assignment.created` | contact-center | Conversation assigned to agent |
| `inbox.assignment.reassigned` | contact-center | Conversation transferred |
| `sla.breached` | contact-center | SLA target missed |
| `sla.at_risk` | contact-center | SLA approaching deadline |
| `form.published` | forms | Form published for submissions |
| `form.submission.created` | forms | New form submission received |
| `form.submission.spam` | forms | Submission flagged as spam |
| `form.webhook.triggered` | forms | Webhook dispatched for submission |
| `ticket.created` | support | New support ticket created |
| `ticket.status_changed` | support | Ticket status updated |
| `ticket.assigned` | support | Ticket assigned to agent/group |
| `ticket.merged` | support | Tickets merged together |
| `ticket.sla_breached` | support | Ticket SLA breached |
| `ticket.satisfaction.sent` | support | CSAT survey sent |
| `ticket.satisfaction.received` | support | CSAT rating received |
| `document.uploaded` | documents | New document uploaded |
| `document.version.created` | documents | New document version uploaded |
| `document.shared` | documents | Document share link created |
| `document.accessed` | documents | Shared document accessed |
| `document.comment.created` | documents | Inline comment added |
| `signature.request.created` | sign | Signature request sent |
| `signature.completed` | sign | Document fully signed |
| `signature.declined` | sign | Signer declined to sign |
| `signature.voided` | sign | Signature request voided |
| `appointment.booked` | calendar | Appointment booked |
| `appointment.confirmed` | calendar | Appointment confirmed |
| `appointment.cancelled` | calendar | Appointment cancelled |
| `appointment.rescheduled` | calendar | Appointment rescheduled |
| `appointment.no_show` | calendar | Attendee marked as no-show |
| `appointment.reminder.sent` | calendar | Reminder email/SMS sent |
| `calendar.sync.completed` | calendar | Google Calendar sync completed |
| `calendar.sync.failed` | calendar | Calendar sync failed |

---

## Environment Variables

```bash
# ═══════════════════════════════════════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════════════════════════════════════
DATABASE_URL=postgresql://user:pass@host:5432/mcv      # Primary connection
DATABASE_READ_URL=postgresql://user:pass@replica:5432/mcv # Read replica

# ═══════════════════════════════════════════════════════════════════════════════
# TWILIO (Calls, SMS, WhatsApp)
# ═══════════════════════════════════════════════════════════════════════════════
TWILIO_ACCOUNT_SID=AC...                               # Twilio Account SID
TWILIO_AUTH_TOKEN=xxx                                   # Twilio Auth Token
TWILIO_PHONE_NUMBER=+14155551234                        # Default outbound number
TWILIO_WEBHOOK_URL=https://api.mcv.one/webhooks/twilio  # Status callback URL

# ═══════════════════════════════════════════════════════════════════════════════
# EMAIL (SMTP for conversations, notifications)
# ═══════════════════════════════════════════════════════════════════════════════
SMTP_HOST=smtp.sendgrid.net                             # SMTP host
SMTP_PORT=587                                           # SMTP port
SMTP_USER=apikey                                        # SMTP username
SMTP_PASSWORD=SG.xxx                                    # SMTP password/API key
EMAIL_FROM_NAME=MCV.ONE                                 # Default from name
EMAIL_FROM_ADDRESS=noreply@mcv.one                      # Default from address

# ═══════════════════════════════════════════════════════════════════════════════
# WHATSAPP BUSINESS
# ═══════════════════════════════════════════════════════════════════════════════
WHATSAPP_PHONE_NUMBER_ID=xxx                            # WhatsApp phone number ID
WHATSAPP_BUSINESS_ACCOUNT_ID=xxx                        # Business account ID
WHATSAPP_API_TOKEN=xxx                                  # API token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=xxx                       # Webhook verification

# ═══════════════════════════════════════════════════════════════════════════════
# GOOGLE CALENDAR SYNC
# ═══════════════════════════════════════════════════════════════════════════════
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com         # OAuth client ID
GOOGLE_CLIENT_SECRET=GOCSPX-xxx                         # OAuth client secret
GOOGLE_REDIRECT_URI=https://app.mcv.one/auth/google/callback
GOOGLE_CALENDAR_ENCRYPTION_KEY=xxx                      # Token encryption key (AES-256)

# ═══════════════════════════════════════════════════════════════════════════════
# MICROSOFT / OUTLOOK SYNC
# ═══════════════════════════════════════════════════════════════════════════════
MICROSOFT_CLIENT_ID=xxx                                 # Azure AD app client ID
MICROSOFT_CLIENT_SECRET=xxx                             # Azure AD app client secret
MICROSOFT_TENANT_ID=xxx                                 # Azure AD tenant ID

# ═══════════════════════════════════════════════════════════════════════════════
# STORAGE (Documents, Recordings, Attachments)
# ═══════════════════════════════════════════════════════════════════════════════
STORAGE_PROVIDER=s3                                     # s3 | r2 | local
STORAGE_BUCKET=mcv-nexus-files                          # Bucket name
STORAGE_REGION=us-east-1                                # Bucket region
AWS_ACCESS_KEY_ID=xxx                                   # AWS credentials
AWS_SECRET_ACCESS_KEY=xxx
STORAGE_CDN_URL=https://cdn.mcv.one                     # CDN for public files
STORAGE_MAX_FILE_SIZE=104857600                         # 100MB max upload

# ═══════════════════════════════════════════════════════════════════════════════
# TRANSCRIPTION
# ═══════════════════════════════════════════════════════════════════════════════
GOOGLE_SPEECH_CREDENTIALS=/path/to/credentials.json     # Google Cloud Speech
TRANSCRIPTION_LANGUAGE=en-US                            # Default language

# ═══════════════════════════════════════════════════════════════════════════════
# SEARCH
# ═══════════════════════════════════════════════════════════════════════════════
ELASTICSEARCH_URL=http://localhost:9200                  # Elasticsearch URL
ELASTICSEARCH_INDEX_PREFIX=nexus_                        # Index prefix

# ═══════════════════════════════════════════════════════════════════════════════
# APPLICATION
# ═══════════════════════════════════════════════════════════════════════════════
APP_URL=https://app.mcv.one                             # Public application URL
WEBHOOK_SECRET=xxx                                      # Shared webhook signing secret

# ═══════════════════════════════════════════════════════════════════════════════
# CRON SCHEDULES
# ═══════════════════════════════════════════════════════════════════════════════
SLA_CHECK_INTERVAL_MS=60000                             # SLA breach check interval (1 min)
REMINDER_CHECK_INTERVAL_MS=60000                        # Reminder dispatch interval (1 min)
CALENDAR_SYNC_INTERVAL_MS=300000                        # Calendar sync interval (5 min)
LEAD_SCORE_DECAY_CRON="0 0 * * *"                      # Daily at midnight
FORM_ANALYTICS_CRON="0 */6 * * *"                       # Every 6 hours
```

---

## Error Codes

| Code | HTTP Status | Module | Description |
|------|-------------|--------|-------------|
| `CONTACT_NOT_FOUND` | 404 | crm | Contact ID does not exist |
| `CONTACT_DUPLICATE_EMAIL` | 409 | crm | Email already exists in venture |
| `ORGANIZATION_NOT_FOUND` | 404 | crm | Organization ID does not exist |
| `DEAL_NOT_FOUND` | 404 | crm | Deal ID does not exist |
| `DEAL_INVALID_STAGE` | 400 | crm | Stage does not belong to pipeline |
| `DEAL_NO_WON_STAGE` | 400 | crm | Pipeline has no won stage configured |
| `DEAL_NO_LOST_STAGE` | 400 | crm | Pipeline has no lost stage configured |
| `PIPELINE_NOT_FOUND` | 404 | crm | Pipeline ID does not exist |
| `CONVERSATION_NOT_FOUND` | 404 | conversations | Conversation ID does not exist |
| `MESSAGE_SEND_FAILED` | 500 | conversations | Channel delivery failed |
| `INBOX_NOT_FOUND` | 404 | contact-center | Inbox ID does not exist |
| `QUEUE_NOT_FOUND` | 404 | contact-center | Queue ID does not exist |
| `NO_AGENT_AVAILABLE` | 503 | contact-center | No online agents with capacity |
| `ASSIGNMENT_NOT_FOUND` | 404 | contact-center | Assignment ID does not exist |
| `CALL_INITIATE_FAILED` | 500 | calls | Twilio call creation failed |
| `CALL_NOT_FOUND` | 404 | calls | Call ID does not exist |
| `IVR_MENU_NOT_FOUND` | 404 | calls | IVR menu ID does not exist |
| `FORM_NOT_FOUND` | 404 | forms | Form ID does not exist |
| `FORM_NOT_PUBLISHED` | 400 | forms | Form must be published for submissions |
| `FORM_LIMIT_REACHED` | 429 | forms | Form has reached submission limit |
| `FORM_DEADLINE_PASSED` | 400 | forms | Form submission deadline has passed |
| `FORM_NO_FIELDS` | 400 | forms | Form must have at least one field to publish |
| `FORM_SLUG_CONFLICT` | 409 | forms | Form slug already exists in venture |
| `SUBMISSION_VALIDATION_FAILED` | 400 | forms | One or more fields failed validation |
| `SUBMISSION_SPAM_DETECTED` | 400 | forms | Submission flagged as spam |
| `TICKET_NOT_FOUND` | 404 | support | Ticket ID does not exist |
| `TICKET_ALREADY_CLOSED` | 400 | support | Cannot modify a closed ticket |
| `SLA_POLICY_NOT_FOUND` | 404 | support | SLA policy ID does not exist |
| `ARTICLE_NOT_FOUND` | 404 | support | Knowledge article ID does not exist |
| `DOCUMENT_NOT_FOUND` | 404 | documents | Document ID does not exist |
| `DOCUMENT_LOCKED` | 423 | documents | Document is locked for editing by another user |
| `DOCUMENT_VERSION_CONFLICT` | 409 | documents | Version conflict — reload and retry |
| `FOLDER_NOT_FOUND` | 404 | documents | Folder ID does not exist |
| `SHARE_NOT_FOUND` | 404 | documents | Share token does not exist |
| `SHARE_EXPIRED` | 401 | documents | Share link has expired |
| `SHARE_PASSWORD_REQUIRED` | 401 | documents | Password required for this share |
| `SHARE_PASSWORD_INVALID` | 401 | documents | Incorrect share password |
| `SIGNATURE_REQUEST_NOT_FOUND` | 404 | sign | Signature request ID does not exist |
| `SIGNATURE_ALREADY_COMPLETED` | 400 | sign | All signers have already signed |
| `SIGNATURE_EXPIRED` | 400 | sign | Signature request has expired |
| `CALENDAR_NOT_FOUND` | 404 | calendar | Calendar ID does not exist |
| `APPOINTMENT_NOT_FOUND` | 404 | calendar | Appointment ID does not exist |
| `SLOT_UNAVAILABLE` | 409 | calendar | Selected time slot is no longer available |
| `BOOKING_PAGE_NOT_FOUND` | 404 | calendar | Booking page slug does not exist |
| `CANCEL_DEADLINE_PASSED` | 400 | calendar | Cannot cancel within cancel deadline |
| `CALENDAR_SYNC_FAILED` | 500 | calendar | Google/Outlook calendar sync failed |
| `UNAUTHORIZED` | 401 | auth | Missing or invalid authentication |
| `FORBIDDEN` | 403 | auth | Insufficient permissions for this operation |
| `VENTURE_ISOLATION` | 403 | auth | Attempted cross-venture data access |

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/kernel` | Core utilities, database, context, base columns, error classes |
| `@mcv/comms` | Email sending (SMTP), SMS (Twilio), push notifications, WhatsApp Business API |
| `@mcv/storage` | File storage abstraction (S3, R2, local) for documents and recordings |
| `@mcv/search` | Full-text search (Elasticsearch) for contacts, tickets, articles |
| `@mcv/realtime` | WebSocket server for live chat, agent presence, typing indicators |
| `@mcv/auth` | Authentication, RBAC permissions, RLS policy enforcement |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | ^0.29.x | Database ORM with typed queries and relations |
| `twilio` | ^4.x | Phone calls, SMS, WhatsApp, call recording |
| `@google-cloud/speech` | ^6.x | Call transcription (speech-to-text) |
| `google-auth-library` | ^9.x | Google Calendar OAuth and sync |
| `@microsoft/microsoft-graph-client` | ^3.x | Outlook/Microsoft 365 calendar sync |
| `pdf-lib` | ^1.x | PDF manipulation for signed documents |
| `bcrypt` | ^5.x | Password hashing for document share links |
| `nanoid` | ^5.x | Short unique IDs for slugs and tokens |
| `zod` | ^3.x | Runtime validation for form submissions and API inputs |
| `ioredis` | ^5.x | Caching, rate limiting, real-time agent status |
| `eventsource-parser` | ^1.x | SSE parsing for real-time updates |

---

## Testing Notes

### Unit Testing

```typescript
import { contactService, dealService, formService, submissionService } from '@mcv/nexus';

describe('ContactService', () => {
  it('should create contact with auto-generated fullName', async () => {
    const contact = await contactService.create({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@test.com',
    });

    expect(contact.fullName).toBe('Jane Doe');
    expect(contact.email).toBe('jane@test.com'); // lowercased
    expect(contact.status).toBe('active');
  });

  it('should reject duplicate emails within same venture', async () => {
    await contactService.create({ email: 'dup@test.com' });

    await expect(
      contactService.create({ email: 'DUP@test.com' }) // case-insensitive
    ).rejects.toThrow('Contact with this email already exists');
  });

  it('should merge contacts and reassign related records', async () => {
    const merged = await contactService.merge('primary-id', ['dup-1', 'dup-2']);

    // Deals, activities, conversations, tickets all moved to primary
    const deals = await db.query.deals.findMany({
      where: eq(deals.contactId, 'primary-id'),
    });
    expect(deals.length).toBeGreaterThan(0);
  });
});

describe('FormService', () => {
  it('should reject publish of form with no fields', async () => {
    const form = await formService.create({ name: 'Empty Form' });

    await expect(
      formService.publish(form.id)
    ).rejects.toThrow('Form must have at least one field');
  });

  it('should detect spam submissions', async () => {
    const submission = await submissionService.submit('form-id', {
      data: { _honeypot: 'gotcha', email: 'bot@spam.com' },
      startedAt: new Date(Date.now() - 1000).toISOString(), // 1s = too fast
    });

    expect(submission.status).toBe('spam');
  });
});

describe('DealService', () => {
  it('should auto-update probability on stage change', async () => {
    const deal = await dealService.create({
      name: 'Test Deal',
      pipelineId: 'pipeline-id',
      stageId: 'stage-discovery', // probability = 20
      amount: '10000',
    });

    expect(deal.probability).toBe(20);

    const updated = await dealService.moveToStage(deal.id, 'stage-proposal'); // probability = 60
    expect(updated.probability).toBe(60);
  });

  it('should mark deal as won and set close date', async () => {
    const won = await dealService.win('deal-id', { notes: 'Signed!' });

    expect(won.status).toBe('won');
    expect(won.probability).toBe(100);
    expect(won.actualCloseDate).toBeTruthy();
  });
});
```

### Integration Testing

```typescript
describe('Nexus E2E: Form → Contact → Deal', () => {
  it('should create contact from form submission and link to deal', async () => {
    // Submit form with contact field mappings
    const submission = await submissionService.submit('lead-form', {
      data: {
        email: 'e2e@test.com',
        first_name: 'E2E',
        last_name: 'Test',
        company: 'Test Corp',
      },
    });

    // Contact should be auto-created
    const contact = await contactService.search({ query: 'e2e@test.com' });
    expect(contact.data).toHaveLength(1);
    expect(contact.data[0].firstName).toBe('E2E');

    // Create a deal linked to the contact
    const deal = await dealService.create({
      name: 'Test Deal',
      pipelineId: 'pipeline-uuid',
      stageId: 'stage-uuid',
      contactId: contact.data[0].id,
      amount: '5000',
    });

    expect(deal.contactId).toBe(contact.data[0].id);
  });
});

describe('Nexus E2E: Conversation → Ticket Escalation', () => {
  it('should link ticket to conversation for context', async () => {
    const conversation = await conversationService.create({
      channel: 'chat',
      contactId: 'contact-uuid',
      inboxId: 'inbox-uuid',
    });

    const ticket = await ticketService.create({
      subject: 'Needs escalation',
      contactId: 'contact-uuid',
      conversationId: conversation.id,
      channel: 'chat',
    });

    expect(ticket.conversationId).toBe(conversation.id);

    // Agent can see full chat history from ticket view
    const ticketDetails = await ticketService.getWithComments(ticket.id);
    expect(ticketDetails.conversationId).toBeTruthy();
  });
});

describe('Nexus E2E: Calendar Booking', () => {
  it('should round-robin assign and create appointment', async () => {
    const appointment = await bookingService.bookAppointment({
      calendarId: 'rr-calendar',
      contactId: 'contact-uuid',
      startTime: new Date('2026-03-01T10:00:00Z'),
      duration: 30,
      source: 'booking_page',
    });

    expect(appointment.assignedUserId).toBeTruthy();
    expect(appointment.status).toBe('scheduled');
    expect(appointment.duration).toBe(30);
  });
});
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
- [01-PACKAGE-SPEC.md](./01-PACKAGE-SPEC.md) — Full package specification

---

*@mcv/nexus — The Customer Relationship & Communication Hub*