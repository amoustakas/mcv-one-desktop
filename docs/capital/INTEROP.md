# MCV Capital — Legacy Interop Adapter Pattern

**Epic 13 foundation** · Part of [MCV Capital Protocol v0.1](./PROTOCOL.md)

---

## Why Interop (instead of Competition)

Every incumbent in capital formation — Carta, DocuSign, Vertalo, Securitize, transfer agents, ATSs, Stripe, banks — has sunk cost, switching cost, and regulatory cover that will keep them in the market for years. Trying to convince every LP, every fund admin, every old-school law firm to stop using Carta is unwinnable head-on.

**The judo move**: we don't replace them in the customer's eyes. We sit *underneath* them. Our protocol becomes the actual system of record; their tools become read replicas, signature gateways, or payment rails. The LP still sees "Carta report," the counterparty still signs a DocuSign envelope — but the cap table, the signature binding force, and the settlement all flow through MCV Capital.

Once the protocol holds the volume, the incumbents either ship MCV Capital connectors (Layer 5 in PROTOCOL.md §Adoption Ladder) or lose customers to issuers who do. Either outcome grows the standard.

---

## Adapter Contract

Every Legacy Interop Adapter conforms to the same shape:

```typescript
export interface LegacyAdapter<TForeignEvent, TMCVEvent> {
  readonly id: string;                    // 'docusign' | 'stripe' | 'carta' | ...
  readonly kind: 'signing' | 'payment' | 'registry' | 'secondary' | 'export';
  readonly direction: 'inbound' | 'outbound' | 'bidirectional';

  // Inbound: convert a foreign event into an MCV protocol event
  toMcvEvent?(foreign: TForeignEvent): Promise<TMCVEvent>;

  // Outbound: render an MCV event into the foreign system's shape
  toForeign?(event: TMCVEvent): Promise<TForeignEvent>;

  // Reconciliation: given time window, produce diff report
  reconcile(since: string, until: string): Promise<ReconciliationReport>;

  // Health check for dashboards
  health(): Promise<{ ok: boolean; latencyMs: number; error?: string }>;
}

export interface ReconciliationReport {
  adapterId: string;
  window: { since: string; until: string };
  mcvCount: number;
  foreignCount: number;
  matched: number;
  missingInMcv: Array<{ foreignId: string; summary: string }>;
  missingInForeign: Array<{ mcvId: string; summary: string }>;
  divergent: Array<{ mcvId: string; foreignId: string; fields: string[] }>;
}
```

Three invariants:
1. **Idempotency**: `toMcvEvent` called with the same foreign event twice yields the same MCV event. Duplicate foreign events are safe.
2. **Auditability**: every translated event carries `metadata.adapter = { id, direction, foreignId, translatedAt }` so every row in our ledger traces back to its origin in the foreign system.
3. **Reconciliation**: at any time, we can prove the foreign system and our ledger are in sync. Divergence is measurable and actionable.

---

## Adapter Catalog

### 1. DocuSignAdapter (inbound)

**Kind**: signing
**Direction**: inbound (mirror envelope completion → MCV Sign receipt)
**Trigger**: DocuSign webhook on envelope-completed event

```
DocuSign envelope completed
  → webhook → toMcvEvent
  → capital.commitment.signed event
  → commitment.markSigned() + anchor PDF hash to capital_documents
```

Acceptance criteria:
- DocuSign Connect webhook signature verified
- Commitment state machine advances `pending_docs` → `signed`
- PDF hash stored in `capital_documents.metadata.sha256`
- Reconciliation compares `docusign.envelope.completed_count` vs `count(capital_commitments WHERE docusign_status='completed')` per window

### 2. StripeAdapter (inbound)

**Kind**: payment
**Direction**: inbound (card/ACH/wire → USDC escrow → MCV settlement)

```
Stripe PaymentIntent succeeded
  → webhook → toMcvEvent
  → (optional) Stripe Crypto on-ramp → USDC → escrow PDA
  → capital.commitment.funded event
  → commitment.recordPayment()
```

