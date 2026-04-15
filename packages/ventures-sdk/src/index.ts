// @mcv/ventures-sdk — venture types + portable helper modules.
//
// v0.1.0:
//   /types            — Venture, VentureAsset, VentureWhiteLabel, etc.
//   /asset-discovery  — heuristic asset inference (e.g., infer GitHub repo
//                       candidates from a venture's profile)
//   /snapshot         — cross-time venture state diffing/comparison
//   /white-label      — custom domain + branding helpers
//
// The actual venture registry (the array of MCV's ventures) lives in app
// code at src/lib/ventures.ts. This SDK provides the contract + the
// operations; consumers bring their own data.

export * from './types';
export * from './asset-discovery';
export * from './snapshot';
export * from './white-label';

export const MCV_VENTURES_SDK_VERSION = '0.1.0' as const;
