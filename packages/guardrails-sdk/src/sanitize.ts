// packages/guardrails-sdk/src/sanitize.ts
//
// Primary public API. Two entry points:
//
//   sanitizeIngress(messages, meta, policy?)   — before LLM
//   sanitizeEgress(text, meta, policy?)        — after LLM
//
// Both return SanitizeResult<T> with violations + redactions + blocked flag.
// The caller decides how to surface a blocked result (401, 400, stream-terminate,
// custom response) — this module is enforcement-mechanical.

import type {
  Policy,
  SanitizeMeta,
  SanitizeResult,
  SanitizableMessage,
  Violation,
  Redaction,
  Decision,
} from './types.js';
import { DEFAULT_EGRESS_POLICY, STRICT_INGRESS_POLICY } from './rules.js';
import { detectPromptInjection } from './heuristics.js';
import { redactPii, detectPii } from './pii.js';
import { enforceUrlAllowlist } from './url-allowlist.js';

function extractTextFromMessage(msg: SanitizableMessage): string[] {
  if (typeof msg === 'string') return [msg];
  if ('content' in msg) {
    const c = msg.content;
    if (typeof c === 'string') return [c];
    if (Array.isArray(c)) return c.map((p) => p.text ?? '').filter(Boolean);
  }
  if ('parts' in msg && Array.isArray(msg.parts)) {
    return msg.parts.map((p) => p.text ?? '').filter(Boolean);
  }
  return [];
}

function rewriteMessageText(msg: SanitizableMessage, rewrite: (text: string) => string): SanitizableMessage {
  if (typeof msg === 'string') return rewrite(msg);
  if ('content' in msg) {
    const c = msg.content;
    if (typeof c === 'string') return { ...msg, content: rewrite(c) };
    if (Array.isArray(c)) {
      return {
        ...msg,
        content: c.map((p) => (p.text ? { ...p, text: rewrite(p.text) } : p)),
      };
    }
  }
  if ('parts' in msg && Array.isArray(msg.parts)) {
    return {
      ...msg,
      parts: msg.parts.map((p) => (p.text ? { ...p, text: rewrite(p.text) } : p)),
    };
  }
  return msg;
}

function shouldBlock(policy: Policy, violations: Violation[]): boolean {
  if (policy.mode !== 'block') return false;
  const blockSet = new Set(policy.blockOn);
  return violations.some((v) => blockSet.has(v.kind));
}

function decide(policy: Policy, violations: Violation[], redactions: Redaction[]): Decision {
  if (shouldBlock(policy, violations)) return 'blocked';
  if (policy.mode === 'log_only') return 'logged';
  if (redactions.length > 0 || violations.length > 0) return 'redacted';
  return 'pass';
}

export interface SanitizeTextOptions {
  policy?: Policy;
  meta?: Omit<SanitizeMeta, 'direction'>;
  direction: 'ingress' | 'egress';
}

/**
 * Core text-sanitization primitive. Used internally by sanitizeIngress/Egress
 * and exposed for callers that need to sanitize a single string (e.g., tool
 * arguments, single SSE delta).
 */
export function sanitizeText(input: string, opts: SanitizeTextOptions): SanitizeResult<string> {
  const policy = opts.policy ?? (opts.direction === 'ingress' ? STRICT_INGRESS_POLICY : DEFAULT_EGRESS_POLICY);
  const text = input ?? '';

  const heuristicViolations = detectPromptInjection(text, { maxBase64Run: policy.maxBase64Run });
  const urlViolations = enforceUrlAllowlist(text, { allowlist: policy.urlAllowlist });

  const piiFound = detectPii(text, { kinds: policy.piiKinds });
  const piiViolations: Violation[] = piiFound.map((m) => ({
    kind: 'pii_detected',
    severity: m.kind === 'ssn' || m.kind === 'credit_card' || m.kind === 'api_key_like' ? 'high' : 'medium',
    patternId: `pii.${m.kind}`,
    match: m.match,
    offset: m.offset,
  }));

  const violations = [...heuristicViolations, ...urlViolations, ...piiViolations];

  if (shouldBlock(policy, violations)) {
    return {
      safe: text, // caller will discard; safe is a no-op on block
      violations,
      redactions: [],
      blocked: true,
      decision: 'blocked',
    };
  }

  let safe = text;
  let redactions: Redaction[] = [];
  if (policy.mode === 'redact') {
    const redactSet = new Set(policy.redactOn);
    if (redactSet.has('pii_detected') && piiFound.length > 0) {
      const r = redactPii(safe, { kinds: policy.piiKinds });
      safe = r.safe;
      redactions = r.redactions;
    }
  }

  return {
    safe,
    violations,
    redactions,
    blocked: false,
    decision: decide(policy, violations, redactions),
  };
}

/**
 * Ingress sanitizer — runs BEFORE the LLM call. Walks every message's text
 * content, aggregates violations + redactions, and returns a rewritten
 * message array safe to send to the model.
 *
 * If policy.mode==='block' and any blockOn violation fires in any message,
 * the whole batch is reported blocked. The caller short-circuits the request.
 */
export function sanitizeIngress<T extends SanitizableMessage>(
  messages: T[],
  meta: Omit<SanitizeMeta, 'direction'>,
  policy: Policy = STRICT_INGRESS_POLICY,
): SanitizeResult<T[]> {
  const allViolations: Violation[] = [];
  const allRedactions: Redaction[] = [];
  const rewritten: T[] = [];

  for (const msg of messages) {
    const texts = extractTextFromMessage(msg);
    if (texts.length === 0) {
      rewritten.push(msg);
      continue;
    }

    let newMsg = msg;
    for (const text of texts) {
      const r = sanitizeText(text, { policy, meta, direction: 'ingress' });
      allViolations.push(...r.violations);
      allRedactions.push(...r.redactions);
      if (r.blocked) {
        return {
          safe: messages,
          violations: allViolations,
          redactions: allRedactions,
          blocked: true,
          decision: 'blocked',
        };
      }
      if (r.safe !== text) {
        newMsg = rewriteMessageText(newMsg, (t) => (t === text ? r.safe : t)) as T;
      }
    }
    rewritten.push(newMsg);
  }

  return {
    safe: rewritten,
    violations: allViolations,
    redactions: allRedactions,
    blocked: false,
    decision: decide(policy, allViolations, allRedactions),
  };
}

/**
 * Egress sanitizer — runs AFTER the LLM has produced text. Used on full
 * responses OR streamed SSE deltas. For streaming, the caller invokes
 * sanitizeEgress on each delta; state-bleeding attacks (e.g., a PII span
 * split across two deltas) are a known gap addressed in a later phase by
 * adding a small ring buffer across deltas.
 */
export function sanitizeEgress(
  text: string,
  meta: Omit<SanitizeMeta, 'direction'>,
  policy: Policy = DEFAULT_EGRESS_POLICY,
): SanitizeResult<string> {
  return sanitizeText(text, { policy, meta, direction: 'egress' });
}
