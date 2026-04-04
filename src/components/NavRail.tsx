import { LayoutGrid, PieChart, Bot, Brain, Landmark, Activity, Wrench, Radio, Settings, Globe } from 'lucide-react';
import { useNavigation, type ViewId } from '../stores/navigation';
import { useTheme } from '../stores/theme';
import { ventures } from '../lib/ventures';

const ICONS: Record<string, React.ReactNode> = {
  LayoutGrid: <LayoutGrid size={18} />,
  PieChart: <PieChart size={18} />,
  Bot: <Bot size={18} />,
  Brain: <Brain size={18} />,
  Landmark: <Landmark size={18} />,
  Activity: <Activity size={18} />,
  Wrench: <Wrench size={18} />,
  Radio: <Radio size={18} />,
};

interface NavRailItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}

function NavRailItem({ icon, label, active, onClick, color }: NavRailItemProps) {
  return (
    <button
      className={`rail-item ${active ? 'active' : ''}`}
      onClick={onClick}
      title={label}
      style={active && color ? { color } : undefined}
    >
      {icon}
      <span className="rail-label">{label}</span>
    </button>
  );
}

const globalItems: { id: ViewId; label: string; icon: string }[] = [
  { id: 'command-center', label: 'Command', icon: 'LayoutGrid' },
  { id: 'portfolio', label: 'Portfolio', icon: 'PieChart' },
  { id: 'chat', label: 'NAOS', icon: 'Bot' },
  { id: 'intelligence', label: 'Intel', icon: 'Brain' },
  { id: 'treasury', label: 'Treasury', icon: 'Landmark' },
  { id: 'ops', label: 'Ops', icon: 'Activity' },
  { id: 'engineering', label: 'Eng', icon: 'Wrench' },
  { id: 'signals', label: 'Signals', icon: 'Radio' },
];

const ventureItems: { id: ViewId; label: string; icon: string }[] = [
  { id: 'venture-dashboard', label: 'Dash', icon: 'LayoutGrid' },
  { id: 'chat', label: 'NAOS', icon: 'Bot' },
  { id: 'venture-engineering', label: 'Eng', icon: 'Wrench' },
  { id: 'venture-growth', label: 'Growth', icon: 'Activity' },
  { id: 'venture-operations', label: 'Ops', icon: 'Radio' },
  { id: 'venture-docs', label: 'Docs', icon: 'Brain' },
];

export default function NavRail() {
  const { mode, activeView, activeVenture, setView, switchToGlobal, switchToVenture } = useNavigation();
  const { applyGlobalTheme, applyVentureTheme } = useTheme();

  const navItems = mode === 'global' ? globalItems : ventureItems;

  function handleGlobal() {
    switchToGlobal();
    applyGlobalTheme();
  }

  function handleVenture(slug: string) {
    switchToVenture(slug);
    applyVentureTheme(slug);
  }

  return (
    <nav className="nav-rail">
      {/* Context indicator */}
      <div className="rail-context">
        <button
          className={`rail-global ${mode === 'global' ? 'active' : ''}`}
          onClick={handleGlobal}
          title="Global View"
        >
          <Globe size={16} />
        </button>
      </div>

      {/* Main nav items */}
      <div className="rail-items">
        {navItems.map((item) => (
          <NavRailItem
            key={item.id}
            icon={ICONS[item.icon] || <Activity size={18} />}
            label={item.label}
            active={activeView === item.id}
            onClick={() => setView(item.id)}
          />
        ))}
      </div>

      {/* Venture switcher */}
      <div className="rail-ventures">
        <div className="rail-divider" />
        <span className="rail-ventures-label">Ventures</span>
        {ventures.map((v) => (
          <button
            key={v.id}
            className={`rail-venture ${activeVenture === v.id ? 'active' : ''}`}
            onClick={() => handleVenture(v.id)}
            title={v.name}
          >
            <span
              className="rail-venture-dot"
              style={{ background: v.color, boxShadow: activeVenture === v.id ? `0 0 8px ${v.color}` : 'none' }}
            />
            <span className="rail-venture-name">{v.name}</span>
          </button>
        ))}
      </div>

      {/* Settings at bottom */}
      <div className="rail-bottom">
        <NavRailItem
          icon={<Settings size={18} />}
          label="Settings"
          active={activeView === 'settings'}
          onClick={() => setView('settings')}
        />
      </div>

      <style>{`
        .nav-rail {
          width: 56px;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--bg-surface);
          border-right: 1px solid var(--border);
          flex-shrink: 0;
          overflow: hidden;
          transition: width 0.2s ease;
        }

        .nav-rail:hover {
          width: 160px;
        }

        .rail-context {
          padding: 8px;
          display: flex;
          justify-content: center;
        }

        .rail-global {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: all var(--transition-fast);
        }

        .rail-global:hover { background: var(--bg-card); color: var(--text-primary); }
        .rail-global.active { background: var(--bg-elevated); color: var(--cyan); }

        .rail-items {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 4px 8px;
          overflow-y: auto;
        }

        .rail-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          transition: all var(--transition-fast);
          white-space: nowrap;
          overflow: hidden;
          min-height: 36px;
        }

        .rail-item:hover { background: var(--bg-card); color: var(--text-primary); }
        .rail-item.active { background: var(--bg-elevated); color: var(--cyan); }

        .rail-label {
          font-size: 11px;
          font-weight: 500;
          opacity: 0;
          transition: opacity 0.15s ease;
        }

        .nav-rail:hover .rail-label { opacity: 1; }

        .rail-ventures {
          padding: 4px 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow-y: auto;
          max-height: 240px;
        }

        .rail-divider {
          height: 1px;
          background: var(--border);
          margin: 4px 0;
        }

        .rail-ventures-label {
          font-size: 9px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 4px 8px;
          opacity: 0;
          transition: opacity 0.15s ease;
        }

        .nav-rail:hover .rail-ventures-label { opacity: 1; }

        .rail-venture {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 8px;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
          overflow: hidden;
        }

        .rail-venture:hover { background: var(--bg-card); }
        .rail-venture.active { background: var(--bg-elevated); }

        .rail-venture-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
          transition: box-shadow var(--transition-fast);
        }

        .rail-venture-name {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-secondary);
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.15s ease;
        }

        .nav-rail:hover .rail-venture-name { opacity: 1; }
        .rail-venture.active .rail-venture-name { color: var(--text-primary); }

        .rail-bottom {
          padding: 4px 8px 8px;
          border-top: 1px solid var(--border);
        }
      `}</style>
    </nav>
  );
}
