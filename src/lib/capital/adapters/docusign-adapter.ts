// Capital × DocuSign — LegacyAdapter (signing rail).
// Epic 13 Story 3 + Epic 9 bridge.
//
// Shape: outbound-then-webhook (mirrors VerifyInvestor S9). DocuSign
// is the first signing-rail adapter; emits CapitalSigningEvent so MCV
// Sign (Epic 9) and future eIDAS vendors plug in as peer adapters
// without changing the reconcile path.
//
//   Outbound:  createEnvelope(commitment, templateId) → { envelopeId,
//              hostedRecipientUrl?, status }
//   Inbound:   webhook POSTs envelope-status events
//              (envelope-completed/declined/voided/sent)
//              → adapter.fromForeign → CapitalSigningEvent
//              → reconcileCapitalSigning transitions
//                capital_commitments.status to 'signed', stamps
//                docusign_envelope_id, persists signed-PDF receipt
//                into Content OS, fires capital.commitment.signed
//                notification + Fabric topic
//
// Why outbound-then-webhook here: DocuSign's hosted-recipient flow
// returns a redirect URL the investor visits. Completion arrives
// asynchronously at /api/docusign-webhook signed with HMAC-SHA256.
// Same lifecycle as VerifyInvestor → makes the abstraction natural
// when MCV Sign lands as a peer.
//
// Mock path: when DOCUSIGN_INTEGRATION_KEY is absent (dev / preview)
// createEnvelope returns a deterministic mock envelope id so
// integration tests + dogfood demos work without cred procurement.

import type { LegacyAdapter, CapitalSigningEvent } from './types';

/** Subset of the DocuSign envelope event we reconcile on. The webhook
 *  payload is much richer; we keep only fields the adapter needs and
 *  pass the rest through `rawEvent`. */
export interface DocuSignEnvelopeEvent {
  event: 'envelope-completed' | 'envelope-declined' | 'envelope-voided' | 'envelope-sent' | 'envelope-corrected';
  apiVersion?: string;
  uri?: string;
  retryCount?: number;
  generatedDateTime?: string;
  data: {
    envelopeId: string;
    /** When DocuSign Connect "Include Documents" is enabled, the
     *  webhook ships the signed PDF as base64 in `envelopeSummary.
     *  envelopeDocuments[0].PDFBytes`. We surface the field here as
     *  a hint for the reconcile helper. */
    envelopeSummary?: {
      status?: string;
      completedDateTime?: string;
      declinedDateTime?: string;
      voidedDateTime?: string;
      voidedReason?: string;
      recipients?: {
        signers?: Array<{
          name?: string;
          email?: string;
          roleName?: string;
          signedDateTime?: string;
          clientUserId?: string;
          deliveryMethod?: string;
        }>;
      };
      envelopeDocuments?: Array<{
        documentId?: string;
        name?: string;
        PDFBytes?: string;     // base64
      }>;
    };
    /** Custom fields stamped at envelope creation so we can correlate
     *  back to a Capital commitment without an extra DB lookup. */
    envelopeCustomFields?: {
      textCustomFields?: Array<{ name: string; value: string }>;
    };
  };
}

export interface DocuSignAdapterOptions {
  /** Reserved for future per-rail config (e.g. preview vs production
   *  env routing). Kept for shape uniformity with other adapters. */
  _reserved?: never;
}

/** Map a DocuSign event type to our outcome enum. Kept exported so
 *  the gate / status-transition layers can classify without
 *  duplicating the mapping. */
export function eventToOutcome(eventType: DocuSignEnvelopeEvent['event']): CapitalSigningEvent['outcome'] | null {
  switch (eventType) {
    case 'envelope-completed': return 'signed';
    case 'envelope-declined':  return 'declined';
    case 'envelope-voided':    return 'voided';
    // envelope-sent and envelope-corrected aren't terminal states; we
    // ack the webhook but emit no CapitalSigningEvent.
    default: return null;
  }
}

