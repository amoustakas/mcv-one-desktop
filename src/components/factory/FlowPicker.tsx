// src/components/factory/FlowPicker.tsx
import type { FactoryFlow, FactoryPillar } from '../../lib/factory-client';

const PILLAR_COLOR: Record<FactoryPillar, string> = {
  oracle: 'var(--color-brand-electric)',
  forge: 'var(--color-brand-purple)',
  bloodstream: '#FB7185',
  architect: '#FBBF24',
  crucible: '#6EE7B7',
  heartbeat: '#94A3B8',
  scheduler: '#A78BFA',
};

interface Props {
  flows: FactoryFlow[];
  selected: string | null;
  onSelect: (flow_name: string) => void;
}

export function FlowPicker({ flows, selected, onSelect }: Props) {
  const by_pillar = flows.reduce<Record<string, FactoryFlow[]>>((acc, f) => {
    (acc[f.pillar] ??= []).push(f);
    return acc;
  }, {});
  const pillar_order: FactoryPillar[] = ['oracle', 'forge', 'bloodstream', 'architect', 'crucible', 'heartbeat', 'scheduler'];

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {pillar_order.filter((p) => by_pillar[p]?.length).map((pillar) => {
        const c = PILLAR_COLOR[pillar];
        return (
          <section key={pillar}>
            <div style={{ fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', color: c, fontWeight: 700, marginBottom: 6 }}>
              {pillar}
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              {by_pillar[pillar].map((f) => {
                const active = selected === f.name;
                return (
                  <button
                    key={f.name}
                    onClick={() => onSelect(f.name)}
                    style={{
                      padding: '8px 10px', borderRadius: 6, textAlign: 'left',
                      border: `1px solid ${active ? c : 'var(--border-subtle)'}`,
                      background: active ? `color-mix(in srgb, ${c} 12%, transparent)` : 'var(--surface-base)',
                      color: 'var(--text-primary)', cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace', color: active ? c : 'var(--text-primary)' }}>{f.name}</div>
                    {f.description && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{f.description}</div>}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
