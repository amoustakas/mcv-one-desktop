# Google Enterprise Integration — Full Roadmap Design

**Date**: 2026-04-13
**Author**: NAOS + Tony
**Status**: Approved
**Scope**: Complete Google Workspace + Cloud integration for MCV Desktop

---

## Context

MCV Desktop has extensive Google infrastructure already built — 12+ API routes, 10 Google kits with 80+ tools, client libraries for Gemini/Imagen/Veo, and a full OAuth system with AES-256-GCM encryption. However, critical gaps prevent production use:

1. **OAuth scopes are read-only** — Gmail can't send, Calendar can't create events, Sheets can't write
2. **Env var fallback masks OAuth failures** — Gemini API key gets sent to Gmail/Calendar APIs
3. **No dedicated native views** for Gmail, Calendar, Drive, Sheets, Docs, Tasks
4. **Intelligence and Growth views don't reference** the fully-built Analytics (14 tools) and Ads (17 tools) kits
5. **MCP tools** (Gmail 7, Calendar 9) aren't wired into the kit orchestrator

Tony has full Google enterprise access with a GCP project and APIs enabled. The vision is a **layered approach**: native views for direct interaction + agent/kit integration for conversational access + CommsHub for unified inbox.

---

## Architecture: Phased Rollout

```
Phase 0 ─── Auth Fix (scopes, refresh, validation)
   │
   ├── Phase 1 ─── Gmail + Calendar + Drive (native views + kit + MCP)
   │
   ├── Phase 2 ─── Gemini + Imagen + Veo (AI/Creative)
   │      (parallel to Phase 1 — uses API keys, not OAuth)
   │
   ├── Phase 3 ─── Analytics + Ads + Search Console + Sheets
   │      (depends on Phase 0)
   │
   ├── Phase 4 ─── Docs + Tasks + Contacts + Maps + YouTube + Meet
   │      (depends on Phase 0 + 1)
   │
   └── Phase 5 ─── MCP Bridge + Cross-Service Workflows + Unified Search
          (depends on Phases 1-4)
```

---

## Phase 0: OAuth Scope Fix & Auth Hardening

### 0.1 Scope Upgrade

**File**: `api/_oauth-helper.ts` (lines 75-83)

Replace read-only scopes with full-access scopes:

```
Current (read-only):                    New (full access):
─────────────────────                   ──────────────────
drive.readonly                    →     drive
calendar.readonly                 →     calendar
gmail.readonly                    →     gmail.modify
analytics.readonly                      analytics.readonly (keep)
webmasters.readonly                     webmasters.readonly (keep)
userinfo.profile                        userinfo.profile (keep)
userinfo.email                          userinfo.email (keep)
                                  +     spreadsheets
                                  +     documents
                                  +     tasks
                                  +     contacts.readonly
```

**Why `gmail.modify` not `gmail.compose` or `gmail.full`**: `modify` grants read + send + draft + label management without dangerous admin capabilities. Best practice for productivity apps.

### 0.2 Env Var Fallback Fix

**File**: `api/_oauth-helper.ts` (lines 217-233)

**Problem**: Line 219 falls back to `GOOGLE_AI_KEY` (a Gemini API key) when no OAuth token exists. This Gemini key gets sent as a Bearer token to Gmail/Calendar APIs → cryptic "Invalid API key" errors.

**Fix**: Split fallback into two categories:
- **API-key services** (Gemini, Maps, Ads): Keep env var fallback
- **OAuth-only services** (Gmail, Calendar, Drive, Sheets, Analytics, Docs, Tasks): Remove fallback → throw clear error: "Google not connected. Connect in Settings > Integrations."

### 0.3 Scope Validation on Callback

**File**: `api/oauth/callback.ts`

After token exchange, Google returns granted `scope` in response. Add:
1. Parse granted scopes from response
2. Compare against requested scopes
3. If critical scopes missing → store as `status: 'partial'` with `missing_scopes` array
4. Show warning in IntegrationsHub: "Google connected but some permissions denied. Reconnect to grant: [list]"

