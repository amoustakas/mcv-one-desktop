import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '../../lib/animations';

/* ─── Types ────────────────────────────────────────────────── */

interface CultureData {
  innovationTemperature?: number;
  riskAppetite?: number;
  velocityPressure?: number;
  collaborationDensity?: number;
  trustBaseline?: number;
  agentCount?: number;
  snapshotDate?: string;
  computedAt?: string;
  // Snake-case variants from DB
  innovation_temperature?: number;
  risk_appetite?: number;
  velocity_pressure?: number;
  collaboration_density?: number;
  trust_baseline?: number;
  agent_count?: number;
  snapshot_date?: string;
  computed_at?: string;
}

interface CulturePulseProps {
  snapshot: CultureData | null;
}

/* ─── Metric Config ──────────────────────────────────────── */

interface MetricDef {
  label: string;
  camel: keyof CultureData;
  snake: keyof CultureData;
  color: string;
}

const METRICS: MetricDef[] = [
  { label: 'Innovation Temperature', camel: 'innovationTemperature', snake: 'innovation_temperature', color: '#8B5CF6' },
  { label: 'Risk Appetite',          camel: 'riskAppetite',          snake: 'risk_appetite',          color: '#F59E0B' },
  { label: 'Velocity Pressure',      camel: 'velocityPressure',      snake: 'velocity_pressure',      color: '#00F0FF' },
  { label: 'Collaboration Density',  camel: 'collaborationDensity',  snake: 'collaboration_density',  color: '#10B981' },
  { label: 'Trust Baseline',         camel: 'trustBaseline',         snake: 'trust_baseline',         color: '#0072F5' },
];

/** Resolve a metric value from camelCase or snake_case keys */
function resolve(data: CultureData, def: MetricDef): number | undefined {
  const v = data[def.camel] ?? data[def.snake];
  return typeof v === 'number' ? v : undefined;
}

/** Trend arrow placeholder: up if > 50, down otherwise */
function trendArrow(value: number): string {
  return value > 50 ? '\u2191' : '\u2193';
}

function trendColor(value: number): string {
  return value > 50 ? '#10B981' : '#EF4444';
}

/* ─── Component ──────────────────────────────────────────── */

export default function CulturePulse({ snapshot }: CulturePulseProps) {
  const agentCount = useMemo(() => {
    if (!snapshot) return 0;
    const v = snapshot.agentCount ?? snapshot.agent_count;
    return typeof v === 'number' ? v : 0;
  }, [snapshot]);

  const computedAt = useMemo(() => {
    if (!snapshot) return null;
    const raw = snapshot.computedAt ?? snapshot.computed_at ?? snapshot.snapshotDate ?? snapshot.snapshot_date;
    if (!raw) return null;
    try {
      return new Date(raw).toLocaleString();
    } catch {
      return raw;
    }
  }, [snapshot]);

  /* ── Null state ── */
  if (!snapshot) {
    return (
      <div className="naos-culture-card">
        <div className="naos-culture-card__border" />
        <div className="naos-empty-state">
          <h3>No Culture Data</h3>
          <p>No culture data yet. Hire agents to begin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="naos-culture-card">
      <div className="naos-culture-card__border" />

      <motion.div
        className="naos-culture"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {METRICS.map((def) => {
          const value = resolve(snapshot, def);
          if (value === undefined) return null;
          const clamped = Math.max(0, Math.min(100, value));

          return (
            <motion.div className="naos-culture-bar" key={def.label} variants={fadeInUp}>
              <span className="naos-culture-label">{def.label}</span>
              <div className="naos-culture-track">
                <motion.div
                  className="naos-culture-fill"
                  style={{ backgroundColor: def.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${clamped}%` }}
                  transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
              <span className="naos-culture-value">{clamped}</span>
              <span
                className="naos-culture-trend"
                style={{ color: trendColor(clamped) }}
              >
                {trendArrow(clamped)}
              </span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Footer meta */}
      <div className="naos-culture-footer">
        {agentCount > 0 && (
          <span className="naos-culture-agent-badge">
            {agentCount} agent{agentCount !== 1 ? 's' : ''}
          </span>
        )}
        {computedAt && (
          <span className="naos-culture-meta">Last computed: {computedAt}</span>
        )}
      </div>

      <style>{`
        .naos-culture-card {
          position: relative;
          background: var(--bg-card, rgba(255, 255, 255, 0.04));
          border: 1px solid var(--border, rgba(255, 255, 255, 0.06));
          border-radius: var(--radius-lg, 12px);
          padding: var(--space-lg, 20px);
          backdrop-filter: blur(12px);
          overflow: hidden;
        }
        .naos-culture-card__border {
          position: absolute;
          top: 0;
          left: 10%;
          right: 10%;
          height: 2px;
          background: linear-gradient(to right, #00F0FF, #8B5CF6);
          border-radius: 1px;
        }
        .naos-culture-trend {
          font-size: 12px;
          font-weight: 700;
          width: 16px;
          text-align: center;
        }
        .naos-culture-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: var(--space-md, 16px);
          padding-top: var(--space-sm, 8px);
          border-top: 1px solid var(--border, rgba(255, 255, 255, 0.06));
        }
        .naos-culture-agent-badge {
          font-size: 10px;
          font-weight: 600;
          color: var(--cyan, #00F0FF);
          background: rgba(0, 240, 255, 0.08);
          border: 1px solid rgba(0, 240, 255, 0.15);
          border-radius: var(--radius-full, 999px);
          padding: 2px 10px;
          font-family: var(--font-mono, monospace);
        }
      `}</style>
    </div>
  );
}
