import { useState, useEffect, lazy, Suspense } from 'react';
import AnimatedBackground from './components/AnimatedBackground';
import NavRail from './components/NavRail';
import ChatDock from './components/ChatDock';
import StatusBar from './components/StatusBar';
import CommandPalette from './components/CommandPalette';
import SettingsPanel from './components/SettingsPanel';
import { ViewErrorBoundary } from './components/ErrorBoundary';
import { useNavigation, type ViewId } from './stores/navigation';
import { useTheme } from './stores/theme';
import { useCommandStore } from './stores/command';
import { useLayoutStore } from './stores/layout';
import { getVenture, ventures } from './lib/ventures';
// UserButton removed — unused
import { Search, Settings, Bot } from 'lucide-react';
import LayoutPicker from './components/LayoutPicker';
import WorkspaceRenderer, { setViewPanelComponent } from './components/WorkspaceRenderer';
import { useWorkspaceStore } from './stores/workspace';
import { usePresence } from './hooks/use-presence';
import PresenceAvatar from './components/PresenceAvatar';
import PresenceCard from './components/PresenceCard';
import VentureMegaMenu from './components/VentureMegaMenu';
import QuickCapture from './components/QuickCapture';
import CommsActionFAB from './components/CommsActionFAB';
import Toasts from './components/Toasts';
import HITLModal from './components/control-room/HITLModal';
import NotificationCenter from './components/NotificationCenter';
import { useLocalServer } from './lib/local';
import { usePipelineSync } from './hooks/use-pipeline-sync';
import { useCommsSync } from './hooks/use-comms-sync';
import { useRealtimeSync } from './hooks/use-realtime';
import { useDeviceNotifications } from './hooks/use-device-notifications';
import { useDeviceProfileSync } from './hooks/use-device-profile-sync';
import { useDeviceEvents } from './hooks/use-device-events';
import { useInstanceRegistration } from './hooks/use-instance-registration';

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
const KitStoreView = lazy(() => import('./views/KitStoreView'));
const SettingsView = lazy(() => import('./views/SettingsView'));
const VentureOnboarding = lazy(() => import('./views/VentureOnboarding'));
const MemoryView = lazy(() => import('./views/MemoryView'));
const PipelineView = lazy(() => import('./views/PipelineView'));
const OperatorControlRoom = lazy(() => import('./views/OperatorControlRoom'));
const CommsHub = lazy(() => import('./views/CommsHub'));
const FilesView = lazy(() => import('./views/FilesView'));
const VentureWorkspaceView = lazy(() => import('./views/VentureWorkspaceView'));
// Google AI Studio views
const VideoStudioView = lazy(() => import('./views/VideoStudioView'));
const VoiceStudioView = lazy(() => import('./views/VoiceStudioView'));
const CreativeCanvasView = lazy(() => import('./views/CreativeCanvasView'));
const DeviceHubView = lazy(() => import('./views/DeviceHubView'));
const StreamDeckView = lazy(() => import('./views/StreamDeckView'));
const AudioRouterView = lazy(() => import('./views/AudioRouterView'));
const AdStudioView = lazy(() => import('./views/AdStudioView'));
const ConnectedSessionsView = lazy(() => import('./views/ConnectedSessionsView'));
// Browser & YouTube
const BrowserView = lazy(() => import('./views/BrowserView'));
const YouTubePlayerView = lazy(() => import('./views/YouTubePlayerView'));
// Google Workspace
const GmailView = lazy(() => import('./views/GmailView'));
const CalendarView = lazy(() => import('./views/CalendarView'));
const GoogleDocsView = lazy(() => import('./views/GoogleDocsView'));
const GoogleTasksView = lazy(() => import('./views/GoogleTasksView'));
// Commerce + Financials views
const CommerceOverview = lazy(() => import('./views/CommerceOverview'));
const CommerceProducts = lazy(() => import('./views/CommerceProducts'));
const CommerceSubscriptions = lazy(() => import('./views/CommerceSubscriptions'));
const CommerceOrders = lazy(() => import('./views/CommerceOrders'));
const CommerceCustomers = lazy(() => import('./views/CommerceCustomers'));
const CommerceInventory = lazy(() => import('./views/CommerceInventory'));
const CommerceFulfillment = lazy(() => import('./views/CommerceFulfillment'));
const CommerceDiscounts = lazy(() => import('./views/CommerceDiscounts'));
const CommerceReviews = lazy(() => import('./views/CommerceReviews'));
const CommerceGiftCards = lazy(() => import('./views/CommerceGiftCards'));
const CommerceAnalytics = lazy(() => import('./views/CommerceAnalytics'));
const CommerceShopSettings = lazy(() => import('./views/CommerceShopSettings'));
const FinancialsDashboard = lazy(() => import('./views/FinancialsDashboard'));
const FinancialsStatements = lazy(() => import('./views/FinancialsStatements'));
const CostIntelligence = lazy(() => import('./views/CostIntelligence'));
const FinancialsLedger = lazy(() => import('./views/FinancialsLedger'));
const Checkout = lazy(() => import('./views/Checkout'));

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
    case 'comms-hub':
      return <CommsHub />;
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
    case 'device-hub':
      return <DeviceHubView />;
    case 'stream-deck':
      return <StreamDeckView />;
    case 'audio-router':
      return <AudioRouterView />;
    case 'connected-sessions':
      return <ConnectedSessionsView />;
    case 'team':
      return <TeamView />;
    case 'kit-store':
      return <KitStoreView />;
    case 'memory':
      return <MemoryView />;
    case 'pipeline':
      return <PipelineView />;
    case 'control-room':
      return <OperatorControlRoom />;
    case 'settings':
      return <SettingsView />;
    case 'files':
      return <FilesView />;
    // AI Media Studios
    case 'video-studio':
      return <VideoStudioView />;
    case 'voice-studio':
      return <VoiceStudioView />;
    case 'creative-canvas':
      return <CreativeCanvasView />;
    case 'ad-studio':
      return <AdStudioView />;
    case 'naos-command':
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
    case 'venture-workspace':
      return <VentureWorkspaceView />;
    case 'growth':
      return <GrowthView />;
    // Commerce views
    case 'commerce-overview':
      return <CommerceOverview />;
    case 'commerce-products':
      return <CommerceProducts />;
    case 'commerce-subscriptions':
      return <CommerceSubscriptions />;
    case 'commerce-invoices':
      return <PlaceholderView title="Invoices" description="Invoice management — AR tracking, send & collect." />;
    case 'commerce-orders':
      return <CommerceOrders />;
    case 'commerce-customers':
      return <CommerceCustomers />;
    case 'commerce-inventory':
      return <CommerceInventory />;
    case 'commerce-fulfillment':
      return <CommerceFulfillment />;
    case 'commerce-discounts':
      return <CommerceDiscounts />;
    case 'commerce-reviews':
      return <CommerceReviews />;
    case 'commerce-gift-cards':
      return <CommerceGiftCards />;
    case 'commerce-analytics':
      return <CommerceAnalytics />;
    case 'commerce-shop-settings':
      return <CommerceShopSettings />;
    case 'commerce-credits':
      return <PlaceholderView title="Credits & Wallets" description="Credit ledgers, wallet balances, and grant management." />;
    case 'commerce-loans':
      return <PlaceholderView title="Loans" description="Loan origination, disbursement, and repayment tracking." />;
    case 'commerce-tax':
      return <PlaceholderView title="Tax" description="Tax calculation, jurisdiction rules, and remittance." />;
    case 'venture-commerce':
      return <CommerceOverview />;
    case 'venture-products':
      return <CommerceProducts />;
    case 'venture-subscriptions':
      return <CommerceSubscriptions />;
    // Financials views
    case 'financials-dashboard':
      return <FinancialsDashboard />;
    case 'financials-statements':
      return <FinancialsStatements />;
    case 'financials-cost-intelligence':
      return <CostIntelligence />;
    case 'financials-ledger':
      return <FinancialsLedger />;
    case 'financials-reporting':
      return <PlaceholderView title="Reporting" description="Custom financial reports, exports, and scheduled delivery." />;
    case 'venture-financials':
      return <FinancialsDashboard />;
    // Creator views
    case 'creator-hub':
      return <PlaceholderView title="Creator Hub" description="Content creator management, payouts, and analytics." />;
    case 'creator-royalties':
      return <PlaceholderView title="Royalties" description="Royalty tracking, splits, and automated distributions." />;
    case 'creator-escrow':
      return <PlaceholderView title="Escrow" description="Deal escrow, milestone-based releases, and disputes." />;
    case 'checkout':
      return <Checkout />;
    // Browser & YouTube
    case 'browser':
      return <BrowserView />;
    case 'youtube-player':
      return <YouTubePlayerView />;
    // Google Workspace
    case 'gmail':
      return <GmailView />;
    case 'calendar':
      return <CalendarView />;
    case 'drive':
      return <FilesView />;
    case 'sheets':
      return <GoogleDocsView />;
    case 'google-docs':
      return <GoogleDocsView />;
    case 'google-tasks':
      return <GoogleTasksView />;
    default:
      return <AegisChat venture={venture} />;
  }
}

