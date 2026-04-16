// MCV Sign — Operator Signing Inbox.
// Monitors envelopes across every rail (MCV Sign + DocuSign) per
// signing_envelopes.adapter. Global default, venture filter toggle.

import { useMemo, useState } from 'react';
import { FileSignature, Clock, CheckCircle2, AlertTriangle, Copy, ExternalLink } from 'lucide-react';
import { PageHeader, PageShell, StatCard, GlassCard, GridLayout, Badge, EmptyState, Tabs, Sheet } from '../components/ui';
import { useEnvelopes, useEnvelope, type EnvelopeStatus } from '../hooks/use-mcv-sign';
import { ventures as builtinVentures, getVenture } from '../lib/ventures';
import { timeAgo } from '../lib/utils';

// Badge.color inline tokens — fall back to CSS vars that already exist
// in design-system.css for Capital statuses. Keeps the palette consistent
// with CapitalGlobalView's status badges.
const STATUS_BADGE: Record<EnvelopeStatus, { label: string; color: string }> = {
  draft:       { label: 'Draft',       color: 'var(--text-muted)' },
  sent:        { label: 'Sent',        color: 'var(--accent-cyan, #00F5FF)' },
  in_progress: { label: 'In progress', color: 'var(--accent-cyan, #00F5FF)' },
  signed:      { label: 'Signed',      color: 'var(--success, #10B981)' },
  declined:    { label: 'Declined',    color: 'var(--danger, #EF4444)' },
  voided:      { label: 'Voided',      color: 'var(--text-muted)' },
  expired:     { label: 'Expired',     color: 'var(--warning, #F59E0B)' },
};

const SIGNER_BADGE: Record<'pending' | 'viewed' | 'signed' | 'declined', { label: string; color: string }> = {
  pending:  { label: 'Pending',  color: 'var(--text-muted)' },
  viewed:   { label: 'Viewed',   color: 'var(--accent-cyan, #00F5FF)' },
  signed:   { label: 'Signed',   color: 'var(--success, #10B981)' },
  declined: { label: 'Declined', color: 'var(--danger, #EF4444)' },
};

type ScopeTab = 'all' | 'venture';

