-- Demo capital_rounds — four live rounds to exercise RoundBrowseModal.
--
-- Three Futurestate rounds (two accredited-only, one retail-open) plus one
-- BetEdge token pre-sale. Matches the plan's narrative: "Hannah Sterling
-- opens — here's what's active for you right now, three in Futurestate,
-- one in BetEdge. Which would you like to look at?"
--
-- Slug-based idempotency via WHERE NOT EXISTS so re-runs are safe without
-- needing a unique index.
--
-- Enum notes (DB check constraints — honor these when adding rounds):
--   round_type ∈ {safe, convertible_note, priced_equity, token_sale,
--                 token_presale, rwa_tranche, hybrid_equity_token,
--                 crowdfund_reg_cf, crowdfund_reg_d, crowdfund_mi_45,
--                 revenue_share}
--   raise_lane ∈ {token, equity, hybrid}
--   regulatory_framework ∈ {reg_d_506c, reg_d_506b, reg_cf, reg_a, reg_s,
--                           mi_45_110, mi_45_106, token_utility,
--                           token_security, exempt, other}

begin;

insert into capital_rounds
  (venture_id, name, slug, description, round_type, raise_lane, status,
   target_raise, hard_cap, minimum_check, maximum_check, currency,
   regulatory_framework, accredited_only, open_date, close_date)
select v.venture_id, v.name, v.slug, v.description, v.round_type, v.raise_lane, v.status,
       v.target_raise, v.hard_cap, v.minimum_check, v.maximum_check, v.currency,
       v.regulatory_framework, v.accredited_only, v.open_date, v.close_date
from (values
  (
    'futurestate', 'Futurestate RWA Seed II', 'futurestate-rwa-seed-2',
    'Seed round for the next cohort of tokenized real-estate assets. 506(c) to accredited investors.',
    'priced_equity', 'equity', 'open',
    2500000::numeric, 3500000::numeric, 25000::numeric, 500000::numeric, 'USD',
    'reg_d_506c', true, now() - interval '3 days', now() + interval '60 days'
  ),
  (
    'futurestate', 'Futurestate Ocean Drive LP', 'futurestate-ocean-drive-lp',
    'Single-asset LP for a Miami waterfront mixed-use. Preferred return 8%, promote to LPs at 15% IRR.',
    'priced_equity', 'equity', 'open',
    1200000::numeric, 1500000::numeric, 50000::numeric, 250000::numeric, 'USD',
    'reg_d_506c', true, now() - interval '7 days', now() + interval '30 days'
  ),
  (
    'futurestate', 'Futurestate Starter Tranche', 'futurestate-starter-tranche',
    'Retail-open RWA tranche, 12-month hold, 7% fixed coupon. First deal open to non-accredited investors under Reg A.',
    'rwa_tranche', 'equity', 'open',
    500000::numeric, 750000::numeric, 1000::numeric, 50000::numeric, 'USD',
    'reg_a', false, now() - interval '1 day', now() + interval '90 days'
  ),
  (
    'betedge', 'BetEdge Token Pre-Sale', 'betedge-token-presale',
    'Discounted pre-sale of the $EDGE token for early ecosystem supporters. 18-month linear vest post-TGE.',
    'token_presale', 'token', 'open',
    1500000::numeric, 2000000::numeric, 25000::numeric, 200000::numeric, 'USD',
    'reg_d_506c', true, now() - interval '2 days', now() + interval '45 days'
  )
) as v(venture_id, name, slug, description, round_type, raise_lane, status,
       target_raise, hard_cap, minimum_check, maximum_check, currency,
       regulatory_framework, accredited_only, open_date, close_date)
where not exists (select 1 from capital_rounds r where r.slug = v.slug);

commit;

-- Post-apply verification:
-- select name, venture_id, status, accredited_only, minimum_check, target_raise
--   from capital_rounds where status = 'open' order by venture_id, name;
