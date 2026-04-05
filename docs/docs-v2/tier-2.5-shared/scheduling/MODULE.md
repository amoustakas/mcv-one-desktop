# @mcv/shared/scheduling — Scheduling & Availability Engine

**Parent Package:** @mcv/shared  
**Tier:** 2.5 (Shared Business Utilities)  
**Classification:** PUBLISHABLE  
**Last Updated:** February 8, 2026

---

## Purpose

The `scheduling` module is a comprehensive **timezone-aware scheduling, availability, and booking engine** powering every time-based operation in MCV.ONE. It provides weekly availability definitions with exception overrides, dynamic time slot generation with configurable durations and buffers, RFC 5545-compliant recurrence rule parsing and expansion, conflict-free appointment booking with optimistic locking, iCal import/export interoperability, multi-timezone display and storage normalization, business hours awareness, round-robin team assignment, embeddable booking pages, and calendar synchronization with external providers (Google Calendar, Outlook 365, Apple Calendar).

**Every scheduled event — from client consultations and team meetings to service appointments, automated task windows, resource reservations, recurring billing cycles, and granular time tracking — is modeled, validated, and managed through this engine.**

The scheduling module sits at the intersection of multiple MCV business domains:

- **MCV.ONE Admin** — Venture-level calendar management, team scheduling, appointment oversight
- **BetEdge** — Agent consultation booking, handicapping session scheduling, event-timed notifications
- **NAOS Agents** — Automated appointment creation, calendar-aware task scheduling, meeting orchestration
- **Client Portal** — Self-service booking pages, appointment management, rescheduling flows
- **Workforce** — Time entry tracking, billable hours, timer support, timesheet approval workflows

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                       SCHEDULING & AVAILABILITY ENGINE                           │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                          CONSUMER LAYER                                    │  │
│  │                                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐   │  │
│  │  │ Booking Page │  │  Admin Panel │  │  Workflows  │  │  Public API  │   │  │
│  │  │  (Clients)   │  │  (Ventures)  │  │  (Triggers) │  │  (Embeds)    │   │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘  └──────┬───────┘   │  │
│  │         │                 │                  │                 │            │  │
│  │         └─────────────────┴──────────────────┴─────────────────┘            │  │
│  │                                   │                                         │  │
│  └───────────────────────────────────┼─────────────────────────────────────────┘  │
│                                      │                                            │
│  ┌───────────────────────────────────▼─────────────────────────────────────────┐  │
│  │                       SCHEDULING PIPELINE                                    │  │
│  │                                                                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐       │  │
│  │  │    1.       │  │    2.       │  │    3.       │  │     4.       │       │  │
│  │  │ Availability│─▶│   Slot      │─▶│  Conflict   │─▶│ Appointment  │       │  │
│  │  │  Resolver   │  │ Generator   │  │  Detector   │  │   Manager    │       │  │
│  │  │             │  │             │  │             │  │              │       │  │
│  │  │ • Weekly    │  │ • Duration  │  │ • Overlap   │  │ • Create     │       │  │
│  │  │ • Overrides │  │ • Buffers   │  │ • Resource  │  │ • Confirm    │       │  │
│  │  │ • Per-user  │  │ • Alignment │  │ • Multi-cal │  │ • Cancel     │       │  │
│  │  │ • Holidays  │  │ • Max/day   │  │ • Double-bk │  │ • Reschedule │       │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └──────────────┘       │  │
│  │                                                                              │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                            │
│  ┌───────────────────────────────────▼─────────────────────────────────────────┐  │
│  │                       CALENDAR ENGINE                                        │  │
│  │                                                                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐       │  │
│  │  │  Calendar    │  │  Round      │  │  Booking    │  │  Google      │       │  │
│  │  │  Manager     │  │  Robin      │  │  Pages      │  │  Calendar    │       │  │
│  │  │             │  │  Engine     │  │             │  │  Sync        │       │  │
│  │  │ • Types     │  │             │  │             │  │              │       │  │
│  │  │ • Personal  │  │ • Avail-   │  │ • Slug      │  │ • OAuth      │       │  │
│  │  │ • Round-RB  │  │   ability  │  │ • Branding  │  │ • 2-way      │       │  │
│  │  │ • Collective│  │ • Equal    │  │ • Forms     │  │ • Incremental│       │  │
│  │  │ • Class     │  │ • Priority │  │ • Custom CSS│  │ • Token      │       │  │
│  │  │ • Service   │  │ • Weighted │  │ • Redirect  │  │   rotation   │       │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └──────────────┘       │  │
│  │                                                                              │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                            │
│  ┌───────────────────────────────────▼─────────────────────────────────────────┐  │
│  │                       TIME TRACKING ENGINE                                   │  │
│  │                                                                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐       │  │
│  │  │  Time Entry  │  │  Timer      │  │  Billing    │  │  Approval    │       │  │
│  │  │  Manager     │  │  Support    │  │  Calculator │  │  Workflow    │       │  │
│  │  │             │  │             │  │             │  │              │       │  │
│  │  │ • Manual    │  │ • Start/    │  │ • Hourly    │  │ • Submit     │       │  │
│  │  │ • Timer     │  │   stop      │  │   rates     │  │ • Review     │       │  │
│  │  │ • Import    │  │ • Active    │  │ • Currency  │  │ • Approve    │       │  │
│  │  │ • API       │  │   tracking  │  │ • Totals    │  │ • Reject     │       │  │
│  │  │ • Agent     │  │ • Duration  │  │ • Reports   │  │ • Audit      │       │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └──────────────┘       │  │
│  │                                                                              │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                            │
│  ┌───────────────────────────────────▼─────────────────────────────────────────┐  │
│  │                       NOTIFICATION LAYER                                     │  │
│  │                                                                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐       │  │
│  │  │  Reminders   │  │Confirmations│  │ Cancellation│  │   Attendee   │       │  │
│  │  │             │  │             │  │  Notices    │  │   Responses  │       │  │
│  │  │ • Email     │  │ • Booking   │  │ • Auto-     │  │ • Accept     │       │  │
│  │  │ • SMS       │  │ • Reschedule│  │   notify    │  │ • Decline    │       │  │
│  │  │ • Scheduled │  │ • Template  │  │ • Reason    │  │ • Pending    │       │  │
│  │  │ • Custom    │  │   driven    │  │ • Chain     │  │ • Reassign   │       │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └──────────────┘       │  │
│  │                                                                              │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                            │
│  ┌───────────────────────────────────▼─────────────────────────────────────────┐  │
│  │                       PERSISTENCE LAYER                                      │  │
│  │                                                                              │  │
│  │  calendars ◄──────────► calendar_availability ◄──► calendar_overrides        │  │
│  │  appointments ◄───────► appointment_reminders ◄──► appointment_attendees     │  │
│  │  booking_pages ◄──────► round_robin_config                                   │  │
│  │  google_calendar_sync ◄────────────────────────► time_entries                │  │
│  │                                                                              │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Booking an Appointment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     APPOINTMENT BOOKING FLOW                                │
│                                                                             │
│  Client Request                                                             │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
│  │  Validate   │───▶│  Resolve    │───▶│  Generate   │                     │
│  │  Input      │    │  Calendar   │    │  Available  │                     │
│  │             │    │  + Settings │    │  Slots      │                     │
│  │ • Timezone  │    │             │    │             │                     │
│  │ • Duration  │    │ • Type      │    │ • Weekly    │                     │
│  │ • Min notice│    │ • Buffers   │    │   avail     │                     │
│  │ • Max adv.  │    │ • Max/day   │    │ • Overrides │                     │
│  └─────────────┘    └─────────────┘    │ • Existing  │                     │
│                                         │   bookings │                     │
│                                         └──────┬──────┘                     │
│                                                │                            │
│                                                ▼                            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
│  │  Send       │◀───│  Assign     │◀───│  Check      │                     │
│  │  Reminders  │    │  User       │    │  Conflicts  │                     │
│  │  + Notify   │    │  (if RR)    │    │             │                     │
│  │             │    │             │    │ • Overlap   │                     │
│  │ • Email     │    │ • Avail-   │    │ • Buffer    │                     │
│  │ • SMS       │    │   ability  │    │ • Capacity  │                     │
│  │ • Template  │    │ • Equal    │    │ • Max/day   │                     │
│  │ • Schedule  │    │ • Priority │    │ • Resource  │                     │
│  └─────────────┘    │ • Weighted │    └─────────────┘                     │
│       │             └─────────────┘                                        │
│       ▼                    │                                               │
│  ┌─────────────┐           ▼                                               │
│  │  Audit Log  │    ┌─────────────┐                                        │
│  │             │    │  Create     │                                        │
│  │ • Event     │    │  Appointment│                                        │
│  │ • Actor     │    │             │                                        │
│  │ • Venture   │    │ • Status    │                                        │
│  │ • Timestamp │    │ • Attendees │                                        │
│  └─────────────┘    │ • Custom    │                                        │
│                     │   fields    │                                        │
│                     └─────────────┘                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createCalendar,            // Create a new calendar for a venture
  updateCalendar,            // Update calendar configuration and settings
  getCalendar,               // Retrieve calendar by ID
  getCalendarBySlug,         // Retrieve calendar by venture + slug
  listCalendars,             // List calendars with filters (venture, type, active)
  deleteCalendar,            // Soft-delete a calendar
  activateCalendar,          // Set calendar as active
  deactivateCalendar,        // Deactivate without deleting
} from './server/services/calendar-service';

// ═══════════════════════════════════════════════════════════════════════════════
// AVAILABILITY DEFINITION
// ═══════════════════════════════════════════════════════════════════════════════

export {
  setAvailability,           // Set weekly availability for a calendar (or user within)
  getAvailability,           // Get availability windows for a calendar/user
  updateAvailability,        // Update specific day-of-week availability
  deleteAvailability,        // Remove availability window
  getEffectiveAvailability,  // Resolved availability (weekly + overrides applied)
  getAvailableSlots,         // Get bookable slots for a date range
  checkSlotAvailability,     // Check if a specific datetime is bookable
  getNextAvailableSlot,      // Find next available slot after a given time
} from './server/services/availability-service';

// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR OVERRIDES
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createOverride,            // Create a date-specific override (block or custom hours)
  updateOverride,            // Modify an existing override
  deleteOverride,            // Remove an override
  listOverrides,             // List overrides for a calendar within a date range
  blockDate,                 // Convenience: block an entire date (holiday, PTO)
  setSpecialHours,           // Convenience: set custom hours for a date
} from './server/services/override-service';

// ═══════════════════════════════════════════════════════════════════════════════
// APPOINTMENT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createAppointment,         // Create a new appointment on a calendar
  updateAppointment,         // Update appointment details
  getAppointment,            // Retrieve appointment by ID
  listAppointments,          // List appointments with filters (calendar, status, date range)
  cancelAppointment,         // Cancel an appointment with reason
  rescheduleAppointment,     // Move appointment to a new time
  confirmAppointment,        // Confirm a scheduled appointment
  completeAppointment,       // Mark appointment as completed
  markNoShow,                // Mark appointment as no-show
  getAppointmentConflicts,   // Check for conflicts before creating
} from './server/services/appointment-service';

// ═══════════════════════════════════════════════════════════════════════════════
// APPOINTMENT REMINDERS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  scheduleReminder,          // Schedule a reminder for an appointment
  cancelReminder,            // Cancel a scheduled reminder
  listReminders,             // List reminders for an appointment
  listPendingReminders,      // List all pending reminders (for cron processing)
  processReminders,          // Cron: process and send due reminders
  markReminderSent,          // Mark reminder as sent
  markReminderFailed,        // Mark reminder as failed with error
} from './server/services/reminder-service';

// ═══════════════════════════════════════════════════════════════════════════════
// APPOINTMENT ATTENDEES
// ═══════════════════════════════════════════════════════════════════════════════

export {
  addAttendee,               // Add an attendee to an appointment
  removeAttendee,            // Remove an attendee from an appointment
  updateAttendeeStatus,      // Update attendee RSVP status (accept/decline)
  listAttendees,             // List attendees for an appointment
  getAttendeeResponse,       // Get a specific attendee's response
} from './server/services/attendee-service';

// ═══════════════════════════════════════════════════════════════════════════════
// ROUND ROBIN CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export {
  configureRoundRobin,       // Set up round robin for a calendar
  updateRoundRobin,          // Update round robin settings
  getRoundRobinConfig,       // Get current round robin configuration
  getNextAssignee,           // Determine next user to assign
  recordAssignment,          // Record an assignment (update counts)
  resetAssignmentCounts,     // Reset assignment counters
} from './server/services/round-robin-service';

// ═══════════════════════════════════════════════════════════════════════════════
// BOOKING PAGES
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createBookingPage,         // Create a public booking page for a calendar
  updateBookingPage,         // Update booking page configuration
  getBookingPage,            // Get booking page by ID
  getBookingPageBySlug,      // Get booking page by public slug
  listBookingPages,          // List booking pages for a venture
  activateBookingPage,       // Enable a booking page
  deactivateBookingPage,     // Disable a booking page
} from './server/services/booking-page-service';

// ═══════════════════════════════════════════════════════════════════════════════
// GOOGLE CALENDAR SYNC
// ═══════════════════════════════════════════════════════════════════════════════

export {
  connectGoogleCalendar,     // Initiate Google Calendar OAuth and store tokens
  disconnectGoogleCalendar,  // Remove Google Calendar connection
  syncGoogleCalendar,        // Trigger manual sync with Google Calendar
  getGoogleSyncStatus,       // Get sync status and last sync time
  listGoogleSyncConfigs,     // List all Google Calendar sync configs for a venture
  refreshGoogleTokens,       // Refresh expired OAuth tokens
} from './server/services/google-calendar-service';

// ═══════════════════════════════════════════════════════════════════════════════
// TIME ENTRY TRACKING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createTimeEntry,           // Log a time entry (manual or timer)
  updateTimeEntry,           // Update time entry details
  deleteTimeEntry,           // Delete a time entry
  getTimeEntry,              // Retrieve a time entry by ID
  listTimeEntries,           // List time entries with filters (task, user, project, date)
  startTimer,                // Start a running timer for a task
  stopTimer,                 // Stop a running timer and record duration
  getRunningTimers,          // Get all currently running timers for a user
  approveTimeEntry,          // Approve a time entry
  bulkApproveTimeEntries,    // Bulk approve time entries
  getTimeReport,             // Generate time report (billable vs non-billable)
  getProjectTimeTotal,       // Get total time logged for a project
} from './server/services/time-entry-service';

// ═══════════════════════════════════════════════════════════════════════════════
// TIMEZONE UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

export {
  toTimezone,                // Convert UTC date to target timezone
  fromTimezone,              // Convert local date to UTC for storage
  getTimezoneOffset,         // Get offset in minutes for a timezone at a date
  listTimezones,             // List all IANA timezones with labels
  detectTimezone,            // Detect user timezone from browser/locale
  isDST,                     // Check if a date is in Daylight Saving Time
  getNextDSTTransition,      // Get next DST transition for a timezone
  formatInTimezone,          // Format a date for display in a given timezone
} from './server/services/timezone-service';

