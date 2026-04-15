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
        queryClient.invalidateQueries({ queryKey: ['comms', 'inbox'] });
        queryClient.invalidateQueries({ queryKey: ['comms', 'messages'] });
      })
      // Notifications
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        const notif = payload.new as { type?: string; title?: string; description?: string; source?: string; venture_id?: string };
        // Source-specific query invalidation — lets each domain refresh its own
        // views without polling. Capital events write notifications rows from
        // api/_handlers/capital.ts publishCapitalEvent().
        if (notif.source === 'capital') {
          queryClient.invalidateQueries({ queryKey: ['capital'] });
        }
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
      // ── NAOS (agent state flows live) ──
      .on('postgres_changes', { event: '*', schema: 'public', table: 'naos_agents' }, () => {
        queryClient.invalidateQueries({ queryKey: ['naos', 'agents'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'naos_emotional_state' }, () => {
        queryClient.invalidateQueries({ queryKey: ['naos', 'emotional'] });
        queryClient.invalidateQueries({ queryKey: ['naos', 'agents'] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'naos_interactions' }, () => {
        queryClient.invalidateQueries({ queryKey: ['naos', 'interactions'] });
        queryClient.invalidateQueries({ queryKey: ['naos', 'agents'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'naos_relationships' }, () => {
        queryClient.invalidateQueries({ queryKey: ['naos', 'relationships'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'naos_culture_snapshot' }, () => {
        queryClient.invalidateQueries({ queryKey: ['naos', 'culture'] });
      })
      // ── Capital (real-time round, commitment, distribution updates) ──
      .on('postgres_changes', { event: '*', schema: 'public', table: 'capital_rounds' }, () => {
        queryClient.invalidateQueries({ queryKey: ['capital', 'rounds'] });
        queryClient.invalidateQueries({ queryKey: ['capital', 'round'] });
        queryClient.invalidateQueries({ queryKey: ['capital', 'global-summary'] });
        queryClient.invalidateQueries({ queryKey: ['capital', 'venture-summary'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'capital_commitments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['capital', 'commitments'] });
        queryClient.invalidateQueries({ queryKey: ['capital', 'commitments-by-round'] });
        queryClient.invalidateQueries({ queryKey: ['capital', 'global-summary'] });
        queryClient.invalidateQueries({ queryKey: ['capital', 'venture-summary'] });
        queryClient.invalidateQueries({ queryKey: ['capital', 'pipeline-funnel'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'capital_distributions' }, () => {
        queryClient.invalidateQueries({ queryKey: ['capital', 'distributions'] });
        queryClient.invalidateQueries({ queryKey: ['capital', 'distribution'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'capital_activities' }, () => {
        queryClient.invalidateQueries({ queryKey: ['capital', 'activities'] });
        queryClient.invalidateQueries({ queryKey: ['capital', 'recent-activities'] });
      })
      // ── Commerce ──
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['commerce', 'orders'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        queryClient.invalidateQueries({ queryKey: ['commerce', 'invoices'] });
        queryClient.invalidateQueries({ queryKey: ['financials'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, () => {
        queryClient.invalidateQueries({ queryKey: ['commerce', 'subscriptions'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        queryClient.invalidateQueries({ queryKey: ['commerce', 'products'] });
      })
      // ── Payments / financials ──
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_intents' }, () => {
        queryClient.invalidateQueries({ queryKey: ['payments'] });
        queryClient.invalidateQueries({ queryKey: ['financials'] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transaction_records' }, () => {
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['financials'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'journal_entries' }, () => {
        queryClient.invalidateQueries({ queryKey: ['ledger'] });
        queryClient.invalidateQueries({ queryKey: ['financials'] });
      })
      // ── Compliance ──
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fraud_checks' }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['compliance', 'fraud'] });
        const check = payload.new as { decision?: string; risk_score?: number };
        if (check?.decision === 'block' || (check?.risk_score ?? 0) > 80) {
          addNotification({
            type: 'warning', title: 'High-risk transaction flagged',
            description: `Risk score ${check.risk_score}, decision: ${check.decision}`,
            source: 'compliance',
          });
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'nexus_alerts' }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['compliance', 'nexus'] });
        const alert = payload.new as { jurisdiction_name?: string; severity?: string; alert_type?: string };
        addNotification({
          type: alert?.severity === 'critical' ? 'error' : 'warning',
          title: `Tax nexus: ${alert?.jurisdiction_name || 'Unknown'}`,
          description: alert?.alert_type || 'Nexus threshold alert',
          source: 'compliance',
        });
      })
      // ── Storage / RAG progress ──
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'storage_chunks' }, () => {
        queryClient.invalidateQueries({ queryKey: ['rag', 'corpora'] });
        queryClient.invalidateQueries({ queryKey: ['rag', 'chunks'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'storage_rag_corpora' }, () => {
        queryClient.invalidateQueries({ queryKey: ['rag', 'corpora'] });
      })
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  }, [queryClient, addNotification]);
}
