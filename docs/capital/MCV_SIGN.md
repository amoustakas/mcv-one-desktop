# MCV Sign — Protocol-Native Signing

**Epic 9 v0** · Part of [MCV Capital Protocol](./PROTOCOL.md) ·
Companion to [LEGACY_ADAPTERS.md](./LEGACY_ADAPTERS.md)

MCV Sign is the protocol-native signing rail. It coexists with
DocuSign today via a per-venture rail router; long-term it replaces
DocuSign for Capital ventures on MCV One while keeping DocuSign
available for enterprise partners who require it.

## Why

DocuSign charges per-envelope, stores our signed contracts in their
retention system, and anchors its cryptographic trust in their root.
For a capital-formation protocol that aspires to be the **root of
trust** for cap-table events, that's a hard dependency we own zero
of.

MCV Sign keeps the full chain in our hands:
- **Ed25519 signatures** signed by the same issuer keypair that signs
  AccreditedInvestorCredential VCs (Epic 11). One DID roots identity,
  credentials, and envelopes.
- **Hash-bound documents** — envelope commits to the sha256 of the
  Content OS body. Post-hoc document mutation is cryptographically
  detectable.
- **Append-only audit trail** — DB-level triggers block UPDATE/DELETE
  on `signing_envelope_audit`. Corrections are additive rows; the
  history is tamper-evident.
- **Eventually on-chain** — Epic 10 (MCV Settlement) + Epic 8 (Anchor
  cap table) can hash-anchor completion receipts to Solana so the
  binding force of the signature survives even MCV Sign outages.

## Architecture

```text
┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
│ Content OS           │     │ signing_envelopes    │     │ signing_envelope_    │
│ (e.g. subscription   │◀───▶│  id, public_id,      │───▶ │ signers              │
│  agreement markdown) │     │  content_id FK,      │     │  ordinal, email,     │
│                      │     │  content_hash,       │     │  token_hash,         │
│                      │     │  envelope_payload,   │     │  signature,          │
│                      │     │  status,             │     │  ip, user_agent      │
│                      │     │  completion_sig      │     │                      │
└──────────────────────┘     └──────────────────────┘     └──────────────────────┘
          │                            │                              │
          └────────────────────────────┼──────────────────────────────┘
                                       ▼
                         ┌──────────────────────────────┐
                         │ signing_envelope_audit       │
                         │ (append-only, trigger-       │
                         │  guarded against UPDATE/     │
                         │  DELETE)                     │
                         └──────────────────────────────┘
```

### Envelope lifecycle

1. **create** — Caller provides `contentId` (Content OS row) + signer
   list. Helper computes `content_hash = sha256(body)`, builds the
   canonical `envelope_payload`, inserts envelope + signer rows,
   writes `envelope_created` + `envelope_sent` audit entries.
2. **token issue** — Each signer gets a short-lived JWT-like token
   (default 14 days). Raw token is only in the signing URL sent to
   the signer; DB stores `sha256(token)`.
3. **signer apply** — Signer clicks URL, views document, accepts the
   ESIGN consent. `applySignature` verifies the token, re-derives the
   content hash (tamper detection), signs the canonical envelope
   payload with Ed25519, stores signature + capture metadata (IP, UA,
   timestamp) for ESIGN evidence.
4. **complete** — When the last signer applies, issuer signs a
   completion receipt that binds all signer signatures + content
   hash into one Ed25519 attestation. This is the single verifiable
   artifact external parties check.

### Rail router

Per-venture `signing_rail_config` row picks between DocuSign and MCV
Sign. The `send-signing-envelope` Capital action delegates:

- **DocuSign rail** — existing `send-docusign` flow (JWT-grant +
  template-based envelope creation). No change from PR #30.
- **MCV Sign rail** — calls `createEnvelope` in `src/lib/capital/sign/
  envelope.ts`, returns `{ envelope_public_id, signing_urls, content_
  hash }`.

Global overrides via env:
- `MCV_SIGN_FORCE_RAIL=mcv-sign|docusign|eu-sign` — operations lever
- `DEFAULT_SIGNING_RAIL=mcv-sign|docusign` — changes unconfigured
  default; stays as `docusign` until MCV Sign has ESIGN/eIDAS sign-off

