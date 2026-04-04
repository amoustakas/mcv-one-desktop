import { useState, useEffect, lazy, Suspense } from 'react';
import AnimatedBackground from './components/AnimatedBackground';
import NavRail from './components/NavRail';
import ChatDock from './components/ChatDock';
import StatusBar from './components/StatusBar';
import CommandPalette from './components/CommandPalette';
import SettingsPanel from './components/SettingsPanel';
import { useNavigation, type ViewId } from './stores/navigation';
import { useTheme } from './stores/theme';
import { getVenture, ventures } from './lib/ventures';
import { UserButton } from './lib/auth';
import { Search, Settings, Bot, Columns2 } from 'lucide-react';
import VentureMegaMenu from './components/VentureMegaMenu';
import QuickCapture from './components/QuickCapture';
import Toasts from './components/Toasts';
import NotificationCenter from './components/NotificationCenter';

// Lazy-loaded views (code splitting)
const AegisChat = lazy(() => import('./components/AegisChat'));
const OpsPanel = lazy(() => import('./components/OpsPanel'));
const VentureDashboard = lazy(() => import('./components/VentureDashboard'));
const CommandCenter = lazy(() => import('./views/CommandCenter'));
const IntelligenceView = lazy(() => import('./views/IntelligenceView'));
const TreasuryView = lazy(() => import('./views/TreasuryView'));
const PortfolioView = lazy(() => import('./views/PortfolioView'));
const EngineeringView = lazy(() => import('./views/EngineeringView'));
const SignalsView = lazy(() => import('./views/SignalsView'));
const GrowthView = lazy(() => import('./views/GrowthView'));
const TasksView = lazy(() => import('./views/TasksView'));
const CRMView = lazy(() => import('./views/CRMView'));
const ForgeView = lazy(() => import('./views/ForgeView'));
const DocsHub = lazy(() => import('./views/DocsHub'));
const AIStudioView = lazy(() => import('./views/AIStudioView'));
const SessionsView = lazy(() => import('./views/SessionsView'));
const PromptComposer = lazy(() => import('./views/PromptComposer'));
const WarRoom = lazy(() => import('./views/WarRoom'));
const VentureProfile = lazy(() => import('./views/VentureProfile'));
const TeamView = lazy(() => import('./views/TeamView'));
const SettingsView = lazy(() => import('./views/SettingsView'));
const VentureOnboarding = lazy(() => import('./views/VentureOnboarding'));