Acceptance criteria:
- Stripe webhook signature verified
- Payment method recorded (wire/ACH/card) in commitment.payment_method
- Reference captured (`pi_...` → `commitment.payment_reference`)
- For USDC settlement path, Solana tx sig stored in metadata
- Reconciliation: Stripe PaymentIntents vs `capital_commitments WHERE payment_method IN (card, ach, wire_*)` per window

### 3. WireReconciliationAdapter (manual + bank API)

**Kind**: payment
**Direction**: inbound
**Covers**: LP corner case where DocuSign + Stripe aren't enough and the LP wires funds directly.

Today: manual entry via `recordPayment` API with reference. Future: Plaid/Mercury/Column API to auto-match incoming wires by reference number.

### 4. TransferAgentAdapter (outbound)

**Kind**: registry
**Direction**: outbound (broadcast nightly snapshot to partner TAs)

```
Every night at 00:05 UTC
  → snapshot(capital_rounds + capital_commitments + capital_investor_profile)
  → render to Carta CSV or SS&C XML
  → upload to partner TA endpoint
  → record checksum + timestamp in capital_activities
```

Acceptance criteria:
- Deterministic output (same input = byte-identical CSV)
- Row-level signing (Merkle tree over rows) for tamper evidence
- Reconciliation: snapshot checksum matches TA acknowledgment
- One-way only (TA never writes back to our ledger)

### 5. CartaExportAdapter (outbound)

**Kind**: export
**Direction**: outbound
**Covers**: LPs who demand Carta reports for their own audit.

Monthly or on-demand generation of Carta-format cap table + ownership + waterfall CSVs. No API integration — it's an export, period. Our Capital UI surfaces a "Download Carta-format report" button per round.

### 6. AtsAdapter (bidirectional)

**Kind**: secondary
**Direction**: bidirectional
**Covers**: FINRA-reported secondary via partner ATS.

```
Investor posts sell order in MCV Secondary
  → optionally broadcast to partner ATS for additional discovery
  → match → settle → MCV Secondary records the trade
  → daily ATS report published to FINRA (via partner)
```

Acceptance criteria:
- Compliance check runs twice (ours + theirs); match only proceeds on dual-pass
- Trade events appear in both ledgers within 60s
- Reconciliation: daily matched-count comparison

### 7. PlaidAdapter (inbound)

**Kind**: payment (support)
**Direction**: inbound (bank account verification for wire ACH flows)

Not strictly needed for the base protocol — but reduces wire-reference-matching errors. Investor links bank account via Plaid, we reconcile incoming wires against that account.

### 8. AccountingExportAdapter (outbound)

**Kind**: export
**Direction**: outbound
**Covers**: Issuer accountants who run QuickBooks / Xero.

Monthly JE export:
- Debit: cash (equity raised)
- Credit: equity / convertible liability / token deferred revenue (depending on instrument)

Distribution events export as:
- Debit: retained earnings (dividend) or expense (interest)
- Credit: cash

Deterministic CSV + IIF (QuickBooks) format. No API integration initially.

### 9. OFAC / Sanctions Screening Adapter (inbound)

**Kind**: compliance
**Direction**: inbound (block commitment if investor is sanctioned)

On every `upsertInvestorProfile`, run the wallet/email/name through sanctions screening. Commitment creation blocks if any hit. Audit log captures every check (pass or fail).

Provider-agnostic: Chainalysis, Elliptic, or OFAC SDN list. Each is a plug-in.

---

## Adapter Lifecycle

Adapters live in `packages/capital-adapters/<name>/`. Each is:
- A workspace package (`@mcv/capital-adapter-<name>`)
- Implements the `LegacyAdapter` interface
- Includes conformance tests (round-trip translation + reconciliation)
- Ships independently of other adapters

Installation is opt-in per MCV venture (e.g., BetEdge uses DocuSign + Stripe; FutureState uses Stripe + Plaid only). Opt-in happens via the `venture_integrations` table (already exists — row per `(venture_id, adapter_id)` with config JSON).

---

## Conformance Test Suite

Every adapter ships with a conformance suite that proves:

