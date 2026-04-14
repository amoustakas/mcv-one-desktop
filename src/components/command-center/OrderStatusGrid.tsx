import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { SectionCard, Tooltip, Badge } from '../ui';
import McvDonutChart from '../charts/DonutChart';
import { ventures } from '../../lib/ventures';
import { staggerContainer, staggerItem } from '../../lib/motion/variants';
import type { CommerceMetricsSnapshot } from '../../hooks/use-commerce-metrics';

const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--text-muted)',
  processing: 'var(--warning)',
  shipped: 'var(--purple)',
  delivered: 'var(--success)',
  cancelled: 'var(--error)',
  refunded: 'var(--error)',
  failed: 'var(--error)',
};

const STATUS_ORDER = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'failed'];

interface VentureOrderSlice {
  ventureId: string;
  ventureName: string;
  ventureColor: string;
  data: { name: string; value: number; color: string }[];
  total: number;
  revenue: number;
}

/**
 * One mini donut per venture with orders broken out by status. Skips
 * ventures that have zero orders in the lookback window (so the panel
 * doesn't go full empty-circle for dormant ventures).
 */
export default function OrderStatusGrid({
  ventureMetrics,
}: {
  ventureMetrics: Record<string, CommerceMetricsSnapshot | undefined>;
}) {
  const slices = useMemo<VentureOrderSlice[]>(() => {
    return ventures
      .map((v) => {
        const m = ventureMetrics[v.id];
        if (!m || m.orders.total_count === 0) return null;
        const data = STATUS_ORDER
          .filter((s) => (m.orders.by_status[s] || 0) > 0)
          .map((s) => ({
            name: s,
            value: m.orders.by_status[s] || 0,
            color: STATUS_COLORS[s] || 'var(--text-muted)',
          }));
        // Tail bucket for any unknown statuses
        const known = new Set(STATUS_ORDER);
        Object.entries(m.orders.by_status).forEach(([s, v]) => {
          if (!known.has(s) && v > 0) data.push({ name: s, value: v, color: 'var(--text-muted)' });
        });
        return {
          ventureId: v.id,
          ventureName: v.name,
          ventureColor: v.color,
          data,
          total: m.orders.total_count,
          revenue: m.orders.revenue,
        } satisfies VentureOrderSlice;
      })
      .filter((x): x is VentureOrderSlice => x !== null);
  }, [ventureMetrics]);

  if (slices.length === 0) return null;

  return (
    <SectionCard
      title="Order Pipeline by Venture"
      icon={<ShoppingBag size={14} />}
      description={`${slices.length} venture${slices.length === 1 ? '' : 's'} with active orders · 30-day window`}
      padding="md"
    >
      <motion.div className="osg-grid" variants={staggerContainer} initial="hidden" animate="show">
        {slices.map((s) => {
          const delivered = s.data.find((d) => d.name === 'delivered')?.value || 0;
          const fulfillmentRate = s.total > 0 ? (delivered / s.total) * 100 : 0;
          return (
            <motion.div key={s.ventureId} variants={staggerItem} className="osg-cell">
              <div className="osg-cell-head">
                <span className="osg-dot" style={{ background: s.ventureColor }} />
                <span className="osg-name">{s.ventureName}</span>
                <Tooltip content={`${delivered} of ${s.total} delivered`}>
                  <Badge color={fulfillmentRate >= 75 ? '#10B981' : fulfillmentRate >= 50 ? '#F59E0B' : '#6B7280'} size="sm">
                    {fulfillmentRate.toFixed(0)}%
                  </Badge>
                </Tooltip>
              </div>
              <div className="osg-donut-wrap">
                <McvDonutChart
                  data={s.data}
                  size={120}
                  innerRadius={36}
                  centerLabel="orders"
                  centerValue={String(s.total)}
                />
              </div>
              <div className="osg-cell-foot">
                <div className="osg-statuses">
                  {s.data.slice(0, 4).map((d) => (
                    <Tooltip key={d.name} content={`${d.name}: ${d.value}`}>
                      <span className="osg-status-tag" style={{ borderColor: d.color, color: d.color }}>
                        {d.value}
                      </span>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <style>{`
        .osg-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
        .osg-cell { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 10px; display: flex; flex-direction: column; gap: 6px; transition: border-color var(--transition-fast); }
        .osg-cell:hover { border-color: var(--border-active); }
        .osg-cell-head { display: flex; align-items: center; gap: 6px; }
        .osg-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .osg-name { flex: 1; font-size: 12px; font-weight: 500; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .osg-donut-wrap { display: flex; align-items: center; justify-content: center; padding: 4px 0; }
        .osg-cell-foot { display: flex; align-items: center; justify-content: center; }
        .osg-statuses { display: inline-flex; gap: 4px; flex-wrap: wrap; justify-content: center; }
        .osg-status-tag { display: inline-flex; align-items: center; justify-content: center; min-width: 22px; padding: 2px 6px; border-radius: var(--radius-full); font-family: var(--font-mono); font-size: 10px; font-weight: 700; border: 1px solid; background: transparent; }
      `}</style>
    </SectionCard>
  );
}
