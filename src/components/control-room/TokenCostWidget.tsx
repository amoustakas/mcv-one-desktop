import { useTelemetry } from '../../stores/telemetry';
import { formatCompact } from '../../lib/utils';

// ---------------------------------------------------------------------------
// TokenCostWidget — sticky bottom bar with token gauges and session cost
// ---------------------------------------------------------------------------

const TOKEN_LIMIT = 1_000_000; // 1M context window reference

interface GaugeProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

function Gauge({ label, value, max, color }: GaugeProps) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="mcv-token-gauge">
      <div className="mcv-token-gauge-label">
        <span>{label}</span>
        <span style={{ color }}>{formatCompact(value)}</span>
      </div>
      <div className="mcv-token-gauge-bar">
        <div className="mcv-token-gauge-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function TokenCostWidget() {
  const { sessionTokens, sessionCost } = useTelemetry();

  return (
    <div className="mcv-token-widget">
      <div className="mcv-token-gauges">
        <Gauge label="Input" value={sessionTokens.input} max={TOKEN_LIMIT} color="var(--cyan)" />
        <Gauge label="Output" value={sessionTokens.output} max={TOKEN_LIMIT / 4} color="var(--purple)" />
        <Gauge label="Cached" value={sessionTokens.cached} max={TOKEN_LIMIT} color="var(--gold)" />
      </div>
      <div className="mcv-token-total">
        Session cost: ${sessionCost.toFixed(4)}
      </div>
    </div>
  );
}
