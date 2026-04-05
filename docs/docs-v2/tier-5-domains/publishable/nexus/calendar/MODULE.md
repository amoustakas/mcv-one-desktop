# @mcv/nexus/calendar

> Calendar management, event scheduling, and booking engine for the MCV.ONE platform.

**Package:** `@mcv/nexus/calendar`
**Since:** 0.1.0
**Status:** Stable
**Tier:** 5 — Domain Module (Nexus)
**Bundle:** `nexus`
**Owner:** MCV Platform Team
**License:** MIT

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

`@mcv/nexus/calendar` is the centralized calendar and scheduling engine that powers every time-based interaction across MCV ventures. Whether a user is booking a consultation with an advisor, scheduling a team standup, reserving a meeting room, or syncing events from Google Calendar — this module handles it.

### Why It Exists

Time coordination is one of the hardest problems in collaborative software. Every MCV venture — from project management to CRM to HR — needs calendaring, but each has slightly different requirements. Rather than scattering calendar logic across dozens of modules, `@mcv/nexus/calendar` provides a unified scheduling backbone that all ventures consume.

### What It Does

- **Calendar CRUD** — Create and manage multiple calendars per user, team, or venture with color coding, visibility controls, and sharing permissions
- **Event Management** — Full lifecycle management for events including titles, descriptions, locations (physical and virtual), file attachments, and RFC 5545 recurrence rules
- **Scheduling Engine** — Availability checking, conflict detection, free/busy queries, and intelligent scheduling suggestions that find common availability across participants
- **Booking & Appointments** — Public-facing booking pages with configurable appointment types, duration options, buffer times between appointments, and custom intake forms
- **Recurring Events** — Comprehensive recurrence support (daily, weekly, monthly, yearly) with custom rules, exception dates, and granular series editing (this event, this and following, all events)
- **Invitations & RSVP** — Email invitations with RSVP tracking (accept, decline, tentative), waitlist management, and ICS file export for external calendar clients
- **External Calendar Sync** — Bidirectional synchronization with Google Calendar, Microsoft Outlook/Exchange, and Apple Calendar via CalDAV, with conflict resolution and deduplication
- **Reminders & Notifications** — Multi-channel reminders (email, push notification, SMS) with configurable timing intervals and automated no-show detection
- **Resource Booking** — Reserve meeting rooms, equipment, vehicles, and other shared resources with capacity management, availability calendars, and approval workflows
- **Time Zone Intelligence** — Full IANA timezone support, per-event timezone storage, automatic timezone conversion in the UI, and travel-aware scheduling that accounts for timezone changes
- **Analytics & Insights** — Meeting load analysis, booking conversion rates, popular time slot detection, no-show tracking, and resource utilization dashboards

### Design Principles

1. **Multi-tenant by default** — Every calendar, event, and booking is scoped to a tenant via Row-Level Security. Cross-tenant data leakage is architecturally impossible.
2. **Timezone-native** — All timestamps are stored in UTC. Timezone metadata is preserved per-event and per-user. Conversion happens at the edge, never in business logic.
3. **Sync-resilient** — External calendar synchronization is designed for eventual consistency. Sync failures are retried with exponential backoff. Conflicts are resolved deterministically.
4. **RFC 5545 compliant** — Recurrence rules, iCalendar import/export, and RSVP semantics follow the iCalendar specification for maximum interoperability.
5. **Performance at scale** — Calendar queries use materialized date ranges and indexed time windows. A user with 10,000 events gets the same response time as one with 10.

---

## Exports

```typescript
// ─── Services ────────────────────────────────────────────────
export { CalendarService }        from './services/calendar.service';
export { EventService }           from './services/event.service';
export { BookingService }         from './services/booking.service';
export { SchedulingService }      from './services/scheduling.service';
export { SyncService }            from './services/sync.service';
export { ReminderService }        from './services/reminder.service';
export { ResourceService }        from './services/resource.service';
export { AvailabilityService }    from './services/availability.service';
export { RecurrenceService }      from './services/recurrence.service';
export { AnalyticsService }       from './services/analytics.service';

// ─── tRPC Router ─────────────────────────────────────────────
export { calendarRouter }         from './router';
export type { CalendarRouter }    from './router';

// ─── Core Types ──────────────────────────────────────────────
export type { Calendar }          from './types/calendar';
export type { CalendarEvent }     from './types/event';
export type { BookingPage }       from './types/booking';
export type { BookingSlot }       from './types/booking';
export type { Booking }           from './types/booking';
export type { RecurrenceRule }    from './types/recurrence';
export type { Invitation }        from './types/invitation';
export type { CalendarSync }      from './types/sync';
export type { Resource }          from './types/resource';
export type { ResourceBooking }   from './types/resource';
export type { Availability }      from './types/availability';
export type { TimeSlot }          from './types/availability';
export type { FreeBusyResponse }  from './types/availability';
export type { Reminder }          from './types/reminder';
export type { Attendee }          from './types/attendee';
export type { AttendeeStatus }    from './types/attendee';

// ─── Input / Output Schemas (Zod) ───────────────────────────
export { createCalendarSchema }       from './schemas/calendar.schema';
export { updateCalendarSchema }       from './schemas/calendar.schema';
export { createEventSchema }          from './schemas/event.schema';
export { updateEventSchema }          from './schemas/event.schema';
export { createBookingPageSchema }    from './schemas/booking.schema';
export { createBookingSchema }        from './schemas/booking.schema';
export { freeBusyQuerySchema }        from './schemas/availability.schema';
export { schedulingSuggestionSchema } from './schemas/availability.schema';
export { createResourceSchema }       from './schemas/resource.schema';
export { bookResourceSchema }         from './schemas/resource.schema';
export { syncConfigSchema }           from './schemas/sync.schema';
export { recurrenceRuleSchema }       from './schemas/recurrence.schema';
export { reminderSchema }             from './schemas/reminder.schema';

// ─── Database (Drizzle) ─────────────────────────────────────
export { calendars }              from './db/schema/calendars';
export { events }                 from './db/schema/events';
export { eventAttendees }         from './db/schema/event-attendees';
export { bookingPages }           from './db/schema/booking-pages';
export { bookingSlots }           from './db/schema/booking-slots';
export { bookings }               from './db/schema/bookings';
export { recurrenceRules }        from './db/schema/recurrence-rules';
export { calendarSyncs }          from './db/schema/calendar-syncs';
export { resources }              from './db/schema/resources';
export { resourceBookings }       from './db/schema/resource-bookings';
export { reminders }              from './db/schema/reminders';

// ─── Utilities ───────────────────────────────────────────────
export { expandRecurrence }       from './utils/recurrence';
export { toICS }                  from './utils/ics';
export { parseICS }               from './utils/ics';
export { toUTC }                  from './utils/timezone';
export { fromUTC }                from './utils/timezone';
export { findCommonSlots }        from './utils/scheduling';
export { detectConflicts }        from './utils/scheduling';
export { buildFreeBusy }          from './utils/free-busy';
export { mergeAvailability }      from './utils/availability';
export { generateBookingSlots }   from './utils/booking';
export { formatEventTime }        from './utils/formatting';

// ─── Constants ───────────────────────────────────────────────
export { CALENDAR_COLORS }        from './constants';
export { DEFAULT_REMINDER_TIMES } from './constants';
export { MAX_RECURRENCE_EXPAND }  from './constants';
export { SYNC_INTERVALS }        from './constants';
export { BOOKING_DURATIONS }      from './constants';
export { CalendarErrorCode }      from './constants';
```

---

## Architecture

### High-Level Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Client Applications                         │
│           (Web UI · Mobile · Embeddable Booking Widget)               │
└──────────────────────┬───────────────────────────────────────────────┘
                       │ tRPC / REST
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       calendarRouter (tRPC)                          │
│                                                                      │
│  calendar.*  │  event.*  │  booking.*  │  resource.*  │  sync.*     │
│  schedule.*  │  reminder.*  │  analytics.*                           │
└──────┬───────┴──────┬───────┴──────┬────────┴───────┬────────────────┘
       │              │              │                │
       ▼              ▼              ▼                ▼
┌─────────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────────┐
│  Calendar   │ │  Event   │ │  Booking   │ │    Scheduling    │
│  Service    │ │  Service │ │  Service   │ │    Engine        │
│             │ │          │ │            │ │                  │
│ CRUD        │ │ CRUD     │ │ Pages      │ │ Availability     │
│ Sharing     │ │ Recur.   │ │ Slots      │ │ Conflict Det.    │
│ Permissions │ │ Attend.  │ │ Intake     │ │ Free/Busy        │
│ Colors      │ │ Remind.  │ │ Confirm.   │ │ Suggestions      │
└──────┬──────┘ └────┬─────┘ └─────┬──────┘ └────────┬─────────┘
       │             │             │                  │
       ▼             ▼             ▼                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    Data Access Layer (Drizzle ORM)                    │
│                                                                      │
│  calendars · events · event_attendees · booking_pages · bookings    │
│  booking_slots · recurrence_rules · resources · resource_bookings   │
│  calendar_syncs · reminders                                          │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                  Supabase PostgreSQL (Multi-Tenant RLS)               │
│                                                                      │
│  Row-Level Security: tenant_id on every table                        │
│  Indexes: (tenant_id, start_time), (calendar_id, start_time),       │
│           (user_id, start_time), GiST range indexes                  │
│  Extensions: btree_gist (range overlap), pg_trgm (text search)      │
└──────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────┐
                    │   Sync Pipeline      │
                    │                      │
                    │  ┌────────────────┐  │
                    │  │ Google Calendar│  │
                    │  │  (REST API)    │  │
                    │  └────────────────┘  │
                    │  ┌────────────────┐  │
                    │  │ Microsoft Graph│  │
                    │  │  (Outlook/365) │  │
                    │  └────────────────┘  │
                    │  ┌────────────────┐  │
                    │  │ CalDAV/CardDAV │  │
                    │  │  (Apple/Other) │  │
                    │  └────────────────┘  │
                    └──────────┬───────────┘
                               │
                    Push/Pull Sync (Webhooks + Polling)
                               │
                    ┌──────────▼───────────┐
                    │    SyncService        │
                    │                       │
                    │  Deduplication         │
                    │  Conflict Resolution   │
                    │  Delta Detection       │
                    │  Retry w/ Backoff      │
                    └───────────────────────┘
