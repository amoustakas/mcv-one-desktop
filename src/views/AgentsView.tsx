// AgentsView — the team roster surface. Phase 1 of the ecosystem build.
// Philosophy: feedback_feels_real.md (Elon + team at every interaction).
// Plan: C:\Users\moust\.claude\plans\agent-roster-foundation.md

import { useMemo, useState } from 'react';
import { Users, Network, Activity, Briefcase, GraduationCap, UserPlus } from 'lucide-react';
import { useAgents, type AgentPersona } from '../hooks/use-agents';
import { PageHeader, PageShell, GlassCard, Badge, EmptyState } from '../components/ui';

type AgentsTab = 'roster' | 'org-chart' | 'activity' | 'workflows' | 'training' | 'hiring';

const DEPARTMENT_META: Record<string, { label: string; description: string; order: number }> = {
  chief_of_staff:       { label: 'Chief of Staff',        description: 'Always-on co-decision partner at Tony\'s side', order: 0 },
  finance_capital:      { label: 'Finance & Capital',     description: 'Treasury, distributions, cap tables, royalty graphs',     order: 1 },
  legal_risk:           { label: 'Legal & Risk',          description: 'Compliance rulesets, OFAC, accreditation, jurisdictional gates', order: 2 },
  legal:                { label: 'Legal Counsel',         description: 'Docs, filings, contracts, structure', order: 3 },
  ir_comms:             { label: 'Investor Relations',    description: 'Updates, comms, launchpad content, quarterly reports', order: 4 },
  growth_marketing:     { label: 'Growth & Marketing',    description: 'Acquisition, funnels, content strategy',  order: 5 },
  brand_content:        { label: 'Brand & Creative',      description: 'Visual identity, creative review, brand voice', order: 6 },
  engineering_product:  { label: 'Engineering & Product', description: 'Code review, PRs, deploys, product',       order: 7 },
  ops_infra:            { label: 'Operations & Infra',    description: 'Cron, alerts, billing, support',         order: 8 },
  strategy_research:    { label: 'Strategy & Research',   description: 'Roadmap, user journeys, market',         order: 9 },
  principal:            { label: 'Principal',             description: 'Tony', order: -1 },
};

const SENIORITY_LABEL: Record<string, string> = {
  principal: 'Principal',
  chief_of_staff: 'Chief of Staff',
  chief: 'Chief',
  senior: 'Senior',
  associate: 'Associate',
  contributor: 'Contributor',
};

export default function AgentsView() {
  const [tab, setTab] = useState<AgentsTab>('roster');

  const tabs: Array<{ id: AgentsTab; label: string; icon: React.ComponentType<{ className?: string }>; ready: boolean }> = [
    { id: 'roster',    label: 'Roster',          icon: Users,       ready: true },
    { id: 'org-chart', label: 'Org Chart',       icon: Network,     ready: false },
    { id: 'activity',  label: 'Activity',        icon: Activity,    ready: false },
    { id: 'workflows', label: 'Workflows',       icon: Briefcase,   ready: false },
    { id: 'training',  label: 'Training Studio', icon: GraduationCap, ready: false },
    { id: 'hiring',    label: 'Hiring',          icon: UserPlus,    ready: false },
  ];

  return (
    <PageShell>
      <PageHeader
        title="The Team"
        description="The specialists who run the MCV ecosystem beside you. Each one is a named professional with their own persona, voice, tool belt, and scope. Mention them by handle, route chats through them, or schedule them to run on cron."
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => t.ready && setTab(t.id)}
              disabled={!t.ready}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10, fontSize: 13,
                background: active ? 'var(--color-brand-electric)' : 'var(--surface-elevated)',
                color: active ? 'var(--surface-base)' : t.ready ? 'var(--text-primary)' : 'var(--text-muted)',
                border: active ? '1px solid var(--color-brand-electric)' : '1px solid var(--border-subtle)',
                cursor: t.ready ? 'pointer' : 'not-allowed', opacity: t.ready ? 1 : 0.5,
                fontWeight: active ? 600 : 500,
              }}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {!t.ready && <span style={{ fontSize: 10, opacity: 0.7 }}>(Session B+)</span>}
            </button>
          );
        })}
      </div>

      {tab === 'roster' && <RosterTab />}
    </PageShell>
  );
}

// ─── Roster Tab ───────────────────────────────────────────────────────