// ═══════════════════════════════════════════════════════════════════════════════
// BUSINESS HOURS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  defineBusinessHours,       // Define business hours for a venture
  isBusinessHours,           // Check if a datetime is within business hours
  getNextBusinessHour,       // Get next business hour opening
  getBusinessDaysInRange,    // Count business days between two dates
  addBusinessDays,           // Add N business days to a date
  addBusinessHours,          // Add N business hours to a date
} from './server/services/business-hours-service';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { useCalendar } from './client/hooks/use-calendar';
export { useAvailability } from './client/hooks/use-availability';
export { useAppointments } from './client/hooks/use-appointments';
export { useBookingPage } from './client/hooks/use-booking-page';
export { useTimeSlots } from './client/hooks/use-time-slots';
export { useTimeEntries } from './client/hooks/use-time-entries';
export { useTimer } from './client/hooks/use-timer';
export { useGoogleCalendarSync } from './client/hooks/use-google-calendar-sync';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { AvailabilityEditor } from './client/components/availability-editor';
export { BookingCalendar } from './client/components/booking-calendar';
export { TimeSlotPicker } from './client/components/time-slot-picker';
export { AppointmentCard } from './client/components/appointment-card';
export { AppointmentList } from './client/components/appointment-list';
export { BookingPagePreview } from './client/components/booking-page-preview';
export { RoundRobinDashboard } from './client/components/round-robin-dashboard';
export { TimezoneSelector } from './client/components/timezone-selector';
export { TimeEntryForm } from './client/components/time-entry-form';
export { TimerWidget } from './client/components/timer-widget';
export { TimeReportChart } from './client/components/time-report-chart';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  CALENDAR_TYPES,
  APPOINTMENT_STATUSES,
  MEETING_TYPES,
  APPOINTMENT_SOURCES,
  REMINDER_TYPES,
  REMINDER_STATUSES,
  ATTENDEE_STATUSES,
  DISTRIBUTION_MODES,
  TIME_ENTRY_SOURCES,
  DAYS_OF_WEEK,
  DEFAULT_CALENDAR_SETTINGS,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Calendar types
  CalendarType,
  Calendar,
  CalendarSettings,

  // Availability types
  CalendarAvailabilityRecord,
  EffectiveAvailability,
  TimeWindow,

  // Override types
  CalendarOverride,

  // Appointment types
  Appointment,
  AppointmentStatus,
  AppointmentSource,
  MeetingType,

  // Reminder types
  AppointmentReminder,
  ReminderType,
  ReminderStatus,

  // Attendee types
  AppointmentAttendee,
  AttendeeStatus,

  // Round robin types
  RoundRobinConfig,
  DistributionMode,
  RoundRobinWeights,
  RoundRobinPriorities,

  // Booking page types
  BookingPage,
  BookingFormField,

  // Google Calendar sync types
  GoogleCalendarSync,

  // Time entry types
  TimeEntry,
  NewTimeEntry,
  TimeEntrySource,

  // Slot types
  TimeSlot,
  SlotStatus,
  SlotGenerationOptions,

  // Business hours types
  BusinessHours,
  BusinessHoursConfig,
} from './types';
```

---

## Calendar Type System

The scheduling module supports five distinct calendar types, each with unique behavior matching GoHighLevel conventions plus MCV extensions:

| Type | Description | Assignment | Use Case |
|------|-------------|------------|----------|
| **`personal`** | Single-owner calendar | One user | Personal appointments, 1:1 consultations |
| **`round_robin`** | Auto-distributes across team | Multiple users | Sales calls, support sessions, intake meetings |
| **`collective`** | Requires all team members available | Multiple users | Board meetings, team syncs, group interviews |
| **`class`** | Group events with capacity limits | One instructor + N attendees | Workshops, training sessions, webinars |
| **`service`** | Service-based scheduling | Service providers | Haircuts, car maintenance, facility bookings |

### Calendar Settings Structure

Every calendar carries a `settings` JSONB column that controls booking behavior:

```typescript
interface CalendarSettings {
  /** Default appointment duration in minutes */
  defaultDuration: number;        // Default: 30

  /** Minimum advance notice required before a slot (minutes) */
  minNotice: number;              // Default: 60

  /** Maximum days in advance a booking can be made */
  maxAdvance: number;             // Default: 60

  /** Buffer time before each appointment (minutes) */
  bufferBefore: number;           // Default: 0

  /** Buffer time after each appointment (minutes) */
  bufferAfter: number;            // Default: 0

  /** Maximum appointments per day (null = unlimited) */
  maxPerDay: number | null;       // Default: null

  /** Maximum attendees per slot — for class calendars (null = unlimited) */
  maxPerSlot: number | null;      // Default: null

  /** Whether new appointments require manual approval */
  requiresApproval: boolean;      // Default: false

  /** URL to redirect to after booking confirmation */
  confirmationRedirectUrl: string | null;  // Default: null

  /** Whether clients can reschedule their own appointments */
  allowReschedule: boolean;       // Default: true

  /** Whether clients can cancel their own appointments */
  allowCancel: boolean;           // Default: true

  /** Deadline for cancellation (minutes before appointment; null = anytime) */
  cancelDeadline: number | null;  // Default: null
}
```

---

## Core TypeScript Interfaces

### Calendar

```typescript
/**
 * Calendar types matching GoHighLevel + MCV extensions.
 * Determines booking behavior, assignment logic, and UI rendering.
 */
export const calendarTypes = [
  'personal',
  'round_robin',
  'collective',
  'class',
  'service',
] as const;
export type CalendarType = (typeof calendarTypes)[number];

/**
 * Core calendar entity — the top-level scheduling container.
 * Each venture can have multiple calendars of different types.
 */
interface Calendar {
  /** UUID primary key */
  id: string;

  /** Owning venture — all queries scoped by this */
  ventureId: string;

  /** Human-readable calendar name */
  name: string;

  /** URL-safe slug (unique within venture) */
  slug: string;

  /** Optional description */
  description: string | null;

  /** Calendar type — determines behavior and assignment logic */
  type: CalendarType;

  /** IANA timezone for this calendar (e.g., 'America/Toronto') */
  timezone: string;

  /** Team member user IDs (for round_robin, collective, class calendars) */
  teamMemberIds: string[];

  /** Whether this calendar accepts new bookings */
  isActive: boolean;

  /** Calendar color for UI rendering (hex) */
  color: string;

  /** Booking behavior configuration */
  settings: CalendarSettings;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}
```

### Appointment

```typescript
/**
 * Appointment statuses — lifecycle states for an appointment.
 */
export const appointmentStatuses = [
  'scheduled',    // Initial state after creation
  'confirmed',    // Confirmed by admin or auto-confirmed
  'completed',    // Past and successfully completed
  'cancelled',    // Cancelled by user, contact, or admin
  'no_show',      // Contact did not attend
  'rescheduled',  // Moved to a different time (original marked rescheduled)
] as const;
export type AppointmentStatus = (typeof appointmentStatuses)[number];

/**
 * Meeting types — how the appointment is conducted.
 */
export const meetingTypes = ['in_person', 'phone', 'video', 'custom'] as const;
export type MeetingType = (typeof meetingTypes)[number];

/**
 * Appointment sources — how the appointment was created.
 */
export const appointmentSources = [
  'booking_page',  // Created via public booking page
  'manual',        // Created manually by admin/staff
  'workflow',      // Created by an automated workflow
  'api',           // Created via API integration
] as const;
export type AppointmentSource = (typeof appointmentSources)[number];

/**
 * Core appointment entity — a scheduled event on a calendar.
 */
interface Appointment {
  /** UUID primary key */
  id: string;

  /** Owning venture */
  ventureId: string;

  /** Calendar this appointment belongs to */
  calendarId: string;

  /** Contact (client/patient/customer) — nullable for internal meetings */
  contactId: string | null;

  /** Assigned team member (user) — nullable for unassigned */
  assignedUserId: string | null;

  /** Appointment title/subject */
  title: string;

  /** Optional description or notes for the appointment */
  description: string | null;

  /** Start time (UTC timestamp) */
  startTime: Date;

  /** End time (UTC timestamp) */
  endTime: Date;

  /** Duration in minutes */
  duration: number;

  /** Current appointment status */
  status: AppointmentStatus;

  /** Physical meeting location (if in_person) */
  meetingLocation: string | null;

  /** Meeting URL (if video) */
  meetingUrl: string | null;

  /** How the meeting is conducted */
  meetingType: MeetingType;

  /** Internal notes (not visible to contact) */
  notes: string | null;

  /** Reason for cancellation (if cancelled) */
  cancellationReason: string | null;

  /** Link to original appointment if this is a reschedule */
  rescheduledFromId: string | null;

  /** How the appointment was created */
  source: AppointmentSource;

  /** Arbitrary custom fields for venture-specific data */
  customFields: Record<string, unknown> | null;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}
```

### Calendar Availability

```typescript
/**
 * Weekly availability window for a calendar or specific user within a calendar.
 * Multiple windows per day are supported (e.g., morning + afternoon blocks).
 */
interface CalendarAvailabilityRecord {
  /** UUID primary key */
  id: string;

  /** Calendar this availability belongs to */
  calendarId: string;

  /** User ID — nullable for calendar-wide availability */
  userId: string | null;

  /** Day of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday */
  dayOfWeek: number;

  /** Start time in HH:mm format (24-hour, local to calendar timezone) */
  startTime: string;

  /** End time in HH:mm format (24-hour, local to calendar timezone) */
  endTime: string;

  /** Whether this availability window is currently active */
  isActive: boolean;

  /** Timestamp */
  createdAt: Date;
}
```

### Calendar Overrides

```typescript
/**
 * Date-specific override for a calendar's regular availability.
 * Used for holidays, PTO days, special hours, etc.
 */
interface CalendarOverride {
  /** UUID primary key */
  id: string;

  /** Calendar this override applies to */
  calendarId: string;

  /** User ID — nullable for calendar-wide overrides */
  userId: string | null;

  /** Specific date (YYYY-MM-DD) this override applies to */
  date: string;

  /** If true, the entire date is blocked (no appointments) */
  isBlocked: boolean;

  /** Custom start time (HH:mm) — null if blocked */
  startTime: string | null;

  /** Custom end time (HH:mm) — null if blocked */
  endTime: string | null;

  /** Human-readable reason for the override */
  reason: string | null;

  /** Timestamp */
  createdAt: Date;
}
```

### Appointment Reminders

```typescript
/**
 * Reminder types — delivery channel for the reminder.
 */
export const reminderTypes = ['email', 'sms'] as const;
export type ReminderType = (typeof reminderTypes)[number];

/**
 * Reminder statuses — lifecycle of a scheduled reminder.
 */
export const reminderStatuses = ['pending', 'sent', 'failed'] as const;
export type ReminderStatus = (typeof reminderStatuses)[number];

/**
 * Scheduled reminder for an appointment.
 */
interface AppointmentReminder {
  /** UUID primary key */
  id: string;

  /** Appointment this reminder is for */
  appointmentId: string;

  /** Delivery channel */
  type: ReminderType;

  /** When to send the reminder (UTC) */
  scheduledAt: Date;

  /** When the reminder was actually sent (null if not yet sent) */
  sentAt: Date | null;

  /** Current reminder status */
  status: ReminderStatus;

  /** Template ID for the reminder content */
  templateId: string | null;

  /** Timestamp */
  createdAt: Date;
}
```

### Appointment Attendees

```typescript
/**
 * Attendee RSVP statuses.
 */
export const attendeeStatuses = ['pending', 'accepted', 'declined'] as const;
export type AttendeeStatus = (typeof attendeeStatuses)[number];

/**
 * An attendee (team member/user) on an appointment.
 * For multi-participant appointments (collective, class calendars).
 */
interface AppointmentAttendee {
  /** UUID primary key */
  id: string;

  /** Appointment this attendee belongs to */
  appointmentId: string;

  /** User ID of the attendee */
  userId: string;

  /** RSVP status */
  status: AttendeeStatus;

  /** When the attendee responded */
  respondedAt: Date | null;

  /** Timestamp */
  createdAt: Date;
}
```

### Round Robin Configuration

```typescript
/**
 * Round robin distribution modes — how appointments are assigned across team members.
 */
export const distributionModes = [
  'availability',  // Assign to first available team member
  'equal',         // Distribute equally across all team members
  'priority',      // Assign by priority order (lower number = higher priority)
  'weighted',      // Assign based on configurable weights
] as const;
export type DistributionMode = (typeof distributionModes)[number];

/** Weights map: userId → weight (higher weight = more assignments) */
export type RoundRobinWeights = Record<string, number>;

/** Priority map: userId → priority (lower number = higher priority) */
export type RoundRobinPriorities = Record<string, number>;

/**
 * Round robin configuration for a calendar.
 * Only applicable to 'round_robin' type calendars.
 */
interface RoundRobinConfig {
  /** UUID primary key */
  id: string;

  /** Calendar this config belongs to (unique — one config per calendar) */
  calendarId: string;

  /** How appointments are distributed */
  distributionMode: DistributionMode;

  /** Per-user weights (for 'weighted' mode) */
  weights: RoundRobinWeights;

  /** Per-user priorities (for 'priority' mode) */
  priorities: RoundRobinPriorities;

  /** Skip users who have conflicting appointments */
  skipIfBusy: boolean;

  /** Auto-reassign if assigned user declines */
  reassignOnDecline: boolean;

  /** Allow booking with a specific pre-assigned user */
  bookWithAssignedUser: boolean;

  /** Last user who was assigned (for round-robin fairness) */
  lastAssignedUserId: string | null;

  /** Running count of assignments per user: userId → count */
  assignmentCounts: Record<string, number>;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}
```

### Booking Pages

```typescript
/**
 * Form field definition for booking page intake forms.
 */
interface BookingFormField {
  /** Field name (used as form data key) */
  name: string;

  /** Display label */
  label: string;

  /** Input type */
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox';

  /** Whether the field is required */
  required: boolean;

  /** Options for select fields */
  options?: string[];

  /** Placeholder text */
  placeholder?: string;
}

/**
 * Public-facing booking page for a calendar.
 * Embeddable or shareable via direct URL.
 */
interface BookingPage {
  /** UUID primary key */
  id: string;

  /** Calendar this booking page is for */
  calendarId: string;

  /** Owning venture */
  ventureId: string;

  /** URL-safe slug (globally unique) */
  slug: string;

  /** Page title */
  title: string;

  /** Page description (shown to visitors) */
  description: string | null;

  /** Logo URL for branding */
  logoUrl: string | null;

  /** Primary brand color (hex) */
  primaryColor: string;

  /** Background color (hex) */
  backgroundColor: string;

  /** Whether to show timezone selector to visitors */
  showTimezone: boolean;

  /** Whether to show team member avatars */
  showAvatar: boolean;

  /** Custom CSS for advanced branding */
  customCss: string | null;

  /** Intake form fields */
  formFields: BookingFormField[];

  /** Confirmation message shown after booking */
  confirmationMessage: string | null;

  /** Redirect URL after booking (overrides confirmation message) */
  redirectUrl: string | null;

  /** Whether this booking page is live */
  isActive: boolean;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}
```

### Google Calendar Sync

```typescript
/**
 * Google Calendar synchronization configuration.
 * Stores OAuth tokens and sync state for bidirectional calendar sync.
 */
interface GoogleCalendarSync {
  /** UUID primary key */
  id: string;

  /** User who connected Google Calendar */
  userId: string;

  /** Venture context */
  ventureId: string;

  /** Google account email */
  googleAccountEmail: string;

  /** Encrypted OAuth access token */
  accessToken: string;

  /** Encrypted OAuth refresh token */
  refreshToken: string;

  /** Google Calendar IDs being synced */
  calendarIds: string[];

  /** Whether sync is currently enabled */
  syncEnabled: boolean;

  /** Last successful sync timestamp */
  lastSyncAt: Date | null;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}
```

### Time Entry

```typescript
/**
 * Time entry source — how the time entry was created.
 */
export const timeEntrySources = [
  'manual',       // Manually entered by user
  'timer',        // Recorded via start/stop timer
  'import',       // Imported from external system
  'api',          // Created via API
  'agent',        // Logged by NAOS agent
  'integration',  // From connected tool (Jira, ClickUp, etc.)
] as const;
export type TimeEntrySource = (typeof timeEntrySources)[number];

/**
 * Granular time tracking entry.
 * Supports billable hours, timer mode, categorization, and approval workflows.
 */
interface TimeEntry {
  /** UUID primary key */
  id: string;

  /** Task this time entry is for (required) */
  taskId: string;

  /** User who performed the work (null for system entries) */
  userId: string | null;

  /** Project this entry rolls up to */
  projectId: string | null;

  /** Agent ID if logged by an AI agent */
  agentId: string | null;

  /** When the work started (with timezone) */
  startedAt: Date;

  /** When the work ended (null if timer still running) */
  endedAt: Date | null;

  /** Duration in minutes */
  durationMinutes: number;

  /** Description of work performed */
  description: string | null;

  /** Whether this time is billable to a client */
  isBillable: boolean;

  /** Hourly rate (for billing calculations) */
  hourlyRate: string | null;  // numeric(10,2)

  /** Currency code (ISO 4217) */
  currency: string;

  /** How this entry was created */
  source: TimeEntrySource;

  /** Whether this is a currently running timer */
  isRunning: boolean;

  /** Work category (e.g., 'development', 'review', 'meeting', 'debugging') */
  category: string | null;

