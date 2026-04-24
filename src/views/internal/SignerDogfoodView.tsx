// src/views/internal/SignerDogfoodView.tsx
//
// In-repo consumer of @mcv/signer-sdk. Exercises the SDK's `react/`
// subpath (SignerShell + useSigner + SignerDocumentList + SignerConsent
// + SignerStatusBar) in a non-Next Vite context.
//
// This is the NEXT-3 dogfood: before dripping the SDK out to external
// ventures (Futurestate PR #8 refactor, mcv.one doc-signing, warforge
// partner agreements), we consume it HERE — in the same repo that
// ships the SDK — so the runtime bugs surface with the shortest feedback
// loop.
//
// The demo envelope is assembled via @mcv/signer-sdk/server's buildEnvelope
// so the types, sha256s, and agent-attribution refine all exercise at
// view-mount. Accept-signature is wired to a stubbed server client that
// short-circuits to "success" — no backbone dependency for the demo.

import { useMemo, useState } from 'react';
import type { SignerEnvelope } from '@mcv/signer-sdk/core/types';
import type { SignerServerClient } from '@mcv/signer-sdk/core/server-client';
import type { SignerConfig, SigningEventPayload } from '@mcv/signer-sdk/core/types';
import { buildEnvelope } from '@mcv/signer-sdk/server';
import { SignerShell } from '@mcv/signer-sdk/react';

/** Stub server client — resolves accept-signature after a short delay to
 *  exercise the in-flight + success branches without hitting a backbone. */
function createStubClient(): SignerServerClient {
  return {
    async fetchEnvelope() {
      return null; // not used in dogfood — we seed the envelope locally
    },
    async acceptSignature(input) {
      await new Promise((r) => setTimeout(r, 450));
      return {
        ok: true as const,
        result: {
          outcome: 'signed' as const,
          envelopeId: input.publicId,
          documentId: input.documentId,
          remainingDocuments: 0,
          remainingSigners: 0,
        },
      };
    },
  };
}

const DEMO_NDA = `MUTUAL NON-DISCLOSURE AGREEMENT

This Agreement is entered into by and between MCV LTD ("Discloser") and
the undersigned party ("Recipient") for the purpose of evaluating a
potential business relationship.

1. Confidential Information. "Confidential Information" means all non-
   public information disclosed by Discloser to Recipient, whether orally
   or in writing, that is designated as confidential or that reasonably
   should be understood to be confidential given the nature of the
   information and the circumstances of disclosure.

2. Non-Use and Non-Disclosure. Recipient shall not use any Confidential
   Information for any purpose except to evaluate and engage in
   discussions concerning a potential business relationship between the
   parties.

3. Term. The obligations of Recipient under this Agreement shall survive
   for a period of three (3) years following the date of disclosure.

By signing below, Recipient acknowledges receipt and understanding of
the foregoing terms.
`;

const DEMO_SIDE_LETTER = `INVESTOR SIDE LETTER — PARI PASSU RIGHTS

Reference is made to the Subscription Agreement between the Investor and
Futurestate Holdings dated as of the Effective Date. This side letter
memorialises the following additional covenants:

  (a) Pari passu treatment with other Series Seed investors in any
      future liquidity event;
  (b) Pro-rata participation rights on the next two subsequent
      financing rounds;
  (c) Information rights consistent with those granted to the lead
      investor of the Series Seed round.

All other terms of the Subscription Agreement remain in full force and
effect.
`;

