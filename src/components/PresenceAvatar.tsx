import { usePresenceStore, STATUS_COLORS, type PresenceState } from '../stores/presence';

// ---------------------------------------------------------------------------
// PresenceAvatar — Avatar with colored status ring
// Used in the header, team views, and anywhere a user avatar is shown.
// ---------------------------------------------------------------------------

interface PresenceAvatarProps {
  userId?: string;
  size?: number;
  showStatus?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function PresenceAvatar({ userId, size = 32, showStatus = true, onClick, className }: PresenceAvatarProps) {
  const ownPresence = usePresenceStore((s) => s.ownPresence);
  const allPresences = usePresenceStore((s) => s.allPresences);

  // Find presence for the requested user (or own)
  let presence: PresenceState | null = null;
  if (!userId || userId === ownPresence?.userId) {
    presence = ownPresence;
  } else {
    // Find most recent presence for this user
    presence = Object.values(allPresences)
      .filter((p) => p.userId === userId)
      .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())[0] || null;
  }

  const statusColor = presence ? STATUS_COLORS[presence.status] : STATUS_COLORS.offline;
  const isActive = presence?.status === 'active';
  const ringSize = Math.max(2, Math.round(size / 16));

  return (
    <div
      className={`pa-root ${className || ''}`}
      style={{ width: size, height: size }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {presence?.avatarUrl ? (
        <img
          src={presence.avatarUrl}
          alt={presence.userName}
          className="pa-img"
          style={{
            width: size - ringSize * 2 - 2,
            height: size - ringSize * 2 - 2,
            borderRadius: '50%',
          }}
        />
      ) : (
        <div
          className="pa-placeholder"
          style={{
            width: size - ringSize * 2 - 2,
            height: size - ringSize * 2 - 2,
            fontSize: size / 3,
          }}
        >
          {presence?.userName?.[0]?.toUpperCase() || '?'}
        </div>
      )}

      {showStatus && (
        <div
          className={`pa-ring ${isActive ? 'pa-ring-pulse' : ''}`}
          style={{
            borderColor: statusColor,
            borderWidth: ringSize,
          }}
        />
      )}

      {showStatus && (
        <div
          className="pa-dot"
          style={{
            backgroundColor: statusColor,
            width: Math.max(8, size / 4),
            height: Math.max(8, size / 4),
          }}
        />
      )}

      <style>{`
        .pa-root{position:relative;cursor:pointer;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center}
        .pa-img{object-fit:cover;position:relative;z-index:1}
        .pa-placeholder{border-radius:50%;background:var(--bg-elevated);color:var(--text-muted);display:flex;align-items:center;justify-content:center;font-weight:700;position:relative;z-index:1}
        .pa-ring{position:absolute;inset:0;border-radius:50%;border-style:solid;pointer-events:none;z-index:0}
        .pa-ring-pulse{animation:pa-pulse 2s ease-in-out infinite}
        @keyframes pa-pulse{0%,100%{opacity:1}50%{opacity:0.6}}
        .pa-dot{position:absolute;bottom:0;right:0;border-radius:50%;border:2px solid var(--bg-deep);z-index:2}
      `}</style>
    </div>
  );
}
