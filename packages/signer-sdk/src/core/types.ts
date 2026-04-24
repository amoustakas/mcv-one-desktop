// packages/signer-sdk/src/core/types.ts
//
// Forward-facing signing contract. v0.1 must satisfy the mass-expansion
// checklist (see README §2.4): N documents per envelope, human + agent
// origin, role-agnostic signer shape, child-venture tenancy, template
// version pinning, cross-tree audit rollup, jurisdiction + attestation
// extension points.
//
// Framework-agnostic — pure types, zero React/Next/Node surface. Consumers
// in `./react`, `./next`, `./server` build on top.

import type { ReactNode } from 'react';

// ─── Signer identity ────────────────────────────────────────────────────

/**
 * Who is signing. Role is intentionally freeform + human-displayable so
 * different ventures can carry their own role vocabulary (investor /
 * contractor / partner / beneficiary / counsel / …) without the SDK
 * owning an enum that would fossilize under mass expansion.
 */
export interface Signer {
  name: string;
  email: string;
  /** Venture-defined role code, e.g. 'investor' | 'employee' | 'counsel' */
  role?: string;
  /** Human-readable override for UI ("Lead Investor", "General Counsel") */
  displayRole?: string;
  /** v0.2 extension point — WebAuthn / authorized-device binding. Typed as
   *  Record<string, unknown> in v0.1 so consumers can forward-declare fields. */
  attestation?: AttestationContext;
}

// ─── Documents + envelope ───────────────────────────────────────────────

export type DocumentOrigin = 'human' | 'agent';

/** Metadata populated when `origin === 'agent'`. Downstream subscribers
 *  (Draft Inbox, compliance dashboards) use this to trace auto-generated
 *  documents back to the workflow + agent that authored them. */
export interface AgentDocumentAttribution {
  agentHandle: string;
  workflowId: string;
  /** The correlation id of the draft event that produced this document.
   *  Joins with the events-sdk envelope graph. */
  draftEventId?: string;
}

export interface SignerDocument {
  id: string;
  templateId: string;
  /** Pinned per envelope at issue-time. `signing.envelope.mutation-detected`
   *  fires if the underlying template moves after issue. */
  templateVersion: number;
  origin: DocumentOrigin;
  generatedByAgent?: AgentDocumentAttribution;
  /** Pre-wrapped text rendered bytes — what the signer literally sees and
   *  commits to. No HTML parsing; ESIGN-integrity guarantee. */
  renderedBytes: string;
  /** ISO timestamp of render. */
  renderedAt: string;
  /** SHA-256 of `renderedBytes`. Signature commits to this hash. */
  renderedSha256: string;
  /** Optional subject line for this individual document (envelopes with N
   *  documents use this for the per-document nav). */
  subject?: string;
}

export type EnvelopeStatus =
  | 'draft'
  | 'issued'
  | 'viewed'
  | 'partial'
  | 'signed'
  | 'voided'
  | 'expired';

export interface AuditTrail {
  issuedAt: string;
  issuedBy: string;
  viewedAt?: string;
  firstSignedAt?: string;
  lastSignedAt?: string;
  voidedAt?: string;
  voidedBy?: string;
  voidReason?: string;
  /** IP hash (SHA-256 over `ip + envelope.publicId` so raw IPs never
   *  leave the server). One hash per access event. */
  accessIpHashes?: string[];
}

export interface SignerEnvelope {
  publicId: string;
  /** Scope tuple — matches the Phase-1 Intelligence Router's (tenantId,
   *  ventureId) shape. Child-ventures inherit the parent's tenantId but
   *  carry their own ventureId as `childVentureId`. */
  tenantId: string;
  parentVentureId: string;
  childVentureId?: string;
  envelopeVersion: number;
  documents: SignerDocument[];
  signer: Signer;
  status: EnvelopeStatus;
  issuedAt: string;
  expiresAt: string;
  audit: AuditTrail;
  /** Optional sender-provided message shown above the first document. */
  message?: string;
}

