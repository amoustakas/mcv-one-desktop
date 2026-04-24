// src/components/admin-invites/InviteKpiStrip.tsx
//
// Five-card KPI strip across the top of the admin-invites dashboard. Counts
// are derived from the in-memory invite list — no server round trip. Each
// card is clickable and toggles a status filter on the parent view.
//
// The ui/KpiCard primitive uses `title` (not label), `onClick`, and no
// native "active" prop — active state is expressed via a dashed border
// accent on the wrapping element when the filter matches the card's status.

import { useMemo } from 'react';
import KpiCard from '../ui/KpiCard';
import type { AdminInvite } from '../../stores/admin-invites';
import { useNow } from '../../hooks/use-now';

interface InviteKpiStripProps {
  invites: AdminInvite[];
  activeFilter?: AdminInvite['status'] | null;
  onFilterChange?: (status: AdminInvite['status'] | null) => void;
}

export default function InviteKpiStrip({ invites, activeFilter, onFilterChange }: InviteKpiStripProps) {
  const now = useNow();
  const counts = useMemo(() => {
    let pending = 0;
    let accepted = 0;
    let expired = 0;
    let revoked = 0;
    for (const i of invites) {
      const isExpired = i.status === 'pending' && new Date(i.expires_at).getTime() < now;
      if (isExpired) expired += 1;
      else if (i.status === 'pending') pending += 1;
      else if (i.status === 'accepted') accepted += 1;
      else if (i.status === 'expired') expired += 1;
      else if (i.status === 'revoked') revoked += 1;
    }
    return { total: invites.length, pending, accepted, expired, revoked };
  }, [invites, now]);

  type CardSpec = {
    key: string;
    title: string;
    value: number;
    filter: AdminInvite['status'] | null;
    accent: string;
  };

  const cards: CardSpec[] = [
    { key: 'total', title: 'Total invites', value: counts.total, filter: null, accent: '#6b7a8c' },
    { key: 'pending', title: 'Pending', value: counts.pending, filter: 'pending', accent: '#00f5ff' },
    { key: 'accepted', title: 'Accepted', value: counts.accepted, filter: 'accepted', accent: '#10b981' },
    { key: 'expired', title: 'Expired', value: counts.expired, filter: 'expired', accent: '#eab308' },
    { key: 'revoked', title: 'Revoked', value: counts.revoked, filter: 'revoked', accent: '#ef4444' },
  ];

  return (
    <div className="mcv-invite-kpi-strip">
      {cards.map((c) => {
        const isActive = activeFilter === c.filter;
        return (
          <div
            key={c.key}
            className={isActive ? 'mcv-invite-kpi-wrap is-active' : 'mcv-invite-kpi-wrap'}
            style={{ '--kpi-accent': c.accent } as React.CSSProperties}
          >
            <KpiCard
              title={c.title}
              value={c.value}
              onClick={
                onFilterChange
                  ? () => onFilterChange(isActive ? null : c.filter)
                  : undefined
              }
              variant="glass"
            />
          </div>
        );
      })}

      <style>{`
        .mcv-invite-kpi-strip {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 12px;
        }
        .mcv-invite-kpi-wrap {
          position: relative;
          border-radius: 14px;
          transition: transform 180ms ease;
        }
        .mcv-invite-kpi-wrap.is-active {
          box-shadow: 0 0 0 1px var(--kpi-accent, var(--cyan)), 0 8px 24px -12px var(--kpi-accent, var(--cyan));
          border-radius: 14px;
        }
        .mcv-invite-kpi-wrap.is-active::after {
          content: '';
          position: absolute;
          left: 12px; right: 12px; bottom: 10px;
          height: 2px;
          background: var(--kpi-accent, var(--cyan));
          border-radius: 1px;
        }
        @media (max-width: 1200px) {
          .mcv-invite-kpi-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
      `}</style>
    </div>
  );
}
