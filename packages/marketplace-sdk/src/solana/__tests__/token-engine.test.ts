// TokenEngine factory contract tests.
//
// Enforces the Phase 2 test gate from MCV_MASTER_SPEC §6.2:
//   - Utility SPL config REQUIRES mint + freeze authority revocation flags
//   - Token-2022 RWA config ALWAYS has TransferHook, PermanentDelegate,
//     DefaultAccountState=Frozen. Callers cannot skip them.
//
// A real Token-2022 transfer path requires AuthRouter clearance (tested
// in auth-router.test.ts); this file locks the CONFIG shape that makes
// such enforcement possible.

import { describe, it, expect } from 'vitest';
import { Keypair } from '@solana/web3.js';

import { TokenEngine } from '../token-engine';
import type { RwaToken2022, UtilitySPL } from '../../types/asset-type';

const engine = new TokenEngine();

// Generate valid Solana pubkeys for each slot — avoids hardcoded base58
// that may not decode to 32 bytes on some versions of @solana/web3.js.
const mint = Keypair.generate().publicKey;
const holder = Keypair.generate().publicKey;
const wrapperPda = Keypair.generate().publicKey;
const hookProgram = Keypair.generate().publicKey;
const delegate = Keypair.generate().publicKey;

const metadata = { name: 'Test', uri: 'https://test/', sellerFeeBasisPoints: 0 };

// ───────────────────────────────────────────────────────────────────────────
// Utility SPL
// ───────────────────────────────────────────────────────────────────────────

describe('TokenEngine.buildUtilitySPLConfig', () => {
  it('produces a config requiring mint + freeze authority revocation', () => {
    const config = engine.buildUtilitySPLConfig({
      mint,
      symbol: 'MCV',
      decimals: 9,
      initialSupplyRaw: '1000000000000000000000000000',
      initialHolder: holder,
      metadata,
    });

    expect(config.kind).toBe('UtilitySPL');
    expect(config.requireMintAuthorityRevoke).toBe(true);
    expect(config.requireFreezeAuthorityRevoke).toBe(true);
  });

  it('rejects invalid decimals', () => {
    expect(() => engine.buildUtilitySPLConfig({
      mint, symbol: 'MCV', decimals: 19,
      initialSupplyRaw: '1', initialHolder: holder, metadata,
    })).toThrow(/decimals/);

    expect(() => engine.buildUtilitySPLConfig({
      mint, symbol: 'MCV', decimals: -1,
      initialSupplyRaw: '1', initialHolder: holder, metadata,
    })).toThrow(/decimals/);
  });

  it('rejects invalid symbols', () => {
    expect(() => engine.buildUtilitySPLConfig({
      mint, symbol: 'mcv', decimals: 9,
      initialSupplyRaw: '1', initialHolder: holder, metadata,
    })).toThrow(/symbol/);

    expect(() => engine.buildUtilitySPLConfig({
      mint, symbol: '', decimals: 9,
      initialSupplyRaw: '1', initialHolder: holder, metadata,
    })).toThrow(/symbol/);
  });

  it('rejects zero or non-numeric initial supply', () => {
    expect(() => engine.buildUtilitySPLConfig({
      mint, symbol: 'MCV', decimals: 9,
      initialSupplyRaw: '0', initialHolder: holder, metadata,
    })).toThrow(/initialSupplyRaw/);

    expect(() => engine.buildUtilitySPLConfig({
      mint, symbol: 'MCV', decimals: 9,
      initialSupplyRaw: 'abc', initialHolder: holder, metadata,
    })).toThrow(/initialSupplyRaw/);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Token-2022 RWA
// ───────────────────────────────────────────────────────────────────────────

describe('TokenEngine.buildRwaTokenConfig', () => {
  it('ALWAYS emits TransferHook, PermanentDelegate, DefaultAccountState=Frozen', () => {
    const config = engine.buildRwaTokenConfig({
      mint,
      symbol: 'STATE-CLIFFBAY-1',
      decimals: 6,
      initialSupplyRaw: '1000000000000',
      legalWrapperPda: wrapperPda,
      issuingJurisdiction: 'CaymanSPC',
      transferHookProgram: hookProgram,
      permanentDelegate: delegate,
      metadata,
    });

    expect(config.kind).toBe('RwaToken2022');
    expect(config.transferHookProgram.toBase58()).toBe(hookProgram.toBase58());
    expect(config.permanentDelegate.toBase58()).toBe(delegate.toBase58());
    expect(config.defaultAccountState).toBe('Frozen');
    expect(config.confidentialTransfersEnabled).toBe(false); // default
    expect(config.nrstSevenUnitExempt).toBe(false); // default
  });

  it('lets opt-in confidentialTransfersEnabled + nrstSevenUnitExempt override defaults', () => {
    const config = engine.buildRwaTokenConfig({
      mint, symbol: 'STATE-TORONTO-A', decimals: 6,
      initialSupplyRaw: '1', legalWrapperPda: wrapperPda,
      issuingJurisdiction: 'OntarioLP',
      transferHookProgram: hookProgram, permanentDelegate: delegate,
      metadata,
      confidentialTransfersEnabled: true,
      nrstSevenUnitExempt: true,
    });
    expect(config.confidentialTransfersEnabled).toBe(true);
    expect(config.nrstSevenUnitExempt).toBe(true);
    expect(config.issuingJurisdiction).toBe('OntarioLP');
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Asset-routed build
// ───────────────────────────────────────────────────────────────────────────

describe('TokenEngine.buildFromAsset', () => {
  it('routes UtilitySPL assets to the SPL config path', () => {
    const asset: UtilitySPL = {
      standard: 'UtilitySPL',
      mint,
      symbol: 'MCV',
      decimals: 9,
      authorityRevocationTxSig: null,
    };
    const config = engine.buildFromAsset(asset, {
      initialSupplyRaw: '1000000000',
      initialHolder: holder,
      metadata,
    });
    expect(config.kind).toBe('UtilitySPL');
  });

  it('routes RwaToken2022 assets to the Token-2022 config path', () => {
    const asset: RwaToken2022 = {
      standard: 'RwaToken2022',
      mint,
      symbol: 'STATE-X',
      decimals: 6,
      legalWrapperPda: wrapperPda,
      transferHookProgram: hookProgram,
      permanentDelegate: delegate,
      defaultAccountState: 'Frozen',
      confidentialTransfersEnabled: false,
    };
    const config = engine.buildFromAsset(asset, {
      initialSupplyRaw: '1',
      metadata,
      issuingJurisdiction: 'FutureStateLP',
    });
    expect(config.kind).toBe('RwaToken2022');
  });

  it('rejects UtilitySPL build without initialHolder', () => {
    const asset: UtilitySPL = {
      standard: 'UtilitySPL', mint, symbol: 'MCV', decimals: 9,
      authorityRevocationTxSig: null,
    };
    expect(() => engine.buildFromAsset(asset, {
      initialSupplyRaw: '1', metadata,
    })).toThrow(/initialHolder/);
  });

  it('rejects RwaToken2022 build without issuingJurisdiction', () => {
    const asset: RwaToken2022 = {
      standard: 'RwaToken2022', mint, symbol: 'S', decimals: 6,
      legalWrapperPda: wrapperPda, transferHookProgram: hookProgram,
      permanentDelegate: delegate, defaultAccountState: 'Frozen',
      confidentialTransfersEnabled: false,
    };
    expect(() => engine.buildFromAsset(asset, {
      initialSupplyRaw: '1', metadata,
    })).toThrow(/issuingJurisdiction/);
  });
});