```

### Scheduling Engine

The scheduling engine is the brain of the calendar module. It answers the question: *"When can this meeting happen?"*

```
┌──────────────────────────────────────────────────────────────┐
│                    Scheduling Engine                          │
│                                                              │
│  Input:                                                      │
│    - Participant user IDs                                    │
│    - Desired duration                                        │
│    - Date range to search                                    │
│    - Constraints (working hours, preferred times)            │
│                                                              │
│  Pipeline:                                                   │
│    1. Fetch all participants' events in date range           │
│    2. Expand recurring events into instances                 │
│    3. Merge external calendar busy times                     │
│    4. Build per-participant busy maps                        │
│    5. Compute intersection of free windows                   │
│    6. Filter by constraints (working hours, buffer)          │
│    7. Rank suggestions by preference score                   │
│    8. Return top N suggestions                               │
│                                                              │
│  Output:                                                     │
│    - Ranked list of TimeSlot suggestions                     │
│    - Conflict details if no perfect slot exists              │
│    - Partial availability (who's free when)                  │
└──────────────────────────────────────────────────────────────┘
```

### Sync Pipeline

External calendar synchronization follows a producer-consumer model with guaranteed delivery:

```
┌───────────────┐      ┌──────────────┐      ┌──────────────┐
│ Webhook/Poll  │─────▶│  Sync Queue  │─────▶│  Processor   │
│ Trigger       │      │  (pg_boss)   │      │              │
└───────────────┘      └──────────────┘      └──────┬───────┘
                                                     │
                                              ┌──────▼───────┐
                                              │  Diff Engine │
                                              │              │
                                              │  Compare     │
                                              │  local vs    │
                                              │  remote      │
                                              └──────┬───────┘
                                                     │
                                    ┌────────────────┼────────────────┐
                                    ▼                ▼                ▼
                             ┌───────────┐   ┌───────────┐   ┌───────────┐
                             │  Create   │   │  Update   │   │  Delete   │
                             │  Local    │   │  Local    │   │  Local    │
                             └───────────┘   └───────────┘   └───────────┘
                                    │                │                │
                                    └────────────────┼────────────────┘
                                                     ▼
                                              ┌──────────────┐
                                              │  Sync Log    │
                                              │  (Audit)     │
                                              └──────────────┘
```

**Sync Flow:**

1. **Inbound (Remote → Local):** Webhooks from Google/Microsoft push change notifications. CalDAV uses periodic polling. Changes are queued for processing.
2. **Diff Calculation:** The diff engine compares the remote event state against the local mirror, computing creates, updates, and deletes.
3. **Conflict Resolution:** When the same event is modified both locally and remotely, the engine uses a last-writer-wins strategy with configurable overrides (e.g., "local always wins for title changes").
4. **Outbound (Local → Remote):** Local changes trigger outbound sync jobs. The same diff engine computes what to push to each connected external calendar.
5. **Deduplication:** Events are fingerprinted using a composite of external ID, title, start time, and duration to prevent duplicate creation during sync storms.

### Booking Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│                     Booking Flow                             │
│                                                              │
│  1. Booker visits public booking page URL                    │
│  2. System loads BookingPage config (duration, buffer, etc.) │
│  3. System fetches host's availability:                      │
│     a. Get host's working hours                              │
│     b. Get host's existing events                            │
│     c. Get host's external calendar busy times               │
│     d. Subtract booked slots                                 │
│     e. Apply buffer times between slots                      │
│  4. Available slots displayed to booker                      │
│  5. Booker selects slot and fills intake form                │
│  6. System creates tentative booking (holds slot for 10min)  │
│  7. Confirmation email sent to both parties                  │
│  8. Event created on host's calendar                         │
│  9. Reminders scheduled                                      │
│ 10. Post-meeting: no-show detection if applicable            │
└──────────────────────────────────────────────────────────────┘
```

### Recurrence Expansion

Recurring events are stored as a single event row plus a `recurrence_rules` entry. When querying a date range, the recurrence engine expands rules into concrete instances on-the-fly:

```
┌──────────────────────────────────────────────────────────────┐
│                  Recurrence Expansion                         │
│                                                              │
│  Stored:                                                     │
│    Event: "Weekly Standup"                                   │
│    Rule:  FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=2026-12-31      │
│    Exceptions: [2026-03-15, 2026-07-04]                     │
│    Modifications: { "2026-02-14": { title: "Valentine's" }} │
│                                                              │
│  Query: "Show me Feb 1-28, 2026"                            │
│                                                              │
│  Expansion:                                                  │
│    1. Parse RRULE → generate all dates in [Feb 1, Feb 28]   │
│    2. Remove exception dates (none in Feb)                   │
│    3. Apply per-instance modifications                       │
│    4. Yield concrete event instances with virtual IDs        │
│       (event_id + ":" + instance_date)                       │
│                                                              │
│  Result: 12 event instances, each with unique virtualId     │
└──────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### Calendar

```typescript
/**
 * Represents a named calendar container.
 * Users can have multiple calendars (Personal, Work, Travel, etc.).
 * Teams and ventures can also own calendars.
 */
interface Calendar {
  /** Unique calendar identifier (UUID v7). */
  id: string;

  /** Tenant that owns this calendar. */
  tenantId: string;

  /** Owner — can be a user, team, or venture. */
  ownerId: string;

  /** Owner type discriminator. */
  ownerType: 'user' | 'team' | 'venture';

  /** Display name (e.g., "Personal", "Marketing Team", "Client Meetings"). */
  name: string;

  /** Optional description. */
  description: string | null;

  /** Hex color code for visual identification (e.g., "#4285F4"). */
  color: string;

  /**
   * Visibility level:
   * - 'private'  — Only owner can see events
   * - 'internal' — Visible to team/venture members
   * - 'public'   — Anyone with link can see (for booking pages)
   */
  visibility: 'private' | 'internal' | 'public';

  /** The IANA timezone for this calendar (e.g., "America/New_York"). */
  timezone: string;

  /** Whether this is the owner's default/primary calendar. */
  isPrimary: boolean;

  /** Soft-delete flag. */
  isArchived: boolean;

  /** Metadata (venture-specific config, UI preferences, etc.). */
  metadata: Record<string, unknown>;

  /** ISO 8601 timestamps. */
  createdAt: string;
  updatedAt: string;
}
```

### CalendarEvent

```typescript
/**
 * A single calendar event or the template for a recurring series.
 *
 * Events can be standalone or recurring. Recurring events store the
 * recurrence rule and are expanded into instances at query time.
 */
interface CalendarEvent {
  /** Unique event identifier (UUID v7). */
  id: string;

  /** Tenant scope. */
  tenantId: string;

  /** Calendar this event belongs to. */
  calendarId: string;

  /** User who created the event. */
  creatorId: string;

  /** Event title. */
  title: string;

  /** Rich-text description (Markdown supported). */
  description: string | null;

  /**
   * Location — can be physical address, virtual meeting URL,
   * or a structured location object.
   */
  location: EventLocation | null;

  /**
   * Event timing.
   * All-day events use date strings (no time component).
   * Timed events use ISO 8601 with timezone offset.
   */
  startTime: string;
  endTime: string;
  isAllDay: boolean;

  /**
   * The IANA timezone in which this event was created.
   * Used for recurrence expansion and display.
   * Stored separately from the UTC timestamps.
   */
  timezone: string;

  /** Event status. */
  status: 'confirmed' | 'tentative' | 'cancelled';

  /**
   * Busy/free indicator.
   * 'busy' — blocks the time slot in availability checks
   * 'free' — does not block availability
   * 'tentative' — soft block (shown but schedulable)
   */
  busyStatus: 'busy' | 'free' | 'tentative';

  /** Whether this event is the master of a recurring series. */
  isRecurring: boolean;

  /** Reference to the recurrence rule (if recurring). */
  recurrenceRuleId: string | null;

  /**
   * For modified instances of a recurring event, this points
   * to the master event's ID.
   */
  masterEventId: string | null;

  /**
   * The original start time of this instance (before modification).
   * Used to identify which instance of a recurring series this is.
   */
  originalStartTime: string | null;

  /** File attachment IDs (references to @mcv/nexus/storage). */
  attachmentIds: string[];

  /** Virtual meeting link (Zoom, Meet, Teams, etc.). */
  conferenceUrl: string | null;

  /** Conference provider metadata. */
  conferenceData: ConferenceData | null;

  /** External calendar ID (for synced events). */
  externalId: string | null;

  /** Source sync configuration ID. */
  syncId: string | null;

  /** Custom metadata. */
  metadata: Record<string, unknown>;

  /** ISO 8601 timestamps. */
  createdAt: string;
  updatedAt: string;
}

interface EventLocation {
  /** Display name (e.g., "Conference Room A", "123 Main St"). */
  name: string;

  /** Physical address (optional). */
  address: string | null;

  /** Latitude for map display. */
  latitude: number | null;

  /** Longitude for map display. */
  longitude: number | null;

  /** Virtual meeting URL (e.g., Zoom/Meet link). */
  url: string | null;

  /** Location type discriminator. */
  type: 'physical' | 'virtual' | 'hybrid';
}

interface ConferenceData {
  /** Provider name (e.g., "zoom", "google-meet", "teams"). */
  provider: string;

  /** Join URL for participants. */
  joinUrl: string;

  /** Meeting ID (provider-specific). */
  meetingId: string | null;

  /** Passcode if required. */
  passcode: string | null;

  /** Dial-in phone numbers. */
  dialIn: Array<{ label: string; number: string }>;
}
```

### Attendee

```typescript
/**
 * Represents a participant in a calendar event.
 */
interface Attendee {
  /** Row ID. */
  id: string;

  /** Event this attendance record belongs to. */
  eventId: string;

  /** User ID (null for external attendees). */
  userId: string | null;

  /** Email address (always present — used for external invites). */
  email: string;

  /** Display name. */
  name: string;

  /**
   * RSVP status following iCalendar semantics:
   * - 'needs-action' — No response yet
   * - 'accepted'     — Confirmed attendance
   * - 'declined'     — Will not attend
   * - 'tentative'    — May attend
   */
  status: AttendeeStatus;

  /** Role in the event. */
  role: 'organizer' | 'required' | 'optional' | 'resource';

  /** Whether a response is required for this attendee. */
  rsvpRequired: boolean;

  /** Optional comment with RSVP response. */
  comment: string | null;

  /** When the RSVP was last updated. */
  respondedAt: string | null;

  /** ISO 8601 timestamps. */
  createdAt: string;
  updatedAt: string;
}

type AttendeeStatus = 'needs-action' | 'accepted' | 'declined' | 'tentative';
```

### RecurrenceRule

```typescript
/**
 * RFC 5545 recurrence rule representation.
 *
 * Supports DAILY, WEEKLY, MONTHLY, YEARLY frequencies with
 * all standard RFC 5545 modifiers.
 */
interface RecurrenceRule {
  /** Row ID. */
  id: string;

  /** The event this rule belongs to. */
  eventId: string;

  /** Recurrence frequency. */
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';

  /** Repeat interval (e.g., every 2 weeks = frequency=weekly, interval=2). */
  interval: number;

  /**
   * Days of the week for WEEKLY recurrence.
   * Array of ISO day numbers: 1=Monday, 7=Sunday.
   */
  byDay: number[] | null;

  /**
   * Days of the month for MONTHLY recurrence.
   * Supports negative values (-1 = last day of month).
   */
  byMonthDay: number[] | null;

  /**
   * Months of the year for YEARLY recurrence.
   * 1=January, 12=December.
   */
  byMonth: number[] | null;

  /**
   * Position within a set (e.g., "2nd Tuesday" = byDay=[2], bySetPos=[2]).
   */
  bySetPos: number[] | null;

  /** Week start day (1=Monday, 7=Sunday). Defaults to Monday. */
  weekStart: number;

  /** Recurrence end date (exclusive). Null = infinite (capped at 2 years). */
  until: string | null;

  /** Maximum number of occurrences. Null = no limit (respects `until`). */
  count: number | null;

  /**
   * Exception dates — specific instances to skip.
   * Stored as ISO date strings (YYYY-MM-DD).
   */
  exceptionDates: string[];

  /** ISO 8601 timestamps. */
  createdAt: string;
  updatedAt: string;
}
```

### BookingPage

```typescript
/**
 * A public-facing booking page that allows external users
 * to schedule appointments with a host.
 */
interface BookingPage {
  /** Unique booking page identifier. */
  id: string;

  /** Tenant scope. */
  tenantId: string;

  /** The host user who receives bookings. */
  hostId: string;

  /** Calendar where booked events are created. */
  calendarId: string;

  /** URL slug (e.g., "john-doe/30min-consultation"). */
  slug: string;

  /** Display title (e.g., "30-Minute Consultation"). */
  title: string;

  /** Description shown on the booking page. */
  description: string | null;

  /**
   * Available durations in minutes.
   * The booker can choose from these options.
   */
  durations: number[];

  /** Default duration if only one option. */
  defaultDuration: number;

  /**
   * Buffer time in minutes between appointments.
   * Prevents back-to-back bookings.
   */
  bufferBefore: number;
  bufferAfter: number;

  /**
   * How far in advance bookings are allowed (in days).
   * E.g., 60 = can book up to 60 days out.
   */
  maxAdvanceDays: number;

  /**
   * Minimum notice required (in hours).
   * E.g., 24 = must book at least 24 hours ahead.
   */
  minNoticeHours: number;

  /**
   * Weekly availability windows.
   * Defines when the host is available for bookings.
   */
  availabilitySchedule: WeeklySchedule;

  /**
   * Custom intake form fields.
   * Collected from the booker before confirmation.
   */
  intakeFields: IntakeField[];

  /** Confirmation settings. */
  requiresConfirmation: boolean;

  /** Redirect URL after successful booking (optional). */
  redirectUrl: string | null;

  /** Custom branding. */
  branding: BookingPageBranding | null;

  /** Whether the booking page is active. */
  isActive: boolean;

  /** Location configuration. */
  locationType: 'in-person' | 'virtual' | 'phone' | 'flexible';

  /** Virtual meeting auto-creation provider. */
  conferenceProvider: 'zoom' | 'google-meet' | 'teams' | null;

  /** Slot generation interval in minutes (default 15). */
  slotInterval: number;

  /** Maximum bookings per slot (group events). */
  maxPerSlot: number;

  /** Custom metadata. */
  metadata: Record<string, unknown>;

  /** ISO 8601 timestamps. */
  createdAt: string;
  updatedAt: string;
}

interface WeeklySchedule {
  /** Schedule per day of week. Empty array = unavailable that day. */
  monday: TimeWindow[];
  tuesday: TimeWindow[];
  wednesday: TimeWindow[];
  thursday: TimeWindow[];
  friday: TimeWindow[];
  saturday: TimeWindow[];
  sunday: TimeWindow[];
}

interface TimeWindow {
  /** Start time in HH:mm format (24hr). */
  start: string;
  /** End time in HH:mm format (24hr). */
  end: string;
}

interface IntakeField {
  /** Field identifier. */
  name: string;
  /** Display label. */
  label: string;
  /** Field type. */
  type: 'text' | 'textarea' | 'email' | 'phone' | 'select' | 'checkbox';
  /** Whether the field is required. */
  required: boolean;
  /** Placeholder text. */
  placeholder: string | null;
  /** Options for select fields. */
  options: string[] | null;
}

interface BookingPageBranding {
  /** Logo URL. */
  logoUrl: string | null;
  /** Primary brand color (hex). */
  primaryColor: string | null;
  /** Custom CSS class. */
  customClass: string | null;
}
```

### Booking

```typescript
/**
 * A confirmed or pending booking made through a BookingPage.
 */
interface Booking {
  /** Unique booking identifier. */
  id: string;

  /** Tenant scope. */
  tenantId: string;

  /** Booking page this was made through. */
  bookingPageId: string;

  /** Host user ID. */
  hostId: string;

  /** Created event ID (after confirmation). */
  eventId: string | null;

  /** Booker information. */
  bookerName: string;
  bookerEmail: string;
  bookerPhone: string | null;

  /** Booking times. */
  startTime: string;
  endTime: string;
  timezone: string;

  /** Duration in minutes. */
  duration: number;

  /**
   * Booking status:
   * - 'pending'    — Awaiting host confirmation
   * - 'confirmed'  — Confirmed and event created
   * - 'cancelled'  — Cancelled by host or booker
   * - 'completed'  — Meeting occurred
   * - 'no-show'    — Booker did not attend
   * - 'rescheduled' — Moved to a different time
   */
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show' | 'rescheduled';

  /** Intake form responses. */
  intakeResponses: Record<string, string>;

  /** Cancellation reason (if cancelled). */
  cancellationReason: string | null;

  /** Who cancelled (host or booker). */
  cancelledBy: 'host' | 'booker' | null;

  /** Rescheduled-from booking ID. */
  rescheduledFromId: string | null;

  /** Conference/meeting link. */
  conferenceUrl: string | null;

  /** Custom metadata. */
  metadata: Record<string, unknown>;

  /** ISO 8601 timestamps. */
  createdAt: string;
  updatedAt: string;
}
```

### CalendarSync

```typescript
/**
 * Configuration for external calendar synchronization.
 */
interface CalendarSync {
  /** Sync configuration ID. */
  id: string;

  /** Tenant scope. */
  tenantId: string;

  /** User who owns this sync. */
  userId: string;

  /** Local calendar to sync with. */
  calendarId: string;

  /** External provider. */
  provider: 'google' | 'microsoft' | 'apple' | 'caldav';

  /**
   * Sync direction:
   * - 'inbound'      — External → Local only
   * - 'outbound'     — Local → External only
   * - 'bidirectional' — Two-way sync
   */
  direction: 'inbound' | 'outbound' | 'bidirectional';

  /** External calendar identifier (provider-specific). */
  externalCalendarId: string;

  /** External calendar name for display. */
  externalCalendarName: string;

  /** OAuth token reference (encrypted, stored in @mcv/nexus/auth). */
  tokenRef: string;

  /**
   * CalDAV endpoint URL (only for CalDAV provider).
   */
  caldavUrl: string | null;

  /** Webhook channel ID (for push-based sync). */
  webhookChannelId: string | null;

  /** Webhook expiration (requires renewal). */
  webhookExpiresAt: string | null;

  /** Last successful sync timestamp. */
  lastSyncAt: string | null;

  /** Last sync status. */
  lastSyncStatus: 'success' | 'partial' | 'failed' | null;

  /** Last sync error message. */
  lastSyncError: string | null;

  /** Sync token / delta token for incremental sync. */
  syncToken: string | null;

  /** Whether sync is enabled. */
  isEnabled: boolean;

  /** Sync interval in minutes (for polling-based sync). */
  syncIntervalMinutes: number;

  /**
   * Conflict resolution strategy:
   * - 'local-wins'    — Local changes override remote
   * - 'remote-wins'   — Remote changes override local
   * - 'last-modified' — Most recent modification wins
   */
  conflictStrategy: 'local-wins' | 'remote-wins' | 'last-modified';

  /** ISO 8601 timestamps. */
  createdAt: string;
  updatedAt: string;
}
```

### Resource

```typescript
/**
 * A bookable resource — meeting room, equipment, vehicle, etc.
 */
interface Resource {
  /** Unique resource identifier. */
  id: string;

  /** Tenant scope. */
  tenantId: string;

  /** Resource name (e.g., "Conference Room A", "Projector #3"). */
  name: string;

  /** Description. */
  description: string | null;

  /**
   * Resource type:
   * - 'room'      — Meeting/conference room
   * - 'equipment' — Projector, whiteboard, etc.
   * - 'vehicle'   — Company car, van, etc.
   * - 'desk'      — Hot desk booking
   * - 'other'     — Custom resource type
   */
  type: 'room' | 'equipment' | 'vehicle' | 'desk' | 'other';

  /** Capacity (for rooms). */
  capacity: number | null;

  /** Physical location / floor / building. */
  location: string | null;

  /** Available amenities (whiteboard, video conferencing, etc.). */
  amenities: string[];

  /** Photo URLs for the resource. */
  photoUrls: string[];

  /** Availability schedule (same structure as booking pages). */
  availabilitySchedule: WeeklySchedule;

  /** Whether bookings require approval. */
  requiresApproval: boolean;

  /** User IDs who can approve bookings (if approval required). */
  approverIds: string[];

  /** Maximum booking duration in minutes. */
  maxBookingDuration: number;

  /** Minimum booking duration in minutes. */
  minBookingDuration: number;

  /** Buffer time between bookings in minutes. */
  bufferMinutes: number;

  /** Whether the resource is currently active. */
  isActive: boolean;

  /** Custom metadata. */
  metadata: Record<string, unknown>;

  /** ISO 8601 timestamps. */
  createdAt: string;
  updatedAt: string;
}
```

### ResourceBooking

```typescript
/**
 * A reservation for a resource during a time window.
 */
interface ResourceBooking {
  /** Unique reservation ID. */
  id: string;

  /** Tenant scope. */
  tenantId: string;

  /** Resource being booked. */
  resourceId: string;

  /** User who made the booking. */
  userId: string;

  /** Associated event (optional). */
  eventId: string | null;

  /** Booking time window. */
  startTime: string;
  endTime: string;

  /** Booking purpose / notes. */
  purpose: string | null;

  /**
   * Approval status (only if resource requires approval):
   * - 'pending'  — Awaiting approval
   * - 'approved' — Approved by an approver
   * - 'rejected' — Rejected by an approver
   * - 'auto'     — Auto-approved (no approval required)
   */
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'auto';

  /** Approver user ID (if approved/rejected). */
  approvedBy: string | null;

  /** Approval/rejection timestamp. */
  approvedAt: string | null;

  /** Rejection reason. */
  rejectionReason: string | null;

  /** ISO 8601 timestamps. */
  createdAt: string;
  updatedAt: string;
}
```

### Availability

```typescript
/**
 * Represents a user's availability for scheduling.
 */
interface Availability {
  /** The user ID. */
  userId: string;

  /** Date range queried. */
  startDate: string;
  endDate: string;

  /** Timezone for the availability windows. */
  timezone: string;

  /** Available time slots within the date range. */
  slots: TimeSlot[];

  /** Busy periods (events, bookings, external calendar blocks). */
  busyPeriods: BusyPeriod[];
}

interface TimeSlot {
  /** Slot start time (ISO 8601). */
  start: string;

  /** Slot end time (ISO 8601). */
  end: string;

  /** Duration in minutes. */
  durationMinutes: number;

  /**
   * Confidence that this slot is truly available:
   * - 1.0 — Confirmed free (no events, synced)
   * - 0.5 — Possibly free (external calendar not synced recently)
   * - 0.0 — Only free if tentative events are declined
   */
  confidence: number;
}

interface BusyPeriod {
  /** Busy period start time (ISO 8601). */
  start: string;

  /** Busy period end time (ISO 8601). */
  end: string;

  /** Source of the busy period. */
  source: 'event' | 'booking' | 'external' | 'block';

  /** Optional: event title (redacted to "Busy" for non-organizers). */
  title: string | null;
}

/**
 * Response from a free/busy query across multiple users.
 */
interface FreeBusyResponse {
  /** Query time range. */
  timeMin: string;
  timeMax: string;

  /** Per-user free/busy data. */
  calendars: Record<string, {
    busy: Array<{ start: string; end: string }>;
    errors: string[];
  }>;
}
```

### Invitation

```typescript
/**
 * Represents an email invitation sent for an event.
 */
interface Invitation {
  /** Invitation ID. */
  id: string;

  /** Event this invitation is for. */
  eventId: string;

  /** Attendee record. */
  attendeeId: string;

  /** Recipient email. */
  email: string;

  /** Type of invitation email sent. */
  type: 'invite' | 'update' | 'cancel';

  /** Current attendee status at time of last action. */
  status: AttendeeStatus;

  /** When the invitation email was sent. */
  sentAt: string;

  /** ICS file content (base64 encoded). */
  icsContent: string;

  /** Unique token for RSVP via email link. */
  rsvpToken: string;

  /** Token expiration. */
  rsvpTokenExpiresAt: string;

  /** ISO 8601 timestamps. */
  createdAt: string;
  updatedAt: string;
}
```

### Reminder

```typescript
/**
 * A scheduled reminder for an event.
 */
interface Reminder {
  /** Reminder ID. */
  id: string;

  /** Event this reminder is for. */
  eventId: string;

  /** User to remind. */
  userId: string;

  /**
   * Delivery channels.
   */
  channels: Array<'email' | 'push' | 'sms'>;

  /**
   * Minutes before event start to send the reminder.
   * Common values: 5, 10, 15, 30, 60, 1440 (24hr).
   */
  minutesBefore: number;

  /** Scheduled send time (computed from event start - minutesBefore). */
  scheduledAt: string;

  /** Whether the reminder has been sent. */
  isSent: boolean;

  /** When the reminder was actually sent. */
  sentAt: string | null;

  /** ISO 8601 timestamps. */
  createdAt: string;
  updatedAt: string;
}
```

### CalendarService

```typescript
/**
 * Primary service for calendar CRUD and management operations.
 */
interface CalendarService {
  // ─── Calendar CRUD ─────────────────────────────────────────

  /**
   * Create a new calendar.
   * Validates color, checks for duplicate names within owner scope.
   */
  create(input: CreateCalendarInput): Promise<Calendar>;

  /**
   * Get a calendar by ID.
   * Validates tenant access via RLS.
   */
  getById(calendarId: string): Promise<Calendar>;

  /**
   * List calendars for the authenticated user.
   * Includes owned calendars and shared calendars.
   */
  listForUser(userId: string, options?: {
    includeShared?: boolean;
    includeArchived?: boolean;
    ownerType?: 'user' | 'team' | 'venture';
  }): Promise<Calendar[]>;

  /**
   * Update calendar properties.
   * Partial update — only provided fields are changed.
   */
  update(calendarId: string, input: UpdateCalendarInput): Promise<Calendar>;

  /**
   * Soft-delete (archive) a calendar.
   * Events are preserved but hidden from default views.
   */
  archive(calendarId: string): Promise<void>;

  /**
   * Restore an archived calendar.
   */
  restore(calendarId: string): Promise<void>;

  /**
   * Permanently delete a calendar and all its events.
   * Requires explicit confirmation.
   */
  permanentDelete(calendarId: string, confirm: true): Promise<void>;

  // ─── Sharing ───────────────────────────────────────────────

  /**
   * Share a calendar with another user.
   */
  share(calendarId: string, input: {
    userId: string;
    permission: 'view' | 'edit' | 'manage';
  }): Promise<void>;

  /**
   * Remove sharing for a user.
   */
  unshare(calendarId: string, userId: string): Promise<void>;

  /**
   * List all shares for a calendar.
   */
  listShares(calendarId: string): Promise<Array<{
    userId: string;
    userName: string;
    permission: 'view' | 'edit' | 'manage';
    sharedAt: string;
  }>>;

  // ─── Export ────────────────────────────────────────────────

  /**
   * Export calendar as ICS file.
   */
  exportICS(calendarId: string, options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<string>;

  /**
   * Import events from an ICS file.
   */
  importICS(calendarId: string, icsContent: string): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }>;
}
```

### EventService

```typescript
/**
 * Service for event lifecycle management.
 */
interface EventService {
  // ─── Event CRUD ────────────────────────────────────────────

  /**
   * Create a new event.
   * Handles recurrence rule creation, attendee invitations,
   * reminder scheduling, and conflict detection.
   */
  create(input: CreateEventInput): Promise<CalendarEvent>;

  /**
   * Get event by ID, including attendees and reminders.
   */
  getById(eventId: string): Promise<CalendarEvent & {
    attendees: Attendee[];
    reminders: Reminder[];
    recurrenceRule: RecurrenceRule | null;
  }>;

  /**
   * Query events within a date range across one or more calendars.
   * Expands recurring events into instances.
   */
  query(input: {
    calendarIds: string[];
    startTime: string;
    endTime: string;
    timezone?: string;
    includeDeclined?: boolean;
    search?: string;
  }): Promise<Array<CalendarEvent & {
    /** Virtual ID for recurring instances (eventId:instanceDate). */
    instanceId: string | null;
    attendees: Attendee[];
  }>>;

  /**
   * Update an event.
   * For recurring events, supports scope:
   * - 'this'     — Only this instance
   * - 'following' — This and all future instances
   * - 'all'      — All instances in the series
   */
  update(eventId: string, input: UpdateEventInput, scope?: 'this' | 'following' | 'all'): Promise<CalendarEvent>;

  /**
   * Delete an event.
   * Same scoping rules as update for recurring events.
   */
  delete(eventId: string, scope?: 'this' | 'following' | 'all'): Promise<void>;

  // ─── Attendees ─────────────────────────────────────────────

  /**
   * Add attendees to an event.
   * Sends invitation emails automatically.
   */
  addAttendees(eventId: string, attendees: Array<{
    email: string;
    name?: string;
    role?: 'required' | 'optional';
  }>): Promise<Attendee[]>;

  /**
   * Remove an attendee from an event.
   * Sends cancellation notification.
   */
  removeAttendee(eventId: string, attendeeId: string): Promise<void>;

  /**
   * Update RSVP status for the authenticated user.
   */
  rsvp(eventId: string, status: AttendeeStatus, comment?: string): Promise<Attendee>;

  // ─── Reminders ─────────────────────────────────────────────

  /**
   * Set reminders for the authenticated user on an event.
   * Replaces existing reminders.
   */
  setReminders(eventId: string, reminders: Array<{
    minutesBefore: number;
    channels: Array<'email' | 'push' | 'sms'>;
  }>): Promise<Reminder[]>;

  // ─── Move / Copy ───────────────────────────────────────────

  /**
   * Move event to a different calendar.
   */
  move(eventId: string, targetCalendarId: string): Promise<CalendarEvent>;

  /**
   * Duplicate event to same or different calendar.
   */
  duplicate(eventId: string, targetCalendarId?: string): Promise<CalendarEvent>;
}
```

### SchedulingService

```typescript
/**
 * Intelligent scheduling — availability, conflicts, suggestions.
 */
interface SchedulingService {
  /**
   * Get free/busy information for multiple users.
   * Aggregates local events and external calendar data.
   */
  freeBusy(input: {
    userIds: string[];
    timeMin: string;
    timeMax: string;
    timezone?: string;
  }): Promise<FreeBusyResponse>;

  /**
   * Get a user's available time slots within a date range.
   * Accounts for events, bookings, working hours, and external calendars.
   */
  getAvailability(input: {
    userId: string;
    startDate: string;
    endDate: string;
    duration: number;
    timezone?: string;
    slotInterval?: number;
  }): Promise<Availability>;

  /**
   * Find common available time slots across multiple participants.
   * Returns ranked suggestions based on preference scoring.
   */
  suggestTimes(input: {
    participantIds: string[];
    duration: number;
    dateRange: { start: string; end: string };
    timezone?: string;
    preferences?: {
      /** Preferred time of day. */
      preferredHours?: { start: number; end: number };
      /** Prefer earlier or later in the range. */
      preferEarlier?: boolean;
      /** Avoid back-to-back meetings. */
      bufferMinutes?: number;
    };
    maxSuggestions?: number;
  }): Promise<Array<TimeSlot & {
    /** Participants available for this slot. */
    availableParticipants: string[];
    /** Participants with conflicts. */
    conflictingParticipants: string[];
    /** Overall preference score (0-1). */
    score: number;
  }>>;

  /**
   * Detect scheduling conflicts for a proposed event time.
   */
  detectConflicts(input: {
    userId: string;
    startTime: string;
    endTime: string;
    excludeEventId?: string;
  }): Promise<Array<{
    event: CalendarEvent;
    overlapMinutes: number;
    type: 'hard' | 'soft';
  }>>;
}
```

### BookingService

```typescript
/**
 * Public booking page management and booking lifecycle.
 */
interface BookingService {
  // ─── Booking Page Management ───────────────────────────────

  /** Create a booking page for the authenticated user. */
  createPage(input: CreateBookingPageInput): Promise<BookingPage>;

  /** Get booking page by ID (host only). */
  getPage(pageId: string): Promise<BookingPage>;

  /** Get booking page by public slug (no auth required). */
  getPageBySlug(slug: string): Promise<BookingPage>;

  /** Update booking page configuration. */
  updatePage(pageId: string, input: UpdateBookingPageInput): Promise<BookingPage>;

  /** Delete a booking page. */
  deletePage(pageId: string): Promise<void>;

  /** List all booking pages for the authenticated user. */
  listPages(userId: string): Promise<BookingPage[]>;

  // ─── Available Slots ───────────────────────────────────────

  /**
   * Get available booking slots for a booking page.
   * Public endpoint — no authentication required.
   * Computes real-time availability based on host's calendar.
   */
  getAvailableSlots(pageId: string, input: {
    date: string;
    duration: number;
    timezone: string;
  }): Promise<TimeSlot[]>;

  // ─── Booking Lifecycle ─────────────────────────────────────

  /**
   * Create a booking (public endpoint).
   * Validates slot availability, creates tentative hold,
   * sends confirmation emails.
   */
  createBooking(input: CreateBookingInput): Promise<Booking>;

  /** Get booking details. */
  getBooking(bookingId: string): Promise<Booking>;

  /** List bookings for host or booker. */
  listBookings(options: {
    hostId?: string;
    bookerEmail?: string;
    status?: Booking['status'];
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ bookings: Booking[]; total: number }>;

  /** Confirm a pending booking (host action). */
  confirmBooking(bookingId: string): Promise<Booking>;

  /** Cancel a booking. */
  cancelBooking(bookingId: string, input: {
    cancelledBy: 'host' | 'booker';
    reason?: string;
  }): Promise<Booking>;

  /** Reschedule a booking to a new time. */
  rescheduleBooking(bookingId: string, input: {
    startTime: string;
    endTime: string;
  }): Promise<Booking>;

  /** Mark a booking as no-show. */
  markNoShow(bookingId: string): Promise<Booking>;

  /** Mark a booking as completed. */
  markCompleted(bookingId: string): Promise<Booking>;
}
```

### SyncService

```typescript
/**
 * External calendar synchronization engine.
 */
interface SyncService {
  // ─── Sync Configuration ────────────────────────────────────

  /**
   * Connect an external calendar for syncing.
   * Initiates OAuth flow and creates sync configuration.
   */
  connect(input: {
    provider: CalendarSync['provider'];
    calendarId: string;
    direction: CalendarSync['direction'];
    externalCalendarId: string;
    conflictStrategy?: CalendarSync['conflictStrategy'];
  }): Promise<CalendarSync>;

  /**
   * List available external calendars for a connected provider.
   * Requires valid OAuth token.
   */
  listExternalCalendars(provider: CalendarSync['provider']): Promise<Array<{
    id: string;
    name: string;
    color: string;
    isPrimary: boolean;
  }>>;

  /**
   * Update sync configuration.
   */
  updateSync(syncId: string, input: Partial<{
    direction: CalendarSync['direction'];
    conflictStrategy: CalendarSync['conflictStrategy'];
    syncIntervalMinutes: number;
    isEnabled: boolean;
  }>): Promise<CalendarSync>;

  /**
   * Disconnect and remove sync configuration.
   * Local events created by sync are preserved.
   */
  disconnect(syncId: string): Promise<void>;

  /**
   * List all sync configurations for the authenticated user.
   */
  listSyncs(userId: string): Promise<CalendarSync[]>;

  // ─── Sync Operations ──────────────────────────────────────

  /**
   * Trigger an immediate sync for a specific configuration.
   */
  triggerSync(syncId: string): Promise<{
    created: number;
    updated: number;
    deleted: number;
    errors: string[];
    duration: number;
  }>;

  /**
   * Handle incoming webhook from external provider.
   * Called by the webhook endpoint.
   */
  handleWebhook(provider: CalendarSync['provider'], payload: unknown): Promise<void>;

  /**
   * Refresh webhook registration (webhooks expire periodically).
   */
  refreshWebhook(syncId: string): Promise<void>;

  /**
   * Get sync status and statistics.
   */
  getSyncStatus(syncId: string): Promise<{
    config: CalendarSync;
    stats: {
      totalSynced: number;
      lastSync: string | null;
      nextSync: string;
      errorCount: number;
      recentErrors: string[];
    };
  }>;
}
```

### ResourceService

```typescript
/**
 * Resource management and booking.
 */
interface ResourceService {
  // ─── Resource CRUD ─────────────────────────────────────────

  create(input: CreateResourceInput): Promise<Resource>;
  getById(resourceId: string): Promise<Resource>;
  list(options?: {
    type?: Resource['type'];
    location?: string;
    minCapacity?: number;
    amenities?: string[];
    isActive?: boolean;
  }): Promise<Resource[]>;
  update(resourceId: string, input: UpdateResourceInput): Promise<Resource>;
  deactivate(resourceId: string): Promise<void>;
  activate(resourceId: string): Promise<void>;

  // ─── Resource Booking ──────────────────────────────────────

  /**
   * Book a resource for a time window.
   * Checks availability, applies buffer times,
   * and initiates approval workflow if required.
   */
  book(input: {
    resourceId: string;
    startTime: string;
    endTime: string;
    purpose?: string;
    eventId?: string;
  }): Promise<ResourceBooking>;

  /**
   * Get available time slots for a resource.
   */
  getAvailability(resourceId: string, input: {
    date: string;
    duration: number;
  }): Promise<TimeSlot[]>;

  /**
   * Cancel a resource booking.
   */
  cancelBooking(bookingId: string): Promise<void>;

  /**
   * Approve a pending resource booking (approver action).
   */
  approveBooking(bookingId: string): Promise<ResourceBooking>;

  /**
   * Reject a pending resource booking (approver action).
   */
  rejectBooking(bookingId: string, reason: string): Promise<ResourceBooking>;

  /**
   * List bookings for a resource within a date range.
   */
  listBookings(resourceId: string, options: {
    startDate: string;
    endDate: string;
    status?: ResourceBooking['approvalStatus'];
  }): Promise<ResourceBooking[]>;

  /**
   * Find resources that are available at a given time.
   */
  findAvailable(input: {
    startTime: string;
    endTime: string;
    type?: Resource['type'];
    minCapacity?: number;
    amenities?: string[];
  }): Promise<Resource[]>;
}
```

### AnalyticsService

```typescript
/**
 * Calendar and scheduling analytics.
 */
interface AnalyticsService {
  /**
   * Get meeting load statistics for a user.
   */
  getMeetingLoad(userId: string, options: {
    startDate: string;
    endDate: string;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<{
    totalMeetings: number;
    totalHours: number;
    averagePerDay: number;
    busiestDay: string;
    longestMeeting: number;
    breakdown: Array<{
      period: string;
      count: number;
      hours: number;
    }>;
  }>;

  /**
   * Get booking analytics for a booking page.
   */
  getBookingAnalytics(pageId: string, options: {
    startDate: string;
    endDate: string;
  }): Promise<{
    totalBookings: number;
    conversionRate: number;
    noShowRate: number;
    cancellationRate: number;
    averageDuration: number;
    popularSlots: Array<{
      dayOfWeek: number;
      hour: number;
      count: number;
    }>;
    completionRate: number;
  }>;

  /**
   * Get resource utilization statistics.
   */
  getResourceUtilization(options: {
    resourceIds?: string[];
    startDate: string;
    endDate: string;
  }): Promise<Array<{
    resourceId: string;
    resourceName: string;
    utilizationPercent: number;
    totalBookings: number;
    totalHours: number;
    peakHour: number;
    approvalRate: number;
  }>>;
}
```

---

## Database Schemas

### calendars

```typescript
import { pgTable, uuid, text, boolean, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { tenantId } from '@mcv/nexus/db/shared';

export const calendars = pgTable('calendars', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  ownerId: uuid('owner_id').notNull(),
  ownerType: text('owner_type', { enum: ['user', 'team', 'venture'] }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').notNull().default('#4285F4'),
  visibility: text('visibility', { enum: ['private', 'internal', 'public'] }).notNull().default('private'),
  timezone: text('timezone').notNull().default('UTC'),
  isPrimary: boolean('is_primary').notNull().default(false),
  isArchived: boolean('is_archived').notNull().default(false),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('calendars_tenant_owner_idx').on(t.tenantId, t.ownerId),
  index('calendars_owner_type_idx').on(t.tenantId, t.ownerType),
  uniqueIndex('calendars_primary_idx')
    .on(t.tenantId, t.ownerId, t.ownerType)
    .where(sql`is_primary = true`),
]);
```

### events

```typescript
import { pgTable, uuid, text, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { tenantId } from '@mcv/nexus/db/shared';

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  calendarId: uuid('calendar_id').notNull().references(() => calendars.id, { onDelete: 'cascade' }),
  creatorId: uuid('creator_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  location: jsonb('location'),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  isAllDay: boolean('is_all_day').notNull().default(false),
  timezone: text('timezone').notNull().default('UTC'),
  status: text('status', { enum: ['confirmed', 'tentative', 'cancelled'] }).notNull().default('confirmed'),
  busyStatus: text('busy_status', { enum: ['busy', 'free', 'tentative'] }).notNull().default('busy'),
  isRecurring: boolean('is_recurring').notNull().default(false),
  recurrenceRuleId: uuid('recurrence_rule_id'),
  masterEventId: uuid('master_event_id'),
  originalStartTime: timestamp('original_start_time', { withTimezone: true }),
  attachmentIds: jsonb('attachment_ids').notNull().default([]),
  conferenceUrl: text('conference_url'),
  conferenceData: jsonb('conference_data'),
  externalId: text('external_id'),
  syncId: uuid('sync_id'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  // Primary query index: events in a calendar within a time range
  index('events_calendar_time_idx').on(t.calendarId, t.startTime, t.endTime),
  // User query: all events by a user across calendars
  index('events_tenant_creator_time_idx').on(t.tenantId, t.creatorId, t.startTime),
  // Time range scan for availability queries
  index('events_tenant_time_idx').on(t.tenantId, t.startTime, t.endTime),
  // Recurring event lookup
  index('events_master_idx').on(t.masterEventId),
  // External sync deduplication
  index('events_external_id_idx').on(t.syncId, t.externalId),
]);
```

### event_attendees

```typescript
export const eventAttendees = pgTable('event_attendees', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: uuid('user_id'),
  email: text('email').notNull(),
  name: text('name').notNull(),
  status: text('status', {
    enum: ['needs-action', 'accepted', 'declined', 'tentative'],
  }).notNull().default('needs-action'),
  role: text('role', {
    enum: ['organizer', 'required', 'optional', 'resource'],
  }).notNull().default('required'),
  rsvpRequired: boolean('rsvp_required').notNull().default(true),
  comment: text('comment'),
  respondedAt: timestamp('responded_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('attendees_event_idx').on(t.eventId),
  index('attendees_user_idx').on(t.userId),
  uniqueIndex('attendees_event_email_idx').on(t.eventId, t.email),
]);
```

### booking_pages

```typescript
export const bookingPages = pgTable('booking_pages', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  hostId: uuid('host_id').notNull(),
  calendarId: uuid('calendar_id').notNull().references(() => calendars.id),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  durations: jsonb('durations').notNull().default([30]),
  defaultDuration: integer('default_duration').notNull().default(30),
  bufferBefore: integer('buffer_before').notNull().default(0),
  bufferAfter: integer('buffer_after').notNull().default(0),
  maxAdvanceDays: integer('max_advance_days').notNull().default(60),
  minNoticeHours: integer('min_notice_hours').notNull().default(24),
  availabilitySchedule: jsonb('availability_schedule').notNull(),
  intakeFields: jsonb('intake_fields').notNull().default([]),
  requiresConfirmation: boolean('requires_confirmation').notNull().default(false),
  redirectUrl: text('redirect_url'),
  branding: jsonb('branding'),
  isActive: boolean('is_active').notNull().default(true),
  locationType: text('location_type', {
    enum: ['in-person', 'virtual', 'phone', 'flexible'],
  }).notNull().default('virtual'),
  conferenceProvider: text('conference_provider', {
    enum: ['zoom', 'google-meet', 'teams'],
  }),
  slotInterval: integer('slot_interval').notNull().default(15),
  maxPerSlot: integer('max_per_slot').notNull().default(1),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('booking_pages_host_idx').on(t.tenantId, t.hostId),
  uniqueIndex('booking_pages_slug_idx').on(t.tenantId, t.slug),
]);
```

### booking_slots

```typescript
export const bookingSlots = pgTable('booking_slots', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingPageId: uuid('booking_page_id').notNull().references(() => bookingPages.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  isAvailable: boolean('is_available').notNull().default(true),
  currentBookings: integer('current_bookings').notNull().default(0),
  maxBookings: integer('max_bookings').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('booking_slots_page_date_idx').on(t.bookingPageId, t.date),
  index('booking_slots_time_idx').on(t.bookingPageId, t.startTime, t.endTime),
]);
```

### bookings

```typescript
export const bookings = pgTable('bookings', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  bookingPageId: uuid('booking_page_id').notNull().references(() => bookingPages.id),
  hostId: uuid('host_id').notNull(),
  eventId: uuid('event_id').references(() => events.id),
  bookerName: text('booker_name').notNull(),
  bookerEmail: text('booker_email').notNull(),
  bookerPhone: text('booker_phone'),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  timezone: text('timezone').notNull(),
  duration: integer('duration').notNull(),
  status: text('status', {
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show', 'rescheduled'],
  }).notNull().default('pending'),
  intakeResponses: jsonb('intake_responses').notNull().default({}),
  cancellationReason: text('cancellation_reason'),
  cancelledBy: text('cancelled_by', { enum: ['host', 'booker'] }),
  rescheduledFromId: uuid('rescheduled_from_id'),
  conferenceUrl: text('conference_url'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('bookings_host_time_idx').on(t.tenantId, t.hostId, t.startTime),
  index('bookings_page_idx').on(t.bookingPageId, t.startTime),
  index('bookings_status_idx').on(t.tenantId, t.status),
  index('bookings_booker_email_idx').on(t.bookerEmail),
]);
```

### recurrence_rules

```typescript
export const recurrenceRules = pgTable('recurrence_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  frequency: text('frequency', {
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
  }).notNull(),
  interval: integer('interval').notNull().default(1),
  byDay: jsonb('by_day'),
  byMonthDay: jsonb('by_month_day'),
  byMonth: jsonb('by_month'),
  bySetPos: jsonb('by_set_pos'),
  weekStart: integer('week_start').notNull().default(1),
  until: timestamp('until', { withTimezone: true }),
  count: integer('count'),
  exceptionDates: jsonb('exception_dates').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('recurrence_rules_event_idx').on(t.eventId),
]);
```

### calendar_syncs

```typescript
export const calendarSyncs = pgTable('calendar_syncs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  userId: uuid('user_id').notNull(),
  calendarId: uuid('calendar_id').notNull().references(() => calendars.id),
  provider: text('provider', {
    enum: ['google', 'microsoft', 'apple', 'caldav'],
  }).notNull(),
  direction: text('direction', {
    enum: ['inbound', 'outbound', 'bidirectional'],
  }).notNull().default('bidirectional'),
  externalCalendarId: text('external_calendar_id').notNull(),
  externalCalendarName: text('external_calendar_name').notNull(),
  tokenRef: text('token_ref').notNull(),
  caldavUrl: text('caldav_url'),
  webhookChannelId: text('webhook_channel_id'),
  webhookExpiresAt: timestamp('webhook_expires_at', { withTimezone: true }),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  lastSyncStatus: text('last_sync_status', {
    enum: ['success', 'partial', 'failed'],
  }),
  lastSyncError: text('last_sync_error'),
  syncToken: text('sync_token'),
  isEnabled: boolean('is_enabled').notNull().default(true),
  syncIntervalMinutes: integer('sync_interval_minutes').notNull().default(15),
  conflictStrategy: text('conflict_strategy', {
    enum: ['local-wins', 'remote-wins', 'last-modified'],
  }).notNull().default('last-modified'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('calendar_syncs_user_idx').on(t.tenantId, t.userId),
  index('calendar_syncs_calendar_idx').on(t.calendarId),
  uniqueIndex('calendar_syncs_external_idx').on(t.tenantId, t.userId, t.provider, t.externalCalendarId),
]);
```

### resources

```typescript
export const resources = pgTable('resources', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type', {
    enum: ['room', 'equipment', 'vehicle', 'desk', 'other'],
  }).notNull(),
  capacity: integer('capacity'),
  location: text('location'),
  amenities: jsonb('amenities').notNull().default([]),
  photoUrls: jsonb('photo_urls').notNull().default([]),
  availabilitySchedule: jsonb('availability_schedule').notNull(),
  requiresApproval: boolean('requires_approval').notNull().default(false),
  approverIds: jsonb('approver_ids').notNull().default([]),
  maxBookingDuration: integer('max_booking_duration').notNull().default(480),
  minBookingDuration: integer('min_booking_duration').notNull().default(15),
  bufferMinutes: integer('buffer_minutes').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('resources_tenant_type_idx').on(t.tenantId, t.type),
  index('resources_tenant_active_idx').on(t.tenantId, t.isActive),
]);
```

### resource_bookings

```typescript
export const resourceBookings = pgTable('resource_bookings', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),
  resourceId: uuid('resource_id').notNull().references(() => resources.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  eventId: uuid('event_id').references(() => events.id),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  purpose: text('purpose'),
  approvalStatus: text('approval_status', {
    enum: ['pending', 'approved', 'rejected', 'auto'],
  }).notNull().default('auto'),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('resource_bookings_resource_time_idx').on(t.resourceId, t.startTime, t.endTime),
  index('resource_bookings_user_idx').on(t.tenantId, t.userId),
  index('resource_bookings_approval_idx').on(t.tenantId, t.approvalStatus),
]);
```

### reminders

```typescript
export const reminders = pgTable('reminders', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  channels: jsonb('channels').notNull().default(['email']),
  minutesBefore: integer('minutes_before').notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  isSent: boolean('is_sent').notNull().default(false),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('reminders_scheduled_idx').on(t.scheduledAt, t.isSent),
  index('reminders_event_idx').on(t.eventId),
  index('reminders_user_idx').on(t.userId),
]);
```

### Row-Level Security

All tables enforce multi-tenant isolation via Supabase RLS:

```sql
-- Example RLS policy for calendars
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON calendars
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY "owner_access" ON calendars
  FOR ALL
  USING (
    owner_id = current_setting('app.user_id')::uuid
    OR EXISTS (
      SELECT 1 FROM calendar_shares
      WHERE calendar_shares.calendar_id = calendars.id
        AND calendar_shares.user_id = current_setting('app.user_id')::uuid
    )
  );