function ViewPanel({ viewId }: { viewId?: ViewId }) {
  const { activeView, activeVenture } = useNavigation();
  const venture = getVenture(activeVenture || 'mcv') ?? ventures[0];
  const currentView = viewId ?? activeView;
  const view = renderView(currentView, venture);
  return (
    <ViewErrorBoundary key={currentView} fallbackTitle={`Error loading ${currentView}`}>
      <Suspense fallback={<ViewLoadingFallback />}>{view}</Suspense>
    </ViewErrorBoundary>
  );
}

// Register ViewPanel with WorkspaceRenderer for multi-panel layouts
setViewPanelComponent(ViewPanel);



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
  files: 'Files', 'venture-workspace': 'Workspace',
  'commerce-overview': 'Commerce Overview', 'commerce-products': 'Products',
  'commerce-subscriptions': 'Subscriptions', 'commerce-invoices': 'Invoices',
  'commerce-orders': 'Orders', 'commerce-credits': 'Credits & Wallets',
  'commerce-loans': 'Loans', 'commerce-tax': 'Tax',
  'financials-dashboard': 'Financials', 'financials-statements': 'Statements',
  'financials-cost-intelligence': 'Cost Intelligence', 'financials-ledger': 'Ledger',
  'financials-reporting': 'Reporting',
  'creator-hub': 'Creator Hub', 'creator-royalties': 'Royalties', 'creator-escrow': 'Escrow',
};