### 0.4 Concurrent Refresh Deduplication

**File**: `api/_oauth-helper.ts` (lines 241-248)

**Problem**: 5 simultaneous API calls with expired token → 5 concurrent `refreshProviderToken()` calls racing.

**Fix**: In-memory `Map<string, Promise<string>>` keyed by `userId:provider`. Second caller awaits existing promise.

```ts
const pendingRefreshes = new Map<string, Promise<string | null>>();

async function refreshProviderToken(userId: string, provider: string, refreshTokenEncrypted: string) {
  const key = `${userId}:${provider}`;
  const existing = pendingRefreshes.get(key);
  if (existing) return existing;

  const promise = doRefresh(userId, provider, refreshTokenEncrypted)
    .finally(() => pendingRefreshes.delete(key));
  pendingRefreshes.set(key, promise);
  return promise;
}
```

### 0.5 Pre-Expiration Refresh

**File**: `api/_oauth-helper.ts` (lines 199-213)

**Current**: Only refreshes AFTER expiration (`new Date(token_expires_at) < new Date()`)

**Fix**: Refresh if token expires within 5 minutes:
```ts
const fiveMinFromNow = new Date(Date.now() + 5 * 60 * 1000);
if (expiresAt < fiveMinFromNow) { /* refresh */ }
```

### 0.6 Auth Error Distinction

**All Google API routes**: Return specific HTTP status codes:
- `401` → "Google token expired or revoked. Reconnect in Settings."
- `403` → "Missing permission. Reconnect Google with required scopes."
- `404` → "Resource not found."
- `429` → "Rate limited by Google. Try again shortly."
- `5xx` → "Google API error. Try again later."

### 0.7 Re-auth UX

Existing users with read-only scopes must disconnect and reconnect. Add:
- Banner in IntegrationsHub: "Google permissions updated. Reconnect to enable send, create, and write features."
- Store `scopes_version` in `oauth_connections` to detect stale scopes

---

## Phase 1: Core Productivity — Gmail + Calendar + Drive

### 1.1 New ViewIds

**File**: `src/stores/navigation.ts` (after line 103)

```ts
// Google Workspace
| 'gmail'
| 'calendar'
| 'drive'
| 'sheets'
| 'google-docs'
| 'google-tasks'
```

### 1.2 NavRail Integration

**File**: `src/components/NavRail.tsx`

Add **"Google Workspace"** section:
- Gmail (Mail icon)
- Calendar (Calendar icon)
- Drive (HardDrive icon)
- Sheets (Table icon)
- Docs (FileText icon)
- Tasks (CheckSquare icon)

### 1.3 Gmail Native View

**New file**: `src/views/GmailView.tsx`

Layout:
```
┌─────────────────────────────────────────────────────┐
│ Gmail                          [Search] [Compose]   │
├────────────┬────────────────────────────────────────┤
│ ▼ Inbox    │  Thread detail / message body           │
│   Starred  │  From: Devon <devon@...>               │
│   Sent     │  Subject: FutureState Q2 Update        │
│   Drafts   │  [Reply] [Forward] [Archive] [Label]   │
│   Spam     │                                         │
│   Trash    │                                         │
│ ──────     │                                         │
│ Labels:    │                                         │
│  Investors │                                         │
│  BetEdge   │                                         │
├────────────┼────────────────────────────────────────┤
│ Thread list with search                  Sort: ▼    │
└────────────┴────────────────────────────────────────┘
```

Features:
- Thread list with Gmail search syntax
- Thread/message detail with decoded HTML bodies
- Compose modal (To/CC/BCC, subject, rich text)
- Label sidebar with unread counts
- Bulk actions (archive, label, delete, mark read/unread)

Data flow: `GmailView` → `useGmail()` hook (React Query) → `/api/gmail` → Gmail API v1

API actions used (all 9 exist in `api/gmail.ts`):
- `profile`, `list-labels`, `search`, `get-message`, `list-threads`
- `send`, `create-draft`, `trash-message`, `modify-labels`

