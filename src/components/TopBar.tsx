import { Activity, MessageSquare, BarChart3, Settings, LayoutDashboard } from 'lucide-react';
import { APP_VERSION } from '../lib/version';
import { UserButton } from '../lib/auth';

export type Panel = 'chat' | 'dashboard' | 'sessions' | 'ops';

interface TopBarProps {
  activePanel: Panel;
  onPanelChange: (panel: Panel) => void;
  ventureLabel: string;
  onSettingsClick?: () => void;
}

export default function TopBar({ activePanel, onPanelChange, ventureLabel, onSettingsClick }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-logo">
          <span className="logo-mark">MCV</span>
          <span className="logo-text">ONE</span>
        </div>
        <span className="topbar-venture">{ventureLabel}</span>
      </div>

      <nav className="topbar-nav">
        <button
          className={`topbar-tab ${activePanel === 'chat' ? 'active' : ''}`}
          onClick={() => onPanelChange('chat')}
        >
          <MessageSquare size={16} />
          <span>Chat</span>
        </button>
        <button
          className={`topbar-tab ${activePanel === 'dashboard' ? 'active' : ''}`}
          onClick={() => onPanelChange('dashboard')}
        >
          <LayoutDashboard size={16} />
          <span>Dash</span>
        </button>
        <button
          className={`topbar-tab ${activePanel === 'sessions' ? 'active' : ''}`}
          onClick={() => onPanelChange('sessions')}
        >
          <Activity size={16} />
          <span>Sessions</span>
        </button>
        <button
          className={`topbar-tab ${activePanel === 'ops' ? 'active' : ''}`}
          onClick={() => onPanelChange('ops')}
        >
          <BarChart3 size={16} />
          <span>Ops</span>
        </button>
      </nav>

      <div className="topbar-right">
        <span className="topbar-version">v{APP_VERSION}</span>
        <button className="topbar-icon-btn" aria-label="Settings" onClick={onSettingsClick}>
          <Settings size={18} />
        </button>
        <UserButton afterSignOutUrl="/" />
      </div>

      <style>{`
        .topbar {
          height: var(--topbar-height);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--space-md);
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border);
          gap: var(--space-md);
          flex-shrink: 0;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          min-width: 0;
        }

        .topbar-logo {
          display: flex;
          align-items: baseline;
          gap: 4px;
          flex-shrink: 0;
        }

        .logo-mark {
          font-size: var(--text-lg);
          font-weight: 800;
          color: var(--cyan);
          letter-spacing: -0.5px;
        }

        .logo-text {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: 2px;
        }

        .topbar-venture {
          font-size: var(--text-sm);
          color: var(--text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .topbar-nav {
          display: flex;
          gap: 2px;
          background: var(--bg-deep);
          border-radius: var(--radius-md);
          padding: 3px;
        }

        .topbar-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: var(--radius-sm);
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }

        .topbar-tab:hover {
          color: var(--text-primary);
          background: var(--bg-card);
        }

        .topbar-tab.active {
          color: var(--cyan);
          background: var(--bg-card);
        }

        .topbar-right {
          display: flex;
          align-items: center;
        }

        .topbar-version {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--text-muted);
          padding: 2px 6px;
          background: var(--bg-card);
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
        }

        .topbar-icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }

        .topbar-icon-btn:hover {
          color: var(--text-primary);
          background: var(--bg-card);
        }

        @media (max-width: 640px) {
          .topbar-venture { display: none; }
          .topbar-tab span { display: none; }
          .topbar-tab { padding: 6px 10px; }
        }
      `}</style>
    </header>
  );
}