const SECTION_MAP: Record<string, string> = {
  'command-center': 'Command', portfolio: 'Command', chat: 'Command',
  intelligence: 'Intelligence', treasury: 'Intelligence', signals: 'Intelligence',
  engineering: 'Engineering', ops: 'Engineering', forge: 'Engineering',
  sessions: 'Engineering', 'war-room': 'Engineering',
  crm: 'Growth & CRM', growth: 'Growth & CRM',
  tasks: 'Operations', docs: 'Operations', files: 'Operations', team: 'Operations',
  'ai-studio': 'AI Tools', 'prompt-composer': 'AI Tools',
  settings: 'System',
  'commerce-overview': 'Commerce', 'commerce-products': 'Commerce',
  'commerce-subscriptions': 'Commerce', 'commerce-invoices': 'Commerce',
  'commerce-orders': 'Commerce', 'commerce-credits': 'Commerce',
  'commerce-loans': 'Commerce', 'commerce-tax': 'Commerce',
  'financials-dashboard': 'Financials', 'financials-statements': 'Financials',
  'financials-cost-intelligence': 'Financials', 'financials-ledger': 'Financials',
  'financials-reporting': 'Financials',
  'creator-hub': 'Creator', 'creator-royalties': 'Creator', 'creator-escrow': 'Creator',
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

// LayoutPicker moved to src/components/LayoutPicker.tsx


export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const { chatDocked, toggleChatDock, setView, toggleSplit, mode, switchToGlobal, switchToVenture, goBack, goForward } = useNavigation();
  const { isOpen: paletteOpen, toggle: togglePalette, close: closePalette } = useCommandStore();
  const { sidebarCollapsed, statusBarVisible, presets } = useLayoutStore();
  useTheme();

  // Bridge: navigation store → workspace store
  // When NavRail/keyboard sets activeView, update the active workspace panel
  const navActiveView = useNavigation(s => s.activeView);
  const { activePanelId, setPanelView, layout: wsLayout } = useWorkspaceStore();
  useEffect(() => {
    if (activePanelId) {
      // Update the focused panel to show the new view
      setPanelView(activePanelId, navActiveView);
    } else {
      // No panel focused — update the first panel
      function getFirstPanelId(node: import('./stores/workspace').LayoutNode): string | null {
        if (node.type === 'view') return node.id;
        return getFirstPanelId(node.children[0]);
      }
      const firstId = getFirstPanelId(wsLayout);
      if (firstId) setPanelView(firstId, navActiveView);
    }
  }, [navActiveView]); // eslint-disable-line react-hooks/exhaustive-deps

  useLocalServer(); // Detect local server connection
  usePipelineSync(); // Auto-sync local data → Supabase every 5min
  useRealtimeSync(); // Supabase Realtime — live push updates across devices
  useCommsSync();    // Auto-ingest comms data → Knowledge Base, CRM, Tasks every 5min
  usePresence();     // Device detection + AI status inference + Supabase presence broadcast
  useInstanceRegistration(); // Register this window as a device + sync remote instances
  useDeviceEvents();        // SSE connection to local server for real-time device events
  useDeviceNotifications(); // Toast notifications for device connect/disconnect/error
  useDeviceProfileSync();   // Auto-activate device profiles on venture switch
  const [presenceCardOpen, setPresenceCardOpen] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const globalViews: ViewId[] = ['command-center', 'portfolio', 'chat', 'intelligence', 'treasury', 'ops', 'engineering', 'tasks', 'crm'];

    function handleKey(e: KeyboardEvent) {
      // Don't capture if typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        togglePalette();
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
        if (paletteOpen) closePalette();
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
      // Alt+1/2/3 for workspace presets
      if (e.altKey && !e.metaKey && !e.ctrlKey && e.key >= '1' && e.key <= '3') {
        e.preventDefault();
        const preset = presets[parseInt(e.key) - 1];
        if (preset) {
          setView(preset.activeView);
          if (preset.splitView) {
            // Use navigation store's openSplit
            const nav = useNavigation.getState();
            nav.openSplit(preset.splitView);
            nav.setSplitRatio(preset.splitRatio);
          }
        }
      }
      // Alt+Left/Right for history navigation
      if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); goBack(); }
      if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); goForward(); }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [paletteOpen, settingsOpen, togglePalette, closePalette, toggleChatDock, setView, toggleSplit, mode, switchToGlobal, switchToVenture, goBack, goForward, presets]);

  // Context used by VentureMegaMenu in header

  return (
    <div className="app-shell">
      <AnimatedBackground />

      {/* Nav Rail */}
      {!sidebarCollapsed && <NavRail />}

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

          <button className="header-search" onClick={togglePalette}>
            <Search size={14} />
            <span className="header-search-text">Search views, ventures, commands...</span>
            <kbd className="header-kbd">Ctrl+K</kbd>
          </button>

          <div className="header-right">
            <LayoutPicker />
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
            <PresenceAvatar size={28} onClick={() => setPresenceCardOpen(!presenceCardOpen)} />
            {presenceCardOpen && <PresenceCard onClose={() => setPresenceCardOpen(false)} />}
          </div>
        </header>

        {/* Content Area */}
        <div className="app-workspace">
          <WorkspaceRenderer />

          {/* Chat Dock */}
          {chatDocked && <ChatDock />}
        </div>

        {/* Status Bar inside main column */}
        {statusBarVisible && <StatusBar />}
      </div>

      {/* Quick Capture FAB */}
      <QuickCapture open={quickCaptureOpen} onToggle={() => setQuickCaptureOpen(o => !o)} />
      {/* Global Comms FAB (Ctrl+M) */}
      <CommsActionFAB />

      {/* Overlays */}
      <CommandPalette open={paletteOpen} onClose={closePalette} />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <Toasts />
      <HITLModal />

      {/* Shell CSS extracted to src/styles/shell.css */}
    </div>
  );
}
