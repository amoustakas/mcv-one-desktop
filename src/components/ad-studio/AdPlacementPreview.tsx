import PlatformIcon from './PlatformIcon';
import type { AdFormat, CreativeAsset } from '../../lib/ad-specs/types';
import { PLATFORM_META } from '../../lib/ad-specs/types';

interface Props {
  format: AdFormat;
  asset?: CreativeAsset;
  scale?: number;
  showFrame?: boolean;
  showOverlay?: boolean;
  compliancePassed?: boolean;
}

export default function AdPlacementPreview({
  format, asset, scale, showFrame = true, showOverlay = true, compliancePassed,
}: Props) {
  const dims = format.imageSpec?.dimensions?.[0] || format.videoSpec?.dimensions?.[0];
  const w = dims?.width || 300;
  const h = dims?.height || 250;

  // Auto-scale to fit within 280px max width
  const autoScale = scale ?? Math.min(1, 280 / w, 200 / h);
  const meta = PLATFORM_META[format.platform];

  return (
    <div className="ad-preview-container" style={{ width: w * autoScale, height: h * autoScale + (showFrame ? 32 : 0) }}>
      {/* Platform frame chrome */}
      {showFrame && (
        <div className="ad-preview-frame-header" style={{ background: `${meta.color}15` }}>
          <PlatformIcon platform={format.platform} size={10} showLabel />
          <span className="ad-preview-placement">{format.placement}</span>
        </div>
      )}

      {/* Preview area at actual aspect ratio */}
      <div
        className="ad-preview-canvas"
        style={{
          width: w * autoScale,
          height: h * autoScale,
          background: asset?.imageUrl ? `url(${asset.imageUrl}) center/cover` : 'var(--bg-elevated)',
        }}
      >
        {!asset?.imageUrl && (
          <div className="ad-preview-placeholder">
            <span className="ad-preview-dim-text">{w}x{h}</span>
            <span className="ad-preview-format-text">{format.mediaType}</span>
          </div>
        )}

        {/* Dimension overlay */}
        {showOverlay && (
          <div className="ad-preview-overlay">
            <span>{w}x{h}</span>
          </div>
        )}

        {/* Compliance badge */}
        {compliancePassed != null && (
          <div className={`ad-preview-badge ${compliancePassed ? 'pass' : 'fail'}`}>
            {compliancePassed ? '✓' : '✕'}
          </div>
        )}
      </div>
    </div>
  );
}
