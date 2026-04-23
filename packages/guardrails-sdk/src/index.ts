// packages/guardrails-sdk/src/index.ts
//
// Top-level barrel for @mcv/guardrails-sdk.
// Consumers can import from the root for everything, or use the subpath
// exports declared in package.json for narrower bundles.

export * from './types.js';
export {
  detectPromptInjection,
  _INJECTION_RULES,
  _TOOL_POISONING_RULES,
  type DetectOptions,
} from './heuristics.js';
export {
  detectPii,
  redactPii,
  type DetectPiiOptions,
  type PiiMatch,
  type RedactResult,
} from './pii.js';
export {
  enforceUrlAllowlist,
  type UrlPolicyOptions,
} from './url-allowlist.js';
export {
  DEFAULT_POLICY,
  DEFAULT_EGRESS_POLICY,
  STRICT_INGRESS_POLICY,
  DEFAULT_BLOCK_KINDS,
  DEFAULT_REDACT_KINDS,
  DEFAULT_PII_KINDS,
  makePolicy,
  type MakePolicyOptions,
} from './rules.js';
export {
  sanitizeText,
  sanitizeIngress,
  sanitizeEgress,
  type SanitizeTextOptions,
} from './sanitize.js';
export {
  sanitizeVoiceTurn,
  type VoiceTurnInput,
} from './voice.js';
