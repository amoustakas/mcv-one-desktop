import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useNotificationStore } from '../stores/notifications';

/**
 * Supabase Realtime subscriptions — auto-invalidates TanStack Query caches
 * when data changes in the database (from any device/session).
 *
 * This means: create a task on your phone → it appears on your desktop instantly.
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore(s => s.addNotification);

  useEffect(() => {
    if (!supabase) return;

    // Subscribe to changes on core tables
    const channel = supabase
      .channel('mcv-realtime')
      // Tasks
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        if (payload.eventType === 'INSERT') {
          const task = payload.new as { title?: string; venture_id?: string };
          addNotification({
            type: 'info',
            title: `New task: ${task.title || 'Untitled'}`,
            description: 'Task board updated',
            source: 'realtime',
            ventureId: task.venture_id,
          });
        }
      })
      // Contacts
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['crm', 'contacts'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      })
      // Deals
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, () => {
        queryClient.invalidateQueries({ queryKey: ['crm', 'deals'] });
        queryClient.invalidateQueries({ queryKey: ['crm', 'pipeline'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      })
      // Activities
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => {
        queryClient.invalidateQueries({ queryKey: ['crm', 'activities'] });
      })
      // Documents
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => {
        queryClient.invalidateQueries({ queryKey: ['docs'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      })
      // Conversations
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      })
      // Messages
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      })
      // Notifications
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        const notif = payload.new as { type?: string; title?: string; description?: string; source?: string; venture_id?: string };
        addNotification({
          type: (notif.type as 'info' | 'success' | 'warning' | 'error') || 'info',
          title: notif.title || 'New notification',
          description: notif.description || '',
          source: notif.source || 'system',
          ventureId: notif.venture_id,
        });
      })
      // Campaigns
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, () => {
        queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      })
      // Team
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => {
        queryClient.invalidateQueries({ queryKey: ['team'] });
      })
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  }, [queryClient, addNotification]);
}
