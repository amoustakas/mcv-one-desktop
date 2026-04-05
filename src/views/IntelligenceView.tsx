import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Plus, Search, FileText, Send, Loader2, Trash2, BookOpen, Database, Sparkles, Filter } from 'lucide-react';
import { PageShell, PageHeader, Button, EmptyState, KpiCard, GridLayout, GlassCard, Badge } from '../components/ui';
import { timeAgo } from '../lib/utils';
import { useNavigation } from '../stores/navigation';
import Markdown from '../components/Markdown';
import { apiPost } from '../lib/api/client';
import { staggerContainer, fadeInUp } from '../lib/animations';

interface Doc {
  id: string;
  title: string;
  doc_type: string;
  venture_id: string;
  created_at: string;
  updated_at: string;
}

const DOC_TYPE_COLORS: Record<string, string> = {
  architecture: '#00F0FF',
  'technical-spec': '#3B82F6',
  overview: '#8B5CF6',
  'status-report': '#10B981',
  tokenomics: '#F59E0B',
  note: '#6B7280',
  'drive-import': '#4285F4',
};

const DOC_TYPE_ICONS: Record<string, typeof FileText> = {
  architecture: Database,
  'technical-spec': FileText,
  overview: BookOpen,
  'status-report': Sparkles,
  tokenomics: Database,
  note: FileText,
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

  // Stats
  const typeCounts = docs.reduce<Record<string, number>>((acc, d) => { acc[d.doc_type] = (acc[d.doc_type] || 0) + 1; return acc; }, {});
  const ventureCount = new Set(docs.map(d => d.venture_id)).size;

  return (
    <PageShell>
      <PageHeader icon={<Brain size={20} />} title="Intelligence Hub" count={docs.length} loading={loading} onRefresh={loadDocs}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="intel-filter-wrap">
            <Filter size={11} />
            <select className="intel-filter" value={filterVenture} onChange={(e) => setFilterVenture(e.target.value)}>
              <option value="">All Ventures</option>
              <option value="mcv">MCV One</option>
              <option value="betedge">BetEdge AI</option>
              <option value="futurestate">FutureState</option>
              <option value="warforge">WarForge</option>
              <option value="edgeiq">EdgeIQ Markets</option>
              <option value="arqlabs">ARQ Labs</option>
            </select>
          </div>
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowAdd(!showAdd)}>Add Doc</Button>
        </div>
      </PageHeader>

      <div className="intel-body">
        {/* KPI Stats */}
        <motion.div variants={staggerContainer} initial="hidden" animate="show">
          <GridLayout cols={4} gap="md">
            <motion.div variants={fadeInUp}>
              <KpiCard icon={<FileText size={16} />} title="Total Documents" value={String(docs.length)} />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <KpiCard icon={<Database size={16} />} title="Ventures" value={String(ventureCount)} />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <KpiCard icon={<BookOpen size={16} />} title="Specs & Arch" value={String((typeCounts['architecture'] || 0) + (typeCounts['technical-spec'] || 0))} />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <KpiCard icon={<Sparkles size={16} />} title="AI Queries" value="—" />
            </motion.div>
          </GridLayout>
        </motion.div>

        {/* RAG Ask Panel */}
        <GlassCard className="intel-ask-card">
          <div className="intel-ask-gradient" />
          <div className="intel-ask-header">
            <Brain size={14} style={{ color: 'var(--cyan)' }} />
            <span className="intel-ask-title">Ask Your Knowledge Base</span>
          </div>
          <div className="intel-ask-input">
            <Search size={15} style={{ color: 'var(--text-muted)' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder="Ask a question across your documents..."
              disabled={asking}
            />
            <button className="intel-ask-btn" onClick={handleAsk} disabled={!query.trim() || asking}>
              {asking ? <Loader2 size={14} className="mcv-spin" /> : <Send size={14} />}
            </button>
          </div>
          <AnimatePresence>
            {answer && (
              <motion.div
                className="intel-answer"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Markdown content={answer} />
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* Add doc form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              className="intel-add-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
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
                <Button variant="primary" size="sm" onClick={handleCreate} disabled={!newTitle.trim()}>Save Document</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Document list */}
        <div className="intel-section-header">
          <span className="intel-section-label">Documents</span>
          <Badge size="sm">{docs.length}</Badge>
        </div>
        <motion.div className="intel-docs" variants={staggerContainer} initial="hidden" animate="show">
          {docs.map((d) => {
            const TypeIcon = DOC_TYPE_ICONS[d.doc_type] || FileText;
            const typeColor = DOC_TYPE_COLORS[d.doc_type] || '#6B7280';
            return (
              <motion.div key={d.id} className="intel-doc" variants={fadeInUp}>
                <div className="intel-doc-icon" style={{ background: `${typeColor}15`, color: typeColor }}>
                  <TypeIcon size={14} />
                </div>
                <div className="intel-doc-info">
                  <span className="intel-doc-title">{d.title}</span>
                  <div className="intel-doc-meta">
                    <span className="intel-doc-type-badge" style={{ background: `${typeColor}18`, color: typeColor, borderColor: `${typeColor}30` }}>
                      {d.doc_type}
                    </span>
                    <span className="intel-doc-venture">{d.venture_id}</span>
                    <span className="intel-doc-time">{timeAgo(d.updated_at)}</span>
                  </div>
                </div>
                <button className="intel-doc-del" onClick={() => handleDelete(d.id)}>
                  <Trash2 size={12} />
                </button>
              </motion.div>
            );
          })}
          {docs.length === 0 && !loading && (
            <EmptyState
              icon={<Brain size={24} />}
              title="No documents yet"
              description="Add docs or use /note in chat."
            />
          )}
        </motion.div>
      </div>

      <style>{`
        .intel-body { flex:1; overflow-y:auto; padding:16px 20px; display:flex; flex-direction:column; gap:16px; }

        /* Filter */
        .intel-filter-wrap { display:flex; align-items:center; gap:6px; padding:5px 10px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-muted); }
        .intel-filter { background:transparent; border:none; color:var(--text-secondary); font-size:11px; outline:none; appearance:auto; cursor:pointer; }

        /* Ask Card */
        .intel-ask-card { position:relative; overflow:hidden; }
        .intel-ask-gradient { position:absolute; top:0; left:20%; right:20%; height:1px; background:linear-gradient(to right, transparent, var(--cyan), transparent); }
        .intel-ask-header { display:flex; align-items:center; gap:8px; margin-bottom:12px; }
        .intel-ask-title { font-size:13px; font-weight:600; color:var(--text-primary); }
        .intel-ask-input { display:flex; align-items:center; gap:8px; padding:10px 14px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-md); transition:all 0.2s; }
        .intel-ask-input:focus-within { border-color:var(--cyan); box-shadow:0 0 0 3px rgba(0,240,255,0.08); }
        .intel-ask-input input { flex:1; background:transparent; border:none; color:var(--text-primary); font-size:13px; outline:none; }
        .intel-ask-input input::placeholder { color:var(--text-muted); }
        .intel-ask-btn { width:32px; height:32px; display:flex; align-items:center; justify-content:center; border-radius:var(--radius-sm); background:var(--cyan); color:var(--bg-deep); flex-shrink:0; transition:all 0.15s; cursor:pointer; border:none; }
        .intel-ask-btn:hover:not(:disabled) { box-shadow:0 0 12px var(--cyan-glow); transform:scale(1.05); }
        .intel-ask-btn:disabled { opacity:0.3; cursor:not-allowed; }
        .intel-answer { margin-top:12px; padding:16px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:var(--radius-md); border-left:3px solid var(--cyan); }

        /* Add form */
        .intel-add-form { padding:16px; background:var(--bg-card); border:1px solid var(--cyan); border-radius:var(--radius-md); display:flex; flex-direction:column; gap:10px; box-shadow:0 0 20px rgba(0,240,255,0.05); overflow:hidden; }
        .intel-add-row { display:flex; gap:8px; }
        .intel-add-input { flex:1; padding:8px 12px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-primary); font-size:12px; transition:all 0.15s; }
        .intel-add-input:focus { border-color:var(--cyan); box-shadow:0 0 0 2px rgba(0,240,255,0.1); outline:none; }
        .intel-add-select { padding:8px 10px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-secondary); font-size:11px; appearance:auto; }
        .intel-add-content { padding:10px 12px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-primary); font-size:12px; resize:vertical; font-family:var(--font-sans); transition:all 0.15s; }
        .intel-add-content:focus { border-color:var(--cyan); box-shadow:0 0 0 2px rgba(0,240,255,0.1); outline:none; }
        .intel-add-actions { display:flex; gap:8px; }

        /* Section header */
        .intel-section-header { display:flex; align-items:center; justify-content:space-between; padding:0 2px; }
        .intel-section-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1.2px; color:var(--text-muted); }

        /* Docs list */
        .intel-docs { display:flex; flex-direction:column; gap:4px; }
        .intel-doc { display:flex; align-items:center; gap:12px; padding:12px 14px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); transition:all 0.2s; cursor:pointer; }
        .intel-doc:hover { border-color:var(--border-active); transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,0.2); }
        .intel-doc-icon { width:32px; height:32px; border-radius:var(--radius-sm); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .intel-doc-info { flex:1; min-width:0; }
        .intel-doc-title { font-size:13px; font-weight:500; color:var(--text-primary); display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .intel-doc-meta { display:flex; align-items:center; gap:8px; margin-top:4px; }
        .intel-doc-type-badge { font-size:9px; font-weight:600; text-transform:uppercase; letter-spacing:0.3px; padding:1px 7px; border-radius:var(--radius-full); border:1px solid; }
        .intel-doc-venture { font-size:10px; color:var(--text-muted); font-family:var(--font-mono); }
        .intel-doc-time { font-size:10px; color:var(--text-muted); }
        .intel-doc-del { opacity:0; color:var(--text-muted); padding:6px; border-radius:var(--radius-sm); transition:all 0.15s; flex-shrink:0; cursor:pointer; background:none; border:none; }
        .intel-doc:hover .intel-doc-del { opacity:1; }
        .intel-doc-del:hover { color:var(--error); background:rgba(239,68,68,0.1); }
      `}</style>
    </PageShell>
  );
}
