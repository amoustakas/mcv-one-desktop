// Order types — discriminated union over time-in-force + price semantics.
//
// Every order carries: UUIDv7 id (time-ordered idempotency), validUntilSlot
// (Firedancer Verification Lag mitigation), and slippageTolerance (in bps).
// Monetary fields use `bn.js` BN with 10^18 scaling — no native Number, no
// parseFloat, ever. Enforced by a lint rule at Phase 6.

import type BN from 'bn.js';
import type { PublicKey } from '@solana/web3.js';
import type { ExemptionTierId } from './exemption-tier';
import type { JurisdictionId } from './jurisdiction';

/** Time-in-force discriminator. */
export type OrderType =
  | 'Limit'    // resting order at specified price
  | 'Market'   // fill at best available price up to slippageTolerance
  | 'FOK'      // fill-or-kill — fully filled immediately or canceled
  | 'IOC'      // immediate-or-cancel — fill what you can, cancel the rest
  | 'TWAP';    // time-weighted average price — sliced over horizon

/** Order side. */
export type OrderSide = 'buy' | 'sell';

/** Order lifecycle status. */
export type OrderStatus =
  | 'pending'       // client-validated, not yet in OME
  | 'open'          // in OME book
  | 'partial'       // partially filled
  | 'filled'        // fully filled
  | 'canceled'      // user- or router-canceled
  | 'expired'       // validUntilSlot elapsed before fill
  | 'rejected';     // OME / router rejected (tier gate, slippage, etc.)

/** Shared fields common to every order variant. */
export interface OrderBase {
  /** UUIDv7, client-generated. Idempotency key end-to-end. */
  id: string;
  /** Asset mint. Paired with `quoteMint` below. */
  assetMint: PublicKey;
  /** Quote currency mint (usually a stablecoin like USDC). */
  quoteMint: PublicKey;
  side: OrderSide;
  /** Asset quantity (u128 with 10^18 scaling). */
  quantity: BN;
  /** Slippage tolerance in basis points (100 = 1%). Required on all orders. */
  slippageToleranceBps: number;
  /** Solana slot after which this order is rejected pre-settlement. */
  validUntilSlot: bigint;
  /** Order owner (Solana pubkey). */
  owner: PublicKey;
  /** Exemption tier this commit operates under (order-router enforces). */
  exemptionTier: ExemptionTierId;
  /** Jurisdiction of the issuing entity (for Dealer-of-Record routing). */
  jurisdiction: JurisdictionId;
  /** Wall-clock ISO string; for audit ordering only, not consensus. */
  createdAt: string;
  status: OrderStatus;
}

export interface LimitOrder extends OrderBase {
  type: 'Limit';
  /** Limit price in quote-per-asset (u128, 10^18 scaling). */
  limitPrice: BN;
  /** Time-in-force: how long the limit order sits in the book. Defaults applied by router. */
  timeInForce: 'GTC' | 'GTD' | 'DAY';
  /** Only meaningful for GTD; ISO timestamp. */
  goodTilDate?: string;
}

export interface MarketOrder extends OrderBase {
  type: 'Market';
}

export interface FokOrder extends OrderBase {
  type: 'FOK';
  /** Hard limit price that must be satisfied in full or canceled. */
  limitPrice: BN;
}

export interface IocOrder extends OrderBase {
  type: 'IOC';
  /** Limit price; any un-filled remainder is canceled. */
  limitPrice: BN;
}

export interface TwapOrder extends OrderBase {
  type: 'TWAP';
  /** Execution horizon in slots. */
  horizonSlots: number;
  /** Number of slices the total quantity is broken into. */
  sliceCount: number;
  /** Maximum acceptable VWAP (u128). Cancels further slices if exceeded. */
  maxAverageExecutionPrice: BN;
}

/** The full order discriminated union. Exhaustive switches use this shape. */
export type Order = LimitOrder | MarketOrder | FokOrder | IocOrder | TwapOrder;

/** Type guards — readable narrowing without `as` casts. */
export function isLimit(order: Order): order is LimitOrder { return order.type === 'Limit'; }
export function isMarket(order: Order): order is MarketOrder { return order.type === 'Market'; }
export function isFok(order: Order): order is FokOrder { return order.type === 'FOK'; }
export function isIoc(order: Order): order is IocOrder { return order.type === 'IOC'; }
export function isTwap(order: Order): order is TwapOrder { return order.type === 'TWAP'; }
