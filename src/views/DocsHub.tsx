import { useState, useEffect, useCallback, useRef } from 'react';
import { BookOpen, Plus, Search, RefreshCw, FileText, Folder, Edit3, Save, X, ExternalLink, Trash2, Upload, Brain, ChevronRight, ChevronDown, Clock, Tag, Hash, Link2, History, FolderOpen, SortAsc, SortDesc, AlertCircle } from 'lucide-react';
import { useNavigation } from '../stores/navigation';
import Markdown from '../components/Markdown';

/* ── Types ── */
interface Doc {
  id: string;
  title: string;
  content?: string;
  doc_type: string;
  venture_id: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

/* ── Constants ── */
const VENTURES = [
  { id: 'mcv', name: 'MCV One', color: '#00F0FF' },
  { id: 'betedge', name: 'BetEdge AI', color: '#F59E0B' },
  { id: 'futurestate', name: 'FutureState', color: '#10B981' },
  { id: 'warforge', name: 'WarForge', color: '#EF4444' },
  { id: 'edgeiq', name: 'EdgeIQ Markets', color: '#3B82F6' },
  { id: 'arqlabs', name: 'ARQ Labs', color: '#8B5CF6' },
];

const DOC_TYPES = [
  'architecture', 'technical-spec', 'business-plan', 'meeting-notes',
  'proposal', 'legal', 'tokenomics', 'overview', 'status-report', 'note',
];

const DOC_TYPE_COLORS: Record<string, string> = {
  architecture: '#00F0FF',
  'technical-spec': '#3B82F6',
  'business-plan': '#10B981',
  'meeting-notes': '#F59E0B',
  proposal: '#8B5CF6',
  legal: '#EF4444',
  tokenomics: '#FBBF24',
  overview: '#A78BFA',
  'status-report': '#34D399',
  note: '#6B7280',
};

const DOC_TYPE_LABELS: Record<string, string> = {
  architecture: 'Architecture',
  'technical-spec': 'Technical Spec',
  'business-plan': 'Business Plan',
  'meeting-notes': 'Meeting Notes',
  proposal: 'Proposal',
  legal: 'Legal',
  tokenomics: 'Tokenomics',
  overview: 'Overview',
  'status-report': 'Status Report',
  note: 'Note',
};

interface FolderNode {
  id: string;
  label: string;
  icon: 'folder' | 'venture';
  filter: { type?: string; venture_id?: string };
  children?: FolderNode[];
}

const FOLDER_TREE: FolderNode[] = [
  { id: 'all', label: 'All Documents', icon: 'folder', filter: {} },
  { id: 'architecture', label: 'Architecture', icon: 'folder', filter: { type: 'architecture' } },
  { id: 'technical-spec', label: 'Technical Specs', icon: 'folder', filter: { type: 'technical-spec' } },
  { id: 'business-plan', label: 'Business Plans', icon: 'folder', filter: { type: 'business-plan' } },
  { id: 'meeting-notes', label: 'Meeting Notes', icon: 'folder', filter: { type: 'meeting-notes' } },
  { id: 'proposal', label: 'Proposals', icon: 'folder', filter: { type: 'proposal' } },
  { id: 'legal', label: 'Legal', icon: 'folder', filter: { type: 'legal' } },
  { id: 'tokenomics', label: 'Tokenomics', icon: 'folder', filter: { type: 'tokenomics' } },
  { id: 'status-report', label: 'Status Reports', icon: 'folder', filter: { type: 'status-report' } },
  { id: 'note', label: 'Notes', icon: 'folder', filter: { type: 'note' } },
  {
    id: 'ventures', label: 'By Venture', icon: 'folder', filter: {},
    children: VENTURES.map(v => ({
      id: `venture-${v.id}`, label: v.name, icon: 'venture' as const, filter: { venture_id: v.id },
    })),
  },
];

/* ── Helpers ── */
function timeAgo(d: string) {
  if (!d) return '--';
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDate(d: string) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getSnippet(content?: string, maxLen = 120): string {
  if (!content) return 'No content preview available';
  const cleaned = content.replace(/[#*_`>\[\]()!]/g, '').replace(/\n+/g, ' ').trim();
  return cleaned.length > maxLen ? cleaned.slice(0, maxLen) + '...' : cleaned;
}

function getVentureInfo(id: string) {
  return VENTURES.find(v => v.id === id) || { id, name: id, color: '#6B7280' };
}

/* ── API ── */
async function api(body: Record<string, unknown>) {
  const res = await fetch('/api/docs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

/* ── Component ── */
export default function DocsHub() {
  const { mode, activeVenture } = useNavigation();

  // Data
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);
  const [docContent, setDocContent] = useState<string>('');
  const [loadingDoc, setLoadingDoc] = useState(false);

  // Editing
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  // Create
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('note');
  const [newVenture, setNewVenture] = useState(activeVenture || 'mcv');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVenture, setFilterVenture] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  // Folder tree
  const [activeFolder, setActiveFolder] = useState('all');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['ventures']));

  // AI
  const [aiQuery, setAiQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiAsking, setAiAsking] = useState(false);

  const editorRef = useRef<HTMLTextAreaElement>(null);

  /* ── Data fetching ── */
  const loadDocs = useCallback(async () => {
    setLoading(true);
    try {
      const v = filterVenture || (mode === 'venture' ? activeVenture : '') || '';
      const body: Record<string, string> = { action: 'list' };
      if (v) body.venture_id = v;
      const data = await api(body);
      setDocs(data.documents || []);
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [filterVenture, mode, activeVenture]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const loadDocContent = useCallback(async (doc: Doc) => {
    setLoadingDoc(true);
    try {
      const data = await api({ action: 'get', id: doc.id });
      const full = data.document || data;
      setDocContent(full.content || '');
      setSelectedDoc({ ...doc, content: full.content || '' });
    } catch {
      setDocContent('');
    } finally {
      setLoadingDoc(false);
    }
  }, []);

  /* ── Filtering + Sorting ── */
  const filteredDocs = docs
    .filter(d => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!d.title.toLowerCase().includes(q) && !d.doc_type.toLowerCase().includes(q) && !d.venture_id.toLowerCase().includes(q)) return false;
      }
      if (filterType && d.doc_type !== filterType) return false;
      if (filterVenture && d.venture_id !== filterVenture) return false;
      return true;
    })
    .sort((a, b) => {
      const dir = sortDir === 'desc' ? -1 : 1;
      if (sortBy === 'title') return dir * a.title.localeCompare(b.title);
      if (sortBy === 'created') return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      return dir * (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
    });

  /* ── Folder counts ── */
  function getFolderCount(node: FolderNode): number {
    if (node.id === 'all') return docs.length;
    if (node.id === 'ventures') return docs.length;
    if (node.filter.type) return docs.filter(d => d.doc_type === node.filter.type).length;
    if (node.filter.venture_id) return docs.filter(d => d.venture_id === node.filter.venture_id).length;
    return 0;
  }

  /* ── Actions ── */
  function handleFolderClick(node: FolderNode) {
    setActiveFolder(node.id);
    if (node.filter.type) {
      setFilterType(node.filter.type);
      setFilterVenture('');
    } else if (node.filter.venture_id) {
      setFilterVenture(node.filter.venture_id);
      setFilterType('');
    } else {
      setFilterType('');
      setFilterVenture('');
    }
  }

  function toggleFolder(id: string) {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleSelectDoc(doc: Doc) {
    setSelectedDoc(doc);
    setEditing(false);
    setAiAnswer('');
    setAiQuery('');
    loadDocContent(doc);
  }

  function handleStartEdit() {
    if (!selectedDoc) return;
    setEditing(true);
    setEditTitle(selectedDoc.title);
    setEditContent(docContent);
    setTimeout(() => editorRef.current?.focus(), 50);
  }

  async function handleSaveEdit() {
    if (!selectedDoc || saving) return;
    setSaving(true);
    try {
      await api({ action: 'update', id: selectedDoc.id, title: editTitle, content: editContent });
      setDocContent(editContent);
      setSelectedDoc({ ...selectedDoc, title: editTitle, content: editContent, updated_at: new Date().toISOString() });
      setDocs(prev => prev.map(d => d.id === selectedDoc.id ? { ...d, title: editTitle, updated_at: new Date().toISOString() } : d));
      setEditing(false);
    } catch { /* silent */ } finally {
      setSaving(false);
    }
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      await api({ action: 'create', title: newTitle, content: newContent, doc_type: newType, venture_id: newVenture });
      setNewTitle('');
      setNewContent('');
      setShowCreate(false);
      loadDocs();
    } catch { /* silent */ } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api({ action: 'delete', id });
      setDocs(prev => prev.filter(d => d.id !== id));
      if (selectedDoc?.id === id) {
        setSelectedDoc(null);
        setDocContent('');
        setEditing(false);
      }
    } catch { /* silent */ }
  }

  async function handleAskAI() {
    if (!aiQuery.trim() || aiAsking || !selectedDoc) return;
    setAiAsking(true);
    setAiAnswer('');
    try {
      const res = await api({
        action: 'query',
        question: `Regarding the document "${selectedDoc.title}": ${aiQuery}`,
        venture_id: selectedDoc.venture_id || undefined,
      });
      setAiAnswer(res.answer || 'No answer generated.');
    } catch (err) {
      setAiAnswer(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setAiAsking(false);
    }
  }

  /* ── Related docs ── */
  const relatedDocs = selectedDoc
    ? docs.filter(d => d.id !== selectedDoc.id && (d.venture_id === selectedDoc.venture_id || d.doc_type === selectedDoc.doc_type)).slice(0, 5)
    : [];

  /* ── Render ── */
  return (
    <div className="dh">
      {/* ── TOP BAR ── */}
      <div className="dh-topbar">
        <div className="dh-topbar-left">
          <BookOpen size={18} />
          <h1 className="dh-topbar-title">Documentation Hub</h1>
          <span className="dh-topbar-count">{docs.length} docs</span>
        </div>
        <div className="dh-topbar-actions">
          <button className="dh-btn dh-btn-primary" onClick={() => setShowCreate(!showCreate)}>
            <Plus size={13} /> New Document
          </button>
          <button className="dh-btn dh-btn-ghost" title="Import from Notion">
            <Upload size={12} /> Notion
          </button>
          <button className="dh-btn dh-btn-ghost" title="Import from Google Drive">
            <Upload size={12} /> Drive
          </button>
          <button className="dh-btn dh-btn-ghost" title="Import from URL">
            <Link2 size={12} /> URL
          </button>
          <button className="dh-btn dh-btn-icon" onClick={loadDocs} title="Refresh">
            <RefreshCw size={14} className={loading ? 'dh-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── CREATE FORM OVERLAY ── */}
      {showCreate && (
        <div className="dh-create-overlay">
          <div className="dh-create-form glass">
            <div className="dh-create-header">
              <FileText size={15} />
              <span>New Document</span>
              <button className="dh-btn dh-btn-icon dh-create-close" onClick={() => setShowCreate(false)}><X size={14} /></button>
            </div>
            <input
              className="dh-input"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Document title..."
              autoFocus
              onKeyDown={e => e.key === 'Enter' && e.ctrlKey && handleCreate()}
            />
            <div className="dh-create-selects">
              <select className="dh-select" value={newType} onChange={e => setNewType(e.target.value)}>
                {DOC_TYPES.map(t => <option key={t} value={t}>{DOC_TYPE_LABELS[t] || t}</option>)}
              </select>
              <select className="dh-select" value={newVenture} onChange={e => setNewVenture(e.target.value)}>
                {VENTURES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <textarea
              className="dh-textarea"
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Document content (Markdown supported)..."
              rows={8}
            />
            <div className="dh-create-actions">
              <button className="dh-btn dh-btn-primary" onClick={handleCreate} disabled={!newTitle.trim() || saving}>
                <Save size={12} /> {saving ? 'Saving...' : 'Create Document'}
              </button>
              <button className="dh-btn dh-btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── THREE-PANEL LAYOUT ── */}
      <div className="dh-body">
        {/* ── LEFT PANEL: Folder Tree ── */}
        <div className="dh-left">
          <div className="dh-left-header">
            <Folder size={13} />
            <span>Categories</span>
          </div>
          <div className="dh-tree">
            {FOLDER_TREE.map(node => (
              <div key={node.id}>
                <button
                  className={`dh-tree-item ${activeFolder === node.id ? 'active' : ''}`}
                  onClick={() => {
                    if (node.children) toggleFolder(node.id);
                    handleFolderClick(node);
                  }}
                >
                  <span className="dh-tree-icon">
                    {node.children
                      ? (expandedFolders.has(node.id) ? <ChevronDown size={12} /> : <ChevronRight size={12} />)
                      : (activeFolder === node.id ? <FolderOpen size={13} /> : <Folder size={13} />)
                    }
                  </span>
                  <span className="dh-tree-label">{node.label}</span>
                  <span className="dh-tree-count">{getFolderCount(node)}</span>
                </button>
                {node.children && expandedFolders.has(node.id) && (
                  <div className="dh-tree-children">
                    {node.children.map(child => (
                      <button
                        key={child.id}
                        className={`dh-tree-item child ${activeFolder === child.id ? 'active' : ''}`}
                        onClick={() => { setActiveFolder(child.id); handleFolderClick(child); }}
                      >
                        <span className="dh-tree-dot" style={{ background: getVentureInfo(child.filter.venture_id || '').color }} />
                        <span className="dh-tree-label">{child.label}</span>
                        <span className="dh-tree-count">{getFolderCount(child)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── CENTER PANEL: Doc List + Viewer/Editor ── */}
        <div className="dh-center">
          {/* Filter Bar */}
          <div className="dh-filterbar">
            <div className="dh-search-wrap">
              <Search size={13} />
              <input
                className="dh-search-input"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
              />
              {searchQuery && (
                <button className="dh-search-clear" onClick={() => setSearchQuery('')}><X size={11} /></button>
              )}
            </div>
            <select className="dh-select dh-select-sm" value={filterVenture} onChange={e => { setFilterVenture(e.target.value); setActiveFolder(e.target.value ? `venture-${e.target.value}` : 'all'); }}>
              <option value="">All Ventures</option>
              {VENTURES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            <select className="dh-select dh-select-sm" value={filterType} onChange={e => { setFilterType(e.target.value); setActiveFolder(e.target.value || 'all'); }}>
              <option value="">All Types</option>
              {DOC_TYPES.map(t => <option key={t} value={t}>{DOC_TYPE_LABELS[t] || t}</option>)}
            </select>
            <div className="dh-sort-group">
              <select className="dh-select dh-select-sm" value={sortBy} onChange={e => setSortBy(e.target.value as 'updated' | 'created' | 'title')}>
                <option value="updated">Updated</option>
                <option value="created">Created</option>
                <option value="title">Title</option>
              </select>
              <button className="dh-btn dh-btn-icon dh-btn-tiny" onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')} title={sortDir === 'desc' ? 'Descending' : 'Ascending'}>
                {sortDir === 'desc' ? <SortDesc size={12} /> : <SortAsc size={12} />}
              </button>
            </div>
            <span className="dh-filter-count">{filteredDocs.length} result{filteredDocs.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Content area: split between list and viewer */}
          <div className="dh-center-split">
            {/* Document List */}
            <div className={`dh-doclist ${selectedDoc ? 'dh-doclist-narrow' : ''}`}>
              {loading && docs.length === 0 ? (
                <div className="dh-loading">
                  <RefreshCw size={16} className="dh-spin" />
                  <span>Loading documents...</span>
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="dh-empty">
                  <BookOpen size={24} />
                  <p>{docs.length === 0 ? 'No documents yet.' : 'No documents match your filters.'}</p>
                  <button className="dh-btn dh-btn-primary" onClick={() => setShowCreate(true)}>
                    <Plus size={12} /> Create First Document
                  </button>
                </div>
              ) : (
                filteredDocs.map(doc => {
                  const ventureInfo = getVentureInfo(doc.venture_id);
                  const isActive = selectedDoc?.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      className={`dh-doc-card ${isActive ? 'active' : ''}`}
                      onClick={() => handleSelectDoc(doc)}
                    >
                      <div className="dh-doc-card-top">
                        <FileText size={14} className="dh-doc-card-icon" />
                        <span className="dh-doc-card-title">{doc.title}</span>
                        <button
                          className="dh-doc-card-del"
                          onClick={e => { e.stopPropagation(); handleDelete(doc.id); }}
                          title="Delete"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                      <div className="dh-doc-card-badges">
                        <span className="dh-badge dh-badge-type" style={{ color: DOC_TYPE_COLORS[doc.doc_type] || '#6B7280', borderColor: (DOC_TYPE_COLORS[doc.doc_type] || '#6B7280') + '40' }}>
                          {DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}
                        </span>
                        <span className="dh-badge dh-badge-venture" style={{ color: ventureInfo.color, borderColor: ventureInfo.color + '40' }}>
                          {ventureInfo.name}
                        </span>
                        <span className="dh-doc-card-time">
                          <Clock size={10} /> {timeAgo(doc.updated_at)}
                        </span>
                      </div>
                      {!selectedDoc && (
                        <p className="dh-doc-card-snippet">{getSnippet(doc.content)}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Document Viewer / Editor */}
            {selectedDoc && (
              <div className="dh-viewer">
                <div className="dh-viewer-header">
                  {editing ? (
                    <input
                      className="dh-viewer-title-edit"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                    />
                  ) : (
                    <h2 className="dh-viewer-title">{selectedDoc.title}</h2>
                  )}
                  <div className="dh-viewer-actions">
                    {editing ? (
                      <>
                        <button className="dh-btn dh-btn-primary dh-btn-sm" onClick={handleSaveEdit} disabled={saving}>
                          <Save size={12} /> {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button className="dh-btn dh-btn-ghost dh-btn-sm" onClick={() => setEditing(false)}>
                          <X size={12} /> Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="dh-btn dh-btn-ghost dh-btn-sm" onClick={handleStartEdit}>
                          <Edit3 size={12} /> Edit
                        </button>
                        <button className="dh-btn dh-btn-icon dh-btn-sm" onClick={() => { setSelectedDoc(null); setEditing(false); }} title="Close">
                          <X size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="dh-viewer-body">
                  {loadingDoc ? (
                    <div className="dh-loading">
                      <RefreshCw size={14} className="dh-spin" />
                      <span>Loading content...</span>
                    </div>
                  ) : editing ? (
                    <textarea
                      ref={editorRef}
                      className="dh-editor-textarea"
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      placeholder="Write your document content in Markdown..."
                    />
                  ) : docContent ? (
                    <div className="dh-viewer-content">
                      <Markdown content={docContent} />
                    </div>
                  ) : (
                    <div className="dh-empty-content">
                      <FileText size={20} />
                      <p>This document has no content yet.</p>
                      <button className="dh-btn dh-btn-ghost dh-btn-sm" onClick={handleStartEdit}>
                        <Edit3 size={12} /> Add Content
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: Metadata + AI ── */}
        {selectedDoc && (
          <div className="dh-right">
            {/* Metadata */}
            <div className="dh-meta-section">
              <div className="dh-meta-header">
                <Hash size={12} />
                <span>Metadata</span>
              </div>
              <div className="dh-meta-grid">
                <div className="dh-meta-row">
                  <span className="dh-meta-label">Type</span>
                  <span className="dh-meta-value" style={{ color: DOC_TYPE_COLORS[selectedDoc.doc_type] || '#6B7280' }}>
                    {DOC_TYPE_LABELS[selectedDoc.doc_type] || selectedDoc.doc_type}
                  </span>
                </div>
                <div className="dh-meta-row">
                  <span className="dh-meta-label">Venture</span>
                  <span className="dh-meta-value" style={{ color: getVentureInfo(selectedDoc.venture_id).color }}>
                    {getVentureInfo(selectedDoc.venture_id).name}
                  </span>
                </div>
                <div className="dh-meta-row">
                  <span className="dh-meta-label">Created</span>
                  <span className="dh-meta-value">{formatDate(selectedDoc.created_at)}</span>
                </div>
                <div className="dh-meta-row">
                  <span className="dh-meta-label">Updated</span>
                  <span className="dh-meta-value">{formatDate(selectedDoc.updated_at)}</span>
                </div>
                <div className="dh-meta-row">
                  <span className="dh-meta-label">ID</span>
                  <span className="dh-meta-value dh-meta-id">{selectedDoc.id.slice(0, 8)}...</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {selectedDoc.tags && selectedDoc.tags.length > 0 && (
              <div className="dh-meta-section">
                <div className="dh-meta-header">
                  <Tag size={12} />
                  <span>Tags</span>
                </div>
                <div className="dh-tags">
                  {selectedDoc.tags.map(tag => (
                    <span key={tag} className="dh-tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Ask AI about this doc */}
            <div className="dh-meta-section">
              <div className="dh-meta-header">
                <Brain size={12} />
                <span>Ask Aegis</span>
              </div>
              <div className="dh-ai-input-wrap">
                <input
                  className="dh-ai-input"
                  value={aiQuery}
                  onChange={e => setAiQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAskAI()}
                  placeholder="Ask about this doc..."
                  disabled={aiAsking}
                />
                <button
                  className="dh-ai-send"
                  onClick={handleAskAI}
                  disabled={!aiQuery.trim() || aiAsking}
                >
                  {aiAsking ? <RefreshCw size={11} className="dh-spin" /> : <Brain size={11} />}
                </button>
              </div>
              {aiAnswer && (
                <div className="dh-ai-answer">
                  <Markdown content={aiAnswer} />
                </div>
              )}
            </div>

            {/* Related Documents */}
            {relatedDocs.length > 0 && (
              <div className="dh-meta-section">
                <div className="dh-meta-header">
                  <ExternalLink size={12} />
                  <span>Related ({relatedDocs.length})</span>
                </div>
                <div className="dh-related-list">
                  {relatedDocs.map(rd => (
                    <button
                      key={rd.id}
                      className="dh-related-item"
                      onClick={() => handleSelectDoc(rd)}
                    >
                      <FileText size={11} />
                      <span className="dh-related-title">{rd.title}</span>
                      <span className="dh-related-type" style={{ color: DOC_TYPE_COLORS[rd.doc_type] || '#6B7280' }}>
                        {rd.doc_type}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Version History Placeholder */}
            <div className="dh-meta-section">
              <div className="dh-meta-header">
                <History size={12} />
                <span>Version History</span>
              </div>
              <div className="dh-version-placeholder">
                <AlertCircle size={12} />
                <span>Version tracking coming soon</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── STYLES ── */}
      <style>{`
        /* ── Layout Shell ── */
        .dh { height: 100%; display: flex; flex-direction: column; overflow: hidden; background: var(--bg-deep); }

        /* ── Top Bar ── */
        .dh-topbar {
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          padding: 10px 20px; border-bottom: 1px solid var(--border); flex-shrink: 0;
          background: rgba(11,17,33,0.8); backdrop-filter: blur(12px);
        }
        .dh-topbar-left { display: flex; align-items: center; gap: 8px; color: var(--cyan); flex-shrink: 0; }
        .dh-topbar-title { font-family: var(--font-display); font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin: 0; }
        .dh-topbar-count {
          font-size: 10px; font-family: var(--font-mono); color: var(--text-muted);
          background: var(--bg-card); border: 1px solid var(--border); padding: 1px 8px; border-radius: var(--radius-full);
        }
        .dh-topbar-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

        /* ── Buttons ── */
        .dh-btn {
          display: inline-flex; align-items: center; gap: 4px; padding: 5px 12px;
          border-radius: var(--radius-sm); font-size: 11px; font-weight: 500;
          transition: all 0.15s; white-space: nowrap; flex-shrink: 0; border: none; cursor: pointer;
        }
        .dh-btn-primary {
          background: var(--cyan); color: var(--bg-deep); font-weight: 600;
        }
        .dh-btn-primary:hover:not(:disabled) { opacity: 0.85; }
        .dh-btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }
        .dh-btn-ghost {
          background: var(--bg-card); border: 1px solid var(--border); color: var(--text-secondary);
        }
        .dh-btn-ghost:hover { border-color: var(--border-active); color: var(--text-primary); background: var(--bg-elevated); }
        .dh-btn-icon {
          width: 30px; height: 30px; padding: 0; display: flex; align-items: center; justify-content: center;
          background: transparent; border: 1px solid var(--border); border-radius: var(--radius-sm);
          color: var(--text-muted); transition: all 0.15s;
        }
        .dh-btn-icon:hover { border-color: var(--border-active); color: var(--text-primary); background: var(--bg-card); }
        .dh-btn-sm { padding: 3px 10px; font-size: 10px; }
        .dh-btn-tiny { width: 24px; height: 24px; }

        /* ── Inputs ── */
        .dh-input {
          width: 100%; padding: 8px 12px; background: var(--bg-input); border: 1px solid var(--border);
          border-radius: var(--radius-sm); color: var(--text-primary); font-size: 13px;
          font-family: var(--font-sans); outline: none; transition: border-color 0.15s;
        }
        .dh-input:focus { border-color: var(--border-active); }
        .dh-input::placeholder { color: var(--text-muted); }

        .dh-select {
          padding: 6px 10px; background: var(--bg-input); border: 1px solid var(--border);
          border-radius: var(--radius-sm); color: var(--text-secondary); font-size: 11px;
          font-family: var(--font-sans); appearance: auto; outline: none; cursor: pointer;
        }
        .dh-select:focus { border-color: var(--border-active); }
        .dh-select-sm { padding: 4px 8px; font-size: 10px; }

        .dh-textarea {
          width: 100%; padding: 10px 12px; background: var(--bg-input); border: 1px solid var(--border);
          border-radius: var(--radius-sm); color: var(--text-primary); font-size: 12px;
          font-family: var(--font-mono); line-height: 1.6; resize: vertical; outline: none; transition: border-color 0.15s;
        }
        .dh-textarea:focus { border-color: var(--border-active); }
        .dh-textarea::placeholder { color: var(--text-muted); }

        /* ── Create Form Overlay ── */
        .dh-create-overlay {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 50;
          background: rgba(2,4,8,0.7); backdrop-filter: blur(8px);
          display: flex; align-items: flex-start; justify-content: center; padding-top: 80px;
        }
        .dh-create-form {
          width: 580px; max-width: 90%; display: flex; flex-direction: column; gap: 10px; padding: 18px;
          background: rgba(11,17,33,0.95); border: 1px solid rgba(255,255,255,0.06);
          border-radius: var(--radius-lg); backdrop-filter: blur(12px);
        }
        .dh-create-header {
          display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600;
          color: var(--text-primary); font-family: var(--font-display); padding-bottom: 4px;
          border-bottom: 1px solid var(--border);
        }
        .dh-create-close { margin-left: auto; }
        .dh-create-selects { display: flex; gap: 8px; }
        .dh-create-actions { display: flex; gap: 8px; padding-top: 4px; }

        /* ── Three-Panel Body ── */
        .dh-body { flex: 1; display: flex; overflow: hidden; }

        /* ── LEFT PANEL ── */
        .dh-left {
          width: 280px; flex-shrink: 0; display: flex; flex-direction: column;
          border-right: 1px solid var(--border); background: rgba(11,17,33,0.5);
          overflow: hidden;
        }
        .dh-left-header {
          display: flex; align-items: center; gap: 6px; padding: 10px 16px;
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
          color: var(--text-muted); border-bottom: 1px solid var(--border); flex-shrink: 0;
        }

        .dh-tree { flex: 1; overflow-y: auto; padding: 6px 8px; }
        .dh-tree-item {
          display: flex; align-items: center; gap: 6px; width: 100%;
          padding: 6px 10px; border-radius: var(--radius-sm);
          background: transparent; border: 1px solid transparent; color: var(--text-secondary);
          font-size: 12px; cursor: pointer; transition: all 0.12s; text-align: left;
        }
        .dh-tree-item:hover { background: var(--bg-card); color: var(--text-primary); }
        .dh-tree-item.active {
          background: rgba(0,240,255,0.06); border-color: rgba(0,240,255,0.15);
          color: var(--cyan); font-weight: 500;
        }
        .dh-tree-item.child { padding-left: 28px; }
        .dh-tree-icon { flex-shrink: 0; color: var(--text-muted); display: flex; align-items: center; }
        .dh-tree-item.active .dh-tree-icon { color: var(--cyan); }
        .dh-tree-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dh-tree-count {
          font-size: 9px; font-family: var(--font-mono); color: var(--text-muted);
          background: var(--bg-card); padding: 0 5px; border-radius: var(--radius-full);
          flex-shrink: 0; min-width: 18px; text-align: center;
        }
        .dh-tree-children { margin-top: 1px; }
        .dh-tree-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        /* ── CENTER PANEL ── */
        .dh-center { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }

        .dh-filterbar {
          display: flex; align-items: center; gap: 8px; padding: 8px 16px;
          border-bottom: 1px solid var(--border); flex-shrink: 0; flex-wrap: wrap;
          background: rgba(11,17,33,0.4);
        }
        .dh-search-wrap {
          display: flex; align-items: center; gap: 6px; flex: 1; min-width: 160px; max-width: 280px;
          padding: 4px 10px; background: var(--bg-input); border: 1px solid var(--border);
          border-radius: var(--radius-sm); transition: border-color 0.15s;
        }
        .dh-search-wrap:focus-within { border-color: var(--border-active); }
        .dh-search-wrap svg { color: var(--text-muted); flex-shrink: 0; }
        .dh-search-input {
          flex: 1; background: transparent; border: none; color: var(--text-primary);
          font-size: 11px; outline: none; min-width: 0;
        }
        .dh-search-input::placeholder { color: var(--text-muted); }
        .dh-search-clear {
          display: flex; align-items: center; justify-content: center; width: 16px; height: 16px;
          border-radius: 50%; color: var(--text-muted); transition: all 0.12s;
          background: transparent; border: none; cursor: pointer; flex-shrink: 0;
        }
        .dh-search-clear:hover { color: var(--text-primary); background: var(--bg-card); }
        .dh-sort-group { display: flex; align-items: center; gap: 2px; }
        .dh-filter-count { font-size: 10px; font-family: var(--font-mono); color: var(--text-muted); margin-left: auto; }

        /* ── Center Split ── */
        .dh-center-split { flex: 1; display: flex; overflow: hidden; }

        /* ── Document List ── */
        .dh-doclist {
          width: 100%; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 4px;
          transition: width 0.2s;
        }
        .dh-doclist-narrow { width: 340px; min-width: 340px; max-width: 340px; border-right: 1px solid var(--border); }

        .dh-doc-card {
          padding: 10px 12px; background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-sm); cursor: pointer; transition: all 0.12s;
          display: flex; flex-direction: column; gap: 5px;
        }
        .dh-doc-card:hover { border-color: var(--border-active); background: var(--bg-elevated); }
        .dh-doc-card.active {
          border-color: rgba(0,240,255,0.3); background: rgba(0,240,255,0.04);
          box-shadow: inset 2px 0 0 var(--cyan);
        }
        .dh-doc-card-top { display: flex; align-items: center; gap: 8px; }
        .dh-doc-card-icon { color: var(--text-muted); flex-shrink: 0; }
        .dh-doc-card.active .dh-doc-card-icon { color: var(--cyan); }
        .dh-doc-card-title {
          flex: 1; font-size: 12px; font-weight: 600; color: var(--text-primary);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .dh-doc-card-del {
          opacity: 0; color: var(--text-muted); padding: 3px; border-radius: 3px;
          transition: all 0.12s; flex-shrink: 0; background: transparent; border: none; cursor: pointer;
        }
        .dh-doc-card:hover .dh-doc-card-del { opacity: 1; }
        .dh-doc-card-del:hover { color: var(--error); background: rgba(239,68,68,0.1); }

        .dh-doc-card-badges { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .dh-badge {
          font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;
          padding: 1px 6px; border-radius: var(--radius-full); border: 1px solid;
          white-space: nowrap;
        }
        .dh-doc-card-time {
          display: flex; align-items: center; gap: 3px; font-size: 9px; font-family: var(--font-mono);
          color: var(--text-muted); margin-left: auto; flex-shrink: 0;
        }
        .dh-doc-card-snippet {
          font-size: 11px; color: var(--text-muted); line-height: 1.4;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden; margin: 0;
        }

        /* ── Viewer / Editor ── */
        .dh-viewer {
          flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0;
          border-left: 1px solid var(--border);
        }
        .dh-viewer-header {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 10px 16px; border-bottom: 1px solid var(--border); flex-shrink: 0;
          background: rgba(11,17,33,0.4);
        }
        .dh-viewer-title {
          font-family: var(--font-display); font-size: 1rem; font-weight: 700;
          color: var(--text-primary); margin: 0; flex: 1; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }
        .dh-viewer-title-edit {
          flex: 1; background: var(--bg-input); border: 1px solid var(--border-active);
          border-radius: var(--radius-sm); color: var(--text-primary); font-size: 14px;
          font-family: var(--font-display); font-weight: 700; padding: 4px 10px; outline: none;
        }
        .dh-viewer-actions { display: flex; gap: 6px; flex-shrink: 0; }
        .dh-viewer-body { flex: 1; overflow-y: auto; }
        .dh-viewer-content { padding: 16px 20px; }

        .dh-editor-textarea {
          width: 100%; height: 100%; padding: 16px 20px; background: var(--bg-input);
          border: none; color: var(--text-primary); font-size: 13px; font-family: var(--font-mono);
          line-height: 1.7; resize: none; outline: none;
        }
        .dh-editor-textarea::placeholder { color: var(--text-muted); }

        .dh-empty-content {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          padding: 40px; color: var(--text-muted); text-align: center;
        }
        .dh-empty-content p { font-size: 12px; margin: 0; }

        /* ── RIGHT PANEL ── */
        .dh-right {
          width: 300px; flex-shrink: 0; display: flex; flex-direction: column;
          border-left: 1px solid var(--border); overflow-y: auto;
          background: rgba(11,17,33,0.5);
        }

        .dh-meta-section {
          padding: 12px 14px; border-bottom: 1px solid var(--border);
        }
        .dh-meta-header {
          display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-muted);
          margin-bottom: 10px;
        }
        .dh-meta-grid { display: flex; flex-direction: column; gap: 7px; }
        .dh-meta-row { display: flex; align-items: center; justify-content: space-between; }
        .dh-meta-label { font-size: 10px; color: var(--text-muted); }
        .dh-meta-value { font-size: 11px; color: var(--text-secondary); font-weight: 500; text-align: right; }
        .dh-meta-id { font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); }

        /* Tags */
        .dh-tags { display: flex; flex-wrap: wrap; gap: 4px; }
        .dh-tag {
          font-size: 9px; padding: 2px 8px; border-radius: var(--radius-full);
          background: rgba(139,92,246,0.1); color: var(--purple); border: 1px solid rgba(139,92,246,0.2);
          font-weight: 500;
        }

        /* AI */
        .dh-ai-input-wrap {
          display: flex; align-items: center; gap: 6px; padding: 4px 8px;
          background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-sm);
          transition: border-color 0.15s;
        }
        .dh-ai-input-wrap:focus-within { border-color: var(--border-active); }
        .dh-ai-input {
          flex: 1; background: transparent; border: none; color: var(--text-primary);
          font-size: 11px; outline: none; min-width: 0;
        }
        .dh-ai-input::placeholder { color: var(--text-muted); }
        .dh-ai-send {
          width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
          border-radius: var(--radius-sm); background: var(--purple); color: #fff;
          flex-shrink: 0; transition: opacity 0.15s; border: none; cursor: pointer;
        }
        .dh-ai-send:hover:not(:disabled) { opacity: 0.85; }
        .dh-ai-send:disabled { opacity: 0.3; cursor: not-allowed; }
        .dh-ai-answer {
          margin-top: 8px; padding: 10px; background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-sm); max-height: 200px; overflow-y: auto;
        }

        /* Related */
        .dh-related-list { display: flex; flex-direction: column; gap: 3px; }
        .dh-related-item {
          display: flex; align-items: center; gap: 6px; padding: 5px 8px;
          border-radius: var(--radius-sm); background: transparent; border: none;
          color: var(--text-secondary); font-size: 11px; cursor: pointer; transition: all 0.12s;
          text-align: left; width: 100%;
        }
        .dh-related-item:hover { background: var(--bg-card); color: var(--text-primary); }
        .dh-related-title { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dh-related-type { font-size: 9px; font-weight: 600; text-transform: uppercase; flex-shrink: 0; }

        /* Version History */
        .dh-version-placeholder {
          display: flex; align-items: center; gap: 6px; padding: 8px;
          background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm);
          font-size: 10px; color: var(--text-muted);
        }

        /* ── States ── */
        .dh-loading {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 32px; color: var(--text-muted); font-size: 12px;
        }
        .dh-empty {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          padding: 40px 20px; color: var(--text-muted); text-align: center;
        }
        .dh-empty p { font-size: 12px; margin: 0; }

        /* ── Utilities ── */
        @keyframes dh-spin-anim { to { transform: rotate(360deg); } }
        .dh-spin { animation: dh-spin-anim 1s linear infinite; }

        .glass {
          background: rgba(11,17,33,0.8); backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.06);
        }

        /* ── Scrollbar ── */
        .dh-tree::-webkit-scrollbar,
        .dh-doclist::-webkit-scrollbar,
        .dh-viewer-body::-webkit-scrollbar,
        .dh-right::-webkit-scrollbar,
        .dh-ai-answer::-webkit-scrollbar {
          width: 4px;
        }
        .dh-tree::-webkit-scrollbar-track,
        .dh-doclist::-webkit-scrollbar-track,
        .dh-viewer-body::-webkit-scrollbar-track,
        .dh-right::-webkit-scrollbar-track,
        .dh-ai-answer::-webkit-scrollbar-track {
          background: transparent;
        }
        .dh-tree::-webkit-scrollbar-thumb,
        .dh-doclist::-webkit-scrollbar-thumb,
        .dh-viewer-body::-webkit-scrollbar-thumb,
        .dh-right::-webkit-scrollbar-thumb,
        .dh-ai-answer::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.06); border-radius: 2px;
        }
        .dh-tree::-webkit-scrollbar-thumb:hover,
        .dh-doclist::-webkit-scrollbar-thumb:hover,
        .dh-viewer-body::-webkit-scrollbar-thumb:hover,
        .dh-right::-webkit-scrollbar-thumb:hover,
        .dh-ai-answer::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.12);
        }
      `}</style>
    </div>
  );
}
