// ProspectProfileView — deep-dive on a single prospect journey.
// Timeline of completed + current + pending steps, assigned agent sidebar,
// and a stub chat column that Session B's chat routing will wire up.
// Plan: C:\Users\moust\.claude\plans\nifty-launching-turtle.md

import { ArrowLeft, Sparkles, MessageCircle, CheckCircle2, Clock, Circle, SkipForward, XCircle, ArrowRight, Users, Wallet } from 'lucide-react';
import { useProspectJourney, type EmbeddedAgent, type StepWithAgent, type EcosystemLinks } from '../hooks/use-prospects';
import { useNavigation } from '../stores/navigation';
import { PageShell, GlassCard, Badge, EmptyState } from '../components/ui';
import { STEPS, TRACKS, type StepName, type TrackName } from '@mcv/onboarding-sdk';

export default function ProspectProfileView() {
  const setView = useNavigation((s) => s.setView);
  const journeyId = useNavigation((s) => s.selectedProspectJourneyId);

  const { data, isLoading } = useProspectJourney(journeyId);

  if (!journeyId) {
    return (
      <PageShell>
        <EmptyState
          title="No prospect selected"
          description="Click a prospect in the Prospects view to see their full journey."
          action={<button onClick={() => setView('prospects')} style={backLinkStyle}>← Prospects</button>}
        />
      </PageShell>
    );
  }

  if (isLoading) return <PageShell><p style={{ color: 'var(--text-muted)' }}>Loading journey…</p></PageShell>;
  if (!data) return <PageShell><EmptyState title="Journey not found" description="This journey may have been deleted." /></PageShell>;

  const { journey, steps, ecosystem } = data;
  const profile = journey.prospect_profile;
  const assignedAgent = journey.agent;
  const trackMeta = TRACKS[journey.track as TrackName];
  const progress = journey.steps.length === 0 ? 0 : Math.round((journey.current_step_index / journey.steps.length) * 100);

  return (
    <PageShell>
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setView('prospects')} style={backLinkStyle}>
          <ArrowLeft className="w-3.5 h-3.5" /> Prospects
        </button>
      </div>

      {/* Header */}
      <GlassCard>
        <div style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr auto', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {profile.full_name ?? profile.email}
            </h1>
            <div style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: 13, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <span>{profile.email}</span>
              {profile.country && <span>· {profile.country}</span>}
              {profile.role_hint && <span>· {profile.role_hint}</span>}
              {profile.source_venture_id && <span>· via {profile.source_venture_id}</span>}
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Badge>{trackMeta?.label ?? journey.track}</Badge>
              <Badge>{journey.status}</Badge>
              <Badge>{progress}% complete</Badge>
            </div>
          </div>
          {assignedAgent && (
            <div style={{
              minWidth: 220, padding: 12, borderRadius: 10,
              border: `1px solid ${assignedAgent.accent_color ?? 'var(--border-subtle)'}`,
              background: 'var(--surface-elevated)',
            }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 0.5, marginBottom: 6 }}>
                Running this journey
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: assignedAgent.accent_color ?? 'var(--text-primary)' }}>
                {assignedAgent.handle}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{assignedAgent.full_name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{assignedAgent.title}</div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Phase 2 → Phase 3 bridge: ecosystem rows produced by completion. */}
      {ecosystem && (ecosystem.contact || ecosystem.investor_profile) && (
        <EcosystemBridge ecosystem={ecosystem} />
      )}

      {/* Two-column: timeline + chat stub */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginTop: 16 }}>
        {/* Timeline */}
        <GlassCard>
          <div style={{ padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              Journey Timeline
            </h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {journey.steps.map((stepName, idx) => {
                const stepRow = steps.find((s) => s.step_name === stepName);
                const isCurrent = idx === journey.current_step_index;
                return (
                  <TimelineEntry
                    key={`${stepName}-${idx}`}
                    stepName={stepName}
                    index={idx}
                    isCurrent={isCurrent}
                    stepRow={stepRow}
                    agent={stepRow?.agent ?? null}
                  />
                );
              })}
            </div>
          </div>
        </GlassCard>

        {/* Chat column stub */}
        <GlassCard>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 360 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <MessageCircle className="w-4 h-4" style={{ color: 'var(--color-brand-electric)' }} />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Agent Chat
              </h3>
            </div>
            <div style={{
              padding: 14, borderRadius: 8, background: 'var(--surface-elevated)',
              border: '1px dashed var(--border-subtle)', fontSize: 13, color: 'var(--text-secondary)',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {assignedAgent ? `${assignedAgent.handle} ${assignedAgent.full_name}` : '@atlas Atlas'}
              </div>
              <div>
                This prospect's live conversation lands here once Session B ships chat routing.
                The journey is already scoped to the right agent — chat will subscribe to{' '}
                <code style={{ fontSize: 11 }}>session_id = {journey.id.slice(0, 8)}…</code>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
                <Sparkles className="w-3 h-3" />
                Wiring deferred per execution plan.
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </PageShell>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Timeline entry
// ───────────────────────────────────────────────────────────────────────────

function TimelineEntry({
  stepName, index, isCurrent, stepRow, agent,
}: {
  stepName: StepName;
  index: number;
  isCurrent: boolean;
  stepRow: StepWithAgent | undefined;
  agent: EmbeddedAgent | null;
}) {
  const stepDef = STEPS[stepName];
  const status = stepRow?.status ?? (isCurrent ? 'in_progress' : 'pending');
  const statusMeta = STATUS_META[status] ?? STATUS_META.pending;
  const Icon = statusMeta.icon;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: 12,
      padding: 12, borderRadius: 8,
      background: isCurrent ? 'rgba(0, 245, 255, 0.05)' : 'transparent',
      border: `1px solid ${isCurrent ? 'var(--color-brand-electric)' : 'var(--border-subtle)'}`,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 16,
        background: statusMeta.bg, color: statusMeta.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>#{index + 1}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{stepDef?.label ?? stepName}</span>
          {isCurrent && <Badge>Current</Badge>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{stepDef?.description ?? ''}</div>
        {agent && (
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
            {agent.handle} <span style={{ color: 'var(--text-muted)' }}>· {agent.full_name}</span>
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', whiteSpace: 'nowrap' }}>
        {stepRow?.completed_at && <div>✓ {new Date(stepRow.completed_at).toLocaleString()}</div>}
        {!stepRow?.completed_at && stepRow?.started_at && <div>Started {new Date(stepRow.started_at).toLocaleTimeString()}</div>}
      </div>
    </div>
  );
}

const STATUS_META: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}> = {
  pending:     { icon: Circle,        color: 'var(--text-muted)',         bg: 'var(--surface-elevated)' },
  in_progress: { icon: Clock,         color: 'var(--color-brand-electric)', bg: 'rgba(0,245,255,0.12)' },
  completed:   { icon: CheckCircle2,  color: '#6EE7B7',                   bg: 'rgba(110,231,183,0.12)' },
  skipped:     { icon: SkipForward,   color: '#94A3B8',                   bg: 'rgba(148,163,184,0.12)' },
  failed:      { icon: XCircle,       color: '#F87171',                   bg: 'rgba(248,113,113,0.12)' },
};

const backLinkStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '6px 10px', borderRadius: 8, fontSize: 12,
  background: 'var(--surface-elevated)', color: 'var(--text-secondary)',
  border: '1px solid var(--border-subtle)', cursor: 'pointer',
};

// ───────────────────────────────────────────────────────────────────────────
// Ecosystem bridge — surfaces the contact + investor_profile rows produced
// by runJourneyCompletionEffects when this journey completed. Closes the
// loop visually: prospect → journey → ecosystem actors.
// ───────────────────────────────────────────────────────────────────────────

function EcosystemBridge({
  ecosystem,
}: {
  ecosystem: EcosystemLinks;
}) {
  const { contact, investor_profile } = ecosystem;
  const openCrmContact = useNavigation((s) => s.openCrmContact);
  const openCapitalContact = useNavigation((s) => s.openCapitalContact);

  return (
    <GlassCard>
      <div style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Sparkles className="w-4 h-4" style={{ color: '#6EE7B7' }} />
          <h3 style={{
            fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0,
            textTransform: 'uppercase', letterSpacing: 0.6,
          }}>
            Ecosystem rows produced
          </h3>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            — completed journeys feed downstream surfaces
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: investor_profile ? '1fr 1fr' : '1fr', gap: 12 }}>
          {contact && (
            <div style={ecoCardStyle('#6EE7B7')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Users className="w-4 h-4" style={{ color: '#6EE7B7' }} />
                <span style={ecoCardLabelStyle}>CRM Contact</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                {contact.name}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                <Badge>{contact.type}</Badge>
                <Badge>{contact.status}</Badge>
                {contact.lifecycle_stage && <Badge>{contact.lifecycle_stage}</Badge>}
                {contact.lead_score != null && <Badge>score {contact.lead_score}</Badge>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                {contact.email} · created {new Date(contact.created_at).toLocaleString()}
              </div>
              <button onClick={() => openCrmContact(contact.id)} style={ctaStyle('#6EE7B7')}>
                Open in CRM <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {investor_profile && (
            <div style={ecoCardStyle('var(--color-brand-electric)')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Wallet className="w-4 h-4" style={{ color: 'var(--color-brand-electric)' }} />
                <span style={ecoCardLabelStyle}>Capital Investor Profile</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                {investor_profile.venture_id} · {investor_profile.contact_type}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                <Badge>stage: {investor_profile.stage}</Badge>
                <Badge>kyc: {investor_profile.kyc_status}</Badge>
                <Badge>{investor_profile.accreditation_status}</Badge>
                <Badge>score {investor_profile.lead_score}</Badge>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                committed ${Number(investor_profile.total_committed_usd).toLocaleString()} · funded ${Number(investor_profile.total_funded_usd).toLocaleString()} · created {new Date(investor_profile.created_at).toLocaleString()}
              </div>
              <button onClick={() => openCapitalContact(investor_profile.contact_id)} style={ctaStyle('var(--color-brand-electric)')}>
                Open in Capital <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

const ecoCardStyle = (accent: string): React.CSSProperties => ({
  padding: 14,
  borderRadius: 10,
  border: `1px solid ${accent}33`,
  background: 'var(--surface-elevated)',
});

const ecoCardLabelStyle: React.CSSProperties = {
  fontSize: 10, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600,
};

const ctaStyle = (accent: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
  background: accent, color: 'var(--surface-base)',
  border: 'none', cursor: 'pointer',
});
