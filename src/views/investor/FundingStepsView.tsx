// src/views/investor/FundingStepsView.tsx
// T6.7 — final consumer-UI view for Marathon #2. Surfaces a single commitment's
// lifecycle (interest → soft_committed → reserved → funded → distributed) with
// per-stage CTA. Polls via useCommitment until funded/distributed.

import { useCommitment } from '../../hooks/use-commitment';
import { useKickoffPayment } from '../../hooks/use-investor-flow';
import { PaymentProgressStrip } from '../../components/investor/PaymentProgressStrip';

interface Props {
  commitmentId: string;
}

export function FundingStepsView({ commitmentId }: Props) {
  const { data, isLoading } = useCommitment(commitmentId);
  const kickoff = useKickoffPayment();

  if (isLoading) {
    return (
      <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading commitment…</div>
    );
  }
  if (!data?.commitment) {
    return (
      <div style={{ padding: 40, color: 'var(--text-muted)' }}>Commitment not found.</div>
    );
  }

  const c = data.commitment;

  const onKickoff = async () => {
    if (!c.payment_method) {
      alert('Select a payment method first via the commit modal.');
      return;
    }
    await kickoff.mutateAsync({ commitmentId: c.id, paymentMethod: c.payment_method });
  };

  const needsKickoff = c.status === 'soft_committed';
  const waitingFund = c.status === 'reserved';
  const funded = c.status === 'funded' || c.status === 'distributed';

  return (
    <div style={{ padding: '24px 32px', maxWidth: 800, margin: '0 auto' }}>
      <header style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: 'var(--color-brand-electric)',
            fontWeight: 700,
          }}
        >
          Your commitment
        </div>
        <h1
          style={{
            margin: '4px 0 0',
            fontSize: 24,
            fontWeight: 800,
            color: 'var(--text-primary)',
          }}
        >
          {c.currency} {Number(c.amount).toLocaleString()}
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
          Round {c.round_id.slice(0, 8)}… · Status{' '}
          <b style={{ color: 'var(--color-brand-electric)' }}>{c.status}</b>
        </p>
      </header>

      <div style={{ marginBottom: 24 }}>
        <PaymentProgressStrip commitment={c} />
      </div>

      <div
        style={{
          padding: 20,
          borderRadius: 12,
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border-subtle)',
          display: 'grid',
          gap: 14,
        }}
      >
        {needsKickoff && (
          <>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)' }}>
              Your allocation is reserved. Kick off payment to move from soft-commit → funded.
            </p>
            <button
              onClick={onKickoff}
              disabled={kickoff.isPending}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                background: 'var(--color-brand-electric)',
                color: 'var(--surface-base)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              {kickoff.isPending
                ? 'Kicking off…'
                : `⚡ Kick off payment (${c.payment_method ?? 'pick method'})`}
            </button>
          </>
        )}

        {waitingFund && (
          <>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)' }}>
              Payment in flight. This page auto-refreshes every 4 seconds until funded.
            </p>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Reference: <code>{c.payment_reference ?? '—'}</code>
            </div>
          </>
        )}

        {funded && (
          <>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: 'var(--color-brand-electric)',
                fontWeight: 600,
              }}
            >
              🎉 Funded. Your allocation is confirmed.
            </p>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Funded at {c.funded_at ? new Date(c.funded_at).toLocaleString() : '—'}.
              {c.distributed_at && (
                <> Distributed at {new Date(c.distributed_at).toLocaleString()}.</>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
