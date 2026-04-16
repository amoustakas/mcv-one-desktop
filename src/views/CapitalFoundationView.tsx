// EdgeIQ Capital — Foundation dashboard.
// Live render of Treasury + RoyaltyGraph + DistributionConfig + ComplianceRuleSet
// + LegalEntity across all 7 ventures. Plus a royalty-walk simulator that uses
// production computeRoyaltyLegs via /api/capital action=foundation-simulate-royalty-walk.
// SPEC-EQC-001 Phase 3 · Plan: luminous-mapping-globe.md

import { useEffect, useMemo, useState } from 'react';
import { Building2, Wallet, Receipt, Shield, Sparkles, Calculator, ArrowRight, X as XIcon } from 'lucide-react';
import {
  useTreasuries, useRoyaltyGraphs, useDistributionConfigs,
  useComplianceRuleSets, useLegalEntities, useRoyaltyWalkSimulation,
  useInvestorPosition,
} from '../hooks/use-capital';
import { useContact } from '../hooks/use-crm';
import { useNavigation } from '../stores/navigation';
import { PageHeader, PageShell, GlassCard, Badge, EmptyState } from '../components/ui';

type FoundationTab = 'treasuries' | 'royalties' | 'distributions' | 'compliance' | 'entities' | 'simulator';

const VENTURES: Array<{ id: string; label: string }> = [
  { id: 'futurestate',     label: 'Futurestate' },
  { id: 'betedge',         label: 'BetEdge' },
  { id: 'warforge',        label: 'WarForge' },
  { id: 'mcvgg',           label: 'MCV.gg' },
  { id: 'arq',             label: 'ARQ Labs' },
  { id: 'edgeiq-markets',  label: 'EdgeIQ Markets' },
  { id: 'mcv-platform',    label: 'MCV Platform' },
];

const FLOW_KINDS: string[] = [
  're_precon_deposit', 're_construction_draw', 're_yield_distribution', 're_capital_call',
  'startup_equity_crowdfund', 'startup_safe_presale',
  'token_presale', 'token_tge_launch', 'token_liquidity_provision',
  'royalty_payout', 'referral_reward', 'quest_reward', 'engagement_payout',
  'vendor_bill', 'platform_fee_split',
];

