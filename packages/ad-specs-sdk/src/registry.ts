// MCV One — Ad Spec Master Registry
// Central lookup, search, and filter over all platform ad formats

import type { AdFormat, AdPlatform, AdMediaType } from './types';

// Dynamic imports — populated after platform files land
let _allFormats: AdFormat[] = [];
let _loaded = false;

async function ensureLoaded(): Promise<AdFormat[]> {
  if (_loaded) return _allFormats;
  const [
    { GOOGLE_AD_FORMATS },
    { META_AD_FORMATS },
    { MICROSOFT_AD_FORMATS },
    { TWITTER_AD_FORMATS },
    { LINKEDIN_AD_FORMATS },
    { TIKTOK_AD_FORMATS },
    { YOUTUBE_AD_FORMATS },
    { GDN_AD_FORMATS },
  ] = await Promise.all([
    import('./platforms/google-ads'),
    import('./platforms/meta-ads'),
    import('./platforms/microsoft-ads'),
    import('./platforms/twitter-ads'),
    import('./platforms/linkedin-ads'),
    import('./platforms/tiktok-ads'),
    import('./platforms/youtube-ads'),
    import('./platforms/google-display-network'),
  ]);
  _allFormats = [
    ...GOOGLE_AD_FORMATS,
    ...META_AD_FORMATS,
    ...MICROSOFT_AD_FORMATS,
    ...TWITTER_AD_FORMATS,
    ...LINKEDIN_AD_FORMATS,
    ...TIKTOK_AD_FORMATS,
    ...YOUTUBE_AD_FORMATS,
    ...GDN_AD_FORMATS,
  ];
  _loaded = true;
  return _allFormats;
}

/** Get all registered ad formats (async on first call, cached after) */
export async function getAllFormats(): Promise<AdFormat[]> {
  return ensureLoaded();
}

/** Get formats filtered by platform */
export async function getFormatsByPlatform(platform: AdPlatform): Promise<AdFormat[]> {
  const all = await ensureLoaded();
  return all.filter(f => f.platform === platform);
}

/** Get formats filtered by media type */
export async function getFormatsByMediaType(mediaType: AdMediaType): Promise<AdFormat[]> {
  const all = await ensureLoaded();
  return all.filter(f => f.mediaType === mediaType);
}

/** Get formats filtered by placement */
export async function getFormatsByPlacement(placement: string): Promise<AdFormat[]> {
  const all = await ensureLoaded();
  return all.filter(f => f.placement.toLowerCase().includes(placement.toLowerCase()));
}

/** Get a single format by ID */
export async function getFormatById(id: string): Promise<AdFormat | undefined> {
  const all = await ensureLoaded();
  return all.find(f => f.id === id);
}

/** Search formats by query (matches name, placement, description, platform) */
export async function searchFormats(query: string): Promise<AdFormat[]> {
  const all = await ensureLoaded();
  const q = query.toLowerCase();
  return all.filter(f =>
    f.name.toLowerCase().includes(q) ||
    f.placement.toLowerCase().includes(q) ||
    f.description.toLowerCase().includes(q) ||
    f.platform.toLowerCase().includes(q) ||
    f.id.toLowerCase().includes(q)
  );
}

/** Get formats matching multiple filters */
export async function filterFormats(filters: {
  platform?: AdPlatform;
  mediaType?: AdMediaType;
  placement?: string;
  query?: string;
}): Promise<AdFormat[]> {
  let results = await ensureLoaded();
  if (filters.platform) results = results.filter(f => f.platform === filters.platform);
  if (filters.mediaType) results = results.filter(f => f.mediaType === filters.mediaType);
  if (filters.placement) results = results.filter(f => f.placement.toLowerCase().includes(filters.placement!.toLowerCase()));
  if (filters.query) {
    const q = filters.query.toLowerCase();
    results = results.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q) ||
      f.id.toLowerCase().includes(q)
    );
  }
  return results;
}

/** Get unique platforms that have at least one format */
export async function getAvailablePlatforms(): Promise<AdPlatform[]> {
  const all = await ensureLoaded();
  return [...new Set(all.map(f => f.platform))];
}

/** Get unique placements across all platforms */
export async function getAvailablePlacements(): Promise<string[]> {
  const all = await ensureLoaded();
  return [...new Set(all.map(f => f.placement))].sort();
}

/** Get format count per platform */
export async function getFormatCounts(): Promise<Record<AdPlatform, number>> {
  const all = await ensureLoaded();
  const counts = {} as Record<AdPlatform, number>;
  for (const f of all) {
    counts[f.platform] = (counts[f.platform] || 0) + 1;
  }
  return counts;
}
