// src/components/royalty/RoyaltyLayerModal.tsx
//
// "Add layer" form — all fields (label, kind, recipient_type, recipient_id,
// bps, sequence) with light client-side validation. Submits via
// useAddRoyaltyLayer; server-side the handler re-validates against the
// CHECK constraints.
import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Modal } from '../ui';
import {
  useAddRoyaltyLayer,
  type RoyaltyKind,
  type RoyaltyRecipientType,
} from '../../hooks/use-royalty-graph';

interface Props {
  graphId: string;
  nextSequence: number;
  onClose: () => void;
}

const KINDS: RoyaltyKind[] = [
  'platform_rake',
  'venture_rake',
  'ip_royalty',
  'affiliate',
  'creator_share',
  'reserve',
  'burn',
  'fee_split',
  'other',
];
const RECIPIENT_TYPES: RoyaltyRecipientType[] = ['treasury', 'user', 'external_entity', 'pool'];

export function RoyaltyLayerModal({ graphId, nextSequence, onClose }: Props) {
  const [label, setLabel] = useState('');
  const [recipientType, setRecipientType] = useState<RoyaltyRecipientType>('treasury');
  const [recipientId, setRecipientId] = useState('');
  const [kind, setKind] = useState<RoyaltyKind>('venture_rake');
  const [bps, setBps] = useState(500);
  const [sequence, setSequence] = useState(nextSequence);
  const add = useAddRoyaltyLayer();

  const submit = async () => {
    if (!label || !recipientId) return;
    await add.mutateAsync({ graphId, sequence, label, recipientType, recipientId, bps, kind });
    onClose();
  };

  const inputStyle: CSSProperties = {
    padding: 8,
    borderRadius: 6,
    background: 'var(--surface-base)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)',
  };

  return (
    <Modal open={true} onClose={onClose} ariaLabel="Add royalty layer">
      <div style={{ padding: 20, minWidth: 480, display: 'grid', gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Add royalty layer</h2>
        <Field label="Label">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            style={inputStyle}
            placeholder="e.g., MCV.Tech platform rake"
          />
        </Field>
        <Field label="Kind">
          <select value={kind} onChange={(e) => setKind(e.target.value as RoyaltyKind)} style={inputStyle}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Recipient type">
          <select
            value={recipientType}
            onChange={(e) => setRecipientType(e.target.value as RoyaltyRecipientType)}
            style={inputStyle}
          >
            {RECIPIENT_TYPES.map((rt) => (
              <option key={rt} value={rt}>
                {rt}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Recipient ID">
          <input
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            style={inputStyle}
            placeholder="treasury-id or user uuid or pool-id"
          />
        </Field>
        <Field label={`bps (0-10000) · ${(bps / 100).toFixed(2)}%`}>
          <input
            type="number"
            min={0}
            max={10000}
            value={bps}
            onChange={(e) => setBps(Number(e.target.value))}
            style={inputStyle}
          />
        </Field>
        <Field label="Sequence">
          <input
            type="number"
            value={sequence}
            onChange={(e) => setSequence(Number(e.target.value))}
            style={inputStyle}
          />
        </Field>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!label || !recipientId || add.isPending}
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              background: 'var(--color-brand-electric)',
              color: 'var(--surface-base)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            {add.isPending ? 'Adding…' : '+ Add layer'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label style={{ display: 'grid', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
    {label}
    {children}
  </label>
);
