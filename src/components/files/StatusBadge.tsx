import { Lock, Trash2, Archive, Eye, CheckCircle, Clock, Edit3, Link2 } from 'lucide-react';
import type { FileStatus, FileCertification } from '../../lib/storage/types';
import { STATUS_COLORS } from '../../lib/storage/types';

const STATUS_ICONS: Record<FileStatus, React.FC<{ size: number }>> = {
  draft: Clock,
  active: Eye,
  review: Edit3,
  approved: CheckCircle,
  archived: Archive,
  trash: Trash2,
  locked: Lock,
};

const STATUS_LABELS: Record<FileStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  review: 'Review',
  approved: 'Approved',
  archived: 'Archived',
  trash: 'Trash',
  locked: 'Locked',
};

interface Props {
  status: FileStatus;
  certification?: FileCertification;
}

export default function StatusBadge({ status, certification }: Props) {
  if (certification === 'nft-certified') {
    return (
      <span className="status-badge" style={{ '--status-color': 'var(--cyan)' } as React.CSSProperties}>
        <Link2 size={10} />
        <span>On-Chain</span>
      </span>
    );
  }

  const Icon = STATUS_ICONS[status];
  const color = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];

  return (
    <span
      className={`status-badge ${status === 'draft' ? 'status-draft' : ''} ${status === 'review' ? 'status-pulse' : ''}`}
      style={{ '--status-color': color } as React.CSSProperties}
    >
      <Icon size={10} />
      <span>{label}</span>
    </span>
  );
}
