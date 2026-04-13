import { useState, useEffect, useCallback } from 'react';
import {
  FileEdit, Search, RefreshCw, Plus, ExternalLink,
  FileText, Table2, Presentation, AlertTriangle,
  Clock, User,
} from 'lucide-react';
import {
  PageHeader, Button, GlassCard, Badge, Skeleton, EmptyState, Input,
} from '../components/ui';
import { useToast } from '../components/Toasts';

// ── Types ──

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  owners?: Array<{ displayName: string; photoLink: string }>;
  webViewLink: string;
  iconLink: string;
  thumbnailLink?: string;
}

type DocFilter = 'all' | 'docs' | 'sheets' | 'slides';

const MIME_MAP: Record<DocFilter, string> = {
  all: '',
  docs: 'application/vnd.google-apps.document',
  sheets: 'application/vnd.google-apps.spreadsheet',
  slides: 'application/vnd.google-apps.presentation',
};

const TYPE_ICON: Record<string, typeof FileText> = {
  'application/vnd.google-apps.document': FileText,
  'application/vnd.google-apps.spreadsheet': Table2,
  'application/vnd.google-apps.presentation': Presentation,
};

const TYPE_COLOR: Record<string, string> = {
  'application/vnd.google-apps.document': '#4285F4',
  'application/vnd.google-apps.spreadsheet': '#0F9D58',
  'application/vnd.google-apps.presentation': '#F4B400',
};

// ── API ──