export function createDocuSignAdapter(
  _opts?: DocuSignAdapterOptions,
): LegacyAdapter<DocuSignEnvelopeEvent, CapitalSigningEvent> {
  return {
    id: 'docusign',

    async fromForeign(event) {
      if (!event?.data?.envelopeId) return null;
      const outcome = eventToOutcome(event.event);
      if (!outcome) return null;

      // Pull commitmentId from custom fields stamped at envelope creation.
      // Fall back to envelopeId-only when the stamp is missing — the
      // signing-reconcile helper will look up via docusign_envelopes
      // table in that case.
      const customFields = event.data.envelopeCustomFields?.textCustomFields ?? [];
      const commitmentField = customFields.find((f) => f.name === 'capital_commitment_id');
      const commitmentId = commitmentField?.value ?? '';

      const summary = event.data.envelopeSummary;
      const completedAt =
        summary?.completedDateTime
        ?? summary?.declinedDateTime
        ?? summary?.voidedDateTime
        ?? event.generatedDateTime
        ?? new Date().toISOString();

      const signers = (summary?.recipients?.signers ?? []).map((s) => ({
        name: s.name,
        email: s.email,
        role: s.roleName,
        signedAt: s.signedDateTime,
      }));

      // Prefer inline base64 PDF (DocuSign Connect "Include Documents"
      // option) so we have the receipt in one round-trip. When absent,
      // signing-reconcile can re-fetch via the DocuSign API using the
      // envelopeId — adapter doesn't need to carry the API call.
      const docs = summary?.envelopeDocuments ?? [];
      const pdfBytes = docs.find((d) => d.PDFBytes)?.PDFBytes;
      const receipt = pdfBytes
        ? { base64Pdf: pdfBytes, contentType: 'application/pdf' as const }
        : undefined;

      return {
        commitmentId,
        outcome,
        envelopeId: event.data.envelopeId,
        source: 'docusign',
        signers,
        receipt,
        completedAt,
        rawEvent: event,
      };
    },

    // toForeign is omitted; outbound goes through createEnvelope below
    // (mirrors the VerifyInvestor outbound factory pattern).
  };
}

export interface CreateEnvelopeInput {
  commitmentId: string;
  /** DocuSign template id pre-configured in the DocuSign account.
   *  Templates are venture-specific (subscription agreement variants);
   *  caller picks the right one. */
  templateId: string;
  /** Hosted-recipient URL is returned when present — embed it in an
   *  iframe or open in a new tab so the investor signs in-app. */
  returnUrl?: string;
  signers: Array<{
    name: string;
    email: string;
    roleName?: string;       // matches DocuSign template role names
    /** When set, DocuSign returns a hostedRecipientUrl scoped to this
     *  signer for the embedded signing flow. */
    embedded?: boolean;
  }>;
  /** Optional human-readable subject; otherwise generated from
   *  templateId + commitmentId. */
  subject?: string;
  /** Custom fields stamped on the envelope for back-correlation. The
   *  adapter automatically adds capital_commitment_id; callers can
   *  add more. */
  extraCustomFields?: Array<{ name: string; value: string }>;
}

export interface EnvelopeSummary {
  envelopeId: string;
  status: 'sent' | 'created' | 'mocked';
  hostedRecipientUrls?: Array<{ email: string; url: string }>;
  source: 'docusign' | 'docusign-mock';
  createdAt: string;
}

const DOCUSIGN_DEFAULT_BASE = 'https://account-d.docusign.com'; // demo by default
const DOCUSIGN_REST_PATH = '/restapi/v2.1/accounts';

interface DocuSignAuth {
  accessToken: string;
  accountId: string;
  baseUrl: string;
}

