# Presence & Device Intelligence — System Documentation

**Module:** Presence System  
**Version:** 1.0.0  
**Last Updated:** April 5, 2026  
**Status:** Production-ready

---

## Overview

The Presence & Device Intelligence system provides real-time awareness of user status, connected devices, location, timezone, and system health across all MCV Desktop sessions. It feeds into the agent orchestrator (presence-aware AI responses), notification routing (device-priority delivery), and device-adaptive CSS layouts (ultrawide to phone).

---

## Architecture

```
  Device boots MCV
         │
         ├── captureDeviceSnapshot()     [src/lib/device.ts]
         │   ├── generateDeviceId()      (localStorage fingerprint)
         │   ├── classifyScreen()        (7 screen classes)
         │   ├── detectTimezone()        (Intl API)
         │   ├── detectCity()            (IP geolocation)
         │   ├── detectGPS()             (navigator.geolocation)
         │   ├── detectBattery()         (Battery API)
         │   ├── detectNetwork()         (Network Information API)
         │   └── getSystemHealth()       (local server /health)
         │
         ├── Build PresenceState         [src/stores/presence.ts]
         │
         ├── Join Supabase Presence      [src/hooks/use-presence.ts]
         │   channel.track(ownPresence)
         │
         └── Start 60s inference loop
             ├── Read calendar events (query cache)
             ├── Read active calls (query cache)
             ├── Read lastActivity (event listener)
             ├── inferStatus(signals)    [src/lib/presence-engine.ts]
             └── channel.track(updated)  → all devices see update
```

---

## AI Status Inference

Priority chain — first match wins, evaluated every 60 seconds:

| Priority | Signal | Condition | Status | Example |
|----------|--------|-----------|--------|---------|
| 1 | Twilio Calls | Active call (in-progress/ringing) | `on-call` | "On call with +1-555-0123" |
| 2 | Google Calendar | Current time within event start-end | `in-meeting` | "In meeting: Weekly Standup -- 12m left" |
| 3 | Active View | Forge/AI Studio/Prompt Composer + recent activity | `focus` | "Deep work: The Forge" |
| 4 | Time + Activity | Local hour 23-07 + idle > 15 min | `sleeping` | "Offline -- 2:30 AM" |
| 5 | Activity | No interaction for 5+ min | `away` | "Away for 8m" |
| 6 | Default | None of the above | `active` | "Active -- Command Center" |

Data sources read from TanStack Query cache (no extra API calls).

---

## Screen Classification

| Class | Resolution | Use Case |
|-------|-----------|----------|
| `ultrawide` | 5120+ width | 49" ultrawide — 3-4 panel workspaces |
| `cinema` | 3840+ width, 2160+ height | 70" 4K — war room, dense dashboards |
| `portrait` | Height > Width, non-touch, 1080+ | 27" portrait monitors — feeds, timelines |
| `desktop` | 1920-3839 | Standard desktop |
| `tablet-landscape` | 768-1919 + touch, landscape | iPad landscape |
| `tablet-portrait` | 768-1919 + touch, portrait | iPad portrait |
| `phone` | < 768 | iPhone, Android |

Set on `document.documentElement.dataset.screenClass` for CSS targeting.

---

## Device-Adaptive CSS

The presence hook sets data attributes on `<html>`:

```html
<html data-screen-class="ultrawide" data-device-type="desktop">
```

CSS rules in `design-system.css`:

```css
/* Phone: hide sidebar */
[data-screen-class="phone"] .app-sidebar { display: none; }

/* Tablet: larger touch targets */
[data-device-type="tablet"] button { min-height: 40px; }

/* Portrait: sticky headers for scrolling */
[data-screen-class="portrait"] .mcv-page-header { position: sticky; top: 0; }
```

---

## Status Colors

| Status | Color | Hex | Ring Behavior |
|--------|-------|-----|--------------|
| active | Green | #10B981 | Subtle pulse |
| in-meeting | Blue | #3B82F6 | Solid |
| on-call | Red | #EF4444 | Solid |
| focus | Purple | #8B5CF6 | Solid |
| away | Yellow | #F59E0B | Solid |
| sleeping | Gray | #6B7280 | Solid |
| offline | Gray | #6B7280 | Solid |

---

## UI Integration Points

