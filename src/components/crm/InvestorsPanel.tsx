// CRM Investors tab — surfaces capital_investor_profile satellite alongside core CRM contacts.
// SPEC-EQC-001 Epic 2.7

import { useState } from 'react';
import { Users, ExternalLink, Globe, Wallet, ShieldCheck } from 'lucide-react';
import { useNavigation } from '../../stores/navigation';
import { useInvestors } from '../../hooks/use-capital';
import { GlassCard, Badge, EmptyState, StatCard, GridLayout } from '../ui';
import { formatMoney } from '../../lib/utils';
import type { ContactStage, ContactType } from '@mcv/capital-sdk';

const STAGE_COLORS: Record<ContactStage, string> = {
  cold: 'var(--capital-stage-cold)',
  warm: 'var(--capital-stage-warm)',
  engaged: 'var(--capital-stage-engaged)',
  soft_commit: 'var(--capital-stage-soft-commit)',
  due_diligence: 'var(--capital-stage-due-diligence)',
  signed: 'var(--capital-stage-signed)',
  funded: 'var(--capital-stage-funded)',
  active_investor: 'var(--capital-stage-active-investor)',
  churned: 'var(--capital-stage-churned)',
  dormant: 'var(--capital-stage-dormant)',
};

export default function InvestorsPanel() {
  const setView = useNavigation((s) => s.setView);
  const [stageFilter, setStageFilter] = useState<ContactStage | ''>('');
  const [typeFilter, setTypeFilter] = useState<ContactType | ''>('');

  const { data: investors = [], isLoading } = useInvestors(undefined, {
    stage: stageFilter || undefined,
    contactType: typeFilter || undefined,
  });

  const totalCommitted = investors.reduce((s, i) => s + i.totalCommittedUsd, 0);
  const totalFunded = investors.reduce((s, i) => s + i.totalFundedUsd, 0);
  const accreditedCount = investors.filter((i) => i.accreditationStatus === 'verified_accredited' || i.accreditationStatus === 'qualified_purchaser' || i.accreditationStatus === 'institutional').length;
  const portalCount = investors.filter((i) => i.portalEnabled).length;

  return (
    <div style={{ padding: '0 20px' }}>
      <div style={{ marginBottom: 16 }}><GridLayout cols={4} gap="sm">
        <StatCard icon={<Users size={13} />} label="Investors" value={investors.length} />
        <StatCard icon={<ShieldCheck size={13} />} label="Accredited" value={accreditedCount} />
        <StatCard label="Total Committed" value={formatMoney(totalCommitted)} />
        <StatCard label="Total Funded" value={formatMoney(totalFunded)} />
      </GridLayout></div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as ContactStage | '')}
          style={{ background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: 4, fontSize: 12 }}
        >
          <option value="">All stages</option>
          {Object.keys(STAGE_COLORS).map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ContactType | '')}
          style={{ background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: 4, fontSize: 12 }}
        >
          <option value="">All types</option>
          {['prospect', 'angel', 'vc', 'lp', 'institutional', 'strategic_partner', 'advisor'].map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>
          {portalCount} portal-enabled
        </span>
      </div>

      {isLoading ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Loading investors…</div>
      ) : !investors.length ? (
        <EmptyState
          icon={<Users size={24} />}
          title="No investor profiles yet"
          description="Investors are CRM contacts with type=investor that have a capital_investor_profile satellite. Use the chat ('upsert investor profile for …') or the API to create them."
        />
      ) : (
        <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)' }}>
                <th style={th}>Contact</th>
                <th style={th}>Venture</th>
                <th style={th}>Type</th>
                <th style={th}>Stage</th>
                <th style={th}>Score</th>
                <th style={th}>Accreditation</th>
                <th style={th}>KYC</th>
                <th style={{ ...th, textAlign: 'right' }}>Committed</th>
                <th style={{ ...th, textAlign: 'right' }}>Funded</th>
                <th style={{ ...th, textAlign: 'center' }}>Portal</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {investors.map((inv) => (
                <tr key={`${inv.contactId}-${inv.ventureId}`} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 11 }}>{inv.contactId.slice(0, 8)}…</td>
                  <td style={td}>
                    <Badge variant="outline">{inv.ventureId}</Badge>
                  </td>
                  <td style={td}>{inv.contactType}</td>
                  <td style={td}>
                    <Badge color={STAGE_COLORS[inv.stage]}>{inv.stage.replace(/_/g, ' ')}</Badge>
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 36, height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${inv.leadScore}%`, height: '100%', background: 'var(--cyan)' }} />
                      </div>
                      <span style={{ fontSize: 10 }}>{inv.leadScore}</span>
                    </div>
                  </td>
                  <td style={{ ...td, fontSize: 11 }}>{inv.accreditationStatus.replace(/_/g, ' ')}</td>
                  <td style={{ ...td, fontSize: 11 }}>
                    <Badge color={inv.kycStatus === 'approved' ? '#10B981' : '#6B7280'}>{inv.kycStatus.replace(/_/g, ' ')}</Badge>
                  </td>
                  <td style={{ ...td, textAlign: 'right', color: 'var(--cyan)', fontWeight: 500 }}>{formatMoney(inv.totalCommittedUsd)}</td>
                  <td style={{ ...td, textAlign: 'right', color: 'var(--green)', fontWeight: 500 }}>{formatMoney(inv.totalFundedUsd)}</td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    {inv.portalEnabled ? <Globe size={12} style={{ color: 'var(--cyan)' }} /> : '—'}
                    {inv.walletAddress && <Wallet size={12} style={{ marginLeft: 4, color: 'var(--purple)' }} />}
                  </td>
                  <td style={td}>
                    <button
                      onClick={() => {
                        sessionStorage.setItem('capital.activeContactId', inv.contactId);
                        setView('capital-contact-detail');
                      }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--cyan)', cursor: 'pointer' }}
                    >
                      <ExternalLink size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}
    </div>
  );
}

const th: React.CSSProperties = { padding: 10, textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 };
const td: React.CSSProperties = { padding: 10, fontSize: 12 };
