// packages/guardrails-sdk/src/types.ts
//
// Shared types for the MCV guardrails SDK. This package is dependency-free;
// all types are expressed in plain TypeScript. Consumers bring their own
// validation (zod, yup, io-ts) at the edge if needed.

export type ViolationKind =
  | 'prompt_injection'
  | 'role_hijack'
  | 'tool_poisoning'
  | 'base64_inflation'
  | 'pii_detected'
  | 'malicious_url'
  | 'off_allowlist_url';

export type ViolationSeverity = 'low' | 'medium' | 'high';

export interface Violation {
  kind: ViolationKind;
  severity: ViolationSeverity;
  patternId: string;
  match: string;
  offset?: number;
}

export type PiiKind =
  | 'ssn'
  | 'credit_card'
  | 'email'
  | 'us_phone'
  | 'api_key_like'
  | 'google_cloud_credential'
  | 'jwt_like';

export interface Redaction {
  kind: PiiKind;
  replacement: string;
  offset: number;
  length: number;
}

export type PolicyMode = 'block' | 'redact' | 'log_only';

export interface Policy {
  mode: PolicyMode;
  /** Kinds that trigger a block when mode==='block'. */
  blockOn: ViolationKind[];
  /** Kinds that get redacted when mode==='redact'. */
  redactOn: ViolationKind[];
  /** Allowlisted URL hosts. Empty/undefined = no URL gating (trust model text). */
  urlAllowlist?: string[];
  /** Max base64 run length before base64_inflation fires. */
  maxBase64Run?: number;
  /** Which PII kinds to redact. Default covers SSN/CC/phone/email/api_key. */
  piiKinds?: PiiKind[];
}

export interface SanitizeMeta {
  tenantId?: string;
  ventureId?: string;
  userId?: string;
  agentHandle?: string;
  correlationId?: string;
  direction: 'ingress' | 'egress';
}

export type Decision = 'pass' | 'redacted' | 'blocked' | 'logged';

export interface SanitizeResult<T> {
  safe: T;
  violations: Violation[];
  redactions: Redaction[];
  blocked: boolean;
  decision: Decision;
}

/** A message-shaped object the sanitizer understands. */
export type SanitizableMessage =
  | string
  | { role?: string; content: string }
  | { role?: string; content: Array<{ type?: string; text?: string }> }
  | { parts: Array<{ text?: string }> };
