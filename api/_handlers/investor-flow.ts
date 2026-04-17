// api/_handlers/investor-flow.ts
// Consumer-facing money-in flow. Read actions (public): list_public_rounds, get_round_detail.
// Write actions land in T6.2/T6.3/T6.4 (submit_accreditation, create_soft_commit, kickoff_payment).
// Routes through the catchall dispatcher at api/[...slug].ts.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient } from './_supabase';

const supabase = getServiceClient();

// ───────────────────────────────────────────────────────────────────────────
// Types (shared across actions)
// ───────────────────────────────────────────────────────────────────────────

type Action =
  | 'list_public_rounds'
  | 'get_round_detail'
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
// Default export — HTTP dispatcher
// ───────────────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
      case 'create_soft_commit':
      case 'kickoff_payment': {
        const phaseMap: Record<string, string> = {
          create_soft_commit: '3',
          kickoff_payment: '4',
        };
        return res.status(501).json({ error: `${body.action} not implemented yet — lands in T6.${phaseMap[body.action]}` });
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
