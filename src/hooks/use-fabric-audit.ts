// src/hooks/use-fabric-audit.ts
//
// Browser-side helper for emitting Fabric audit events from React components.
// Keeps the Fabric publish call fire-and-forget so audit outages never break
// the user-facing action.
//
// Usage:
//   const audit = useFabricAudit();
//   audit('venture.switched', { from: prev, to: next });
//
// Events that should fire here (per integration playbook):
//   - 'venture.switched'        — NavRail / VentureSidebar
//   - 'chat.message.user_sent'  — AegisChat user input
//   - 'kit.installed'           — Kit registry install
//   - 'kit.uninstalled'         — Kit registry remove
//   - 'kit.tool_call'           — Orchestrator tool dispatch
//   - 'naos.session.opened'     — SessionsPanel new session
//
// For server-side audits (chat completion, Stripe webhooks, etc) use
// createServerFabric() in src/lib/mcv-core/fabric.ts directly — this hook is
// only for user-visible browser actions.

import { useCallback } from 'react';
import { useCoreTriangle } from './use-core-triangle';

export type AuditEventType =
  | 'venture.switched'
  | 'chat.message.user_sent'
  | 'kit.installed'
  | 'kit.uninstalled'
  | 'kit.tool_call'
  | 'naos.session.opened'
  | (string & {}); // extensible

export function useFabricAudit() {
  const core = useCoreTriangle();
  return useCallback(
    (type: AuditEventType, data?: Record<string, unknown>) => {
      // Map event types to Fabric topics (one topic per event family).
      const topic = type.split('.')[0] || 'app';
      void core.fabric
        .publish({
          topic,
          payload: { type, ts: new Date().toISOString(), ...data },
          ventureId: data?.ventureId as string | undefined,
        })
        .catch(() => {
          // audit must never break the calling action
        });
    },
    [core],
  );
}
