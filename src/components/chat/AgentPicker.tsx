/**
 * AgentPicker — Horizontal pill row for selecting which NAOS agent to talk to.
 *
 * "Auto" = null activeAgentId → Aegis routes based on intent.
 * Selecting a specific agent pins all messages to that specialist.
 */

import { useMemo } from 'react';
import {
  Bot, Hammer, Landmark, TrendingUp, Brain, Shield,
  BookOpen, Activity, Radar, Sparkles,
} from 'lucide-react';
import { useNAOSStore } from '../../stores/naos';
import { builtinAgents } from '../../lib/naos/agents';
import { cn } from '../../lib/utils';

const ICON_MAP: Record<string, React.FC<{ size: number }>> = {
  Bot, Hammer, Landmark, TrendingUp, Brain, Shield,
  BookOpen, Activity, Radar, Sparkles,
};

interface AgentPickerProps {
  compact?: boolean;
}

export default function AgentPicker({ compact = false }: AgentPickerProps) {
  const { activeAgentId, setActiveAgent } = useNAOSStore();

  const agents = useMemo(() => builtinAgents.filter((a) => a.role !== 'monitor'), []);

  return (
    <div className="agent-picker">
      {/* Auto pill */}
      <button
        className={cn('agent-pill', activeAgentId === null && 'active')}
        onClick={() => setActiveAgent(null)}
        title="Auto-route to the best agent for your message"
      >
        <Sparkles size={compact ? 14 : 12} />
        {!compact && <span>Auto</span>}
      </button>

      {/* Agent pills */}
      {agents.map((agent) => {
        const Icon = ICON_MAP[agent.icon] ?? Bot;
        const isActive = activeAgentId === agent.id;
        return (
          <button
            key={agent.id}
            className={cn('agent-pill', isActive && 'active')}
            onClick={() => setActiveAgent(isActive ? null : agent.id)}
            title={`${agent.name} — ${agent.title}: ${agent.description}`}
            style={isActive ? { borderColor: agent.color, boxShadow: `0 0 8px ${agent.color}30` } : undefined}
          >
            <Icon size={compact ? 14 : 12} />
            {!compact && <span>{agent.name}</span>}
          </button>
        );
      })}

      <style>{`
        .agent-picker {
          display: flex;
          gap: 4px;
          padding: 4px 0;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .agent-picker::-webkit-scrollbar { display: none; }

        .agent-pill {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.5);
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .agent-pill:hover {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.8);
          border-color: rgba(255,255,255,0.15);
        }
        .agent-pill.active {
          background: rgba(0, 240, 255, 0.08);
          color: #fff;
          border-color: rgba(0, 240, 255, 0.4);
        }
      `}</style>
    </div>
  );
}
