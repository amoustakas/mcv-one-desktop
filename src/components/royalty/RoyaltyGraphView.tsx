// src/components/royalty/RoyaltyGraphView.tsx
//
// Main view for a venture's ACTIVE royalty graph. Shows:
//   - version + label header
//   - bps sum indicator (green if === 10000, red otherwise)
//   - ordered layer table via RoyaltyLayerRow
//   - "Add layer" button that opens RoyaltyLayerModal
import { useState } from 'react';
import { useActiveRoyaltyGraph } from '../../hooks/use-royalty-graph';
import { RoyaltyLayerRow } from './RoyaltyLayerRow';
import { RoyaltyLayerModal } from './RoyaltyLayerModal';

interface Props {
  ventureId: string | null;
}

export function RoyaltyGraphView({ ventureId }: Props) {
  const { data, isLoading } = useActiveRoyaltyGraph(ventureId);
  const [addOpen, setAddOpen] = useState(false);

  if (!ventureId) return null;
  if (isLoading) {
    return <div style={{ padding: 12, color: 'var(--text-muted)' }}>Loading royalty graph…</div>;
  }
  if (!data?.graph) {
    return (
      <div
        style={{
          padding: 12,
          color: 'var(--text-muted)',
          border: '1px dashed var(--border-subtle)',
          borderRadius: 8,
        }}
      >
        No active royalty graph for {ventureId}.
      </div>
    );
  }

  const bpsSum = data.total_bps;
  const bpsOk = bpsSum === 10000;
  const bpsColor = bpsOk ? '#6EE7B7' : '#FB7185';
  const nextSequence = (data.layers[data.layers.length - 1]?.sequence ?? 0) + 10;

  return (
    <section
      style={{
        padding: 16,
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        background: 'var(--surface-elevated)',
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 12,
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: '.15em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            Royalty graph · v{data.graph.version}
          </div>
          <h3 style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            {data.graph.label}
          </h3>
        </div>
        <div
          style={{
            padding: '4px 10px',
            borderRadius: 4,
            background: `${bpsColor}20`,
            color: bpsColor,
            fontSize: 11,
            fontWeight: 700,
            border: `1px solid ${bpsColor}40`,
          }}
        >
          {bpsSum.toLocaleString()} / 10,000 bps {bpsOk ? '✓' : '⚠'}
        </div>
      </header>

      <div style={{ display: 'grid', gap: 4, marginBottom: 12 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 120px 120px 90px 90px',
            gap: 8,
            fontSize: 10,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            padding: '0 8px',
          }}
        >
          <span>#</span>
          <span>Label</span>
          <span>Kind</span>
          <span>Recipient</span>
          <span>bps</span>
          <span>%</span>
        </div>
        {data.layers.map((l) => (
          <RoyaltyLayerRow key={l.id} layer={l} />
        ))}
      </div>

      <button
        onClick={() => setAddOpen(true)}
        style={{
          padding: '8px 12px',
          borderRadius: 6,
          background: 'var(--color-brand-electric)',
          color: 'var(--surface-base)',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        + Add layer
      </button>

      {addOpen && (
        <RoyaltyLayerModal
          graphId={data.graph.id}
          nextSequence={nextSequence}
          onClose={() => setAddOpen(false)}
        />
      )}
    </section>
  );
}
