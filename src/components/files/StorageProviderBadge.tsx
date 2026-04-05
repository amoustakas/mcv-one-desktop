import { Cloud, HardDrive, Globe, Triangle, CloudCog } from 'lucide-react';
import type { StorageProviderId } from '../../lib/storage/types';
import { PROVIDER_COLORS, PROVIDER_NAMES } from '../../lib/storage/types';

const ICONS: Record<StorageProviderId, React.FC<{ size: number }>> = {
  supabase: Cloud,
  local: HardDrive,
  gdrive: Globe,
  'vercel-blob': Triangle,
  r2: CloudCog,
  gcp: Cloud,
};

interface Props {
  provider: StorageProviderId;
  compact?: boolean;
}

export default function StorageProviderBadge({ provider, compact }: Props) {
  const Icon = ICONS[provider] || Cloud;
  const color = PROVIDER_COLORS[provider];
  const name = PROVIDER_NAMES[provider];

  return (
    <span className="provider-badge" style={{ '--provider-color': color } as React.CSSProperties}>
      <Icon size={compact ? 10 : 12} />
      {!compact && <span className="provider-badge-text">{name}</span>}
    </span>
  );
}
