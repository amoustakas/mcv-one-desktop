// api/_handlers/investor-flow.ts
// Consumer-facing money-in flow. Read actions (public): list_public_rounds, get_round_detail, get_commitment.
// Write actions: submit_accreditation (T6.2), create_soft_commit (T6.3), kickoff_payment (T6.4).
// Processor callbacks land in investor-flow-webhook.ts (dedupe + mark commitment funded).
// Routes through the catchall dispatcher at api/[...slug].ts.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient } from './_supabase';
import { withRateLimit, LIMITS } from '../../src/lib/server/rate-limit';

const supabase = getServiceClient();

// ───────────────────────────────────────────────────────────────────────────
// Types (shared across actions)
// ───────────────────────────────────────────────────────────────────────────

type Action =
  | 'list_public_rounds'
  | 'get_round_detail'
  | 'get_commitment'          // T6.7 — FundingStepsView polling
  | 'submit_accreditation'    // T6.2
  | 'create_soft_commit'      // T6.3
  | 'kickoff_payment';        // T6.4

interface RoundRow {
  id: string; venture_id: string; name: string; slug: string;
  round_type: string; raise_lane: string; status: string;
  target_raise: number; soft_cap: number | null; hard_cap: number | null;
  minimum_check: number; maximum_check: number | null; currency: string;
  pre_money_valuation: number | null; price_per_share: number | null; price_per_token: number | null;
  is_public: boolean; public_page_slug: string | null; featured_order: number | null;
  accredited_only: boolean; jurisdiction_restrictions: string[];
  total_committed: number; total_funded: number; total_investors: number;
  open_date: string | null; close_date: string | null; funding_deadline: string | null;
  pitch_deck_url: string | null; data_room_url: string | null; term_sheet_url: string | null;
  token_symbol: string | null; tags: string[];
}

// ───────────────────────────────────────────────────────────────────────────
// Actions
// ───────────────────────────────────────────────────────────────────────────

async function listPublicRounds() {
  const { data: rounds, error } = await supabase
    .from('capital_rounds')
    .select(`
      id, venture_id, name, slug, round_type, raise_lane, status,
      target_raise, soft_cap, hard_cap, minimum_check, maximum_check, currency,
      pre_money_valuation, price_per_share, price_per_token,
      is_public, public_page_slug, featured_order, accredited_only, jurisdiction_restrictions,
      total_committed, total_funded, total_investors,
      open_date, close_date, funding_deadline,
      pitch_deck_url, data_room_url, term_sheet_url, token_symbol, tags
    `)
    .eq('is_public', true)
    .in('status', ['open', 'reserved'])
    .is('deleted_at', null)
    .order('featured_order', { ascending: true, nullsFirst: false })
    .order('open_date', { ascending: false, nullsFirst: false });
  if (error) throw error;

  // Hydrate venture brand for each round
  const roundList = (rounds ?? []) as RoundRow[];
  const ventureIds = Array.from(new Set(roundList.map((r) => r.venture_id)));
  if (ventureIds.length === 0) return { rounds: [] };

  const [{ data: ventures, error: vErr }, { data: brandKits, error: bErr }] = await Promise.all([
    supabase.from('ventures').select('id, name, type, category, funding_stage').in('id', ventureIds),
    supabase.from('venture_brand_kits').select('venture_id, primary_domain, color_primary, color_accent').in('venture_id', ventureIds),
  ]);
  if (vErr) throw vErr;
  if (bErr) throw bErr;

  const ventureById = new Map((ventures ?? []).map((v: { id: string }) => [v.id, v]));
  const brandByVenture = new Map((brandKits ?? []).map((b: { venture_id: string }) => [b.venture_id, b]));

  const hydrated = roundList.map((r) => ({
    ...r,
    venture: ventureById.get(r.venture_id) ?? null,
    brand: brandByVenture.get(r.venture_id) ?? null,
    progress_pct: r.target_raise > 0 ? Math.round((Number(r.total_committed) / Number(r.target_raise)) * 100) : 0,
  }));

  return { rounds: hydrated };
}

