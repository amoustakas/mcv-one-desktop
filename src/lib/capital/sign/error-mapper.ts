// MCV Sign — applySignature error → HTTP response mapping.
//
// applySignature throws Error objects with specific message prefixes.
// The handler catches, extracts the message, and returns an HTTP
// status + machine-readable code so signer-facing UX can branch
// without substring-matching English. Drift between applySignature's
// thrown strings and this mapper would silently degrade signer UX to
// a generic 500 — the unit test exercises every branch.

export interface MappedApplyError {
  status: number;
  code:
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
}

export function mapApplyError(message: string): MappedApplyError {
  if (message.includes('ESIGN consent')) return { status: 400, code: 'consent_required' };
  if (message.includes('token expired')) return { status: 401, code: 'token_expired' };
  if (message.includes('token hash mismatch')) return { status: 401, code: 'token_revoked' };
  if (message.includes('token email mismatch')) return { status: 401, code: 'token_mismatch' };
  if (message.includes('token envelope mismatch')) return { status: 401, code: 'token_mismatch' };
  if (message.startsWith('token invalid')) return { status: 401, code: 'token_invalid' };
  if (message.includes('envelope not found')) return { status: 404, code: 'envelope_not_found' };
  if (message.includes('signer row not found')) return { status: 404, code: 'signer_not_found' };
  if (message.includes('does not accept signatures')) return { status: 409, code: 'envelope_closed' };
  if (message.includes('content hash mismatch')) return { status: 409, code: 'content_mutation_detected' };
  if (message.includes('content row missing') || message.includes('content body is empty')) {
    return { status: 409, code: 'content_missing' };
  }
  return { status: 500, code: 'internal_error' };
}
