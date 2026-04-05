import type { StorageItem } from '../../lib/storage/types';
import FileCard from './FileCard';

interface Props {
  items: StorageItem[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onClick: (item: StorageItem) => void;
  onContextMenu?: (e: React.MouseEvent, item: StorageItem) => void;
  displayStyle: 'grid' | 'list';
}

export default function FileGrid({ items, selectedIds, onSelect, onClick, onContextMenu, displayStyle }: Props) {
  if (items.length === 0) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: 14 }}>No files here yet</p>
        <p style={{ fontSize: 11, marginTop: 4 }}>Upload files or create a folder to get started</p>
      </div>
    );
  }

  return (
    <div className={displayStyle === 'grid' ? 'file-grid' : 'file-list'}>
      {items.map(item => (
        <FileCard
          key={item.id}
          item={item}
          selected={selectedIds.has(item.id)}
          onSelect={onSelect}
          onClick={onClick}
          onContextMenu={onContextMenu}
          displayStyle={displayStyle}
        />
      ))}
    </div>
  );
}
