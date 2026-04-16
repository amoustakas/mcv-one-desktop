// AgentProfileView — deep-dive page per agent.
// Meet the specialist. Read their bio, see their voice profile, know their
// tool belt, understand their data scope. Future: start a conversation,
// schedule a workflow, review activity.

import { ArrowLeft, MessageCircle, Settings2, Clock, Zap, Shield, Briefcase } from 'lucide-react';
import { useAgent, useAgents } from '../hooks/use-agents';
import { useNavigation } from '../stores/navigation';
import { PageShell, GlassCard, Badge, EmptyState } from '../components/ui';

const DEPARTMENT_LABEL: Record<string, string> = {
  chief_of_staff: 'Chief of Staff',
  finance_capital: 'Finance & Capital',
  legal_risk: 'Legal & Risk',
  legal: 'Legal Counsel',
  ir_comms: 'Investor Relations',
  growth_marketing: 'Growth & Marketing',
  brand_content: 'Brand & Creative',
  engineering_product: 'Engineering & Product',
  ops_infra: 'Operations & Infra',
  strategy_research: 'Strategy & Research',
};

const SENIORITY_LABEL: Record<string, string> = {
  principal: 'Principal',
  chief_of_staff: 'Chief of Staff',
  chief: 'Chief',
  senior: 'Senior',
  associate: 'Associate',
  contributor: 'Contributor',
};

