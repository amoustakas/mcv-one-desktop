import { useMemo } from 'react';
import { Crown, Mail, ExternalLink } from 'lucide-react';
import { SectionCard, Badge, Tooltip } from '../ui';
import { formatCurrency } from '../../lib/utils';
import { ventures } from '../../lib/ventures';
import type { CommerceMetricsSnapshot } from '../../hooks/use-commerce-metrics';

/**
 * Aggregates top customers across every venture, ranks by LTV, returns the
 * top 10. Each entry knows which venture they belong to (badge + color).
 */
export default function TopCustomersCard({
  ventureMetrics,
}: {
  ventureMetrics: Record<string, CommerceMetricsSnapshot | undefined>;
}) {
  const customers = useMemo(() => {
    const all: Array<{
      id: string;
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
          return (
            <li key={c.id} className={`tc-row ${isTop3 ? 'tc-row-top' : ''}`}>
              <span className="tc-rank">{idx + 1}</span>
              <div className="tc-body">
                <div className="tc-name-row">
                  <span className="tc-name" title={c.email}>{c.name}</span>
                  <Tooltip content={`Venture: ${c.ventureName}`}>
                    <Badge color={c.ventureColor} size="sm" variant="outline">
                      {c.ventureName.length > 12 ? c.ventureName.slice(0, 10) + '…' : c.ventureName}
                    </Badge>
                  </Tooltip>
                </div>
                <a href={`mailto:${c.email}`} className="tc-email">
                  <Mail size={9} /> {c.email}
                </a>
              </div>
              <div className="tc-ltv-col">
                <div className="tc-ltv">{formatCurrency(c.ltv)}</div>
                {c.totalSpent > 0 && c.totalSpent !== c.ltv && (
                  <div className="tc-spent">{formatCurrency(c.totalSpent)} spent</div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <style>{`
        .tc-list { list-style: none; padding: 0; display: flex; flex-direction: column; }
        .tc-row { display: grid; grid-template-columns: 26px 1fr auto; gap: 10px; align-items: center; padding: 10px 14px; border-bottom: 1px solid var(--border); transition: background var(--transition-fast); }
        .tc-row:last-child { border-bottom: none; }
        .tc-row:hover { background: var(--bg-hover); }
        .tc-row-top .tc-rank { background: linear-gradient(135deg, var(--gold), #F97316); color: var(--bg-deep); }
        .tc-rank { width: 22px; height: 22px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: var(--bg-elevated); color: var(--text-muted); font-family: var(--font-mono); font-size: 11px; font-weight: 700; }
        .tc-body { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .tc-name-row { display: inline-flex; align-items: center; gap: 8px; }
        .tc-name { font-size: 12px; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; }
        .tc-email { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; color: var(--text-muted); text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 240px; }
        .tc-email:hover { color: var(--cyan); }
        .tc-ltv-col { text-align: right; flex-shrink: 0; }
        .tc-ltv { font-family: var(--font-mono); font-size: 12px; font-weight: 700; color: var(--cyan); }
        .tc-spent { font-size: 9px; color: var(--text-muted); font-family: var(--font-mono); margin-top: 1px; }
      `}</style>
    </SectionCard>
  );
}