-- Time-range GiST index for overlap queries
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE INDEX events_time_range_gist
  ON events USING gist (
    tenant_id,
    tstzrange(start_time, end_time)
  );

-- Conflict detection using range overlap
ALTER TABLE resource_bookings
  ADD CONSTRAINT no_resource_double_book
  EXCLUDE USING gist (
    resource_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  )
  WHERE (approval_status IN ('approved', 'auto'));
```

---

## Code Examples

### 1. Create a Calendar and Add Events

```typescript
import { CalendarService, EventService } from '@mcv/nexus/calendar';

const calendarService = new CalendarService(ctx);
const eventService = new EventService(ctx);

// Create a personal calendar
const calendar = await calendarService.create({
  name: 'Work Calendar',
  color: '#4285F4',
  visibility: 'private',
  timezone: 'America/New_York',
  isPrimary: true,
});

// Create a one-time event
const event = await eventService.create({
  calendarId: calendar.id,
  title: 'Product Launch Meeting',
  description: '## Agenda\n- Review timeline\n- Assign tasks\n- Set milestones',
  startTime: '2026-03-15T10:00:00-04:00',
  endTime: '2026-03-15T11:30:00-04:00',
  timezone: 'America/New_York',
  location: {
    name: 'Conference Room A',
    type: 'hybrid',
    address: '123 Main St, Floor 3',
    url: 'https://meet.google.com/abc-defg-hij',
  },
  busyStatus: 'busy',
  attendees: [
    { email: 'alice@example.com', name: 'Alice Chen', role: 'required' },
    { email: 'bob@example.com', name: 'Bob Smith', role: 'optional' },
  ],
  reminders: [
    { minutesBefore: 15, channels: ['push'] },
    { minutesBefore: 60, channels: ['email'] },
  ],
});