export default function AgentProfileView() {
  const activeHandle = useNavigation((s) => s.activeAgentHandle);
  const setView = useNavigation((s) => s.setView);
  const openAgentProfile = useNavigation((s) => s.openAgentProfile);
  const { data: agent, isLoading } = useAgent(activeHandle);
  const { data: allAgents } = useAgents();

  if (!activeHandle) {
    return (
      <PageShell>
        <EmptyState
          title="No agent selected"
          description="Return to The Team and pick someone."
          action={{ label: 'Back to The Team', onClick: () => setView('agents') }}
        />
      </PageShell>
    );
  }

  if (isLoading || !agent) {
    return (
      <PageShell>
        <p style={{ color: 'var(--text-muted)' }}>Loading agent…</p>
      </PageShell>
    );
  }

  const accent = agent.accent_color ?? '#64748B';
  const initials = agent.full_name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  const voice = (agent.voice_profile ?? {}) as {
    tone?: string; formality?: string; hedges?: string; humor?: string;
    pace?: string; signature_phrases?: string[];
  };
  const manager = agent.reports_to_agent_id
    ? (allAgents ?? []).find((a) => a.id === agent.reports_to_agent_id)
    : null;
  const reports = (allAgents ?? []).filter((a) => a.reports_to_agent_id === agent.id);
  const dataScopes = (agent.data_scopes ?? {}) as { ventures?: string[]; permissions?: string[] };

  return (
    <PageShell>
      <button
        onClick={() => setView('agents')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20,
          padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)', borderRadius: 8, cursor: 'pointer', fontSize: 12,
        }}
      >
        <ArrowLeft className="w-3.5 h-3.5" /> The Team
      </button>

      {/* Hero — avatar + name + title */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 24, alignItems: 'start',
        padding: 24, borderRadius: 16,
        background: `linear-gradient(135deg, ${accent}11 0%, transparent 60%)`,
        border: `1px solid ${accent}33`,
        marginBottom: 24,
      }}>
        <div style={{
          width: 120, height: 120, borderRadius: 24,
          background: `linear-gradient(135deg, ${accent} 0%, ${accent}44 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--surface-base)', fontWeight: 700, fontSize: 36,
          boxShadow: `0 12px 40px ${accent}44`, flexShrink: 0,
        }}>
          {agent.avatar_url ? (
            <img src={agent.avatar_url} alt={agent.full_name} style={{ width: '100%', height: '100%', borderRadius: 24, objectFit: 'cover' }} />
          ) : initials}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>{agent.full_name}</h1>
            <code style={{ fontSize: 16, color: accent, fontWeight: 600 }}>{agent.handle}</code>
          </div>
          <div style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 4 }}>
            {agent.title} · {DEPARTMENT_LABEL[agent.department] ?? agent.department}
            {agent.scope_kind === 'venture' && agent.scope_value && (<> · venture: <Badge>{agent.scope_value}</Badge></>)}
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.6, marginTop: 16, marginBottom: 0 }}>
            {agent.persona_bio}
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge>{SENIORITY_LABEL[agent.seniority] ?? agent.seniority}</Badge>
            {agent.interaction_mode === 'always_on' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#22C55E', fontWeight: 500 }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
                always on
              </span>
            )}
            {agent.interaction_mode === 'scheduled' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#F59E0B' }}>
                <Clock className="w-3 h-3" /> scheduled
              </span>
            )}
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              hired {new Date(agent.hired_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 180 }}>
          <button
            disabled
            style={{
              padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              background: accent, color: 'var(--surface-base)', border: 'none',
              cursor: 'not-allowed', opacity: 0.6,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
            title="Session B will wire full chat routing"
          >
            <MessageCircle className="w-4 h-4" /> Start conversation
            <span style={{ fontSize: 10, opacity: 0.8 }}>(Session B)</span>
          </button>
          <button
            disabled
            style={{
              padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500,
              background: 'transparent', color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)', cursor: 'not-allowed', opacity: 0.6,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
            title="Session E will wire the Training Studio"
          >
            <Settings2 className="w-4 h-4" /> Edit persona
            <span style={{ fontSize: 10, opacity: 0.8 }}>(Session E)</span>
          </button>
        </div>
      </div>

      {/* Grid: Voice + Tools + Scope + Org */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {/* Voice profile */}
        <GlassCard>
          <SectionHead icon={<Zap className="w-4 h-4" />} label="Voice Profile" />
          <DefRow label="Tone"      value={voice.tone} />
          <DefRow label="Pace"      value={voice.pace} />
          <DefRow label="Formality" value={voice.formality} />
          <DefRow label="Hedges"    value={voice.hedges} />
          <DefRow label="Humor"     value={voice.humor} />
          {voice.signature_phrases && voice.signature_phrases.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>SIGNATURE PHRASES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {voice.signature_phrases.map((p, i) => (
                  <div key={i} style={{
                    fontStyle: 'italic', fontSize: 13, padding: '6px 10px',
                    background: 'var(--surface-elevated)', borderRadius: 6,
                    borderLeft: `3px solid ${accent}`,
                  }}>
                    "{p}"
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassCard>

        {/* Tool belt */}
        <GlassCard>
          <SectionHead icon={<Briefcase className="w-4 h-4" />} label="Tool Belt" />
          {agent.kit_allowlist.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No kits allowlisted.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {agent.kit_allowlist.map((k) => (
                <code key={k} style={{
                  fontSize: 12, padding: '4px 8px', borderRadius: 6,
                  background: 'var(--surface-elevated)', border: '1px solid var(--border-subtle)',
                }}>
                  {k}
                </code>
              ))}
            </div>
          )}
          {agent.tool_allowlist && agent.tool_allowlist.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>SPECIFIC TOOLS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {agent.tool_allowlist.map((t) => (
                  <span key={t} style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t}</span>
                ))}
              </div>
            </div>
          )}
        </GlassCard>

        {/* Data scope */}
        <GlassCard>
          <SectionHead icon={<Shield className="w-4 h-4" />} label="Data Scope" />
          <DefRow label="Scope Kind" value={agent.scope_kind} />
          {agent.scope_value && <DefRow label="Scope Value" value={agent.scope_value} />}
          {dataScopes.ventures && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>VENTURES</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {dataScopes.ventures.map((v) => <Badge key={v}>{v}</Badge>)}
              </div>
            </div>
          )}
          {dataScopes.permissions && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>PERMISSIONS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {dataScopes.permissions.map((p) => (
                  <code key={p} style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: 'var(--surface-elevated)' }}>{p}</code>
                ))}
              </div>
            </div>
          )}
        </GlassCard>

        {/* Org */}
        <GlassCard>
          <SectionHead icon={<Briefcase className="w-4 h-4" />} label="Reporting" />
          {manager ? (
            <div
              onClick={() => openAgentProfile(manager.handle)}
              style={{ cursor: 'pointer', padding: 8, borderRadius: 8, background: 'var(--surface-elevated)', marginBottom: 10 }}
            >
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>REPORTS TO</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>
                {manager.full_name} <span style={{ color: manager.accent_color ?? 'inherit', fontSize: 12 }}>{manager.handle}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{manager.title}</div>
            </div>
          ) : (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>REPORTS TO</div>
              <div style={{ fontSize: 13, marginTop: 2 }}>Tony (Principal)</div>
            </div>
          )}

          {reports.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, marginBottom: 6 }}>MANAGES ({reports.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {reports.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => openAgentProfile(r.handle)}
                    style={{ cursor: 'pointer', padding: 8, borderRadius: 6, background: 'var(--surface-elevated)' }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                      {r.full_name} <span style={{ color: r.accent_color ?? 'inherit', fontSize: 11 }}>{r.handle}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.title}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </GlassCard>
      </div>
    </PageShell>
  );
}

function SectionHead({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--text-primary)' }}>
      {icon}
      <strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</strong>
    </div>
  );
}

function DefRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '4px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 13 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}
