// @mcv/compliance-sdk — compliance type system.
//
// Currently ships TYPES only. The Supabase-bound runtime (fraud-engine
// scoreTransaction, dunning-manager processRetries, tax-engine, price-
// localization) lives in consuming apps because each function uses the
// app's local Supabase client. A later SDK extraction introduces a
// createComplianceEngine({ supabase }) DI factory; for now venture apps
// that want compliance copy the engine files into their own src/lib.

export * from './types';

export const MCV_COMPLIANCE_SDK_VERSION = '0.1.0' as const;
