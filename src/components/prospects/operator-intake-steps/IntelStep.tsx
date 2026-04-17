import type { OperatorProspectInput } from '../../../hooks/use-prospects';

interface Props { input: OperatorProspectInput; onChange: (i: OperatorProspectInput) => void }

export function IntelStep({ input, onChange }: Props) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <Field label="AUM estimate (USD)">
        <input type="number" value={input.aumEstimate ?? ''} onChange={(e) => onChange({ ...input, aumEstimate: e.target.value ? Number(e.target.value) : undefined })} style={inputStyle} placeholder="50000000" />
      </Field>
      <Field label="Check size range">
        <input value={input.checkSizeRange ?? ''} onChange={(e) => onChange({ ...input, checkSizeRange: e.target.value })} style={inputStyle} placeholder="$25k–$250k" />
      </Field>
      <Field label="Investor thesis">
        <textarea value={input.investorThesis ?? ''} onChange={(e) => onChange({ ...input, investorThesis: e.target.value })} style={{ ...inputStyle, minHeight: 60 }} placeholder="What they care about · sectors · stage · geography" />
      </Field>
      <Field label="LinkedIn">
        <input value={input.socialProfiles?.linkedin ?? ''} onChange={(e) => onChange({ ...input, socialProfiles: { ...(input.socialProfiles ?? {}), linkedin: e.target.value } })} style={inputStyle} placeholder="https://linkedin.com/in/…" />
      </Field>
      <Field label="Twitter / X">
        <input value={input.socialProfiles?.twitter ?? ''} onChange={(e) => onChange({ ...input, socialProfiles: { ...(input.socialProfiles ?? {}), twitter: e.target.value } })} style={inputStyle} />
      </Field>
      <Field label="Priority">
        <select value={input.priority ?? 'warm'} onChange={(e) => onChange({ ...input, priority: e.target.value as OperatorProspectInput['priority'] })} style={inputStyle}>
          <option value="hot">🔥 hot</option>
          <option value="warm">warm</option>
          <option value="medium">medium</option>
          <option value="cold">cold</option>
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
