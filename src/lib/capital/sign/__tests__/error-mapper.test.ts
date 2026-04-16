import { describe, it, expect } from 'vitest';
import { mapApplyError } from '../error-mapper';

describe('mapApplyError', () => {
  it('maps ESIGN consent to 400 consent_required', () => {
    expect(mapApplyError('ESIGN consent required: signerInfo.acceptedTerms must be true'))
      .toEqual({ status: 400, code: 'consent_required' });
  });

  it('maps token expired to 401 token_expired', () => {
    expect(mapApplyError('token expired')).toEqual({ status: 401, code: 'token_expired' });
  });

  it('maps token hash mismatch to 401 token_revoked', () => {
    expect(mapApplyError('token hash mismatch — token may have been rotated'))
      .toEqual({ status: 401, code: 'token_revoked' });
  });

  it('maps email mismatch to 401 token_mismatch', () => {
    expect(mapApplyError('token email mismatch')).toEqual({ status: 401, code: 'token_mismatch' });
  });

  it('maps envelope mismatch to 401 token_mismatch', () => {
    expect(mapApplyError('token envelope mismatch')).toEqual({ status: 401, code: 'token_mismatch' });
  });

  it('maps malformed token to 401 token_invalid', () => {
    expect(mapApplyError('token invalid: malformed token')).toEqual({ status: 401, code: 'token_invalid' });
  });

  it('maps envelope not found to 404', () => {
    expect(mapApplyError('envelope not found')).toEqual({ status: 404, code: 'envelope_not_found' });
  });

  it('maps signer row missing to 404', () => {
    expect(mapApplyError('signer row not found')).toEqual({ status: 404, code: 'signer_not_found' });
  });

  it('maps closed-envelope state to 409', () => {
    expect(mapApplyError("envelope status 'signed' does not accept signatures"))
      .toEqual({ status: 409, code: 'envelope_closed' });
  });

  it('maps content mutation to 409 content_mutation_detected (tamper-detection surface)', () => {
    expect(mapApplyError('content hash mismatch — document has been modified since envelope creation'))
      .toEqual({ status: 409, code: 'content_mutation_detected' });
  });

  it('maps missing/empty content to 409 content_missing', () => {
    expect(mapApplyError('bound content row missing — refuse to sign'))
      .toEqual({ status: 409, code: 'content_missing' });
    expect(mapApplyError('bound content body is empty — refuse to sign'))
      .toEqual({ status: 409, code: 'content_missing' });
  });

  it('falls back to 500 internal_error for unknown messages', () => {
    expect(mapApplyError('something entirely unexpected'))
      .toEqual({ status: 500, code: 'internal_error' });
  });

  it('token-hash-mismatch is distinguished from token-envelope-mismatch despite shared "token" prefix', () => {
    expect(mapApplyError('token hash mismatch — token may have been rotated').code).toBe('token_revoked');
    expect(mapApplyError('token envelope mismatch').code).toBe('token_mismatch');
  });
});
