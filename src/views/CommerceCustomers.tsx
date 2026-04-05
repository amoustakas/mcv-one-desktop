// @ts-nocheck
// src/views/CommerceCustomers.tsx
// Customer management view — Shop Management

import { useEffect, useState } from 'react';
import { Users2, Search, ChevronDown, ChevronRight, UserPlus, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { useCommerceSurfaceStore } from '../stores/commerce-surface';
import { useNavigation } from '../stores/navigation';
import type { Customer } from '../lib/commerce/surface-types';
import { PageShell, PageHeader, StatCard, GlassCard, Badge } from '../components/ui';
import { formatMoney } from '../lib/utils';

const SEGMENT_OPTIONS = [
  { value: '', label: 'All Segments' },
  { value: 'high_value', label: 'High Value' },
  { value: 'repeat', label: 'Repeat' },
  { value: 'new', label: 'New' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'dormant', label: 'Dormant' },
  { value: 'whale', label: 'Whale' },
];

const SEGMENT_COLORS: Record<string, string> = {
  high_value: '#10B981',
  whale: '#8B5CF6',
  repeat: 'var(--color-cyan)',
  new: '#3B82F6',
  at_risk: '#F59E0B',
  dormant: '#6B7280',
  subscription_active: '#10B981',
};

export default function CommerceCustomers() {
  const { customers, customersLoading, fetchCustomers } = useCommerceSurfaceStore();
  const { activeVenture } = useNavigation();
  const ventureId = activeVenture || 'mcv';

  const [segment, setSegment] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers(ventureId, segment || undefined);
  }, [ventureId, segment, fetchCustomers]);

  const filtered = customers.filter((c: Customer) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.email.toLowerCase().includes(q) ||
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q)
    );
  });

  const totalCustomers = customers.length;
  const newCustomers = customers.filter((c: Customer) => c.segments?.includes('new')).length;
  const repeatCustomers = customers.filter((c: Customer) => c.segments?.includes('repeat')).length;
  const atRisk = customers.filter((c: Customer) => c.segments?.includes('at_risk')).length;

  return (
    <PageShell scroll>
      <PageHeader title="Customers" subtitle="Customer management and segmentation" loading={customersLoading} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <StatCard label="Total Customers" value={String(totalCustomers)} icon={<Users2 size={16} />} accent="cyan" />
        <StatCard label="New (30d)" value={String(newCustomers)} icon={<UserPlus size={16} />} accent="cyan" />
        <StatCard label="Repeat" value={String(repeatCustomers)} icon={<RefreshCw size={16} />} accent="purple" />
        <StatCard label="At Risk" value={String(atRisk)} icon={<AlertTriangle size={16} />} accent="warning" />
      </div>

      {/* Filter bar */}
      <GlassCard style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '180px' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="cust-input"
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '30px' }}
            />
          </div>
          <select className="cust-input" value={segment} onChange={(e) => setSegment(e.target.value)} style={{ width: '160px' }}>
            {SEGMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </GlassCard>

      {/* Customer table */}
      <GlassCard>
        <div className="cust-table-header">
          <span style={{ flex: '1' }}>Customer</span>
          <span style={{ flex: '1' }}>Email</span>
          <span style={{ flex: '0 0 80px', textAlign: 'right' }}>Orders</span>
          <span style={{ flex: '0 0 100px', textAlign: 'right' }}>Total Spent</span>
          <span style={{ flex: '0 0 200px' }}>Segments</span>
          <span style={{ flex: '0 0 100px' }}>Last Order</span>
          <span style={{ flex: '0 0 32px' }}></span>
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            {customersLoading ? 'Loading customers...' : 'No customers found'}
          </div>
        )}
        {filtered.map((customer: Customer) => {
          const isExpanded = expandedId === customer.id;
          return (
            <div key={customer.id} className="cust-row-wrap">
              <div
                className="cust-table-row"
                onClick={() => setExpandedId(isExpanded ? null : customer.id)}
                style={{ cursor: 'pointer' }}
              >
                <span style={{ flex: '1', fontWeight: 500, fontSize: '13px', color: 'var(--text-primary)' }}>
                  {customer.firstName} {customer.lastName}
                </span>
                <span style={{ flex: '1', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {customer.email}
                </span>
                <span style={{ flex: '0 0 80px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                  {customer.totalOrders ?? 0}
                </span>
                <span style={{ flex: '0 0 100px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-cyan)' }}>
                  {formatMoney(customer.totalSpent ?? 0)}
                </span>
                <span style={{ flex: '0 0 200px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {(customer.segments ?? []).slice(0, 3).map((seg: string) => (
                    <span
                      key={seg}
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: `${SEGMENT_COLORS[seg] ?? '#6B7280'}18`,
                        color: SEGMENT_COLORS[seg] ?? '#6B7280',
                        border: `1px solid ${SEGMENT_COLORS[seg] ?? '#6B7280'}40`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {seg.replace('_', ' ')}
                    </span>
                  ))}
                </span>
                <span style={{ flex: '0 0 100px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  {customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString() : '—'}
                </span>
                <span style={{ flex: '0 0 32px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              </div>

              {isExpanded && (
                <div className="cust-expanded">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div>
                      <p className="cust-detail-label">Contact</p>
                      <p className="cust-detail-val">Email: {customer.email}</p>
                      <p className="cust-detail-val">Phone: {customer.phone || '—'}</p>
                      <p className="cust-detail-val">Group: {customer.group || '—'}</p>
                    </div>
                    <div>
                      <p className="cust-detail-label">Lifetime Value</p>
                      <p className="cust-detail-val">LTV: {formatMoney(customer.ltv ?? 0)}</p>
                      <p className="cust-detail-val">AOV: {formatMoney(customer.averageOrderValue ?? 0)}</p>
                      <p className="cust-detail-val">First Order: {customer.firstOrderAt ? new Date(customer.firstOrderAt).toLocaleDateString() : '—'}</p>
                    </div>
                    <div>
                      <p className="cust-detail-label">Notes</p>
                      <p className="cust-detail-val" style={{ whiteSpace: 'pre-wrap', fontSize: '11px' }}>
                        {customer.notes || 'No notes'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </GlassCard>

      <style>{`
        .cust-input {
          width: 100%;
          background: rgba(6,13,20,0.6);
          border: 1px solid rgba(0,245,255,0.12);
          border-radius: 6px;
          padding: 6px 10px;
          font-size: 12px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.15s;
        }
        .cust-input:focus { border-color: rgba(0,245,255,0.35); }
        .cust-table-header {
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
        .cust-table-row {
          display: flex;
          align-items: center;
          padding: 10px 16px;
          gap: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          transition: background 0.12s;
        }
        .cust-table-row:hover { background: rgba(0,245,255,0.02); }
        .cust-row-wrap:last-child .cust-table-row { border-bottom: none; }
        .cust-expanded {
          padding: 14px 16px 16px;
          background: rgba(0,0,0,0.15);
          border-bottom: 1px solid rgba(0,245,255,0.06);
        }
        .cust-detail-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--text-muted);
          margin-bottom: 6px;
        }
        .cust-detail-val { font-size: 12px; color: var(--text-secondary); margin-bottom: 3px; }
      `}</style>
    </PageShell>
  );
}
