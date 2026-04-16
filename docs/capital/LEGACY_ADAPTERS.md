# Legacy Adapters — Implementation Pattern

**Epic 13 · Shipped pattern reference**
**Companion to:** [INTEROP.md](./INTEROP.md) (long-term protocol vision) · [PROTOCOL.md](./PROTOCOL.md)

This document is the **implementation-grade** reference for every Legacy
Interop Adapter shipped in Capital. `INTEROP.md` describes the target
`LegacyAdapter<TForeign, TMCV>` contract we're building toward (kind /
direction / reconcile / health). **This** doc describes the minimal
contract in production today (id + fromForeign/toForeign) and the
shared infrastructure adapters plug into.

When INTEROP.md and this doc disagree, this doc wins for code — but
every adapter should be incrementally growing toward the INTEROP shape.

---

## Shipped Adapters (2026-04-15)

| ID        | Kind        | Direction  | Event shape              | File                                                                 |
|-----------|-------------|------------|--------------------------|----------------------------------------------------------------------|
| `plaid`   | payment     | inbound    | `CapitalPaymentEvent`    | [src/lib/capital/adapters/plaid-adapter.ts](../../src/lib/capital/adapters/plaid-adapter.ts) |
| `stripe`  | payment     | inbound    | `CapitalPaymentEvent`    | [src/lib/capital/adapters/stripe-adapter.ts](../../src/lib/capital/adapters/stripe-adapter.ts) |
| `ofac`    | compliance  | inbound    | `CapitalComplianceEvent` | [src/lib/capital/adapters/ofac-adapter.ts](../../src/lib/capital/adapters/ofac-adapter.ts) |
| `verify-investor` | compliance  | bidirectional | `CapitalComplianceEvent` | [src/lib/capital/adapters/verify-investor-adapter.ts](../../src/lib/capital/adapters/verify-investor-adapter.ts) |
| `docusign` | signing     | bidirectional | `CapitalSigningEvent` | [src/lib/capital/adapters/docusign-adapter.ts](../../src/lib/capital/adapters/docusign-adapter.ts) |

Outbound payment movement (distributions, payouts) does **not** live
here — it routes through `@mcv/payments-sdk`'s `PaymentProcessor`
abstraction. See §"Where does this belong?" below.

---

## Where does this belong? (decision tree)

```text
Is the integration moving money?
├─ YES  → @mcv/payments-sdk (PaymentProcessor)
│          Examples: Stripe card/ACH outbound, Solana USDC, Coinbase.
│          Consumed by BOTH Commerce and Capital via PaymentRouter.
│
└─ NO, it observes or reconciles ANY external event
   └─ Is the event Capital-specific?
      ├─ YES → src/lib/capital/adapters/* (this directory)
      │          Examples: Plaid wire/ACH recognition, Stripe inbound
      │          reconciliation, Carta contributions, TransferAgent
      │          ownership sync, OFAC match flags, DocuSign envelope
      │          completion.
      │
      └─ NO  → the adapter probably belongs in the feature-specific
               package (e.g. commerce-sdk for marketplace integrations).
```

**Stripe appears in BOTH locations** — it's the only integration that
does. As a `PaymentProcessor` in `@mcv/payments-sdk` it moves money out
for distributions; as a `LegacyAdapter` here it recognizes money coming
in to a commitment. Plaid is observer-only — it never appears in
payments-sdk.

---

## Shipped Contract (minimal)

```typescript
// src/lib/capital/adapters/types.ts
export interface LegacyAdapter<TForeign, TMCV> {
  id: string;
  fromForeign(event: TForeign): Promise<TMCV | null>;   // inbound
  toForeign?(event: TMCV): Promise<unknown>;            // outbound, optional
}
```

Inbound-only adapters (Plaid, Stripe inbound) omit `toForeign`.
Outbound-primary adapters (future DocuSign) will implement `toForeign`
thoroughly and leave `fromForeign` as the webhook-driven completion
handler.

### Inbound payment adapter → CapitalPaymentEvent

Every inbound-payment adapter emits this shape:

```typescript
export interface CapitalPaymentEvent {
  commitmentId: string | null;     // null → manual review required
  contactId: string | null;
  amountUsd: number;
  paymentMethod: 'wire_usd' | 'wire_cad' | 'wire_eur' | 'wire_gbp'
    | 'ach' | 'crypto_usdc' | 'crypto_usdt' | 'crypto_sol' | 'crypto_eth'
    | 'crypto_btc' | 'edge_token' | 'check' | 'other';
  paymentReference: string;        // durable external id (pi_…, txfr_…)
  postedAt: string;                // ISO
  rawEvent: unknown;
  matchDiagnostics: {
    strategy: string;              // what the adapter used to match
    candidates: number;
    unambiguous: boolean;
  };
}
```

