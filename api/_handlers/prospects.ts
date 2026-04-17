// Prospects API — unified handler for the Phase 2 onboarding wizard + admin surfaces.
// Pattern matches api/_handlers/capital.ts.
//
// Actions:
//   create_capture            — anon lead capture (email + optional name + venture)
//   start_journey             — create profile (or find existing) + journey + step rows
//   advance_step              — progress a journey by one step using the SDK orchestrator
//   create_operator_prospect  — operator-seeded prospect_profile + journey with operator intel fields
//   get_journey               — read journey + steps + prospect (admin or prospect self)
//   list_journeys             — admin funnel dashboard
//   get_prospect              — admin deep-dive
//   list_captures             — admin raw lead view
//
// Admin gating is light here: the Desktop app is already auth-gated by Clerk
// at the shell level. The public wizard calls this handler via apps/onboarding's
// server-side proxy route. For v0, service-role writes everywhere.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient } from './_supabase';
import { withRateLimit, LIMITS } from '../../src/lib/server/rate-limit';
import {
  requireVentureScope,
  VentureScopeError,
  respondToScopeError,
} from '../../src/lib/server/require-venture-scope';
import { requestLogger } from '../../src/lib/server/logger';
import {
  startJourney as sdkStartJourney,
  advanceStep as sdkAdvanceStep,
  runJourneyCompletionEffects,
  effectsAlreadyApplied,
  TRACKS,
  STEPS,
  AGENT_HANDLES,
  type TrackName,
  type StepName,
  type StepStatus,
  type VentureId,
  type AgentHandle,
  type CompletionIntent,
  type ProspectJourney,
  type ProspectProfile,
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
// Completion-effects executor
// Translates the SDK's pure intents into actual ecosystem-table writes:
//   upsert_contact          → contacts (idempotent by metadata.prospect_id)
//   upsert_investor_profile → capital_investor_profile (idempotent by contact_id)
// Sets journey.metadata.effects_applied = true on success so retries no-op.
// ───────────────────────────────────────────────────────────────────────────

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
      // Idempotency: find existing by metadata->>prospect_id, else insert.
      const { data: existing } = await supabase
        .from('contacts')
        .select('id')
        .filter('metadata->>prospect_id', 'eq', intent.prospect_id)
        .limit(1)
        .maybeSingle();

      if (existing?.id) {
        contactId = existing.id as string;
      } else {
        const { data: inserted, error } = await supabase
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
          console.warn('[prospects] upsert_contact failed:', error.message);
          continue;
        }
        contactId = inserted.id as string;
      }
    } else if (intent.kind === 'upsert_investor_profile') {
      if (!contactId) {
        console.warn('[prospects] upsert_investor_profile has no contact_id — skipping');
        continue;
      }
      // Idempotency: contact_id is the PK on capital_investor_profile.
      const { data: existing } = await supabase
        .from('capital_investor_profile')
        .select('contact_id')
        .eq('contact_id', contactId)
        .maybeSingle();
      if (existing) continue;

      const { error } = await supabase
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
        console.warn('[prospects] upsert_investor_profile failed:', error.message);
        continue;
      }
      investorProfileCreated = true;
    }
  }

  // Mark applied so re-completion calls are no-ops.
  await supabase
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

// ───────────────────────────────────────────────────────────────────────────
// Handler
// ───────────────────────────────────────────────────────────────────────────

