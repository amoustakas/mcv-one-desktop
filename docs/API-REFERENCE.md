# MCV One Desktop — API & Kit Reference

> **Version:** 5.4.0+
> **Generated:** 2026-04-05
> **Total:** 77 kits, 88 API endpoints, ~500+ agent tools

---

## Architecture

Every external service follows the same pattern:

```
User → Aegis Chat → Agent Orchestrator → Kit Tool → API Endpoint → External Service
```

- **API Endpoints** (`api/*.ts`) — Vercel serverless functions handling auth + service calls
- **Kit Files** (`src/lib/kits/builtin/*-kit.ts`) — Tool manifests + handlers registered in the orchestrator
- **OAuth** — 13 providers with encrypted token storage, auto-refresh, env var fallback
- **API Keys** — 14 services configured via env vars with health checks

---

## AI Providers (4 providers, 36 tools)

| Provider | Kit ID | Tools | API Endpoint | Key Capabilities |
|----------|--------|-------|-------------|-----------------|
| **Claude** | `claude-ai` | 10 | `/api/claude` | Chat, extended thinking, vision, PDF, prompt caching, batches, token counting, tool use |
| **Gemini** | `gemini-intelligence` | 10 | `/api/google`, `/api/google-generate` | Chat, vision, image gen (Imagen), code execution, search grounding, structured output, embeddings |
| **OpenAI** | `openai-ai` | 6 | `/api/openai` | GPT-4o chat, DALL-E 3, embeddings, moderation, assistants, fine-tuning |
| **LM Studio** | `lmstudio-local` | 10 | `/api/lmstudio` | Local LLM chat, structured output, tool calling, embeddings, model load/unload, benchmarks |

---

## Microsoft 365 (5 kits, 34 tools)

All via single Microsoft OAuth → Microsoft Graph API.

| Kit | Tools | Capabilities |
|-----|-------|-------------|
| **Teams** | 8 | Teams, channels, messages (send/read), chats, presence, online meetings |
| **Outlook** | 7 | Mail (read/send/search), calendar events (list/create), contacts |
| **OneDrive** | 5 | Files, folders, search, recent, shared, storage quota |
| **SharePoint** | 4 | Sites, lists, list items, search |
| **Entra/M365** | 10 | Users, groups, members, apps, org info, Planner tasks, To Do, profile |

---

## Google Workspace (8 kits, 55 tools)

All via single Google OAuth.

| Kit | Tools | Capabilities |
|-----|-------|-------------|
| **Gmail** | 5 | Search, read, send, labels, overview |
| **Calendar** | 4 | Events, create, quick-add, overview |
| **Drive** | 5 | Search, recent, starred, storage, export |
| **Sheets** | 4 | Read, write, append, create |
| **Analytics (GA4)** | 14 | Reports, realtime, funnel, cohort, metadata, audiences, conversions, data streams, landing pages |
| **Search Console** | 10 | Queries, pages, URL inspect, sitemaps CRUD, country/device/daily breakdown |
| **Tag Manager** | 9 | Accounts, containers, tags CRUD, triggers CRUD, variables, versions, publish |
| **YouTube** | 17 | Search, video details, comments CRUD, playlists CRUD, video update, captions, demographics, traffic sources |

---

## Advertising (5 platforms, 62 tools)

| Platform | Kit | Tools | CRUD | Key Capabilities |
|----------|-----|-------|------|-----------------|
| **Google Ads** | `google-ads` | 17 | Full | Campaigns, ad groups, keywords CRUD, audiences, conversions, recommendations, GAQL, geo/device perf |
| **Meta Ads** | `meta-ads` | 18 | Full | Campaigns, ad sets, ads CRUD, creatives, pixels, lookalike audiences, lead forms, catalogs, Instagram |
| **Microsoft Ads** | `microsoft-ads` | 6 | Read + list | Campaigns, ad groups, ads, keywords, budgets |
| **TikTok Ads** | `tiktok-social` | 15 | Full | Campaigns, ad groups, ads CRUD, targeting, pixels, account/ad reports |
| **Bing Search** | `bing-search` | 6 | N/A | Web, news, images, videos, entities, trending |

---

## Social Media (5 platforms, 64 tools)

