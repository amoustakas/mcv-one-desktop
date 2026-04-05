// @ts-nocheck
// src/views/CommerceDiscounts.tsx
// Discount management view — Shop Management

import { useEffect, useState } from 'react';
import { Percent, Plus, X } from 'lucide-react';
import { useCommerceSurfaceStore } from '../stores/commerce-surface';
import { useNavigation } from '../stores/navigation';
import type { Discount } from '../lib/commerce/surface-types';
import { PageShell, PageHeader, GlassCard, Badge } from '../components/ui';

const TYPE_OPTIONS = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed_amount', label: 'Fixed Amount' },
  { value: 'free_shipping', label: 'Free Shipping' },
  { value: 'bxgy', label: 'Buy X Get Y' },
];

const STATUS_COLORS: Record<string, string> = {
  active: '#10B981',
  scheduled: 'var(--color-cyan)',
  expired: '#6B7280',
  disabled: '#EF4444',
};

export default function CommerceDiscounts() {
  const { discounts, discountsLoading, fetchDiscounts, createDiscount } = useCommerceSurfaceStore();
  const { activeVenture } = useNavigation();
  const ventureId = activeVenture || 'mcv';

  const [showForm, setShowForm] = useState(false);
  const [statusTab, setStatusTab] = useState<'active' | 'all'>('active');

  // Form state
  const [code, setCode] = useState('');
  const [type, setType] = useState('percentage');
  const [value, setValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDiscounts(ventureId);
  }, [ventureId, fetchDiscounts]);

  const filtered = statusTab === 'active'
    ? discounts.filter((d: Discount) => d.status === 'active' || d.status === 'scheduled')
    : discounts;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!code || !value) return;
    setSaving(true);
    try {
      await createDiscount(ventureId, {
        code: code.toUpperCase(),
        type,
        value: parseFloat(value),
        maxUsesTotal: maxUses ? parseInt(maxUses, 10) : null,
        minimumOrderAmount: minOrder ? parseFloat(minOrder) : null,
        startsAt: startsAt || new Date().toISOString(),
        endsAt: endsAt || null,
        appliesTo: 'all',
        stackable: false,
        metadata: {},
      });
      setShowForm(false);
      setCode(''); setValue(''); setMaxUses(''); setMinOrder(''); setStartsAt(''); setEndsAt('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell scroll>
      <PageHeader title="Discounts" subtitle="Promo codes, automatic discounts, and usage stats" loading={discountsLoading} />

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['active', 'all'] as const).map((tab) => (
            <button
              key={tab}
              className={`disc-tab${statusTab === tab ? ' active' : ''}`}
              onClick={() => setStatusTab(tab)}
            >
              {tab === 'active' ? 'Active / Scheduled' : 'All Discounts'}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button className="disc-create-btn" onClick={() => setShowForm(true)}>
          <Plus size={13} /> Create Discount
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <GlassCard style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Percent size={14} style={{ color: 'var(--color-cyan)' }} /> New Discount
            </span>
            <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setShowForm(false)}>
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="disc-label">Code</label>
                <input className="disc-input" placeholder="SAVE20" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required />
              </div>
              <div>
                <label className="disc-label">Type</label>
                <select className="disc-input" value={type} onChange={(e) => setType(e.target.value)}>
                  {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="disc-label">Value {type === 'percentage' ? '(%)' : '($)'}</label>
                <input className="disc-input" type="number" min="0" placeholder="20" value={value} onChange={(e) => setValue(e.target.value)} required />
              </div>
              <div>
                <label className="disc-label">Max Uses (optional)</label>
                <input className="disc-input" type="number" min="1" placeholder="100" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
              </div>
              <div>
                <label className="disc-label">Min Order Amount ($)</label>
                <input className="disc-input" type="number" min="0" placeholder="50.00" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
              </div>
              <div>
                <label className="disc-label">Starts At</label>
                <input className="disc-input" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
              </div>
              <div>
                <label className="disc-label">Ends At (optional)</label>
                <input className="disc-input" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" className="disc-btn" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="disc-btn disc-btn--cyan" disabled={saving}>
                {saving ? 'Creating...' : 'Create Discount'}
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Discount list */}
      <GlassCard>
        <div className="disc-table-header">
          <span style={{ flex: '0 0 140px' }}>Code</span>
          <span style={{ flex: '0 0 120px' }}>Type</span>
          <span style={{ flex: '0 0 80px', textAlign: 'right' }}>Value</span>
          <span style={{ flex: '0 0 100px', textAlign: 'right' }}>Usage</span>
          <span style={{ flex: '0 0 100px' }}>Status</span>
          <span style={{ flex: '1' }}>Validity</span>
          <span style={{ flex: '0 0 100px' }}>Conditions</span>
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            {discountsLoading ? 'Loading discounts...' : 'No discounts found'}
          </div>
        )}
        {filtered.map((discount: Discount) => (
          <div key={discount.id} className="disc-table-row">
            <span style={{ flex: '0 0 140px', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--color-cyan)' }}>
              {discount.code || '(Auto)'}
            </span>
            <span style={{ flex: '0 0 120px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              {discount.type.replace('_', ' ')}
            </span>
            <span style={{ flex: '0 0 80px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`}
            </span>
            <span style={{ flex: '0 0 100px', textAlign: 'right', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {discount.usedCount}{discount.maxUsesTotal ? ` / ${discount.maxUsesTotal}` : ''}
            </span>
            <span style={{ flex: '0 0 100px' }}>
              <span style={{
                fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px',
                background: `${STATUS_COLORS[discount.status] ?? '#6B7280'}18`,
                color: STATUS_COLORS[discount.status] ?? '#6B7280',
                border: `1px solid ${STATUS_COLORS[discount.status] ?? '#6B7280'}40`,
              }}>
                {discount.status}
              </span>
            </span>
            <span style={{ flex: '1', fontSize: '11px', color: 'var(--text-muted)' }}>
              {new Date(discount.startsAt).toLocaleDateString()}
              {discount.endsAt ? ` → ${new Date(discount.endsAt).toLocaleDateString()}` : ' (no end)'}
            </span>
            <span style={{ flex: '0 0 100px', fontSize: '11px', color: 'var(--text-muted)' }}>
              {discount.minimumOrderAmount ? `Min $${discount.minimumOrderAmount}` : 'None'}
            </span>
          </div>
        ))}
      </GlassCard>

      <style>{`
        .disc-tab {
          font-size: 12px; padding: 5px 12px; border-radius: 6px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          color: var(--text-muted); cursor: pointer; transition: all 0.12s;
        }
        .disc-tab.active, .disc-tab:hover {
          background: rgba(0,245,255,0.08); color: var(--color-cyan); border-color: rgba(0,245,255,0.25);
        }
        .disc-create-btn {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; padding: 6px 14px; border-radius: 6px;
          background: rgba(0,245,255,0.08); border: 1px solid rgba(0,245,255,0.25);
          color: var(--color-cyan); cursor: pointer; transition: all 0.12s;
        }
        .disc-create-btn:hover { background: rgba(0,245,255,0.14); }
        .disc-label { font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 4px; }
        .disc-input {
          width: 100%; background: rgba(6,13,20,0.6);
          border: 1px solid rgba(0,245,255,0.12); border-radius: 6px;
          padding: 6px 10px; font-size: 12px; color: var(--text-primary);
          outline: none; transition: border-color 0.15s; box-sizing: border-box;
        }
        .disc-input:focus { border-color: rgba(0,245,255,0.35); }
        .disc-btn {
          font-size: 12px; padding: 6px 14px; border-radius: 6px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-secondary); cursor: pointer; transition: all 0.12s;
        }
        .disc-btn:hover { background: rgba(255,255,255,0.09); }
        .disc-btn--cyan { border-color: rgba(0,245,255,0.3); color: var(--color-cyan); }
        .disc-btn--cyan:hover { background: rgba(0,245,255,0.1); }
        .disc-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .disc-table-header {
          display: flex; align-items: center; padding: 8px 16px;
          border-bottom: 1px solid rgba(0,245,255,0.07);
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.8px; color: var(--text-muted); gap: 8px;
        }
        .disc-table-row {
          display: flex; align-items: center; padding: 10px 16px; gap: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.12s;
        }
        .disc-table-row:hover { background: rgba(0,245,255,0.02); }
        .disc-table-row:last-child { border-bottom: none; }
      `}</style>
    </PageShell>
  );
}
