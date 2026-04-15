import { describe, it, expect } from 'vitest';
import { __test } from '../builtin/venture-intelligence-kit';

const { summarizeSnapshot, formatConsultMarkdown, renderSnapshotMarkdown, filterAndDedupeChunks, renderFindDocsMarkdown } = __test;

interface DocChunk {
  id: string;
  text: string;
  source: string;
  file_id: string | null;
  chunk_index: number;
  score: number;
  metadata?: { department?: string; doc_id?: string; title?: string; kind?: string };
}

function chunk(p: Partial<DocChunk> = {}): DocChunk {
  return {
    id: p.id || 'c1',
    text: p.text || 'lorem ipsum',
    source: p.source || 'Some Doc',
    file_id: p.file_id ?? null,
    chunk_index: p.chunk_index ?? 0,
    score: p.score ?? 0.7,
    metadata: p.metadata,
  };
}

describe('venture-intelligence-kit', () => {
  describe('summarizeSnapshot', () => {
    const baseVenture = { tier: 1, status: 'active', clerk_org_id: 'org_abc' };

    it('counts confirmed vs discovered assets and groups by tier', () => {
      const s = summarizeSnapshot({
        venture: baseVenture,
        assets: [
          { tier: 1, confirmed: true },
          { tier: 1, confirmed: true },
          { tier: 2, confirmed: false },
          { tier: 3, confirmed: true },
        ],
        domains: [], docs: [], quests: [],
      });
      expect(s.assets.confirmed).toBe(3);
      expect(s.assets.discovered).toBe(1);
      expect(s.assets.byTier).toEqual({ 1: 2, 2: 1, 3: 1 });
    });

    it('treats both verified and active domains as verified', () => {
      const s = summarizeSnapshot({
        venture: baseVenture,
        assets: [],
        domains: [
          { status: 'verified' },
          { status: 'active' },
          { status: 'pending' },
          { status: undefined },
        ],
        docs: [], quests: [],
      });
      expect(s.domains.verified).toBe(2);
      expect(s.domains.pending).toBe(2);
      expect(s.domains.total).toBe(4);
    });

    it('groups docs by department and status', () => {
      const s = summarizeSnapshot({
        venture: baseVenture,
        assets: [], domains: [],
        docs: [
          { department: 'legal', status: 'draft' },
          { department: 'legal', status: 'approved' },
          { department: 'finance', status: 'draft' },
        ],
        quests: [],
      });
      expect(s.docs.byDept).toEqual({ legal: 2, finance: 1 });
      expect(s.docs.byStatus).toEqual({ draft: 2, approved: 1 });
    });

    it('computes quest completion percentage', () => {
      const s = summarizeSnapshot({
        venture: baseVenture,
        assets: [], domains: [], docs: [],
        quests: [
          { effective_status: 'done' },
          { effective_status: 'done' },
          { effective_status: 'in-progress' },
          { effective_status: 'todo' },
        ],
      });
      expect(s.quests.done).toBe(2);
      expect(s.quests.in_progress).toBe(1);
      expect(s.quests.pct).toBe(50);
    });

    it('reflects clerk provisioning state', () => {
      const provisioned = summarizeSnapshot({
        venture: { ...baseVenture, clerk_org_id: 'org_x' },
        assets: [], domains: [], docs: [], quests: [],
      });
      const shared = summarizeSnapshot({
        venture: { ...baseVenture, clerk_org_id: null },
        assets: [], domains: [], docs: [], quests: [],
      });
      expect(provisioned.clerk_provisioned).toBe(true);
      expect(shared.clerk_provisioned).toBe(false);
    });

    it('produces a health score in 0-100 range', () => {
      const s = summarizeSnapshot({
        venture: baseVenture,
        assets: [{ tier: 1, confirmed: true }],
        domains: [{ status: 'verified' }],
        docs: [{ department: 'legal', status: 'draft' }],
        quests: [{ effective_status: 'done' }],
      });
      expect(s.health_score).toBeGreaterThanOrEqual(0);
      expect(s.health_score).toBeLessThanOrEqual(100);
    });

    it('weights quest progress most heavily — fully done quests dominate score', () => {
      const allDone = summarizeSnapshot({
        venture: baseVenture, assets: [], domains: [], docs: [],
        quests: Array(10).fill({ effective_status: 'done' }),
      });
      const noneDone = summarizeSnapshot({
        venture: baseVenture, assets: [], domains: [], docs: [],
        quests: Array(10).fill({ effective_status: 'todo' }),
      });
      expect(allDone.health_score).toBeGreaterThan(noneDone.health_score);
      // Quest weight is 0.40 -> 100% quest = +40 points difference at baseline
      expect(allDone.health_score - noneDone.health_score).toBe(40);
    });

    it('handles empty venture (zero of everything) without dividing by zero', () => {
      const s = summarizeSnapshot({
        venture: { tier: 0, status: 'concept' },
        assets: [], domains: [], docs: [], quests: [],
      });
      expect(s.health_score).toBeGreaterThanOrEqual(0);
      expect(s.health_score).toBeLessThanOrEqual(100);
      expect(Number.isFinite(s.health_score)).toBe(true);
    });
  });

  describe('formatConsultMarkdown', () => {
    const baseQuestion = 'Should we sign this MSA with Acme?';
    const baseVenture = 'betedge';

    it('lists each department answer under its agent name', () => {
      const md = formatConsultMarkdown(baseQuestion, baseVenture, [
        { department: 'legal', agent: 'Cassandra', answer: 'Risky indemnification clause.' },
        { department: 'finance', agent: 'Mint', answer: 'Margin is fine.' },
      ], null);
      expect(md).toContain('### Cassandra (legal)');
      expect(md).toContain('Risky indemnification clause.');
      expect(md).toContain('### Mint (finance)');
      expect(md).toContain('Margin is fine.');
    });

    it('renders an error line when a department call failed', () => {
      const md = formatConsultMarkdown(baseQuestion, baseVenture, [
        { department: 'ops', agent: 'Vector', error: 'rate limited' },
      ], null);
      expect(md).toContain('_failed: rate limited_');
    });

    it('appends a Synthesis section when synthesis is present', () => {
      const md = formatConsultMarkdown(baseQuestion, baseVenture, [
        { department: 'legal', agent: 'Cassandra', answer: '...' },
      ], 'Recommend negotiate.');
      expect(md).toContain('## Synthesis');
      expect(md).toContain('Recommend negotiate.');
    });

    it('omits Synthesis section when null', () => {
      const md = formatConsultMarkdown(baseQuestion, baseVenture, [
        { department: 'legal', agent: 'Cassandra', answer: '...' },
      ], null);
      expect(md).not.toContain('## Synthesis');
    });

    it('places the question in a blockquote at the top', () => {
      const md = formatConsultMarkdown(baseQuestion, baseVenture, [], null);
      expect(md).toContain(`> ${baseQuestion}`);
    });
  });

  describe('renderSnapshotMarkdown', () => {
    it('renders all four sections plus header', () => {
      const md = renderSnapshotMarkdown(
        { id: 'mcv', name: 'MCV One' },
        {
          tier: 1,
          status: 'active',
          clerk_provisioned: true,
          assets: { confirmed: 5, discovered: 2, byTier: { 1: 3, 2: 4 } },
          domains: { total: 3, verified: 2, pending: 1 },
          docs: { total: 12, byDept: { legal: 4, finance: 3 }, byStatus: { draft: 8, approved: 4 } },
          quests: { total: 20, done: 14, in_progress: 3, pct: 70 },
          health_score: 78,
        },
      );
      expect(md).toContain('# MCV One · Snapshot');
      expect(md).toContain('Health score:** 78/100');
      expect(md).toContain('Tier:** T1');
      expect(md).toContain('Clerk:** ✓ dedicated tenant');
      expect(md).toContain('## Quests');
      expect(md).toContain('14/20 done (70%)');
      expect(md).toContain('## Assets');
      expect(md).toContain('## Domains');
      expect(md).toContain('## Docs');
    });

    it('shows shared root org label when not provisioned', () => {
      const md = renderSnapshotMarkdown(
        { id: 'x', name: 'Test' },
        {
          tier: null,
          status: 'planned',
          clerk_provisioned: false,
          assets: { confirmed: 0, discovered: 0, byTier: {} },
          domains: { total: 0, verified: 0, pending: 0 },
          docs: { total: 0, byDept: {}, byStatus: {} },
          quests: { total: 0, done: 0, in_progress: 0, pct: 0 },
          health_score: 25,
        },
      );
      expect(md).toContain('Clerk:** shared root org');
      expect(md).toContain('Tier:** —');
    });
  });

  describe('filterAndDedupeChunks', () => {
    it('dedupes multiple chunks from the same doc, keeping highest score', () => {
      const input = [
        chunk({ id: 'c1', score: 0.5, metadata: { doc_id: 'doc-a', department: 'legal' } }),
        chunk({ id: 'c2', score: 0.9, metadata: { doc_id: 'doc-a', department: 'legal' } }),
        chunk({ id: 'c3', score: 0.7, metadata: { doc_id: 'doc-a', department: 'legal' } }),
      ];
      const result = filterAndDedupeChunks(input, {});
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('c2');
      expect(result[0].score).toBe(0.9);
    });

    it('preserves chunks from different docs', () => {
      const input = [
        chunk({ id: 'c1', score: 0.9, metadata: { doc_id: 'doc-a' } }),
        chunk({ id: 'c2', score: 0.8, metadata: { doc_id: 'doc-b' } }),
        chunk({ id: 'c3', score: 0.7, metadata: { doc_id: 'doc-c' } }),
      ];
      const result = filterAndDedupeChunks(input, {});
      expect(result).toHaveLength(3);
    });

    it('filters by department when specified', () => {
      const input = [
        chunk({ id: 'c1', score: 0.9, metadata: { doc_id: 'a', department: 'legal' } }),
        chunk({ id: 'c2', score: 0.8, metadata: { doc_id: 'b', department: 'finance' } }),
        chunk({ id: 'c3', score: 0.7, metadata: { doc_id: 'c', department: 'ops' } }),
      ];
      const result = filterAndDedupeChunks(input, { departments: ['legal', 'finance'] });
      expect(result.map(c => c.metadata?.department).sort()).toEqual(['finance', 'legal']);
    });

    it('drops chunks with no department metadata when filtering by dept', () => {
      const input = [
        chunk({ id: 'c1', score: 0.9, metadata: { doc_id: 'a', department: 'legal' } }),
        chunk({ id: 'c2', score: 0.8, metadata: { doc_id: 'b' } }), // no dept
        chunk({ id: 'c3', score: 0.7 }), // no metadata at all
      ];
      const result = filterAndDedupeChunks(input, { departments: ['legal'] });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('c1');
    });

    it('is case-insensitive on department filter', () => {
      const input = [
        chunk({ id: 'c1', score: 0.9, metadata: { doc_id: 'a', department: 'LEGAL' } }),
      ];
      const result = filterAndDedupeChunks(input, { departments: ['Legal'] });
      expect(result).toHaveLength(1);
    });

    it('sorts results by score descending', () => {
      const input = [
        chunk({ id: 'c1', score: 0.3, metadata: { doc_id: 'a' } }),
        chunk({ id: 'c2', score: 0.9, metadata: { doc_id: 'b' } }),
        chunk({ id: 'c3', score: 0.6, metadata: { doc_id: 'c' } }),
      ];
      const result = filterAndDedupeChunks(input, {});
      expect(result.map(c => c.score)).toEqual([0.9, 0.6, 0.3]);
    });

    it('respects maxResults cap', () => {
      const input = Array.from({ length: 20 }, (_, i) =>
        chunk({ id: `c${i}`, score: 1 - i * 0.01, metadata: { doc_id: `d${i}` } }),
      );
      const result = filterAndDedupeChunks(input, { maxResults: 5 });
      expect(result).toHaveLength(5);
    });

    it('defaults maxResults to 10', () => {
      const input = Array.from({ length: 20 }, (_, i) =>
        chunk({ id: `c${i}`, score: 1 - i * 0.01, metadata: { doc_id: `d${i}` } }),
      );
      const result = filterAndDedupeChunks(input, {});
      expect(result).toHaveLength(10);
    });

    it('falls back to file_id or chunk id when metadata.doc_id missing', () => {
      const input = [
        chunk({ id: 'c1', score: 0.5, file_id: 'f1' }),
        chunk({ id: 'c2', score: 0.9, file_id: 'f1' }), // same file → dedupe
        chunk({ id: 'c3', score: 0.7, file_id: null }), // falls back to id=c3
      ];
      const result = filterAndDedupeChunks(input, {});
      expect(result).toHaveLength(2);
      expect(result[0].score).toBe(0.9);
    });
  });

  describe('renderFindDocsMarkdown', () => {
    it('renders empty state when no chunks matched', () => {
      const md = renderFindDocsMarkdown('indemnification', []);
      expect(md).toContain('No matching docs found');
      expect(md).toContain('indemnification');
    });

    it('renders each chunk with source, department, score, and snippet', () => {
      const md = renderFindDocsMarkdown('liability caps', [
        chunk({ source: 'MSA Template', score: 0.87, text: 'Liability capped at 12 months of fees.', metadata: { department: 'legal' } }),
      ]);
      expect(md).toContain('MSA Template');
      expect(md).toContain('legal');
      expect(md).toContain('0.87');
      expect(md).toContain('Liability capped');
    });

    it('truncates long snippets with ellipsis', () => {
      const long = 'x'.repeat(500);
      const md = renderFindDocsMarkdown('q', [chunk({ text: long, score: 0.9 })]);
      expect(md).toContain('…');
      expect(md).not.toContain('x'.repeat(250));
    });

    it('flattens newlines in snippets so markdown quotes stay on one line', () => {
      const md = renderFindDocsMarkdown('q', [chunk({ text: 'line one\n\nline two', score: 0.9 })]);
      expect(md).not.toContain('line one\n\nline two');
      expect(md).toContain('line one line two');
    });
  });
});
