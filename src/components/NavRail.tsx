import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '../stores/workspace';
import {
  Settings, ChevronLeft, ChevronRight, ChevronDown,
} from 'lucide-react';
import { useNavigation, type ViewId } from '../stores/navigation';
import { useVentureContextStore } from '../stores/venture-context';
import { ventures } from '../lib/ventures';
import { cn } from '../lib/utils';
import { getViewIcon } from '../lib/view-meta';

// Icons now sourced from shared view-meta.ts

// ── Section definitions ──
interface NavSection { label: string; key: string; items: { id: ViewId; label: string; badge?: string }[] }

const globalSections: NavSection[] = [
  {
    label: 'Command', key: 'command',
    items: [
      { id: 'command-center', label: 'Command Center' },
      { id: 'naos-command', label: 'NAOS Command' },
      { id: 'portfolio', label: 'Portfolio' },
      { id: 'chat', label: 'Aegis AI' },
    ],
  },
  {
    label: 'Intelligence', key: 'intel',
    items: [
      { id: 'intelligence', label: 'Knowledge Base' },
      { id: 'treasury', label: 'Treasury' },
      { id: 'signals', label: 'Signals Feed' },
      { id: 'memory', label: 'Memory Hub' },
    ],
  },
  {
    label: 'Engineering', key: 'eng',
    items: [
      { id: 'engineering', label: 'CTO Dashboard' },
      { id: 'ops', label: 'Ops Center' },
      { id: 'forge', label: 'The Forge' },
      { id: 'sessions', label: 'Sessions' },
      { id: 'war-room', label: 'War Room' },
    ],
  },
  {
    label: 'Devices', key: 'devices',
    items: [
      { id: 'device-hub', label: 'Device Hub' },
      { id: 'stream-deck', label: 'Stream Deck' },
      { id: 'audio-router', label: 'Audio Router' },
      { id: 'connected-sessions', label: 'Sessions' },
    ],
  },
  {
    label: 'Growth & CRM', key: 'growth',
    items: [
      { id: 'crm', label: 'CRM Pipeline' },
      { id: 'growth', label: 'Growth Studio' },
      { id: 'comms-hub', label: 'Comms Hub' },
      { id: 'contact-center', label: 'Contact Center' },
      { id: 'ad-studio', label: 'Ad Studio' },
    ],
  },
  {
    label: 'Operations', key: 'ops-section',
    items: [
      { id: 'tasks', label: 'Task Board' },
      { id: 'docs', label: 'Docs Hub' },
      { id: 'files', label: 'Files' },
      { id: 'team', label: 'Team' },
      { id: 'pipeline', label: 'Pipeline' },
    ],
  },
  {
    label: 'Google Workspace', key: 'google',
    items: [
      { id: 'gmail', label: 'Gmail' },
      { id: 'calendar', label: 'Calendar' },
      { id: 'drive', label: 'Drive' },
      { id: 'sheets', label: 'Sheets' },
      { id: 'google-docs', label: 'Docs' },
      { id: 'google-tasks', label: 'Tasks' },
    ],
  },
  {
    label: 'AI Tools', key: 'tools',
    items: [
      { id: 'ai-studio', label: 'AI Studio' },
      { id: 'prompt-composer', label: 'Prompt Composer' },
      { id: 'kit-store', label: 'Kit Store' },
      { id: 'control-room', label: 'Control Room' },
      { id: 'browser', label: 'Browser' },
      { id: 'youtube-player', label: 'YouTube' },
    ],
  },
  {
    label: 'Commerce', key: 'commerce',
    items: [
      { id: 'commerce-overview', label: 'Overview' },
      { id: 'commerce-products', label: 'Products' },
      { id: 'commerce-orders', label: 'Orders' },
      { id: 'commerce-customers', label: 'Customers' },
      { id: 'commerce-subscriptions', label: 'Subscriptions' },
      { id: 'commerce-inventory', label: 'Inventory' },
      { id: 'commerce-fulfillment', label: 'Fulfillment' },
      { id: 'commerce-invoices', label: 'Invoices' },
      { id: 'commerce-discounts', label: 'Discounts' },
      { id: 'commerce-reviews', label: 'Reviews' },
      { id: 'commerce-gift-cards', label: 'Gift Cards' },
      { id: 'commerce-analytics', label: 'Analytics' },
      { id: 'commerce-tax', label: 'Tax' },
      { id: 'commerce-credits', label: 'Credits & Wallets' },
      { id: 'commerce-loans', label: 'Loans' },
      { id: 'commerce-shop-settings', label: 'Shop Settings' },
      { id: 'compliance-hub', label: 'Compliance' },
      { id: 'creator-hub', label: 'Creator Hub' },
    ],
  },
  {
    label: 'Financials', key: 'financials',
    items: [
      { id: 'financials-dashboard', label: 'Dashboard' },
      { id: 'financials-statements', label: 'Statements' },
      { id: 'financials-cost-intelligence', label: 'Cost Intelligence' },
      { id: 'financials-ledger', label: 'Ledger' },
      { id: 'financials-reporting', label: 'Reporting' },
    ],
  },
];

