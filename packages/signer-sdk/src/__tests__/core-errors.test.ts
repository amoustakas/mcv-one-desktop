import { describe, it, expect } from 'vitest';
import { ERROR_COPY, extractErrorCode, isSignerError, type ErrorCode } from '../core/errors';

const ALL_CODES: ErrorCode[] = [
  'consent_required',
  'token_expired',
  'token_revoked',
  'token_mismatch',
  'token_invalid',
  'envelope_not_found',
  'signer_not_found',
  'envelope_closed',
  'content_mutation_detected',
  'content_missing',
  'internal_error',
];

describe('ErrorCode', () => {
  it('ships exactly the 11 canonical codes', () => {
    expect(Object.keys(ERROR_COPY).sort()).toEqual([...ALL_CODES].sort());
  });

  it('provides title+body copy for every code', () => {
    for (const code of ALL_CODES) {
      const copy = ERROR_COPY[code];
      expect(copy.title.length).toBeGreaterThan(0);
      expect(copy.body.length).toBeGreaterThan(0);
    }
  });

  it('treats content_mutation_detected with its "do not sign" body', () => {
    expect(ERROR_COPY.content_mutation_detected.body.toLowerCase()).toContain('do not sign');
  });
});

describe('extractErrorCode', () => {
  it('returns a known code when body carries one', () => {
    expect(extractErrorCode({ error: 'x', code: 'token_expired' })).toBe('token_expired');
  });

  it('falls back to internal_error for unknown shapes', () => {
    expect(extractErrorCode(null)).toBe('internal_error');
    expect(extractErrorCode({})).toBe('internal_error');
    expect(extractErrorCode({ code: 'not-a-real-code' })).toBe('internal_error');
  });
});

describe('isSignerError', () => {
  it('narrows on valid shape', () => {
    expect(isSignerError({ error: 'bad', code: 'token_invalid' })).toBe(true);
  });
  it('rejects partial shape', () => {
    expect(isSignerError({ error: 'bad' })).toBe(false);
    expect(isSignerError({ code: 'token_invalid' })).toBe(false);
    expect(isSignerError(null)).toBe(false);
  });
});