async function getRoundDetail(params: { round_id?: string; public_page_slug?: string }) {
  let roundQuery = supabase
    .from('capital_rounds')
    .select('*')
    .eq('is_public', true)
    .is('deleted_at', null);

  if (params.round_id) {
    roundQuery = roundQuery.eq('id', params.round_id);
  } else if (params.public_page_slug) {
    roundQuery = roundQuery.eq('public_page_slug', params.public_page_slug);
  } else {
    throw new Error('round_id or public_page_slug required');
  }

  const { data: round, error } = await roundQuery.maybeSingle();
  if (error) throw error;
  if (!round) return { round: null };

  const [
    { data: venture },
    { data: brandKit },
    { data: allocations },
  ] = await Promise.all([
    supabase.from('ventures').select('id, name, type, category, funding_stage, owner_entity_id').eq('id', round.venture_id).maybeSingle(),
    supabase.from('venture_brand_kits').select('*').eq('venture_id', round.venture_id).maybeSingle(),
    supabase.from('capital_round_ventures').select('venture_id, allocation_pct').eq('round_id', round.id),
  ]);

  return {
    round: {
      ...round,
      venture,
      brand: brandKit,
      allocations: allocations ?? [],
      progress_pct: Number(round.target_raise) > 0
        ? Math.round((Number(round.total_committed) / Number(round.target_raise)) * 100)
        : 0,
    },
  };
}

// ───────────────────────────────────────────────────────────────────────────
// T6.2: submit_accreditation
// ───────────────────────────────────────────────────────────────────────────

interface SubmitAccreditationInput {
  contact_id: string;
  venture_id: string;
  accreditation_method: string;
  jurisdiction: string;
  documents?: Array<{ type: string; url: string; uploaded_at: string }>;
  organization_id?: string;
  wallet_address?: string;
  wallet_chain?: string;
  actor_user_id?: string;
}

async function submitAccreditation(params: SubmitAccreditationInput) {
  const validMethods = ['self_attestation', 'cpa_letter', 'income', 'net_worth', 'professional_cert'];
  if (!params.contact_id) throw new Error('contact_id required');
  if (!params.venture_id) throw new Error('venture_id required');
  if (!params.accreditation_method || !validMethods.includes(params.accreditation_method)) {
    throw new Error(`accreditation_method must be one of: ${validMethods.join(', ')}`);
  }
  if (!params.jurisdiction) throw new Error('jurisdiction required');

  // Fetch existing profile for previous_value on activity log
  const { data: existing } = await supabase
    .from('capital_investor_profile')
    .select('accreditation_status, kyc_status')
    .eq('contact_id', params.contact_id)
    .eq('venture_id', params.venture_id)
    .maybeSingle();

  const previous_status = existing?.accreditation_status ?? 'unknown';
  const now = new Date().toISOString();

  // Upsert profile with pending accreditation + jurisdiction + wallet metadata
  const profileRow = {
    contact_id: params.contact_id,
    venture_id: params.venture_id,
    organization_id: params.organization_id ?? null,
    accreditation_status: 'pending' as const,
    kyc_status: existing?.kyc_status === 'completed' ? 'completed' : 'in_progress',
    jurisdiction: params.jurisdiction,
    wallet_address: params.wallet_address ?? null,
    wallet_chain: params.wallet_chain ?? null,
    last_touch_date: now,
    last_touch_type: 'accreditation_submission',
    metadata: {
      accreditation_method: params.accreditation_method,
      documents: params.documents ?? [],
      submitted_at: now,
    },
  };

  const { data: profile, error: profileErr } = await supabase
    .from('capital_investor_profile')
    .upsert(profileRow, { onConflict: 'contact_id,venture_id' })
    .select('*')
    .single();
  if (profileErr) throw profileErr;

  // Audit-log the submission
  const { error: actErr } = await supabase
    .from('capital_activities')
    .insert({
      venture_id: params.venture_id,
      contact_id: params.contact_id,
      organization_id: params.organization_id ?? null,
      activity_type: 'accreditation_submitted',
      title: `Accreditation submitted (${params.accreditation_method})`,
      description: `Jurisdiction: ${params.jurisdiction}. Method: ${params.accreditation_method}. Documents: ${(params.documents ?? []).length}`,
      previous_value: previous_status,
      new_value: 'pending',
      actor_id: params.actor_user_id ?? params.contact_id,
      actor_type: 'user',
      metadata: { accreditation_method: params.accreditation_method, jurisdiction: params.jurisdiction },
    });
  if (actErr) throw actErr;

  return {
    profile,
    estimated_review_hours: 48,  // surface a UX hint for the client
  };
}

