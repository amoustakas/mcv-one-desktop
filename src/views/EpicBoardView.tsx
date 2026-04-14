import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Plus, ArrowUp, ArrowDown, Minus, CheckCircle2, Clock, FileEdit, ShieldCheck, Ban, CircleDashed, Flag, RefreshCw } from 'lucide-react';
import { useNavigation } from '../stores/navigation';
import { useToast } from '../components/Toasts';
import { PageHeader, PageShell, Button, GlassCard, Badge } from '../components/ui';
import { staggerContainer, fadeInUp } from '../lib/animations';
import { apiPost } from '../lib/api/client';
import EpicDetailModal from '../components/epics/EpicDetailModal';

type EpicStatus = 'draft' | 'proposed' | 'approved' | 'in-progress' | 'blocked' | 'review' | 'done' | 'cancelled';
type EpicPriority = 'critical' | 'high' | 'medium' | 'low';

interface Epic {
  id: string;
  title: string;
  summary?: string | null;
  spec_md?: string | null;
  venture_id?: string | null;
  suite?: string | null;
  owner_agent?: string | null;
  status: EpicStatus;
  priority: EpicPriority;
  progress_pct: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

const COLUMNS: EpicStatus[] = ['proposed', 'approved', 'in-progress', 'review', 'done'];
const STATUS_LABEL: Record<EpicStatus, string> = {
  draft: 'Draft', proposed: 'Proposed', approved: 'Approved', 'in-progress': 'In Progress',
  review: 'Review', blocked: 'Blocked', done: 'Done', cancelled: 'Cancelled',
};
const STATUS_ICON: Record<EpicStatus, React.ReactNode> = {
  draft: <FileEdit size={12} />, proposed: <Flag size={12} />, approved: <ShieldCheck size={12} />,
  'in-progress': <Clock size={12} />, review: <CircleDashed size={12} />,
  blocked: <Ban size={12} />, done: <CheckCircle2 size={12} />, cancelled: <Ban size={12} />,
};
const STATUS_COLOR: Record<EpicStatus, string> = {
  draft: '#6B7280', proposed: 'var(--cyan)', approved: 'var(--purple, #8B5CF6)',
  'in-progress': 'var(--cyan)', review: 'var(--warning)', blocked: 'var(--error)',
  done: 'var(--success)', cancelled: '#6B7280',
};
const PRIO_ICON: Record<EpicPriority, React.ReactNode> = {
  critical: <ArrowUp size={11} style={{ color: 'var(--error)' }} />,
  high: <ArrowUp size={11} style={{ color: 'var(--warning)' }} />,
  medium: <Minus size={11} style={{ color: 'var(--text-muted)' }} />,
  low: <ArrowDown size={11} style={{ color: 'var(--core-blue)' }} />,
};
const PRIO_COLOR: Record<EpicPriority, string> = {
  critical: 'var(--error)', high: 'var(--warning)',
  medium: 'var(--text-muted)', low: 'var(--core-blue)',
};

export default function EpicBoardView() {
  const { mode, activeVenture } = useNavigation();
  const { toast } = useToast();

  const [epics, setEpics] = useState<Epic[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedEpicId, setSelectedEpicId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newSuite, setNewSuite] = useState('');
  const [newPriority, setNewPriority] = useState<EpicPriority>('medium');

  const ventureFilter = mode === 'venture' ? activeVenture || undefined : undefined;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiPost<{ epics: Epic[] }>('/api/epics', { action: 'list', venture_id: ventureFilter });
      setEpics(res.epics || []);
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Failed to load epics');
    } finally {
      setLoading(false);
    }
  }, [ventureFilter, toast]);

  useEffect(() => { void load(); }, [load]);

  const grouped = useMemo(() => {
    const g: Record<EpicStatus, Epic[]> = { draft: [], proposed: [], approved: [], 'in-progress': [], review: [], blocked: [], done: [], cancelled: [] };
    for (const e of epics) (g[e.status] ||= []).push(e);
    return g;
  }, [epics]);

  const moveStatus = async (epic: Epic, direction: 1 | -1) => {
    const idx = COLUMNS.indexOf(epic.status);
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= COLUMNS.length) return;
    const nextStatus = COLUMNS[nextIdx];
    try {
      await apiPost('/api/epics', { action: 'update', id: epic.id, status: nextStatus });
      setEpics(prev => prev.map(e => e.id === epic.id ? { ...e, status: nextStatus } : e));
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Update failed');
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await apiPost<{ epic: Epic }>('/api/epics', {
        action: 'create',
        epic: {
          title: newTitle,
          summary: newSummary || undefined,
          suite: newSuite || undefined,
          venture_id: ventureFilter,
          priority: newPriority,
          status: 'draft',
        },
      });
      setEpics(prev => [res.epic, ...prev]);
      toast('success', `Epic "${res.epic.title}" filed`);
      setNewTitle(''); setNewSummary(''); setNewSuite(''); setNewPriority('medium'); setShowAdd(false);
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Create failed');
    }
  };

  const blocked = grouped.blocked || [];
  const drafts = grouped.draft || [];

  return (
    <PageShell scroll={false}>
      <PageHeader
        icon={<Layers size={20} />}
        title="Epic Board"
        count={epics.length}
        loading={loading}
        onRefresh={() => load()}
      >
        <Button variant="secondary" size="sm" icon={<Plus size={13} />} onClick={() => setShowAdd(!showAdd)}>New Epic</Button>
      </PageHeader>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
            <GlassCard className="eb-add">
              <input className="mcv-input" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Epic title..." autoFocus />
              <input className="mcv-input" value={newSummary} onChange={e => setNewSummary(e.target.value)} placeholder="Short summary (optional)" />
              <select className="mcv-input" value={newSuite} onChange={e => setNewSuite(e.target.value)}>
                <option value="">No suite</option>
                <option value="command-bridge">Command Bridge</option>
                <option value="creative-studio">Creative Studio</option>
                <option value="developer-ops">Developer Ops</option>
                <option value="marketing-growth">Marketing & Growth</option>
                <option value="commerce-finance">Commerce & Finance</option>
                <option value="comms-hub">Comms Hub</option>
                <option value="knowledge-research">Knowledge & Research</option>
                <option value="voice-studio">Voice Studio</option>
                <option value="strategy-intelligence">Strategy & Intelligence</option>
                <option value="ops-infra">Ops / Infra</option>
                <option value="ventures-workspace">Ventures Workspace</option>
                <option value="arcade-lab">Arcade / Lab</option>
              </select>
              <select className="mcv-input" value={newPriority} onChange={e => setNewPriority(e.target.value as EpicPriority)}>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <Button variant="primary" size="sm" onClick={handleCreate}>File Epic</Button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="eb-board">
        {COLUMNS.map(col => (
          <div key={col} className="eb-col">
            <div className="eb-col-header">
              <div className="eb-col-gradient" style={{ background: `linear-gradient(to right, transparent, ${STATUS_COLOR[col]}, transparent)` }} />
              <div className="eb-col-icon" style={{ color: STATUS_COLOR[col] }}>{STATUS_ICON[col]}</div>
              <span>{STATUS_LABEL[col]}</span>
              <span className="eb-col-count" style={{ background: `${STATUS_COLOR[col]}15`, color: STATUS_COLOR[col] }}>
                {grouped[col]?.length || 0}
              </span>
            </div>
            <motion.div className="eb-col-cards" variants={staggerContainer} initial="hidden" animate="show">
              {(grouped[col] || []).map(e => (
                <motion.div key={e.id} variants={fadeInUp}>
                  <div className="eb-card" onClick={() => setSelectedEpicId(e.id)} role="button" tabIndex={0} onKeyDown={(ev) => { if (ev.key === 'Enter') setSelectedEpicId(e.id); }}>
                    <div className="eb-card-stripe" style={{ background: PRIO_COLOR[e.priority] }} />
                    <div className="eb-card-top">
                      {PRIO_ICON[e.priority]}
                      <span className="eb-card-title">{e.title}</span>
                    </div>
                    {e.summary && <div className="eb-card-summary">{e.summary}</div>}
                    <div className="eb-card-meta">
                      {e.venture_id && <Badge size="sm">{e.venture_id}</Badge>}
                      {e.suite && <Badge size="sm">{e.suite}</Badge>}
                    </div>
                    <div className="eb-card-progress">
                      <div className="eb-progress-bar" style={{ width: `${e.progress_pct || 0}%`, background: STATUS_COLOR[e.status] }} />
                      <span className="eb-progress-label">{e.progress_pct || 0}%</span>
                    </div>
                    <div className="eb-card-actions" onClick={(ev) => ev.stopPropagation()}>
                      {COLUMNS.indexOf(e.status) > 0 && (
                        <button className="eb-move eb-move-back" onClick={() => moveStatus(e, -1)}>← Back</button>
                      )}
                      {COLUMNS.indexOf(e.status) < COLUMNS.length - 1 && (
                        <button className="eb-move eb-move-next" onClick={() => moveStatus(e, 1)}>Next →</button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        ))}
      </div>

      {(drafts.length > 0 || blocked.length > 0) && (
        <div className="eb-aux">
          {drafts.length > 0 && (
            <div className="eb-aux-group">
              <h3 className="eb-aux-title"><FileEdit size={12} /> Drafts ({drafts.length})</h3>
              {drafts.map(e => (
                <div key={e.id} className="eb-card eb-card-aux">
                  <span className="eb-card-title">{e.title}</span>
                  <button className="eb-move eb-move-next" onClick={() => apiPost('/api/epics', { action: 'update', id: e.id, status: 'proposed' }).then(load).catch(() => toast('error', 'Propose failed'))}>
                    Propose →
                  </button>
                </div>
              ))}
            </div>
          )}
          {blocked.length > 0 && (
            <div className="eb-aux-group">
              <h3 className="eb-aux-title eb-aux-blocked"><Ban size={12} /> Blocked ({blocked.length})</h3>
              {blocked.map(e => (
                <div key={e.id} className="eb-card eb-card-aux eb-card-blocked">
                  <span className="eb-card-title">{e.title}</span>
                  <button className="eb-move eb-move-back" onClick={() => apiPost('/api/epics', { action: 'update', id: e.id, status: 'in-progress' }).then(load).catch(() => toast('error', 'Unblock failed'))}>
                    <RefreshCw size={10} /> Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <EpicDetailModal
        epicId={selectedEpicId}
        onClose={() => setSelectedEpicId(null)}
        onChange={() => void load()}
      />

      <style>{`
        .eb-add { display:flex; gap:8px; padding:10px 20px; margin:0 20px; align-items:center; flex-wrap:wrap; }
        .eb-add .mcv-input { min-width:160px; }

        .eb-board { flex:1; display:grid; grid-template-columns:repeat(${COLUMNS.length},1fr); gap:1px; background:var(--border); overflow:hidden; margin-top:8px; }
        .eb-col { background:var(--bg-deep); display:flex; flex-direction:column; overflow:hidden; }

        .eb-col-header { position:relative; display:flex; align-items:center; gap:6px; padding:10px 14px; font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; background:var(--bg-surface); flex-shrink:0; }
        .eb-col-gradient { position:absolute; top:0; left:10%; right:10%; height:1px; }
        .eb-col-icon { display:flex; align-items:center; }
        .eb-col-count { margin-left:auto; font-size:10px; font-family:var(--font-mono); padding:1px 7px; border-radius:var(--radius-full); font-weight:700; }

        .eb-col-cards { flex:1; overflow-y:auto; padding:8px; display:flex; flex-direction:column; gap:8px; }

        .eb-card { position:relative; padding:12px 12px 12px 16px; display:flex; flex-direction:column; gap:6px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); transition:all 0.2s; overflow:hidden; cursor: pointer; }
        .eb-card:hover { border-color:var(--border-active); transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,0.25); }
        .eb-card:focus-visible { outline: 2px solid var(--cyan); outline-offset: 2px; }
        .eb-card-stripe { position:absolute; top:0; left:0; width:3px; height:100%; border-radius:3px 0 0 3px; }

        .eb-card-top { display:flex; align-items:center; gap:6px; }
        .eb-card-title { flex:1; font-size:12px; font-weight:600; color:var(--text-primary); line-height:1.3; }
        .eb-card-summary { font-size:11px; color:var(--text-secondary); line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .eb-card-meta { display:flex; gap:4px; flex-wrap:wrap; }

        .eb-card-progress { position:relative; height:4px; background:var(--bg-elevated); border-radius:2px; overflow:hidden; }
        .eb-progress-bar { height:100%; border-radius:2px; transition:width 0.3s; }
        .eb-progress-label { position:absolute; right:4px; top:-13px; font-size:9px; font-family:var(--font-mono); color:var(--text-muted); }

        .eb-card-actions { display:flex; gap:4px; margin-top:2px; }
        .eb-move { font-size:9px; color:var(--text-muted); padding:3px 8px; border-radius:var(--radius-sm); transition:all 0.15s; cursor:pointer; background:none; border:1px solid transparent; display:inline-flex; align-items:center; gap:3px; }
        .eb-move:hover { background:var(--bg-elevated); color:var(--text-secondary); border-color:var(--border); }
        .eb-move-next:hover { color:var(--cyan); border-color:rgba(0,240,255,0.2); }

        .eb-aux { padding:10px 20px 16px; display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .eb-aux-group { }
        .eb-aux-title { font-size:11px; font-weight:600; color:var(--text-muted); display:flex; align-items:center; gap:4px; margin-bottom:8px; }
        .eb-aux-blocked { color:var(--error); }
        .eb-card-aux { flex-direction:row; align-items:center; justify-content:space-between; }
        .eb-card-blocked { border-color:rgba(239,68,68,0.25); background:rgba(239,68,68,0.03); }
      `}</style>
    </PageShell>
  );
}
