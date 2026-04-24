// packages/signer-sdk/src/react/SignerDocument.tsx
//
// Single-document preview pane. Pre-wrapped text only — no HTML parsing.
// This is the bytes-you-sign guarantee: what shows in this component is
// literally the string hashed into `renderedSha256`. A future SDK
// version with a sanitised markdown renderer would layer on top, but
// v0.1 ships the safe baseline.

import type { SignerDocument as SignerDocumentType } from '../core/types';

interface SignerDocumentProps {
  document: SignerDocumentType;
  /** When the envelope has N documents, the status-bar shows "1 of N". */
  position?: { current: number; total: number };
}

export function SignerDocument({ document, position }: SignerDocumentProps) {
  return (
    <section className="mcv-signer-document">
      <header className="mcv-signer-document-header">
        <span className="mcv-signer-document-subject">
          {document.subject ?? 'Document'}
        </span>
        <span className="mcv-signer-document-meta">
          {position && (
            <span className="mcv-signer-document-position">
              {position.current} of {position.total}
            </span>
          )}
          <span className="mcv-signer-document-hash" title={document.renderedSha256}>
            sha256 {document.renderedSha256.slice(0, 8)}…{document.renderedSha256.slice(-6)}
          </span>
          {document.origin === 'agent' && document.generatedByAgent && (
            <span className="mcv-signer-document-agent-tag" title={`Drafted by agent ${document.generatedByAgent.agentHandle}`}>
              agent-drafted
            </span>
          )}
        </span>
      </header>
      <div className="mcv-signer-document-body">
        <pre className="mcv-signer-document-bytes">{document.renderedBytes}</pre>
      </div>
    </section>
  );
}