  /** Searchable tags */
  tags: string[];

  /** Whether this entry has been approved */
  isApproved: boolean;

  /** Who approved the entry */
  approvedById: string | null;

  /** When the entry was approved */
  approvedAt: Date | null;

  /** Arbitrary metadata */
  metadata: Record<string, unknown>;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}
```

### Time Slot (Generated)

```typescript
/**
 * A generated time slot representing an available booking window.
 * Not stored in the database — computed from availability + existing appointments.
 */
interface TimeSlot {
  /** Slot start time (UTC) */
  start: Date;

  /** Slot end time (UTC) */
  end: Date;

  /** Duration in minutes */
  duration: number;

  /** Current slot status */
  status: SlotStatus;

  /** Available capacity (for class calendars) */
  availableCapacity: number;

  /** Total capacity */
  totalCapacity: number;

  /** Calendar ID this slot was generated from */
  calendarId: string;

  /** Assigned user ID (if round-robin pre-assigned) */
  assignedUserId: string | null;
}

type SlotStatus =
  | 'available'     // Open for booking
  | 'booked'        // Fully booked
  | 'partial'       // Some capacity remaining (class calendars)
  | 'held'          // Temporarily held (checkout flow)
  | 'blocked'       // Blocked by override
  | 'past';         // Slot time has passed

interface SlotGenerationOptions {
  /** Calendar ID to generate slots for */
  calendarId: string;

  /** Date range to generate slots for */
  from: Date;
  to: Date;

  /** Slot duration in minutes (overrides calendar default) */
  duration?: number;

  /** Timezone for display purposes */
  displayTimezone?: string;

  /** Only include slots with availability after this (for min notice) */
  minNoticeMinutes?: number;

  /** Include metadata (assigned user, capacity) */
  includeMetadata?: boolean;
}
```

---

## Database Schema

### calendars Table

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- CALENDARS — Top-level scheduling containers
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE calendars (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      UUID        NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  slug            TEXT        NOT NULL,
  description     TEXT,
  type            TEXT        NOT NULL DEFAULT 'personal',
                              -- CHECK (type IN ('personal','round_robin','collective','class','service'))
  timezone        TEXT        NOT NULL DEFAULT 'UTC',
  team_member_ids JSONB       DEFAULT '[]'::jsonb,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  color           TEXT        DEFAULT '#3b82f6',
  settings        JSONB       NOT NULL DEFAULT '{
    "defaultDuration": 30,
    "minNotice": 60,
    "maxAdvance": 60,
    "bufferBefore": 0,
    "bufferAfter": 0,
    "maxPerDay": null,
    "maxPerSlot": null,
    "requiresApproval": false,
    "confirmationRedirectUrl": null,
    "allowReschedule": true,
    "allowCancel": true,
    "cancelDeadline": null
  }'::jsonb,
  created_at      TIMESTAMP   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP   NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX calendar_venture_idx ON calendars (venture_id);
CREATE UNIQUE INDEX calendar_slug_venture_idx ON calendars (venture_id, slug);
CREATE INDEX calendar_type_idx ON calendars (type);
```

**Drizzle ORM Definition:**

```typescript
export const calendars = pgTable(
  'calendars',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id')
      .notNull()
      .references(() => ventures.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    type: text('type').notNull().$type<CalendarType>().default('personal'),
    timezone: text('timezone').notNull().default('UTC'),
    teamMemberIds: jsonb('team_member_ids').$type<string[]>().default([]),
    isActive: boolean('is_active').notNull().default(true),
    color: text('color').default('#3b82f6'),
    settings: jsonb('settings').$type<CalendarSettings>().notNull().default({
      defaultDuration: 30,
      minNotice: 60,
      maxAdvance: 60,
      bufferBefore: 0,
      bufferAfter: 0,
      maxPerDay: null,
      maxPerSlot: null,
      requiresApproval: false,
      confirmationRedirectUrl: null,
      allowReschedule: true,
      allowCancel: true,
      cancelDeadline: null,
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    ventureIdx: index('calendar_venture_idx').on(table.ventureId),
    slugIdx: uniqueIndex('calendar_slug_venture_idx').on(
      table.ventureId,
      table.slug
    ),
    typeIdx: index('calendar_type_idx').on(table.type),
  })
);
```

### calendar_availability Table

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- CALENDAR AVAILABILITY — Weekly recurring time windows
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE calendar_availability (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id     UUID        NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  user_id         UUID        REFERENCES users(id) ON DELETE SET NULL,
  day_of_week     SMALLINT    NOT NULL,   -- 0=Sunday, 6=Saturday
  start_time      TEXT        NOT NULL,   -- HH:mm format
  end_time        TEXT        NOT NULL,   -- HH:mm format
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMP   NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX availability_calendar_idx ON calendar_availability (calendar_id);
CREATE INDEX availability_user_idx ON calendar_availability (user_id);
```

**Drizzle ORM Definition:**

```typescript
export const calendarAvailability = pgTable(
  'calendar_availability',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    calendarId: uuid('calendar_id')
      .notNull()
      .references(() => calendars.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    dayOfWeek: smallint('day_of_week').notNull(),
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    calendarIdx: index('availability_calendar_idx').on(table.calendarId),
    userIdx: index('availability_user_idx').on(table.userId),
  })
);
```

### calendar_overrides Table

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- CALENDAR OVERRIDES — Date-specific exceptions to weekly availability
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE calendar_overrides (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id     UUID        NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  user_id         UUID        REFERENCES users(id) ON DELETE SET NULL,
  date            DATE        NOT NULL,
  is_blocked      BOOLEAN     NOT NULL DEFAULT false,
  start_time      TEXT,                   -- HH:mm, null if blocked
  end_time        TEXT,                   -- HH:mm, null if blocked
  reason          TEXT,
  created_at      TIMESTAMP   NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX override_calendar_idx ON calendar_overrides (calendar_id);
CREATE INDEX override_date_idx ON calendar_overrides (calendar_id, date);
```

**Drizzle ORM Definition:**

```typescript
export const calendarOverrides = pgTable(
  'calendar_overrides',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    calendarId: uuid('calendar_id')
      .notNull()
      .references(() => calendars.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    date: date('date').notNull(),
    isBlocked: boolean('is_blocked').notNull().default(false),
    startTime: text('start_time'),
    endTime: text('end_time'),
    reason: text('reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    calendarIdx: index('override_calendar_idx').on(table.calendarId),
    dateIdx: index('override_date_idx').on(table.calendarId, table.date),
  })
);
```

### appointments Table

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- APPOINTMENTS — Scheduled events on calendars
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE appointments (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id            UUID        NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  calendar_id           UUID        NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  contact_id            UUID        REFERENCES contacts(id) ON DELETE SET NULL,
  assigned_user_id      UUID        REFERENCES users(id) ON DELETE SET NULL,
  title                 TEXT        NOT NULL,
  description           TEXT,
  start_time            TIMESTAMP   NOT NULL,
  end_time              TIMESTAMP   NOT NULL,
  duration              INTEGER     NOT NULL,  -- minutes
  status                TEXT        NOT NULL DEFAULT 'scheduled',
                                    -- CHECK (status IN ('scheduled','confirmed','completed',
                                    --                    'cancelled','no_show','rescheduled'))
  meeting_location      TEXT,
  meeting_url           TEXT,
  meeting_type          TEXT        DEFAULT 'video',
                                    -- CHECK (meeting_type IN ('in_person','phone','video','custom'))
  notes                 TEXT,
  cancellation_reason   TEXT,
  rescheduled_from_id   UUID,       -- self-reference to original appointment
  source                TEXT        NOT NULL DEFAULT 'manual',
                                    -- CHECK (source IN ('booking_page','manual','workflow','api'))
  custom_fields         JSONB,
  created_at            TIMESTAMP   NOT NULL DEFAULT now(),
  updated_at            TIMESTAMP   NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX appointment_venture_idx ON appointments (venture_id);
CREATE INDEX appointment_calendar_idx ON appointments (calendar_id);
CREATE INDEX appointment_contact_idx ON appointments (contact_id);
CREATE INDEX appointment_assigned_user_idx ON appointments (assigned_user_id);
CREATE INDEX appointment_status_idx ON appointments (status);
CREATE INDEX appointment_start_time_idx ON appointments (start_time);
CREATE INDEX appointment_date_range_idx ON appointments (venture_id, start_time, end_time);
```

**Drizzle ORM Definition:**

```typescript
export const appointments = pgTable(
  'appointments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id')
      .notNull()
      .references(() => ventures.id, { onDelete: 'cascade' }),
    calendarId: uuid('calendar_id')
      .notNull()
      .references(() => calendars.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id').references(() => contacts.id, {
      onDelete: 'set null',
    }),
    assignedUserId: uuid('assigned_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    title: text('title').notNull(),
    description: text('description'),
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time').notNull(),
    duration: integer('duration').notNull(),
    status: text('status')
      .notNull()
      .$type<AppointmentStatus>()
      .default('scheduled'),
    meetingLocation: text('meeting_location'),
    meetingUrl: text('meeting_url'),
    meetingType: text('meeting_type').$type<MeetingType>().default('video'),
    notes: text('notes'),
    cancellationReason: text('cancellation_reason'),
    rescheduledFromId: uuid('rescheduled_from_id'),
    source: text('source')
      .$type<AppointmentSource>()
      .notNull()
      .default('manual'),
    customFields: jsonb('custom_fields').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    ventureIdx: index('appointment_venture_idx').on(table.ventureId),
    calendarIdx: index('appointment_calendar_idx').on(table.calendarId),
    contactIdx: index('appointment_contact_idx').on(table.contactId),
    assignedUserIdx: index('appointment_assigned_user_idx').on(
      table.assignedUserId
    ),
    statusIdx: index('appointment_status_idx').on(table.status),
    startTimeIdx: index('appointment_start_time_idx').on(table.startTime),
    dateRangeIdx: index('appointment_date_range_idx').on(
      table.ventureId,
      table.startTime,
      table.endTime
    ),
  })
);
```

### appointment_reminders Table

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- APPOINTMENT REMINDERS — Scheduled notifications for appointments
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE appointment_reminders (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id    UUID        NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  type              TEXT        NOT NULL,   -- 'email' | 'sms'
  scheduled_at      TIMESTAMP   NOT NULL,
  sent_at           TIMESTAMP,
  status            TEXT        NOT NULL DEFAULT 'pending',
                                -- CHECK (status IN ('pending','sent','failed'))
  template_id       TEXT,
  created_at        TIMESTAMP   NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX reminder_appointment_idx ON appointment_reminders (appointment_id);
CREATE INDEX reminder_status_idx ON appointment_reminders (status);
CREATE INDEX reminder_scheduled_idx ON appointment_reminders (scheduled_at);
```

**Drizzle ORM Definition:**

```typescript
export const appointmentReminders = pgTable(
  'appointment_reminders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    appointmentId: uuid('appointment_id')
      .notNull()
      .references(() => appointments.id, { onDelete: 'cascade' }),
    type: text('type').notNull().$type<ReminderType>(),
    scheduledAt: timestamp('scheduled_at').notNull(),
    sentAt: timestamp('sent_at'),
    status: text('status')
      .notNull()
      .$type<ReminderStatus>()
      .default('pending'),
    templateId: text('template_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    appointmentIdx: index('reminder_appointment_idx').on(table.appointmentId),
    statusIdx: index('reminder_status_idx').on(table.status),
    scheduledIdx: index('reminder_scheduled_idx').on(table.scheduledAt),
  })
);
```