// ───────────────────────────────────────────────────────────────────────────
// T6.3: create_soft_commit (critical business logic)
// ───────────────────────────────────────────────────────────────────────────

interface CreateSoftCommitInput {
  contact_id: string;
  round_id: string;
  amount: number;
  currency?: string;
  payment_method?: string;
  wallet_address?: string;
  wallet_chain?: string;
  notes?: string;
  source?: string;
  referral_contact_id?: string;
  actor_user_id?: string;
}

interface SoftCommitError extends Error {
  code: string;
  http_status: number;
  details?: Record<string, unknown>;
}

function softCommitError(code: string, http_status: number, message: string, details?: Record<string, unknown>): SoftCommitError {
  const err = new Error(message) as SoftCommitError;
  err.code = code;
  err.http_status = http_status;
  err.details = details;
  return err;
}

async function createSoftCommit(params: CreateSoftCommitInput) {
  // 1. Basic input validation
  if (!params.contact_id) throw softCommitError('missing_contact_id', 400, 'contact_id required');
  if (!params.round_id) throw softCommitError('missing_round_id', 400, 'round_id required');
  if (typeof params.amount !== 'number' || !Number.isFinite(params.amount) || params.amount <= 0) {
    throw softCommitError('invalid_amount', 400, 'amount must be a positive number');
  }

  // 2. Load round with public-eligibility filter
  const { data: round, error: rErr } = await supabase
    .from('capital_rounds')
    .select('id, venture_id, status, is_public, accredited_only, minimum_check, maximum_check, currency, close_date, funding_deadline, jurisdiction_restrictions, total_committed, total_investors, deleted_at')
    .eq('id', params.round_id)
    .is('deleted_at', null)
    .maybeSingle();
  if (rErr) throw rErr;
  if (!round) throw softCommitError('round_not_found', 404, `round ${params.round_id} not found or not public`);
  if (!round.is_public) throw softCommitError('round_not_public', 404, 'round is not publicly visible');
  if (!['open', 'reserved'].includes(round.status)) {
    throw softCommitError('round_not_accepting_commitments', 409, `round.status=${round.status} — must be open or reserved`);
  }

  // 3. Check-size bounds
  if (params.amount < Number(round.minimum_check ?? 0)) {
    throw softCommitError('minimum_check_violation', 422, `amount ${params.amount} below minimum_check ${round.minimum_check}`,
      { minimum_check: round.minimum_check, amount: params.amount });
  }
  if (round.maximum_check != null && params.amount > Number(round.maximum_check)) {
    throw softCommitError('maximum_check_violation', 422, `amount ${params.amount} above maximum_check ${round.maximum_check}`,
      { maximum_check: round.maximum_check, amount: params.amount });
  }

  // 4. Deadline check
  const now = Date.now();
  if (round.close_date && new Date(round.close_date).getTime() < now) {
    throw softCommitError('round_closed', 409, 'round close_date has passed');
  }
  if (round.funding_deadline && new Date(round.funding_deadline).getTime() < now) {
    throw softCommitError('funding_deadline_passed', 409, 'funding_deadline has passed');
  }

  // 5. Accreditation check (only when accredited_only=true)
  let investorProfile: { accreditation_status: string; jurisdiction: string | null } | null = null;
  if (round.accredited_only || (Array.isArray(round.jurisdiction_restrictions) && round.jurisdiction_restrictions.length > 0)) {
    const { data: profile, error: pErr } = await supabase
      .from('capital_investor_profile')
      .select('accreditation_status, jurisdiction')
      .eq('contact_id', params.contact_id)
      .eq('venture_id', round.venture_id)
      .maybeSingle();
    if (pErr) throw pErr;
    investorProfile = profile;

    if (round.accredited_only && (!profile || profile.accreditation_status !== 'verified')) {
      throw softCommitError('accreditation_required', 403,
        `round is accredited_only — verified accreditation required (current: ${profile?.accreditation_status ?? 'none'})`,
        { accreditation_status: profile?.accreditation_status ?? null });
    }

    // 6. Jurisdiction check
    const restrictions = (round.jurisdiction_restrictions ?? []) as string[];
    if (restrictions.length > 0) {
      const jurisdiction = profile?.jurisdiction;
      if (!jurisdiction) {
        throw softCommitError('jurisdiction_unknown', 422, 'investor jurisdiction not recorded — complete accreditation first',
          { required_jurisdictions: restrictions });
      }
      const allowed = restrictions.includes(jurisdiction);
      if (!allowed) {
        throw softCommitError('jurisdiction_restricted', 403,
          `jurisdiction ${jurisdiction} not in round restrictions`,
          { jurisdiction, allowed_jurisdictions: restrictions });
      }
    }
  }
  // Avoid unused-variable TS warnings — profile lookup is load-bearing for validation side-effects.
  void investorProfile;

  const currency = params.currency ?? round.currency ?? 'USD';
  // FX: if non-USD, we'd convert via an FX rate service; for v1 assume 1:1 if currency=USD, else store non-USD in amount + amount_usd=amount (caller responsibility when currency differs — M3 wires real FX).
  const amount_usd = currency === 'USD' ? params.amount : params.amount; // TODO: FX rate lookup in M3
  const fx_rate_note = currency !== 'USD' ? { fx_rate_note: 'FX passthrough — M3 wires real rates', fx_rate_used: 1 } : {};

  // 7. Insert commitment
  const nowIso = new Date().toISOString();
  const { data: commitment, error: cErr } = await supabase
    .from('capital_commitments')
    .insert({
      venture_id: round.venture_id,
      contact_id: params.contact_id,
      round_id: params.round_id,
      status: 'soft_committed',
      amount: params.amount,
      currency,
      amount_usd,
      payment_method: params.payment_method ?? null,
      wallet_address: params.wallet_address ?? null,
      notes: params.notes ?? null,
      source: params.source ?? 'investor_portal',
      referral_contact_id: params.referral_contact_id ?? null,
      interest_expressed_at: nowIso,
      soft_committed_at: nowIso,
      metadata: {
        submitted_via: 'investor-flow',
        wallet_chain: params.wallet_chain ?? null,
        ...fx_rate_note,
      },
    })
    .select('*')
    .single();
  if (cErr) throw cErr;

  // 8. Audit event
  const { error: actErr } = await supabase
    .from('capital_activities')
    .insert({
      venture_id: round.venture_id,
      contact_id: params.contact_id,
      round_id: params.round_id,
      commitment_id: commitment.id,
      activity_type: 'soft_commit_created',
      title: `Soft-commit: ${currency} ${params.amount.toLocaleString()} into ${round.id}`,
      description: `Contact ${params.contact_id} soft-committed ${currency} ${params.amount} via ${params.source ?? 'investor_portal'}${params.payment_method ? `, payment_method=${params.payment_method}` : ''}.`,
      previous_value: 'interest',
      new_value: 'soft_committed',
      actor_id: params.actor_user_id ?? params.contact_id,
      actor_type: 'user',
      metadata: {
        amount: params.amount, currency, amount_usd,
        payment_method: params.payment_method ?? null,
        source: params.source ?? 'investor_portal',
      },
    });
  if (actErr) {
    console.error('[investor-flow] capital_activities insert failed — commitment created, audit missing:', actErr);
    // Non-fatal — commitment is the source of truth
  }

  return { commitment };
}

