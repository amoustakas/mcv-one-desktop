// packages/signer-sdk/src/react/SignerConsent.tsx
//
// ESIGN consent block. Renders the jurisdiction-appropriate consent
// payload (v0.1: US-ESIGN only) with a signer-name-bound checkbox label
// and an expandable "what you're signing" details panel.
//
// Slot-based: consumers can replace the disclosures panel or the "what
// you're signing" summary without forking the component. The checkbox
// semantics + ESIGN copy stay locked down so compliance can audit one
// canonical implementation.

import type { ReactNode } from 'react';
import type { Signer } from '../core/types';
import { buildUsEsignConsent, type EsignConsentPayload } from '../core/esign-consent';

interface SignerConsentProps {
  signer: Signer;
  /** Current document content-hash preview — shown in the "what I'm
   *  signing" collapsible for the bytes-you-sign guarantee. Pass the
   *  active document's renderedSha256 when multi-document. */
  contentHashPreview?: string;
  /** Controlled checkbox state. */
  accepted: boolean;
  onAcceptedChange: (next: boolean) => void;
  /** Disables the control during submit. */
  disabled?: boolean;
  /** Formal vs plain consent phrasing. Both are ESIGN-valid; formal
   *  suits counsel + counterparty contexts, plain suits consumer flows. */
  tone?: 'formal' | 'plain';
  /** Replace the ESIGN-standard consent payload with a custom one (for
   *  jurisdictions the v0.1 SDK doesn't yet ship, per the v0.2 hook). */
  payloadOverride?: EsignConsentPayload;
  /** Replace the "what you're signing" panel wholesale — e.g. to show
   *  multiple document hashes for multi-document envelopes. */
  whatYouAreSigningSlot?: ReactNode;
}

export function SignerConsent({
  signer,
  contentHashPreview,
  accepted,
  onAcceptedChange,
  disabled = false,
  tone = 'plain',
  payloadOverride,
  whatYouAreSigningSlot,
}: SignerConsentProps) {
  const payload = payloadOverride ?? buildUsEsignConsent(signer, tone);
  const fallbackSummary = contentHashPreview ? (
    <dl className="mcv-signer-consent-hashes">
      <dt>content hash</dt>
      <dd>{contentHashPreview.slice(0, 16)}…{contentHashPreview.slice(-8)}</dd>
      <dt>signer</dt>
      <dd>{signer.email}</dd>
    </dl>
  ) : null;

  return (
    <div className="mcv-signer-consent">
      <label className="mcv-signer-consent-check">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => onAcceptedChange(e.target.checked)}
          disabled={disabled}
        />
        <span className="mcv-signer-consent-label">{payload.checkboxLabel}</span>
      </label>

      <details className="mcv-signer-consent-disclosures">
        <summary>Disclosures ({payload.disclosures.length})</summary>
        <ol>
          {payload.disclosures.map((d, idx) => (
            <li key={idx}>
              <strong>{d.title}.</strong> {d.body}
            </li>
          ))}
        </ol>
      </details>

      <details className="mcv-signer-consent-what-youre-signing">
        <summary>What I&apos;m signing</summary>
        {whatYouAreSigningSlot ?? fallbackSummary}
      </details>

      <p className="mcv-signer-consent-version">
        jurisdiction {payload.jurisdiction} · consent v{payload.consentVersion}
      </p>
    </div>
  );
}
