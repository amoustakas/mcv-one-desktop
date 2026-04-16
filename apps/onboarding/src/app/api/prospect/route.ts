// Public wizard's server-side API — uses service-role Supabase directly,
// drives the @mcv/onboarding-sdk orchestrator. Does not proxy to the
// Desktop app; the wizard deploys independently.
//
// Actions:
//   create_capture   — anon lead capture
//   start_journey    — create/upsert profile + journey + step rows
//   advance_step     — progress a journey via the SDK orchestrator
//   get_journey      — resume — read journey + steps by id
//
// Admin actions (list_journeys, get_prospect, list_captures) live in the
// Desktop API at /api/prospects and are not exposed here.

import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import {
  startJourney as sdkStartJourney,
  advanceStep as sdkAdvanceStep,
  runJourneyCompletionEffects,
  effectsAlreadyApplied,
  TRACKS,
  type TrackName,
  type StepStatus,
  type VentureId,
  type AgentHandle,
  type ProspectJourney,
  type ProspectProfile,
} from '@mcv/onboarding-sdk';

// Lazy Supabase accessor — never called at module-load so Next.js page-data
// collection can run the route without env vars.
const supabase = () => getServiceSupabase();

async function resolveAgentId(handle: AgentHandle | null): Promise<string | null> {
  if (!handle) return null;
  const { data } = await supabase().from('agent_persona').select('id').eq('handle', handle).maybeSingle();
  return (data?.id as string) ?? null;
}

async function logActivity(params: {
  agent_id: string | null;
  journey_id: string;
  sub_kind: 'journey_start' | 'step_advance' | 'journey_complete' | 'handoff';
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  venture_id?: VentureId;
}) {
  try {
    await supabase().from('agent_activity_log').insert({
      agent_id: params.agent_id,
      session_id: params.journey_id,
      action_kind: params.sub_kind === 'handoff' ? 'handoff' : 'workflow_run',
      tool_name: 'onboarding',
      input: { sub_kind: params.sub_kind, ...(params.input ?? {}) },
      output: params.output ?? {},
      venture_id: params.venture_id ?? null,
    });
  } catch {
    // best-effort
  }
}