**`paymentMethod` must match the `capital_commitments.payment_method`
CHECK constraint** in [supabase/migration-capital.sql](../../supabase/migration-capital.sql).
Stripe cards map to `'other'`; USD wires map to `'wire_usd'` (not
`'wire'`). This was a latent Plaid bug fixed in PR #23.

---

## The Matching Key Pattern

Every adapter that reconciles payments into commitments uses the same
three-factor match:

1. **Contact identity** via `crm_contacts.metadata.<rail>_<id>`:
   - `plaid_account_id` — stamped by [PlaidLinkButton](../../src/components/plaid/PlaidLinkButton.tsx) on Plaid Link success
   - `stripe_customer_id` — stamped by [StripeCustomerLinkButton](../../src/components/stripe/StripeCustomerLinkButton.tsx) on customer creation
   - *Future:* `carta_issuer_id`, `transfer_agent_account_id`, etc.
2. **Amount** within a configurable cents tolerance (default 0; $1 for Plaid wire fees).
3. **Date window** around the settlement/creation timestamp (default ±72h).

Adapters may add a **fast path** when the foreign event carries an
explicit `capital_commitment_id` in its metadata. Stripe does this on
Checkout Sessions originating from the Capital portal — we tag the
PaymentIntent at creation and match directly, skipping the three-factor
inference.

**Ambiguity is a signal, not an error.** When multiple open
commitments match all three factors, the adapter returns
`commitmentId: null` + `matchDiagnostics.candidates > 1` and the
reconcile helper fires a `capital.commitment.review_needed` notification
so an admin can pick the right one.

---

## Webhook Wiring (inbound flow)

```text
foreign webhook → your-webhook.ts
    │
    ├─ authenticate + emit to payment_events audit table
    │
    └─ if event matches inbound payment: 
         adapter = createXAdapter({ supabase, … })
         mapped = await adapter.fromForeign(foreignEvent)
         await reconcileCapitalPayment(mapped, {
           supabase,
           source: 'stripe' | 'plaid' | …,
           refLabel: 'Stripe payment',
         })
```

`reconcileCapitalPayment` (in [src/lib/capital/reconcile.ts](../../src/lib/capital/reconcile.ts)) handles:

- `null` event → skip (adapter rejected the foreign event).
- `commitmentId === null` → emit `capital.commitment.review_needed`.
- `commitmentId set` → call `engine.commitments.recordPayment` +
  emit `capital.commitment.reconciled`.

The helper never throws. Webhooks always `ACK 200`. A failed match is
operator-visible via the review_needed notification, not a retry storm.

### Fabric event parity

Every inbound match fires a notification with `metadata.topic` set to:
- `capital.commitment.reconciled` on 1:1 match
- `capital.commitment.review_needed` on ambiguous / unmatched

The cron notification dispatcher picks up the row and fans out to
Slack/email/webhook channels configured per-user. When `FABRIC_URL` is
set, the topic also publishes to the Fabric event bus for external
subscribers (portal, investor apps).

---

## Compliance Adapters (non-payment inbound)

OFAC (Epic 13 S6) is the first compliance adapter and proves the
pattern for every future non-payment inbound screener (AccreditedInvestor
verification, KYC vendors, consolidated-sanctions screeners).

### CapitalComplianceEvent shape

```typescript
export interface CapitalComplianceEvent {
  contactId: string;
  outcome: 'clear' | 'match' | 'review';
  score: number;                  // 0-1
  source: string;                 // 'ofac' | 'verify-investor' | 'jumio' | ...
  matchedRecord?: { name?; dob?; list?; programs?; sourceEntryId? };
  screenedAt: string;
  rawEvent: unknown;
  matchDiagnostics: { strategy: string; threshold: number; alternates?: number };
}
```

Compared to `CapitalPaymentEvent`, the shape is contact-scoped (no
commitment, no amount) and returns a tri-state outcome instead of a
match/null binary. `review` exists so name-only collisions (strong
name match but DOB absent or disagreeing) can be surfaced without
hard-blocking transactions.

