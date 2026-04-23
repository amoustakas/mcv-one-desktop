// packages/guardrails-sdk/src/rules.ts
//
// Default policy + policy composition helpers. Callers can either adopt
// DEFAULT_POLICY wholesale or derive per-tenant policies via makePolicy().

import type { Policy, PolicyMode, ViolationKind, PiiKind } from './types.js';

export const DEFAULT_BLOCK_KINDS: ViolationKind[] = [
  'prompt_injection',
  'role_hijack',
  'tool_poisoning',
  'malicious_url',
];

export const DEFAULT_REDACT_KINDS: ViolationKind[] = [
  'pii_detected',
  'off_allowlist_url',
];

export const DEFAULT_PII_KINDS: PiiKind[] = [
  'ssn',
  'credit_card',
  'us_phone',
  'email',
  'api_key_like',
  'google_cloud_credential',
  'jwt_like',
];

export const DEFAULT_POLICY: Policy = {
  mode: 'redact',
  blockOn: DEFAULT_BLOCK_KINDS,
  redactOn: DEFAULT_REDACT_KINDS,
  urlAllowlist: undefined,     // no URL gating by default — venture config supplies
  maxBase64Run: 120,
  piiKinds: DEFAULT_PII_KINDS,
};

export interface MakePolicyOptions {
  mode?: PolicyMode;
  blockOn?: ViolationKind[];
  redactOn?: ViolationKind[];
  urlAllowlist?: string[];
  maxBase64Run?: number;
  piiKinds?: PiiKind[];
}

export function makePolicy(opts: MakePolicyOptions = {}): Policy {
  return {
    mode: opts.mode ?? DEFAULT_POLICY.mode,
    blockOn: opts.blockOn ?? DEFAULT_POLICY.blockOn,
    redactOn: opts.redactOn ?? DEFAULT_POLICY.redactOn,
    urlAllowlist: opts.urlAllowlist,
    maxBase64Run: opts.maxBase64Run ?? DEFAULT_POLICY.maxBase64Run,
    piiKinds: opts.piiKinds ?? DEFAULT_POLICY.piiKinds,
  };
}

/** Strict ingress policy — blocks on any injection-class violation. */
export const STRICT_INGRESS_POLICY: Policy = makePolicy({
  mode: 'block',
  blockOn: [...DEFAULT_BLOCK_KINDS],
  redactOn: DEFAULT_REDACT_KINDS,
});

/** Egress policy — redact PII, log malicious URLs, let model text through otherwise. */
export const DEFAULT_EGRESS_POLICY: Policy = makePolicy({
  mode: 'redact',
  blockOn: ['malicious_url'],
  redactOn: ['pii_detected', 'off_allowlist_url'],
});
