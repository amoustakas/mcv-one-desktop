import { create } from 'zustand';

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
