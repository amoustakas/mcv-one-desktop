# API Reference — Communications, Ingestion & Presence

**Last Updated:** April 5, 2026

---

## Serverless API Endpoints

### POST `/api/comms-sync`

Data ingestion engine. Syncs communication data into Knowledge Base, CRM, Tasks.

| Action | Description | Source | Targets |
|--------|-------------|--------|---------|
| `sync-emails` | Fetch Gmail unread/starred, classify, route | Gmail API | documents, activities, contacts |
| `sync-calls` | Fetch Twilio calls, match contacts | Twilio API | activities |
| `sync-calendar` | Fetch 48h events, create tasks + notes | Google Calendar | tasks, documents |
| `sync-messaging` | Fetch Slack/Discord flagged messages | Slack/Discord API | documents, contacts |
| `sync-social` | Generate daily engagement digest | Twitter/YouTube | documents |
| `full-sync` | Run all above sequentially | All | All |

**Auth:** Clerk JWT (Bearer token or `__session` cookie)  
**Config:** `vercel.json` → `maxDuration: 60`

**Response:**
```json
{
  "synced": { "documents": 3, "activities": 2, "contacts": 1 },
  "total": 6
}
```

---

## Client API Functions (`src/lib/api/comms.ts`)

### Messaging

| Function | Params | Returns |
|----------|--------|---------|
| `fetchSlackChannels()` | — | `UnifiedChannel[]` |
| `fetchSlackHistory(channelId, limit?)` | channelId: string | `UnifiedMessage[]` |
| `sendSlackMessage(channel, text, threadTs?)` | channel, text | Slack response |
| `fetchSlackUsers()` | — | `UnifiedContact[]` |
| `fetchDiscordGuilds()` | — | `{id, name, icon}[]` |
| `fetchDiscordChannels(guildId)` | guildId: string | `UnifiedChannel[]` |
| `fetchDiscordMessages(channelId, limit?)` | channelId | `UnifiedMessage[]` |
| `sendDiscordMessage(channelId, content)` | channelId, content | Discord response |
| `fetchDiscordMembers(guildId)` | guildId | `UnifiedContact[]` |
| `fetchGmailMessages(query?, maxResults?)` | query?, maxResults? | `UnifiedMessage[]` |
| `sendGmailMessage(to, subject, body)` | to, subject, body | Gmail response |
| `fetchTwilioMessages(limit?)` | limit? | `UnifiedMessage[]` |
| `sendSms(to, body)` | to, body | Twilio response |
| `sendWhatsApp(to, body)` | to, body | Twilio response |

### Calendar

| Function | Params | Returns |
|----------|--------|---------|
| `fetchUpcomingEvents(maxResults?)` | maxResults? (default 15) | `CalendarEvent[]` |
| `fetchCalendarOverview()` | — | `{calendar_count, upcoming_events, next_event, next_event_time}` |
| `quickAddEvent(text)` | Natural language text | Created event |
| `createCalendarEvent(params)` | summary, start, end, description?, location?, attendees? | Created event |

### Calls

| Function | Params | Returns |
|----------|--------|---------|
| `fetchRecentCalls(limit?)` | limit? (default 20) | `TwilioCall[]` |
| `makeCall(to, twiml?)` | to: phone, twiml? | Call response |
| `fetchTwilioOverview()` | — | Twilio account summary |

### Gmail Triage

| Function | Params | Returns |
|----------|--------|---------|
| `fetchGmailOverview()` | — | `{email, threadsTotal, messagesTotal, inboxMessages, unreadMessages}` |
| `getGmailMessage(id)` | message ID | Full message with parsed body |
| `archiveGmailMessage(id)` | message ID | Modified message (INBOX label removed) |
| `starGmailMessage(id)` | message ID | Modified message (STARRED added) |
| `unstarGmailMessage(id)` | message ID | Modified message (STARRED removed) |
| `trashGmailMessage(id)` | message ID | Trashed message |

### Social

| Function | Params | Returns |
|----------|--------|---------|
| `fetchTwitterTimeline(userId, maxResults?)` | userId, maxResults? | `SocialPost[]` |
| `fetchTwitterUser(username)` | username | Twitter user object |
| `fetchLinkedInProfile()` | — | LinkedIn profile |
| `fetchYouTubeVideos(maxResults?)` | maxResults? | `SocialPost[]` |

### Aggregators

| Function | Params | Returns |
|----------|--------|---------|
| `fetchUnifiedInbox(connectedPlatforms)` | `CommsPlatform[]` | `UnifiedMessage[]` (sorted by time) |
| `fetchAllChannels(connectedPlatforms)` | `CommsPlatform[]` | `UnifiedChannel[]` |
| `derivePlatformStatuses(connections)` | Integration connections | `PlatformStatus[]` |
| `sendMessage(platform, params)` | Platform-aware router | Platform response |
| `tagMessagesWithVentures(messages)` | `UnifiedMessage[]` | `UnifiedMessage[]` (with ventureId) |
| `tagChannelsWithVentures(channels)` | `UnifiedChannel[]` | `UnifiedChannel[]` (with ventureId) |

---

## React Hooks (`src/hooks/use-comms.ts`)

### Queries

