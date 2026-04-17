// RoundBrowseModal — Phase 3 D2. Once a prospect is verified_accredited,
// Hannah Sterling (Futurestate IR) opens the curated list of live rounds
// they're eligible for. Click one → inline "Express interest" form →
// capital_commitments row lands with status='soft_commit'. No money moves
// until D3; this slice is the "yes, I'm interested" handshake.
//
// Eligibility filter:
//   round.status === 'open'
//   round.accredited_only ? investor is verified+ : true
// Handled by useRoundsForInvestor().

import { useState } from 'react';
import { Sparkles, Check, AlertCircle, ArrowRight, Lock, X as XIcon } from 'lucide-react';
import { Modal, Badge } from '../ui';
import { useCreateCommitment, useRoundsForInvestor } from '../../hooks/use-capital';
import { useNavigation } from '../../stores/navigation';
import type { Round } from '@mcv/capital-sdk';

interface Props {
  open: boolean;
  onClose: () => void;
  contactId: string;
  contactName: string;
  /** Optional: restrict browse list to a single venture (e.g. when launched
   *  from a venture-scoped surface). Undefined = across every eligible venture. */
  ventureId?: string;
}

export default function RoundBrowseModal({ open, onClose, contactId, contactName, ventureId }: Props) {
  const [selected, setSelected] = useState<Round | null>(null);

  return (
    <Modal open={open} onClose={onClose} size="lg" ariaLabel="Browse available rounds">
      <div style={{
        padding: 24, background: 'var(--surface-base)', borderRadius: 12,
        minWidth: 520, maxWidth: 680, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Hannah Sterling — Futurestate IR drives the round-match conversation. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 22,
            background: 'linear-gradient(135deg, #F472B6, #BE185D)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: '#fff', fontSize: 17,
          }}>H</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>Hannah Sterling</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Futurestate IR · @sterling</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={iconBtnStyle}>
            <XIcon size={14} />
          </button>
        </div>

        {selected ? (
          <ExpressInterestCard
            round={selected}
            contactId={contactId}
            contactName={contactName}
            onBack={() => setSelected(null)}
            onClose={onClose}
          />
        ) : (
          <BrowseList
            contactId={contactId}
            contactName={contactName}
            ventureId={ventureId}
            onSelect={setSelected}
          />
        )}
      </div>
    </Modal>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Browse list — shows Hannah's curated open rounds the investor can see.
// ───────────────────────────────────────────────────────────────────────────

function BrowseList({
  contactId, contactName, ventureId, onSelect,
}: {
  contactId: string;
  contactName: string;
  ventureId?: string;
  onSelect: (round: Round) => void;
}) {
  const { rounds, investorProfile, isLoading, error } = useRoundsForInvestor(contactId, ventureId);
  const first = contactName.split(' ')[0];

  const isVerified = investorProfile?.accreditationStatus === 'verified_accredited'
    || investorProfile?.accreditationStatus === 'qualified_purchaser'
    || investorProfile?.accreditationStatus === 'institutional';

  const accreditedRoundCount = rounds.filter((r) => r.accreditedOnly).length;

  return (
    <>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0, marginBottom: 6 }}>
        Here's what's active for you right now
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, marginBottom: 16 }}>
        {isLoading
          ? `Hang on ${first}, I'm pulling your list…`
          : rounds.length === 0
            ? `Nothing's open for you this minute, ${first}. I'll ping you the moment we cut a round that fits.`
            : isVerified
              ? `${first}, I've got ${rounds.length} ${rounds.length === 1 ? 'round' : 'rounds'} live that match your profile${accreditedRoundCount > 0 ? ` (${accreditedRoundCount} accredited-only)` : ''}. Pick one to look at.`
              : `${rounds.length} retail-open rounds you can look at today. Accredited rounds unlock after verification.`}
      </p>

      {error && (
        <ErrorRow text={error instanceof Error ? error.message : String(error)} />
      )}

      <div style={{ overflowY: 'auto', flex: 1, display: 'grid', gap: 10 }}>
        {rounds.map((r) => (
          <button key={r.id} onClick={() => onSelect(r)} style={roundCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{r.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.ventureId}</div>
            </div>
            {r.description && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.45 }}>
                {r.description}
              </p>
            )}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <Badge>{r.raiseLane}</Badge>
              <Badge>{formatMoney(r.targetRaise, r.currency)} target</Badge>
              <Badge>{formatMoney(r.totalCommitted, r.currency)} committed</Badge>
              {r.minimumCheck > 0 && <Badge>Min {formatMoney(r.minimumCheck, r.currency)}</Badge>}
              {r.accreditedOnly && (
                <span style={accreditedPillStyle}>
                  <Lock size={10} /> accredited
                </span>
              )}
              <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-brand-electric)', fontWeight: 600 }}>
                Look at it <ArrowRight size={12} />
              </span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Express-interest card — soft-commit form. v0: just an amount; D3 will
