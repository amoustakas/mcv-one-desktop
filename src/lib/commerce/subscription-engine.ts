// Thin shim — canonical implementation lives in @mcv/commerce-sdk/subscription-engine.
import {
  createSubscriptionEngine,
  type LedgerAdapter,
} from '@mcv/commerce-sdk/subscription-engine';
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

const engine = createSubscriptionEngine({ supabase, ledger });

export const createSubscription = engine.createSubscription;
export const upgradeSubscription = engine.upgradeSubscription;
export const downgradeSubscription = engine.downgradeSubscription;
export const cancelSubscription = engine.cancelSubscription;
export const pauseSubscription = engine.pauseSubscription;
export const resumeSubscription = engine.resumeSubscription;
export const renewSubscription = engine.renewSubscription;
export const recordUsage = engine.recordUsage;
export const checkOverages = engine.checkOverages;

export { mapSubscriptionRow } from '@mcv/commerce-sdk/subscription-engine';
export type {
  SubscriptionEngine,
  OverageResult,
} from '@mcv/commerce-sdk/subscription-engine';
