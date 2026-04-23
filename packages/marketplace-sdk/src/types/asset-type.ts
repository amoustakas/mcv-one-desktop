// Asset type discriminated union — the dual-standard Web3 boundary.
//
// MCV.ONE / MCV.GG / any utility token ships as Original SPL with Mint and
// Freeze authorities revoked (trustless + zero-friction CEX integration).
// STATE + any RWA token ships as Token-2022 with the full extension stack
// (TransferHook → AuthRouter + Travel Rule, Permanent Delegate via Squads V4
// 5-of-7 multisig + 24h timelock, DefaultAccountState = Frozen).
//
// The union is the only way code picks which TokenEngine factory path to
// take. If a caller wants to add a new asset standard (e.g., Metaplex Core
// compressed NFTs) they MUST extend this union first — no string-typed
// branches anywhere in the SDK.

import type { PublicKey } from '@solana/web3.js';

/** Stable discriminator ensuring exhaustive switch coverage in TS. */
export type AssetStandard = 'UtilitySPL' | 'RwaToken2022';

/**
 * Utility tokens (MCV.ONE, MCV.GG, governance tokens). Original SPL with
 * revoked mint + freeze authorities. Zero-restriction circulation; eligible
 * for Tier-1 CEX listings without bespoke wrapping.
 */
export interface UtilitySPL {
  standard: 'UtilitySPL';
  /** Token mint address on Solana mainnet */
  mint: PublicKey;
  /** Fixed ticker symbol, e.g. "MCV" or "EDGE" */
  symbol: string;
  /** Token decimals (typically 6 or 9 for SPL) */
  decimals: number;
  /**
   * Proof that mint + freeze authorities have been revoked. Set to the
   * transaction signature of the revocation. null is a compile-time loud
   * reminder that a new utility token must go through RevokeAuthority
   * before it is first listed.
   */
  authorityRevocationTxSig: string | null;
}

/**
 * Real-world asset tokens (STATE — Futurestate's property rights, any tokenized
 * security). Token-2022 with Transfer Hooks, Permanent Delegate, DefaultAccountState=Frozen.
 * Every transfer pings the SDK's compliance pipeline; off-platform P2P is not
 * possible without a hook-compliant counterparty.
 */
export interface RwaToken2022 {
  standard: 'RwaToken2022';
  /** Token mint address on Solana mainnet */
  mint: PublicKey;
  /** Fixed ticker symbol, e.g. "STATE-CLIFFBAY-1" */
  symbol: string;
  /** Token decimals (typically 6 — RWA math is u128 with 10^18 scaling anyway) */
  decimals: number;
  /**
   * PDA linking this mint to its legal wrapper (entity ID + exemption tier +
   * jurisdiction). The SDK refuses to mint or list any RWA token where the
   * AI-derived legal wrapper does not match this on-chain claim.
   */
  legalWrapperPda: PublicKey;
  /**
   * TransferHook program address. Receives every secondary transfer and
   * delegates to AuthRouter + attaches Travel Rule data for flows ≥ $1k.
   */
  transferHookProgram: PublicKey;
  /**
   * Permanent Delegate authority — a Squads V4 5-of-7 multisig with 24h
   * timelock. Used for lost-key recovery, court orders, and autonomous
   * circuit-breaker pause actions via LiveBindingCircuitBreaker.
   */
  permanentDelegate: PublicKey;
  /** Must be 'Frozen' at mint time; accounts opt-in to unfreezing via AuthRouter. */
  defaultAccountState: 'Frozen';
  /**
   * Whether ZK Confidential Transfers are enabled on this mint. Required for
   * institutional dark-pool sizing; optional for retail-only RWAs.
   */
  confidentialTransfersEnabled: boolean;
}

/**
 * The dual-standard discriminated union. Exhaustive switches on `asset.standard`
 * are enforced by TS `noFallthroughCasesInSwitch` in the workspace tsconfig.
 */
export type AssetType = UtilitySPL | RwaToken2022;

/** Type guard — narrows to UtilitySPL branch. */
export function isUtilitySPL(asset: AssetType): asset is UtilitySPL {
  return asset.standard === 'UtilitySPL';
}

/** Type guard — narrows to RwaToken2022 branch. */
export function isRwaToken2022(asset: AssetType): asset is RwaToken2022 {
  return asset.standard === 'RwaToken2022';
}

/**
 * Exhaustive standard switch helper. Use when both branches need distinct
 * logic; TS compile error if a new variant is added to AssetType without
 * handling it here. Apply the `assertNever` guard to force the compile-time
 * check:
 *
 *   function route(asset: AssetType): string {
 *     switch (asset.standard) {
 *       case 'UtilitySPL':   return 'spl';
 *       case 'RwaToken2022': return 'token-2022';
 *       default:             return assertNever(asset);
 *     }
 *   }
 */
export function assertNever(value: never): never {
  throw new Error(`[marketplace-sdk] non-exhaustive match on AssetType: ${JSON.stringify(value)}`);
}
