// ProspectsView — Phase 2 admin funnel dashboard.
// Lists every prospect journey, grouped by track + status.
// Click a row → navigate to ProspectProfileView.
// Plan: C:\Users\moust\.claude\plans\nifty-launching-turtle.md

import { useMemo, useState } from 'react';
import { Users, UserPlus, CheckCircle2, Clock, AlertTriangle, Inbox, Link2, Copy, Check, Sparkles } from 'lucide-react';
import { useProspects, useCaptures, type JourneyWithProfile } from '../hooks/use-prospects';
import { useNavigation } from '../stores/navigation';
import { PageHeader, PageShell, GlassCard, Badge, EmptyState, Modal } from '../components/ui';
import { TRACKS, type JourneyStatus, type TrackName } from '@mcv/onboarding-sdk';
import type { ProspectCapture } from '@mcv/onboarding-sdk';
import { OperatorProspectIntakeWizard } from '../components/prospects/OperatorProspectIntakeWizard';

type Tab = 'active' | 'completed' | 'all' | 'captures';

const TRACK_ACCENT: Record<TrackName, string> = {
  investor_accredited: 'var(--color-brand-electric)',
  investor_retail:     'var(--color-brand-purple)',
  partner:             '#6EE7B7',
  creator:             '#F472B6',
  team_member:         '#FBBF24',
  ally:                '#A78BFA',
  waitlist:            '#94A3B8',
};

export default function ProspectsView() {
  const [tab, setTab] = useState<Tab>('active');
  const [trackFilter, setTrackFilter] = useState<TrackName | ''>('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [operatorOpen, setOperatorOpen] = useState(false);

  const statusFilter: JourneyStatus | undefined =
    tab === 'active' ? 'active' : tab === 'completed' ? 'completed' : undefined;

  const { data: journeys, isLoading } = useProspects({
    status: statusFilter,
    track: trackFilter || undefined,
  });
  const { data: captures, isLoading: capturesLoading } = useCaptures();

  const counts = useMemo(() => {
    const all = (journeys ?? []) as JourneyWithProfile[];
    return {
      total: all.length,
      active: all.filter((j) => j.status === 'active').length,
      completed: all.filter((j) => j.status === 'completed').length,
      paused: all.filter((j) => j.status === 'paused').length,
      abandoned: all.filter((j) => j.status === 'abandoned').length,
    };
  }, [journeys]);

  const tabs: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'active',    label: `Active (${counts.active})`,        icon: Clock },
    { id: 'completed', label: `Completed (${counts.completed})`,  icon: CheckCircle2 },
    { id: 'all',       label: `All (${counts.total})`,            icon: Users },
    { id: 'captures',  label: `Captures (${captures?.length ?? 0})`, icon: Inbox },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Onboarding Funnel"
        subtitle="Automated monitor for Phase 2 onboarding journeys — public wizard captures emails, journeys guide prospects to completion, completed journeys produce Pipeline rows you can track. This is NOT your working pipeline — see Pipeline for that."
      >
        <button
          onClick={() => setInviteOpen(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: 'var(--color-brand-electric)', color: 'var(--surface-base)',
            border: 'none', cursor: 'pointer',
          }}
        >
          <Link2 className="w-4 h-4" />
          Invite a prospect
        </button>
        <button
          onClick={() => setOperatorOpen(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: 'var(--color-brand-purple)', color: 'var(--surface-base)',
            border: 'none', cursor: 'pointer',
          }}
        >
          ⚡ New prospect (operator)
        </button>
      </PageHeader>

      {/* KPI bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <KpiTile icon={Clock}         label="In flight"    value={counts.active}    accent="var(--color-brand-electric)" />
        <KpiTile icon={CheckCircle2}  label="Completed"    value={counts.completed} accent="#6EE7B7" />
        <KpiTile icon={AlertTriangle} label="Paused"       value={counts.paused}    accent="#FBBF24" />
        <KpiTile icon={UserPlus}      label="Total"        value={counts.total}     accent="var(--color-brand-purple)" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10, fontSize: 13,
                background: active ? 'var(--color-brand-electric)' : 'var(--surface-elevated)',
                color: active ? 'var(--surface-base)' : 'var(--text-primary)',
                border: active ? '1px solid var(--color-brand-electric)' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
                fontWeight: active ? 600 : 500,
              }}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Track filter — only on journey tabs, not captures */}
      {tab !== 'captures' && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Track:</span>
          <button
            onClick={() => setTrackFilter('')}
            style={chipStyle(trackFilter === '')}
          >
            All
          </button>
          {(Object.keys(TRACKS) as TrackName[]).map((t) => (
            <button
              key={t}
              onClick={() => setTrackFilter(t)}
              style={chipStyle(trackFilter === t, TRACK_ACCENT[t])}
            >
              {TRACKS[t].label}
            </button>
          ))}
        </div>
      )}

      {/* Journey results */}
      {tab !== 'captures' && isLoading && <p style={{ color: 'var(--text-muted)' }}>Loading prospects…</p>}
      {tab !== 'captures' && !isLoading && (journeys?.length ?? 0) === 0 && (
        <EmptyState
          title="No journeys yet"
          description="Share your wizard link at /join/[venture] on apps/onboarding, or seed demo data with `npm run seed:prospects`."
        />
      )}
      {tab !== 'captures' && !isLoading && (journeys?.length ?? 0) > 0 && (
        <div style={{ display: 'grid', gap: 10 }}>
          {(journeys ?? []).map((j) => (
            <ProspectRow key={j.id} journey={j} />
          ))}
        </div>
      )}

      {/* Captures — early funnel */}
      {tab === 'captures' && <CapturesTab captures={captures ?? []} loading={capturesLoading} />}

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <OperatorProspectIntakeWizard open={operatorOpen} onClose={() => setOperatorOpen(false)} />
    </PageShell>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Sub-components
