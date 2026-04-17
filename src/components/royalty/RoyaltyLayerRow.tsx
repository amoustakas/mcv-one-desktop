// src/components/royalty/RoyaltyLayerRow.tsx
//
// One row in the RoyaltyGraphView table. The bps cell is an editable number
// input that commits on blur via useUpdateRoyaltyLayer (invalidates the graph
// query so the total_bps indicator re-renders).
import { useState } from 'react';
import { useUpdateRoyaltyLayer, type RoyaltyLayer } from '../../hooks/use-royalty-graph';

const KIND_COLOR: Record<string, string> = {
  platform_rake: '#00F5FF',
  venture_rake: '#8B5CF6',
  ip_royalty: '#FBBF24',
  affiliate: '#F472B6',
  creator_share: '#6EE7B7',
  reserve: '#A78BFA',
  burn: '#FB7185',
  fee_split: '#FB923C',
  other: '#94A3B8',
};

export function RoyaltyLayerRow({ layer }: { layer: RoyaltyLayer }) {
  const [bps, setBps] = useState(layer.bps);
  const update = useUpdateRoyaltyLayer();
  const kindColor = KIND_COLOR[layer.kind] ?? '#94A3B8';

  const save = () => {
    if (bps !== layer.bps) update.mutate({ layerId: layer.id, bps });
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr 120px 120px 90px 90px',
        gap: 8,
        alignItems: 'center',
        padding: '8px 8px',
        borderRadius: 6,
        background: 'var(--surface-base)',
        borderLeft: `3px solid ${kindColor}`,
        fontSize: 11,
        color: 'var(--text-primary)',
      }}
    >
      <span style={{ color: 'var(--text-muted)' }}>{layer.sequence}</span>
      <span>{layer.label}</span>
      <span
        style={{
          color: kindColor,
          fontWeight: 600,
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '.1em',
        }}
      >
        {layer.kind.replace(/_/g, ' ')}
      </span>
      <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
        {layer.recipient_type} · {layer.recipient_id.slice(0, 20)}
        {layer.recipient_id.length > 20 ? '…' : ''}
      </span>
      <input
        type="number"
        min={0}
        max={10000}
        value={bps}
        onChange={(e) => setBps(Number(e.target.value))}
        onBlur={save}
        style={{
          padding: '4px 6px',
          borderRadius: 4,
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-primary)',
          textAlign: 'right',
          fontSize: 11,
        }}
      />
      <span style={{ color: 'var(--text-muted)', textAlign: 'right' }}>{(bps / 100).toFixed(2)}%</span>
    </div>
  );
}
