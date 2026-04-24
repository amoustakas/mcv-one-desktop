// packages/signer-sdk/src/react/SignerShell.tsx
//
// Top-level signing UI. Orchestrates SignerStatusBar + SignerDocumentList
// + SignerConsent + submit button against the useSigner hook. Theme
// parameters flow through `SignerConfig.theme` → CSS custom properties.
//
// Intentionally opinionated on LAYOUT (header / document / consent / CTA
// sequence) but UN-opinionated on COLORS (CSS vars), COPY (slot overrides),
// and JURISDICTION (v0.2 hook). Every MCV venture can use this shell as-is
// with ~5 lines of theme glue; power users drop in their own shell and
// reuse the hook + sub-components.

import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { SignerEnvelope, SignerConfig, SigningEventPayload } from '../core/types';
import type { ErrorCode, ErrorCopy } from '../core/errors';
import { ERROR_COPY } from '../core/errors';
import { createSignerServerClient, type SignerServerClient } from '../core/server-client';
import { SignerStatusBar } from './SignerStatusBar';
import { SignerDocumentList } from './SignerDocumentList';
import { SignerConsent } from './SignerConsent';
import { useSigner } from './hooks/useSigner';

interface SignerShellProps {
  envelope: SignerEnvelope;
  token: string;
  config: SignerConfig;
  /** Optional error-copy overrides (any subset of codes). Merged over
   *  the SDK defaults — unspecified codes keep their defaults. */
  errorCopy?: Partial<Record<ErrorCode, ErrorCopy>>;
  /** Replaces the default "signing complete" view shown after every
   *  document is signed. Receives the envelope for venture-specific
   *  congratulations / next-step CTAs. */
  completionSlot?: (envelope: SignerEnvelope) => ReactNode;
  /** Replaces the footer (legal entity name, contact link). */
  footerSlot?: ReactNode;
  /** Test / dogfood affordance — skip building a client from apiBaseUrl
   *  and use the provided one instead. Production consumers leave
   *  unset; the shell then derives the client from config.apiBaseUrl. */
  clientOverride?: SignerServerClient;
}

export function SignerShell({ envelope, token, config, errorCopy, completionSlot, footerSlot, clientOverride }: SignerShellProps) {
  // Apply theme CSS vars to the document root once per mount. This is a
  // pragmatic choice — the signer page is nearly always the only thing
  // on screen, so scoping to :root is fine and lets the whole tree
  // (including portals like dialogs) see the vars.
  useEffect(() => {
    const cssVars = config.theme?.cssVars;
    if (!cssVars) return;
    const root = document.documentElement;
    const applied: string[] = [];
    for (const [key, value] of Object.entries(cssVars)) {
      root.style.setProperty(key, value);
      applied.push(key);
    }
    return () => {
      for (const key of applied) root.style.removeProperty(key);
    };
  }, [config.theme?.cssVars]);

  const client = useMemo(
    () => clientOverride ?? createSignerServerClient({ apiBaseUrl: config.apiBaseUrl }),
    [clientOverride, config.apiBaseUrl],
  );

  const signer = useSigner({
    envelope,
    token,
    client,
    onEvent: (event: SigningEventPayload) => config.onEvent?.(event),
  });

  const activeDocument = envelope.documents.find((d) => d.id === signer.activeDocumentId);
  const mergedErrorCopy: Record<ErrorCode, ErrorCopy> = { ...ERROR_COPY, ...errorCopy };

  // Terminal state — every document signed this session.
  if (signer.allSigned) {
    return (
      <div className="mcv-signer-shell is-complete">
        {completionSlot ? completionSlot(envelope) : <DefaultCompletionView envelope={envelope} />}
        {footerSlot && <footer className="mcv-signer-footer">{footerSlot}</footer>}
      </div>
    );
  }

  return (
    <div className="mcv-signer-shell">
      <header className="mcv-signer-header">
        <h1 className="mcv-signer-title">
          {envelope.documents.length === 1 ? 'Review and sign' : 'Review and sign your documents'}
        </h1>
        <SignerStatusBar status={envelope.status} isInFlight={signer.submitState.status === 'submitting'} />
        {envelope.message && <p className="mcv-signer-sender-message">{envelope.message}</p>}
      </header>

      <SignerDocumentList
        documents={envelope.documents}
        signedDocumentIds={signer.signedDocumentIds}
        selectedDocumentId={signer.activeDocumentId}
        onSelectDocument={signer.setActiveDocument}
      />

      {signer.submitState.status === 'error' && (
        <ErrorBanner code={signer.submitState.error.code} message={signer.submitState.error.error} copyMap={mergedErrorCopy} />
      )}

      <SignerConsent
        signer={envelope.signer}
        contentHashPreview={activeDocument?.renderedSha256}
        accepted={signer.consentAccepted}
        onAcceptedChange={signer.setConsentAccepted}
        disabled={signer.submitState.status === 'submitting'}
        tone={config.theme?.legalTone}
      />

      <button
        type="button"
        className="mcv-signer-submit"
        onClick={() => { void signer.submit(); }}
        disabled={!signer.canSubmit}
      >
        {signer.submitState.status === 'submitting'
          ? 'Signing…'
          : envelope.documents.length > 1
            ? `Sign document ${envelope.documents.indexOf(activeDocument!) + 1}`
            : 'Sign document'}
      </button>

      {footerSlot && <footer className="mcv-signer-footer">{footerSlot}</footer>}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────

function ErrorBanner({ code, message, copyMap }: { code: ErrorCode; message: string; copyMap: Record<ErrorCode, ErrorCopy> }) {
  const copy = copyMap[code] ?? copyMap.internal_error;
  return (
    <div className="mcv-signer-error" role="alert">
      <div className="mcv-signer-error-title">{copy.title}</div>
      <div className="mcv-signer-error-body">{copy.body}</div>
      <div className="mcv-signer-error-server">Server: {message}</div>
    </div>
  );
}

function DefaultCompletionView({ envelope }: { envelope: SignerEnvelope }) {
  return (
    <div className="mcv-signer-complete">
      <div className="mcv-signer-complete-icon" aria-hidden>✓</div>
      <h2>Signatures recorded</h2>
      <p>
        You&apos;ve signed {envelope.documents.length} {envelope.documents.length === 1 ? 'document' : 'documents'}.
        The sender will receive an email once every signer has completed their part.
      </p>
    </div>
  );
}
