import { create } from 'zustand';
import { usePresenceStore } from './presence';

// ── Notification Routing ──
// Routes notifications based on user presence and device priority.

export type DeliveryMode = 'deliver' | 'badge-only' | 'queue';

export function routeNotification(notification: { type: string }): DeliveryMode {
  const presence = usePresenceStore.getState().ownPresence;
  if (!presence) return 'deliver';

  // In meeting or on call: only critical (error) notifications
  if (presence.status === 'in-meeting' || presence.status === 'on-call') {
    return notification.type === 'error' ? 'deliver' : 'queue';
  }

  // Focus mode: only errors and warnings
  if (presence.status === 'focus') {
    return notification.type === 'error' || notification.type === 'warning' ? 'deliver' : 'badge-only';
  }

  // Sleeping: queue everything
  if (presence.status === 'sleeping') {
    return 'queue';
  }

  // Check if this is the primary (most recently active) device
  const allPresences = usePresenceStore.getState().allPresences;
  const myDevices = Object.values(allPresences).filter((p) => p.userId === presence.userId);
  if (myDevices.length > 1) {
    const primary = myDevices.sort((a, b) =>
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime(),
    )[0];
    if (primary.deviceId !== presence.deviceId) return 'badge-only';
  }

  return 'deliver';
}

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description: string;
  source: string;
  ventureId?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;

  addNotification: (notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearRead: () => void;
  setNotifications: (notifications: AppNotification[]) => void;
  getByVenture: (ventureId: string) => AppNotification[];
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) =>
    set((s) => {
      const newNotif: AppNotification = {
        ...notification,
        id: crypto.randomUUID(),
        read: false,
        createdAt: new Date().toISOString(),
      };
      const updated = [newNotif, ...s.notifications].slice(0, 100); // cap at 100
      return { notifications: updated, unreadCount: updated.filter(n => !n.read).length };
    }),

  markRead: (id) =>
    set((s) => {
      const updated = s.notifications.map(n => n.id === id ? { ...n, read: true } : n);
      return { notifications: updated, unreadCount: updated.filter(n => !n.read).length };
    }),

  markAllRead: () =>
    set((s) => {
      const updated = s.notifications.map(n => ({ ...n, read: true }));
      return { notifications: updated, unreadCount: 0 };
    }),

  clearRead: () =>
    set((s) => {
      const kept = s.notifications.filter(n => !n.read);
      return { notifications: kept, unreadCount: kept.length };
    }),

  setNotifications: (notifications) =>
    set({ notifications, unreadCount: notifications.filter(n => !n.read).length }),

  getByVenture: (ventureId) =>
    get().notifications.filter(n => !n.ventureId || n.ventureId === ventureId),
}));
