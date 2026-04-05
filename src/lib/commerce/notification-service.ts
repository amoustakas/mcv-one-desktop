// src/lib/commerce/notification-service.ts
// Commerce Surface Layer — Notification Service
// Event-driven notification templates with queue-based delivery

import { supabase } from '../supabase';
import type {
  NotificationTemplate,
  NotificationDelivery,
  NotificationEvent,
  NotificationChannel,
  NotificationDeliveryStatus,
} from './surface-types';

// ─────────────────────────────────────────────────────────
// ROW MAPPERS
// ─────────────────────────────────────────────────────────

function mapTemplateRow(row: Record<string, unknown>): NotificationTemplate {
  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    event: row.event as NotificationEvent,
    channel: row.channel as NotificationChannel,
    subject: row.subject as string,
    body: row.body as string,
    enabled: row.enabled as boolean,
    createdAt: row.created_at as string,
  };
}

function mapDeliveryRow(row: Record<string, unknown>): NotificationDelivery {
  const parseJson = <T>(value: unknown): T => {
    if (value === null || value === undefined) return {} as T;
    if (typeof value === 'object') return value as T;
    if (typeof value === 'string') {
      try { return JSON.parse(value) as T; } catch { return {} as T; }
    }
    return {} as T;
  };

  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    templateId: row.template_id as string,
    customerId: row.customer_id as string,
    channel: row.channel as NotificationChannel,
    status: row.status as NotificationDeliveryStatus,
    sentAt: (row.sent_at as string) ?? null,
    deliveredAt: (row.delivered_at as string) ?? null,
    error: (row.error as string) ?? null,
    metadata: parseJson<Record<string, unknown>>(row.metadata),
  };
}

// ─────────────────────────────────────────────────────────
// TEMPLATE INTERPOLATION
// ─────────────────────────────────────────────────────────

export function interpolateTemplate(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    return Object.prototype.hasOwnProperty.call(variables, key) ? variables[key] : `{{${key}}}`;
  });
}

// ─────────────────────────────────────────────────────────
// TEMPLATE CRUD
// ─────────────────────────────────────────────────────────

export async function createTemplate(input: {
  ventureId: string;
  event: NotificationEvent;
  channel: NotificationChannel;
  subject: string;
  body: string;
  enabled?: boolean;
}): Promise<NotificationTemplate> {
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('notification_templates')
    .insert({
      venture_id: input.ventureId,
      event: input.event,
      channel: input.channel,
      subject: input.subject,
      body: input.body,
      enabled: input.enabled ?? true,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create notification template: ${error.message}`);
  return mapTemplateRow(data);
}

export async function listTemplates(
  ventureId: string,
  event?: NotificationEvent,
): Promise<NotificationTemplate[]> {
  if (!supabase) return [];

  let query = supabase
    .from('notification_templates')
    .select()
    .eq('venture_id', ventureId)
    .order('event', { ascending: true });

  if (event) query = query.eq('event', event);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list notification templates: ${error.message}`);
  return (data ?? []).map(mapTemplateRow);
}

export async function updateTemplate(
  id: string,
  ventureId: string,
  updates: Partial<{
    subject: string;
    body: string;
    enabled: boolean;
    channel: NotificationChannel;
  }>,
): Promise<NotificationTemplate> {
  if (!supabase) throw new Error('Supabase client not available');

  const row: Record<string, unknown> = {};
  if (updates.subject !== undefined) row.subject = updates.subject;
  if (updates.body !== undefined) row.body = updates.body;
  if (updates.enabled !== undefined) row.enabled = updates.enabled;
  if (updates.channel !== undefined) row.channel = updates.channel;

  const { data, error } = await supabase
    .from('notification_templates')
    .update(row)
    .eq('id', id)
    .eq('venture_id', ventureId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update notification template: ${error.message}`);
  return mapTemplateRow(data);
}

// ─────────────────────────────────────────────────────────
// QUEUE NOTIFICATION
// ─────────────────────────────────────────────────────────

export async function queueNotification(
  ventureId: string,
  event: NotificationEvent,
  customerId: string,
  variables: Record<string, string>,
): Promise<NotificationDelivery[]> {
  if (!supabase) return [];

  // Find all enabled templates for this venture + event
  const templates = await listTemplates(ventureId, event);
  const enabledTemplates = templates.filter((t) => t.enabled);

  if (enabledTemplates.length === 0) return [];

  const rows = enabledTemplates.map((t) => ({
    venture_id: ventureId,
    template_id: t.id,
    customer_id: customerId,
    channel: t.channel,
    status: 'pending',
    metadata: { variables },
  }));

  const { data, error } = await supabase
    .from('notification_deliveries')
    .insert(rows)
    .select();

  if (error) throw new Error(`Failed to queue notification: ${error.message}`);
  return (data ?? []).map(mapDeliveryRow);
}

// ─────────────────────────────────────────────────────────
// PROCESS QUEUE
// Stub: logs the message, marks as sent. Real sending via SendGrid/Twilio kits later.
// ─────────────────────────────────────────────────────────

export async function processNotificationQueue(
  ventureId?: string,
): Promise<{ processed: number; failed: number }> {
  if (!supabase) return { processed: 0, failed: 0 };

  let query = supabase
    .from('notification_deliveries')
    .select(`
      *,
      notification_templates (subject, body, channel)
    `)
    .eq('status', 'pending')
    .limit(100);

  if (ventureId) query = query.eq('venture_id', ventureId);

  const { data: pending, error } = await query;
  if (error) throw new Error(`Failed to fetch pending deliveries: ${error.message}`);
  if (!pending || pending.length === 0) return { processed: 0, failed: 0 };

  let processed = 0;
  let failed = 0;

  for (const delivery of pending) {
    try {
      const template = delivery.notification_templates as {
        subject: string;
        body: string;
        channel: string;
      } | null;

      if (!template) {
        await supabase
          .from('notification_deliveries')
          .update({ status: 'failed', error: 'Template not found' })
          .eq('id', delivery.id);
        failed++;
        continue;
      }

      // Extract variables from metadata
      const variables: Record<string, string> =
        (delivery.metadata as Record<string, unknown>)?.variables as Record<string, string> ?? {};

      const interpolatedSubject = interpolateTemplate(template.subject, variables);
      const interpolatedBody = interpolateTemplate(template.body, variables);

      // STUB: log the notification (real SendGrid/Twilio/Push integration comes later)
      console.log(
        `[Notification STUB] channel=${template.channel} to=customer:${delivery.customer_id}`,
        `\nSubject: ${interpolatedSubject}`,
        `\nBody: ${interpolatedBody}`,
      );

      await supabase
        .from('notification_deliveries')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', delivery.id);

      processed++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await supabase
        .from('notification_deliveries')
        .update({ status: 'failed', error: message })
        .eq('id', delivery.id);
      failed++;
    }
  }

  return { processed, failed };
}

// ─────────────────────────────────────────────────────────
// DELIVERY HISTORY
// ─────────────────────────────────────────────────────────

export async function getDeliveryHistory(
  ventureId: string,
  customerId?: string,
  limit = 50,
): Promise<NotificationDelivery[]> {
  if (!supabase) return [];

  let query = supabase
    .from('notification_deliveries')
    .select()
    .eq('venture_id', ventureId)
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (customerId) query = query.eq('customer_id', customerId);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to get delivery history: ${error.message}`);
  return (data ?? []).map(mapDeliveryRow);
}
