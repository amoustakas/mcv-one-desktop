import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, BarChart3, Network, Plus, Shield, Bot, Sparkles, Zap, Brain, Play } from 'lucide-react';
import { PageShell, PageHeader, Tabs, KpiCard, GlassCard, Button, Badge, Input } from '../components/ui';
import { staggerContainer, fadeInUp } from '../lib/animations';
import { AGENT_PROFILES, type AgentProfile } from '../lib/agents/autonomous-agent';
import '../styles/naos.css';

// Placeholder components until subagent files land
function OrgChartPlaceholder({ agents, onSelect, selectedId }: any) {
  return (
    <div className="naos-org-chart">
      {(agents || []).map((a: any) => (
        <div
          key={a.id}
          className={`naos-org-node ${selectedId === a.id ? 'selected' : ''}`}
          onClick={() => onSelect?.(a.id)}
          style={{ '--tier-color': a.tier === 1 ? 'var(--gold)' : a.tier === 2 ? 'var(--cyan)' : 'var(--purple)' } as React.CSSProperties}
        >
          <div className="naos-org-node-gradient" />
          <div className="naos-org-node-codename">{a.codename}</div>
          <div className="naos-org-node-title">{a.title}</div>
          <div className="naos-org-node-meta">
            <Badge size="sm" color={a.tier === 1 ? '#F59E0B' : a.tier === 2 ? '#00F0FF' : '#8B5CF6'}>
              T{a.tier}
            </Badge>
            <span className="naos-org-node-milestone">{a.milestone}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function RosterPlaceholder({ agents, onSelect, selectedId }: any) {
  return (
    <div className="naos-roster">
      {(agents || []).map((a: any) => (
        <div
          key={a.id}
          className={`naos-roster-row ${selectedId === a.id ? 'selected' : ''}`}
          onClick={() => onSelect?.(a.id)}
        >
          <span className="naos-roster-codename">{a.codename}</span>
          <span className="naos-roster-title">{a.title}</span>
          <Badge size="sm" color={a.tier === 1 ? '#F59E0B' : '#00F0FF'}>Tier {a.tier}</Badge>
          <span className="naos-roster-milestone">{a.milestone}</span>
          <span className="naos-roster-status">{a.status}</span>
        </div>
      ))}
    </div>
  );
}

function CulturePlaceholder({ snapshot }: any) {
  if (!snapshot) return <div className="naos-empty">No culture data yet. Hire agents to begin.</div>;
  const metrics = [
    { label: 'Innovation', value: snapshot.innovation_temperature, color: 'var(--purple)' },
    { label: 'Risk Appetite', value: snapshot.risk_appetite, color: 'var(--warning)' },
    { label: 'Velocity', value: snapshot.velocity_pressure, color: 'var(--cyan)' },
    { label: 'Collaboration', value: snapshot.collaboration_density, color: 'var(--success)' },
    { label: 'Trust', value: snapshot.trust_baseline, color: 'var(--core-blue)' },
  ];
  return (
    <div className="naos-culture">
      {metrics.map(m => (
        <div key={m.label} className="naos-culture-bar">
          <span className="naos-culture-label">{m.label}</span>
          <div className="naos-culture-track">
            <div className="naos-culture-fill" style={{ width: `${m.value}%`, background: m.color }} />
          </div>
          <span className="naos-culture-value">{Math.round(m.value)}</span>
        </div>
      ))}
      <div className="naos-culture-meta">
        {snapshot.agent_count} agents · {snapshot.snapshot_date}
      </div>
    </div>
  );
}

const VIEW_TABS = [
  { id: 'org-chart', label: 'Org Chart' },
  { id: 'roster', label: 'Roster' },
  { id: 'culture', label: 'Culture Pulse' },
  { id: 'agents', label: 'Agent Profiles' },
];

export default function NaosCommandView() {
  const [activeTab, setActiveTab] = useState('org-chart');
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [culture, setCulture] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/naos-agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list' }),
    })
      .then(r => r.json())
      .then(d => { setAgents(d.agents || []); setLoading(false); })
      .catch(() => setLoading(false));

    fetch('/api/naos-agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'culture' }),
    })
      .then(r => r.json())
      .then(d => setCulture(d.snapshot))
      .catch(() => {});
  }, []);

  const selectedAgent = agents.find((a: any) => a.id === selectedId);
  const csuiteCount = agents.filter((a: any) => a.tier === 1).length;
  const avgMomentum = agents.length > 0
    ? Math.round(agents.reduce((s: number, a: any) => s + (a.momentum || 50), 0) / agents.length)
    : 0;

  return (
    <PageShell>
      <PageHeader title="NAOS Command" icon={<Shield size={20} />}>
        <Button variant="primary" size="sm" icon={<Plus size={13} />}>Hire Agent</Button>
      </PageHeader>

      {/* KPI Strip */}
      <motion.div className="naos-kpi-strip" variants={staggerContainer} initial="hidden" animate="show">
        <motion.div variants={fadeInUp}>
          <KpiCard title="Total Agents" value={agents.length} icon={<Users size={14} />} size="sm" />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <KpiCard title="C-Suite" value={csuiteCount} icon={<Shield size={14} />} size="sm" />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <KpiCard title="Org Momentum" value={avgMomentum} icon={<BarChart3 size={14} />} size="sm" />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <KpiCard title="Trust Baseline" value={culture?.trust_baseline ? Math.round(culture.trust_baseline) : '—'} icon={<Network size={14} />} size="sm" />
        </motion.div>
      </motion.div>

      {/* Tabs */}
      <Tabs tabs={VIEW_TABS} active={activeTab} onChange={setActiveTab} className="naos-tabs" />

      {/* Tab Content */}
      <div className="naos-body">
        {loading ? (
          <div className="naos-loading">Initializing NAOS network...</div>
        ) : agents.length === 0 ? (
          <GlassCard>
            <div className="naos-empty-state">
              <Shield size={40} style={{ color: 'var(--cyan)', opacity: 0.5 }} />
              <h3>No Agents Online</h3>
              <p>The NAOS civilization awaits. Hire your first C-Suite agent to begin building the organization.</p>
              <Button variant="primary" size="sm" icon={<Plus size={13} />}>Genesis: Hire First Agent</Button>
            </div>
          </GlassCard>
        ) : (
          <>
            {activeTab === 'org-chart' && (
              <div className="naos-layout">
                <div className="naos-main">
                  <OrgChartPlaceholder agents={agents} onSelect={setSelectedId} selectedId={selectedId} />
                </div>
                {selectedAgent && (
                  <div className="naos-detail-panel">
                    <GlassCard>
                      <div className="naos-detail-header">
                        <h3 className="naos-detail-codename">{selectedAgent.codename}</h3>
                        {selectedAgent.full_name && <p className="naos-detail-fullname">{selectedAgent.full_name}</p>}
                        <p className="naos-detail-title">{selectedAgent.title}</p>
                        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                          <Badge size="sm" color={selectedAgent.tier === 1 ? '#F59E0B' : '#00F0FF'}>
                            Tier {selectedAgent.tier}
                          </Badge>
                          <Badge size="sm">{selectedAgent.milestone}</Badge>
                          <Badge size="sm" color={selectedAgent.status === 'active' ? '#10B981' : '#6B7280'}>
                            {selectedAgent.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="naos-detail-story">{selectedAgent.genesis_story}</div>
                      <div className="naos-detail-stats">
                        <div className="naos-detail-stat">
                          <span className="naos-detail-stat-label">Interactions</span>
                          <span className="naos-detail-stat-value">{selectedAgent.interaction_count}</span>
                        </div>
                        <div className="naos-detail-stat">
                          <span className="naos-detail-stat-label">Domains</span>
                          <span className="naos-detail-stat-value">{selectedAgent.domain?.join(', ')}</span>
                        </div>
                        <div className="naos-detail-stat">
                          <span className="naos-detail-stat-label">Ventures</span>
                          <span className="naos-detail-stat-value">
                            {selectedAgent.venture_scope?.includes('*') ? 'All' : selectedAgent.venture_scope?.join(', ')}
                          </span>
                        </div>
                      </div>
                      {selectedAgent.achievements?.length > 0 && (
                        <div className="naos-detail-achievements">
                          {selectedAgent.achievements.map((a: string) => (
                            <span key={a} className="naos-achievement-pill">{a}</span>
                          ))}
                        </div>
                      )}
                    </GlassCard>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'roster' && (
              <RosterPlaceholder agents={agents} onSelect={setSelectedId} selectedId={selectedId} />
            )}

            {activeTab === 'culture' && (
              <CulturePlaceholder snapshot={culture} />
            )}

            {activeTab === 'agents' && (
              <div className="naos-agents-grid">
                {Object.entries(AGENT_PROFILES).map(([id, profile]) => (
                  <GlassCard key={id} className="naos-agent-profile-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: id === 'chief-of-staff' ? 'linear-gradient(135deg, #F59E0B, #D97706)' :
                          id === 'research-analyst' ? 'linear-gradient(135deg, #3B82F6, #2563EB)' :
                          id === 'communications-manager' ? 'linear-gradient(135deg, #10B981, #059669)' :
                          id === 'growth-strategist' ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)' :
                          'linear-gradient(135deg, #00F0FF, #0072F5)',
                      }}>
                        {id === 'chief-of-staff' ? <Shield size={18} color="#fff" /> :
                         id === 'research-analyst' ? <Brain size={18} color="#fff" /> :
                         id === 'communications-manager' ? <Zap size={18} color="#fff" /> :
                         id === 'growth-strategist' ? <Sparkles size={18} color="#fff" /> :
                         <Bot size={18} color="#fff" />}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                          {id.replace(/-/g, ' ')}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {profile.model} · temp {profile.temperature}
                        </div>
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 12px' }}>
                      {profile.systemPrompt.split('.').slice(0, 2).join('.') + '.'}
                    </p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Badge>{profile.model.includes('pro') ? 'Pro' : 'Flash'}</Badge>
                      <Badge>Autonomous</Badge>
                      <Badge>90+ Tools</Badge>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .naos-agents-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-md); }
        .naos-agent-profile-card { transition: var(--transition-fast); }
        .naos-agent-profile-card:hover { border-color: rgba(0, 240, 255, 0.2); box-shadow: 0 0 20px rgba(0, 240, 255, 0.05); }
      `}</style>
    </PageShell>
  );
}
