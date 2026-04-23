// packages/guardrails-sdk/__tests__/pii.test.ts

import { describe, it, expect } from 'vitest';
import { detectPii, redactPii } from '../src/pii.js';

describe('detectPii', () => {
  it('detects a valid SSN', () => {
    const m = detectPii('My SSN is 123-45-6789 ok.');
    expect(m.some((x) => x.kind === 'ssn' && x.match === '123-45-6789')).toBe(true);
  });

  it('rejects obvious non-SSN ranges', () => {
    const m = detectPii('Not SSNs: 000-12-3456, 666-11-2222, 900-00-0001.');
    expect(m.filter((x) => x.kind === 'ssn')).toHaveLength(0);
  });

  it('detects a Luhn-valid credit card', () => {
    const m = detectPii('Card: 4539 1488 0343 6467');
    expect(m.some((x) => x.kind === 'credit_card')).toBe(true);
  });

  it('rejects Luhn-invalid 16-digit runs', () => {
    const m = detectPii('Phone-looking: 1234567812345670');
    expect(m.filter((x) => x.kind === 'credit_card')).toHaveLength(0);
  });

  it('detects emails', () => {
    const m = detectPii('Contact me at alice@example.com for info.');
    expect(m.some((x) => x.kind === 'email' && x.match === 'alice@example.com')).toBe(true);
  });

  it('honors email allowlist', () => {
    const m = detectPii('Notify support@mcv.one and bob@outside.com.', {
      emailAllowlist: ['support@mcv.one'],
    });
    expect(m.filter((x) => x.kind === 'email').map((x) => x.match)).toEqual(['bob@outside.com']);
  });

  it('detects Google AI API keys', () => {
    const fakeKey = 'AIza' + 'x'.repeat(35);
    const m = detectPii(`key=${fakeKey}`);
    expect(m.some((x) => x.kind === 'google_cloud_credential')).toBe(true);
  });

  it('detects a JWT-like token', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.abcdef123456';
    const m = detectPii(`auth: ${jwt}`);
    expect(m.some((x) => x.kind === 'jwt_like')).toBe(true);
  });
});

describe('redactPii', () => {
  it('replaces SSN with a labeled placeholder', () => {
    const r = redactPii('SSN=123-45-6789 end');
    expect(r.safe).toBe('SSN=[REDACTED:SSN] end');
    expect(r.redactions).toHaveLength(1);
    expect(r.redactions[0].kind).toBe('ssn');
  });

  it('preserves text around the redaction', () => {
    const r = redactPii('call 415-555-1212 then email x@y.com');
    expect(r.safe).toContain('[REDACTED:US_PHONE]');
    expect(r.safe).toContain('[REDACTED:EMAIL]');
    expect(r.safe.startsWith('call ')).toBe(true);
  });

  it('leaves non-PII text unchanged', () => {
    const r = redactPii('no pii here just words');
    expect(r.safe).toBe('no pii here just words');
    expect(r.redactions).toEqual([]);
  });
});
