import { useState } from 'react';
import {
  LayoutGrid, PieChart, Bot, Brain, Landmark, Activity,
  Wrench, Radio, Settings, Globe, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useNavigation, type ViewId } from '../stores/navigation';
import { useTheme } from '../stores/theme';
import { ventures } from '../lib/ventures';

const VIEW_ICONS: Record<string, React.FC<{ size: number }>> = {
  'command-center': LayoutGrid,
  'portfolio': PieChart,
  'chat': Bot,
  'intelligence': Brain,
  'treasury': Landmark,
  'ops': Activity,
  'engineering': Wrench,
  'signals': Radio,
  'settings': Settings,
  'venture-dashboard': LayoutGrid,
  'venture-engineering': Wrench,
  'venture-growth': Activity,
  'venture-operations': Radio,
  'venture-docs': Brain,
};

const globalItems: { id: ViewId; label: string }[] = [
  { id: 'command-center', label: 'Command' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'chat', label: 'NAOS' },
  { id: 'intelligence', label: 'Intelligence' },
  { id: 'treasury', label: 'Treasury' },
  { id: 'ops', label: 'Ops Center' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'signals', label: 'Signals' },
];

const ventureItems: { id: ViewId; label: string }[] = [
  { id: 'venture-dashboard', label: 'Dashboard' },
  { id: 'chat', label: 'NAOS' },
  { id: 'venture-engineering', label: 'Engineering' },
  { id: 'venture-growth', label: 'Growth' },
  { id: 'venture-operations', label: 'Operations' },
  { id: 'venture-docs', label: 'Documents' },
];

export default function NavRail() {
  const [expanded, setExpanded] = useState(() => window.innerWidth >= 1600);
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

  const w = expanded ? 200 : 56;

  return (
    <nav className="rail" style={{ width: w }}>
      {/* Global toggle */}
      <button className={`rail-btn ${mode === 'global' ? 'active' : ''}`} onClick={handleGlobal} title="Global">
        <Globe size={18} />
        {expanded && <span className="rail-text">Global</span>}
      </button>

      <div className="rail-sep" />

      {/* Nav items */}
      <div className="rail-nav">
        {navItems.map((item) => {
          const Icon = VIEW_ICONS[item.id] || Activity;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              className={`rail-btn ${isActive ? 'active' : ''}`}
              onClick={() => setView(item.id)}
              title={item.label}
            >
              <Icon size={17} />
              {expanded && <span className="rail-text">{item.label}</span>}
              {isActive && <span className="rail-indicator" />}
            </button>
          );
        })}
      </div>

      <div className="rail-sep" />

      {/* Ventures */}
      <div className="rail-ventures">
        {expanded && <span className="rail-section-label">Ventures</span>}
        {ventures.map((v) => {
          const isActive = activeVenture === v.id;
          return (
            <button
              key={v.id}
              className={`rail-venture ${isActive ? 'active' : ''}`}
              onClick={() => handleVenture(v.id)}
              title={v.name}
            >
              <span
                className="rail-dot"
                style={{
                  background: v.color,
                  boxShadow: isActive ? `0 0 8px ${v.color}, 0 0 2px ${v.color}` : 'none',
                  width: isActive ? 12 : 8,
                  height: isActive ? 12 : 8,
                }}
              />
              {expanded && <span className="rail-text" style={isActive ? { color: v.color } : undefined}>{v.name}</span>}
            </button>
          );
        })}
      </div>

      {/* Bottom: Settings + Expand toggle */}
      <div className="rail-bottom">
        <button className={`rail-btn ${activeView === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')} title="Settings">
          <Settings size={17} />
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
          background: var(--bg-surface);
          border-right: 1px solid var(--border);
          flex-shrink: 0;
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          user-select: none;
        }

        .rail-btn {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          color: var(--text-muted);
          transition: all 0.15s ease;
          white-space: nowrap;
          min-height: 38px;
        }

        .rail-btn:hover {
          color: var(--text-primary);
          background: var(--bg-card);
        }

        .rail-btn.active {
          color: var(--cyan);
        }

        .rail-indicator {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 20px;
          background: var(--cyan);
          border-radius: 0 3px 3px 0;
        }

        .rail-text {
          font-size: 12px;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .rail-sep {
          height: 1px;
          margin: 4px 12px;
          background: var(--border);
        }

        .rail-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1px;
          overflow-y: auto;
          padding: 2px 0;
        }

        .rail-ventures {
          display: flex;
          flex-direction: column;
          gap: 1px;
          padding: 2px 0;
          max-height: 280px;
          overflow-y: auto;
        }

        .rail-section-label {
          font-size: 9px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 4px 16px 2px;
        }

        .rail-venture {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 16px;
          transition: all 0.15s ease;
          white-space: nowrap;
          min-height: 32px;
        }

        .rail-venture:hover {
          background: var(--bg-card);
        }

        .rail-venture .rail-text {
          font-size: 11px;
          color: var(--text-secondary);
        }

        .rail-venture.active .rail-text {
          font-weight: 600;
        }

        .rail-dot {
          border-radius: 50%;
          flex-shrink: 0;
          transition: all 0.2s ease;
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