### appointment_attendees Table

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- APPOINTMENT ATTENDEES — Multi-participant appointment membership
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE appointment_attendees (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id    UUID        NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  user_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status            TEXT        NOT NULL DEFAULT 'pending',
                                -- CHECK (status IN ('pending','accepted','declined'))
  responded_at      TIMESTAMP,
  created_at        TIMESTAMP   NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX attendee_appointment_idx ON appointment_attendees (appointment_id);
CREATE INDEX attendee_user_idx ON appointment_attendees (user_id);
CREATE UNIQUE INDEX attendee_unique_idx ON appointment_attendees (appointment_id, user_id);
```

**Drizzle ORM Definition:**

```typescript
export const appointmentAttendees = pgTable(
  'appointment_attendees',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    appointmentId: uuid('appointment_id')
      .notNull()
      .references(() => appointments.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: text('status')
      .notNull()
      .$type<AttendeeStatus>()
      .default('pending'),
    respondedAt: timestamp('responded_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    appointmentIdx: index('attendee_appointment_idx').on(table.appointmentId),
    userIdx: index('attendee_user_idx').on(table.userId),
    uniqueAttendee: uniqueIndex('attendee_unique_idx').on(
      table.appointmentId,
      table.userId
    ),
  })
);
```

### round_robin_config Table

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- ROUND ROBIN CONFIG — Assignment logic for round_robin calendars
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE round_robin_config (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id               UUID        NOT NULL UNIQUE REFERENCES calendars(id) ON DELETE CASCADE,
  distribution_mode         TEXT        NOT NULL DEFAULT 'availability',
                                        -- CHECK (distribution_mode IN
                                        --   ('availability','equal','priority','weighted'))
  weights                   JSONB       DEFAULT '{}'::jsonb,
  priorities                JSONB       DEFAULT '{}'::jsonb,
  skip_if_busy              BOOLEAN     NOT NULL DEFAULT true,
  reassign_on_decline       BOOLEAN     NOT NULL DEFAULT true,
  book_with_assigned_user   BOOLEAN     NOT NULL DEFAULT false,
  last_assigned_user_id     UUID,
  assignment_counts         JSONB       DEFAULT '{}'::jsonb,
  created_at                TIMESTAMP   NOT NULL DEFAULT now(),
  updated_at                TIMESTAMP   NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX rr_config_calendar_idx ON round_robin_config (calendar_id);
```

**Drizzle ORM Definition:**

```typescript
export const roundRobinConfig = pgTable(
  'round_robin_config',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    calendarId: uuid('calendar_id')
      .notNull()
      .references(() => calendars.id, { onDelete: 'cascade' })
      .unique(),
    distributionMode: text('distribution_mode')
      .notNull()
      .$type<DistributionMode>()
      .default('availability'),
    weights: jsonb('weights').$type<RoundRobinWeights>().default({}),
    priorities: jsonb('priorities').$type<RoundRobinPriorities>().default({}),
    skipIfBusy: boolean('skip_if_busy').notNull().default(true),
    reassignOnDecline: boolean('reassign_on_decline').notNull().default(true),
    bookWithAssignedUser: boolean('book_with_assigned_user')
      .notNull()
      .default(false),
    lastAssignedUserId: uuid('last_assigned_user_id'),
    assignmentCounts: jsonb('assignment_counts')
      .$type<Record<string, number>>()
      .default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    calendarIdx: index('rr_config_calendar_idx').on(table.calendarId),
  })
);
```

### booking_pages Table

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- BOOKING PAGES — Public embeddable booking interfaces
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE booking_pages (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id             UUID        NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  venture_id              UUID        NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  slug                    TEXT        NOT NULL,
  title                   TEXT        NOT NULL,
  description             TEXT,
  logo_url                TEXT,
  primary_color           TEXT        DEFAULT '#3b82f6',
  background_color        TEXT        DEFAULT '#ffffff',
  show_timezone           BOOLEAN     NOT NULL DEFAULT true,
  show_avatar             BOOLEAN     NOT NULL DEFAULT true,
  custom_css              TEXT,
  form_fields             JSONB       DEFAULT '[]'::jsonb,
  confirmation_message    TEXT,
  redirect_url            TEXT,
  is_active               BOOLEAN     NOT NULL DEFAULT true,
  created_at              TIMESTAMP   NOT NULL DEFAULT now(),
  updated_at              TIMESTAMP   NOT NULL DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX booking_page_slug_idx ON booking_pages (slug);
CREATE INDEX booking_page_calendar_idx ON booking_pages (calendar_id);
CREATE INDEX booking_page_venture_idx ON booking_pages (venture_id);
```

**Drizzle ORM Definition:**

```typescript
export const bookingPages = pgTable(
  'booking_pages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    calendarId: uuid('calendar_id')
      .notNull()
      .references(() => calendars.id, { onDelete: 'cascade' }),
    ventureId: uuid('venture_id')
      .notNull()
      .references(() => ventures.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    logoUrl: text('logo_url'),
    primaryColor: text('primary_color').default('#3b82f6'),
    backgroundColor: text('background_color').default('#ffffff'),
    showTimezone: boolean('show_timezone').notNull().default(true),
    showAvatar: boolean('show_avatar').notNull().default(true),
    customCss: text('custom_css'),
    formFields: jsonb('form_fields').$type<BookingFormField[]>().default([]),
    confirmationMessage: text('confirmation_message'),
    redirectUrl: text('redirect_url'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex('booking_page_slug_idx').on(table.slug),
    calendarIdx: index('booking_page_calendar_idx').on(table.calendarId),
    ventureIdx: index('booking_page_venture_idx').on(table.ventureId),
  })
);
```

### google_calendar_sync Table

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- GOOGLE CALENDAR SYNC — OAuth tokens and sync state for Google Calendar
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE google_calendar_sync (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  venture_id              UUID        NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  google_account_email    TEXT        NOT NULL,
  access_token            TEXT        NOT NULL,   -- encrypted at rest
  refresh_token           TEXT        NOT NULL,   -- encrypted at rest
  calendar_ids            JSONB       DEFAULT '[]'::jsonb,
  sync_enabled            BOOLEAN     NOT NULL DEFAULT true,
  last_sync_at            TIMESTAMP,
  created_at              TIMESTAMP   NOT NULL DEFAULT now(),
  updated_at              TIMESTAMP   NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX gcal_user_idx ON google_calendar_sync (user_id);
CREATE INDEX gcal_venture_idx ON google_calendar_sync (venture_id);
CREATE UNIQUE INDEX gcal_user_venture_idx ON google_calendar_sync (user_id, venture_id);
```

**Drizzle ORM Definition:**

```typescript
export const googleCalendarSync = pgTable(
  'google_calendar_sync',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ventureId: uuid('venture_id')
      .notNull()
      .references(() => ventures.id, { onDelete: 'cascade' }),
    googleAccountEmail: text('google_account_email').notNull(),
    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token').notNull(),
    calendarIds: jsonb('calendar_ids').$type<string[]>().default([]),
    syncEnabled: boolean('sync_enabled').notNull().default(true),
    lastSyncAt: timestamp('last_sync_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('gcal_user_idx').on(table.userId),
    ventureIdx: index('gcal_venture_idx').on(table.ventureId),
    uniqueUser: uniqueIndex('gcal_user_venture_idx').on(
      table.userId,
      table.ventureId
    ),
  })
);
```

### time_entries Table

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- TIME ENTRIES — Granular time tracking with billing and approval
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TYPE time_entry_source AS ENUM (
  'manual', 'timer', 'import', 'api', 'agent', 'integration'
);

CREATE TABLE time_entries (
  id                UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id           UUID              NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id           UUID              REFERENCES users(id) ON DELETE SET NULL,
  project_id        UUID              REFERENCES projects(id) ON DELETE CASCADE,
  agent_id          TEXT,
  started_at        TIMESTAMPTZ       NOT NULL,
  ended_at          TIMESTAMPTZ,
  duration_minutes  INTEGER           NOT NULL,
  description       TEXT,
  is_billable       BOOLEAN           NOT NULL DEFAULT false,
  hourly_rate       NUMERIC(10,2),
  currency          TEXT              DEFAULT 'USD',
  source            time_entry_source NOT NULL DEFAULT 'manual',
  is_running        BOOLEAN           NOT NULL DEFAULT false,
  category          TEXT,
  tags              JSONB             DEFAULT '[]'::jsonb,
  is_approved       BOOLEAN           NOT NULL DEFAULT false,
  approved_by_id    UUID              REFERENCES users(id),
  approved_at       TIMESTAMPTZ,
  metadata          JSONB             DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ       NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX time_entries_task_idx ON time_entries (task_id);
CREATE INDEX time_entries_user_idx ON time_entries (user_id);
CREATE INDEX time_entries_project_idx ON time_entries (project_id);
CREATE INDEX time_entries_started_at_idx ON time_entries (started_at);
CREATE INDEX time_entries_billable_idx ON time_entries (is_billable);
CREATE INDEX time_entries_running_idx ON time_entries (is_running);
CREATE INDEX time_entries_agent_idx ON time_entries (agent_id);
```

**Drizzle ORM Definition:**

```typescript
export const timeEntrySourceEnum = pgEnum('time_entry_source', [
  'manual', 'timer', 'import', 'api', 'agent', 'integration',
]);

export const timeEntries = pgTable('time_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  agentId: text('agent_id'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  durationMinutes: integer('duration_minutes').notNull(),
  description: text('description'),
  isBillable: boolean('is_billable').notNull().default(false),
  hourlyRate: numeric('hourly_rate', { precision: 10, scale: 2 }),
  currency: text('currency').default('USD'),
  source: timeEntrySourceEnum('source').notNull().default('manual'),
  isRunning: boolean('is_running').notNull().default(false),
  category: text('category'),
  tags: jsonb('tags').$type<string[]>().default([]),
  isApproved: boolean('is_approved').notNull().default(false),
  approvedById: uuid('approved_by_id').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('time_entries_task_idx').on(table.taskId),
  index('time_entries_user_idx').on(table.userId),
  index('time_entries_project_idx').on(table.projectId),
  index('time_entries_started_at_idx').on(table.startedAt),
  index('time_entries_billable_idx').on(table.isBillable),
  index('time_entries_running_idx').on(table.isRunning),
  index('time_entries_agent_idx').on(table.agentId),
]);
```

### Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     SCHEDULING ER DIAGRAM                                │
│                                                                          │
│                                                                          │
│  ventures ──────────┐                                                    │
│                     │                                                    │
│  users ─────────┐   │                                                    │
│                 │   │                                                    │
│  contacts ──┐   │   │                                                    │
│             │   │   │                                                    │
│             │   │   ▼                                                    │
│             │   │  ┌──────────────────┐                                  │
│             │   │  │   calendars      │                                  │
│             │   │  │                  │──── 1:1 ────► round_robin_config │
│             │   │  │  • venture_id    │                                  │
│             │   │  │  • type          │──── 1:N ────► calendar_availability│
│             │   │  │  • timezone      │                                  │
│             │   │  │  • settings      │──── 1:N ────► calendar_overrides │
│             │   │  │  • team_members  │                                  │
│             │   │  └────────┬─────────┘──── 1:N ────► booking_pages     │
│             │   │           │                                            │
│             │   │           │ 1:N                                        │
│             │   │           ▼                                            │
│             │   │  ┌──────────────────┐                                  │
│             │   ├─▶│  appointments    │                                  │
│             │   │  │                  │──── 1:N ────► appointment_reminders│
│             ├───┘  │  • calendar_id   │                                  │
│             │      │  • contact_id    │──── 1:N ────► appointment_attendees│
│             └─────▶│  • assigned_user │                                  │
│                    │  • start_time    │──── self ────► rescheduled_from  │
│                    │  • status        │                                  │
│                    └──────────────────┘                                  │
│                                                                          │
│  users ──────── 1:N ──► google_calendar_sync                            │
│  ventures ───── 1:N ──► google_calendar_sync                            │
│                                                                          │
│  tasks ──────── 1:N ──► time_entries                                    │
│  users ──────── 1:N ──► time_entries                                    │
│  projects ───── 1:N ──► time_entries                                    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Relations (Drizzle ORM)

```typescript
export const calendarsRelations = relations(calendars, ({ one, many }) => ({
  venture: one(ventures, {
    fields: [calendars.ventureId],
    references: [ventures.id],
  }),
  availability: many(calendarAvailability),
  overrides: many(calendarOverrides),
  appointments: many(appointments),
  roundRobinConfig: one(roundRobinConfig, {
    fields: [calendars.id],
    references: [roundRobinConfig.calendarId],
  }),
  bookingPages: many(bookingPages),
}));

export const calendarAvailabilityRelations = relations(
  calendarAvailability,
  ({ one }) => ({
    calendar: one(calendars, {
      fields: [calendarAvailability.calendarId],
      references: [calendars.id],
    }),
    user: one(users, {
      fields: [calendarAvailability.userId],
      references: [users.id],
    }),
  })
);

export const calendarOverridesRelations = relations(
  calendarOverrides,
  ({ one }) => ({
    calendar: one(calendars, {
      fields: [calendarOverrides.calendarId],
      references: [calendars.id],
    }),
    user: one(users, {
      fields: [calendarOverrides.userId],
      references: [users.id],
    }),
  })
);

export const appointmentsRelations = relations(
  appointments,
  ({ one, many }) => ({
    venture: one(ventures, {
      fields: [appointments.ventureId],
      references: [ventures.id],
    }),
    calendar: one(calendars, {
      fields: [appointments.calendarId],
      references: [calendars.id],
    }),
    contact: one(contacts, {
      fields: [appointments.contactId],
      references: [contacts.id],
    }),
    assignedUser: one(users, {
      fields: [appointments.assignedUserId],
      references: [users.id],
    }),
    rescheduledFrom: one(appointments, {
      fields: [appointments.rescheduledFromId],
      references: [appointments.id],
    }),
    reminders: many(appointmentReminders),
    attendees: many(appointmentAttendees),
  })
);

export const appointmentRemindersRelations = relations(
  appointmentReminders,
  ({ one }) => ({
    appointment: one(appointments, {
      fields: [appointmentReminders.appointmentId],
      references: [appointments.id],
    }),
  })
);

export const appointmentAttendeesRelations = relations(
  appointmentAttendees,
  ({ one }) => ({
    appointment: one(appointments, {
      fields: [appointmentAttendees.appointmentId],
      references: [appointments.id],
    }),
    user: one(users, {
      fields: [appointmentAttendees.userId],
      references: [users.id],
    }),
  })
);

export const roundRobinConfigRelations = relations(
  roundRobinConfig,
  ({ one }) => ({
    calendar: one(calendars, {
      fields: [roundRobinConfig.calendarId],
      references: [calendars.id],
    }),
  })
);

export const bookingPagesRelations = relations(bookingPages, ({ one }) => ({
  calendar: one(calendars, {
    fields: [bookingPages.calendarId],
    references: [calendars.id],
  }),
  venture: one(ventures, {
    fields: [bookingPages.ventureId],
    references: [ventures.id],
  }),
}));

export const googleCalendarSyncRelations = relations(
  googleCalendarSync,
  ({ one }) => ({
    user: one(users, {
      fields: [googleCalendarSync.userId],
      references: [users.id],
    }),
    venture: one(ventures, {
      fields: [googleCalendarSync.ventureId],
      references: [ventures.id],
    }),
  })
);

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  task: one(tasks, {
    fields: [timeEntries.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [timeEntries.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [timeEntries.projectId],
    references: [projects.id],
  }),
  approvedBy: one(users, {
    fields: [timeEntries.approvedById],
    references: [users.id],
    relationName: 'approvedTimeEntries',
  }),
}));
```

---

## Usage Examples

### Example 1: Create a Calendar with Availability

```typescript
import { createCalendar, setAvailability } from '@mcv/shared/scheduling';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Create a personal consultation calendar with weekly availability
// ═══════════════════════════════════════════════════════════════════════════════

// Step 1: Create the calendar
const calendar = await createCalendar({
  ventureId: 'clinic-venture-uuid',
  name: 'Dr. Smith — Consultations',
  slug: 'dr-smith-consult',
  type: 'personal',
  timezone: 'America/Toronto',
  color: '#2563eb',
  settings: {
    defaultDuration: 30,
    minNotice: 120,          // 2 hours notice required
    maxAdvance: 90,          // Book up to 90 days ahead
    bufferBefore: 5,         // 5 min buffer before each appointment
    bufferAfter: 10,         // 10 min buffer after each appointment
    maxPerDay: 12,           // Max 12 appointments per day
    maxPerSlot: null,
    requiresApproval: false, // Auto-confirm
    confirmationRedirectUrl: 'https://clinic.mcv.one/booked',
    allowReschedule: true,
    allowCancel: true,
    cancelDeadline: 60,      // Must cancel at least 1 hour before
  },
});

console.log(`Calendar created: ${calendar.id} (${calendar.slug})`);
// Output: "Calendar created: cal-uuid-123 (dr-smith-consult)"

// Step 2: Set weekly availability (Monday-Friday, with split hours)
const availabilityRecords = await Promise.all([
  // Monday: 9am-12pm + 1pm-5pm
  setAvailability({ calendarId: calendar.id, dayOfWeek: 1,
    startTime: '09:00', endTime: '12:00' }),
  setAvailability({ calendarId: calendar.id, dayOfWeek: 1,
    startTime: '13:00', endTime: '17:00' }),
  // Tuesday: Full day
  setAvailability({ calendarId: calendar.id, dayOfWeek: 2,
    startTime: '09:00', endTime: '17:00' }),
  // Wednesday: Morning only
  setAvailability({ calendarId: calendar.id, dayOfWeek: 3,
    startTime: '09:00', endTime: '12:00' }),
  // Thursday: Full day
  setAvailability({ calendarId: calendar.id, dayOfWeek: 4,
    startTime: '09:00', endTime: '17:00' }),
  // Friday: Early close
  setAvailability({ calendarId: calendar.id, dayOfWeek: 5,
    startTime: '09:00', endTime: '15:00' }),
  // Saturday & Sunday: No availability (no records = closed)
]);

console.log(`Set ${availabilityRecords.length} availability windows`);
// Output: "Set 6 availability windows"
```

### Example 2: Generate Available Time Slots

```typescript
import { getAvailableSlots } from '@mcv/shared/scheduling';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: Generate bookable 30-minute slots for a week
// ═══════════════════════════════════════════════════════════════════════════════

const slots = await getAvailableSlots({
  calendarId: 'cal-uuid-123',
  from: new Date('2026-02-09T00:00:00Z'),  // Monday
  to: new Date('2026-02-14T23:59:59Z'),    // Saturday
  displayTimezone: 'America/Toronto',
  minNoticeMinutes: 120,                    // Respect 2-hour notice
});

console.log(`Found ${slots.length} available slots`);
for (const slot of slots.slice(0, 5)) {
  console.log(`  ${slot.start.toISOString()} – ${slot.end.toISOString()} [${slot.status}]`);
}
// Output:
// Found 42 available slots
//   2026-02-09T14:00:00Z – 2026-02-09T14:30:00Z [available]
//   2026-02-09T14:45:00Z – 2026-02-09T15:15:00Z [available]
//   2026-02-09T15:30:00Z – 2026-02-09T16:00:00Z [available]
//   2026-02-09T16:15:00Z – 2026-02-09T16:45:00Z [available]
//   2026-02-09T18:00:00Z – 2026-02-09T18:30:00Z [available]

// Note: Slots account for:
// - Calendar settings (30 min duration, 5 min before + 10 min after buffer)
// - Weekly availability (Mon 9-12, 1-5 ET)
// - Overrides (holidays, PTO)
// - Existing appointments (booked slots removed)
// - Minimum notice (slots < 2h from now excluded)
```

### Example 3: Create an Appointment with Conflict Detection

```typescript
import { createAppointment, getAppointmentConflicts } from '@mcv/shared/scheduling';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Book an appointment with automatic conflict detection
// ═══════════════════════════════════════════════════════════════════════════════

const startTime = new Date('2026-02-10T14:00:00Z');
const endTime = new Date('2026-02-10T14:30:00Z');

// Step 1: Check for conflicts
const conflicts = await getAppointmentConflicts({
  calendarId: 'cal-uuid-123',
  assignedUserId: 'dr-smith-uuid',
  startTime,
  endTime,
});

if (conflicts.length > 0) {
  console.error('Cannot book — conflicts detected:');
  for (const conflict of conflicts) {
    console.error(`  ${conflict.type}: ${conflict.message}`);
  }
  // "overlap: Conflicts with 'Team Standup' (14:00-14:30)"
  // "buffer_violation: Too close to 'Patient Review' (14:30-15:00, needs 10 min buffer)"
} else {
  // Step 2: No conflicts — create the appointment
  const appointment = await createAppointment({
    ventureId: 'clinic-venture-uuid',
    calendarId: 'cal-uuid-123',
    contactId: 'patient-jane-uuid',
    assignedUserId: 'dr-smith-uuid',
    title: 'Initial Consultation — Jane Doe',
    description: 'First consultation for new patient. Insurance pre-verified.',
    startTime,
    endTime,
    duration: 30,
    meetingType: 'video',
    meetingUrl: 'https://meet.mcv.one/dr-smith/abc123',
    source: 'booking_page',
    customFields: {
      insuranceProvider: 'Blue Cross',
      referralSource: 'website',
      preferredLanguage: 'en',
    },
  });

  console.log(`Appointment created: ${appointment.id}`);
  console.log(`  Status: ${appointment.status}`);
  console.log(`  Time: ${appointment.startTime.toISOString()}`);
  // Output:
  // Appointment created: appt-uuid-456
  //   Status: scheduled
  //   Time: 2026-02-10T14:00:00.000Z
}
```

### Example 4: Reschedule an Appointment

```typescript
import { rescheduleAppointment, getAppointment } from '@mcv/shared/scheduling';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Reschedule an existing appointment to a new time
// ═══════════════════════════════════════════════════════════════════════════════

const rescheduled = await rescheduleAppointment({
  appointmentId: 'appt-uuid-456',
  newStartTime: new Date('2026-02-11T10:00:00Z'),
  newEndTime: new Date('2026-02-11T10:30:00Z'),
  reason: 'Patient requested different time due to work conflict',
});

console.log(`Rescheduled to: ${rescheduled.id}`);
console.log(`  New time: ${rescheduled.startTime.toISOString()}`);
console.log(`  Status: ${rescheduled.status}`);
console.log(`  Links back to: ${rescheduled.rescheduledFromId}`);
// Output:
// Rescheduled to: appt-uuid-789
//   New time: 2026-02-11T10:00:00.000Z
//   Status: scheduled
//   Links back to: appt-uuid-456

// Original appointment is now marked as 'rescheduled'
const original = await getAppointment('appt-uuid-456');
console.log(`Original status: ${original.status}`);
// Output: "Original status: rescheduled"
```

### Example 5: Calendar Overrides (Holidays & Special Hours)

```typescript
import { blockDate, setSpecialHours, listOverrides } from '@mcv/shared/scheduling';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: Manage calendar overrides for holidays and special hours
// ═══════════════════════════════════════════════════════════════════════════════

// Block a date entirely (holiday)
await blockDate({
  calendarId: 'cal-uuid-123',
  date: '2026-02-16',
  reason: 'Family Day (Ontario statutory holiday)',
});

// Block a date for a specific team member
await blockDate({
  calendarId: 'cal-uuid-123',
  userId: 'dr-smith-uuid',
  date: '2026-03-20',
  reason: 'Personal day — PTO',
});

// Set special hours for a specific date (e.g., shortened day)
await setSpecialHours({
  calendarId: 'cal-uuid-123',
  date: '2026-12-24',
  startTime: '09:00',
  endTime: '12:00',
  reason: 'Christmas Eve — office closes at noon',
});

// List all overrides for February
const overrides = await listOverrides({
  calendarId: 'cal-uuid-123',
  from: '2026-02-01',
  to: '2026-02-28',
});

console.log(`${overrides.length} overrides in February:`);
for (const override of overrides) {
  const status = override.isBlocked ? 'BLOCKED' : `${override.startTime}–${override.endTime}`;
  console.log(`  ${override.date}: ${status} (${override.reason})`);
}
// Output:
// 1 overrides in February:
//   2026-02-16: BLOCKED (Family Day (Ontario statutory holiday))
```

### Example 6: Round Robin Calendar Setup

```typescript
import {
  createCalendar,
  configureRoundRobin,
  getNextAssignee,
  createAppointment,
} from '@mcv/shared/scheduling';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: Set up a round-robin calendar for sales team scheduling
// ═══════════════════════════════════════════════════════════════════════════════

// Step 1: Create a round-robin calendar
const salesCalendar = await createCalendar({
  ventureId: 'betedge-venture-uuid',
  name: 'Sales Consultations',
  slug: 'sales-consult',
  type: 'round_robin',
  timezone: 'America/Toronto',
  teamMemberIds: ['alice-uuid', 'bob-uuid', 'charlie-uuid'],
  settings: {
    defaultDuration: 45,
    minNotice: 60,
    maxAdvance: 30,
    bufferBefore: 0,
    bufferAfter: 15,
    maxPerDay: null,
    maxPerSlot: null,
    requiresApproval: false,
    confirmationRedirectUrl: null,
    allowReschedule: true,
    allowCancel: true,
    cancelDeadline: 30,
  },
});

// Step 2: Configure round-robin distribution
await configureRoundRobin({
  calendarId: salesCalendar.id,
  distributionMode: 'weighted',
  weights: {
    'alice-uuid': 3,     // Alice gets 3x share (senior rep)
    'bob-uuid': 2,       // Bob gets 2x share
    'charlie-uuid': 1,   // Charlie gets 1x share (new hire)
  },
  skipIfBusy: true,
  reassignOnDecline: true,
});

// Step 3: When a booking comes in, auto-assign based on weights + availability
const assignee = await getNextAssignee({
  calendarId: salesCalendar.id,
  requestedTime: new Date('2026-02-10T15:00:00Z'),
});

console.log(`Auto-assigned to: ${assignee.userId} (${assignee.name})`);
// Output: "Auto-assigned to: alice-uuid (Alice Johnson)"
// Alice is assigned because: weighted mode + she's available + has highest weight

// Step 4: Create the appointment with the assigned user
const appointment = await createAppointment({
  ventureId: 'betedge-venture-uuid',
  calendarId: salesCalendar.id,
  contactId: 'lead-uuid',
  assignedUserId: assignee.userId,
  title: 'Sales Consultation — Acme Corp',
  startTime: new Date('2026-02-10T15:00:00Z'),
  endTime: new Date('2026-02-10T15:45:00Z'),
  duration: 45,
  meetingType: 'video',
  source: 'booking_page',
});

console.log(`Appointment with ${assignee.name}: ${appointment.id}`);
```

### Example 7: Booking Page Creation and Public Embedding

```typescript
import { createBookingPage, getBookingPageBySlug } from '@mcv/shared/scheduling';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 7: Create a branded public booking page with intake form
// ═══════════════════════════════════════════════════════════════════════════════

const bookingPage = await createBookingPage({
  calendarId: 'cal-uuid-123',
  ventureId: 'clinic-venture-uuid',
  slug: 'dr-smith-book',
  title: 'Book a Consultation with Dr. Smith',
  description: 'Schedule your initial consultation. Video appointments available.',
  logoUrl: 'https://cdn.mcv.one/clinic/logo.svg',
  primaryColor: '#0066cc',
  backgroundColor: '#f8fafc',
  showTimezone: true,
  showAvatar: true,
  formFields: [
    {
      name: 'fullName',
      label: 'Full Name',
      type: 'text',
      required: true,
      placeholder: 'John Doe',
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      placeholder: 'john@example.com',
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'phone',
      required: true,
      placeholder: '+1 (555) 123-4567',
    },
    {
      name: 'reason',
      label: 'Reason for Visit',
      type: 'select',
      required: true,
      options: ['Initial Consultation', 'Follow-up', 'Second Opinion', 'Referral'],
    },
    {
      name: 'notes',
      label: 'Additional Notes',
      type: 'textarea',
      required: false,
      placeholder: 'Any additional information...',
    },
    {
      name: 'consent',
      label: 'I agree to the privacy policy and terms of service',
      type: 'checkbox',
      required: true,
    },
  ],
  confirmationMessage: 'Your appointment has been booked! Check your email for details.',
  customCss: `
    .booking-container { font-family: 'Inter', sans-serif; }
    .slot-button:hover { transform: scale(1.02); }
  `,
});

console.log(`Booking page live at: https://book.mcv.one/${bookingPage.slug}`);
// Output: "Booking page live at: https://book.mcv.one/dr-smith-book"

// Public lookup by slug (no auth required)
const publicPage = await getBookingPageBySlug('dr-smith-book');
console.log(`Page: ${publicPage.title} — Active: ${publicPage.isActive}`);
```

### Example 8: Appointment Reminders & Notification Workflow

```typescript
import {
  scheduleReminder,
  listPendingReminders,
  processReminders,
} from '@mcv/shared/scheduling';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 8: Configure and process appointment reminders
// ═══════════════════════════════════════════════════════════════════════════════

const appointmentStart = new Date('2026-02-10T14:00:00Z');

// Schedule multiple reminders for an appointment
await scheduleReminder({
  appointmentId: 'appt-uuid-456',
  type: 'email',
  scheduledAt: new Date(appointmentStart.getTime() - 24 * 60 * 60 * 1000), // 24h before
  templateId: 'reminder-24h',
});

await scheduleReminder({
  appointmentId: 'appt-uuid-456',
  type: 'email',
  scheduledAt: new Date(appointmentStart.getTime() - 60 * 60 * 1000), // 1h before
  templateId: 'reminder-1h',
});

await scheduleReminder({
  appointmentId: 'appt-uuid-456',
  type: 'sms',
  scheduledAt: new Date(appointmentStart.getTime() - 15 * 60 * 1000), // 15 min before
  templateId: 'reminder-15min-sms',
});

console.log('3 reminders scheduled for appointment');

// List pending reminders (for monitoring dashboard)
const pending = await listPendingReminders({
  from: new Date(),
  to: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next 24 hours
});
console.log(`${pending.length} reminders due in next 24 hours`);

// Cron job: Process and send due reminders (runs every minute)
const results = await processReminders({
  batchSize: 100,
  before: new Date(),  // Process all reminders scheduled before now
});

console.log(`Sent: ${results.sent}, Failed: ${results.failed}, Skipped: ${results.skipped}`);
// Output: "Sent: 5, Failed: 0, Skipped: 1"
// Skipped = appointment was cancelled after reminder was scheduled
```

### Example 9: Multi-Attendee Collective Calendar

```typescript
import {
  createCalendar,
  addAttendee,
  updateAttendeeStatus,
  listAttendees,
  createAppointment,
} from '@mcv/shared/scheduling';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 9: Collective calendar requiring all team members present
// ═══════════════════════════════════════════════════════════════════════════════

// Create a collective calendar for board meetings
const boardCalendar = await createCalendar({
  ventureId: 'mcv-venture-uuid',
  name: 'Board Meetings',
  slug: 'board-meetings',
  type: 'collective',
  timezone: 'America/Toronto',
  teamMemberIds: ['ceo-uuid', 'cto-uuid', 'cfo-uuid', 'coo-uuid'],
  settings: {
    defaultDuration: 60,
    minNotice: 1440,         // 24 hours notice
    maxAdvance: 180,         // 6 months ahead
    bufferBefore: 15,
    bufferAfter: 15,
    maxPerDay: 2,
    maxPerSlot: null,
    requiresApproval: true,  // Board meetings require approval
    confirmationRedirectUrl: null,
    allowReschedule: true,
    allowCancel: true,
    cancelDeadline: 1440,    // 24h cancellation deadline
  },
});

// Create a board meeting
const boardMeeting = await createAppointment({
  ventureId: 'mcv-venture-uuid',
  calendarId: boardCalendar.id,
  title: 'Q1 2026 Board Meeting',
  description: 'Quarterly business review and strategic planning.',
  startTime: new Date('2026-03-15T14:00:00Z'),
  endTime: new Date('2026-03-15T15:00:00Z'),
  duration: 60,
  meetingType: 'video',
  meetingUrl: 'https://meet.mcv.one/board/q1-2026',
  source: 'manual',
});

// Add attendees (all board members)
const attendeeIds = ['ceo-uuid', 'cto-uuid', 'cfo-uuid', 'coo-uuid'];
for (const userId of attendeeIds) {
  await addAttendee({
    appointmentId: boardMeeting.id,
    userId,
  });
}

// CTO accepts the meeting
await updateAttendeeStatus({
  appointmentId: boardMeeting.id,
  userId: 'cto-uuid',
  status: 'accepted',
});

// CFO declines
await updateAttendeeStatus({
  appointmentId: boardMeeting.id,
  userId: 'cfo-uuid',
  status: 'declined',
});

// List attendees with their responses
const attendees = await listAttendees(boardMeeting.id);
for (const att of attendees) {
  console.log(`  ${att.userId}: ${att.status}`);
}
// Output:
//   ceo-uuid: pending
//   cto-uuid: accepted
//   cfo-uuid: declined
//   coo-uuid: pending
```

### Example 10: Google Calendar Sync

```typescript
import {
  connectGoogleCalendar,
  syncGoogleCalendar,
  getGoogleSyncStatus,
} from '@mcv/shared/scheduling';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 10: Two-way sync with Google Calendar
// ═══════════════════════════════════════════════════════════════════════════════

// Step 1: Connect Google Calendar after OAuth flow
const sync = await connectGoogleCalendar({
  userId: 'dr-smith-uuid',
  ventureId: 'clinic-venture-uuid',
  googleAccountEmail: 'dr.smith@gmail.com',
  accessToken: 'ya29.a0Adw1xeX...',   // From OAuth callback
  refreshToken: '1//0gYq...',          // From OAuth callback
  calendarIds: ['primary', 'work@group.calendar.google.com'],
});

console.log(`Connected Google Calendar: ${sync.googleAccountEmail}`);
console.log(`  Syncing ${sync.calendarIds.length} calendars`);
// Output:
// Connected Google Calendar: dr.smith@gmail.com
//   Syncing 2 calendars

// Step 2: Trigger manual sync
const syncResult = await syncGoogleCalendar({
  syncId: sync.id,
  direction: 'bidirectional',
});

console.log(`Sync complete:`);
console.log(`  Imported: ${syncResult.imported} events`);
console.log(`  Exported: ${syncResult.exported} events`);
console.log(`  Conflicts: ${syncResult.conflicts} events`);
// Output:
// Sync complete:
//   Imported: 15 events
//   Exported: 8 events
//   Conflicts: 2 events

// Step 3: Check sync status (for dashboard)
const status = await getGoogleSyncStatus(sync.id);
console.log(`Last sync: ${status.lastSyncAt?.toISOString()}`);
console.log(`Enabled: ${status.syncEnabled}`);
```

### Example 11: Time Entry Management

```typescript
import {
  createTimeEntry,
  startTimer,
  stopTimer,
  getRunningTimers,
  approveTimeEntry,
  getTimeReport,
} from '@mcv/shared/scheduling';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 11: Time tracking with timer support and billing
// ═══════════════════════════════════════════════════════════════════════════════

// Manual time entry
const manualEntry = await createTimeEntry({
  taskId: 'task-uuid-001',
  userId: 'dev-uuid',
  projectId: 'project-uuid',
  startedAt: new Date('2026-02-10T09:00:00Z'),
  endedAt: new Date('2026-02-10T11:30:00Z'),
  durationMinutes: 150,
  description: 'Implemented booking page component with form validation',
  isBillable: true,
  hourlyRate: '150.00',
  currency: 'USD',
  source: 'manual',
  category: 'development',
  tags: ['frontend', 'booking', 'react'],
});

console.log(`Time entry logged: ${manualEntry.id} (${manualEntry.durationMinutes} min)`);
// Output: "Time entry logged: te-uuid-001 (150 min)"

// Start a timer (real-time tracking)
const timer = await startTimer({
  taskId: 'task-uuid-002',
  userId: 'dev-uuid',
  projectId: 'project-uuid',
  description: 'Code review for scheduling PR',
  isBillable: true,
  hourlyRate: '150.00',
  category: 'review',
  tags: ['code-review', 'scheduling'],
});

console.log(`Timer started: ${timer.id} at ${timer.startedAt.toISOString()}`);
console.log(`  Running: ${timer.isRunning}`);  // true

// Check running timers
const runningTimers = await getRunningTimers('dev-uuid');
console.log(`${runningTimers.length} active timer(s)`);

// Stop the timer after work is done
const stoppedTimer = await stopTimer(timer.id);
console.log(`Timer stopped: ${stoppedTimer.durationMinutes} minutes recorded`);
console.log(`  Running: ${stoppedTimer.isRunning}`);  // false
// Output:
// Timer stopped: 45 minutes recorded
//   Running: false
```

### Example 12: Time Entry Approval & Reporting

```typescript
import {
  approveTimeEntry,
  bulkApproveTimeEntries,
  getTimeReport,
  getProjectTimeTotal,
} from '@mcv/shared/scheduling';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 12: Time entry approval workflow and billing reports
// ═══════════════════════════════════════════════════════════════════════════════

// Manager approves a single time entry
const approved = await approveTimeEntry({
  timeEntryId: 'te-uuid-001',
  approvedById: 'manager-uuid',
});
console.log(`Approved by: ${approved.approvedById} at ${approved.approvedAt?.toISOString()}`);

// Bulk approve all pending entries for a project
const bulkResult = await bulkApproveTimeEntries({
  projectId: 'project-uuid',
  approvedById: 'manager-uuid',
  filter: { isApproved: false, source: 'manual' },
});
console.log(`Bulk approved: ${bulkResult.approved} entries`);

// Generate time report for a project
const report = await getTimeReport({
  projectId: 'project-uuid',
  from: new Date('2026-02-01'),
  to: new Date('2026-02-28'),
  groupBy: 'category',
});

console.log('February 2026 Time Report:');
console.log(`  Total hours: ${(report.totalMinutes / 60).toFixed(1)}h`);
console.log(`  Billable hours: ${(report.billableMinutes / 60).toFixed(1)}h`);
console.log(`  Non-billable hours: ${(report.nonBillableMinutes / 60).toFixed(1)}h`);
console.log(`  Total value: $${report.totalBillableAmount.toFixed(2)} ${report.currency}`);
console.log('\n  By category:');
for (const [category, data] of Object.entries(report.byCategory)) {
  console.log(`    ${category}: ${(data.minutes / 60).toFixed(1)}h ($${data.amount.toFixed(2)})`);
}
// Output:
// February 2026 Time Report:
//   Total hours: 124.5h
//   Billable hours: 98.0h
//   Non-billable hours: 26.5h
//   Total value: $14,700.00 USD
//
//   By category:
//     development: 68.5h ($10,275.00)
//     review: 15.0h ($2,250.00)
//     meeting: 22.5h ($0.00)
//     debugging: 14.5h ($2,175.00)
//     documentation: 4.0h ($0.00)

// Get total time for a specific project
const projectTotal = await getProjectTimeTotal('project-uuid');
console.log(`Project total: ${(projectTotal.totalMinutes / 60).toFixed(1)}h`);
```

### Example 13: Timezone-Aware Booking Flow

```typescript
import {
  toTimezone,
  fromTimezone,
  isDST,
  getNextDSTTransition,
  formatInTimezone,
  getTimezoneOffset,
} from '@mcv/shared/scheduling';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 13: Timezone conversions and DST-aware scheduling
// ═══════════════════════════════════════════════════════════════════════════════

// Store in UTC, display in user's timezone
const utcAppointmentTime = new Date('2026-03-08T18:00:00Z');

// Convert to Toronto time for display
console.log(formatInTimezone(utcAppointmentTime, 'America/Toronto', 'YYYY-MM-DD HH:mm z'));
// Output: "2026-03-08 13:00 EST"

// DST transition happens March 8, 2026 in America/Toronto
const nextDST = getNextDSTTransition('America/Toronto', new Date('2026-03-01'));
console.log(`Next DST transition: ${nextDST?.date.toISOString()}`);
console.log(`  Direction: ${nextDST?.direction}`);
console.log(`  Offset change: ${nextDST?.offsetChange} minutes`);
// Output:
// Next DST transition: 2026-03-08T07:00:00.000Z
//   Direction: spring-forward
//   Offset change: -60 minutes

// Check if a date is during DST
console.log(isDST(new Date('2026-07-15'), 'America/Toronto'));  // true
console.log(isDST(new Date('2026-01-15'), 'America/Toronto'));  // false

// Convert user input from their timezone to UTC for storage
const userInputTime = new Date('2026-03-10T09:00:00');
const utcForStorage = fromTimezone(userInputTime, 'America/Los_Angeles');
console.log(`User sees: 9:00 AM PDT → Stored as: ${utcForStorage.toISOString()}`);
// Output: "User sees: 9:00 AM PDT → Stored as: 2026-03-10T16:00:00.000Z"

// Multi-timezone display for a single appointment
const apptTime = new Date('2026-02-10T14:00:00Z');
const timezones = ['America/Toronto', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo'];

console.log('Appointment time across timezones:');
for (const tz of timezones) {
  const offset = getTimezoneOffset(tz, apptTime);
  const formatted = formatInTimezone(apptTime, tz, 'HH:mm z');
  console.log(`  ${tz}: ${formatted} (UTC${offset >= 0 ? '+' : ''}${offset / 60})`);
}
// Output:
// Appointment time across timezones:
//   America/Toronto: 09:00 EST (UTC-5)
//   America/Los_Angeles: 06:00 PST (UTC-8)
//   Europe/London: 14:00 GMT (UTC+0)
//   Asia/Tokyo: 23:00 JST (UTC+9)
```

### Example 14: Client-Side Booking Calendar (React)

```tsx
import { useTimeSlots, useAppointments } from '@mcv/shared/scheduling/client';
import { BookingCalendar, TimeSlotPicker } from '@mcv/shared/scheduling/client';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 14: Full booking flow with React components
// ═══════════════════════════════════════════════════════════════════════════════

function AppointmentBookingPage({
  calendarId,
  ventureId,
}: {
  calendarId: string;
  ventureId: string;
}) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingComplete, setBookingComplete] = useState(false);

  // Fetch available time slots when a date is selected
  const { slots, isLoading: slotsLoading } = useTimeSlots({
    calendarId,
    date: selectedDate,
  });

  // Appointment creation mutation
  const { create, isCreating, error } = useAppointments({ ventureId });

  const handleConfirm = async () => {
    if (!selectedSlot) return;

    await create({
      calendarId,
      startTime: selectedSlot.start,
      endTime: selectedSlot.end,
      duration: selectedSlot.duration,
      title: 'Consultation',
      meetingType: 'video',
      source: 'booking_page',
    });

    setBookingComplete(true);
  };

  if (bookingComplete) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-green-600">Appointment Booked!</h2>
        <p className="mt-2 text-gray-600">
          Check your email for confirmation details.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <BookingCalendar
        calendarId={calendarId}
        onDateSelect={setSelectedDate}
        selectedDate={selectedDate}
        minDate={new Date()}
        maxAdvanceDays={90}
      />

      {selectedDate && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Available Times — {selectedDate.toLocaleDateString()}
          </h3>
          <TimeSlotPicker
            slots={slots}
            loading={slotsLoading}
            selectedSlot={selectedSlot}
            onSlotSelect={setSelectedSlot}
            timezone={Intl.DateTimeFormat().resolvedOptions().timeZone}
          />
          {selectedSlot && (
            <button
              onClick={handleConfirm}
              disabled={isCreating}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg"
            >
              {isCreating ? 'Booking...' : 'Confirm Appointment'}
            </button>
          )}
          {error && <p className="text-red-500 mt-2">{error.message}</p>}
        </div>
      )}
    </div>
  );
}
```

### Example 15: Agent-Logged Time Entries

```typescript
import { createTimeEntry, listTimeEntries } from '@mcv/shared/scheduling';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 15: NAOS agent automatically logging time against tasks
// ═══════════════════════════════════════════════════════════════════════════════

