# MCV DID Root — Trust Anchor Registry

Single root of trust for the MCV One ecosystem. One Ed25519 keypair anchors
**two** attestation chains that external parties verify against one public
DID document:

1. **Epic 11 — Verifiable Credentials**
   AccreditedInvestorCredential (and sibling VCs) are issued + signed here.
   See [`src/lib/capital/vc-issuer.ts`](../../src/lib/capital/vc-issuer.ts).

2. **Epic 9 — MCV Sign**
   Envelope completion attestations (signing_envelopes.completion_signature)
   are signed with the same key. See [`src/lib/capital/sign/signer.ts`](../../src/lib/capital/sign/signer.ts).

## Why one key, not two

If VC + signing use different keys, external verifiers need two trust
anchors. When we rotate, both must coordinate. Reusing one keypair means:

- One DID document to publish
- One rotation event to choreograph
- One revocation registry to maintain
- One back-up artifact to protect

Trade-off: if the key is ever compromised, both chains need re-issuance.
Mitigated by hardware-backed cold storage + 1Password encrypted backup
before first use. Never check the `.pem` into git.

## Environment variable

```
MCV_VC_ISSUER_PRIVATE_KEY_PEM    # Ed25519 private key, PKCS#8 PEM format
```

Provisioned across:
- Vercel investor app (VC issuance + signer acceptance routes)
- Vercel admin app (envelope creation + completion attestation)
- Kernel worker (if running any signing-related cron jobs)

## Generation procedure

```bash
# Generate fresh Ed25519 private key in PKCS#8 PEM
openssl genpkey -algorithm ed25519 -out mcv-vc-issuer.pem

# Extract public key for DID document publication
openssl pkey -in mcv-vc-issuer.pem -pubout -out mcv-vc-issuer.pub

# Back up encrypted BEFORE first use
# 1. Upload mcv-vc-issuer.pem to 1Password (MCV vault, "MCV-VC-Issuer-PEM" item)
# 2. Copy to cold storage (air-gapped USB / paper ceremony)
# 3. Push env var to Vercel: vercel env add MCV_VC_ISSUER_PRIVATE_KEY_PEM production
# 4. DO NOT commit the .pem file to git — add to .gitignore if needed
```

## DID document

Publish the public key under `did:web:mcv.one` (or sub-domain if reserved).

`https://mcv.one/.well-known/did.json`:

```json
{
  "@context": ["https://www.w3.org/ns/did/v1", "https://w3id.org/security/suites/ed25519-2020/v1"],
  "id": "did:web:mcv.one",
  "verificationMethod": [{
    "id": "did:web:mcv.one#key-1",
    "type": "Ed25519VerificationKey2020",
    "controller": "did:web:mcv.one",
    "publicKeyMultibase": "<base58-encoded public key from mcv-vc-issuer.pub>"
  }],
  "assertionMethod": ["did:web:mcv.one#key-1"]
}
```

Placed as a static asset on the mcv.one domain. No runtime code required —
pure publication.

## Rotation (if ever needed)

**Do not rotate** until a migration plan is written and approved. Rotation
implications:

1. All existing signed envelopes become unverifiable unless we preserve the
   old public key in the DID document as `verificationMethod` alongside the
   new one (supported by DID spec).
2. VCs issued under the old key stay verifiable via the old key's retention.
3. New envelopes + VCs use the new key; `signing_envelopes.completion_signing_key`
   column already tracks which `kid` signed what.

The clean rotation recipe:
- Publish new key as `did:web:mcv.one#key-2` alongside existing `#key-1`
- Switch signer + VC issuer to use key-2
- Preserve key-1 in DID document indefinitely for historical signature verification
- Cold-store key-1 as "retired but valid for historical verification"

## Status

| Field | Value |
|---|---|
| Current key | **NOT YET GENERATED** — Wave 0.3 of Session 13 marathon |
| Public DID | `did:web:mcv.one` (pending publication) |
| First signing event | Pending (after Wave 1 signer UI ships) |
| Backup verified | Pending |
| Rotation plan | None — document procedure above before first rotation |

## Related docs

- [MCV Sign v0 spec](../capital/MCV_SIGN.md)
- [VC issuer implementation](../../src/lib/capital/vc-issuer.ts)
- Epic 9 (MCV Sign) + Epic 11 (Identity) — see marathon plan at
  `C:\Users\moust\.claude\plans\shimmering-exploring-petal.md`
