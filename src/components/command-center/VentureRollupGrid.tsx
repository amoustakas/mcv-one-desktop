import { Sparkles, TrendingUp, AlertTriangle, CheckSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { SectionCard, Badge, GlassCard } from '../ui';
import { ventures } from '../../lib/ventures';
import { staggerContainer, staggerItem } from '../../lib/motion/variants';
import { useNavigation } from '../../stores/navigation';
import { useTheme } from '../../stores/theme';

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
}

export default function VentureRollupGrid({ rollups = {} }: Props) {
  const switchToVenture = useNavigation((s) => s.switchToVenture);
  const applyVentureTheme = useTheme((s) => s.applyVentureTheme);

  const enterVenture = (slug: string) => {
    switchToVenture(slug);
    applyVentureTheme(slug);
  };

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
      `}</style>
    </SectionCard>
  );
}
