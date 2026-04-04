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
// version shown in StatusBar
import { Search, Settings, Bot } from 'lucide-react';

// Views
import NAOSChat from './components/NAOSChat';
import OpsPanel from './components/OpsPanel';
import VentureDashboard from './components/VentureDashboard';
import CommandCenter from './views/CommandCenter';
import IntelligenceView from './views/IntelligenceView';
import TreasuryView from './views/TreasuryView';
import PortfolioView from './views/PortfolioView';
import EngineeringView from './views/EngineeringView';

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
      return <PortfolioView />;
    case 'chat':
      return <NAOSChat venture={venture} />;
    case 'intelligence':
      return <IntelligenceView />;
    case 'treasury':
      return <TreasuryView />;
    case 'ops':
      return <OpsPanel />;
    case 'engineering':
      return <EngineeringView />;
    case 'signals':
      return <PlaceholderView title="Signals" description="Live event stream, webhooks, real-time feeds." />;
    case 'settings':
      return <PlaceholderView title="Settings" description="Use the gear icon in the header." />;
    // Venture views
    case 'venture-dashboard':
      return <VentureDashboard venture={venture} />;
    case 'venture-engineering':
      return <EngineeringView />;
    case 'venture-growth':
      return <PlaceholderView title={`${venture.name} — Growth`} description="Marketing, campaigns, analytics." />;
    case 'venture-operations':
      return <PlaceholderView title={`${venture.name} — Operations`} description="CRM, workflows, support." />;
    case 'venture-docs':
      return <IntelligenceView />;
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
            <div className="header-brand">
              <span className="header-logo">MCV</span>
              <span className="header-logo-sub">ONE</span>
            </div>
            <div className="header-divider" />
            <div className="header-context" style={{ '--ctx-color': contextColor } as React.CSSProperties}>
              <span className="header-ctx-dot" style={{ background: contextColor }} />
              <span className="header-ctx-label">{contextLabel}</span>
              {mode === 'venture' && venture && (
                <span className="header-ctx-tagline">{venture.tagline}</span>
              )}
            </div>
          </div>

          <button className="header-search" onClick={() => setPaletteOpen(true)}>
            <Search size={14} />
            <span className="header-search-text">Search views, ventures, commands...</span>
            <kbd className="header-kbd">Ctrl+K</kbd>
          </button>

          <div className="header-right">
            <button className="header-icon-btn" onClick={() => setSettingsOpen(true)} title="Settings">
              <Settings size={15} />
            </button>
            <button
              className="header-icon-btn"
              onClick={toggleChatDock}
              title={chatDocked ? 'Hide NAOS (Ctrl+/)' : 'Show NAOS (Ctrl+/)'}
              style={chatDocked ? { color: 'var(--cyan)' } : undefined}
            >
              <Bot size={15} />
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

      {/* Status Bar - spans full width */}
      <StatusBar />

      {/* Overlays */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <style>{`
        .app-shell {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
        }

        .app-main-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          height: 100vh;
        }

        /* ── Header ── */
        .app-header {
          height: 48px;
          display: flex;
          align-items: center;
          padding: 0 16px;
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
          gap: 16px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .header-brand {
          display: flex;
          align-items: baseline;
          gap: 3px;
        }

        .header-logo {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 700;
          color: var(--cyan);
          letter-spacing: -0.5px;
        }

        .header-logo-sub {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          letter-spacing: 3px;
        }

        .header-divider {
          width: 1px;
          height: 20px;
          background: var(--border);
        }

        .header-context {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-ctx-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          box-shadow: 0 0 6px var(--ctx-color);
        }

        .header-ctx-label {
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 600;
          color: var(--ctx-color);
        }

        .header-ctx-tagline {
          font-size: 11px;
          color: var(--text-muted);
        }

        /* Search bar */
        .header-search {
          flex: 1;
          max-width: 420px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-muted);
          font-size: 12px;
          transition: all 0.15s ease;
          cursor: pointer;
        }

        .header-search:hover {
          border-color: var(--border-active);
          background: var(--bg-card);
        }

        .header-search-text { flex: 1; }

        .header-kbd {
          font-size: 9px;
          font-family: var(--font-mono);
          background: var(--bg-surface);
          border: 1px solid var(--border);
          padding: 2px 6px;
          border-radius: 3px;
          color: var(--text-muted);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        .header-icon-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          transition: all 0.15s ease;
        }
        .header-icon-btn:hover {
          background: var(--bg-card);
          color: var(--text-primary);
        }

        /* ── Workspace ── */
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
