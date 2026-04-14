import { useState } from 'react';
import {
  LayoutDashboard, MessageSquare, Sparkles, ShoppingBag, MoreHorizontal,
  Brain, FileText, Image, Mic, Video, CheckSquare, Users, Shield,
  HardDrive, Activity, Settings, Zap,
} from 'lucide-react';
import { useNavigation, type ViewId } from '../stores/navigation';
import { Sheet } from './ui';
import { cn } from '../lib/utils';

interface NavSlot {
  id: string;
  label: string;
  icon: React.ElementType;
  view?: ViewId;
  onTap?: () => void;
}

interface MoreItem {
  label: string;
  icon: React.ElementType;
  view: ViewId;
}

const MORE_ITEMS: MoreItem[] = [
  { label: 'NAOS Command', icon: Brain, view: 'naos-command' as ViewId },
  { label: 'Voice Studio', icon: Mic, view: 'voice-studio' as ViewId },
  { label: 'Video Studio', icon: Video, view: 'video-studio' as ViewId },
  { label: 'Creative Canvas', icon: Image, view: 'creative-canvas' as ViewId },
  { label: 'Tasks', icon: CheckSquare, view: 'tasks' as ViewId },
  { label: 'CRM', icon: Users, view: 'crm' as ViewId },
  { label: 'Docs', icon: FileText, view: 'docs' as ViewId },
  { label: 'Files', icon: HardDrive, view: 'files' as ViewId },
  { label: 'Signals', icon: Activity, view: 'signals' as ViewId },
  { label: 'Compliance', icon: Shield, view: 'compliance-hub' as ViewId },
  { label: 'Growth', icon: Zap, view: 'growth' as ViewId },
  { label: 'Settings', icon: Settings, view: 'settings' as ViewId },
];

export default function MobileBottomNav() {
  const currentView = useNavigation((s) => s.activeView);
  const setView = useNavigation((s) => s.setView);
  const [moreOpen, setMoreOpen] = useState(false);

  const slots: NavSlot[] = [
    { id: 'command', label: 'Command', icon: LayoutDashboard, view: 'command-center' as ViewId },
    { id: 'chat', label: 'Chat', icon: MessageSquare, view: 'chat' as ViewId },
    { id: 'create', label: 'Create', icon: Sparkles, view: 'ai-studio' as ViewId },
    { id: 'commerce', label: 'Commerce', icon: ShoppingBag, view: 'commerce' as ViewId },
    { id: 'more', label: 'More', icon: MoreHorizontal, onTap: () => setMoreOpen(true) },
  ];

  return (
    <>
      <nav className="mcv-bottom-nav" aria-label="Primary mobile navigation">
        {slots.map((slot) => {
          const Icon = slot.icon;
          const active = !!(slot.view && slot.view === currentView);
          return (
            <button
              key={slot.id}
              type="button"
              className={cn('mcv-bn-slot', active && 'mcv-bn-slot-active')}
              onClick={() => {
                if (slot.onTap) slot.onTap();
                else if (slot.view) setView(slot.view);
              }}
              aria-current={active ? 'page' : undefined}
              aria-label={slot.label}
            >
              <Icon size={18} />
              <span className="mcv-bn-label">{slot.label}</span>
            </button>
          );
        })}
      </nav>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="More" side="bottom" size="lg">
        <div className="mcv-bn-more-grid">
          {MORE_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.view === currentView;
            return (
              <button
                key={item.view}
                type="button"
                className={cn('mcv-bn-more-item', active && 'mcv-bn-more-item-active')}
                onClick={() => { setView(item.view); setMoreOpen(false); }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </Sheet>

      <style>{`
        .mcv-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: 60px;
          background: rgba(6, 13, 20, 0.95);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-top: 1px solid var(--border-active);
          z-index: var(--z-sticky);
          padding: 0 4px;
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
        .mcv-bn-slot {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          min-height: 44px;
          padding: 6px 4px;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          transition: color var(--transition-fast);
        }
        .mcv-bn-slot:hover { color: var(--text-primary); }
        .mcv-bn-slot-active {
          color: var(--cyan);
        }
        .mcv-bn-slot-active::before {
          content: "";
          position: absolute;
          top: 0;
          left: 20%;
          right: 20%;
          height: 2px;
          background: var(--cyan);
          border-radius: 0 0 2px 2px;
          box-shadow: 0 0 8px var(--cyan-glow);
        }
        .mcv-bn-slot { position: relative; }
        .mcv-bn-label { font-size: 10px; font-weight: 500; }

        .mcv-bn-more-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .mcv-bn-more-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 14px 8px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 11px;
          transition: all var(--transition-fast);
          min-height: 72px;
          justify-content: center;
        }
        .mcv-bn-more-item:hover { border-color: var(--border-active); color: var(--text-primary); }
        .mcv-bn-more-item-active {
          border-color: var(--cyan);
          color: var(--cyan);
          background: rgba(0, 240, 255, 0.08);
        }

        /* Show only on phone screen class */
        [data-screen-class="phone"] .mcv-bottom-nav {
          display: flex;
          align-items: stretch;
        }
        [data-screen-class="phone"] .app-content,
        [data-screen-class="phone"] .app-main-col {
          padding-bottom: 64px;
        }
      `}</style>
    </>
  );
}
