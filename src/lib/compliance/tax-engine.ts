// Thin shim — canonical implementation lives in @mcv/compliance-sdk.
import { createTaxEngine } from '@mcv/compliance-sdk/tax';
import { supabase } from '../supabase';

const engine = createTaxEngine({ supabase });

export const getJurisdictions = engine.getJurisdictions;
export const calculateTax = engine.calculateTax;
export const checkNexus = engine.checkNexus;
export const updateNexusTracking = engine.updateNexusTracking;

export type { NexusAlert, TaxEngine } from '@mcv/compliance-sdk/tax';