console.log(`Event created: ${event.id}`);
// → Event created: 01903f7e-8a4b-7c00-9d2e-1a3b5c7d9e0f
```

### 2. Create a Recurring Event

```typescript
import { EventService } from '@mcv/nexus/calendar';

const eventService = new EventService(ctx);

// Create a weekly standup — Mon/Wed/Fri at 9:00 AM
const standup = await eventService.create({
  calendarId: 'cal_123',
  title: 'Daily Standup',
  description: 'Quick sync with the team',
  startTime: '2026-02-09T09:00:00-05:00',
  endTime: '2026-02-09T09:15:00-05:00',
  timezone: 'America/New_York',
  busyStatus: 'busy',
  location: {
    name: 'Zoom',
    type: 'virtual',
    url: 'https://zoom.us/j/123456789',
  },
  recurrence: {
    frequency: 'weekly',
    interval: 1,
    byDay: [1, 3, 5], // Monday, Wednesday, Friday
    until: '2026-12-31',
  },
});

// Query expanded instances for February
const instances = await eventService.query({
  calendarIds: ['cal_123'],
  startTime: '2026-02-01T00:00:00-05:00',
  endTime: '2026-02-28T23:59:59-05:00',
  timezone: 'America/New_York',
});

console.log(`Found ${instances.length} event instances in February`);
// → Found 36 event instances in February (12 standups × 3 days/week)

