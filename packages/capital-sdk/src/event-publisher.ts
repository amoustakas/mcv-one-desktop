// @mcv/capital-sdk/event-publisher — concrete CapitalEventPublisher sinks.
//
// Three shipped publishers:
//   1. createSupabasePublisher(supabase) — writes to `notifications` table
//      (same shape as existing NotificationsBridge.publishCapitalEvent).
//   2. createFabricPublisher({ url, token? }) — HTTP POST to the Fabric
//      event bus. Use when FABRIC_URL is set.
//   3. createConsolePublisher() — logs to console; useful for local dev
//      or when a host app has no persistent sink yet.
//
// Ventures compose these with composePublishers(...) from events.ts.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CapitalEvent, CapitalEventPublisher } from './events.js';

// ─── Supabase publisher ─────────────────────────────────────────────────

export interface SupabasePublisherOptions {
  source?: string;               // default 'capital'
  targetUserId?: string | null;  // default null
}

export function createSupabasePublisher(
  supabase: SupabaseClient,
  options: SupabasePublisherOptions = {},
): CapitalEventPublisher {
  const source = options.source ?? 'capital';
  return {
    async publish(event: CapitalEvent) {
      const title = event.topic.split('.').slice(1).join(' ');
      const description = JSON.stringify(event.payload).slice(0, 200);
      try {
        await supabase.from('notifications').insert({
          type: 'info',
          title,
          description,
          source,
          venture_id: event.ventureId,
          target_user_id: options.targetUserId ?? null,
          channels: {},
          metadata: {
            event_id: event.id,
            event_ts: event.ts,
            topic: event.topic,
            correlation_id: event.correlationId ?? null,
            actor: event.actor,
            ...(event.metadata ?? {}),
          },
        });
      } catch (err) {
        console.warn(`[capital-publisher/supabase] ${event.topic} insert failed:`, err);
      }
    },
  };
}

// ─── Fabric publisher ───────────────────────────────────────────────────

export interface FabricPublisherOptions {
  url: string;                        // e.g. https://fabric.mcv.one/events
  token?: string;                     // bearer token for Fabric auth
  fetchImpl?: typeof globalThis.fetch; // testable override
  timeoutMs?: number;                 // default 5000
}

export function createFabricPublisher(options: FabricPublisherOptions): CapitalEventPublisher {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? 5000;
  return {
    async publish(event: CapitalEvent) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetchImpl(options.url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
          },
          body: JSON.stringify({
            topic: event.topic,
            ventureId: event.ventureId,
            payload: event.payload,
            id: event.id,
            ts: event.ts,
            actor: event.actor,
            correlationId: event.correlationId,
            metadata: event.metadata,
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          console.warn(`[capital-publisher/fabric] ${event.topic} responded ${res.status}`);
        }
      } catch (err) {
        console.warn(`[capital-publisher/fabric] ${event.topic} failed:`, err);
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

// ─── Console publisher (dev + test) ─────────────────────────────────────

export interface ConsolePublisherOptions {
  logger?: (event: CapitalEvent) => void;
}

export function createConsolePublisher(options: ConsolePublisherOptions = {}): CapitalEventPublisher {
  const log = options.logger ?? ((event) => {
    console.info(`[capital-event] ${event.topic}`, {
      ventureId: event.ventureId,
      id: event.id,
      ts: event.ts,
      payload: event.payload,
    });
  });
  return {
    async publish(event: CapitalEvent) {
      try { log(event); } catch (err) { console.warn('[capital-publisher/console] log failed:', err); }
    },
  };
}

// ─── Environment-driven composition ─────────────────────────────────────
// Helper for host apps that want the default dual-sink (Supabase + Fabric)
// behavior without writing composition boilerplate.

export interface DefaultPublisherConfig {
  supabase?: SupabaseClient;
  fabricUrl?: string;
  fabricToken?: string;
  includeConsole?: boolean;
}

export function createDefaultPublisher(config: DefaultPublisherConfig): CapitalEventPublisher {
  // Local import avoids circular ref at module eval time.
  const { composePublishers, nullEventPublisher } = require('./events.js') as typeof import('./events.js');
  const sinks: CapitalEventPublisher[] = [];
  if (config.supabase) sinks.push(createSupabasePublisher(config.supabase));
  if (config.fabricUrl) sinks.push(createFabricPublisher({ url: config.fabricUrl, token: config.fabricToken }));
  if (config.includeConsole) sinks.push(createConsolePublisher());
  if (sinks.length === 0) return nullEventPublisher;
  if (sinks.length === 1) return sinks[0];
  return composePublishers(...sinks);
}
