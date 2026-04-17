import type { VentureActivity } from '../../hooks/use-venture-detail';

const ACTIVITY_GLYPH: Record<string, string> = {
  email: 'EMAIL', call: 'CALL', meeting: 'MEET', note: 'NOTE',
  portal_view: 'VIEW', portal_login: 'LOGIN',
  doc_sent: 'DOC', doc_signed: 'SIGN',
  payment_received: '+$', payment_sent: '-$',
  status_change: 'CHG', token_distributed: 'TOK',
  enrichment: 'ENR', system: 'SYS',
  accreditation_submitted: 'ACC', soft_commit_created: 'COM', soft_commit_updated: 'UPD', payment_kicked_off: 'PAY',
};

export function VentureActivitiesFeed({ activities }: { activities: VentureActivity[] }) {
  if (activities.length === 0) {
    return (
      <section>
        <SectionHeader label="Recent activity" count={0} />
        <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 11, fontStyle: 'italic', border: '1px dashed var(--border-subtle)', borderRadius: 8, textAlign: 'center' }}>
          No activity yet.
        </div>
      </section>
    );
  }

  return (
    <section>
      <SectionHeader label="Recent activity" count={activities.length} />
      <div style={{ display: 'grid', gap: 6 }}>
        {activities.map((a) => (
          <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '50px 1fr auto', gap: 10, alignItems: 'baseline', padding: '6px 10px', borderRadius: 6, background: 'var(--surface-base)' }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', color: 'var(--color-brand-electric)' }}>
              {ACTIVITY_GLYPH[a.activity_type] ?? a.activity_type.slice(0, 4).toUpperCase()}
            </span>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>{a.title}</div>
              {a.description && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{a.description.slice(0, 120)}{a.description.length > 120 ? '…' : ''}</div>}
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {new Date(a.occurred_at).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
      <div style={{ fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        {label} · {count}
      </div>
    </div>
  );
}
