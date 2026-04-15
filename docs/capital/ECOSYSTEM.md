# MCV Capital × Ecosystem Integration Map

**Status**: v0.1 (reference implementation partial — see progress per-system)
**Companion to**: [PROTOCOL.md](./PROTOCOL.md), [INTEROP.md](./INTEROP.md), [CONTENT_INTEGRATION.md](./CONTENT_INTEGRATION.md)
**Audience**: NAOS agents, engineers, auditors — this is the training doc.

---

## Thesis: The Adapter Pattern Is Already Universal

Every MCV domain SDK already composes via **optional adapter injection**:

```typescript
createCommerceEngine({ supabase, ledger?, payments?, tax?, ... })
createCapitalEngine({ supabase, ledger?, payments?, notifier?, ventures? })  // this spec
createKitExecutionContext({ supabase, permissions?, sandbox?, ... })
```

This means Capital integrations aren't new architecture — they're just *passing the same adapters other SDKs already consume* into Capital. Every system in the MCV mesh becomes a potential amplifier of every other system, without any hard coupling.

The rule: **Capital SDK never hard-imports another domain SDK.** It defines a thin adapter interface matching the upstream contract (e.g., `LedgerAdapter` is imported from `@mcv/ledger-sdk/adapter` — the single shared contract). If an adapter is passed at engine construction, the behavior is enabled; if omitted, Capital falls back to stamp-only recording. No system breaks if another is absent.

---

## The Integration Map

