// src/lib/finance/revenue-recognition.ts
// ASC 606 Revenue Recognition Engine
// Methods: straight_line, usage_based, point_in_time

import { supabase } from '../supabase';
import type {
  RevenueSchedule,
  RevenueEntry,
  CreateRevenueScheduleInput,
} from './types';

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

function monthsBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
}

function addMonths(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────────────────
// CREATE REVENUE SCHEDULE
// ─────────────────────────────────────────────────────────

export async function createRevenueSchedule(
  input: CreateRevenueScheduleInput,
): Promise<RevenueSchedule> {
  if (!supabase) {
    return buildEmptySchedule(input);
  }

  const now = new Date().toISOString();

  // Insert the schedule row
  const { data: schedule, error: scheduleError } = await supabase
    .from('revenue_schedules')
    .insert({
      venture_id: input.ventureId,
      source_type: input.sourceType,
      source_id: input.sourceId,
      total_amount: input.totalAmount,
      recognized_amount: input.recognizedAmount,
      deferred_amount: input.deferredAmount,
      start_date: input.startDate,
      end_date: input.endDate,
      recognition_method: input.recognitionMethod,
      status: input.status ?? 'active',
      created_at: now,
    })
    .select()
    .single();

  if (scheduleError || !schedule) {
    throw new Error(scheduleError?.message ?? 'Failed to create revenue schedule');
  }

  const scheduleId: string = (schedule as { id: string }).id;

  // Generate entries based on recognition method
  const entryRows: Array<{
    schedule_id: string;
    period_date: string;
    amount: number;
    type: string;
    journal_entry_id: null;
    recognized_at: null;
  }> = [];

  if (input.recognitionMethod === 'straight_line') {
    // Divide total evenly across months
    const numMonths = Math.max(1, monthsBetween(input.startDate, input.endDate));
    const monthlyAmount = input.totalAmount / numMonths;

    for (let i = 0; i < numMonths; i++) {
      entryRows.push({
        schedule_id: scheduleId,
        period_date: addMonths(input.startDate, i),
        amount: parseFloat(monthlyAmount.toFixed(2)),
        type: 'recognition',
        journal_entry_id: null,
        recognized_at: null,
      });
    }

    // Fix rounding: adjust last entry to ensure sum equals totalAmount
    const sumSoFar = entryRows.reduce((s, r) => s + r.amount, 0);
    if (entryRows.length > 0) {
      entryRows[entryRows.length - 1].amount = parseFloat(
        (entryRows[entryRows.length - 1].amount + (input.totalAmount - sumSoFar)).toFixed(2),
      );
    }

  } else if (input.recognitionMethod === 'point_in_time') {
    // Recognize immediately on start date
    entryRows.push({
      schedule_id: scheduleId,
      period_date: input.startDate,
      amount: input.totalAmount,
      type: 'recognition',
      journal_entry_id: null,
      recognized_at: null,
    });

  } else if (input.recognitionMethod === 'usage_based') {
    // Create a single deferral entry — recognition happens as credits are consumed
    entryRows.push({
      schedule_id: scheduleId,
      period_date: input.startDate,
      amount: input.totalAmount,
      type: 'deferral',
      journal_entry_id: null,
      recognized_at: null,
    });
  }
  // milestone: entries created externally when milestones are hit

  if (entryRows.length > 0) {
    const { error: entriesError } = await supabase
      .from('revenue_entries')
      .insert(entryRows);

    if (entriesError) {
      throw new Error(entriesError.message);
    }
  }

  return getSchedule(scheduleId);
}

// ─────────────────────────────────────────────────────────
// PROCESS RECOGNITION (cron target)
// ─────────────────────────────────────────────────────────

export async function processRecognition(
  ventureId: string,
  asOfDate: string,
): Promise<number> {
  if (!supabase) return 0;

  // 1. Fetch all active schedules for this venture
  const { data: schedules, error: schedulesError } = await supabase
    .from('revenue_schedules')
    .select('id, total_amount, recognized_amount, deferred_amount, recognition_method, start_date, end_date, source_type')
    .eq('venture_id', ventureId)
    .eq('status', 'active');

  if (schedulesError || !schedules) return 0;

  let processedCount = 0;

  for (const schedule of schedules as Array<{
    id: string;
    total_amount: number;
    recognized_amount: number;
    deferred_amount: number;
    recognition_method: string;
    start_date: string;
    end_date: string;
    source_type: string;
  }>) {
    if (schedule.recognition_method === 'usage_based') continue; // handled separately
    if (schedule.recognition_method === 'milestone') continue;    // handled separately

    // 2. Fetch pending entries for this schedule up to asOfDate
    const { data: pendingEntries } = await supabase
      .from('revenue_entries')
      .select('id, amount, period_date, type')
      .eq('schedule_id', schedule.id)
      .eq('type', 'recognition')
      .is('recognized_at', null)
      .lte('period_date', asOfDate);

    if (!pendingEntries || pendingEntries.length === 0) continue;

    for (const entry of pendingEntries as Array<{ id: string; amount: number; period_date: string }>) {
      // 3. Determine revenue account based on source_type
      const revenueAccount = mapSourceTypeToAccount(schedule.source_type);

      // 4. Create journal entry: DR Unearned Revenue (2030) / CR Revenue (4xxx)
      const { data: journalEntry, error: jeError } = await supabase
        .from('journal_entries')
        .insert({
          venture_id: ventureId,
          entry_number: `REV-REC-${Date.now()}`,
          entry_date: entry.period_date,
          description: `Revenue recognition: ${schedule.source_type} schedule ${schedule.id}`,
          source_type: 'revenue_recognition',
          source_id: schedule.id,
          status: 'posted',
          posted_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (jeError || !journalEntry) continue;

      const jeId = (journalEntry as { id: string }).id;

      // Insert journal entry lines
      await supabase.from('journal_entry_lines').insert([
        {
          entry_id: jeId,
          account_id: await resolveAccountId(ventureId, '2030'), // Unearned Revenue
          line_number: 1,
          debit_amount: entry.amount,
          credit_amount: 0,
          currency: 'USD',
          exchange_rate: 1,
        },
        {
          entry_id: jeId,
          account_id: await resolveAccountId(ventureId, revenueAccount),
          line_number: 2,
          debit_amount: 0,
          credit_amount: entry.amount,
          currency: 'USD',
          exchange_rate: 1,
        },
      ]);

      // 5. Mark entry as recognized
      await supabase
        .from('revenue_entries')
        .update({
          journal_entry_id: jeId,
          recognized_at: new Date().toISOString(),
        })
        .eq('id', entry.id);

      processedCount++;
    }

    // 6. Update recognized_amount and deferred_amount on schedule
    const { data: allEntries } = await supabase
      .from('revenue_entries')
      .select('amount')
      .eq('schedule_id', schedule.id)
      .eq('type', 'recognition')
      .not('recognized_at', 'is', null);

    const newRecognized = (allEntries as Array<{ amount: number }> | null)
      ?.reduce((s, e) => s + e.amount, 0) ?? 0;

    const newDeferred = Math.max(0, schedule.total_amount - newRecognized);

    const updatePayload: Record<string, unknown> = {
      recognized_amount: newRecognized,
      deferred_amount: newDeferred,
    };

    // 7. Mark as completed if fully recognized
    if (newDeferred < 0.01) {
      updatePayload.status = 'completed';
    }

    await supabase
      .from('revenue_schedules')
      .update(updatePayload)
      .eq('id', schedule.id);
  }

  return processedCount;
}

// ─────────────────────────────────────────────────────────
// GET SCHEDULE WITH ENTRIES
// ─────────────────────────────────────────────────────────

export async function getSchedule(scheduleId: string): Promise<RevenueSchedule> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data: schedule, error } = await supabase
    .from('revenue_schedules')
    .select(`
      *,
      revenue_entries(*)
    `)
    .eq('id', scheduleId)
    .single();

  if (error || !schedule) {
    throw new Error(error?.message ?? 'Schedule not found');
  }

  const raw = schedule as Record<string, unknown>;
  const entries = (raw.revenue_entries as Array<Record<string, unknown>> | null) ?? [];

  return {
    id: raw.id as string,
    ventureId: raw.venture_id as string,
    sourceType: raw.source_type as string,
    sourceId: raw.source_id as string,
    totalAmount: raw.total_amount as number,
    recognizedAmount: raw.recognized_amount as number,
    deferredAmount: raw.deferred_amount as number,
    startDate: raw.start_date as string,
    endDate: raw.end_date as string,
    recognitionMethod: raw.recognition_method as RevenueSchedule['recognitionMethod'],
    status: raw.status as RevenueSchedule['status'],
    createdAt: raw.created_at as string,
    entries: entries.map((e) => ({
      id: e.id as string,
      scheduleId: e.schedule_id as string,
      periodDate: e.period_date as string,
      amount: e.amount as number,
      type: e.type as RevenueEntry['type'],
      journalEntryId: (e.journal_entry_id as string | null) ?? null,
      recognizedAt: (e.recognized_at as string | null) ?? null,
    })),
  };
}

// ─────────────────────────────────────────────────────────
// GET DEFERRED REVENUE
// ─────────────────────────────────────────────────────────

export async function getDeferredRevenue(ventureId: string): Promise<number> {
  if (!supabase) return 0;

  const { data } = await supabase
    .from('revenue_schedules')
    .select('deferred_amount')
    .eq('venture_id', ventureId)
    .eq('status', 'active');

  return (data as Array<{ deferred_amount: number }> | null)
    ?.reduce((sum, row) => sum + (row.deferred_amount ?? 0), 0) ?? 0;
}

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

/** Map source_type to a revenue account code */
function mapSourceTypeToAccount(sourceType: string): string {
  switch (sourceType) {
    case 'subscription': return '4010';
    case 'order':        return '4020';
    case 'digital':      return '4030';
    case 'physical':     return '4040';
    case 'platform_fee': return '4050';
    case 'invoice':      return '4020';
    case 'service':      return '4110';
    default:             return '4020';
  }
}

/** Resolve a ledger account ID by account code and venture */
async function resolveAccountId(ventureId: string, code: string): Promise<string> {
  if (!supabase) return code; // fallback: use code as placeholder

  const { data } = await supabase
    .from('ledger_accounts')
    .select('id')
    .eq('venture_id', ventureId)
    .eq('code', code)
    .single();

  return (data as { id: string } | null)?.id ?? code;
}

/** Build an empty schedule for when Supabase is unavailable */
function buildEmptySchedule(input: CreateRevenueScheduleInput): RevenueSchedule {
  return {
    id: crypto.randomUUID(),
    ventureId: input.ventureId,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    totalAmount: input.totalAmount,
    recognizedAmount: input.recognizedAmount,
    deferredAmount: input.deferredAmount,
    startDate: input.startDate,
    endDate: input.endDate,
    recognitionMethod: input.recognitionMethod,
    status: 'active',
    entries: [],
    createdAt: new Date().toISOString(),
  };
}
