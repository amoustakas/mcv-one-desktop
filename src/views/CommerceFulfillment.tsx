// @ts-nocheck
// src/views/CommerceFulfillment.tsx
// Fulfillment pipeline view — Shop Management

import { useEffect, useState } from 'react';
import { Truck, Package, CheckCircle, LayoutGrid, List, X } from 'lucide-react';
import { useCommerceSurfaceStore } from '../stores/commerce-surface';
import { useNavigation } from '../stores/navigation';
import type { Fulfillment } from '../lib/commerce/surface-types';
import { PageShell, PageHeader, StatCard, GlassCard } from '../components/ui';

const COLUMNS = [
  { key: 'unfulfilled', label: 'Unfulfilled', color: '#F59E0B' },
  { key: 'partially_fulfilled', label: 'Processing', color: 'var(--color-cyan)' },
  { key: 'fulfilled', label: 'Shipped', color: '#8B5CF6' },
  { key: 'delivered', label: 'Delivered', color: '#10B981' },
];

interface ShipmentModalState {
  open: boolean;
  fulfillmentId: string;
}

export default function CommerceFulfillment() {
  const {
    fulfillments, unfulfilledOrders, fulfillmentLoading,
    fetchUnfulfilledOrders, markShipped,
  } = useCommerceSurfaceStore();
  const { activeVenture } = useNavigation();
  const ventureId = activeVenture || 'mcv';

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [shipModal, setShipModal] = useState<ShipmentModalState>({ open: false, fulfillmentId: '' });
  const [trackingNum, setTrackingNum] = useState('');
  const [carrier, setCarrier] = useState('');

  useEffect(() => {
    fetchUnfulfilledOrders(ventureId);
  }, [ventureId, fetchUnfulfilledOrders]);

  const unfulfilledCount = unfulfilledOrders.length;
  const processingCount = fulfillments.filter((f: Fulfillment) => f.status === 'partially_fulfilled').length;
  const shippedCount = fulfillments.filter((f: Fulfillment) => f.status === 'fulfilled').length;
  const deliveredCount = fulfillments.filter((f: Fulfillment) => f.status === 'delivered').length;

  async function handleMarkShipped() {
    if (!shipModal.fulfillmentId) return;
    await markShipped(ventureId, shipModal.fulfillmentId, { trackingNumber: trackingNum, carrier });
    setShipModal({ open: false, fulfillmentId: '' });
    setTrackingNum('');
    setCarrier('');
  }

  function getColumnItems(colKey: string) {
    if (colKey === 'unfulfilled') {
      return unfulfilledOrders.map((o: Record<string, unknown>) => ({
        id: String(o.id ?? ''),
        orderId: String(o.id ?? ''),
        customer: `Customer ${String(o.customerId ?? '—').slice(-6)}`,
        items: Number(o.itemCount ?? 1),
        date: String(o.createdAt ?? ''),
        status: 'unfulfilled',
      }));
    }
    return fulfillments
      .filter((f: Fulfillment) => f.status === colKey)
      .map((f: Fulfillment) => ({
        id: f.id,
        orderId: f.orderId,
        customer: `Order ${f.orderId.slice(-6)}`,
        items: f.items.length,
        date: f.createdAt,
        status: f.status,
        trackingNumber: f.trackingNumber,
        carrier: f.carrier,
      }));
  }

  return (
    <PageShell scroll>
      <PageHeader title="Fulfillment" subtitle="Order fulfillment pipeline and returns" loading={fulfillmentLoading} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <StatCard label="Unfulfilled" value={String(unfulfilledCount)} icon={<Package size={16} />} accent="warning" />
        <StatCard label="Processing" value={String(processingCount)} icon={<Package size={16} />} accent="cyan" />
        <StatCard label="Shipped" value={String(shippedCount)} icon={<Truck size={16} />} accent="purple" />
        <StatCard label="Delivered" value={String(deliveredCount)} icon={<CheckCircle size={16} />} accent="cyan" />
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          className={`ff-toggle-btn${viewMode === 'kanban' ? ' active' : ''}`}
          onClick={() => setViewMode('kanban')}
        >
          <LayoutGrid size={13} /> Kanban
        </button>
        <button
          className={`ff-toggle-btn${viewMode === 'table' ? ' active' : ''}`}
          onClick={() => setViewMode('table')}
        >
          <List size={13} /> Table
        </button>
      </div>

      {viewMode === 'kanban' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', alignItems: 'start' }}>
          {COLUMNS.map((col) => {
            const items = getColumnItems(col.key);
            return (
              <div key={col.key} style={{
                background: 'rgba(6,13,20,0.8)',
                border: '1px solid rgba(0,245,255,0.08)',
                borderRadius: '10px',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '10px 14px',
                  borderBottom: `2px solid ${col.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: col.color, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    {col.label}
                  </span>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '10px',
                    background: `${col.color}18`, color: col.color, border: `1px solid ${col.color}40`,
                  }}>
                    {items.length}
                  </span>
                </div>
                <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '120px' }}>
                  {items.length === 0 && (
                    <div style={{ padding: '20px 8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
                      Empty
                    </div>
                  )}
                  {items.map((item) => (
                    <div key={item.id} className="ff-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-cyan)' }}>
                          #{item.orderId.slice(-8).toUpperCase()}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {item.items} item{item.items !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{item.customer}</div>
                      {item.trackingNumber && (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {item.carrier ? `${item.carrier}: ` : ''}{item.trackingNumber}
                        </div>
                      )}
                      {col.key === 'partially_fulfilled' && (
                        <button
                          className="ff-action-btn"
                          style={{ marginTop: '6px' }}
                          onClick={() => { setShipModal({ open: true, fulfillmentId: item.id }); setTrackingNum(''); setCarrier(''); }}
                        >
                          Create Shipment
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <GlassCard>
          <div className="ff-table-header">
            <span style={{ flex: '0 0 130px' }}>Order #</span>
            <span style={{ flex: '1' }}>Customer</span>
            <span style={{ flex: '0 0 80px' }}>Items</span>
            <span style={{ flex: '0 0 120px' }}>Date</span>
            <span style={{ flex: '0 0 120px' }}>Status</span>
            <span style={{ flex: '0 0 140px' }}>Tracking</span>
            <span style={{ flex: '0 0 100px' }}></span>
          </div>
          {COLUMNS.flatMap((col) => getColumnItems(col.key)).map((item) => (
            <div key={item.id} className="ff-table-row">
              <span style={{ flex: '0 0 130px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-cyan)' }}>
                #{item.orderId.slice(-8).toUpperCase()}
              </span>
              <span style={{ flex: '1', fontSize: '13px', color: 'var(--text-secondary)' }}>{item.customer}</span>
              <span style={{ flex: '0 0 80px', fontSize: '12px', color: 'var(--text-muted)' }}>{item.items}</span>
              <span style={{ flex: '0 0 120px', fontSize: '11px', color: 'var(--text-muted)' }}>
                {item.date ? new Date(item.date).toLocaleDateString() : '—'}
              </span>
              <span style={{ flex: '0 0 120px', fontSize: '11px', color: COLUMNS.find(c => c.key === item.status)?.color ?? 'var(--text-muted)' }}>
                {COLUMNS.find(c => c.key === item.status)?.label ?? item.status}
              </span>
              <span style={{ flex: '0 0 140px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {item.trackingNumber || '—'}
              </span>
              <span style={{ flex: '0 0 100px' }}>
                {item.status === 'partially_fulfilled' && (
                  <button
                    className="ff-action-btn"
                    onClick={() => { setShipModal({ open: true, fulfillmentId: item.id }); setTrackingNum(''); setCarrier(''); }}
                  >
                    Ship
                  </button>
                )}
              </span>
            </div>
          ))}
          {COLUMNS.flatMap((col) => getColumnItems(col.key)).length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              {fulfillmentLoading ? 'Loading...' : 'No fulfillment records'}
            </div>
          )}
        </GlassCard>
      )}

      {/* Shipment Modal */}
      {shipModal.open && (
        <div className="ff-modal-overlay" onClick={() => setShipModal(m => ({ ...m, open: false }))}>
          <div className="ff-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Create Shipment</h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setShipModal(m => ({ ...m, open: false }))}>
                <X size={16} />
              </button>
            </div>
            <label className="ff-label">Carrier</label>
            <input className="ff-input" placeholder="UPS, FedEx, USPS..." value={carrier} onChange={(e) => setCarrier(e.target.value)} style={{ marginBottom: '10px' }} />
            <label className="ff-label">Tracking Number</label>
            <input className="ff-input" placeholder="1Z999AA10123456784" value={trackingNum} onChange={(e) => setTrackingNum(e.target.value)} style={{ marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="ff-btn" onClick={() => setShipModal(m => ({ ...m, open: false }))}>Cancel</button>
              <button className="ff-btn ff-btn--cyan" onClick={handleMarkShipped}>Mark Shipped</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .ff-toggle-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 6px; font-size: 12px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          color: var(--text-muted); cursor: pointer; transition: all 0.12s;
        }
        .ff-toggle-btn.active, .ff-toggle-btn:hover {
          background: rgba(0,245,255,0.08); color: var(--color-cyan); border-color: rgba(0,245,255,0.25);
        }
        .ff-card {
          padding: 10px; border-radius: 6px;
          background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05);
          transition: border-color 0.12s;
        }
        .ff-card:hover { border-color: rgba(0,245,255,0.15); }
        .ff-action-btn {
          width: 100%; font-size: 10px; padding: 4px 8px; border-radius: 4px;
          background: rgba(0,245,255,0.06); border: 1px solid rgba(0,245,255,0.2);
          color: var(--color-cyan); cursor: pointer; transition: all 0.12s;
        }
        .ff-action-btn:hover { background: rgba(0,245,255,0.12); }
        .ff-table-header {
          display: flex; align-items: center; padding: 8px 16px;
          border-bottom: 1px solid rgba(0,245,255,0.07);
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.8px; color: var(--text-muted); gap: 8px;
        }
        .ff-table-row {
          display: flex; align-items: center; padding: 10px 16px; gap: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.12s;
        }
        .ff-table-row:hover { background: rgba(0,245,255,0.02); }
        .ff-table-row:last-child { border-bottom: none; }
        .ff-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1000;
          display: flex; align-items: center; justify-content: center;
        }
        .ff-modal {
          background: #0a1220; border: 1px solid rgba(0,245,255,0.18);
          border-radius: 12px; padding: 24px; width: 360px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        .ff-label { font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 4px; }
        .ff-input {
          width: 100%; background: rgba(6,13,20,0.8);
          border: 1px solid rgba(0,245,255,0.12); border-radius: 6px;
          padding: 7px 10px; font-size: 12px; color: var(--text-primary);
          outline: none; transition: border-color 0.15s; box-sizing: border-box;
        }
        .ff-input:focus { border-color: rgba(0,245,255,0.35); }
        .ff-btn {
          font-size: 12px; padding: 6px 14px; border-radius: 6px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-secondary); cursor: pointer; transition: all 0.12s;
        }
        .ff-btn:hover { background: rgba(255,255,255,0.09); }
        .ff-btn--cyan { border-color: rgba(0,245,255,0.3); color: var(--color-cyan); }
        .ff-btn--cyan:hover { background: rgba(0,245,255,0.1); }
      `}</style>
    </PageShell>
  );
}
