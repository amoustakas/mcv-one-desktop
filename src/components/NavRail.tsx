import { useState, useEffect } from 'react';
import {
  LayoutGrid, PieChart, Bot, Brain, Landmark, Activity,
  Wrench, Radio, Settings, ChevronLeft, ChevronRight, ChevronDown,
  CheckSquare, Users, Hammer, BookOpen, Monitor, Sparkles,
  Wand2, Swords, TrendingUp, FileText, Plus, Package,
  Database, GitBranch, Radar, MessageSquare, FolderOpen, Archive, Megaphone,
  Cpu, Grid3x3, AudioLines, MonitorSmartphone,
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
  'device-hub': Cpu,
  'stream-deck': Grid3x3,
  'audio-router': AudioLines,
  'connected-sessions': MonitorSmartphone,
  memory: Database,
  pipeline: GitBranch,
  settings: Settings,
  'venture-dashboard': LayoutGrid, 'venture-profile': FileText,
  'venture-engineering': Wrench, 'venture-growth': TrendingUp,
  'venture-operations': Activity, 'venture-docs': BookOpen,
  'venture-forge': Hammer, 'venture-tasks': CheckSquare,
  'venture-settings': Settings, 'venture-onboarding': Plus,
  files: FolderOpen, 'venture-workspace': Archive, 'ad-studio': Megaphone,
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
          background: linear-gradient(180deg, rgba(6, 12, 24, 0.99), rgba(4, 8, 18, 0.98));
          border-right: 1px solid rgba(0, 240, 255, 0.06);
          flex-shrink: 0;
          transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          user-select: none;
          position: relative;
          backdrop-filter: blur(16px);
        }
        /* Right edge glow — animated gradient */
        .rail::after {
          content: "";
          position: absolute;
          top: 0;
          right: 0;
          width: 1px;
          height: 100%;
          background: linear-gradient(
            180deg,
            rgba(0, 240, 255, 0.25) 0%,
            rgba(0, 240, 255, 0.08) 20%,
            transparent 40%,
            transparent 60%,
            rgba(139, 92, 246, 0.08) 80%,
            rgba(139, 92, 246, 0.2) 100%
          );
          pointer-events: none;
        }
        /* Scanline texture overlay */
        .rail::before {
          content: "";
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 240, 255, 0.008) 2px,
            rgba(0, 240, 255, 0.008) 4px
          );
          pointer-events: none;
          z-index: 0;
        }

        .rail-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 6px 0;
          position: relative;
          z-index: 1;
          scrollbar-width: thin;
          scrollbar-color: rgba(0,240,255,0.1) transparent;
        }
        .rail-nav::-webkit-scrollbar { width: 3px; }
        .rail-nav::-webkit-scrollbar-track { background: transparent; }
        .rail-nav::-webkit-scrollbar-thumb { background: rgba(0,240,255,0.15); border-radius: 3px; }

        .rail-section {
          display: flex;
          flex-direction: column;
        }

        .rail-section + .rail-section {
          margin-top: 4px;
          padding-top: 4px;
          position: relative;
        }
        .rail-section + .rail-section::before {
          content: "";
          position: absolute;
          top: 0;
          left: 16px;
          right: 16px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,240,255,0.1), transparent);
        }

        .rail-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 14px 4px;
          cursor: pointer;
          transition: color 0.15s;
          background: none;
          border: none;
        }
        .rail-section-header:hover { color: var(--text-secondary); }
        .rail-section-header:hover .rail-section-label { color: var(--cyan-dim); }

        .rail-section-label {
          font-size: 9px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1.5px;
          transition: color 0.15s;
        }

        .rail-section-chevron {
          color: var(--text-muted);
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
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
          border-radius: 0;
          background: none;
          border: none;
          cursor: pointer;
        }

        .rail-btn:hover {
          color: var(--text-primary);
          background: linear-gradient(90deg, rgba(0,240,255,0.04), transparent);
        }
        .rail-btn:hover::before {
          content: "";
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 2px;
          height: 12px;
          background: rgba(0,240,255,0.3);
          border-radius: 0 2px 2px 0;
        }

        .rail-btn.active {
          color: var(--cyan);
          background: linear-gradient(90deg, rgba(0,240,255,0.06), transparent);
          text-shadow: 0 0 10px rgba(0,240,255,0.2);
        }
        .rail-btn.split-active {
          color: var(--purple);
          background: linear-gradient(90deg, rgba(139,92,246,0.06), transparent);
          text-shadow: 0 0 10px rgba(139,92,246,0.2);
        }

        /* Active indicator — animated glow bar */
        .rail-indicator {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 20px;
          background: var(--cyan);
          border-radius: 0 3px 3px 0;
          box-shadow:
            0 0 6px rgba(0, 240, 255, 0.6),
            0 0 16px rgba(0, 240, 255, 0.25),
            0 0 30px rgba(0, 240, 255, 0.1);
          animation: rail-glow 2s ease-in-out infinite;
        }
        @keyframes rail-glow {
          0%, 100% { box-shadow: 0 0 6px rgba(0,240,255,0.6), 0 0 16px rgba(0,240,255,0.25); }
          50% { box-shadow: 0 0 8px rgba(0,240,255,0.8), 0 0 24px rgba(0,240,255,0.35), 0 0 40px rgba(0,240,255,0.12); }
        }

        .rail-text {
          font-size: 12px;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          letter-spacing: 0.1px;
        }

        .rail-badge {
          font-size: 8px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: var(--radius-full);
          background: rgba(0,240,255,0.08);
          color: var(--cyan);
          text-transform: uppercase;
          letter-spacing: 0.3px;
          border: 1px solid rgba(0,240,255,0.15);
        }

        .rail-bottom {
          border-top: 1px solid rgba(0,240,255,0.06);
          padding: 6px 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
          position: relative;
          z-index: 1;
        }
        .rail-bottom::before {
          content: "";
          position: absolute;
          top: 0;
          left: 16px;
          right: 16px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,240,255,0.12), transparent);
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
          background: none;
          border: none;
          cursor: pointer;
        }

        .rail-toggle:hover {
          background: rgba(0,240,255,0.04);
          color: var(--cyan);
        }
      `}</style>
    </nav>
  );
}