function RosterTab() {
  const { data, isLoading } = useAgents();
  const [deptFilter, setDeptFilter] = useState<string>('');

  const grouped = useMemo(() => {
    const all = (data ?? []) as AgentPersona[];
    const filtered = deptFilter ? all.filter((a) => a.department === deptFilter) : all;
    const groups = new Map<string, AgentPersona[]>();
    for (const a of filtered) {
      if (!groups.has(a.department)) groups.set(a.department, []);
      groups.get(a.department)!.push(a);
    }
    return Array.from(groups.entries()).sort((a, b) => {
      return (DEPARTMENT_META[a[0]]?.order ?? 99) - (DEPARTMENT_META[b[0]]?.order ?? 99);
    });
  }, [data, deptFilter]);

  const allDepts = useMemo(() => {
    const set = new Set<string>();
    for (const a of (data ?? []) as AgentPersona[]) set.add(a.department);
    return Array.from(set).sort((a, b) => (DEPARTMENT_META[a]?.order ?? 99) - (DEPARTMENT_META[b]?.order ?? 99));
  }, [data]);

  if (isLoading) return <p style={{ color: 'var(--text-muted)' }}>Loading the team…</p>;
  if (!data || data.length === 0) {
    return <EmptyState title="No agents yet" description="Run the agent_foundation seed (scripts/seed-agent-foundation.sql or Supabase MCP apply_migration)." />;
  }

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Department:</span>
        <button
          onClick={() => setDeptFilter('')}
          style={filterPill(deptFilter === '')}
        >
          All ({data.length})
        </button>
        {allDepts.map((d) => (
          <button
            key={d}
            onClick={() => setDeptFilter(d)}
            style={filterPill(deptFilter === d)}
          >
            {DEPARTMENT_META[d]?.label ?? d} ({(data as AgentPersona[]).filter((a) => a.department === d).length})
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 24 }}>
        {grouped.map(([dept, agents]) => (
          <div key={dept}>
            <div style={{ marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                {DEPARTMENT_META[dept]?.label ?? dept}
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                {DEPARTMENT_META[dept]?.description ?? ''}
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
              {agents.map((a) => <AgentCard key={a.id} agent={a} />)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function AgentCard({ agent }: { agent: AgentPersona }) {
  const accent = agent.accent_color ?? '#64748B';
  const initials = agent.full_name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <GlassCard>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* Avatar — gradient placeholder; Session A.5 swaps in Gemini portraits */}
        <div
          style={{
            width: 56, height: 56, borderRadius: 16, flexShrink: 0,
            background: `linear-gradient(135deg, ${accent} 0%, ${accent}44 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--surface-base)', fontWeight: 700, fontSize: 18,
            boxShadow: `0 4px 16px ${accent}33`,
          }}
        >
          {agent.avatar_url ? (
            <img src={agent.avatar_url} alt={agent.full_name} style={{ width: '100%', height: '100%', borderRadius: 16, objectFit: 'cover' }} />
          ) : (
            initials
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <strong style={{ fontSize: 15 }}>{agent.full_name}</strong>
            <code style={{ fontSize: 12, color: accent, fontWeight: 500 }}>{agent.handle}</code>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {agent.title}
            {agent.scope_kind === 'venture' && agent.scope_value && (
              <> · <Badge>{agent.scope_value}</Badge></>
            )}
          </div>
          <p style={{
            fontSize: 13, color: 'var(--text-primary)', marginTop: 10,
            lineHeight: 1.5, marginBottom: 10,
          }}>
            {agent.persona_bio}
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge>{SENIORITY_LABEL[agent.seniority] ?? agent.seniority}</Badge>
            {agent.interaction_mode === 'always_on' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#22C55E' }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: '#22C55E' }} />
                always on
              </span>
            )}
            {agent.kit_allowlist.length > 0 && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {agent.kit_allowlist.length} kit{agent.kit_allowlist.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────

function filterPill(active: boolean): React.CSSProperties {
  return {
    padding: '5px 10px', borderRadius: 999, fontSize: 12,
    background: active ? 'var(--color-brand-electric)' : 'var(--surface-elevated)',
    color: active ? 'var(--surface-base)' : 'var(--text-primary)',
    border: '1px solid ' + (active ? 'var(--color-brand-electric)' : 'var(--border-subtle)'),
    cursor: 'pointer', fontWeight: active ? 600 : 500,
  };
}
