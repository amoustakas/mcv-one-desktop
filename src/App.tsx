import { useState, useEffect, lazy, Suspense } from 'react';
import { lazyRetry } from './lib/lazy-retry';
import AnimatedBackground from './components/AnimatedBackground';
import NavRail from './components/NavRail';
import MobileBottomNav from './components/MobileBottomNav';
import ChatDock from './components/ChatDock';
import StatusBar from './components/StatusBar';
import CommandPalette from './components/CommandPalette';
import SettingsPanel from './components/SettingsPanel';
import { ViewErrorBoundary } from './components/ErrorBoundary';
import { useNavigation, type ViewId } from './stores/navigation';
import { useTheme } from './stores/theme';
import { useMcpBootstrap } from './hooks/use-mcp-bootstrap';
import { useCommandStore } from './stores/command';
import { useLayoutStore } from './stores/layout';
import { getVenture, ventures } from './lib/ventures';
// UserButton removed — unused
import { Search, Settings, Bot, Brain } from 'lucide-react';
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
// Google Workspace background intelligence
import { useGoogleNotifications } from './hooks/use-google-notifications';
import { useProactiveIntelligence } from './hooks/use-proactive-intelligence';
import ContextSidebar from './components/ContextSidebar';
import { useInstanceRegistration } from './hooks/use-instance-registration';
import { useWhiteLabel } from './hooks/use-white-label';
import { useClerkVentureSync } from './hooks/use-clerk-venture-sync';
import { useVentureFromClerk } from './hooks/use-venture-from-clerk';
import { ventures as builtinVentures } from './lib/ventures';

