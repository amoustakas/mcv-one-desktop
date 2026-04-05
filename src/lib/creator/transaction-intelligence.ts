// src/lib/creator/transaction-intelligence.ts
// Transaction Intelligence — every financial event, fully provenance-tracked
// Receipts are dead. This IS the receipt.
// MCV Commerce & Financial OS — Section 9

import { supabase } from '../supabase';
import type {
  CreateTransactionRecordInput,
  TransactionRecord,
  TransactionEvent,
  RelatedRecord,
  TransactionSearchFilters,
  TransactionFee,
  PartyRef,
} from './types';
import {
  CreateTransactionRecordInputSchema,
  TransactionSearchFiltersSchema,
} from './types';

// ─────────────────────────────────────────────────────────
// ACCESS URL GENERATION
// ─────────────────────────────────────────────────────────

function generateAccessSlug(): string {
  // URL-safe slug: timestamp base36 + random chars
  const ts    = Date.now().toString(36);
  const rand  = Math.random().toString(36).slice(2, 10);
  return `${ts}-${rand}`;
}

// ─────────────────────────────────────────────────────────
// ROW MAPPER
// ─────────────────────────────────────────────────────────

function mapTransactionRow(row: Record<string, unknown>): TransactionRecord {
  const feeTotal = Number(row.fee_total ?? 0);
  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    transactionNumber: row.transaction_number as string,
    type: row.type as TransactionRecord['type'],
    status: row.status as TransactionRecord['status'],
    timestamp: row.timestamp as string,
    payer: {
      id: row.payer_id as string,
      type: (row.payer_type as PartyRef['type']) ?? 'user',
      name: null,
      email: null,
    },
    payee: {
      id: row.payee_id as string,
      type: (row.payee_type as PartyRef['type']) ?? 'user',
      name: null,
      email: null,
    },
    amount: Number(row.amount),
    currency: row.currency as string,
    fees: (row.metadata as Record<string, unknown>)?.fees as TransactionFee[] ?? [],
    netAmount: Number(row.net_amount),
    rail: (row.rail as string | null) ?? null,
    routingDecisionId: (row.routing_decision_id as string | null) ?? null,
    costSaved: row.cost_saved != null ? Number(row.cost_saved) : null,
    relatedRecords: (row.related_records as RelatedRecord[]) ?? [],
    categories: (row.categories as string[]) ?? [],
    events: (row.events as TransactionEvent[]) ?? [],
    accessUrl: (row.access_url as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
  };
}

// ─────────────────────────────────────────────────────────
// CREATE TRANSACTION RECORD
// ─────────────────────────────────────────────────────────

