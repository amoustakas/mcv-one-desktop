// Thin shim — canonical implementation lives in @mcv/compliance-sdk.
// Instantiates the factory with the app's Supabase client so the previous
// named-export call sites (scoreTransaction, createFraudRule, etc.) keep
// working unchanged.
import { createFraudEngine } from '@mcv/compliance-sdk/fraud';
import { supabase } from '../supabase';

const engine = createFraudEngine({ supabase });

export const scoreTransaction = engine.scoreTransaction;
export const createFraudRule = engine.createFraudRule;
export const updateFraudRule = engine.updateFraudRule;
export const deleteFraudRule = engine.deleteFraudRule;
export const listFraudRules = engine.listFraudRules;

export type { ScoreTransactionRequest, FraudEngine } from '@mcv/compliance-sdk/fraud';