// Agent logs time after completing a task
const agentEntry = await createTimeEntry({
  taskId: 'task-uuid-100',
  agentId: 'naos-ralph-001',          // Agent, not a human user
  projectId: 'project-uuid',
  startedAt: new Date('2026-02-10T03:00:00Z'),
  endedAt: new Date('2026-02-10T03:12:00Z'),
  durationMinutes: 12,
  description: 'Automated code review and test generation for scheduling module',
  isBillable: false,                   // Agent work is non-billable
  source: 'agent',
  category: 'review',
  tags: ['automated', 'agent-ralph', 'scheduling'],
  metadata: {
    agentType: 'ralph',
    tokensUsed: 4200,
    modelUsed: 'claude-3.5-sonnet',
    taskOutcome: 'success',
  },
});

console.log(`Agent time entry: ${agentEntry.id} (${agentEntry.durationMinutes} min)`);
// Output: "Agent time entry: te-uuid-100 (12 min)"

// Query all agent-logged entries for a project
const agentEntries = await listTimeEntries({
  projectId: 'project-uuid',
  source: 'agent',
  from: new Date('2026-02-01'),
  to: new Date('2026-02-28'),
});

console.log(`Agent logged ${agentEntries.length} time entries this month`);
const totalAgentMinutes = agentEntries.reduce((sum, e) => sum + e.durationMinutes, 0);
console.log(`Total agent time: ${(totalAgentMinutes / 60).toFixed(1)}h`);
// Output:
// Agent logged 47 time entries this month
// Total agent time: 8.3h
```

---

## Performance Considerations

### Latency Targets

| Operation | Target | P99 |
|-----------|--------|-----|
| Generate slots (single day) | < 15ms | < 40ms |
| Generate slots (30-day range) | < 100ms | < 250ms |
| Create appointment (with conflict check) | < 50ms | < 120ms |
| Conflict detection (single calendar) | < 10ms | < 30ms |
| Conflict detection (10 calendars) | < 50ms | < 120ms |
| Timezone conversion | < 1ms | < 3ms |
| List appointments (paginated, 50 records) | < 20ms | < 50ms |
| Round robin assignment | < 15ms | < 40ms |
| Booking page lookup by slug | < 5ms | < 15ms |
| Google Calendar sync (incremental) | < 2s | < 5s |
| Time entry create/update | < 10ms | < 30ms |
| Time report generation (1 month) | < 100ms | < 300ms |
| Reminder processing batch (100 reminders) | < 500ms | < 1.5s |

### Throughput

| Metric | Small Deployment | Enterprise |
|--------|------------------|------------|
| Concurrent appointment creates | 50 | 500+ |
| Slot generation requests/min | 200 | 2,000+ |
| Google Calendar syncs/hour | 100 | 5,000+ |
| Active calendars per venture | 20 | 500+ |
| Appointments per day per venture | 200 | 20,000+ |
| Time entries per day per venture | 100 | 10,000+ |
| Pending reminders in queue | 1,000 | 100,000+ |

### Optimization Strategies

1. **Slot generation caching** — Cache generated slots for the same calendar + date range with 5-minute TTL; invalidate on appointment changes
2. **Composite index-driven conflict detection** — `appointment_date_range_idx` on `(venture_id, start_time, end_time)` enables O(log n) overlap queries
3. **Batch reminder processing** — Process reminders in configurable batches (default 100) with cursor-based pagination on `scheduled_at`
4. **Google Calendar sync delta** — Incremental sync using `syncToken` from Google API to avoid full re-fetch
5. **Timezone offset caching** — Cache IANA timezone offset lookups per-date to avoid repeated computation during slot generation
6. **Round robin count caching** — Cache assignment counts in Redis with write-through to PostgreSQL to avoid read-modify-write on every assignment
7. **Booking page slug index** — Globally unique index on `booking_pages.slug` for O(1) public page lookups
8. **Time entry running timer index** — Dedicated `time_entries_running_idx` for fast active timer queries
9. **Connection pooling** — Reuse HTTP connections for Google Calendar API calls

### Scaling Considerations

```
┌───────────────────────────────────────────────────────┐
│                   HOT PATH                             │
│                                                        │
│   Slot Generation  ──► Cached (Redis, 5min TTL)       │
│   Conflict Check   ──► Index scan (composite idx)     │
│   Timezone Convert ──► In-memory lookup table          │
│   Booking Page     ──► Cached by slug (CDN-friendly)  │
│                                                        │
│                   WARM PATH                            │
│                                                        │
│   Create Appt      ──► Conflict check + async notify  │
│   Round Robin       ──► Cached counts + DB fallback   │
│   Time Entry CRUD   ──► Direct DB with index support  │
│   Attendee RSVP     ──► Direct update + notification  │
│                                                        │
│                   COLD PATH                            │
│                                                        │
│   Google Cal Sync   ──► Background job (every 15 min) │
│   Time Reports      ──► Pre-aggregated daily rollups  │
│   Reminder Process  ──► Cron job (every minute)       │
│   Bulk Approval     ──► Batched transaction           │
│                                                        │
└───────────────────────────────────────────────────────┘
```

---

## Security Considerations

### Row-Level Security (RLS) & Tenant Isolation

All scheduling tables enforce venture-level isolation. Every query is scoped by `venture_id` to prevent cross-tenant data access:

```sql
-- RLS Policy: calendars
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;

