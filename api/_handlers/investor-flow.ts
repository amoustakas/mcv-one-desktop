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
      case 'submit_accreditation':
      case 'create_soft_commit':
      case 'kickoff_payment': {
        const phaseMap: Record<string, string> = {
          submit_accreditation: '2',
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