// Modify a single instance (e.g., cancel for a holiday)
await eventService.update(
  standup.id,
  {
    status: 'cancelled',
    title: 'Standup — Cancelled (President\'s Day)',
  },
  'this', // Only this instance
);

// Modify this and all future instances
await eventService.update(
  standup.id,
  {
    startTime: '2026-06-01T09:30:00-04:00',
    endTime: '2026-06-01T09:45:00-04:00',
  },
  'following', // This instance and all future ones
);
```

### 3. Set Up a Booking Page

```typescript
import { BookingService } from '@mcv/nexus/calendar';

const bookingService = new BookingService(ctx);

// Create a public booking page for consultations
const page = await bookingService.createPage({
  calendarId: 'cal_123',
  slug: 'jane-doe/consultation',
  title: '30-Minute Strategy Consultation',
  description: 'Book a free consultation to discuss your project needs.',
  durations: [15, 30, 60],
  defaultDuration: 30,
  bufferBefore: 5,
  bufferAfter: 10,
  maxAdvanceDays: 30,
  minNoticeHours: 4,
  locationType: 'virtual',
  conferenceProvider: 'zoom',
  slotInterval: 15,
  availabilitySchedule: {
    monday:    [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '17:00' }],
    tuesday:   [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '17:00' }],
    wednesday: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '17:00' }],
    thursday:  [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '17:00' }],
    friday:    [{ start: '09:00', end: '12:00' }],
    saturday:  [],
    sunday:    [],
  },
  intakeFields: [
    {
      name: 'company',
      label: 'Company Name',
      type: 'text',
      required: true,
      placeholder: 'Your company name',
      options: null,
    },
    {
      name: 'topic',
      label: 'What would you like to discuss?',
      type: 'select',
      required: true,
      placeholder: null,
      options: ['New Project', 'Existing Project', 'Partnership', 'Other'],
    },
    {
      name: 'details',
      label: 'Additional details',
      type: 'textarea',
      required: false,
      placeholder: 'Any specific questions or context...',
      options: null,
    },
  ],
  branding: {
    primaryColor: '#6366F1',
    logoUrl: 'https://cdn.mcv.one/logos/jane-consulting.png',
    customClass: null,
  },
});

// Public URL: https://book.mcv.one/jane-doe/consultation

// Fetch available slots (public, no auth)
const slots = await bookingService.getAvailableSlots(page.id, {
  date: '2026-02-12',
  duration: 30,
  timezone: 'America/New_York',
});

console.log(`Available slots on Feb 12:`, slots.map(s => s.start));
// → Available slots on Feb 12: ["09:00", "09:30", "10:00", "10:30", ...]

// Create a booking (public, no auth)
const booking = await bookingService.createBooking({
  bookingPageId: page.id,
  startTime: '2026-02-12T10:00:00-05:00',
  endTime: '2026-02-12T10:30:00-05:00',
  timezone: 'America/New_York',
  duration: 30,
  bookerName: 'John Client',
  bookerEmail: 'john@clientcorp.com',
  bookerPhone: '+1-555-0123',
  intakeResponses: {
    company: 'ClientCorp Inc.',
    topic: 'New Project',
    details: 'We need help building a SaaS dashboard.',
  },
});