async function authenticateDocuSign(): Promise<DocuSignAuth | null> {
  const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;
  const userId = process.env.DOCUSIGN_USER_ID;
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
  const privateKey = process.env.DOCUSIGN_RSA_PRIVATE_KEY;
  if (!integrationKey || !userId || !accountId || !privateKey) return null;

  // JWT grant flow. The full impl signs an RS256 assertion with the
  // RSA private key and exchanges it for an access token. We keep
  // the network call inline rather than pulling a docusign-esign SDK
  // dependency — keeps the adapter footprint small and the token
  // cache adapter-local.
  const baseAuthUrl = process.env.DOCUSIGN_AUTH_BASE_URL ?? DOCUSIGN_DEFAULT_BASE;
  const aud = baseAuthUrl.replace('https://', '').replace('http://', '');
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: integrationKey,
    sub: userId,
    aud,
    iat: now,
    exp: now + 3600,
    scope: 'signature impersonation',
  };

  const crypto = await import('node:crypto');
  function b64url(buf: Buffer | string): string {
    const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf, 'utf8');
    return b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  const headerB64 = b64url(JSON.stringify(header));
  const claimB64 = b64url(JSON.stringify(claim));
  const signingInput = `${headerB64}.${claimB64}`;
  const signer = crypto.createSign('RSA-SHA256').update(signingInput);
  const signature = b64url(signer.sign(privateKey));
  const assertion = `${signingInput}.${signature}`;

  const tokenRes = await fetch(`${baseAuthUrl}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
  });
  if (!tokenRes.ok) {
    const txt = await tokenRes.text().catch(() => '');
    throw new Error(`DocuSign JWT grant failed: ${tokenRes.status} ${txt.slice(0, 200)}`);
  }
  const tokenData = await tokenRes.json() as { access_token: string };

  const baseUrl = process.env.DOCUSIGN_REST_BASE_URL ?? 'https://demo.docusign.net';
  return { accessToken: tokenData.access_token, accountId, baseUrl };
}

/**
 * Outbound — create an envelope from a template, addressed to the
 * provided signers. When DocuSign creds are absent, returns a mock
 * envelope so dev / preview / unit tests work without procurement.
 */
export async function createEnvelope(input: CreateEnvelopeInput): Promise<EnvelopeSummary> {
  const auth = await authenticateDocuSign().catch((err) => {
    console.warn('[docusign] auth failed, falling back to mock:', err instanceof Error ? err.message : err);
    return null;
  });

  if (!auth) {
    // Mock path — deterministic id with commitment prefix so tests + UI can verify routing.
    return {
      envelopeId: `mock-env-${input.commitmentId}-${Date.now()}`,
      status: 'mocked',
      hostedRecipientUrls: input.signers
        .filter((s) => s.embedded)
        .map((s) => ({ email: s.email, url: `https://docusign.mock/sign/${input.commitmentId}?signer=${encodeURIComponent(s.email)}` })),
      source: 'docusign-mock',
      createdAt: new Date().toISOString(),
    };
  }

  const customFields = [
    { name: 'capital_commitment_id', value: input.commitmentId, required: 'false', show: 'false' },
    ...(input.extraCustomFields ?? []).map((f) => ({ ...f, required: 'false', show: 'false' })),
  ];

  const envelopeBody = {
    templateId: input.templateId,
    emailSubject: input.subject ?? `Subscription agreement — commitment ${input.commitmentId.slice(0, 8)}`,
    status: 'sent',
    customFields: { textCustomFields: customFields },
    templateRoles: input.signers.map((s, i) => ({
      roleName: s.roleName ?? `Signer ${i + 1}`,
      name: s.name,
      email: s.email,
      ...(s.embedded ? { clientUserId: input.commitmentId } : {}),
    })),
  };

  const url = `${auth.baseUrl}${DOCUSIGN_REST_PATH}/${auth.accountId}/envelopes`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(envelopeBody),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`DocuSign envelope create failed: ${res.status} ${txt.slice(0, 200)}`);
  }
  const data = await res.json() as { envelopeId: string; status: string };

  // Optional: generate hosted-recipient URLs for embedded signers.
  const hostedRecipientUrls: EnvelopeSummary['hostedRecipientUrls'] = [];
  for (const signer of input.signers.filter((s) => s.embedded)) {
    try {
      const viewRes = await fetch(
        `${auth.baseUrl}${DOCUSIGN_REST_PATH}/${auth.accountId}/envelopes/${data.envelopeId}/views/recipient`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${auth.accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            authenticationMethod: 'none',
            email: signer.email,
            userName: signer.name,
            clientUserId: input.commitmentId,
            returnUrl: input.returnUrl ?? 'https://mcv.one/capital/signing-complete',
          }),
        },
      );
      if (viewRes.ok) {
        const view = await viewRes.json() as { url: string };
        hostedRecipientUrls.push({ email: signer.email, url: view.url });
      }
    } catch (err) {
      console.warn('[docusign] hosted-view fetch failed for', signer.email, err instanceof Error ? err.message : err);
    }
  }

  return {
    envelopeId: data.envelopeId,
    status: data.status === 'sent' ? 'sent' : 'created',
    hostedRecipientUrls,
    source: 'docusign',
    createdAt: new Date().toISOString(),
  };
}
