import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, Search, FileText, Database, HardDrive, Sparkles,
  Loader2, Plus, Filter, ExternalLink,
  Layers, Network, Trash2, RefreshCw, BookOpen,
} from 'lucide-react';
import { PageShell, PageHeader, KpiCard, GridLayout, GlassCard, Button, Badge, Tabs, EmptyState, Input } from '../components/ui';
import { useNavigation } from '../stores/navigation';
import { useVentureScope, resolveVentureId } from '../lib/knowledge/venture-context';
import { staggerContainer, fadeInUp } from '../lib/animations';
import { useToast } from '../components/Toasts';
import { ventures } from '../lib/ventures';

// ---------------------------------------------------------------------------
// KnowledgeHubView — Unified knowledge + memory + context view
// Brings together Memory, Documents, Files, RAG, and Drive into one
// searchable, venture-compartmentalized hub.
// ---------------------------------------------------------------------------

interface SearchResults {
  memories?: unknown[];
  documents?: unknown[];
  files?: unknown[];
  rag?: unknown[];
  drive?: unknown[];
}

interface VentureKnowledgeStats {
  docs: number;
  memories: number;
  corpora: number;
  files: number;
  ventureId: string;
}

export default function KnowledgeHubView() {
  const { addToast } = useToast();
  const { mode, activeVenture } = useNavigation();
  const scope = useVentureScope();
  const ventureId = resolveVentureId(scope);

  const [tab, setTab] = useState<'search' | 'memory' | 'documents' | 'files' | 'rag' | 'ingest' | 'overview'>('overview');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResults>({});
  const [searchMode, setSearchMode] = useState<'unified' | 'synthesize'>('unified');
  const [synthAnswer, setSynthAnswer] = useState<{ answer: string; citations: Array<{ n: number; source: string }> } | null>(null);

  // Corpora tab state
  interface Corpus { corpus_id?: string; id?: string; corpus_name?: string; name?: string; venture_id?: string; file_count?: number; chunk_count?: number; last_indexed_at?: string | null }
  const [corpora, setCorpora] = useState<Corpus[]>([]);
  const [corporaLoading, setCorporaLoading] = useState(false);
  const [newCorpusName, setNewCorpusName] = useState('');
  const [ingestCorpusId, setIngestCorpusId] = useState<string>('');
  const [ingestText, setIngestText] = useState('');
  const [ingestingToCorpus, setIngestingToCorpus] = useState(false);

  // Overview stats per venture
  const [stats, setStats] = useState<VentureKnowledgeStats[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  // Ingest form state
  const [ingestTitle, setIngestTitle] = useState('');
  const [ingestContent, setIngestContent] = useState('');
  const [ingestTarget, setIngestTarget] = useState<'memory' | 'document' | 'rag'>('document');
  const [ingestVenture, setIngestVenture] = useState<string>(ventureId || 'mcv');
  const [ingesting, setIngesting] = useState(false);

  // Scope override (current venture vs all vs specific)
  const [scopeOverride, setScopeOverride] = useState<'current' | 'all' | string>(mode === 'venture' ? 'current' : 'all');

  const effectiveVentureId = scopeOverride === 'current'
    ? activeVenture || undefined
    : scopeOverride === 'all' ? undefined : scopeOverride;

  // Unified search (or synthesize when searchMode === 'synthesize')
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResults({});
    setSynthAnswer(null);

    // Synthesize mode: vector retrieval + Gemini answer with citations
    if (searchMode === 'synthesize') {
      try {
        const res = await fetch('/api/google-rag', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'synthesize', query, venture_id: effectiveVentureId, top_k: 8 }),
        });
        if (!res.ok) throw new Error(`Synthesize failed: ${res.status}`);
        const data = await res.json();
        setSynthAnswer({ answer: data.answer || '', citations: data.citations || [] });
        addToast({ type: 'success', message: `${(data.citations || []).length} citations` });
      } catch (err) {
        addToast({ type: 'error', message: err instanceof Error ? err.message : 'Synthesize failed' });
      } finally {
        setSearching(false);
      }
      return;
    }

    try {
      const res = await fetch('/api/kit-execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'knowledge_search',
          input: { query, venture_id: effectiveVentureId, limit: 10 },
        }),
      });
      // Fallback: manually call each endpoint in parallel (kit-execute may not be a route)
      if (!res.ok) {
        const [memRes, docsRes, ragRes, driveRes] = await Promise.allSettled([
          fetch(`/api/memory?action=list&q=${encodeURIComponent(query)}${effectiveVentureId ? `&ventureId=${effectiveVentureId}` : ''}`).then(r => r.ok ? r.json() : null),
          fetch('/api/docs', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'query', question: query, venture_id: effectiveVentureId }),
          }).then(r => r.ok ? r.json() : null),
          fetch('/api/google-rag', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'file_search', query, venture_id: effectiveVentureId }),
          }).then(r => r.ok ? r.json() : null),
          fetch(`/api/google-drive?action=search&q=${encodeURIComponent(query)}&maxResults=10`).then(r => r.ok ? r.json() : null),
        ]);
        setResults({
          memories: memRes.status === 'fulfilled' && memRes.value ? (memRes.value.memories || []) : [],
          documents: docsRes.status === 'fulfilled' && docsRes.value ? [docsRes.value] : [],
          rag: ragRes.status === 'fulfilled' && ragRes.value ? (ragRes.value.sources || []) : [],
          drive: driveRes.status === 'fulfilled' && driveRes.value ? (driveRes.value.files || []) : [],
        });
      } else {
        const data = await res.json();
        setResults(data.data || {});
      }
      addToast({ type: 'success', message: 'Search complete' });
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Search failed' });
    } finally {
      setSearching(false);
    }
  }, [query, effectiveVentureId, addToast]);

  // Ingest to knowledge base
  const handleIngest = useCallback(async () => {
    if (!ingestTitle.trim() || !ingestContent.trim()) return;
    setIngesting(true);
    try {
      if (ingestTarget === 'memory') {
        await fetch('/api/memory', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'upsert',
            key: ingestTitle.toLowerCase().replace(/\s+/g, '-'),
            value: ingestContent,
            type: 'project',
            venture_id: ingestVenture,
          }),
        });
      } else if (ingestTarget === 'rag') {
        await fetch('/api/google-rag', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_corpus',
            name: ingestTitle,
            description: ingestContent.slice(0, 200),
            venture_id: ingestVenture,
          }),
        });
      } else {
        await fetch('/api/docs', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            title: ingestTitle,
            content: ingestContent,
            doc_type: 'note',
            venture_id: ingestVenture,
          }),
        });
      }
      addToast({ type: 'success', message: `Ingested to ${ingestTarget}` });
      setIngestTitle('');
      setIngestContent('');
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Ingest failed' });
    } finally {
      setIngesting(false);
    }
  }, [ingestTitle, ingestContent, ingestTarget, ingestVenture, addToast]);

  // Load venture stats for overview
  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const ventureIds = ventures.map(v => v.id);
      const results = await Promise.all(
        ventureIds.map(async (vid) => {
          const [docs, memory] = await Promise.allSettled([
            fetch(`/api/docs?action=list&venture_id=${vid}`).then(r => r.ok ? r.json() : null),
            fetch(`/api/memory?action=list&ventureId=${vid}`).then(r => r.ok ? r.json() : null),
          ]);
          return {
            ventureId: vid,
            docs: docs.status === 'fulfilled' && docs.value ? (docs.value.documents?.length || 0) : 0,
            memories: memory.status === 'fulfilled' && memory.value ? (memory.value.memories?.length || 0) : 0,
            corpora: 0,
            files: 0,
          };
        }),
      );
      setStats(results);
    } catch {
      // Non-fatal
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'overview') loadStats();
  }, [tab, loadStats]);

  // ── Corpora management ──
  const loadCorpora = useCallback(async () => {
    setCorporaLoading(true);
    try {
      const res = await fetch('/api/google-rag', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_corpora', venture_id: effectiveVentureId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setCorpora(data.corpora || []);
    } catch (err) {
      console.error('[list_corpora]', err);
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Load failed' });
    } finally {
      setCorporaLoading(false);
    }
  }, [effectiveVentureId, addToast]);

  useEffect(() => { if (tab === 'rag') loadCorpora(); }, [tab, loadCorpora]);

  const handleCreateCorpus = useCallback(async () => {
    if (!newCorpusName.trim()) return;
    try {
      const res = await fetch('/api/google-rag', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_corpus', name: newCorpusName, venture_id: effectiveVentureId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      setNewCorpusName('');
      addToast({ type: 'success', message: 'Corpus created' });
      loadCorpora();
    } catch (err) {
      console.error('[create_corpus]', err);
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Create failed' });
    }
  }, [newCorpusName, effectiveVentureId, addToast, loadCorpora]);

  const handleDeleteCorpus = useCallback(async (corpusId: string) => {
    if (!confirm('Delete corpus and all its chunks?')) return;
    try {
      const res = await fetch('/api/google-rag', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_corpus', corpus_id: corpusId }),
      });
      if (!res.ok) throw new Error('Delete failed');
      addToast({ type: 'success', message: 'Corpus deleted' });
      loadCorpora();
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Delete failed' });
    }
  }, [addToast, loadCorpora]);

  const handleIngestToCorpus = useCallback(async () => {
    if (!ingestCorpusId || !ingestText.trim()) return;
    setIngestingToCorpus(true);
    try {
      const res = await fetch('/api/rag-ingest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ingest-text', text: ingestText,
          corpus_id: ingestCorpusId, venture_id: effectiveVentureId,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Ingest failed: ${res.status}`);
      }
      const data = await res.json();
      addToast({ type: 'success', message: `Embedded ${data.chunk_count} chunks` });
      setIngestText('');
      loadCorpora();
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Ingest failed' });
    } finally {
      setIngestingToCorpus(false);
    }
  }, [ingestCorpusId, ingestText, effectiveVentureId, addToast, loadCorpora]);

  const handleBackfill = useCallback(async (source: 'docs' | 'memory') => {
    try {
      addToast({ type: 'info', message: `Backfilling ${source}... this may take a minute` });
      const res = await fetch('/api/rag-ingest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: source === 'docs' ? 'backfill-docs' : 'backfill-memory',
          venture_id: effectiveVentureId,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      addToast({
        type: 'success',
        message: `Indexed ${body.indexed} ${source} \u2192 ${body.chunks} chunks (skipped ${body.skipped}, failed ${body.failed})`,
      });
    } catch (err) {
      console.error('[backfill]', err);
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Backfill failed' });
    }
  }, [effectiveVentureId, addToast]);

  const handleReindexCorpus = useCallback(async (corpusId: string) => {
    try {
      addToast({ type: 'info', message: 'Reindexing — this may take a moment...' });
      const res = await fetch('/api/rag-ingest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reindex-corpus', corpus_id: corpusId }),
      });
      if (!res.ok) throw new Error('Reindex failed');
      const data = await res.json();
      addToast({ type: 'success', message: `Reindexed ${data.files} files → ${data.chunks} chunks` });
      loadCorpora();
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Reindex failed' });
    }
  }, [addToast, loadCorpora]);

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'search', label: 'Unified Search' },
    { id: 'ingest', label: 'Ingest' },
    { id: 'memory', label: 'Memory' },
    { id: 'documents', label: 'Documents' },
    { id: 'rag', label: 'RAG Corpora' },
  ];

  const totalDocs = stats.reduce((sum, s) => sum + s.docs, 0);
  const totalMemories = stats.reduce((sum, s) => sum + s.memories, 0);

  return (
    <PageShell>
      <PageHeader title="Knowledge Hub" icon={<Brain size={20} />}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Filter size={12} style={{ color: 'var(--text-muted)' }} />
          <select
            value={scopeOverride}
            onChange={(e) => setScopeOverride(e.target.value)}
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: 12 }}
          >
            <option value="current">{mode === 'venture' ? `Current: ${activeVenture}` : 'Current (global)'}</option>
            <option value="all">All Ventures</option>
            {ventures.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
      </PageHeader>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ marginTop: 12 }}>
        <GridLayout cols={4} gap="md">
          <motion.div variants={fadeInUp}><KpiCard icon={<FileText size={16} />} title="Documents" value={String(totalDocs)} /></motion.div>
          <motion.div variants={fadeInUp}><KpiCard icon={<Database size={16} />} title="Memories" value={String(totalMemories)} /></motion.div>
          <motion.div variants={fadeInUp}><KpiCard icon={<Layers size={16} />} title="Ventures" value={String(stats.length)} /></motion.div>
          <motion.div variants={fadeInUp}><KpiCard icon={<Network size={16} />} title="Scope" value={effectiveVentureId || 'All'} /></motion.div>
        </GridLayout>
      </motion.div>

      <Tabs tabs={TABS} active={tab} onChange={(t) => setTab(t as typeof tab)} />

      <div style={{ padding: '16px 0' }}>
        {/* ══════════ Overview ══════════ */}
        {tab === 'overview' && (
          <GlassCard>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>Knowledge State by Venture</h3>
            {loadingStats ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
                <Loader2 size={14} className="mcv-spin" /> Loading venture stats...
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                {stats.map((s) => {
                  const v = ventures.find(vn => vn.id === s.ventureId);
                  return (
                    <div key={s.ventureId} style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 8, borderLeft: `3px solid ${v?.color || 'var(--cyan)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{v?.name || s.ventureId}</div>
                        <Badge>{s.docs + s.memories}</Badge>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                        <div style={{ color: 'var(--text-muted)' }}><FileText size={10} style={{ display: 'inline', marginRight: 4 }} />{s.docs} docs</div>
                        <div style={{ color: 'var(--text-muted)' }}><Database size={10} style={{ display: 'inline', marginRight: 4 }} />{s.memories} mems</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ marginTop: 16, padding: 12, background: 'rgba(0, 240, 255, 0.04)', borderRadius: 8, borderLeft: '3px solid var(--cyan)' }}>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                <strong>Venture Compartmentalization:</strong> All queries below automatically scope to your selected venture.
                Memory, Documents, Files, and RAG corpora are isolated per-venture. Use "All Ventures" to search globally.
              </p>
            </div>
          </GlassCard>
        )}

        {/* ══════════ Unified Search ══════════ */}
        {tab === 'search' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <GlassCard>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Search size={14} style={{ color: 'var(--cyan)' }} /> Search Across All Knowledge
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px' }}>
                {searchMode === 'synthesize'
                  ? <>Gemini-grounded answer with citations from indexed chunks. Scoped to: <strong style={{ color: 'var(--cyan)' }}>{effectiveVentureId || 'All Ventures'}</strong></>
                  : <>Searches Memory, Documents, Files, RAG, and Google Drive in parallel. Scoped to: <strong style={{ color: 'var(--cyan)' }}>{effectiveVentureId || 'All Ventures'}</strong></>}
              </p>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <button
                  onClick={() => setSearchMode('unified')}
                  style={{
                    padding: '4px 10px', fontSize: 11, border: `1px solid ${searchMode === 'unified' ? 'var(--cyan)' : 'var(--border)'}`,
                    background: searchMode === 'unified' ? 'rgba(0,240,255,0.1)' : 'transparent',
                    color: searchMode === 'unified' ? 'var(--cyan)' : 'var(--text-muted)',
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  }}>Unified</button>
                <button
                  onClick={() => setSearchMode('synthesize')}
                  style={{
                    padding: '4px 10px', fontSize: 11, border: `1px solid ${searchMode === 'synthesize' ? 'var(--purple)' : 'var(--border)'}`,
                    background: searchMode === 'synthesize' ? 'rgba(139,92,246,0.1)' : 'transparent',
                    color: searchMode === 'synthesize' ? 'var(--purple)' : 'var(--text-muted)',
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  }}>Synthesize (RAG)</button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Input
                  placeholder={searchMode === 'synthesize' ? 'Ask a question — I will cite sources...' : "Ask anything... e.g. 'Q2 revenue targets'"}
                  value={query}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={searching || !query.trim()}>
                  {searching ? <Loader2 size={14} className="mcv-spin" /> : <Search size={14} />} {searchMode === 'synthesize' ? 'Ask' : 'Search'}
                </Button>
              </div>
            </GlassCard>

            {synthAnswer && (
              <GlassCard>
                <h4 style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={12} style={{ color: 'var(--purple)' }} /> Answer
                </h4>
                <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                  {synthAnswer.answer}
                </div>
                {synthAnswer.citations.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Citations</div>
                    {synthAnswer.citations.map(c => (
                      <div key={c.n} style={{ fontSize: 12, padding: '4px 0', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--cyan)' }}>[{c.n}]</strong> {c.source}
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}

            {/* Results */}
            {Object.keys(results).length > 0 && (
              <>
                {(results.memories || []).length > 0 && (
                  <GlassCard>
                    <h4 style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Database size={12} style={{ color: 'var(--purple)' }} /> Memory ({(results.memories as unknown[]).length})
                    </h4>
                    {(results.memories as Record<string, unknown>[]).slice(0, 5).map((m, i) => (
                      <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{String(m.key)}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{JSON.stringify(m.value).slice(0, 150)}</div>
                      </div>
                    ))}
                  </GlassCard>
                )}

                {(results.documents || []).length > 0 && (
                  <GlassCard>
                    <h4 style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={12} style={{ color: 'var(--cyan)' }} /> Documents — AI Answer
                    </h4>
                    {(results.documents as Record<string, unknown>[]).map((d, i) => {
                      const answer = d.answer as string | undefined;
                      const sources = d.sources as Array<{ title: string; id: string }> | undefined;
                      return (
                        <div key={i}>
                          {answer && (
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
                              {answer.slice(0, 400)}
                            </div>
                          )}
                          {sources && sources.length > 0 && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              <strong>Sources:</strong> {sources.slice(0, 3).map(s => s.title).join(', ')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </GlassCard>
                )}

                {(results.rag || []).length > 0 && (
                  <GlassCard>
                    <h4 style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={12} style={{ color: 'var(--purple)' }} /> RAG Sources ({(results.rag as unknown[]).length})
                    </h4>
                    {(results.rag as Record<string, unknown>[]).slice(0, 5).map((r, i) => (
                      <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                        <span style={{ color: 'var(--text-primary)' }}>{String(r.name || r.title || 'Source')}</span>
                        {Boolean(r.uri) && <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>— {String(r.uri).slice(0, 60)}</span>}
                      </div>
                    ))}
                  </GlassCard>
                )}

                {(results.drive || []).length > 0 && (
                  <GlassCard>
                    <h4 style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <HardDrive size={12} style={{ color: '#0F9D58' }} /> Google Drive ({(results.drive as unknown[]).length})
                    </h4>
                    {(results.drive as Record<string, unknown>[]).slice(0, 5).map((f, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                        <span style={{ color: 'var(--text-primary)' }}>{String(f.name)}</span>
                        {Boolean(f.webViewLink) && (
                          <a href={String(f.webViewLink)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cyan)' }}>
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    ))}
                  </GlassCard>
                )}

                {Object.values(results).every(arr => !arr || (arr as unknown[]).length === 0) && (
                  <EmptyState icon={<Search size={32} />} title="No results" description={`No matches for "${query}" in the scope.`} />
                )}
              </>
            )}
          </div>
        )}

        {/* ══════════ Ingest ══════════ */}
        {tab === 'ingest' && (
          <GlassCard>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={14} style={{ color: 'var(--cyan)' }} /> Ingest to Knowledge Base
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 16px' }}>
              Save content to the appropriate knowledge system. Use <strong>Memory</strong> for quick facts,
              <strong> Documents</strong> for notes and specs, <strong>RAG</strong> for large reference corpora.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Target</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {(['memory', 'document', 'rag'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setIngestTarget(t)}
                      style={{
                        padding: '8px 12px',
                        background: ingestTarget === t ? 'rgba(0, 240, 255, 0.1)' : 'var(--bg-input)',
                        border: `1px solid ${ingestTarget === t ? 'var(--cyan)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-sm)',
                        color: ingestTarget === t ? 'var(--cyan)' : 'var(--text-secondary)',
                        fontSize: 12, cursor: 'pointer', textTransform: 'capitalize', fontWeight: ingestTarget === t ? 600 : 400,
                      }}
                    >{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Venture</label>
                <select
                  value={ingestVenture}
                  onChange={(e) => setIngestVenture(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13 }}
                >
                  {ventures.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Title / Key</label>
                <Input placeholder="e.g. Q2 revenue targets" value={ingestTitle} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIngestTitle(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Content</label>
                <textarea
                  placeholder="Paste content, notes, or facts..."
                  value={ingestContent}
                  onChange={(e) => setIngestContent(e.target.value)}
                  rows={8}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'var(--font-sans)' }}
                />
              </div>
              <Button onClick={handleIngest} disabled={ingesting || !ingestTitle.trim() || !ingestContent.trim()}>
                {ingesting ? <Loader2 size={14} className="mcv-spin" /> : <Plus size={14} />} Ingest to {ingestTarget}
              </Button>
            </div>
          </GlassCard>
        )}

        {tab === 'memory' && (
          <GlassCard>
            <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Memory System</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Persistent facts, insights, and session events. Full UI in <a href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }} style={{ color: 'var(--cyan)' }}>Memory Hub</a>.
            </p>
          </GlassCard>
        )}

        {tab === 'documents' && (
          <GlassCard>
            <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Document Library</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Long-form documents with Gemini RAG Q&A. Full UI in <a href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }} style={{ color: 'var(--cyan)' }}>Docs Hub</a>.
            </p>
          </GlassCard>
        )}

        {tab === 'rag' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <GlassCard>
              <h3 style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={14} style={{ color: 'var(--purple)' }} /> RAG Corpora — pgvector (768-dim)
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px' }}>
                Vector corpora for semantic retrieval. Chunks are embedded with <code>text-embedding-004</code> and stored in <code>storage_chunks</code>.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <Input
                  placeholder="New corpus name (e.g. BetEdge Research Vault)"
                  value={newCorpusName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCorpusName(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleCreateCorpus()}
                />
                <Button onClick={handleCreateCorpus} disabled={!newCorpusName.trim()}>
                  <Plus size={14} /> Create
                </Button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <Button onClick={() => handleBackfill('docs')} title="Chunk + embed every document for the current venture scope">
                  <RefreshCw size={14} /> Backfill all Docs
                </Button>
                <Button onClick={() => handleBackfill('memory')} title="Chunk + embed every memory entry for the current venture scope">
                  <RefreshCw size={14} /> Backfill all Memories
                </Button>
              </div>
            </GlassCard>

            <GlassCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)' }}>
                  {corpora.length} corpora {effectiveVentureId ? `in ${effectiveVentureId}` : 'across all ventures'}
                </h4>
                <button onClick={loadCorpora} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <RefreshCw size={12} />
                </button>
              </div>
              {corporaLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 12 }}>
                  <Loader2 size={14} className="mcv-spin" /> Loading corpora...
                </div>
              ) : corpora.length === 0 ? (
                <EmptyState icon={<BookOpen size={32} />} title="No corpora yet" description="Create your first corpus above." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {corpora.map((c) => {
                    const cid = (c.corpus_id || c.id) as string;
                    const cname = c.corpus_name || c.name || 'Untitled';
                    return (
                      <div key={cid} style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{cname}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {c.venture_id || 'global'} · {c.file_count ?? 0} files · {c.chunk_count ?? 0} chunks
                            {c.last_indexed_at && ` · indexed ${new Date(c.last_indexed_at).toLocaleDateString()}`}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            onClick={() => handleReindexCorpus(cid)}
                            title="Reindex all files"
                            style={{ padding: 6, background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--cyan)', cursor: 'pointer' }}
                          ><RefreshCw size={12} /></button>
                          <button
                            onClick={() => handleDeleteCorpus(cid)}
                            title="Delete corpus + all chunks"
                            style={{ padding: 6, background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, color: '#ef4444', cursor: 'pointer' }}
                          ><Trash2 size={12} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>

            <GlassCard>
              <h4 style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={12} style={{ color: 'var(--purple)' }} /> Embed Content Into Corpus
              </h4>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 10px' }}>
                Paste any text — it will be chunked, embedded with <code>text-embedding-004</code>, and indexed for semantic retrieval.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <select
                  value={ingestCorpusId}
                  onChange={(e) => setIngestCorpusId(e.target.value)}
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', fontSize: 12 }}
                >
                  <option value="">Select a corpus...</option>
                  {corpora.map((c) => {
                    const cid = (c.corpus_id || c.id) as string;
                    const cname = c.corpus_name || c.name || 'Untitled';
                    return <option key={cid} value={cid}>{cname}</option>;
                  })}
                </select>
                <textarea
                  placeholder="Paste content to embed... (runs through sentence-aware chunker, then Gemini embeddings)"
                  value={ingestText}
                  onChange={(e) => setIngestText(e.target.value)}
                  rows={6}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'var(--font-sans)' }}
                />
                <Button
                  onClick={handleIngestToCorpus}
                  disabled={!ingestCorpusId || !ingestText.trim() || ingestingToCorpus}
                >
                  {ingestingToCorpus ? <Loader2 size={14} className="mcv-spin" /> : <Sparkles size={14} />}
                  Embed & Index
                </Button>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </PageShell>
  );
}