### 1.4 Calendar Native View

**New file**: `src/views/CalendarView.tsx`

Layout:
```
┌─────────────────────────────────────────────────────┐
│ Calendar   [< Apr 2026 >]  [Day|Week|Month|Agenda]  │
├────────────┬────────────────────────────────────────┤
│ My Cals:   │  Week/Day/Month grid with events       │
│ ☑ Personal │  Color-coded by calendar                │
│ ☑ Work     │                                         │
│ ☑ MCV      │                                         │
│ ──────     │                                         │
│ [+ Event]  │                                         │
│ [Quick Add]│                                         │
└────────────┴────────────────────────────────────────┘
```

Features:
- Month/Week/Day/Agenda views (custom-built, no external lib per UI policy)
- Event creation with attendees, location, recurrence, video conferencing
- Free/busy sidebar
- Multi-calendar toggle
- Quick-add from natural language
- Event detail panel with RSVP

API actions used (all 9 exist in `api/google-calendar.ts`):
- `list-calendars`, `list-events`, `get-event`, `create-event`
- `quick-add`, `update-event`, `delete-event`, `list-colors`, `overview`

### 1.5 Drive Enhancement

**File**: `src/views/FilesView.tsx` (enhance existing)

Add "Google Drive" as storage provider tab:
- Folder tree navigation
- File search across entire Drive
- Preview for Docs/Sheets/Slides/PDFs (Google embed URLs)
- Upload/download
- Create new Google Docs/Sheets
- Uses existing `api/google-drive.ts` — add write operations after scope upgrade

### 1.6 Kit Upgrades

**Gmail Kit** (`src/lib/kits/builtin/gmail-kit.ts`):

Add tools (5 existing → 10):
- `gmail_create_draft` — compose without sending
- `gmail_list_threads` — conversation threading
- `gmail_archive` — archive messages
- `gmail_modify_labels` — add/remove labels
- `gmail_trash` — move to trash

**Calendar Kit** (`src/lib/kits/builtin/google-calendar-kit.ts`):

Add tools (4 existing → 9):
- `gcal_update_event` — modify events
- `gcal_delete_event` — cancel events
- `gcal_find_free_time` — availability check
- `gcal_list_calendars` — multi-calendar listing
- `gcal_respond` — RSVP to invitations

**Drive Kit** (`src/lib/kits/builtin/google-drive-kit.ts`):

Add tools:
- `drive_upload` — upload file
- `drive_create_folder` — organize
- `drive_share` — sharing permissions
- `drive_export` — export Docs/Sheets as PDF/CSV

### 1.7 MCP Hybrid Bridge

**New file**: `src/lib/kits/builtin/mcp-google-bridge.ts`

Routes operations to MCP (real-time reads) or API (authenticated writes):

| Operation | Route | Reason |
|-----------|-------|--------|
| "Check inbox" | MCP `gmail_search_messages` | Instant, no auth setup |
| "Send email" | API `/api/gmail?action=send` | Needs OAuth write scope |
| "What's my schedule?" | MCP `gcal_list_events` | Instant read |
| "Book meeting" | API `/api/google-calendar?action=create-event` | OAuth write |
| "Find meeting time" | MCP `gcal_find_meeting_times` | Cross-calendar |
| "Search Drive" | API `/api/google-drive?action=search` | OAuth scope |

### 1.8 CommsHub Enhancement

**File**: `src/views/CommsHub.tsx`

The CommsHub already has inbox, calendar, calls tabs (10 total). Enhance:
- **Inbox tab**: Wire to real Gmail (`/api/gmail?action=search&q=in:inbox`)
- **Calendar tab**: Wire to real events (`/api/google-calendar?action=list-events`)
- **Compose tab**: Enable Gmail send
- **Cross-linking**: Click Gmail message → opens full thread in dedicated `GmailView`

---

## Phase 2: AI/Creative Pipeline — Gemini + Imagen + Veo

> **Can run in parallel with Phase 1** — uses API keys, not OAuth tokens.