export default function SignerDogfoodView() {
  const [mode, setMode] = useState<'human' | 'agent'>('human');
  const [signedPayload, setSignedPayload] = useState<SigningEventPayload | null>(null);

  const envelope = useMemo<SignerEnvelope>(() => {
    const { envelope } = buildEnvelope({
      tenantId: 'mcv',
      parentVentureId: 'mcv',
      childVentureId: 'futurestate',
      signer: {
        name: 'Tony Moustakas',
        email: 'tony@mcv.one',
        role: 'investor',
        displayRole: 'Founding Investor',
      },
      origin: mode,
      generatedByAgent:
        mode === 'agent'
          ? { agentHandle: '@draft-agent', workflowId: 'wf-dogfood-001' }
          : undefined,
      documents: [
        { templateId: 'nda-v3', templateVersion: 3, renderedBytes: DEMO_NDA, subject: 'Mutual NDA' },
        { templateId: 'side-letter-v2', templateVersion: 2, renderedBytes: DEMO_SIDE_LETTER, subject: 'Series Seed Side Letter' },
      ],
      message: 'Dogfood demo envelope — signatures are stubbed; no bytes hit the network.',
      issuedBy: 'system:signer-dogfood',
    });
    return envelope;
  }, [mode]);

  const client = useMemo(() => createStubClient(), []);
  const config = useMemo<SignerConfig>(() => ({
    apiBaseUrl: 'https://signer-dogfood.invalid',
    theme: {
      cssVars: {
        '--signer-accent': '#00f5ff',
        '--signer-surface': '#060D14',
        '--signer-text': '#E7E9EE',
      },
      legalTone: 'plain',
    },
    onEvent: setSignedPayload,
  }), []);

  return (
    <div className="signer-dogfood-root">
      <header className="signer-dogfood-header">
        <h1>@mcv/signer-sdk dogfood</h1>
        <p>
          Live consumer of <code>@mcv/signer-sdk/react</code> in this repo. Exercises
          <code> SignerShell</code> + <code>useSigner</code> + stubbed server client.
          Toggles a <strong>human</strong> vs <strong>agent-generated</strong> envelope
          to prove both origin paths render + pass schema validation.
        </p>
        <div className="signer-dogfood-toggle" role="radiogroup" aria-label="Envelope origin">
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'human' ? 'true' : 'false'}
            className={mode === 'human' ? 'is-active' : ''}
            onClick={() => setMode('human')}
          >
            Human-drafted
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'agent' ? 'true' : 'false'}
            className={mode === 'agent' ? 'is-active' : ''}
            onClick={() => setMode('agent')}
          >
            Agent-generated
          </button>
        </div>
      </header>

      <main className="signer-dogfood-main">
        <SignerShell
          envelope={envelope}
          token="dogfood-token-stub"
          config={{ ...config, onEvent: setSignedPayload }}
          clientOverride={client}
        />
      </main>

      {signedPayload && signedPayload.topic === 'signing.envelope.signed' && (
        <aside className="signer-dogfood-event">
          <h3>Last emitted event</h3>
          <pre>{JSON.stringify(signedPayload, null, 2)}</pre>
        </aside>
      )}

      <SignerDogfoodStyles />
    </div>
  );
}

