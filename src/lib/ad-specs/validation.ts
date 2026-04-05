// MCV One — Ad Creative Compliance Validation Engine
// Pure function validation — no API calls needed

import type { AdFormat, CreativeAsset, ComplianceResult, ComplianceReport } from './types';
import { getAllFormats } from './registry';

/**
 * Validate a creative asset against a single ad format.
 * Returns a detailed compliance report with pass/fail per rule.
 */
export function validateCreative(asset: CreativeAsset, format: AdFormat): ComplianceReport {
  const results: ComplianceResult[] = [];

  // Image checks
  if (format.imageSpec && (format.mediaType === 'image' || format.mediaType === 'carousel')) {
    const spec = format.imageSpec;

    // File format check
    if (asset.fileFormat) {
      const normalizedFormat = asset.fileFormat.toLowerCase().replace('jpeg', 'jpg');
      const allowed = spec.formats.map(f => f.toLowerCase());
      results.push({
        rule: 'File Format',
        field: 'fileFormat',
        passed: allowed.includes(normalizedFormat),
        actual: normalizedFormat,
        expected: `One of: ${allowed.join(', ')}`,
        severity: 'error',
      });
    }

    // File size check
    if (asset.fileSizeMb != null) {
      results.push({
        rule: 'File Size',
        field: 'fileSizeMb',
        passed: asset.fileSizeMb <= spec.maxFileSizeMb,
        actual: `${asset.fileSizeMb.toFixed(1)} MB`,
        expected: `Max ${spec.maxFileSizeMb} MB`,
        severity: 'error',
      });
    }

    // Min width check
    if (asset.width != null && spec.minWidth) {
      results.push({
        rule: 'Minimum Width',
        field: 'width',
        passed: asset.width >= spec.minWidth,
        actual: `${asset.width}px`,
        expected: `Min ${spec.minWidth}px`,
        severity: 'error',
      });
    }

    // Min height check
    if (asset.height != null && spec.minHeight) {
      results.push({
        rule: 'Minimum Height',
        field: 'height',
        passed: asset.height >= spec.minHeight,
        actual: `${asset.height}px`,
        expected: `Min ${spec.minHeight}px`,
        severity: 'error',
      });
    }

    // Aspect ratio check
    if (asset.width && asset.height && spec.aspectRatios && spec.aspectRatios.length > 0) {
      const assetRatio = asset.width / asset.height;
      const matchesAny = spec.aspectRatios.some(ar => {
        const [w, h] = ar.ratio.split(':').map(Number);
        const targetRatio = w / h;
        return Math.abs(assetRatio - targetRatio) / targetRatio < 0.02; // 2% tolerance
      });
      results.push({
        rule: 'Aspect Ratio',
        field: 'dimensions',
        passed: matchesAny,
        actual: `${asset.width}x${asset.height} (${(assetRatio).toFixed(2)})`,
        expected: `One of: ${spec.aspectRatios.map(ar => ar.ratio).join(', ')}`,
        severity: 'warning',
      });
    }

    // Exact dimension match (for fixed-size formats like GDN banners)
    if (asset.width && asset.height && spec.dimensions && spec.dimensions.length > 0) {
      const matchesExact = spec.dimensions.some(d =>
        d.width === asset.width && d.height === asset.height
      );
      if (!matchesExact) {
        const closestMatch = spec.dimensions
          .map(d => ({ ...d, diff: Math.abs(d.width - (asset.width || 0)) + Math.abs(d.height - (asset.height || 0)) }))
          .sort((a, b) => a.diff - b.diff)[0];
        results.push({
          rule: 'Recommended Dimensions',
          field: 'dimensions',
          passed: false,
          actual: `${asset.width}x${asset.height}`,
          expected: `Recommended: ${closestMatch?.width}x${closestMatch?.height} (${closestMatch?.label || ''})`,
          severity: 'info',
        });
      }
    }
  }

  // Video checks
  if (format.videoSpec && (format.mediaType === 'video')) {
    const spec = format.videoSpec;

    // File format
    if (asset.fileFormat) {
      const normalizedFormat = asset.fileFormat.toLowerCase();
      const allowed = spec.formats.map(f => f.toLowerCase());
      results.push({
        rule: 'Video Format',
        field: 'fileFormat',
        passed: allowed.includes(normalizedFormat),
        actual: normalizedFormat,
        expected: `One of: ${allowed.join(', ')}`,
        severity: 'error',
      });
    }

    // File size
    if (asset.fileSizeMb != null) {
      results.push({
        rule: 'Video File Size',
        field: 'fileSizeMb',
        passed: asset.fileSizeMb <= spec.maxFileSizeMb,
        actual: `${asset.fileSizeMb.toFixed(1)} MB`,
        expected: `Max ${spec.maxFileSizeMb} MB`,
        severity: 'error',
      });
    }

    // Duration
    if (asset.durationSec != null) {
      if (spec.minDurationSec != null) {
        results.push({
          rule: 'Minimum Duration',
          field: 'durationSec',
          passed: asset.durationSec >= spec.minDurationSec,
          actual: `${asset.durationSec}s`,
          expected: `Min ${spec.minDurationSec}s`,
          severity: 'error',
        });
      }
      if (spec.maxDurationSec != null) {
        results.push({
          rule: 'Maximum Duration',
          field: 'durationSec',
          passed: asset.durationSec <= spec.maxDurationSec,
          actual: `${asset.durationSec}s`,
          expected: `Max ${spec.maxDurationSec}s`,
          severity: 'error',
        });
      }
      if (spec.recommendedDurationSec != null) {
        const diff = Math.abs(asset.durationSec - spec.recommendedDurationSec);
        results.push({
          rule: 'Recommended Duration',
          field: 'durationSec',
          passed: diff <= 5,
          actual: `${asset.durationSec}s`,
          expected: `~${spec.recommendedDurationSec}s recommended`,
          severity: 'info',
        });
      }
    }

    // Aspect ratio for video
    if (asset.width && asset.height && spec.aspectRatios && spec.aspectRatios.length > 0) {
      const assetRatio = asset.width / asset.height;
      const matchesAny = spec.aspectRatios.some(ar => {
        const [w, h] = ar.ratio.split(':').map(Number);
        return Math.abs(assetRatio - w / h) / (w / h) < 0.02;
      });
      results.push({
        rule: 'Video Aspect Ratio',
        field: 'dimensions',
        passed: matchesAny,
        actual: `${asset.width}x${asset.height}`,
        expected: `One of: ${spec.aspectRatios.map(ar => ar.ratio).join(', ')}`,
        severity: 'warning',
      });
    }
  }

  // Text checks
  for (const textSpec of format.textSpecs) {
    const value = asset.texts[textSpec.field];
    if (value != null) {
      // Max chars
      results.push({
        rule: `${textSpec.field} Length`,
        field: textSpec.field,
        passed: value.length <= textSpec.maxChars,
        actual: `${value.length} chars`,
        expected: `Max ${textSpec.maxChars} chars`,
        severity: 'error',
      });

      // Min chars
      if (textSpec.minChars != null) {
        results.push({
          rule: `${textSpec.field} Min Length`,
          field: textSpec.field,
          passed: value.length >= textSpec.minChars,
          actual: `${value.length} chars`,
          expected: `Min ${textSpec.minChars} chars`,
          severity: 'warning',
        });
      }

      // Recommended length
      if (textSpec.recommended != null && value.length > textSpec.recommended) {
        results.push({
          rule: `${textSpec.field} Recommended Length`,
          field: textSpec.field,
          passed: false,
          actual: `${value.length} chars`,
          expected: `Recommended ≤${textSpec.recommended} chars`,
          severity: 'info',
        });
      }
    }
  }

  const errors = results.filter(r => !r.passed && r.severity === 'error').length;
  const warnings = results.filter(r => !r.passed && r.severity === 'warning').length;

  return {
    format,
    results,
    passed: errors === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a creative against multiple formats at once.
 */
export function validateCreativeMulti(asset: CreativeAsset, formats: AdFormat[]): ComplianceReport[] {
  return formats.map(format => validateCreative(asset, format));
}

/**
 * Suggest compatible formats for a given asset based on dimensions and media type.
 */
export async function suggestFormatsForAsset(asset: CreativeAsset): Promise<AdFormat[]> {
  const all = await getAllFormats();

  return all.filter(format => {
    // Media type must match
    if (asset.mediaType !== format.mediaType) return false;

    // For images, check if dimensions are compatible
    if (format.imageSpec && asset.width && asset.height) {
      const spec = format.imageSpec;
      // Check aspect ratio compatibility
      if (spec.aspectRatios && spec.aspectRatios.length > 0) {
        const assetRatio = asset.width / asset.height;
        const matchesAny = spec.aspectRatios.some(ar => {
          const [w, h] = ar.ratio.split(':').map(Number);
          return Math.abs(assetRatio - w / h) / (w / h) < 0.05; // 5% tolerance for suggestions
        });
        if (!matchesAny) return false;
      }
      // Check minimum dimensions
      if (spec.minWidth && asset.width < spec.minWidth) return false;
      if (spec.minHeight && asset.height < spec.minHeight) return false;
    }

    // For videos, check duration compatibility
    if (format.videoSpec && asset.durationSec) {
      const spec = format.videoSpec;
      if (spec.minDurationSec && asset.durationSec < spec.minDurationSec) return false;
      if (spec.maxDurationSec && asset.durationSec > spec.maxDurationSec) return false;
    }

    return true;
  });
}

/**
 * Get generation parameters for creating a creative targeting a specific format.
 * Returns dimensions, duration, and text constraints suitable for AI generation.
 */
export function getGenerationParams(format: AdFormat): {
  width?: number;
  height?: number;
  aspectRatio?: string;
  maxDurationSec?: number;
  textConstraints: { field: string; maxChars: number }[];
} {
  let width: number | undefined;
  let height: number | undefined;
  let aspectRatio: string | undefined;

  if (format.imageSpec) {
    const dim = format.imageSpec.dimensions?.[0];
    if (dim) { width = dim.width; height = dim.height; }
    aspectRatio = format.imageSpec.aspectRatios?.[0]?.ratio;
  }

  if (format.videoSpec) {
    const dim = format.videoSpec.dimensions?.[0];
    if (dim) { width = dim.width; height = dim.height; }
    aspectRatio = format.videoSpec.aspectRatios?.[0]?.ratio;
  }

  return {
    width,
    height,
    aspectRatio,
    maxDurationSec: format.videoSpec?.maxDurationSec,
    textConstraints: format.textSpecs.map(ts => ({ field: ts.field, maxChars: ts.maxChars })),
  };
}