### 2.1 AegisChat Model Switching

**File**: Chat view / AegisChat

Add model switcher: Claude Sonnet 4 | Gemini 1.5 Pro | Gemini 2.0 Flash

Auto-routing rules:
- Image/video upload → Gemini Vision (`gemini_vision`)
- >100k token context → Gemini long-context (`gemini-analyze`)
- Image generation request → Imagen (`gemini_image_gen`)
- Video generation request → Veo (`generateVideo()`)
- Everything else → Claude

Inline artifacts: Render generated images/videos as artifact cards in chat.

### 2.2 Creative Canvas Enhancement

**File**: `src/views/CreativeCanvasView.tsx`

Add:
- **AI Generate button**: Select region → "Generate with Imagen" → fills with AI image
- **Infographic mode**: `generateInfographic()` from `src/lib/google/imagen-client.ts`
- **Product mockup mode**: `generateMockup()` — composite on lifestyle backgrounds
- **Augmented image mode**: `generateAugmentedImage()` — generate + annotate with search
- **Save to Drive**: Export → upload to Google Drive via kit

### 2.3 Video Studio Enhancement

**File**: `src/views/VideoStudioView.tsx` (already functional with Veo)

Add:
- **Save to Drive**: Upload generated videos to Drive
- **Gemini script generation**: Describe video → Gemini writes prompt → Veo generates
- **Thumbnail generation**: Auto-generate with Imagen after video completes
- **YouTube upload**: Wire to YouTube API for direct publishing

### 2.4 Gemini Kit Expansion

**File**: `src/lib/kits/builtin/gemini-kit.ts` (11 existing → 16)

Add tools:
- `gemini_video_gen` — Veo video generation as kit tool
- `gemini_image_edit` — Imagen image editing
- `gemini_mockup` — Product mockup generation
- `gemini_live` — Gemini Live API (real-time audio/video)
- `gemini_context_cache` — Long-context caching

### 2.5 Voice Studio — Gemini Live

**File**: `src/views/VoiceStudioView.tsx`

Wire existing clients:
- `src/lib/google/live-api-client.ts` — Gemini Live API
- `src/lib/google/audio-pipeline.ts` — Audio processing
- Voice-to-text (Deepgram) → Gemini reasoning → Text-to-speech (ElevenLabs)
- Alternative: Gemini native audio I/O mode

---

## Phase 3: Growth & Data Intelligence

### 3.1 Intelligence View — Wire Google Analytics

**File**: `src/views/IntelligenceView.tsx`

Add "Analytics" tab:
- Real-time dashboard: Active users, page views, events (`ga_realtime`)
- Traffic sources breakdown (`ga_traffic_sources`)
- Top pages with trend sparklines (`ga_top_pages`)
- Funnel analysis per venture (`ga_funnel_report`)
- Cohort analysis for retention (`ga_cohort_report`)
- Custom report builder (`ga_run_report`)

Charts: Use existing `AreaChart`, `BarChart`, `DonutChart`, `SparkLine` components.

### 3.2 Growth View — Wire Google Ads + Search Console

**File**: `src/views/GrowthView.tsx`

Add tabs:

**Google Ads tab** (17 kit tools):
- Campaign list with status toggles (pause/enable)
- Performance charts (spend vs conversions over time)
- Keyword performance table
- Geo + device breakdown
- Google optimization recommendations

**Search Console tab**:
- Queries, clicks, impressions, CTR, position
- Top pages by organic traffic
- Index coverage status
- Mobile usability

**Cross-channel view**: Combine paid (Ads) + organic (Search Console) + campaigns for unified dashboard.

### 3.3 Sheets Native View

**New file**: `src/views/SheetsView.tsx`

Features:
- Spreadsheet browser (Drive files filtered by Sheets mimeType)
- Read-only grid viewer with cell rendering
- Append/update rows via kit tools
- Search across all spreadsheets

Data flow: `SheetsView` → `useSheets()` hook → `/api/google-sheets` → Sheets API v4

### 3.4 React Query Hooks

