import { Terminal, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface Session {
  id: string;
  venture: string;
  title: string;
  status: 'active' | 'completed' | 'error';
  started: string;
  messages: number;
}

const mockSessions: Session[] = [
  { id: '1', venture: 'MCV One', title: 'System architecture review', status: 'active', started: '2 min ago', messages: 12 },
  { id: '2', venture: 'BetEdge AI', title: 'NFL model accuracy tuning', status: 'completed', started: '1 hr ago', messages: 34 },
  { id: '3', venture: 'FutureState', title: 'Tokenomics v2 design', status: 'completed', started: '3 hr ago', messages: 21 },
  { id: '4', venture: 'WarForge', title: 'Guild economy balancing', status: 'error', started: '5 hr ago', messages: 8 },
  { id: '5', venture: 'EdgeIQ Markets', title: 'Redpanda pipeline config', status: 'completed', started: '1 day ago', messages: 45 },
];

const statusIcon = {
  active: <Clock size={14} className="session-status-icon active" />,
  completed: <CheckCircle2 size={14} className="session-status-icon completed" />,
  error: <AlertCircle size={14} className="session-status-icon error" />,
};

export default function SessionsPanel() {
  return (
    <div className="sessions-panel">
      <div className="sessions-header">
        <Terminal size={18} />
        <h2>Claude Code Sessions</h2>
      </div>

      <div className="sessions-list">
        {mockSessions.map((s) => (
          <div key={s.id} className={`session-card ${s.status}`}>
            <div className="session-card-top">
              {statusIcon[s.status]}
              <span className="session-venture">{s.venture}</span>
              <span className="session-time">{s.started}</span>
            </div>
            <div className="session-title">{s.title}</div>
            <div className="session-meta">{s.messages} messages</div>
          </div>
        ))}
      </div>

      <style>{`
        .sessions-panel {
          height: 100%;
          overflow-y: auto;
          padding: var(--space-lg);
        }

        .sessions-header {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: var(--text-primary);
          margin-bottom: var(--space-lg);
        }

        .sessions-header h2 {
          font-size: var(--text-lg);
          font-weight: 600;
        }

        .sessions-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .session-card {
          padding: var(--space-md);
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          transition: border-color var(--transition-fast);
          cursor: pointer;
        }

        .session-card:hover {
          border-color: var(--border-active);
        }

        .session-card.active {
          border-left: 3px solid var(--cyan);
        }

        .session-card-top {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          margin-bottom: var(--space-xs);
        }

        .session-status-icon.active { color: var(--cyan); }
        .session-status-icon.completed { color: var(--success); }
        .session-status-icon.error { color: var(--error); }

        .session-venture {
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .session-time {
          margin-left: auto;
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .session-title {
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .session-meta {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
