// MCV Sign crypto primitives — unit tests.
// Exercises canonicalize + hashing + token issue/verify + envelope
// signature roundtrip + completion receipt construction.

import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'node:crypto';
import {
  canonicalize,
  canonicalizeEnvelopePayload,
  computeContentHash,
  payloadDigest,
  issueSignerToken,
  verifySignerToken,
  tokenHash,
  signEnvelopePayload,
  verifyEnvelopeSignature,
  buildCompletionReceipt,
} from '../signer';

// Use a per-test Ed25519 keypair so we don't touch env. Exported
// functions accept an override, which is sufficient for the sign +
// verify roundtrip. Token issue/verify goes through loadIssuerKey —
// we set MCV_VC_ISSUER_PRIVATE_KEY_PEM via env for those cases.

let testKeyPair: crypto.KeyPairKeyObjectResult;

beforeAll(() => {
  testKeyPair = crypto.generateKeyPairSync('ed25519');
  const pem = testKeyPair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  process.env.MCV_VC_ISSUER_PRIVATE_KEY_PEM = pem;
  process.env.MCV_VC_ISSUER_KID = 'test-key';
});

describe('canonicalize', () => {
  it('sorts keys deterministically', () => {
    expect(canonicalize({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
    expect(canonicalize({ b: 1, a: 2 })).toBe(canonicalize({ a: 2, b: 1 }));
  });
  it('handles nested objects', () => {
    expect(canonicalize({ b: { y: 2, x: 1 }, a: [3, 1] }))
      .toBe('{"a":[3,1],"b":{"x":1,"y":2}}');
  });
  it('preserves null and array order', () => {
    expect(canonicalize([null, 1, 'x'])).toBe('[null,1,"x"]');
  });
});

describe('computeContentHash', () => {
  it('returns sha256 hex of utf-8 bytes', () => {
    expect(computeContentHash('hello')).toBe(
      crypto.createHash('sha256').update('hello', 'utf8').digest('hex'),
    );
  });
  it('detects body mutation', () => {
    expect(computeContentHash('version-1')).not.toBe(computeContentHash('version-1 '));
  });
});

describe('canonicalizeEnvelopePayload', () => {
  it('produces a structured payload with required fields', () => {
    const p = canonicalizeEnvelopePayload({
      contentId: 'c-1',
      contentHash: 'abc',
      contentBodyType: 'markdown',
      signers: [{ ordinal: 0, email: 't@mcv.one', role: 'Investor' }],
      createdAt: '2026-04-16T00:00:00Z',
    });
    expect(p.version).toBe('mcv-sign/v0');
    expect(p.content_hash).toBe('abc');
    expect((p.signers as Array<{ email: string }>)[0].email).toBe('t@mcv.one');
  });

  it('digest is stable across invocations with same input', () => {
    const input = {
      contentId: 'c-1',
      contentHash: 'abc',
      contentBodyType: 'markdown',
      signers: [{ ordinal: 0, email: 't@mcv.one', role: 'Investor' }],
      createdAt: '2026-04-16T00:00:00Z',
    };
    const d1 = payloadDigest(canonicalizeEnvelopePayload(input));
    const d2 = payloadDigest(canonicalizeEnvelopePayload(input));
    expect(d1).toBe(d2);
  });
});

describe('signer token roundtrip', () => {
  it('issues + verifies a signed token with claim intact', () => {
    const expiresAt = new Date(Date.now() + 86400_000);
    const token = issueSignerToken({
      envelopePublicId: 'mcvs_test',
      signerEmail: 'Tony@MCV.one',
      signerOrdinal: 0,
      expiresAt,
    });
    const result = verifySignerToken(token);
    expect(result.ok).toBe(true);
    expect(result.unsigned).toBeFalsy();
    expect(result.claim?.envelopePublicId).toBe('mcvs_test');
    expect(result.claim?.signerEmail).toBe('tony@mcv.one'); // lowercased
    expect(result.claim?.signerOrdinal).toBe(0);
  });

  it('rejects expired tokens', () => {
    const expired = new Date(Date.now() - 1000);
    const token = issueSignerToken({
      envelopePublicId: 'mcvs_x', signerEmail: 'x@y.z', signerOrdinal: 0, expiresAt: expired,
    });
    const result = verifySignerToken(token);
    expect(result.ok).toBe(false);
    expect(result.expired).toBe(true);
  });

  it('rejects tokens with tampered claim', () => {
    const token = issueSignerToken({
      envelopePublicId: 'mcvs_ok', signerEmail: 'ok@mcv.one', signerOrdinal: 0,
      expiresAt: new Date(Date.now() + 86400_000),
    });
    const [, sig] = token.split('.');
    // Swap in a different claim but keep the original sig → mismatch
    const badClaim = Buffer.from(JSON.stringify({
      envelopePublicId: 'mcvs_attacker', signerEmail: 'x@y.z', signerOrdinal: 0,
      exp: Math.floor(Date.now() / 1000) + 86400,
    })).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const tampered = `${badClaim}.${sig}`;
    const result = verifySignerToken(tampered);
    expect(result.ok).toBe(false);
  });

  it('tokenHash is deterministic', () => {
    const token = 'xxx.yyy';
    expect(tokenHash(token)).toBe(tokenHash(token));
    expect(tokenHash(token)).not.toBe(tokenHash('xxx.zzz'));
  });
});

describe('envelope signature roundtrip', () => {
  it('sign + verify succeed for unchanged payload', () => {
    const payload = { version: 'mcv-sign/v0', content_hash: 'h1', x: [1, 2] };
    const signed = signEnvelopePayload({ payload, privateKey: testKeyPair.privateKey });
    expect(signed).not.toBeNull();
    const ok = verifyEnvelopeSignature({
      payload,
      signature: signed!.signature,
      publicKey: testKeyPair.publicKey,
    });
    expect(ok).toBe(true);
  });

  it('sign + verify fails on mutated payload (tamper detection)', () => {
    const payload = { version: 'mcv-sign/v0', content_hash: 'h1', x: [1, 2] };
    const signed = signEnvelopePayload({ payload, privateKey: testKeyPair.privateKey })!;
    const mutated = { ...payload, content_hash: 'h2' };
    const ok = verifyEnvelopeSignature({
      payload: mutated,
      signature: signed.signature,
      publicKey: testKeyPair.publicKey,
    });
    expect(ok).toBe(false);
  });
});

describe('buildCompletionReceipt', () => {
  it('sorts signers by ordinal', () => {
    const r = buildCompletionReceipt({
      envelopePublicId: 'mcvs_x',
      contentHash: 'abc',
      completedAt: '2026-04-16T00:00:00Z',
      signers: [
        { ordinal: 1, email: 'b', signature: 'sigB', signedAt: 't' },
        { ordinal: 0, email: 'a', signature: 'sigA', signedAt: 't' },
      ],
    });
    const signers = r.signers as Array<{ ordinal: number }>;
    expect(signers[0].ordinal).toBe(0);
    expect(signers[1].ordinal).toBe(1);
  });
});
