import { useState, useEffect } from 'react';
import NavRail from './components/NavRail';
import ChatDock from './components/ChatDock';
import StatusBar from './components/StatusBar';
import CommandPalette from './components/CommandPalette';
import SettingsPanel from './components/SettingsPanel';
import { useNavigation } from './stores/navigation';
import { useTheme } from './stores/theme';
import { getVenture, ventures } from './lib/ventures';
import { UserButton } from './lib/auth';
import { APP_VERSION } from './lib/version';
import { Search } from 'lucide-react';

// Views
import NAOSChat from './components/NAOSChat';
import OpsPanel from './components/OpsPanel';
import VentureDashboard from './components/VentureDashboard';
import CommandCenter from './views/CommandCenter';

// Placeholder views for Phase 2
function PlaceholderView({ title, description }: { title: string; description: string }) {
  return (
    <div className="placeholder-view">
      <h2>{title}</h2>
      <p>{description}</p>
      <p className="placeholder-hint">Coming in Phase 2. Use NAOS chat or slash commands in the meantime.</p>
      <style>{`
        .placeholder-view {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          color: var(--text-primary);
          text-align: center;
          padding: var(--space-2xl);
        }
        .placeholder-view h2 { font-size: var(--text-2xl); font-weight: 700; }
        .placeholder-view p { font-size: var(--text-sm); color: var(--text-secondary); max-width: 400px; }
        .placeholder-hint { color: var(--text-muted) !important; font-size: var(--text-xs) !important; margin-top: var(--space-md); }
      `}</style>
    </div>
  );
}

function ViewRouter() {
  const { activeView, activeVenture } = useNavigation();
  const venture = getVenture(activeVenture || 'mcv') ?? ventures[0];

  switch (activeView) {
    case 'command-center':
      return <CommandCenter />;
    case 'portfolio':
      return <PlaceholderView title="Portfolio" description="Venture portfolio, capital stack, investment tracking." />;
    case 'chat':
      return <NAOSChat venture={venture} />;
    case 'intelligence':
      return <PlaceholderView title="Intelligence Hub" description="Document library, RAG queries, knowledge base." />;
    case 'treasury':
      return <PlaceholderView title="Treasury" description="EDGE token dashboard, cross-venture P&L, token economy." />;
    case 'ops':
      return <OpsPanel />;
    case 'engineering':
      return <PlaceholderView title="Engineering" description="CTO workbench, CI/CD status, infrastructure." />;
    case 'signals':
      return <PlaceholderView title="Signals" description="Live event stream, webhooks, real-time feeds." />;
    case 'settings':
      return <PlaceholderView title="Settings" description="Use the gear icon in the header." />;
    // Venture views
    case 'venture-dashboard':
      return <VentureDashboard venture={venture} />;
    case 'venture-engineering':
      return <PlaceholderView title={`${venture.name} — Engineering`} description="Venture repos, PRs, deployments." />;
    case 'venture-growth':
      return <PlaceholderView title={`${venture.name} — Growth`} description="Marketing, campaigns, analytics." />;
    case 'venture-operations':
      return <PlaceholderView title={`${venture.name} — Operations`} description="CRM, workflows, support." />;
    case 'venture-docs':
      return <PlaceholderView title={`${venture.name} — Documents`} description="Venture-scoped documents." />;
    case 'venture-settings':
      return <PlaceholderView title={`${venture.name} — Settings`} description="Venture configuration." />;
    default:
      return <NAOSChat venture={venture} />;
  }
}

export default function App() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { mode, activeVenture, chatDocked, toggleChatDock } = useNavigation();
  useTheme(); // keep theme store active
  const venture = getVenture(activeVenture || 'mcv');

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        toggleChatDock();
      }
      if (e.key === 'Escape' && paletteOpen) {
        setPaletteOpen(false);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [paletteOpen, toggleChatDock]);

  const contextLabel = mode === 'global'
    ? 'Global'
    : venture?.name || 'Venture';
  const contextColor = mode === 'global'
    ? 'var(--cyan)'
    : venture?.color || 'var(--cyan)';

  return (
    <div className="app-shell">
      {/* Nav Rail */}
      <NavRail />

      {/* Main Column */}
      <div className="app-main-col">
        {/* Header */}
        <header className="app-header">
          <div className="header-left">
            <span className="header-logo">MCV</span>
            <span className="header-logo-sub">ONE</span>
            <span className="header-context-badge" style={{ borderColor: contextColor, color: contextColor }}>
              {contextLabel}
            </span>
          </div>

          <button className="header-search" onClick={() => setPaletteOpen(true)}>
            <Search size={14} />
            <span>Search or command...</span>
            <kbd>Ctrl+K</kbd>
          </button>

          <div className="header-right">
            <span className="header-version">v{APP_VERSION}</span>
            <button className="header-icon-btn" onClick={() => setSettingsOpen(true)}>
              <span style={{ fontSize: '14px' }}>&#9881;</span>
            </button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {/* Content Area */}
        <div className="app-workspace">
          <div className="app-content">
            <ViewRouter />
          </div>

          {/* Chat Dock */}
          {chatDocked && <ChatDock />}
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Overlays */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <style>{`
        .app-shell {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
        }

        .app-shell > .nav-rail {
          position: fixed;
          left: 0;
          top: 0;
          height: 100vh;
          z-index: 20;
        }

        .app-main-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          margin-left: 56px;
          min-width: 0;
          height: calc(100vh - 28px);
        }

        .app-header {
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
          gap: 12px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .header-logo {
          font-size: 14px;
          font-weight: 800;
          color: var(--cyan);
        }

        .header-logo-sub {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-muted);
          letter-spacing: 2px;
        }

        .header-context-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border: 1px solid;
          border-radius: var(--radius-full);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .header-search {
          flex: 1;
          max-width: 400px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 12px;
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-muted);
          font-size: 12px;
          transition: border-color var(--transition-fast);
          cursor: pointer;
        }

        .header-search:hover { border-color: var(--border-active); }

        .header-search kbd {
          margin-left: auto;
          font-size: 9px;
          font-family: var(--font-mono);
          background: var(--bg-card);
          border: 1px solid var(--border);
          padding: 1px 5px;
          border-radius: 3px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .header-version {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--text-muted);
        }

        .header-icon-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          transition: all var(--transition-fast);
        }
        .header-icon-btn:hover { background: var(--bg-card); color: var(--text-primary); }

        .app-workspace {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .app-content {
          flex: 1;
          overflow: hidden;
          min-width: 0;
        }
      `}</style>
    </div>
  );
}
