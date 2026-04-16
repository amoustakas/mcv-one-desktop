// AccreditationFlowModal — Phase 3 investor accreditation flow.
// Wraps the existing VerifyInvestor adapter (Epic 13 S9) with a chat-led
// modal so any surface (ProspectProfileView, CapitalFoundationView pinned
// banner, future investor portal) can launch the same upgrade path.
//
// Two paths exposed:
//   1. "Start verification"  → real vendor request via /api/capital
//      action=initiate-accreditation-verification. Returns a hostedUrl
//      the investor visits (mocked in dev when VERIFY_INVESTOR_API_KEY
//      is unset; live in prod). Profile flips to kyc=in_review pending
//      the webhook.
//   2. "Simulate (admin)"     → /api/capital action=simulate-accreditation-verification.
//      Stamps the profile directly. Used by admin overrides + dev/demo flows.

import { useState } from 'react';
import { Sparkles, Shield, ExternalLink, Check, X as XIcon, AlertCircle } from 'lucide-react';
import { Modal, Badge } from './../ui';
import { useInitiateAccreditation, useSimulateAccreditation, type AccreditationRequest } from '../../hooks/use-capital';
import type { InvestorProfile } from '@mcv/capital-sdk';

interface Props {
  open: boolean;
  onClose: () => void;
  contactId: string;
  contactName: string;
  /** Current investor profile so we can show the right state + skip the
   *  modal entirely if already verified. Pass null while loading. */
  profile: InvestorProfile | null;
}

type AccreditationBasis = 'income' | 'net_worth' | 'entity' | 'professional' | 'qualified_purchaser';

const BASES: Array<{ id: AccreditationBasis; label: string; description: string }> = [
  { id: 'income',              label: 'Income basis',         description: '$200k+/yr individual or $300k+/yr joint, prior two years.' },
  { id: 'net_worth',           label: 'Net worth basis',      description: '$1M+ excluding primary residence.' },
  { id: 'entity',              label: 'Entity basis',         description: 'Trust/LLC with $5M+ assets or all owners are accredited.' },
  { id: 'professional',        label: 'Professional license', description: 'Series 7 / 65 / 82 active license.' },
  { id: 'qualified_purchaser', label: 'Qualified purchaser',  description: '$5M+ in investments — unlocks 3(c)(7) funds.' },
];