// Lazy-loaded views (code splitting)
const AegisChat = lazyRetry(() => import('./components/AegisChat'));
const OpsPanel = lazyRetry(() => import('./components/OpsPanel'));
const VentureDashboard = lazyRetry(() => import('./components/VentureDashboard'));
const CommandCenter = lazyRetry(() => import('./views/CommandCenter'));
const IntelligenceView = lazyRetry(() => import('./views/IntelligenceView'));
const TreasuryView = lazyRetry(() => import('./views/TreasuryView'));
const PortfolioView = lazyRetry(() => import('./views/PortfolioView'));
const EngineeringView = lazyRetry(() => import('./views/EngineeringView'));
const SignalsView = lazyRetry(() => import('./views/SignalsView'));
const GrowthView = lazyRetry(() => import('./views/GrowthView'));
const TasksView = lazyRetry(() => import('./views/TasksView'));
const EpicBoardView = lazyRetry(() => import('./views/EpicBoardView'));
const SuiteView = lazyRetry(() => import('./views/suites/SuiteView'));
const VentureIntegrationsView = lazyRetry(() => import('./views/VentureIntegrationsView'));
const CRMView = lazyRetry(() => import('./views/CRMView'));
const CapitalGlobalView = lazyRetry(() => import('./views/CapitalGlobalView'));
const CapitalVentureView = lazyRetry(() => import('./views/CapitalVentureView'));
const CapitalRoundDetailView = lazyRetry(() => import('./views/CapitalRoundDetailView'));
const CapitalFoundationView = lazyRetry(() => import('./views/CapitalFoundationView'));
const DistributionsView = lazyRetry(() => import('./views/DistributionsView'));
const RoundBrowseView = lazyRetry(() => import('./views/investor/RoundBrowseView'));
const AgentsView = lazyRetry(() => import('./views/AgentsView'));
const AgentProfileView = lazyRetry(() => import('./views/AgentProfileView'));
const AgentChatView = lazyRetry(() => import('./views/AgentChatView'));
const LadderView = lazyRetry(() => import('./views/LadderView'));
const PersonaRegistryView = lazyRetry(() => import('./views/PersonaRegistryView'));
const PlatformApiKeysView = lazyRetry(() => import('./views/PlatformApiKeysView'));
const ProspectsView = lazyRetry(() => import('./views/ProspectsView'));
const ProspectProfileView = lazyRetry(() => import('./views/ProspectProfileView'));
const PeopleView = lazyRetry(() => import('./views/PeopleView'));
const ForgeView = lazyRetry(() => import('./views/ForgeView'));
const DocsHub = lazyRetry(() => import('./views/DocsHub'));
const BlogAdmin = lazyRetry(() => import('./views/BlogAdmin'));
const VentureSiteAdmin = lazyRetry(() => import('./views/VentureSiteAdmin'));
const AnnouncementsAdmin = lazyRetry(() => import('./views/AnnouncementsAdmin'));
const TaxonomyAdmin = lazyRetry(() => import('./views/TaxonomyAdmin'));
const AIStudioView = lazyRetry(() => import('./views/AIStudioView'));
const SessionsView = lazyRetry(() => import('./views/SessionsView'));
const PromptComposer = lazyRetry(() => import('./views/PromptComposer'));
const WarRoom = lazyRetry(() => import('./views/WarRoom'));
const VentureProfile = lazyRetry(() => import('./views/VentureProfile'));
const VentureDetailView = lazyRetry(() => import('./views/VentureDetailView'));
const VenturesIndexView = lazyRetry(() => import('./views/VenturesIndexView'));
const VentureWizardGamified = lazyRetry(() => import('./views/VentureWizardGamified'));
const DepartmentPortfolioView = lazyRetry(() => import('./views/DepartmentPortfolioView'));
const TeamView = lazyRetry(() => import('./views/TeamView'));
const KitStoreView = lazyRetry(() => import('./views/KitStoreView'));
const SettingsView = lazyRetry(() => import('./views/SettingsView'));
const VentureOnboarding = lazyRetry(() => import('./views/VentureOnboarding'));
const MemoryView = lazyRetry(() => import('./views/MemoryView'));
const PipelineView = lazyRetry(() => import('./views/PipelineView'));
const OperatorControlRoom = lazyRetry(() => import('./views/OperatorControlRoom'));
const CommsHub = lazyRetry(() => import('./views/CommsHub'));
const FilesView = lazyRetry(() => import('./views/FilesView'));
const VentureWorkspaceView = lazyRetry(() => import('./views/VentureWorkspaceView'));
// Google AI Studio views
const VideoStudioView = lazyRetry(() => import('./views/VideoStudioView'));
const VoiceStudioView = lazyRetry(() => import('./views/VoiceStudioView'));
const CreativeCanvasView = lazyRetry(() => import('./views/CreativeCanvasView'));
const DeviceHubView = lazyRetry(() => import('./views/DeviceHubView'));
const StreamDeckView = lazyRetry(() => import('./views/StreamDeckView'));
const AudioRouterView = lazyRetry(() => import('./views/AudioRouterView'));
const AdStudioView = lazyRetry(() => import('./views/AdStudioView'));
const ConnectedSessionsView = lazyRetry(() => import('./views/ConnectedSessionsView'));
// Browser & YouTube
const BrowserView = lazyRetry(() => import('./views/BrowserView'));
const YouTubePlayerView = lazyRetry(() => import('./views/YouTubePlayerView'));
// Google Workspace
const GmailView = lazyRetry(() => import('./views/GmailView'));
const CalendarView = lazyRetry(() => import('./views/CalendarView'));
const GoogleDocsView = lazyRetry(() => import('./views/GoogleDocsView'));
const GoogleTasksView = lazyRetry(() => import('./views/GoogleTasksView'));
// New enterprise views
const CreatorHubView = lazyRetry(() => import('./views/CreatorHubView'));
const ComplianceHubView = lazyRetry(() => import('./views/ComplianceHubView'));
const ContactCenterView = lazyRetry(() => import('./views/ContactCenterView'));
const CommerceInvoicesView = lazyRetry(() => import('./views/CommerceInvoicesView'));
const CommerceLoansView = lazyRetry(() => import('./views/CommerceLoansView'));
const CommerceCreditsView = lazyRetry(() => import('./views/CommerceCreditsView'));
const FinancialsReportingView = lazyRetry(() => import('./views/FinancialsReportingView'));
const VentureOperationsView = lazyRetry(() => import('./views/VentureOperationsView'));
const VentureSettingsView = lazyRetry(() => import('./views/VentureSettingsView'));
const KnowledgeHubView = lazyRetry(() => import('./views/KnowledgeHubView'));
const AuditLogView = lazyRetry(() => import('./views/AuditLogView'));
// Commerce + Financials views
const CommerceOverview = lazyRetry(() => import('./views/CommerceOverview'));
const CommerceProducts = lazyRetry(() => import('./views/CommerceProducts'));
const CommerceSubscriptions = lazyRetry(() => import('./views/CommerceSubscriptions'));
const CommerceOrders = lazyRetry(() => import('./views/CommerceOrders'));
const CommerceCustomers = lazyRetry(() => import('./views/CommerceCustomers'));
const CommerceInventory = lazyRetry(() => import('./views/CommerceInventory'));
const CommerceFulfillment = lazyRetry(() => import('./views/CommerceFulfillment'));
const CommerceDiscounts = lazyRetry(() => import('./views/CommerceDiscounts'));
const CommerceReviews = lazyRetry(() => import('./views/CommerceReviews'));
const CommerceGiftCards = lazyRetry(() => import('./views/CommerceGiftCards'));
const CommerceAnalytics = lazyRetry(() => import('./views/CommerceAnalytics'));
const CommerceShopSettings = lazyRetry(() => import('./views/CommerceShopSettings'));
const FinancialsDashboard = lazyRetry(() => import('./views/FinancialsDashboard'));
const FinancialsStatements = lazyRetry(() => import('./views/FinancialsStatements'));
const CostIntelligence = lazyRetry(() => import('./views/CostIntelligence'));
const FinancialsLedger = lazyRetry(() => import('./views/FinancialsLedger'));
const Checkout = lazyRetry(() => import('./views/Checkout'));

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

