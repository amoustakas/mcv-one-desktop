// src/hooks/use-admin-invite-events.ts
//
// Supabase Realtime subscription to the onboarding event family. Scopes to
// any `event_log` INSERT whose topic starts with `onboarding.` — that
// includes invite.created/accepted/revoked/expired, requirement.*, and
// access.* per the session-1 typed contract.
//
// AdminInvitesView uses this hook to:
//   1. Auto-refresh the invite list (via an onEvent callback the view
//      wires to the store's fetchInvites)
//   2. Flash a toast with a human-readable description of the event
//
// Pattern mirrors `src/hooks/use-realtime.ts` — a scoped Supabase channel
// bound to the INSERT event, with cleanup on unmount. No dependency on
// TanStack Query since admin-invites state lives in Zustand.
//
// EXPAND: if the topic registry grows beyond demo-gate, generalize into
// a `useEventLogStream({ topicPrefix, onEvent })` hook in use-events.ts.

import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface EventLogRow {
  id?: string;
  topic: string;
  payload: Record<string, unknown>;
  venture_id?: string | null;
  emitted_by?: string | null;
  occurred_at?: string;
  created_at?: string;
}

export interface OnboardingEvent {
  topic: string;
  payload: Record<string, unknown>;
  occurredAt: string;
  /** Best-effort human description for a toast. */
  description: string;
}

export interface UseAdminInviteEventsOptions {
  /** Enable/disable subscription. Useful to gate on super-admin status. */
  enabled?: boolean;
  /** Called on every accepted event. Keep work cheap — this fires per event. */
  onEvent?: (event: OnboardingEvent) => void;
}

export function useAdminInviteEvents({ enabled = true, onEvent }: UseAdminInviteEventsOptions) {
  // Stash the callback in a ref so we can update the effect's behavior
  // without re-subscribing on every parent re-render. Re-subscribes leak
  // channel connections in Supabase's realtime client.
  const onEventRef = useRef(onEvent);
  useEffect(() => { onEventRef.current = onEvent; }, [onEvent]);

  useEffect(() => {
    // Capture the local Supabase client into a non-null const so the cleanup
    // can reference it safely — the imported `supabase` is `SupabaseClient | null`
    // and TS narrows per-branch, not across closures.
    const client = supabase;
    if (!enabled || !client) return;

    const channel = client
      .channel('admin-invites-onboarding-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_log',
          // Postgres-changes filter syntax supports `eq`, `neq`, `lt`, `gt`, `in`.
          // There's no `like` predicate — we filter client-side after arrival.
        },
        (payload) => {
          const row = payload.new as EventLogRow;
          if (!row?.topic || typeof row.topic !== 'string') return;
          if (!row.topic.startsWith('onboarding.')) return;
          const event: OnboardingEvent = {
            topic: row.topic,
            payload: row.payload ?? {},
            occurredAt: row.occurred_at ?? row.created_at ?? new Date().toISOString(),
            description: describeEvent(row.topic, row.payload ?? {}),
          };
          onEventRef.current?.(event);
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [enabled]);
}

function describeEvent(topic: string, payload: Record<string, unknown>): string {
  const email = (payload.invitedEmail as string | undefined) ?? (payload.email as string | undefined) ?? null;
  const venture = (payload.targetVentureId as string | undefined) ?? (payload.ventureId as string | undefined) ?? null;
  const tier = (payload.accessTier as string | undefined) ?? null;
  const level = (payload.accessLevel as string | undefined) ?? null;

  switch (topic) {
    case 'onboarding.invite.created':
      return `Invite created${email ? ` for ${email}` : ''}${tier ? ` · tier ${tier}` : ''}.`;
    case 'onboarding.invite.accepted':
      return `${email ?? 'Someone'} accepted their invite${venture ? ` for ${venture}` : ''}.`;
    case 'onboarding.invite.revoked':
      return `Invite revoked${email ? ` for ${email}` : ''}.`;
    case 'onboarding.invite.expired':
      return `Invite expired${email ? ` for ${email}` : ''}.`;
    case 'onboarding.requirement.assigned':
      return `Document requirement assigned.`;
    case 'onboarding.requirement.envelope_created':
      return `Signing envelope issued.`;
    case 'onboarding.requirement.signed':
      return `A document was signed.`;
    case 'onboarding.requirement.declined':
      return `A document was declined.`;
    case 'onboarding.requirement.waived':
      return `A document requirement was waived by admin.`;
    case 'onboarding.requirements.completed':
      return `${email ?? 'A user'} finished their signing checklist.`;
    case 'onboarding.access.granted':
      return `Access granted${venture ? ` to ${venture}` : ''}${level ? ` · ${level}` : ''}.`;
    case 'onboarding.access.revoked':
      return `Access revoked${venture ? ` on ${venture}` : ''}${level ? ` · ${level}` : ''}.`;
    default:
      return topic;
  }
}