// ─── Config (what consumers pass in) ────────────────────────────────────

export type Jurisdiction = 'us';

/** v0.2 extension — see `./v0-2-hooks/attestation.ts`. */
export type AttestationContext = Record<string, unknown>;
export interface AttestationResult {
  verified: boolean;
  method?: 'webauthn' | 'device-bind' | 'otp' | 'none';
  verifiedAt?: string;
  evidence?: Record<string, unknown>;
}
export type AttestationHook = (ctx: AttestationContext) => Promise<AttestationResult>;

export interface SignerTheme {
  /** Mapped onto document.documentElement CSS custom properties. Covers
   *  the 80% "change the accent color + surface tone" case without
   *  needing a component override. */
  cssVars?: Record<string, string>;
  logo?: { src: string; alt: string; width?: number; height?: number };
  typography?: { fontFamily?: string; headingFontFamily?: string };
  /** Shifts the consent-copy tone without changing its legal semantics. */
  legalTone?: 'formal' | 'plain';
  /** Venture-specific footer slot — legal entity name, contact email. */
  footerCopySlot?: ReactNode;
}

export interface SignerConfig {
  /** Upstream signing service base URL. Defaults to `MCV_SIGN_API_URL` env
   *  on the server side. Ventures can point at a bring-your-own backbone. */
  apiBaseUrl: string;
  /** Same-origin proxy path; defaults to `/api/sign/accept`. */
  proxyPath?: string;
  theme?: SignerTheme;
  /** v0.1 only accepts 'us'. Widens in v0.2. */
  jurisdiction?: Jurisdiction;
  /** Optional synchronous callback on every signing event. Events are also
   *  emitted to `@mcv/events-sdk` so subscribers on the event bus see them
   *  whether or not the caller wires this. */
  onEvent?: (event: SigningEventPayload) => void;
  /** v0.2 stub — types exported, no-op in v0.1 unless the attestation
   *  subpath is explicitly consumed by the server-side envelope-builder. */
  attestationHook?: AttestationHook;
}

// ─── Events (contract-shape re-export for convenience) ──────────────────

export type SigningTopic =
  | 'signing.envelope.created'
  | 'signing.envelope.viewed'
  | 'signing.envelope.signed'
  | 'signing.envelope.voided'
  | 'signing.envelope.mutation-detected';

/** Discriminated union over the 5 v0.1 topics. Each variant carries a
 *  distinct payload shape. See `../events/contracts.ts` for the Zod
 *  schemas that validate these at emit-time. */
export type SigningEventPayload =
  | EnvelopeCreatedPayload
  | EnvelopeViewedPayload
  | EnvelopeSignedPayload
  | EnvelopeVoidedPayload
  | EnvelopeMutationDetectedPayload;

export interface EnvelopeCreatedPayload {
  topic: 'signing.envelope.created';
  publicId: string;
  tenantId: string;
  parentVentureId: string;
  childVentureId?: string;
  documentCount: number;
  signerEmail: string;
  issuedAt: string;
}

export interface EnvelopeViewedPayload {
  topic: 'signing.envelope.viewed';
  publicId: string;
  tenantId: string;
  viewedAt: string;
  userAgent?: string;
  ipHash?: string;
}

export interface EnvelopeSignedPayload {
  topic: 'signing.envelope.signed';
  publicId: string;
  tenantId: string;
  documentId: string;
  signedAt: string;
  /** SHA-256 of the final signature bytes. Not the private signature
   *  itself — that stays server-side. */
  signatureHash: string;
}

export interface EnvelopeVoidedPayload {
  topic: 'signing.envelope.voided';
  publicId: string;
  tenantId: string;
  voidedAt: string;
  voidedBy: string;
  reason?: string;
}

export interface EnvelopeMutationDetectedPayload {
  topic: 'signing.envelope.mutation-detected';
  publicId: string;
  templateId: string;
  expectedVersion: number;
  actualVersion: number;
  detectedAt: string;
}
