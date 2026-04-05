import { useState, useEffect } from 'react';
import { Brain, Plus, Search, FileText, Send, Loader2, Trash2 } from 'lucide-react';
import { useNavigation } from '../stores/navigation';
import Markdown from '../components/Markdown';
import { apiPost } from '../lib/api/client';

interface Doc {
  id: string;
  title: string;
  doc_type: string;
  venture_id: string;
  created_at: string;
  updated_at: string;
}

function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const DOC_TYPE_COLORS: Record<string, string> = {
  architecture: '#00F0FF',
  'technical-spec': '#3B82F6',
  overview: '#8B5CF6',
  'status-report': '#10B981',
  tokenomics: '#F59E0B',
  note: '#6B7280',
};

export default function IntelligenceView() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const [filterVenture, setFilterVenture] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('note');
  const [newVenture, setNewVenture] = useState('mcv');
  const { mode, activeVenture } = useNavigation();

  async function loadDocs() {
    setLoading(true);
    const v = filterVenture || (mode === 'venture' ? activeVenture : '') || '';
    const body: Record<string, string> = { action: 'list' };
    if (v) body.venture_id = v;
    const data = await apiPost<{ documents?: Doc[] }>('/api/docs', body);
    setDocs(data.documents || []);
    setLoading(false);
  }

  useEffect(() => { loadDocs(); }, [filterVenture, activeVenture, mode]);

  async function handleAsk() {
    if (!query.trim() || asking) return;
    setAsking(true);
    setAnswer('');
    try {
      const data = await apiPost<{ answer?: string; sources?: { title: string }[] }>('/api/docs', { action: 'query', question: query, venture_id: filterVenture || undefined });
      let md = data.answer || 'No answer generated.';
      if (data.sources?.length) {
        md += `\n\n---\n**Sources:** ${data.sources.map((s: { title: string }) => s.title).join(' · ')}`;
      }
      setAnswer(md);
    } catch (err) {
      setAnswer(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setAsking(false);
    }
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    await apiPost('/api/docs', { action: 'create', title: newTitle, content: newContent, doc_type: newType, venture_id: newVenture });
    setNewTitle(''); setNewContent(''); setShowAdd(false);
    loadDocs();
  }

  async function handleDelete(id: string) {
    await apiPost('/api/docs', { action: 'delete', id });
    setDocs((d) => d.filter((doc) => doc.id !== id));
  }

  return (
    <div className="intel">
      <div className="intel-header">
        <div className="intel-title-row">
          <Brain size={20} />
          <h1 className="intel-title">Intelligence Hub</h1>
          <span className="intel-count">{docs.length} docs</span>
        </div>
        <div className="intel-actions">
          <select className="intel-filter" value={filterVenture} onChange={(e) => setFilterVenture(e.target.value)}>
            <option value="">All Ventures</option>
            <option value="mcv">MCV One</option>
            <option value="betedge">BetEdge AI</option>
            <option value="futurestate">FutureState</option>
            <option value="warforge">WarForge</option>
            <option value="edgeiq">EdgeIQ Markets</option>
            <option value="arqlabs">ARQ Labs</option>
          </select>
          <button className="intel-add-btn" onClick={() => setShowAdd(!showAdd)}>
            <Plus size={14} />
            <span>Add Doc</span>
          </button>
        </div>
      </div>

      <div className="intel-body">
        {/* Ask panel */}
        <div className="intel-ask">
          <div className="intel-ask-input">
            <Search size={15} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder="Ask a question across your documents..."
              disabled={asking}
            />
            <button className="intel-ask-btn" onClick={handleAsk} disabled={!query.trim() || asking}>
              {asking ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
            </button>
          </div>
          {answer && (
            <div className="intel-answer">
              <Markdown content={answer} />
            </div>
          )}
        </div>

        {/* Add doc form */}
        {showAdd && (
          <div className="intel-add-form">
            <div className="intel-add-row">
              <input className="intel-add-input" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Document title" />
              <select className="intel-add-select" value={newVenture} onChange={(e) => setNewVenture(e.target.value)}>
                <option value="mcv">MCV One</option>
                <option value="betedge">BetEdge</option>
                <option value="futurestate">FutureState</option>
                <option value="warforge">WarForge</option>
                <option value="edgeiq">EdgeIQ</option>
                <option value="arqlabs">ARQ Labs</option>
              </select>
              <select className="intel-add-select" value={newType} onChange={(e) => setNewType(e.target.value)}>
                <option value="note">Note</option>
                <option value="architecture">Architecture</option>
                <option value="technical-spec">Technical Spec</option>
                <option value="overview">Overview</option>
                <option value="status-report">Status Report</option>
                <option value="tokenomics">Tokenomics</option>
              </select>
            </div>
            <textarea className="intel-add-content" value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Document content..." rows={4} />
            <div className="intel-add-actions">
              <button className="intel-save-btn" onClick={handleCreate} disabled={!newTitle.trim()}>Save Document</button>
              <button className="intel-cancel-btn" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Document list */}
        <div className="intel-docs">
          {docs.map((d) => (
            <div key={d.id} className="intel-doc">
              <div className="intel-doc-icon">
                <FileText size={14} />
              </div>
              <div className="intel-doc-info">
                <span className="intel-doc-title">{d.title}</span>
                <div className="intel-doc-meta">
                  <span className="intel-doc-type" style={{ color: DOC_TYPE_COLORS[d.doc_type] || '#6B7280' }}>{d.doc_type}</span>
                  <span className="intel-doc-sep">&middot;</span>
                  <span>{d.venture_id}</span>
                  <span className="intel-doc-sep">&middot;</span>
                  <span>{timeAgo(d.updated_at)}</span>
                </div>
              </div>
              <button className="intel-doc-del" onClick={() => handleDelete(d.id)}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {docs.length === 0 && !loading && (
            <div className="intel-empty">
              <Brain size={24} />
              <p>No documents yet. Add docs or use <code>/note</code> in chat.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .intel { height: 100%; display: flex; flex-direction: column; overflow: hidden; }

        .intel-header { padding: 16px 20px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0; display: flex; flex-direction: column; gap: 10px; }
        .intel-title-row { display: flex; align-items: center; gap: 8px; }
        .intel-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; }
        .intel-count { font-size: 10px; font-family: var(--font-mono); color: var(--text-muted); background: var(--bg-card); border: 1px solid var(--border); padding: 1px 8px; border-radius: var(--radius-full); }

        .intel-actions { display: flex; gap: 8px; }
        .intel-filter { padding: 5px 10px; background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary); font-size: 11px; appearance: auto; }
        .intel-add-btn { display: flex; align-items: center; gap: 4px; padding: 5px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--cyan); font-size: 11px; font-weight: 500; transition: all 0.15s; }
        .intel-add-btn:hover { background: var(--bg-elevated); border-color: var(--border-active); }

        .intel-body { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 16px; }

        /* Ask */
        .intel-ask { display: flex; flex-direction: column; gap: 10px; }
        .intel-ask-input { display: flex; align-items: center; gap: 8px; padding: 8px 14px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); transition: border-color 0.15s; }
        .intel-ask-input:focus-within { border-color: var(--border-active); }
        .intel-ask-input input { flex: 1; background: transparent; border: none; color: var(--text-primary); font-size: 13px; outline: none; }
        .intel-ask-input input::placeholder { color: var(--text-muted); }
        .intel-ask-btn { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); background: var(--cyan); color: var(--bg-deep); flex-shrink: 0; transition: all 0.15s; }
        .intel-ask-btn:hover:not(:disabled) { opacity: 0.85; }
        .intel-ask-btn:disabled { opacity: 0.3; }
        .intel-answer { padding: 14px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); }

        /* Add form */
        .intel-add-form { padding: 14px; background: var(--bg-card); border: 1px solid var(--border-active); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 8px; }
        .intel-add-row { display: flex; gap: 8px; }
        .intel-add-input { flex: 1; padding: 6px 10px; background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 12px; }
        .intel-add-input:focus { border-color: var(--border-active); outline: none; }
        .intel-add-select { padding: 6px 8px; background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary); font-size: 11px; appearance: auto; }
        .intel-add-content { padding: 8px 10px; background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 12px; resize: vertical; font-family: var(--font-sans); }
        .intel-add-content:focus { border-color: var(--border-active); outline: none; }
        .intel-add-actions { display: flex; gap: 8px; }
        .intel-save-btn { padding: 6px 16px; background: var(--cyan); color: var(--bg-deep); font-size: 11px; font-weight: 600; border-radius: var(--radius-sm); transition: opacity 0.15s; }
        .intel-save-btn:hover:not(:disabled) { opacity: 0.85; }
        .intel-save-btn:disabled { opacity: 0.3; }
        .intel-cancel-btn { padding: 6px 12px; color: var(--text-muted); font-size: 11px; border-radius: var(--radius-sm); transition: color 0.15s; }
        .intel-cancel-btn:hover { color: var(--text-primary); }

        /* Docs list */
        .intel-docs { display: flex; flex-direction: column; gap: 4px; }
        .intel-doc { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); transition: border-color 0.15s; }
        .intel-doc:hover { border-color: var(--border-active); }
        .intel-doc-icon { color: var(--text-muted); flex-shrink: 0; }
        .intel-doc-info { flex: 1; min-width: 0; }
        .intel-doc-title { font-size: 13px; font-weight: 500; color: var(--text-primary); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .intel-doc-meta { display: flex; align-items: center; gap: 6px; font-size: 10px; color: var(--text-muted); margin-top: 2px; }
        .intel-doc-type { font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
        .intel-doc-sep { opacity: 0.3; }
        .intel-doc-del { opacity: 0; color: var(--text-muted); padding: 4px; border-radius: 3px; transition: all 0.15s; flex-shrink: 0; }
        .intel-doc:hover .intel-doc-del { opacity: 1; }
        .intel-doc-del:hover { color: var(--error); background: rgba(239,68,68,0.1); }

        .intel-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px; color: var(--text-muted); text-align: center; }
        .intel-empty p { font-size: 12px; }
        .intel-empty code { background: var(--bg-card); padding: 1px 5px; border-radius: 3px; font-size: 11px; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
