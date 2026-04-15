# MCV Capital × Content OS Integration

**Status**: v0.1 design + v0 implementation
**Depends on**: [PROTOCOL.md](./PROTOCOL.md), `migration-content-primitive.sql`
**Companion to**: [INTEROP.md](./INTEROP.md)

---

## Why

Every Capital artifact with text or attachments — term sheets, SAFE agreements, subscription agreements, quarterly investor updates, round long-form descriptions, pitch decks, OMs, data-room documents, commitment receipts — is *already* a document that needs:

- Versioning + revisions
- Draft → in-review → approved → executed workflow
- Private / internal / published / public visibility
- Scheduled publishing
- Investor-visibility gating
- SEO metadata (for public launchpad pages)
- OG image generation
- Sitemap inclusion
- RAG indexing so NAOS can answer "what's in the BetEdge SAFE?"
- Kit-generated provenance tracking

**Content OS already solves all of these.** Capital should not reinvent; it should **link**.

Before this spec, `capital_documents.file_url` was an opaque string pointing to whatever — S3 PDF, Google Drive link, random URL. After: `capital_documents.content_id` references a real `content` row, and the old `file_url` remains as a legacy fallback for documents that don't need rich-editing (raw PDFs uploaded once, never revised).

---

## Integration Points

### 1. `capital_documents.content_id` (new FK)

Nullable. When set, this document is a *live content row* — pull `body_markdown` and rendered HTML from Content OS. When null, behavior is unchanged (opaque URL).

### 2. New content types for Capital

Added to the informal enum in `content.content_type` (no DB enum; the column is `text` with documented values):

| content_type | Purpose | Typical visibility |
|---|---|---|
| `capital_round_description` | Long-form round body (thesis, team, roadmap, use of funds) — rendered on launchpad page | `public` |
| `capital_investor_update` | Quarterly / milestone update to committed investors | `internal` (gated to portal users) |
| `capital_term_sheet` | Structured term sheet content (optional — legacy `file_url` remains) | `internal` |
| `capital_safe_agreement` | SAFE template body (executed instance per commitment) | `internal` |
| `capital_subscription_agreement` | Subscription agreement body | `internal` |
| `capital_om` | Offering Memorandum | `internal` |
| `capital_pitch_deck_notes` | Deck narrative / speaker notes alongside the deck file | `internal` |
| `capital_announcement` | Round launch / closing announcements surfaced in portal banner | `public` |
| `capital_commitment_receipt` | Per-commitment receipt content (auditable, investor-visible) | `internal` |

These are not new tables — they are values in the existing `content.content_type` column.

### 3. `capital_round_content` junction table (new)

Many-to-many between rounds and content rows, typed by role:

```sql
create table if not exists capital_round_content (
  round_id      uuid not null references capital_rounds(id) on delete cascade,
  content_id    uuid not null references content(id) on delete cascade,
  role          text not null check (role in (
    'description', 'announcement', 'update', 'term_sheet', 'om',
    'pitch_deck_notes', 'safe_template', 'subscription_template', 'other'
  )),
  is_primary    boolean not null default false,
  ordinal       integer not null default 0,
  created_at    timestamptz not null default now(),
  primary key (round_id, content_id, role)
);
```

A round has at most one `is_primary=true` row per role. The primary `description` content is what Launchpad renders as the long-form body. The `update` role is the investor-update timeline.

### 4. `capital_commitments.receipt_content_id` (new optional FK)

Each funded commitment can reference a `content_type='capital_commitment_receipt'` row with the signed receipt body (amount, terms, signature manifest, anchor tx). Nullable; absent for pre-funded commitments.

---

## Consumer Patterns

### Launchpad `/p/[venture]/[round]` rendering

```
Load round via @mcv/capital-sdk
  → lookup capital_round_content WHERE role='description' AND is_primary=true
  → if found: fetch content body, render below KPI cards
  → if not:  fall back to round.description (short)
```

SEO metadata pulled from content.seo. Cover image from content.cover_media_id. OG image generated dynamically via `/api/og/capital-round/[roundId]` that composes venture brand + progress bar + title.

### Investor Portal — Updates timeline

```
Given investor has at least one commitment in round R:
  → list content WHERE role='update' AND round_id=R AND visibility IN ('internal','published','public')
  → ordered by published_at desc
  → render as timeline with Cmd+K search + filters
```

