import { useState, useEffect } from 'react';
import {
  LayoutGrid, PieChart, Bot, Brain, Landmark, Activity,
  Wrench, Radio, Settings, ChevronLeft, ChevronRight, ChevronDown,
  CheckSquare, Users, Hammer, BookOpen, Monitor, Sparkles,
  Wand2, Swords, TrendingUp, FileText, Plus, Package,
  Database, GitBranch, Radar, MessageSquare, FolderOpen, Archive,
} from 'lucide-react';
import { useNavigation, type ViewId } from '../stores/navigation';
import { useVentureContextStore } from '../stores/venture-context';
import { ventures } from '../lib/ventures';
import { cn } from '../lib/utils';

// ── Icon map ──
const VIEW_ICONS: Record<string, React.FC<{ size: number }>> = {
  'command-center': LayoutGrid, portfolio: PieChart, chat: Bot,
  intelligence: Brain, treasury: Landmark, signals: Radio,
  engineering: Wrench, ops: Activity, forge: Hammer, sessions: Monitor, 'war-room': Swords,
  crm: Users, growth: TrendingUp, 'comms-hub': MessageSquare,
  tasks: CheckSquare, docs: BookOpen,
  team: Users,
  'ai-studio': Sparkles, 'prompt-composer': Wand2,
  'kit-store': Package,
  'control-room': Radar,
  memory: Database,
  pipeline: GitBranch,
  settings: Settings,
  'venture-dashboard': LayoutGrid, 'venture-profile': FileText,
  'venture-engineering': Wrench, 'venture-growth': TrendingUp,
  'venture-operations': Activity, 'venture-docs': BookOpen,
  'venture-forge': Hammer, 'venture-tasks': CheckSquare,
  'venture-settings': Settings, 'venture-onboarding': Plus,
  files: FolderOpen, 'venture-workspace': Archive,
};

// ── Section definitions ──
interface NavSection { label: string; key: string; items: { id: ViewId; label: string; badge?: string }[] }

const globalSections: NavSection[] = [
  {
    label: 'Command', key: 'command',
    items: [
      { id: 'command-center', label: 'Command Center' },
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
    label: 'Growth & CRM', key: 'growth',
    items: [
      { id: 'crm', label: 'CRM Pipeline' },
      { id: 'growth', label: 'Growth Studio' },
      { id: 'comms-hub', label: 'Comms Hub' },
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
    label: 'AI Tools', key: 'tools',
    items: [
      { id: 'ai-studio', label: 'AI Studio' },
      { id: 'prompt-composer', label: 'Prompt Composer' },
      { id: 'kit-store', label: 'Kit Store' },
      { id: 'control-room', label: 'Control Room' },
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
  const { mode, activeView, activeVenture, setView, openSplit, splitView } = useNavigation();
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
                const Icon = VIEW_ICONS[item.id] || Activity;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    className={cn('rail-btn', isActive && 'active', splitView === item.id && 'split-active')}
                    onClick={() => setView(item.id)}
                    onContextMenu={(e) => { e.preventDefault(); openSplit(item.id); }}
                    title={`${item.label} (right-click: open in split)`}
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

      <style>{`
        .rail {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: linear-gradient(180deg, rgba(11, 17, 33, 0.98), rgba(8, 14, 28, 0.95));
          border-right: 1px solid var(--border);
          flex-shrink: 0;
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          user-select: none;
          position: relative;
        }
        .rail::after {
          content: "";
          position: absolute;
          top: 0;
          right: 0;
          width: 1px;
          height: 100%;
          background: linear-gradient(180deg, rgba(0, 240, 255, 0.12), transparent 30%, transparent 70%, rgba(139, 92, 246, 0.08));
          pointer-events: none;
        }

        .rail-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 4px 0;
        }

        .rail-section {
          display: flex;
          flex-direction: column;
        }

        .rail-section + .rail-section {
          margin-top: 2px;
          padding-top: 2px;
          border-top: 1px solid var(--border);
        }

        .rail-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 14px 3px;
          cursor: pointer;
          transition: color 0.15s;
        }
        .rail-section-header:hover { color: var(--text-secondary); }

        .rail-section-label {
          font-size: 9px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1.2px;
        }

        .rail-section-chevron {
          color: var(--text-muted);
          transition: transform 0.2s;
        }
        .rail-section-chevron.collapsed {
          transform: rotate(-90deg);
        }

        .rail-btn {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 16px;
          color: var(--text-muted);
          transition: all 0.15s ease;
          white-space: nowrap;
          min-height: 34px;
          font-size: 12px;
        }

        .rail-btn:hover {
          color: var(--text-primary);
          background: var(--bg-card);
        }

        .rail-btn.active {
          color: var(--cyan);
        }
        .rail-btn.split-active {
          color: var(--purple);
          background: rgba(139,92,246,0.06);
        }

        .rail-indicator {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 18px;
          background: var(--cyan);
          border-radius: 0 3px 3px 0;
          box-shadow: 0 0 8px rgba(0, 240, 255, 0.5), 0 0 20px rgba(0, 240, 255, 0.15);
        }

        .rail-text {
          font-size: 12px;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }

        .rail-badge {
          font-size: 8px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: var(--radius-full);
          background: rgba(0,240,255,0.1);
          color: var(--cyan);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .rail-bottom {
          border-top: 1px solid var(--border);
          padding: 4px 0;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .rail-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          margin: 0 8px;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          transition: all 0.15s ease;
        }

        .rail-toggle:hover {
          background: var(--bg-card);
          color: var(--text-primary);
        }
      `}</style>
    </nav>
  );
}
