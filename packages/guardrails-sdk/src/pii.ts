// packages/guardrails-sdk/src/pii.ts
//
// PII detection + redaction. Mirrors Google Cloud SDP "info types" at a lower
// fidelity — enough to catch the canonical classes (SSN, credit card, email,
// US phone, API-key-looking tokens, Google Cloud credentials, JWTs).
//
// Each detector returns offsets so the redactor can produce a transformed
// string + a Redaction[] log for audit. Consumers typically call
// redactPii(text) and get both back.

import type { PiiKind, Redaction } from './types.js';

interface PiiPattern {
  kind: PiiKind;
  regex: RegExp;
  /** Optional additional validator (e.g., Luhn for credit cards). */
  validate?: (candidate: string) => boolean;
  /** How to redact — default is `[REDACTED:<kind>]`. */
  replace?: (match: string) => string;
}

function luhn(digits: string): boolean {
  const d = digits.replace(/\D/g, '');
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = Number(d[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

const PATTERNS: PiiPattern[] = [
  {
    kind: 'ssn',
    // US SSN with dashes; avoids obvious non-SSN shapes (000, 666, 9xx areas)
    regex: /\b(?!000|666|9)\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g,
  },
  {
    kind: 'credit_card',
    regex: /\b(?:\d[ -]*?){13,19}\b/g,
    validate: (m) => luhn(m),
  },
  {
    kind: 'us_phone',
    regex: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  },
  {
    kind: 'email',
    regex: /\b[\w](?:[\w.-]*[\w])?@[\w](?:[\w-]*[\w])?(?:\.[\w](?:[\w-]*[\w])?)+\b/g,
  },
  {
    kind: 'api_key_like',
    // sk_..., pk_..., sk-ant-..., xoxb-..., ghp_..., and generic 32+ hex
    regex: /\b(?:sk|pk|rk|ak)[-_][A-Za-z0-9_-]{24,}|\bghp_[A-Za-z0-9]{30,}|\bxox[bpsa]-[A-Za-z0-9-]{20,}\b/g,
  },
  {
    kind: 'google_cloud_credential',
    // Google Cloud API key shape (AIza...) + service account short ID
    regex: /\bAIza[0-9A-Za-z_-]{35}\b/g,
  },
  {
    kind: 'jwt_like',
    regex: /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\b/g,
  },
];

export interface DetectPiiOptions {
  /** Subset of kinds to run. Default: all. */
  kinds?: PiiKind[];
  /** Email allowlist: addresses in allowlist are not redacted. */
  emailAllowlist?: string[];
}

export interface PiiMatch {
  kind: PiiKind;
  match: string;
  offset: number;
  length: number;
}

export function detectPii(text: string, opts: DetectPiiOptions = {}): PiiMatch[] {
  if (!text) return [];
  const kindsFilter = opts.kinds ? new Set(opts.kinds) : null;
  const allow = new Set((opts.emailAllowlist ?? []).map((s) => s.toLowerCase()));
  const out: PiiMatch[] = [];
  for (const p of PATTERNS) {
    if (kindsFilter && !kindsFilter.has(p.kind)) continue;
    for (const m of text.matchAll(p.regex)) {
      const raw = m[0];
      if (p.validate && !p.validate(raw)) continue;
      if (p.kind === 'email' && allow.has(raw.toLowerCase())) continue;
      out.push({ kind: p.kind, match: raw, offset: m.index ?? 0, length: raw.length });
    }
  }
  // Non-overlapping: sort by offset then drop any entry whose offset falls within a previous match's span.
  out.sort((a, b) => a.offset - b.offset);
  const merged: PiiMatch[] = [];
  let cursor = -1;
  for (const m of out) {
    if (m.offset >= cursor) {
      merged.push(m);
      cursor = m.offset + m.length;
    }
  }
  return merged;
}

export interface RedactResult {
  safe: string;
  redactions: Redaction[];
}

export function redactPii(text: string, opts: DetectPiiOptions = {}): RedactResult {
  const matches = detectPii(text, opts);
  if (matches.length === 0) return { safe: text, redactions: [] };
  const parts: string[] = [];
  const redactions: Redaction[] = [];
  let last = 0;
  for (const m of matches) {
    parts.push(text.slice(last, m.offset));
    const replacement = `[REDACTED:${m.kind.toUpperCase()}]`;
    parts.push(replacement);
    redactions.push({
      kind: m.kind,
      replacement,
      offset: m.offset,
      length: m.length,
    });
    last = m.offset + m.length;
  }
  parts.push(text.slice(last));
  return { safe: parts.join(''), redactions };
}
