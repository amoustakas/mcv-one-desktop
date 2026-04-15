import { describe, it, expect } from 'vitest';
import { __test } from '../builtin/venture-intelligence-kit';

const { summarizeSnapshot, formatConsultMarkdown, renderSnapshotMarkdown } = __test;

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
});
