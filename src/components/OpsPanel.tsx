import { Server, Cpu, Wifi, Database, Shield, Zap } from 'lucide-react';

interface SystemMetric {
  label: string;
  value: string;
  status: 'ok' | 'warn' | 'error';
  icon: React.ReactNode;
}

const metrics: SystemMetric[] = [
  { label: 'API Gateway', value: 'Operational', status: 'ok', icon: <Server size={16} /> },
  { label: 'Claude API', value: 'Connected', status: 'ok', icon: <Cpu size={16} /> },
  { label: 'Gemini API', value: 'Standby', status: 'ok', icon: <Zap size={16} /> },
  { label: 'Supabase', value: 'Not configured', status: 'warn', icon: <Database size={16} /> },
  { label: 'Redpanda', value: 'Not configured', status: 'warn', icon: <Wifi size={16} /> },
  { label: 'Auth (Clerk)', value: 'Not configured', status: 'warn', icon: <Shield size={16} /> },
];

const ventures = [
  { name: 'MCV One', status: 'live', uptime: '99.9%' },
  { name: 'BetEdge AI', status: 'dev', uptime: '78% MVP' },
  { name: 'FutureState', status: 'dev', uptime: 'Alpha' },
  { name: 'WarForge', status: 'concept', uptime: 'Design' },
  { name: 'mcv.gg', status: 'concept', uptime: 'Planning' },
  { name: 'EdgeIQ Markets', status: 'dev', uptime: 'Beta' },
  { name: 'ARQ Labs', status: 'active', uptime: 'R&D' },
];

export default function OpsPanel() {
  return (
    <div className="ops-panel">
      <div className="ops-section">
        <h2 className="ops-section-title">System Status</h2>
        <div className="ops-grid">
          {metrics.map((m) => (
            <div key={m.label} className={`ops-card ${m.status}`}>
              <div className="ops-card-icon">{m.icon}</div>
              <div className="ops-card-info">
                <span className="ops-card-label">{m.label}</span>
                <span className="ops-card-value">{m.value}</span>
              </div>
              <div className={`ops-dot ${m.status}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="ops-section">
        <h2 className="ops-section-title">Venture Status</h2>
        <div className="ops-table">
          <div className="ops-table-header">
            <span>Venture</span>
            <span>Status</span>
            <span>Progress</span>
          </div>
          {ventures.map((v) => (
            <div key={v.name} className="ops-table-row">
              <span className="ops-table-name">{v.name}</span>
              <span className={`ops-badge ${v.status}`}>{v.status}</span>
              <span className="ops-table-uptime">{v.uptime}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .ops-panel {
          height: 100%;
          overflow-y: auto;
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
        }

        .ops-section-title {
          font-size: var(--text-lg);
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--space-md);
        }

        .ops-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: var(--space-sm);
        }

        .ops-card {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-md);
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
        }

        .ops-card-icon {
          color: var(--text-muted);
        }

        .ops-card-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .ops-card-label {
          font-size: var(--text-xs);
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ops-card-value {
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--text-primary);
        }

        .ops-dot {
          width: 8px;
          height: 8px;
          border-radius: var(--radius-full);
          flex-shrink: 0;
        }

        .ops-dot.ok { background: var(--success); box-shadow: 0 0 8px rgba(16, 185, 129, 0.4); }
        .ops-dot.warn { background: var(--warning); box-shadow: 0 0 8px rgba(245, 158, 11, 0.4); }
        .ops-dot.error { background: var(--error); box-shadow: 0 0 8px rgba(239, 68, 68, 0.4); }

        .ops-table {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .ops-table-header {
          display: grid;
          grid-template-columns: 1fr 100px 100px;
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-elevated);
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ops-table-row {
          display: grid;
          grid-template-columns: 1fr 100px 100px;
          padding: var(--space-sm) var(--space-md);
          border-top: 1px solid var(--border);
          align-items: center;
        }

        .ops-table-name {
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--text-primary);
        }

        .ops-badge {
          font-size: var(--text-xs);
          font-weight: 600;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          width: fit-content;
        }

        .ops-badge.live { background: rgba(16, 185, 129, 0.15); color: var(--success); }
        .ops-badge.dev { background: rgba(0, 245, 255, 0.1); color: var(--cyan); }
        .ops-badge.concept { background: rgba(139, 92, 246, 0.15); color: var(--purple); }
        .ops-badge.active { background: rgba(59, 130, 246, 0.15); color: #3B82F6; }

        .ops-table-uptime {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          font-family: var(--font-mono);
        }

        @media (max-width: 640px) {
          .ops-grid { grid-template-columns: 1fr; }
          .ops-table-header, .ops-table-row {
            grid-template-columns: 1fr 80px 80px;
          }
        }
      `}</style>
    </div>
  );
}
