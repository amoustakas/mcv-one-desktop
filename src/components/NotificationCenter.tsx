import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, Zap, GitBranch, Cloud, Users, FileText, MessageSquare, Wrench, ArrowUpRight, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNotificationStore, routeNotification } from '../stores/notifications';
import type { AppNotification } from '../stores/notifications';
import { GlassCard, Button, Badge, Tooltip } from './ui';
import { cn, timeAgo } from '../lib/utils';
import { useNavigation, type ViewId } from '../stores/navigation';

// Map a notification source string to the most relevant view to open.
// Sources are open-set (kits and integrations contribute their own), so
// fall back to a no-op rather than crashing on unknown values.
const SOURCE_VIEW_MAP: Record<string, ViewId> = {
  github: 'engineering' as ViewId,
  vercel: 'engineering' as ViewId,
  crm: 'crm' as ViewId,
  docs: 'docs' as ViewId,
  chat: 'chat' as ViewId,
  kit: 'kit-store' as ViewId,
  system: 'command-center' as ViewId,
  commerce: 'commerce' as ViewId,
  compliance: 'compliance-hub' as ViewId,
  comms: 'comms-hub' as ViewId,
  naos: 'naos-command' as ViewId,
};

interface SupabaseNotification {
  id: string; type: string; title: string; description: string;
  source: string; read: boolean; venture_id: string; created_at: string;
}

const SOURCE_ICONS: Record<string, typeof Bell> = {
  system: Zap, github: GitBranch, vercel: Cloud, crm: Users, docs: FileText, chat: MessageSquare, kit: Wrench,
};
const TYPE_COLORS: Record<string, string> = {
  info: '#00F0FF', success: '#10B981', warning: '#F59E0B', error: '#EF4444',
};

