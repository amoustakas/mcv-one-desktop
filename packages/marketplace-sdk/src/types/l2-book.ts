// L2 order-book snapshot type. Sub-millisecond read view backed by Bigtable.
//
// Subscribers use `MarketDataStreamer` (Phase 4) to receive delta snapshots;
// this interface is the shape each snapshot takes. L3 (per-order) data exists
// for institutional FIX subscribers only and is typed separately in Phase 4.

import type BN from 'bn.js';
import type { PublicKey } from '@solana/web3.js';

/** Aggregated book level — multiple orders at the same price compressed into one row. */
export interface BookLevel {
  /** Price, u128 with 10^18 scaling */
  price: BN;
  /** Cumulative size at this level (u128 with 10^18 scaling) */
  size: BN;
  /** Count of orders aggregated into this level (display-only; not used in matching) */
  orderCount: number;
}

/** L2 order-book snapshot. Separated bid/ask arrays, sorted by price. */
export interface L2OrderBook {
  assetMint: PublicKey;
  quoteMint: PublicKey;
  /** Bids sorted price-descending (best bid first) */
  bids: BookLevel[];
  /** Asks sorted price-ascending (best ask first) */
  asks: BookLevel[];
  /** Last trade price at snapshot time (u128, 10^18 scaling); null when no trades yet */
  lastTradePrice: BN | null;
  /** Solana slot when this snapshot was produced */
  snapshotSlot: bigint;
  /** Wall-clock ISO (display-only; for correlation with UI event log) */
  snapshotTime: string;
}

/**
 * Delta update over an L2 book. Sent by MarketDataStreamer as incremental
 * patches between full snapshots. Clients apply by replacing the levels at
 * `changedBids[].price` and `changedAsks[].price`; removing levels where
 * `size` equals zero.
 */
export interface L2BookDelta {
  assetMint: PublicKey;
  quoteMint: PublicKey;
  changedBids: BookLevel[];
  changedAsks: BookLevel[];
  /** If present, replaces the snapshot's lastTradePrice */
  lastTradePrice?: BN;
  /** Monotonically increasing; gaps signal a missed update (client must resync). */
  sequenceNumber: bigint;
  snapshotSlot: bigint;
}
