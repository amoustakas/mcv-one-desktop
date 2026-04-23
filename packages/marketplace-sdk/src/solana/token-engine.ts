// TokenEngine — the dual-standard deployment factory.
//
// Produces the exact config a Solana deployer needs to mint either:
//   - Original SPL with mint + freeze authorities revoked (utility tokens:
//     MCV.ONE, MCV.GG, governance). Zero-friction Tier-1 CEX integration.
//   - Token-2022 with Transfer Hooks + Permanent Delegate + DefaultAccountState
//     = Frozen (RWA: STATE, any tokenized security). Mandatory compliance.
//
// Factory does NOT itself call @solana/web3.js Connection.sendTransaction —
// that's a thin runtime-edge wrapper. The factory produces pure config,
// stays testable, and can run inside Confidential Space (no network).

import type { PublicKey } from '@solana/web3.js';
import type { AssetType } from '../types/asset-type';
import type { JurisdictionId } from '../types/jurisdiction';

// ───────────────────────────────────────────────────────────────────────────
// Utility SPL config
// ───────────────────────────────────────────────────────────────────────────

export interface UtilitySPLDeployConfig {
  kind: 'UtilitySPL';
  /** Pre-generated mint pubkey for the new SPL */
  mint: PublicKey;
  /** Symbol, decimals, supply */
  symbol: string;
  decimals: number;
  /** Initial supply in u128 scaled representation (string to survive JSON) */
  initialSupplyRaw: string;
  /**
   * Deployer MUST call SetAuthority(AuthorityType.MintTokens, null) and
   * SetAuthority(AuthorityType.FreezeAccount, null) before first listing.
   * These flags document that requirement; the runtime layer asserts both
   * are in the deploy transaction.
   */
  requireMintAuthorityRevoke: true;
  requireFreezeAuthorityRevoke: true;
  /** The corporate treasury account that holds the initial supply */
  initialHolder: PublicKey;
  /** Metaplex metadata (name, uri, sellerFeeBasisPoints) */
  metadata: {
    name: string;
    uri: string;
    sellerFeeBasisPoints: number;
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Token-2022 RWA config
// ───────────────────────────────────────────────────────────────────────────

export interface RwaTokenDeployConfig {
  kind: 'RwaToken2022';
  mint: PublicKey;
  symbol: string;
  decimals: number;
  initialSupplyRaw: string;
  /** Legal wrapper PDA linking this mint to its entity/exemption/jurisdiction */
  legalWrapperPda: PublicKey;
  /** Issuing jurisdiction — drives Dealer-of-Record routing + tax treatment */
  issuingJurisdiction: JurisdictionId;
  /** TransferHook program address — every secondary transfer pings this */
  transferHookProgram: PublicKey;
  /** Permanent Delegate — Squads V4 5-of-7 multisig (24h timelock) pubkey */
  permanentDelegate: PublicKey;
  /** Must be 'Frozen' — accounts opt-in via AuthRouter-gated thaw */
  defaultAccountState: 'Frozen';
  /** Whether to enable Confidential Transfers (institutional dark-pool) */
  confidentialTransfersEnabled: boolean;
  /** Metaplex metadata */
  metadata: {
    name: string;
    uri: string;
    sellerFeeBasisPoints: number;
  };
  /** Whether the NRST 7-unit commercial exclusion is claimed (real estate only) */
  nrstSevenUnitExempt: boolean;
}

export type TokenDeployConfig = UtilitySPLDeployConfig | RwaTokenDeployConfig;

// ───────────────────────────────────────────────────────────────────────────
// Build inputs
// ───────────────────────────────────────────────────────────────────────────

export interface BuildUtilityInput {
  mint: PublicKey;
  symbol: string;
  decimals: number;
  initialSupplyRaw: string;
  initialHolder: PublicKey;
  metadata: { name: string; uri: string; sellerFeeBasisPoints: number };
}

export interface BuildRwaInput {
  mint: PublicKey;
  symbol: string;
  decimals: number;
  initialSupplyRaw: string;
  legalWrapperPda: PublicKey;
  issuingJurisdiction: JurisdictionId;
  transferHookProgram: PublicKey;
  permanentDelegate: PublicKey;
  confidentialTransfersEnabled?: boolean;
  metadata: { name: string; uri: string; sellerFeeBasisPoints: number };
  nrstSevenUnitExempt?: boolean;
}

// ───────────────────────────────────────────────────────────────────────────
// Engine
// ───────────────────────────────────────────────────────────────────────────

export class TokenEngine {
  /**
   * Build a Utility SPL deployment config. Asserts decimals + supply
   * constraints at build time so callers can't produce an invalid spec.
   */
  buildUtilitySPLConfig(input: BuildUtilityInput): UtilitySPLDeployConfig {
    assertDecimals(input.decimals);
    assertNonEmptyRaw(input.initialSupplyRaw);
    assertSymbol(input.symbol);
    return {
      kind: 'UtilitySPL',
      mint: input.mint,
      symbol: input.symbol,
      decimals: input.decimals,
      initialSupplyRaw: input.initialSupplyRaw,
      requireMintAuthorityRevoke: true,
      requireFreezeAuthorityRevoke: true,
      initialHolder: input.initialHolder,
      metadata: input.metadata,
    };
  }

  /**
   * Build a Token-2022 RWA deployment config. Extensions (TransferHook +
   * PermanentDelegate + DefaultAccountState=Frozen) are mandatory and
   * baked into the returned shape; callers don't get to skip them.
   */
  buildRwaTokenConfig(input: BuildRwaInput): RwaTokenDeployConfig {
    assertDecimals(input.decimals);
    assertNonEmptyRaw(input.initialSupplyRaw);
    assertSymbol(input.symbol);
    return {
      kind: 'RwaToken2022',
      mint: input.mint,
      symbol: input.symbol,
      decimals: input.decimals,
      initialSupplyRaw: input.initialSupplyRaw,
      legalWrapperPda: input.legalWrapperPda,
      issuingJurisdiction: input.issuingJurisdiction,
      transferHookProgram: input.transferHookProgram,
      permanentDelegate: input.permanentDelegate,
      defaultAccountState: 'Frozen',
      confidentialTransfersEnabled: input.confidentialTransfersEnabled ?? false,
      metadata: input.metadata,
      nrstSevenUnitExempt: input.nrstSevenUnitExempt ?? false,
    };
  }

  /**
   * Router that matches an AssetType to the correct deploy config.
   * Useful when the caller already has an AssetType instance and just
   * needs the deployment shape reproduced.
   */
  buildFromAsset(
    asset: AssetType,
    extras: {
      initialSupplyRaw: string;
      metadata: { name: string; uri: string; sellerFeeBasisPoints: number };
      initialHolder?: PublicKey;
      issuingJurisdiction?: JurisdictionId;
      nrstSevenUnitExempt?: boolean;
    },
  ): TokenDeployConfig {
    switch (asset.standard) {
      case 'UtilitySPL':
        if (!extras.initialHolder) {
          throw new Error('[token-engine] UtilitySPL requires initialHolder');
        }
        return this.buildUtilitySPLConfig({
          mint: asset.mint,
          symbol: asset.symbol,
          decimals: asset.decimals,
          initialSupplyRaw: extras.initialSupplyRaw,
          initialHolder: extras.initialHolder,
          metadata: extras.metadata,
        });
      case 'RwaToken2022':
        if (!extras.issuingJurisdiction) {
          throw new Error('[token-engine] RwaToken2022 requires issuingJurisdiction');
        }
        return this.buildRwaTokenConfig({
          mint: asset.mint,
          symbol: asset.symbol,
          decimals: asset.decimals,
          initialSupplyRaw: extras.initialSupplyRaw,
          legalWrapperPda: asset.legalWrapperPda,
          issuingJurisdiction: extras.issuingJurisdiction,
          transferHookProgram: asset.transferHookProgram,
          permanentDelegate: asset.permanentDelegate,
          confidentialTransfersEnabled: asset.confidentialTransfersEnabled,
          metadata: extras.metadata,
          nrstSevenUnitExempt: extras.nrstSevenUnitExempt,
        });
    }
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Validation helpers
// ───────────────────────────────────────────────────────────────────────────

function assertDecimals(decimals: number): void {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) {
    throw new Error(`[token-engine] decimals must be an integer in [0, 18]; got ${decimals}`);
  }
}

function assertSymbol(symbol: string): void {
  if (!/^[A-Z0-9-]{1,20}$/.test(symbol)) {
    throw new Error(`[token-engine] symbol must match /^[A-Z0-9-]{1,20}$/; got "${symbol}"`);
  }
}

function assertNonEmptyRaw(supplyRaw: string): void {
  if (!/^\d+$/.test(supplyRaw) || supplyRaw === '0') {
    throw new Error(`[token-engine] initialSupplyRaw must be a non-zero decimal string; got "${supplyRaw}"`);
  }
}