// Placeholder views
function PlaceholderView({ title, description }: { title: string; description: string }) {
  return (
    <div className="placeholder-view">
      <h2>{title}</h2>
      <p>{description}</p>
      <p className="placeholder-hint">Coming in Phase 2. Use Aegis chat or slash commands in the meantime.</p>
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

function ViewLoadingFallback() {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div className="view-loader" />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Loading module...</span>
      </div>
    </div>
  );
}

function renderView(viewId: ViewId, venture: ReturnType<typeof getVenture> & object) {
  switch (viewId) {
    case 'command-center':
      return <CommandCenter />;
    case 'portfolio':
      return <PortfolioView />;
    case 'chat':
      return <AegisChat venture={venture} />;
    case 'intelligence':
      return <IntelligenceView />;
    case 'treasury':
      return <TreasuryView />;
    case 'ops':
      return <OpsPanel />;
    case 'engineering':
      return <EngineeringView />;
    case 'signals':
      return <SignalsView />;
    case 'tasks':
      return <TasksView />;
    case 'crm':
      return <CRMView />;
    case 'forge':
      return <ForgeView />;
    case 'docs':
      return <DocsHub />;
    case 'ai-studio':
      return <AIStudioView />;
    case 'sessions':
      return <SessionsView />;
    case 'prompt-composer':
      return <PromptComposer />;
    case 'war-room':
      return <WarRoom />;
    case 'team':
      return <TeamView />;
    case 'settings':
      return <SettingsView />;
    // Venture views
    case 'venture-dashboard':
      return <VentureDashboard venture={venture} />;
    case 'venture-engineering':
      return <EngineeringView />;
    case 'venture-growth':
      return <GrowthView />;
    case 'venture-operations':
      return <PlaceholderView title={`${venture.name} — Operations`} description="CRM, workflows, and support center. Connect Twilio for voice/SMS." />;
    case 'venture-docs':
      return <DocsHub />;
    case 'venture-forge':
      return <ForgeView />;
    case 'venture-tasks':
      return <TasksView />;
    case 'venture-profile':
      return <VentureProfile venture={venture} />;
    case 'venture-settings':
      return <PlaceholderView title={`${venture.name} — Settings`} description="Venture configuration." />;
    case 'venture-onboarding':
      return <VentureOnboarding />;
    case 'growth':
      return <GrowthView />;
    default:
      return <AegisChat venture={venture} />;
  }
}

function ViewPanel({ viewId }: { viewId?: ViewId }) {
  const { activeView, activeVenture } = useNavigation();
  const venture = getVenture(activeVenture || 'mcv') ?? ventures[0];
  const view = renderView(viewId ?? activeView, venture);
  return <Suspense fallback={<ViewLoadingFallback />}>{view}</Suspense>;
}

function SplitWorkspace() {
  const { splitView, splitRatio, setSplitRatio, closeSplit, swapPanels } = useNavigation();
  const [dragging, setDragging] = useState(false);

  function handleMouseDown() {
    setDragging(true);
    function onMove(e: MouseEvent) {
      const container = document.querySelector('.app-workspace') as HTMLElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      setSplitRatio(ratio);
    }
    function onUp() {
      setDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  if (!splitView) {
    return (
      <div className="app-content">
        <ViewPanel />
      </div>
    );
  }

  return (
    <>
      <div className="app-content split-left" style={{ width: `${splitRatio * 100}%` }}>
        <ViewPanel />
      </div>
      <div className={`split-divider ${dragging ? 'active' : ''}`} onMouseDown={handleMouseDown}>
        <div className="split-divider-line" />
        <div className="split-divider-actions">
          <button className="split-action-btn" onClick={swapPanels} title="Swap panels">⇄</button>
          <button className="split-action-btn" onClick={closeSplit} title="Close split (Ctrl+\\)">✕</button>
        </div>
      </div>
      <div className="app-content split-right" style={{ width: `${(1 - splitRatio) * 100}%` }}>
        <ViewPanel viewId={splitView} />
      </div>
    </>
  );
}

const VIEW_LABELS: Record<string, string> = {
  'command-center': 'Command Center', portfolio: 'Portfolio', chat: 'Aegis AI',
  intelligence: 'Knowledge Base', treasury: 'Treasury', signals: 'Signals',
  engineering: 'CTO Dashboard', ops: 'Ops Center', forge: 'The Forge',
  sessions: 'Sessions', 'war-room': 'War Room', crm: 'CRM Pipeline',
  growth: 'Growth Studio', tasks: 'Task Board', docs: 'Docs Hub',
  'ai-studio': 'AI Studio', 'prompt-composer': 'Prompt Composer', team: 'Team', settings: 'Settings',
  'venture-dashboard': 'Dashboard', 'venture-profile': 'Profile & Assets',
  'venture-engineering': 'Engineering', 'venture-growth': 'Growth',
  'venture-operations': 'Operations', 'venture-docs': 'Documents',
  'venture-forge': 'The Forge', 'venture-tasks': 'Tasks',
  'venture-settings': 'Settings', 'venture-onboarding': 'New Venture',
};

const SECTION_MAP: Record<string, string> = {
  'command-center': 'Command', portfolio: 'Command', chat: 'Command',
  intelligence: 'Intelligence', treasury: 'Intelligence', signals: 'Intelligence',
  engineering: 'Engineering', ops: 'Engineering', forge: 'Engineering',
  sessions: 'Engineering', 'war-room': 'Engineering',
  crm: 'Growth & CRM', growth: 'Growth & CRM',
  tasks: 'Operations', docs: 'Operations', team: 'Operations',
  'ai-studio': 'AI Tools', 'prompt-composer': 'AI Tools',
  settings: 'System',
};

function Breadcrumbs() {
  const { mode, activeView, activeVenture } = useNavigation();
  const venture = getVenture(activeVenture || 'mcv');

  const crumbs: string[] = [];
  if (mode === 'global') {
    crumbs.push('Global');
    const section = SECTION_MAP[activeView];
    if (section) crumbs.push(section);
  } else if (venture) {
    crumbs.push(venture.name);
  }
  crumbs.push(VIEW_LABELS[activeView] || activeView);

  return (
    <div className="breadcrumbs">
      {crumbs.map((c, i) => (
        <span key={i}>
          {i > 0 && <span className="bc-sep">/</span>}
          <span className={i === crumbs.length - 1 ? 'bc-active' : 'bc-parent'}>{c}</span>
        </span>
      ))}
    </div>
  );
}

export default function App() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const { chatDocked, toggleChatDock, setView, toggleSplit, splitView, mode, switchToGlobal, switchToVenture } = useNavigation();
  useTheme();

  // Keyboard shortcuts
  useEffect(() => {
    const globalViews: ViewId[] = ['command-center', 'portfolio', 'chat', 'intelligence', 'treasury', 'ops', 'engineering', 'tasks', 'crm'];

    function handleKey(e: KeyboardEvent) {
      // Don't capture if typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        toggleChatDock();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setQuickCaptureOpen(o => !o);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        toggleSplit();
      }
      if (e.key === 'Escape') {
        if (paletteOpen) setPaletteOpen(false);
        if (settingsOpen) setSettingsOpen(false);
      }
      // Ctrl+E — toggle global/venture mode
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        if (mode === 'global') {
          switchToVenture('mcv');
        } else {
          switchToGlobal();
        }
      }
      // Cmd+1 through Cmd+8 for global views
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key >= '1' && e.key <= '8') {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (globalViews[idx]) setView(globalViews[idx]);
      }
      // Ctrl+Shift+1-9 for ventures
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (ventures[idx]) switchToVenture(ventures[idx].id);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [paletteOpen, settingsOpen, toggleChatDock, setView, toggleSplit, mode, switchToGlobal, switchToVenture]);

  // Context used by VentureMegaMenu in header

  return (
    <div className="app-shell">
      <AnimatedBackground />

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
            <VentureMegaMenu />
            <div className="header-divider" />
            <Breadcrumbs />
          </div>

          <button className="header-search" onClick={() => setPaletteOpen(true)}>
            <Search size={14} />
            <span className="header-search-text">Search views, ventures, commands...</span>
            <kbd className="header-kbd">Ctrl+K</kbd>
          </button>

          <div className="header-right">
            <button
              className="header-icon-btn"
              onClick={toggleSplit}
              title={splitView ? 'Close Split (Ctrl+\\)' : 'Split View (Ctrl+\\)'}
              style={splitView ? { color: 'var(--cyan)' } : undefined}
            >
              <Columns2 size={15} />
            </button>
            <NotificationCenter />
            <button className="header-icon-btn" onClick={() => setView('settings')} title="Settings">
              <Settings size={15} />
            </button>
            <button
              className="header-icon-btn"
              onClick={toggleChatDock}
              title={chatDocked ? 'Hide Aegis (Ctrl+/)' : 'Show Aegis (Ctrl+/)'}
              style={chatDocked ? { color: 'var(--cyan)' } : undefined}
            >
              <Bot size={15} />
            </button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {/* Content Area */}
        <div className="app-workspace">
          <SplitWorkspace />

          {/* Chat Dock */}
          {chatDocked && <ChatDock />}
        </div>

        {/* Status Bar inside main column */}
        <StatusBar />
      </div>

      {/* Quick Capture FAB */}
      <QuickCapture open={quickCaptureOpen} onToggle={() => setQuickCaptureOpen(o => !o)} />

      {/* Overlays */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <Toasts />

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
          overflow: hidden;
        }

        /* ── Header ── */
        .app-header {
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          background: linear-gradient(180deg, rgba(11, 17, 33, 0.95), rgba(11, 17, 33, 0.85));
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
          gap: 16px;
          backdrop-filter: blur(12px);
          position: relative;
        }
        .app-header::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.15), rgba(139, 92, 246, 0.1), transparent);
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
          text-shadow: 0 0 12px rgba(0, 240, 255, 0.4);
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

        /* Breadcrumbs */
        .breadcrumbs {
          display: flex;
          align-items: center;
          gap: 0;
          font-size: 11px;
          white-space: nowrap;
        }
        .bc-sep {
          margin: 0 6px;
          color: var(--text-muted);
          opacity: 0.4;
        }
        .bc-parent {
          color: var(--text-muted);
        }
        .bc-active {
          color: var(--text-secondary);
          font-weight: 500;
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
          box-shadow: 0 0 0 3px rgba(0, 240, 255, 0.04);
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
        .app-content.split-left,
        .app-content.split-right {
          flex: none;
        }

        /* ── Split Divider ── */
        .split-divider {
          width: 6px;
          flex-shrink: 0;
          background: var(--border);
          cursor: col-resize;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }
        .split-divider:hover, .split-divider.active {
          background: var(--cyan);
        }
        .split-divider-line {
          width: 2px;
          height: 32px;
          background: var(--text-muted);
          border-radius: 1px;
          opacity: 0.3;
        }
        .split-divider:hover .split-divider-line,
        .split-divider.active .split-divider-line {
          opacity: 0;
        }
        .split-divider-actions {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          gap: 4px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s;
        }
        .split-divider:hover .split-divider-actions {
          opacity: 1;
          pointer-events: all;
        }
        .split-action-btn {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--bg-surface);
          border: 1px solid var(--cyan);
          color: var(--cyan);
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .split-action-btn:hover {
          background: var(--cyan);
          color: var(--bg-deep);
        }

        .view-loader {
          width: 24px; height: 24px;
          border: 2px solid var(--border);
          border-top-color: var(--cyan);
          border-radius: 50%;
          animation: viewSpin 0.6s linear infinite;
        }
        @keyframes viewSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