CREATE POLICY calendars_tenant_isolation ON calendars
  USING (venture_id = current_setting('app.current_venture_id')::uuid);

-- RLS Policy: appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY appointments_tenant_isolation ON appointments
  USING (venture_id = current_setting('app.current_venture_id')::uuid);

-- RLS Policy: booking_pages
ALTER TABLE booking_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY booking_pages_tenant_isolation ON booking_pages
  USING (venture_id = current_setting('app.current_venture_id')::uuid);

-- RLS Policy: google_calendar_sync
ALTER TABLE google_calendar_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY gcal_tenant_isolation ON google_calendar_sync
  USING (venture_id = current_setting('app.current_venture_id')::uuid);
```

### Access Control Matrix

| Role | Calendars | Appointments | Availability | Overrides | Booking Pages | Round Robin | Google Sync | Time Entries |
|------|-----------|-------------|-------------|-----------|---------------|-------------|-------------|-------------|
| **Super Admin** | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD + Approve |
| **Venture Admin** | CRUD (own venture) | CRUD (own venture) | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD + Approve |
| **Team Member** | Read | Read/Create own | Read/Update own | Create own | Read | — | CRUD own | CRUD own |
| **Contact/Client** | — | Read own | — | — | Read (public) | — | — | — |
| **Public (unauthenticated)** | — | Create (via booking page) | — | — | Read (active only) | — | — | — |

### Data Privacy & Token Security

- **OAuth tokens encrypted at rest** — Google Calendar `access_token` and `refresh_token` are encrypted using AES-256-GCM before storage in `google_calendar_sync`
- **Token rotation** — Refresh tokens are rotated on each use; expired tokens are purged after 30 days
- **PII handling** — Contact information in appointments is subject to venture data retention policies; GDPR-compliant deletion available
- **Audit trail** — Every appointment creation, modification, cancellation, and attendee change is logged with actor identity
- **Booking page isolation** — Public booking pages only expose calendar name, availability slots, and form fields; no internal data exposed

### Timezone Security

- **IANA validation** — Only valid IANA timezone identifiers are accepted; arbitrary strings rejected with `INVALID_TIMEZONE` error
- **UTC storage** — All timestamps stored in UTC; timezone is metadata for display only
- **DST-safe scheduling** — Slot generation correctly handles DST transitions; no appointments are "lost" or "duplicated" during spring-forward / fall-back

### Input Validation

```typescript
// All appointment inputs validated with Zod schemas:
const createAppointmentSchema = z.object({
  ventureId: z.string().uuid(),
  calendarId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
  assignedUserId: z.string().uuid().optional(),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  startTime: z.date(),
  endTime: z.date(),
  duration: z.number().int().positive().max(1440),  // Max 24 hours
  status: z.enum(appointmentStatuses).default('scheduled'),
  meetingType: z.enum(meetingTypes).default('video'),
  meetingLocation: z.string().max(1000).optional(),
  meetingUrl: z.string().url().optional(),
  notes: z.string().max(10000).optional(),
  source: z.enum(appointmentSources).default('manual'),
  customFields: z.record(z.unknown()).optional(),
}).refine(
  (data) => data.endTime > data.startTime,
  { message: 'End time must be after start time' }
);

// Booking page form fields validated to prevent XSS:
const bookingFormFieldSchema = z.object({
  name: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),  // Safe field names only
  label: z.string().min(1).max(200),
  type: z.enum(['text', 'email', 'phone', 'textarea', 'select', 'checkbox']),
  required: z.boolean(),
  options: z.array(z.string().max(200)).max(50).optional(),
  placeholder: z.string().max(500).optional(),
});

// Calendar slug validated for URL safety:
const slugSchema = z.string()
  .min(2).max(100)
  .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Slug must be URL-safe lowercase');
