/**
 * Asset Discovery — pure inference functions for suggesting related assets.
 *
 * These are intentionally side-effect free: given a venture id and some inputs
 * (repo lists, env inventory, known brand tokens), emit Tier 1/2/3 suggestion
 * candidates. Callers persist via POST /api/ventures?action=create-asset with
 * discovered=true, confirmed=false so the user confirms.
 *
 * The design follows the plan's sibling-prefix rule: for a venture id `mcv`,
 * propose `mcv-*` repos/apps as Tier 2; sub-brands like `mcv.gg`, `mcv.dev`,
 * `mcv.tech` as Tier 2 apps; legacy prototypes as Tier 3.
 */

import type { VentureAssetKind, VentureTier } from './types';

export interface AssetCandidate {
  kind: VentureAssetKind;
  name: string;
  url?: string;
  tier: VentureTier;
  meta?: Record<string, unknown>;
}

export interface VentureBrand {
  /** e.g. 'mcv' — the venture id. */
  id: string;
  /** Additional brand tokens to match (e.g. ['mcv', 'edgeiq']). */
  tokens?: string[];
  /** Known sub-brand TLD set — e.g. ['gg', 'dev', 'tech']. */
  subBrandTlds?: string[];
  /** Legacy prototype indicators → Tier 3. */
  legacyMarkers?: string[];
}

/**
 * Given a venture brand and a list of repo names (from GitHub scan), return
 * Tier 2/3 asset candidates. Pure, no I/O.
 */
export function inferRepoCandidates(brand: VentureBrand, repoNames: string[]): AssetCandidate[] {
  const tokens = [brand.id, ...(brand.tokens ?? [])].map(t => t.toLowerCase());
  const legacy = brand.legacyMarkers ?? ['prototype', 'legacy', 'archive', 'deprecated'];
  const candidates: AssetCandidate[] = [];

  for (const rawName of repoNames) {
    const name = rawName.trim();
    if (!name) continue;
    const lower = name.toLowerCase();
    if (!tokens.some(t => lower.startsWith(t + '-') || lower === t || lower.startsWith(t + '_') || lower.startsWith(t + '.'))) continue;

    const isLegacy = legacy.some(m => lower.includes(m));
    candidates.push({
      kind: 'repo',
      name,
      tier: isLegacy ? 3 : 2,
      meta: { source: 'sibling-prefix', matched_token: tokens.find(t => lower.startsWith(t))! },
    });
  }
  return candidates;
}

/**
 * Given a venture brand, emit sub-brand domain/app candidates.
 * For brand 'mcv' with subBrandTlds=['gg','dev','tech'] → [mcv.gg, mcv.dev, mcv.tech].
 */
export function inferSubBrandCandidates(brand: VentureBrand): AssetCandidate[] {
  const tlds = brand.subBrandTlds ?? [];
  const out: AssetCandidate[] = [];
  for (const tld of tlds) {
    const host = `${brand.id}.${tld}`.toLowerCase();
    const url = `https://${host}`;
    out.push({ kind: 'domain', name: host, url, tier: 2, meta: { source: 'brand-family', tld } });
    out.push({ kind: 'app', name: host.toUpperCase(), url, tier: 2, meta: { source: 'brand-family', tld } });
  }
  return out;
}

/**
 * Normalize a social URL into a canonical form for deduplication.
 * Returns null if the input isn't a recognizable social URL.
 */
export function normalizeSocialUrl(input: string): string | null {
  if (!input) return null;
  const s = input.trim().toLowerCase();
  if (!s.includes('://') && !s.startsWith('//')) return null;
  try {
    const url = new URL(s);
    const host = url.hostname.replace(/^www\./, '');
    // Strip trailing slash + query for dedupe
    const path = url.pathname.replace(/\/$/, '');
    return `https://${host}${path}`;
  } catch {
    return null;
  }
}

/**
 * De-duplicate asset candidates by (kind, name). Last write wins.
 */
export function dedupeCandidates(list: AssetCandidate[]): AssetCandidate[] {
  const map = new Map<string, AssetCandidate>();
  for (const c of list) {
    map.set(`${c.kind}:${c.name.toLowerCase()}`, c);
  }
  return Array.from(map.values());
}

/**
 * Combined pipeline — takes all inputs and returns a deduped, tier-sorted list
 * ready to POST to /api/ventures?action=create-asset in batch.
 */
export function discoverAssets(brand: VentureBrand, inputs: { repos?: string[]; socials?: string[] }): AssetCandidate[] {
  const repoCandidates = inferRepoCandidates(brand, inputs.repos ?? []);
  const subBrandCandidates = inferSubBrandCandidates(brand);
  const socialCandidates: AssetCandidate[] = (inputs.socials ?? [])
    .map(normalizeSocialUrl)
    .filter((u): u is string => !!u)
    .map(url => ({
      kind: 'social' as const,
      name: new URL(url).hostname.replace(/^www\./, ''),
      url,
      tier: 2 as VentureTier,
      meta: { source: 'normalized-url' },
    }));

  return dedupeCandidates([...repoCandidates, ...subBrandCandidates, ...socialCandidates])
    .sort((a, b) => a.tier - b.tier);
}
