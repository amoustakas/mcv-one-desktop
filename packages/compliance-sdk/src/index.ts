// @mcv/compliance-sdk — compliance SDK.
//
// v0.2.0: full runtime extracted via DI factories (createComplianceEngine
// plus per-domain createFraudEngine / createDunningEngine / createTaxEngine
// / createPriceEngine). Caller supplies Supabase; all methods tolerate a
// null client for offline/test mode.

export * from './types';
export * from './fraud';
export * from './dunning';
export * from './tax';
export * from './price';
export * from './engine';

export const MCV_COMPLIANCE_SDK_VERSION = '0.2.0' as const;