export default function AccreditationFlowModal({ open, onClose, contactId, contactName, profile }: Props) {
  const [request, setRequest] = useState<AccreditationRequest | null>(null);
  const [showSimulate, setShowSimulate] = useState(false);
  const [basis, setBasis] = useState<AccreditationBasis>('income');
  const [error, setError] = useState<string | null>(null);

  const initiate = useInitiateAccreditation();
  const simulate = useSimulateAccreditation();

  const status = profile?.accreditationStatus ?? 'unknown';
  const isVerified = status === 'verified_accredited' || status === 'qualified_purchaser';

  async function handleInitiate() {
    setError(null);
    try {
      const r = await initiate.mutateAsync({ contactId });
      setRequest(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleSimulate() {
    setError(null);
    try {
      await simulate.mutateAsync({ contactId, outcome: 'verified_accredited', basis });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="md" ariaLabel="Verify accreditation">
      <div style={{
        padding: 24, background: 'var(--surface-base)', borderRadius: 12,
        minWidth: 480, maxWidth: 560,
      }}>
        {/* Agent header — Ada Marlowe (Legal) drives accreditation per Phase 1 roster. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 22,
            background: 'linear-gradient(135deg, #A78BFA, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: '#fff', fontSize: 17,
          }}>A</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>Ada Marlowe</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Legal Counsel · @ada</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={iconBtnStyle}>
            <XIcon size={14} />
          </button>
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0, marginBottom: 6 }}>
          Verify accreditation
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, marginBottom: 18 }}>
          {isVerified
            ? `${contactName.split(' ')[0]} is already verified. You can re-run if their basis has changed.`
            : `I'll get ${contactName.split(' ')[0]} verified for accredited rounds. Two paths — pick what fits.`}
        </p>

        {/* Current status pill */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Current status:
          </span>
          <StatusPill status={status} />
        </div>

        {/* Success: real verification request created */}
        {request && (
          <div style={successCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Check size={16} style={{ color: '#6EE7B7' }} />
              <span style={{ fontWeight: 600, color: '#6EE7B7' }}>Request created</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, marginBottom: 10 }}>
              {contactName.split(' ')[0]} can complete verification at the link below.
              I&rsquo;ll get notified the moment they finish.
            </p>
            <a href={request.hostedUrl} target="_blank" rel="noreferrer" style={hostedLinkStyle}>
              Open verification flow <ExternalLink size={13} />
            </a>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
              Request id: <code>{request.requestId.slice(0, 16)}…</code>
            </div>
          </div>
        )}

        {/* Simulate-mode form */}
        {showSimulate && !request && (
          <div style={simulateCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Shield size={14} style={{ color: 'var(--color-brand-electric)' }} />
              <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                Simulate verified outcome
              </span>
              <Badge>admin</Badge>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, marginBottom: 12 }}>
              Skip the vendor flow and stamp <b style={{ color: 'var(--text-secondary)' }}>verified_accredited</b> directly.
              Use when verifying out-of-band or for demos.
            </p>
            <label style={labelStyle}>Accreditation basis</label>
            <div style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
              {BASES.map((b) => (
                <button key={b.id} onClick={() => setBasis(b.id)} style={basisRowStyle(basis === b.id)}>
                  <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)' }}>{b.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.description}</div>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSimulate} disabled={simulate.isPending} style={primaryBtnStyle}>
                {simulate.isPending ? 'Stamping…' : 'Stamp verified'}
              </button>
              <button onClick={() => setShowSimulate(false)} disabled={simulate.isPending} style={secondaryBtnStyle}>
                Back
              </button>
            </div>
          </div>
        )}

        {/* Default: show both path options */}
        {!request && !showSimulate && (
          <div style={{ display: 'grid', gap: 12 }}>
            <button onClick={handleInitiate} disabled={initiate.isPending} style={pathCardStyle('var(--color-brand-electric)')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} style={{ color: 'var(--color-brand-electric)' }} />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {initiate.isPending ? 'Creating…' : 'Start verification'}
                </span>
              </div>
              <p style={pathDescStyle}>
                Send {contactName.split(' ')[0]} a hosted VerifyInvestor link. They upload tax docs / bank statements;
                we get a webhook callback when they finish. The accredited credential auto-issues on success.
              </p>
            </button>

            <button onClick={() => setShowSimulate(true)} style={pathCardStyle('#A78BFA')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={16} style={{ color: '#A78BFA' }} />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Simulate (admin)
                </span>
                <Badge>dev</Badge>
              </div>
              <p style={pathDescStyle}>
                Stamp <b>verified_accredited</b> directly without going through the vendor.
                Use for out-of-band verifications or demo flows.
              </p>
            </button>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: 'rgba(248, 113, 113, 0.08)', border: '1px solid rgba(248, 113, 113, 0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={14} style={{ color: '#F87171' }} />
            <span style={{ fontSize: 12, color: '#F87171' }}>{error}</span>
          </div>
        )}

        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={secondaryBtnStyle}>
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Status pill — colors per accreditation_status enum
// ───────────────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.unknown;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
      background: `${meta.color}22`, color: meta.color,
      border: `1px solid ${meta.color}55`,
    }}>
      {meta.label}
    </span>
  );
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  unknown:             { label: 'Unknown',             color: '#94A3B8' },
  not_accredited:      { label: 'Not accredited',      color: '#F87171' },
  self_certified:      { label: 'Self-certified',      color: '#FBBF24' },
  verified_accredited: { label: 'Verified accredited', color: '#6EE7B7' },
  qualified_purchaser: { label: 'Qualified purchaser', color: '#6EE7B7' },
  institutional:       { label: 'Institutional',       color: '#6EE7B7' },
  exempt:              { label: 'Exempt',              color: '#94A3B8' },
};

// ───────────────────────────────────────────────────────────────────────────
// Style helpers
// ───────────────────────────────────────────────────────────────────────────

const iconBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 24, height: 24, borderRadius: 6,
  background: 'transparent', color: 'var(--text-muted)',
  border: '1px solid var(--border-subtle)', cursor: 'pointer',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4, marginBottom: 6,
};

const pathCardStyle = (accent: string): React.CSSProperties => ({
  textAlign: 'left', padding: 14, borderRadius: 10,
  background: 'var(--surface-elevated)',
  border: `1px solid ${accent}33`,
  cursor: 'pointer', width: '100%',
  display: 'block',
});

const pathDescStyle: React.CSSProperties = {
  fontSize: 12, color: 'var(--text-muted)', margin: '6px 0 0',
};

const successCardStyle: React.CSSProperties = {
  padding: 14, borderRadius: 10,
  background: 'rgba(110, 231, 183, 0.08)',
  border: '1px solid rgba(110, 231, 183, 0.3)',
};

const simulateCardStyle: React.CSSProperties = {
  padding: 14, borderRadius: 10,
  background: 'var(--surface-elevated)',
  border: '1px solid var(--border-subtle)',
};

const basisRowStyle = (selected: boolean): React.CSSProperties => ({
  textAlign: 'left', padding: '8px 10px', borderRadius: 6,
  background: selected ? 'rgba(0, 245, 255, 0.08)' : 'transparent',
  border: `1px solid ${selected ? 'var(--color-brand-electric)' : 'var(--border-subtle)'}`,
  cursor: 'pointer',
});

const primaryBtnStyle: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
  background: 'var(--color-brand-electric)', color: 'var(--surface-base)',
  border: 'none', cursor: 'pointer',
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
  background: 'transparent', color: 'var(--text-secondary)',
  border: '1px solid var(--border-subtle)', cursor: 'pointer',
};

const hostedLinkStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
  background: '#6EE7B7', color: 'var(--surface-base)',
  textDecoration: 'none',
};
