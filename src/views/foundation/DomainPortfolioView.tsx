// Domain Portfolio — 4 urgency lanes for the acquisition queue.
// 🔴 red_7day rows carry the "blocks Hunter disclosure" banner since they gate
// the FutureState partnership reveal per IP Inventory §6.4.

import { useEffect } from 'react';
import { Globe, AlertOctagon } from 'lucide-react';
import { PageShell, PageHeader, GlassCard, Button } from '../../components/ui';
import TableSkeleton from '../../components/common/TableSkeleton';
import CopyButton from '../../components/common/CopyButton';
import { useToast } from '../../components/Toasts';
import { Chip } from './_chip';
import {
  useFoundationStore,
  URGENCY_LABEL,
  urgencyBuckets,
  type AcquisitionOrder,
} from '../../stores/foundation';

const URGENCY_ORDER: AcquisitionOrder['urgencyTier'][] = [
  'red_7day', 'orange_30day', 'yellow_90day', 'green_defensive',
];

const URGENCY_COLOR: Record<AcquisitionOrder['urgencyTier'], string> = {
  red_7day: '#EF4444',
  orange_30day: '#F59E0B',
  yellow_90day: '#FACC15',
  green_defensive: '#10B981',
};

export default function DomainPortfolioView() {
  const {
    acquisitionOrders, ownedDomains, loading, errors,
    fetchAcquisitionOrders, fetchOwnedDomains, seedUrgentAcquisitions,
  } = useFoundationStore();
  const { toast } = useToast();

  useEffect(() => {
    fetchAcquisitionOrders();
    fetchOwnedDomains();
  }, [fetchAcquisitionOrders, fetchOwnedDomains]);

  const buckets = urgencyBuckets(acquisitionOrders);
  const hasHunterBlockers = buckets.red_7day.some((o) => o.blocksDisclosure);

  // Expiry tone helper — 30 days red, 90 days amber, otherwise neutral.
  const today = new Date();
  const daysUntil = (iso: string | null): number | null => {
    if (!iso) return null;
    const diff = (new Date(iso).getTime() - today.getTime()) / 86_400_000;
    return Math.floor(diff);
  };
  const expiryTone = (d: number | null): 'error' | 'warning' | 'muted' | 'success' => {
    if (d == null) return 'muted';
    if (d < 0) return 'error';
    if (d <= 30) return 'error';
    if (d <= 90) return 'warning';
    return 'success';
  };

  return (
    <PageShell>
      <PageHeader
        title="Domain Portfolio"
        subtitle="Acquisition queue across 4 urgency tiers — domain / mark / asset buys"
        icon={<Globe size={20} />}
      >
        <Button
          variant="primary"
          onClick={async () => {
            const r = await seedUrgentAcquisitions();
            toast(
              'success',
              `${r.inserted} domain acquisitions staged`,
              r.already > 0
                ? `${r.already} already tracked. Ready to brief.`
                : 'Ready to brief.',
            );
          }}
        >
          Seed 🔴🟠 urgents
        </Button>
      </PageHeader>

      {hasHunterBlockers && (
        <GlassCard style={{
          padding: 16,
          marginBottom: 16,
          borderColor: '#EF4444',
          background: 'linear-gradient(90deg, rgba(239,68,68,0.12), rgba(239,68,68,0.02))',
        }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <AlertOctagon size={20} style={{ color: '#EF4444', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: '#EF4444' }}>
                {buckets.red_7day.filter((o) => o.blocksDisclosure).length} domains gate the FutureState disclosure
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Hunter Milborne / Kirill Soloviev partnership cannot be announced until these domains are acquired.
                Ref IP Inventory §6.4 — acquire within 7 days.
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {errors.acquisitionOrders && (
        <GlassCard style={{ padding: 12, marginBottom: 16, borderColor: 'var(--error)' }}>
          <span style={{ color: 'var(--error)' }}>{errors.acquisitionOrders}</span>
        </GlassCard>
      )}

      {/* ─── Owned Domains (Namecheap-synced registry) ───────────────────
          Hydrated by scripts/seed-domain-registry.ts calling Namecheap API.
          See docs: supabase/migration-domain-registry-2026-04-17.sql.        */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          margin: '0 0 8px 0',
        }}>
          <h3 style={{
            margin: 0, fontSize: 12, textTransform: 'uppercase',
            letterSpacing: 1.2, color: 'var(--text)',
          }}>
            Owned Domains · {ownedDomains.length}
          </h3>
          {ownedDomains.length > 0 && ownedDomains[0].last_synced_at && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Last Namecheap sync:{' '}
              {new Date(ownedDomains[0].last_synced_at).toLocaleString()}
            </span>
          )}
        </div>

        {errors.ownedDomains && (
          <GlassCard style={{ padding: 12, marginBottom: 8, borderColor: 'var(--error)' }}>
            <span style={{ color: 'var(--error)' }}>{errors.ownedDomains}</span>
          </GlassCard>
        )}

        {ownedDomains.length === 0 && !loading.ownedDomains ? (
          <GlassCard style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>
            No owned domains synced yet. Run{' '}
            <code style={{ color: 'var(--text)' }}>npx tsx scripts/seed-domain-registry.ts</code>{' '}
            to hydrate from Namecheap.
          </GlassCard>
        ) : (
          <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <th style={thStyle}>Domain</th>
                  <th style={thStyle}>Registrar</th>
                  <th style={thStyle}>Venture</th>
                  <th style={thStyle}>Expires</th>
                  <th style={thStyle}>Auto-renew</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {ownedDomains.map((d) => {
                  const days = daysUntil(d.expires_at);
                  const tone = expiryTone(days);
                  return (
                    <tr key={d.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600 }}>
                          {d.fqdn}
                          <CopyButton value={d.fqdn} />
                        </div>
                        {d.parent_entity_id && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            Parent: {d.parent_entity_id}
                          </div>
                        )}
                      </td>
                      <td style={tdStyle}>{d.registrar ?? '—'}</td>
                      <td style={tdStyle}>{d.venture_id ?? '—'}</td>
                      <td style={tdStyle}>
                        {d.expires_at ? (
                          <>
                            <div>{d.expires_at}</div>
                            {days != null && (
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                {days < 0 ? `${Math.abs(days)}d expired` : `${days}d left`}
                              </div>
                            )}
                          </>
                        ) : '—'}
                      </td>
                      <td style={tdStyle}>
                        {d.auto_renew == null
                          ? '—'
                          : d.auto_renew
                            ? <Chip tone="success">on</Chip>
                            : <Chip tone="warning">off</Chip>}
                      </td>
                      <td style={tdStyle}>
                        <Chip tone={tone}>
                          {d.status}
                        </Chip>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </GlassCard>
        )}

        {loading.ownedDomains && ownedDomains.length === 0 && (
          <TableSkeleton rows={3} columns={6} />
        )}
      </div>

      {URGENCY_ORDER.map((tier) => (
        <div key={tier} style={{ marginBottom: 20 }}>
          <h3 style={{
            margin: '0 0 8px 0',
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            color: URGENCY_COLOR[tier],
          }}>
            {URGENCY_LABEL[tier]} · {buckets[tier].length}
          </h3>

          {buckets[tier].length === 0 ? (
            <GlassCard style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>
              No acquisitions in this tier.
            </GlassCard>
          ) : (
            <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <th style={thStyle}>Asset</th>
                    <th style={thStyle}>Kind</th>
                    <th style={thStyle}>Registrar</th>
                    <th style={thStyle}>Price CAD</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Blocks</th>
                  </tr>
                </thead>
                <tbody>
                  {buckets[tier].map((o) => (
                    <tr key={o.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600 }}>{o.assetIdentifier}</div>
                        {o.notes && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {o.notes.slice(0, 140)}{o.notes.length > 140 ? '…' : ''}
                          </div>
                        )}
                      </td>
                      <td style={tdStyle}>{o.assetKind.replace(/_/g, ' ')}</td>
                      <td style={tdStyle}>{o.targetRegistrar ?? '—'}</td>
                      <td style={tdStyle}>
                        {o.priceCad != null ? `C$${o.priceCad.toFixed(2)}` : '—'}
                      </td>
                      <td style={tdStyle}>
                        <Chip tone={o.status === 'acquired' ? 'success' : 'muted'}>{o.status}</Chip>
                      </td>
                      <td style={tdStyle}>
                        {o.blocksDisclosure
                          ? <Chip tone="error">⚠ {o.blocksVentureName ?? 'disclosure'}</Chip>
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          )}
        </div>
      ))}

      {loading.acquisitionOrders && acquisitionOrders.length === 0 && (
        <TableSkeleton rows={3} columns={6} />
      )}
    </PageShell>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '10px 12px', fontSize: 11,
  textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--text-muted)', fontWeight: 600,
};
const tdStyle: React.CSSProperties = { padding: '10px 12px', verticalAlign: 'top' };
