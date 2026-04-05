import { useEffect, useMemo } from 'react';
import { LayoutGrid, List, Upload, FolderPlus, Sparkles } from 'lucide-react';
import { PageShell, PageHeader, Tabs } from '../components/ui';
import BreadcrumbBar from '../components/files/BreadcrumbBar';
import FileGrid from '../components/files/FileGrid';
import FilePreviewPanel from '../components/files/FilePreviewPanel';
import DiscoverView from '../components/cinema/DiscoverView';
import { useFilesStore } from '../stores/files';
import { useFileList, useFileDownload, useFileDelete } from '../hooks/use-files';
import type { StorageItem } from '../lib/storage/types';
import '../styles/files.css';

const VIEW_TABS = [
  { id: 'browser', label: 'Browser' },
  { id: 'media-library', label: 'Media Library' },
  { id: 'all-sources', label: 'All Sources' },
];

export default function FilesView() {
  const {
    viewMode, setViewMode, displayMode, setDisplayMode,
    displayStyle, setDisplayStyle, currentProvider, currentPath,
    breadcrumbs, navigateTo, files, folders, selectedIds,
    toggleSelect, previewFileId, setPreviewFile, loading,
  } = useFilesStore();

  const { refetch } = useFileList(currentProvider, currentPath);
  const downloadMutation = useFileDownload();
  const deleteMutation = useFileDelete();

  useEffect(() => { refetch(); }, [currentProvider, currentPath, refetch]);

  const allItems = useMemo(() => [...folders, ...files], [folders, files]);

  const previewFile = useMemo(
    () => allItems.find(f => f.id === previewFileId) || null,
    [allItems, previewFileId],
  );

  function handleItemClick(item: StorageItem) {
    if (item.isFolder) {
      navigateTo(item.path, item.provider);
    } else {
      setPreviewFile(item.id);
    }
  }

  function handleDownload(file: StorageItem) {
    downloadMutation.mutate({ provider: file.provider, path: file.path, filename: file.name });
  }

  function handleDelete(file: StorageItem) {
    if (confirm(`Delete "${file.name}"?`)) {
      deleteMutation.mutate({ provider: file.provider, path: file.path });
      setPreviewFile(null);
    }
  }

  return (
    <PageShell>
      <PageHeader title="Files">
        <div className="mode-toggle">
          <button
            className={`mode-toggle-btn ${displayMode === 'browse' ? 'active' : ''}`}
            onClick={() => setDisplayMode('browse')}
          >
            Browse
          </button>
          <button
            className={`mode-toggle-btn ${displayMode === 'discover' ? 'active' : ''}`}
            onClick={() => setDisplayMode('discover')}
          >
            <Sparkles size={12} style={{ marginRight: 4 }} />
            Discover
          </button>
        </div>
      </PageHeader>

      {displayMode === 'browse' ? (
        <div className="files-view">
          <Tabs
            tabs={VIEW_TABS}
            active={viewMode}
            onChange={(id) => setViewMode(id as typeof viewMode)}
          />

          <div className="files-toolbar">
            <div className="files-toolbar-left">
              <BreadcrumbBar
                crumbs={breadcrumbs}
                onNavigate={navigateTo}
              />
            </div>
            <div className="files-toolbar-right">
              <button
                className="header-icon-btn"
                onClick={() => setDisplayStyle(displayStyle === 'grid' ? 'list' : 'grid')}
                title={displayStyle === 'grid' ? 'List view' : 'Grid view'}
              >
                {displayStyle === 'grid' ? <List size={14} /> : <LayoutGrid size={14} />}
              </button>
              <button className="header-icon-btn" title="New folder">
                <FolderPlus size={14} />
              </button>
              <button className="header-icon-btn" title="Upload">
                <Upload size={14} />
              </button>
            </div>
          </div>

          <div className="files-body">
            <div className="files-main">
              {loading ? (
                <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                  Loading files...
                </div>
              ) : (
                <FileGrid
                  items={allItems}
                  selectedIds={selectedIds}
                  onSelect={toggleSelect}
                  onClick={handleItemClick}
                  displayStyle={displayStyle}
                />
              )}
            </div>

            {/* File Preview Slide-in Panel */}
            <FilePreviewPanel
              file={previewFile}
              onClose={() => setPreviewFile(null)}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />
          </div>
        </div>
      ) : (
        <DiscoverView />
      )}
    </PageShell>
  );
}