Sending a new update = `content.create({ content_type: 'capital_investor_update', ... })` + `capital_round_content.insert({ role: 'update' })` + auto-notify via `@mcv/fabric` event `capital.update.published`.

### RAG / NAOS Q&A

All Capital content rows auto-embed into `storage_chunks` (the Content OS indexer already handles source_type='content'). NAOS now answers:

- "What's the discount on the BetEdge SAFE?" → embeds find `capital_safe_agreement` content, Gemini extracts
- "Summarize the last FutureState investor update" → embeds find most recent `capital_investor_update`
- "Which rounds mention the MCP-Capital protocol?" → cross-venture semantic search

No new embedding pipeline needed.

### Capital Kit (NAOS) — new tools

Added to `capital-kit.ts`:

- `publish_investor_update(round_id, title, body_markdown, visibility)` — writes content + links via junction, publishes immediately or schedules
- `get_round_updates(round_id)` — returns update timeline
- `draft_round_description(round_id, title, body_markdown)` — creates the long-form description content (draft)

These are thin wrappers — content CRUD happens via `/api/content`, linking via `/api/capital` extension.

---

## Migration Path

**Additive, non-breaking.**

1. Migration `migration-capital-content-integration.sql`:
   - `alter table capital_documents add column if not exists content_id uuid references content(id) on delete set null`
   - `create table if not exists capital_round_content (...)`
   - `alter table capital_commitments add column if not exists receipt_content_id uuid references content(id) on delete set null`
   - Indexes on new FKs
   - RLS: open select; write requires auth.uid

2. No data migration of existing `capital_documents.file_url` rows — those stay as-is. New documents created via Content integration use `content_id`; legacy docs read from `file_url` unchanged.

3. Consumer rollout (in priority order):
   - Launchpad round page consumes description content (highest user-visible value)
   - Investor Updates surface in Desktop Capital RoundDetailView (internal value)
   - Round creation wizard optionally kicks off a description content draft (UX)
   - Commitment receipts linked to content rows (compliance value)
   - SAFE / sub agreement templates as content with parametric rendering (legal value, Epic 9 coupling)

---

## Schema cross-reference

| System | Table | Joins |
|---|---|---|
| Capital | `capital_rounds` | ↔ `capital_round_content.round_id` |
| Capital | `capital_documents` | → `content.id` via `content_id` |
| Capital | `capital_commitments` | → `content.id` via `receipt_content_id` |
| Content | `content` | ← `capital_round_content.content_id`, `capital_documents.content_id`, `capital_commitments.receipt_content_id` |
| Content | `content_revisions` | → `content.id` (unchanged, inherits versioning) |
| Content | `storage_chunks` | → `content.id` via source_type='content' (unchanged RAG) |

---

## Events (Capital × Content)

Emitted via `@mcv/fabric`:

- `capital.round.content_attached { round_id, content_id, role, is_primary }`
- `capital.update.published { round_id, content_id, title, visibility }`
- `capital.update.scheduled { round_id, content_id, scheduled_for }`
- `capital.document.linked_to_content { document_id, content_id }`
- `capital.commitment.receipt_created { commitment_id, content_id }`

Consumers: NAOS for digest generation, notifications engine for portal push, sitemap regeneration hook.

---

## Implementation Status

- ✅ **v0.1 spec** (this document)
- ✅ **Migration applied** (`migration-capital-content-integration.sql`)
- ✅ **capital-sdk extension** — `documentsService.createContentBackedDocument`, `attachContent`, `listRoundContent`, `createRoundDescription`, `publishInvestorUpdate`, `listRoundUpdates`
- ✅ **capital-kit extension** — 3 new NAOS tools
- ✅ **Launchpad rendering** — round page reads description content if present
- ✅ **Desktop surface** — Investor Updates section in CapitalRoundDetailView
- ⏳ **OG image generator for rounds** — Epic 15 follow-up
- ⏳ **Public announcement banner integration** — Epic 15 follow-up
- ⏳ **Content-driven legal templates (SAFE/subscription)** — paired with Epic 9 (MCV Sign) legal-template work

---

## References

- [Content OS Epic tree](../../scripts/seed-content-os-epic.ts) — Phases 1-6 in Supabase under suite='developer-ops', tags content-os:epN
- Content schema: `supabase/migration-content-primitive.sql`
- Content handler: `api/_handlers/content.ts`
- Content SDK: `src/lib/content/`
- Content kit: `packages/kits-sdk/src/builtin/content-kit.ts`