function SignerDogfoodStyles() {
  return (
    <style>{`
      .signer-dogfood-root {
        padding: 24px;
        display: grid;
        gap: 24px;
        max-width: 960px;
        margin: 0 auto;
      }
      .signer-dogfood-header h1 { font-size: 24px; margin: 0 0 8px; }
      .signer-dogfood-header p {
        font-size: 13px;
        color: var(--text-secondary, #b8c0cc);
        line-height: 1.6;
        margin: 0 0 12px;
      }
      .signer-dogfood-header code {
        font-family: var(--font-mono, ui-monospace, monospace);
        font-size: 12px;
        background: rgba(255,255,255,0.05);
        padding: 1px 6px;
        border-radius: 4px;
      }
      .signer-dogfood-toggle {
        display: inline-flex;
        gap: 4px;
        padding: 4px;
        background: rgba(255,255,255,0.04);
        border-radius: 999px;
      }
      .signer-dogfood-toggle button {
        padding: 6px 14px;
        font-size: 12px;
        border-radius: 999px;
        color: var(--text-muted, #8a94a4);
        background: transparent;
        transition: all 180ms ease;
      }
      .signer-dogfood-toggle button.is-active {
        background: var(--cyan, #00f5ff);
        color: var(--bg-deep, #060D14);
        font-weight: 600;
      }

      /* --- SignerShell default styling so it renders legibly in-repo.
            Production consumers supply their own CSS against the class
            namespace; this is just the dev-skin. --- */
      .mcv-signer-shell {
        display: grid;
        gap: 20px;
        padding: 24px;
        border: 1px solid var(--border, rgba(255,255,255,0.1));
        border-radius: 16px;
        background: rgba(255,255,255,0.02);
      }
      .mcv-signer-title { font-size: 20px; margin: 0 0 12px; }
      .mcv-signer-sender-message {
        font-size: 13px; color: var(--text-secondary);
        padding: 10px 12px; border-radius: 8px;
        background: rgba(0, 245, 255, 0.04); border-left: 2px solid var(--signer-accent, var(--cyan));
      }
      .mcv-signer-doclist.multi { display: grid; grid-template-columns: 200px 1fr; gap: 16px; }
      .mcv-signer-doclist-rail ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
      .mcv-signer-doclist-item {
        width: 100%; text-align: left;
        padding: 8px 10px; border-radius: 8px;
        display: grid; grid-template-columns: 18px 1fr auto; gap: 8px; align-items: center;
        font-size: 12px;
      }
      .mcv-signer-doclist-item.is-active { background: rgba(0,245,255,0.1); }
      .mcv-signer-doclist-item.is-signed { opacity: 0.6; }
      .mcv-signer-doclist-item.is-signed .mcv-signer-doclist-check { color: #10b981; }
      .mcv-signer-document {
        border: 1px solid var(--border);
        border-radius: 12px;
        overflow: hidden;
      }
      .mcv-signer-document-header {
        padding: 10px 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(255,255,255,0.02);
        border-bottom: 1px solid var(--border);
        font-size: 12px;
      }
      .mcv-signer-document-meta { display: flex; gap: 8px; font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); }
      .mcv-signer-document-agent-tag {
        background: rgba(139,92,246,0.1); color: #8b5cf6;
        padding: 1px 6px; border-radius: 4px;
      }
      .mcv-signer-document-body { max-height: 420px; overflow: auto; }
      .mcv-signer-document-bytes {
        margin: 0; padding: 14px 16px;
        white-space: pre-wrap; font-family: var(--font-mono);
        font-size: 12px; line-height: 1.6;
        color: var(--text-primary);
      }
      .mcv-signer-statusbar { display: flex; gap: 14px; font-size: 11px; }
      .mcv-signer-statusbar-stage { display: flex; align-items: center; gap: 6px; color: var(--text-muted); }
      .mcv-signer-statusbar-stage.is-reached { color: var(--signer-accent, var(--cyan)); }
      .mcv-signer-statusbar-dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: currentColor;
      }
      .mcv-signer-statusbar.is-terminal { color: #eab308; font-size: 13px; font-weight: 600; }

      .mcv-signer-consent {
        border: 1px solid var(--border);
        border-radius: 12px; padding: 16px; display: grid; gap: 12px;
      }
      .mcv-signer-consent-check {
        display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: flex-start;
        cursor: pointer; font-size: 13px; line-height: 1.55;
      }
      .mcv-signer-consent-check input { margin-top: 3px; accent-color: var(--signer-accent, var(--cyan)); }
      .mcv-signer-consent-disclosures,
      .mcv-signer-consent-what-youre-signing {
        font-size: 12px; color: var(--text-muted);
      }
      .mcv-signer-consent-disclosures summary,
      .mcv-signer-consent-what-youre-signing summary { cursor: pointer; }
      .mcv-signer-consent-disclosures ol { padding-left: 18px; }
      .mcv-signer-consent-version {
        margin: 0; font-size: 10px; color: var(--text-muted);
        font-family: var(--font-mono);
      }

      .mcv-signer-submit {
        padding: 14px 24px; font-size: 14px; font-weight: 600;
        border-radius: 10px;
        background: var(--signer-accent, var(--cyan));
        color: var(--bg-deep, #060D14);
      }
      .mcv-signer-submit:disabled { opacity: 0.4; cursor: not-allowed; }

      .mcv-signer-error {
        padding: 10px 12px;
        border-radius: 8px;
        border-left: 2px solid #ef4444;
        background: rgba(239,68,68,0.08);
        color: var(--text-primary);
      }
      .mcv-signer-error-title { font-size: 13px; font-weight: 600; color: #ef4444; }
      .mcv-signer-error-body { font-size: 12px; }
      .mcv-signer-error-server { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); }

      .mcv-signer-complete {
        display: grid; justify-items: center; gap: 12px; padding: 32px;
        border: 1px solid rgba(16,185,129,0.3);
        background: rgba(16,185,129,0.06);
        border-radius: 16px;
        text-align: center;
      }
      .mcv-signer-complete-icon {
        font-size: 40px; line-height: 1;
        color: #10b981;
      }

      .signer-dogfood-event {
        padding: 14px 16px;
        border-radius: 12px;
        background: rgba(255,255,255,0.02);
        border: 1px solid var(--border);
      }
      .signer-dogfood-event h3 { margin: 0 0 8px; font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.2px; }
      .signer-dogfood-event pre { margin: 0; font-family: var(--font-mono); font-size: 11px; color: var(--text-secondary); }
    `}</style>
  );
}
