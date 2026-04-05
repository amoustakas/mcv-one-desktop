# Communications Hub — System Documentation

**Module:** Communications Hub  
**Version:** 1.0.0  
**Last Updated:** April 5, 2026  
**Status:** Production-ready

---

## Overview

The Communications Hub is MCV Desktop's unified command center for all messaging, calls, calendar, social media, and cross-platform communication. It aggregates data from 8 platforms (Slack, Discord, Gmail, Twilio SMS/WhatsApp, Google Calendar, Twitter/X, LinkedIn, YouTube) into a single pane of glass with real-time data, AI-powered triage, and cross-platform send capabilities.

---

## Architecture

```
                    ┌─────────────────────────────────┐
                    │        CommsHub View             │
                    │   (src/views/CommsHub.tsx)        │
                    ├─────────────────────────────────┤
                    │  LiveCommandStrip (always on)     │
                    │  10 Tabs: Inbox | Calendar |      │
                    │  Calls | Channels | Compose |     │
                    │  Analytics | Social | Contacts |  │
                    │  Broadcast | Status               │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │    TanStack Query Hooks           │
                    │   (src/hooks/use-comms.ts)        │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │   API Normalizer Layer            │
                    │   (src/lib/api/comms.ts)          │
                    │   Normalizes 8 platform APIs      │
                    │   into UnifiedMessage/Channel      │
                    └────────────┬────────────────────┘
                                 │
          ┌──────────┬───────────┼───────────┬──────────┐
          ▼          ▼           ▼           ▼          ▼
     /api/slack  /api/discord /api/gmail /api/twilio /api/google-calendar
     /api/twitter /api/linkedin /api/youtube
```

---

## File Inventory

### Core Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/lib/types/comms.ts` | Unified type definitions: `CommsPlatform`, `UnifiedMessage`, `UnifiedChannel`, `SocialPost`, `PlatformStatus`, `CalendarEvent`, `TwilioCall`, `PLATFORM_META` | ~200 |
| `src/stores/comms.ts` | Zustand UI state: active tab, platform filters, venture filter, compose state, detail panels. Persisted: tab, platforms, filters | ~130 |
| `src/lib/api/comms.ts` | API normalizer layer: wraps all platform APIs, normalizes responses, venture tagging, `sendMessage` router, `fetchUnifiedInbox` aggregator | ~500 |
| `src/hooks/use-comms.ts` | TanStack Query hooks: `useUnifiedInbox`, `useCommsChannels`, `useUpcomingEvents`, `useRecentCalls`, `useGmailOverview`, `useSocialFeed`, `useSendMessage`, `useBroadcast`, triage mutations | ~280 |
| `src/views/CommsHub.tsx` | Main view: 10 tabs + LiveCommandStrip + inline CSS (~120 styles) | ~1200 |

### Integration Files

| File | Change Made |
|------|------------|
| `src/stores/navigation.ts` | Added `'comms-hub'` to `ViewId` union + `VIEW_LABELS` |
| `src/components/NavRail.tsx` | Added `MessageSquare` icon + nav item under "Growth & CRM" |
| `src/App.tsx` | Added lazy import + `renderView` case |
| `src/components/CommandPalette.tsx` | Added "Communications Hub" to search results |
| `src/hooks/use-realtime.ts` | Added comms query cache invalidation on message INSERT |

---

## Tabs

### 1. Inbox (Unified)
- Aggregates messages from Slack channels, Discord channels, Gmail inbox, and Twilio SMS/WhatsApp
- `Promise.allSettled` fetching — one failing platform doesn't break the others
- Filter: All / Unread
- Search across content, author, channel name
- Venture filter scoped via `inferVentureId()` matching channel names against venture slugs
- Gmail messages show triage actions on hover: Archive, Star, Trash
- Click any message to open detail panel (slide-out right)
- Venture badges on message rows (colored by venture)

### 2. Calendar
- Upcoming events from Google Calendar grouped by day
- Live meeting indicator (green dot + border highlight for current meetings)
- Google Meet / Zoom join buttons directly on event cards
- Attendee count and location display
- **Quick-add** with Google's natural language parser ("Meeting with Devon at 3pm tomorrow")
- Auto-refreshes every 60 seconds

