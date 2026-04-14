import { useCallback, useEffect, useMemo, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { motion } from 'framer-motion';
import { PageShell, PageHeader, GlassCard, Badge, Button, GridLayout } from '../ui';
import { staggerContainer, fadeInUp } from '../../lib/animations';
import { useNavigation, type ViewId } from '../../stores/navigation';
import { apiPost } from '../../lib/api/client';
import MemoryShelf from '../MemoryShelf';
import type { SuiteDefinition, SuiteTool } from '../../lib/suites/definitions';

interface SuiteLayoutProps {
  suite: SuiteDefinition;
}

interface AgentLite {
  id: string;
  codename: string;
  title: string;
  tier: number;
  domain: string[];
  status: string;
  milestone: string;
}

interface EpicLite {
  id: string;
  title: string;
  status: string;
  priority: string;
  progress_pct: number;
  venture_id?: string | null;
}

function Icon({ name, size = 18, color }: { name?: string; size?: number; color?: string }) {
  if (!name) return null;
  const Cmp = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string; style?: React.CSSProperties }>>)[name];
  if (!Cmp) return null;
  return <Cmp size={size} color={color} />;
}

export default function SuiteLayout({ suite }: SuiteLayoutProps) {
  const { setView, mode, activeVenture } = useNavigation();
  const [agents, setAgents] = useState<AgentLite[]>([]);
  const [epics, setEpics] = useState<EpicLite[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);

  const ventureId = mode === 'venture' ? activeVenture || undefined : undefined;

  const loadAgents = useCallback(async () => {
    setLoadingAgents(true);
    try {
      const res = await apiPost<{ agents: AgentLite[] }>('/api/naos-agents', { action: 'list', limit: 200 });
      const codenameSet = new Set(suite.agents.map(c => c.toLowerCase()));
      setAgents((res.agents || []).filter(a => codenameSet.has(a.codename?.toLowerCase())));
    } catch {
      // silent — agents list is a nice-to-have, not a blocker
    } finally {
      setLoadingAgents(false);
    }
  }, [suite.agents]);

  const loadEpics = useCallback(async () => {
    try {
      const res = await apiPost<{ epics: EpicLite[] }>('/api/epics', { action: 'list', suite: suite.id, venture_id: ventureId });
      setEpics(res.epics || []);
    } catch {
      setEpics([]);
    }
  }, [suite.id, ventureId]);

  useEffect(() => {
    void loadAgents();
    void loadEpics();
  }, [loadAgents, loadEpics]);

  const toolsByCategory = useMemo(() => {
    const g: Record<string, SuiteTool[]> = {};
    for (const t of suite.tools) (g[t.category || 'manage'] ||= []).push(t);
    return g;
  }, [suite.tools]);

  const handleToolClick = (t: SuiteTool) => {
    if (t.viewId) {
      setView(t.viewId as ViewId);
    } else if (t.kitId) {
      // chat-only kit; surface hint. Future: open chat with kit pinned.
      window.dispatchEvent(new CustomEvent('mcv:suite-invoke-kit', { detail: { kitId: t.kitId, suite: suite.id } }));
    }
  };

  return (
    <PageShell scroll>
      <PageHeader
        icon={<Icon name={suite.icon} size={20} color={suite.color} />}
        title={suite.label}
        subtitle={suite.tagline}
      >
        <Button variant="secondary" size="sm" onClick={() => setView('epics' as ViewId)}>Epic Board</Button>
      </PageHeader>

      {/* Agent Roster */}
      <div className="suite-roster">
        <div className="suite-roster-label">Agents on duty</div>
        {loadingAgents && <div className="suite-roster-loading">Loading…</div>}
        {!loadingAgents && agents.length === 0 && (
          <div className="suite-roster-empty">
            {suite.agents.map(codename => (
              <span key={codename} className="suite-roster-chip suite-roster-chip-empty">
                {codename}
              </span>
            ))}
          </div>
        )}
        {agents.map(a => (
          <div key={a.id} className="suite-roster-chip" title={`${a.title} · tier ${a.tier} · ${a.milestone}`}>
            <span className="suite-roster-dot" style={{ background: a.status === 'active' ? 'var(--success)' : 'var(--text-muted)' }} />
            <span className="suite-roster-codename">{a.codename}</span>
            <span className="suite-roster-title">{a.title}</span>
          </div>
        ))}
      </div>

      {/* Tool Grid — grouped by category */}
      <div className="suite-body">
        <div className="suite-main">
          {Object.entries(toolsByCategory).map(([category, tools]) => (
            <div key={category} className="suite-cat">
              <h3 className="suite-cat-title">{category}</h3>
              <motion.div variants={staggerContainer} initial="hidden" animate="show">
                <GridLayout cols={4} gap="sm">
                  {tools.map((t, idx) => (
                    <motion.div key={(t.viewId || t.kitId || 'tool') + idx} variants={fadeInUp}>
                      <button className="suite-tool" onClick={() => handleToolClick(t)} style={{ borderColor: suite.color + '30' }}>
                        <div className="suite-tool-icon" style={{ color: suite.color }}>
                          <Icon name={t.icon || 'Square'} size={16} />
                        </div>
                        <div className="suite-tool-body">
                          <div className="suite-tool-label">{t.label}</div>
                          <div className="suite-tool-desc">{t.description}</div>
                        </div>
                        {t.kitId && !t.viewId && <Badge size="sm">chat</Badge>}
                      </button>
                    </motion.div>
                  ))}
                </GridLayout>
              </motion.div>
            </div>
          ))}

          {/* Suite-scoped Epics */}
          <div className="suite-cat">
            <h3 className="suite-cat-title">Active epics in this suite</h3>
            {epics.length === 0 ? (
              <div className="suite-empty">
                No epics yet. Ask NAOS to file one: <code>"Draft an epic for {suite.label.toLowerCase()} …"</code>
              </div>
            ) : (
              <GridLayout cols={2} gap="sm">
                {epics.slice(0, 6).map(e => (
                  <GlassCard key={e.id} className="suite-epic">
                    <div className="suite-epic-top">
                      <span className="suite-epic-title">{e.title}</span>
                      <Badge size="sm">{e.status}</Badge>
                    </div>
                    <div className="suite-epic-progress">
                      <div className="suite-epic-bar" style={{ width: `${e.progress_pct || 0}%`, background: suite.color }} />
                    </div>
                  </GlassCard>
                ))}
              </GridLayout>
            )}
          </div>
        </div>

        {/* Side panel: Memory Shelf filtered by suite tags */}
        <aside className="suite-side">
          <MemoryShelf
            ventureId={ventureId}
            tagFilter={suite.memoryTags}
            title={`${suite.label} Memory`}
            maxEntries={10}
            onOpenMemoryView={() => setView('memory' as ViewId)}
          />
        </aside>
      </div>

      <style>{`
        .suite-roster { display:flex; align-items:center; gap:8px; padding:0 20px 12px; flex-wrap:wrap; }
        .suite-roster-label { font-size:10px; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted); margin-right:6px; }
        .suite-roster-loading { font-size:11px; color:var(--text-muted); font-style:italic; }
        .suite-roster-empty { display:flex; gap:6px; }

        .suite-roster-chip { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border:1px solid var(--border); border-radius:var(--radius-full); background:var(--bg-card); font-size:11px; }
        .suite-roster-chip-empty { color:var(--text-muted); font-style:italic; }
        .suite-roster-dot { width:6px; height:6px; border-radius:50%; }
        .suite-roster-codename { font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-primary); }
        .suite-roster-title { color:var(--text-muted); font-size:10px; }

        .suite-body { display:grid; grid-template-columns:1fr 320px; gap:20px; padding:0 20px 20px; }
        @media (max-width:1100px) { .suite-body { grid-template-columns:1fr; } }

        .suite-main { display:flex; flex-direction:column; gap:24px; }
        .suite-cat { display:flex; flex-direction:column; gap:10px; }
        .suite-cat-title { font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; margin:0; padding-left:2px; }

        .suite-tool { display:flex; align-items:center; gap:10px; padding:12px 14px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); cursor:pointer; transition:all 0.2s; text-align:left; width:100%; }
        .suite-tool:hover { border-color:var(--border-active); transform:translateY(-2px); box-shadow:0 4px 16px rgba(0,0,0,0.3); }
        .suite-tool-icon { flex-shrink:0; width:32px; height:32px; display:flex; align-items:center; justify-content:center; background:var(--bg-elevated); border-radius:var(--radius-sm); }
        .suite-tool-body { flex:1; min-width:0; }
        .suite-tool-label { font-size:12px; font-weight:600; color:var(--text-primary); }
        .suite-tool-desc { font-size:10px; color:var(--text-muted); line-height:1.3; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

        .suite-empty { font-size:11px; color:var(--text-muted); padding:12px; border:1px dashed var(--border); border-radius:var(--radius-sm); }
        .suite-empty code { font-family:var(--font-mono); font-size:10px; color:var(--cyan); background:var(--bg-elevated); padding:1px 4px; border-radius:3px; }

        .suite-epic { padding:10px 12px; display:flex; flex-direction:column; gap:6px; }
        .suite-epic-top { display:flex; align-items:center; justify-content:space-between; gap:6px; }
        .suite-epic-title { font-size:12px; font-weight:600; color:var(--text-primary); flex:1; }
        .suite-epic-progress { height:3px; background:var(--bg-elevated); border-radius:2px; overflow:hidden; }
        .suite-epic-bar { height:100%; transition:width 0.3s; }

        .suite-side { display:flex; flex-direction:column; gap:12px; }
      `}</style>
    </PageShell>
  );
}