// add the real subscription flow. Default amount respects round.minimumCheck.
// ───────────────────────────────────────────────────────────────────────────

function ExpressInterestCard({
  round, contactId, contactName, onBack, onClose,
}: {
  round: Round;
  contactId: string;
  contactName: string;
  onBack: () => void;
  onClose: () => void;
}) {
  const defaultAmount = Math.max(round.minimumCheck || 0, 25000);
  const [amountInput, setAmountInput] = useState<string>(String(defaultAmount));
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createCommitment = useCreateCommitment();
  const setView = useNavigation((s) => s.setView);

  const amount = Number(amountInput.replace(/[^0-9.]/g, '')) || 0;
  const belowMin = round.minimumCheck > 0 && amount < round.minimumCheck;
  const aboveMax = round.maximumCheck !== null && amount > round.maximumCheck;
  const valid = amount > 0 && !belowMin && !aboveMax;
  const first = contactName.split(' ')[0];

  async function submit() {
    if (!valid) return;
    setError(null);
    try {
      await createCommitment.mutateAsync({
        ventureId: round.ventureId,
        contactId,
        roundId: round.id,
        amount,
        amountUsd: amount,
        currency: round.currency || 'USD',
        status: 'soft_commit',
        metadata: { source: 'round_browse_modal', via_agent: '@sterling' },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function openDetail() {
    // Pattern mirrors CapitalVentureView → CapitalRoundDetailView handoff.
    sessionStorage.setItem('capital.activeRoundId', round.id);
    setView('capital-round-detail');
    onClose();
  }

  if (done) {
    return (
      <div style={successCardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Check size={18} style={{ color: '#6EE7B7' }} />
          <span style={{ fontWeight: 600, color: '#6EE7B7', fontSize: 15 }}>
            Got it, {first}
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, marginBottom: 14, lineHeight: 1.5 }}>
          I've logged <b style={{ color: 'var(--text-primary)' }}>{formatMoney(amount, round.currency)}</b> of
          interest in <b style={{ color: 'var(--text-primary)' }}>{round.name}</b>. I'll swing by with the
          subscription docs and wire instructions next. No money has moved yet — you'll see everything before
          anything's final.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={openDetail} style={primaryBtnStyle}>
            Open round details
          </button>
          <button onClick={onClose} style={secondaryBtnStyle}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <button onClick={onBack} style={{ ...secondaryBtnStyle, padding: '4px 10px', fontSize: 11 }}>
          ← All rounds
        </button>
      </div>

      <div style={{
        padding: 14, borderRadius: 10,
        background: 'var(--surface-elevated)',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{round.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{round.ventureId}</div>
        </div>
        {round.description && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: 1.45 }}>
            {round.description}
          </p>
        )}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Badge>{round.raiseLane}</Badge>
          <Badge>{formatMoney(round.targetRaise, round.currency)} target</Badge>
          {round.minimumCheck > 0 && <Badge>Min {formatMoney(round.minimumCheck, round.currency)}</Badge>}
          {round.maximumCheck && <Badge>Max {formatMoney(round.maximumCheck, round.currency)}</Badge>}
        </div>
      </div>

      <div>
        <label style={labelStyle}>How much would you put in, {first}?</label>
        <div style={{ position: 'relative' }}>
          <span style={currencyPrefixStyle}>{round.currency === 'USD' ? '$' : round.currency}</span>
          <input
            type="text"
            inputMode="decimal"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            style={amountInputStyle}
            aria-label="Commitment amount"
          />
        </div>
        {belowMin && (
          <div style={fieldHintStyle('#F87171')}>
            Minimum for this round is {formatMoney(round.minimumCheck, round.currency)}.
          </div>
        )}
        {aboveMax && round.maximumCheck && (
          <div style={fieldHintStyle('#F87171')}>
            Maximum for this round is {formatMoney(round.maximumCheck, round.currency)}.
          </div>
        )}
        {!belowMin && !aboveMax && (
          <div style={fieldHintStyle('var(--text-muted)')}>
            This is a soft commit — it logs your interest at this size. You'll sign
            docs and wire in the next step. Nothing moves today.
          </div>
        )}
      </div>

      {error && <ErrorRow text={error} />}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={secondaryBtnStyle} disabled={createCommitment.isPending}>
          Cancel
        </button>
        <button onClick={submit} style={primaryBtnStyle} disabled={!valid || createCommitment.isPending}>
          <Sparkles size={14} />
          {createCommitment.isPending ? 'Logging…' : `Express interest — ${formatMoney(amount, round.currency)}`}
        </button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────

function ErrorRow({ text }: { text: string }) {
  return (
    <div style={{
      padding: 10, borderRadius: 8,
      background: 'rgba(248, 113, 113, 0.08)',
      border: '1px solid rgba(248, 113, 113, 0.3)',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <AlertCircle size={14} style={{ color: '#F87171' }} />
      <span style={{ fontSize: 12, color: '#F87171' }}>{text}</span>
    </div>
  );
}

function formatMoney(n: number, currency: string): string {
  if (!Number.isFinite(n)) return '—';
  const sym = currency === 'USD' ? '$' : `${currency} `;
  if (n >= 1_000_000) return `${sym}${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000)      return `${sym}${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}K`;
  return `${sym}${n.toLocaleString()}`;
}

// ───────────────────────────────────────────────────────────────────────────
// Styles
// ───────────────────────────────────────────────────────────────────────────

const iconBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 24, height: 24, borderRadius: 6,
  background: 'transparent', color: 'var(--text-muted)',
  border: '1px solid var(--border-subtle)', cursor: 'pointer',
};

const roundCardStyle: React.CSSProperties = {
  textAlign: 'left', padding: 14, borderRadius: 10,
  background: 'var(--surface-elevated)',
  border: '1px solid var(--border-subtle)',
  cursor: 'pointer', width: '100%',
  display: 'block',
};

const accreditedPillStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 3,
  padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600,
  background: 'rgba(251, 191, 36, 0.15)', color: '#FBBF24',
  border: '1px solid rgba(251, 191, 36, 0.35)',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6,
};

const currencyPrefixStyle: React.CSSProperties = {
  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
  left: 12, fontSize: 16, color: 'var(--text-muted)', pointerEvents: 'none',
};

const amountInputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px 12px 28px', borderRadius: 8,
  background: 'var(--surface-elevated)', color: 'var(--text-primary)',
  border: '1px solid var(--border-subtle)', fontSize: 18, fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
};

const fieldHintStyle = (color: string): React.CSSProperties => ({
  marginTop: 6, fontSize: 11, color, lineHeight: 1.5,
});

const primaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
  background: 'var(--color-brand-electric)', color: 'var(--surface-base)',
  border: 'none', cursor: 'pointer',
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
  background: 'transparent', color: 'var(--text-secondary)',
  border: '1px solid var(--border-subtle)', cursor: 'pointer',
};

const successCardStyle: React.CSSProperties = {
  padding: 18, borderRadius: 10,
  background: 'rgba(110, 231, 183, 0.08)',
  border: '1px solid rgba(110, 231, 183, 0.3)',
};
