import { Search, Globe, Music, LayoutGrid } from 'lucide-react';
import type { AdPlatform } from '../../lib/ad-specs/types';
import { PLATFORM_META } from '../../lib/ad-specs/types';

const ICONS: Record<string, React.FC<{ size: number }>> = {
  Search, Globe, Music, LayoutGrid,
  Facebook: Globe,
  Twitter: Globe,
};

interface Props {
  platform: AdPlatform;
  size?: number;
  showLabel?: boolean;
}

export default function PlatformIcon({ platform, size = 14, showLabel }: Props) {
  const meta = PLATFORM_META[platform];
  const Icon = ICONS[meta.icon] || Globe;

  return (
    <span className="platform-icon" style={{ '--platform-color': meta.color } as React.CSSProperties}>
      <Icon size={size} />
      {showLabel && <span className="platform-icon-label">{meta.shortName}</span>}
    </span>
  );
}
