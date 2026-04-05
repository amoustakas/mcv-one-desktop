import { motion } from 'framer-motion';
import { Image, Film, FileText, Layers, Monitor, Zap, ExternalLink } from 'lucide-react';
import { fadeInUp, hoverLift, tapScale } from '../../lib/animations';
import PlatformIcon from './PlatformIcon';
import type { AdFormat } from '../../lib/ad-specs/types';
import { PLATFORM_META } from '../../lib/ad-specs/types';

const TYPE_ICONS: Record<string, React.FC<{ size: number }>> = {
  image: Image, video: Film, text: FileText,
  carousel: Layers, html5: Monitor, responsive: Zap,
};

interface Props {
  format: AdFormat;
  compact?: boolean;
  selected?: boolean;
  onSelect?: (format: AdFormat) => void;
}

export default function AdSpecCard({ format, compact, selected, onSelect }: Props) {
  const meta = PLATFORM_META[format.platform];
  const TypeIcon = TYPE_ICONS[format.mediaType] || FileText;
  const dims = format.imageSpec?.dimensions?.[0] || format.videoSpec?.dimensions?.[0];

  return (
    <motion.div
      className={`adspec-card ${selected ? 'adspec-card-selected' : ''} ${compact ? 'adspec-card-compact' : ''}`}
      style={{ '--adspec-color': meta.color } as React.CSSProperties}
      variants={fadeInUp}
      {...hoverLift}
      {...tapScale}
      onClick={() => onSelect?.(format)}
    >
      <div className="adspec-card-gradient" />

      <div className="adspec-card-header">
        <PlatformIcon platform={format.platform} size={14} />
        <span className="adspec-card-name">{format.name}</span>
        <span className="adspec-card-type">
          <TypeIcon size={10} />
          {format.mediaType}
        </span>
      </div>

      {!compact && (
        <>
          <p className="adspec-card-desc">{format.description}</p>

          {/* Dimensions */}
          {dims && (
            <div className="adspec-card-dims">
              <span className="adspec-card-dim-value">{dims.width}x{dims.height}</span>
              {dims.label && <span className="adspec-card-dim-label">{dims.label}</span>}
            </div>
          )}

          {/* Aspect ratios */}
          {(format.imageSpec?.aspectRatios || format.videoSpec?.aspectRatios) && (
            <div className="adspec-card-ratios">
              {(format.imageSpec?.aspectRatios || format.videoSpec?.aspectRatios || []).map(ar => (
                <span key={ar.ratio} className="adspec-card-ratio">{ar.ratio}</span>
              ))}
            </div>
          )}

          {/* Text limits */}
          {format.textSpecs.length > 0 && (
            <div className="adspec-card-texts">
              {format.textSpecs.slice(0, 3).map(ts => (
                <span key={ts.field} className="adspec-card-text-limit">
                  {ts.field}: {ts.maxChars}
                </span>
              ))}
            </div>
          )}

          {/* Video duration */}
          {format.videoSpec && (
            <div className="adspec-card-video">
              {format.videoSpec.minDurationSec != null && format.videoSpec.maxDurationSec != null
                ? `${format.videoSpec.minDurationSec}–${format.videoSpec.maxDurationSec}s`
                : format.videoSpec.maxDurationSec
                  ? `Max ${format.videoSpec.maxDurationSec}s`
                  : 'No limit'}
            </div>
          )}

          {/* Docs link */}
          {format.docsUrl && (
            <a href={format.docsUrl} target="_blank" rel="noopener noreferrer" className="adspec-card-docs"
              onClick={e => e.stopPropagation()}>
              <ExternalLink size={9} /> Docs
            </a>
          )}
        </>
      )}
    </motion.div>
  );
}
