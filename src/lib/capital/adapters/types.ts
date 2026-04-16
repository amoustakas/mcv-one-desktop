// Capital LegacyAdapter — shared contract types.
//
// Epic 13 (Legacy Interop). Every adapter that maps foreign payment/status
// events into Capital implements this contract. By centralising the shape
// here we guarantee that Plaid, Stripe, Carta, TransferAgent, OFAC etc.
// all emit the same CapitalPaymentEvent, which the shared reconcile helper
// knows how to drive.
//
// Decision tree — which package does an integration belong in?
//   • @mcv/payments-sdk  → bidirectional money movement (PaymentProcessor).
//                          Stripe, Solana, Coinbase live here.
//   • src/lib/capital/adapters/  → inbound-only recognition (LegacyAdapter).
//                          Plaid, Stripe-webhook-mirror, Carta live here.
//
// Stripe appears in BOTH locations because it has two roles:
//   1. Outbound processor (payments-sdk) — Capital distributions pay via it.
//   2. Inbound reconciliation adapter (here) — card/ACH payments *into* a
//      commitment must be recognized. This is the Plaid-equivalent for the
//      Stripe rail; it observes, it does not move money.

/** LegacyAdapter<TForeign, TMCV>
 *  @param TForeign  the foreign system's event shape (PlaidTransferSettled,
 *                   Stripe.PaymentIntent, DocuSignEnvelopeCompleted…).
 *  @param TMCV      the MCV-normalised event emitted back to the capital
 *                   engine. Usually CapitalPaymentEvent, but adapters like
 *                   DocuSign will emit a CapitalCommitmentStatusEvent.
 */
export interface LegacyAdapter<TForeign, TMCV> {
  id: string;
  /** Map foreign event → MCV event (inbound path). Null = skip this event. */
  fromForeign(event: TForeign): Promise<TMCV | null>;
  /** Map MCV event → foreign payload (outbound). Optional — some adapters
   *  are read-only (Plaid). Outbound-primary adapters (DocuSign) will
   *  implement this half thoroughly and leave fromForeign for the webhook. */
  toForeign?(event: TMCV): Promise<unknown>;
}

/** The MCV-shaped payment event emitted by inbound-payment adapters.
 *  Every adapter matching commitments (Plaid, Stripe-inbound, ACH-direct,
 *  Carta contributions…) returns this shape. */
export interface CapitalPaymentEvent {
  commitmentId: string | null;   // null → no unambiguous match → manual review
  contactId: string | null;
  amountUsd: number;
  // Must match the `capital_commitments.payment_method` CHECK constraint
  // (supabase/migration-capital.sql). Cards map to 'other' because the
  // SDK enum is rail-agnostic and 'card' is not a listed method. Wire
  // rails use the currency-specific values (wire_usd, wire_cad, …).
  paymentMethod:
    | 'wire_usd' | 'wire_cad' | 'wire_eur' | 'wire_gbp' | 'ach'
    | 'crypto_usdc' | 'crypto_usdt' | 'crypto_sol' | 'crypto_eth' | 'crypto_btc'
    | 'edge_token' | 'check' | 'other';
  paymentReference: string;       // durable external id (transfer_id, payment_intent.id, …)
  postedAt: string;
  rawEvent: unknown;
  matchDiagnostics: {
    strategy: string;             // e.g. 'plaid-account+amount+date', 'stripe-customer+amount+commitment-metadata'
    candidates: number;
    unambiguous: boolean;
  };
}

/** The MCV-shaped compliance event emitted by non-payment inbound
 *  adapters that perform investor screening (OFAC, sanctions lists,
 *  AccreditedInvestor verification, KYC vendors…).
 *
 *  Not a payment. Not commitment-scoped. Contact-scoped. Result lands
 *  on `capital_investor_profile.metadata.compliance.<source>` via the
 *  reconcile helper so downstream gates (commit creation, distribution
 *  eligibility, portal access) can read a consolidated status without
 *  hitting each source individually. */
export interface CapitalComplianceEvent {
  contactId: string;
  /** 'clear' | 'match' | 'review' — distilled across all hit/score rules.
   *  Gates can branch on this without parsing per-source semantics. */
  outcome: 'clear' | 'match' | 'review';
  /** Screener-specific raw score (0-1 for fuzzy matches; boolean-like
   *  screeners emit 0 or 1). */
  score: number;
  /** Source adapter id, e.g. 'ofac', 'verify-investor', 'jumio'. */
  source: string;
  /** Human-readable match record when outcome !== 'clear'. */
  matchedRecord?: {
    name?: string;
    dob?: string;
    list?: string;              // e.g. 'SDN', 'ConsolidatedSanctions'
    programs?: string[];        // e.g. ['CUBA', 'NARCOTICS']
    sourceEntryId?: string;     // vendor's primary key
  };
  screenedAt: string;           // ISO timestamp
  rawEvent: unknown;
  matchDiagnostics: {
    strategy: string;           // e.g. 'ofac-fuzzy-name+dob'
    threshold: number;          // score >= threshold → outcome !== clear
    alternates?: number;        // count of other candidates scored above 0.5 but below threshold
  };
}

/** The MCV-shaped signing event emitted by signing-rail adapters when
 *  a contract envelope completes (signed, declined, voided, expired).
 *  Adapters: DocuSign today, MCV Sign next (Epic 9), eIDAS vendors
 *  (eu-sign, etc.) over time.
 *
 *  This shape is **vendor-neutral on purpose** — the rail-specific
 *  envelope id, signer details, and receipt artifacts are passed
 *  through `rawEvent`. Downstream handlers transition the commitment
 *  status (signed → pending_wire) and stamp the signed PDF receipt
 *  via the Content OS so the same audit trail works regardless of
 *  which signing rail produced it. */
export interface CapitalSigningEvent {
  commitmentId: string;
  /** 'signed'   = all signers completed; binding contract
   *  'declined' = signer rejected; commitment can be re-sent or withdrawn
   *  'voided'   = sender cancelled the envelope before completion
   *  'expired'  = envelope hit its expiration without all signatures */
  outcome: 'signed' | 'declined' | 'voided' | 'expired';
  /** Rail-issued envelope id, durable across rail-side reissues. */
  envelopeId: string;
  /** Source adapter id — 'docusign' | 'mcv-sign' | 'eu-sign' | … */
  source: string;
  /** Per-signer state. Empty for non-completion outcomes. */
  signers?: Array<{
    name?: string;
    email?: string;
    role?: string;
    signedAt?: string;
    ipAddress?: string;
  }>;
  /** Storage hint for the signed-PDF receipt — adapter populates one
   *  of {downloadUrl, contentId, base64Pdf}. signing-reconcile picks
   *  the available route to persist into Content OS. */
  receipt?: {
    downloadUrl?: string;       // pre-signed URL valid for download
    contentId?: string;         // already in Content OS
    base64Pdf?: string;         // inlined for small templates
    contentType?: string;       // 'application/pdf' default
  };
  completedAt: string;          // ISO
  rawEvent: unknown;
}
