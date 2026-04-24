// packages/signer-sdk/src/v0-2-hooks/jurisdiction.ts
//
// v0.2 extension point — non-US jurisdictions. Exports the widened
// Jurisdiction union type so consumers can forward-declare their
// jurisdiction-aware code without a breaking change when v0.2 ships.
// The SDK v0.1 runtime only accepts 'us'; attempts to build or parse
// envelopes with any other jurisdiction fail the zod schema.
//
// Intended v0.2 additions (already reserved in this type):
//   - 'eu-eidas'  (EU eIDAS Regulation — simple / advanced / qualified)
//   - 'ca'         (Canada PIPEDA + provincial variants)
//   - 'uk-etr'     (UK Electronic Communications Act 2000 / ETR)
//   - 'au-etr'     (Australia ETR 2000)
//
// Adding a jurisdiction is not just a new enum value — each brings its
// own consent wording, disclosure requirements, and evidence retention
// obligations. Each variant will land with its own consent-builder in
// core/esign-consent.

import type { Signer } from '../core/types';
import type { EsignConsentPayload } from '../core/esign-consent';

/** v0.2 widened jurisdiction union. v0.1 consumers who import this
 *  may constrain it back down via `Extract<JurisdictionV02, 'us'>`. */
export type JurisdictionV02 = 'us' | 'eu-eidas' | 'ca' | 'uk-etr' | 'au-etr';

/** Consent builder signature. v0.2 replaces `buildUsEsignConsent` with
 *  a jurisdiction-parameterised version that returns the same payload
 *  shape. */
export type ConsentBuilder = (signer: Signer, jurisdiction: JurisdictionV02) => EsignConsentPayload;

/** v0.1 no-op — always throws for non-US. Replace in v0.2 with the
 *  real jurisdiction-aware builder. */
export const noopJurisdictionConsentBuilder: ConsentBuilder = (_signer, jurisdiction) => {
  if (jurisdiction !== 'us') {
    throw new Error(
      `[signer-sdk] jurisdiction "${jurisdiction}" is not supported in v0.1. ` +
      `Only 'us' (US-ESIGN Act) is available. See v0-2-hooks/jurisdiction.ts for the widened type.`,
    );
  }
  // v0.1 behavior — only 'us'.
  throw new Error('[signer-sdk] use buildUsEsignConsent() from core/esign-consent for v0.1 US consent');
};
