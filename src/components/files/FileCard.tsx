import { Folder, File, Image, Film, Music, FileText, Code, Database, Check } from 'lucide-react';
import StorageProviderBadge from './StorageProviderBadge';
import StatusBadge from './StatusBadge';
import type { StorageItem } from '../../lib/storage/types';

function getIcon(item: StorageItem) {
  if (item.isFolder) return Folder;
  const mime = item.mimeType || '';
  if (mime.startsWith('image')) return Image;
  if (mime.startsWith('video')) return Film;
  if (mime.startsWith('audio')) return Music;
  if (mime.includes('pdf') || mime.includes('document')) return FileText;
  if (mime.includes('json') || mime.includes('csv')) return Database;
  if (mime.includes('javascript') || mime.includes('typescript')) return Code;
  return File;
}

function formatSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface Props {
  item: StorageItem;
  selected: boolean;
  onSelect: (id: string) => void;
  onClick: (item: StorageItem) => void;
  onContextMenu?: (e: React.MouseEvent, item: StorageItem) => void;
  displayStyle: 'grid' | 'list';
}

export default function FileCard({ item, selected, onSelect, onClick, onContextMenu, displayStyle }: Props) {
  const Icon = getIcon(item);

  if (displayStyle === 'list') {
    return (
      <div
        className={`file-row ${selected ? 'selected' : ''}`}
        onClick={() => onClick(item)}
        onContextMenu={(e) => onContextMenu?.(e, item)}
      >
        <div className="file-row-icon" style={item.isFolder ? { color: 'var(--gold)' } : undefined}>
          <Icon size={16} />
        </div>
        <span className="file-row-name">{item.name}</span>
        {item.status !== 'active' && <StatusBadge status={item.status} certification={item.certification} />}
        <StorageProviderBadge provider={item.provider} compact />
        <span className="file-row-size">{formatSize(item.sizeBytes)}</span>
        <span className="file-row-date">{timeAgo(item.updatedAt)}</span>
      </div>
    );
  }

  return (
    <div
      className={`file-card ${selected ? 'selected' : ''}`}
      onClick={() => onClick(item)}
      onContextMenu={(e) => onContextMenu?.(e, item)}
    >
      <div
        className="file-card-check"
        onClick={(e) => { e.stopPropagation(); onSelect(item.id); }}
      >
        {selected && <Check size={12} color="var(--bg-deep)" />}
      </div>
      <div className="file-card-thumb">
        {item.thumbnail ? (
          <>
            <img src={item.thumbnail} alt={item.name} />
            <div className="file-card-thumb-overlay" />
          </>
        ) : (
          <Icon size={28} style={item.isFolder ? { color: 'var(--gold)' } : undefined} />
        )}
      </div>
      <div className="file-card-info">
        <div className="file-card-name">{item.name}</div>
        <div className="file-card-meta">
          <span>{formatSize(item.sizeBytes)}</span>
          <span>{timeAgo(item.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
