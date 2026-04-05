import { motion } from 'framer-motion';
import { fadeInUp, hoverLift, tapScale } from '../../lib/animations';
import StorageProviderBadge from '../files/StorageProviderBadge';
import type { StorageProviderId } from '../../lib/storage/types';
import { File, Image, Film, Music, FileText, Code, Database } from 'lucide-react';

function getTypeIcon(mimeType?: string): React.FC<{ size: number }> {
  if (!mimeType) return File;
  if (mimeType.startsWith('image')) return Image;
  if (mimeType.startsWith('video')) return Film;
  if (mimeType.startsWith('audio')) return Music;
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('word')) return FileText;
  if (mimeType.includes('json') || mimeType.includes('csv') || mimeType.includes('spreadsheet')) return Database;
  if (mimeType.includes('javascript') || mimeType.includes('typescript') || mimeType.includes('python')) return Code;
  return File;
}

interface CinemaCardProps {
  id: string;
  title: string;
  thumbnail?: string;
  mimeType?: string;
  meta: string;
  tags?: string[];
  provider: StorageProviderId;
  ventureColor?: string;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function CinemaCard({
  title, thumbnail, mimeType, meta, tags = [], provider,
  ventureColor, onClick, onContextMenu, size = 'md',
}: CinemaCardProps) {
  const Icon = getTypeIcon(mimeType);
  const w = size === 'sm' ? 160 : size === 'lg' ? 280 : 200;

  return (
    <motion.div
      className="cinema-card"
      style={{ width: w, '--venture-stripe': ventureColor || 'var(--cyan)' } as React.CSSProperties}
      variants={fadeInUp}
      {...hoverLift}
      {...tapScale}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div className="cinema-card-thumb">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="cinema-card-img" />
        ) : (
          <div className="cinema-card-placeholder">
            <Icon size={32} />
          </div>
        )}
        <div className="cinema-card-overlay" />
        <div className="cinema-card-provider">
          <StorageProviderBadge provider={provider} compact />
        </div>
        <div className="cinema-card-stripe" />
      </div>
      <div className="cinema-card-body">
        <div className="cinema-card-title">{title}</div>
        <div className="cinema-card-meta">{meta}</div>
        {tags.length > 0 && (
          <div className="cinema-card-tags">
            {tags.slice(0, 3).map(tag => (
              <span key={tag} className="cinema-card-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
