// src/components/investor/SoftCommitModal.tsx
import { useState } from 'react';
import { Modal } from '../ui';
import { useCreateSoftCommit, type RoundSummary } from '../../hooks/use-investor-flow';

interface Props {
  round: RoundSummary;
  contactId: string;
  onDone: () => void;
  onCancel: () => void;
}

export function SoftCommitModal({ round, contactId, onDone, onCancel }: Props) {
  const [amount, setAmount] = useState<number>(Number(round.minimum_check) || 25000);
  const [paymentMethod, setPaymentMethod] = useState<string>('stripe_ach');
  const [notes, setNotes] = useState('');
  const commit = useCreateSoftCommit();
  const [serverError, setServerError] = useState<string | null>(null);

  const belowMin = amount < Number(round.minimum_check || 0);
  const aboveMax = round.maximum_check != null && amount > Number(round.maximum_check);
  const canSubmit = !belowMin && !aboveMax && amount > 0 && !commit.isPending;

  const onSubmit = async () => {
    setServerError(null);
    try {
      await commit.mutateAsync({
        contactId,
        roundId: round.id,
        amount,
        currency: round.currency,
        paymentMethod,
        notes: notes || undefined,
        source: 'investor_portal',
      });
      onDone();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Soft commit failed');
    }
  };

  return (
    <Modal open={true} onClose={onCancel} ariaLabel={`Reserve allocation in ${round.name}`}>
      <div style={{ padding: 20, minWidth: 480 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Reserve your allocation</h2>
        <p style={{ margin: '4px 0 16px', fontSize: 12, color: 'var(--text-muted)' }}>
          {round.venture?.name ?? round.venture_id} · {round.name}
        </p>

        <label style={{ display: 'grid', gap: 4, marginBottom: 14 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Amount ({round.currency})</span>
          <input
            type="number"
            value={amount || ''}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder={String(round.minimum_check)}
            style={{
              padding: 10, borderRadius: 6,
              background: 'var(--surface-base)',
              border: `1px solid ${belowMin || aboveMax ? '#FB7185' : 'var(--border-subtle)'}`,
              color: 'var(--text-primary)', fontSize: 18, fontWeight: 700,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
            <span>min ${Number(round.minimum_check).toLocaleString()}</span>
            {round.maximum_check && <span>max ${Number(round.maximum_check).toLocaleString()}</span>}
          </div>
          {belowMin && <span style={{ fontSize: 11, color: '#FB7185' }}>Below minimum check size.</span>}
          {aboveMax && <span style={{ fontSize: 11, color: '#FB7185' }}>Above maximum check size.</span>}
        </label>

        <label style={{ display: 'grid', gap: 4, marginBottom: 14 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Payment rail</span>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ padding: 10, borderRadius: 6, background: 'var(--surface-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
            <option value="stripe_ach">ACH (bank transfer)</option>
            <option value="stripe_card">Card</option>
            <option value="wire">Wire</option>
            <option value="crypto_usdc">USDC (crypto)</option>
          </select>
        </label>

        <label style={{ display: 'grid', gap: 4, marginBottom: 14 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Notes (optional)</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                    style={{ padding: 10, borderRadius: 6, background: 'var(--surface-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', minHeight: 54 }}
                    placeholder="Anything we should know?" />
        </label>

        {serverError && (
          <div style={{ padding: 10, borderRadius: 6, background: '#FB718520', color: '#FB7185', fontSize: 11, marginBottom: 10 }}>
            {serverError}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={onCancel}
                  style={{ padding: '8px 14px', borderRadius: 6, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={onSubmit} disabled={!canSubmit}
                  style={{
                    padding: '8px 20px', borderRadius: 6,
                    background: canSubmit ? 'var(--color-brand-electric)' : 'var(--border-subtle)',
                    color: 'var(--surface-base)', border: 'none',
                    cursor: canSubmit ? 'pointer' : 'not-allowed',
                    fontWeight: 700,
                  }}>
            {commit.isPending ? 'Reserving…' : '⚡ Reserve allocation'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
