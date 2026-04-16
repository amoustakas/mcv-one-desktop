/**
 * Seed 2 test prospects + journeys so ProspectsView has meaningful data.
 *
 *   1. Sarah Chen — investor_retail, source venture Futurestate, completed.
 *   2. Marcus Obi  — partner, mid-journey at agent_assignment.
 *
 * Idempotent: upserts on email + deletes prior journeys/steps by prospect id.
 *
 * Usage:  npx tsx scripts/seed-prospects.ts
 * Env:    SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_SERVICE_KEY (or SECRET_KEY)
 *
 * Plan: C:\Users\moust\.claude\plans\nifty-launching-turtle.md
 */

import { createClient } from '@supabase/supabase-js';
import {
  TRACKS,
  AGENT_HANDLES,
  type TrackName,
  type StepName,
  type AgentHandle,
} from '@mcv/onboarding-sdk';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  '';

if (!supabaseUrl || !supabaseKey) {
  console.error('[seed-prospects] Missing SUPABASE_URL / SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ───────────────────────────────────────────────────────────────────────────
// Agent handle → id resolver (one-shot for the seed).
// ───────────────────────────────────────────────────────────────────────────
async function loadAgentIds(): Promise<Map<AgentHandle, string>> {
  const { data, error } = await supabase.from('agent_persona').select('id, handle');
  if (error) throw error;
  const map = new Map<AgentHandle, string>();
  for (const row of data ?? []) {
    map.set(row.handle as AgentHandle, row.id as string);
  }
  return map;
}

// ───────────────────────────────────────────────────────────────────────────
// Seed helpers
// ───────────────────────────────────────────────────────────────────────────

async function upsertProfile(profile: {
  email: string;
  full_name: string;
  country: string;
  role_hint: 'investor' | 'partner' | 'creator' | 'team' | 'ally';
  source_venture_id: string | null;
  source_channel: string;
}): Promise<string> {
  const { data, error } = await supabase
    .from('prospect_profile')
    .upsert(profile, { onConflict: 'email' })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

async function replaceJourney(opts: {
  prospect_id: string;
  track: TrackName;
  venture_id: string | null;
  agent_id: string | null;
  current_step_index: number;
  status: 'active' | 'completed';
}): Promise<string> {
  // Wipe prior journeys for this prospect for idempotency.
  await supabase.from('prospect_journey').delete().eq('prospect_id', opts.prospect_id);

  const steps = [...TRACKS[opts.track].steps];
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('prospect_journey')
    .insert({
      prospect_id: opts.prospect_id,
      track: opts.track,
      status: opts.status,
      current_step_index: opts.current_step_index,
      steps,
      agent_id: opts.agent_id,
      started_at: now,
      last_activity_at: now,
      completed_at: opts.status === 'completed' ? now : null,
      metadata: { venture_id: opts.venture_id, seeded: true },
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

async function seedStepsForJourney(opts: {
  journey_id: string;
  steps: StepName[];
  current_step_index: number;
  status: 'active' | 'completed';
  agent_ids_by_step: Record<string, string | null>;
}) {
  const now = new Date().toISOString();
  const rows = opts.steps.map((step_name, idx) => {
    let stepStatus: 'pending' | 'in_progress' | 'completed' | 'skipped' = 'pending';
    let started_at: string | null = null;
    let completed_at: string | null = null;

    if (opts.status === 'completed') {
      stepStatus = 'completed';
      started_at = now;
      completed_at = now;
    } else if (idx < opts.current_step_index) {
      stepStatus = 'completed';
      started_at = now;
      completed_at = now;
    } else if (idx === opts.current_step_index) {
      stepStatus = 'in_progress';
      started_at = now;
    }

    return {
      journey_id: opts.journey_id,
      step_name,
      status: stepStatus,
      started_at,
      completed_at,
      agent_id: opts.agent_ids_by_step[step_name] ?? null,
      inputs: {},
      outputs: {},
      metadata: { seeded: true },
    };
  });
  const { error } = await supabase.from('prospect_journey_step').insert(rows);
  if (error) throw error;
}

// ───────────────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('[seed-prospects] loading agent ids…');
  const agentIds = await loadAgentIds();

  const atlas    = agentIds.get(AGENT_HANDLES.atlas)    ?? null;
  const amara    = agentIds.get(AGENT_HANDLES.amara)    ?? null;
  const sterling = agentIds.get(AGENT_HANDLES.sterling) ?? null;
  const justice  = agentIds.get(AGENT_HANDLES.justice)  ?? null;
  const leo      = agentIds.get(AGENT_HANDLES.leo)      ?? null;

  // ── Prospect 1: Sarah Chen — investor_retail, completed, via Futurestate
  console.log('[seed-prospects] Sarah Chen (investor_retail, completed)');
  const sarahId = await upsertProfile({
    email: 'sarah.chen+seed@mcv.one',
    full_name: 'Sarah Chen',
    country: 'US',
    role_hint: 'investor',
    source_venture_id: 'futurestate',
    source_channel: 'landing_page',
  });
  const sarahJourneyId = await replaceJourney({
    prospect_id: sarahId,
    track: 'investor_retail',
    venture_id: 'futurestate',
    agent_id: sterling,          // Futurestate IR ended up running the journey
    current_step_index: TRACKS.investor_retail.steps.length - 1,
    status: 'completed',
  });
  await seedStepsForJourney({
    journey_id: sarahJourneyId,
    steps: [...TRACKS.investor_retail.steps],
    current_step_index: TRACKS.investor_retail.steps.length - 1,
    status: 'completed',
    agent_ids_by_step: {
      intro:               atlas ?? '',
      venture_selection:   atlas ?? '',
      identity_capture:    null as unknown as string,
      kyc_basic:           justice ?? '',
      agent_assignment:    atlas ?? '',
      credentials_issued:  justice ?? '',
      venture_demo:        sterling ?? '',
      welcome_message:     sterling ?? '',
      feedback_capture:    null as unknown as string,
    },
  });

  // ── Prospect 2: Marcus Obi — partner, active at agent_assignment
  console.log('[seed-prospects] Marcus Obi (partner, in flight)');
  const marcusId = await upsertProfile({
    email: 'marcus.obi+seed@mcv.one',
    full_name: 'Marcus Obi',
    country: 'CA',
    role_hint: 'partner',
    source_venture_id: null,
    source_channel: 'referral',
  });
  const partnerSteps = [...TRACKS.partner.steps];
  const partnerCurrentIdx = partnerSteps.indexOf('agent_assignment');
  const marcusJourneyId = await replaceJourney({
    prospect_id: marcusId,
    track: 'partner',
    venture_id: null,
    agent_id: atlas,              // still Atlas — specialist flip happens AFTER agent_assignment step
    current_step_index: partnerCurrentIdx,
    status: 'active',
  });
  await seedStepsForJourney({
    journey_id: marcusJourneyId,
    steps: partnerSteps,
    current_step_index: partnerCurrentIdx,
    status: 'active',
    agent_ids_by_step: {
      intro:              atlas ?? '',
      identity_capture:   null as unknown as string,
      agent_assignment:   atlas ?? '',
      credentials_issued: leo ?? '',
      welcome_message:    leo ?? '',
    },
  });

  // Log one activity row per journey so agent_activity_log shows something.
  // agent_activity_log.action_kind is CHECK-constrained to
  // { chat_turn | tool_call | workflow_run | handoff | system }. Our onboarding
  // sub-kinds (journey_start, journey_complete, step_advance) live in input.sub_kind.
  await supabase.from('agent_activity_log').insert([
    {
      agent_id: sterling,
      session_id: sarahJourneyId,
      action_kind: 'workflow_run',
      tool_name: 'onboarding',
      input: { sub_kind: 'journey_complete', track: 'investor_retail', email: 'sarah.chen+seed@mcv.one' },
      output: { status: 'completed' },
      venture_id: 'futurestate',
    },
    {
      agent_id: atlas,
      session_id: marcusJourneyId,
      action_kind: 'workflow_run',
      tool_name: 'onboarding',
      input: { sub_kind: 'journey_start', track: 'partner', email: 'marcus.obi+seed@mcv.one' },
      output: { current_step: 'agent_assignment' },
      venture_id: null,
    },
  ]);

  console.log('[seed-prospects] done.');
  console.log(`  Sarah  journey: ${sarahJourneyId}`);
  console.log(`  Marcus journey: ${marcusJourneyId}`);
}

main().catch((err) => {
  console.error('[seed-prospects] failed:', err);
  process.exit(1);
});
