// @mcv/foundation-sdk/services/counsel — CRUD over counsel_engagements + counsel_tasks,
// plus the Hour-3 outreach email renderer with NDA-gated IP-mark redaction.
//
// The renderer reads the caller's current IP portfolio + acquisition urgency state and
// interpolates it into one of three email templates (corp_tax, ip, securities). Trade
// secrets never leak to counsel before the NDA is executed — the template filters the
// IP-mark list server-side via priorityTier IN ('P0','P1') AND markKind != 'trade_secret'.

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CounselEngagement,
  CounselTask,
  CreateCounselEngagementInput,
  CounselWorkstream,
  CounselTaskStatus,
  CounselEngagementStatus,
} from '../types';

// ─── Row mappers ────────────────────────────────────────────────────────────

export function mapCounselEngagementRow(row: Record<string, unknown>): CounselEngagement {
  return {
    id: row.id as string,
    firmName: row.firm_name as string,
    workstream: row.workstream as CounselEngagement['workstream'],
    contactName: (row.contact_name as string) ?? null,
    contactEmail: (row.contact_email as string) ?? null,
    status: row.status as CounselEngagement['status'],
    conflictsCheckStatus: row.conflicts_check_status as CounselEngagement['conflictsCheckStatus'],
    scopingCallAt: (row.scoping_call_at as string) ?? null,
    engagementLetterUrl: (row.engagement_letter_url as string) ?? null,
    ndaTemplateUsed: (row.nda_template_used as CounselEngagement['ndaTemplateUsed']) ?? null,
    ndaExecutedAt: (row.nda_executed_at as string) ?? null,
    budgetAllocatedUsd: Number(row.budget_allocated_usd ?? 0),
    budgetConsumedUsd: Number(row.budget_consumed_usd ?? 0),
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function mapCounselTaskRow(row: Record<string, unknown>): CounselTask {
  return {
    id: row.id as string,
    taskCode: row.task_code as string,
    workstream: row.workstream as CounselTask['workstream'],
    title: row.title as string,
    description: (row.description as string) ?? null,
    deliverable: (row.deliverable as string) ?? null,
    dependsOn: (row.depends_on as string[]) ?? [],
    criticalPath: Boolean(row.critical_path),
    assignedEngagementId: (row.assigned_engagement_id as string) ?? null,
    status: row.status as CounselTask['status'],
    priority: Number(row.priority ?? 100),
    dueAt: (row.due_at as string) ?? null,
    completedAt: (row.completed_at as string) ?? null,
    epicId: (row.epic_id as string) ?? null,
    sourceDoc: (row.source_doc as string) ?? null,
    sourceSection: (row.source_section as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ─── Service ────────────────────────────────────────────────────────────────

export interface Hour3EmailPayload {
  workstream: CounselEngagement['workstream'];
  subject: string;
  body: string;
  recipient: { firmName: string; contactName: string | null; contactEmail: string | null };
  /** Marks included in the email body — caller can display these alongside before sending. */
  redactedMarks: Array<{ markText: string; priorityTier: string; markKind: string }>;
  /** Marks that were FILTERED OUT due to NDA gating (trade_secret pre-NDA). */
  withheldMarks: number;
}

export interface CounselService {
  listEngagements(workstream?: CounselEngagement['workstream']): Promise<CounselEngagement[]>;
  getEngagement(id: string): Promise<CounselEngagement | null>;
  recordEngagement(input: CreateCounselEngagementInput): Promise<CounselEngagement>;
  updateEngagementStatus(id: string, status: CounselEngagement['status']): Promise<CounselEngagement>;
  markNDAExecuted(id: string, executedAtIso?: string): Promise<CounselEngagement>;

  listTasks(workstream?: CounselTask['workstream']): Promise<CounselTask[]>;
  listCriticalPathTasks(): Promise<CounselTask[]>;
  advanceTask(taskCode: string, newStatus: CounselTask['status']): Promise<CounselTask>;
  assignTask(taskCode: string, engagementId: string | null): Promise<CounselTask>;

  /** Render the Hour-3 outreach email. Trade-secret marks are redacted until NDA executed. */
  renderHour3Email(workstream: CounselEngagement['workstream']): Promise<Hour3EmailPayload>;
}

export interface CounselServiceOptions {
  supabase: SupabaseClient | null;
}

// ─── Email templates (kept in-SDK — the shell is locked; the DATA is dynamic) ───

const EMAIL_TEMPLATES: Record<CounselEngagement['workstream'], { subject: string; greeting: string; body: string }> = {
  corp_tax: {
    subject: 'MCV Universe — Corporate / Tax scoping call request',
    greeting: 'Dear {contactName},',
    body:
      'I lead EdgeIQ Holdings, parent of MCV Universe — an agent-first ecosystem with eight ventures ' +
      'currently moving through a $30M capital window (Blue Marlin, Cliff Bay).\n\n' +
      'We are standing up a three-layer entity architecture: Layer 0 Purpose Trust (Root, jurisdiction TBD — ' +
      'Jersey / Guernsey / Cayman), Layer 1 Singapore VCC + Ontario interim holder (MCV Inc.), and ' +
      'per-venture Layer 2 SPVs. I want to engage your firm on the corp/tax workstream: entity formation, ' +
      'tax elections, trust deed, IP-assignment chain, and the VCC stack.\n\n' +
      'A 30-minute scoping call would let us size the engagement before NDA. Open slots next week?',
  },
  ip: {
    subject: 'MCV Universe — IP scoping call request (P0 + P1 marks batch ready)',
    greeting: 'Dear {contactName},',
    body:
      'I lead EdgeIQ Holdings, parent of MCV Universe. We have a P0/P1 trademark + provisional-patent ' +
      'batch ready to clear + file in Canada and the US, followed by a Madrid extension wave.\n\n' +
      'Current P0/P1 inventory ({markCount} marks — trade-secret entries withheld until NDA executed):\n' +
      '{markList}\n\n' +
      'We are also queuing the following 🔴 urgent domain acquisitions that gate our FutureState ' +
      'disclosure: {urgentAcquisitions}.\n\n' +
      'Can we book a 30-minute scoping call? Happy to execute NDA beforehand.',
  },
  securities: {
    subject: 'MCV Universe — Securities scoping (FutureState SPC wrapper + token characterization)',
    greeting: 'Dear {contactName},',
    body:
      'I lead EdgeIQ Holdings. We are structuring the FutureState flagship real-estate round through a ' +
      'Cayman SPC wrapper aligned with the MCV Capital launchpad and the 8-stage Unified Investor Journey ' +
      '(INVITE → QUALIFY → IDENTIFY → LEARN → COMMIT → SETTLE → ACTIVATE → COMPOUND).\n\n' +
      'Separately, we have a token-characterization question for the MCV.CAP utility token across Reg CF, ' +
      'Reg D 506(c), and MAS (Singapore) paths.\n\n' +
      'Open for a 30-minute scoping call? NDA template is ready.',
  },
};

// ─── Factory ────────────────────────────────────────────────────────────────

export function createCounselService({ supabase }: CounselServiceOptions): CounselService {
  const requireClient = (): SupabaseClient => {
    if (!supabase) throw new Error('Supabase client not available for CounselService');
    return supabase;
  };

  return {
    async listEngagements(workstream) {
      const client = requireClient();
      let q = client.from('counsel_engagements').select().order('workstream').order('firm_name');
      if (workstream) q = q.eq('workstream', workstream);
      const { data, error } = await q;
      if (error) throw new Error(`CounselService.listEngagements failed: ${error.message}`);
      return (data ?? []).map(mapCounselEngagementRow);
    },

    async getEngagement(id) {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('counsel_engagements').select().eq('id', id).maybeSingle();
      if (error) throw new Error(`CounselService.getEngagement failed: ${error.message}`);
      return data ? mapCounselEngagementRow(data) : null;
    },

    async recordEngagement(input) {
      const client = requireClient();
      const validated = CreateCounselEngagementInput.parse(input);
      const row = {
        firm_name: validated.firmName,
        workstream: validated.workstream,
        contact_name: validated.contactName,
        contact_email: validated.contactEmail,
        status: validated.status ?? 'prospecting',
        conflicts_check_status: validated.conflictsCheckStatus ?? 'not_run',
        scoping_call_at: validated.scopingCallAt,
        engagement_letter_url: validated.engagementLetterUrl,
        nda_template_used: validated.ndaTemplateUsed,
        nda_executed_at: validated.ndaExecutedAt,
        budget_allocated_usd: validated.budgetAllocatedUsd ?? 0,
        budget_consumed_usd: validated.budgetConsumedUsd ?? 0,
        notes: validated.notes,
      };
      const { data, error } = await client
        .from('counsel_engagements').insert(row).select().single();
      if (error) throw new Error(`CounselService.recordEngagement failed: ${error.message}`);
      return mapCounselEngagementRow(data);
    },

    async updateEngagementStatus(id, status) {
      const client = requireClient();
      const parsed = CounselEngagementStatus.parse(status);
      const { data, error } = await client
        .from('counsel_engagements').update({ status: parsed }).eq('id', id).select().single();
      if (error) throw new Error(`CounselService.updateEngagementStatus failed: ${error.message}`);
      return mapCounselEngagementRow(data);
    },

    async markNDAExecuted(id, executedAtIso) {
      const client = requireClient();
      const { data, error } = await client
        .from('counsel_engagements')
        .update({
          status: 'nda_executed',
          nda_executed_at: executedAtIso ?? new Date().toISOString(),
        })
        .eq('id', id).select().single();
      if (error) throw new Error(`CounselService.markNDAExecuted failed: ${error.message}`);
      return mapCounselEngagementRow(data);
    },

    async listTasks(workstream) {
      const client = requireClient();
      let q = client.from('counsel_tasks').select()
        .order('workstream').order('priority').order('task_code');
      if (workstream) q = q.eq('workstream', workstream);
      const { data, error } = await q;
      if (error) throw new Error(`CounselService.listTasks failed: ${error.message}`);
      return (data ?? []).map(mapCounselTaskRow);
    },

    async listCriticalPathTasks() {
      const client = requireClient();
      const { data, error } = await client
        .from('counsel_tasks').select().eq('critical_path', true)
        .neq('status', 'done').order('priority');
      if (error) throw new Error(`CounselService.listCriticalPathTasks failed: ${error.message}`);
      return (data ?? []).map(mapCounselTaskRow);
    },

    async advanceTask(taskCode, newStatus) {
      const client = requireClient();
      const parsed = CounselTaskStatus.parse(newStatus);
      const patch: Record<string, unknown> = { status: parsed };
      if (parsed === 'done') patch.completed_at = new Date().toISOString();
      const { data, error } = await client
        .from('counsel_tasks').update(patch).eq('task_code', taskCode).select().single();
      if (error) throw new Error(`CounselService.advanceTask failed: ${error.message}`);
      return mapCounselTaskRow(data);
    },

    async assignTask(taskCode, engagementId) {
      const client = requireClient();
      const { data, error } = await client
        .from('counsel_tasks')
        .update({ assigned_engagement_id: engagementId })
        .eq('task_code', taskCode).select().single();
      if (error) throw new Error(`CounselService.assignTask failed: ${error.message}`);
      return mapCounselTaskRow(data);
    },

    async renderHour3Email(workstream) {
      CounselWorkstream.parse(workstream);
      const client = requireClient();

      // Pick the first engagement on this workstream for addressing. If none,
      // the template still renders with placeholder recipient.
      const { data: engagementRows } = await client
        .from('counsel_engagements').select().eq('workstream', workstream).limit(1);
      const engagementRow = (engagementRows ?? [])[0];
      const engagement = engagementRow ? mapCounselEngagementRow(engagementRow) : null;
      const isNDAExecuted = Boolean(engagement?.ndaExecutedAt);

      // Pull P0/P1 marks, filtering trade_secret unless NDA executed.
      let marksQ = client.from('ip_marks')
        .select('mark_text, priority_tier, mark_kind')
        .in('priority_tier', ['P0', 'P1'])
        .order('priority_tier').order('mark_text');
      if (!isNDAExecuted) marksQ = marksQ.neq('mark_kind', 'trade_secret');

      const { data: marksData, error: marksErr } = await marksQ;
      if (marksErr) throw new Error(`CounselService.renderHour3Email failed (marks): ${marksErr.message}`);
      const marks = (marksData ?? []) as Array<{ mark_text: string; priority_tier: string; mark_kind: string }>;

      // Count withheld trade secrets (visible to caller even if body hides them).
      let withheldCount = 0;
      if (!isNDAExecuted) {
        const { count } = await client
          .from('ip_marks')
          .select('id', { count: 'exact', head: true })
          .in('priority_tier', ['P0', 'P1'])
          .eq('mark_kind', 'trade_secret');
        withheldCount = count ?? 0;
      }

      // Pull 🔴 acquisition orders for the IP template's urgent-acquisitions line.
      const { data: urgentAcqData } = await client
        .from('acquisition_orders')
        .select('asset_identifier')
        .eq('urgency_tier', 'red_7day')
        .neq('status', 'acquired');
      const urgentList = (urgentAcqData ?? [])
        .map((r) => (r as { asset_identifier: string }).asset_identifier)
        .join(', ') || '(none outstanding)';

      const template = EMAIL_TEMPLATES[workstream];
      const contactName = engagement?.contactName ?? 'Counsel';
      const markList = marks.length === 0
        ? '   (no marks in catalog yet — corpus ingestion pending)'
        : marks.map((m) => `   • [${m.priority_tier}] ${m.mark_text}`).join('\n');

      const body = `${template.greeting.replace('{contactName}', contactName)}\n\n` +
        template.body
          .replace('{markCount}', String(marks.length))
          .replace('{markList}', markList)
          .replace('{urgentAcquisitions}', urgentList);

      return {
        workstream,
        subject: template.subject,
        body,
        recipient: {
          firmName: engagement?.firmName ?? 'TBD',
          contactName: engagement?.contactName ?? null,
          contactEmail: engagement?.contactEmail ?? null,
        },
        redactedMarks: marks.map((m) => ({
          markText: m.mark_text, priorityTier: m.priority_tier, markKind: m.mark_kind,
        })),
        withheldMarks: withheldCount,
      };
    },
  };
}