export default function CapitalFoundationView() {
  const [tab, setTab] = useState<FoundationTab>('treasuries');
  const [ventureFilter, setVentureFilter] = useState<string>('');

  // Phase 2 deep-link consumer: ProspectProfileView "Open in Capital" CTA
  // sets selectedCapitalContactId; we stash a copy locally so the banner
  // persists even after the navigation pointer is consumed.
  const consumeCapitalContactId = useNavigation((s) => s.consumeCapitalContactId);
  const [pinnedContactId, setPinnedContactId] = useState<string | null>(null);
  useEffect(() => {
    const id = consumeCapitalContactId();
    if (id) setPinnedContactId(id);
  }, [consumeCapitalContactId]);

  const tabs: Array<{ id: FoundationTab; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }> = [
    { id: 'treasuries',    label: 'Treasuries',       icon: Wallet },
    { id: 'royalties',     label: 'Royalty Graphs',   icon: Sparkles },
    { id: 'distributions', label: 'Distribution Configs', icon: Receipt },
    { id: 'compliance',    label: 'Compliance Rules', icon: Shield },
    { id: 'entities',      label: 'Legal Entities',   icon: Building2 },
    { id: 'simulator',     label: 'Royalty Simulator',icon: Calculator },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Capital Foundation"
        subtitle="The five-tuple primitive powering every venture's monetization — live data from capital_treasury, capital_royalty_graph, capital_distribution_config, capital_compliance_rule_set, and capital_legal_entity."
      />

      {pinnedContactId && (
        <PinnedInvestorBanner
          contactId={pinnedContactId}
          onDismiss={() => setPinnedContactId(null)}
        />
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10,
                background: active ? 'var(--color-brand-electric)' : 'var(--surface-elevated)',
                color: active ? 'var(--surface-base)' : 'var(--text-primary)',
                border: active ? '1px solid var(--color-brand-electric)' : '1px solid var(--border-subtle)',
                cursor: 'pointer', fontWeight: active ? 600 : 500, fontSize: 13,
              }}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab !== 'entities' && tab !== 'simulator' && (
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Venture:</span>
          <select
            value={ventureFilter}
            onChange={(e) => setVentureFilter(e.target.value)}
            style={{
              padding: '6px 10px', borderRadius: 8, fontSize: 13,
              background: 'var(--surface-elevated)', color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <option value="">All ventures</option>
            {VENTURES.map((v) => (<option key={v.id} value={v.id}>{v.label}</option>))}
          </select>
        </div>
      )}

      {tab === 'treasuries' && <TreasuriesTab ventureId={ventureFilter || undefined} />}
      {tab === 'royalties' && <RoyaltiesTab ventureId={ventureFilter || undefined} />}
      {tab === 'distributions' && <DistributionsTab ventureId={ventureFilter || undefined} />}
      {tab === 'compliance' && <ComplianceTab ventureId={ventureFilter || undefined} />}
      {tab === 'entities' && <EntitiesTab />}
      {tab === 'simulator' && <SimulatorTab />}
    </PageShell>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────

function TreasuriesTab({ ventureId }: { ventureId?: string }) {
  const { data, isLoading } = useTreasuries(ventureId);
  const rows = (data as Array<Record<string, unknown>> | undefined) ?? [];
  if (isLoading) return <p style={{ color: 'var(--text-muted)' }}>Loading treasuries…</p>;
  if (!rows.length) return <EmptyState title="No treasuries" description="Run scripts/seed-capital-foundation.ts or apply via Supabase MCP." />;
  return (
    <GlassCard>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
            <th style={cellHead}>Venture</th><th style={cellHead}>Label</th><th style={cellHead}>Kind</th><th style={cellHead}>Currency</th><th style={cellHead}>Jurisdiction</th><th style={cellHead}>Custodian</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t, i) => (
            <tr key={(t.id as string) ?? i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={cell}><Badge>{String(t.venture_id)}</Badge></td>
              <td style={cell}>{String(t.label)}</td>
              <td style={cell}><code>{String(t.kind)}</code></td>
              <td style={cell}>{String(t.currency)}</td>
              <td style={cell}>{String(t.jurisdiction)}</td>
              <td style={cell}>{String(t.custodian ?? '—')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </GlassCard>
  );
}

function RoyaltiesTab({ ventureId }: { ventureId?: string }) {
  const { data, isLoading } = useRoyaltyGraphs(ventureId);
  if (isLoading) return <p style={{ color: 'var(--text-muted)' }}>Loading royalty graphs…</p>;
  const graphs = ((data as { graphs?: Array<Record<string, unknown>> } | undefined)?.graphs) ?? [];
  const layers = ((data as { layers?: Array<Record<string, unknown>> } | undefined)?.layers) ?? [];
  if (!graphs.length) return <EmptyState title="No royalty graphs" description="Seed the foundation first." />;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {graphs.map((g) => {
        const graphLayers = layers.filter((l) => l.graph_id === g.id).sort((a, b) => Number(a.sequence) - Number(b.sequence));
        return (
          <GlassCard key={g.id as string}>
            <div style={{ marginBottom: 8 }}>
              <strong>{String(g.venture_id)} · {String(g.label)}</strong>
              <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 12 }}>v{String(g.version)}</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={cellHead}>#</th><th style={cellHead}>Layer</th><th style={cellHead}>Kind</th><th style={cellHead}>Recipient</th><th style={cellHead}>bps</th><th style={cellHead}>Condition</th>
                </tr>
              </thead>
              <tbody>
                {graphLayers.map((l) => (
                  <tr key={l.id as string} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={cell}>{String(l.sequence)}</td>
                    <td style={cell}>{String(l.label)}</td>
                    <td style={cell}><code>{String(l.kind)}</code></td>
                    <td style={cell}>{String(l.recipient_type)}/<code>{String(l.recipient_id)}</code></td>
                    <td style={cell}>{String(l.bps)} ({(Number(l.bps) / 100).toFixed(2)}%)</td>
                    <td style={cell}>{String(l.condition_expr ?? '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        );
      })}
    </div>
  );
}

function DistributionsTab({ ventureId }: { ventureId?: string }) {
  const { data, isLoading } = useDistributionConfigs(ventureId);
  const configs = (data as Array<Record<string, unknown>> | undefined) ?? [];
  if (isLoading) return <p style={{ color: 'var(--text-muted)' }}>Loading distribution configs…</p>;
  if (!configs.length) return <EmptyState title="No distribution configs" description="Seed the foundation first." />;
  return (
    <GlassCard>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
            <th style={cellHead}>Venture</th><th style={cellHead}>Flow Kind</th><th style={cellHead}>Billing</th><th style={cellHead}>Payee</th><th style={cellHead}>Currency</th><th style={cellHead}>Allowed</th>
          </tr>
        </thead>
        <tbody>
          {configs.map((c) => (
            <tr key={c.id as string} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={cell}><Badge>{String(c.venture_id)}</Badge></td>
              <td style={cell}><code>{String(c.flow_kind)}</code></td>
              <td style={cell}>{String(c.billing_mode)}</td>
              <td style={cell}>{String(c.default_payee_strategy)}</td>
              <td style={cell}>{String(c.default_currency)}</td>
              <td style={cell}>{(c.allowed_currencies as string[] | undefined)?.join(', ') ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </GlassCard>
  );
}

function ComplianceTab({ ventureId }: { ventureId?: string }) {
  const { data, isLoading } = useComplianceRuleSets(ventureId);
  const sets = ((data as { rule_sets?: Array<Record<string, unknown>> } | undefined)?.rule_sets) ?? [];
  const rules = ((data as { rules?: Array<Record<string, unknown>> } | undefined)?.rules) ?? [];
  if (isLoading) return <p style={{ color: 'var(--text-muted)' }}>Loading compliance rule sets…</p>;
  if (!sets.length) return <EmptyState title="No compliance rule sets" description="Seed the foundation first." />;
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {sets.map((s) => {
        const mine = rules.filter((r) => r.rule_set_id === s.id);
        return (
          <GlassCard key={s.id as string}>
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <strong>{String(s.venture_id)} · {String(s.label)}</strong>
              <Badge>{String(s.jurisdiction)}</Badge>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={cellHead}>Rule</th><th style={cellHead}>Scope</th><th style={cellHead}>Priority</th><th style={cellHead}>Config</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((r) => (
                  <tr key={r.id as string} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={cell}><code>{String(r.rule_type)}</code></td>
                    <td style={cell}>{String(r.scope)}</td>
                    <td style={cell}>{String(r.priority)}</td>
                    <td style={cell}><code style={{ fontSize: 11 }}>{JSON.stringify(r.config)}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        );
      })}
    </div>
  );
}

function EntitiesTab() {
  const { data, isLoading } = useLegalEntities();
  const entities = (data as Array<Record<string, unknown>> | undefined) ?? [];
  if (isLoading) return <p style={{ color: 'var(--text-muted)' }}>Loading legal entities…</p>;
  if (!entities.length) return <EmptyState title="No legal entities" description="Seed the foundation first." />;
  return (
    <GlassCard>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
            <th style={cellHead}>ID</th><th style={cellHead}>Label</th><th style={cellHead}>Jurisdiction</th><th style={cellHead}>Type</th><th style={cellHead}>Parent</th>
          </tr>
        </thead>
        <tbody>
          {entities.map((e) => (
            <tr key={e.id as string} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={cell}><code>{String(e.id)}</code></td>
              <td style={cell}>{String(e.label)}</td>
              <td style={cell}>{String(e.jurisdiction)}</td>
              <td style={cell}>{String(e.entity_type)}</td>
              <td style={cell}>{String(e.parent_entity_id ?? '—')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </GlassCard>
  );
}

function SimulatorTab() {
  const [venture, setVenture] = useState('futurestate');
  const [flowKind, setFlowKind] = useState('re_yield_distribution');
  const [amount, setAmount] = useState<number>(10000);
  const [currency, setCurrency] = useState('CAD');
  const [jurisdiction, setJurisdiction] = useState('');

  const { data, isLoading } = useRoyaltyWalkSimulation(
    venture, flowKind, amount, currency, jurisdiction || undefined,
  );
  const sim = data as { legs?: Array<Record<string, unknown>>; totalRoyalty?: number; residualToPrimary?: number; currency?: string } | undefined;

  const totalPct = useMemo(() => {
    if (!sim || !amount) return 0;
    return ((sim.totalRoyalty ?? 0) / amount) * 100;
  }, [sim, amount]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
      <GlassCard>
        <h3 style={{ marginTop: 0 }}>Dry-run inputs</h3>
        <FormRow label="Venture">
          <select value={venture} onChange={(e) => setVenture(e.target.value)} style={input}>
            {VENTURES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </FormRow>
        <FormRow label="Flow kind">
          <select value={flowKind} onChange={(e) => setFlowKind(e.target.value)} style={input}>
            {FLOW_KINDS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </FormRow>
        <FormRow label="Amount">
          <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} style={input} min={0} />
        </FormRow>
        <FormRow label="Currency">
          <input type="text" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} style={input} />
        </FormRow>
        <FormRow label="Jurisdiction">
          <input type="text" value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} placeholder="e.g. CA-ON (optional)" style={input} />
        </FormRow>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
          Uses production <code>computeRoyaltyLegs</code> from @mcv/capital-sdk/royalty-walker.
          Same math that will run when real payouts execute.
        </p>
      </GlassCard>

      <GlassCard>
        <h3 style={{ marginTop: 0 }}>Computed legs</h3>
        {isLoading && <p style={{ color: 'var(--text-muted)' }}>Simulating…</p>}
        {!isLoading && !sim && <p style={{ color: 'var(--text-muted)' }}>Adjust inputs to simulate.</p>}
        {sim && sim.legs && (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={cellHead}>#</th><th style={cellHead}>Layer</th><th style={cellHead}>Kind</th><th style={cellHead}>Recipient</th><th style={cellHead}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {sim.legs.map((leg, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={cell}>{String(leg.sequence)}</td>
                    <td style={cell}>{String(leg.label)}</td>
                    <td style={cell}><code>{String(leg.kind)}</code></td>
                    <td style={cell}>{String(leg.recipientType)}/<code>{String(leg.recipientId)}</code></td>
                    <td style={cell}><strong>{String(leg.amount)} {String(leg.currency)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Stat label="Total royalty" value={`${sim.totalRoyalty} ${sim.currency}`} sub={`${totalPct.toFixed(2)}% of source`} />
              <Stat label="Residual to primary" value={`${sim.residualToPrimary} ${sim.currency}`} sub={`${(100 - totalPct).toFixed(2)}% of source`} />
              <Stat label="Source amount" value={`${amount} ${currency}`} sub={`${sim.legs.length} legs`} />
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}

// ─── bits ─────────────────────────────────────────────────────────────

const cellHead: React.CSSProperties = { padding: '8px 12px', fontWeight: 500, fontSize: 12 };
const cell: React.CSSProperties = { padding: '10px 12px' };
const input: React.CSSProperties = {
  width: '100%', padding: '6px 10px', borderRadius: 8, fontSize: 13,
  background: 'var(--surface-elevated)', color: 'var(--text-primary)',
  border: '1px solid var(--border-subtle)',
};

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ padding: 10, background: 'var(--surface-elevated)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Pinned investor banner — Phase 2 deep-link target.
// Shown at the top of CapitalFoundationView when arriving via the
// ProspectProfileView "Open in Capital" CTA. Renders the contact +
// investor profile summary and a reverse-link back to the journey.
// ───────────────────────────────────────────────────────────────────────────

function PinnedInvestorBanner({
  contactId, onDismiss,
}: { contactId: string; onDismiss: () => void }) {
  const { data: contactData, isLoading: contactLoading } = useContact(contactId);
  const { data: position, isLoading: positionLoading } = useInvestorPosition(contactId);
  const selectProspectJourney = useNavigation((s) => s.selectProspectJourney);

  const contact = contactData?.contact;
  const profile = position?.profile ?? null;

  // Check for the journey reverse-link in BOTH metadatas — contact's
  // metadata.completion_journey_id is the canonical pointer; profile's
  // is a backup if contact metadata is empty.
  const contactMeta = (((contact as unknown) as { metadata?: Record<string, unknown> } | undefined)?.metadata ?? {}) as { prospect_id?: string; completion_journey_id?: string; track?: string };
  const profileMeta = (profile?.metadata ?? {}) as { completion_journey_id?: string; track?: string };
  const journeyId = contactMeta.completion_journey_id ?? profileMeta.completion_journey_id ?? null;
  const fromTrack = contactMeta.track ?? profileMeta.track ?? null;

  if (contactLoading || positionLoading) {
    return (
      <GlassCard>
        <div style={{ padding: 14, color: 'var(--text-muted)', fontSize: 13 }}>Loading pinned investor…</div>
      </GlassCard>
    );
  }

  if (!contact) {
    return (
      <GlassCard>
        <div style={{ padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Pinned investor not found.</span>
          <button onClick={onDismiss} style={dismissBtnStyle}><XIcon size={14} /></button>
        </div>
      </GlassCard>
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <GlassCard>
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Sparkles className="w-4 h-4" style={{ color: 'var(--color-brand-electric)' }} />
            <span style={{
              fontSize: 11, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600,
            }}>
              Pinned investor — opened from prospect journey
            </span>
            <button onClick={onDismiss} style={{ ...dismissBtnStyle, marginLeft: 'auto' }} aria-label="Dismiss">
              <XIcon size={14} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: profile ? '1fr 1fr auto' : '1fr auto', gap: 14, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                {contact.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span>{contact.email ?? '—'}</span>
                <Badge>{contact.type}</Badge>
                {contact.lifecycle_stage && <Badge>{contact.lifecycle_stage}</Badge>}
              </div>
            </div>

            {profile && (
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  {profile.ventureId} · investor profile
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Badge>stage: {profile.stage}</Badge>
                  <Badge>kyc: {profile.kycStatus}</Badge>
                  <Badge>{profile.accreditationStatus}</Badge>
                  <Badge>committed ${Number(profile.totalCommittedUsd ?? 0).toLocaleString()}</Badge>
                </div>
              </div>
            )}

            {journeyId && (
              <button
                onClick={() => selectProspectJourney(journeyId)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: 'rgba(110, 231, 183, 0.15)', color: '#6EE7B7',
                  border: '1px solid rgba(110, 231, 183, 0.3)', cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                View {fromTrack ?? 'onboarding'} journey
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

const dismissBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 24, height: 24, borderRadius: 6,
  background: 'transparent', color: 'var(--text-muted)',
  border: '1px solid var(--border-subtle)', cursor: 'pointer',
};
