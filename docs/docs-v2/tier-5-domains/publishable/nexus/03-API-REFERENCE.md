# @mcv/nexus — API Reference

## Tier 5: Domain Packages (Publishable)

**Package:** `@mcv/nexus`  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Calendar Service](#calendar-service)
3. [Calls Service](#calls-service)
4. [Contact Center Service](#contact-center-service)
5. [Conversations Service](#conversations-service)
6. [CRM Service](#crm-service)
7. [Documents Service](#documents-service)
8. [Forms Service](#forms-service)
9. [Sign Service](#sign-service)
10. [Support Service](#support-service)
11. [Shared Types](#shared-types)
12. [Shared Schemas (Zod)](#shared-schemas-zod)
13. [Domain Events](#domain-events)
14. [Error Codes](#error-codes)
15. [Configuration](#configuration)

---

## API Overview

All Nexus services follow consistent patterns:

### Service Method Conventions

```typescript
// Every service method receives context implicitly via @mcv/kernel
// Context provides: ventureId, userId, permissions
import { getContext } from '@mcv/kernel';

// Standard method signature pattern
class ExampleService {
  async create(input: CreateInput): Promise<Resource> { ... }
  async getById(id: string): Promise<Resource> { ... }
  async update(id: string, input: UpdateInput): Promise<Resource> { ... }
  async delete(id: string): Promise<void> { ... }
  async list(filters: ListFilters): Promise<PaginatedResult<Resource>> { ... }
  async search(query: SearchInput): Promise<PaginatedResult<Resource>> { ... }
}
```

### Pagination Pattern

```typescript
// Cursor-based pagination (messages, timelines)
interface CursorPaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  cursor?: string;     // Opaque cursor for next page
}

// Offset-based pagination (lists, search results)
interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

### Authentication & Authorization

All service methods require an authenticated context. The calling layer (API route, server action) is responsible for authentication. Services check permissions via:

```typescript
const ctx = getContext();
if (!ctx.hasPermission('contacts.create')) {
  throw new ForbiddenError('Insufficient permissions');
}
```

### Import Patterns

```typescript
// Service imports
import {
  calendarService,
  callService,
  routingService,
  slaService,
  agentService,
  conversationService,
  contactService,
  organizationService,
  dealService,
  pipelineService,
  activityService,
  documentService,
  folderService,
  formService,
  submissionService,
  signatureService,
  ticketService,
  knowledgeService,
} from '@mcv/nexus';

// Type imports
import type {
  CalendarEvent, BookingPage, Availability, Appointment,
  Call, CallRecording, IvrMenu,
  Inbox, Queue, AgentSession, RoutingResult,
  Conversation, Message, ConversationParticipant,
  Contact, Organization, Deal, Pipeline, Activity,
  Document, DocumentVersion, Folder,
  Form, FormField, FormSubmission,
  SignatureRequest, Signer, SignatureAudit,
  Ticket, TicketComment, KnowledgeArticle,
} from '@mcv/nexus';

// Hook imports (client-side)
import {
  useCalendar, useBookingPage,
  useCallControls, useCallAnalytics,
  useInbox, useAgentSession, useSlaStatus,
  useConversation, useMessages,
  useContacts, useContact, useDeals, usePipeline, useTimeline,
  useDocuments, useFolders,
  useFormBuilder, useFormSubmissions,
  useTickets, useKnowledgeBase,
} from '@mcv/nexus';

// Component imports (client-side)
import {
  CalendarWidget, BookingPageEmbed,
  CallDialer,
  InboxPanel,
  ChatWindow,
  ContactCard, DealBoard, PipelineKanban, ActivityTimeline,
  DocumentExplorer,
  FormRenderer, FormBuilderCanvas,
  SignatureCanvas,
  TicketView, KnowledgePortal,
} from '@mcv/nexus';
```

---

## Calendar Service

### `CalendarService`

Manages calendars, availability, overrides, and Google Calendar sync.

---

#### `calendarService.create(input)`

Creates a new calendar.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input.name` | `string` | ✅ | Calendar display name |
| `input.type` | `'personal' \| 'round_robin' \| 'collective' \| 'class' \| 'service'` | ✅ | Calendar type |
| `input.timezone` | `string` | ✅ | IANA timezone (e.g., `'America/New_York'`) |
| `input.teamMemberIds` | `string[]` | ❌ | User IDs for team calendars |
| `input.color` | `string` | ❌ | Hex color code (default: `#3b82f6`) |
| `input.settings` | `CalendarSettings` | ❌ | Duration, notice, buffer, limits |

**Returns:** `Promise<Calendar>`

**Events Emitted:** `calendar.created`

```typescript
const calendar = await calendarService.create({
  name: 'Sales Discovery Calls',
  type: 'round_robin',
  timezone: 'America/New_York',
  teamMemberIds: ['user-alice', 'user-bob'],
  settings: {
    defaultDuration: 30,        // minutes
    minNotice: 120,             // minutes (2 hours)
    maxAdvance: 30,             // days
    bufferBefore: 5,            // minutes
    bufferAfter: 10,            // minutes
    maxPerDay: 8,
    requiresApproval: false,
    allowReschedule: true,
    allowCancel: true,
    cancelDeadline: 60,         // minutes
  },
});
```

---

#### `calendarService.getAvailability(calendarId, params)`

Returns available time slots for a calendar within a date range.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `calendarId` | `string` | ✅ | Calendar UUID |
| `params.startDate` | `Date` | ✅ | Range start |
| `params.endDate` | `Date` | ✅ | Range end |
| `params.duration` | `number` | ❌ | Slot duration in minutes (default: calendar setting) |
| `params.timezone` | `string` | ❌ | Override timezone for display |

**Returns:** `Promise<AvailabilitySlot[]>`

```typescript
interface AvailabilitySlot {
  start: Date;
  end: Date;
  userId?: string;     // Assigned user (for round-robin)
  available: boolean;
}

const slots = await calendarService.getAvailability('calendar-uuid', {
  startDate: new Date('2026-02-10'),
  endDate: new Date('2026-02-14'),
  duration: 30,
});
// Returns: [{ start: '2026-02-10T09:00', end: '2026-02-10T09:30', available: true }, ...]
```

---

#### `calendarService.setAvailability(calendarId, userId, slots)`

Sets weekly availability schedule for a user on a calendar.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `calendarId` | `string` | ✅ | Calendar UUID |
| `userId` | `string` | ✅ | User UUID |
| `slots` | `AvailabilityInput[]` | ✅ | Weekly schedule entries |

**Returns:** `Promise<void>`

```typescript
await calendarService.setAvailability('calendar-uuid', 'user-alice', [
  { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },  // Monday
  { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },  // Tuesday
  { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },  // Wednesday
  { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },  // Thursday
  { dayOfWeek: 5, startTime: '09:00', endTime: '12:00' },  // Friday (half-day)
]);
```

---

#### `calendarService.addOverride(calendarId, userId, override)`

Adds a date-specific availability override (block or custom hours).

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `calendarId` | `string` | ✅ | Calendar UUID |
| `userId` | `string` | ✅ | User UUID |
| `override.date` | `string` | ✅ | Date in YYYY-MM-DD format |
| `override.isBlocked` | `boolean` | ✅ | Block entire day |
| `override.startTime` | `string` | ❌ | Custom start time (HH:mm) |
| `override.endTime` | `string` | ❌ | Custom end time (HH:mm) |
| `override.reason` | `string` | ❌ | Reason for override |

**Returns:** `Promise<CalendarOverride>`

---

#### `calendarService.configureRoundRobin(calendarId, config)`

Configures round-robin distribution settings for a team calendar.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `calendarId` | `string` | ✅ | Calendar UUID |
| `config.distributionMode` | `'availability' \| 'equal' \| 'priority' \| 'weighted'` | ✅ | Distribution algorithm |
| `config.weights` | `Record<string, number>` | ❌ | User weights (for `weighted` mode) |
| `config.priorities` | `Record<string, number>` | ❌ | User priorities (for `priority` mode) |
| `config.skipIfBusy` | `boolean` | ❌ | Skip busy users (default: true) |
| `config.reassignOnDecline` | `boolean` | ❌ | Reassign if declined (default: true) |

**Returns:** `Promise<RoundRobinConfig>`

---

### `BookingService`

Manages booking pages and appointment lifecycle.

---

#### `bookingService.createPage(input)`

Creates a public booking page linked to a calendar.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input.calendarId` | `string` | ✅ | Calendar UUID |
| `input.slug` | `string` | ✅ | URL slug (must be unique) |
| `input.title` | `string` | ✅ | Page title |
| `input.description` | `string` | ❌ | Page description |
| `input.primaryColor` | `string` | ❌ | Brand color |
| `input.formFields` | `BookingFormField[]` | ❌ | Custom intake fields |
| `input.confirmationMessage` | `string` | ❌ | Post-booking message |
| `input.redirectUrl` | `string` | ❌ | Redirect URL after booking |

**Returns:** `Promise<BookingPage>`

---

#### `bookingService.bookAppointment(input)`

Books an appointment on a calendar. For round-robin calendars, auto-assigns an agent.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input.calendarId` | `string` | ✅ | Calendar UUID |
| `input.contactId` | `string` | ❌ | Contact UUID (or provide contact info) |
| `input.startTime` | `Date` | ✅ | Appointment start time |
| `input.duration` | `number` | ❌ | Duration in minutes (default: calendar setting) |
| `input.meetingType` | `'in_person' \| 'phone' \| 'video' \| 'custom'` | ❌ | Meeting type (default: `video`) |
| `input.customFields` | `Record<string, unknown>` | ❌ | Custom field values from booking form |
| `input.source` | `'booking_page' \| 'manual' \| 'workflow' \| 'api'` | ❌ | Booking origin |

**Returns:** `Promise<Appointment>`

**Events Emitted:** `appointment.booked`

**Errors:**
- `SLOT_UNAVAILABLE` (409) — Selected time slot is no longer available
- `CALENDAR_NOT_FOUND` (404) — Calendar ID does not exist

```typescript
const appointment = await bookingService.bookAppointment({
  calendarId: 'calendar-uuid',
  contactId: 'contact-uuid',
  startTime: new Date('2026-02-12T14:00:00-05:00'),
  duration: 30,
  meetingType: 'video',
  source: 'booking_page',
});
```

---

#### `bookingService.reschedule(appointmentId, input)`

Reschedules an existing appointment to a new time.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `appointmentId` | `string` | ✅ | Appointment UUID |
| `input.newStartTime` | `Date` | ✅ | New start time |
| `input.reason` | `string` | ❌ | Reason for rescheduling |

**Returns:** `Promise<Appointment>`

**Events Emitted:** `appointment.rescheduled`

---

#### `bookingService.cancel(appointmentId, input)`

Cancels an appointment.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `appointmentId` | `string` | ✅ | Appointment UUID |
| `input.reason` | `string` | ❌ | Cancellation reason |
| `input.notifyContact` | `boolean` | ❌ | Send cancellation email (default: true) |

**Returns:** `Promise<void>`

**Events Emitted:** `appointment.cancelled`

**Errors:**
- `CANCEL_DEADLINE_PASSED` (400) — Within cancellation deadline window

---

## Calls Service

### `CallService`

Manages VoIP calls, recordings, analytics, and Twilio webhook processing.

---

#### `callService.initiateCall(input)`

Initiates an outbound call via Twilio.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input.fromNumber` | `string` | ✅ | Caller number (E.164 format) |
| `input.toNumber` | `string` | ✅ | Destination number (E.164 format) |
| `input.contactId` | `string` | ❌ | CRM contact to link |
| `input.conversationId` | `string` | ❌ | Conversation to link |
| `input.recordingEnabled` | `boolean` | ❌ | Enable recording (default: venture setting) |
| `input.transcriptionEnabled` | `boolean` | ❌ | Enable transcription (default: false) |

**Returns:** `Promise<Call>`

**Events Emitted:** `call.initiated`

**Errors:**
- `CALL_INITIATE_FAILED` (500) — Twilio API call failed

```typescript
const call = await callService.initiateCall({
  fromNumber: '+14155551234',
  toNumber: '+14155555678',
  contactId: 'contact-uuid',
  recordingEnabled: true,
  transcriptionEnabled: true,
});
```

---

#### `callService.getCallLog(filters)`

Retrieves paginated call history with filters.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `filters.contactId` | `string` | ❌ | Filter by contact |
| `filters.agentId` | `string` | ❌ | Filter by agent |
| `filters.direction` | `'inbound' \| 'outbound'` | ❌ | Filter by direction |
| `filters.status` | `string` | ❌ | Filter by call status |
| `filters.startDate` | `Date` | ❌ | Range start |
| `filters.endDate` | `Date` | ❌ | Range end |
| `filters.page` | `number` | ❌ | Page number (default: 1) |
| `filters.limit` | `number` | ❌ | Results per page (default: 25) |

**Returns:** `Promise<PaginatedResult<Call>>`

```typescript
const log = await callService.getCallLog({
  direction: 'outbound',
  startDate: new Date('2026-02-01'),
  endDate: new Date('2026-02-28'),
  page: 1,
  limit: 50,
});
```

---

#### `callService.recordCall(callId, options)`

Starts or stops recording on an active call.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `callId` | `string` | ✅ | Call UUID |
| `options.action` | `'start' \| 'stop'` | ✅ | Recording action |

**Returns:** `Promise<CallRecording | void>`

**Events Emitted:** `call.recording.started` or `call.recording.stopped`

---

#### `callService.handleIncomingCall(webhook)`

Processes an incoming call webhook from Twilio. Returns TwiML response.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `webhook.callSid` | `string` | ✅ | Twilio Call SID |
| `webhook.from` | `string` | ✅ | Caller number |
| `webhook.to` | `string` | ✅ | Called number |
| `webhook.timestamp` | `string` | ✅ | ISO 8601 timestamp |

**Returns:** `Promise<{ call: Call; twimlResponse: string }>`

---

#### `callService.getAnalytics(params)`

Returns call analytics with time-series breakdowns.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `params.startDate` | `Date` | ✅ | Range start |
| `params.endDate` | `Date` | ✅ | Range end |
| `params.groupBy` | `'day' \| 'week' \| 'month'` | ❌ | Aggregation period |
| `params.agentId` | `string` | ❌ | Filter by agent |

**Returns:** `Promise<CallAnalytics>`

```typescript
interface CallAnalytics {
  summary: {
    total: number;
    inbound: number;
    outbound: number;
    answerRate: number;          // percentage
    avgDurationSeconds: number;
    totalCostUsd: number;
  };
  duration: {
    average: number;
    median: number;
    p90: number;
  };
  timeSeries: Array<{
    period: string;
    total: number;
    inbound: number;
    outbound: number;
    avgDuration: number;
  }>;
}
```

---

### `IvrService`

Manages Interactive Voice Response (IVR) menus.

---

#### `ivrService.create(input)`

Creates an IVR menu with branching options.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input.name` | `string` | ✅ | Menu name |
| `input.greeting` | `string` | ✅ | Greeting text (TTS) or audio URL |
| `input.options` | `IvrOption[]` | ✅ | Menu options (digit → action) |
| `input.businessHours` | `object` | ❌ | Business hours routing config |
| `input.afterHoursGreeting` | `string` | ❌ | After-hours greeting |

**Returns:** `Promise<IvrMenu>`

```typescript
interface IvrOption {
  digit: string;                 // '1'-'9', '0', '*', '#'
  label: string;                 // Display label
  action: IvrAction;             // What happens when pressed
}

type IvrAction =
  | { type: 'queue'; queueId: string }
  | { type: 'agent'; userId: string }
  | { type: 'menu'; menuId: string }
  | { type: 'voicemail'; greeting?: string }
  | { type: 'external'; number: string }
  | { type: 'hangup' };
```

---

## Contact Center Service

### `RoutingService`

Manages conversation routing and assignment.

---

#### `routingService.routeInteraction(conversationId, inboxId)`

Routes a conversation to an available agent based on the inbox's routing configuration.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `conversationId` | `string` | ✅ | Conversation UUID |
| `inboxId` | `string` | ✅ | Inbox UUID |

**Returns:** `Promise<RoutingResult>`

**Events Emitted:** `inbox.assignment.created`

**Errors:**
- `NO_AGENT_AVAILABLE` (503) — No online agents with available capacity
- `INBOX_NOT_FOUND` (404) — Inbox ID does not exist

```typescript
interface RoutingResult {
  agent: { id: string; name: string } | null;
  queue: { id: string; name: string; position: number } | null;
  assignment: {
    id: string;
    assignmentType: 'direct' | 'queued';
    routingMethod: 'round_robin' | 'skills_based' | 'least_busy' | 'priority';
  };
  sla: {
    policyId: string;
    firstResponseDue: Date;
    resolutionDue: Date;
  };
}

const result = await routingService.routeInteraction('conversation-uuid', 'inbox-uuid');
```

---

#### `routingService.getQueueStatus(queueId)`

Returns real-time queue metrics.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `queueId` | `string` | ✅ | Queue UUID |

**Returns:** `Promise<QueueStatus>`

```typescript
interface QueueStatus {
  queueId: string;
  name: string;
  waitingCount: number;
  activeCount: number;
  avgWaitTimeMs: number;
  longestWaitMs: number;
  agentsAvailable: number;
  agentsBusy: number;
}
```

---

#### `routingService.getAgentMetrics(params)`

Returns agent performance metrics for a time period.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `params.agentId` | `string` | ❌ | Filter by specific agent |
| `params.startDate` | `Date` | ✅ | Range start |
| `params.endDate` | `Date` | ✅ | Range end |

**Returns:** `Promise<AgentMetrics[]>`

```typescript
interface AgentMetrics {
  agentId: string;
  agentName: string;
  conversationsHandled: number;
  avgResponseTimeMs: number;
  avgResolutionTimeMs: number;
  csatScore: number;             // 1.0-5.0
  npsScore: number;              // -100 to 100
  callCount: number;
  talkTimeSeconds: number;
  utilizationPercent: number;
}
```

---

### `SlaService`

Manages SLA tracking, breach detection, and metrics.

---

#### `slaService.getSlaStatus(assignmentId)`

Returns the current SLA status for an assignment.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `assignmentId` | `string` | ✅ | Assignment UUID |

**Returns:** `Promise<SlaStatus>`

```typescript
interface SlaStatus {
  firstResponse: {
    status: 'on_track' | 'at_risk' | 'breached';
    targetMs: number;
    elapsedMs: number;
    remaining: number | null;     // null if breached
    respondedAt: Date | null;
  };
  resolution: {
    status: 'on_track' | 'at_risk' | 'breached';
    targetMs: number;
    elapsedMs: number;
    remaining: number | null;
    resolvedAt: Date | null;
  };
}
```

---

#### `slaService.checkSlaBreaches()`

Batch checks all active assignments for SLA breaches. Intended for cron execution.

**Returns:** `Promise<SlaBreachReport>`

```typescript
interface SlaBreachReport {
  breached: number;
  atRisk: number;
  onTrack: number;
  escalationsTriggered: number;
}
```

---

#### `slaService.getMetrics(params)`

Returns SLA compliance metrics for reporting.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `params.inboxId` | `string` | ❌ | Filter by inbox |
| `params.startDate` | `Date` | ✅ | Range start |
| `params.endDate` | `Date` | ✅ | Range end |

**Returns:** `Promise<SlaMetrics>`

```typescript
interface SlaMetrics {
  firstResponse: {
    rate: number;               // compliance percentage
    avgTimeMs: number;
    medianTimeMs: number;
  };
  resolution: {
    rate: number;
    avgTimeMs: number;
    medianTimeMs: number;
  };
  byPriority: Record<string, { rate: number; avgTimeMs: number }>;
}
```

---

### `AgentService`

Manages agent presence, capacity, and sessions.

---

#### `agentService.setStatus(status)`

Updates the current agent's status.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `status` | `'available' \| 'busy' \| 'on_call' \| 'in_wrap_up' \| 'on_break' \| 'offline'` | ✅ | New status |
| `breakReason` | `string` | ❌ | Reason (when status = `on_break`) |

**Returns:** `Promise<AgentSession>`

---

#### `agentService.getOnlineAgents()`

Returns all online agents with their current status and capacity.

**Returns:** `Promise<AgentSession[]>`

```typescript
interface AgentSession {
  userId: string;
  name: string;
  status: string;
  currentConversationId: string | null;
  dailyCallCount: number;
  dailyTalkTimeSeconds: number;
  statusChangedAt: Date;
}
```

---

## Conversations Service

### `ConversationService`

Manages multi-channel conversations, messages, and participants.

---

#### `conversationService.sendMessage(conversationId, input)`

Sends a message in a conversation. Handles channel delivery asynchronously.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `conversationId` | `string` | ✅ | Conversation UUID |
| `input.content` | `string` | ✅ | Message content |
| `input.contentType` | `'text' \| 'html' \| 'markdown'` | ❌ | Content type (default: `text`) |
| `input.senderType` | `'user' \| 'contact' \| 'system'` | ❌ | Sender type (default: `user`) |
| `input.isPrivate` | `boolean` | ❌ | Internal note (default: false) |
| `input.attachments` | `MessageAttachment[]` | ❌ | File attachments |

**Returns:** `Promise<Message>`

**Events Emitted:** `message.sent`

```typescript
const message = await conversationService.sendMessage('conv-uuid', {
  content: 'Hello! How can I help you today?',
  contentType: 'text',
  senderType: 'user',
});
```

---

#### `conversationService.getThread(conversationId, params)`

Retrieves paginated messages for a conversation.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `conversationId` | `string` | ✅ | Conversation UUID |
| `params.limit` | `number` | ❌ | Messages per page (default: 50) |
| `params.before` | `string` | ❌ | Cursor for messages before this point |
| `params.after` | `string` | ❌ | Cursor for messages after this point |
| `params.includePrivate` | `boolean` | ❌ | Include internal notes (default: false) |

**Returns:** `Promise<{ messages: Message[]; hasMore: boolean; cursor?: string }>`

---

#### `conversationService.createChannel(input)`

Creates a new conversation on a specific channel.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input.channel` | `'email' \| 'sms' \| 'voice' \| 'chat' \| 'whatsapp' \| 'facebook' \| 'instagram' \| 'slack'` | ✅ | Communication channel |
| `input.contactId` | `string` | ❌ | Contact UUID |
| `input.subject` | `string` | ❌ | Conversation subject (for email) |
| `input.inboxId` | `string` | ❌ | Inbox UUID (triggers auto-routing) |
| `input.channelData` | `object` | ❌ | Channel-specific metadata |
| `input.tags` | `string[]` | ❌ | Tags for categorization |

**Returns:** `Promise<Conversation>`

**Events Emitted:** `conversation.created`

---

#### `conversationService.markAsRead(conversationId)`

Marks all messages as read for the current user.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `conversationId` | `string` | ✅ | Conversation UUID |

**Returns:** `Promise<void>`

---

#### `conversationService.snooze(conversationId, until)`

Snoozes a conversation until a specified time.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `conversationId` | `string` | ✅ | Conversation UUID |
| `until` | `Date` | ✅ | When to unsnooze |

**Returns:** `Promise<Conversation>`

---

#### `conversationService.assign(conversationId, userId)`

Assigns or reassigns a conversation to an agent.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `conversationId` | `string` | ✅ | Conversation UUID |
| `userId` | `string` | ✅ | Agent user UUID |

**Returns:** `Promise<Conversation>`

**Events Emitted:** `inbox.assignment.created` or `inbox.assignment.reassigned`

---

## CRM Service

### `ContactService`

Manages contacts (people), search, merge, and timeline.

---

#### `contactService.create(input)`

Creates a new CRM contact.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input.email` | `string` | ❌ | Email address (auto-lowercased) |
| `input.firstName` | `string` | ❌ | First name |
| `input.lastName` | `string` | ❌ | Last name |
| `input.phone` | `string` | ❌ | Phone (E.164 format) |
| `input.organizationId` | `string` | ❌ | Organization UUID |
| `input.title` | `string` | ❌ | Job title |
| `input.type` | `string` | ❌ | Contact type (lead, prospect, customer) |
| `input.source` | `string` | ❌ | Acquisition source |
| `input.lifecycleStage` | `string` | ❌ | Lifecycle stage |
| `input.ownerId` | `string` | ❌ | Owner user UUID |
| `input.customFields` | `Record<string, unknown>` | ❌ | Custom field values |
| `input.tags` | `string[]` | ❌ | Tags |

**Returns:** `Promise<Contact>`

**Events Emitted:** `contact.created`

**Errors:**
- `CONTACT_DUPLICATE_EMAIL` (409) — Email already exists in venture

---

#### `contactService.search(params)`

Searches contacts with filters and sorting.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `params.query` | `string` | ❌ | Full-text search query |
| `params.status` | `string` | ❌ | Filter by status |
| `params.type` | `string` | ❌ | Filter by type |
| `params.lifecycleStage` | `string` | ❌ | Filter by lifecycle |
| `params.ownerId` | `string` | ❌ | Filter by owner |
| `params.tags` | `string[]` | ❌ | Filter by tags (AND) |
| `params.sortBy` | `string` | ❌ | Sort field |
| `params.sortOrder` | `'asc' \| 'desc'` | ❌ | Sort direction |
| `params.page` | `number` | ❌ | Page number |
| `params.limit` | `number` | ❌ | Results per page |

**Returns:** `Promise<PaginatedResult<Contact>>`

---

#### `contactService.merge(primaryId, duplicateIds)`

Merges duplicate contacts into a primary contact.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `primaryId` | `string` | ✅ | Surviving contact UUID |
| `duplicateIds` | `string[]` | ✅ | Contacts to merge into primary |

**Returns:** `Promise<Contact>`

**Events Emitted:** `contact.merged`

---

#### `contactService.getTimeline(contactId, params)`

Returns the unified activity timeline for a contact.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `contactId` | `string` | ✅ | Contact UUID |
| `params.limit` | `number` | ❌ | Entries per page (default: 50) |
| `params.before` | `string` | ❌ | Cursor for pagination |
| `params.types` | `string[]` | ❌ | Filter by activity types |

**Returns:** `Promise<{ entries: TimelineEntry[]; hasMore: boolean; cursor?: string }>`

```typescript
interface TimelineEntry {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'task' | 'deal_change' | 'ticket' | 'form_submit' | 'page_view';
  timestamp: Date;
  data: Record<string, unknown>;
  userId?: string;
}
```

---

#### `contactService.logInteraction(contactId, input)`

Logs an activity/interaction on a contact's timeline.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `contactId` | `string` | ✅ | Contact UUID |
| `input.type` | `string` | ✅ | Activity type |
| `input.subject` | `string` | ❌ | Activity subject |
| `input.body` | `string` | ❌ | Activity body/notes |
| `input.dealId` | `string` | ❌ | Related deal UUID |
| `input.metadata` | `Record<string, unknown>` | ❌ | Additional data |

**Returns:** `Promise<Activity>`

---

### `DealService`

Manages deals, pipeline movement, and forecasting.

---

#### `dealService.create(input)`

Creates a new deal in a pipeline.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input.name` | `string` | ✅ | Deal name |
| `input.pipelineId` | `string` | ✅ | Pipeline UUID |
| `input.stageId` | `string` | ✅ | Initial stage UUID |
| `input.amount` | `string` | ❌ | Deal value (decimal string) |
| `input.currency` | `string` | ❌ | Currency code (default: USD) |
| `input.probability` | `number` | ❌ | Win probability 0-100 |
| `input.expectedCloseDate` | `Date` | ❌ | Expected close date |
| `input.contactId` | `string` | ❌ | Primary contact UUID |
| `input.organizationId` | `string` | ❌ | Organization UUID |
| `input.source` | `string` | ❌ | Deal source |
| `input.tags` | `string[]` | ❌ | Tags |

**Returns:** `Promise<Deal>`

**Events Emitted:** `deal.created`

---

#### `dealService.moveToStage(dealId, stageId)`

Moves a deal to a different pipeline stage. Auto-updates probability.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `dealId` | `string` | ✅ | Deal UUID |
| `stageId` | `string` | ✅ | Target stage UUID |

**Returns:** `Promise<Deal>`

**Events Emitted:** `deal.stage_changed`

**Errors:**
- `DEAL_INVALID_STAGE` (400) — Stage does not belong to deal's pipeline

---

#### `dealService.win(dealId, options)`

Marks a deal as won.

**Returns:** `Promise<Deal>` — **Events:** `deal.won`

---

#### `dealService.lose(dealId, options)`

Marks a deal as lost.

**Returns:** `Promise<Deal>` — **Events:** `deal.lost`

---

#### `dealService.getForecast(pipelineId, params)`

Returns revenue forecast for a pipeline.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `pipelineId` | `string` | ✅ | Pipeline UUID |
| `params.startDate` | `Date` | ✅ | Forecast period start |
| `params.endDate` | `Date` | ✅ | Forecast period end |
| `params.groupBy` | `'month' \| 'quarter'` | ❌ | Aggregation period |

**Returns:** `Promise<DealForecast>`

```typescript
interface DealForecast {
  totals: {
    count: number;
    totalAmount: string;
    weightedAmount: string;
    bestCase: string;
    worstCase: string;
    closedWonAmount: string;
  };
  periods: Array<{
    period: string;
    count: number;
    totalAmount: string;
    weightedAmount: string;
  }>;
}
```

---

#### `dealService.getVelocityMetrics(pipelineId, days)`

Returns pipeline velocity metrics.

**Returns:** `Promise<VelocityMetrics>`

```typescript
interface VelocityMetrics {
  winRate: number;               // percentage
  avgCycleTimeDays: number;
  avgDealSize: string;           // decimal string
  dealsPerMonth: number;
  pipelineVelocity: string;     // winRate × avgDealSize × dealsPerMonth / avgCycleTime
}
```

---

## Documents Service

### `DocumentService`

Manages documents, uploads, sharing, versions, and AI suggestions.

---

#### `documentService.uploadDoc(input, file)`

Uploads a new document.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input.name` | `string` | ✅ | Document name |
| `input.description` | `string` | ❌ | Description |
| `input.folderId` | `string` | ❌ | Parent folder UUID |
| `input.tags` | `string[]` | ❌ | Tags |
| `file` | `File` | ✅ | File object |

**Returns:** `Promise<Document>`

**Events Emitted:** `document.uploaded`

---

#### `documentService.shareDoc(documentId, input)`

Creates a share link for a document.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `documentId` | `string` | ✅ | Document UUID |
| `input.shareType` | `'link' \| 'email' \| 'embed'` | ✅ | Share method |
| `input.permission` | `'view' \| 'comment' \| 'edit'` | ✅ | Permission level |
| `input.allowDownload` | `boolean` | ❌ | Allow download (default: true) |
| `input.allowPrint` | `boolean` | ❌ | Allow print (default: true) |
| `input.password` | `string` | ❌ | Password protect |
| `input.expiresAt` | `Date` | ❌ | Expiration date |
| `input.recipientEmails` | `string[]` | ❌ | Email recipients (for email share) |

**Returns:** `Promise<{ share: DocumentShare; url: string }>`

**Events Emitted:** `document.shared`

**Errors:**
- `DOCUMENT_NOT_FOUND` (404) — Document ID does not exist

---

#### `documentService.getVersions(documentId)`

Returns version history for a document.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `documentId` | `string` | ✅ | Document UUID |

**Returns:** `Promise<DocumentVersion[]>`

```typescript
interface DocumentVersion {
  id: string;
  version: number;
  changedBy: string;
  changeDescription: string;
  createdAt: Date;
  blocks: DocumentBlock[];      // Full snapshot
}
```

---

#### `documentService.createFromTemplate(templateId, input)`

Creates a document from a template with variable resolution.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `templateId` | `string` | ✅ | Template UUID |
| `input.title` | `string` | ✅ | Document title |
| `input.variables` | `Record<string, string>` | ❌ | Variable values for merge fields |
| `input.folderId` | `string` | ❌ | Parent folder UUID |

**Returns:** `Promise<Document>`

---

#### `documentService.accessShared(token, password?)`

Accesses a shared document via share token. Public endpoint.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `token` | `string` | ✅ | Share token (32-byte hex) |
| `password` | `string` | ❌ | Password (if share is password-protected) |

**Returns:** `Promise<{ document: Document; share: DocumentShare }>`

**Errors:**
- `SHARE_NOT_FOUND` (404) — Token does not exist
- `SHARE_EXPIRED` (401) — Share link expired
- `SHARE_PASSWORD_REQUIRED` (401) — Password required
- `SHARE_PASSWORD_INVALID` (401) — Wrong password

---

### `FolderService`

Manages folder hierarchy and navigation.

---

#### `folderService.create(input)`

Creates a new folder.

**Returns:** `Promise<Folder>`

---

#### `folderService.getContents(folderId)`

Returns folder contents (subfolders and documents).

**Returns:** `Promise<{ folders: Folder[]; documents: Document[] }>`

---

#### `folderService.move(folderId, newParentId)`

Moves a folder to a new parent.

**Returns:** `Promise<Folder>`

---

## Forms Service

### `FormService`

Manages form definitions, fields, publishing, and versions.

---

#### `formService.createForm(input)`

Creates a new form.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input.name` | `string` | ✅ | Form name |
| `input.type` | `'form' \| 'survey' \| 'quiz'` | ❌ | Form type (default: `form`) |
| `input.description` | `string` | ❌ | Description |
| `input.settings` | `FormSettings` | ❌ | Form behavior settings |

**Returns:** `Promise<Form>`

```typescript
interface FormSettings {
  requireAuth: boolean;
  showProgressBar: boolean;
  enableCaptcha: boolean;
  captchaType: 'recaptcha' | 'turnstile';
  submitButtonText: string;
  collectMetadata: boolean;
  successMessage: string;
  redirectUrl?: string;
  submissionLimit?: number;
  deadline?: Date;
  notifyEmails?: string[];
  doubleOptIn?: boolean;
}
```

---

#### `formService.addField(formId, field)`

Adds a field to a form.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `formId` | `string` | ✅ | Form UUID |
| `field.type` | `FieldType` | ✅ | One of 28 field types |
| `field.label` | `string` | ✅ | Field label |
| `field.required` | `boolean` | ❌ | Required (default: false) |
| `field.placeholder` | `string` | ❌ | Placeholder text |
| `field.helpText` | `string` | ❌ | Help text |
| `field.validation` | `FieldValidation` | ❌ | Validation rules |
| `field.conditionalLogic` | `ConditionalLogic` | ❌ | Show/hide conditions |
| `field.options` | `FieldOption[]` | ❌ | Options (select, radio, etc.) |
| `field.contactFieldMapping` | `string` | ❌ | CRM field to map to |
| `field.stepIndex` | `number` | ❌ | Step for multi-step forms |

**Returns:** `Promise<FormField>`

---

#### `formService.publish(formId)`

Publishes a form, making it available for submissions. Creates a version snapshot.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `formId` | `string` | ✅ | Form UUID |

**Returns:** `Promise<Form>`

**Events Emitted:** `form.published`

**Errors:**
- `FORM_NO_FIELDS` (400) — Form must have at least one field

---

### `SubmissionService`

Handles form submissions, validation, and exports.

---

#### `submissionService.getSubmissions(formId, params)`

Returns paginated submissions for a form.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `formId` | `string` | ✅ | Form UUID |
| `params.page` | `number` | ❌ | Page number |
| `params.limit` | `number` | ❌ | Per page (default: 25) |
| `params.startDate` | `Date` | ❌ | Filter by submission date |
| `params.endDate` | `Date` | ❌ | Filter by submission date |
| `params.isSpam` | `boolean` | ❌ | Filter spam/non-spam |
| `params.isPartial` | `boolean` | ❌ | Filter partial/complete |

**Returns:** `Promise<PaginatedResult<FormSubmission>>`

---

#### `submissionService.submit(formId, input)`

Submits a form response. Validates fields, checks spam, maps to CRM contacts, and triggers webhooks.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `formId` | `string` | ✅ | Form UUID |
| `input.data` | `Record<string, unknown>` | ✅ | Field name → value |
| `input.metadata` | `object` | ❌ | IP address, user agent, referrer |
| `input.startedAt` | `string` | ❌ | ISO 8601 start time (for timing check) |

**Returns:** `Promise<FormSubmission>`

**Events Emitted:** `form.submission.created`

**Errors:**
- `FORM_NOT_PUBLISHED` (400) — Form not published
- `FORM_LIMIT_REACHED` (429) — Submission limit reached
- `FORM_DEADLINE_PASSED` (400) — Past deadline
- `SUBMISSION_VALIDATION_FAILED` (400) — Field validation errors
- `SUBMISSION_SPAM_DETECTED` (400) — Spam detected

---

#### `submissionService.exportToCsv(formId, params)`

Exports submissions as CSV.

**Returns:** `Promise<string>` — CSV string

---

## Sign Service

### `SignatureService`

Manages signature requests, signing workflow, and audit trails.

---

#### `signatureService.requestSignature(input)`

Creates a new signature request.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input.documentId` | `string` | ✅ | Source document UUID |
| `input.title` | `string` | ✅ | Request title |
| `input.message` | `string` | ❌ | Message to signers |
| `input.signers` | `SignerInput[]` | ✅ | List of signers |
| `input.fields` | `SignatureFieldInput[]` | ❌ | Signature/date field placements |
| `input.expiresAt` | `Date` | ❌ | Expiration date |

**Returns:** `Promise<SignatureRequest>`

**Events Emitted:** `signature.request.created`

```typescript
interface SignerInput {
  email: string;
  name: string;
  role: string;                  // e.g., 'client', 'company', 'witness'
  order: number;                 // 0 = parallel, 1+ = sequential order
}

interface SignatureFieldInput {
  type: 'signature' | 'initials' | 'date' | 'text';
  page: number;
  x: number;
  y: number;
  signerIndex: number;           // Which signer this field belongs to
  required?: boolean;
}
```

---

#### `signatureService.getSignatureStatus(requestId)`

Returns the current status of a signature request.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `requestId` | `string` | ✅ | Signature request UUID |

**Returns:** `Promise<SignatureStatus>`

```typescript
interface SignatureStatus {
  id: string;
  status: 'pending' | 'partial' | 'completed' | 'voided' | 'expired';
  signedCount: number;
  totalSigners: number;
  signers: Array<{
    email: string;
    name: string;
    status: 'pending' | 'signed' | 'declined';
    signedAt: Date | null;
  }>;
  documentUrl: string | null;    // Final PDF (when completed)
  createdAt: Date;
  expiresAt: Date | null;
}
```

---

#### `signatureService.sign(signerId, signatureData)`

Records a signature for a signer. Advances the workflow.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `signerId` | `string` | ✅ | Signer UUID (from token) |
| `signatureData.signature` | `string` | ✅ | Signature image (data URL or typed text) |
| `signatureData.ipAddress` | `string` | ✅ | Signer's IP address |
| `signatureData.userAgent` | `string` | ✅ | Signer's browser user agent |

**Returns:** `Promise<SignatureRequest>`

**Events Emitted:** `signature.completed` (when all signers done)

---

#### `signatureService.getAuditTrail(requestId)`

Returns the complete audit trail for a signature request.

**Returns:** `Promise<SignatureAudit[]>`

```typescript
interface SignatureAudit {
  id: string;
  action: 'created' | 'sent' | 'viewed' | 'signed' | 'declined' | 'voided' | 'expired' | 'reminded';
  actorEmail: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}
```

---

#### `signatureService.void(requestId, reason)`

Voids an active signature request.

**Returns:** `Promise<void>`

**Events Emitted:** `signature.voided`

---

#### `signatureService.sendReminder(requestId, signerEmail)`

Sends a reminder to a pending signer.

**Returns:** `Promise<void>`

---

## Support Service

### `TicketService`

Manages support tickets, comments, SLA, and satisfaction.

---

#### `ticketService.createTicket(input)`

Creates a new support ticket with auto-generated ticket number and SLA deadlines.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input.subject` | `string` | ✅ | Ticket subject |
| `input.description` | `string` | ❌ | Detailed description |
| `input.priority` | `'low' \| 'normal' \| 'high' \| 'urgent'` | ❌ | Priority (default: `normal`) |
| `input.type` | `'question' \| 'incident' \| 'problem' \| 'task'` | ❌ | Ticket type |
| `input.contactId` | `string` | ❌ | Reporting contact UUID |
| `input.conversationId` | `string` | ❌ | Linked conversation UUID |
| `input.channel` | `string` | ❌ | Intake channel (web, email, chat, etc.) |
| `input.categoryId` | `string` | ❌ | Ticket category UUID |
| `input.groupId` | `string` | ❌ | Support group UUID |
| `input.tags` | `string[]` | ❌ | Tags |

**Returns:** `Promise<Ticket>`

**Events Emitted:** `ticket.created`

```typescript
const ticket = await ticketService.createTicket({
  subject: 'Cannot access dashboard',
  description: 'Getting 403 error after password reset...',
  priority: 'high',
  type: 'incident',
  contactId: 'contact-uuid',
  channel: 'email',
});
// ticket.ticketNumber = '2602-00042'
// ticket.firstResponseDue = <computed from SLA>
// ticket.resolutionDue = <computed from SLA>
```

---

#### `ticketService.addComment(ticketId, input)`

Adds a comment (public reply or internal note) to a ticket.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `ticketId` | `string` | ✅ | Ticket UUID |
| `input.body` | `string` | ✅ | Comment body (markdown supported) |
| `input.isPublic` | `boolean` | ❌ | Public reply vs internal note (default: true) |
| `input.via` | `string` | ❌ | Comment source (web, email, api) |
| `input.attachments` | `string[]` | ❌ | Attachment URLs |

**Returns:** `Promise<{ ticket: Ticket; comment: TicketComment }>`

**Events Emitted:** `ticket.comment.created`

---

#### `ticketService.assignAgent(ticketId, agentId)`

Assigns a ticket to an agent.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `ticketId` | `string` | ✅ | Ticket UUID |
| `agentId` | `string` | ✅ | Agent user UUID |

**Returns:** `Promise<Ticket>`

**Events Emitted:** `ticket.assigned`

---

#### `ticketService.resolveTicket(ticketId, options)`

Resolves a ticket (sets status to solved). Triggers CSAT survey.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `ticketId` | `string` | ✅ | Ticket UUID |
| `options.resolution` | `string` | ❌ | Resolution notes |
| `options.sendSurvey` | `boolean` | ❌ | Send CSAT survey (default: true) |

**Returns:** `Promise<Ticket>`

**Events Emitted:** `ticket.status_changed`, `ticket.satisfaction.sent`

**Errors:**
- `TICKET_ALREADY_CLOSED` (400) — Cannot modify closed ticket

---

#### `ticketService.merge(targetId, sourceIds)`

Merges source tickets into target. Moves all comments.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `targetId` | `string` | ✅ | Target (surviving) ticket UUID |
| `sourceIds` | `string[]` | ✅ | Source ticket UUIDs to merge |

**Returns:** `Promise<Ticket>`

**Events Emitted:** `ticket.merged`

---

#### `ticketService.changeStatus(ticketId, status)`

Changes ticket status.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `ticketId` | `string` | ✅ | Ticket UUID |
| `status` | `'open' \| 'pending' \| 'on_hold' \| 'solved' \| 'closed'` | ✅ | New status |

**Returns:** `Promise<Ticket>`

**Events Emitted:** `ticket.status_changed`

---

### `KnowledgeService`

Manages knowledge base articles.

---

#### `knowledgeService.create(input)`

Creates a knowledge base article.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input.title` | `string` | ✅ | Article title |
| `input.slug` | `string` | ✅ | URL slug |
| `input.body` | `string` | ✅ | Article body (markdown) |
| `input.summary` | `string` | ❌ | Short summary |
| `input.categoryId` | `string` | ❌ | Category UUID |
| `input.isPublic` | `boolean` | ❌ | Public visibility (default: true) |
| `input.metaTitle` | `string` | ❌ | SEO meta title |
| `input.metaDescription` | `string` | ❌ | SEO meta description |

**Returns:** `Promise<KnowledgeArticle>`

---

#### `knowledgeService.publish(articleId)`

Publishes a draft article.

**Returns:** `Promise<KnowledgeArticle>`

---

#### `knowledgeService.search(query, params)`

Full-text searches knowledge base articles.

**Returns:** `Promise<PaginatedResult<KnowledgeArticle>>`

---

#### `knowledgeService.recordFeedback(articleId, input)`

Records helpful/not-helpful feedback.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `articleId` | `string` | ✅ | Article UUID |
| `input.helpful` | `boolean` | ✅ | Was the article helpful? |

**Returns:** `Promise<void>`

---

## Shared Types

### Core Types

```typescript
// Calendar
type CalendarType = 'personal' | 'round_robin' | 'collective' | 'class' | 'service';
type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
type MeetingType = 'in_person' | 'phone' | 'video' | 'custom';
type RoundRobinMode = 'availability' | 'equal' | 'priority' | 'weighted';

// Calls
type CallDirection = 'inbound' | 'outbound';
type CallStatus = 'initiated' | 'ringing' | 'in_progress' | 'on_hold' | 'completed' | 'no_answer' | 'busy' | 'failed' | 'voicemail';

// Contact Center
type AgentStatus = 'available' | 'busy' | 'on_call' | 'in_wrap_up' | 'on_break' | 'offline';
type RoutingMethod = 'round_robin' | 'skills_based' | 'least_busy' | 'priority';
type SlaStatusLevel = 'on_track' | 'at_risk' | 'breached';
type SupervisorMode = 'silent_monitor' | 'whisper' | 'barge';
type DialerType = 'power' | 'predictive' | 'preview';

// Conversations
type ConversationChannel = 'email' | 'sms' | 'voice' | 'chat' | 'whatsapp' | 'facebook' | 'instagram' | 'slack';
type ConversationStatus = 'open' | 'pending' | 'resolved' | 'closed';
type MessageContentType = 'text' | 'html' | 'markdown';
type MessageSenderType = 'user' | 'contact' | 'system';

// CRM
type ContactLifecycleStage = 'lead' | 'marketing_qualified' | 'sales_qualified' | 'opportunity' | 'customer' | 'evangelist' | 'churned';
type DealStatus = 'open' | 'won' | 'lost';
type ScoringCategory = 'behavioral' | 'demographic' | 'firmographic';

// Documents
type DocumentStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived';
type DocumentTemplateCategory = 'invoice' | 'proposal' | 'estimate' | 'contract' | 'report' | 'custom';
type AiSuggestionType = 'rewrite' | 'expand' | 'summarize' | 'translate' | 'tone_change' | 'grammar';
type DocumentAssetType = 'text_snippet' | 'image' | 'logo' | 'signature' | 'clause' | 'pricing_table' | 'header' | 'footer';

// Forms
type FormType = 'form' | 'survey' | 'quiz';
type FormStatus = 'draft' | 'published' | 'archived' | 'closed';
type FormFieldType = 'text' | 'email' | 'phone' | 'textarea' | 'number' | 'select' | 'multi_select' | 'checkbox' | 'radio' | 'date' | 'datetime' | 'time' | 'file' | 'image' | 'rating' | 'nps' | 'scale' | 'hidden' | 'html' | 'signature' | 'payment' | 'address' | 'name' | 'heading' | 'paragraph' | 'divider' | 'spacer';

// Sign
type SignatureStatus = 'pending' | 'partial' | 'completed' | 'voided' | 'expired';
type SignerStatus = 'pending' | 'signed' | 'declined';
type SignatureFieldType = 'signature' | 'initials' | 'date' | 'text';

// Support
type TicketStatus = 'open' | 'pending' | 'on_hold' | 'solved' | 'closed';
type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
type TicketType = 'question' | 'incident' | 'problem' | 'task';
```

### MessageAttachment

```typescript
interface MessageAttachment {
  type: 'file' | 'image' | 'audio' | 'video' | 'location';
  url: string;
  name?: string;
  size?: number;
  mimeType?: string;
  thumbnailUrl?: string;
}
```

### ConditionalLogic (Forms)

```typescript
interface ConditionalLogic {
  when: ConditionalRule[];
  matchType: 'all' | 'any';
  action: 'show' | 'hide' | 'require';
}

interface ConditionalRule {
  field: string;                 // Source field name
  operator: 'eq' | 'neq' | 'contains' | 'not_contains' | 'gt' | 'gte' | 'lt' | 'lte' | 'is_empty' | 'is_not_empty';
  value: string | number | boolean;
}
```

### FieldValidation (Forms)

```typescript
interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;              // Regex pattern
  patternMessage?: string;       // Custom error message
  allowedFileTypes?: string[];   // e.g., ['.pdf', '.doc']
  maxFileSize?: number;          // bytes
  maxFiles?: number;
}
```

---

## Shared Schemas (Zod)

### Contact Schemas

```typescript
import { z } from 'zod';

export const createContactSchema = z.object({
  email: z.string().email().toLowerCase().optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(32).optional(),
  organizationId: z.string().uuid().optional(),
  title: z.string().max(100).optional(),
  type: z.enum(['lead', 'prospect', 'customer', 'partner']).optional(),
  source: z.string().max(100).optional(),
  lifecycleStage: z.enum([
    'lead', 'marketing_qualified', 'sales_qualified',
    'opportunity', 'customer', 'evangelist', 'churned',
  ]).optional(),
  ownerId: z.string().uuid().optional(),
  customFields: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
}).refine(
  (data) => data.email || data.firstName || data.phone,
  { message: 'At least one of email, firstName, or phone is required' }
);

export const contactSearchSchema = z.object({
  query: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  lifecycleStage: z.string().optional(),
  ownerId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'lastActivity', 'leadScore', 'name']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
});
```

### Deal Schemas

```typescript
export const createDealSchema = z.object({
  name: z.string().min(1).max(200),
  pipelineId: z.string().uuid(),
  stageId: z.string().uuid(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  currency: z.string().length(3).default('USD'),
  probability: z.number().int().min(0).max(100).optional(),
  expectedCloseDate: z.coerce.date().optional(),
  contactId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  source: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
});
```

### Form Submission Schema

```typescript
export const submitFormSchema = z.object({
  data: z.record(z.unknown()),
  metadata: z.object({
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
    referrerUrl: z.string().url().optional(),
  }).optional(),
  startedAt: z.string().datetime().optional(),
});
```

### Appointment Schema

```typescript
export const bookAppointmentSchema = z.object({
  calendarId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
  startTime: z.coerce.date(),
  duration: z.number().int().positive().optional(),
  meetingType: z.enum(['in_person', 'phone', 'video', 'custom']).default('video'),
  customFields: z.record(z.unknown()).optional(),
  source: z.enum(['booking_page', 'manual', 'workflow', 'api']).default('manual'),
});
```

---

## Domain Events

All events are published to Redpanda/Kafka topics partitioned by `ventureId`.

### Event Structure

```typescript
interface NexusDomainEvent<T = unknown> {
  id: string;                    // UUID v4
  type: string;                  // Dot-delimited event type
  ventureId: string;             // Venture UUID
  userId: string;                // Actor UUID
  timestamp: string;             // ISO 8601
  version: number;               // Schema version
  data: T;                       // Event payload
  metadata: {
    correlationId: string;       // Request trace ID
    causationId?: string;        // Parent event ID
    source: string;              // 'nexus.crm' | 'nexus.support' | etc.
  };
}
```

### Event Topic Mapping

| Topic | Events |
|-------|--------|
| `nexus.crm` | `contact.*`, `organization.*`, `deal.*`, `pipeline.*` |
| `nexus.conversations` | `conversation.*`, `message.*` |
| `nexus.calls` | `call.*` |
| `nexus.contact-center` | `inbox.*`, `sla.*`, `agent.*` |
| `nexus.forms` | `form.*` |
| `nexus.support` | `ticket.*` |
| `nexus.documents` | `document.*` |
| `nexus.sign` | `signature.*` |
| `nexus.calendar` | `appointment.*`, `calendar.*` |

### Event Payloads (Selected)

```typescript
// contact.created
interface ContactCreatedEvent {
  contactId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  type: string | null;
  source: string | null;
  lifecycleStage: string | null;
}

// deal.stage_changed
interface DealStageChangedEvent {
  dealId: string;
  pipelineId: string;
  previousStageId: string;
  previousStageName: string;
  newStageId: string;
  newStageName: string;
  amount: string | null;
  probability: number;
}

// ticket.created
interface TicketCreatedEvent {
  ticketId: string;
  ticketNumber: string;
  subject: string;
  priority: string;
  contactId: string | null;
  assigneeId: string | null;
  groupId: string | null;
  channel: string;
}

// appointment.booked
interface AppointmentBookedEvent {
  appointmentId: string;
  calendarId: string;
  contactId: string | null;
  assignedUserId: string | null;
  startTime: string;
  endTime: string;
  duration: number;
  source: string;
}

// signature.completed
interface SignatureCompletedEvent {
  requestId: string;
  documentId: string;
  title: string;
  signerCount: number;
  completedAt: string;
  finalDocumentUrl: string;
}
```

---

## Error Codes

### Complete Error Code Reference

| Code | HTTP | Module | Description |
|------|------|--------|-------------|
| `CONTACT_NOT_FOUND` | 404 | CRM | Contact ID does not exist |
| `CONTACT_DUPLICATE_EMAIL` | 409 | CRM | Email already exists in venture |
| `ORGANIZATION_NOT_FOUND` | 404 | CRM | Organization ID does not exist |
| `DEAL_NOT_FOUND` | 404 | CRM | Deal ID does not exist |
| `DEAL_INVALID_STAGE` | 400 | CRM | Stage not in deal's pipeline |
| `DEAL_NO_WON_STAGE` | 400 | CRM | Pipeline has no won stage |
| `DEAL_NO_LOST_STAGE` | 400 | CRM | Pipeline has no lost stage |
| `PIPELINE_NOT_FOUND` | 404 | CRM | Pipeline ID does not exist |
| `CONVERSATION_NOT_FOUND` | 404 | Conversations | Conversation not found |
| `MESSAGE_SEND_FAILED` | 500 | Conversations | Channel delivery failed |
| `INBOX_NOT_FOUND` | 404 | Contact Center | Inbox not found |
| `QUEUE_NOT_FOUND` | 404 | Contact Center | Queue not found |
| `NO_AGENT_AVAILABLE` | 503 | Contact Center | No agents available |
| `ASSIGNMENT_NOT_FOUND` | 404 | Contact Center | Assignment not found |
| `CALL_INITIATE_FAILED` | 500 | Calls | Twilio API call failed |
| `CALL_NOT_FOUND` | 404 | Calls | Call not found |
| `IVR_MENU_NOT_FOUND` | 404 | Calls | IVR menu not found |
| `FORM_NOT_FOUND` | 404 | Forms | Form not found |
| `FORM_NOT_PUBLISHED` | 400 | Forms | Form not published |
| `FORM_LIMIT_REACHED` | 429 | Forms | Submission limit reached |
| `FORM_DEADLINE_PASSED` | 400 | Forms | Past submission deadline |
| `FORM_NO_FIELDS` | 400 | Forms | No fields to publish |
| `FORM_SLUG_CONFLICT` | 409 | Forms | Slug already exists |
| `SUBMISSION_VALIDATION_FAILED` | 400 | Forms | Field validation failed |
| `SUBMISSION_SPAM_DETECTED` | 400 | Forms | Flagged as spam |
| `TICKET_NOT_FOUND` | 404 | Support | Ticket not found |
| `TICKET_ALREADY_CLOSED` | 400 | Support | Cannot modify closed ticket |
| `SLA_POLICY_NOT_FOUND` | 404 | Support | SLA policy not found |
| `ARTICLE_NOT_FOUND` | 404 | Support | Article not found |
| `DOCUMENT_NOT_FOUND` | 404 | Documents | Document not found |
| `DOCUMENT_LOCKED` | 423 | Documents | Locked by another user |
| `DOCUMENT_VERSION_CONFLICT` | 409 | Documents | Version conflict |
| `FOLDER_NOT_FOUND` | 404 | Documents | Folder not found |
| `SHARE_NOT_FOUND` | 404 | Documents | Share token not found |
| `SHARE_EXPIRED` | 401 | Documents | Share link expired |
| `SHARE_PASSWORD_REQUIRED` | 401 | Documents | Password required |
| `SHARE_PASSWORD_INVALID` | 401 | Documents | Wrong password |
| `SIGNATURE_REQUEST_NOT_FOUND` | 404 | Sign | Request not found |
| `SIGNATURE_ALREADY_COMPLETED` | 400 | Sign | Already fully signed |
| `SIGNATURE_EXPIRED` | 400 | Sign | Request expired |
| `CALENDAR_NOT_FOUND` | 404 | Calendar | Calendar not found |
| `APPOINTMENT_NOT_FOUND` | 404 | Calendar | Appointment not found |
| `SLOT_UNAVAILABLE` | 409 | Calendar | Slot no longer available |
| `BOOKING_PAGE_NOT_FOUND` | 404 | Calendar | Booking page not found |
| `CANCEL_DEADLINE_PASSED` | 400 | Calendar | Within cancel deadline |
| `CALENDAR_SYNC_FAILED` | 500 | Calendar | External sync failed |
| `UNAUTHORIZED` | 401 | Auth | Not authenticated |
| `FORBIDDEN` | 403 | Auth | Insufficient permissions |
| `VENTURE_ISOLATION` | 403 | Auth | Cross-venture access |

### Error Response Format

```typescript
interface NexusErrorResponse {
  error: {
    code: string;                // Machine-readable code
    message: string;             // Human-readable message
    statusCode: number;          // HTTP status
    details?: unknown;           // Validation errors, etc.
  };
  requestId: string;             // Correlation ID for debugging
}

// Example response
{
  "error": {
    "code": "SUBMISSION_VALIDATION_FAILED",
    "message": "One or more fields failed validation",
    "statusCode": 400,
    "details": {
      "fieldErrors": {
        "email": ["Invalid email address"],
        "company_size": ["This field is required"]
      }
    }
  },
  "requestId": "req-a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

---

## Configuration

### Environment Variables

```bash
# ─────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────
DATABASE_URL=postgresql://user:pass@host:5432/mcv
DATABASE_READ_URL=postgresql://user:pass@replica:5432/mcv

# ─────────────────────────────────────────────
# TWILIO (Calls, SMS, WhatsApp)
# ─────────────────────────────────────────────
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+14155551234
TWILIO_WEBHOOK_URL=https://api.mcv.one/webhooks/twilio

# ─────────────────────────────────────────────
# EMAIL (SMTP)
# ─────────────────────────────────────────────
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxx
EMAIL_FROM_NAME=MCV.ONE
EMAIL_FROM_ADDRESS=noreply@mcv.one

# ─────────────────────────────────────────────
# WHATSAPP BUSINESS
# ─────────────────────────────────────────────
WHATSAPP_PHONE_NUMBER_ID=xxx
WHATSAPP_BUSINESS_ACCOUNT_ID=xxx
WHATSAPP_API_TOKEN=xxx
WHATSAPP_WEBHOOK_VERIFY_TOKEN=xxx

# ─────────────────────────────────────────────
# GOOGLE CALENDAR SYNC
# ─────────────────────────────────────────────
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URI=https://app.mcv.one/auth/google/callback
GOOGLE_CALENDAR_ENCRYPTION_KEY=xxx    # AES-256 key for token encryption

# ─────────────────────────────────────────────
# MICROSOFT / OUTLOOK SYNC
# ─────────────────────────────────────────────
MICROSOFT_CLIENT_ID=xxx
MICROSOFT_CLIENT_SECRET=xxx
MICROSOFT_TENANT_ID=xxx

# ─────────────────────────────────────────────
# STORAGE
# ─────────────────────────────────────────────
STORAGE_PROVIDER=s3                   # s3 | r2 | local
STORAGE_BUCKET=mcv-nexus-files
STORAGE_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
STORAGE_CDN_URL=https://cdn.mcv.one
STORAGE_MAX_FILE_SIZE=104857600       # 100MB

# ─────────────────────────────────────────────
# TRANSCRIPTION
# ─────────────────────────────────────────────
GOOGLE_SPEECH_CREDENTIALS=/path/to/credentials.json
TRANSCRIPTION_LANGUAGE=en-US

# ─────────────────────────────────────────────
# SEARCH
# ─────────────────────────────────────────────
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_INDEX_PREFIX=nexus_

# ─────────────────────────────────────────────
# APPLICATION
# ─────────────────────────────────────────────
APP_URL=https://app.mcv.one
WEBHOOK_SECRET=xxx

# ─────────────────────────────────────────────
# CRON SCHEDULES
# ─────────────────────────────────────────────
SLA_CHECK_INTERVAL_MS=60000           # 1 minute
REMINDER_CHECK_INTERVAL_MS=60000      # 1 minute
CALENDAR_SYNC_INTERVAL_MS=300000      # 5 minutes
LEAD_SCORE_DECAY_CRON="0 0 * * *"    # Daily midnight
FORM_ANALYTICS_CRON="0 */6 * * *"    # Every 6 hours
```

### Feature Flags (Per-Venture)

```typescript
interface NexusFeatureFlags {
  // Submodule toggles
  crmEnabled: boolean;                 // Default: true
  contactCenterEnabled: boolean;       // Default: true
  conversationsEnabled: boolean;       // Default: true
  callsEnabled: boolean;               // Default: false (requires Twilio)
  formsEnabled: boolean;               // Default: true
  supportEnabled: boolean;             // Default: true
  documentsEnabled: boolean;           // Default: true
  signEnabled: boolean;                // Default: false (premium)
  calendarEnabled: boolean;            // Default: true

  // Feature toggles
  aiDealScoring: boolean;              // Default: false (premium)
  aiContentSuggestions: boolean;       // Default: false (premium)
  predictiveDialer: boolean;           // Default: false (enterprise)
  customObjects: boolean;              // Default: false (premium)
  googleCalendarSync: boolean;         // Default: true
  outlookSync: boolean;                // Default: false
  whatsappChannel: boolean;            // Default: false (requires config)
  facebookChannel: boolean;            // Default: false (requires config)
}
```

---

*@mcv/nexus — Communication & Collaboration Domain*
