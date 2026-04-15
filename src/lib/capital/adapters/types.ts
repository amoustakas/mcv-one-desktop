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
