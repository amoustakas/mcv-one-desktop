// @ts-nocheck
// src/views/CommerceOrders.tsx
// Order processing view — Shop Management

import { useEffect, useState } from 'react';
import { Package, Search, ChevronDown, ChevronRight, ShoppingBag, Truck, CheckCircle, Clock } from 'lucide-react';
import { useCommerceStore } from '../stores/commerce';
import { useNavigation } from '../stores/navigation';
import { PageShell, PageHeader, StatCard, GlassCard, Badge } from '../components/ui';
import { formatMoney } from '../lib/utils';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

function statusColor(status: string): string {
  switch (status) {
    case 'pending': return 'var(--color-cyan)';
    case 'processing': return '#F59E0B';
    case 'shipped': return '#8B5CF6';
    case 'delivered': return '#10B981';
    case 'cancelled': return '#EF4444';
    default: return 'var(--text-muted)';
  }
}

function paymentStatusColor(status: string): string {
  if (status === 'paid') return '#10B981';
  if (status === 'pending') return '#F59E0B';
  if (status === 'failed' || status === 'refunded') return '#EF4444';
  return 'var(--text-muted)';
}

export default function CommerceOrders() {
  const { invoices, invoicesLoading, fetchInvoices } = useCommerceStore();
  const { activeVenture } = useNavigation();
  const ventureId = activeVenture || 'mcv';

  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices(ventureId);
  }, [ventureId, fetchInvoices]);

  // Use invoices as order proxies (real orders would come from an orders store)
  const filtered = invoices.filter((inv) => {
    if (statusFilter && inv.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return inv.id.toLowerCase().includes(q) || inv.customerId?.toLowerCase().includes(q);
    }
    return true;
  });

  const newCount = invoices.filter((i) => i.status === 'draft').length;
  const processingCount = invoices.filter((i) => i.status === 'pending').length;
  const shippedCount = invoices.filter((i) => i.status === 'sent').length;
  const deliveredCount = invoices.filter((i) => i.status === 'paid').length;

  return (
    <PageShell scroll>
      <PageHeader title="Orders" subtitle="Order processing and fulfillment management" loading={invoicesLoading} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <StatCard label="New Orders" value={String(newCount)} icon={<ShoppingBag size={16} />} accent="cyan" />
        <StatCard label="Processing" value={String(processingCount)} icon={<Clock size={16} />} accent="warning" />
        <StatCard label="Shipped" value={String(shippedCount)} icon={<Truck size={16} />} accent="purple" />
        <StatCard label="Delivered" value={String(deliveredCount)} icon={<CheckCircle size={16} />} accent="cyan" />
      </div>

      {/* Filter bar */}
      <GlassCard style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '180px' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="co-input"
              placeholder="Search order # or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '30px' }}
            />
          </div>
          <select className="co-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '160px' }}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </GlassCard>

      {/* Orders table */}
      <GlassCard>
        <div className="co-table-header">
          <span style={{ flex: '0 0 120px' }}>Order #</span>
          <span style={{ flex: '1' }}>Customer</span>
          <span style={{ flex: '0 0 110px' }}>Date</span>
          <span style={{ flex: '0 0 100px', textAlign: 'right' }}>Total</span>
          <span style={{ flex: '0 0 110px' }}>Status</span>
          <span style={{ flex: '0 0 110px' }}>Payment</span>
          <span style={{ flex: '0 0 40px' }}></span>
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            {invoicesLoading ? 'Loading orders...' : 'No orders found'}
          </div>
        )}
        {filtered.map((order) => {
          const isExpanded = expandedId === order.id;
          return (
            <div key={order.id} className="co-row-wrap">
              <div
                className="co-table-row"
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
                style={{ cursor: 'pointer' }}
              >
                <span style={{ flex: '0 0 120px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-cyan)' }}>
                  #{order.id.slice(-8).toUpperCase()}
                </span>
                <span style={{ flex: '1', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {order.customerId ? `Customer ${order.customerId.slice(-6)}` : 'Walk-in'}
                </span>
                <span style={{ flex: '0 0 110px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
                <span style={{ flex: '0 0 100px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                  {formatMoney(order.total)}
                </span>
                <span style={{ flex: '0 0 110px' }}>
                  <Badge
                    variant="custom"
                    style={{ background: `${statusColor(order.status)}18`, color: statusColor(order.status), border: `1px solid ${statusColor(order.status)}40` }}
                  >
                    {order.status}
                  </Badge>
                </span>
                <span style={{ flex: '0 0 110px' }}>
                  <Badge
                    variant="custom"
                    style={{ background: `${paymentStatusColor(order.status)}18`, color: paymentStatusColor(order.status), border: `1px solid ${paymentStatusColor(order.status)}40` }}
                  >
                    {order.status === 'paid' ? 'Paid' : order.status === 'void' ? 'Void' : 'Pending'}
                  </Badge>
                </span>
                <span style={{ flex: '0 0 40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              </div>

              {isExpanded && (
                <div className="co-expanded">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div>
                      <p className="co-detail-label">Order Details</p>
                      <p className="co-detail-val">ID: {order.id}</p>
                      <p className="co-detail-val">Due: {order.dueDate ? new Date(order.dueDate).toLocaleDateString() : '—'}</p>
                      <p className="co-detail-val">Notes: {order.notes || '—'}</p>
                    </div>
                    <div>
                      <p className="co-detail-label">Financials</p>
                      <p className="co-detail-val">Subtotal: {formatMoney(order.subtotal)}</p>
                      <p className="co-detail-val">Tax: {formatMoney(order.taxTotal)}</p>
                      <p className="co-detail-val">Total: {formatMoney(order.total)}</p>
                    </div>
                    <div>
                      <p className="co-detail-label">Actions</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                        <button className="co-action-btn">Mark as Processing</button>
                        <button className="co-action-btn co-action-btn--cyan">Create Fulfillment</button>
                        <button className="co-action-btn co-action-btn--danger">Cancel Order</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </GlassCard>

      <style>{`
        .co-input {
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
        .co-input:focus { border-color: rgba(0,245,255,0.35); }
        .co-table-header {
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
        .co-table-row {
          display: flex;
          align-items: center;
          padding: 10px 16px;
          gap: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          transition: background 0.12s;
        }
        .co-table-row:hover { background: rgba(0,245,255,0.02); }
        .co-row-wrap:last-child .co-table-row { border-bottom: none; }
        .co-expanded {
          padding: 14px 16px 16px;
          background: rgba(0,0,0,0.15);
          border-bottom: 1px solid rgba(0,245,255,0.06);
        }
        .co-detail-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--text-muted);
          margin-bottom: 6px;
        }
        .co-detail-val { font-size: 12px; color: var(--text-secondary); margin-bottom: 3px; }
        .co-action-btn {
          font-size: 11px;
          padding: 5px 10px;
          border-radius: 5px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.12s;
          text-align: left;
        }
        .co-action-btn:hover { background: rgba(255,255,255,0.09); color: var(--text-primary); }
        .co-action-btn--cyan { border-color: rgba(0,245,255,0.25); color: var(--color-cyan); }
        .co-action-btn--cyan:hover { background: rgba(0,245,255,0.08); }
        .co-action-btn--danger { border-color: rgba(239,68,68,0.25); color: #EF4444; }
        .co-action-btn--danger:hover { background: rgba(239,68,68,0.08); }
      `}</style>
    </PageShell>
  );
}
