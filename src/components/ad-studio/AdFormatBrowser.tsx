import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Image, Film, FileText, Layers } from 'lucide-react';
import { staggerContainer } from '../../lib/animations';
import { Tabs } from '../ui';
import AdSpecCard from './AdSpecCard';
import { useAdFormats } from '../../hooks/use-ad-specs';
import type { AdFormat, AdPlatform, AdMediaType } from '../../lib/ad-specs/types';
import { PLATFORM_META } from '../../lib/ad-specs/types';

const PLATFORM_TABS = [
  { id: 'all', label: 'All' },
  ...Object.values(PLATFORM_META).map(p => ({ id: p.id, label: p.shortName })),
];

const MEDIA_FILTERS: { id: string; label: string; icon: React.FC<{ size: number }> }[] = [
  { id: 'all', label: 'All', icon: Layers },
  { id: 'image', label: 'Image', icon: Image },
  { id: 'video', label: 'Video', icon: Film },
  { id: 'text', label: 'Text', icon: FileText },
];

interface Props {
  onSelect?: (format: AdFormat) => void;
  selectedFormats?: string[];
  multiSelect?: boolean;
  compact?: boolean;
}

export default function AdFormatBrowser({ onSelect, selectedFormats = [], multiSelect: _multiSelect, compact }: Props) {
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [mediaFilter, setMediaFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { formats, loading } = useAdFormats({
    platform: platformFilter !== 'all' ? platformFilter as AdPlatform : undefined,
    mediaType: mediaFilter !== 'all' ? mediaFilter as AdMediaType : undefined,
    query: searchQuery || undefined,
  });

  return (
    <div className="format-browser">
      {/* Platform tabs */}
      <Tabs
        tabs={PLATFORM_TABS}
        active={platformFilter}
        onChange={setPlatformFilter}
        className="format-browser-tabs"
      />

      {/* Search + media filter */}
      <div className="format-browser-toolbar">
        <div className="format-browser-search">
          <Search size={13} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search formats..."
          />
        </div>
        <div className="format-browser-media-filter">
          {MEDIA_FILTERS.map(mf => {
            const Icon = mf.icon;
            return (
              <button
                key={mf.id}
                className={`format-media-btn ${mediaFilter === mf.id ? 'active' : ''}`}
                onClick={() => setMediaFilter(mf.id)}
              >
                <Icon size={12} />
                {mf.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <div className="format-browser-count">
        {loading ? 'Loading...' : `${formats.length} formats`}
      </div>

      {/* Format cards */}
      <motion.div
        className="format-browser-list"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        key={`${platformFilter}-${mediaFilter}-${searchQuery}`}
      >
        {formats.map(format => (
          <AdSpecCard
            key={format.id}
            format={format}
            compact={compact}
            selected={selectedFormats.includes(format.id)}
            onSelect={onSelect}
          />
        ))}
      </motion.div>
    </div>
  );
}
