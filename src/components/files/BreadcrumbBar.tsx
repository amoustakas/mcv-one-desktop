import { ChevronRight } from 'lucide-react';
import StorageProviderBadge from './StorageProviderBadge';
import type { StorageProviderId } from '../../lib/storage/types';

interface Crumb {
  label: string;
  path: string;
  provider: StorageProviderId;
}

interface Props {
  crumbs: Crumb[];
  onNavigate: (path: string, provider: StorageProviderId) => void;
}

export default function BreadcrumbBar({ crumbs, onNavigate }: Props) {
  return (
    <div className="breadcrumb-bar">
      {crumbs.map((crumb, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {i > 0 && <ChevronRight size={10} className="breadcrumb-sep" />}
          {i === 0 ? (
            <span
              className="breadcrumb-item"
              onClick={() => onNavigate('', crumb.provider)}
            >
              <StorageProviderBadge provider={crumb.provider} compact />
            </span>
          ) : (
            <span
              className={`breadcrumb-item ${i === crumbs.length - 1 ? 'active' : ''}`}
              onClick={() => onNavigate(crumb.path, crumb.provider)}
            >
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
