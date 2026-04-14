import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  X, Layers, User, ArrowUp, ArrowDown, Minus, Clock, CheckCircle2,
  Ban, Flag, FileEdit, ShieldCheck, CircleDashed, RefreshCw,
  Loader2, Plus, Check, Slash,
} from 'lucide-react';
import Modal from '../ui/Modal';
import { Button, GlassCard, Badge } from '../ui';
import { apiPost } from '../../lib/api/client';
import { useToast } from '../Toasts';

type EpicStatus = 'draft' | 'proposed' | 'approved' | 'in-progress' | 'blocked' | 'review' | 'done' | 'cancelled';
type EpicPriority = 'critical' | 'high' | 'medium' | 'low';
type StoryStatus = 'todo' | 'in-progress' | 'review' | 'blocked' | 'done' | 'cancelled';
type CheckpointState = 'pending' | 'awaiting-review' | 'approved' | 'rejected' | 'skipped';
type CheckpointType = 'spec-review' | 'design-review' | 'pre-commit' | 'pre-merge' | 'pre-deploy' | 'post-deploy' | 'custom';

interface EpicRow {
  id: string;
  title: string;
  summary: string | null;
  spec_md: string | null;
  venture_id: string | null;
  suite: string | null;
  owner_agent: string | null;
  status: EpicStatus;
  priority: EpicPriority;
  progress_pct: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface StoryRow {
  id: string;
  epic_id: string;
  title: string;
  description: string | null;
  acceptance_criteria: string[];
  assigned_agent: string | null;
  status: StoryStatus;
  priority_order: number;
  estimated_effort: string | null;
  created_at: string;
}

interface CheckpointRow {
  id: string;
  epic_id: string;
  checkpoint_type: CheckpointType;
  title: string;
  description: string | null;
  required_approvers: string[];
  approved_by: string[];
  state: CheckpointState;
  decision_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

interface EpicDetailModalProps {
  epicId: string | null;
  onClose: () => void;
  onChange?: () => void; // refresh parent board after mutations
}

const STATUS_COLOR: Record<EpicStatus, string> = {
  draft: '#6B7280', proposed: 'var(--cyan)', approved: 'var(--purple, #8B5CF6)',
  'in-progress': 'var(--cyan)', review: 'var(--warning)', blocked: 'var(--error)',
  done: 'var(--success)', cancelled: '#6B7280',
};
const STATUS_ICON: Record<EpicStatus, React.ReactNode> = {
  draft: <FileEdit size={12} />, proposed: <Flag size={12} />, approved: <ShieldCheck size={12} />,
  'in-progress': <Clock size={12} />, review: <CircleDashed size={12} />,
  blocked: <Ban size={12} />, done: <CheckCircle2 size={12} />, cancelled: <Ban size={12} />,
};
const PRIO_ICON: Record<EpicPriority, React.ReactNode> = {
  critical: <ArrowUp size={11} style={{ color: 'var(--error)' }} />,
  high: <ArrowUp size={11} style={{ color: 'var(--warning)' }} />,
  medium: <Minus size={11} style={{ color: 'var(--text-muted)' }} />,
  low: <ArrowDown size={11} style={{ color: 'var(--core-blue)' }} />,
};

const STATUS_ORDER: EpicStatus[] = ['draft', 'proposed', 'approved', 'in-progress', 'review', 'done'];

export default function EpicDetailModal({ epicId, onClose, onChange }: EpicDetailModalProps) {
  const { toast } = useToast();
  const [epic, setEpic] = useState<EpicRow | null>(null);
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [checkpoints, setCheckpoints] = useState<CheckpointRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!epicId) return;
    setLoading(true);
    try {
      const res = await apiPost<{ epic: EpicRow; stories: StoryRow[]; checkpoints: CheckpointRow[] }>(
        '/api/epics',
        { action: 'get', id: epicId },
      );
      setEpic(res.epic);
      setStories(res.stories || []);
      setCheckpoints(res.checkpoints || []);
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Failed to load epic');
    } finally {
      setLoading(false);
    }
  }, [epicId, toast]);

  useEffect(() => { if (epicId) void load(); }, [epicId, load]);

  async function advanceStatus(direction: 1 | -1) {
    if (!epic) return;
    const idx = STATUS_ORDER.indexOf(epic.status);
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= STATUS_ORDER.length) return;
    const next = STATUS_ORDER[nextIdx];
    try {
      await apiPost('/api/epics', { action: 'update', id: epic.id, status: next });
      setEpic({ ...epic, status: next });
      onChange?.();
      toast('success', `Epic moved to ${next}`);
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Status change failed');
    }
  }

  async function setPriority(p: EpicPriority) {
    if (!epic || epic.priority === p) return;
    try {
      await apiPost('/api/epics', { action: 'update', id: epic.id, priority: p });
      setEpic({ ...epic, priority: p });
      onChange?.();
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Priority change failed');
    }
  }

  async function setStoryStatus(id: string, status: StoryStatus) {
    try {
      await apiPost('/api/epics', { action: 'update_story', id, status });
      setStories(prev => prev.map(s => s.id === id ? { ...s, status } : s));
      onChange?.();
      // Progress rollup trigger will update epic in DB; refresh to pull it.
      if (status === 'done') void load();
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Story update failed');
    }
  }

  async function resolveCheckpoint(id: string, state: 'approved' | 'rejected') {
    try {
      await apiPost('/api/epics', {
        action: 'resolve_checkpoint',
        id, state, approver: 'tony',
      });
      setCheckpoints(prev => prev.map(c => c.id === id ? { ...c, state, resolved_at: new Date().toISOString(), approved_by: state === 'approved' ? [...c.approved_by, 'tony'] : c.approved_by } : c));
      onChange?.();
      toast('success', `Checkpoint ${state}`);
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Checkpoint resolution failed');
    }
  }

  async function requestCheckpoint() {
    if (!epic) return;
    const title = prompt('Checkpoint title?');
    if (!title) return;
    try {
      await apiPost('/api/epics', {
        action: 'request_checkpoint',
        checkpoint: {
          epic_id: epic.id,
          checkpoint_type: 'spec-review',
          title,
          required_approvers: ['tony'],
        },
      });
      await load();
      toast('success', 'Checkpoint requested');
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Checkpoint request failed');
    }
  }

  const pending = useMemo(() => checkpoints.filter(c => !c.resolved_at), [checkpoints]);

  return (
    <Modal open={!!epicId} onClose={onClose} size="xl" ariaLabel="Epic detail">
      {!epic || loading ? (
        <div className="em-loading">
          <Loader2 size={20} className="em-spin" />
          <span>Loading epic…</span>
        </div>
      ) : (
        <div className="em-root">
          {/* ── Header ── */}
          <div className="em-header">
            <div className="em-header-stripe" style={{ background: STATUS_COLOR[epic.status] }} />
            <div className="em-header-body">
              <div className="em-header-title-row">
                <Layers size={16} color={STATUS_COLOR[epic.status]} />
                <h2 className="em-title">{epic.title}</h2>
                <button className="em-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
              </div>
              <div className="em-header-meta">
                <span className="em-pill" style={{ color: STATUS_COLOR[epic.status], borderColor: STATUS_COLOR[epic.status] + '60' }}>
                  {STATUS_ICON[epic.status]} {epic.status}
                </span>
                <span className="em-pill">
                  {PRIO_ICON[epic.priority]} {epic.priority}
                </span>
                {epic.suite && <Badge size="sm">{epic.suite}</Badge>}
                {epic.venture_id && <Badge size="sm">{epic.venture_id}</Badge>}
                {epic.owner_agent && <Badge size="sm"><User size={9} /> {epic.owner_agent.slice(0, 8)}</Badge>}
                <span className="em-progress-inline">
                  <span className="em-progress-bar-bg">
                    <motion.span
                      className="em-progress-bar"
                      style={{ background: STATUS_COLOR[epic.status] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${epic.progress_pct}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </span>
                  <span className="em-progress-text">{epic.progress_pct}%</span>
                </span>
              </div>
              {epic.summary && <p className="em-summary">{epic.summary}</p>}

              <div className="em-header-actions">
                <Button size="sm" variant="ghost" onClick={() => advanceStatus(-1)}
                  disabled={STATUS_ORDER.indexOf(epic.status) <= 0}
                >← Back</Button>
                <Button size="sm" variant="primary" onClick={() => advanceStatus(1)}
                  disabled={STATUS_ORDER.indexOf(epic.status) >= STATUS_ORDER.length - 1}
                >Advance →</Button>
                <div className="em-priority-group">
                  {(['critical', 'high', 'medium', 'low'] as EpicPriority[]).map(p => (
                    <button
                      key={p}
                      className={`em-prio-btn ${epic.priority === p ? 'em-prio-btn-active' : ''}`}
                      onClick={() => setPriority(p)}
                      aria-label={`Set priority ${p}`}
                    >{PRIO_ICON[p]}</button>
                  ))}
                </div>
                <Button size="sm" variant="secondary" icon={<Flag size={12} />} onClick={requestCheckpoint}>
                  Request checkpoint
                </Button>
                <Button size="sm" variant="ghost" icon={<RefreshCw size={12} />} onClick={load}>Refresh</Button>
              </div>
            </div>
          </div>

          <div className="em-body">
            {/* ── Spec ── */}
            <section className="em-section">
              <h3 className="em-section-title">Spec</h3>
              {epic.spec_md ? (
                <pre className="em-spec">{epic.spec_md}</pre>
              ) : (
                <div className="em-empty">No spec yet — ask NAOS to fill it in via <code>update_epic</code>.</div>
              )}
            </section>

            {/* ── Pending checkpoints ── */}
            {pending.length > 0 && (
              <section className="em-section em-section-urgent">
                <h3 className="em-section-title">Awaiting your approval ({pending.length})</h3>
                <div className="em-checkpoints">
                  {pending.map(c => (
                    <GlassCard key={c.id} className="em-checkpoint">
                      <div className="em-checkpoint-head">
                        <span className="em-checkpoint-type">{c.checkpoint_type}</span>
                        <strong>{c.title}</strong>
                        <span className="em-checkpoint-state">{c.state}</span>
                      </div>
                      {c.description && <div className="em-checkpoint-desc">{c.description}</div>}
                      <div className="em-checkpoint-actions">
                        <Button size="sm" variant="primary" icon={<Check size={12} />} onClick={() => resolveCheckpoint(c.id, 'approved')}>
                          Approve
                        </Button>
                        <Button size="sm" variant="ghost" icon={<Slash size={12} />} onClick={() => resolveCheckpoint(c.id, 'rejected')}>
                          Reject
                        </Button>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </section>
            )}

            {/* ── Stories ── */}
            <section className="em-section">
              <h3 className="em-section-title">Stories ({stories.length})</h3>
              {stories.length === 0 && (
                <div className="em-empty">
                  No stories yet. Ask NAOS in chat: <code>"Decompose this epic into stories with acceptance criteria"</code>.
                </div>
              )}
              <div className="em-stories">
                {stories.map(s => (
                  <div key={s.id} className="em-story">
                    <div className="em-story-head">
                      <select
                        className="em-story-status"
                        value={s.status}
                        onChange={e => setStoryStatus(s.id, e.target.value as StoryStatus)}
                      >
                        {(['todo', 'in-progress', 'review', 'blocked', 'done', 'cancelled'] as StoryStatus[]).map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                      <span className="em-story-title">{s.title}</span>
                      {s.estimated_effort && <Badge size="sm">{s.estimated_effort}</Badge>}
                    </div>
                    {s.description && <div className="em-story-desc">{s.description}</div>}
                    {s.acceptance_criteria.length > 0 && (
                      <ul className="em-story-ac">
                        {s.acceptance_criteria.map((ac, i) => (
                          <li key={i}>{ac}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* ── Resolved checkpoints ── */}
            {checkpoints.some(c => c.resolved_at) && (
              <section className="em-section">
                <h3 className="em-section-title">Past checkpoints</h3>
                <div className="em-checkpoints">
                  {checkpoints.filter(c => c.resolved_at).map(c => (
                    <div key={c.id} className="em-checkpoint em-checkpoint-resolved">
                      <span className="em-checkpoint-type">{c.checkpoint_type}</span>
                      <strong>{c.title}</strong>
                      <Badge size="sm">{c.state}</Badge>
                      <span className="em-checkpoint-date">{c.resolved_at?.slice(0, 10)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Tags ── */}
            {epic.tags.length > 0 && (
              <section className="em-section">
                <h3 className="em-section-title">Tags</h3>
                <div className="em-tags">
                  {epic.tags.map(t => <Badge key={t} size="sm">{t}</Badge>)}
                </div>
              </section>
            )}
          </div>
        </div>
      )}

      <style>{`
        .em-loading { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 60px; color: var(--text-muted); font-size: 13px; }
        .em-spin { animation: em-spin 1s linear infinite; }
        @keyframes em-spin { to { transform: rotate(360deg); } }

        .em-root { display: flex; flex-direction: column; max-height: 85vh; }

        .em-header { position: relative; padding: 18px 20px 12px; border-bottom: 1px solid var(--border); background: var(--bg-surface); }
        .em-header-stripe { position: absolute; top: 0; left: 0; right: 0; height: 2px; }
        .em-header-title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .em-title { font-size: 18px; font-weight: 600; margin: 0; flex: 1; color: var(--text-primary); }
        .em-close { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 4px; border-radius: var(--radius-sm); }
        .em-close:hover { color: var(--text-primary); background: var(--bg-elevated); }

        .em-header-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
        .em-pill { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: var(--radius-full); border: 1px solid var(--border); font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }

        .em-progress-inline { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; }
        .em-progress-bar-bg { width: 80px; height: 4px; background: var(--bg-elevated); border-radius: 2px; overflow: hidden; display: inline-block; }
        .em-progress-bar { display: block; height: 100%; }
        .em-progress-text { font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); }

        .em-summary { color: var(--text-secondary); font-size: 13px; line-height: 1.5; margin: 6px 0 10px; }

        .em-header-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .em-priority-group { display: inline-flex; gap: 2px; padding: 2px; background: var(--bg-elevated); border-radius: var(--radius-sm); }
        .em-prio-btn { background: none; border: none; padding: 3px 6px; cursor: pointer; border-radius: var(--radius-sm); display: inline-flex; align-items: center; opacity: 0.5; }
        .em-prio-btn:hover { opacity: 0.8; }
        .em-prio-btn-active { opacity: 1; background: var(--bg-card); }

        .em-body { overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 20px; }

        .em-section { display: flex; flex-direction: column; gap: 8px; }
        .em-section-urgent { padding: 12px; background: rgba(245,158,11,0.06); border: 1px solid rgba(245,158,11,0.25); border-radius: var(--radius-sm); }
        .em-section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin: 0; font-weight: 700; }

        .em-spec { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px; font-size: 12px; line-height: 1.6; color: var(--text-primary); white-space: pre-wrap; font-family: var(--font-sans); max-height: 320px; overflow-y: auto; }
        .em-empty { font-size: 11px; color: var(--text-muted); font-style: italic; padding: 8px 0; }
        .em-empty code { font-family: var(--font-mono); font-size: 10px; color: var(--cyan); background: var(--bg-elevated); padding: 1px 4px; border-radius: 3px; }

        .em-checkpoints { display: flex; flex-direction: column; gap: 6px; }
        .em-checkpoint { padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; }
        .em-checkpoint-resolved { flex-direction: row; align-items: center; gap: 10px; padding: 6px 10px; font-size: 11px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-muted); }
        .em-checkpoint-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .em-checkpoint-type { font-family: var(--font-mono); font-size: 9px; padding: 1px 6px; background: var(--bg-elevated); border-radius: var(--radius-sm); text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); }
        .em-checkpoint-state { margin-left: auto; font-size: 10px; color: var(--warning); text-transform: uppercase; letter-spacing: 0.5px; }
        .em-checkpoint-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.4; }
        .em-checkpoint-actions { display: flex; gap: 6px; margin-top: 4px; }
        .em-checkpoint-date { margin-left: auto; font-family: var(--font-mono); font-size: 10px; }

        .em-stories { display: flex; flex-direction: column; gap: 8px; }
        .em-story { padding: 10px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 6px; }
        .em-story-head { display: flex; align-items: center; gap: 8px; }
        .em-story-status { font-size: 10px; padding: 2px 6px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--bg-elevated); color: var(--text-secondary); }
        .em-story-title { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-primary); }
        .em-story-desc { font-size: 11px; color: var(--text-secondary); line-height: 1.4; }
        .em-story-ac { font-size: 11px; color: var(--text-muted); padding-left: 18px; margin: 4px 0 0; display: flex; flex-direction: column; gap: 2px; }
        .em-story-ac li { line-height: 1.4; }

        .em-tags { display: flex; gap: 6px; flex-wrap: wrap; }
      `}</style>

      {/* Silenced unused imports for future inline-add flows */}
      <span style={{ display: 'none' }}>{typeof Plus}</span>
    </Modal>
  );
}
