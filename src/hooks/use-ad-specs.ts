import { useState, useEffect } from 'react';
import type { AdFormat, AdPlatform, AdMediaType, CreativeAsset, ComplianceReport } from '../lib/ad-specs/types';
import { filterFormats, getAllFormats, getFormatById } from '../lib/ad-specs/registry';
import { validateCreative, suggestFormatsForAsset } from '../lib/ad-specs/validation';

/** Get all ad formats, optionally filtered */
export function useAdFormats(filters?: {
  platform?: AdPlatform;
  mediaType?: AdMediaType;
  placement?: string;
  query?: string;
}): { formats: AdFormat[]; loading: boolean } {
  const [formats, setFormats] = useState<AdFormat[]>([]);
  const [loading, setLoading] = useState(true);

  const key = JSON.stringify(filters || {});

  useEffect(() => {
    setLoading(true);
    filterFormats(filters || {}).then(result => {
      setFormats(result);
      setLoading(false);
    });
  }, [key]);

  return { formats, loading };
}

/** Get a single format by ID */
export function useAdFormat(formatId: string): AdFormat | undefined {
  const [format, setFormat] = useState<AdFormat>();

  useEffect(() => {
    if (!formatId) return;
    getFormatById(formatId).then(f => setFormat(f));
  }, [formatId]);

  return format;
}

/** Run compliance check on a creative against given formats */
export function useComplianceReport(
  asset: CreativeAsset | null,
  formatIds: string[],
): { reports: ComplianceReport[]; loading: boolean } {
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(false);

  const assetKey = asset ? JSON.stringify({ w: asset.width, h: asset.height, t: asset.mediaType, fs: asset.fileSizeMb }) : '';
  const formatKey = formatIds.join(',');

  useEffect(() => {
    if (!asset || formatIds.length === 0) {
      setReports([]);
      return;
    }
    setLoading(true);
    getAllFormats().then(all => {
      const targets = all.filter(f => formatIds.includes(f.id));
      const results = targets.map(f => validateCreative(asset, f));
      setReports(results);
      setLoading(false);
    });
  }, [assetKey, formatKey]);

  return { reports, loading };
}

/** Suggest compatible formats for an asset */
export function useCompatibleFormats(asset: CreativeAsset | null): {
  formats: AdFormat[];
  loading: boolean;
} {
  const [formats, setFormats] = useState<AdFormat[]>([]);
  const [loading, setLoading] = useState(false);

  const key = asset ? `${asset.width}x${asset.height}:${asset.mediaType}` : '';

  useEffect(() => {
    if (!asset) { setFormats([]); return; }
    setLoading(true);
    suggestFormatsForAsset(asset).then(result => {
      setFormats(result);
      setLoading(false);
    });
  }, [key]);

  return { formats, loading };
}

/** Get format counts per platform (for KPI display) */
export function useFormatCounts(): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    getAllFormats().then(all => {
      const c: Record<string, number> = {};
      for (const f of all) c[f.platform] = (c[f.platform] || 0) + 1;
      c.total = all.length;
      setCounts(c);
    });
  }, []);

  return counts;
}