**Outcome semantics generalize beyond sanctions.** For OFAC, `match`
means "matched a sanctioned entity." For VerifyInvestor (Epic 13 S9),
`match` means "vendor verified non-accredited" — the rule is "matched
a disqualifying state." The gate treats `match` as a hard block in
either case, so both adapters plug into the same
[compliance-gate](../../src/lib/capital/compliance-gate.ts) without
per-vendor branching.

### Outbound-then-webhook compliance adapters (VerifyInvestor pattern)

VerifyInvestor is bidirectional: outbound request creation + inbound
webhook completion. The outbound leg (`createVerificationRequest`)
returns a hosted URL the investor visits; the webhook completion fires
through the same `fromForeign` → `reconcileCapitalCompliance` path
OFAC uses, plus a **VC auto-issuance step** when
`outcome === 'clear'` — the webhook handler calls
`issueAccreditationCredential` (Epic 11) and stamps
`capital_investor_profile.metadata.vc` so the Epic 11 VC gate passes
on accredited-only rounds. Closes the loop between Epic 13 and
Epic 11.

When DocuSign and future outbound adapters ship, this pattern
(outbound factory function + inbound webhook mapping through
`fromForeign`) becomes the standard. A future refactor can fold the
outbound factory into the `LegacyAdapter` contract as a typed
`toRequest` method.

### reconcileCapitalCompliance helper

[src/lib/capital/compliance-reconcile.ts](../../src/lib/capital/compliance-reconcile.ts) is the
compliance-side counterpart to `reconcileCapitalPayment`. It:

- Stamps `capital_investor_profile.metadata.compliance.<source>` with
  the full event so downstream gates read one shape regardless of
  vendor.
- On `match` emits `capital.compliance.match` (notification type
  `error`).
- On `review` emits `capital.compliance.review_needed` (type `warning`).
- On `clear` stamps silently — no notification noise.

### Outcome → downstream gate (forward-looking)

Gates aren't shipped yet, but the outcome enum is designed to be the
single branch:

| Outcome | Commit create | Distribution | Portal access |
|---------|---------------|--------------|---------------|
| clear   | allow         | allow        | allow         |
| review  | allow w/ flag | allow w/ flag| allow         |
| match   | 403 block     | 403 block    | read-only     |

---

## Signing Adapters (CapitalSigningEvent)

DocuSign (Epic 13 S3) is the first signing-rail adapter. The
`CapitalSigningEvent` shape is **vendor-neutral** so MCV Sign (Epic 9,
native Ed25519 ESIGN/eIDAS replacement) and future eIDAS vendors plug
in as peer adapters without changing the reconcile path.

### CapitalSigningEvent shape

```typescript
export interface CapitalSigningEvent {
  commitmentId: string;
  outcome: 'signed' | 'declined' | 'voided' | 'expired';
  envelopeId: string;             // rail-issued, durable
  source: string;                 // 'docusign' | 'mcv-sign' | 'eu-sign' | …
  signers?: Array<{ name?; email?; role?; signedAt?; ipAddress? }>;
  receipt?: {                     // adapter populates one of:
    downloadUrl?: string;         //   pre-signed URL
    contentId?: string;           //   already in Content OS
    base64Pdf?: string;           //   inlined for small templates
    contentType?: string;
  };
  completedAt: string;
  rawEvent: unknown;
}
```

The receipt union is intentional — DocuSign Connect can ship the
signed PDF inline as base64 (when "Include Documents" is enabled),
MCV Sign will produce a contentId directly because the document
lives in the Content OS, and eIDAS vendors typically return a
pre-signed downloadUrl. The reconcile helper picks whichever route
the adapter populated.

### reconcileCapitalSigning helper

[src/lib/capital/signing-reconcile.ts](../../src/lib/capital/signing-reconcile.ts) is the
signing-side counterpart to `reconcileCapitalPayment` /
`reconcileCapitalCompliance`. It:

- Resolves `commitmentId` from the event OR from the
  `docusign_envelopes` table when the event lacks the custom-field
  stamp (older templates).
- On `outcome='signed'`: calls `engine.commitments.markSigned`
  (transitions `signed → pending_wire` per state machine), stamps
  `docusign_envelope_id` + `docusign_status` on the commitment, and
  upserts the envelope row for audit.
- On `declined` / `voided` / `expired`: stamps status without
  transitioning the commitment, fires a warning notification, and
  records an activity entry.
- Notifications fan out to `capital.commitment.signed` /
  `capital.commitment.declined` / `capital.commitment.voided` /
  `capital.commitment.expired` topics.

### Outbound flow (template-based envelopes)

