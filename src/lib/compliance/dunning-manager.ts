// Thin shim — canonical implementation lives in @mcv/compliance-sdk.
import { createDunningEngine } from '@mcv/compliance-sdk/dunning';
import { supabase } from '../supabase';

const engine = createDunningEngine({ supabase });

export const getDunningConfig = engine.getDunningConfig;
export const updateDunningConfig = engine.updateDunningConfig;
export const initiateDunning = engine.initiateDunning;
export const processRetries = engine.processRetries;
export const markRecovered = engine.markRecovered;
export const markExhausted = engine.markExhausted;
export const getDunningStats = engine.getDunningStats;

export type { RetryResult, DunningStats, DunningEngine } from '@mcv/compliance-sdk/dunning';
