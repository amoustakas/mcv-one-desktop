// packages/signer-sdk/src/react/SignerDocumentList.tsx
//
// Multi-document navigation shell. Renders a sidebar of documents + the
// currently-selected one. For single-document envelopes (N=1) the
// sidebar collapses and this degenerates to the SignerDocument pane.

import { useState } from 'react';
import type { SignerDocument as SignerDocumentType } from '../core/types';
import { SignerDocument } from './SignerDocument';

interface SignerDocumentListProps {
  documents: SignerDocumentType[];
  /** Signed document ids — drives the per-document "signed" checkmark. */
  signedDocumentIds?: ReadonlySet<string>;
  /** Optional controlled mode — callers can lift the selection into a hook
   *  for keyboard navigation or external sync. */
  selectedDocumentId?: string;
  onSelectDocument?: (documentId: string) => void;
}

export function SignerDocumentList({
  documents,
  signedDocumentIds,
  selectedDocumentId,
  onSelectDocument,
}: SignerDocumentListProps) {
  const [internalSelected, setInternalSelected] = useState<string>(documents[0]?.id ?? '');
  const currentId = selectedDocumentId ?? internalSelected;
  const current = documents.find((d) => d.id === currentId) ?? documents[0];

  const handleSelect = (documentId: string) => {
    if (selectedDocumentId === undefined) setInternalSelected(documentId);
    onSelectDocument?.(documentId);
  };

  if (!current) return null;

  const multi = documents.length > 1;

  return (
    <div className={multi ? 'mcv-signer-doclist multi' : 'mcv-signer-doclist single'}>
      {multi && (
        <nav className="mcv-signer-doclist-rail" aria-label="Documents">
          <ol>
            {documents.map((doc, idx) => {
              const isActive = doc.id === current.id;
              const isSigned = signedDocumentIds?.has(doc.id) ?? false;
              return (
                <li key={doc.id}>
                  <button
                    type="button"
                    className={['mcv-signer-doclist-item', isActive ? 'is-active' : '', isSigned ? 'is-signed' : '']
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => handleSelect(doc.id)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="mcv-signer-doclist-idx">{idx + 1}</span>
                    <span className="mcv-signer-doclist-label">
                      {doc.subject ?? `Document ${idx + 1}`}
                    </span>
                    {isSigned && <span className="mcv-signer-doclist-check" aria-label="Signed">✓</span>}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      )}
      <SignerDocument
        document={current}
        position={multi ? { current: documents.indexOf(current) + 1, total: documents.length } : undefined}
      />
    </div>
  );
}
