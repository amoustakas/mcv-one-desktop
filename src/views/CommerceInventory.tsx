// @ts-nocheck
// src/views/CommerceInventory.tsx
// Inventory management view — Shop Management

import { useEffect, useState } from 'react';
import { Layers, AlertTriangle, Plus, ArrowRightLeft } from 'lucide-react';
import { useCommerceSurfaceStore } from '../stores/commerce-surface';
import { useNavigation } from '../stores/navigation';
import type { InventoryLevel } from '../lib/commerce/surface-types';
import { PageShell, PageHeader, StatCard, GlassCard } from '../components/ui';

interface AdjustModalState {
  open: boolean;
  productId: string;
  productName: string;
  current: number;
}

export default function CommerceInventory() {
  const {
    inventory, lowStockProducts, inventoryLoading,
    fetchLowStock, adjustInventory,
  } = useCommerceSurfaceStore();
  const { activeVenture } = useNavigation();
  const ventureId = activeVenture || 'mcv';

  const [adjustModal, setAdjustModal] = useState<AdjustModalState>({
    open: false, productId: '', productName: '', current: 0,
  });
  const [adjustQty, setAdjustQty] = useState('0');
  const [adjustReason, setAdjustReason] = useState('');

  useEffect(() => {
    fetchLowStock(ventureId, 10);
  }, [ventureId, fetchLowStock]);

  const totalSKUs = inventory.length;
  const lowStockCount = lowStockProducts.length;
  const outOfStock = inventory.filter((i: InventoryLevel) => i.available <= 0).length;
  const totalUnits = inventory.reduce((sum: number, i: InventoryLevel) => sum + (i.onHand ?? 0), 0);

  async function handleAdjust() {
    if (!adjustModal.productId) return;
    await adjustInventory(ventureId, adjustModal.productId, 'default', parseInt(adjustQty, 10), adjustReason);
    setAdjustModal({ open: false, productId: '', productName: '', current: 0 });
    setAdjustQty('0');
    setAdjustReason('');
    fetchLowStock(ventureId, 10);
  }

  function stockColor(available: number, threshold: number): string {
    if (available <= 0) return '#EF4444';
    if (available <= threshold) return '#EF4444';
    if (available <= threshold * 2) return '#F59E0B';
    return 'var(--text-secondary)';
  }

  return (
    <PageShell scroll>
      <PageHeader title="Inventory" subtitle="Stock levels, thresholds, and adjustments" loading={inventoryLoading} />

      {lowStockCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 16px', borderRadius: '8px', marginBottom: '16px',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
        }}>
          <AlertTriangle size={16} style={{ color: '#EF4444', flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: '#EF4444', fontWeight: 500 }}>
            {lowStockCount} product{lowStockCount !== 1 ? 's' : ''} below low-stock threshold
          </span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <StatCard label="Total SKUs" value={String(totalSKUs)} icon={<Layers size={16} />} accent="cyan" />
        <StatCard label="Low Stock" value={String(lowStockCount)} icon={<AlertTriangle size={16} />} accent="warning" />
        <StatCard label="Out of Stock" value={String(outOfStock)} icon={<AlertTriangle size={16} />} accent="warning" />
        <StatCard label="Total Units" value={totalUnits.toLocaleString()} icon={<Layers size={16} />} accent="purple" />
      </div>

      {/* Inventory table */}
      <GlassCard>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(0,245,255,0.07)' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)' }}>
            Inventory Levels
          </span>
        </div>

        <div className="inv-table-header">
          <span style={{ flex: '1' }}>Product</span>
          <span style={{ flex: '0 0 120px' }}>SKU</span>
          <span style={{ flex: '0 0 80px', textAlign: 'right' }}>Available</span>
          <span style={{ flex: '0 0 80px', textAlign: 'right' }}>Reserved</span>
          <span style={{ flex: '0 0 80px', textAlign: 'right' }}>Committed</span>
          <span style={{ flex: '0 0 80px', textAlign: 'right' }}>On Hand</span>
          <span style={{ flex: '0 0 80px', textAlign: 'right' }}>Threshold</span>
          <span style={{ flex: '0 0 80px', textAlign: 'center' }}>Actions</span>
        </div>

        {inventory.length === 0 && lowStockProducts.length > 0 && (
          // Show low stock products as inventory rows
          lowStockProducts.map((item: Record<string, unknown>, idx: number) => (
            <div key={String(item.id ?? idx)} className="inv-table-row">
              <span style={{ flex: '1', fontSize: '13px', color: 'var(--text-primary)' }}>
                {String(item.name ?? item.productId ?? 'Unknown')}
              </span>
              <span style={{ flex: '0 0 120px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                {String(item.sku ?? '—')}
              </span>
              <span style={{ flex: '0 0 80px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#EF4444', fontWeight: 600 }}>
                {String(item.available ?? 0)}
              </span>
              <span style={{ flex: '0 0 80px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
              <span style={{ flex: '0 0 80px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
              <span style={{ flex: '0 0 80px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
              <span style={{ flex: '0 0 80px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                {String(item.threshold ?? 10)}
              </span>
              <span style={{ flex: '0 0 80px', textAlign: 'center', display: 'flex', gap: '4px', justifyContent: 'center' }}>
                <button
                  className="inv-icon-btn"
                  title="Adjust stock"
                  onClick={() => {
                    setAdjustModal({ open: true, productId: String(item.productId ?? item.id ?? ''), productName: String(item.name ?? ''), current: Number(item.available ?? 0) });
                    setAdjustQty('0');
                  }}
                >
                  <Plus size={12} />
                </button>
              </span>
            </div>
          ))
        )}

        {inventory.map((inv: InventoryLevel) => {
          const threshold = inv.lowStockThreshold ?? 10;
          const available = inv.available ?? 0;
          const color = stockColor(available, threshold);
          return (
            <div key={inv.id} className="inv-table-row">
              <span style={{ flex: '1', fontSize: '13px', color: 'var(--text-primary)' }}>
                {inv.productId}
              </span>
              <span style={{ flex: '0 0 120px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                {inv.sku ?? '—'}
              </span>
              <span style={{ flex: '0 0 80px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px', color, fontWeight: available <= threshold ? 700 : 400 }}>
                {available}
              </span>
              <span style={{ flex: '0 0 80px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                {inv.reserved ?? 0}
              </span>
              <span style={{ flex: '0 0 80px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                {inv.committed ?? 0}
              </span>
              <span style={{ flex: '0 0 80px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {inv.onHand ?? 0}
              </span>
              <span style={{ flex: '0 0 80px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                {threshold}
              </span>
              <span style={{ flex: '0 0 80px', textAlign: 'center', display: 'flex', gap: '4px', justifyContent: 'center' }}>
                <button
                  className="inv-icon-btn"
                  title="Adjust stock"
                  onClick={() => {
                    setAdjustModal({ open: true, productId: inv.productId, productName: inv.productId, current: available });
                    setAdjustQty('0');
                  }}
                >
                  <Plus size={12} />
                </button>
                <button className="inv-icon-btn" title="Transfer"><ArrowRightLeft size={12} /></button>
              </span>
            </div>
          );
        })}

        {inventory.length === 0 && lowStockProducts.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            {inventoryLoading ? 'Loading inventory...' : 'No inventory data. Products with tracked inventory will appear here.'}
          </div>
        )}
      </GlassCard>

      {/* Adjust Stock Modal */}
      {adjustModal.open && (
        <div className="inv-modal-overlay" onClick={() => setAdjustModal(m => ({ ...m, open: false }))}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
              Adjust Stock — {adjustModal.productName}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Current: {adjustModal.current} units
            </p>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Adjustment (positive = add, negative = remove)
            </label>
            <input
              className="inv-input"
              type="number"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              style={{ marginBottom: '10px' }}
            />
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Reason
            </label>
            <input
              className="inv-input"
              placeholder="Damage, restock, audit..."
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              style={{ marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="inv-btn" onClick={() => setAdjustModal(m => ({ ...m, open: false }))}>Cancel</button>
              <button className="inv-btn inv-btn--cyan" onClick={handleAdjust}>Apply</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .inv-table-header {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          border-bottom: 1px solid rgba(0,245,255,0.07);
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--text-muted);
          gap: 8px;
        }
        .inv-table-row {
          display: flex;
          align-items: center;
          padding: 10px 16px;
          gap: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          transition: background 0.12s;
        }
        .inv-table-row:hover { background: rgba(0,245,255,0.02); }
        .inv-table-row:last-child { border-bottom: none; }
        .inv-icon-btn {
          display: flex; align-items: center; justify-content: center;
          width: 24px; height: 24px; border-radius: 4px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          color: var(--text-muted); cursor: pointer; transition: all 0.12s;
        }
        .inv-icon-btn:hover { background: rgba(0,245,255,0.08); color: var(--color-cyan); border-color: rgba(0,245,255,0.3); }
        .inv-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1000;
          display: flex; align-items: center; justify-content: center;
        }
        .inv-modal {
          background: #0a1220; border: 1px solid rgba(0,245,255,0.18);
          border-radius: 12px; padding: 24px; width: 360px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        .inv-input {
          width: 100%; background: rgba(6,13,20,0.8);
          border: 1px solid rgba(0,245,255,0.12); border-radius: 6px;
          padding: 7px 10px; font-size: 12px; color: var(--text-primary);
          outline: none; transition: border-color 0.15s; box-sizing: border-box;
        }
        .inv-input:focus { border-color: rgba(0,245,255,0.35); }
        .inv-btn {
          font-size: 12px; padding: 6px 14px; border-radius: 6px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-secondary); cursor: pointer; transition: all 0.12s;
        }
        .inv-btn:hover { background: rgba(255,255,255,0.09); }
        .inv-btn--cyan { border-color: rgba(0,245,255,0.3); color: var(--color-cyan); }
        .inv-btn--cyan:hover { background: rgba(0,245,255,0.1); }
      `}</style>
    </PageShell>
  );
}
