// @ts-nocheck
// src/views/CommerceProducts.tsx
// Super Admin — Product Catalog

import { useEffect, useState } from 'react';
import { Tag, Search, Filter } from 'lucide-react';
import { useCommerceStore } from '../stores/commerce';
import type { Product, ProductType, ProductStatus } from '../lib/commerce/types';
import { PageShell, PageHeader, GlassCard, Badge } from '../components/ui';
import { formatMoney } from '../lib/utils';

const PRODUCT_TYPES: { value: ProductType | ''; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'one_time', label: 'One-Time' },
  { value: 'digital', label: 'Digital' },
  { value: 'physical', label: 'Physical' },
  { value: 'service', label: 'Service' },
  { value: 'credit_pack', label: 'Credit Pack' },
  { value: 'metered', label: 'Metered' },
];

const PRODUCT_STATUSES: { value: ProductStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
  { value: 'draft', label: 'Draft' },
];

function statusAccent(status: string): 'green' | 'cyan' | 'warning' | 'muted' {
  if (status === 'active') return 'green';
  if (status === 'draft') return 'cyan';
  if (status === 'inactive') return 'warning';
  return 'muted';
}

export default function CommerceProducts() {
  const { products, productsLoading, fetchProducts } = useCommerceStore();

  const [typeFilter, setTypeFilter] = useState<ProductType | ''>('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | ''>('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts('mcv', typeFilter || undefined, statusFilter || undefined);
  }, [fetchProducts, typeFilter, statusFilter]);

  const filtered = products.filter((p: Product) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q) ||
      (p.description?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <PageShell scroll>
      <PageHeader title="Products" subtitle="Product catalog across all ventures" loading={productsLoading} />

      {/* Filter Bar */}
      <div className="cp-filter-bar">
        <div className="cp-search-wrap">
          <Search size={13} className="cp-search-icon" />
          <input
            className="cp-search"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="cp-select-wrap">
          <Filter size={12} />
          <select
            className="cp-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ProductType | '')}
          >
            {PRODUCT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="cp-select-wrap">
          <Filter size={12} />
          <select
            className="cp-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProductStatus | '')}
          >
            {PRODUCT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <span className="cp-count">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Product Grid */}
      {productsLoading ? (
        <div className="cp-loading">
          <div className="cp-spinner" />
          <span>Loading products...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="cp-empty">
          <Tag size={32} style={{ opacity: 0.3 }} />
          <p>No products found</p>
        </div>
      ) : (
        <div className="cp-grid">
          {filtered.map((p: Product) => (
            <GlassCard key={p.id} className="cp-card">
              <div className="cp-card-top">
                <div className="cp-card-info">
                  <span className="cp-name">{p.name}</span>
                  {p.description && <span className="cp-desc">{p.description}</span>}
                </div>
                <Badge variant={statusAccent((p as { status: string }).status)}>{(p as { status: string }).status}</Badge>
              </div>
              <div className="cp-card-meta">
                <span className="cp-type">{p.type.replace('_', ' ')}</span>
                <span className="cp-price">
                  {formatMoney((p as { price?: number; unitPrice?: number }).price ?? (p as { price?: number; unitPrice?: number }).unitPrice ?? 0)}
                  {(p as { billingInterval?: string }).billingInterval && (
                    <span className="cp-interval">/{(p as { billingInterval?: string }).billingInterval}</span>
                  )}
                </span>
              </div>
              {(p as { inventory?: number }).inventory !== undefined && (
                <div className="cp-inventory">
                  Stock: <strong>{(p as { inventory?: number }).inventory}</strong>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}

      <style>{`
        .cp-filter-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .cp-search-wrap {
          position: relative;
          flex: 1;
          min-width: 180px;
        }
        .cp-search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }
        .cp-search {
          width: 100%;
          padding: 7px 10px 7px 30px;
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-size: 12px;
          outline: none;
        }
        .cp-search:focus { border-color: var(--color-cyan); }
        .cp-select-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-muted);
        }
        .cp-select {
          padding: 7px 10px;
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-size: 12px;
          outline: none;
          cursor: pointer;
        }
        .cp-select:focus { border-color: var(--color-cyan); }
        .cp-count {
          font-size: 11px;
          color: var(--text-muted);
          font-family: var(--font-mono);
          white-space: nowrap;
        }
        .cp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 12px;
        }
        .cp-card { display: flex; flex-direction: column; gap: 10px; }
        .cp-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
        .cp-card-info { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
        .cp-name { font-size: 13px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cp-desc { font-size: 11px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cp-card-meta { display: flex; justify-content: space-between; align-items: center; }
        .cp-type { font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-muted); background: rgba(255,255,255,0.04); padding: 2px 6px; border-radius: 4px; }
        .cp-price { font-size: 15px; font-weight: 700; font-family: var(--font-mono); color: var(--color-cyan); }
        .cp-interval { font-size: 10px; color: var(--text-muted); font-weight: 400; }
        .cp-inventory { font-size: 11px; color: var(--text-muted); }
        .cp-inventory strong { color: var(--text-secondary); }
        .cp-loading, .cp-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 12px; padding: 60px; color: var(--text-muted); font-size: 13px;
        }
        .cp-spinner {
          width: 22px; height: 22px;
          border: 2px solid var(--border);
          border-top-color: var(--color-cyan);
          border-radius: 50%;
          animation: cpSpin 0.6s linear infinite;
        }
        @keyframes cpSpin { to { transform: rotate(360deg); } }
      `}</style>
    </PageShell>
  );
}
