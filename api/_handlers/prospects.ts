// Prospects API — unified handler for the Phase 2 onboarding wizard + admin surfaces.
// Pattern matches api/_handlers/capital.ts.
//
// Actions:
//   create_capture   — anon lead capture (email + optional name + venture)
//   start_journey    — create profile (or find existing) + journey + step rows
//   advance_step     — progress a journey by one step using the SDK orchestrator
//   get_journey      — read journey + steps + prospect (admin or prospect self)
//   list_journeys    — admin funnel dashboard
//   get_prospect     — admin deep-dive
//   list_captures    — admin raw lead view
//
// Admin gating is light here: the Desktop app is already auth-gated by Clerk
// at the shell level. The public wizard calls this handler via apps/onboarding's
// server-side proxy route. For v0, service-role writes everywhere.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient } from './_supabase';
import {
  startJourney as sdkStartJourney,
  advanceStep as sdkAdvanceStep,
  TRACKS,
  STEPS,
  AGENT_HANDLES,
  type TrackName,
  type StepName,
  type StepStatus,
  type VentureId,
  type AgentHandle,
} from '@mcv/onboarding-sdk';

const supabase = getServiceClient();

// ───────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────

async function resolveAgentIdByHandle(handle: AgentHandle | null): Promise<string | null> {
  if (!handle) return null;
  const { data, error } = await supabase
    .from('agent_persona')
    .select('id')
    .eq('handle', handle)
    .maybeSingle();
  if (error) {
    console.warn(`[prospects] agent lookup failed for ${handle}:`, error.message);
    return null;
  }
  return (data?.id as string) ?? null;
}

// agent_activity_log.action_kind is CHECK-constrained to
// { chat_turn | tool_call | workflow_run | handoff | system }.
// Every onboarding event is a 'workflow_run'; the specific sub-kind
// (journey_start, step_advance, journey_complete) lives in input.sub_kind.
type OnboardingSubKind = 'journey_start' | 'step_advance' | 'journey_complete' | 'handoff';

