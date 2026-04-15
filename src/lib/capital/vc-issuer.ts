// MCV Capital — AccreditedInvestorCredential issuer (Epic 11 Story 1-4 v0).
//
// Per docs/capital/PROTOCOL.md §Investor Credential: issues a W3C Verifiable
// Credential attesting accreditation status. MVP scope (no DID resolver yet):
//   - subject: did:mcv:user:<clerk_user_id>
//   - issuer:  did:mcv:issuer:<keyid>  (self-sovereign at this stage;
//              federated/registered verifier list lands when Consortium forms)
//   - signature: Ed25519 over a canonicalized JSON payload
//   - falls back to `unsigned` credential when MCV_VC_SIGNING_KEY is absent
//     (dev/preview convenience — production requires the key)
//
// Depends only on Node's built-in `crypto` — no new runtime deps.
//
// Storage: capital_investor_profile.metadata.vc (JSON). Verify on commit via
// vc-verifier.ts. No chain anchor yet — that's a follow-up when Solana
// primitives land (Epic 8).

import { createPrivateKey, createPublicKey, sign as cryptoSign, verify as cryptoVerify } from 'node:crypto';

export type AccreditationStatus = 'accredited' | 'qualified_purchaser' | 'institutional' | 'non_accredited';
export type AccreditationJurisdiction = 'US' | 'CA' | 'EU' | 'UK' | 'other';

export interface AccreditationCredentialSubject {
  id: string; // did:mcv:user:<clerk_user_id>
  accreditationStatus: AccreditationStatus;
  jurisdiction: AccreditationJurisdiction;
  verificationMethod: string; // e.g. "futurestate-kyc-v2"
  verifiedAt: string; // ISO
  /** Optional: specific exemption(s) satisfied (e.g. "Rule 501(a)(5)"). */
  exemptions?: string[];
}

export interface VerifiableCredential {
  '@context': string[];
  type: string[];
  id: string;
  issuer: string;
  issuanceDate: string;
  expirationDate: string;
  credentialSubject: AccreditationCredentialSubject;
  proof?: {
    type: 'Ed25519Signature2020';
    created: string;
    verificationMethod: string; // issuer DID + #key-1
    proofPurpose: 'assertionMethod';
    jws: string; // base64url Ed25519 sig over canonicalized body
  };
}

const VC_CONTEXT = [
  'https://www.w3.org/ns/credentials/v2',
  'https://mcv.one/credentials/v1',
];

/** Canonicalize the credential body for signing — sorted JSON, omitting proof. */
function canonicalize(vc: Omit<VerifiableCredential, 'proof'>): string {
  const ordered: Record<string, unknown> = {};
  for (const k of Object.keys(vc).sort()) ordered[k] = (vc as Record<string, unknown>)[k];
  return JSON.stringify(ordered);
}

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function base64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function loadSigningKey(): { privateKey: ReturnType<typeof createPrivateKey>; keyId: string } | null {
  const pem = process.env.MCV_VC_SIGNING_KEY;
  if (!pem) return null;
  try {
    const privateKey = createPrivateKey(pem);
    const keyId = process.env.MCV_VC_KEY_ID ?? 'key-1';
    return { privateKey, keyId };
  } catch (err) {
    console.warn('[vc-issuer] MCV_VC_SIGNING_KEY present but failed to parse:', err instanceof Error ? err.message : err);
    return null;
  }
}

export interface IssueAccreditationInput {
  clerkUserId: string;
  accreditationStatus: AccreditationStatus;
  jurisdiction: AccreditationJurisdiction;
  verificationMethod: string;
  exemptions?: string[];
  /** Validity window in days. Default 365 (matches Reg D re-certification cadence). */
  validityDays?: number;
  /** Override issuer DID. Default derives from env issuer id or falls back to "did:mcv:issuer:self". */
  issuer?: string;
}

export function issueAccreditationCredential(input: IssueAccreditationInput): VerifiableCredential {
  const now = new Date();
  const exp = new Date(now.getTime() + (input.validityDays ?? 365) * 24 * 60 * 60 * 1000);
  const subjectDid = `did:mcv:user:${input.clerkUserId}`;
  const issuerDid = input.issuer
    ?? (process.env.MCV_VC_ISSUER_DID ?? 'did:mcv:issuer:self');

  const body: Omit<VerifiableCredential, 'proof'> = {
    '@context': VC_CONTEXT,
    type: ['VerifiableCredential', 'AccreditedInvestorCredential'],
    id: `urn:mcv:vc:${input.clerkUserId}:${now.getTime()}`,
    issuer: issuerDid,
    issuanceDate: now.toISOString(),
    expirationDate: exp.toISOString(),
    credentialSubject: {
      id: subjectDid,
      accreditationStatus: input.accreditationStatus,
      jurisdiction: input.jurisdiction,
      verificationMethod: input.verificationMethod,
      verifiedAt: now.toISOString(),
      ...(input.exemptions ? { exemptions: input.exemptions } : {}),
    },
  };

  const key = loadSigningKey();
  if (!key) {
    // Dev / preview mode — unsigned credential. vc-verifier.ts rejects these
    // in production via a NODE_ENV check.
    return body;
  }

  const message = Buffer.from(canonicalize(body), 'utf8');
  const sig = cryptoSign(null, message, key.privateKey);
  return {
    ...body,
    proof: {
      type: 'Ed25519Signature2020',
      created: now.toISOString(),
      verificationMethod: `${issuerDid}#${key.keyId}`,
      proofPurpose: 'assertionMethod',
      jws: base64url(sig),
    },
  };
}

export interface VerifyResult {
  ok: boolean;
  reason?: string;
  expired?: boolean;
  unsigned?: boolean;
}

export function verifyAccreditationCredential(vc: VerifiableCredential, publicKeyPem?: string): VerifyResult {
  // Expiration check first — cheap
  if (vc.expirationDate && new Date(vc.expirationDate) < new Date()) {
    return { ok: false, expired: true, reason: 'credential expired' };
  }

  // Subject must have expected shape
  const subj = vc.credentialSubject;
  if (!subj?.id?.startsWith('did:mcv:user:')) {
    return { ok: false, reason: 'subject.id missing or not a did:mcv:user' };
  }
  const validStatuses: AccreditationStatus[] = ['accredited', 'qualified_purchaser', 'institutional', 'non_accredited'];
  if (!validStatuses.includes(subj.accreditationStatus)) {
    return { ok: false, reason: `invalid accreditationStatus: ${subj.accreditationStatus}` };
  }

  // Unsigned credentials accepted only outside production
  if (!vc.proof) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, unsigned: true, reason: 'unsigned credential rejected in production' };
    }
    return { ok: true, unsigned: true };
  }

  // Signature verification
  const pem = publicKeyPem ?? process.env.MCV_VC_PUBLIC_KEY;
  if (!pem) {
    return { ok: false, reason: 'no public key configured to verify proof' };
  }
  try {
    const { proof, ...body } = vc;
    const message = Buffer.from(canonicalize(body), 'utf8');
    const pubKey = createPublicKey(pem);
    const sig = base64urlDecode(proof.jws);
    const ok = cryptoVerify(null, message, pubKey, sig);
    return ok ? { ok: true } : { ok: false, reason: 'signature verification failed' };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'verify threw' };
  }
}
