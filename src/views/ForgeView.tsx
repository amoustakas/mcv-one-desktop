import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Hammer, Plus, Copy, Check, Code, FileCode, Cpu, Palette, Globe } from 'lucide-react';
import { PageShell, PageHeader, GlassCard, Button, EmptyState } from '../components/ui';
import { staggerContainer, fadeInUp } from '../lib/animations';
import { useNavigation } from '../stores/navigation';
import { useToast } from '../components/Toasts';
import { apiPost } from '../lib/api/client';

interface Template { id: string; name: string; category: string; language: string; content: string; description: string; tags: string[]; usage_count: number; venture_id: string; }

const CATEGORIES = ['component', 'api-route', 'hook', 'utility', 'prompt', 'config', 'schema', 'script'];
const CAT_ICONS: Record<string, React.ReactNode> = { component: <Palette size={12} />, 'api-route': <Globe size={12} />, hook: <Code size={12} />, utility: <FileCode size={12} />, prompt: <Cpu size={12} />, config: <FileCode size={12} />, schema: <Code size={12} />, script: <FileCode size={12} /> };
const LANG_COLORS: Record<string, string> = { typescript: '#3178C6', javascript: '#F7DF1E', python: '#3572A5', sql: '#E38C00', css: '#1572B6', html: '#E34F26', markdown: '#6B7280', prompt: '#8B5CF6' };

