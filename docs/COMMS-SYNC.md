# Data Ingestion Pipeline — System Documentation

**Module:** Comms Sync (Data Ingestion)  
**Version:** 1.0.0  
**Last Updated:** April 5, 2026  
**Status:** Production-ready  
**Endpoint:** `POST /api/comms-sync`

---

## Overview

The Data Ingestion Pipeline automatically routes incoming communication data from 8 platforms into the Knowledge Base (documents), CRM (contacts + activities), Tasks, and Notifications. It runs as a background sync every 5 minutes via `useCommsSync()`, mirroring the existing `usePipelineSync()` pattern.

An AI classifier (Claude claude-sonnet-4-20250514) triages incoming items to determine importance and routing targets.

---

## Architecture

```
  useCommsSync() hook (5-min interval, src/hooks/use-comms-sync.ts)
         │
         │ apiPost('/api/comms-sync', { action: 'full-sync' })
         ▼
  api/comms-sync.ts (Vercel Serverless, maxDuration: 60s)
         │
    ┌────┴────┬──────────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼          ▼
  sync-    sync-      sync-      sync-      sync-
  emails   calls     calendar   messaging   social
    │         │          │          │          │
    └────┬────┴──────────┴──────────┴──────────┘
         │
         ▼  AI Classifier (Claude claude-sonnet-4-20250514)
         │
    ┌────┴────┬──────────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼          ▼
  documents activities contacts   tasks    notifications
  (Supabase) (Supabase) (Supabase) (Supabase) (Supabase)
```

---

## Data Flow Mappings

### Email (Gmail) -> Knowledge Base + CRM

| Source | Target | Condition |
|--------|--------|-----------|
| Unread/starred email | `documents` (doc_type: `email-digest`) | AI classifies as important |
| Email from known contact | `activities` (type: `email`) | Contact matched by sender email |
| Email from unknown sender | `contacts` (type: `lead`) | AI classifies as new-contact-worthy |

### Calls (Twilio) -> CRM

| Source | Target | Condition |
|--------|--------|-----------|
| Completed call | `activities` (type: `call`) | Always (matched by phone to contact) |
| Unknown phone number | `contacts` (type: `lead`) | When no contact matches |

Auto-updates `contact.last_contacted` when activity is created.

### Calendar (Google) -> Tasks + Knowledge Base

| Source | Target | Condition |
|--------|--------|-----------|
| Event in next 48 hours | `tasks` (tags: `meeting-prep`) | Due 1 hour before meeting |
| Event in next 48 hours | `documents` (doc_type: `meeting-notes`) | Template with attendees, agenda, action items |

### Messaging (Slack/Discord) -> Knowledge Base + CRM

| Source | Target | Condition |
|--------|--------|-----------|
| Messages with reactions/mentions | `documents` (doc_type: `note`) | Flagged or mentioned messages from top channels |
| Slack users with email | `contacts` (type: `team`) | Not already in CRM by email |

### Social -> Knowledge Base

| Source | Target | Condition |
|--------|--------|-----------|
| Twitter/YouTube stats | `documents` (doc_type: `report`) | Daily digest, one per day |

---

## Dedup Strategy

Every ingested record carries metadata for idempotency:

```json
{
  "source": "comms-sync",
  "sourceId": "<platform-unique-id>",
  "sourcePlatform": "gmail|slack|discord|twilio|gcal|twitter|linkedin|youtube",
  "syncedAt": "2026-04-05T12:00:00Z"
}
```

Before every insert:
```sql
SELECT id FROM <table> WHERE metadata @> '{"source":"comms-sync","sourceId":"<id>"}'
```
- Found -> skip (or update if newer)
- Not found -> insert

Safe to run at any frequency. Duplicate calls are no-ops.

---

## AI Classification

Uses Anthropic SDK directly (`@anthropic-ai/sdk`), model `claude-sonnet-4-20250514`.

**Input:** Array of items with `{ id, platform, from, subject, content }`

**Output per item:**
```json
{
  "id": "<item-id>",
  "importance": "high" | "medium" | "low",
  "routes": [
    { "target": "document", "docType": "email-digest" },
    { "target": "crm-activity" },
    { "target": "crm-contact" }
  ],
  "ventureId": "futurestate"
}
```

**Fallback:** When API key unavailable or classification fails, defaults to `importance: medium`, routes to `document` with `doc_type: note`, venture inferred from content.

---

## API Actions

| Action | Method | Source | Targets | Rate |
|--------|--------|--------|---------|------|
| `sync-emails` | POST | Gmail (15 msgs) | documents, activities, contacts | 5 min |
| `sync-calls` | POST | Twilio (20 calls) | activities | 5 min |
| `sync-calendar` | POST | Google Calendar (15 events, 48h) | tasks, documents | 5 min |
| `sync-messaging` | POST | Slack (5 channels x 10 msgs) | documents, contacts | 5 min |
| `sync-social` | POST | Twitter, YouTube | documents | Daily |
| `full-sync` | POST | All of the above | All | 5 min |

---

## File Inventory

| File | Purpose |
|------|---------|
| `api/comms-sync.ts` | Serverless ingestion engine — all sync actions, AI classifier, dedup logic |
| `src/hooks/use-comms-sync.ts` | React hook — 5-min background sync, exposes `triggerSync()` for manual |
| `src/components/comms/CommsSyncStatus.tsx` | UI widget — last sync time, per-action breakdown, "Sync Now" button |

---

## Meeting Notes Template

Auto-generated for each calendar event:

```markdown
# Meeting Notes: {summary}
**Date:** Monday, April 7, 2026 at 3:00 PM
**Attendees:** Tony, Devon, John
**Location:** Google Meet (link)

## Agenda
{event description}

## Notes
-

## Action Items
- [ ]

## Follow-up
-
```

---

## Venture Inference

The `guessVenture(text)` function matches content against venture names, slugs, and domains:

| Text Contains | Venture ID |
|--------------|------------|
| futurestate, future state | `futurestate` |
| betedge, bet-edge, bet edge | `betedge` |
| warforge, war forge | `warforge` |
| edgeiq, edge iq | `edgeiq` |
| arqlab, arq lab | `arqlabs` |
| mcv.gg, mcvgg | `mcvgg` |
| (default) | `mcv` |

---

## Configuration

```json
// vercel.json
{
  "functions": {
    "api/comms-sync.ts": { "maxDuration": 60 }
  }
}
```

The 60-second timeout accommodates full-sync across all platforms + AI classification.