const ventureSections: NavSection[] = [
  {
    label: 'Venture', key: 'venture-core',
    items: [
      { id: 'venture-dashboard', label: 'Dashboard' },
      { id: 'venture-profile', label: 'Profile & Assets' },
      { id: 'chat', label: 'Aegis AI' },
    ],
  },
  {
    label: 'Build', key: 'venture-build',
    items: [
      { id: 'venture-engineering', label: 'Engineering' },
      { id: 'venture-forge', label: 'The Forge' },
      { id: 'venture-docs', label: 'Documents' },
      { id: 'venture-workspace', label: 'Workspace' },
    ],
  },
  {
    label: 'Grow', key: 'venture-grow',
    items: [
      { id: 'venture-growth', label: 'Growth' },
      { id: 'venture-tasks', label: 'Tasks' },
      { id: 'venture-operations', label: 'Operations' },
    ],
  },
];

export default function NavRail() {
  const [expanded, setExpanded] = useState(() => window.innerWidth >= 1600);
  const { mode, activeView, activeVenture, setView } = useNavigation();
  const splitPanelWith = useWorkspaceStore(s => s.splitPanelWith);
  const wsLayout = useWorkspaceStore(s => s.layout);
  const activePanelId = useWorkspaceStore(s => s.activePanelId);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const setActiveVenture = useVentureContextStore((s) => s.setActiveVenture);

  // Sync active venture from navigation store into venture context store
  useEffect(() => {
    if (activeVenture) {
      const v = ventures.find((ven) => ven.id === activeVenture);
      if (v) {
        setActiveVenture({
          id: v.id,
          name: v.name,
          color: v.color,
          status: v.status === 'development' ? 'building' : v.status === 'planned' ? 'paused' : v.status === 'concept' ? 'archived' : 'active',
          health: null,
          featureFlags: {},
          teamCount: v.team.length,
          lastActivity: null,
        });
      }
    } else {
      setActiveVenture(null);
    }
  }, [activeVenture, setActiveVenture]);

  const sections = mode === 'global' ? globalSections : ventureSections;
  const w = expanded ? 220 : 56;

  function toggleSection(key: string) {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <nav className="rail" style={{ width: w }}>
      <div className="rail-nav">
        {sections.map((section) => {
          const isCollapsed = collapsed[section.key] && expanded;
          return (
            <div key={section.key} className="rail-section">
              {expanded && (
                <button className="rail-section-header" onClick={() => toggleSection(section.key)}>
                  <span className="rail-section-label">{section.label}</span>
                  <ChevronDown size={11} className={cn('rail-section-chevron', isCollapsed && 'collapsed')} />
                </button>
              )}
              {!isCollapsed && section.items.map((item) => {
                const Icon = getViewIcon(item.id);
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    className={cn('rail-btn', isActive && 'active', false && 'split-active')}
                    onClick={() => setView(item.id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      // Right-click: split the active panel with this view
                      function getFirstPanelId(node: any): string | null {
                        if (node.type === 'view') return node.id;
                        return getFirstPanelId(node.children[0]);
                      }
                      const targetPanel = activePanelId || getFirstPanelId(wsLayout);
                      if (targetPanel) splitPanelWith(targetPanel, 'horizontal', item.id);
                    }}
                    title={`${item.label} (right-click: open in new panel)`}
                  >
                    <Icon size={16} />
                    {expanded && (
                      <>
                        <span className="rail-text">{item.label}</span>
                        {item.badge && <span className="rail-badge">{item.badge}</span>}
                      </>
                    )}
                    {isActive && <span className="rail-indicator" />}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Bottom: Settings + Expand toggle */}
      <div className="rail-bottom">
        <button className={cn('rail-btn', activeView === 'settings' && 'active')} onClick={() => setView('settings')} title="Settings">
          <Settings size={16} />
          {expanded && <span className="rail-text">Settings</span>}
        </button>
        <button className="rail-toggle" onClick={() => setExpanded((e) => !e)} title={expanded ? 'Collapse' : 'Expand'}>
          {expanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* NavRail CSS extracted to src/styles/shell.css */}
    </nav>
  );
}