### Integration with signing-reconcile

Adapter emits the same `CapitalSigningEvent` shape as DocuSign, so
[signing-reconcile.ts](../../src/lib/capital/signing-reconcile.ts)
doesn't know or care which rail produced the event. Commitment
transitions, notifications, and Fabric topics all fire identically.

## What ships in v0

- Migration: `signing_envelopes` + `signing_envelope_signers` +
  `signing_envelope_audit` + `signing_rail_config`
- `src/lib/capital/sign/` module:
  - `envelope.ts` — create envelope with hash-binding + token issuance
  - `signer.ts` — pure crypto primitives (Ed25519, canonical JSON,
    token issue/verify, completion receipt)
  - `apply.ts` — signer-side apply flow with tamper detection +
    ESIGN consent enforcement
  - `audit-trail.ts` — append-only writer
  - `rail-router.ts` — per-venture rail picker
- `src/lib/capital/adapters/mcv-sign-adapter.ts` — emits
  CapitalSigningEvent; plugs into signing-reconcile
- Capital API actions:
  - `send-signing-envelope` — rail-aware send
  - `mcv-sign-create` — direct MCV Sign envelope creation
  - `mcv-sign-apply` — signer applies signature (unauthenticated at
    Clerk layer; token IS the auth)
  - `mcv-sign-get-envelope` — read envelope + signers + audit
  - `mcv-sign-list-envelopes` — admin listing
  - `signing-rail-set` / `signing-rail-get` — per-venture rail config

## What's out of scope for v0

- React UI (`SignedDocumentViewer`, `SignerInvitationFlow`) — separate
  PR with all-frontend churn
- Email delivery of signer invitations — waiting on comms-sdk pick
- DocuSign → MCV Sign data migration — additive coexistence first
- ESIGN/eIDAS legal certification — counsel review before go-live
- On-chain anchoring of completion receipts — depends on Epic 10
  settlement primitives
- Multi-party signer workflows (witness requirements, notarization,
  OCSP revocation) — v1+
- QES (Qualified Electronic Signature, EU) — needs certificate-based
  signing which isn't Ed25519-only

## ESIGN/eIDAS roadmap

| Level | Requirement | Status |
|---|---|---|
| **ESIGN (US)** consent + intent | Explicit `acceptedTerms: true` + IP + UA + timestamp capture | **v0 ✅** |
| **ESIGN** document retention | Content OS row + append-only audit + completion signature | **v0 ✅** |
| **ESIGN** association | Token → envelope → signer linkage | **v0 ✅** |
| **eIDAS SES** (Simple) | Any reliable identification method | **v0 ✅** |
| **eIDAS AdES** (Advanced) | Hash-bound document, unique signer ID, signer control, tamper detection | **v0 ✅** |
| **eIDAS QES** (Qualified) | Certificate-based signing from a qualified trust service provider | v2+ (needs CA integration) |

**v0 does not claim legal enforceability without counsel review.** The
technology meets AdES-level properties; the **legal binding** on
jurisdiction-by-jurisdiction basis requires jurisdiction-specific
disclosures + retention terms that counsel + Epic 14 (Consortium)
will codify.

## Migration from DocuSign (planned, not this PR)

1. Ventures begin on DocuSign (default). Each envelope creates rows
   in `docusign_envelopes` (PR #30).
2. Ops picks a pilot venture, flips its rail: `signing-rail-set
   venture_id=… rail=mcv-sign`. Next envelope sent via MCV Sign.
3. Old DocuSign-signed commitments stay valid — the VC gate and the
   compliance loop don't care which rail signed the envelope.
4. Backfill job (future PR): copy `docusign_envelopes` rows into
   `signing_envelopes` with `adapter='docusign'` so admin UI queries
   have one unified table.
5. When 100% of ventures are on MCV Sign, deprecate the DocuSign
   adapter (remove env vars, mark `rail='docusign'` as legacy).

---

**Version:** MCV Sign v0 · Epic 9 kickoff · 2026-04-16