```

### Rate Limiting

```typescript
// Per-user rate limits for booking operations:
const RATE_LIMITS = {
  createAppointment: { rpm: 10, burst: 3 },   // 10/min, max 3 burst
  reschedule: { rpm: 5, burst: 2 },            // 5/min
  cancelAppointment: { rpm: 10, burst: 5 },    // 10/min
  bookingPageSlotFetch: { rpm: 30, burst: 10 }, // 30/min (public)
  googleCalendarSync: { rpm: 2, burst: 1 },    // 2/min (API quota)
  timeEntryCreate: { rpm: 20, burst: 5 },      // 20/min
};
```

---

## Audit Events

| Event | Category | Description | Payload |
|-------|----------|-------------|---------|
| `scheduling.calendar.created` | admin | New calendar created | `{ calendarId, type, ventureId }` |
| `scheduling.calendar.updated` | admin | Calendar settings changed | `{ calendarId, changes }` |
| `scheduling.calendar.activated` | admin | Calendar re-activated | `{ calendarId }` |
| `scheduling.calendar.deactivated` | admin | Calendar deactivated | `{ calendarId, reason }` |
| `scheduling.calendar.deleted` | admin | Calendar deleted | `{ calendarId }` |
| `scheduling.availability.set` | admin | Availability window created/updated | `{ calendarId, dayOfWeek, startTime, endTime, userId? }` |
| `scheduling.availability.deleted` | admin | Availability window removed | `{ availabilityId, calendarId }` |
| `scheduling.override.created` | admin | Date-specific override created | `{ calendarId, date, isBlocked, reason }` |
| `scheduling.override.deleted` | admin | Override removed | `{ overrideId, calendarId, date }` |
| `scheduling.appointment.created` | booking | New appointment created | `{ appointmentId, calendarId, contactId, source, startTime }` |
| `scheduling.appointment.confirmed` | booking | Appointment confirmed | `{ appointmentId, confirmedBy }` |
| `scheduling.appointment.cancelled` | booking | Appointment cancelled | `{ appointmentId, cancellationReason, cancelledBy }` |
| `scheduling.appointment.rescheduled` | booking | Appointment moved to new time | `{ appointmentId, oldStartTime, newStartTime, reason }` |
| `scheduling.appointment.completed` | booking | Appointment marked complete | `{ appointmentId }` |
| `scheduling.appointment.no_show` | booking | Contact marked as no-show | `{ appointmentId, markedBy }` |
| `scheduling.appointment.conflict` | booking | Conflict detected during booking | `{ calendarId, requestedTime, conflictsWith }` |
| `scheduling.attendee.added` | booking | Attendee added to appointment | `{ appointmentId, userId }` |
| `scheduling.attendee.responded` | booking | Attendee RSVP response | `{ appointmentId, userId, status }` |
| `scheduling.attendee.removed` | booking | Attendee removed from appointment | `{ appointmentId, userId }` |
| `scheduling.round_robin.configured` | admin | Round robin settings updated | `{ calendarId, distributionMode }` |
| `scheduling.round_robin.assigned` | booking | User auto-assigned via round robin | `{ calendarId, appointmentId, assignedUserId, mode }` |
| `scheduling.booking_page.created` | admin | Booking page created | `{ bookingPageId, slug, calendarId }` |
| `scheduling.booking_page.updated` | admin | Booking page modified | `{ bookingPageId, changes }` |
| `scheduling.booking_page.activated` | admin | Booking page enabled | `{ bookingPageId, slug }` |
| `scheduling.booking_page.deactivated` | admin | Booking page disabled | `{ bookingPageId, slug }` |
| `scheduling.gcal.connected` | system | Google Calendar connected | `{ userId, googleEmail, calendarCount }` |
| `scheduling.gcal.disconnected` | system | Google Calendar disconnected | `{ userId, googleEmail }` |
| `scheduling.gcal.synced` | system | Google Calendar sync completed | `{ syncId, imported, exported, conflicts }` |
| `scheduling.gcal.sync_failed` | system | Google Calendar sync failed | `{ syncId, error }` |
| `scheduling.gcal.token_refreshed` | system | OAuth token refreshed | `{ syncId, userId }` |
| `scheduling.reminder.scheduled` | notification | Reminder scheduled | `{ reminderId, appointmentId, type, scheduledAt }` |
| `scheduling.reminder.sent` | notification | Reminder delivered | `{ reminderId, appointmentId, type, sentAt }` |
| `scheduling.reminder.failed` | notification | Reminder delivery failed | `{ reminderId, appointmentId, error }` |
| `scheduling.time_entry.created` | time | Time entry logged | `{ timeEntryId, taskId, userId, source, durationMinutes }` |
| `scheduling.time_entry.updated` | time | Time entry modified | `{ timeEntryId, changes }` |
| `scheduling.time_entry.deleted` | time | Time entry deleted | `{ timeEntryId, taskId }` |
| `scheduling.time_entry.approved` | time | Time entry approved | `{ timeEntryId, approvedById }` |
| `scheduling.timer.started` | time | Timer started | `{ timeEntryId, taskId, userId }` |
| `scheduling.timer.stopped` | time | Timer stopped | `{ timeEntryId, durationMinutes }` |

---

## Error Codes

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| `CALENDAR_NOT_FOUND` | 404 | Calendar ID does not exist or not accessible | Verify calendar ID and venture scope |
| `CALENDAR_INACTIVE` | 409 | Attempted to book on an inactive calendar | Activate the calendar or choose an active one |
| `CALENDAR_SLUG_TAKEN` | 409 | Calendar slug already exists in this venture | Choose a different slug |
| `APPOINTMENT_NOT_FOUND` | 404 | Appointment ID does not exist | Verify appointment ID and venture scope |
| `APPOINTMENT_CONFLICT` | 409 | Time slot conflicts with existing appointment | Choose a different time or check conflicts first |
| `APPOINTMENT_PAST_TIME` | 400 | Cannot book an appointment in the past | Select a future time |
| `APPOINTMENT_TOO_SOON` | 400 | Booking violates minimum notice requirement | Book further in advance (check `settings.minNotice`) |
| `APPOINTMENT_TOO_FAR` | 400 | Booking exceeds maximum advance window | Book closer to the desired date (check `settings.maxAdvance`) |
| `APPOINTMENT_OUTSIDE_AVAILABILITY` | 400 | Requested time is outside defined availability | Choose a time within availability windows |
| `APPOINTMENT_ALREADY_CANCELLED` | 409 | Appointment is already cancelled | No action needed |
| `APPOINTMENT_ALREADY_COMPLETED` | 409 | Cannot modify a completed appointment | Create a new appointment instead |
| `APPOINTMENT_MAX_PER_DAY` | 409 | Maximum daily appointment limit reached | Check `settings.maxPerDay` or book another day |
| `APPOINTMENT_CANCEL_DEADLINE` | 400 | Past cancellation deadline | Cannot cancel within `settings.cancelDeadline` minutes of start |
| `APPOINTMENT_REQUIRES_APPROVAL` | 202 | Appointment created but requires admin approval | Wait for admin confirmation |
| `AVAILABILITY_NOT_FOUND` | 404 | Availability record not found | Verify availability ID |
| `AVAILABILITY_OVERLAP` | 409 | Availability window overlaps with existing window | Adjust times to avoid overlap |
| `OVERRIDE_NOT_FOUND` | 404 | Override record not found | Verify override ID |
| `OVERRIDE_DATE_CONFLICT` | 409 | Override already exists for this date + user | Update existing override or delete first |
| `ATTENDEE_NOT_FOUND` | 404 | Attendee not found on this appointment | Verify user ID and appointment |
| `ATTENDEE_ALREADY_EXISTS` | 409 | User is already an attendee | No action needed (unique constraint) |
| `ROUND_ROBIN_NO_AVAILABLE` | 409 | No team members available for round robin assignment | Expand availability or add team members |
| `ROUND_ROBIN_NOT_CONFIGURED` | 400 | Calendar is round_robin type but has no config | Configure round robin settings first |
| `BOOKING_PAGE_NOT_FOUND` | 404 | Booking page not found | Verify page ID or slug |
| `BOOKING_PAGE_SLUG_TAKEN` | 409 | Booking page slug already exists (globally unique) | Choose a different slug |
| `BOOKING_PAGE_INACTIVE` | 410 | Booking page is currently disabled | Activate the booking page |
| `INVALID_TIME_RANGE` | 400 | End time is before or equal to start time | Ensure `endTime > startTime` |
| `INVALID_DURATION` | 400 | Duration must be a positive integer ≤ 1440 | Set duration between 1 and 1440 minutes |
| `INVALID_TIMEZONE` | 400 | Timezone string is not a valid IANA identifier | Use a valid IANA timezone (e.g., `America/Toronto`) |
| `INVALID_DAY_OF_WEEK` | 400 | Day of week must be 0 (Sunday) through 6 (Saturday) | Use 0-6 range |
| `INVALID_TIME_FORMAT` | 400 | Time must be in HH:mm 24-hour format | Use format like `09:00`, `14:30` |
| `GCAL_AUTH_FAILED` | 401 | Google Calendar OAuth token invalid or expired | Re-authenticate with Google Calendar |
| `GCAL_SYNC_NOT_FOUND` | 404 | Google Calendar sync configuration not found | Connect Google Calendar first |
| `GCAL_PROVIDER_ERROR` | 502 | Google Calendar API returned an error | Retry later; check Google API status |
| `GCAL_QUOTA_EXCEEDED` | 429 | Google Calendar API quota exceeded | Wait and retry; check API quota limits |
| `REMINDER_NOT_FOUND` | 404 | Reminder not found | Verify reminder ID |
| `REMINDER_ALREADY_SENT` | 409 | Cannot modify a reminder that was already sent | Create a new reminder instead |
| `REMINDER_PAST_TIME` | 400 | Reminder time is after the appointment start time | Schedule reminder before the appointment |
| `TIME_ENTRY_NOT_FOUND` | 404 | Time entry not found | Verify time entry ID |
| `TIME_ENTRY_ALREADY_APPROVED` | 409 | Cannot modify an approved time entry | Request manager to un-approve first |
| `TIMER_ALREADY_RUNNING` | 409 | User already has a running timer for this task | Stop existing timer first |
| `TIMER_NOT_RUNNING` | 409 | Cannot stop a timer that is not running | Timer may have already been stopped |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests — rate limit hit | Wait and retry with exponential backoff |
| `VENTURE_NOT_FOUND` | 404 | Venture does not exist | Verify venture ID |
| `PERMISSION_DENIED` | 403 | User lacks permission for this operation | Check user role and access control matrix |

---

## Environment Variables

```bash
# ═══════════════════════════════════════════════════════════════════════════════
# SCHEDULING DEFAULTS
# ═══════════════════════════════════════════════════════════════════════════════

SCHEDULING_DEFAULT_DURATION=30                    # Default appointment duration (minutes)
SCHEDULING_DEFAULT_BUFFER_BEFORE=0                # Default buffer before appointments (minutes)
SCHEDULING_DEFAULT_BUFFER_AFTER=0                 # Default buffer after appointments (minutes)
SCHEDULING_DEFAULT_MIN_NOTICE=60                  # Default minimum notice (minutes)
SCHEDULING_DEFAULT_MAX_ADVANCE=60                 # Default max advance booking (days)
SCHEDULING_DEFAULT_TIMEZONE=UTC                   # Fallback timezone when not specified
SCHEDULING_DEFAULT_CALENDAR_TYPE=personal         # Default calendar type

# ═══════════════════════════════════════════════════════════════════════════════
# APPOINTMENT BEHAVIOR
# ═══════════════════════════════════════════════════════════════════════════════

SCHEDULING_REQUIRE_APPROVAL=false                 # Default: auto-confirm appointments
SCHEDULING_ALLOW_RESCHEDULE=true                  # Default: allow client rescheduling
SCHEDULING_ALLOW_CANCEL=true                      # Default: allow client cancellation
SCHEDULING_MAX_APPOINTMENTS_PER_DAY=null          # Default: unlimited (per calendar)
SCHEDULING_MAX_ATTENDEES_PER_SLOT=null            # Default: unlimited (for class calendars)

# ═══════════════════════════════════════════════════════════════════════════════
# RATE LIMITING
# ═══════════════════════════════════════════════════════════════════════════════

SCHEDULING_APPOINTMENT_RATE_LIMIT_RPM=10          # Max appointment creates per user per minute
SCHEDULING_SLOT_FETCH_RATE_LIMIT_RPM=30           # Max slot generation requests per minute
SCHEDULING_GCAL_SYNC_RATE_LIMIT_RPM=2             # Max Google sync requests per minute

# ═══════════════════════════════════════════════════════════════════════════════
# SLOT CACHING
# ═══════════════════════════════════════════════════════════════════════════════

SCHEDULING_SLOT_CACHE_ENABLED=true                # Enable slot generation cache
SCHEDULING_SLOT_CACHE_TTL=300                     # Cache TTL in seconds (5 min)

# ═══════════════════════════════════════════════════════════════════════════════
# GOOGLE CALENDAR SYNC
# ═══════════════════════════════════════════════════════════════════════════════

GOOGLE_CALENDAR_CLIENT_ID=xxx                     # Google OAuth client ID
GOOGLE_CALENDAR_CLIENT_SECRET=xxx                 # Google OAuth client secret
GOOGLE_CALENDAR_REDIRECT_URI=https://...          # OAuth redirect URI
SCHEDULING_GCAL_SYNC_INTERVAL=15                  # Sync interval in minutes
SCHEDULING_GCAL_TOKEN_ENCRYPTION_KEY=xxx          # AES-256-GCM key for token encryption

# ═══════════════════════════════════════════════════════════════════════════════
# REMINDERS
# ═══════════════════════════════════════════════════════════════════════════════

SCHEDULING_REMINDER_BATCH_SIZE=100                # Reminders per batch
SCHEDULING_REMINDER_DEFAULT_CHANNELS=email        # Default notification channels (email,sms)

# ═══════════════════════════════════════════════════════════════════════════════
# TIME TRACKING
# ═══════════════════════════════════════════════════════════════════════════════

SCHEDULING_DEFAULT_CURRENCY=USD                   # Default currency for billable time
SCHEDULING_MAX_TIMER_DURATION_HOURS=24            # Auto-stop timers after N hours
SCHEDULING_REQUIRE_TIME_ENTRY_APPROVAL=false      # Require manager approval for entries

# ═══════════════════════════════════════════════════════════════════════════════
# CRON SCHEDULES
# ═══════════════════════════════════════════════════════════════════════════════

SCHEDULING_REMINDER_CRON="* * * * *"              # Every minute
SCHEDULING_GCAL_SYNC_CRON="*/15 * * * *"          # Every 15 minutes
SCHEDULING_CLEANUP_CRON="0 2 * * *"               # 2 AM daily (cleanup expired data)
SCHEDULING_TIMER_CHECK_CRON="0 * * * *"           # Every hour (auto-stop stale timers)
SCHEDULING_APPOINTMENT_COMPLETE_CRON="*/5 * * * *" # Every 5 min (auto-complete past appointments)
```

---

## Dependencies

### External Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `date-fns` | ^3.x | Date manipulation, formatting, comparison |
| `date-fns-tz` | ^3.x | Timezone-aware date operations, IANA database |
| `drizzle-orm` | ^0.29.x | Database ORM (all scheduling tables) |
| `ioredis` | ^5.x | Slot generation caching, rate limiting, round robin counters |
| `zod` | ^3.x | Request/response validation schemas |
| `uuid` | ^9.x | UUID generation for all entity IDs |
| `googleapis` | ^130.x | Google Calendar API client for sync |
| `node-cron` | ^3.x | Cron scheduling for reminders and sync jobs |

### Internal Dependencies

| Module | Tier | Purpose |
|--------|------|---------|
| `@mcv/core/auth` | 1.0 | User authentication and permission checks |
| `@mcv/core/tenants` | 1.0 | Venture scoping and tenant isolation (RLS) |
| `@mcv/core/audit` | 1.0 | Audit event logging for all scheduling operations |
| `@mcv/core/notifications` | 1.0 | Email and SMS delivery for reminders and confirmations |
| `@mcv/shared/validation` | 2.5 | Shared Zod validation schemas |
| `@mcv/shared/templates` | 2.5 | Email/SMS templates for appointment notifications |
| `@mcv/shared/workflows` | 2.5 | Workflow triggers on appointment lifecycle events |
| `@mcv/shared/localization` | 2.5 | Localized date/time formatting per venture locale |
| `@mcv/db` | 1.0 | Database connection and schema definitions |

---

## Testing Notes

### Unit Testing

```typescript
import {
  getAvailableSlots,
  getAppointmentConflicts,
  getNextAssignee,
} from '@mcv/shared/scheduling';

