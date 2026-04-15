// VC issuer/verifier — roundtrip + negative paths.
// Uses Node's built-in Ed25519 key generation to avoid fixture files.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateKeyPairSync } from 'node:crypto';
import { issueAccreditationCredential, verifyAccreditationCredential } from '../vc-issuer';

describe('vc-issuer: roundtrip', () => {
  let privatePem: string;
  let publicPem: string;
  const originalEnv = { ...process.env };

  beforeAll(() => {
    const { privateKey, publicKey } = generateKeyPairSync('ed25519');
    privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
    publicPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
    process.env.MCV_VC_SIGNING_KEY = privatePem;
    process.env.MCV_VC_PUBLIC_KEY = publicPem;
    process.env.MCV_VC_KEY_ID = 'test-key-1';
    process.env.MCV_VC_ISSUER_DID = 'did:mcv:issuer:test';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('issues a signed credential with correct shape', () => {
    const vc = issueAccreditationCredential({
      clerkUserId: 'user_tony',
      accreditationStatus: 'accredited',
      jurisdiction: 'US',
      verificationMethod: 'futurestate-kyc-v2',
      exemptions: ['Rule 501(a)(5)'],
    });

    expect(vc['@context']).toContain('https://www.w3.org/ns/credentials/v2');
    expect(vc.type).toEqual(['VerifiableCredential', 'AccreditedInvestorCredential']);
    expect(vc.credentialSubject.id).toBe('did:mcv:user:user_tony');
    expect(vc.credentialSubject.accreditationStatus).toBe('accredited');
    expect(vc.credentialSubject.jurisdiction).toBe('US');
    expect(vc.credentialSubject.exemptions).toEqual(['Rule 501(a)(5)']);
    expect(vc.issuer).toBe('did:mcv:issuer:test');
    expect(vc.proof).toBeDefined();
    expect(vc.proof?.type).toBe('Ed25519Signature2020');
    expect(vc.proof?.verificationMethod).toBe('did:mcv:issuer:test#test-key-1');
  });

  it('verifies a signed credential successfully', () => {
    const vc = issueAccreditationCredential({
      clerkUserId: 'user_tony',
      accreditationStatus: 'qualified_purchaser',
      jurisdiction: 'US',
      verificationMethod: 'futurestate-kyc-v2',
    });
    const result = verifyAccreditationCredential(vc, publicPem);
    expect(result.ok).toBe(true);
  });

  it('detects tampering — modifying credentialSubject invalidates the signature', () => {
    const vc = issueAccreditationCredential({
      clerkUserId: 'user_tony',
      accreditationStatus: 'non_accredited',
      jurisdiction: 'US',
      verificationMethod: 'futurestate-kyc-v2',
    });
    // Upgrade without re-signing — verifier should reject
    const tampered = { ...vc, credentialSubject: { ...vc.credentialSubject, accreditationStatus: 'accredited' as const } };
    const result = verifyAccreditationCredential(tampered, publicPem);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/signature/i);
  });

  it('rejects expired credentials', () => {
    const vc = issueAccreditationCredential({
      clerkUserId: 'user_tony',
      accreditationStatus: 'accredited',
      jurisdiction: 'US',
      verificationMethod: 'futurestate-kyc-v2',
      validityDays: -1, // already expired
    });
    const result = verifyAccreditationCredential(vc, publicPem);
    expect(result.ok).toBe(false);
    expect(result.expired).toBe(true);
  });

  it('rejects subjects that are not did:mcv:user:*', () => {
    const vc = issueAccreditationCredential({
      clerkUserId: 'user_tony',
      accreditationStatus: 'accredited',
      jurisdiction: 'US',
      verificationMethod: 'futurestate-kyc-v2',
    });
    const bad = { ...vc, credentialSubject: { ...vc.credentialSubject, id: 'mailto:tony@mcv.one' } };
    const result = verifyAccreditationCredential(bad, publicPem);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/did:mcv:user/);
  });
});

describe('vc-issuer: unsigned dev mode', () => {
  const originalKey = process.env.MCV_VC_SIGNING_KEY;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeAll(() => {
    delete process.env.MCV_VC_SIGNING_KEY;
    delete process.env.MCV_VC_PUBLIC_KEY;
  });

  afterAll(() => {
    if (originalKey) process.env.MCV_VC_SIGNING_KEY = originalKey;
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('emits an unsigned credential when signing key is absent', () => {
    const vc = issueAccreditationCredential({
      clerkUserId: 'user_tony',
      accreditationStatus: 'accredited',
      jurisdiction: 'US',
      verificationMethod: 'dev',
    });
    expect(vc.proof).toBeUndefined();
  });

  it('accepts unsigned credentials outside production', () => {
    process.env.NODE_ENV = 'development';
    const vc = issueAccreditationCredential({
      clerkUserId: 'user_tony',
      accreditationStatus: 'accredited',
      jurisdiction: 'US',
      verificationMethod: 'dev',
    });
    const result = verifyAccreditationCredential(vc);
    expect(result.ok).toBe(true);
    expect(result.unsigned).toBe(true);
  });

  it('rejects unsigned credentials in production', () => {
    process.env.NODE_ENV = 'production';
    const vc = issueAccreditationCredential({
      clerkUserId: 'user_tony',
      accreditationStatus: 'accredited',
      jurisdiction: 'US',
      verificationMethod: 'dev',
    });
    const result = verifyAccreditationCredential(vc);
    expect(result.ok).toBe(false);
    expect(result.unsigned).toBe(true);
  });
});