function renderView(viewId: ViewId, venture: ReturnType<typeof getVenture> & object, activeVenture: string | null) {
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
    case 'epics':
      return <EpicBoardView />;
    case 'suite-command-bridge':
      return <SuiteView suiteId="command-bridge" />;
    case 'suite-creative-studio':
      return <SuiteView suiteId="creative-studio" />;
    case 'suite-developer-ops':
      return <SuiteView suiteId="developer-ops" />;
    case 'suite-marketing-growth':
      return <SuiteView suiteId="marketing-growth" />;
    case 'suite-commerce-finance':
      return <SuiteView suiteId="commerce-finance" />;
    case 'suite-comms-hub':
      return <SuiteView suiteId="comms-hub" />;
    case 'suite-knowledge-research':
      return <SuiteView suiteId="knowledge-research" />;
    case 'suite-voice-studio':
      return <SuiteView suiteId="voice-studio" />;
    case 'suite-strategy-intelligence':
      return <SuiteView suiteId="strategy-intelligence" />;
    case 'suite-ops-infra':
      return <SuiteView suiteId="ops-infra" />;
    case 'suite-ventures-workspace':
      return <SuiteView suiteId="ventures-workspace" />;
    case 'suite-arcade-lab':
      return <SuiteView suiteId="arcade-lab" />;
    case 'crm':
      return <CRMView />;
    case 'capital':
      return <CapitalGlobalView />;
    case 'capital-venture':
      return <CapitalVentureView />;
    case 'capital-round-detail':
      return <CapitalRoundDetailView />;
    case 'capital-foundation':
      return <CapitalFoundationView />;
    case 'distributions':
      return <DistributionsView />;
    case 'invest-rounds':
      return <RoundBrowseView />;
    case 'agents':
      return <AgentsView />;
    case 'ladder':
      return <LadderView />;
    case 'agent-profile':
      return <AgentProfileView />;
    case 'agent-chat':
      return <AgentChatView />;
    case 'hit-squad':
      return <PersonaRegistryView />;
    case 'platform-api-keys':
      return <PlatformApiKeysView />;
    case 'prospects':
      return <ProspectsView />;
    case 'prospect-profile':
      return <ProspectProfileView />;
    case 'people':
      return <PeopleView />;
    case 'comms-hub':
      return <CommsHub />;
    case 'forge':
      return <ForgeView />;
    case 'docs':
      return <DocsHub />;
    case 'blog':
      return <BlogAdmin />;
    case 'venture-site':
      return <VentureSiteAdmin />;
    case 'announcements':
      return <AnnouncementsAdmin />;
    case 'taxonomy':
      return <TaxonomyAdmin />;
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
      return <VentureOperationsView />;
    case 'venture-docs':
      return <DocsHub />;
    case 'venture-forge':
      return <ForgeView />;
    case 'venture-tasks':
      return <TasksView />;
    case 'venture-epics':
      return <EpicBoardView />;
    case 'venture-integrations':
      return <VentureIntegrationsView />;
    case 'venture-profile':
      return <VentureProfile venture={venture} />;
    case 'venture-detail':
      return <VentureDetailView ventureId={activeVenture} />;
    case 'ventures-index':
      return <VenturesIndexView
        onSelect={(v) => { useNavigation.getState().switchToVenture(v.id); useNavigation.getState().setView('venture-detail'); }}
        onNew={() => useNavigation.getState().setView('venture-onboarding')}
      />;
    case 'venture-wizard':
      return <VentureWizardGamified />;
    case 'department-portfolio':
      return <DepartmentPortfolioView />;
    case 'venture-settings':
      return <VentureSettingsView />;
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
      return <CommerceInvoicesView />;
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
      return <CommerceCreditsView />;
    case 'commerce-loans':
      return <CommerceLoansView />;
    case 'commerce-tax':
      return <ComplianceHubView />;
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
      return <FinancialsReportingView />;
    case 'venture-financials':
      return <FinancialsDashboard />;
    // Creator views
    case 'creator-hub':
      return <CreatorHubView />;
    case 'creator-royalties':
      return <CreatorHubView />;
    case 'creator-escrow':
      return <CreatorHubView />;
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
    case 'contact-center':
      return <ContactCenterView />;
    case 'compliance-hub':
      return <ComplianceHubView />;
    case 'knowledge-hub':
      return <KnowledgeHubView />;
    case 'audit-log':
      return <AuditLogView />;
    default:
      return <AegisChat venture={venture} />;
  }
}