async function handler(req: VercelRequest, res: VercelResponse) {
  const { log: __log, correlationId: __correlationId } = requestLogger(req as unknown as { headers?: Record<string, unknown>; url?: string; method?: string });
  try { res.setHeader('x-correlation-id', __correlationId); } catch { /* headers already sent */ }
  const __start = Date.now();
  __log.info({ event: 'request_in' });
  res.on('finish', () => {
    __log.info({ event: 'request_out', status: res.statusCode, duration_ms: Date.now() - __start });
  });
  res.on('close', () => {
    if (!res.writableEnded) {
      __log.warn({ event: 'request_abort', duration_ms: Date.now() - __start });
    }
  });
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

        // Run completion effects on transition to 'completed' — produces
        // contacts + (for investor tracks) capital_investor_profile rows.
        // Idempotent via journey.metadata.effects_applied.
        let effects: { contact_id: string | null; investor_profile_created: boolean } | null = null;
        if (intent.new_journey_status === 'completed') {
          const { data: profile } = await supabase
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
            await logActivity({
              agent_id: updatedJourney.agent_id ?? journey.agent_id,
              journey_id: journeyId,
              sub_kind: 'journey_complete',
              input: { trigger: 'completion_effects' },
              output: effects,
              venture_id: ventureId,
            });
          }
        }

        return res.json({ journey: updatedJourney, next_step: intent.next_step, effects });
      }

      // ─── Operator-seeded prospect intake ────────────────────────────────

      case 'create_operator_prospect': {
        const email = ((params.email as string) || '').trim().toLowerCase();
        const track = params.track as TrackName;
        if (!email) return res.status(400).json({ error: 'email required' });
        if (!track || !TRACKS[track]) return res.status(400).json({ error: 'valid track required' });

        const sourceVentureId = ((params.source_venture_id as string) ?? 'futurestate') as VentureId;

        // M5 I3.4 — operator intake is venture-bound. Enforce that the
        // authenticated operator has venture_scope matching source_venture_id
        // (or mcv_admin role). Public capture / start_journey / advance_step
        // remain unscoped — those are wizard-driven lead flows, and auth sits
        // at the Desktop shell for authenticated operator contexts.
        try {
          await requireVentureScope(req, sourceVentureId);
        } catch (scopeErr) {
          if (scopeErr instanceof VentureScopeError) {
            respondToScopeError(res, scopeErr);
            return;
          }
          throw scopeErr;
        }

        // Resolve assigned persona: explicit id wins, otherwise resolve by handle.
        let agentId: string | null = (params.assigned_persona_id as string) ?? null;
        const assignedHandle = params.assigned_persona_handle as string | undefined;
        if (!agentId && assignedHandle) {
          agentId = await resolveAgentIdByHandle(assignedHandle as AgentHandle);
        }

        // 1. Upsert prospect_profile (singular) with operator-authored intel fields.
        const { data: profile, error: profileErr } = await supabase
          .from('prospect_profile')
          .upsert({
            email,
            full_name: (params.full_name as string) ?? null,
            country: (params.country as string) ?? null,
            role_hint: (params.role_hint as string) ?? TRACKS[track].role_hint,
            source_venture_id: sourceVentureId,
            intake_source: 'operator',
            operator_notes: (params.operator_notes as string) ?? null,
            relationship_history: (params.relationship_history as string) ?? null,
            prior_deals: (params.prior_deals as unknown[]) ?? [],
            aum_estimate: (params.aum_estimate as number) ?? null,
            check_size_range: (params.check_size_range as string) ?? null,
            investor_thesis: (params.investor_thesis as string) ?? null,
            social_profiles: (params.social_profiles as Record<string, string>) ?? {},
            priority: (params.priority as string) ?? 'medium',
            archetype: (params.archetype as string) ?? null,
          }, { onConflict: 'email' })
          .select()
          .single();
        if (profileErr) throw profileErr;

        // 2. Create prospect_journey (singular) tied to track + assigned persona.
        //    prospect_journey FK column is prospect_id (matches start_journey above).
        const { data: journey, error: journeyErr } = await supabase
          .from('prospect_journey')
          .insert({
            prospect_id: profile.id,
            track,
            status: 'active',
            current_step_index: 0,
            agent_id: agentId,
            metadata: { venture_id: sourceVentureId, intake_source: 'operator' },
          })
          .select()
          .single();
        if (journeyErr) throw journeyErr;

        await logActivity({
          agent_id: agentId,
          journey_id: journey.id,
          sub_kind: 'journey_start',
          input: { track, email, venture_id: sourceVentureId, intake_source: 'operator' },
          output: { journey_id: journey.id, prospect_id: profile.id },
          venture_id: sourceVentureId,
        });

        return res.json({ profile, journey });
      }

      // ─── Admin reads ────────────────────────────────────────────────────

      case 'list_journeys': {
        const status = params.status as string | undefined;
        const track = params.track as string | undefined;
        let query = supabase
          .from('prospect_journey')
          .select(`
            *,
            prospect_profile!inner(email, full_name, country, role_hint, source_venture_id, intake_source),
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

        // Ecosystem rows produced by the journey (null until completion).
        // Lookup by metadata->>prospect_id (set by completion-effects helper)
        // and follow the contact_id PK into capital_investor_profile.
        let ecosystem: { contact: unknown; investor_profile: unknown } | null = null;
        if (journey.metadata?.effects_applied) {
          const prospectId = (journey as { prospect_id: string }).prospect_id;
          const { data: contact } = await supabase
            .from('contacts')
            .select('id, name, email, type, status, lifecycle_stage, lead_score, source, venture_id, metadata, created_at')
            .filter('metadata->>prospect_id', 'eq', prospectId)
            .limit(1)
            .maybeSingle();

          let investorProfile: unknown = null;
          if (contact?.id) {
            const { data: inv } = await supabase
              .from('capital_investor_profile')
              .select('contact_id, venture_id, contact_type, stage, accreditation_status, kyc_status, portal_enabled, lead_score, total_committed_usd, total_funded_usd, metadata, created_at')
              .eq('contact_id', contact.id)
              .maybeSingle();
            investorProfile = inv ?? null;
          }
          ecosystem = { contact: contact ?? null, investor_profile: investorProfile };
        }

        return res.json({ journey, steps: steps ?? [], ecosystem });
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

export default withRateLimit(LIMITS.PROSPECT_INTAKE)(handler);