// ───────────────────────────────────────────────────────────────────────────
// T6.4: kickoff_payment — create payment_intent + move commitment to reserved
// ───────────────────────────────────────────────────────────────────────────

interface KickoffPaymentInput {
  commitment_id: string;
  payment_method: string;   // 'stripe_ach' | 'stripe_card' | 'wire' | 'crypto_usdc'
  actor_user_id?: string;
}

interface PaymentError extends Error {
  code: string;
  http_status: number;
  details?: Record<string, unknown>;
}

function paymentError(code: string, http_status: number, message: string, details?: Record<string, unknown>): PaymentError {
  const err = new Error(message) as PaymentError;
  err.code = code;
  err.http_status = http_status;
  err.details = details;
  return err;
}

async function kickoffPayment(params: KickoffPaymentInput) {
  // 1. Input validation
  if (!params.commitment_id) throw paymentError('missing_commitment_id', 400, 'commitment_id required');
  if (!params.payment_method) throw paymentError('missing_payment_method', 400, 'payment_method required');

  // 2. Load commitment
  const { data: commitment, error: cErr } = await supabase
    .from('capital_commitments')
    .select('id, venture_id, contact_id, round_id, status, amount, amount_usd, currency, payment_method, payment_reference')
    .eq('id', params.commitment_id)
    .maybeSingle();
  if (cErr) throw cErr;
  if (!commitment) throw paymentError('commitment_not_found', 404, `commitment ${params.commitment_id} not found`);

  if (!['soft_committed', 'reserved'].includes(commitment.status)) {
    throw paymentError('commitment_wrong_status', 409,
      `commitment.status=${commitment.status} — must be soft_committed or reserved to kick off payment`,
      { current_status: commitment.status });
  }

  const amount = Number(commitment.amount_usd ?? commitment.amount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw paymentError('invalid_amount', 422, `commitment has non-positive amount (${amount})`, { amount });
  }

  // 3. Route payment_method → processor_id via payment_processor_config (lowest priority = primary)
  const { data: processorCfg, error: procErr } = await supabase
    .from('payment_processor_config')
    .select('id, venture_id, payment_method, processor_id, priority, enabled, metadata')
    .eq('venture_id', commitment.venture_id)
    .eq('payment_method', params.payment_method)
    .eq('enabled', true)
    .order('priority', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (procErr) throw procErr;
  if (!processorCfg) {
    throw paymentError('no_processor_configured', 422,
      `no enabled processor for (venture_id=${commitment.venture_id}, payment_method=${params.payment_method})`,
      { venture_id: commitment.venture_id, payment_method: params.payment_method });
  }

  // 4. Create payment_intent row
  const currency = commitment.currency ?? 'USD';
  const { data: intent, error: intErr } = await supabase
    .from('payment_intents')
    .insert({
      venture_id: commitment.venture_id,
      processor_id: processorCfg.processor_id,
      amount,
      currency,
      status: 'pending',
      payment_method: params.payment_method,
      customer_id: commitment.contact_id,
      description: `Capital commitment ${commitment.id}`,
      metadata: {
        commitment_id: commitment.id,
        round_id: commitment.round_id,
        contact_id: commitment.contact_id,
        kicked_off_by: params.actor_user_id ?? commitment.contact_id,
        kicked_off_at: new Date().toISOString(),
      },
    })
    .select('*')
    .single();
  if (intErr) throw intErr;

  // 5. Update commitment → reserved
  const nowIso = new Date().toISOString();
  const { data: updatedCommitment, error: upErr } = await supabase
    .from('capital_commitments')
    .update({
      status: 'reserved',
      reserved_at: nowIso,
      payment_reference: intent.id,
      payment_method: params.payment_method,
      updated_at: nowIso,
    })
    .eq('id', commitment.id)
    .select('*')
    .single();
  if (upErr) throw upErr;

  // 6. Emit activity
  const { error: actErr } = await supabase
    .from('capital_activities')
    .insert({
      venture_id: commitment.venture_id,
      contact_id: commitment.contact_id,
      round_id: commitment.round_id,
      commitment_id: commitment.id,
      activity_type: 'payment_kicked_off',
      title: `Payment kicked off: ${currency} ${amount.toLocaleString()} via ${params.payment_method}`,
      description: `payment_intent ${intent.id} created on processor ${processorCfg.processor_id}.`,
      previous_value: 'soft_committed',
      new_value: 'reserved',
      actor_id: params.actor_user_id ?? commitment.contact_id,
      actor_type: 'user',
      metadata: {
        payment_intent_id: intent.id,
        processor_id: processorCfg.processor_id,
        payment_method: params.payment_method,
        amount,
        currency,
      },
    });
  if (actErr) {
    console.error('[investor-flow] capital_activities insert failed on kickoff_payment — non-fatal:', actErr);
  }

  return { payment_intent: intent, commitment: updatedCommitment };
}

// ───────────────────────────────────────────────────────────────────────────
// Default export — HTTP dispatcher
// ───────────────────────────────────────────────────────────────────────────

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }
  const body = (req.body ?? {}) as { action?: Action; [k: string]: unknown };
  try {
    switch (body.action) {
      case 'list_public_rounds': {
        return res.status(200).json(await listPublicRounds());
      }
      case 'get_round_detail': {
        const round_id = body.round_id as string | undefined;
        const public_page_slug = body.public_page_slug as string | undefined;
        if (!round_id && !public_page_slug) {
          return res.status(400).json({ error: 'round_id or public_page_slug required' });
        }
        return res.status(200).json(await getRoundDetail({ round_id, public_page_slug }));
      }
      case 'get_commitment': {
        const commitment_id = body.commitment_id as string | undefined;
        if (!commitment_id) {
          return res.status(400).json({ error: 'commitment_id required' });
        }
        const { data, error } = await supabase
          .from('capital_commitments')
          .select('*')
          .eq('id', commitment_id)
          .maybeSingle();
        if (error) throw error;
        return res.status(200).json({ commitment: data ?? null });
      }
      case 'submit_accreditation': {
        return res.status(200).json(await submitAccreditation({
          contact_id: body.contact_id as string,
          venture_id: body.venture_id as string,
          accreditation_method: body.accreditation_method as string,
          jurisdiction: body.jurisdiction as string,
          documents: body.documents as SubmitAccreditationInput['documents'],
          organization_id: body.organization_id as string | undefined,
          wallet_address: body.wallet_address as string | undefined,
          wallet_chain: body.wallet_chain as string | undefined,
          actor_user_id: body.actor_user_id as string | undefined,
        }));
      }
      case 'create_soft_commit': {
        try {
          return res.status(200).json(await createSoftCommit({
            contact_id: body.contact_id as string,
            round_id: body.round_id as string,
            amount: Number(body.amount),
            currency: body.currency as string | undefined,
            payment_method: body.payment_method as string | undefined,
            wallet_address: body.wallet_address as string | undefined,
            wallet_chain: body.wallet_chain as string | undefined,
            notes: body.notes as string | undefined,
            source: body.source as string | undefined,
            referral_contact_id: body.referral_contact_id as string | undefined,
            actor_user_id: body.actor_user_id as string | undefined,
          }));
        } catch (err) {
          const anyErr = err as SoftCommitError;
          if (anyErr.code && anyErr.http_status) {
            return res.status(anyErr.http_status).json({
              error: anyErr.message,
              code: anyErr.code,
              ...(anyErr.details ? { details: anyErr.details } : {}),
            });
          }
          throw err;  // fall-through to outer try/catch
        }
      }
      case 'kickoff_payment': {
        try {
          return res.status(200).json(await kickoffPayment({
            commitment_id: body.commitment_id as string,
            payment_method: body.payment_method as string,
            actor_user_id: body.actor_user_id as string | undefined,
          }));
        } catch (err) {
          const anyErr = err as PaymentError;
          if (anyErr.code && anyErr.http_status) {
            return res.status(anyErr.http_status).json({
              error: anyErr.message,
              code: anyErr.code,
              ...(anyErr.details ? { details: anyErr.details } : {}),
            });
          }
          throw err;  // fall-through to outer try/catch
        }
      }
      default: {
        return res.status(400).json({ error: `unknown action: ${body.action}` });
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'investor-flow failed';
    console.error('[investor-flow] error:', message);
    return res.status(500).json({ error: message });
  }
}

export default withRateLimit(LIMITS.INVESTOR_FLOW)(handler);
