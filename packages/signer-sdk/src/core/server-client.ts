// packages/signer-sdk/src/core/server-client.ts
//
// Framework-agnostic fetch client for the signing backbone. Keeps the
// apiBaseUrl configurable so consumers can either use the MCV default
// backbone or BYO. Never accesses `process.env` directly — callers pass
// apiBaseUrl via SignerConfig so this file runs in Node, Deno, the
// browser, and Cloudflare Workers without shims.

import type { SignerEnvelope, SignerConfig } from './types';
import type { SignerError } from './errors';
import { extractErrorCode } from './errors';

/** Shape returned by the backbone's get-envelope action. Mirrors the
 *  Futurestate prototype's `SignerEnvelopeView.mode === 'signer'` shape
 *  but widened to the multi-document forward contract. */
export interface FetchEnvelopeResult {
  envelope: SignerEnvelope;
}

export interface AcceptSignatureInput {
  publicId: string;
  token: string;
  /** Which document in the envelope is being accepted. Multi-document
   *  envelopes require one accept per document — the signer page UI
   *  walks the `documents` array in order. */
  documentId: string;
  acceptedTerms: boolean;
  /** Forwarded to the backbone as ESIGN evidence (x-forwarded-for /
   *  user-agent). Optional in test environments. */
  ipAddress?: string;
  userAgent?: string;
  /** Server-returned consent version pinned at envelope issue-time.
   *  Backbone rejects accepts where the client's view has drifted. */
  consentVersion?: string;
}

export interface AcceptSignatureResult {
  outcome: 'signed' | 'pending_others' | 'pending_documents' | 'envelope_completed' | 'already_signed';
  envelopeId: string;
  /** The document that was just accepted. */
  documentId: string;
  remainingDocuments: number;
  remainingSigners: number;
  completion?: {
    completionSignature: string;
    completionKid: string;
    receipt: Record<string, unknown>;
  };
}

// ─── Client construction ────────────────────────────────────────────────

export interface SignerServerClient {
  fetchEnvelope: (publicId: string, token: string) => Promise<SignerEnvelope | null>;
  acceptSignature: (
    input: AcceptSignatureInput,
  ) => Promise<{ ok: true; result: AcceptSignatureResult } | { ok: false; error: SignerError; status: number }>;
}

/** Build a client bound to a specific apiBaseUrl. Invariant: this function
 *  must be safe to call multiple times (multi-tenant app issuing requests
 *  to different backbones). */
export function createSignerServerClient(config: Pick<SignerConfig, 'apiBaseUrl'>): SignerServerClient {
  const apiBase = normalizeBase(config.apiBaseUrl);

  return {
    async fetchEnvelope(publicId: string, token: string): Promise<SignerEnvelope | null> {
      const res = await fetch(`${apiBase}/api/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-envelope', publicId, token }),
        cache: 'no-store',
      });

      if (res.status === 404) return null;
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`[signer-sdk] get-envelope failed: ${res.status} ${errText}`);
      }

      const body = (await res.json().catch(() => null)) as { envelope?: SignerEnvelope } | null;
      if (!body || !body.envelope) {
        throw new Error('[signer-sdk] get-envelope returned no envelope in body');
      }
      return body.envelope;
    },

    async acceptSignature(input: AcceptSignatureInput) {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (input.ipAddress) headers['x-forwarded-for'] = input.ipAddress;
      if (input.userAgent) headers['user-agent'] = input.userAgent;

      const res = await fetch(`${apiBase}/api/sign`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'accept-signature',
          publicId: input.publicId,
          token: input.token,
          documentId: input.documentId,
          acceptedTerms: input.acceptedTerms,
          consentVersion: input.consentVersion,
        }),
        cache: 'no-store',
      });

      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

      if (!res.ok) {
        return {
          ok: false as const,
          status: res.status,
          error: {
            error: (body.error as string) ?? `[signer-sdk] accept-signature failed: ${res.status}`,
            code: extractErrorCode(body),
          },
        };
      }

      return { ok: true as const, result: body as unknown as AcceptSignatureResult };
    },
  };
}

function normalizeBase(url: string): string {
  if (!url) throw new Error('[signer-sdk] apiBaseUrl is required');
  return url.replace(/\/+$/, '');
}
