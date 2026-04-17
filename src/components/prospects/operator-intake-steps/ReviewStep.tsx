import type { OperatorProspectInput } from '../../../hooks/use-prospects';

interface Props { input: OperatorProspectInput }

export function ReviewStep({ input }: Props) {
  const rows: Array<[string, React.ReactNode]> = [
    ['Name',           input.fullName ?? '—'],
    ['Email',          input.email],
    ['Country',        input.country ?? '—'],
    ['Role',           input.roleHint ?? '—'],
    ['Archetype',      input.archetype ?? '—'],
    ['AUM',            input.aumEstimate ? `$${input.aumEstimate.toLocaleString()}` : '—'],
    ['Check size',     input.checkSizeRange ?? '—'],
    ['Priority',       input.priority ?? 'medium'],
    ['Track',          input.track],
    ['Source venture', input.sourceVentureId ?? '—'],
    ['Assigned persona', input.assignedPersonaId ?? '— (none)'],
  ];
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Confirm and seed</div>
      {rows.map(([k, v], i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', borderRadius: 4, background: i % 2 === 0 ? 'transparent' : 'var(--surface-elevated)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{k}</span>
          <span style={{ color: 'var(--text-primary)', fontSize: 12 }}>{v}</span>
        </div>
      ))}
    </div>
  );
}