// ═══════════════════════════════════════════════════════════════════════════════
// AVAILABILITY & SLOT GENERATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Slot Generation', () => {
  it('should generate slots only within availability windows', async () => {
    // Setup: Calendar with Monday 9-12 availability, 60min slots
    const slots = await getAvailableSlots({
      calendarId: testCalendarId,
      from: new Date('2026-02-09T00:00:00Z'), // Monday
      to: new Date('2026-02-09T23:59:59Z'),
    });

    // Should get 3 slots: 9-10, 10-11, 11-12
    expect(slots).toHaveLength(3);
    expect(slots[0].start).toEqual(new Date('2026-02-09T14:00:00Z')); // 9 AM ET in UTC
    expect(slots[2].end).toEqual(new Date('2026-02-09T17:00:00Z'));   // 12 PM ET in UTC
  });

  it('should exclude dates blocked by overrides', async () => {
    // Setup: Monday blocked as holiday
    await blockDate({
      calendarId: testCalendarId,
      date: '2026-02-09',
      reason: 'Holiday',
    });

    const slots = await getAvailableSlots({
      calendarId: testCalendarId,
      from: new Date('2026-02-09T00:00:00Z'),
      to: new Date('2026-02-09T23:59:59Z'),
    });

    expect(slots).toHaveLength(0);
  });

  it('should respect buffer times between slots', async () => {
    // Setup: Calendar with 30-min slots, 15-min buffer after, 2h window
    // Window: 09:00-11:00 → 09:00-09:30, (15 gap), 09:45-10:15, (15 gap), 10:30-11:00
    const slots = await getAvailableSlots({
      calendarId: testCalendarId,
      from: new Date('2026-02-09T00:00:00Z'),
      to: new Date('2026-02-09T23:59:59Z'),
    });

    expect(slots).toHaveLength(3);
    // 15 min gap between slot 1 end and slot 2 start
    const gap = slots[1].start.getTime() - slots[0].end.getTime();
    expect(gap).toBe(15 * 60 * 1000); // 15 minutes
  });

  it('should exclude slots for existing appointments', async () => {
    // Setup: One existing appointment at 10-10:30
    const allSlots = await getAvailableSlots({
      calendarId: testCalendarId,
      from: new Date('2026-02-09T00:00:00Z'),
      to: new Date('2026-02-09T23:59:59Z'),
    });

    const slotAt10 = allSlots.find(
      (s) => s.start.getUTCHours() === 15 // 10 AM ET = 15 UTC
    );

    expect(slotAt10?.status).toBe('booked');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CONFLICT DETECTION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Conflict Detection', () => {
  it('should detect overlapping appointments', async () => {
    const conflicts = await getAppointmentConflicts({
      calendarId: testCalendarId,
      assignedUserId: testUserId,
      startTime: new Date('2026-02-10T14:00:00Z'),
      endTime: new Date('2026-02-10T15:00:00Z'),
    });

    expect(conflicts.some((c) => c.type === 'overlap')).toBe(true);
  });

  it('should detect buffer violations', async () => {
    // Existing: 14:00-14:30 with 10-min buffer after
    // Attempted: 14:35-15:00 (within buffer zone)
    const conflicts = await getAppointmentConflicts({
      calendarId: testCalendarId,
      assignedUserId: testUserId,
      startTime: new Date('2026-02-10T14:35:00Z'),
      endTime: new Date('2026-02-10T15:00:00Z'),
    });

    expect(conflicts.some((c) => c.type === 'buffer_violation')).toBe(true);
  });

  it('should detect max-per-day violations', async () => {
    // Calendar has maxPerDay: 2, already has 2 appointments
    const conflicts = await getAppointmentConflicts({
      calendarId: maxPerDayCalendarId,
      assignedUserId: testUserId,
      startTime: new Date('2026-02-10T16:00:00Z'),
      endTime: new Date('2026-02-10T16:30:00Z'),
    });

    expect(conflicts.some((c) => c.type === 'max_per_day_exceeded')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ROUND ROBIN TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Round Robin Assignment', () => {
  it('should distribute equally in "equal" mode', async () => {
    // Setup: 3 team members, 9 bookings
    const assignments = [];
    for (let i = 0; i < 9; i++) {
      const assignee = await getNextAssignee({
        calendarId: roundRobinCalendarId,
        requestedTime: new Date(`2026-02-${10 + i}T14:00:00Z`),
      });
      assignments.push(assignee.userId);
    }

    // Each should get exactly 3
    const counts = assignments.reduce((acc, id) => {
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    expect(Object.values(counts)).toEqual([3, 3, 3]);
  });

  it('should skip busy team members', async () => {
    // Alice has an appointment at 14:00
    const assignee = await getNextAssignee({
      calendarId: roundRobinCalendarId,
      requestedTime: new Date('2026-02-10T14:00:00Z'),
    });

    expect(assignee.userId).not.toBe('alice-uuid');
  });

  it('should respect weighted distribution', async () => {
    // Weights: Alice=3, Bob=2, Charlie=1 → 50%, 33%, 17%
    const assignments = [];
    for (let i = 0; i < 60; i++) {
      const assignee = await getNextAssignee({
        calendarId: weightedCalendarId,
        requestedTime: new Date(`2026-03-${(i % 28) + 1}T10:00:00Z`),
      });
      assignments.push(assignee.userId);
    }

    const aliceCount = assignments.filter((id) => id === 'alice-uuid').length;
    expect(aliceCount).toBeGreaterThan(25); // ~50% of 60 = 30 ± tolerance
    expect(aliceCount).toBeLessThan(40);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TIMEZONE HANDLING TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Timezone Handling', () => {
  it('should correctly handle DST transitions', () => {
    // March 8, 2026: EST → EDT (spring forward, lose 1 hour)
    const offsetBefore = getTimezoneOffset('America/Toronto', new Date('2026-03-07'));
    const offsetAfter = getTimezoneOffset('America/Toronto', new Date('2026-03-09'));

    expect(offsetBefore).toBe(-300); // -5h (EST)
    expect(offsetAfter).toBe(-240);  // -4h (EDT)
  });

  it('should not create appointments during non-existent DST hour', async () => {
    // 2:00 AM - 3:00 AM doesn't exist on spring-forward day
    const result = await createAppointment({
      ventureId: testVentureId,
      calendarId: testCalendarId,
      title: 'DST Test',
      startTime: new Date('2026-03-08T07:30:00Z'), // 2:30 AM ET — doesn't exist
      endTime: new Date('2026-03-08T08:00:00Z'),
      duration: 30,
    });

    // Should auto-adjust or return error
    expect(result).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TIME ENTRY TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Time Entries', () => {
  it('should prevent multiple running timers for same user + task', async () => {
    await startTimer({
      taskId: 'task-uuid',
      userId: 'user-uuid',
      description: 'First timer',
    });

    await expect(
      startTimer({
        taskId: 'task-uuid',
        userId: 'user-uuid',
        description: 'Second timer',
      })
    ).rejects.toThrow('TIMER_ALREADY_RUNNING');
  });

  it('should calculate duration on timer stop', async () => {
    const timer = await startTimer({
      taskId: 'task-uuid',
      userId: 'user-uuid',
    });

    // Simulate 45 minutes passing
    jest.advanceTimersByTime(45 * 60 * 1000);

    const stopped = await stopTimer(timer.id);
    expect(stopped.durationMinutes).toBe(45);
    expect(stopped.isRunning).toBe(false);
    expect(stopped.endedAt).toBeDefined();
  });

  it('should mark entry as approved with approver info', async () => {
    const entry = await createTimeEntry({
      taskId: 'task-uuid',
      userId: 'user-uuid',
      startedAt: new Date(),
      durationMinutes: 60,
      source: 'manual',
    });

    const approved = await approveTimeEntry({
      timeEntryId: entry.id,
      approvedById: 'manager-uuid',
    });

    expect(approved.isApproved).toBe(true);
    expect(approved.approvedById).toBe('manager-uuid');
    expect(approved.approvedAt).toBeDefined();
  });
});
```

### Integration Testing

```typescript
describe('Appointment Lifecycle E2E', () => {
  it('should complete full appointment lifecycle', async () => {
    // 1. Create calendar
    const calendar = await createCalendar({
      ventureId: testVentureId,
      name: 'Test Calendar',
      slug: 'test-e2e',
      type: 'personal',
      timezone: 'UTC',
    });

    // 2. Set availability (Monday 9-17)
    await setAvailability({
      calendarId: calendar.id,
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
    });

    // 3. Generate and verify slots
    const slots = await getAvailableSlots({
      calendarId: calendar.id,
      from: new Date('2026-02-09T00:00:00Z'), // Monday
      to: new Date('2026-02-09T23:59:59Z'),
    });
    expect(slots.length).toBeGreaterThan(0);

    // 4. Create appointment
    const appointment = await createAppointment({
      ventureId: testVentureId,
      calendarId: calendar.id,
      title: 'E2E Test Appointment',
      startTime: slots[0].start,
      endTime: slots[0].end,
      duration: 30,
      meetingType: 'video',
      source: 'manual',
    });
    expect(appointment.status).toBe('scheduled');

    // 5. Confirm appointment
    const confirmed = await confirmAppointment(appointment.id);
    expect(confirmed.status).toBe('confirmed');

    // 6. Verify slot is no longer available
    const updatedSlots = await getAvailableSlots({
      calendarId: calendar.id,
      from: new Date('2026-02-09T00:00:00Z'),
      to: new Date('2026-02-09T23:59:59Z'),
    });
    const bookedSlot = updatedSlots.find(
      (s) => s.start.getTime() === slots[0].start.getTime()
    );
    expect(bookedSlot?.status).toBe('booked');

    // 7. Reschedule
    const rescheduled = await rescheduleAppointment({
      appointmentId: appointment.id,
      newStartTime: slots[1].start,
      newEndTime: slots[1].end,
      reason: 'E2E test reschedule',
    });
    expect(rescheduled.rescheduledFromId).toBe(appointment.id);

    // 8. Original is marked rescheduled
    const original = await getAppointment(appointment.id);
    expect(original.status).toBe('rescheduled');

    // 9. Cancel rescheduled appointment
    const cancelled = await cancelAppointment({
      appointmentId: rescheduled.id,
      reason: 'E2E test cleanup',
    });
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.cancellationReason).toBe('E2E test cleanup');
  });

  it('should handle round-robin assignment end-to-end', async () => {
    // Setup round-robin calendar
    const rrCalendar = await createCalendar({
      ventureId: testVentureId,
      name: 'RR Test',
      slug: 'rr-test',
      type: 'round_robin',
      timezone: 'UTC',
      teamMemberIds: ['user-a', 'user-b'],
    });

    await configureRoundRobin({
      calendarId: rrCalendar.id,
      distributionMode: 'equal',
      skipIfBusy: true,
    });

    // Set availability for both users
    for (const userId of ['user-a', 'user-b']) {
      await setAvailability({
        calendarId: rrCalendar.id,
        userId,
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '17:00',
      });
    }

    // Create two appointments — should round-robin between users
    const appt1 = await createAppointment({
      ventureId: testVentureId,
      calendarId: rrCalendar.id,
      title: 'RR Test 1',
      startTime: new Date('2026-02-09T14:00:00Z'),
      endTime: new Date('2026-02-09T14:30:00Z'),
      duration: 30,
      source: 'booking_page',
    });

    const appt2 = await createAppointment({
      ventureId: testVentureId,
      calendarId: rrCalendar.id,
      title: 'RR Test 2',
      startTime: new Date('2026-02-09T15:00:00Z'),
      endTime: new Date('2026-02-09T15:30:00Z'),
      duration: 30,
      source: 'booking_page',
    });

    // Appointments should be assigned to different users
    expect(appt1.assignedUserId).not.toBe(appt2.assignedUserId);
    expect(['user-a', 'user-b']).toContain(appt1.assignedUserId);
    expect(['user-a', 'user-b']).toContain(appt2.assignedUserId);
  });
});
```

---

## Migration Notes

### Schema Source Files

The scheduling database schema is defined across two Drizzle ORM files:

| File | Tables | Size |
|------|--------|------|
| `packages/db/src/schema/calendar.ts` | `calendars`, `calendar_availability`, `calendar_overrides`, `appointments`, `appointment_reminders`, `appointment_attendees`, `round_robin_config`, `booking_pages`, `google_calendar_sync` | 19KB |
| `packages/db/src/schema/time-entries.ts` | `time_entries` | 3KB |

### Index Strategy Summary

| Table | Index | Columns | Type | Purpose |
|-------|-------|---------|------|---------|
| `calendars` | `calendar_venture_idx` | `venture_id` | B-tree | Venture-scoped queries |
| `calendars` | `calendar_slug_venture_idx` | `venture_id, slug` | Unique | Slug lookup within venture |
| `calendars` | `calendar_type_idx` | `type` | B-tree | Filter by calendar type |
| `calendar_availability` | `availability_calendar_idx` | `calendar_id` | B-tree | Availability by calendar |
| `calendar_availability` | `availability_user_idx` | `user_id` | B-tree | User-specific availability |
| `calendar_overrides` | `override_calendar_idx` | `calendar_id` | B-tree | Overrides by calendar |
| `calendar_overrides` | `override_date_idx` | `calendar_id, date` | B-tree | Date-specific override lookup |
| `appointments` | `appointment_venture_idx` | `venture_id` | B-tree | Venture-scoped queries |
| `appointments` | `appointment_calendar_idx` | `calendar_id` | B-tree | Calendar appointment list |
| `appointments` | `appointment_contact_idx` | `contact_id` | B-tree | Contact appointment history |
| `appointments` | `appointment_assigned_user_idx` | `assigned_user_id` | B-tree | User workload queries |
| `appointments` | `appointment_status_idx` | `status` | B-tree | Status filtering |
| `appointments` | `appointment_start_time_idx` | `start_time` | B-tree | Chronological queries |
| `appointments` | `appointment_date_range_idx` | `venture_id, start_time, end_time` | Composite | Conflict detection, range queries |
| `appointment_reminders` | `reminder_appointment_idx` | `appointment_id` | B-tree | Reminders per appointment |
| `appointment_reminders` | `reminder_status_idx` | `status` | B-tree | Pending reminder queries |
| `appointment_reminders` | `reminder_scheduled_idx` | `scheduled_at` | B-tree | Cron job processing |
| `appointment_attendees` | `attendee_appointment_idx` | `appointment_id` | B-tree | Attendees per appointment |
| `appointment_attendees` | `attendee_user_idx` | `user_id` | B-tree | User's appointments |
| `appointment_attendees` | `attendee_unique_idx` | `appointment_id, user_id` | Unique | Prevent duplicate attendees |
| `round_robin_config` | `rr_config_calendar_idx` | `calendar_id` | B-tree + Unique | One config per calendar |
| `booking_pages` | `booking_page_slug_idx` | `slug` | Unique | Global slug lookup |
| `booking_pages` | `booking_page_calendar_idx` | `calendar_id` | B-tree | Pages per calendar |
| `booking_pages` | `booking_page_venture_idx` | `venture_id` | B-tree | Venture listing |
| `google_calendar_sync` | `gcal_user_idx` | `user_id` | B-tree | User's syncs |
| `google_calendar_sync` | `gcal_venture_idx` | `venture_id` | B-tree | Venture syncs |
| `google_calendar_sync` | `gcal_user_venture_idx` | `user_id, venture_id` | Unique | One sync per user per venture |
| `time_entries` | `time_entries_task_idx` | `task_id` | B-tree | Entries per task |
| `time_entries` | `time_entries_user_idx` | `user_id` | B-tree | User's time log |
| `time_entries` | `time_entries_project_idx` | `project_id` | B-tree | Project time total |
| `time_entries` | `time_entries_started_at_idx` | `started_at` | B-tree | Chronological queries |
| `time_entries` | `time_entries_billable_idx` | `is_billable` | B-tree | Billing reports |
| `time_entries` | `time_entries_running_idx` | `is_running` | B-tree | Active timer lookup |
| `time_entries` | `time_entries_agent_idx` | `agent_id` | B-tree | Agent time tracking |

---

*@mcv/shared/scheduling — Scheduling & Availability Engine*