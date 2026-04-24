// packages/signer-sdk/src/react/hooks/useSigner.ts
//
// Hook that wraps the signing state machine. Owns the "current document"
// pointer for multi-document envelopes, the consent checkbox state, the
// submit lifecycle, and the accumulated signed-document set. Emits the
// 5 signing events via optional onEvent callback; persistent emission
// to the event bus happens server-side in envelope-builder.

import { useCallback, useMemo, useState } from 'react';
import type { SignerEnvelope, SigningEventPayload } from '../../core/types';
import type { SignerError } from '../../core/errors';
import type {
  AcceptSignatureInput,
  AcceptSignatureResult,
  SignerServerClient,
} from '../../core/server-client';

export interface UseSignerInput {
  envelope: SignerEnvelope;
  token: string;
  client: SignerServerClient;
  /** Synchronous hook into client-side events. Server-side emission to
   *  the event bus is separate and always happens in the backbone. */
  onEvent?: (event: SigningEventPayload) => void;
  /** Called after a successful single-document accept. Consumers can use
   *  this to navigate to the next document, show a toast, etc. */
  onDocumentSigned?: (result: AcceptSignatureResult) => void;
  /** Called when every document in the envelope has been signed. */
  onEnvelopeComplete?: (result: AcceptSignatureResult) => void;
}

export type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; error: SignerError }
  | { status: 'success'; result: AcceptSignatureResult };

export interface UseSignerReturn {
  /** The currently-focused document id. */
  activeDocumentId: string;
  setActiveDocument: (documentId: string) => void;
  /** Signed document ids (only current session; server-side audit is truth). */
  signedDocumentIds: ReadonlySet<string>;
  /** Whether every document has been signed this session. */
  allSigned: boolean;
  /** Consent checkbox state. */
  consentAccepted: boolean;
  setConsentAccepted: (next: boolean) => void;
  /** Submit lifecycle. */
  submitState: SubmitState;
  /** True when the current document can be submitted. */
  canSubmit: boolean;
  /** Submit the currently-active document. */
  submit: () => Promise<void>;
}

export function useSigner(input: UseSignerInput): UseSignerReturn {
  const { envelope, token, client, onEvent, onDocumentSigned, onEnvelopeComplete } = input;

  const [activeDocumentId, setActiveDocumentId] = useState<string>(envelope.documents[0]?.id ?? '');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' });
  const [signedSet, setSignedSet] = useState<Set<string>>(() => new Set());

  const allSigned = useMemo(
    () => envelope.documents.every((d) => signedSet.has(d.id)),
    [envelope.documents, signedSet],
  );

  const canSubmit =
    consentAccepted &&
    submitState.status !== 'submitting' &&
    !signedSet.has(activeDocumentId);

  const submit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitState({ status: 'submitting' });

    const input: AcceptSignatureInput = {
      publicId: envelope.publicId,
      token,
      documentId: activeDocumentId,
      acceptedTerms: true,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    const res = await client.acceptSignature(input);
    if (!res.ok) {
      setSubmitState({ status: 'error', error: res.error });
      return;
    }

    setSubmitState({ status: 'success', result: res.result });
    setSignedSet((prev) => new Set(prev).add(activeDocumentId));

    // Fire the client-side onEvent hook. The server-side emission to
    // @mcv/events-sdk is the source of truth for downstream subscribers —
    // this is only the local UI signal.
    if (onEvent) {
      onEvent({
        topic: 'signing.envelope.signed',
        publicId: envelope.publicId,
        tenantId: envelope.tenantId,
        documentId: activeDocumentId,
        signedAt: new Date().toISOString(),
        // Signature hash is not known client-side (only the server
        // computes it); omit would break the type, so synthesise a
        // placeholder the caller can ignore. Server-side emission
        // carries the real hash.
        signatureHash: '0'.repeat(64),
      });
    }

    onDocumentSigned?.(res.result);

    // Advance to next unsigned document if any remain.
    const nextUnsigned = envelope.documents.find((d) => d.id !== activeDocumentId && !signedSet.has(d.id));
    if (nextUnsigned) {
      setActiveDocumentId(nextUnsigned.id);
      setConsentAccepted(false);
    } else {
      onEnvelopeComplete?.(res.result);
    }
  }, [canSubmit, envelope, token, activeDocumentId, client, onEvent, onDocumentSigned, onEnvelopeComplete, signedSet]);

  return {
    activeDocumentId,
    setActiveDocument: setActiveDocumentId,
    signedDocumentIds: signedSet,
    allSigned,
    consentAccepted,
    setConsentAccepted,
    submitState,
    canSubmit,
    submit,
  };
}