// ───────────────────────────────────────────────────────────────────────────

function KpiTile({
  icon: Icon, label, value, accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <GlassCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: `${accent}22`, color: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{value}</div>
        </div>
      </div>
    </GlassCard>
  );
}

function ProspectRow({ journey }: { journey: JourneyWithProfile }) {
  const selectProspectJourney = useNavigation((s) => s.selectProspectJourney);
  const trackMeta = TRACKS[journey.track as TrackName];
  const accent = TRACK_ACCENT[journey.track as TrackName] ?? 'var(--color-brand-purple)';
  const currentStep = journey.steps[journey.current_step_index];
  const progress = journey.steps.length === 0 ? 0 : Math.round((journey.current_step_index / journey.steps.length) * 100);

  const handleClick = () => selectProspectJourney(journey.id);

  return (
    <GlassCard onClick={handleClick} style={{ cursor: 'pointer' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '4px 1fr auto', gap: 14, padding: 14, alignItems: 'center' }}>
        <div style={{ width: 4, height: 52, background: accent, borderRadius: 2 }} />
        <div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              {journey.prospect_profile.full_name ?? journey.prospect_profile.email}
            </span>
            <Badge>{trackMeta?.label ?? journey.track}</Badge>
            <Badge>{journey.status}</Badge>
            {journey.prospect_profile.source_venture_id && (
              <Badge>{journey.prospect_profile.source_venture_id}</Badge>
            )}
            {journey.prospect_profile.intake_source === 'operator' && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                background: 'color-mix(in srgb, var(--color-brand-purple) 20%, transparent)',
                color: 'var(--color-brand-purple)',
              }}>
                ⚡ operator
              </span>
            )}
            {Boolean((journey.metadata as { effects_applied?: boolean }).effects_applied) && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600,
                background: 'rgba(110, 231, 183, 0.15)', color: '#6EE7B7',
                border: '1px solid rgba(110, 231, 183, 0.3)',
              }}>
                <Sparkles className="w-3 h-3" /> ecosystem
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
            <span>step: <b style={{ color: 'var(--text-secondary)' }}>{currentStep ?? '—'}</b></span>
            <span>progress: <b style={{ color: 'var(--text-secondary)' }}>{progress}%</b></span>
            <span>last activity: {new Date(journey.last_activity_at).toLocaleString()}</span>
          </div>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 18 }}>→</div>
      </div>
    </GlassCard>
  );
}