1. **Translation round-trip**: foreign event → MCV event → foreign event yields byte-identical output for bidirectional adapters.
2. **Idempotency**: same foreign event processed twice produces zero duplicate MCV rows.
3. **Reconciliation correctness**: given a known divergence set, `reconcile()` reports it accurately.
4. **Failure mode**: foreign system unavailable produces a retryable error, not silent data loss.
5. **Audit completeness**: every translated event has adapter metadata.

Conformance results dashboard surfaces adapter health per venture.

---

## Where This Lands in the Ecosystem

Adapters plug into existing MCV infrastructure without new primitives:

| Adapter | Consumes | Produces | Uses Existing System |
|---|---|---|---|
| DocuSign | DocuSign webhook | `capital.commitment.signed` event | `@mcv/capital-sdk` commitments service |
| Stripe | Stripe webhook | `capital.commitment.funded` event | `@mcv/payments-sdk` Stripe processor |
| TransferAgent | Nightly cron | CSV upload to TA | `@mcv/kits-sdk` cloudflare-kit or S3 |
| Carta | On-demand request | CSV download | `@mcv/capital-sdk` dashboard service |
| ATS | Bidirectional API | FINRA reports | `@mcv/capital-sdk` commitments + new secondary service |
| Plaid | Plaid webhook | Verified bank account in `capital_investor_profile.metadata` | `@mcv/kits-sdk` plaid-kit (already exists) |
| Accounting | On-demand request | QuickBooks/Xero CSV | `@mcv/ledger-sdk` journal export |
| OFAC | Provider API | Block flag on investor | `@futurestate/mcv-sdk` compliance bridge |

**Nothing new gets built to ship any individual adapter.** The compose-from-kits pattern means each adapter is a few hundred lines of TypeScript gluing existing primitives together.

---

## Adapter Strategy by Adoption Layer

Layer 0-1 (internal + FutureState dogfood): 0 adapters needed — our SDK + manual fallbacks cover everything.

Layer 2 (invited launchpad): DocuSign + Stripe adapters. That's enough for any US/Canada startup to run a SAFE raise.

Layer 3 (public launchpad): add Plaid (bank verification), OFAC (sanctions screen), AccountingExport (monthly JE to issuer's QuickBooks). Self-serve reg_d_506c + reg_cf + mi_45_110 paths.

Layer 4 (third-party platforms integrating): TransferAgent + ATS adapters. Other launchpads and regulated brokers plug in and stay compliant with their existing audit chains.

Layer 5 (legacy capitulation): Carta export is the killer. Once LPs can get their Carta-format reports from MCV directly, they stop demanding their portcos use Carta. Cap table SaaS revenue gets cannibalized.

Layer 6 (regulatory): OFAC adapter exposed as protocol-level requirement for Reg-D / Reg-CF offerings, formalizing our compliance bar as industry-standard. SEC notice-and-comment uses our conformance suite as the proposed standard.

---

## Implementation Priority

Given current work (Epic 13 broken into stories — see Epic tree):

1. **DocuSignAdapter** (Epic 9 Story 4, reserved) — pairs with MCV Sign launch
2. **StripeAdapter** (Epic 10 Story 3, reserved) — pairs with MCV Settlement launch
3. **TransferAgentAdapter** — standalone, unlocks Layer 4 conversations
4. **CartaExportAdapter** — standalone, unlocks LP sell-in
5. **PlaidAdapter** — already partial via `@mcv/kits-sdk` plaid-kit; wrap as adapter
6. **OFAC adapter** — unlocks regulated raises; integrate with Futurestate's existing AML pipeline
7. **AtsAdapter** — deferred until Layer 4 demand
8. **AccountingExport** — deferred; customer-driven prioritization

Each adapter is independently shippable. None block any other.

---

## References

- Protocol spec: [PROTOCOL.md](./PROTOCOL.md)
- DocuSign Connect: https://developers.docusign.com/platform/webhooks/connect/
- Stripe webhooks: https://docs.stripe.com/webhooks
- Carta CSV format: https://support.carta.com/ (issuer-accessible)
- Plaid: https://plaid.com/docs/
- OFAC SDN list: https://home.treasury.gov/policy-issues/financial-sanctions/specially-designated-nationals-and-blocked-persons-list-sdn-human-readable-lists