New hooks (no new kits needed — wire existing):
- `useGoogleAds()` → `executeKitTool('gads_campaigns')` → `/api/google-ads`
- `useAnalytics()` → `executeKitTool('ga_run_report')` → `/api/google-analytics`
- `useSearchConsole()` → `executeKitTool('gsc_queries')` → `/api/google-search-console`
- `useSheets()` → `executeKitTool('sheets_read')` → `/api/google-sheets`

---

## Phase 4: Complete Google Ecosystem

### 4.1 Google Docs

**New file**: `src/views/GoogleDocsView.tsx`
- Document browser (Drive filtered by Docs mimeType)
- Embedded preview (Google embed URLs)
- Create from templates
- Kit tools for doc creation/editing

### 4.2 Google Tasks

**New file**: `src/views/GoogleTasksView.tsx` OR enhance existing `TasksView.tsx`
- Task lists and items from Google Tasks API
- Two-way sync with existing task system
- New API route: `api/google-tasks.ts`
- New kit: `google-tasks-kit.ts`

### 4.3 Google Contacts

- Contact autocomplete in Gmail compose + Calendar attendee fields
- Contact search for NAOS email/scheduling workflows
- Read-only scope sufficient
- New API route: `api/google-contacts.ts`

### 4.4 Google Maps/Places Enhancement

Wire existing `places-search` and `maps-geocode` (already in Gemini kit):
- CRM: Customer location visualization
- Calendar: Venue search for events
- NAOS: "Where should we meet?" → search nearby places

### 4.5 YouTube Enhancement

**File**: `src/views/YouTubePlayerView.tsx` (exists)
- Upload capability (Veo-generated videos)
- Channel analytics (YouTube Analytics API)
- Comment management for venture channels
- New API route: `api/youtube-upload.ts`

### 4.6 Google Meet

- Create Meet links in Calendar events (via `conferenceData` in Calendar API)
- "Schedule video call with Devon" → Calendar event + Meet link
- No separate API needed — Calendar API supports this natively

---

## Phase 5: MCP Bridge + Cross-Service Workflows

### 5.1 MCP-Kit Router

**New file**: `src/lib/kits/builtin/mcp-google-bridge.ts`

Intelligent routing:
- **MCP path** (real-time, read-heavy): Email search, calendar queries, free time
- **API path** (authenticated, write-capable): Send, create, upload, update

### 5.2 Cross-Service Workflows

NAOS multi-step workflows:

| Workflow | Steps |
|----------|-------|
| "Prepare for my meeting" | Calendar → next event → Gmail → related threads → Drive → shared docs → Gemini → summarize |
| "Send weekly report" | Analytics → metrics → Sheets → update → Gemini → summary → Gmail → send |
| "Schedule investor pitch" | Calendar → free time → Gmail → invite → Drive → share deck → Tasks → follow-up |
| "Audit ad performance" | Ads → campaigns → Analytics → conversions → Sheets → tracking → Gemini → insights |

### 5.3 Unified Search

Enhance CommandPalette (Ctrl+K):
- Search across Gmail, Calendar, Drive, Sheets, Analytics
- Results grouped by service with icons
- Click → opens in dedicated native view

### 5.4 Notification Integration

Wire to existing `src/stores/notifications.ts`:
- Gmail notifications → toast
- Calendar event reminders → toast
- Google Tasks due dates → toast

---

## New Files Summary

| Phase | New Files |
|-------|-----------|
| 0 | (modifications only) |
| 1 | `src/views/GmailView.tsx`, `src/views/CalendarView.tsx`, `src/hooks/use-gmail.ts`, `src/hooks/use-calendar.ts`, `src/hooks/use-drive.ts`, `src/lib/kits/builtin/mcp-google-bridge.ts` |
| 2 | (modifications only — enhance existing views and kits) |
| 3 | `src/views/SheetsView.tsx`, `src/hooks/use-analytics.ts`, `src/hooks/use-google-ads.ts`, `src/hooks/use-search-console.ts`, `src/hooks/use-sheets.ts` |
| 4 | `src/views/GoogleDocsView.tsx`, `src/views/GoogleTasksView.tsx`, `api/google-tasks.ts`, `api/google-contacts.ts`, `api/youtube-upload.ts`, `src/lib/kits/builtin/google-tasks-kit.ts` |
| 5 | (modifications + new workflow definitions) |

