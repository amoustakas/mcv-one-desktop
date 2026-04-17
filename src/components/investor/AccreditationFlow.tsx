// src/components/investor/AccreditationFlow.tsx
import { useState } from 'react';
import { Modal } from '../ui';
import { useSubmitAccreditation, type RoundSummary, type AccreditationMethod } from '../../hooks/use-investor-flow';

interface Props {
  round: RoundSummary;
  contactId: string;
  onDone: () => void;
  onCancel: () => void;
}

const METHODS: Array<{ id: AccreditationMethod; label: string; blurb: string }> = [
  { id: 'self_attestation', label: 'Self-attestation', blurb: 'Fastest path. You confirm accredited-investor status on your own.' },
  { id: 'income',           label: 'Income history',    blurb: 'Upload 2 years of income tax returns or W-2s.' },
  { id: 'net_worth',        label: 'Net worth',         blurb: 'Upload brokerage + bank statements totaling $1M+ (excluding primary residence).' },
  { id: 'cpa_letter',       label: 'CPA letter',        blurb: 'Upload a signed letter from your CPA certifying accredited status.' },
  { id: 'professional_cert', label: 'Professional cert', blurb: 'Series 7, 65, or 82 license.' },
];

export function AccreditationFlow({ round, contactId, onDone, onCancel }: Props) {
  const [step, setStep] = useState<'method' | 'jurisdiction' | 'confirm'>('method');
  const [method, setMethod] = useState<AccreditationMethod | null>(null);
  const [jurisdiction, setJurisdiction] = useState('US-CA');
  const submit = useSubmitAccreditation();

  const next = () => {
    if (step === 'method' && method) setStep('jurisdiction');
    else if (step === 'jurisdiction') setStep('confirm');
  };
  const back = () => {
    if (step === 'confirm') setStep('jurisdiction');
    else if (step === 'jurisdiction') setStep('method');
  };

  const onSubmit = async () => {
    if (!method) return;
    await submit.mutateAsync({
      contactId,
      ventureId: round.venture_id,
      accreditationMethod: method,
      jurisdiction,
      documents: [],
      actorUserId: contactId,
    });
    onDone();
  };

  return (
    <Modal open={true} onClose={onCancel} ariaLabel="Accreditation verification">
      <div style={{ padding: 20, minWidth: 520 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Verify accreditation</h2>
        <p style={{ margin: '4px 0 16px', fontSize: 12, color: 'var(--text-muted)' }}>
          {round.name} requires accredited-investor status. Pick a verification method.
        </p>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {['method', 'jurisdiction', 'confirm'].map((s, i) => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: ['method', 'jurisdiction', 'confirm'].indexOf(step) >= i ? 'var(--color-brand-electric)' : 'var(--border-subtle)',
            }} />
          ))}
        </div>

        {step === 'method' && (
          <div style={{ display: 'grid', gap: 8 }}>
            {METHODS.map((m) => {
              const active = method === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  style={{
                    padding: 12, borderRadius: 8, textAlign: 'left', cursor: 'pointer',
                    background: active ? 'color-mix(in srgb, var(--color-brand-electric) 10%, transparent)' : 'var(--surface-base)',
                    border: `1px solid ${active ? 'var(--color-brand-electric)' : 'var(--border-subtle)'}`,
                    color: 'var(--text-primary)',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{m.blurb}</div>
                </button>
              );
            })}
          </div>
        )}

        {step === 'jurisdiction' && (
          <div style={{ display: 'grid', gap: 10 }}>
            <label style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Your jurisdiction (country/region code)</span>
              <input
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value.toUpperCase())}
                placeholder="US-CA"
                style={{ padding: 10, borderRadius: 6, background: 'var(--surface-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
              />
            </label>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              Format: ISO country + region, e.g., US-CA, CA-ON, SG, UK.
            </p>
          </div>
        )}

        {step === 'confirm' && method && (
          <div style={{ padding: 12, borderRadius: 8, background: 'var(--surface-base)', fontSize: 12, display: 'grid', gap: 6 }}>
            <Row label="Method" value={METHODS.find((m) => m.id === method)?.label ?? method} />
            <Row label="Jurisdiction" value={jurisdiction} />
            <Row label="Round" value={round.name} />
            <Row label="Venture" value={round.venture?.name ?? round.venture_id} />
            <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
              Review typically completes in 48 hours. You'll be notified when accreditation is verified.
            </p>
          </div>
        )}

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={step === 'method' ? onCancel : back}
                  style={{ padding: '8px 14px', borderRadius: 6, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
            {step === 'method' ? 'Cancel' : '← Back'}
          </button>
          {step !== 'confirm' ? (
            <button onClick={next} disabled={step === 'method' && !method}
                    style={{ padding: '8px 14px', borderRadius: 6, background: 'var(--color-brand-electric)', color: 'var(--surface-base)', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
              Continue →
            </button>
          ) : (
            <button onClick={onSubmit} disabled={submit.isPending}
                    style={{ padding: '8px 14px', borderRadius: 6, background: 'var(--color-brand-electric)', color: 'var(--surface-base)', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
              {submit.isPending ? 'Submitting…' : '⚡ Submit for review'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{label}</span>
    <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 12 }}>{value}</span>
  </div>
);
