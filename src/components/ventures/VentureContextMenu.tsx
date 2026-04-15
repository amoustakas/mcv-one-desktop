import { useEffect, useRef, useState } from 'react';
import {
  Eye, Target, Package, Globe, Users, FileText, Settings as SettingsIcon,
  Activity, Wand2, FileStack,
} from 'lucide-react';
import { useNavigation } from '../../stores/navigation';
import type { Venture } from '../../lib/ventures';

interface Props {
  venture: Venture;
  x: number;
  y: number;
  onClose: () => void;
}

type TabId = 'overview' | 'quests' | 'assets' | 'domains' | 'socials' | 'team' | 'docs' | 'ops' | 'settings';

const TABS: Array<{ id: TabId; label: string; icon: typeof Eye }> = [
  { id: 'overview', label: 'Overview',     icon: Eye },
  { id: 'quests',   label: 'Quests',       icon: Target },
  { id: 'assets',   label: 'Assets',       icon: Package },
  { id: 'domains',  label: 'Domains',      icon: Globe },
  { id: 'team',     label: 'Team',         icon: Users },
  { id: 'docs',     label: 'Docs',         icon: FileText },
  { id: 'ops',      label: 'Operations',   icon: Activity },
  { id: 'settings', label: 'Settings',     icon: SettingsIcon },
];

export default function VentureContextMenu({ venture, x, y, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });
  const switchToVenture = useNavigation(s => s.switchToVenture);
  const openVentureDetailTab = useNavigation(s => s.openVentureDetailTab);
  const setView = useNavigation(s => s.setView);

  // Reposition so the menu never clips outside the viewport — measured once
  // after render. x/y come from the click; if the menu would extend past the
  // right/bottom edge we shift it left/up by the overflow.
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    let nx = x;
    let ny = y;
    const pad = 8;
    if (x + rect.width + pad > window.innerWidth) nx = window.innerWidth - rect.width - pad;
    if (y + rect.height + pad > window.innerHeight) ny = window.innerHeight - rect.height - pad;
    setPos({ x: nx, y: ny });
  }, [x, y]);

  // Close on outside click, Escape, or any scroll (menu anchors to initial
  // click position, so scrolling away would leave it stranded).
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const onScroll = () => onClose();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [onClose]);

  function jumpToTab(tab: TabId) {
    switchToVenture(venture.id);
    openVentureDetailTab(tab);
    onClose();
  }

  function openWizard() {
    switchToVenture(venture.id);
    setView('venture-wizard');
    onClose();
  }

  function openProfile() {
    switchToVenture(venture.id);
    setView('venture-profile');
    onClose();
  }

  return (
    <div
      ref={menuRef}
      className="vcm"
      role="menu"
      style={{ left: pos.x, top: pos.y }}
    >
      <div className="vcm-header">
        <span className="vcm-icon" style={{ background: venture.color }}>{venture.icon}</span>
        <div className="vcm-header-text">
          <div className="vcm-name">{venture.name}</div>
          <div className="vcm-id">{venture.id}</div>
        </div>
      </div>

      <div className="vcm-section">
        <div className="vcm-section-label">Jump to tab</div>
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} className="vcm-item" role="menuitem" onClick={() => jumpToTab(t.id)}>
              <Icon size={13} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="vcm-divider" />

      <div className="vcm-section">
        <button className="vcm-item" role="menuitem" onClick={openWizard}>
          <Wand2 size={13} />
          <span>Open Quest Wizard</span>
        </button>
        <button className="vcm-item" role="menuitem" onClick={openProfile}>
          <FileStack size={13} />
          <span>Profile & Assets</span>
        </button>
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .vcm { position: fixed; min-width: 220px; background: var(--bg-card); border: 1px solid var(--border-active); border-radius: var(--radius-md); box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5); z-index: var(--z-popover, 3500); padding: 4px; font-family: var(--font-body); animation: vcm-in 0.12s ease-out; }
  @keyframes vcm-in { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .vcm-header { display: flex; align-items: center; gap: 10px; padding: 10px 10px 8px; border-bottom: 1px solid var(--border); margin-bottom: 4px; }
  .vcm-icon { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); font-weight: 800; color: var(--bg-deep); font-size: 13px; font-family: var(--font-display); flex-shrink: 0; }
  .vcm-header-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .vcm-name { font-size: 13px; font-weight: 600; color: var(--text-primary); font-family: var(--font-display); }
  .vcm-id { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); }
  .vcm-section { display: flex; flex-direction: column; padding: 4px; }
  .vcm-section-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-family: var(--font-display); padding: 6px 8px 4px; }
  .vcm-item { display: flex; align-items: center; gap: 10px; padding: 7px 10px; background: transparent; border: none; color: var(--text-secondary); font-size: 12px; border-radius: var(--radius-sm); cursor: pointer; transition: all 0.1s; text-align: left; }
  .vcm-item:hover { background: var(--bg-hover); color: var(--text-primary); }
  .vcm-item svg { color: var(--cyan); flex-shrink: 0; }
  .vcm-divider { height: 1px; background: var(--border); margin: 4px 2px; }
`;