export default function SigningInboxView() {
  const [scope, setScope] = useState<ScopeTab>('all');
  const [ventureId, setVentureId] = useState<string | undefined>(undefined);
  const [detailPublicId, setDetailPublicId] = useState<string | null>(null);

  const effectiveVentureId = scope === 'venture' ? ventureId : undefined;
  const { data: envelopes = [], isLoading, refetch } = useEnvelopes({ ventureId: effectiveVentureId });

  const stats = useMemo(() => {
    const s = { pending: 0, inProgress: 0, signed: 0, expired: 0 };
    for (const e of envelopes) {
      if (e.status === 'sent') s.pending++;
      else if (e.status === 'in_progress') s.inProgress++;
      else if (e.status === 'signed') s.signed++;
      else if (e.status === 'expired') s.expired++;
    }
    return s;
  }, [envelopes]);

  return (
    <PageShell scroll>
      <PageHeader
        icon={<FileSignature size={20} />}
        title="MCV Sign — Signing Inbox"
        subtitle="Envelope status across every rail"
        loading={isLoading}
        onRefresh={() => refetch()}
      />

      <Tabs
        tabs={[
          { id: 'all', label: 'All Ventures' },
          { id: 'venture', label: 'Per-Venture' },
        ]}
        active={scope}
        onChange={(id) => setScope(id as ScopeTab)}
      />

      {scope === 'venture' && (
        <div style={{ marginTop: 12 }}>
          <select
            value={ventureId ?? ''}
            onChange={(e) => setVentureId(e.target.value || undefined)}
            style={{
              padding: '8px 12px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              color: 'var(--text)',
              fontSize: 13,
            }}
          >
            <option value="">Select a venture…</option>
            {builtinVentures.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <GridLayout cols={4} gap="md">
          <StatCard icon={<Clock size={16} />} label="Pending" value={String(stats.pending)} />
          <StatCard icon={<Clock size={16} />} label="In progress" value={String(stats.inProgress)} />
          <StatCard icon={<CheckCircle2 size={16} />} label="Signed" value={String(stats.signed)} />
          <StatCard icon={<AlertTriangle size={16} />} label="Expired" value={String(stats.expired)} />
        </GridLayout>
      </div>

      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-muted)' }}>
          Envelopes ({envelopes.length})
        </h2>

        {envelopes.length === 0 && !isLoading ? (
          <EmptyState
            icon={<FileSignature size={24} />}
            title="No envelopes yet"
            description={scope === 'venture' && !ventureId
              ? 'Pick a venture to view its envelopes.'
              : 'Envelopes created from the Capital commitment flow will appear here.'}
          />
        ) : (
          <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                    <th style={th}>Subject</th>
                    <th style={th}>Rail</th>
                    <th style={th}>Venture</th>
                    <th style={th}>Signers</th>
                    <th style={th}>Status</th>
                    <th style={th}>Created</th>
                    <th style={th}>Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {envelopes.map((e) => {
                    const venture = e.ventureId ? getVenture(e.ventureId) : undefined;
                    const badge = STATUS_BADGE[e.status];
                    return (
                      <tr
                        key={e.id}
                        onClick={() => setDetailPublicId(e.publicId)}
                        style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                      >
                        <td style={td}>
                          <div style={{ fontWeight: 500 }}>{e.subject ?? '(no subject)'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {e.publicId}
                          </div>
                        </td>
                        <td style={td}>
                          <Badge variant="outline">{e.adapter}</Badge>
                        </td>
                        <td style={td}>{venture?.name ?? (e.ventureId ? e.ventureId.slice(0, 8) : '—')}</td>
                        <td style={td}>{e.signedCount}/{e.signerCount}</td>
                        <td style={td}>
                          <Badge color={badge.color}>{badge.label}</Badge>
                        </td>
                        <td style={td}>{timeAgo(e.createdAt)}</td>
                        <td style={td}>
                          {e.status === 'signed' || e.status === 'voided'
                            ? '—'
                            : new Date(e.expiresAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </div>

      {detailPublicId && (
        <EnvelopeDetailDrawer
          publicId={detailPublicId}
          onClose={() => setDetailPublicId(null)}
        />
      )}
    </PageShell>
  );
}

// ─── Detail drawer ──────────────────────────────────────────────

function EnvelopeDetailDrawer({ publicId, onClose }: { publicId: string; onClose: () => void }) {
  const { data, isLoading } = useEnvelope(publicId);

  return (
    <Sheet open onClose={onClose} side="right" size="lg" title={`Envelope ${publicId}`}>
      {isLoading || !data ? (
        <div style={{ padding: 24, color: 'var(--text-muted)' }}>Loading envelope…</div>
      ) : (
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <EnvelopeHeader envelope={data.envelope} />
          <SignerList signers={data.signers} envelopeStatus={data.envelope.status} />
          <AuditTrail events={data.audit} />
        </div>
      )}
    </Sheet>
  );
}

function EnvelopeHeader({ envelope }: { envelope: import('../lib/capital/sign/envelope').GetEnvelopeOperatorResult['envelope'] }) {
  const badge = STATUS_BADGE[envelope.status];
  return (
    <GlassCard style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
            {envelope.subject ?? '(no subject)'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {envelope.publicId}
          </div>
        </div>
        <Badge color={badge.color}>{badge.label}</Badge>
      </div>
      <dl style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px', fontSize: 12 }}>
        <dt style={dt}>Rail</dt><dd style={dd}>{envelope.adapter}</dd>
        <dt style={dt}>Content hash</dt>
        <dd style={{ ...dd, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          {envelope.contentHash.slice(0, 16)}…{envelope.contentHash.slice(-8)}
        </dd>
        <dt style={dt}>Created</dt><dd style={dd}>{new Date(envelope.createdAt).toLocaleString()}</dd>
        <dt style={dt}>Expires</dt><dd style={dd}>{new Date(envelope.expiresAt).toLocaleString()}</dd>
        {envelope.completedAt && (
          <>
            <dt style={dt}>Completed</dt>
            <dd style={dd}>{new Date(envelope.completedAt).toLocaleString()}</dd>
          </>
        )}
        {envelope.completionSigningKey && (
          <>
            <dt style={dt}>Issuer kid</dt>
            <dd style={{ ...dd, fontFamily: 'var(--font-mono)', fontSize: 11 }}>{envelope.completionSigningKey}</dd>
          </>
        )}
      </dl>
      {envelope.message && (
        <div style={{ marginTop: 12, padding: 8, background: 'var(--bg-elevated)', borderRadius: 4, fontSize: 12 }}>
          {envelope.message}
        </div>
      )}
    </GlassCard>
  );
}

function SignerList({
  signers,
  envelopeStatus,
}: {
  signers: import('../lib/capital/sign/envelope').GetEnvelopeOperatorResult['signers'];
  envelopeStatus: EnvelopeStatus;
}) {
  const canCopyLink = envelopeStatus === 'sent' || envelopeStatus === 'in_progress';
  return (
    <GlassCard style={{ padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Signers ({signers.length})</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {signers.map((s) => (
          <div
            key={s.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              background: 'var(--bg-elevated)',
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 500 }}>
                {s.name ?? s.email} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>· #{s.ordinal + 1}</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                {s.email} {s.role && `· ${s.role}`}
              </div>
              {s.signedAt && (
                <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                  Signed {new Date(s.signedAt).toLocaleString()}
                  {s.ipAddress && ` · ${s.ipAddress}`}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <SignerStatusBadge status={s.status} />
              {canCopyLink && s.status !== 'signed' && (
                <CopySigningHintButton email={s.email} />
              )}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function SignerStatusBadge({ status }: { status: 'pending' | 'viewed' | 'signed' | 'declined' }) {
  const b = SIGNER_BADGE[status];
  return <Badge color={b.color}>{b.label}</Badge>;
}

function CopySigningHintButton({ email }: { email: string }) {
  // The raw token is never retrievable from the DB — it was emitted
  // once at create-envelope time. This button helps the operator
  // remember to re-send from their mail client rather than rebuilding
  // a bad link. Wiring up a re-issue-token action is future work.
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(email)}
      title="Copy signer email (raw token not retrievable — resend from original create-envelope response)"
      style={{
        padding: '4px 8px',
        fontSize: 11,
        background: 'transparent',
        border: '1px solid var(--border)',
        borderRadius: 4,
        color: 'var(--text-muted)',
        cursor: 'pointer',
      }}
    >
      <Copy size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
      email
    </button>
  );
}

function AuditTrail({
  events,
}: {
  events: import('../lib/capital/sign/envelope').GetEnvelopeOperatorResult['audit'];
}) {
  return (
    <GlassCard style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Audit trail ({events.length})</div>
        <ExternalLink size={12} style={{ color: 'var(--text-muted)' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {events.map((e) => (
          <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: 8, fontSize: 11, padding: '4px 0' }}>
            <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {new Date(e.createdAt).toLocaleTimeString()}
            </div>
            <div>
              <span style={{ fontWeight: 500 }}>{e.eventType}</span>
              {e.actor && <span style={{ color: 'var(--text-muted)' }}> · {e.actor}</span>}
            </div>
            <div style={{ color: 'var(--text-muted)' }}>{e.actorType}</div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── Style helpers ──────────────────────────────────────────────

const th: React.CSSProperties = { padding: '10px 12px', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 };
const td: React.CSSProperties = { padding: '10px 12px', verticalAlign: 'middle' };
const dt: React.CSSProperties = { color: 'var(--text-muted)' };
const dd: React.CSSProperties = { margin: 0 };
