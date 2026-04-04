import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useNavigation } from '../stores/navigation';
import { getVenture, ventures } from '../lib/ventures';
import NAOSChat from './NAOSChat';

export default function ChatDock() {
  const { chatDocked, chatVenture, toggleChatDock } = useNavigation();
  const venture = getVenture(chatVenture) ?? ventures[0];

  return (
    <>
      {/* Toggle button when collapsed */}
      {!chatDocked && (
        <button className="chat-dock-toggle collapsed" onClick={toggleChatDock} title="Open NAOS (Cmd+/)">
          <PanelRightOpen size={16} />
        </button>
      )}

      {/* Docked panel */}
      {chatDocked && (
        <div className="chat-dock">
          <div className="chat-dock-header">
            <span className="chat-dock-title">
              <span className="chat-dock-dot" style={{ background: venture.color }} />
              NAOS
            </span>
            <button className="chat-dock-close" onClick={toggleChatDock} title="Close (Cmd+/)">
              <PanelRightClose size={14} />
            </button>
          </div>
          <div className="chat-dock-body">
            <NAOSChat venture={venture} />
          </div>
        </div>
      )}

      <style>{`
        .chat-dock {
          width: 360px;
          height: 100%;
          display: flex;
          flex-direction: column;
          border-left: 1px solid var(--border);
          background: var(--bg-deep);
          flex-shrink: 0;
        }

        .chat-dock-header {
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 10px;
          border-bottom: 1px solid var(--border);
          background: var(--bg-surface);
          flex-shrink: 0;
        }

        .chat-dock-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .chat-dock-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .chat-dock-close {
          color: var(--text-muted);
          padding: 4px;
          border-radius: 3px;
          transition: all var(--transition-fast);
        }
        .chat-dock-close:hover { color: var(--text-primary); background: var(--bg-card); }

        .chat-dock-body {
          flex: 1;
          overflow: hidden;
        }

        .chat-dock-toggle {
          position: fixed;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }
        .chat-dock-toggle:hover { color: var(--cyan); border-color: var(--border-active); }
      `}</style>
    </>
  );
}
