import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Trophy, Target, CheckCircle2, Circle, Clock } from 'lucide-react';
import { GlassCard, EmptyState, Badge } from '../ui';
import { apiPost } from '../../lib/api/client';
import type { Venture } from '../../lib/ventures';

interface QuestRow {
  venture_id: string;
  epic_id: string;
  epic_title: string;
  epic_status: string;
  epic_progress: number;
  epic_xp: number;
  story_id?: string;
  story_title?: string;
  story_status?: string;
  story_xp?: number;
  task_id?: string;
  task_title?: string;
  task_status?: string;
  task_xp?: number;
  effective_status: string;
  effective_xp: number;
}

interface EpicGroup {
  epic_id: string;
  epic_title: string;
  epic_status: string;
  epic_progress: number;
  epic_xp: number;
  stories: Array<{
    story_id?: string;
    title: string;
    status: string;
    xp: number;
  }>;
}

const STATUS_ICON: Record<string, typeof CheckCircle2> = {
  done: CheckCircle2,
  'in-progress': Clock,
  review: Target,
  todo: Circle,
  blocked: Circle,
};

const STATUS_COLOR: Record<string, string> = {
  done: 'var(--success)',
  'in-progress': 'var(--cyan)',
  review: 'var(--purple)',
  todo: 'var(--text-muted)',
  blocked: 'var(--error)',
};

export default function VentureQuestPanel({ venture }: { venture: Venture }) {
  const [rows, setRows] = useState<QuestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await apiPost<{ quests: QuestRow[] }>('/api/ventures', { action: 'list-quests', venture_id: venture.id });
        if (!cancelled) setRows(data.quests || []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load quests');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [venture.id]);

  const { groups, totalXp, earnedXp, level } = useMemo(() => {
    const byEpic = new Map<string, EpicGroup>();
    for (const r of rows) {
      let g = byEpic.get(r.epic_id);
      if (!g) {
        g = {
          epic_id: r.epic_id,
          epic_title: r.epic_title,
          epic_status: r.epic_status,
          epic_progress: r.epic_progress,
          epic_xp: r.epic_xp,
          stories: [],
        };
        byEpic.set(r.epic_id, g);
      }
      if (r.story_id && !g.stories.find(s => s.story_id === r.story_id)) {
        g.stories.push({
          story_id: r.story_id,
          title: r.story_title || '(untitled)',
          status: r.story_status || 'todo',
          xp: r.story_xp || 0,
        });
      }
    }
    const groups = Array.from(byEpic.values());
    const totalXp = groups.reduce((sum, g) => sum + g.stories.reduce((s, st) => s + st.xp, 0), 0);
    const earnedXp = groups.reduce((sum, g) => sum + g.stories.filter(s => s.status === 'done').reduce((s, st) => s + st.xp, 0), 0);
    const level = Math.max(1, Math.floor(earnedXp / 200) + 1);
    return { groups, totalXp, earnedXp, level };
  }, [rows]);

  if (loading) {
    return (
      <GlassCard className="vqp-card">
        <div className="vqp-loading">Loading quests for {venture.name}…</div>
      </GlassCard>
    );
  }

  if (error) {
    return <EmptyState icon={<Sparkles size={18} />} title="Couldn't load quests" description={error} />;
  }

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles size={18} />}
        title={`No quests yet for ${venture.name}`}
        description="Seed a Genesis Epic to begin the gamified wizard. Run scripts/seed-venture-genesis-epics.ts or use the wizard at /ventures/:id/wizard."
      />
    );
  }

  const pct = totalXp > 0 ? Math.round((earnedXp / totalXp) * 100) : 0;

  return (
    <div className="vqp-root">
      <GlassCard className="vqp-card vqp-summary">
        <div className="vqp-summary-left">
          <div className="vqp-level">
            <Trophy size={16} style={{ color: 'var(--gold)' }} />
            <span>Level {level}</span>
          </div>
          <div className="vqp-xp">
            <strong>{earnedXp}</strong> / {totalXp} XP <Badge color="#00F0FF">{pct}%</Badge>
          </div>
        </div>
        <div className="vqp-xp-bar">
          <div className="vqp-xp-fill" style={{ width: `${pct}%` }} />
        </div>
      </GlassCard>

      {groups.map(g => {
        const doneCount = g.stories.filter(s => s.status === 'done').length;
        const groupPct = g.stories.length > 0 ? Math.round((doneCount / g.stories.length) * 100) : 0;
        return (
          <GlassCard key={g.epic_id} className="vqp-card vqp-epic">
            <div className="vqp-epic-head">
              <div className="vqp-epic-title">{g.epic_title}</div>
              <div className="vqp-epic-meta">
                <Badge color={g.epic_status === 'done' ? '#10B981' : g.epic_status === 'in-progress' ? '#00F0FF' : '#6B7280'}>
                  {g.epic_status}
                </Badge>
                <span className="vqp-epic-count">{doneCount}/{g.stories.length}</span>
                <span className="vqp-epic-pct">{groupPct}%</span>
              </div>
            </div>
            <ul className="vqp-stories">
              {g.stories.map(s => {
                const Icon = STATUS_ICON[s.status] || Circle;
                const color = STATUS_COLOR[s.status] || 'var(--text-muted)';
                return (
                  <li key={s.story_id} className={`vqp-story vqp-story-${s.status}`}>
                    <Icon size={13} style={{ color }} />
                    <span className="vqp-story-title">{s.title}</span>
                    <span className="vqp-story-xp">+{s.xp} XP</span>
                  </li>
                );
              })}
            </ul>
          </GlassCard>
        );
      })}

      <style>{`
        .vqp-root { display: flex; flex-direction: column; gap: 12px; }
        .vqp-card { padding: 16px; }
        .vqp-loading { color: var(--text-muted); font-size: 13px; }
        .vqp-summary { display: flex; flex-direction: column; gap: 10px; }
        .vqp-summary-left { display: flex; align-items: center; gap: 16px; }
        .vqp-level { display: flex; align-items: center; gap: 6px; font-family: var(--font-display); font-size: 16px; font-weight: 700; color: var(--text-primary); }
        .vqp-xp { font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: 8px; }
        .vqp-xp strong { color: var(--text-primary); font-family: var(--font-mono); font-size: 14px; }
        .vqp-xp-bar { height: 6px; background: var(--bg-input); border-radius: var(--radius-full); overflow: hidden; }
        .vqp-xp-fill { height: 100%; background: linear-gradient(90deg, var(--cyan), var(--purple)); transition: width 0.4s ease; }
        .vqp-epic-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; gap: 12px; flex-wrap: wrap; }
        .vqp-epic-title { font-weight: 600; color: var(--text-primary); font-size: 13px; }
        .vqp-epic-meta { display: flex; align-items: center; gap: 10px; font-size: 11px; color: var(--text-muted); }
        .vqp-epic-pct { font-family: var(--font-mono); color: var(--cyan); }
        .vqp-stories { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
        .vqp-story { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: var(--radius-sm); font-size: 12px; }
        .vqp-story:hover { background: var(--bg-hover); }
        .vqp-story-title { flex: 1; color: var(--text-secondary); }
        .vqp-story-done .vqp-story-title { color: var(--text-muted); text-decoration: line-through; }
        .vqp-story-xp { font-family: var(--font-mono); font-size: 10px; color: var(--cyan-dim); }
      `}</style>
    </div>
  );
}
