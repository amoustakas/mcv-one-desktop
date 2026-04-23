// JWT claim-reader contract tests.

import { describe, it, expect } from 'vitest';

import { readMcvClaims, extractMcvClaimsFromJwt, decodeJwtPayloadUnsafe } from '../claims';

describe('readMcvClaims', () => {
  it('returns null for null / undefined payload', () => {
    expect(readMcvClaims(null)).toBeNull();
    expect(readMcvClaims(undefined)).toBeNull();
    expect(readMcvClaims({})).toBeNull();
  });

  it('reads claims from root-level fields', () => {
    const claims = readMcvClaims({
      mcv_trust_score: 87,
      mcv_civic_clearance: 'verified',
      mcv_trust_computed_at: '2026-04-22T21:00:00Z',
      mcv_active_fractures: [],
    });
    expect(claims).toEqual({
      mcv_trust_score: 87,
      mcv_civic_clearance: 'verified',
      mcv_trust_computed_at: '2026-04-22T21:00:00Z',
      mcv_active_fractures: [],
    });
  });

  it('reads claims from public_metadata nested payload', () => {
    const claims = readMcvClaims({
      public_metadata: {
        mcv_trust_score: 95,
        mcv_civic_clearance: 'sovereign',
        mcv_trust_computed_at: '2026-04-22T22:00:00Z',
        mcv_active_fractures: ['typing-while-driving'],
      },
    });
    expect(claims?.mcv_trust_score).toBe(95);
    expect(claims?.mcv_civic_clearance).toBe('sovereign');
    expect(claims?.mcv_active_fractures).toEqual(['typing-while-driving']);
  });

  it('rejects invalid civic clearance', () => {
    const claims = readMcvClaims({
      mcv_trust_score: 80,
      mcv_civic_clearance: 'platinum',
      mcv_trust_computed_at: '2026-04-22T21:00:00Z',
      mcv_active_fractures: [],
    });
    expect(claims).toBeNull();
  });

  it('filters non-string fractures', () => {
    const claims = readMcvClaims({
      mcv_trust_score: 80,
      mcv_civic_clearance: 'verified',
      mcv_trust_computed_at: '2026-04-22T21:00:00Z',
      mcv_active_fractures: ['duress', 42, null, 'device-handoff'],
    });
    expect(claims?.mcv_active_fractures).toEqual(['duress', 'device-handoff']);
  });

  it('returns null when required field is wrong type', () => {
    expect(readMcvClaims({
      mcv_trust_score: '80', // string, not number
      mcv_civic_clearance: 'verified',
      mcv_trust_computed_at: 'now',
    })).toBeNull();

    expect(readMcvClaims({
      mcv_trust_score: 80,
      mcv_civic_clearance: 'verified',
      mcv_trust_computed_at: 12345, // number, not string
    })).toBeNull();
  });
});

describe('decodeJwtPayloadUnsafe', () => {
  it('decodes a well-formed JWT payload', () => {
    const header = Buffer.from('{"alg":"HS256"}', 'utf8').toString('base64url');
    const payload = Buffer.from('{"sub":"u1","mcv_trust_score":85}', 'utf8').toString('base64url');
    const sig = 'fakesig';
    const jwt = `${header}.${payload}.${sig}`;

    const decoded = decodeJwtPayloadUnsafe(jwt);
    expect(decoded).toEqual({ sub: 'u1', mcv_trust_score: 85 });
  });

  it('returns null for malformed JWT', () => {
    expect(decodeJwtPayloadUnsafe('not-a-jwt')).toBeNull();
    expect(decodeJwtPayloadUnsafe('one.two')).toBeNull();
    expect(decodeJwtPayloadUnsafe('header.not-base64!@.sig')).toBeNull();
  });
});

describe('extractMcvClaimsFromJwt', () => {
  it('end-to-end extraction', () => {
    const payload = Buffer.from(JSON.stringify({
      sub: 'u1',
      mcv_trust_score: 92,
      mcv_civic_clearance: 'sovereign',
      mcv_trust_computed_at: '2026-04-22T21:00:00Z',
      mcv_active_fractures: [],
    }), 'utf8').toString('base64url');
    const jwt = `hdr.${payload}.sig`;

    const claims = extractMcvClaimsFromJwt(jwt);
    expect(claims?.mcv_trust_score).toBe(92);
    expect(claims?.mcv_civic_clearance).toBe('sovereign');
  });
});