```
                            ┌───────────────────────────┐
                            │    EdgeIQ Capital (SDK)   │
                            │  rounds · commitments ·   │
                            │  investors · distributions│
                            └──────────┬────────────────┘
                                       │
      ┌────────────────┬───────────────┼──────────────┬─────────────────┐
      │                │               │              │                 │
┌─────▼─────┐  ┌───────▼──────┐  ┌─────▼─────┐  ┌────▼──────┐  ┌──────▼──────┐
│  Ledger   │  │  Payments    │  │ Content   │  │ Ventures  │  │  Notifier   │
│  -SDK     │  │  Router      │  │ -OS       │  │ Registry  │  │  (+ Fabric) │
├───────────┤  ├──────────────┤  ├───────────┤  ├───────────┤  ├─────────────┤
│ Journal   │  │ Stripe       │  │ Round body│  │ Brand     │  │ notifications
│ entries   │  │ Solana USDC  │  │ Updates   │  │ Domain    │  │ table       │
│ Chart of  │  │ Plaid ACH    │  │ Receipts  │  │ clerk_org │  │ publishEvent
│ accounts  │  │ EDGE token   │  │ OM docs   │  │ Tier      │  │ capital.*.* │
│ Credit    │  │ Credits      │  │ RAG index │  │ White-    │  │ Fabric      │
│ accounts  │  │ Wire         │  │ SEO / OG  │  │ label CSS │  │ (future)    │
└───────────┘  └──────────────┘  └───────────┘  └───────────┘  └─────────────┘
      │                │               │              │                 │
┌─────▼────────────────▼───────────────▼──────────────▼─────────────────▼─────┐
│                           Desktop Supabase (SOR)                            │
│  capital_rounds · capital_commitments · capital_distributions ·             │
│  capital_round_content · ventures · content · notifications · activities   │
└─────────────────────────────────────────────────────────────────────────────┘
      │
┌─────▼───────────────────────────────────────────────────────────────────────┐
│                    Consumers                                                │
│  - Desktop Capital UI (views/CapitalGlobalView, CapitalRoundDetailView)     │
│  - apps/launchpad (public raise pages + widgets)                            │
│  - Futurestate investor portal (apps/investor/src/app/(dashboard)/capital)  │
│  - NAOS chat via @mcv/kits-sdk/builtin/capital-kit (19 tools now)           │
│  - Third-party adopters via @mcv/capital-sdk workspace contract             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Per-System Integration

### 1. Capital × @mcv/ledger-sdk

**Contract**: `LedgerAdapter` (from `@mcv/ledger-sdk/adapter`):
```typescript
interface LedgerAdapter {
  getAccountByCode(ventureId: string, code: string): Promise<LedgerAccountRef | null>;
  createJournalEntry(input: LedgerJournalEntryInput): Promise<LedgerJournalEntryRef>;
  postJournalEntry(entryId: string, postedBy: string): Promise<unknown>;
}
```

**Capital side**: `createCapitalEngine({ ledger: createLedgerEngine({...}).ledger })` enables:
- **Commitment funded** → journal entry `DR 1010 Cash / CR 2350 Equity Subscription Payable` (per-venture chart).
- **Round closed and funded** → reclassify `DR 2350 Equity Subscription / CR 3000 Common Stock (or Token Reserve)`.
- **Distribution paid** → journal entry `DR 3900 Retained Earnings / CR 1010 Cash` (dividend) or `DR 6200 Interest Expense / CR 1010 Cash` (note interest).
- **Refund** → reversal via `reverseJournalEntry`.

Adapter is **optional**. Without it, recordPayment stamps `funded_at` + status only, which is the v0 behavior we already ship. With it, every money movement generates an auditable double-entry row.

Account codes (standard MCV chart, provisioned by `provisionVentureAccounts`):
- 1010 Cash · 1025 AR · 2350 Equity Subscription Payable
- 3000 Common Stock · 3100 Preferred Stock · 3200 Token Reserve
- 3900 Retained Earnings · 4000 Revenue · 6200 Interest Expense

### 2. Capital × @mcv/payments-sdk

**Contract**: `PaymentRouter` singleton (set via `setSharedPaymentRouter`). Built-in processors: Stripe, Solana, Plaid; Credits processor injected by host app.

**Capital side**: `commitments.recordPayment` checks `getSharedPaymentRouter()`:
- If router registered → dispatch via `router.processPayment({ method, amount, currency, ... })` → store resulting `payment_reference`.
- If router null → stamp-only (v0 behavior).

Capital-sdk never imports payments-sdk directly; it reads the shared singleton by string key so bundle graphs stay clean.

Methods supported end-to-end (via existing processors): `wire_usd` / `wire_cad` / `wire_eur`, `ach`, `crypto_usdc` / `crypto_sol`, `edge_token`, `platform_credit`.

### 3. Capital × Content OS

Fully shipped in Epic 15 (commit `e70dda8`). See [CONTENT_INTEGRATION.md](./CONTENT_INTEGRATION.md).

### 4. Capital × Ventures Registry

**Contract**: `ventures.id` TEXT PK + `@mcv/ventures-sdk/white-label` helpers.

**Capital side**:
- New FK `capital_rounds.venture_id REFERENCES ventures(id) ON DELETE RESTRICT` — enforces referential integrity; previously FK-free.
- `ventures-bridge.ts` in capital-sdk — `resolveVentureBrand(ventureId)`, `listRoundsForVenture(ventureId)`, `isVentureClerkOrg(venture, jwtOrgId)` utilities.
- Launchpad `/p/[venture]/[round]` → calls `applyBrandTokens(venture)` on mount so the round page renders under the venture's own brand (CSS vars cascading into `lp-*` classes + favicon swap).
- Launchpad round page OG image pulls `venture.icon` + `venture.color` for dynamic composition (Epic 15 follow-up).
- Access gating: `venture.clerk_org_id` becomes the allowed `org_id` JWT claim for private raises.

### 5. Capital × Notifications / Comms Hub

**Contract**: `notifications` table in Desktop Supabase. Helper pattern:
```typescript
await notify('info', 'Round funded', 'BetEdge Seed closed at $1.2M', 'capital', 'betedge');
```

**Capital side**: new `publishCapitalEvent` helper in `api/_handlers/capital.ts` fires:
- `notify()` inserting into `notifications` with `source='capital'` + `venture_id`
- Emits `capital.*.*` topic to Fabric (when available)
- Records to `capital_activities` timeline (already wired)

All three write paths are best-effort — any one failing doesn't block the primary mutation.

Events emitted:
- `capital.commitment.created` · `capital.commitment.funded` · `capital.commitment.signed`
- `capital.round.opened` · `capital.round.closed` · `capital.round.funded`
- `capital.update.published` · `capital.distribution.paid`
- `capital.investor.portal_enabled` · `capital.investor.stage_advanced`

Consumers: NotificationCenter bell in Desktop, investor-portal polling endpoint (Futurestate), CommsHub analytics tab (future: Capital-flavored digest).

### 6. Capital × CRM

Shipped in Epic 2 — InvestorsPanel tab + satellite `capital_investor_profile` on `crm_contacts`. `ContextCommsMenu` is reused on investor rows to one-click email/SMS/Slack an investor.

### 7. Capital × Epic/Story Pipeline

`capital_epic_links` junction (shipped in Epic 1) ties rounds → epics so EpicBoardView reflects fundraising progress alongside feature work. Round state changes can auto-create epic tasks (e.g., round opens → generate "Compliance check" task); not yet wired — Epic 6 hardening scope.

### 8. Capital × Kits-SDK / NAOS

`capital-kit` (v0.1, 19 tools after this session). Every major Capital operation is an agent tool:
- Round lifecycle: `list_rounds`, `get_round_detail`, `create_commitment`, `update_commitment_status`, `distribute_round` (new), `notify_investors` (new)
- Investor management: `list_investors`, `get_investor_position`, `get_pipeline_health`
- Content: `publish_investor_update`, `get_round_updates`, `draft_round_description`
- Financial: `record_payment`, `record_payment_with_journal` (new), `send_docusign`, `distribute_tokens`
- Ecosystem: `set_venture_feature` (new) to flip venture-level capital flags
- Summary: `get_capital_summary`

---

## Composition Rules (The Invariants)

1. **No cross-SDK hard imports.** Capital-sdk imports types from `@mcv/ledger-sdk/adapter`, `@mcv/payments-sdk/router` — these are contract-only subpaths. No service implementation is dragged in.

2. **All adapters optional at engine construction.** `createCapitalEngine({ supabase, ledger?, payments? })` — supabase is the only required dep. Missing adapters = degraded mode, not errors.

3. **Events are best-effort + append-only.** `publishCapitalEvent` failures log and continue. The primary mutation (Supabase write) is atomic and the source of truth.

4. **Junction tables carry all cross-domain relationships.** `capital_round_content`, `capital_epic_links`, `capital_contact_ventures` — no FK marries two domain roots. This keeps each system independently deployable and migratable.

5. **Brand + auth flow from ventures registry.** Capital never hardcodes a color, a domain, or an org_id. Everything is resolved from `ventures.id`. This enables multi-tenancy and white-label from day one.

6. **Activity timeline is the unified audit trail.** `capital_activities` + `activities` (CRM) + `audit_log` (core) compose via `contact_id` and `actor_id`. Every Capital event should also write an activity row for investor-facing transparency.

---

## What This Looks Like In Practice

**Scenario**: Tony opens a new BetEdge seed round.

1. `useCreateRound` mutation → Capital SDK `rounds.createRound` → Supabase insert
2. `publishCapitalEvent('capital.round.created', { ...round })`
   - → `notify('info', 'Round created', '...', 'capital', 'betedge')` — NotificationCenter bell pings
   - → `capital_activities` entry with `actor_id=tony`
   - → (future) Fabric topic fanout to any registered consumer
3. Round status advances to `open` → `capital.round.opened` event
   - → notify `source='capital'` to all internal MCV users
   - → trigger `capital_announcement` content draft via `draft_round_description` kit (optional)
4. Investor commits via launchpad → Futurestate commitment wizard → `commitments.createCommitment`
   - → `capital.commitment.created` event fires
   - → NAOS sees it via shared event bus and optionally auto-enriches contact profile
5. Investor wires funds → `commitments.recordPayment`
   - → If `PaymentRouter` configured: route through Stripe or Solana processor
   - → If `LedgerAdapter` configured: `createJournalEntry(DR Cash / CR Equity Subscription)` + `postJournalEntry`
   - → Capital activity row written
   - → `capital.commitment.funded` event emitted
   - → Tony sees notification; round progress bar updates via Realtime on both Desktop and launchpad
6. Round closes, funds allocated → `distributions.distribute(round_id)` (new)
   - → Loops committed investors, issues `payment_request` per investor via PaymentRouter
   - → Each settlement creates a journal entry via LedgerAdapter
   - → `capital.distribution.paid` event per investor

Every step composes across five systems (Capital, Ledger, Payments, Notifications, Content-linked-docs). Zero hard coupling. Any system absent = degraded gracefully, not broken.

---

## Implementation Status

| System | Contract | Adapter | Kit tools | UI | Tests |
|---|---|---|---|---|---|
| Content OS | ✅ shipped | ✅ | ✅ 3 | ✅ | ✅ 5 |
| Ledger | ✅ exists | ✅ new | ✅ new 1 | ⏳ | ✅ new |
| Payments | ✅ exists | ✅ new | reuses | ⏳ | ⏳ |
| Notifications | ✅ exists | ✅ new | ✅ new 1 | ⏳ | ⏳ |
| Ventures | ✅ exists | ✅ new | ✅ new 1 | ⏳ (Launchpad) | ⏳ |
| Epic pipeline | ✅ shipped | reuses | reuses | ✅ | — |
| CRM | ✅ shipped | reuses | reuses | ✅ | — |
| Fabric (events) | exists in core-triangle | ⏳ | ⏳ | ⏳ | ⏳ |

Epic 16 (Ecosystem Integration Bus) tracks the remaining work.

---

## References

- [PROTOCOL.md](./PROTOCOL.md) — MCP-Capital v0.1 spec
- [INTEROP.md](./INTEROP.md) — Legacy Adapter pattern
- [CONTENT_INTEGRATION.md](./CONTENT_INTEGRATION.md) — Content OS integration
- `@mcv/ledger-sdk/adapter` — LedgerAdapter contract
- `@mcv/payments-sdk/router` — PaymentRouter + shared singleton
- `@mcv/ventures-sdk/white-label` — brand token cascade
- `api/_handlers/crm.ts` — canonical `notify()` helper pattern