console.log(`Booking confirmed: ${booking.id}, status: ${booking.status}`);
// → Booking confirmed: bk_abc123, status: confirmed
```

### 4. Find Common Availability (Scheduling Suggestions)

```typescript
import { SchedulingService } from '@mcv/nexus/calendar';

const scheduling = new SchedulingService(ctx);

// Find a 1-hour meeting slot for 4 participants
const suggestions = await scheduling.suggestTimes({
  participantIds: [
    'user_alice',
    'user_bob',
    'user_charlie',
    'user_diana',
  ],
  duration: 60, // 1 hour
  dateRange: {
    start: '2026-02-09',
    end: '2026-02-13',
  },
  timezone: 'America/New_York',
  preferences: {
    preferredHours: { start: 10, end: 16 },
    preferEarlier: true,
    bufferMinutes: 15,
  },
  maxSuggestions: 5,
});

for (const suggestion of suggestions) {
  const available = suggestion.availableParticipants.length;
  const total = 4;
  console.log(
    `${suggestion.start} — ${suggestion.end}` +
    ` | ${available}/${total} available` +
    ` | score: ${suggestion.score.toFixed(2)}`
  );
}
// → 2026-02-10T10:00:00-05:00 — 2026-02-10T11:00:00-05:00 | 4/4 available | score: 0.95
// → 2026-02-10T14:00:00-05:00 — 2026-02-10T15:00:00-05:00 | 4/4 available | score: 0.88
// → 2026-02-11T10:00:00-05:00 — 2026-02-11T11:00:00-05:00 | 4/4 available | score: 0.85
// → 2026-02-12T11:00:00-05:00 — 2026-02-12T12:00:00-05:00 | 3/4 available | score: 0.62
// → 2026-02-09T15:00:00-05:00 — 2026-02-09T16:00:00-05:00 | 3/4 available | score: 0.55

// Check conflicts for a specific time
const conflicts = await scheduling.detectConflicts({
  userId: 'user_alice',
  startTime: '2026-02-10T10:00:00-05:00',
  endTime: '2026-02-10T11:00:00-05:00',
});

if (conflicts.length === 0) {
  console.log('No conflicts — schedule the meeting!');
} else {
  for (const c of conflicts) {
    console.log(`Conflict: "${c.event.title}" (${c.overlapMinutes}min overlap, ${c.type})`);
  }
}
```

### 5. Sync with Google Calendar

```typescript
import { SyncService } from '@mcv/nexus/calendar';

const syncService = new SyncService(ctx);

// List available Google calendars after OAuth
const externalCalendars = await syncService.listExternalCalendars('google');
// → [{ id: 'primary', name: 'My Calendar', isPrimary: true }, ...]

// Set up bidirectional sync
const sync = await syncService.connect({
  provider: 'google',
  calendarId: 'cal_123', // Local calendar
  direction: 'bidirectional',
  externalCalendarId: 'primary',
  conflictStrategy: 'last-modified',
});

console.log(`Sync configured: ${sync.id}`);

// Trigger initial sync
const result = await syncService.triggerSync(sync.id);
console.log(`Initial sync: ${result.created} created, ${result.updated} updated, ${result.deleted} deleted`);
// → Initial sync: 47 created, 0 updated, 0 deleted

// Check sync status later
const status = await syncService.getSyncStatus(sync.id);
console.log(`Last sync: ${status.stats.lastSync}`);
console.log(`Total synced: ${status.stats.totalSynced}`);
console.log(`Next sync: ${status.stats.nextSync}`);
// → Last sync: 2026-02-09T07:30:00Z
// → Total synced: 47
// → Next sync: 2026-02-09T07:45:00Z

// Handle incoming webhook (called by API endpoint)
// POST /api/calendar/webhook/google
await syncService.handleWebhook('google', {
  'X-Goog-Channel-ID': sync.webhookChannelId,
  'X-Goog-Resource-ID': 'resource_123',
  'X-Goog-Resource-State': 'sync',
});
```

### 6. Resource Booking (Meeting Rooms)

```typescript
import { ResourceService } from '@mcv/nexus/calendar';

const resourceService = new ResourceService(ctx);

// Create a meeting room resource
const room = await resourceService.create({
  name: 'Boardroom — 12th Floor',
  description: 'Large boardroom with video conferencing and whiteboard',
  type: 'room',
  capacity: 20,
  location: '12th Floor, East Wing',
  amenities: ['video-conferencing', 'whiteboard', 'projector', 'phone'],
  photoUrls: ['https://cdn.mcv.one/rooms/boardroom-12.jpg'],
  availabilitySchedule: {
    monday:    [{ start: '08:00', end: '20:00' }],
    tuesday:   [{ start: '08:00', end: '20:00' }],
    wednesday: [{ start: '08:00', end: '20:00' }],
    thursday:  [{ start: '08:00', end: '20:00' }],
    friday:    [{ start: '08:00', end: '18:00' }],
    saturday:  [],
    sunday:    [],
  },
  requiresApproval: true,
  approverIds: ['user_facilities_mgr'],
  maxBookingDuration: 240, // 4 hours max
  minBookingDuration: 30,
  bufferMinutes: 15,
});

// Find available rooms for a meeting
const available = await resourceService.findAvailable({
  startTime: '2026-02-10T14:00:00-05:00',
  endTime: '2026-02-10T15:00:00-05:00',
  type: 'room',
  minCapacity: 8,
  amenities: ['video-conferencing'],
});

console.log(`${available.length} rooms available`);
// → 3 rooms available

// Book the boardroom
const reservation = await resourceService.book({
  resourceId: room.id,
  startTime: '2026-02-10T14:00:00-05:00',
  endTime: '2026-02-10T15:00:00-05:00',
  purpose: 'Q1 Planning Session',
  eventId: 'event_xyz', // Link to calendar event
});

console.log(`Reservation: ${reservation.id}, status: ${reservation.approvalStatus}`);
// → Reservation: rb_123, status: pending

// Approver approves the booking
const approved = await resourceService.approveBooking(reservation.id);
console.log(`Approved by: ${approved.approvedBy}`);
// → Approved by: user_facilities_mgr
```

### 7. ICS Export and Import

```typescript
import { CalendarService, toICS, parseICS } from '@mcv/nexus/calendar';

const calendarService = new CalendarService(ctx);

// Export a calendar as ICS
const icsContent = await calendarService.exportICS('cal_123', {
  startDate: '2026-01-01',
  endDate: '2026-12-31',
});

// The ICS content follows RFC 5545
console.log(icsContent);
// → BEGIN:VCALENDAR
// → VERSION:2.0
// → PRODID:-//MCV.ONE//Calendar//EN
// → BEGIN:VEVENT
// → DTSTART;TZID=America/New_York:20260315T100000
// → DTEND;TZID=America/New_York:20260315T113000
// → SUMMARY:Product Launch Meeting
// → DESCRIPTION:## Agenda\n- Review timeline...
// → LOCATION:Conference Room A\, 123 Main St\, Floor 3
// → UID:01903f7e-8a4b-7c00-9d2e-1a3b5c7d9e0f@mcv.one
// → RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20261231T235959Z
// → BEGIN:VALARM
// → TRIGGER:-PT15M
// → ACTION:DISPLAY
// → DESCRIPTION:Reminder
// → END:VALARM
// → END:VEVENT
// → END:VCALENDAR

// Import from external ICS file
const importResult = await calendarService.importICS('cal_456', icsContent);
console.log(`Imported: ${importResult.imported}, Skipped: ${importResult.skipped}`);
// → Imported: 23, Skipped: 2

// Parse ICS content without importing (for preview)
const parsed = parseICS(icsContent);
for (const event of parsed.events) {
  console.log(`${event.summary} — ${event.dtstart} to ${event.dtend}`);
}
```

### 8. Calendar Analytics

```typescript
import { AnalyticsService } from '@mcv/nexus/calendar';

const analytics = new AnalyticsService(ctx);

// Meeting load analysis
const meetingLoad = await analytics.getMeetingLoad('user_alice', {
  startDate: '2026-02-01',
  endDate: '2026-02-28',
  groupBy: 'week',
});

console.log(`Total meetings in Feb: ${meetingLoad.totalMeetings}`);
console.log(`Total hours: ${meetingLoad.totalHours}`);
console.log(`Average per day: ${meetingLoad.averagePerDay}`);
console.log(`Busiest day: ${meetingLoad.busiestDay}`);
// → Total meetings in Feb: 67
// → Total hours: 52.5
// → Average per day: 3.35
// → Busiest day: Tuesday

for (const week of meetingLoad.breakdown) {
  console.log(`${week.period}: ${week.count} meetings, ${week.hours}h`);
}
// → Week of Feb 2: 16 meetings, 12.5h
// → Week of Feb 9: 18 meetings, 14.0h
// → Week of Feb 16: 15 meetings, 11.5h
// → Week of Feb 23: 18 meetings, 14.5h

// Booking page analytics
const bookingStats = await analytics.getBookingAnalytics('bp_consultation', {
  startDate: '2026-01-01',
  endDate: '2026-02-28',
});

console.log(`Total bookings: ${bookingStats.totalBookings}`);
console.log(`Conversion rate: ${(bookingStats.conversionRate * 100).toFixed(1)}%`);
console.log(`No-show rate: ${(bookingStats.noShowRate * 100).toFixed(1)}%`);
console.log(`Cancellation rate: ${(bookingStats.cancellationRate * 100).toFixed(1)}%`);
// → Total bookings: 142
// → Conversion rate: 68.3%
// → No-show rate: 8.5%
// → Cancellation rate: 12.7%

console.log('Most popular slots:');
for (const slot of bookingStats.popularSlots.slice(0, 3)) {
  const days = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  console.log(`  ${days[slot.dayOfWeek]} ${slot.hour}:00 — ${slot.count} bookings`);
}
// → Tue 10:00 — 23 bookings
// → Wed 14:00 — 19 bookings
// → Thu 10:00 — 17 bookings

// Resource utilization
const utilization = await analytics.getResourceUtilization({
  startDate: '2026-02-01',
  endDate: '2026-02-28',
});

for (const resource of utilization) {
  console.log(
    `${resource.resourceName}: ${resource.utilizationPercent.toFixed(0)}% utilized, ` +
    `${resource.totalBookings} bookings, peak at ${resource.peakHour}:00`
  );
}
// → Boardroom — 12th Floor: 73% utilized, 45 bookings, peak at 14:00
// → Small Meeting Room B: 58% utilized, 89 bookings, peak at 10:00
// → Projector #3: 22% utilized, 12 bookings, peak at 11:00
```

---

## Error Codes

All errors thrown by `@mcv/nexus/calendar` use the `CalendarErrorCode` enum and extend the platform `AppError` class with structured error details.

| Code | HTTP | Description |
|------|------|-------------|
| `CALENDAR_NOT_FOUND` | 404 | The requested calendar does not exist or the user lacks access. |
| `CALENDAR_ARCHIVED` | 410 | The calendar has been archived. Restore it before making changes. |
| `CALENDAR_NAME_DUPLICATE` | 409 | A calendar with the same name already exists for this owner. |
| `CALENDAR_PRIMARY_EXISTS` | 409 | Owner already has a primary calendar. Unset the existing one first. |
| `EVENT_NOT_FOUND` | 404 | The requested event does not exist or the user lacks access. |
| `EVENT_TIME_INVALID` | 400 | Event end time is before or equal to start time. |
| `EVENT_CONFLICT` | 409 | The event conflicts with an existing event and `busyStatus` is `'busy'`. |
| `EVENT_RECURRENCE_INVALID` | 400 | Recurrence rule is malformed (e.g., `count` and `until` both set, invalid `byDay` values). |
| `EVENT_INSTANCE_NOT_FOUND` | 404 | The specified instance of a recurring event does not exist (invalid instance date). |
| `ATTENDEE_DUPLICATE` | 409 | An attendee with this email is already on the event. |
| `ATTENDEE_NOT_FOUND` | 404 | The specified attendee record was not found on this event. |
| `RSVP_TOKEN_EXPIRED` | 401 | The RSVP link token has expired. Request a new invitation. |
| `RSVP_TOKEN_INVALID` | 401 | The RSVP link token is malformed or does not match any invitation. |
| `BOOKING_PAGE_NOT_FOUND` | 404 | The booking page does not exist or is not active. |
| `BOOKING_PAGE_SLUG_TAKEN` | 409 | The URL slug is already in use by another booking page in this tenant. |
| `BOOKING_SLOT_UNAVAILABLE` | 409 | The selected time slot is no longer available (race condition or concurrent booking). |
| `BOOKING_NOT_FOUND` | 404 | The booking record does not exist. |
| `BOOKING_ALREADY_CANCELLED` | 409 | Cannot cancel — the booking is already in `cancelled` status. |
| `BOOKING_PAST_EVENT` | 400 | Cannot book or modify a slot in the past. |
| `BOOKING_TOO_SOON` | 400 | Booking violates `minNoticeHours` — must book further in advance. |
| `BOOKING_TOO_FAR` | 400 | Booking exceeds `maxAdvanceDays` — cannot book that far out. |
| `BOOKING_INVALID_DURATION` | 400 | The requested duration is not offered by this booking page. |
| `BOOKING_INTAKE_REQUIRED` | 400 | Required intake form fields are missing from the booking request. |
| `SYNC_NOT_FOUND` | 404 | The sync configuration does not exist. |
| `SYNC_PROVIDER_ERROR` | 502 | The external calendar provider returned an error. Retry later. |
| `SYNC_TOKEN_EXPIRED` | 401 | The OAuth token for the external provider has expired and could not be refreshed. |
| `SYNC_CONFLICT` | 409 | A sync configuration for this external calendar already exists. |
| `SYNC_WEBHOOK_FAILED` | 502 | Failed to register or renew the webhook with the external provider. |
| `RESOURCE_NOT_FOUND` | 404 | The requested resource does not exist. |
| `RESOURCE_UNAVAILABLE` | 409 | The resource is already booked for the requested time window. |
| `RESOURCE_BOOKING_NOT_FOUND` | 404 | The resource booking/reservation does not exist. |
| `RESOURCE_APPROVAL_REQUIRED` | 403 | This resource requires approval. The booking is pending. |
| `RESOURCE_DURATION_INVALID` | 400 | Requested booking duration is outside the allowed min/max range. |
| `REMINDER_LIMIT_EXCEEDED` | 400 | Maximum reminders per event exceeded (limit: 5 per user per event). |
| `TIMEZONE_INVALID` | 400 | The provided timezone string is not a valid IANA timezone identifier. |
| `ICS_PARSE_ERROR` | 400 | The provided ICS file content could not be parsed (malformed iCalendar). |
| `PERMISSION_DENIED` | 403 | The user does not have the required permission on this calendar/resource. |
| `SHARE_SELF` | 400 | Cannot share a calendar with yourself. |

### Error Response Format

```typescript
{
  code: 'BOOKING_SLOT_UNAVAILABLE',
  message: 'The selected time slot (2026-02-12T10:00) is no longer available.',
  statusCode: 409,
  details: {
    bookingPageId: 'bp_123',
    requestedStart: '2026-02-12T10:00:00-05:00',
    requestedEnd: '2026-02-12T10:30:00-05:00',
    reason: 'concurrent_booking',
  },
}
```

---

## Security

### Authentication & Authorization

- **All tRPC endpoints** require a valid session token (JWT) via `@mcv/nexus/auth`, except:
  - `booking.getPageBySlug` — Public (booking page display)
  - `booking.getAvailableSlots` — Public (slot availability)
  - `booking.createBooking` — Public (booking submission)
  - RSVP endpoints — Authenticated via one-time RSVP token
- **Calendar access** is controlled by ownership and sharing permissions:
  - `view` — Read events, see free/busy
  - `edit` — Create/modify/delete events
  - `manage` — All of the above plus sharing, settings, and deletion
- **Resource booking** permissions are validated against the resource's `approverIds` for approval actions.

### Multi-Tenant Isolation

```typescript
// Every database query is scoped by tenant_id via Supabase RLS.
// The tenant context is set at the connection level:
await db.execute(sql`SET LOCAL app.tenant_id = ${ctx.tenantId}`);
await db.execute(sql`SET LOCAL app.user_id = ${ctx.userId}`);