| Platform | Kit | Tools | CRUD | Key Capabilities |
|----------|-----|-------|------|-----------------|
| **X (Twitter)** | `twitter-social` | 19 | Full | Tweets CRUD, search, DMs, follow/unfollow, block, mute, lists CRUD, bookmarks, spaces |
| **LinkedIn** | `linkedin-social` | 12 | Full | Profile, posts CRUD, company, ad accounts, campaigns, creatives, analytics, org admin |
| **YouTube** | `youtube-media` | 17 | Full | See Google Workspace section |
| **Twitch** | `twitch-streaming` | 6 | Read | Users, streams, channels, clips, top games, search |
| **TikTok** | `tiktok-social` | 15 | Full | See Advertising section (combined kit) |

---

## Communications (11 kits, 68 tools)

| Service | Kit | Tools | Capabilities |
|---------|-----|-------|-------------|
| **Slack** | `slack-comms` | 6 | Channels, messages, users, search, overview |
| **WhatsApp** | `whatsapp-comms` | 6 | Text, templates, images, docs, interactive, profile |
| **Telegram** | `telegram-comms` | 6 | Messages, photos, polls, commands, moderation, webhooks |
| **Messenger** | `messenger-comms` | 4 | Text, templates, quick replies, page info |
| **Gmail** | `gmail-comms` | 5 | See Google Workspace section |
| **Outlook** | `microsoft-outlook` | 7 | See Microsoft section |
| **Twilio** | `twilio-comms` | 8 | SMS, WhatsApp, voice calls, verify, lookup |
| **SendGrid** | `sendgrid-email` | 4 | Send, templates, stats, overview |
| **Resend** | `resend-email` | 4 | Send, domains, audiences, overview |
| **Comms Sync** | `comms-sync` | 6 | Sync emails, calls, calendar, messaging, social into CRM |

---

## Voice & Audio (3 kits, 22 tools)

| Service | Kit | Tools | Capabilities |
|---------|-----|-------|-------------|
| **ElevenLabs** | `elevenlabs-voice` | 6 | TTS, voices, search, sound effects, models, overview |
| **Deepgram** | `deepgram-audio` | 4 | Transcription (nova-2), full intelligence (topics/sentiment/summary), models |
| **Vapi** | `vapi-voice` | 6 | AI assistants, outbound calls, phone numbers, workflows |

---

## Finance (3 kits, 22 tools)

| Service | Kit | Tools | Capabilities |
|---------|-----|-------|-------------|
| **Stripe** | `stripe-finance` | 6 | Customers, payments, subscriptions, invoices, balance, overview |
| **Plaid** | `plaid-finance` | 7 | Link tokens, accounts, balances, transactions, identity, institutions, holdings |
| **Treasury** | `treasury-finance` | 3 | Revenue/expenses records, upsert, P&L summary |

---

## CRM & Sales (3 kits, 22 tools)

| Service | Kit | Tools | Capabilities |
|---------|-----|-------|-------------|
| **HubSpot** | `hubspot-crm` | 8 | Contacts CRUD + search, deals CRUD, companies, tickets, pipelines, owners |
| **Internal CRM** | `crm-kit` | 3 | Contacts, deals, activities |
| **Campaigns** | `campaigns-marketing` | 3 | List, create, stats |

---

## Design & Development (4 kits, 26 tools)

| Service | Kit | Tools | Capabilities |
|---------|-----|-------|-------------|
| **Figma** | `figma-design` | 6 | Files, components, styles, exports, design tokens, overview |
| **GitHub** | `github-kit` | 4+ | Repos, PRs, commits, branches, tree, file content |
| **Linear** | `linear-pm` | 8 | Issues CRUD, projects, teams, cycles, labels, comments |
| **Sentry** | `sentry-monitoring` | 5 | Issues, resolve, projects, releases, overview |

---

## Infrastructure (7 kits, 40+ tools)

| Service | Kit | Tools | Capabilities |
|---------|-----|-------|-------------|
| **Cloudflare** | `cloudflare-kit` | 10+ | Workers, KV, R2, D1, zones |
| **Vercel** | `vercel-ops` | 2 | Deployments, projects |
| **Upstash** | `upstash-cache` | 6 | Redis get/set, lists, hashes, sorted sets, counters |
| **Docker** | `docker-kit` | 6 | Containers, images, volumes, networks |
| **Calendly** | `calendly-scheduling` | 4 | Events, event types, cancel, availability |
| **n8n** | `n8n-kit` | 3 | Workflows, executions, webhooks |
| **Local Server** | `local-server-kit` | 6+ | Filesystem, exec, process management |

---

## Platform Core (8 kits, 30 tools)