// Translates the SDK's pure completion intents into ecosystem-table writes.
// Mirrors api/_handlers/prospects.ts:applyCompletionEffects (kept in sync;
// shared logic lives in @mcv/onboarding-sdk so this is just the write path).
async function applyCompletionEffects(
  journey: ProspectJourney,
  profile: ProspectProfile,
  ventureId: VentureId,
): Promise<{ contact_id: string | null; investor_profile_created: boolean }> {
  if (effectsAlreadyApplied(journey)) {
    return { contact_id: null, investor_profile_created: false };
  }

  const intents = runJourneyCompletionEffects({ journey, profile, venture_id: ventureId });
  let contactId: string | null = null;
  let investorProfileCreated = false;

  for (const intent of intents) {
    if (intent.kind === 'upsert_contact') {
      const { data: existing } = await supabase()
        .from('contacts')
        .select('id')
        .filter('metadata->>prospect_id', 'eq', intent.prospect_id)
        .limit(1)
        .maybeSingle();

      if (existing?.id) {
        contactId = existing.id as string;
      } else {
        const { data: inserted, error } = await supabase()
          .from('contacts')
          .insert({
            user_id: intent.user_id,
            venture_id: intent.venture_id,
            name: intent.name,
            email: intent.email,
            type: intent.type,
            status: intent.status,
            source: intent.source,
            lifecycle_stage: intent.lifecycle_stage,
            lead_score: intent.lead_score,
            metadata: intent.metadata,
          })
          .select('id')
          .single();
        if (error) {
          console.warn('[onboarding] upsert_contact failed:', error.message);
          continue;
        }
        contactId = inserted.id as string;
      }
    } else if (intent.kind === 'upsert_investor_profile') {
      if (!contactId) continue;
      const { data: existing } = await supabase()
        .from('capital_investor_profile')
        .select('contact_id')
        .eq('contact_id', contactId)
        .maybeSingle();
      if (existing) continue;

      const { error } = await supabase()
        .from('capital_investor_profile')
        .insert({
          contact_id: contactId,
          venture_id: intent.venture_id,
          contact_type: intent.contact_type,
          stage: intent.stage,
          accreditation_status: intent.accreditation_status,
          kyc_status: intent.kyc_status,
          portal_enabled: intent.portal_enabled,
          lead_score: intent.lead_score,
          total_committed_usd: 0,
          total_funded_usd: 0,
          metadata: intent.metadata,
        });
      if (error) {
        console.warn('[onboarding] upsert_investor_profile failed:', error.message);
        continue;
      }
      investorProfileCreated = true;
    }
  }

  await supabase()
    .from('prospect_journey')
    .update({
      metadata: {
        ...journey.metadata,
        effects_applied: true,
        effects_applied_at: new Date().toISOString(),
        effects_contact_id: contactId,
      },
    })
    .eq('id', journey.id);

  return { contact_id: contactId, investor_profile_created: investorProfileCreated };
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const action = body.action as string;
  if (!action) return NextResponse.json({ error: 'action required' }, { status: 400 });

  try {
    switch (action) {
      case 'create_capture': {
        const email = ((body.email as string) || '').trim().toLowerCase();
        if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });
        const { data, error } = await supabase()
          .from('prospect_capture')
          .upsert({
            email,
            name: (body.name as string) ?? null,
            venture_id: (body.venture_id as string) ?? null,
            channel: (body.channel as string) ?? 'direct',
            metadata: (body.metadata as Record<string, unknown>) ?? {},
          }, { onConflict: 'email,venture_id' })
          .select()
          .single();
        if (error) throw error;
        return NextResponse.json({ capture: data });
      }

      case 'start_journey': {
        const track = body.track as TrackName;
        const email = ((body.email as string) || '').trim().toLowerCase();
        const ventureId = ((body.venture_id as string) || null) as VentureId;
        if (!track || !TRACKS[track]) return NextResponse.json({ error: 'valid track required' }, { status: 400 });
        if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

        const { data: profile, error: profileErr } = await supabase()
          .from('prospect_profile')
          .upsert({
            email,
            full_name: (body.full_name as string) ?? null,
            country: (body.country as string) ?? null,
            role_hint: TRACKS[track].role_hint,
            source_venture_id: ventureId,
            source_channel: (body.source_channel as string) ?? 'direct',
            referrer_user_id: (body.referrer_user_id as string) ?? null,
            metadata: (body.metadata as Record<string, unknown>) ?? {},
          }, { onConflict: 'email' })
          .select()
          .single();
        if (profileErr) throw profileErr;

        const intent = sdkStartJourney({
          track,
          prospect_id: profile.id as string,
          venture_id: ventureId,
        });

        const atlasId = await resolveAgentId(intent.initial_agent_handle);
        const firstStepAgentId = await resolveAgentId(intent.first_step_agent_handle);

        const { data: journey, error: journeyErr } = await supabase()
          .from('prospect_journey')
          .insert({
            prospect_id: profile.id,
            track,
            status: 'active',
            current_step_index: 0,
            steps: intent.steps,
            agent_id: atlasId,
            metadata: { venture_id: ventureId },
          })
          .select()
          .single();
        if (journeyErr) throw journeyErr;

        const stepRows = intent.steps.map((step_name, idx) => ({
          journey_id: journey.id,
          step_name,
          status: idx === 0 ? 'in_progress' : 'pending',
          started_at: idx === 0 ? new Date().toISOString() : null,
          agent_id: idx === 0 ? firstStepAgentId : null,
        }));
        await supabase().from('prospect_journey_step').insert(stepRows);

        await logActivity({
          agent_id: atlasId,
          journey_id: journey.id,
          sub_kind: 'journey_start',
          input: { track, email, venture_id: ventureId },
          output: { first_step: intent.first_step },
          venture_id: ventureId,
        });

        return NextResponse.json({ journey, profile });
      }

      case 'advance_step': {
        const journeyId = body.journey_id as string;
        const finalStatus = (body.status as StepStatus) ?? 'completed';
        const outputs = (body.outputs as Record<string, unknown>) ?? {};
        if (!journeyId) return NextResponse.json({ error: 'journey_id required' }, { status: 400 });

        const { data: journey, error: journeyErr } = await supabase()
          .from('prospect_journey')
          .select('*')
          .eq('id', journeyId)
          .single();
        if (journeyErr || !journey) return NextResponse.json({ error: 'journey not found' }, { status: 404 });
        if (journey.status !== 'active') return NextResponse.json({ error: `journey is ${journey.status}` }, { status: 409 });

        const ventureId = ((journey.metadata?.venture_id as string) || null) as VentureId;

        const intent = sdkAdvanceStep({
          journey,
          venture_id: ventureId,
          from_step_final_status: finalStatus,
          from_step_outputs: outputs,
        });

        if (intent.kind !== 'advance_step') {
          return NextResponse.json({ error: 'unexpected orchestrator intent' }, { status: 500 });
        }

        const now = new Date().toISOString();

        await supabase()
          .from('prospect_journey_step')
          .update({ status: intent.from_step_final_status, completed_at: now, outputs: intent.from_step_outputs })
          .eq('journey_id', journeyId).eq('step_name', intent.from_step).eq('status', 'in_progress');

        let newJourneyAgentId: string | null | undefined = undefined;
        if (intent.new_journey_agent_handle) {
          newJourneyAgentId = await resolveAgentId(intent.new_journey_agent_handle);
        }

        const journeyUpdate: Record<string, unknown> = {
          current_step_index: intent.new_current_step_index,
          status: intent.new_journey_status,
          last_activity_at: now,
        };
        if (newJourneyAgentId !== undefined) journeyUpdate.agent_id = newJourneyAgentId;
        if (intent.new_journey_status === 'completed') journeyUpdate.completed_at = now;

        const { data: updatedJourney } = await supabase()
          .from('prospect_journey')
          .update(journeyUpdate)
          .eq('id', journeyId)
          .select()
          .single();

        if (intent.next_step) {
          const nextAgentId = await resolveAgentId(intent.next_step_agent_handle);
          await supabase()
            .from('prospect_journey_step')
            .update({ status: 'in_progress', started_at: now, agent_id: nextAgentId })
            .eq('journey_id', journeyId).eq('step_name', intent.next_step);
        }

        await logActivity({
          agent_id: updatedJourney?.agent_id ?? journey.agent_id,
          journey_id: journeyId,
          sub_kind:
            intent.new_journey_status === 'completed' ? 'journey_complete'
            : intent.new_journey_agent_handle ? 'handoff'
            : 'step_advance',
          input: { from_step: intent.from_step, final_status: intent.from_step_final_status },
          output: { next_step: intent.next_step },
          venture_id: ventureId,
        });

        // Run completion side effects on transition to 'completed'.
        let effects: { contact_id: string | null; investor_profile_created: boolean } | null = null;
        if (updatedJourney && intent.new_journey_status === 'completed') {
          const { data: profile } = await supabase()
            .from('prospect_profile')
            .select('*')
            .eq('id', updatedJourney.prospect_id)
            .single();
          if (profile) {
            effects = await applyCompletionEffects(
              updatedJourney as ProspectJourney,
              profile as ProspectProfile,
              ventureId,
            );
          }
        }

        return NextResponse.json({ journey: updatedJourney, next_step: intent.next_step, effects });
      }

      case 'get_journey': {
        const journeyId = body.id as string;
        if (!journeyId) return NextResponse.json({ error: 'id required' }, { status: 400 });
        const [{ data: journey }, { data: steps }] = await Promise.all([
          supabase()
            .from('prospect_journey')
            .select('*, agent:agent_id(handle, full_name, title, accent_color), prospect_profile!inner(*)')
            .eq('id', journeyId)
            .single(),
          supabase()
            .from('prospect_journey_step')
            .select('*, agent:agent_id(handle, full_name, title, accent_color)')
            .eq('journey_id', journeyId)
            .order('started_at', { ascending: true, nullsFirst: false }),
        ]);
        if (!journey) return NextResponse.json({ error: 'not found' }, { status: 404 });
        return NextResponse.json({ journey, steps: steps ?? [] });
      }

      default:
        return NextResponse.json({ error: `unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[onboarding] ${action} failed:`, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
