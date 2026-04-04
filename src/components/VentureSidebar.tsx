import { ventures, type Venture } from '../lib/ventures';

interface VentureSidebarProps {
  activeVenture: string;
  onSelect: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export default function VentureSidebar({
  activeVenture,
  onSelect,
  collapsed,
  onToggle,
}: VentureSidebarProps) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && <span className="sidebar-title">Ventures</span>}
        <button className="sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
          {collapsed ? '>' : '<'}
        </button>
      </div>

      <nav className="venture-list">
        {ventures.map((v: Venture) => (
          <button
            key={v.id}
            className={`venture-item ${activeVenture === v.id ? 'active' : ''}`}
            onClick={() => onSelect(v.id)}
            title={v.name}
          >
            <span className="venture-icon" style={{ background: v.color }}>
              {v.icon}
            </span>
            {!collapsed && (
              <div className="venture-info">
                <span className="venture-name">{v.name}</span>
                <span className="venture-tagline">{v.tagline}</span>
              </div>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && (
          <div className="edge-badge">
            <span className="edge-token">EDGE</span>
            <span className="edge-price">$0.025</span>
          </div>
        )}
      </div>

      <style>{`
        .sidebar {
          width: var(--sidebar-width);
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--bg-surface);
          border-right: 1px solid var(--border);
          transition: width var(--transition-base);
          flex-shrink: 0;
          overflow: hidden;
        }

        .sidebar.collapsed {
          width: 60px;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-md);
          border-bottom: 1px solid var(--border);
          min-height: 52px;
        }

        .sidebar-title {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .sidebar-toggle {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          font-size: var(--text-sm);
          font-family: var(--font-mono);
          transition: all var(--transition-fast);
        }

        .sidebar-toggle:hover {
          color: var(--text-primary);
          background: var(--bg-card);
        }

        .venture-list {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-sm);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .venture-item {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
          text-align: left;
          width: 100%;
        }

        .venture-item:hover {
          background: var(--bg-card);
        }

        .venture-item.active {
          background: var(--bg-elevated);
          border: 1px solid var(--border-active);
        }

        .venture-icon {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: var(--text-sm);
          color: var(--bg-deep);
          flex-shrink: 0;
        }

        .venture-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .venture-name {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .venture-tagline {
          font-size: var(--text-xs);
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-footer {
          padding: var(--space-md);
          border-top: 1px solid var(--border);
        }

        .edge-badge {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-card);
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
        }

        .edge-token {
          font-size: var(--text-xs);
          font-weight: 700;
          color: var(--purple);
          letter-spacing: 1px;
        }

        .edge-price {
          font-size: var(--text-xs);
          font-family: var(--font-mono);
          color: var(--success);
        }

        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            z-index: 50;
            height: 100vh;
          }

          .sidebar.collapsed {
            width: 0;
            border: none;
          }
        }
      `}</style>
    </aside>
  );
}
