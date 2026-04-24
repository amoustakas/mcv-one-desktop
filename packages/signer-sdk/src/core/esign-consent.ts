// packages/signer-sdk/src/core/esign-consent.ts
//
// US-ESIGN Act (15 U.S.C. § 7001) consent block. v0.1 only ships 'us';
// v0.2 widens via `./v0-2-hooks/jurisdiction.ts`. The copy is paired
// with a disclosures manifest that records what the signer agreed to
// so the server can reproduce "these exact bytes, this jurisdiction,
// this consent version" at audit time.

import type { Jurisdiction, Signer } from './types';

export interface EsignDisclosure {
  /** Short label shown in the UI ("Electronic records") */
  title: string;
  /** Full disclosure text bound to the consent. */
  body: string;
}

export interface EsignConsentPayload {
  jurisdiction: Jurisdiction;
  /** Version of the consent + disclosures. Bumps invalidate prior
   *  consent records on replay; the server compares this against the
   *  envelope's pinned `consentVersion`. */
  consentVersion: string;
  /** Localised label shown above the checkbox ("I, {name}, consent…"). */
  checkboxLabel: string;
  /** Disclosures enumerated in order; the signer is attesting to all. */
  disclosures: EsignDisclosure[];
}

/** Current consent version. Bump when the disclosures content changes
 *  in a way that would require fresh re-consent. */
export const US_ESIGN_CONSENT_VERSION = '2026-04-24.v1';

/** Render the signer-name-bound checkbox label. The "I, {name}," pattern
 *  is the ESIGN-pattern that courts have repeatedly accepted as
 *  intentional-assent evidence. */
export function formatEsignCheckboxLabel(signer: Signer, tone: 'formal' | 'plain' = 'plain'): string {
  const who = signer.name || signer.email;
  if (tone === 'formal') {
    return (
      `I, ${who}, hereby consent to the use of electronic records and electronic signatures ` +
      `for this transaction. I have reviewed the document(s) above and intend my electronic ` +
      `signature to have the same legal effect as a handwritten signature.`
    );
  }
  return (
    `I, ${who}, consent to the use of electronic records and electronic signatures for this ` +
    `transaction. I have reviewed the document above and intend my electronic signature to ` +
    `have the same legal effect as a handwritten signature.`
  );
}

/** Default US-ESIGN disclosures carried forward from the Futurestate
 *  prototype + expanded to the statute's minimum set. Themes can replace
 *  any disclosure by supplying its index in the array. */
export const US_ESIGN_DISCLOSURES: EsignDisclosure[] = [
  {
    title: 'Electronic records',
    body:
      'The document(s) linked to this signing session are delivered in electronic form. ' +
      'You may request a paper copy at any time by contacting the sender; a paper copy will be ' +
      'provided at no additional charge.',
  },
  {
    title: 'Right to withdraw consent',
    body:
      'You may withdraw your consent to use electronic records and signatures at any time ' +
      'before signing by closing this session and contacting the sender. Withdrawal of consent ' +
      'does not affect the legal validity of records or signatures provided before the ' +
      'withdrawal.',
  },
  {
    title: 'Scope of consent',
    body:
      'Your consent applies to this specific signing session and the document(s) displayed ' +
      'above. It does not extend to future or unrelated signings; each session requires a ' +
      'fresh consent.',
  },
  {
    title: 'Hardware and software requirements',
    body:
      'To receive, review, and sign electronic records you need a modern web browser, an ' +
      'active email account, and a device capable of displaying the document. If the sender ' +
      'changes these requirements in a way that creates a material risk that you will not be ' +
      'able to access future records, you will be notified.',
  },
  {
    title: 'What you are committing to',
    body:
      'By clicking the sign action, you commit to the exact bytes displayed above — identified ' +
      'by the displayed content hash. If the document is modified after you sign, verification ' +
      'will fail and you are not bound to the altered document.',
  },
];

/** Compose the full consent payload the client-side UI renders. Pure
 *  function — safe to call from both React render and server-side envelope
 *  composition. */
export function buildUsEsignConsent(
  signer: Signer,
  tone: 'formal' | 'plain' = 'plain',
): EsignConsentPayload {
  return {
    jurisdiction: 'us',
    consentVersion: US_ESIGN_CONSENT_VERSION,
    checkboxLabel: formatEsignCheckboxLabel(signer, tone),
    disclosures: US_ESIGN_DISCLOSURES,
  };
}