### 3. Calls
- **Dialer** — phone number input + Call button (Twilio voice)
- **Active calls** — pulsing green border, live status (in-progress, ringing)
- **Recent call history** — direction icons (inbound/outbound), duration, time ago
- Status icons per call state (in-progress, completed, busy, failed, no-answer)
- Auto-refreshes every 15 seconds

### 4. Channels
- All channels from Slack and Discord grouped by platform
- GlassCard per channel: name, member count, type (channel/dm/group)
- Click to select and view channel history
- Venture-filtered when venture dropdown is active

### 5. Compose
- Platform selector dropdown (Slack, Discord, Gmail, SMS, WhatsApp)
- **Smart channel picker**: shows actual channels from connected platforms as a dropdown. Falls back to manual ID input if not connected
- Gmail compose: To (email) + Subject + Body
- SMS/WhatsApp compose: To (phone) + Body
- Send via `useSendMessage` mutation → routes to correct platform API

### 6. Analytics
- KPI row: Total Messages, Connected Platforms, Most Active Platform, Unread Count
- Message distribution bar chart (platform breakdown by percentage, colored by platform)

### 7. Social
- Sub-tabs: Twitter / LinkedIn / YouTube
- Social post cards with engagement metrics (likes, shares, comments, views)
- External link to original post
- Auto-refreshes every 60 seconds

### 8. Contacts
- Cross-platform contact directory (Slack users + Discord members)
- **Dedup by name**: contacts appearing in both Slack and Discord merge into one row with multiple platform icons
- KPI row: Total Contacts, Slack count, Discord count, Multi-platform count
- Filter: All / Slack / Discord
- Search by name or email
- Avatar display with fallback placeholder

### 9. Broadcast
- Multi-platform send: select platforms via checkboxes (Slack, Discord, SMS, WhatsApp)
- **Channel multi-select** per platform: real channels from connected platforms
- SMS/WhatsApp: comma-separated phone numbers
- Message textarea shared across all targets
- Target count badge
- `useBroadcast` mutation: `Promise.allSettled` across all targets, reports succeeded/failed

### 10. Status
- **CommsSyncStatus widget** — data ingestion pipeline health (last sync, items synced, per-action breakdown)
- Platform connection cards: 8 platforms with health indicators (connected/disconnected/degraded)
- Link to Manage Integrations

---

## LiveCommandStrip

Always-visible widget bar above the tabs showing real-time data:

| Widget | Data Source | Refresh Rate |
|--------|-----------|--------------|
| Next Meeting (countdown + join button) | Google Calendar | 60s + 30s UI tick |
| Active Calls | Twilio | 15s |
| Unread Messages | Unified Inbox | 30s |
| Unread Email | Gmail Overview | 60s |
| Today's Events | Calendar Overview | 60s |
| Presence Status | Presence Store | 60s |

---

## Unified Types

```typescript
type CommsPlatform = 'slack' | 'discord' | 'gmail' | 'twilio-sms' | 'twilio-whatsapp' | 'twitter' | 'linkedin' | 'youtube'

interface UnifiedMessage {
  id: string; platform: CommsPlatform; channelId: string; channelName: string;
  author: { name: string; avatar?: string; platformId: string };
  content: string; timestamp: string; threadId?: string;
  isRead: boolean; ventureId?: string; metadata: Record<string, unknown>;
}

interface UnifiedChannel {
  id: string; platform: CommsPlatform; name: string;
  type: 'channel' | 'dm' | 'group' | 'thread' | 'inbox' | 'feed';
  memberCount?: number; unreadCount?: number; lastActivity?: string;
  ventureId?: string; platformMeta: Record<string, unknown>;
}
```

---

## Platform Colors & Icons

| Platform | Color | Icon |
|----------|-------|------|
| Slack | #4A154B | Hash |
| Discord | #5865F2 | Gamepad2 |
| Gmail | #EA4335 | Mail |
| SMS | #F22F46 | MessageSquare |
| WhatsApp | #25D366 | Phone |
| Twitter/X | #1DA1F2 | Twitter |
| LinkedIn | #0077B5 | Linkedin |
| YouTube | #FF0000 | Youtube |

---

## Bundle Impact

`CommsHub.js`: 65.02 kB (15.11 kB gzipped) — fully lazy-loaded via `React.lazy()`, zero impact on initial page load.
