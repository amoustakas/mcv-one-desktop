import { describe, it, expect } from 'vitest';
import {
  inferRepoCandidates,
  inferSubBrandCandidates,
  normalizeSocialUrl,
  dedupeCandidates,
  discoverAssets,
} from '../asset-discovery';

describe('asset-discovery', () => {
  describe('inferRepoCandidates', () => {
    const brand = { id: 'mcv', legacyMarkers: ['prototype', 'legacy'] };
    const repos = [
      'mcv-core-triangle',
      'mcv-one',
      'mcv-one-desktop',
      'mcv-one-admin-prototype',
      'mcv-prototype',
      'betedge-web',       // unrelated
      'futurestate-app',    // unrelated
      'warforge-client',    // unrelated
    ];

    it('matches sibling-prefix repos for MCV One', () => {
      const out = inferRepoCandidates(brand, repos);
      const names = out.map(c => c.name);
      expect(names).toContain('mcv-core-triangle');
      expect(names).toContain('mcv-one');
      expect(names).toContain('mcv-one-desktop');
      expect(names).toContain('mcv-one-admin-prototype');
      expect(names).toContain('mcv-prototype');
    });

    it('excludes non-matching repos', () => {
      const out = inferRepoCandidates(brand, repos);
      const names = out.map(c => c.name);
      expect(names).not.toContain('betedge-web');
      expect(names).not.toContain('futurestate-app');
      expect(names).not.toContain('warforge-client');
    });

    it('marks prototypes as Tier 3 and others as Tier 2', () => {
      const out = inferRepoCandidates(brand, repos);
      const proto = out.find(c => c.name === 'mcv-prototype');
      const desktop = out.find(c => c.name === 'mcv-one-desktop');
      expect(proto?.tier).toBe(3);
      expect(desktop?.tier).toBe(2);
    });

    it('tags each candidate with the matched source token', () => {
      const out = inferRepoCandidates(brand, ['mcv-one']);
      expect(out[0].meta).toMatchObject({ source: 'sibling-prefix', matched_token: 'mcv' });
    });
  });

  describe('inferSubBrandCandidates', () => {
    it('emits mcv.gg, mcv.dev, mcv.tech candidates for MCV One', () => {
      const out = inferSubBrandCandidates({ id: 'mcv', subBrandTlds: ['gg', 'dev', 'tech'] });
      const domains = out.filter(c => c.kind === 'domain').map(c => c.name);
      expect(domains).toEqual(['mcv.gg', 'mcv.dev', 'mcv.tech']);
    });

    it('emits both domain and app candidates per sub-brand TLD', () => {
      const out = inferSubBrandCandidates({ id: 'mcv', subBrandTlds: ['gg'] });
      expect(out).toHaveLength(2);
      expect(out.map(c => c.kind).sort()).toEqual(['app', 'domain']);
    });

    it('returns empty list when no sub-brand TLDs configured', () => {
      expect(inferSubBrandCandidates({ id: 'betedge' })).toEqual([]);
    });
  });

  describe('normalizeSocialUrl', () => {
    it('strips www and trailing slash', () => {
      expect(normalizeSocialUrl('https://www.x.com/mcvglobal/')).toBe('https://x.com/mcvglobal');
    });

    it('preserves path case-insensitively', () => {
      expect(normalizeSocialUrl('HTTPS://GitHub.com/MCV')).toBe('https://github.com/mcv');
    });

    it('returns null for non-URL input', () => {
      expect(normalizeSocialUrl('not a url')).toBeNull();
      expect(normalizeSocialUrl('')).toBeNull();
    });
  });

  describe('dedupeCandidates', () => {
    it('dedupes by (kind, name) case-insensitively', () => {
      const input = [
        { kind: 'repo' as const, name: 'mcv-one', tier: 2 as const },
        { kind: 'repo' as const, name: 'MCV-ONE', tier: 2 as const },
        { kind: 'repo' as const, name: 'mcv-core-triangle', tier: 2 as const },
      ];
      expect(dedupeCandidates(input)).toHaveLength(2);
    });
  });

  describe('discoverAssets (end-to-end)', () => {
    it('combines repo + sub-brand + social candidates for MCV One', () => {
      const out = discoverAssets(
        { id: 'mcv', subBrandTlds: ['gg', 'dev', 'tech'], legacyMarkers: ['prototype'] },
        {
          repos: ['mcv-one', 'mcv-core-triangle', 'mcv-prototype', 'futurestate-app'],
          socials: ['https://x.com/mcvglobal', 'https://github.com/MCV'],
        }
      );
      const names = out.map(c => c.name.toLowerCase());
      // Repos matched
      expect(names).toContain('mcv-one');
      expect(names).toContain('mcv-core-triangle');
      expect(names).toContain('mcv-prototype');
      // Sub-brand TLDs
      expect(names).toContain('mcv.gg');
      expect(names).toContain('mcv.dev');
      expect(names).toContain('mcv.tech');
      // Socials normalized
      expect(names).toContain('x.com');
      expect(names).toContain('github.com');
      // Excluded
      expect(names).not.toContain('futurestate-app');
      // Tier sort — Tier 2 before Tier 3
      const tiers = out.map(c => c.tier);
      const firstT3 = tiers.indexOf(3);
      if (firstT3 >= 0) {
        expect(tiers.slice(0, firstT3).every(t => t === 2)).toBe(true);
      }
    });
  });
});
