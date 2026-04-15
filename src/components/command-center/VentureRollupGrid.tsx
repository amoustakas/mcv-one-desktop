import { Sparkles, TrendingUp, AlertTriangle, CheckSquare, DollarSign, Users, ShoppingBag, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { SectionCard, Badge, GlassCard, Tooltip } from '../ui';
import { ventures } from '../../lib/ventures';
import { staggerContainer, staggerItem } from '../../lib/motion/variants';
import { useNavigation, type ViewId } from '../../stores/navigation';
import { useTheme } from '../../stores/theme';
import SparkLine from '../charts/SparkLine';

const statusColors: Record<string, string> = {
  active: '#10B981',
  development: '#00F0FF',
  planned: '#8B5CF6',
  concept: '#6B7280',
};

export interface VentureRollup {
  id: string;
  openTasks: number;
  mrr: number;
  activeAlerts: number;
  pipelineValue: number;
}

interface Props {
  rollups?: Record<string, VentureRollup>;
  /** Daily revenue arrays per venture (30 days) for sparkline rendering. */
  revenueTrends?: Record<string, number[]>;
}

export default function VentureRollupGrid({ rollups = {}, revenueTrends = {} }: Props) {
  const switchToVenture = useNavigation((s) => s.switchToVenture);
  const setView = useNavigation((s) => s.setView);
  const applyVentureTheme = useTheme((s) => s.applyVentureTheme);

  const enterVenture = (slug: string) => {
    switchToVenture(slug);
    applyVentureTheme(slug);
  };

  const enterVentureView = (slug: string, view: ViewId) => {
    switchToVenture(slug);
    applyVentureTheme(slug);
    setView(view);
  };

  // Quick-jump targets per rollup card. Each chip = enter venture + open view.
  const QUICK_JUMPS: { view: ViewId; label: string; icon: typeof DollarSign; tip: string }[] = [
    { view: 'commerce' as ViewId, label: 'Commerce', icon: ShoppingBag, tip: 'Orders & products' },
    { view: 'crm' as ViewId, label: 'CRM', icon: Users, tip: 'Contacts & deals' },
    { view: 'financials-dashboard' as ViewId, label: 'Financials', icon: DollarSign, tip: 'P&L & cash' },
    { view: 'signals' as ViewId, label: 'Signals', icon: Activity, tip: 'Live activity' },
  ];

  const activeCount = ventures.filter((v) => v.status === 'active' || v.status === 'development').length;

  return (
    <SectionCard
      title="Venture Rollups"
      icon={<Sparkles size={14} />}
      description={`${activeCount} active · per-venture KPIs at a glance`}
      padding="md"
    >
      <motion.div className="vrg-grid" variants={staggerContainer} initial="hidden" animate="show">
        {ventures.map((v) => {
          const rollup = rollups[v.id];
          const trend = revenueTrends[v.id];
          const hasTrend = trend && trend.length > 0 && trend.some((p) => p > 0);
          const firstHalf = hasTrend ? trend!.slice(0, Math.floor(trend!.length / 2)) : [];
          const secondHalf = hasTrend ? trend!.slice(Math.floor(trend!.length / 2)) : [];
          const firstAvg = firstHalf.length ? firstHalf.reduce((s, n) => s + n, 0) / firstHalf.length : 0;
          const secondAvg = secondHalf.length ? secondHalf.reduce((s, n) => s + n, 0) / secondHalf.length : 0;
          const deltaPct = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
          const trending = deltaPct >= 0 ? 'up' : 'down';

          return (
            <motion.div key={v.id} variants={staggerItem}>
              <GlassCard
                variant="neural"
                className="vrg-card holo-hover"
                onClick={() => enterVenture(v.id)}
              >
                <div className="vrg-accent" style={{ background: `linear-gradient(90deg, transparent, ${v.color}55, transparent)` }} />
                <div className="vrg-head">
                  <span className="vrg-icon" style={{ background: v.color }}>{v.icon}</span>
                  <div className="vrg-ids">
                    <span className="vrg-name">{v.name}</span>
                    <span className="vrg-tag">{v.tagline}</span>
                  </div>
                  <Badge color={statusColors[v.status]} variant="outline" size="sm">{v.status}</Badge>
                </div>

                {hasTrend && (
                  <div className="vrg-spark-row">
                    <div className="vrg-spark-wrap">
                      <SparkLine data={trend!} width={120} height={28} showArea />
                    </div>
                    <div className="vrg-spark-delta" style={{ color: trending === 'up' ? 'var(--success)' : 'var(--error)' }}>
                      {trending === 'up' ? '↑' : '↓'} {Math.abs(deltaPct).toFixed(0)}%
                      <span className="vrg-spark-label"> 30d rev</span>
                    </div>
                  </div>
                )}

                <div className="vrg-metrics">
                  <div className="vrg-metric">
                    <CheckSquare size={10} />
                    <span className="vrg-m-v">{rollup?.openTasks ?? '–'}</span>
                    <span className="vrg-m-l">tasks</span>
                  </div>
                  <div className="vrg-metric">
                    <TrendingUp size={10} />
                    <span className="vrg-m-v">{rollup?.pipelineValue ? `$${(rollup.pipelineValue / 1000).toFixed(0)}k` : '–'}</span>
                    <span className="vrg-m-l">pipeline</span>
                  </div>
                  <div className="vrg-metric">
                    <AlertTriangle size={10} style={{ color: (rollup?.activeAlerts ?? 0) > 0 ? 'var(--warning)' : undefined }} />
                    <span className="vrg-m-v">{rollup?.activeAlerts ?? 0}</span>
                    <span className="vrg-m-l">alerts</span>
                  </div>
                </div>

                {/* Quick-jump chips — bypass the card's main click-handler */}
                <div className="vrg-jumps" onClick={(e) => e.stopPropagation()}>
                  {QUICK_JUMPS.map((j) => {
                    const Icon = j.icon;
                    return (
                      <Tooltip key={j.view} content={`${v.name} → ${j.tip}`}>
                        <button
                          type="button"
                          className="vrg-jump-btn"
                          onClick={() => enterVentureView(v.id, j.view)}
                          aria-label={`Open ${v.name} ${j.label}`}
                        >
                          <Icon size={10} />
                          <span>{j.label}</span>
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </motion.div>

      <style>{`
        .vrg-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
        .vrg-card { position: relative; overflow: hidden; padding: 14px; display: flex; flex-direction: column; gap: 10px; cursor: pointer; transition: transform var(--transition-fast), box-shadow var(--transition-fast); }
        .vrg-card:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0, 240, 255, 0.08); }
        .vrg-accent { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; }
        .vrg-head { display: flex; align-items: center; gap: 10px; }
        .vrg-icon { width: 32px; height: 32px; border-radius: var(--radius-sm); display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; color: var(--bg-deep); flex-shrink: 0; }
        .vrg-ids { flex: 1; min-width: 0; }
        .vrg-name { display: block; font-size: 13px; font-weight: 600; color: var(--text-primary); }
        .vrg-tag { display: block; font-size: 10px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vrg-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; padding-top: 8px; border-top: 1px solid var(--border); }
        .vrg-metric { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-muted); }
        .vrg-m-v { color: var(--text-primary); font-weight: 600; font-family: var(--font-mono); }
        .vrg-m-l { font-size: 9px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.3px; }
        .vrg-spark-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 2px 0; }
        .vrg-spark-wrap { flex: 1; min-width: 0; display: flex; align-items: center; }
        .vrg-spark-delta { font-size: 11px; font-weight: 600; font-family: var(--font-mono); white-space: nowrap; }
        .vrg-spark-label { color: var(--text-muted); font-weight: 400; font-size: 9px; text-transform: uppercase; letter-spacing: 0.3px; }
        .vrg-jumps { display: flex; flex-wrap: wrap; gap: 4px; padding-top: 8px; border-top: 1px dashed var(--border); }
        .vrg-jump-btn { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; font-size: 10px; font-weight: 500; color: var(--text-muted); background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-full); transition: all var(--transition-fast); }
        .vrg-jump-btn:hover { color: var(--cyan); border-color: var(--border-active); background: rgba(0, 240, 255, 0.06); transform: translateY(-1px); }
      `}</style>
    </SectionCard>
  );
}