// Even if application code has a bug, RLS prevents cross-tenant access.
// This is defense-in-depth: application-level checks + database-level enforcement.
```

### Data Protection

| Concern | Mitigation |
|---------|------------|
| **OAuth tokens** | Stored encrypted in `@mcv/nexus/auth` credential vault. Only token references are stored in `calendar_syncs`. |
| **RSVP tokens** | Cryptographically random, single-use, time-limited (72 hours). Hashed in database. |
| **Booking intake data** | Personal information in `intakeResponses` is encrypted at rest via Supabase column-level encryption. |
| **Free/busy privacy** | Non-organizers see only "Busy" for other users' events. Event titles and details are redacted. |
| **External sync data** | Synced event content is stored locally but marked with `syncId` for audit. Sync logs track all data flow. |
| **Webhook validation** | Incoming webhooks from Google and Microsoft are validated using provider-specific signatures (HMAC/JWT). |
| **Rate limiting** | Public booking endpoints are rate-limited: 10 slot queries/min, 3 booking creations/min per IP. |
| **Input validation** | All inputs are validated via Zod schemas before reaching service logic. No raw user input reaches SQL. |

### Audit Trail

All calendar mutations are logged to the platform audit system:

```typescript
// Automatically logged by service decorators:
// - calendar.create / update / delete
// - event.create / update / delete / rsvp
// - booking.create / cancel / reschedule
// - sync.connect / disconnect / trigger
// - resource.book / approve / reject

// Audit log entry example:
{
  action: 'calendar.event.create',
  actorId: 'user_123',
  tenantId: 'tenant_abc',
  resourceType: 'event',
  resourceId: 'evt_789',
  metadata: {
    calendarId: 'cal_456',
    title: 'Product Launch Meeting',
    startTime: '2026-03-15T10:00:00-04:00',
    attendeeCount: 3,
  },
  timestamp: '2026-02-09T07:33:00Z',
}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CALENDAR_DATABASE_URL` | Yes | — | Supabase PostgreSQL connection string. Falls back to platform `DATABASE_URL`. |
| `CALENDAR_GOOGLE_CLIENT_ID` | No | — | Google OAuth client ID for Calendar API access. |
| `CALENDAR_GOOGLE_CLIENT_SECRET` | No | — | Google OAuth client secret. |
| `CALENDAR_GOOGLE_REDIRECT_URI` | No | — | OAuth redirect URI for Google Calendar connection flow. |
| `CALENDAR_MICROSOFT_CLIENT_ID` | No | — | Microsoft Azure AD application (client) ID for Graph API. |
| `CALENDAR_MICROSOFT_CLIENT_SECRET` | No | — | Microsoft Azure AD client secret. |
| `CALENDAR_MICROSOFT_TENANT_ID` | No | `common` | Azure AD tenant ID (`common` for multi-tenant). |
| `CALENDAR_MICROSOFT_REDIRECT_URI` | No | — | OAuth redirect URI for Microsoft Calendar connection. |
| `CALENDAR_CALDAV_TIMEOUT_MS` | No | `30000` | Timeout for CalDAV HTTP requests in milliseconds. |
| `CALENDAR_WEBHOOK_SECRET` | No | — | HMAC secret for validating incoming webhook payloads. |
| `CALENDAR_WEBHOOK_BASE_URL` | No | — | Base URL for webhook callback registration (e.g., `https://api.mcv.one`). |
| `CALENDAR_SYNC_INTERVAL_MINUTES` | No | `15` | Default polling interval for calendar sync (when webhooks unavailable). |
| `CALENDAR_SYNC_MAX_RETRIES` | No | `5` | Maximum retry attempts for failed sync operations. |
| `CALENDAR_SYNC_BACKOFF_BASE_MS` | No | `1000` | Base delay for exponential backoff on sync retries. |
| `CALENDAR_BOOKING_HOLD_MINUTES` | No | `10` | Minutes to hold a tentative booking slot before expiration. |
| `CALENDAR_BOOKING_BASE_URL` | No | — | Base URL for public booking pages (e.g., `https://book.mcv.one`). |
| `CALENDAR_MAX_RECURRENCE_EXPAND` | No | `730` | Maximum number of recurrence instances to expand (default: 2 years of daily). |
| `CALENDAR_REMINDER_QUEUE` | No | `calendar-reminders` | pg-boss queue name for reminder processing. |
| `CALENDAR_SYNC_QUEUE` | No | `calendar-sync` | pg-boss queue name for sync job processing. |
| `CALENDAR_RATE_LIMIT_SLOTS` | No | `10` | Rate limit: max slot queries per minute per IP (public endpoints). |
| `CALENDAR_RATE_LIMIT_BOOKINGS` | No | `3` | Rate limit: max booking creations per minute per IP (public endpoints). |
| `CALENDAR_ICS_MAX_SIZE_KB` | No | `5120` | Maximum ICS file size for import (5MB default). |
| `CALENDAR_ENCRYPTION_KEY` | No | — | Encryption key for sensitive booking intake data. Falls back to platform key. |
| `CALENDAR_ZOOM_API_KEY` | No | — | Zoom API key for auto-creating meeting links. |
| `CALENDAR_ZOOM_API_SECRET` | No | — | Zoom API secret for meeting link creation. |

### Configuration Example

```bash
# .env.local
CALENDAR_GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
CALENDAR_GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
CALENDAR_GOOGLE_REDIRECT_URI=https://api.mcv.one/auth/callback/google
CALENDAR_MICROSOFT_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
CALENDAR_MICROSOFT_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CALENDAR_MICROSOFT_REDIRECT_URI=https://api.mcv.one/auth/callback/microsoft
CALENDAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx
CALENDAR_WEBHOOK_BASE_URL=https://api.mcv.one
CALENDAR_BOOKING_BASE_URL=https://book.mcv.one
CALENDAR_ZOOM_API_KEY=xxxxxxxxxxxxxxxxxx
CALENDAR_ZOOM_API_SECRET=xxxxxxxxxxxxxxxxxx
```

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/nexus/db` | Drizzle ORM setup, migration runner, shared column helpers (`tenantId`, `timestamps`). |
| `@mcv/nexus/auth` | Authentication context, OAuth credential vault, session validation. |
| `@mcv/nexus/notifications` | Multi-channel notification delivery (email, push, SMS) for reminders and invitations. |
| `@mcv/nexus/storage` | File attachment storage for event attachments. |
| `@mcv/nexus/queue` | Job queue (pg-boss) for async reminder scheduling and sync processing. |
| `@mcv/nexus/audit` | Audit logging for all calendar mutations. |
| `@mcv/nexus/permissions` | Permission checking framework for calendar sharing and resource approval. |
| `@mcv/foundation/errors` | Structured error classes and error code registry. |
| `@mcv/foundation/validation` | Shared Zod schemas and validation utilities. |
| `@mcv/foundation/time` | Timezone utilities, date formatting, duration helpers. |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.34` | Database ORM and query builder. |
| `@trpc/server` | `^11` | Type-safe API layer. |
| `zod` | `^3.23` | Input validation and schema definition. |
| `googleapis` | `^144` | Google Calendar API client. |
| `@microsoft/microsoft-graph-client` | `^3.0` | Microsoft Graph API client for Outlook/Exchange. |
| `tsdav` | `^2.1` | CalDAV/CardDAV client for Apple Calendar and generic CalDAV servers. |
| `ical.js` | `^2.1` | RFC 5545 iCalendar parsing and generation. |
| `rrule` | `^2.8` | RFC 5545 recurrence rule expansion engine. |
| `date-fns` | `^4.1` | Date manipulation and formatting. |
| `date-fns-tz` | `^3.2` | Timezone-aware date operations (IANA timezone support). |
| `pg-boss` | `^10` | PostgreSQL-backed job queue for reminders and sync. |
| `nanoid` | `^5` | Compact unique ID generation for RSVP tokens and booking references. |
| `ioredis` | `^5.4` | Redis client for caching availability data and rate limiting. |

### Peer Dependencies

| Package | Version | Notes |
|---------|---------|-------|
| `@supabase/supabase-js` | `^2.45` | Supabase client (provided by platform runtime). |
| `typescript` | `^5.5` | Required for type-safe compilation. |

---

## Testing

### Test Structure

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── recurrence.test.ts         # Recurrence expansion logic
│   │   ├── scheduling.test.ts         # Availability & conflict detection
│   │   ├── ics.test.ts                # ICS parse/generate
│   │   ├── timezone.test.ts           # Timezone conversion edge cases
│   │   ├── free-busy.test.ts          # Free/busy computation
│   │   └── booking-slots.test.ts      # Slot generation logic
│   ├── integration/
│   │   ├── calendar.service.test.ts   # Calendar CRUD with DB
│   │   ├── event.service.test.ts      # Event lifecycle with DB
│   │   ├── booking.service.test.ts    # Booking flow end-to-end
│   │   ├── sync.service.test.ts       # External sync with mocked APIs
│   │   ├── resource.service.test.ts   # Resource booking with DB
│   │   ├── reminder.service.test.ts   # Reminder scheduling
│   │   └── analytics.service.test.ts  # Analytics queries
│   └── e2e/
│       ├── booking-flow.test.ts       # Full booking page → booking → confirmation
│       ├── sync-google.test.ts        # Google Calendar sync round-trip
│       └── recurring-series.test.ts   # Recurring event CRUD (this/following/all)
├── __fixtures__/
│   ├── calendars.ts                   # Test calendar data
│   ├── events.ts                      # Test event data (including recurring)
│   ├── ics-samples/                   # Sample ICS files for import testing
│   │   ├── google-export.ics
│   │   ├── outlook-export.ics
│   │   ├── apple-export.ics
│   │   └── malformed.ics
│   └── sync-payloads/                 # Mock webhook payloads
│       ├── google-change.json
│       └── microsoft-change.json
```

### Running Tests

```bash
# All calendar tests
pnpm test --filter @mcv/nexus/calendar

# Unit tests only (fast, no DB)
pnpm test --filter @mcv/nexus/calendar -- --testPathPattern=unit

# Integration tests (requires test DB)
pnpm test --filter @mcv/nexus/calendar -- --testPathPattern=integration

# E2E tests (requires test DB + mocked external services)
pnpm test --filter @mcv/nexus/calendar -- --testPathPattern=e2e

# With coverage
pnpm test --filter @mcv/nexus/calendar -- --coverage
```

### Unit Test Example: Recurrence Expansion

```typescript
import { describe, it, expect } from 'vitest';
import { expandRecurrence } from '../utils/recurrence';

