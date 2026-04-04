import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { useNavigation } from '../stores/navigation';
import { useTheme } from '../stores/theme';
import { ventures } from '../lib/ventures';

const statusLabels: Record<string, string> = { active: 'ACTIVE', development: 'DEV', planned: 'PLANNED', concept: 'CONCEPT' };
const statusColors: Record<string, string> = { active: '#10B981', development: '#00F0FF', planned: '#8B5CF6', concept: '#6B7280' };
const typeGroups: Record<string, string[]> = {
  'Platform & Core': ['mcv', 'mcvdev', 'mcvtech'],
  'Fintech & Web3': ['futurestate', 'edgeiq'],
  'Gaming & Media': ['warforge', 'mcvgg'],
  'Analytics & R&D': ['betedge', 'arqlabs'],
};

export default function VentureMegaMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { mode, activeVenture, switchToGlobal, switchToVenture } = useNavigation();
  const { applyGlobalTheme, applyVentureTheme } = useTheme();

  const current = ventures.find(v => v.id === activeVenture);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleGlobal() { switchToGlobal(); applyGlobalTheme(); setOpen(false); }
  function handleVenture(slug: string) { switchToVenture(slug); applyVentureTheme(slug); setOpen(false); }

  return (
    <div className="vmm" ref={ref}>
      {/* Pill Buttons */}
      <div className="vmm-pills">
        <button className={`vmm-pill ${mode === 'global' ? 'active' : ''}`} onClick={handleGlobal}>
          <Globe size={12} />
          <span>Global</span>
        </button>
        <button
          className={`vmm-pill venture-pill ${mode === 'venture' ? 'active' : ''}`}
          onClick={() => setOpen(!open)}
          style={current ? { borderColor: `${current.color}40`, color: mode === 'venture' ? current.color : undefined } : undefined}
        >
          {current ? (
            <>
              <span className="vmm-pill-dot" style={{ background: current.color }} />
              <span>{current.name}</span>
            </>
          ) : (
            <span>Ventures</span>
          )}
          <ChevronDown size={12} className={`vmm-chevron ${open ? 'open' : ''}`} />
        </button>
      </div>

      {/* Mega Menu Dropdown */}
      {open && (
        <div className="vmm-dropdown">
          <div className="vmm-dropdown-header">
            <span className="vmm-dropdown-title">EdgeIQ Holdings — Venture Ecosystem</span>
            <span className="vmm-dropdown-count">{ventures.length} ventures</span>
          </div>

          <div className="vmm-groups">
            {Object.entries(typeGroups).map(([group, slugs]) => (
              <div key={group} className="vmm-group">
                <span className="vmm-group-label">{group}</span>
                <div className="vmm-group-cards">
                  {slugs.map(slug => {
                    const v = ventures.find(x => x.id === slug);
                    if (!v) return null;
                    const isActive = activeVenture === v.id;
                    return (
                      <button
                        key={v.id}
                        className={`vmm-card ${isActive ? 'active' : ''}`}
                        onClick={() => handleVenture(v.id)}
                      >
                        <div className="vmm-card-accent" style={{ background: v.color }} />
                        <div className="vmm-card-top">
                          <span className="vmm-card-icon" style={{ background: v.color }}>{v.icon}</span>
                          <div className="vmm-card-info">
                            <span className="vmm-card-name">{v.name}</span>
                            <span className="vmm-card-tagline">{v.tagline}</span>
                          </div>
                        </div>
                        <div className="vmm-card-bottom">
                          <span className="vmm-card-domain">{v.domain}</span>
                          <span className="vmm-card-status" style={{ color: statusColors[v.status] }}>{statusLabels[v.status]}</span>
                        </div>
                        {isActive && <span className="vmm-card-active-badge">Current</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="vmm-dropdown-footer">
            <button className="vmm-footer-btn" onClick={handleGlobal}>
              <Globe size={12} /> Back to Global View
            </button>
          </div>
        </div>
      )}

      <style>{`
        .vmm { position: relative; }

        .vmm-pills { display: flex; gap: 4px; }

        .vmm-pill {
          display: flex; align-items: center; gap: 5px;
          padding: 4px 12px; border-radius: var(--radius-full);
          font-size: 11px; font-weight: 500;
          background: var(--bg-card); border: 1px solid var(--border);
          color: var(--text-muted); transition: all 0.15s; white-space: nowrap;
        }
        .vmm-pill:hover { border-color: var(--border-active); color: var(--text-primary); }
        .vmm-pill.active { background: var(--bg-elevated); color: var(--cyan); border-color: rgba(0,240,255,0.2); }

        .vmm-pill-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        .vmm-chevron { transition: transform 0.2s; }
        .vmm-chevron.open { transform: rotate(180deg); }

        .vmm-dropdown {
          position: absolute; top: calc(100% + 8px); left: 0;
          width: 680px; max-height: 520px;
          background: var(--bg-surface); border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(0,240,255,0.03);
          z-index: 100; overflow: hidden;
          animation: megaIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes megaIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .vmm-dropdown-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 16px; border-bottom: 1px solid var(--border);
        }
        .vmm-dropdown-title { font-family: var(--font-display); font-size: 13px; font-weight: 600; color: var(--text-secondary); }
        .vmm-dropdown-count { font-size: 10px; font-family: var(--font-mono); color: var(--text-muted); }

        .vmm-groups { padding: 12px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; max-height: 400px; }

        .vmm-group-label { font-size: 9px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; padding: 0 4px 4px; display: block; }

        .vmm-group-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(195px, 1fr)); gap: 6px; }

        .vmm-card {
          position: relative; overflow: hidden;
          padding: 10px 12px; border-radius: var(--radius-md);
          background: rgba(11,17,33,0.8); backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.06);
          text-align: left; cursor: pointer; transition: all 0.15s;
          display: flex; flex-direction: column; gap: 6px;
        }
        .vmm-card:hover { border-color: rgba(255,255,255,0.12); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
        .vmm-card.active { border-color: rgba(0,240,255,0.2); background: var(--bg-elevated); }

        .vmm-card-accent { position: absolute; top: 0; left: 0; width: 3px; height: 100%; border-radius: 3px 0 0 3px; }

        .vmm-card-top { display: flex; align-items: center; gap: 8px; }
        .vmm-card-icon { width: 28px; height: 28px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; color: var(--bg-deep); flex-shrink: 0; }
        .vmm-card-info { min-width: 0; }
        .vmm-card-name { display: block; font-size: 12px; font-weight: 600; color: var(--text-primary); }
        .vmm-card-tagline { display: block; font-size: 9px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .vmm-card-bottom { display: flex; justify-content: space-between; align-items: center; }
        .vmm-card-domain { font-size: 9px; font-family: var(--font-mono); color: var(--text-muted); }
        .vmm-card-status { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

        .vmm-card-active-badge {
          position: absolute; top: 6px; right: 6px;
          font-size: 8px; font-weight: 600; color: var(--cyan);
          background: rgba(0,240,255,0.1); padding: 1px 6px; border-radius: var(--radius-full);
        }

        .vmm-dropdown-footer {
          padding: 8px 16px; border-top: 1px solid var(--border);
          display: flex; justify-content: center;
        }
        .vmm-footer-btn {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; color: var(--text-muted); padding: 4px 12px;
          border-radius: var(--radius-sm); transition: all 0.15s;
        }
        .vmm-footer-btn:hover { color: var(--cyan); background: var(--bg-card); }
      `}</style>
    </div>
  );
}
