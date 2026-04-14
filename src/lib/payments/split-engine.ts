// Thin shim — canonical implementation lives in @mcv/payments-sdk/split-engine.
//
// Binds createSplitEngine's DI factory to this app's Supabase client and the
// `../ledger/service` module (wrapped as a LedgerAdapter). Preserves the
// historical `SplitPaymentEngine` class + `splitPaymentEngine` singleton +
// `calculatePlatformFee` export surface so existing call sites are untouched.

import {
  createSplitEngine,
  calculatePlatformFee as sdkCalculatePlatformFee,
  type LedgerAdapter,
  type SplitEngine,
} from '@mcv/payments-sdk/split-engine';
import type { SplitPaymentRequest, SplitPaymentResult } from './types';
import { supabase } from '../supabase';
import {
  createJournalEntry as svcCreateJournalEntry,
  postJournalEntry as svcPostJournalEntry,
  getAccountByCode as svcGetAccountByCode,
} from '../ledger/service';

const ledger: LedgerAdapter = {
  getAccountByCode: (ventureId, code) => svcGetAccountByCode(ventureId, code),
  createJournalEntry: (input) => svcCreateJournalEntry(input),
  postJournalEntry: (entryId, postedBy) => svcPostJournalEntry(entryId, postedBy),
};

const engine: SplitEngine = createSplitEngine({ supabase, ledger });

// Class wrapper preserves the historical `new SplitPaymentEngine()` pattern.
// Method forwards to the injected singleton so there's a single runtime
// source of truth.
export class SplitPaymentEngine {
  async executeSplit(request: SplitPaymentRequest): Promise<SplitPaymentResult> {
    return engine.executeSplit(request);
  }
}

export const splitPaymentEngine = new SplitPaymentEngine();

export const calculatePlatformFee = sdkCalculatePlatformFee;

export type { LedgerAdapter } from '@mcv/payments-sdk/split-engine';
