import { useEffect, useState } from 'react';
import { Activity, CheckSquare, Clock, Users, Zap, FileText, ExternalLink } from 'lucide-react';
import { GlassCard, StatCard, GridLayout, EmptyState, Badge } from '../ui';
import { useTasks } from '../../hooks/use-tasks';
import { useActivities } from '../../hooks/use-crm';
import { apiPost } from '../../lib/api/client';
import type { Venture } from '../../lib/ventures';

interface QuestRow {
  epic_id: string;
  epic_title: string;
  story_id?: string;
  story_title?: string;
  story_status?: string;
  story_xp?: number;
  effective_status: string;
}

export default function VentureOpsPanel({ venture }: { venture: Venture }) {
  const { data: tasksRaw = [] } = useTasks(venture.id);
  const { data: activities = [] } = useActivities(venture.id);
  const [quests, setQuests] = useState<QuestRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiPost<{ quests: QuestRow[] }>('/api/ventures', { action: 'list-quests', venture_id: venture.id });
        if (!cancelled) setQuests(data.quests || []);
      } catch {
        if (!cancelled) setQuests([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [venture.id]);

  const activeTasks = tasksRaw.filter((t: { status?: string }) => t.status !== 'done' && t.status !== 'completed');
  const todaysTasks = activeTasks.slice(0, 5);
  const inProgressQuests = quests.filter(q => q.effective_status === 'in-progress' && q.story_id);
  const recentActivity = activities.slice(0, 8);

  return (
    <div className="vop-root">
      <GridLayout cols={4} gap="sm">
        <StatCard icon={<CheckSquare size={13} />} label="Active Tasks" value={activeTasks.length} />
        <StatCard icon={<Activity size={13} />} label="In-Progress Quests" value={inProgressQuests.length} />
        <StatCard icon={<Zap size={13} />} label="Activities (recent)" value={activities.length} />
        <StatCard icon={<Users size={13} />} label="Team Members" value={venture.team?.length ?? 0} />
      </GridLayout>

      <div className="vop-grid">
        <GlassCard className="vop-card">
          <div className="vop-card-head">
            <Clock size={13} />
            <h4 className="vop-h4">Today's tasks</h4>
          </div>
          {todaysTasks.length === 0 ? (
            <EmptyState icon={<CheckSquare size={14} />} title="All clear" description="No open tasks for this venture." />
          ) : (
            <ul className="vop-task-list">
              {todaysTasks.map((t: { id: string; title: string; status?: string; priority?: string }) => (
                <li key={t.id} className="vop-task">
                  <span className="vop-task-title">{t.title}</span>
                  {t.priority && <Badge color={t.priority === 'high' ? '#EF4444' : t.priority === 'medium' ? '#F59E0B' : '#6B7280'}>{t.priority}</Badge>}
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard className="vop-card">
          <div className="vop-card-head">
            <Zap size={13} />
            <h4 className="vop-h4">Active Claude Code sessions</h4>
          </div>
          {loading ? (
            <div className="vop-loading">Loading…</div>
          ) : inProgressQuests.length === 0 ? (
            <EmptyState icon={<Zap size={14} />} title="No active sessions" description="Claim a Story from the Quests tab to start a session." />
          ) : (
            <ul className="vop-quest-list">
              {inProgressQuests.slice(0, 5).map(q => (
                <li key={q.story_id} className="vop-quest">
                  <div className="vop-quest-main">
                    <span className="vop-quest-title">{q.story_title}</span>
                    <span className="vop-quest-epic">{q.epic_title}</span>
                  </div>
                  <Badge color="#00F0FF">in-progress</Badge>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard className="vop-card vop-activity-card">
          <div className="vop-card-head">
            <Activity size={13} />
            <h4 className="vop-h4">Recent activity</h4>
          </div>
          {recentActivity.length === 0 ? (
            <EmptyState icon={<Activity size={14} />} title="No activity yet" description="Venture events, sync jobs, and org actions show up here." />
          ) : (
            <ul className="vop-activity-list">
              {recentActivity.map((a: { id: string; type?: string; meta?: unknown; created_at?: string }) => (
                <li key={a.id} className="vop-activity-item">
                  <span className="vop-activity-type">{a.type || 'event'}</span>
                  <span className="vop-activity-time">{a.created_at ? new Date(a.created_at).toLocaleString() : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>

      <style>{`
        .vop-root { display: flex; flex-direction: column; gap: 12px; }
        .vop-card { padding: 14px; }
        .vop-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .vop-activity-card { grid-column: 1 / -1; }
        .vop-card-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; color: var(--text-secondary); }
        .vop-h4 { margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-family: var(--font-display); }
        .vop-loading { color: var(--text-muted); font-size: 12px; }
        .vop-task-list, .vop-quest-list, .vop-activity-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
        .vop-task, .vop-quest, .vop-activity-item { display: flex; align-items: center; justify-content: space-between; padding: 7px 10px; border-radius: var(--radius-sm); font-size: 12px; gap: 10px; }
        .vop-task:hover, .vop-quest:hover, .vop-activity-item:hover { background: var(--bg-hover); }
        .vop-task-title, .vop-quest-title { color: var(--text-primary); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
        .vop-quest-main { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
        .vop-quest-epic { font-size: 10px; color: var(--text-muted); }
        .vop-activity-type { font-family: var(--font-mono); font-size: 11px; color: var(--cyan); }
        .vop-activity-time { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); }
      `}</style>
    </div>
  );
}
