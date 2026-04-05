import { useState } from 'react';
import { ChevronDown, ChevronRight, Cpu, Wrench, CheckCircle2, Search, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTelemetry } from '../../stores/telemetry';

// ---------------------------------------------------------------------------
// Reasoning Trace — collapsible timeline of orchestrator steps
// ---------------------------------------------------------------------------

const STEP_ICONS: Record<string, typeof Cpu> = {
  tool_assembly: Cpu,
  api_call: Zap,
  tool_dispatch: Wrench,
  tool_result: CheckCircle2,
  cache_lookup: Search,
};

interface ReasoningTraceProps {
  className?: string;
}

export default function ReasoningTrace({ className }: ReasoningTraceProps) {
  const [expanded, setExpanded] = useState(false);
  const steps = useTelemetry((s: any) => s.reasoningSteps);

  if (steps.length === 0) return null;

  const totalDuration = steps.reduce((sum: number, s: any) => sum + (s.durationMs || 0), 0);

  return (
    <div className={cn('rt-container', className)}>
      <button className="rt-toggle" onClick={() => setExpanded(!expanded)}>
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <Cpu size={12} />
        <span className="rt-label">Reasoning ({steps.length} steps, {totalDuration}ms)</span>
      </button>

      {expanded && (
        <div className="rt-timeline">
          {steps.map((step: any, i: number) => {
            const Icon = STEP_ICONS[step.type] || Cpu;
            return (
              <div key={step.id || i} className="rt-step">
                <div className="rt-dot"><Icon size={10} /></div>
                <div className="rt-step-info">
                  <span className="rt-step-desc">{step.description}</span>
                  {step.durationMs != null && step.durationMs > 0 && (
                    <span className="rt-step-duration">{step.durationMs}ms</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .rt-container {
          margin-top: 4px;
          font-size: 11px;
        }

        .rt-toggle {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          transition: all var(--transition-fast);
        }
        .rt-toggle:hover { color: var(--text-secondary); background: var(--bg-card); }

        .rt-label { font-style: italic; }

        .rt-timeline {
          margin-top: 4px;
          padding-left: 20px;
          border-left: 1px solid var(--border);
          margin-left: 14px;
        }

        .rt-step {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 3px 0;
          position: relative;
        }

        .rt-dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--bg-card);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: var(--text-muted);
          margin-left: -29px;
        }

        .rt-step-info { display: flex; align-items: center; gap: 6px; flex: 1; }
        .rt-step-desc { color: var(--text-secondary); }
        .rt-step-duration {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-muted);
          background: var(--bg-elevated);
          padding: 0 4px;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
