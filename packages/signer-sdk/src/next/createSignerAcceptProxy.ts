// packages/signer-sdk/src/next/createSignerAcceptProxy.ts
//
// Same-origin proxy factory for the signer accept-signature endpoint.
// Consumers mount this at `/api/sign/accept` in their Next app; the
// browser POSTs to that path instead of directly to the upstream
// backbone. Reasons:
//
//   1. MCV_SIGN_API_URL stays server-only (no leak into the client bundle).
//   2. No browser CORS — same-origin request.
//   3. Rate limiting / audit logging / bot detection hooks can land here
//      without touching the backbone.
//
// Returned handler is framework-agnostic in shape but uses Web-standard
// Request/Response so it drops into Next's app-router route handler
// directly: `export const POST = createSignerAcceptProxy({ ... })`.

import { createSignerServerClient } from '../core/server-client';
import { extractErrorCode } from '../core/errors';
import type { AcceptSignatureInput } from '../core/server-client';

export interface SignerAcceptProxyOptions {
  /** Upstream signing backbone base URL. */
  apiBaseUrl: string;
  /** Optional: reject requests that don't match an expected origin.
   *  Useful when the same Next app serves multiple tenant subdomains. */
  allowedOrigins?: string[];
  /** Optional: pre-submit hook for bot-detection / rate-limiting. Return
   *  a Response to short-circuit, or void/undefined to allow. */
  preflight?: (request: Request) => Promise<Response | void> | Response | void;
}

type AcceptInputFromBody = Omit<AcceptSignatureInput, 'ipAddress' | 'userAgent'>;

export function createSignerAcceptProxy(options: SignerAcceptProxyOptions) {
  const client = createSignerServerClient({ apiBaseUrl: options.apiBaseUrl });

  return async function POST(request: Request): Promise<Response> {
    // Origin allow-list enforcement.
    if (options.allowedOrigins?.length) {
      const origin = request.headers.get('origin');
      if (!origin || !options.allowedOrigins.includes(origin)) {
        return jsonResponse(403, { error: 'Origin not allowed', code: 'token_invalid' });
      }
    }

    // Consumer pre-flight hook.
    if (options.preflight) {
      const pre = await options.preflight(request);
      if (pre instanceof Response) return pre;
    }

    let body: AcceptInputFromBody;
    try {
      body = (await request.json()) as AcceptInputFromBody;
    } catch {
      return jsonResponse(400, { error: 'Invalid JSON body', code: 'internal_error' });
    }

    if (!body.publicId || !body.token || !body.documentId) {
      return jsonResponse(400, {
        error: 'publicId, token, and documentId are required',
        code: 'token_mismatch',
      });
    }

    const forwardedIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const userAgent = request.headers.get('user-agent') ?? undefined;

    const result = await client.acceptSignature({
      ...body,
      acceptedTerms: body.acceptedTerms === true,
      ipAddress: forwardedIp ?? undefined,
      userAgent,
    });

    if (!result.ok) {
      return jsonResponse(result.status, {
        error: result.error.error,
        code: result.error.code,
      });
    }

    return jsonResponse(200, result.result as unknown as Record<string, unknown>);
  };
}

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Re-export the extractor for consumers that want to build their own
// proxy shape but still reuse the error-code extraction.
export { extractErrorCode };