async function logActivity(params: {
  agent_id: string | null;
  journey_id: string;
  sub_kind: OnboardingSubKind;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  venture_id?: VentureId;
}) {
  try {
    await supabase.from('agent_activity_log').insert({
      agent_id: params.agent_id,
      session_id: params.journey_id,
      action_kind: params.sub_kind === 'handoff' ? 'handoff' : 'workflow_run',
      tool_name: 'onboarding',
      input: { sub_kind: params.sub_kind, ...(params.input ?? {}) },
      output: params.output ?? {},
      venture_id: params.venture_id ?? null,
    });
  } catch (err) {
    console.warn('[prospects] activity log failed:', err instanceof Error ? err.message : err);
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Handler
// ───────────────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.method === 'GET' ? (req.query.action as string) : (req.body?.action as string);
  const params = { ...(req.query || {}), ...(req.body || {}) } as Record<string, unknown>;

  if (!action) return res.status(400).json({ error: 'action required' });

  try {
    switch (action) {
      // ─── Public: capture + journey lifecycle ────────────────────────────

      case 'create_capture': {
        const email = (params.email as string || '').trim().toLowerCase();
        if (!email) return res.status(400).json({ error: 'email required' });
        const { data, error } = await supabase.from('prospect_capture').upsert({
          email,
          name: (params.name as string) ?? null,
          venture_id: (params.venture_id as string) ?? null,
          channel: (params.channel as string) ?? 'direct',
          metadata: (params.metadata as Record<string, unknown>) ?? {},
        }, { onConflict: 'email,venture_id' }).select().single();
        if (error) throw error;
        return res.json({ capture: data });
      }

      case 'start_journey': {
        const track = params.track as TrackName;
        const email = ((params.email as string) || '').trim().toLowerCase();
        const ventureId = ((params.venture_id as string) || null) as VentureId;
        if (!track || !TRACKS[track]) return res.status(400).json({ error: 'valid track required' });
        if (!email) return res.status(400).json({ error: 'email required' });

        // Upsert profile by email.
        const { data: profile, error: profileErr } = await supabase
          .from('prospect_profile')
          .upsert({
            email,
            full_name: (params.full_name as string) ?? null,
            country: (params.country as string) ?? null,
            role_hint: TRACKS[track].role_hint,
            source_venture_id: ventureId,
            source_channel: (params.source_channel as string) ?? 'direct',
            referrer_user_id: (params.referrer_user_id as string) ?? null,
            metadata: (params.metadata as Record<string, unknown>) ?? {},
          }, { onConflict: 'email' })
          .select()
          .single();
        if (profileErr) throw profileErr;

        // Compute the start intent from the SDK.
        const intent = sdkStartJourney({
          track,
          prospect_id: profile.id as string,
          venture_id: ventureId,
        });

        const atlasId = await resolveAgentIdByHandle(intent.initial_agent_handle);
        const firstStepAgentId = await resolveAgentIdByHandle(intent.first_step_agent_handle);

        // Insert journey.
        const { data: journey, error: journeyErr } = await supabase
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

        // Insert step rows (pending for all; first one in_progress with started_at).
        const stepRows = intent.steps.map((step_name, idx) => ({
          journey_id: journey.id,
          step_name,
          status: idx === 0 ? 'in_progress' : 'pending',
          started_at: idx === 0 ? new Date().toISOString() : null,
          agent_id: idx === 0 ? firstStepAgentId : null,
        }));
        const { error: stepErr } = await supabase.from('prospect_journey_step').insert(stepRows);
        if (stepErr) throw stepErr;

        await logActivity({
          agent_id: atlasId,
          journey_id: journey.id,
          sub_kind: 'journey_start',
          input: { track, email, venture_id: ventureId },
          output: { journey_id: journey.id, first_step: intent.first_step },
          venture_id: ventureId,
        });

        return res.json({ journey, profile });
      }

      case 'advance_step': {
        const journeyId = params.journey_id as string;
        const finalStatus = (params.status as StepStatus) ?? 'completed';
        const outputs = (params.outputs as Record<string, unknown>) ?? {};
        if (!journeyId) return res.status(400).json({ error: 'journey_id required' });

        // Load journey.
        const { data: journey, error: journeyErr } = await supabase
          .from('prospect_journey')
          .select('*')
          .eq('id', journeyId)
          .single();
        if (journeyErr || !journey) return res.status(404).json({ error: 'journey not found' });
        if (journey.status !== 'active') return res.status(409).json({ error: `journey is ${journey.status}` });

        const ventureId = ((journey.metadata?.venture_id as string) || null) as VentureId;

        const intent = sdkAdvanceStep({
          journey: {
            id: journey.id,
            prospect_id: journey.prospect_id,
            track: journey.track,
            status: journey.status,
            current_step_index: journey.current_step_index,
            steps: journey.steps,
            agent_id: journey.agent_id,
            started_at: journey.started_at,
            last_activity_at: journey.last_activity_at,
            completed_at: journey.completed_at,
            metadata: journey.metadata,
          },
          venture_id: ventureId,
          from_step_final_status: finalStatus,
          from_step_outputs: outputs,
        });

        if (intent.kind !== 'advance_step') {
          // Should not happen — advanceStep always returns advance_step kind.
          return res.status(500).json({ error: 'unexpected orchestrator intent' });
        }

        const now = new Date().toISOString();

        // 1. Close out the current step.
        await supabase
          .from('prospect_journey_step')
          .update({
            status: intent.from_step_final_status,
            completed_at: now,
            outputs: intent.from_step_outputs,
          })
          .eq('journey_id', journeyId)
          .eq('step_name', intent.from_step)
          .eq('status', 'in_progress');

        // 2. Prepare journey update — flip agent_id when agent_assignment completed.
        let newJourneyAgentId: string | null | undefined = undefined;
        if (intent.new_journey_agent_handle) {
          newJourneyAgentId = await resolveAgentIdByHandle(intent.new_journey_agent_handle);
        }

        // 3. Advance journey index + status.
        const journeyUpdate: Record<string, unknown> = {
          current_step_index: intent.new_current_step_index,
          status: intent.new_journey_status,
          last_activity_at: now,
        };
        if (newJourneyAgentId !== undefined) journeyUpdate.agent_id = newJourneyAgentId;
        if (intent.new_journey_status === 'completed') journeyUpdate.completed_at = now;

        const { data: updatedJourney, error: updateErr } = await supabase
          .from('prospect_journey')
          .update(journeyUpdate)
          .eq('id', journeyId)
          .select()
          .single();
        if (updateErr) throw updateErr;

        // 4. If there's a next step, flip it to in_progress.
        if (intent.next_step) {
          const nextAgentId = await resolveAgentIdByHandle(intent.next_step_agent_handle);
          await supabase
            .from('prospect_journey_step')
            .update({
              status: 'in_progress',
              started_at: now,
              agent_id: nextAgentId,
            })
            .eq('journey_id', journeyId)
            .eq('step_name', intent.next_step);
        }

        await logActivity({
          agent_id: updatedJourney.agent_id ?? journey.agent_id,
          journey_id: journeyId,
          sub_kind:
            intent.new_journey_status === 'completed' ? 'journey_complete'
            : intent.new_journey_agent_handle ? 'handoff'
            : 'step_advance',
          input: { from_step: intent.from_step, final_status: intent.from_step_final_status },
          output: { next_step: intent.next_step, new_status: intent.new_journey_status },
          venture_id: ventureId,
        });

        return res.json({ journey: updatedJourney, next_step: intent.next_step });
      }

      // ─── Admin reads ────────────────────────────────────────────────────

      case 'list_journeys': {
        const status = params.status as string | undefined;
        const track = params.track as string | undefined;
        let query = supabase
          .from('prospect_journey')
          .select(`
            *,
            prospect_profile!inner(email, full_name, country, role_hint, source_venture_id),
            agent:agent_id(id, handle, full_name, title, accent_color)
          `)
          .order('last_activity_at', { ascending: false })
          .limit(100);
        if (status) query = query.eq('status', status);
        if (track) query = query.eq('track', track);
        const { data, error } = await query;
        if (error) throw error;
        return res.json({ journeys: data ?? [] });
      }

      case 'get_journey': {
        const journeyId = params.id as string;
        if (!journeyId) return res.status(400).json({ error: 'id required' });
        const [{ data: journey, error: jErr }, { data: steps, error: sErr }] = await Promise.all([
          supabase
            .from('prospect_journey')
            .select(`
              *,
              prospect_profile!inner(*),
              agent:agent_id(id, handle, full_name, title, accent_color)
            `)
            .eq('id', journeyId)
            .single(),
          supabase
            .from('prospect_journey_step')
            .select(`
              *,
              agent:agent_id(id, handle, full_name, title, accent_color)
            `)
            .eq('journey_id', journeyId)
            .order('started_at', { ascending: true, nullsFirst: false }),
        ]);
        if (jErr || !journey) return res.status(404).json({ error: 'journey not found' });
        if (sErr) throw sErr;
        return res.json({ journey, steps: steps ?? [] });
      }

      case 'get_prospect': {
        const email = ((params.email as string) || '').trim().toLowerCase();
        const id = params.id as string;
        let query = supabase.from('prospect_profile').select('*');
        if (id) query = query.eq('id', id);
        else if (email) query = query.eq('email', email);
        else return res.status(400).json({ error: 'id or email required' });
        const { data, error } = await query.maybeSingle();
        if (error) throw error;
        return res.json({ prospect: data });
      }

      case 'list_captures': {
        const { data, error } = await supabase
          .from('prospect_capture')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);
        if (error) throw error;
        return res.json({ captures: data ?? [] });
      }

      // ─── Meta ───────────────────────────────────────────────────────────

      case 'list_tracks': {
        return res.json({
          tracks: Object.values(TRACKS),
          steps: Object.values(STEPS),
          agents: AGENT_HANDLES,
        });
      }

      default:
        return res.status(400).json({ error: `unknown action: ${action}` });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[prospects] ${action} failed:`, msg);
    return res.status(500).json({ error: msg });
  }
}
