import type { OperatorProspectInput } from '../../../hooks/use-prospects';

interface Props { input: OperatorProspectInput; onChange: (i: OperatorProspectInput) => void }

// Minimal static persona list for T3 — full persona registry arrives in T5.
const PERSONAS = [
  { id: 'quinn', handle: 'Quinn', role: 'IR Lead · Futurestate',  accent: '#00F5FF' },
  { id: 'aegis', handle: 'Aegis', role: 'Compliance Officer',      accent: '#C4B5FD' },
  { id: 'atlas', handle: 'Atlas', role: 'Chief of Staff',          accent: '#FBBF24' },
  { id: 'forge', handle: 'Forge', role: 'Engineering Lead',        accent: '#6EE7B7' },
];

export function AssignAgentStep({ input, onChange }: Props) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Assign a persona · they lead the journey</div>
      <div style={{ display: 'grid', gap: 6 }}>
        {PERSONAS.map((p) => {
          const active = input.assignedPersonaId === p.id;
          return (
            <button key={p.id} onClick={() => onChange({ ...input, assignedPersonaId: p.id })} style={{
              display: 'flex', justifyContent: 'space-between', padding: 10,
              borderRadius: 8, border: `1px solid ${active ? p.accent : 'var(--border-subtle)'}`,
              background: active ? `${p.accent}14` : 'var(--surface-base)',
              color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left',
            }}>
              <span style={{ color: p.accent, fontWeight: 600 }}>{p.handle}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{p.role}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
