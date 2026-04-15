import { useMemo } from 'react';
import { Crown, Mail, ExternalLink, ArrowUpRight } from 'lucide-react';
import { SectionCard, Badge, Tooltip } from '../ui';
import { formatCurrency } from '../../lib/utils';
import { ventures } from '../../lib/ventures';
import type { CommerceMetricsSnapshot } from '../../hooks/use-commerce-metrics';
import { useNavigation } from '../../stores/navigation';

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

  const jumpToContact = (email: string) => {
    // Stash the email in sessionStorage so CRMView can pick it up on mount.
    // sessionStorage clears on tab close — keeps the jump intent ephemeral.
    try { sessionStorage.setItem('mcv-crm-jumpto-email', email.toLowerCase()); } catch { /* quota */ }
    setView('crm' as Parameters<typeof setView>[0]);
  };

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
              <button
                type="button"
                className="tc-rank-btn"
                onClick={() => jumpToContact(c.email)}
                aria-label={`Open ${c.name} in CRM`}
                title={`Open ${c.name} in CRM`}
              >
                <span className="tc-rank">{idx + 1}</span>
              </button>
              <button
                type="button"
                className="tc-body tc-body-btn"
                onClick={() => jumpToContact(c.email)}
                title="Open in CRM"
              >
                <div className="tc-name-row">
                  <span className="tc-name">{c.name}</span>
                  <Tooltip content={`Venture: ${c.ventureName}`}>
                    <Badge color={c.ventureColor} size="sm" variant="outline">
                      {c.ventureName.length > 12 ? c.ventureName.slice(0, 10) + '…' : c.ventureName}
                    </Badge>
                  </Tooltip>
                  <ArrowUpRight size={11} className="tc-jump" />
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