export async function createTransactionRecord(
  input: CreateTransactionRecordInput,
): Promise<TransactionRecord> {
  const validated = CreateTransactionRecordInputSchema.parse(input);

  const feeTotal = validated.fees.reduce((sum, f) => sum + f.amount, 0);
  const netAmount = validated.amount - feeTotal;

  // Generate access URL slug
  const accessSlug = generateAccessSlug();
  const accessUrl  = validated.accessUrl ?? `/tx/${accessSlug}`;

  // Build initial event if none provided
  const initialEvents: TransactionEvent[] = validated.events.length > 0
    ? validated.events
    : [{
        timestamp: validated.timestamp,
        event: 'transaction.initiated',
        actor: 'system',
        metadata: {},
      }];

  if (!supabase) {
    // Offline/dev fallback — return synthetic record
    return {
      id: `txn_${Date.now()}`,
      ventureId: validated.ventureId,
      transactionNumber: `TXN-LOCAL-${Date.now()}`,
      type: validated.type,
      status: validated.status,
      timestamp: validated.timestamp,
      payer: validated.payer,
      payee: validated.payee,
      amount: validated.amount,
      currency: validated.currency,
      fees: validated.fees,
      netAmount,
      rail: validated.rail,
      routingDecisionId: validated.routingDecisionId,
      costSaved: validated.costSaved,
      relatedRecords: validated.relatedRecords,
      categories: validated.categories,
      events: initialEvents,
      accessUrl,
      metadata: validated.metadata,
      createdAt: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase
    .from('transaction_records')
    .insert({
      venture_id: validated.ventureId,
      transaction_number: '', // will be set by trigger
      type: validated.type,
      status: validated.status,
      timestamp: validated.timestamp,
      payer_id: validated.payer.id,
      payer_type: validated.payer.type,
      payee_id: validated.payee.id,
      payee_type: validated.payee.type,
      amount: validated.amount,
      currency: validated.currency,
      fee_total: feeTotal,
      net_amount: netAmount,
      rail: validated.rail ?? null,
      routing_decision_id: validated.routingDecisionId ?? null,
      cost_saved: validated.costSaved ?? null,
      related_records: validated.relatedRecords,
      categories: validated.categories,
      events: initialEvents,
      access_url: accessUrl,
      metadata: {
        ...validated.metadata,
        fees: validated.fees,
        payerName: validated.payer.name,
        payeeName: validated.payee.name,
        payerEmail: validated.payer.email,
        payeeEmail: validated.payee.email,
      },
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create transaction record: ${error?.message}`);
  }

  return mapTransactionRow(data as unknown as Record<string, unknown>);
}

// ─────────────────────────────────────────────────────────
// ADD EVENT
// ─────────────────────────────────────────────────────────

export async function addEvent(
  recordId: string,
  event: Omit<TransactionEvent, 'timestamp'> & { timestamp?: string },
): Promise<TransactionRecord> {
  if (!supabase) throw new Error('Supabase client not available');

  // Fetch current events
  const { data: current, error: fetchErr } = await supabase
    .from('transaction_records')
    .select('events')
    .eq('id', recordId)
    .single();

  if (fetchErr || !current) throw new Error(`Transaction ${recordId} not found`);

  const newEvent: TransactionEvent = {
    timestamp: event.timestamp ?? new Date().toISOString(),
    event: event.event,
    actor: event.actor ?? 'system',
    metadata: event.metadata ?? {},
  };

  const updatedEvents = [...((current.events as TransactionEvent[]) ?? []), newEvent];

  const { data, error } = await supabase
    .from('transaction_records')
    .update({ events: updatedEvents })
    .eq('id', recordId)
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to add event: ${error?.message}`);
  return mapTransactionRow(data as unknown as Record<string, unknown>);
}

// ─────────────────────────────────────────────────────────
// LINK RELATED RECORD
// ─────────────────────────────────────────────────────────

export async function linkRelatedRecord(
  recordId: string,
  related: RelatedRecord,
): Promise<TransactionRecord> {
  if (!supabase) throw new Error('Supabase client not available');

  const { data: current, error: fetchErr } = await supabase
    .from('transaction_records')
    .select('related_records')
    .eq('id', recordId)
    .single();

  if (fetchErr || !current) throw new Error(`Transaction ${recordId} not found`);

  const updatedRelated = [
    ...((current.related_records as RelatedRecord[]) ?? []),
    related,
  ];

  const { data, error } = await supabase
    .from('transaction_records')
    .update({ related_records: updatedRelated })
    .eq('id', recordId)
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to link related record: ${error?.message}`);
  return mapTransactionRow(data as unknown as Record<string, unknown>);
}

// ─────────────────────────────────────────────────────────
// GET TRANSACTION RECORD
// ─────────────────────────────────────────────────────────

export async function getTransactionRecord(recordId: string): Promise<TransactionRecord | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('transaction_records')
    .select('*')
    .eq('id', recordId)
    .single();

  if (error || !data) return null;
  return mapTransactionRow(data as unknown as Record<string, unknown>);
}

// ─────────────────────────────────────────────────────────
// GET TRANSACTION BY NUMBER (public lookup)
// ─────────────────────────────────────────────────────────

export async function getTransactionByNumber(
  transactionNumber: string,
): Promise<TransactionRecord | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('transaction_records')
    .select('*')
    .eq('transaction_number', transactionNumber)
    .single();

  if (error || !data) return null;
  return mapTransactionRow(data as unknown as Record<string, unknown>);
}

// ─────────────────────────────────────────────────────────
// SEARCH TRANSACTIONS
// ─────────────────────────────────────────────────────────

export async function searchTransactions(
  ventureId: string,
  rawFilters: Partial<TransactionSearchFilters>,
): Promise<{ data: TransactionRecord[]; total: number }> {
  if (!supabase) return { data: [], total: 0 };

  const filters = TransactionSearchFiltersSchema.parse(rawFilters);

  let query = supabase
    .from('transaction_records')
    .select('*', { count: 'exact' })
    .eq('venture_id', ventureId)
    .order('timestamp', { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);

  if (filters.type)      query = query.eq('type', filters.type);
  if (filters.status)    query = query.eq('status', filters.status);
  if (filters.rail)      query = query.eq('rail', filters.rail);
  if (filters.dateFrom)  query = query.gte('timestamp', filters.dateFrom);
  if (filters.dateTo)    query = query.lte('timestamp', filters.dateTo);
  if (filters.amountMin) query = query.gte('amount', filters.amountMin);
  if (filters.amountMax) query = query.lte('amount', filters.amountMax);

  if (filters.customerId) {
    // Match either payer or payee
    query = query.or(`payer_id.eq.${filters.customerId},payee_id.eq.${filters.customerId}`);
  }

  if (filters.query) {
    // Full-text via ilike on access_url + transaction_number
    query = query.or(
      `transaction_number.ilike.%${filters.query}%,access_url.ilike.%${filters.query}%`,
    );
  }

  const { data, error, count } = await query;

  if (error) throw new Error(`Failed to search transactions: ${error.message}`);

  return {
    data: (data ?? []).map(r => mapTransactionRow(r as unknown as Record<string, unknown>)),
    total: count ?? 0,
  };
}

// ─────────────────────────────────────────────────────────
// GET PROVENANCE GRAPH
// Follow related_records chain recursively to build full provenance
// ─────────────────────────────────────────────────────────

export interface ProvenanceNode {
  record: TransactionRecord;
  depth: number;
  relationship: string | null;
}

export async function getProvenance(
  recordId: string,
  maxDepth: number = 5,
): Promise<ProvenanceNode[]> {
  if (!supabase) return [];

  const visited = new Set<string>();
  const nodes: ProvenanceNode[] = [];

  async function traverse(id: string, depth: number, relationship: string | null) {
    if (depth > maxDepth || visited.has(id)) return;
    visited.add(id);

    const record = await getTransactionRecord(id);
    if (!record) return;

    nodes.push({ record, depth, relationship });

    // Follow related records
    for (const related of record.relatedRecords) {
      if (!visited.has(related.id)) {
        await traverse(related.id, depth + 1, related.relationship);
      }
    }
  }

  await traverse(recordId, 0, null);
  return nodes;
}

// ─────────────────────────────────────────────────────────
// UPDATE STATUS
// ─────────────────────────────────────────────────────────

export async function updateTransactionStatus(
  recordId: string,
  status: TransactionRecord['status'],
  actorId?: string,
): Promise<TransactionRecord> {
  if (!supabase) throw new Error('Supabase client not available');

  // Append status-change event
  const record = await getTransactionRecord(recordId);
  if (!record) throw new Error(`Transaction ${recordId} not found`);

  const newEvent: TransactionEvent = {
    timestamp: new Date().toISOString(),
    event: `transaction.status_changed.${status}`,
    actor: actorId ?? 'system',
    metadata: { previousStatus: record.status, newStatus: status },
  };

  const updatedEvents = [...record.events, newEvent];

  const { data, error } = await supabase
    .from('transaction_records')
    .update({ status, events: updatedEvents })
    .eq('id', recordId)
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to update transaction status: ${error?.message}`);
  return mapTransactionRow(data as unknown as Record<string, unknown>);
}
