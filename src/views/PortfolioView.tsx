import { PieChart, ExternalLink } from 'lucide-react';
import { useNavigation } from '../stores/navigation';
import { useTheme } from '../stores/theme';
import { ventures } from '../lib/ventures';

const statusOrder = { active: 0, development: 1, planned: 2, concept: 3 };
const statusLabels: Record<string, string> = { active: 'ACTIVE', development: 'DEV', planned: 'PLANNED', concept: 'CONCEPT' };
const statusColors: Record<string, string> = { active: '#10B981', development: '#00F0FF', planned: '#8B5CF6', concept: '#6B7280' };

const sorted = [...ventures].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

export default function PortfolioView() {
  const { switchToVenture } = useNavigation();
  const { applyVentureTheme } = useTheme();

  function enter(slug: string) {
    switchToVenture(slug);
    applyVentureTheme(slug);
  }

  return (
    <div className="port">
      <h1 className="port-title"><PieChart size={20} /> Venture Portfolio</h1>
      <p className="port-subtitle">EdgeIQ Holdings — 9 ventures across gaming, fintech, Web3, infrastructure, and R&D</p>

      <div className="port-grid">
        {sorted.map((v) => (
          <button key={v.id} className="port-card" onClick={() => enter(v.id)}>
            <div className="port-card-accent" style={{ background: `linear-gradient(90deg, transparent, ${v.color}50, transparent)` }} />
            <div className="port-card-header">
              <span className="port-card-icon" style={{ background: v.color }}>{v.icon}</span>
              <div className="port-card-titles">
                <span className="port-card-name">{v.name}</span>
                <span className="port-card-tagline">{v.tagline}</span>
              </div>
              <span className="port-card-status" style={{ color: statusColors[v.status] }}>
                {statusLabels[v.status]}
              </span>
            </div>
            <div className="port-card-meta">
              <span className="port-card-type">{v.type.replace(/_/g, ' ')}</span>
              <span className="port-card-domain">
                {v.domain}
                <ExternalLink size={9} />
              </span>
            </div>
            <div className="port-card-bottom">
              <span className="port-card-enter">Enter Venture &rarr;</span>
            </div>
          </button>
        ))}
      </div>

      <style>{`
        .port { height: 100%; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 20px; }
        .port-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .port-subtitle { font-size: 12px; color: var(--text-muted); margin-top: -12px; }

        .port-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; }

        .port-card {
          position: relative; overflow: hidden;
          padding: 16px; background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-md); text-align: left;
          display: flex; flex-direction: column; gap: 10px;
          transition: all 0.2s ease; cursor: pointer;
        }
        .port-card:hover { border-color: var(--border-active); transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,240,255,0.05); }

        .port-card-accent { position: absolute; top: 0; left: 0; right: 0; height: 2px; }

        .port-card-header { display: flex; align-items: center; gap: 10px; }
        .port-card-icon { width: 36px; height: 36px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; color: var(--bg-deep); flex-shrink: 0; }
        .port-card-titles { flex: 1; min-width: 0; }
        .port-card-name { display: block; font-size: 14px; font-weight: 600; }
        .port-card-tagline { display: block; font-size: 10px; color: var(--text-muted); }
        .port-card-status { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; }

        .port-card-meta { display: flex; justify-content: space-between; align-items: center; }
        .port-card-type { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.3px; }
        .port-card-domain { font-size: 10px; color: var(--text-secondary); font-family: var(--font-mono); display: flex; align-items: center; gap: 3px; }

        .port-card-bottom { border-top: 1px solid var(--border); padding-top: 8px; }
        .port-card-enter { font-size: 11px; font-weight: 500; color: var(--cyan); opacity: 0; transition: opacity 0.15s; }
        .port-card:hover .port-card-enter { opacity: 1; }
      `}</style>
    </div>
  );
}