| Hook | Query Key | Stale Time | Refetch |
|------|-----------|-----------|---------|
| `useUnifiedInbox()` | `['comms', 'inbox', platforms]` | 30s | — |
| `useCommsChannels()` | `['comms', 'channels', platforms]` | 60s | — |
| `useChannelMessages(platform, channelId)` | `['comms', 'messages', ...]` | 30s | — |
| `useSocialFeed(platform, userId?)` | `['comms', 'social', platform]` | 60s | — |
| `useUpcomingEvents(maxResults?)` | `['comms', 'calendar', 'events', n]` | 30s | 60s auto |
| `useCalendarOverview()` | `['comms', 'calendar', 'overview']` | 30s | 60s auto |
| `useRecentCalls(limit?)` | `['comms', 'calls', n]` | 15s | 15s auto |
| `useGmailOverview()` | `['comms', 'gmail', 'overview']` | 30s | 60s auto |
| `usePlatformStatuses()` | (derived, no query) | — | — |
| `useSlackUsers()` | `['comms', 'slack-users']` | 300s | — |
| `useDiscordGuilds()` | `['comms', 'discord-guilds']` | 300s | — |
| `useDiscordMembers(guildId)` | `['comms', 'discord-members', id]` | 300s | — |

### Mutations

| Hook | Invalidates | Description |
|------|-------------|-------------|
| `useSendMessage()` | `['comms', 'inbox']`, `['comms', 'messages']` | Platform-aware send |
| `useBroadcast()` | `['comms']` | Multi-platform parallel send |
| `useQuickAddEvent()` | `['comms', 'calendar']` | Natural language calendar event |
| `useMakeCall()` | `['comms', 'calls']` | Twilio voice call |
| `useArchiveEmail()` | `['comms', 'inbox']`, `['comms', 'gmail']` | Remove from Gmail inbox |
| `useStarEmail()` | `['comms', 'inbox']` | Add Gmail star |
| `useTrashEmail()` | `['comms', 'inbox']`, `['comms', 'gmail']` | Delete Gmail message |

---

## Presence Hooks & Functions (`src/hooks/use-presence.ts`)

### `usePresence()`
Main orchestration hook. Call once in App.tsx.

**Behavior:**
1. Captures device snapshot (fingerprint, screen, location, battery, network, system health)
2. Joins Supabase Realtime presence channel `mcv-presence`
3. Broadcasts `PresenceState` via `channel.track()`
4. Starts 60-second inference loop
5. Tracks mouse/keyboard activity (throttled 1s)
6. Sets `data-screen-class` and `data-device-type` on `<html>` for CSS

### `useCommsSync()`
Background data ingestion hook. Call once in App.tsx.

**Returns:** `{ lastSync, lastResult, syncing, triggerSync }`

---

## Device Detection (`src/lib/device.ts`)

| Function | Returns | Source |
|----------|---------|--------|
| `generateDeviceId()` | `string` (UUID) | localStorage |
| `classifyScreen()` | `ScreenClass` | `window.screen` + touch detection |
| `detectDeviceType()` | `DeviceType` | Derived from screen class |
| `detectTimezone()` | `string` | `Intl.DateTimeFormat` |
| `detectCity()` | `{city, lat?, lon?}` | IP geolocation API |
| `detectGPS()` | `{lat, lng}` or null | `navigator.geolocation` |
| `detectBattery()` | `{level, charging}` or null | Battery API |
| `detectNetwork()` | `string` | Network Information API |
| `isPWA()` | `boolean` | `display-mode: standalone` media query |
| `getSystemHealth()` | `SystemHealth` or null | Local server `/health` |
| `captureDeviceSnapshot()` | Full snapshot | Runs all above in parallel |

---

## Zustand Stores

### `useCommsStore` (`src/stores/comms.ts`)
UI state for the Communications Hub.

| Field | Type | Persisted |
|-------|------|-----------|
| `activeTab` | `CommsTab` | Yes |
| `activePlatforms` | `CommsPlatform[]` | Yes |
| `ventureFilter` | `string \| null` | Yes |
| `inboxFilter` | `InboxFilter` | Yes |
| `socialPlatform` | `twitter \| linkedin \| youtube` | Yes |
| `searchQuery` | `string` | No |
| `composeOpen` | `boolean` | No |
| `composeTarget` | `ComposeTarget \| null` | No |
| `composeDraft` | `{content, subject?}` | No |
| `selectedChannel` | `{platform, channelId} \| null` | No |
| `selectedMessage` | `UnifiedMessage \| null` | No |

### `usePresenceStore` (`src/stores/presence.ts`)
Presence state for current user and all connected devices.

| Field | Type | Persisted |
|-------|------|-----------|
| `ownPresence` | `PresenceState \| null` | deviceName only |
| `allPresences` | `Record<string, PresenceState>` | No |

**Derived selectors:**
- `getMyDevices()` — all devices for current user
- `getTeamPresences()` — other users (one per user, most recent device)
- `getDeviceCount()` — number of own connected devices
- `getPrimaryDevice()` — most recently active device

---

## Notification Routing (`src/stores/notifications.ts`)

### `routeNotification(notification)`

| User Status | Error | Warning | Info/Success |
|------------|-------|---------|-------------|
| active (primary) | deliver | deliver | deliver |
| active (secondary) | deliver | deliver | badge-only |
| in-meeting | deliver | queue | queue |
| on-call | deliver | queue | queue |
| focus | deliver | deliver | badge-only |
| sleeping | queue | queue | queue |
