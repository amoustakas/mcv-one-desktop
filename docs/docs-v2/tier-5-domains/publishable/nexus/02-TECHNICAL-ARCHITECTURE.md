# @mcv/nexus — Technical Architecture

## Tier 5: Domain Packages (Publishable)

**Package:** `@mcv/nexus`  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Diagram](#system-diagram)
3. [Module Architecture](#module-architecture)
   - [Calendar](#calendar--scheduling-and-availability)
   - [Calls](#calls--voip-and-call-management)
   - [Contact Center](#contact-center--omnichannel-contact-center)
   - [Conversations](#conversations--unified-messagingchat)
   - [CRM](#crm--lightweight-crm-within-nexus)
   - [Documents](#documents--document-management-and-collaboration)
   - [Forms](#forms--form-builder-and-submissions)
   - [Sign](#sign--electronic-signatures)
   - [Support](#support--helpdesk-and-ticket-management)
4. [Data Models (Drizzle ORM)](#data-models-drizzle-orm)
5. [Data Flow & Events](#data-flow--events)
6. [Integration Points](#integration-points)
7. [Performance](#performance)
8. [Scalability](#scalability)
9. [Error Handling](#error-handling)
10. [Observability](#observability)
11. [Security](#security)

---

## Architecture Overview

`@mcv/nexus` is the **unified customer relationship and communication hub** for MCV.ONE — a Tier 5 publishable domain that orchestrates the entire customer lifecycle across nine tightly integrated submodules. It is a **composite domain**, meaning it spans multiple feature packages unified under one cohesive namespace rather than existing as a single package directory.

### Core Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Venture Isolation** | Every table carries `venture_id` with Row-Level Security (RLS) policies; no cross-venture queries are possible at the database level |
| **Event-Driven** | All state transitions emit domain events via Redpanda/Kafka for downstream consumers, audit logging, and cross-module orchestration |
| **Service-Oriented** | Each submodule exposes a well-defined service layer with typed inputs/outputs validated by Zod schemas |
| **CQRS-Lite** | Write operations target the primary PostgreSQL instance; analytics, search, and reporting queries are routed to read replicas |
| **Context Propagation** | Every service method receives execution context (`ventureId`, `userId`, `permissions`) from the `@mcv/kernel` context system |
| **Multi-Tenancy First** | All schemas, indexes, and queries are designed for multi-tenant workloads from day one, not bolted on after the fact |
| **Progressive Enhancement** | Submodules can be enabled/disabled per venture; unused modules incur zero runtime cost |

### Architectural Layers

Nexus is organized into three primary horizontal layers, plus a cross-cutting concerns layer:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               CLIENT LAYER (React)                                   │
│                                                                                      │
│  Hooks: useContacts, useDeals, useInbox, useConversation, useCalendar, etc.          │
│  Components: ContactCard, DealBoard, ChatWindow, CallDialer, FormRenderer, etc.      │
│  State: TanStack Query (server state) + Zustand (UI state)                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                              SERVICE LAYER (TypeScript)                               │
│                                                                                      │
│  Services: ContactService, DealService, RoutingService, ConversationService, etc.    │
│  Validation: Zod schemas for all inputs/outputs                                      │
│  Authorization: Permission checks via ctx.hasPermission()                             │
│  Context: ventureId + userId propagated to every query                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                               DATA LAYER (Drizzle ORM)                               │
│                                                                                      │
│  ORM: Drizzle with typed schemas, relations, and generated columns                   │
│  Database: Supabase/PostgreSQL with RLS                                              │
│  Cache: Redis/Dragonfly for hot paths (agent status, availability, sessions)         │
│  Search: Elasticsearch for full-text (contacts, tickets, articles)                   │
│  Storage: S3/R2 for files (documents, recordings, attachments)                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                            CROSS-CUTTING CONCERNS                                    │
│                                                                                      │
│  Multi-Tenancy (ventureId) │ RLS Policies │ Custom Fields │ Audit Logging            │
│  GDPR/Privacy Compliance   │ Webhook Events │ Search Indexing │ File Storage          │
│  Error Handling            │ Observability │ Rate Limiting  │ Background Jobs         │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Next.js 15 (App Router) | Server components, API routes, RSC streaming |
| **Build** | Turborepo | Monorepo build orchestration, caching |
| **Database** | Supabase/PostgreSQL 15+ | Primary data store with RLS |
| **ORM** | Drizzle ORM | Type-safe queries, schema migrations, relations |
| **Validation** | Zod | Runtime schema validation for all inputs/outputs |
| **Events** | Redpanda/Kafka | Domain event streaming, async processing |
| **Cache** | Redis/Dragonfly | Session cache, agent status, rate limiting |
| **Search** | Elasticsearch | Full-text search across contacts, tickets, articles |
| **Storage** | S3/R2/Local | File storage for documents, recordings, attachments |
| **AI** | OpenRouter | AI-powered routing, deal scoring, content suggestions |
| **VoIP** | Twilio | Phone calls, SMS, WhatsApp, call recording |
| **Realtime** | WebSocket (fabric/realtime) | Live chat, typing indicators, agent presence |

---

## System Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                    @mcv/nexus                                             │
│                       Customer Relationship & Communication Hub                           │
│                                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              CRM LAYER                                            │    │
│  │                                                                                   │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │    │
│  │  │   Contacts    │  │ Organizations│  │    Deals     │  │  Pipelines   │         │    │
│  │  │              │  │              │  │              │  │              │         │    │
│  │  │  People      │  │  Companies   │  │  Kanban      │  │  Stages     │         │    │
│  │  │  Scoring     │  │  Hierarchy   │  │  Forecasts   │  │  Automation │         │    │
│  │  │  Lifecycle   │  │  Revenue     │  │  Velocity    │  │  Rotting    │         │    │
│  │  │  Merge       │  │  Health      │  │  AI Score    │  │  Templates  │         │    │
│  │  │  GDPR        │  │  Risk        │  │  Won/Lost    │  │  Views      │         │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘         │    │
│  │         │                 │                 │                 │                   │    │
│  │         └─────────────────┴─────────────────┴─────────────────┘                   │    │
│  │                                    │                                              │    │
│  │                           Activities + Custom Objects                             │    │
│  └──────────────────────────────────────────────────────────────────────────────────┘    │
│                                       │                                                   │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐    │
│  │                         COMMUNICATION LAYER                                       │    │
│  │                                                                                   │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │    │
│  │  │   Contact     │  │ Conversations│  │    Calls     │  │   Support    │         │    │
│  │  │   Center      │  │              │  │              │  │              │         │    │
│  │  │  Inbox        │  │  Threading   │  │  VoIP        │  │  Tickets     │         │    │
│  │  │  Queues       │  │  Multi-ch    │  │  Recording   │  │  SLA         │         │    │
│  │  │  Routing      │  │  Messages    │  │  IVR         │  │  Knowledge   │         │    │
│  │  │  Agents       │  │  Channels    │  │  Transcribe  │  │  Portal      │         │    │
│  │  │  SLA Track    │  │  Snooze      │  │  Analytics   │  │  CSAT        │         │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘         │    │
│  └──────────────────────────────────────────────────────────────────────────────────┘    │
│                                       │                                                   │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐    │
│  │                      CONTENT & SCHEDULING LAYER                                   │    │
│  │                                                                                   │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │    │
│  │  │    Forms      │  │  Documents   │  │     Sign     │  │   Calendar   │         │    │
│  │  │              │  │              │  │              │  │              │         │    │
│  │  │  Builder      │  │  Editor      │  │  E-Sign      │  │  Events      │         │    │
│  │  │  Fields       │  │  Templates   │  │  Templates   │  │  Booking     │         │    │
│  │  │  Submissions  │  │  Versions    │  │  Audit       │  │  Round Robin │         │    │
│  │  │  Webhooks     │  │  Sharing     │  │  Workflows   │  │  Google Sync │         │    │
│  │  │  Analytics    │  │  AI Suggest  │  │  PDF Gen     │  │  Reminders   │         │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘         │    │
│  └──────────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                           │
│                               CROSS-CUTTING CONCERNS                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐    │
│  │  Multi-tenancy (ventureId)  │  RLS Policies  │  Custom Fields  │  Audit Logging  │    │
│  │  GDPR/Privacy Compliance    │  Webhook Events │  Search Indexing │  File Storage  │    │
│  └──────────────────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────────────────┘
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
              │@mcv/realtime│       │ @mcv/auth   │       │ @mcv/kernel │
              │             │       │             │       │             │
              │ WebSocket   │       │ Permissions │       │ DB, Context │
              │ Live updates│       │ RLS, RBAC   │       │ Base cols   │
              └─────────────┘       └─────────────┘       └─────────────┘
```

### Request Flow Architecture

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │                     CLIENT REQUEST                           │
                    │                                                              │
                    │  1. Next.js API Route / Server Action receives request       │
                    │  2. @mcv/auth validates JWT, extracts user + venture         │
                    │  3. @mcv/kernel.getContext() builds execution context        │
                    │  4. Zod schema validates input payload                       │
                    │  5. Service method executes business logic                   │
                    │  6. Drizzle ORM queries with ventureId RLS                   │
                    │  7. Domain event emitted to Redpanda                         │
                    │  8. Response returned with typed output                      │
                    └─────────────────────────────────────────────────────────────┘

    ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
    │  Client  │────▶│  Auth    │────▶│ Context  │────▶│ Service  │────▶│ Database │
    │  (React) │     │  Layer   │     │  Layer   │     │  Layer   │     │  Layer   │
    │          │◀────│          │◀────│          │◀────│          │◀────│          │
    └──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                              │
                                                              ▼
                                                       ┌──────────┐
                                                       │  Events  │
                                                       │ (Redpanda│
                                                       │  /Kafka) │
                                                       └──────────┘
                                                              │
                                              ┌───────────────┼───────────────┐
                                              ▼               ▼               ▼
                                       ┌──────────┐   ┌──────────┐   ┌──────────┐
                                       │  Audit   │   │  Search  │   │ Webhooks │
                                       │  Logger  │   │  Indexer │   │ Dispatch │
                                       └──────────┘   └──────────┘   └──────────┘
```

---

## Module Architecture

### Calendar — Scheduling and Availability

#### Overview

The Calendar submodule provides full event scheduling with multiple calendar types (personal, round-robin, collective, class, service), customizable booking pages, availability management with date-specific overrides, multi-provider sync (Google Calendar, Outlook), round-robin agent assignment, and automated reminders via email and SMS.

#### Internal Structure

```
calendar/
├── services/
│   ├── calendar.service.ts          # Calendar CRUD, availability, overrides
│   └── booking.service.ts           # Booking pages, appointment lifecycle
├── client/
│   ├── hooks/
│   │   ├── use-calendar.ts          # Calendar state & event management
│   │   └── use-booking-page.ts      # Public booking page interaction
│   └── components/
│       ├── calendar-widget.tsx       # Embeddable calendar view
│       └── booking-page-embed.tsx    # Public booking page component
├── schemas/
│   ├── calendar.ts                  # Drizzle: calendars table
│   ├── appointment.ts               # Drizzle: appointments table
│   ├── availability.ts              # Drizzle: calendar_availability, overrides
│   ├── booking-page.ts              # Drizzle: booking_pages table
│   ├── round-robin.ts               # Drizzle: round_robin_config table
│   ├── reminder.ts                  # Drizzle: appointment_reminders table
│   ├── attendee.ts                  # Drizzle: appointment_attendees table
│   └── google-sync.ts              # Drizzle: google_calendar_sync table
├── types/
│   └── index.ts                     # CalendarEvent, BookingPage, Availability, etc.
├── validators/
│   └── index.ts                     # Zod schemas for all calendar inputs
└── constants.ts                     # CALENDAR_TYPES, APPOINTMENT_STATUSES
```

#### Key Design Decisions

- **Calendar Types as Strategy Pattern**: Each calendar type (personal, round_robin, collective, class, service) implements a `CalendarStrategy` interface that controls how slots are computed and assignments are made. This allows adding new calendar types without modifying existing code.
- **Availability Resolution Pipeline**: Slot computation follows a pipeline: base weekly availability → date-specific overrides → existing appointments → buffer times → minimum notice → maximum advance. Each step narrows available slots.
- **Round-Robin State Machine**: The round-robin configuration tracks `assignment_counts` and `last_assigned_user_id` in a JSONB column, updated atomically via PostgreSQL's `jsonb_set()` to prevent race conditions.
- **Google Calendar Sync**: OAuth tokens are stored encrypted at rest using AES-256 with the `GOOGLE_CALENDAR_ENCRYPTION_KEY` environment variable. Sync runs bidirectionally every 5 minutes via a background job, with conflict resolution favoring the most recently updated event.
- **Reminder Scheduling**: When an appointment is booked, reminder records are pre-created in the `appointment_reminders` table with `scheduled_at` timestamps. A cron job polls for due reminders every 60 seconds and dispatches them via `@mcv/comms`.

#### Data Flow

```
Booking Request → Validate Slot → Check Availability Pipeline → Round-Robin Assignment
       │                                                               │
       ▼                                                               ▼
  Create Appointment ──→ Schedule Reminders ──→ Sync to Google Calendar
       │
       ▼
  Emit: appointment.booked ──→ Notify Agent ──→ Send Confirmation Email
```

---

### Calls — VoIP and Call Management

#### Overview

The Calls submodule provides Twilio-powered VoIP integration supporting both inbound and outbound calls with full lifecycle webhook handling, automatic recording, speech-to-text transcription, IVR (Interactive Voice Response) menus, call analytics with time-series breakdowns, disposition tracking, and per-call cost monitoring.

#### Internal Structure

```
calls/
├── services/
│   ├── call.service.ts              # Call initiation, webhook handling, analytics
│   └── ivr.service.ts               # IVR menu builder and TwiML generation
├── client/
│   ├── hooks/
│   │   ├── use-call-controls.ts     # WebRTC call controls (mute, hold, transfer)
│   │   └── use-call-analytics.ts    # Real-time call analytics dashboard
│   └── components/
│       └── call-dialer.tsx          # Softphone dialer component
├── schemas/
│   ├── call.ts                      # Drizzle: calls table
│   ├── call-recording.ts           # Drizzle: call_recordings table
│   └── ivr-menu.ts                  # Drizzle: ivr_menus table
├── webhooks/
│   ├── twilio-status.ts            # Status callback handler
│   ├── twilio-recording.ts         # Recording ready callback
│   └── twilio-transcription.ts     # Transcription callback
├── types/
│   └── index.ts                     # Call, CreateCallInput, CallRecording, etc.
├── validators/
│   └── index.ts                     # Zod schemas for call inputs
└── constants.ts                     # CALL_STATUSES, CALL_DIRECTIONS
```

#### Key Design Decisions

- **Twilio SID as Correlation Key**: Every call record stores the Twilio `call_sid` with a dedicated index for O(1) lookup during webhook processing. Webhooks arrive asynchronously and must resolve to the correct call record within the 20ms P99 target.
- **IVR as TwiML Generation**: IVR menus are stored as JSON trees in the database and compiled to TwiML (Twilio Markup Language) at request time. This allows runtime editing of IVR flows without code deployment.
- **Recording Lifecycle**: Recordings are initially stored by Twilio. When the `recording.ready` webhook fires, the recording URL is saved to the call record and an async job downloads the audio to `@mcv/storage` (S3/R2) for long-term retention, then deletes the Twilio-hosted copy.
- **Transcription Pipeline**: Transcription runs asynchronously after recording completes. If Twilio transcription is enabled, it arrives via webhook. For higher accuracy, the system can use Google Cloud Speech-to-Text as a fallback. The transcript is stored directly on the call record for fast access.
- **Cost Tracking**: Each call record includes a `cost` field populated from Twilio's price webhooks. This enables per-venture, per-agent, and per-campaign cost reporting.

#### Data Flow

```
Outbound Call:
  initiateCall() → Create DB Record → Twilio REST API → Status Webhook Updates
                                              │
                                              ▼
                                     Recording Webhook → Download to S3
                                              │
                                              ▼
                                     Transcription Webhook → Store Text

Inbound Call:
  Twilio Webhook → Lookup Contact by Phone → Create DB Record → Generate IVR TwiML
                                                                        │
                                                                        ▼
                                                               Route to Agent Queue
                                                                        │
                                                                        ▼
                                                               Create Conversation
```

---

### Contact Center — Omnichannel Contact Center

#### Overview

The Contact Center submodule provides omnichannel inbox management with intelligent agent routing (round-robin, skills-based, least-busy, priority), real-time agent presence tracking, SLA management with escalation chains, predictive dialer campaigns (power, predictive, preview), supervisor monitoring (silent/whisper/barge), CSAT surveys, per-channel configuration, and call scripts with branching logic.

#### Internal Structure

```
contact-center/
├── services/
│   ├── routing.service.ts           # Conversation routing, assignment logic
│   ├── sla.service.ts               # SLA tracking, breach detection, metrics
│   └── agent.service.ts             # Agent presence, capacity, session management
├── client/
│   ├── hooks/
│   │   ├── use-inbox.ts             # Inbox state, assignment tracking
│   │   ├── use-agent-session.ts     # Agent login/logout, status changes
│   │   └── use-sla-status.ts        # Real-time SLA countdown
│   └── components/
│       └── inbox-panel.tsx          # Unified inbox component
├── schemas/
│   ├── agent-status.ts              # Drizzle: agent_status table
│   ├── dialer-campaign.ts          # Drizzle: dialer_campaigns, dialer_queue_entries
│   ├── sla-policy.ts               # Drizzle: sla_policies table
│   ├── channel-config.ts           # Drizzle: channel_configs table
│   ├── call-script.ts              # Drizzle: call_scripts table
│   ├── call-disposition.ts         # Drizzle: call_dispositions table
│   ├── csat-survey.ts              # Drizzle: csat_surveys table
│   └── supervisor-session.ts       # Drizzle: supervisor_sessions table
├── routing/
│   ├── round-robin.strategy.ts     # Round-robin distribution
│   ├── skills-based.strategy.ts    # Skills-based matching
│   ├── least-busy.strategy.ts      # Least-busy agent selection
│   └── priority.strategy.ts        # Priority-weighted routing
├── types/
│   └── index.ts                     # Inbox, Queue, AgentSession, RoutingResult, etc.
├── validators/
│   └── index.ts                     # Zod schemas
└── constants.ts                     # AGENT_STATUSES, ROUTING_METHODS, CHANNELS
```

#### Key Design Decisions

- **Routing Strategy Pattern**: Each routing method (round_robin, skills_based, least_busy, priority) is implemented as a strategy class that implements `RoutingStrategy.findAgent(conversation, availableAgents): Agent | null`. The `RoutingService` reads the `routing_method` from `channel_configs` and delegates to the appropriate strategy.
- **Agent Status in Redis**: While `agent_status` has a PostgreSQL backing table for persistence, the real-time status is cached in Redis with a 30-second TTL. Agent heartbeats refresh the TTL. If an agent's heartbeat stops (browser crash, network disconnect), the TTL expires and the agent is auto-marked offline.
- **SLA Clock with Business Hours**: SLA timers account for business hours defined in `channel_configs.business_hours`. The clock pauses outside business hours and resumes when business hours begin. Escalation chains support three actions: `notify` (send alert), `reassign` (move to another agent/group), and `escalate` (bump priority and notify supervisor).
- **Predictive Dialer**: The predictive dialer uses a feedback loop: it monitors `abandon_rate_target` and dynamically adjusts `dial_ratio` to maintain the target. More agents available → higher dial ratio → more simultaneous calls. The algorithm runs as a background job polling every 5 seconds.
- **Supervisor Monitoring**: Supervisors can join an active call in three modes: `silent_monitor` (listen only), `whisper` (agent hears, customer doesn't), and `barge` (all parties hear). This is implemented via Twilio's Conference API with coaching capabilities.

#### Data Flow

```
New Conversation Arrives → Determine Channel → Load Channel Config
       │
       ▼
  Check Auto-Assign Enabled? ──No──→ Place in Unassigned Queue
       │
      Yes
       │
       ▼
  Load Available Agents (status = 'available', capacity > 0)
       │
       ▼
  Apply Routing Strategy (round_robin | skills_based | least_busy | priority)
       │
       ├── Agent Found → Create Assignment → Start SLA Clock → Notify Agent
       │
       └── No Agent → Queue Conversation → Set Queue Position → Monitor Wait Time
```

---

### Conversations — Unified Messaging/Chat

#### Overview

The Conversations submodule provides multi-channel conversation threading that unifies all communication across email, chat, phone, WhatsApp, SMS, Facebook, Instagram, and Slack into a single threaded view. It supports message types (text, HTML, markdown, images, files, audio, video, location, templates), participant tracking with read receipts, private internal notes, automatic channel delivery, SLA integration, and snooze capabilities.

#### Internal Structure

```
conversations/
├── services/
│   └── conversation.service.ts      # CRUD, messaging, read tracking, snooze
├── client/
│   ├── hooks/
│   │   ├── use-conversation.ts      # Conversation state management
│   │   └── use-messages.ts          # Real-time message stream
│   └── components/
│       └── chat-window.tsx          # Unified chat component
├── schemas/
│   ├── conversation.ts              # Drizzle: conversations table
│   ├── message.ts                   # Drizzle: messages table
│   └── participant.ts               # Drizzle: conversation_participants table
├── channels/
│   ├── email.adapter.ts            # SMTP send/receive via @mcv/comms
│   ├── sms.adapter.ts              # Twilio SMS via @mcv/comms
│   ├── whatsapp.adapter.ts         # WhatsApp Business API
│   ├── chat.adapter.ts             # WebSocket live chat via @mcv/realtime
│   └── phone.adapter.ts            # Call-linked conversation notes
├── types/
│   └── index.ts                     # Conversation, Message, Participant, etc.
├── validators/
│   └── index.ts                     # Zod schemas
└── constants.ts                     # CONVERSATION_CHANNELS, MESSAGE_TYPES
```

#### Key Design Decisions

- **Channel Adapter Pattern**: Each communication channel (email, SMS, WhatsApp, chat, phone) implements a `ChannelAdapter` interface with `send(message)` and `receive(webhook)` methods. This allows adding new channels without modifying the core conversation logic.
- **Unified Threading**: Regardless of channel, all messages in a conversation appear in a single chronological thread. Channel-specific metadata (email thread IDs, WhatsApp message IDs, SMS segment info) is stored in the `metadata` JSONB column on both conversations and messages.
- **Read Tracking**: Each `conversation_participant` record tracks `unread_count` and `last_read_message_id`. When `markAsRead()` is called, it resets the unread count and updates the last-read pointer. This avoids expensive COUNT queries for unread badges.
- **Private Notes**: Messages with `is_private = true` are internal notes visible only to agents. The channel adapter skip list ensures private notes are never sent to external channels. The `getMessages()` method accepts `includePrivate` flag controlled by the caller's permission level.
- **Cursor-Based Pagination**: Messages use `before`/`after` cursor pagination based on `created_at` + `id` composite ordering. This provides stable pagination even when new messages arrive, unlike OFFSET-based approaches that shift results.
- **Optimistic Message Delivery**: When an agent sends a message, it's immediately persisted to the database and returned to the UI. Channel delivery (SMTP, Twilio, etc.) happens asynchronously. If delivery fails, a `message.failed` event is emitted and the message status is updated, with a retry mechanism.

#### Data Flow

```
Agent Sends Message → Validate Input → Persist to DB → Return to UI (Optimistic)
       │
       ▼
  Async: Determine Channel → Load Channel Adapter → Send via External Service
       │
       ├── Success → Update message.deliveredAt → Emit message.delivered
       │
       └── Failure → Update message.failedAt → Emit message.failed → Queue Retry

Inbound Message → Channel Webhook → Channel Adapter.receive() → Create Message
       │
       ▼
  Lookup/Create Conversation → Update conversation.lastMessageAt
       │
       ▼
  Increment Unread Counts → Emit message.received → WebSocket Push to Agents
```

---

### CRM — Lightweight CRM Within Nexus

#### Overview

The CRM submodule is a complete customer relationship management system supporting contacts (individuals), organizations (companies), deals (opportunities), pipelines (sales processes), activities (interactions), custom objects (user-defined entities), AI-powered deal scoring, revenue forecasting, duplicate detection with auto-merge, smart views (saved filters), and lead scoring with behavioral/demographic/firmographic dimensions and time-based decay.

#### Internal Structure

```
crm/
├── services/
│   ├── contact.service.ts           # Contact CRUD, search, merge, timeline
│   ├── organization.service.ts      # Organization CRUD, hierarchy, health scoring
│   ├── deal.service.ts              # Deal lifecycle, pipeline movement, forecasting
│   ├── pipeline.service.ts          # Pipeline/stage CRUD, automation triggers
│   └── activity.service.ts          # Activity logging, timeline aggregation
├── client/
│   ├── hooks/
│   │   ├── use-contacts.ts          # Contact list with search/filter
│   │   ├── use-contact.ts           # Single contact detail + timeline
│   │   ├── use-deals.ts             # Deal pipeline view
│   │   ├── use-pipeline.ts          # Pipeline configuration
│   │   └── use-timeline.ts          # Unified activity timeline
│   └── components/
│       ├── contact-card.tsx         # Contact summary card
│       ├── deal-board.tsx           # Kanban deal board
│       ├── pipeline-kanban.tsx      # Pipeline stage Kanban
│       └── activity-timeline.tsx    # Unified timeline component
├── schemas/
│   ├── contact.ts                   # Drizzle: contacts table
│   ├── organization.ts             # Drizzle: organizations table
│   ├── deal.ts                      # Drizzle: deals table
│   ├── pipeline.ts                  # Drizzle: pipelines, pipeline_stages_v2 tables
│   ├── activity.ts                  # Drizzle: activities table
│   ├── custom-object.ts            # Drizzle: custom_objects, custom_object_records
│   ├── deal-score.ts               # Drizzle: deal_scores table
│   ├── forecast.ts                  # Drizzle: forecasts, forecast_items tables
│   ├── duplicate-rule.ts           # Drizzle: duplicate_rules, merge_history tables
│   ├── smart-view.ts               # Drizzle: smart_views table
│   ├── lead-scoring.ts             # Drizzle: lead_scoring_rules, contact_scores tables
│   └── object-relationship.ts     # Drizzle: object_relationships table
├── scoring/
│   ├── lead-scorer.ts              # Lead scoring engine with decay
│   ├── deal-scorer.ts              # AI deal scoring via OpenRouter
│   └── health-scorer.ts            # Organization health scoring
├── types/
│   └── index.ts                     # Contact, Organization, Deal, Pipeline, etc.
├── validators/
│   └── index.ts                     # Zod schemas
└── constants.ts                     # CONTACT_LIFECYCLE_STAGES, DEAL_STATUSES
```

#### Key Design Decisions

- **Contact as Universal Entity**: The `contacts` table is the central entity that all other submodules reference. Conversations, tickets, calls, form submissions, appointments, and signature requests all link back to a contact. This creates a 360-degree view of every customer interaction.
- **Pipeline Stages as Separate Table**: While early iterations stored pipeline stages as JSONB arrays on the pipeline record, the V2 architecture uses a dedicated `pipeline_stages_v2` table. This enables per-stage configuration: rotting days, required fields, stage automations, probability defaults, and won/lost markers.
- **AI Deal Scoring**: The deal scoring engine (`deal-scorer.ts`) analyzes multiple signals: engagement frequency, pipeline velocity, deal age, competitor mentions in conversations, email response times, and meeting frequency. It calls OpenRouter with a structured prompt and stores results in the `deal_scores` table with factor breakdowns for explainability.
- **Lead Scoring with Decay**: Lead scores are computed from three dimensions: behavioral (email opens, page visits, form fills), demographic (job title, company size), and firmographic (industry, revenue). Each scoring rule can have decay enabled — scores decrease by a configurable percentage after N days of inactivity, preventing stale leads from cluttering the pipeline.
- **Duplicate Detection**: Configurable matching rules compare fields like email, phone, name, and company. When matches exceed the threshold (0-100 similarity), duplicates are either flagged for manual review or auto-merged based on the `auto_merge` setting. Merge operations are atomic: all related records (deals, activities, conversations, tickets) are reassigned to the survivor, and the merged record is preserved in `merge_history` for audit.
- **Smart Views**: Saved filter/sort/column configurations that can be personal or shared. Smart views use a filter DSL stored as JSONB: `[{ field: 'lifecycle_stage', operator: 'eq', value: 'sales_qualified' }]`. The query builder translates filters to Drizzle `where` clauses at runtime.
- **Custom Objects**: User-defined entities with typed fields (text, number, date, select, multi_select, reference) and polymorphic relationships to contacts, organizations, and deals. Custom objects use the `custom_objects` table for schema definitions and `custom_object_records` for data, with `object_relationships` providing the junction.

#### Data Flow

```
Contact Lifecycle:

  Form Fill / Import / API ──→ Contact Created (lifecycle: lead)
       │
       ▼
  Lead Scoring Engine ──→ Behavioral + Demographic + Firmographic Score
       │
       ▼
  Score > MQL Threshold? ──Yes──→ Lifecycle: marketing_qualified
       │                                    │
       ▼                                    ▼
  Continue Nurturing              Sales Team Reviews ──→ Lifecycle: sales_qualified
                                           │
                                           ▼
                                    Deal Created ──→ Pipeline Stages
                                           │
                                    ┌──────┴──────┐
                                    ▼              ▼
                               Deal Won       Deal Lost
                                    │              │
                                    ▼              ▼
                           Customer Stage    Archive/Nurture
```

---

### Documents — Document Management and Collaboration

#### Overview

The Documents submodule provides a block-based document editor inspired by Notion/PandaDoc with 25+ block types, reusable templates by category (invoice, proposal, estimate, contract, report, custom), full version history with change tracking, inline commenting with resolution, AI-powered content suggestions (rewrite, expand, summarize, translate, tone change, grammar), reusable content assets, variable/merge field resolution from CRM data, and pessimistic editing locks for concurrent access control.

#### Internal Structure

```
documents/
├── services/
│   ├── document.service.ts          # Document CRUD, upload, sharing, versions
│   └── folder.service.ts            # Folder hierarchy, permissions, navigation
├── client/
│   ├── hooks/
│   │   ├── use-documents.ts         # Document list and search
│   │   └── use-folders.ts           # Folder tree navigation
│   └── components/
│       └── document-explorer.tsx    # File browser component
├── schemas/
│   ├── document.ts                  # Drizzle: documents table
│   ├── document-template.ts        # Drizzle: document_templates table
│   ├── document-version.ts         # Drizzle: document_versions table
│   ├── document-comment.ts         # Drizzle: document_comments table
│   ├── document-asset.ts           # Drizzle: document_assets table
│   └── ai-suggestion.ts            # Drizzle: ai_content_suggestions table
├── blocks/
│   ├── block-registry.ts           # Block type registration and rendering
│   ├── heading.block.ts            # Heading block (H1-H6)
│   ├── paragraph.block.ts          # Rich text paragraph
│   ├── image.block.ts              # Image with caption
│   ├── table.block.ts              # Data table
│   ├── pricing-table.block.ts      # Pricing grid with totals
│   ├── signature-block.block.ts    # Signature placeholder for e-sign
│   ├── variable.block.ts           # CRM merge field resolution
│   └── ...                          # 17+ additional block types
├── ai/
│   ├── content-suggester.ts        # OpenRouter integration for suggestions
│   └── prompts.ts                   # AI prompt templates
├── types/
│   └── index.ts                     # Document, DocumentBlock, Template, etc.
├── validators/
│   └── index.ts                     # Zod schemas
└── constants.ts                     # DOCUMENT_STATUSES, BLOCK_TYPES
```

#### Key Design Decisions

- **Block-Based Architecture**: Documents are stored as ordered arrays of blocks in a JSONB column. Each block has a `type`, `id`, `data`, and optional `children`. This allows flexible document composition without complex relational modeling. Block types include: heading, paragraph, image, table, pricing_table, signature_block, video, columns, callout, code, quote, checklist, embed, variable, product_card, payment_schedule, timeline, comparison_table, FAQ, divider, spacer, and more.
- **Pessimistic Locking**: When a user opens a document for editing, the `locked_by` and `locked_at` fields are set. Other users see a "Currently being edited by X" message. Locks automatically expire after 15 minutes of inactivity (no save or heartbeat). This prevents merge conflicts in a collaborative setting without the complexity of CRDT-based real-time editing.
- **Version Snapshots**: Every save operation creates a full snapshot of the document blocks in `document_versions`. This enables point-in-time restoration and diff viewing. While storage-heavy, JSONB compression in PostgreSQL keeps the overhead manageable, and old versions can be archived to cold storage.
- **Variable Resolution**: Documents support merge fields like `{{contact.firstName}}`, `{{deal.amount}}`, `{{organization.name}}`. When rendering or exporting, the `variable.block.ts` resolver fetches data from CRM records and replaces placeholders. This enables dynamic proposals, contracts, and invoices generated from CRM data.
- **AI Content Suggestions**: The AI engine uses OpenRouter to provide content improvement suggestions. Suggestions are stored in the `ai_content_suggestions` table with status tracking (pending, accepted, rejected, expired). The confidence score helps users prioritize which suggestions to review.
- **Materialized Path for Folders**: The folder hierarchy uses materialized paths (`/root/marketing/proposals/q1`) for efficient tree queries. Finding all descendants of a folder is a simple `WHERE path LIKE '/root/marketing/%'` query, which is vastly more performant than recursive CTEs for deep hierarchies.

#### Data Flow

```
Document Creation:
  From Template → Resolve Variables → Create Document Record → Create Initial Version
  From Upload → Store File in S3/R2 → Create Document Record → Extract Metadata

Editing:
  Acquire Lock → Edit Blocks → Auto-Save (debounced 3s) → Create Version → Release Lock

Sharing:
  Create Share Token (32-byte hex) → Optional Password (bcrypt) → Optional Expiry
       │
       ▼
  Recipient Opens Link → Validate Token → Check Password → Check Expiry → Render Document
       │
       ▼
  Log Access in document_access → Increment access_count
```

---

### Forms — Form Builder and Submissions

#### Overview

The Forms submodule provides a drag-and-drop form builder with 28 field types, conditional logic (show/hide/require based on other answers), multi-step forms with progress tracking, quiz/survey mode with scoring, embed options (inline, popup, slide-in, full-page, chat widget), submission handling with spam detection (honeypot, timing, reCAPTCHA), automatic CRM contact creation, webhook integrations, and detailed analytics (views, starts, completions, per-step dropoff, per-field error rates, device breakdown).

#### Internal Structure

```
forms/
├── services/
│   ├── form.service.ts              # Form CRUD, fields, publish, versions
│   └── submission.service.ts        # Submit, validate, spam check, export
├── client/
│   ├── hooks/
│   │   ├── use-form-builder.ts      # Builder state (drag-drop, field config)
│   │   └── use-form-submissions.ts  # Submission list, analytics
│   └── components/
│       ├── form-renderer.tsx        # Public form rendering with validation
│       └── form-builder-canvas.tsx  # Drag-and-drop builder UI
├── schemas/
│   ├── form.ts                      # Drizzle: forms table
│   ├── form-field.ts               # Drizzle: form_fields table
│   ├── form-submission.ts          # Drizzle: form_submissions table
│   ├── form-analytics.ts           # Drizzle: form_analytics table
│   └── form-version.ts             # Drizzle: form_versions table
├── validation/
│   ├── field-validators.ts         # Per-field-type validation logic
│   ├── conditional-evaluator.ts    # Conditional logic evaluation engine
│   └── spam-detector.ts            # Honeypot, timing, reCAPTCHA checks
├── types/
│   └── index.ts                     # Form, FormField, FormSubmission, etc.
├── validators/
│   └── index.ts                     # Zod schemas
└── constants.ts                     # FORM_FIELD_TYPES, FORM_STATUSES
```

#### Key Design Decisions

- **28 Field Types**: text, email, phone, textarea, number, select, multi_select, checkbox, radio, date, datetime, time, file, image, rating, NPS, scale, hidden, HTML, signature, payment, address, name, heading, paragraph, divider, spacer. Each field type has its own validator and renderer.
- **Conditional Logic Engine**: Field visibility and required-ness can depend on other fields via rules: `{ when: [{ field: 'budget', operator: 'gte', value: 10000 }], matchType: 'all', action: 'show' }`. The `conditional-evaluator.ts` processes these rules on both client (for UI) and server (for validation).
- **Version Snapshots on Publish**: When a form is published, the entire form configuration (fields, settings, styling) is snapshotted to `form_versions`. Submissions always record which `form_version` they were submitted against, enabling accurate historical analysis even after form changes.
- **Contact Field Mapping**: Form fields can map to CRM contact fields via `contact_field_mapping`. When a submission is processed, the mapper auto-creates or updates a CRM contact. For example, a field with `contactField: 'email'` triggers a contact lookup by email, creating a new contact if not found.
- **Analytics Aggregation**: The `form_analytics` table stores daily aggregated metrics. A cron job runs every 6 hours to compute views, starts, completions, conversion rates, per-step dropoff, field completion rates, and device breakdown. This avoids expensive real-time aggregation queries.

#### Data Flow

```
Form Submission:
  Client Validation → Server Validation → Spam Detection → Persist Submission
       │
       ├── Contact Mapping → Create/Update CRM Contact
       │
       ├── Webhooks → Dispatch to configured URLs
       │
       ├── Analytics → Increment counters (submission_count, view_count)
       │
       └── Events → Emit form.submission.created
```

---

### Sign — Electronic Signatures

#### Overview

The Sign submodule provides electronic signature workflows with multi-signer support, signing order enforcement (sequential or parallel), drag-and-drop signature field placement, comprehensive audit trails for legal compliance, PDF generation with embedded signatures, reusable signing templates, automated reminders, and integration with the Documents submodule for proposals and contracts.

#### Internal Structure

```
sign/
├── services/
│   └── signature.service.ts         # Request creation, signing, status, audit
├── client/
│   ├── hooks/
│   │   └── use-signature.ts         # Signature request state
│   └── components/
│       └── signature-canvas.tsx     # Signature drawing/typing component
├── schemas/
│   ├── signature-request.ts        # Drizzle: signature_requests table
│   ├── signature-template.ts       # Drizzle: signature_templates table
│   ├── signer.ts                    # Drizzle: signers table
│   └── signature-audit.ts          # Drizzle: signature_audit table
├── pdf/
│   ├── pdf-generator.ts            # PDF rendering with embedded signatures
│   └── field-placer.ts             # Signature field position mapping
├── types/
│   └── index.ts                     # SignatureRequest, Signer, SignatureAudit, etc.
├── validators/
│   └── index.ts                     # Zod schemas
└── constants.ts                     # SIGNATURE_STATUSES, FIELD_TYPES
```

#### Key Design Decisions

- **Sequential vs Parallel Signing**: When `order` values are assigned to signers, signing is sequential — signer 2 receives their invitation only after signer 1 completes. When all signers have `order: 0`, signing is parallel — all receive invitations simultaneously. This is controlled by a simple ordering check in the state machine.
- **Audit Trail for Legal Compliance**: Every action on a signature request is logged to the `signature_audit` table with: timestamp, action type (created, viewed, signed, declined, voided, expired), actor email, IP address, user agent, and geolocation when available. This creates a legally defensible audit trail.
- **PDF Generation**: Once all signers have signed, `pdf-generator.ts` uses `pdf-lib` to render the source document with embedded signature images at the configured coordinates. The final PDF includes a certificate page listing all signers with timestamps, IP addresses, and audit hashes.
- **Token-Based Signing**: Each signer receives a unique, cryptographically random token via email. This token grants access to the signing interface without requiring authentication. Tokens expire with the signature request and are single-use per signing action.

#### Data Flow

```
Create Request → Validate Document → Create Signer Records → Generate Tokens
       │
       ▼
  Send Invitation (First Signer or All) → Signer Opens Link → Validate Token
       │
       ▼
  Display Document + Signature Fields → Capture Signature (Draw/Type/Upload)
       │
       ▼
  Record Signature → Log Audit Entry → Check Completion
       │
       ├── More Signers? → Notify Next Signer (sequential) / Wait (parallel)
       │
       └── All Signed → Generate Final PDF → Store in @mcv/storage → Emit signature.completed
```

---

### Support — Helpdesk and Ticket Management

#### Overview

The Support submodule provides a full helpdesk ticketing system with auto-incrementing ticket numbers (YYMM-00001 format), SLA management with priority-based targets and escalation chains, a knowledge base with full-text search and helpfulness voting, support groups with auto-assignment, ticket merging, satisfaction surveys (auto-sent on close), nested ticket categories with default group assignment, and multi-channel intake (web, email, chat, phone, API, social media).

#### Internal Structure

```
support/
├── services/
│   ├── ticket.service.ts            # Ticket CRUD, comments, merge, status changes
│   └── knowledge.service.ts         # Article CRUD, publish, search, feedback
├── client/
│   ├── hooks/
│   │   ├── use-tickets.ts           # Ticket list with filters
│   │   └── use-knowledge-base.ts    # Knowledge base browsing
│   └── components/
│       ├── ticket-view.tsx          # Ticket detail with comment thread
│       └── knowledge-portal.tsx     # Customer-facing knowledge base
├── schemas/
│   ├── ticket.ts                    # Drizzle: tickets table
│   ├── ticket-comment.ts           # Drizzle: ticket_comments table
│   ├── sla-policy.ts               # Drizzle: sla_policies table (support-specific)
│   ├── knowledge-article.ts        # Drizzle: knowledge_articles table
│   ├── support-group.ts            # Drizzle: support_groups table
│   ├── ticket-category.ts          # Drizzle: ticket_categories table
│   └── satisfaction-survey.ts      # Drizzle: satisfaction_surveys table
├── sla/
│   ├── sla-calculator.ts           # Business hours-aware SLA computation
│   ├── escalation-engine.ts        # Escalation chain execution
│   └── breach-checker.ts           # Cron-based SLA breach detection
├── types/
│   └── index.ts                     # Ticket, TicketComment, SlaPolicy, etc.
├── validators/
│   └── index.ts                     # Zod schemas
└── constants.ts                     # TICKET_STATUSES, TICKET_PRIORITIES
```

#### Key Design Decisions

- **Auto-Incrementing Ticket Numbers**: Ticket numbers follow the `YYMM-NNNNN` format (e.g., `2602-00042`). A per-venture, per-month sequence is maintained using PostgreSQL's `nextval()` on a dynamically created sequence. This provides human-readable ticket IDs while maintaining uniqueness.
- **SLA Engine with Business Hours**: The SLA calculator uses a business hours calendar to compute deadlines. For example, a 4-hour SLA target submitted at 4:00 PM Friday (business hours 9-5) would be due at 12:00 PM Monday, not 8:00 PM Friday. The `breach-checker.ts` runs every 60 seconds to identify at-risk and breached tickets.
- **Escalation Chains**: SLA policies define escalation entries: `[{ after: 3600, action: 'notify', target: 'supervisor' }, { after: 7200, action: 'reassign', target: 'group-senior' }]`. The escalation engine evaluates these against elapsed time and executes the appropriate action.
- **Knowledge Base with Voting**: Articles support `helpful_count` and `not_helpful_count` counters for content quality measurement. Articles are indexed in Elasticsearch for full-text search. Public articles are accessible without authentication; restricted articles require login.
- **Ticket Merging**: When tickets are merged, all comments from source tickets are moved to the target ticket with a merge annotation. Source tickets are closed with a `merged_into` reference. The merge operation is atomic (single transaction) to prevent data inconsistency.

#### Data Flow

```
Ticket Creation:
  Intake Channel → Validate Input → Generate Ticket Number → Auto-Assign Group
       │
       ├── Determine Priority → Apply SLA Policy → Set Response/Resolution Deadlines
       │
       ├── Link to Contact → Link to Conversation (if chat-originating)
       │
       └── Emit ticket.created → Notify Assigned Agent/Group

Ticket Resolution:
  Agent Replies → Record First Response (SLA) → Continue Working
       │
       ▼
  Change Status: solved → Auto-Send CSAT Survey → Wait for Rating
       │
       ▼
  Change Status: closed → Archive → Update Analytics
```

---

## Data Models (Drizzle ORM)

### Schema Organization

All Nexus data models are defined using Drizzle ORM's `pgTable` builder and live under `packages/db/src/schema/`. Each submodule has its own schema file(s), and all tables follow these conventions:

| Convention | Implementation |
|-----------|---------------|
| **Base Columns** | All tables extend `@mcv/kernel`'s `baseColumns` which provides `id` (UUID), `ventureId` (UUID, FK to ventures), `createdAt`, `updatedAt` |
| **Naming** | Table names prefixed with `nexus_` (e.g., `nexus_contacts`, `nexus_deals`). Column names use `snake_case` |
| **Soft Delete** | Tables with user-facing records include `archivedAt` or `deletedAt` timestamps; hard deletes are restricted to data retention jobs |
| **Audit Columns** | `createdBy` and `updatedBy` UUID references where attribution matters |
| **Custom Fields** | `customFields JSONB DEFAULT '{}'` for venture-specific extensions without schema migrations |
| **Tags** | `tags TEXT[] DEFAULT '{}'` for user-defined categorization |
| **RLS** | Every table has RLS policies enforcing `venture_id = current_setting('app.venture_id')` |

### Core Tables by Submodule

#### CRM Tables

| Table | Description | Key Columns | Indexes |
|-------|-------------|-------------|---------|
| `nexus_contacts` | People and companies | `email`, `firstName`, `lastName`, `organizationId`, `lifecycleStage`, `leadScore`, `ownerId` | venture, email, owner, type, lifecycle_stage, lead_score, composite (venture+type, venture+lifecycle, venture+owner) |
| `nexus_organizations` | Companies with hierarchy | `name`, `industry`, `annualRevenue`, `healthScore`, `parentOrganizationId` | venture, parent, industry |
| `nexus_deals` | Sales opportunities | `pipelineId`, `stageId`, `amount`, `probability`, `status`, `expectedCloseDate` | venture, pipeline, contact, status, expected_close, composite (venture+status, venture+pipeline) |
| `nexus_pipelines` | Sales processes | `name`, `isDefault` | venture, venture+default |
| `nexus_pipeline_stages_v2` | Pipeline stages with config | `pipelineId`, `position`, `probability`, `rottingDays`, `requiredFields`, `automations` | pipeline, venture |
| `nexus_activities` | Interaction log | `contactId`, `dealId`, `type`, `data` | venture, contact, deal, type |
| `nexus_custom_objects` | User-defined entities | `name`, `slug`, `fields`, `isActive` | venture, UNIQUE(venture+slug) |
| `nexus_custom_object_records` | Custom entity data | `objectId`, `data`, `createdBy` | venture, object |
| `nexus_object_relationships` | Polymorphic links | `sourceObjectType`, `sourceObjectId`, `targetObjectType`, `targetObjectId` | venture, source, target |
| `nexus_deal_scores` | AI scoring results | `dealId`, `score`, `confidence`, `factors`, `winProbability`, `riskLevel` | deal, venture |
| `nexus_forecasts` | Revenue forecasts | `period`, `periodStart`, `periodEnd`, `forecastAmount`, `weightedAmount` | venture, pipeline, period |
| `nexus_forecast_items` | Deal→forecast links | `forecastId`, `dealId`, `amount`, `category` | forecast, deal |
| `nexus_duplicate_rules` | Dedup configuration | `objectType`, `matchFields`, `threshold`, `autoMerge` | venture, object_type |
| `nexus_merge_history` | Merge audit trail | `objectType`, `survivorId`, `mergedId`, `mergedData` | venture |
| `nexus_smart_views` | Saved filters | `objectType`, `filters`, `sortBy`, `columns`, `isShared` | venture, owner |
| `nexus_lead_scoring_rules` | Scoring config | `category`, `rules`, `maxScore`, `decayEnabled`, `decayDays` | venture |
| `nexus_contact_scores` | Computed scores | `contactId`, `totalScore`, `behavioralScore`, `demographicScore`, `firmographicScore` | contact (UNIQUE), venture |

#### Contact Center Tables

| Table | Description | Key Columns | Indexes |
|-------|-------------|-------------|---------|
| `nexus_agent_status` | Real-time presence | `userId`, `status`, `currentConversationId`, `dailyCallCount`, `dailyTalkTimeSeconds` | UNIQUE(venture+user) |
| `nexus_dialer_campaigns` | Outbound campaigns | `type`, `status`, `dialRatio`, `abandonRateTarget`, `stats` | venture |
| `nexus_dialer_queue_entries` | Campaign contacts | `campaignId`, `contactId`, `status`, `attempts`, `disposition` | campaign, contact |
| `nexus_call_scripts` | Agent scripts | `name`, `steps` (JSONB), `isActive` | venture |
| `nexus_call_dispositions` | Call outcomes | `name`, `requiresNotes`, `requiresFollowUp` | venture |
| `nexus_csat_surveys` | Satisfaction data | `conversationId`, `contactId`, `agentId`, `score`, `npsScore`, `feedback` | venture, conversation, contact, agent |
| `nexus_supervisor_sessions` | Monitoring sessions | `supervisorId`, `agentId`, `mode`, `callSid` | venture |
| `nexus_sla_policies` | SLA targets | `priority`, `firstResponseTarget`, `resolutionTarget`, `escalateAfter` | venture, priority |
| `nexus_channel_configs` | Per-channel settings | `channel`, `routingMethod`, `autoAssign`, `businessHours` | UNIQUE(venture+channel) |

#### Conversations Tables

| Table | Description | Key Columns | Indexes |
|-------|-------------|-------------|---------|
| `nexus_conversations` | Threaded conversations | `contactId`, `channel`, `status`, `priority`, `assignedTo`, `queueId` | venture, contact, assigned, status, queue + 9 composite indexes |
| `nexus_messages` | Individual messages | `conversationId`, `content`, `contentType`, `senderType`, `isPrivate`, `deliveredAt`, `failedAt` | conversation, sender, created_at |
| `nexus_conversation_participants` | Participants | `conversationId`, `contactId` or `userId`, `role`, `unreadCount`, `lastReadMessageId` | conversation, contact, user |

#### Calls Tables

| Table | Description | Key Columns | Indexes |
|-------|-------------|-------------|---------|
| `nexus_calls` | Call records | `conversationId`, `contactId`, `agentId`, `direction`, `status`, `twilioSid`, `durationSeconds`, `recordingUrl`, `transcription` | venture, contact, agent, twilio_sid, status + composites |
| `nexus_call_recordings` | Recording metadata | `callId`, `storageUrl`, `durationSeconds`, `fileSize` | call |
| `nexus_ivr_menus` | IVR trees | `name`, `greeting`, `options` (JSONB), `businessHours` | venture |

#### Forms Tables

| Table | Description | Key Columns | Indexes |
|-------|-------------|-------------|---------|
| `nexus_forms` | Form definitions | `name`, `slug`, `type`, `status`, `version`, `settings`, `styling`, `submissionCount` | venture, slug, status |
| `nexus_form_fields` | Field config | `formId`, `type`, `label`, `position`, `stepIndex`, `validation`, `conditionalLogic`, `contactFieldMapping` | form, position |
| `nexus_form_submissions` | Submissions | `formId`, `contactId`, `data`, `formVersion`, `source`, `isPartial`, `isSpam`, `score`, `completionTimeSeconds` | venture, form, contact, submitted_at |
| `nexus_form_analytics` | Daily metrics | `formId`, `date`, `views`, `starts`, `completions`, `conversionRate`, `dropoffByStep`, `deviceBreakdown` | form, UNIQUE(form+date) |
| `nexus_form_versions` | Publish snapshots | `formId`, `version`, `fields`, `settings`, `styling` | form, version |

#### Support Tables

| Table | Description | Key Columns | Indexes |
|-------|-------------|-------------|---------|
| `nexus_tickets` | Support tickets | `ticketNumber`, `subject`, `priority`, `status`, `contactId`, `assigneeId`, `groupId`, `firstResponseDue`, `resolutionDue` | venture, contact, assignee, status, priority + composites |
| `nexus_ticket_comments` | Comment thread | `ticketId`, `body`, `isPublic`, `via` | ticket |
| `nexus_knowledge_articles` | Help articles | `title`, `slug`, `body`, `categoryId`, `isPublic`, `helpfulCount`, `notHelpfulCount` | venture, category, slug |
| `nexus_support_groups` | Team assignments | `name`, `defaultAssigneeId` | venture |
| `nexus_ticket_categories` | Nested categories | `name`, `parentId`, `defaultGroupId` | venture, parent |

#### Documents Tables

| Table | Description | Key Columns | Indexes |
|-------|-------------|-------------|---------|
| `nexus_documents` | Documents | `templateId`, `title`, `status`, `blocks` (JSONB), `variables`, `lockedBy`, `version` | venture, template, status, locked_by |
| `nexus_document_templates` | Templates | `name`, `slug`, `category`, `blocks`, `variables`, `isPublic`, `isSystem` | venture, category |
| `nexus_document_versions` | Version history | `documentId`, `version`, `blocks`, `changedBy`, `changeDescription` | document, version |
| `nexus_document_comments` | Inline comments | `documentId`, `blockId`, `userId`, `content`, `resolvedAt`, `parentCommentId` | document, block |
| `nexus_document_assets` | Reusable content | `name`, `type`, `content`, `usageCount` | venture, type |
| `nexus_ai_content_suggestions` | AI suggestions | `documentId`, `blockId`, `suggestionType`, `originalContent`, `suggestedContent`, `confidence` | document, status |

#### Sign Tables

| Table | Description | Key Columns | Indexes |
|-------|-------------|-------------|---------|
| `nexus_signature_requests` | Signing requests | `documentId`, `title`, `status`, `expiresAt` | venture, document, status |
| `nexus_signature_templates` | Signing templates | `name`, `fields` (JSONB) | venture |
| `nexus_signers` | Individual signers | `requestId`, `email`, `name`, `role`, `order`, `signedAt`, `token` | request, email, token |
| `nexus_signature_audit` | Audit trail | `requestId`, `action`, `actorEmail`, `ipAddress`, `userAgent` | request, action |

#### Calendar Tables

| Table | Description | Key Columns | Indexes |
|-------|-------------|-------------|---------|
| `nexus_calendars` | Calendar definitions | `name`, `slug`, `type`, `timezone`, `teamMemberIds`, `settings` | venture, UNIQUE(venture+slug) |
| `nexus_calendar_availability` | Weekly schedules | `calendarId`, `userId`, `dayOfWeek`, `startTime`, `endTime` | calendar, user |
| `nexus_calendar_overrides` | Date exceptions | `calendarId`, `userId`, `date`, `isBlocked`, `reason` | calendar, user, date |
| `nexus_appointments` | Booked appointments | `calendarId`, `contactId`, `assignedUserId`, `startTime`, `endTime`, `status`, `meetingUrl` | venture, calendar, contact, assigned, status, start_time |
| `nexus_appointment_reminders` | Scheduled reminders | `appointmentId`, `type`, `scheduledAt`, `sentAt`, `status` | appointment, scheduled_at, status |
| `nexus_appointment_attendees` | Multi-attendees | `appointmentId`, `userId`, `status` | UNIQUE(appointment+user) |
| `nexus_round_robin_config` | RR settings | `calendarId`, `distributionMode`, `weights`, `priorities`, `assignmentCounts` | UNIQUE(calendar) |
| `nexus_booking_pages` | Public pages | `calendarId`, `slug`, `title`, `formFields`, `isActive` | calendar, UNIQUE(slug) |
| `nexus_google_calendar_sync` | OAuth sync | `userId`, `googleAccountEmail`, `accessToken`, `refreshToken`, `calendarIds` | UNIQUE(user+venture) |

### Drizzle Relations

All tables define explicit Drizzle relations for type-safe eager loading:

```typescript
// Example: Contact relations spanning all submodules
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
  formSubmissions: many(formSubmissions),
  appointments: many(appointments),
  signatureRequests: many(signers),
  contactScore: one(contactScores, {
    fields: [contacts.id],
    references: [contactScores.contactId],
  }),
}));
```

### Generated Columns

PostgreSQL generated columns are used for computed values that should be available at query time without application-level computation:

```typescript
// Contact full name
fullName: varchar('full_name', { length: 200 }).generatedAlwaysAs(
  sql`COALESCE(first_name || ' ' || last_name, first_name, last_name, email)`
),

// Deal weighted amount
weightedAmount: decimal('weighted_amount', { precision: 15, scale: 2 }).generatedAlwaysAs(
  sql`amount * probability / 100`
),
```

---

## Data Flow & Events

### Domain Event Architecture

All Nexus submodules emit domain events via Redpanda/Kafka for asynchronous processing, audit logging, cross-module orchestration, and webhook dispatch. Events follow a consistent structure:

```typescript
interface NexusDomainEvent<T = unknown> {
  id: string;                          // Unique event ID (UUID)
  type: string;                        // Event type (e.g., 'contact.created')
  ventureId: string;                   // Venture isolation
  userId: string;                      // Actor who triggered the event
  timestamp: string;                   // ISO 8601 timestamp
  version: number;                     // Schema version for evolution
  data: T;                             // Event-specific payload
  metadata: {
    correlationId: string;             // Request trace ID
    causationId?: string;              // Parent event ID (for chains)
    source: string;                    // Originating service
  };
}
```

### Event Catalog

| Event | Producer | Consumers | Purpose |
|-------|----------|-----------|---------|
| `contact.created` | CRM | Search Indexer, Lead Scorer, Analytics | New contact in system |
| `contact.updated` | CRM | Search Indexer, Lead Scorer | Contact data changed |
| `contact.merged` | CRM | Search Indexer, All Submodules | Duplicate contacts merged |
| `deal.created` | CRM | Analytics, Notifications | New deal in pipeline |
| `deal.stage_changed` | CRM | Automations, Notifications, AI Scorer | Deal progressed |
| `deal.won` | CRM | Analytics, Contact Lifecycle, Notifications | Deal closed-won |
| `deal.lost` | CRM | Analytics, Contact Lifecycle | Deal closed-lost |
| `conversation.created` | Conversations | Contact Center (routing), CRM (activity) | New conversation started |
| `message.sent` | Conversations | Channel Delivery, Analytics | Message dispatched |
| `message.received` | Conversations | WebSocket Push, Unread Counter, SLA Timer | Inbound message |
| `call.initiated` | Calls | CRM (activity), Analytics | Call started |
| `call.completed` | Calls | Analytics, CRM (activity), Cost Tracking | Call ended |
| `call.recording.ready` | Calls | Storage (download), Transcription Pipeline | Recording available |
| `call.transcription.ready` | Calls | Search Indexer, CRM (activity) | Transcript available |
| `inbox.assignment.created` | Contact Center | SLA Timer, Agent Dashboard, Notifications | Conversation assigned |
| `sla.breached` | Contact Center | Escalation Engine, Notifications, Analytics | SLA target missed |
| `form.submission.created` | Forms | Contact Mapper, Webhooks, Analytics | Form submitted |
| `ticket.created` | Support | SLA Timer, Notifications, Analytics | New ticket |
| `ticket.status_changed` | Support | SLA Timer, CSAT Survey, Analytics | Ticket progressed |
| `document.shared` | Documents | Notifications, Access Logger | Document shared |
| `signature.completed` | Sign | Workflow Engine, Notifications, PDF Generator | All signers done |
| `appointment.booked` | Calendar | CRM (activity), Notifications, Google Sync | Appointment created |
| `appointment.cancelled` | Calendar | Notifications, Google Sync, Analytics | Appointment cancelled |

### Cross-Module Event Chains

```
Form Submission Flow:
  form.submission.created
       │
       ├──→ Contact Mapper: contact.created (if new) OR contact.updated (if exists)
       │         │
       │         └──→ Lead Scorer: contact_scores updated
       │
       ├──→ Webhook Dispatcher: POST to configured URLs
       │
       └──→ Analytics: form_analytics counters incremented

Deal Won Flow:
  deal.won
       │
       ├──→ Contact Lifecycle: contact.lifecycleStage → 'customer'
       │
       ├──→ Analytics: forecast actuals updated
       │
       ├──→ Notifications: Congratulations email to team
       │
       └──→ Workflow: Trigger onboarding automation

Support Ticket Escalation:
  ticket.created → sla.timer.started
       │
       ▼
  sla.at_risk (80% of target) → Notify supervisor
       │
       ▼
  sla.breached → Escalation chain: reassign to senior group + bump priority
```

### Webhook Dispatch

External integrations receive events via webhooks. Each venture can configure webhook endpoints per event type:

```typescript
interface WebhookConfig {
  url: string;                         // Target URL
  events: string[];                    // Event types to subscribe
  secret: string;                      // HMAC-SHA256 signing secret
  active: boolean;                     // Enable/disable
  retryPolicy: {
    maxRetries: number;                // Default: 3
    backoffMs: number;                 // Default: 1000 (exponential)
  };
}
```

Webhook payloads are signed with HMAC-SHA256 using the venture's webhook secret. The signature is sent in the `X-Nexus-Signature-256` header. Failed deliveries are retried with exponential backoff.

---

## Integration Points

### connectors/voice — VoIP Integration

Nexus integrates with the voice connector layer for all telephony operations:

| Integration | Direction | Mechanism | Purpose |
|-------------|-----------|-----------|---------|
| **Twilio REST API** | Outbound | HTTPS | Initiate calls, send SMS, create conferences |
| **Twilio Webhooks** | Inbound | HTTP POST callbacks | Status updates, recording ready, transcription |
| **Twilio Client SDK** | Bidirectional | WebRTC | Browser-based softphone for agents |
| **WhatsApp Business API** | Bidirectional | HTTPS + Webhooks | WhatsApp messaging channel |

The voice connector provides:
- **Number provisioning**: Purchase and configure Twilio phone numbers per venture
- **Call routing**: IVR menus generate TwiML for Twilio to execute
- **Recording storage**: Download recordings from Twilio to long-term storage
- **Transcription**: Route recordings through Google Cloud Speech-to-Text
- **Cost aggregation**: Track per-call costs from Twilio's pricing webhooks

### connectors/email — Email Routing

Nexus uses the email connector for bidirectional email communication:

| Integration | Direction | Mechanism | Purpose |
|-------------|-----------|-----------|---------|
| **SMTP (SendGrid/SES)** | Outbound | SMTP/API | Send agent replies, notifications, reminders |
| **Inbound Parsing** | Inbound | Webhook | Receive customer emails → create conversations |
| **Email Templates** | Internal | Template engine | Notification templates with merge fields |

Email routing pipeline:
1. **Inbound**: Email received → Parse sender → Match to contact → Find or create conversation → Route to inbox
2. **Outbound**: Agent replies → Render template → Send via SMTP → Track delivery/opens/clicks
3. **Notifications**: System events → Select template → Merge variables → Dispatch via `@mcv/comms`

### fabric/realtime — Live Chat

The realtime fabric provides WebSocket infrastructure for live communication:

| Feature | Implementation | Protocol |
|---------|---------------|----------|
| **Live Chat** | WebSocket channels per conversation | `ws://` with auth token |
| **Typing Indicators** | Ephemeral broadcasts (no DB persistence) | WebSocket event |
| **Agent Presence** | Redis-backed status with heartbeats | WebSocket + Redis PubSub |
| **Unread Badges** | Real-time counter updates | WebSocket event |
| **SLA Countdowns** | Live timer updates for at-risk items | WebSocket event |
| **Assignment Notifications** | New assignment alerts to agents | WebSocket event |

### crm domain — Deep CRM Integration

While Nexus contains its own lightweight CRM submodule, it integrates with the platform-wide CRM domain for:

| Integration | Purpose |
|-------------|---------|
| **Unified Contact Record** | Nexus contacts ARE the CRM contacts — same table, same service |
| **Activity Feed** | All Nexus actions (calls, messages, tickets) appear in the CRM timeline |
| **Deal Context** | Support and sales have full visibility into each other's activities |
| **Custom Fields** | CRM custom fields are accessible across all Nexus submodules |
| **Automation Triggers** | CRM workflow automations can trigger Nexus actions and vice versa |

### commerce — Customer Context

Integration with the commerce domain provides business context for customer interactions:

| Integration | Purpose |
|-------------|---------|
| **Order History** | Support agents see customer's purchase history on ticket view |
| **Subscription Status** | Contact center agents know customer's plan/billing status |
| **Revenue Attribution** | Deals can link to commerce transactions for revenue tracking |
| **Invoice Generation** | Documents module can generate invoices from commerce data |
| **Customer Lifetime Value** | CRM contact scoring incorporates commerce revenue data |

---

## Performance

### Latency Targets

| Operation | Target | P99 | Strategy |
|-----------|--------|-----|----------|
| Contact lookup by ID | < 5ms | < 15ms | Primary key lookup, RLS filter |
| Contact search (paginated) | < 50ms | < 200ms | Elasticsearch with pre-built indexes |
| Deal pipeline view | < 30ms | < 100ms | Denormalized stage counts, cursor pagination |
| Conversation message send | < 100ms | < 300ms | Optimistic write, async delivery |
| Form submission | < 50ms | < 150ms | Sync validation, async side-effects |
| Calendar slot availability | < 30ms | < 100ms | Pre-computed availability in Redis |
| Ticket creation with SLA | < 50ms | < 150ms | SLA deadlines computed in-process |
| Document upload (10MB) | < 2s | < 5s | Direct-to-S3 presigned URL |
| Call webhook handling | < 20ms | < 50ms | Twilio SID index, minimal processing |
| Knowledge base search | < 30ms | < 100ms | Elasticsearch full-text |
| Booking page load | < 40ms | < 120ms | Cached availability, CDN static assets |

### Throughput Targets

| Metric | Small Deployment | Enterprise |
|--------|------------------|------------|
| Contacts per venture | 50,000 | 5,000,000+ |
| Conversations/day | 500 | 50,000+ |
| Form submissions/day | 1,000 | 100,000+ |
| Calls/day | 200 | 20,000+ |
| Documents per venture | 10,000 | 1,000,000+ |
| Appointments/day | 100 | 10,000+ |
| Support tickets/day | 200 | 20,000+ |
| Messages/second (peak) | 50 | 5,000+ |

### Optimization Strategies

| Strategy | Where Applied | Benefit |
|----------|--------------|---------|
| **Index-Heavy Design** | Every FK and common filter combo | Sub-millisecond lookups on filtered queries |
| **Denormalized Counters** | `submissionCount`, `messageCount`, `viewCount` | Avoid COUNT(*) on large tables |
| **JSONB with GIN Indexes** | Custom fields, settings, metadata | Flexible schema + fast containment queries |
| **Materialized Paths** | Folder hierarchy, ticket categories | O(1) subtree queries vs recursive CTEs |
| **Cursor-Based Pagination** | Messages, timelines, search results | Stable pagination under concurrent writes |
| **Generated Columns** | `fullName`, `weightedAmount` | Zero application-level compute cost |
| **Async Side-Effects** | Webhooks, emails, transcription, search indexing | Critical path stays fast |
| **Connection Pooling** | PgBouncer shared across submodules | Efficient DB connection reuse |
| **Read Replicas** | Analytics, search, reporting | Write path not blocked by read load |
| **Redis Caching** | Agent status, availability slots, session data | Microsecond reads for hot data |
| **Direct-to-S3 Upload** | Document/recording upload | Bypass application server for large files |
| **Batch Analytics** | Form analytics, call analytics | Cron aggregation vs real-time computation |

---

## Scalability

### Horizontal Scaling Strategy

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           SCALING ARCHITECTURE                                │
│                                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  App Server  │  │  App Server  │  │  App Server  │  │  App Server  │        │
│  │  (Next.js)   │  │  (Next.js)   │  │  (Next.js)   │  │  (Next.js)   │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                 │                 │                 │                 │
│         └─────────────────┼─────────────────┼─────────────────┘                │
│                           │                 │                                  │
│                    ┌──────┴───────┐  ┌──────┴───────┐                         │
│                    │  PgBouncer   │  │  Redis Cluster│                         │
│                    └──────┬───────┘  └──────────────┘                         │
│                           │                                                   │
│                    ┌──────┴───────┐                                           │
│                    │  PostgreSQL   │                                           │
│                    │  Primary      │──→ Read Replica 1                         │
│                    │               │──→ Read Replica 2                         │
│                    └───────────────┘                                           │
│                                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                          │
│  │  Redpanda    │  │Elasticsearch│  │  S3/R2       │                          │
│  │  (Events)    │  │  (Search)    │  │  (Storage)   │                          │
│  └─────────────┘  └─────────────┘  └─────────────┘                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Scaling Dimensions

| Component | Scaling Method | Trigger |
|-----------|---------------|---------|
| **App Servers** | Horizontal auto-scale | CPU > 70% or request latency > 200ms P95 |
| **PostgreSQL** | Vertical (primary) + horizontal (read replicas) | Write IOPS > 80% or read latency > 50ms |
| **Redis** | Cluster mode with hash slots | Memory > 70% or connection count > 80% |
| **Elasticsearch** | Horizontal (add nodes) | Index size > 100GB or query latency > 100ms |
| **Redpanda** | Partition scaling | Consumer lag > 10,000 messages |
| **S3/R2** | Infinite (managed) | N/A — auto-scales |
| **PgBouncer** | Connection pool sizing | Connection wait time > 10ms |

### Data Partitioning Strategy

For enterprise-scale deployments (5M+ contacts), the following partitioning strategies apply:

1. **Table Partitioning**: `form_submissions`, `messages`, `calls`, and `activities` can be range-partitioned by `created_at` (monthly partitions). This enables efficient partition pruning for time-bounded queries and simplified data retention (drop old partitions).

2. **Venture Sharding**: For the largest ventures, dedicated database shards can be provisioned. The `ventureId` routing layer in `@mcv/kernel` handles transparent shard selection.

3. **Archive Strategy**: Records older than the configured retention period are moved to cold storage (S3-backed PostgreSQL foreign data wrapper) and removed from the primary database. The archive is queryable but with higher latency.

---

## Error Handling

### Error Classification

All Nexus errors extend `@mcv/kernel`'s base error classes:

```typescript
// Base error hierarchy
class NexusError extends AppError {
  constructor(
    public code: string,           // Machine-readable error code
    public message: string,        // Human-readable message
    public statusCode: number,     // HTTP status code
    public details?: unknown,      // Additional context
  ) {
    super(message);
  }
}

class NexusNotFoundError extends NexusError {
  constructor(resource: string, id: string) {
    super(`${resource.toUpperCase()}_NOT_FOUND`, `${resource} not found: ${id}`, 404);
  }
}

class NexusConflictError extends NexusError {
  constructor(code: string, message: string) {
    super(code, message, 409);
  }
}

class NexusValidationError extends NexusError {
  constructor(message: string, details: ZodError) {
    super('VALIDATION_FAILED', message, 400, details.flatten());
  }
}
```

### Error Code Registry

| Code | HTTP | Module | Description |
|------|------|--------|-------------|
| `CONTACT_NOT_FOUND` | 404 | CRM | Contact ID does not exist |
| `CONTACT_DUPLICATE_EMAIL` | 409 | CRM | Email already exists in venture |
| `DEAL_NOT_FOUND` | 404 | CRM | Deal ID does not exist |
| `DEAL_INVALID_STAGE` | 400 | CRM | Stage does not belong to pipeline |
| `PIPELINE_NOT_FOUND` | 404 | CRM | Pipeline ID does not exist |
| `CONVERSATION_NOT_FOUND` | 404 | Conversations | Conversation ID does not exist |
| `MESSAGE_SEND_FAILED` | 500 | Conversations | Channel delivery failed |
| `NO_AGENT_AVAILABLE` | 503 | Contact Center | No online agents with capacity |
| `CALL_INITIATE_FAILED` | 500 | Calls | Twilio call creation failed |
| `CALL_NOT_FOUND` | 404 | Calls | Call ID does not exist |
| `FORM_NOT_PUBLISHED` | 400 | Forms | Form must be published for submissions |
| `FORM_LIMIT_REACHED` | 429 | Forms | Form has reached submission limit |
| `SUBMISSION_VALIDATION_FAILED` | 400 | Forms | Field validation errors |
| `SUBMISSION_SPAM_DETECTED` | 400 | Forms | Spam detection triggered |
| `TICKET_NOT_FOUND` | 404 | Support | Ticket ID does not exist |
| `TICKET_ALREADY_CLOSED` | 400 | Support | Cannot modify closed ticket |
| `DOCUMENT_LOCKED` | 423 | Documents | Document locked by another user |
| `DOCUMENT_VERSION_CONFLICT` | 409 | Documents | Version conflict — reload and retry |
| `SHARE_EXPIRED` | 401 | Documents | Share link has expired |
| `SHARE_PASSWORD_INVALID` | 401 | Documents | Incorrect share password |
| `SIGNATURE_EXPIRED` | 400 | Sign | Signature request has expired |
| `SLOT_UNAVAILABLE` | 409 | Calendar | Time slot no longer available |
| `CANCEL_DEADLINE_PASSED` | 400 | Calendar | Cannot cancel within deadline |
| `CALENDAR_SYNC_FAILED` | 500 | Calendar | Google/Outlook sync failed |
| `UNAUTHORIZED` | 401 | Auth | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Auth | Insufficient permissions |
| `VENTURE_ISOLATION` | 403 | Auth | Cross-venture data access attempt |

### Retry & Recovery Strategies

| Failure Type | Strategy | Max Retries | Backoff |
|-------------|----------|-------------|---------|
| Channel delivery (email/SMS) | Exponential backoff | 3 | 1s, 2s, 4s |
| Webhook dispatch | Exponential backoff | 5 | 1s, 2s, 4s, 8s, 16s |
| Twilio API calls | Exponential with jitter | 3 | 500ms, 1s, 2s |
| Google Calendar sync | Fixed interval retry | 3 | 60s |
| Elasticsearch indexing | Bulk retry on failure | 3 | 5s |
| Recording download | Exponential backoff | 5 | 10s, 20s, 40s, 80s, 160s |

### Dead Letter Queue (DLQ)

Failed events that exhaust all retries are sent to a dead letter topic in Redpanda. A monitoring dashboard tracks DLQ depth with alerts at:
- **Warning**: > 10 messages in DLQ
- **Critical**: > 100 messages in DLQ

DLQ messages can be replayed manually after the root cause is resolved.

---

## Observability

### Structured Logging

All Nexus services use structured JSON logging with consistent fields:

```typescript
{
  "level": "info",
  "timestamp": "2026-02-09T10:30:00.000Z",
  "service": "nexus",
  "module": "crm",
  "method": "contactService.create",
  "ventureId": "venture-uuid",
  "userId": "user-uuid",
  "correlationId": "req-uuid",
  "duration_ms": 12,
  "result": "success",
  "contact_id": "new-contact-uuid"
}
```

### Metrics

| Metric | Type | Labels | Purpose |
|--------|------|--------|---------|
| `nexus_request_duration_ms` | Histogram | module, method, status | Service method latency |
| `nexus_db_query_duration_ms` | Histogram | table, operation | Database query performance |
| `nexus_event_published_total` | Counter | event_type | Event production rate |
| `nexus_event_processed_total` | Counter | event_type, consumer | Event consumption rate |
| `nexus_event_processing_lag_ms` | Gauge | consumer_group | Event processing delay |
| `nexus_active_conversations` | Gauge | venture, channel | Open conversation count |
| `nexus_active_agents` | Gauge | venture, status | Agent status distribution |
| `nexus_sla_breach_total` | Counter | venture, priority | SLA breach count |
| `nexus_sla_compliance_rate` | Gauge | venture | Overall SLA compliance percentage |
| `nexus_form_submissions_total` | Counter | venture, form | Submission volume |
| `nexus_call_duration_seconds` | Histogram | venture, direction | Call duration distribution |
| `nexus_webhook_delivery_total` | Counter | venture, status | Webhook delivery success/fail |
| `nexus_search_query_duration_ms` | Histogram | index | Search performance |
| `nexus_cache_hit_rate` | Gauge | cache_name | Redis cache effectiveness |

### Health Checks

```typescript
// Nexus health check endpoint
GET /api/health/nexus

{
  "status": "healthy",
  "checks": {
    "database": { "status": "up", "latency_ms": 2 },
    "redis": { "status": "up", "latency_ms": 1 },
    "elasticsearch": { "status": "up", "latency_ms": 15 },
    "redpanda": { "status": "up", "lag": 0 },
    "twilio": { "status": "up" },
    "storage": { "status": "up" }
  },
  "version": "1.0.0",
  "uptime_seconds": 86400
}
```

### Alerting Rules

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| High Latency | P95 > 500ms for 5 min | Warning | Investigate slow queries |
| SLA Breach Spike | > 10 breaches in 1 hour | Critical | Page on-call |
| Event Lag | Consumer lag > 10,000 for 5 min | Warning | Scale consumers |
| DLQ Growth | > 100 DLQ messages | Critical | Investigate failures |
| Agent Offline | All agents offline during business hours | Critical | Notify supervisor |
| Twilio Error Rate | > 5% call failures in 15 min | Warning | Check Twilio status |
| Storage Quota | > 80% of venture storage quota | Warning | Notify admin |
| Database Connections | > 90% pool utilization | Warning | Scale PgBouncer |

### Distributed Tracing

Every request receives a `correlationId` (also used as the OpenTelemetry trace ID) that propagates through:

1. HTTP request headers (`X-Correlation-ID`)
2. Service method calls (via `@mcv/kernel` context)
3. Database queries (logged as spans)
4. Event publishing (stored in event metadata)
5. Webhook dispatch (sent as `X-Correlation-ID` header)

This enables end-to-end request tracing from client action through all backend processing to external service calls and event consumers.

---

## Security

### Multi-Tenancy & Data Isolation

| Control | Implementation |
|---------|---------------|
| **Row-Level Security** | Every table includes `venture_id` with RLS policies enforcing `venture_id = current_setting('app.venture_id')`. This is the primary isolation mechanism and cannot be bypassed by application code. |
| **Context Propagation** | `@mcv/kernel`'s `getContext()` provides `venture.id` and `user.id` for every service call. The database session variable `app.venture_id` is set at connection time from PgBouncer. |
| **Query Enforcement** | All Drizzle queries include `.where(eq(table.ventureId, ctx.ventureId))` as a defense-in-depth measure alongside RLS. |
| **Index Isolation** | Elasticsearch indexes are per-venture (`nexus_{ventureId}_contacts`) to prevent cross-tenant search result leakage. |
| **Cache Isolation** | Redis keys are prefixed with `nexus:{ventureId}:` for namespace isolation. |

### Data Privacy & GDPR

| Requirement | Implementation |
|-------------|---------------|
| **Consent Tracking** | Contact records include `consentGiven`, `consentGivenAt`, `dataRetentionExempt` fields |
| **Marketing Opt-In/Out** | `marketingOptIn`, `marketingOptInAt`, `unsubscribedAt` tracked per contact |
| **Subject Access Requests** | `contactService.exportData(contactId)` generates a complete data export (JSON/CSV) of all related records across submodules |
| **Right to Erasure** | `contactService.erase(contactId)` performs soft delete with cascade to conversations, deals, tickets, submissions. Hard delete available after retention period. |
| **Data Retention** | Configurable per-venture retention policies. A daily cron job identifies expired records and moves them to archive, then purges. `dataRetentionExempt` contacts are skipped. |
| **Data Minimization** | Forms only collect explicitly requested fields. Analytics are aggregated and anonymized. |

### Access Control

| Control | Implementation |
|---------|---------------|
| **Permission-Based** | Every mutation checks `ctx.hasPermission('resource.action')` before executing. Permissions are defined in `@mcv/auth` and enforced by middleware. |
| **Owner-Based** | Document editing restricted to owner or users with `documents.edit.any` permission. Contact owner restrictions available per venture config. |
| **Role Hierarchy** | Owner > Admin > Manager > Agent > Viewer with cumulative permissions. Custom roles supported. |
| **Resource Scoping** | Agents see only their assigned conversations/tickets. Managers see their team's. Admins see all. |

### Credential Security

| Credential | Storage | Access |
|-----------|---------|--------|
| **Twilio SID/Token** | Environment variables | Never stored in DB; accessed via `process.env` |
| **Google OAuth Tokens** | PostgreSQL (encrypted AES-256) | Decrypted only at use time with `GOOGLE_CALENDAR_ENCRYPTION_KEY` |
| **Webhook Secrets** | JSONB in channel_configs | Masked in UI (`****last4`); full value accessible only to system |
| **Share Passwords** | bcrypt hash in documents_shares | Original password never stored; comparison only |
| **API Keys** | Environment variables | Rotatable via zero-downtime env var swap |
| **Share Tokens** | 32-byte crypto random hex | Not guessable UUIDs; one-time validation |

### Input Validation

| Vector | Protection |
|--------|-----------|
| **SQL Injection** | Drizzle ORM parameterized queries — zero raw SQL concatenation |
| **XSS** | Content sanitization on message HTML, document block HTML, and knowledge article HTML |
| **CSRF** | SameSite cookies + CSRF token validation on mutations |
| **File Upload** | MIME type validation, file size limits (configurable, default 100MB), virus scanning via storage layer |
| **Rate Limiting** | Redis-based rate limiting per venture, per user, per endpoint |
| **Email Normalization** | All email addresses lowercased and trimmed before storage and comparison |
| **Phone Normalization** | E.164 format validation and normalization for all phone numbers |
| **Form Validation** | Server-side mirrors client-side: required, minLength, maxLength, pattern, custom validators |
| **Spam Detection** | Honeypot fields, submission timing checks (too fast = bot), optional reCAPTCHA/Turnstile integration |

### Audit Trail

Every security-relevant action is logged to the platform's audit system with:
- **Actor**: userId, IP address, user agent
- **Action**: Create, read, update, delete, share, sign, merge, export
- **Target**: Resource type, resource ID
- **Context**: ventureId, correlationId, timestamp
- **Outcome**: Success or failure with reason

Audit logs are immutable (append-only table with no UPDATE/DELETE permissions) and retained for a minimum of 7 years for compliance.

---

*@mcv/nexus — Communication & Collaboration Domain*