### 1. Header Avatar (every page)
`PresenceAvatar` component replaces `UserButton`. Shows avatar with colored status ring. Click opens `PresenceCard` flyout.

### 2. StatusBar Chip (bottom bar, every page)
Format: `● Active · Toronto EST · 4 devices`

### 3. LiveCommandStrip Widget (CommsHub)
Compact presence widget showing status + city + device count.

### 4. PresenceCard Flyout
Full details when clicking the header avatar:
- Status with duration
- Location (city, timezone, local time)
- Connected devices list with battery/network/screen class
- System health bars (CPU, memory — desktop only)
- Device rename input

### 5. DeviceMesh Grid
Visual grid of all connected devices. Each device shows type icon, name, status dot, battery, network. Used in PresenceCard and DeviceHubView.

---

## Agent Context Injection

The `AgentOrchestrator` (`src/lib/kits/orchestrator.ts`) appends user presence to every Claude system prompt:

```
## Current User Context
- Status: in-meeting (In meeting: Weekly Standup -- 12m left)
- Device: desktop (ultrawide)
- Location: Toronto, America/Toronto
- Role: ceo (super-admin)
- Venture: mcv

Adapt your responses to the user's current state and device.
On smaller screens, prefer concise card-based responses.
If the user is in a meeting or on a call, keep responses brief.
```

This makes every agent response context-aware without any per-agent configuration.

---

## Notification Routing

`routeNotification()` in `src/stores/notifications.ts` checks presence before delivering:

| User Status | Error Notifications | Other Notifications |
|------------|--------------------|--------------------|
| active (primary device) | deliver | deliver |
| active (secondary device) | deliver | badge-only |
| in-meeting | deliver | queue |
| on-call | deliver | queue |
| focus | deliver | badge-only |
| sleeping | queue | queue |

---

## Supabase Realtime Presence

Uses the existing Supabase Realtime infrastructure extended with `.presence()`:

```typescript
const channel = supabase.channel('mcv-presence');
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState<PresenceState>();
  // Update allPresences store
});
channel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await channel.track(ownPresence);
  }
});
```

When a device closes, Supabase auto-removes it from presence. No heartbeat needed.

---

## File Inventory

| File | Purpose |
|------|---------|
| `src/lib/device.ts` | Device fingerprinting, screen classification, timezone, city, GPS, battery, network detection |
| `src/stores/presence.ts` | Zustand store: own presence + all devices + status colors/labels |
| `src/lib/presence-engine.ts` | 6-priority AI status inference engine |
| `src/hooks/use-presence.ts` | Main orchestration hook: device init + Supabase channel + inference loop + activity tracking |
| `src/components/PresenceAvatar.tsx` | Avatar with colored status ring |
| `src/components/PresenceCard.tsx` | Flyout card with full presence details |
| `src/components/DeviceMesh.tsx` | Connected devices grid |

| Modified File | Change |
|--------------|--------|
| `src/App.tsx` | Added `usePresence()` + PresenceAvatar + PresenceCard |
| `src/components/StatusBar.tsx` | Added presence chip |
| `src/views/CommsHub.tsx` | Added PresenceWidget to LiveCommandStrip |
| `src/lib/kits/orchestrator.ts` | Injected AgentPresenceContext into system prompts |
| `src/stores/notifications.ts` | Added `routeNotification()` |
| `src/styles/design-system.css` | Added `[data-screen-class]` adaptive CSS rules |

---

## PresenceState Interface

```typescript
interface PresenceState {
  // Identity
  userId: string; userName: string; avatarUrl: string;
  role: 'ceo' | 'cofounder' | 'engineer' | 'designer' | 'analyst' | 'viewer';
  accessTier: 'super-admin' | 'admin' | 'member' | 'guest';

  // Status (AI-inferred)
  status: PresenceStatus; statusText: string; statusSince: string;

  // Device
  deviceId: string; deviceType: DeviceType; deviceName: string;
  platform: string; screenClass: ScreenClass; screenResolution: string; isPWA: boolean;

  // Location
  timezone: string; timezoneOffset: number; city: string;
  coordinates?: { lat: number; lng: number };

  // Health
  batteryLevel?: number; batteryCharging?: boolean;
  networkType: string; online: boolean;
  systemHealth?: SystemHealth;

  // Context
  activeView: string; activeVenture: string; lastActivity: string;
}
```
