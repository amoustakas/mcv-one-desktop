// packages/signer-sdk/src/core/envelope-schema.ts
//
// Zod validators paired with the TypeScript contracts in ./types.ts.
// Used at system boundaries — server-side envelope-builder validates on
// emit, client-side server-client validates on fetch, and the events-sdk
// emitter validates payloads before publish. Keeping them here (not in
// types.ts) preserves the "pure types, zero runtime deps" property of
// the core/types.ts barrel for consumers that only need compile-time
// signatures.

import { z } from 'zod';

// ─── Primitive schemas ──────────────────────────────────────────────────

const signerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.string().optional(),
  displayRole: z.string().optional(),
  attestation: z.record(z.string(), z.unknown()).optional(),
});

const agentAttributionSchema = z.object({
  agentHandle: z.string().min(1),
  workflowId: z.string().min(1),
  draftEventId: z.string().uuid().optional(),
});

const signerDocumentSchema = z.object({
  id: z.string().min(1),
  templateId: z.string().min(1),
  templateVersion: z.number().int().nonnegative(),
  origin: z.enum(['human', 'agent']),
  generatedByAgent: agentAttributionSchema.optional(),
  renderedBytes: z.string(),
  renderedAt: z.string().datetime({ offset: true }),
  renderedSha256: z.string().regex(/^[a-f0-9]{64}$/i),
  subject: z.string().optional(),
}).refine(
  (d) => d.origin !== 'agent' || d.generatedByAgent !== undefined,
  { message: 'agent-origin documents must include generatedByAgent metadata' },
);

const auditTrailSchema = z.object({
  issuedAt: z.string().datetime({ offset: true }),
  issuedBy: z.string().min(1),
  viewedAt: z.string().datetime({ offset: true }).optional(),
  firstSignedAt: z.string().datetime({ offset: true }).optional(),
  lastSignedAt: z.string().datetime({ offset: true }).optional(),
  voidedAt: z.string().datetime({ offset: true }).optional(),
  voidedBy: z.string().optional(),
  voidReason: z.string().optional(),
  accessIpHashes: z.array(z.string()).optional(),
});

export const envelopeSchema = z.object({
  publicId: z.string().min(1),
  tenantId: z.string().min(1),
  parentVentureId: z.string().min(1),
  childVentureId: z.string().optional(),
  envelopeVersion: z.number().int().nonnegative(),
  documents: z.array(signerDocumentSchema).min(1),
  signer: signerSchema,
  status: z.enum(['draft', 'issued', 'viewed', 'partial', 'signed', 'voided', 'expired']),
  issuedAt: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }),
  audit: auditTrailSchema,
  message: z.string().optional(),
});

export const signerConfigSchema = z.object({
  apiBaseUrl: z.string().url(),
  proxyPath: z.string().startsWith('/').optional(),
  jurisdiction: z.literal('us').optional(),
}).passthrough(); // `theme`, `onEvent`, `attestationHook` are structural — skip runtime validation.

// ─── Parse helpers ──────────────────────────────────────────────────────

/** Parse + throw — use at trust boundaries when a malformed envelope is
 *  a hard error (e.g. server-side envelope-builder before insert). */
export function parseEnvelope(input: unknown) {
  return envelopeSchema.parse(input);
}

/** Safe parse — use at untrusted input boundaries (client-side fetch
 *  response, third-party webhook body). Returns a discriminated result. */
export function safeParseEnvelope(input: unknown) {
  return envelopeSchema.safeParse(input);
}

// ─── Schema re-exports for consumer composition ─────────────────────────

export {
  signerSchema,
  signerDocumentSchema,
  auditTrailSchema,
  agentAttributionSchema,
};
