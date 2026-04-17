// src/views/investor/RoundBrowseView.tsx
import { useState } from 'react';
import { usePublicRounds, type RoundSummary } from '../../hooks/use-investor-flow';
import { RoundCard } from '../../components/investor/RoundCard';
import { AccreditationFlow } from '../../components/investor/AccreditationFlow';
import { SoftCommitModal } from '../../components/investor/SoftCommitModal';

// Placeholder — in production this comes from Clerk session
// For M2 dev, use the Hunter contact uuid so the flow exercises realistic data.
const DEMO_CONTACT_ID = '13412fb1-9e51-453b-b768-0395e6c34f26';

export function RoundBrowseView() {
  const { data, isLoading } = usePublicRounds();
  const rounds = data?.rounds ?? [];
  const [active, setActive] = useState<RoundSummary | null>(null);
  const [flow, setFlow] = useState<'accreditation' | 'commit' | null>(null);

  const onInvest = (round: RoundSummary) => {
    setActive(round);
    setFlow(round.accredited_only ? 'accreditation' : 'commit');
  };

  const onAccreditationComplete = () => setFlow('commit');
  const onCommitDone = () => { setActive(null); setFlow(null); };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--color-brand-electric)', fontWeight: 700 }}>
          MCV Capital
        </div>
        <h1 style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>
          Open rounds
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
          Sovereign-backed ventures under EdgeIQ Holdings. Invest once, compound forever.
        </p>
      </header>

      {isLoading && <div style={{ color: 'var(--text-muted)' }}>Loading open rounds…</div>}

      {!isLoading && rounds.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-subtle)', borderRadius: 12 }}>
          No open rounds right now. Check back soon.
        </div>
      )}

      {rounds.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: 16,
        }}>
          {rounds.map((r) => <RoundCard key={r.id} round={r} onInvest={onInvest} />)}
        </div>
      )}

      {active && flow === 'accreditation' && (
        <AccreditationFlow
          round={active}
          contactId={DEMO_CONTACT_ID}
          onDone={onAccreditationComplete}
          onCancel={onCommitDone}
        />
      )}

      {active && flow === 'commit' && (
        <SoftCommitModal
          round={active}
          contactId={DEMO_CONTACT_ID}
          onDone={onCommitDone}
          onCancel={onCommitDone}
        />
      )}
    </div>
  );
}

export default RoundBrowseView;
