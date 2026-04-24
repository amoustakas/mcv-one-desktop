// packages/signer-sdk/src/server/envelope-builder.ts
//
// Server-side envelope composition. The canonical entry point for:
//
//   1. Human-drafted documents — admin/console flow calls
//      buildEnvelope({ origin: 'human', ... }).
//   2. Agent-generated documents — M4 Draft Inbox "approve" action
//      calls buildEnvelope({ origin: 'agent', generatedByAgent: { ... } })
//      after the Tony-review gate clears.
//
// Runs on the server (Node / Edge / Workers). Validates the assembled
// envelope against the zod schema before returning so bad inputs fail
// fast — callers should wrap their INSERT in the same transaction as
// this call's result for atomicity.
//
// Pure function — no DB coupling. Callers persist the returned envelope
// via whatever their backbone uses (typically Supabase; see the migration
// in /supabase/migration-signer-sdk-v0-1-2026-04-24.sql).

import { createHash, randomBytes } from 'node:crypto';
import { parseEnvelope } from '../core/envelope-schema';
import type {
  SignerEnvelope,
  SignerDocument,
  Signer,
  DocumentOrigin,
  AgentDocumentAttribution,
  AuditTrail,
} from '../core/types';

export interface BuildDocumentInput {
  templateId: string;
  templateVersion: number;
  /** Pre-rendered bytes. Callers are responsible for rendering the
   *  template against data; this function does not template-substitute.
   *  Keeping it that way preserves the "what you sign is what you see"
   *  guarantee — the same bytes flow through sha256 + storage + UI. */
  renderedBytes: string;
  /** ISO timestamp the bytes were rendered. */
  renderedAt?: string;
  subject?: string;
}

export interface BuildEnvelopeInput {
  tenantId: string;
  parentVentureId: string;
  childVentureId?: string;
  signer: Signer;
  documents: BuildDocumentInput[];
  origin: DocumentOrigin;
  generatedByAgent?: AgentDocumentAttribution;
  /** ISO timestamp or Date — defaults to now. */
  issuedAt?: string | Date;
  /** ISO timestamp or Date — defaults to issuedAt + 30 days. */
  expiresAt?: string | Date;
  /** Optional message surfaced above the first document in the signer UI. */
  message?: string;
  /** Defaults to `system:signer-sdk`. */
  issuedBy?: string;
  /** When omitted, a cryptographically random 16-char publicId is minted. */
  publicId?: string;
}

export interface BuildEnvelopeResult {
  envelope: SignerEnvelope;
  /** The sha256 hashes of each document, in envelope.documents order.
   *  Convenience surface so callers can index their content store by
   *  hash without re-hashing. */
  renderedShas: string[];
}

/** Compose and validate a SignerEnvelope ready for persistence. */
export function buildEnvelope(input: BuildEnvelopeInput): BuildEnvelopeResult {
  if (input.origin === 'agent' && !input.generatedByAgent) {
    throw new Error('[signer-sdk] agent-origin envelopes require generatedByAgent metadata');
  }
  if (!input.documents.length) {
    throw new Error('[signer-sdk] envelope must carry at least one document');
  }

  const issuedAt = normaliseIso(input.issuedAt) ?? new Date().toISOString();
  const expiresAt = normaliseIso(input.expiresAt) ?? addDays(issuedAt, 30);
  const publicId = input.publicId ?? mintPublicId();

  const documents: SignerDocument[] = input.documents.map((doc, idx) => {
    const renderedAt = normaliseIso(doc.renderedAt) ?? issuedAt;
    const renderedSha256 = sha256Hex(doc.renderedBytes);
    const base: SignerDocument = {
      id: `${publicId}:${idx}`,
      templateId: doc.templateId,
      templateVersion: doc.templateVersion,
      origin: input.origin,
      renderedBytes: doc.renderedBytes,
      renderedAt,
      renderedSha256,
      subject: doc.subject,
    };
    return input.origin === 'agent' && input.generatedByAgent
      ? { ...base, generatedByAgent: input.generatedByAgent }
      : base;
  });

  const audit: AuditTrail = {
    issuedAt,
    issuedBy: input.issuedBy ?? 'system:signer-sdk',
  };

  const raw: SignerEnvelope = {
    publicId,
    tenantId: input.tenantId,
    parentVentureId: input.parentVentureId,
    childVentureId: input.childVentureId,
    envelopeVersion: 1,
    documents,
    signer: input.signer,
    status: 'issued',
    issuedAt,
    expiresAt,
    audit,
    message: input.message,
  };

  // Validates ISO timestamps, uuid-ish shapes, email, sha256 shape, and
  // the "agent-origin documents must include attribution" refine.
  const envelope = parseEnvelope(raw) as SignerEnvelope;

  return {
    envelope,
    renderedShas: documents.map((d) => d.renderedSha256),
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────

function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

function mintPublicId(): string {
  // 16 url-safe chars ≈ 80 bits entropy — plenty for an unguessable
  // envelope lookup id. Consumers wanting UUIDs can pass one explicitly.
  return randomBytes(12)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function normaliseIso(value: string | Date | undefined): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  return value;
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}