describe('expandRecurrence', () => {
  it('expands weekly MWF recurrence within date range', () => {
    const rule = {
      frequency: 'weekly' as const,
      interval: 1,
      byDay: [1, 3, 5], // Mon, Wed, Fri
      weekStart: 1,
      until: '2026-03-31',
      count: null,
      byMonthDay: null,
      byMonth: null,
      bySetPos: null,
      exceptionDates: [],
    };

    const instances = expandRecurrence({
      rule,
      eventStart: new Date('2026-02-09T09:00:00-05:00'),
      eventEnd: new Date('2026-02-09T09:15:00-05:00'),
      rangeStart: new Date('2026-02-01T00:00:00-05:00'),
      rangeEnd: new Date('2026-02-28T23:59:59-05:00'),
      timezone: 'America/New_York',
    });

    // Feb 2026: Mon/Wed/Fri from Feb 2 (Mon) to Feb 27 (Fri)
    expect(instances).toHaveLength(12);
    expect(instances[0].start.toISOString()).toBe('2026-02-02T14:00:00.000Z');
    expect(instances[11].start.toISOString()).toBe('2026-02-27T14:00:00.000Z');
  });

  it('respects exception dates', () => {
    const rule = {
      frequency: 'daily' as const,
      interval: 1,
      byDay: null,
      byMonthDay: null,
      byMonth: null,
      bySetPos: null,
      weekStart: 1,
      until: '2026-02-28',
      count: null,
      exceptionDates: ['2026-02-14', '2026-02-15'], // Valentine's Day break
    };

    const instances = expandRecurrence({
      rule,
      eventStart: new Date('2026-02-01T10:00:00-05:00'),
      eventEnd: new Date('2026-02-01T10:30:00-05:00'),
      rangeStart: new Date('2026-02-01T00:00:00-05:00'),
      rangeEnd: new Date('2026-02-28T23:59:59-05:00'),
      timezone: 'America/New_York',
    });

    // 28 days minus 2 exceptions = 26
    expect(instances).toHaveLength(26);
    expect(instances.find(i => i.start.toISOString().includes('02-14'))).toBeUndefined();
    expect(instances.find(i => i.start.toISOString().includes('02-15'))).toBeUndefined();
  });

  it('caps expansion at MAX_RECURRENCE_EXPAND', () => {
    const rule = {
      frequency: 'daily' as const,
      interval: 1,
      byDay: null,
      byMonthDay: null,
      byMonth: null,
      bySetPos: null,
      weekStart: 1,
      until: null, // infinite
      count: null,
      exceptionDates: [],
    };

    const instances = expandRecurrence({
      rule,
      eventStart: new Date('2020-01-01T10:00:00Z'),
      eventEnd: new Date('2020-01-01T10:30:00Z'),
      rangeStart: new Date('2020-01-01T00:00:00Z'),
      rangeEnd: new Date('2030-12-31T23:59:59Z'),
      timezone: 'UTC',
    });

    expect(instances.length).toBeLessThanOrEqual(730); // MAX_RECURRENCE_EXPAND
  });

  it('handles monthly last-day-of-month recurrence', () => {
    const rule = {
      frequency: 'monthly' as const,
      interval: 1,
      byDay: null,
      byMonthDay: [-1], // Last day of month
      byMonth: null,
      bySetPos: null,
      weekStart: 1,
      until: '2026-06-30',
      count: null,
      exceptionDates: [],
    };

    const instances = expandRecurrence({
      rule,
      eventStart: new Date('2026-01-31T18:00:00-05:00'),
      eventEnd: new Date('2026-01-31T19:00:00-05:00'),
      rangeStart: new Date('2026-01-01T00:00:00Z'),
      rangeEnd: new Date('2026-06-30T23:59:59Z'),
      timezone: 'America/New_York',
    });

    expect(instances).toHaveLength(6);
    // Jan 31, Feb 28, Mar 31, Apr 30, May 31, Jun 30
    expect(instances[1].start.getUTCDate()).toBe(28); // Feb
    expect(instances[3].start.getUTCDate()).toBe(30); // Apr
  });
});
```

### Integration Test Example: Booking Flow

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestContext, cleanupTestContext } from '@mcv/nexus/test-utils';
import { BookingService } from '../services/booking.service';
import { CalendarService } from '../services/calendar.service';

describe('BookingService (integration)', () => {
  let ctx: TestContext;
  let bookingService: BookingService;
  let calendarService: CalendarService;
  let calendarId: string;
  let pageId: string;

  beforeAll(async () => {
    ctx = await createTestContext({ tenant: 'test-tenant', user: 'test-host' });
    bookingService = new BookingService(ctx);
    calendarService = new CalendarService(ctx);

    const calendar = await calendarService.create({
      name: 'Test Calendar',
      timezone: 'America/New_York',
    });
    calendarId = calendar.id;

    const page = await bookingService.createPage({
      calendarId,
      slug: 'test-host/test',
      title: 'Test Booking',
      durations: [30],
      defaultDuration: 30,
      bufferBefore: 0,
      bufferAfter: 0,
      maxAdvanceDays: 30,
      minNoticeHours: 1,
      slotInterval: 30,
      locationType: 'virtual',
      availabilitySchedule: {
        monday: [{ start: '09:00', end: '17:00' }],
        tuesday: [{ start: '09:00', end: '17:00' }],
        wednesday: [{ start: '09:00', end: '17:00' }],
        thursday: [{ start: '09:00', end: '17:00' }],
        friday: [{ start: '09:00', end: '17:00' }],
        saturday: [],
        sunday: [],
      },
      intakeFields: [],
    });
    pageId = page.id;
  });

  afterAll(async () => {
    await cleanupTestContext(ctx);
  });

  it('returns available slots excluding existing events', async () => {
    // Create an existing event at 10:00-10:30
    const eventService = new EventService(ctx);
    await eventService.create({
      calendarId,
      title: 'Existing Meeting',
      startTime: '2026-02-10T10:00:00-05:00',
      endTime: '2026-02-10T10:30:00-05:00',
      timezone: 'America/New_York',
    });

    const slots = await bookingService.getAvailableSlots(pageId, {
      date: '2026-02-10',
      duration: 30,
      timezone: 'America/New_York',
    });

    // 9:00-17:00 = 16 slots of 30min, minus 1 (10:00) = 15
    expect(slots).toHaveLength(15);
    expect(slots.find(s => s.start.includes('10:00'))).toBeUndefined();
  });

  it('prevents double-booking the same slot', async () => {
    // Book 11:00 slot
    await bookingService.createBooking({
      bookingPageId: pageId,
      startTime: '2026-02-10T11:00:00-05:00',
      endTime: '2026-02-10T11:30:00-05:00',
      timezone: 'America/New_York',
      duration: 30,
      bookerName: 'First Booker',
      bookerEmail: 'first@example.com',
      intakeResponses: {},
    });

    // Attempt to book the same slot
    await expect(
      bookingService.createBooking({
        bookingPageId: pageId,
        startTime: '2026-02-10T11:00:00-05:00',
        endTime: '2026-02-10T11:30:00-05:00',
        timezone: 'America/New_York',
        duration: 30,
        bookerName: 'Second Booker',
        bookerEmail: 'second@example.com',
        intakeResponses: {},
      })
    ).rejects.toThrow('BOOKING_SLOT_UNAVAILABLE');
  });

  it('applies buffer times between bookings', async () => {
    const bufferedPage = await bookingService.createPage({
      calendarId,
      slug: 'test-host/buffered',
      title: 'Buffered Booking',
      durations: [30],
      defaultDuration: 30,
      bufferBefore: 15,
      bufferAfter: 15,
      maxAdvanceDays: 30,
      minNoticeHours: 1,
      slotInterval: 30,
      locationType: 'virtual',
      availabilitySchedule: {
        monday: [{ start: '09:00', end: '17:00' }],
        tuesday: [{ start: '09:00', end: '17:00' }],
        wednesday: [{ start: '09:00', end: '17:00' }],
        thursday: [{ start: '09:00', end: '17:00' }],
        friday: [{ start: '09:00', end: '17:00' }],
        saturday: [],
        sunday: [],
      },
      intakeFields: [],
    });

    // Book 10:00-10:30
    await bookingService.createBooking({
      bookingPageId: bufferedPage.id,
      startTime: '2026-02-11T10:00:00-05:00',
      endTime: '2026-02-11T10:30:00-05:00',
      timezone: 'America/New_York',
      duration: 30,
      bookerName: 'Booker',
      bookerEmail: 'booker@example.com',
      intakeResponses: {},
    });

    const slots = await bookingService.getAvailableSlots(bufferedPage.id, {
      date: '2026-02-11',
      duration: 30,
      timezone: 'America/New_York',
    });

    // 9:30 should be blocked (buffer before 10:00)
    // 10:00 should be blocked (booked)
    // 10:30 should be blocked (buffer after 10:30)
    expect(slots.find(s => s.start.includes('09:30'))).toBeUndefined();
    expect(slots.find(s => s.start.includes('10:00'))).toBeUndefined();
    expect(slots.find(s => s.start.includes('10:30'))).toBeUndefined();
    // 09:00 and 11:00 should be available
    expect(slots.find(s => s.start.includes('09:00'))).toBeDefined();
    expect(slots.find(s => s.start.includes('11:00'))).toBeDefined();
  });

  it('handles booking cancellation and slot release', async () => {
    const booking = await bookingService.createBooking({
      bookingPageId: pageId,
      startTime: '2026-02-12T14:00:00-05:00',
      endTime: '2026-02-12T14:30:00-05:00',
      timezone: 'America/New_York',
      duration: 30,
      bookerName: 'Cancel Tester',
      bookerEmail: 'cancel@example.com',
      intakeResponses: {},
    });

    // Cancel the booking
    const cancelled = await bookingService.cancelBooking(booking.id, {
      cancelledBy: 'booker',
      reason: 'Schedule conflict',
    });

    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.cancellationReason).toBe('Schedule conflict');

    // Slot should be available again
    const slots = await bookingService.getAvailableSlots(pageId, {
      date: '2026-02-12',
      duration: 30,
      timezone: 'America/New_York',
    });

    expect(slots.find(s => s.start.includes('14:00'))).toBeDefined();
  });
});
```

### Integration Test Example: Conflict Detection

```typescript
import { describe, it, expect } from 'vitest';
import { SchedulingService } from '../services/scheduling.service';

describe('SchedulingService.detectConflicts', () => {
  it('detects hard conflicts with busy events', async () => {
    const scheduling = new SchedulingService(ctx);

    // User has event 10:00-11:00
    await createEvent({
      calendarId,
      title: 'Existing Meeting',
      startTime: '2026-02-10T10:00:00-05:00',
      endTime: '2026-02-10T11:00:00-05:00',
      busyStatus: 'busy',
    });

    const conflicts = await scheduling.detectConflicts({
      userId: ctx.userId,
      startTime: '2026-02-10T10:30:00-05:00',
      endTime: '2026-02-10T11:30:00-05:00',
    });

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].overlapMinutes).toBe(30);
    expect(conflicts[0].type).toBe('hard');
    expect(conflicts[0].event.title).toBe('Existing Meeting');
  });

  it('returns soft conflicts for tentative events', async () => {
    const scheduling = new SchedulingService(ctx);

    await createEvent({
      calendarId,
      title: 'Tentative Lunch',
      startTime: '2026-02-10T12:00:00-05:00',
      endTime: '2026-02-10T13:00:00-05:00',
      busyStatus: 'tentative',
    });

    const conflicts = await scheduling.detectConflicts({
      userId: ctx.userId,
      startTime: '2026-02-10T12:00:00-05:00',
      endTime: '2026-02-10T13:00:00-05:00',
    });

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe('soft');
  });

  it('ignores free events', async () => {
    const scheduling = new SchedulingService(ctx);

    await createEvent({
      calendarId,
      title: 'Focus Time (free)',
      startTime: '2026-02-10T14:00:00-05:00',
      endTime: '2026-02-10T16:00:00-05:00',
      busyStatus: 'free',
    });

    const conflicts = await scheduling.detectConflicts({
      userId: ctx.userId,
      startTime: '2026-02-10T14:00:00-05:00',
      endTime: '2026-02-10T15:00:00-05:00',
    });

    expect(conflicts).toHaveLength(0);
  });
});
```

### Test Coverage Targets

| Area | Target | Notes |
|------|--------|-------|
| Recurrence expansion | 95% | Critical path — edge cases matter (DST, leap years, month-end). |
| Scheduling / availability | 90% | Core value proposition — must be reliable. |
| Booking flow | 90% | Public-facing — race conditions, validation, edge cases. |
| Calendar CRUD | 85% | Standard CRUD — less risky but still covered. |
| ICS import/export | 90% | Interoperability — tested against real exports from Google/Outlook/Apple. |
| Timezone handling | 95% | Highest risk for subtle bugs — DST transitions, ambiguous times. |
| External sync | 80% | Depends on external APIs — mocked in tests, real in staging. |
| Resource booking | 85% | Overlap prevention is critical — tested with concurrent requests. |
| Analytics | 75% | Read-only queries — lower risk. |

### Key Test Scenarios

- **DST transitions** — Events spanning "spring forward" and "fall back" transitions
- **Leap year** — Feb 29 recurrence on non-leap years
- **Timezone edge cases** — International date line, half-hour offset timezones (IST, ACST)
- **Concurrent bookings** — Multiple users booking the same slot simultaneously
- **Recurrence modification** — Edit "this and following" in the middle of a series
- **Sync conflict resolution** — Same event modified locally and remotely between syncs
- **ICS compatibility** — Import files generated by Google Calendar, Outlook, Apple Calendar, Thunderbird
- **Large calendars** — Performance tests with 10,000+ events and 100+ recurring series
- **Resource double-booking** — Database constraint enforcement under concurrent load
- **Webhook replay** — Idempotent processing of duplicate webhook deliveries

---

*Last updated: 2026-02-09*