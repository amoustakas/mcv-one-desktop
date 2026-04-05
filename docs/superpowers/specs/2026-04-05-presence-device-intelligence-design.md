# MCV Presence & Device Intelligence System

**Date:** 2026-04-05
**Author:** Tony + NAOS
**Status:** Design Approved
**Scope:** Presence state, device-adaptive UI, AI status inference, agent-aware routing, notification orchestration

---

## Problem

MCV Desktop is a multi-device Super Admin platform (desktop workstation with 4 monitors + Android phone + iPhone + iPad + Android tablet). Currently there is:

- No awareness of which devices are connected
- No user status (active, in meeting, on call, away, sleeping)
- No timezone or location detection
- No device-adaptive UI (same layout on ultrawide and phone)
- No way for agents to adapt behavior based on user state
- No intelligent notification routing across devices

The CEO (Tony) runs MCV from a 49" ultrawide, 70" 4K, two 27" portrait monitors, and multiple mobile devices. The platform needs to know who's where, on what device, doing what, and adapt everything accordingly.

---

## Architecture

### Core: Supabase Realtime Presence Channel

Each device/session joins a Supabase Realtime presence channel (`mcv-presence`) and broadcasts its state. All devices receive all other devices' state in real-time. The existing Supabase Realtime infrastructure (already used for postgres_changes in `src/hooks/use-realtime.ts`) is extended with `.presence()` subscriptions.

```
Device boots MCV
  -> Generate/load deviceId from localStorage
  -> Detect: timezone, city, GPS, device type, screen, battery, network
  -> If desktop: poll local server health for CPU/memory
  -> Join Supabase Realtime presence channel: 'mcv-presence'
  -> Broadcast initial PresenceState

Every 60 seconds:
  -> Re-infer status from calendar/calls/activity
  -> Re-read device health
  -> Broadcast updated PresenceState

Other devices:
  -> Subscribed to 'mcv-presence' channel
  -> Receive presence_state updates in real-time
  -> Update local store -> UI re-renders

User closes tab/app:
  -> Supabase Realtime auto-removes from presence
  -> Other devices see device go offline
```

---

## Presence State Model

```typescript
interface PresenceState {
  // Identity
  userId: string;
  userName: string;
  avatarUrl: string;
  role: 'ceo' | 'cofounder' | 'engineer' | 'designer' | 'analyst' | 'viewer';
  accessTier: 'super-admin' | 'admin' | 'member' | 'guest';

  // Status (AI-inferred)
  status: 'active' | 'in-meeting' | 'on-call' | 'focus' | 'away' | 'sleeping' | 'offline';
  statusText: string;          // "In meeting: Weekly Standup" or "Away for 12 min"
  statusSince: string;         // ISO timestamp

  // Device
  deviceId: string;            // Fingerprint persisted in localStorage
  deviceType: 'desktop' | 'tablet' | 'phone';
  deviceName: string;          // "Tony's Workstation" or "iPhone 15 Pro"
  platform: string;            // "win32", "android", "ios", "macos"
  screenClass: 'ultrawide' | 'cinema' | 'portrait' | 'desktop' | 'tablet-landscape' | 'tablet-portrait' | 'phone';
  screenResolution: string;    // "5120x1440"
  isPWA: boolean;

  // Location
  timezone: string;            // "America/Toronto"
  timezoneOffset: number;      // -300
  city: string;                // "Toronto" (from IP geolocation)
  coordinates?: { lat: number; lng: number }; // GPS when available

  // Device Health
  batteryLevel?: number;       // 0-100 (mobile)
  batteryCharging?: boolean;
  networkType: string;         // "wifi" | "cellular" | "ethernet"
  online: boolean;
  systemHealth?: {
    cpuCount: number;
    memoryTotal: number;       // GB
    memoryFree: number;
    memoryUsed: number;
    diskFreePercent?: number;
    hostname: string;
    osVersion: string;
    uptime: number;            // seconds
  };

  // App Context
  activeView: string;          // Current ViewId
  activeVenture: string;       // Current venture
  openPanels: string[];        // ['chat', 'files']
  splitViewActive: boolean;
  displayMode: string;         // Workspace preset name
  lastActivity: string;        // ISO timestamp of last interaction
}
```

