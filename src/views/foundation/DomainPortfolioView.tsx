// Domain Portfolio — 4 urgency lanes for the acquisition queue.
// 🔴 red_7day rows carry the "blocks Hunter disclosure" banner since they gate
// the FutureState partnership reveal per IP Inventory §6.4.

import { useEffect } from 'react';
import { Globe, AlertOctagon } from 'lucide-react';
import { PageShell, PageHeader, GlassCard, Button } from '../../components/ui';
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
    acquisitionOrders, loading, errors,
    fetchAcquisitionOrders, seedUrgentAcquisitions,
  } = useFoundationStore();

  useEffect(() => {
    fetchAcquisitionOrders();
  }, [fetchAcquisitionOrders]);

  const buckets = urgencyBuckets(acquisitionOrders);
  const hasHunterBlockers = buckets.red_7day.some((o) => o.blocksDisclosure);

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
            alert(`Seeded ${r.inserted} new, ${r.already} already present.`);
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
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Loading acquisitions…</div>
      )}
    </PageShell>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '10px 12px', fontSize: 11,
  textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--text-muted)', fontWeight: 600,
};
const tdStyle: React.CSSProperties = { padding: '10px 12px', verticalAlign: 'top' };
