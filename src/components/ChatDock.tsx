import { MessageSquare } from 'lucide-react';
import { useNavigation } from '../stores/navigation';
import { getVenture, ventures } from '../lib/ventures';
import NAOSChat from './NAOSChat';

export default function ChatDock() {
  const { chatVenture } = useNavigation();
  const venture = getVenture(chatVenture) ?? ventures[0];

  return (
    <div className="dock">
      <div className="dock-header">
        <div className="dock-title">
          <MessageSquare size={13} />
          <span>NAOS</span>
          <span className="dock-venture" style={{ color: venture.color }}>{venture.name}</span>
        </div>
      </div>
      <div className="dock-body">
        <NAOSChat venture={venture} docked />
      </div>

      <style>{`
        .dock {
          width: 380px;
          height: 100%;
          display: flex;
          flex-direction: column;
          border-left: 1px solid var(--border);
          background: var(--bg-deep);
          flex-shrink: 0;
        }

        .dock-header {
          height: 40px;
          display: flex;
          align-items: center;
          padding: 0 12px;
          border-bottom: 1px solid var(--border);
          background: var(--bg-surface);
          flex-shrink: 0;
        }

        .dock-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .dock-venture {
          font-size: 10px;
          font-weight: 500;
        }

        .dock-body {
          flex: 1;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