function ViewPanel({ viewId }: { viewId?: ViewId }) {
  const { activeView, activeVenture } = useNavigation();
  const venture = getVenture(activeVenture || 'mcv') ?? ventures[0];
  const currentView = viewId ?? activeView;
  const view = renderView(currentView, venture, activeVenture);
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
  'ventures-index': 'Ventures', 'venture-detail': 'Venture',
  'venture-wizard': 'Venture Wizard', 'department-portfolio': 'Departments',
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


// Public surface bypass — renders /p/:venture/... outside the authenticated
// app shell (no NavRail, no ChatDock, no settings). Keeps published pages
// SSR-friendly later, and prevents the heavy dashboard chrome from flashing
// on a visitor's first paint.
const PublicRoute = lazyRetry(() => import('./views/public/PublicRoute'));

export default function App() {
  // Public content bypass — check before any app shell mounts.
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/p/')) {
    return (
      <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>Loading…</div>}>
        <PublicRoute pathname={window.location.pathname} />
      </Suspense>
    );
  }

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const { chatDocked, toggleChatDock, setView, toggleSplit, mode, switchToGlobal, switchToVenture, goBack, goForward } = useNavigation();
  const { isOpen: paletteOpen, toggle: togglePalette, close: closePalette } = useCommandStore();
  const { sidebarCollapsed, statusBarVisible, presets } = useLayoutStore();
  useTheme();
  useMcpBootstrap();

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

  // Deep-link consumer for `?view=agent-profile&handle=@atlas` style URLs.
  // The onboarding wizard's agent avatars open these in a new tab so any
  // venture can hand off directly to a Desktop view.
  const openAgentProfile = useNavigation(s => s.openAgentProfile);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const handle = params.get('handle');
    if (view === 'agent-profile' && handle) {
      openAgentProfile(handle.startsWith('@') ? handle : `@${handle}`);
      // Clear so reloads don't re-apply the deep-link.
      params.delete('view');
      params.delete('handle');
      const next = params.toString();
      const url = window.location.pathname + (next ? `?${next}` : '') + window.location.hash;
      window.history.replaceState(null, '', url);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useLocalServer(); // Detect local server connection
  usePipelineSync(); // Auto-sync local data → Supabase every 5min
  useRealtimeSync(); // Supabase Realtime — live push updates across devices
  useCommsSync();    // Auto-ingest comms data → Knowledge Base, CRM, Tasks every 5min
  usePresence();     // Device detection + AI status inference + Supabase presence broadcast
  useInstanceRegistration(); // Register this window as a device + sync remote instances
  useDeviceEvents();        // SSE connection to local server for real-time device events
  useDeviceNotifications(); // Toast notifications for device connect/disconnect/error
  useDeviceProfileSync();   // Auto-activate device profiles on venture switch
  useGoogleNotifications(); // Gmail unread count + Calendar event reminders
  useProactiveIntelligence(); // Background monitoring: email age, meeting prep, overdue tasks
  useWhiteLabel(builtinVentures); // Apply per-venture brand tokens when on custom domains
  useClerkVentureSync();    // Flip Clerk active org to match activeVenture when venture has clerk_org_id
  useVentureFromClerk();    // Reverse: if Clerk active org changes externally, flip activeVenture to match
  const [presenceCardOpen, setPresenceCardOpen] = useState(false);
  const [contextSidebarOpen, setContextSidebarOpen] = useState(false);
  const [contextEntity, setContextEntity] = useState<{ type: string; id: string; name: string } | null>(null);

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
      // Cmd/Ctrl+, → open Settings (mac convention used everywhere)
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setView('settings');
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

      {/* Nav Rail (hidden on phone — bottom nav takes over) */}
      {!sidebarCollapsed && <NavRail />}
      <MobileBottomNav />

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
            <button
              className="header-icon-btn"
              onClick={() => {
                if (!contextSidebarOpen) {
                  // Auto-detect context from current view
                  const viewLabels: Record<string, string> = { gmail: 'Email', calendar: 'Schedule', drive: 'Documents', tasks: 'Tasks' };
                  setContextEntity({ type: 'view', id: navActiveView, name: viewLabels[navActiveView] || navActiveView });
                }
                setContextSidebarOpen(!contextSidebarOpen);
              }}
              title="Context Intelligence (Ctrl+I)"
              style={contextSidebarOpen ? { color: 'var(--purple)' } : undefined}
            >
              <Brain size={15} />
            </button>
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

          {/* Context Intelligence Sidebar */}
          {contextSidebarOpen && (
            <ContextSidebar
              entity={contextEntity}
              visible={contextSidebarOpen}
              onClose={() => setContextSidebarOpen(false)}
            />
          )}
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
