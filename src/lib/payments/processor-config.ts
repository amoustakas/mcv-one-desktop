// Per-venture payment processor config lookup + cache.
//
// Capital's processPayment adapter uses resolveProcessor() to determine
// which processor handles a (ventureId, method) pair. The first match by
// priority wins. Absence of rows = fall back to PaymentRouter's default
// capability match.
//
// Simple in-memory cache with 60s TTL — config changes are rare, reads
// are hot on every distribution payout.

import { supabase } from '../supabase';

export interface ProcessorConfigRow {
  id: string;
  ventureId: string;
  paymentMethod: string;
  processorId: string;
  priority: number;
  enabled: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

type CacheEntry = { value: ProcessorConfigRow[]; expires: number };
const cache = new Map<string, CacheEntry>();
const TTL_MS = 60_000;

function mapRow(row: Record<string, unknown>): ProcessorConfigRow {
  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    paymentMethod: row.payment_method as string,
    processorId: row.processor_id as string,
    priority: Number(row.priority ?? 100),
    enabled: Boolean(row.enabled),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function listProcessorConfig(ventureId: string): Promise<ProcessorConfigRow[]> {
  const cached = cache.get(ventureId);
  if (cached && cached.expires > Date.now()) return cached.value;
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('payment_processor_config')
    .select()
    .eq('venture_id', ventureId)
    .eq('enabled', true)
    .order('priority', { ascending: true });

  if (error) {
    console.warn(`[processor-config] list failed for ${ventureId}:`, error.message);
    return [];
  }
  const rows = (data ?? []).map(mapRow);
  cache.set(ventureId, { value: rows, expires: Date.now() + TTL_MS });
  return rows;
}

/** Returns the processor_id to use for (ventureId, method), or null to let
 *  the PaymentRouter's default capability match decide. */
export async function resolveProcessor(
  ventureId: string,
  paymentMethod: string,
): Promise<{ processorId: string; metadata: Record<string, unknown> } | null> {
  const rows = await listProcessorConfig(ventureId);
  const match = rows.find((r) => r.paymentMethod === paymentMethod);
  return match ? { processorId: match.processorId, metadata: match.metadata } : null;
}

export interface UpsertProcessorConfigInput {
  ventureId: string;
  paymentMethod: string;
  processorId: string;
  priority?: number;
  enabled?: boolean;
  metadata?: Record<string, unknown>;
}

export async function upsertProcessorConfig(input: UpsertProcessorConfigInput): Promise<ProcessorConfigRow> {
  if (!supabase) throw new Error('Supabase client not available');
  const { data, error } = await supabase
    .from('payment_processor_config')
    .upsert(
      {
        venture_id: input.ventureId,
        payment_method: input.paymentMethod,
        processor_id: input.processorId,
        priority: input.priority ?? 100,
        enabled: input.enabled ?? true,
        metadata: input.metadata ?? {},
      },
      { onConflict: 'venture_id,payment_method,processor_id' },
    )
    .select()
    .single();
  if (error) throw new Error(`upsert failed: ${error.message}`);
  cache.delete(input.ventureId);
  return mapRow(data);
}

export async function deleteProcessorConfig(id: string, ventureId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase client not available');
  const { error } = await supabase
    .from('payment_processor_config')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`delete failed: ${error.message}`);
  cache.delete(ventureId);
}

export function invalidateProcessorConfigCache(ventureId?: string): void {
  if (ventureId) cache.delete(ventureId);
  else cache.clear();
}
