import { describe, it, expect } from 'vitest';
import { detectMutations, hasMutations } from '../server/template-versioning';
import type { SignerDocument } from '../core/types';

const mkDoc = (id: string, templateId: string, templateVersion: number): SignerDocument => ({
  id,
  templateId,
  templateVersion,
  origin: 'human',
  renderedBytes: 'X',
  renderedAt: '2026-04-24T00:00:00.000Z',
  renderedSha256: 'a'.repeat(64),
});

describe('detectMutations', () => {
  it('returns empty when every template is still pinned', () => {
    const docs = [mkDoc('d1', 'nda', 1)];
    const snaps = [{ templateId: 'nda', currentVersion: 1 }];
    expect(detectMutations(docs, snaps)).toEqual([]);
  });

  it('reports drift when template version moved', () => {
    const docs = [mkDoc('d1', 'nda', 1)];
    const snaps = [{ templateId: 'nda', currentVersion: 2 }];
    const reports = detectMutations(docs, snaps);
    expect(reports.length).toBe(1);
    expect(reports[0]).toMatchObject({
      documentId: 'd1',
      templateId: 'nda',
      expectedVersion: 1,
      actualVersion: 2,
    });
  });

  it('ignores templates missing from the snapshot (content_missing branch)', () => {
    const docs = [mkDoc('d1', 'nda', 1)];
    const snaps: Array<{ templateId: string; currentVersion: number }> = [];
    expect(detectMutations(docs, snaps)).toEqual([]);
  });

  it('hasMutations is the boolean form', () => {
    const docs = [mkDoc('d1', 'nda', 1)];
    expect(hasMutations(docs, [{ templateId: 'nda', currentVersion: 1 }])).toBe(false);
    expect(hasMutations(docs, [{ templateId: 'nda', currentVersion: 2 }])).toBe(true);
  });

  it('handles multi-template envelopes', () => {
    const docs = [
      mkDoc('d1', 'nda', 1),
      mkDoc('d2', 'ip-assign', 3),
      mkDoc('d3', 'side-letter', 1),
    ];
    const snaps = [
      { templateId: 'nda', currentVersion: 1 },
      { templateId: 'ip-assign', currentVersion: 4 },
      { templateId: 'side-letter', currentVersion: 1 },
    ];
    const reports = detectMutations(docs, snaps);
    expect(reports.length).toBe(1);
    expect(reports[0].templateId).toBe('ip-assign');
  });
});