---

## AI Status Inference Engine

Evaluates signals in priority order — first match wins. Runs every 60 seconds client-side.

### Signal Priority Chain

| Priority | Signal Source | Condition | Status | statusText |
|----------|-------------|-----------|--------|------------|
| 1 | Twilio Calls | Active call (in-progress/ringing) | `on-call` | "On call with {contact or phone}" |
| 2 | Google Calendar | Current time within event start-end | `in-meeting` | "In meeting: {summary} -- ends in {N}m" |
| 3 | Active View | In Forge/AI Studio/Prompt Composer AND last activity < 30s | `focus` | "Deep work: {view name}" |
| 4 | Time + Activity | Local hour 23-07 AND idle > 15 min | `sleeping` | "Offline -- {city} {localTime}" |
| 5 | Activity | No interaction for 5+ min | `away` | "Away for {duration}" |
| 6 | Default | None of the above | `active` | "Active -- {activeView}" |

### Context Enrichment

Each status inference also enriches the presence with context:

- **in-meeting**: Pulls attendee list, meeting link, agenda, remaining duration from calendar event
- **on-call**: Matches phone to CRM contact, pulls company and venture association
- **focus**: Tracks venture context and duration of focus session
- **sleeping**: Adjusts detection hours based on actual timezone (not hardcoded)
- **away**: Tracks idle duration, last-known view and venture

### Data Sources for Inference

| Source | How Accessed | Refresh |
|--------|-------------|---------|
| Google Calendar | `useUpcomingEvents()` hook (existing, 60s refetch) | 60s |
| Twilio Calls | `useRecentCalls()` hook (existing, 15s refetch) | 15s |
| User Activity | Mouse/keyboard event listener -> `lastActivity` timestamp | Real-time |
| Timezone | `Intl.DateTimeFormat().resolvedOptions().timeZone` | Once on boot |
| Local Time | `new Date()` | Every inference cycle |

---

## Device Detection & Fingerprinting

### Device Fingerprint

Generated once per device, persisted in localStorage:

```typescript
function generateDeviceId(): string {
  const stored = localStorage.getItem('mcv-device-id');
  if (stored) return stored;
  const id = `${platform}-${crypto.randomUUID().slice(0, 8)}`;
  localStorage.setItem('mcv-device-id', id);
  return id;
}
```

### Screen Classification

```typescript
function classifyScreen(): ScreenClass {
  const w = window.screen.width;
  const h = window.screen.height;
  const isTouch = 'ontouchstart' in window;
  const isPortrait = h > w;

  if (w >= 5120) return 'ultrawide';
  if (w >= 3840 && h >= 2160) return 'cinema';
  if (isPortrait && !isTouch && w >= 1080) return 'portrait';
  if (w >= 1920) return 'desktop';
  if (isTouch && w >= 1024) return isPortrait ? 'tablet-portrait' : 'tablet-landscape';
  if (isTouch && w >= 768) return isPortrait ? 'tablet-portrait' : 'tablet-landscape';
  return 'phone';
}
```

### Device Name Inference

```typescript
function inferDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android.*Mobile/.test(ua)) return 'Android Phone';
  if (/Android/.test(ua)) return 'Android Tablet';
  // Desktop: use hostname from local server if available
  return localStorage.getItem('mcv-device-name') || navigator.platform || 'Desktop';
}
```

### Location Detection

Three tiers, used in combination:

1. **Timezone** (always available): `Intl.DateTimeFormat().resolvedOptions().timeZone`
2. **City from IP** (on boot, no permission needed): Fetch from a free IP geolocation API (e.g., `ip-api.com/json`)
3. **GPS** (when user grants permission): `navigator.geolocation.watchPosition()` for real-time tracking

