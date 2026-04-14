import { describe, it, expect } from 'vitest';
import {
  normalizeHost,
  resolveVentureByHost,
  computeBrandTokens,
  computeRequiredDnsRecords,
  summarizeDomainHealth,
} from '../white-label';
import type { Venture } from '../../ventures';

function makeVenture(partial: Partial<Venture>): Venture {
  return {
    id: 'test', name: 'Test', tagline: '', description: '', icon: 'T',
    color: '#00F0FF', accent: '#8B5CF6', domain: 'test.com', type: 'SaaS',
    status: 'active', systemPrompt: '', socials: {}, team: [], techStack: [],
    founded: '', fundingStage: '', category: '', competitors: [], keyMetrics: {},
    ...partial,
  };
}

describe('white-label', () => {
  describe('normalizeHost', () => {
    it('strips port, www, lowercases', () => {
      expect(normalizeHost('WWW.Example.com:3000')).toBe('example.com');
      expect(normalizeHost('mcv.one')).toBe('mcv.one');
    });
  });

  describe('resolveVentureByHost', () => {
    const ventures = [
      makeVenture({ id: 'mcv', domain: 'mcv.one', customDomains: [{ host: 'app.mcv.one' }] }),
      makeVenture({ id: 'betedge', domain: 'betedge.ai', customDomains: [{ host: 'play.betedge.ai', status: 'verified' }] }),
    ];

    it('matches on primary domain', () => {
      const r = resolveVentureByHost(ventures, 'mcv.one');
      expect(r?.venture.id).toBe('mcv');
      expect(r?.isCustomDomain).toBe(false);
    });

    it('matches on custom domain', () => {
      const r = resolveVentureByHost(ventures, 'play.betedge.ai');
      expect(r?.venture.id).toBe('betedge');
      expect(r?.isCustomDomain).toBe(true);
    });

    it('returns null when no venture claims the host', () => {
      expect(resolveVentureByHost(ventures, 'unrelated.com')).toBeNull();
    });

    it('prefers primary domain over custom_domains on collision', () => {
      const v = [
        makeVenture({ id: 'a', domain: 'shared.com' }),
        makeVenture({ id: 'b', customDomains: [{ host: 'shared.com' }] }),
      ];
      expect(resolveVentureByHost(v, 'shared.com')?.venture.id).toBe('a');
    });
  });

  describe('computeBrandTokens', () => {
    it('falls back to venture.color/accent when white_label is empty', () => {
      const v = makeVenture({ color: '#AABBCC', accent: '#DDEEFF', name: 'Alpha' });
      const t = computeBrandTokens(v);
      expect(t['--venture-primary']).toBe('#AABBCC');
      expect(t['--venture-accent']).toBe('#DDEEFF');
      expect(t['--venture-brand-name']).toBe('"Alpha"');
    });

    it('prefers white_label.primaryColor when set', () => {
      const v = makeVenture({ color: '#AAA', whiteLabel: { primaryColor: '#123456' } });
      expect(computeBrandTokens(v)['--venture-primary']).toBe('#123456');
    });
  });

  describe('computeRequiredDnsRecords', () => {
    it('emits A + AAAA records for apex domains', () => {
      const r = computeRequiredDnsRecords('betedge.ai', 'cname.vercel-dns.com');
      expect(r.map(x => x.type).sort()).toEqual(['A', 'AAAA']);
    });

    it('emits a CNAME for subdomains', () => {
      const r = computeRequiredDnsRecords('app.betedge.ai', 'cname.vercel-dns.com');
      expect(r).toHaveLength(1);
      expect(r[0].type).toBe('CNAME');
      expect(r[0].name).toBe('app');
      expect(r[0].value).toBe('cname.vercel-dns.com');
    });
  });

  describe('summarizeDomainHealth', () => {
    it('counts verified / pending / failed across ventures', () => {
      const ventures = [
        makeVenture({ id: 'mcv', customDomains: [
          { host: 'a.mcv.one', status: 'verified' },
          { host: 'b.mcv.one', status: 'pending' },
        ]}),
        makeVenture({ id: 'betedge', customDomains: [
          { host: 'play.betedge.ai', status: 'failed' },
        ]}),
      ];
      const summary = summarizeDomainHealth(ventures);
      expect(summary.total).toBe(3);
      expect(summary.verified).toBe(1);
      expect(summary.pending).toBe(1);
      expect(summary.failed).toBe(1);
      expect(summary.byVenture.mcv).toEqual({ total: 2, verified: 1 });
    });
  });
});
