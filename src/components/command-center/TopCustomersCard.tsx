import { useMemo, useState } from 'react';
import { Crown, Mail, ExternalLink, ArrowUpRight, ChevronDown, TrendingUp, Calendar, ShoppingBag, Loader2 } from 'lucide-react';
import { SectionCard, Badge, Tooltip } from '../ui';
import { formatCurrency } from '../../lib/utils';
import { ventures } from '../../lib/ventures';
import type { CommerceMetricsSnapshot } from '../../hooks/use-commerce-metrics';
import { useCustomerRecentOrders } from '../../hooks/use-commerce-metrics';
import { useNavigation } from '../../stores/navigation';

/**
 * Inline list of a customer's most recent orders. Owns its own query so
 * the parent only mounts it for the currently expanded row — fan-out
 * across 10 customers stays at zero requests until a user expands one.
 */
function RecentOrdersList({ ventureId, customerId }: { ventureId: string; customerId: string }) {
  const { data, isLoading } = useCustomerRecentOrders(ventureId, customerId, 5);
  if (isLoading) {
    return (
      <div className="tc-recent-loading">
        <Loader2 size={11} className="mcv-spin" /> Loading orders…
      </div>
    );
  }
  if (!data || data.length === 0) {
    return <div className="tc-recent-empty">No recent orders for this customer.</div>;
  }
  return (
    <ul className="tc-recent-list">
      {data.map((o) => (
        <li key={o.id} className="tc-recent-row">
          <ShoppingBag size={9} className="tc-recent-icon" />
          <span className="tc-recent-num">#{o.order_number ?? o.id.slice(-6).toUpperCase()}</span>
          <span className="tc-recent-amt">{formatCurrency(o.total)}</span>
          <span className="tc-recent-status">{o.status}</span>
          <span className="tc-recent-when">{new Date(o.created_at).toLocaleDateString()}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Aggregates top customers across every venture, ranks by LTV, returns the
 * top 10. Each entry knows which venture they belong to (badge + color).
 */
export default function TopCustomersCard({
  ventureMetrics,
}: {
  ventureMetrics: Record<string, CommerceMetricsSnapshot | undefined>;
}) {
  const setView = useNavigation((s) => s.setView);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const jumpToContact = (email: string) => {
    // Stash the email in sessionStorage so CRMView can pick it up on mount.
    // sessionStorage clears on tab close — keeps the jump intent ephemeral.
    try { sessionStorage.setItem('mcv-crm-jumpto-email', email.toLowerCase()); } catch { /* quota */ }
    setView('crm' as Parameters<typeof setView>[0]);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const customers = useMemo(() => {
    const all: Array<{
      id: string;
      customerId: string;
      name: string;
      email: string;
      ltv: number;
      totalSpent: number;
      ventureId: string;
      ventureName: string;
      ventureColor: string;
    }> = [];

    ventures.forEach((v) => {
      const snap = ventureMetrics[v.id];
      if (!snap?.top_customers) return;
      snap.top_customers.forEach((c) => {
        const name = [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email;
        all.push({
          id: `${v.id}:${c.id}`,
          customerId: c.id,
          name,
          email: c.email,
          ltv: Number(c.ltv || 0),
          totalSpent: Number(c.total_spent || 0),
          ventureId: v.id,
          ventureName: v.name,
          ventureColor: v.color,
        });
      });
    });

    // Collapse same customer appearing in multiple ventures — keep highest LTV
    const dedup = new Map<string, typeof all[number]>();
    for (const c of all) {
      const key = c.email.toLowerCase();
      const existing = dedup.get(key);
      if (!existing || c.ltv > existing.ltv) dedup.set(key, c);
    }

    return Array.from(dedup.values())
      .sort((a, b) => b.ltv - a.ltv)
      .slice(0, 10);
  }, [ventureMetrics]);

  const totalLtv = customers.reduce((s, c) => s + c.ltv, 0);

  if (customers.length === 0) return null;

  return (
    <SectionCard
      title="Top Customers"
      icon={<Crown size={14} />}
      description={`Top ${customers.length} by LTV · combined ${formatCurrency(totalLtv)}`}
      padding="none"
    >
      <ul className="tc-list">
        {customers.map((c, idx) => {
          const isTop3 = idx < 3;
          const isExpanded = expandedId === c.id;
          // Pull this customer's per-venture context from the snapshot
          const ventureSnap = ventureMetrics[c.ventureId];
          const aov = c.totalSpent > 0 && ventureSnap ? c.totalSpent / Math.max(1, Math.round(c.totalSpent / 100)) : 0;
          const ventureRevShare = ventureSnap?.orders.revenue ? (c.totalSpent / ventureSnap.orders.revenue) * 100 : 0;
          return (
            <li key={c.id} className={`tc-row ${isTop3 ? 'tc-row-top' : ''} ${isExpanded ? 'tc-row-expanded' : ''}`}>
              <div className="tc-row-main">
                <button
                  type="button"
                  className="tc-rank-btn"
                  onClick={() => toggleExpand(c.id)}
                  aria-label={`Toggle ${c.name} details`}
                  title={isExpanded ? 'Collapse' : 'Expand details'}
                >
                  <span className="tc-rank">{idx + 1}</span>
                </button>
                <button
                  type="button"
                  className="tc-body tc-body-btn"
                  onClick={() => toggleExpand(c.id)}
                  title="Click to expand · double-click to open in CRM"
                  onDoubleClick={() => jumpToContact(c.email)}
                >
                  <div className="tc-name-row">
                    <span className="tc-name">{c.name}</span>
                    <Tooltip content={`Venture: ${c.ventureName}`}>
                      <Badge color={c.ventureColor} size="sm" variant="outline">
                        {c.ventureName.length > 12 ? c.ventureName.slice(0, 10) + '…' : c.ventureName}
                      </Badge>
                    </Tooltip>
                    <ChevronDown size={11} className={`tc-chev ${isExpanded ? 'tc-chev-open' : ''}`} />
                  </div>
                  <span className="tc-email">
                    <Mail size={9} /> {c.email}
                  </span>
                </button>
                <div className="tc-ltv-col">
                  <div className="tc-ltv">{formatCurrency(c.ltv)}</div>
                  {c.totalSpent > 0 && c.totalSpent !== c.ltv && (
                    <div className="tc-spent">{formatCurrency(c.totalSpent)} spent</div>
                  )}
                </div>
              </div>
              {isExpanded && (
                <div className="tc-expand-panel">
                  <div className="tc-expand-stats">
                    <div className="tc-expand-stat">
                      <TrendingUp size={10} />
                      <span className="tc-expand-stat-label">LTV / Spent</span>
                      <span className="tc-expand-stat-val">{c.totalSpent > 0 ? `${((c.ltv / c.totalSpent) * 100).toFixed(0)}%` : '—'}</span>
                    </div>
                    <div className="tc-expand-stat">
                      <Calendar size={10} />
                      <span className="tc-expand-stat-label">AOV est.</span>
                      <span className="tc-expand-stat-val">{aov > 0 ? formatCurrency(aov) : '—'}</span>
                    </div>
                    <div className="tc-expand-stat">
                      <Crown size={10} />
                      <span className="tc-expand-stat-label">{c.ventureName} share</span>
                      <span className="tc-expand-stat-val">{ventureRevShare > 0 ? `${ventureRevShare.toFixed(1)}%` : '—'}</span>
                    </div>
                  </div>
                  <div className="tc-recent-section">
                    <span className="tc-recent-heading">
                      <ShoppingBag size={10} /> Recent orders
                    </span>
                    <RecentOrdersList ventureId={c.ventureId} customerId={c.customerId} />
                  </div>
                  <div className="tc-expand-actions">
                    <button type="button" className="tc-expand-btn" onClick={() => jumpToContact(c.email)}>
                      <ArrowUpRight size={11} /> Open in CRM
                    </button>
                    <a href={`mailto:${c.email}`} className="tc-expand-btn">
                      <Mail size={11} /> Email
                    </a>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <style>{`
        .tc-list { list-style: none; padding: 0; display: flex; flex-direction: column; }
        .tc-row { border-bottom: 1px solid var(--border); transition: background var(--transition-fast); display: flex; flex-direction: column; }
        .tc-row:last-child { border-bottom: none; }
        .tc-row-main { display: grid; grid-template-columns: 26px 1fr auto; gap: 10px; align-items: center; padding: 10px 14px; }
        .tc-row:hover { background: var(--bg-hover); }
        .tc-row-expanded { background: rgba(0, 240, 255, 0.03); }
        .tc-chev { color: var(--text-muted); transition: transform var(--transition-fast); }
        .tc-chev-open { transform: rotate(180deg); color: var(--cyan); }
        .tc-expand-panel { padding: 8px 14px 12px 50px; display: flex; flex-direction: column; gap: 8px; border-top: 1px dashed var(--border); }
        .tc-expand-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .tc-expand-stat { display: flex; flex-direction: column; gap: 2px; padding: 6px 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); }
        .tc-expand-stat > svg { color: var(--text-muted); }
        .tc-expand-stat-label { font-size: 9px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.3px; }
        .tc-expand-stat-val { font-family: var(--font-mono); font-size: 12px; font-weight: 600; color: var(--text-primary); }
        .tc-recent-section { display: flex; flex-direction: column; gap: 4px; }
        .tc-recent-heading { display: inline-flex; align-items: center; gap: 4px; font-size: 9px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.4px; font-weight: 600; padding: 2px 0; }
        .tc-recent-loading { font-size: 10px; color: var(--text-muted); display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; }
        .tc-recent-empty { font-size: 10px; color: var(--text-muted); padding: 4px 8px; font-style: italic; }
        .tc-recent-list { list-style: none; display: flex; flex-direction: column; gap: 2px; }
        .tc-recent-row { display: grid; grid-template-columns: 11px 70px 1fr 70px 70px; align-items: center; gap: 6px; padding: 4px 6px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 10px; }
        .tc-recent-icon { color: var(--text-muted); }
        .tc-recent-num { font-family: var(--font-mono); color: var(--text-secondary); }
        .tc-recent-amt { color: var(--cyan); font-weight: 600; font-family: var(--font-mono); text-align: right; }
        .tc-recent-status { font-size: 9px; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.3px; }
        .tc-recent-when { font-family: var(--font-mono); color: var(--text-muted); font-size: 9px; text-align: right; }
        .tc-expand-actions { display: flex; gap: 6px; }
        .tc-expand-btn { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-full); font-size: 10px; font-weight: 500; color: var(--text-secondary); text-decoration: none; transition: all var(--transition-fast); }
        .tc-expand-btn:hover { color: var(--cyan); border-color: var(--border-active); background: rgba(0, 240, 255, 0.06); }
        .tc-row-top .tc-rank { background: linear-gradient(135deg, var(--gold), #F97316); color: var(--bg-deep); }
        .tc-rank-btn { padding: 0; background: transparent; border: none; cursor: pointer; }
        .tc-rank { width: 22px; height: 22px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: var(--bg-elevated); color: var(--text-muted); font-family: var(--font-mono); font-size: 11px; font-weight: 700; transition: transform var(--transition-fast); }
        .tc-rank-btn:hover .tc-rank { transform: scale(1.1); }
        .tc-body { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .tc-body-btn { background: transparent; border: none; padding: 0; text-align: left; cursor: pointer; color: inherit; font: inherit; }
        .tc-body-btn:hover .tc-name { color: var(--cyan); }
        .tc-body-btn:hover .tc-jump { opacity: 1; transform: translate(2px, -2px); }
        .tc-name-row { display: inline-flex; align-items: center; gap: 8px; }
        .tc-name { font-size: 12px; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; transition: color var(--transition-fast); }
        .tc-jump { color: var(--cyan); opacity: 0; transition: all var(--transition-fast); flex-shrink: 0; }
        .tc-email { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; color: var(--text-muted); text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 240px; }
        .tc-ltv-col { text-align: right; flex-shrink: 0; }
        .tc-ltv { font-family: var(--font-mono); font-size: 12px; font-weight: 700; color: var(--cyan); }
        .tc-spent { font-size: 9px; color: var(--text-muted); font-family: var(--font-mono); margin-top: 1px; }
      `}</style>
    </SectionCard>
  );
}