export default function ForgeView() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState('');
  const [form, setForm] = useState({ name: '', category: 'component', language: 'typescript', content: '', description: '', venture_id: '' });
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'language'>('date');
  const { mode, activeVenture } = useNavigation();
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    const d = await apiPost<{ documents?: Record<string, unknown>[] }>('/api/docs', { action: 'list', doc_type: undefined });
    const all = (d.documents || []).filter((doc: any) => ['component', 'api-route', 'hook', 'utility', 'prompt', 'config', 'schema', 'script'].includes(doc.doc_type));
    setTemplates(all.map((doc: any) => ({ ...doc, category: doc.doc_type, language: doc.metadata?.language || 'typescript', content: doc.content || '', tags: doc.metadata?.tags || [] })));
    setLoading(false);
  }

  useEffect(() => { load(); }, [activeVenture, mode]);

  async function handleCreate() {
    if (!form.name.trim() || !form.content.trim()) return;
    await apiPost('/api/docs', {
      action: 'create',
      title: form.name,
      content: form.content,
      doc_type: form.category,
      venture_id: form.venture_id || (mode === 'venture' ? activeVenture : 'mcv'),
      metadata: { language: form.language, description: form.description },
    });
    toast('success', `Template "${form.name}" created`);
    setForm({ name: '', category: 'component', language: 'typescript', content: '', description: '', venture_id: '' });
    setShowAdd(false); load();
  }

  function handleCopy(id: string, content: string) {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const filtered = (filterCat ? templates.filter(t => t.category === filterCat) : templates)
    .sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'language') return (a.language || '').localeCompare(b.language || '');
      return 0;
    });

  return (
    <PageShell scroll={false}>
      <PageHeader icon={<Hammer size={20} />} title="The Forge" count={templates.length} loading={loading} onRefresh={load}>
        <select className="forge-filter" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="forge-filter" value={sortBy} onChange={e => setSortBy(e.target.value as 'name' | 'date' | 'language')}>
          <option value="date">Sort: Recent</option>
          <option value="name">Sort: Name</option>
          <option value="language">Sort: Language</option>
        </select>
        <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => setShowAdd(!showAdd)}>New Template</Button>
      </PageHeader>

      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <GlassCard className="forge-form">
            <div className="forge-form-gradient" />
            <div className="forge-form-row">
              <input className="forge-input" placeholder="Template name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <select className="forge-sel" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="forge-sel" value={form.language} onChange={e => setForm({...form, language: e.target.value})}>
                {Object.keys(LANG_COLORS).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <input className="forge-input" placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            <textarea className="forge-textarea" placeholder="Template code / content *" value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={8} />
            <div className="forge-form-actions">
              <Button variant="primary" size="sm" onClick={handleCreate}>Save Template</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </GlassCard>
        </motion.div>
      )}

      <motion.div className="forge-grid" variants={staggerContainer} initial="hidden" animate="show" key={filterCat + sortBy}>
        {filtered.map(t => (
          <motion.div key={t.id} variants={fadeInUp}>
            <GlassCard className="forge-card">
              <div className="forge-card-gradient" />
              <div className="forge-card-header">
                {CAT_ICONS[t.category] || <Code size={12} />}
                <span className="forge-card-name">{t.name || t.id?.slice(0, 8)}</span>
                <span className={`forge-card-lang-badge forge-lang-${t.language}`}>{t.language}</span>
                <button className="forge-card-copy" onClick={() => handleCopy(t.id, t.content)}>
                  {copied === t.id ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                </button>
              </div>
              {t.description && <p className="forge-card-desc">{t.description}</p>}
              <pre className="forge-card-code"><code>{t.content?.slice(0, 300)}{t.content?.length > 300 ? '...' : ''}</code></pre>
              <div className="forge-card-footer">
                <span className={`forge-card-cat forge-cat-${t.category}`}>
                  {CAT_ICONS[t.category] || <Code size={10} />}
                  {t.category}
                </span>
                {t.venture_id && <span className="forge-card-venture">{t.venture_id}</span>}
              </div>
            </GlassCard>
          </motion.div>
        ))}
        {filtered.length === 0 && !loading && (
          <EmptyState
            icon={<Hammer size={28} />}
            title="No templates yet"
            description="Create reusable code snippets, prompts, and configurations."
          />
        )}
      </motion.div>

      <style>{`
        .forge-filter { padding:5px 10px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-secondary); font-size:11px; transition:all 0.2s; }
        .forge-filter:focus { border-color:var(--border-active); outline:none; box-shadow:0 0 0 2px rgba(0,240,255,0.15); }

        /* --- Form Section --- */
        .forge-form { position:relative; display:flex; flex-direction:column; gap:8px; padding:14px; margin:0 20px; border-radius:var(--radius-md); overflow:hidden; }
        .forge-form-gradient { position:absolute; top:0; left:20%; right:20%; height:1px; background:linear-gradient(to right, transparent, var(--cyan), transparent); pointer-events:none; }
        .forge-form-row { display:flex; gap:8px; }
        .forge-input { flex:1; padding:6px 10px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-primary); font-size:12px; transition:all 0.2s; }
        .forge-input:focus { border-color:var(--border-active); outline:none; box-shadow:0 0 0 2px rgba(0,240,255,0.15); }
        .forge-sel { padding:6px 8px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-secondary); font-size:11px; transition:all 0.2s; }
        .forge-sel:focus { border-color:var(--border-active); outline:none; box-shadow:0 0 0 2px rgba(0,240,255,0.15); }
        .forge-textarea { padding:8px 10px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-primary); font-size:12px; font-family:var(--font-mono); resize:vertical; transition:all 0.2s; }
        .forge-textarea:focus { border-color:var(--border-active); outline:none; box-shadow:0 0 0 2px rgba(0,240,255,0.15); }
        .forge-form-actions { display:flex; gap:8px; }

        /* --- Card Grid --- */
        .forge-grid { flex:1; overflow-y:auto; padding:8px 20px; display:grid; grid-template-columns:repeat(auto-fill,minmax(380px,1fr)); gap:10px; align-content:start; }
        .forge-card { position:relative; padding:12px; display:flex; flex-direction:column; gap:6px; transition:all 0.2s ease; overflow:hidden; }
        .forge-card:hover { border-color:var(--border-active); transform:translateY(-2px); box-shadow:0 4px 20px rgba(0,240,255,0.08), 0 0 0 1px rgba(0,240,255,0.06); }
        .forge-card-gradient { position:absolute; top:0; left:20%; right:20%; height:1px; background:linear-gradient(to right, transparent, var(--cyan), transparent); opacity:0; transition:opacity 0.3s; pointer-events:none; }
        .forge-card:hover .forge-card-gradient { opacity:1; }

        .forge-card-header { display:flex; align-items:center; gap:6px; }
        .forge-card-name { font-size:13px; font-weight:600; flex:1; color:var(--text-primary); }
        .forge-card-copy { display:flex; align-items:center; gap:3px; font-size:10px; color:var(--text-muted); padding:2px 6px; border-radius:3px; transition:all 0.15s; }
        .forge-card-copy:hover { color:var(--cyan); background:rgba(0,240,255,0.08); }
        .forge-card-desc { font-size:11px; color:var(--text-muted); line-height:1.4; }
        .forge-card-code { background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius-sm); padding:8px 10px; font-family:var(--font-mono); font-size:11px; color:var(--text-secondary); overflow-x:auto; max-height:120px; overflow-y:auto; margin:0; }

        /* --- Language Badges --- */
        .forge-card-lang-badge { font-size:9px; font-weight:700; text-transform:uppercase; padding:2px 6px; border-radius:var(--radius-full); letter-spacing:0.3px; }
        .forge-lang-typescript { background:rgba(49,120,198,0.15); color:#3178C6; }
        .forge-lang-javascript { background:rgba(247,223,30,0.12); color:#F7DF1E; }
        .forge-lang-python { background:rgba(53,114,165,0.15); color:#3572A5; }
        .forge-lang-sql { background:rgba(227,140,0,0.15); color:#E38C00; }
        .forge-lang-css { background:rgba(21,114,182,0.15); color:#1572B6; }
        .forge-lang-html { background:rgba(227,79,38,0.15); color:#E34F26; }
        .forge-lang-markdown { background:rgba(107,114,128,0.15); color:#6B7280; }
        .forge-lang-prompt { background:rgba(139,92,246,0.15); color:#8B5CF6; }

        /* --- Category Badges --- */
        .forge-card-footer { display:flex; gap:6px; font-size:10px; color:var(--text-muted); align-items:center; }
        .forge-card-cat { display:inline-flex; align-items:center; gap:3px; padding:2px 7px; border-radius:var(--radius-full); font-weight:600; }
        .forge-cat-component { background:rgba(139,92,246,0.12); color:var(--purple, #8B5CF6); }
        .forge-cat-api-route { background:rgba(16,185,129,0.12); color:#10B981; }
        .forge-cat-hook { background:rgba(0,240,255,0.10); color:var(--cyan); }
        .forge-cat-utility { background:rgba(251,191,36,0.12); color:#FBBF24; }
        .forge-cat-prompt { background:rgba(139,92,246,0.12); color:var(--purple, #8B5CF6); }
        .forge-cat-config { background:rgba(107,114,128,0.12); color:#9CA3AF; }
        .forge-cat-schema { background:rgba(59,130,246,0.12); color:#3B82F6; }
        .forge-cat-script { background:rgba(244,114,182,0.12); color:#F472B6; }
        .forge-card-venture { background:var(--bg-surface); padding:2px 7px; border-radius:var(--radius-full); font-weight:500; }
      `}</style>
    </PageShell>
  );
}