## Modified Files Summary

| Phase | Modified Files |
|-------|---------------|
| 0 | `api/_oauth-helper.ts`, `api/oauth/callback.ts`, `api/gmail.ts`, `api/google-calendar.ts`, `api/google-drive.ts`, `api/google-sheets.ts`, `api/google-analytics.ts` |
| 1 | `src/stores/navigation.ts`, `src/components/NavRail.tsx`, `src/components/WorkspaceRenderer.tsx`, `src/views/FilesView.tsx`, `src/views/CommsHub.tsx`, `src/lib/kits/builtin/gmail-kit.ts`, `src/lib/kits/builtin/google-calendar-kit.ts`, `src/lib/kits/builtin/google-drive-kit.ts`, `src/lib/kits/loader.ts` |
| 2 | `src/views/CreativeCanvasView.tsx`, `src/views/VideoStudioView.tsx`, `src/views/VoiceStudioView.tsx`, `src/lib/kits/builtin/gemini-kit.ts`, AegisChat/chat view |
| 3 | `src/views/IntelligenceView.tsx`, `src/views/GrowthView.tsx` |
| 4 | `src/views/YouTubePlayerView.tsx`, `src/views/TasksView.tsx`, `src/lib/kits/loader.ts` |
| 5 | `src/components/CommandPalette.tsx`, `src/stores/notifications.ts`, `src/lib/kits/builtin/mcp-google-bridge.ts` |

---

## Verification Plan

### Phase 0
- [ ] Connect Google OAuth → verify new scopes appear in consent screen
- [ ] Verify Gmail send works (was blocked by read-only scope)
- [ ] Verify Calendar create-event works
- [ ] Test token refresh (wait for expiry or manually invalidate)
- [ ] Test concurrent API calls with expired token (should dedup refresh)
- [ ] Disconnect Google → verify clear error messages (not fallback to Gemini key)

### Phase 1
- [ ] Open GmailView → see real inbox threads
- [ ] Search Gmail with query syntax → results appear
- [ ] Compose and send email → arrives in recipient inbox
- [ ] Open CalendarView → see real events in week view
- [ ] Create event with attendees → appears on Google Calendar
- [ ] Quick-add "Meeting with Devon at 3pm" → event created
- [ ] Open Drive tab in FilesView → browse real Drive folders
- [ ] Ask NAOS "check my email" → kit returns real Gmail data
- [ ] Ask NAOS "schedule meeting" → creates real Calendar event

### Phase 2
- [ ] Switch to Gemini in chat → model responds
- [ ] Upload image → auto-routes to Gemini Vision
- [ ] "Generate an image of..." → Imagen creates image inline
- [ ] Creative Canvas → AI Generate fills region
- [ ] Video Studio → Save to Drive works
- [ ] Voice Studio → Gemini Live responds in real-time

### Phase 3
- [ ] IntelligenceView Analytics tab → shows real GA4 data
- [ ] GrowthView Ads tab → shows Google Ads campaigns
- [ ] GrowthView Search Console tab → shows organic metrics
- [ ] SheetsView → browse and read real spreadsheets
- [ ] Ask NAOS "what's our traffic this week?" → returns GA data

### Phase 4
- [ ] GoogleDocsView → browse and preview documents
- [ ] GoogleTasksView → list and create tasks
- [ ] Contact autocomplete in Gmail compose
- [ ] Calendar event with Meet link
- [ ] YouTube upload from Video Studio

### Phase 5
- [ ] Ctrl+K → search returns results from Gmail, Calendar, Drive
- [ ] "Prepare for my meeting" workflow executes all steps
- [ ] Gmail notification appears as toast
- [ ] Calendar reminder triggers notification