### Battery & Network (mobile)

```typescript
// Battery API (Chrome, Edge, Samsung)
const battery = await navigator.getBattery?.();
// -> battery.level (0-1), battery.charging

// Network Information API
const conn = navigator.connection;
// -> conn.effectiveType ('4g', '3g'), conn.type ('wifi', 'cellular')
```

---

## Device-Adaptive UI Engine

### Screen Class to Layout Mapping

| Screen Class | Layout Strategy | Nav Style | Panel Count | Data Density |
|---|---|---|---|---|
| `ultrawide` (5120+) | 3-4 panel workspace, horizontal split | Full sidebar + breadcrumbs | 3-4 | Maximum -- expanded tables, full charts |
| `cinema` (3840x2160) | Full dashboard, dense grids | Full sidebar | 2-3 | High -- 8-column KPI rows, large visualizations |
| `portrait` (1080x1920) | Single-column feed, vertical scroll | Collapsed sidebar | 1 | Timeline-optimized -- scrollable feeds |
| `desktop` (1920-3839) | Standard 2-panel | Collapsible sidebar | 2 | Standard |
| `tablet-landscape` | Simplified nav, larger targets | Bottom tabs or hamburger | 1-2 | Medium |
| `tablet-portrait` | Single panel + drawer | Hamburger menu | 1 | Medium |
| `phone` (< 768) | Single stack, bottom nav | Bottom tab bar (5 icons) | 1 | Compact -- cards, summaries |

### Per-Display Workspace Presets

Extends the existing `useLayoutStore` workspace presets with display awareness:

```
49" Ultrawide -> "Command Center"
  Left: CommsHub inbox feed
  Center: Active view (Calendar, CRM, etc.)
  Right: Chat dock (always open)

70" 4K -> "War Room"
  Full-width: Portfolio overview or Intelligence dashboard
  8-column KPI row, charts at full resolution

27" Portrait Left -> "Feed Station"
  Full-height: Notification stream + task list
  Real-time activity timeline

27" Portrait Right -> "Engineering"
  Full-height: Pipeline + sessions
  Git activity + deployment status
```

### Role-Based Feature Visibility

| Feature | super-admin | admin | member | guest |
|---|---|---|---|---|
| All views | Yes | Yes | Venture-scoped | Read-only dashboards |
| DeviceHub / ControlRoom | Yes | No | No | No |
| Agent orchestration | Yes | Yes | Limited kits | No |
| Raw data access | Yes | No | No | No |
| CRM + Financial | Yes | Yes | Venture-scoped | No |
| Presence (view others) | All users | Team | Self only | None |
| Settings + Integrations | Full | Own profile | Own profile | None |

---

## Agent-Aware Routing

### Agent Presence Context

Every agent (via `AgentOrchestrator`) receives presence state in its execution context:

```typescript
interface AgentPresenceContext {
  userStatus: PresenceState['status'];
  userTimezone: string;
  userCity: string;
  activeDevices: number;
  primaryDevice: PresenceState['deviceType'];
  primaryScreenClass: PresenceState['screenClass'];
  currentView: string;
  currentVenture: string;
  role: PresenceState['role'];
  accessTier: PresenceState['accessTier'];
}
```

### Status-Driven Agent Behaviors

| User Status | Agent Behavior |
|---|---|
| `in-meeting` | Queue non-urgent notifications. Auto-summarize missed messages. Prepare post-meeting action items. |
| `on-call` | Mute all visual notifications. Prepare call notes template. Log call duration for CRM. |
| `focus` | Only interrupt for critical alerts (deploy failures, security). Batch everything else for post-focus summary. |
| `away` | Continue background work (sync, ingestion, scheduled reports). Prepare "welcome back" summary. |
| `sleeping` | Run batch jobs: social digests, analytics reports, data cleanup, morning brief generation. |
| `active` | Full responsiveness. Real-time notifications. Proactive suggestions based on context. |