async function driveApi(action: string, params: Record<string, unknown> = {}) {
  const qs = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
  const res = await fetch(`/api/google-drive?${qs}`);
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Drive ${res.status}`); }
  return res.json();
}

// ── Main View ──

export default function GoogleDocsView() {
  const { addToast } = useToast();
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<DocFilter>('all');
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query for Google Workspace docs
      let q = "mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.google-apps.presentation'";
      if (MIME_MAP[filter]) {
        q = `mimeType = '${MIME_MAP[filter]}'`;
      }
      if (searchQuery) {
        q = `(${q}) and name contains '${searchQuery.replace(/'/g, "\\'")}'`;
      }
      const data = await driveApi('list', { q, maxResults: 50, orderBy: 'modifiedTime desc' });
      setFiles(data.files ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [filter, searchQuery]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadFiles();
  };

  const getIcon = (mimeType: string) => {
    const Icon = TYPE_ICON[mimeType] || FileText;
    const color = TYPE_COLOR[mimeType] || 'var(--text-muted)';
    return <Icon size={20} style={{ color }} />;
  };

  const getTypeLabel = (mimeType: string) => {
    if (mimeType.includes('document')) return 'Doc';
    if (mimeType.includes('spreadsheet')) return 'Sheet';
    if (mimeType.includes('presentation')) return 'Slides';
    return 'File';
  };

  return (
    <div className="gdocs-view">
      <PageHeader title="Google Docs" subtitle={`${files.length} documents`}>
        <div className="gdocs-filter">
          {(['all', 'docs', 'sheets', 'slides'] as DocFilter[]).map(f => (
            <button key={f} className={`gdocs-filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button className="gdocs-icon-btn" onClick={loadFiles} title="Refresh"><RefreshCw size={16} /></button>
      </PageHeader>

      <form className="gdocs-search" onSubmit={handleSearch}>
        <Search size={14} />
        <input type="text" placeholder="Search documents..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </form>

      <div className="gdocs-layout">
        {/* File list */}
        <div className="gdocs-list">
          {error && <div className="gdocs-error"><AlertTriangle size={14} />{error}</div>}

          {loading ? (
            <div className="gdocs-loading">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} style={{ height: 64, borderRadius: 8, marginBottom: 4 }} />)}
            </div>
          ) : files.length === 0 ? (
            <EmptyState icon={<FileEdit size={32} />} title="No documents" description={searchQuery ? 'No results.' : 'No Google Workspace documents found.'} />
          ) : (
            <div className="gdocs-grid">
              {files.map(file => (
                <button
                  key={file.id}
                  className={`gdocs-file-card ${selectedFile?.id === file.id ? 'selected' : ''}`}
                  onClick={() => setSelectedFile(file)}
                >
                  <div className="gdocs-file-icon">{getIcon(file.mimeType)}</div>
                  <div className="gdocs-file-info">
                    <div className="gdocs-file-name">{file.name}</div>
                    <div className="gdocs-file-meta">
                      <Badge>{getTypeLabel(file.mimeType)}</Badge>
                      <span className="gdocs-file-date">
                        <Clock size={10} />
                        {new Date(file.modifiedTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      {file.owners?.[0] && (
                        <span className="gdocs-file-owner">
                          <User size={10} />
                          {file.owners[0].displayName}
                        </span>
                      )}
                    </div>
                  </div>
                  <a
                    href={file.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gdocs-open-btn"
                    onClick={e => e.stopPropagation()}
                    title="Open in Google"
                  >
                    <ExternalLink size={14} />
                  </a>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Preview pane */}
        <div className="gdocs-preview">
          {selectedFile ? (
            <div className="gdocs-preview-content">
              <div className="gdocs-preview-header">
                <div className="gdocs-preview-icon">{getIcon(selectedFile.mimeType)}</div>
                <div>
                  <h3>{selectedFile.name}</h3>
                  <p>{getTypeLabel(selectedFile.mimeType)} · Modified {new Date(selectedFile.modifiedTime).toLocaleString()}</p>
                </div>
              </div>
              <div className="gdocs-preview-actions">
                <a href={selectedFile.webViewLink} target="_blank" rel="noopener noreferrer">
                  <Button><ExternalLink size={14} /> Open in Google</Button>
                </a>
              </div>
              <iframe
                className="gdocs-embed"
                src={`https://docs.google.com/document/d/${selectedFile.id}/preview`}
                title={selectedFile.name}
              />
            </div>
          ) : (
            <div className="gdocs-preview-empty">
              <FileEdit size={48} strokeWidth={1} style={{ color: 'var(--text-muted)' }} />
              <p>Select a document to preview</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .gdocs-view { height: 100%; display: flex; flex-direction: column; overflow: hidden; }
        .gdocs-search {
          display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-xs) var(--space-md);
          border-bottom: 1px solid var(--border); color: var(--text-muted); background: var(--bg-surface);
        }
        .gdocs-search input { flex: 1; background: transparent; border: none; color: var(--text-primary); font-size: 13px; outline: none; }
        .gdocs-search input::placeholder { color: var(--text-muted); }
        .gdocs-filter { display: flex; gap: 2px; background: var(--bg-input); border-radius: var(--radius-sm); padding: 2px; }
        .gdocs-filter-btn {
          padding: 4px 10px; border: none; background: transparent; color: var(--text-muted);
          font-size: 12px; cursor: pointer; border-radius: var(--radius-sm); transition: var(--transition-fast);
        }
        .gdocs-filter-btn.active { background: var(--bg-card); color: var(--text-primary); }
        .gdocs-filter-btn:hover { color: var(--text-primary); }
        .gdocs-layout { flex: 1; display: grid; grid-template-columns: 400px 1fr; gap: 1px; background: var(--border); overflow: hidden; }
        .gdocs-list { background: var(--bg-surface); overflow-y: auto; padding: var(--space-sm); }
        .gdocs-error { display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-md); color: var(--danger, #ef4444); font-size: 13px; }
        .gdocs-loading { display: flex; flex-direction: column; gap: 4px; }
        .gdocs-grid { display: flex; flex-direction: column; gap: 2px; }
        .gdocs-file-card {
          display: flex; align-items: center; gap: var(--space-md); padding: var(--space-sm) var(--space-md);
          border: none; background: transparent; cursor: pointer; width: 100%; text-align: left;
          border-radius: var(--radius-sm); transition: var(--transition-fast);
        }
        .gdocs-file-card:hover { background: var(--bg-hover); }
        .gdocs-file-card.selected { background: rgba(0, 240, 255, 0.06); }
        .gdocs-file-icon { flex-shrink: 0; }
        .gdocs-file-info { flex: 1; min-width: 0; }
        .gdocs-file-name { font-size: 14px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .gdocs-file-meta { display: flex; align-items: center; gap: var(--space-sm); margin-top: 4px; }
        .gdocs-file-date, .gdocs-file-owner { font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 3px; }
        .gdocs-open-btn {
          display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;
          color: var(--text-muted); border-radius: var(--radius-sm); flex-shrink: 0;
          transition: var(--transition-fast);
        }
        .gdocs-open-btn:hover { color: var(--cyan); background: var(--bg-hover); }
        .gdocs-preview { background: var(--bg-card); overflow: hidden; display: flex; flex-direction: column; }
        .gdocs-preview-empty {
          flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: var(--space-md); color: var(--text-muted); font-size: 14px;
        }
        .gdocs-preview-content { display: flex; flex-direction: column; height: 100%; }
        .gdocs-preview-header { display: flex; align-items: center; gap: var(--space-md); padding: var(--space-md); border-bottom: 1px solid var(--border); }
        .gdocs-preview-header h3 { margin: 0; font-size: 16px; color: var(--text-primary); }
        .gdocs-preview-header p { margin: 4px 0 0; font-size: 12px; color: var(--text-muted); }
        .gdocs-preview-actions { padding: var(--space-sm) var(--space-md); }
        .gdocs-preview-actions a { text-decoration: none; }
        .gdocs-embed { flex: 1; border: none; width: 100%; background: white; border-radius: 0 0 var(--radius-md) var(--radius-md); }
        .gdocs-icon-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: none; background: transparent; color: var(--text-secondary); cursor: pointer; border-radius: var(--radius-sm); }
        .gdocs-icon-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
      `}</style>
    </div>
  );
}
