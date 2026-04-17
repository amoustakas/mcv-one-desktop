import type { OperatorProspectInput } from '../../../hooks/use-prospects';

interface Props { input: OperatorProspectInput; onChange: (i: OperatorProspectInput) => void }

export function IdentityStep({ input, onChange }: Props) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <Field label="Full name">
        <input value={input.fullName ?? ''} onChange={(e) => onChange({ ...input, fullName: e.target.value })} style={inputStyle} placeholder="e.g., Hunter Milborne" />
      </Field>
      <Field label="Email *">
        <input value={input.email} onChange={(e) => onChange({ ...input, email: e.target.value })} style={inputStyle} placeholder="hunter@example.com" />
      </Field>
      <Field label="Country">
        <input value={input.country ?? ''} onChange={(e) => onChange({ ...input, country: e.target.value })} style={inputStyle} placeholder="Canada" />
      </Field>
      <Field label="Role hint">
        <input value={input.roleHint ?? ''} onChange={(e) => onChange({ ...input, roleHint: e.target.value })} style={inputStyle} placeholder="Real-estate developer · Milborne Group founder" />
      </Field>
      <Field label="Archetype">
        <select value={input.archetype ?? 'investor'} onChange={(e) => onChange({ ...input, archetype: e.target.value })} style={inputStyle}>
          {['investor','operator','creator','advisor','partner','contributor','customer','founder','vendor'].map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </Field>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: 8, borderRadius: 6, background: 'var(--surface-base)',
  border: '1px solid var(--border-subtle)', color: 'var(--text-primary)',
};
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label style={{ display: 'grid', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>{label}{children}</label>
);
