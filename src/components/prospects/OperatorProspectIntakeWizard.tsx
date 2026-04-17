// src/components/prospects/OperatorProspectIntakeWizard.tsx
import { useState } from 'react';
import { Modal } from '../ui';
import { useCreateOperatorProspect, type OperatorProspectInput } from '../../hooks/use-prospects';
import { IdentityStep } from './operator-intake-steps/IdentityStep';
import { IntelStep } from './operator-intake-steps/IntelStep';
import { RelationshipStep } from './operator-intake-steps/RelationshipStep';
import { AssignAgentStep } from './operator-intake-steps/AssignAgentStep';
import { ReviewStep } from './operator-intake-steps/ReviewStep';

const STEPS = ['identity', 'intel', 'relationship', 'assign', 'review'] as const;
type StepId = typeof STEPS[number];

interface Props { open: boolean; onClose: () => void }

export function OperatorProspectIntakeWizard({ open, onClose }: Props) {
  const [step, setStep] = useState<StepId>('identity');
  const [input, setInput] = useState<OperatorProspectInput>({
    email: '',
    track: 'investor_accredited',
    sourceVentureId: 'futurestate',
    priority: 'warm',
    archetype: 'investor',
  });

  const createProspect = useCreateOperatorProspect();

  const idx = STEPS.indexOf(step);
  const next = () => setStep(STEPS[Math.min(idx + 1, STEPS.length - 1)]);
  const back = () => setStep(STEPS[Math.max(idx - 1, 0)]);

  const submit = async () => {
    await createProspect.mutateAsync(input);
    onClose();
    setStep('identity');
    setInput({ email: '', track: 'investor_accredited', sourceVentureId: 'futurestate', priority: 'warm', archetype: 'investor' });
  };

  const canAdvance = step === 'identity' ? !!input.email : true;

  return (
    <Modal open={open} onClose={onClose} ariaLabel="Seed a prospect — operator intake">
      <div style={{ padding: 16, minWidth: 520 }}>
        <h2 style={{
          fontSize: 18, fontWeight: 700, color: 'var(--text-primary)',
          margin: 0, marginBottom: 16,
        }}>
          Seed a prospect — operator intake
        </h2>
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= idx ? 'var(--color-brand-electric)' : 'var(--border-subtle)',
            }} />
          ))}
        </div>

        {step === 'identity'     && <IdentityStep     input={input} onChange={setInput} />}
        {step === 'intel'        && <IntelStep        input={input} onChange={setInput} />}
        {step === 'relationship' && <RelationshipStep input={input} onChange={setInput} />}
        {step === 'assign'       && <AssignAgentStep  input={input} onChange={setInput} />}
        {step === 'review'       && <ReviewStep       input={input} />}

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={back} disabled={idx === 0} style={secondaryBtn}>← back</button>
          {step !== 'review' ? (
            <button onClick={next} disabled={!canAdvance} style={primaryBtn}>continue →</button>
          ) : (
            <button onClick={submit} disabled={createProspect.isPending} style={primaryBtn}>
              {createProspect.isPending ? 'seeding…' : '⚡ seed prospect'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

const primaryBtn: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
  background: 'var(--color-brand-electric)', color: 'var(--surface-base)', fontWeight: 600,
};
const secondaryBtn: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
  background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)',
};
