// src/components/distributions/DistributionCreateModal.tsx
import { useState } from 'react';
import { Modal } from '../ui';
import { useCreateDistribution, type DistributionType } from '../../hooks/use-distributions';

interface Props { defaultVentureId?: string; onClose: () => void; onCreated?: (id: string) => void }

const TYPES: DistributionType[] = ['dividend', 'interest', 'yield', 'token_airdrop', 'buyback', 'return_of_capital', 'fee_rebate', 'other'];

export function DistributionCreateModal({ defaultVentureId, onClose, onCreated }: Props) {
  const [ventureId, setVentureId] = useState(defaultVentureId ?? '');
  const [distributionType, setDistributionType] = useState<DistributionType>('yield');
  const [totalAmount, setTotalAmount] = useState<number>(10000);
  const [currency, setCurrency] = useState('USD');
  const [scheduledFor, setScheduledFor] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);

  const create = useCreateDistribution();
  const canSubmit = !!ventureId && totalAmount > 0 && !create.isPending;

  const onSubmit = async () => {
    setServerError(null);
    try {
      const r = await create.mutateAsync({
        ventureId, distributionType, totalAmount, currency,
        scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
        notes: notes || undefined,
      });
      onCreated?.(r.distribution.id);
      onClose();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Create failed');
    }
  };

  const inputStyle: React.CSSProperties = { padding: 10, borderRadius: 6, background: 'var(--surface-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 12 };

  return (
    <Modal open={true} onClose={onClose} ariaLabel="Schedule distribution">
      <div style={{ padding: 22, minWidth: 480, display: 'grid', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Schedule distribution</h2>

        <Field label="Venture ID">
          <input value={ventureId} onChange={(e) => setVentureId(e.target.value)} placeholder="mcv-tech" style={inputStyle} />
        </Field>

        <Field label="Type">
          <select value={distributionType} onChange={(e) => setDistributionType(e.target.value as DistributionType)} style={inputStyle}>
            {TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 10 }}>
          <Field label="Total amount">
            <input type="number" min={0} value={totalAmount || ''} onChange={(e) => setTotalAmount(Number(e.target.value))} style={inputStyle} />
          </Field>
          <Field label="Currency">
            <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} style={inputStyle} />
          </Field>
        </div>

        <Field label="Scheduled for (optional · defaults to now)">
          <input type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} style={inputStyle} />
        </Field>

        <Field label="Notes (optional)">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...inputStyle, minHeight: 60 }} placeholder="Internal memo" />
        </Field>

        {serverError && (
          <div style={{ padding: 10, borderRadius: 6, background: '#FB718520', color: '#FB7185', fontSize: 11 }}>{serverError}</div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 14px', borderRadius: 6, background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={onSubmit} disabled={!canSubmit}
            style={{ padding: '8px 16px', borderRadius: 6, background: canSubmit ? 'var(--color-brand-electric)' : 'var(--border-subtle)', color: 'var(--surface-base)', border: 'none', cursor: canSubmit ? 'pointer' : 'not-allowed', fontWeight: 700 }}>
            {create.isPending ? 'Scheduling…' : 'Schedule'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label style={{ display: 'grid', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>{label}{children}</label>
);
