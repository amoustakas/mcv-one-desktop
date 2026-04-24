// packages/signer-sdk/src/server/template-versioning.ts
//
// Detects template-version drift between envelope-issue time and any
// later read. When the template has moved since the envelope was issued,
// callers must NOT re-render the document into the signer view — the
// signer would see different bytes than the ones they agreed to sign.
// Instead, the drift triggers `signing.envelope.mutation-detected` and
// the signer page renders a terminal "do not sign" state.

import type { SignerDocument } from '../core/types';

export interface TemplateSnapshot {
  templateId: string;
  currentVersion: number;
}

export interface MutationReport {
  documentId: string;
  templateId: string;
  expectedVersion: number;
  actualVersion: number;
  detectedAt: string;
}

/** Compare each envelope document against a fresh template snapshot and
 *  return one MutationReport per drift. Returns an empty array when the
 *  envelope is still aligned with the template store. */
export function detectMutations(
  documents: ReadonlyArray<SignerDocument>,
  snapshots: ReadonlyArray<TemplateSnapshot>,
): MutationReport[] {
  const now = new Date().toISOString();
  const snapByTemplate = new Map(snapshots.map((s) => [s.templateId, s.currentVersion]));

  const reports: MutationReport[] = [];
  for (const doc of documents) {
    const actual = snapByTemplate.get(doc.templateId);
    // No snapshot for this template → treat as "content missing" upstream.
    // We don't synthesise a mutation report because the signature on the
    // bytes is still cryptographically valid; the missing template is a
    // different error code (content_missing).
    if (actual === undefined) continue;
    if (actual !== doc.templateVersion) {
      reports.push({
        documentId: doc.id,
        templateId: doc.templateId,
        expectedVersion: doc.templateVersion,
        actualVersion: actual,
        detectedAt: now,
      });
    }
  }
  return reports;
}

/** True when any document has drifted. Convenience guard for the signer
 *  page's terminal-state branch. */
export function hasMutations(
  documents: ReadonlyArray<SignerDocument>,
  snapshots: ReadonlyArray<TemplateSnapshot>,
): boolean {
  return detectMutations(documents, snapshots).length > 0;
}
