import type { OperatorProspectInput } from '../../../hooks/use-prospects';

interface Props { input: OperatorProspectInput; onChange: (i: OperatorProspectInput) => void }

export function RelationshipStep({ input, onChange }: Props) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <Field label="Relationship history">
        <textarea value={input.relationshipHistory ?? ''} onChange={(e) => onChange({ ...input, relationshipHistory: e.target.value })} style={{ ...inputStyle, minHeight: 80 }} placeholder="When/how you met · prior touchpoints · mutual connections" />
      </Field>
      <Field label="Operator notes (private — you + NAOS only)">
        <textarea value={input.operatorNotes ?? ''} onChange={(e) => onChange({ ...input, operatorNotes: e.target.value })} style={{ ...inputStyle, minHeight: 80 }} placeholder="Candid read · what they want · what they fear · what closes them" />
      </Field>
      <Field label="Prior deals / interactions (one per line)">
        <textarea
          value={Array.isArray(input.priorDeals) ? (input.priorDeals as string[]).join('\n') : ''}
          onChange={(e) => onChange({ ...input, priorDeals: e.target.value.split('\n').filter(Boolean) })}
          style={{ ...inputStyle, minHeight: 60 }}
          placeholder="2024 Q3 · invested $50k in previous RE syndicate" />
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