DocuSign uses JWT-grant authentication with the integration key + RSA
private key + impersonated user. Templates are pre-configured in the
DocuSign account (subscription agreement variants per venture). The
caller picks the right `templateId`; signers + custom fields are
stamped programmatically.

When `DOCUSIGN_INTEGRATION_KEY` is absent, `createEnvelope` returns a
deterministic mock envelope so dev/preview/tests work without
procurement. The mock path keeps the same `EnvelopeSummary` shape so
swap-in is invisible to callers.

### Toward MCV Sign (Epic 9)

`CapitalSigningEvent` was deliberately designed before MCV Sign so
the migration plan is structural, not a rewrite:

1. MCV Sign ships as `src/lib/capital/adapters/mcv-sign-adapter.ts`
   implementing the same `LegacyAdapter<MCVSignEvent, CapitalSigningEvent>`
   contract.
2. A per-venture `signing_rail_config` row picks the adapter at runtime
   (`adapter: 'docusign' | 'mcv-sign'`) — same way payment routing
   works today.
3. The `docusign_envelopes` table is renamed to `signing_envelopes` in
   a follow-up migration; the `adapter` column already supports
   `mcv-sign` (CHECK constraint).
4. The `send-docusign` Capital action becomes `send-signing-envelope`
   with vendor selection delegated to the rail config.
5. Existing `engine.commitments.markSigned` + `attachDocuSign` SDK
   methods stay; `attachDocuSign` may rename to `attachEnvelope` once
   ≥2 rails are live but the column itself can keep its current name.

This keeps the cutover path purely additive — old DocuSign-signed
commitments continue to work; new commitments route to whichever rail
the venture configured.

---

## Outbound Adapter Notes (forward-looking)

Outbound-primary adapters have a different center of gravity:

- **DocuSign** (Epic 13 S3 — pending creds): primary direction is
  `toForeign(commitment) → envelope`. Webhook completion calls
  `fromForeign` to bind the commitment status.
- **Carta** (Epic 13 S4 — pending partnership): bidirectional. `toForeign`
  issues grants; `fromForeign` receives ownership updates.

When we ship the first outbound adapter, this doc expands with a
`CapitalCommitmentStatusEvent` shape analogous to `CapitalPaymentEvent`
and a `reconcileCapitalStatus` helper to match.

---

## Adding a New Adapter — checklist

1. **Decide placement** using the decision tree above.
2. **Create** `src/lib/capital/adapters/<name>-adapter.ts`. Implement
   `LegacyAdapter<YourForeignEvent, CapitalPaymentEvent>` (or a future
   status event shape).
3. **Match via** `crm_contacts.metadata.<rail>_<id>` — never roll a
   separate linking table; reuse the pattern.
4. **Emit** `CapitalPaymentEvent` with a descriptive
   `matchDiagnostics.strategy` string (e.g.
   `'stripe-customer+amount+date'`, `'carta-issuer+amount+round'`).
5. **Test** in `src/lib/capital/adapters/__tests__/<name>-adapter.test.ts`
   with the 8-case coverage pattern: fast-path, skip-commerce,
   skip-non-succeeded, skip-wrong-currency, unmatched, unambiguous,
   ambiguous, method-detection.
6. **Wire** the corresponding webhook (`api/_handlers/<rail>-webhook.ts`)
   to call `reconcileCapitalPayment` after its existing audit emission.
7. **Add the link button** under `src/components/<rail>/` if investors
   need to stamp the CRM metadata manually (PlaidLinkButton,
   StripeCustomerLinkButton are the references).
8. **Document** the adapter in the table at the top of this file and
   note any rail-specific quirks (fee tolerance, currency restrictions,
   metadata fast-paths).

---

## Appendix: Evolution to INTEROP.md Shape

Today's shipped contract is a strict subset of the INTEROP.md vision.
We'll grow toward the richer shape incrementally:

| INTEROP field  | Today           | When to add                                          |
|----------------|-----------------|------------------------------------------------------|
| `kind`         | implicit        | When first non-payment adapter ships (DocuSign = signing) |
| `direction`    | implicit        | Same — needed to classify DocuSign / Carta as bidirectional |
| `reconcile()`  | not yet         | When nightly reconciliation cron lands (Epic 13 S10?) |
| `health()`     | not yet         | When adapter dashboard lands (Epic 6 white-label)    |

The codebase will rename `fromForeign` → `toMcvEvent` and adopt the
richer shape in one breaking PR when `reconcile()` + `health()` become
necessary. Until then, adapters stay small.