### Device-Aware Output Formatting

When an agent generates a response, it adapts output format based on the requesting device:

| Device | Output Adaptation |
|---|---|
| Desktop (ultrawide/cinema) | Full data tables, detailed charts, multi-section responses |
| Desktop (portrait) | Vertical layouts, timeline-formatted, scrollable |
| Tablet | Card-based layouts, swipeable sections, medium detail |
| Phone | KPI summary cards, bullet points, expandable sections, minimal chrome |

### Agent-to-Agent Matchmaking

The orchestrator routes requests to specialized agents based on venture context + user presence:

```
User asks: "What's FutureState performance?"
  Presence: { venture: 'futurestate', device: 'desktop', screen: 'cinema' }
  -> Route to: FutureState Finance Agent
  -> Output: Full property table + portfolio chart (cinema has space)

Same question from phone:
  -> Same agent
  -> Output: 3 KPI cards (AUM, yield, occupancy) + one sparkline
```

---

## Notification Routing

### Device Priority Rules

```
If desktop is active:
  -> All notifications go to desktop
  -> Mobile devices get badge count only (no popup)

If desktop is idle, phone is active:
  -> Critical notifications -> phone (push)
  -> Non-critical -> queued for desktop return

If all devices idle:
  -> All notifications queued
  -> Morning brief generated at wake time (based on timezone)

If in-meeting:
  -> Only 'critical' severity -> subtle desktop toast
  -> Everything else -> post-meeting summary

If on-call:
  -> Zero visual interruptions
  -> Everything queued for post-call
```

### Notification Severity Classification

```
critical: Deploy failures, security alerts, payment failures, server down
high:     New deals, important emails (AI-classified), overdue tasks
medium:   New messages, task updates, CRM activity
low:      Social engagement, pipeline syncs, background job completions
```

---

## Files to Create

| File | Purpose | Est. Lines |
|---|---|---|
| `src/stores/presence.ts` | Zustand store -- own state + all connected devices | ~120 |
| `src/hooks/use-presence.ts` | Supabase Realtime presence + AI status inference + activity tracking | ~180 |
| `src/lib/device.ts` | Device fingerprinting, screen classification, battery, network, GPS, timezone, city detection | ~150 |
| `src/lib/presence-engine.ts` | AI status inference logic (calendar + calls + time + activity signals) | ~100 |
| `src/components/PresenceAvatar.tsx` | Avatar with colored status ring (reusable, used in header + team views) | ~60 |
| `src/components/PresenceCard.tsx` | Flyout card with full presence details (devices, location, status, health) | ~120 |
| `src/components/DeviceMesh.tsx` | Visual grid showing all connected devices with live status | ~80 |

## Files to Modify

| File | Change |
|---|---|
| `src/App.tsx` | Add `usePresence()` hook, replace static avatar with `PresenceAvatar` |
| `src/components/StatusBar.tsx` | Add presence chip (status dot + text + city + device count) |
| `src/views/CommsHub.tsx` | Add presence widget to LiveCommandStrip |
| `src/lib/kits/orchestrator.ts` | Inject `AgentPresenceContext` into kit execution context |
| `src/stores/navigation.ts` | Export screen class for layout engine |

---

## Verification Plan

1. **Presence broadcast**: Open MCV in two browser tabs -> both show as separate devices in presence store
2. **Status inference**: Create a calendar event for "now" -> status auto-changes to `in-meeting` within 60s
3. **Device detection**: Open on desktop -> shows `desktop` type with correct screen class. Open on phone -> shows `phone`
4. **Location**: Verify timezone and city are detected correctly on load
5. **StatusBar**: Verify presence chip shows status dot + text + city on every page
6. **Avatar ring**: Verify header avatar shows correct color ring for current status
7. **Cross-device**: Change status on one device -> verify other device sees update in < 2 seconds
8. **Agent context**: Ask Aegis a question -> verify AgentPresenceContext is populated in orchestrator logs