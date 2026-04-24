// packages/signer-sdk/src/core/errors.ts
//
// 11 canonical ESIGN error codes carried over from the Futurestate
// prototype (PR #8). These semantics are load-bearing — every consumer
// branches on the code to decide whether the signer should contact the
// sender, try again, or stop. Copy messages are the SDK's default; themes
// can override via `react/SignerShell`'s errorCopy slot.

export type ErrorCode =
  | 'consent_required'
  | 'token_expired'
  | 'token_revoked'
  | 'token_mismatch'
  | 'token_invalid'
  | 'envelope_not_found'
  | 'signer_not_found'
  | 'envelope_closed'
  | 'content_mutation_detected'
  | 'content_missing'
  | 'internal_error';

export interface SignerError {
  error: string;
  code: ErrorCode;
}

/** Narrow guard — safe to use on untyped JSON responses from the
 *  signing backbone before widening the type. */
export function isSignerError(value: unknown): value is SignerError {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.error === 'string' && typeof v.code === 'string'
    && ERROR_COPY[v.code as ErrorCode] !== undefined;
}

export interface ErrorCopy {
  title: string;
  body: string;
}

/** Default consumer-facing copy per error code. The shape separates
 *  title (one-line surfacing on the error banner) from body (actionable
 *  next step). Themes replace a subset or all codes via
 *  `SignerShellProps.errorCopy`. */
export const ERROR_COPY: Record<ErrorCode, ErrorCopy> = {
  consent_required: {
    title: 'Consent required',
    body: 'Please check the consent box above before signing.',
  },
  token_expired: {
    title: 'This signing link has expired',
    body: 'Contact the sender to re-issue a fresh link. Expired links cannot be restored.',
  },
  token_revoked: {
    title: 'This signing link has been superseded',
    body: 'A newer link was issued — please use the most recent email from the sender.',
  },
  token_mismatch: {
    title: 'This link does not match this envelope',
    body: 'The URL appears malformed. Please use the full link from your email, or contact the sender.',
  },
  token_invalid: {
    title: 'Signing link invalid',
    body: 'We could not verify this signing token. Contact the sender to re-issue.',
  },
  envelope_not_found: {
    title: 'Envelope not found',
    body: 'This envelope no longer exists. Contact the sender.',
  },
  signer_not_found: {
    title: 'Signer record missing',
    body: 'Your signer record could not be located. Contact the sender.',
  },
  envelope_closed: {
    title: 'Envelope no longer accepting signatures',
    body: 'This envelope has already been completed, voided, or declined.',
  },
  content_mutation_detected: {
    title: 'This document has been modified since it was sent to you',
    body:
      'Do NOT sign. The document you are viewing has been altered. Contact the sender immediately to verify what happened — your signature commits to the original bytes, not the current ones.',
  },
  content_missing: {
    title: 'Document unavailable',
    body: 'The document linked to this envelope could not be loaded. Contact the sender.',
  },
  internal_error: {
    title: 'Something went wrong',
    body: 'Please try again in a moment. If the problem persists, contact the sender.',
  },
};

/** Best-effort code extraction from an unknown server response body.
 *  Falls back to `internal_error` so the UI has something to render. */
export function extractErrorCode(body: unknown): ErrorCode {
  if (!body || typeof body !== 'object') return 'internal_error';
  const code = (body as Record<string, unknown>).code;
  if (typeof code !== 'string') return 'internal_error';
  return (code in ERROR_COPY ? code : 'internal_error') as ErrorCode;
}