| Kit | Tools | Purpose |
|-----|-------|---------|
| **Memory** | 4 | Cross-session knowledge: list, save, delete, events |
| **Pipeline** | 4 | Unified work view: status, full sync, commits, memories |
| **Team** | 4 | Members, roles, venture assignments |
| **Treasury** | 3 | Financial records, P&L |
| **Ventures** | 4 | Portfolio management: list, get, create, update |
| **Campaigns** | 3 | Marketing campaigns |
| **FutureState** | 3 | RWA properties, portfolio, stats |
| **Comms Sync** | 6 | Cross-channel data synchronization |

---

## Storage & AI (6 kits, 16 tools)

| Kit | Tools | Purpose |
|-----|-------|---------|
| **Supabase Storage** | 4 | Cloud file operations |
| **Local Storage** | 3 | Filesystem operations |
| **Google Drive Storage** | 2 | Drive-backed storage |
| **AI Search** | 3 | Semantic search, auto-tagging |
| **Google RAG** | 2 | Retrieval-augmented generation |
| **MCP Bridge** | Dynamic | Unlimited tools via MCP server connections |

---

## OAuth Provider Reference (13 providers)

| Provider | Scopes | Callback URL |
|----------|--------|-------------|
| GitHub | `repo, read:org, read:user` | `/api/oauth/callback` |
| Google | Drive, Calendar, Gmail, Analytics, GSC, profile | `/api/oauth/callback` |
| Microsoft | Mail, Calendar, Files, Teams, SharePoint, Groups, Tasks | `/api/oauth/callback` |
| Notion | Workspace access | `/api/oauth/callback` |
| Cloudflare | `account:read, zone:read, worker:read` | `/api/oauth/callback` |
| Stripe | `read_write` (Connect) | `/api/oauth/callback` |
| Slack | `channels:read, chat:write, users:read` | `/api/oauth/callback` |
| Discord | `identify, guilds, guilds.members.read` | `/api/oauth/callback` |
| Linear | `read, write` | `/api/oauth/callback` |
| Figma | `files:read` | `/api/oauth/callback` |
| LinkedIn | `openid, profile, email, w_member_social` | `/api/oauth/callback` |
| Twitch | `user:read:email` | `/api/oauth/callback` |

---

## Environment Variables

See `.env.example` for the complete list of 100+ environment variables across all services.

Key sections:
- Core AI (Anthropic, Google AI, OpenAI, LM Studio)
- Auth (Clerk)
- Database (Supabase)
- OAuth Providers (13 client ID/secret pairs)
- OAuth Encryption (AES-256-GCM key)
- Voice (Deepgram, ElevenLabs, Vapi)
- Communications (Twilio, SendGrid, Resend, WhatsApp, Messenger, Telegram, Discord)
- Advertising (Google Ads, Microsoft Ads, Meta, TikTok)
- Search (Bing)
- Monitoring (Sentry)
- Scheduling (Calendly)
- CRM (HubSpot)
- Infrastructure (Cloudflare, Upstash, Vercel, n8n)
- Finance (Stripe, Plaid)

---

## Kit Development Guide

### Creating a New Kit

1. Create API endpoint: `api/my-service.ts`
2. Create kit file: `src/lib/kits/builtin/my-service-kit.ts`
3. Register in: `src/lib/kits/loader.ts`
4. Add to types: `src/lib/types/oauth.ts` (if OAuth)
5. Add env vars: `.env.example`
6. Update migration: `supabase/migration-oauth.sql` (if OAuth)

### Kit File Structure

```typescript
import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

// API helper function
async function myApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext) {
  const r = await ctx.fetch('/api/my-service', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) throw new Error('Service error');
  return r.json();
}

// Tool handlers
const myTool: KitToolHandler = async (input, ctx) => {
  const d = await myApi('action-name', { param: input.param }, ctx);
  return { success: true, data: d, displayMarkdown: `## Result\n\n${JSON.stringify(d)}` };
};

// Manifest
export const manifest: KitManifest = {
  id: 'my-service',
  name: 'My Service',
  version: '1.0.0',
  description: 'What this kit does.',
  author: 'MCV',
  capabilities: ['network', 'credentials'],
  runtime: 'inline',
  ventureScope: '*',
  tools: [
    { name: 'my_tool', description: 'What it does.', input_schema: { type: 'object', properties: { param: { type: 'string' } }, required: ['param'] } },
  ],
};

export const handlers: Record<string, KitToolHandler> = { my_tool: myTool };
```