function chipStyle(active: boolean, accent?: string): React.CSSProperties {
  return {
    padding: '6px 12px', borderRadius: 20, fontSize: 12,
    background: active ? (accent ?? 'var(--color-brand-electric)') : 'var(--surface-elevated)',
    color: active ? 'var(--surface-base)' : 'var(--text-secondary)',
    border: '1px solid ' + (active ? (accent ?? 'var(--color-brand-electric)') : 'var(--border-subtle)'),
    cursor: 'pointer',
    fontWeight: active ? 600 : 500,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Captures tab — pre-journey leads (prospect_capture rows)
// ───────────────────────────────────────────────────────────────────────────

function CapturesTab({ captures, loading }: { captures: ProspectCapture[]; loading: boolean }) {
  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Loading captures…</p>;
  if (captures.length === 0) {
    return (
      <EmptyState
        title="No captures yet"
        description="Leads that submitted an email but didn't start a full journey land here — useful for re-engagement by the specialist."
      />
    );
  }
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {captures.map((c) => (
        <GlassCard key={c.id}>
          <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                {c.name ?? c.email}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {c.email}
                {c.venture_id && <> · via <b style={{ color: 'var(--text-secondary)' }}>{c.venture_id}</b></>}
                {' · '}{c.channel}
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {new Date(c.created_at).toLocaleString()}
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Invite modal — generates a shareable /join/[venture] URL
// ───────────────────────────────────────────────────────────────────────────

const VENTURES_WITH_LABEL: Array<{ id: string; label: string }> = [
  { id: '',             label: 'Generic (no venture scope)' },
  { id: 'mcv',          label: 'MCV One' },
  { id: 'futurestate',  label: 'FutureState' },
  { id: 'betedge',      label: 'BetEdge AI' },
  { id: 'warforge',     label: 'WarForge' },
  { id: 'mcvgg',        label: 'mcv.gg' },
  { id: 'edgeiq',       label: 'EdgeIQ Markets' },
  { id: 'arqlabs',      label: 'ARQ Labs' },
];

function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [track, setTrack] = useState<TrackName>('investor_accredited');
  const [venture, setVenture] = useState('');
  const [prefillEmail, setPrefillEmail] = useState('');
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin.replace(/\/$/, '') : 'https://onboarding.mcv.one';
  // Onboarding app ships on its own domain. If we detect local dev on 517x,
  // point at apps/onboarding's 3201. Otherwise assume production onboarding.mcv.one.
  const onboardingOrigin = typeof window !== 'undefined' && window.location.port.startsWith('51')
    ? `${window.location.protocol}//${window.location.hostname}:3201`
    : 'https://onboarding.mcv.one';

  const url = useMemo(() => {
    const base = venture ? `${onboardingOrigin}/join/${venture}` : `${onboardingOrigin}/start`;
    const params = new URLSearchParams();
    if (track !== 'investor_retail') params.set('track', track);
    if (prefillEmail.trim()) params.set('prefill', prefillEmail.trim());
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }, [venture, track, prefillEmail, onboardingOrigin]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail on insecure contexts — silently no-op
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="md" ariaLabel="Invite a prospect">
      <div style={{ padding: 24, background: 'var(--surface-base)', borderRadius: 12, minWidth: 440 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0, marginBottom: 4 }}>
          Invite a prospect
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, marginBottom: 18 }}>
          Pick a track + venture and share the link. The wizard will pre-fill what we already know and hand them to the right specialist.
        </p>

        <label style={labelStyle}>Track</label>
        <select value={track} onChange={(e) => setTrack(e.target.value as TrackName)} style={fieldStyle}>
          {(Object.keys(TRACKS) as TrackName[]).map((t) => (
            <option key={t} value={t}>{TRACKS[t].label} — {TRACKS[t].description}</option>
          ))}
        </select>

        <label style={labelStyle}>Venture (optional)</label>
        <select value={venture} onChange={(e) => setVenture(e.target.value)} style={fieldStyle}>
          {VENTURES_WITH_LABEL.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>

        <label style={labelStyle}>Pre-fill email (optional)</label>
        <input
          type="email" placeholder="alice@example.com"
          value={prefillEmail} onChange={(e) => setPrefillEmail(e.target.value)}
          style={fieldStyle}
        />

        <div style={{ marginTop: 18, padding: 12, background: 'var(--surface-elevated)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
            Shareable URL
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <code style={{ flex: 1, fontSize: 12, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{url}</code>
            <button
              onClick={copy}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: copied ? '#6EE7B7' : 'var(--color-brand-electric)',
                color: 'var(--surface-base)', border: 'none', cursor: 'pointer',
              }}
            >
              {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: 'transparent', color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)', cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 12, marginBottom: 4,
};

const fieldStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 6,
  background: 'var(--surface-elevated)', color: 'var(--text-primary)',
  border: '1px solid var(--border-subtle)', fontSize: 13,
  fontFamily: 'inherit',
};
