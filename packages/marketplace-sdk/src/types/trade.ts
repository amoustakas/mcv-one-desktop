// TradeExecution — the authoritative fill record produced by the OME.
//
// Every fill emits both an `mcv.trade.executed` Fabric event (for downstream
// subscribers like Futurestate's positions view + capital distributions cron)
// and a Spanner INSERT (the legal-state of-record settlement ledger).

import type BN from 'bn.js';
import type { PublicKey } from '@solana/web3.js';
import type { OrderSide } from './order';
import type { JurisdictionId } from './jurisdiction';

export interface TradeExecution {
  /** UUIDv7 — the trade's canonical id across Spanner, Bigtable, and event_log. */
  id: string;
  /** id of the maker order (resting in book when the fill matched). */
  makerOrderId: string;
  /** id of the taker order (the order that crossed the book). */
  takerOrderId: string;
  /** Maker's side — the side of the fill for the passive participant. */
  makerSide: OrderSide;
  /** Asset mint */
  assetMint: PublicKey;
  /** Quote mint */
  quoteMint: PublicKey;
  /** Filled quantity (u128 with 10^18 scaling) */
  quantity: BN;
  /** Execution price in quote-per-asset (u128 with 10^18 scaling) */
  price: BN;
  /** Maker fee (negative values mean maker rebate) */
  makerFee: BN;
  /** Taker fee (always positive in the Futurestate fee model) */
  takerFee: BN;
  /** Solana slot the on-chain transfer landed in. */
  settlementSlot: bigint;
  /** Solana transaction signature of the atomic transfer. */
  settlementTxSig: string;
  /**
   * Jurisdiction of the executing venue. Different from the issuer's
   * jurisdiction — this is where the dealer-of-record route terminates.
   */
  executingJurisdiction: JurisdictionId;
  /** Wall-clock ISO at OME match time (not consensus). */
  matchedAt: string;
  /** Wall-clock ISO at Spanner INSERT. */
  settledAt: string;
}