function mapToStore(row: SupabaseNotification): AppNotification {
  return {
    id: row.id,
    type: row.type as AppNotification['type'],
    title: row.title,
    description: row.description,
    source: row.source,
    ventureId: row.venture_id,
    read: row.read,
    createdAt: row.created_at,
  };
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const setView = useNavigation((s) => s.setView);

  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setStoreNotifications = useNotificationStore((s) => s.setNotifications);
  const storeMarkRead = useNotificationStore((s) => s.markRead);
  const storeMarkAllRead = useNotificationStore((s) => s.markAllRead);
  const storeClearRead = useNotificationStore((s) => s.clearRead);

  const navigateForNotification = (n: AppNotification) => {
    const view = SOURCE_VIEW_MAP[n.source];
    if (!view) return;
    if (!n.read) markRead(n.id);
    setView(view);
    setOpen(false);
  };

  useEffect(() => {
    loadNotifications();
    const id = setInterval(loadNotifications, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  async function loadNotifications() {
    if (!supabase) return;
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(30);
    if (data) setStoreNotifications((data as SupabaseNotification[]).map(mapToStore));
  }

  async function markRead(id: string) {
    if (!supabase) return;
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    storeMarkRead(id);
  }

  async function markAllRead() {
    if (!supabase) return;
    await supabase.from('notifications').update({ read: true }).eq('read', false);
    storeMarkAllRead();
  }

  async function clearAll() {
    if (!supabase) return;
    await supabase.from('notifications').delete().eq('read', true);
    storeClearRead();
  }

  return (
    <div className="nc" ref={ref}>
      <button className="nc-bell" onClick={() => setOpen(!open)} title="Notifications">
        <Bell size={15} />
        {unreadCount > 0 && <Badge color="var(--error)" size="sm" className="nc-badge">{unreadCount > 9 ? '9+' : unreadCount}</Badge>}
      </button>

      {open && (
        <GlassCard variant="neural" className="nc-dropdown">
          <div className="nc-header">
            <span className="nc-title">Notifications</span>
            <div className="nc-actions">
              {unreadCount > 0 && <Button variant="ghost" size="sm" className="nc-action" onClick={markAllRead} icon={<Check size={11} />}>Mark all read</Button>}
              <Button variant="ghost" size="sm" className="nc-action" onClick={clearAll} icon={<Trash2 size={11} />}>Clear read</Button>
            </div>
          </div>

          <div className="nc-filter-bar">
            <button
              type="button"
              className={cn('nc-filter-pill', !showUnreadOnly && 'active')}
              onClick={() => setShowUnreadOnly(false)}
            >
              All
            </button>
            <button
              type="button"
              className={cn('nc-filter-pill', showUnreadOnly && 'active')}
              onClick={() => setShowUnreadOnly(true)}
            >
              <Filter size={9} /> Unread {unreadCount > 0 && <span className="nc-filter-count">{unreadCount}</span>}
            </button>
          </div>
          <div className="nc-list">
            {(() => {
              const visible = notifications
                .filter((n) => routeNotification(n) !== 'queue')
                .filter((n) => (showUnreadOnly ? !n.read : true));
              if (visible.length === 0) {
                return <div className="nc-empty">{showUnreadOnly ? 'All caught up' : 'No notifications'}</div>;
              }
              return visible.map((n) => {
                const Icon = SOURCE_ICONS[n.source] || Bell;
                const color = TYPE_COLORS[n.type] || '#6B7280';
                const canJump = !!SOURCE_VIEW_MAP[n.source];
                return (
                  <div
                    key={n.id}
                    className={cn('nc-item', n.read ? 'read' : 'unread', canJump && 'nc-item-jumpable')}
                    onClick={() => {
                      if (canJump) navigateForNotification(n);
                      else if (!n.read) markRead(n.id);
                    }}
                    role={canJump ? 'button' : undefined}
                    tabIndex={canJump ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (canJump && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        navigateForNotification(n);
                      }
                    }}
                  >
                    <div className="nc-item-icon" style={{ background: `${color}15`, color }}>
                      <Icon size={12} />
                    </div>
                    <div className="nc-item-content">
                      <span className="nc-item-title">
                        {n.title}
                        {canJump && (
                          <Tooltip content={`Open ${n.source}`}>
                            <ArrowUpRight size={10} className="nc-jump-icon" />
                          </Tooltip>
                        )}
                      </span>
                      {n.description && <span className="nc-item-desc">{n.description}</span>}
                      <span className="nc-item-meta">
                        <span className="nc-item-source">{n.source}</span>
                        <span className="nc-item-time">{timeAgo(n.createdAt)}</span>
                      </span>
                    </div>
                    {!n.read && <span className="nc-unread-dot" />}
                  </div>
                );
              });
            })()}
          </div>
        </GlassCard>
      )}

      <style>{`
        .nc { position:relative; }

        .nc-bell { width:32px; height:32px; display:flex; align-items:center; justify-content:center; border-radius:var(--radius-sm); color:var(--text-muted); transition:all 0.15s; position:relative; }
        .nc-bell:hover { background:var(--bg-card); color:var(--text-primary); }

        .nc-badge { position:absolute; top:2px; right:2px; min-width:14px; height:14px; font-size:8px; font-weight:700; background:var(--error); color:white; border-radius:var(--radius-full); display:flex; align-items:center; justify-content:center; padding:0 3px; line-height:1; }

        .nc-dropdown {
          position:absolute; top:calc(100% + 8px); right:0;
          width:380px; max-height:500px;
          border-radius:var(--radius-lg);
          box-shadow:0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(0,240,255,0.03);
          z-index:200; overflow:hidden;
          animation:ncIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes ncIn { from { opacity:0; transform:translateY(-6px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }

        .nc-header { display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-bottom:1px solid var(--border); }
        .nc-title { font-family:var(--font-display); font-size:13px; font-weight:600; }
        .nc-actions { display:flex; gap:8px; }
        .nc-action { font-size:10px; color:var(--text-muted); display:flex; align-items:center; gap:3px; }
        .nc-action:hover { color:var(--cyan); }

        .nc-list { max-height:420px; overflow-y:auto; }
        .nc-empty { padding:32px; text-align:center; font-size:12px; color:var(--text-muted); }

        .nc-item { display:flex; align-items:flex-start; gap:10px; padding:10px 16px; border-bottom:1px solid var(--border); cursor:pointer; transition:background 0.1s; }
        .nc-item:hover { background:var(--bg-elevated); }
        .nc-item.read { opacity:0.6; }
        .nc-item.unread { background:rgba(0,240,255,0.02); }

        .nc-item-icon { width:28px; height:28px; border-radius:var(--radius-sm); display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        .nc-item-content { flex:1; min-width:0; }
        .nc-item-title { display:block; font-size:12px; font-weight:500; }
        .nc-item-desc { display:block; font-size:10px; color:var(--text-muted); margin-top:2px; }
        .nc-item-meta { display:flex; gap:8px; margin-top:3px; }
        .nc-item-source { font-size:9px; color:var(--text-muted); text-transform:uppercase; font-weight:600; letter-spacing:0.3px; }
        .nc-item-time { font-size:9px; color:var(--text-muted); font-family:var(--font-mono); }

        .nc-unread-dot { width:6px; height:6px; border-radius:50%; background:var(--cyan); flex-shrink:0; margin-top:6px; box-shadow:0 0 6px rgba(0,240,255,0.4); }

        .nc-filter-bar { display: flex; gap: 4px; padding: 6px 12px; border-bottom: 1px solid var(--border); background: rgba(0, 0, 0, 0.15); }
        .nc-filter-pill { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; font-size: 10px; font-weight: 600; color: var(--text-muted); background: transparent; border: 1px solid transparent; border-radius: var(--radius-full); transition: all var(--transition-fast); }
        .nc-filter-pill:hover { color: var(--text-primary); }
        .nc-filter-pill.active { color: var(--cyan); background: rgba(0, 240, 255, 0.1); border-color: rgba(0, 240, 255, 0.25); }
        .nc-filter-count { background: var(--cyan); color: var(--bg-deep); padding: 0 5px; min-width: 14px; height: 14px; border-radius: var(--radius-full); display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; font-family: var(--font-mono); }

        .nc-item-jumpable { cursor: pointer; }
        .nc-item-jumpable:hover .nc-jump-icon { opacity: 1; transform: translate(2px, -2px); }
        .nc-jump-icon { color: var(--cyan); margin-left: 4px; opacity: 0; transition: all var(--transition-fast); vertical-align: -1px; }
      `}</style>
    </div>
  );
}
