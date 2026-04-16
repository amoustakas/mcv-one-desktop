// scripts/seed-capital-foundation.ts
// Seeds LegalEntity + Treasury + RoyaltyGraph (+ layers) + ComplianceRuleSet
// (+ rules) + DistributionConfig rows for all 7 EdgeIQ ventures.
//
// Idempotent: UPSERT by natural keys. Run with:
//   pnpm tsx scripts/seed-capital-foundation.ts
// or:
//   node --loader tsx scripts/seed-capital-foundation.ts
//
// Requires env: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from '@supabase/supabase-js';

type AnyRecord = Record<string, unknown>;

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// ─── LegalEntity catalog ────────────────────────────────────────────────

const LEGAL_ENTITIES = [
  { id: 'edgeiq-holdings',    label: 'EdgeIQ Holdings Inc.',  jurisdiction: 'CA-ON', entity_type: 'corporation', parent_entity_id: null },
  { id: 'futurestate-gp',     label: 'Futurestate GP Inc.',    jurisdiction: 'CA-ON', entity_type: 'corporation', parent_entity_id: 'edgeiq-holdings' },
  { id: 'betedge-ops',        label: 'BetEdge Operations Inc.',jurisdiction: 'CA-ON', entity_type: 'corporation', parent_entity_id: 'edgeiq-holdings' },
  { id: 'warforge-studios',   label: 'WarForge Studios Ltd.',  jurisdiction: 'CA-ON', entity_type: 'corporation', parent_entity_id: 'edgeiq-holdings' },
  { id: 'mcvgg-foundation',   label: 'MCV.gg Foundation',      jurisdiction: 'CAYMAN',entity_type: 'foundation',  parent_entity_id: 'edgeiq-holdings' },
  { id: 'arq-labs',           label: 'ARQ Labs Inc.',          jurisdiction: 'US-DE', entity_type: 'corporation', parent_entity_id: 'edgeiq-holdings' },
  { id: 'edgeiq-markets',     label: 'EdgeIQ Markets Inc.',    jurisdiction: 'CA-ON', entity_type: 'corporation', parent_entity_id: 'edgeiq-holdings' },
  { id: 'mcv-platform',       label: 'MCV Platform (EdgeIQ)',  jurisdiction: 'CA-ON', entity_type: 'corporation', parent_entity_id: 'edgeiq-holdings' },
];

// ─── Venture catalog (seven) ────────────────────────────────────────────

interface VentureSeed {
  ventureId: string;
  ownerEntityId: string;
  treasuries: Array<{ label: string; kind: string; jurisdiction: string; currency: string; custodian: string }>;
  royalty: { label: string; layers: Array<{ sequence: number; label: string; kind: string; recipient_type: string; recipient_id: string; bps: number; condition_expr?: string }> };
  ruleSets: Array<{ label: string; jurisdiction: string; rules: Array<{ rule_type: string; scope: string; config: AnyRecord; priority?: number }> }>;
  flows: Array<{ flow_kind: string; billing_mode: string; default_payee_strategy: string; default_currency: string; allowed_currencies: string[]; split_rules?: AnyRecord[] }>;
  tokenSymbol?: string;
  launchStage: string;
}

const VENTURES: VentureSeed[] = [
  {
    ventureId: 'futurestate',
    ownerEntityId: 'futurestate-gp',
    launchStage: 'beta',
    treasuries: [
      { label: 'Futurestate Ops CAD', kind: 'stripe_connect', jurisdiction: 'CA-ON', currency: 'CAD', custodian: 'stripe' },
      { label: 'Futurestate Trust CAD', kind: 'trust_account', jurisdiction: 'CA-ON', currency: 'CAD', custodian: 'trust-co-1' },
    ],
    royalty: {
      label: 'Futurestate Platform Rake v1',
      layers: [
        { sequence: 1, label: 'edgeiq-holdings',   kind: 'platform_rake', recipient_type: 'external_entity', recipient_id: 'edgeiq-holdings', bps: 250 },
        { sequence: 2, label: 'venture-treasury',  kind: 'venture_rake',  recipient_type: 'treasury', recipient_id: 'futurestate-ops', bps: 500 },
        { sequence: 3, label: 'reserve',           kind: 'reserve',       recipient_type: 'treasury', recipient_id: 'futurestate-trust', bps: 100 },
      ],
    },
    ruleSets: [
      {
        label: 'Futurestate CA-ON Retail', jurisdiction: 'CA-ON',
        rules: [
          { rule_type: 'ofac', scope: 'intake', config: { requireScreening: true }, priority: 10 },
          { rule_type: 'jurisdiction_allowlist', scope: 'intake', config: { countries: ['CA-ON','CA-BC','CA-AB','CA-QC','US-NY','US-CA','US-DE','US-FL','US-TX'] }, priority: 20 },
          { rule_type: 'age_min', scope: 'intake', config: { minAge: 18 }, priority: 30 },
          { rule_type: 'hold_period', scope: 'distribution', config: { minDays: 90 }, priority: 40 },
        ],
      },
    ],
    flows: [
      { flow_kind: 're_precon_deposit',     billing_mode: 'immediate_on_committed', default_payee_strategy: 'property_spv',    default_currency: 'CAD', allowed_currencies: ['CAD','USD'] },
      { flow_kind: 're_construction_draw',  billing_mode: 'milestone',               default_payee_strategy: 'sponsor_manager', default_currency: 'CAD', allowed_currencies: ['CAD'] },
      { flow_kind: 're_yield_distribution', billing_mode: 'scheduled',               default_payee_strategy: 'split',           default_currency: 'CAD', allowed_currencies: ['CAD','USD','USDC'], split_rules: [{ role: 'investor', bps: 9000 }, { role: 'platform', bps: 250 }, { role: 'sponsor', bps: 750 }] },
      { flow_kind: 're_capital_call',       billing_mode: 'immediate_on_committed', default_payee_strategy: 'property_spv',    default_currency: 'CAD', allowed_currencies: ['CAD','USD'] },
      { flow_kind: 'vendor_bill',           billing_mode: 'manual',                  default_payee_strategy: 'custom_vendor',   default_currency: 'CAD', allowed_currencies: ['CAD','USD'] },
    ],
  },
  {
    ventureId: 'betedge',
    ownerEntityId: 'betedge-ops',
    launchStage: 'alpha',
    tokenSymbol: 'EDGE',
    treasuries: [
      { label: 'BetEdge Wager Pool CAD', kind: 'stripe_connect', jurisdiction: 'CA-ON', currency: 'CAD', custodian: 'stripe' },
      { label: 'BetEdge Rewards SPL',     kind: 'spl_token',     jurisdiction: 'CAYMAN', currency: 'EDGE', custodian: 'self' },
    ],
    royalty: {
      label: 'BetEdge Creator Economy v1',
      layers: [
        { sequence: 1, label: 'edgeiq-holdings',  kind: 'platform_rake',  recipient_type: 'external_entity', recipient_id: 'edgeiq-holdings', bps: 300 },
        { sequence: 2, label: 'venture-treasury', kind: 'venture_rake',   recipient_type: 'treasury', recipient_id: 'betedge-wager-pool', bps: 700 },
        { sequence: 3, label: 'creator-pool',     kind: 'creator_share',  recipient_type: 'pool', recipient_id: 'betedge-creator-pool', bps: 200, condition_expr: 'flowKind==ENGAGEMENT_PAYOUT' },
        { sequence: 4, label: 'referrer',         kind: 'affiliate',      recipient_type: 'user', recipient_id: 'dynamic', bps: 500, condition_expr: 'flowKind==REFERRAL_REWARD' },
      ],
    },
    ruleSets: [
      {
        label: 'BetEdge Ontario iGaming', jurisdiction: 'CA-ON',
        rules: [
          { rule_type: 'age_min', scope: 'intake', config: { minAge: 19 }, priority: 10 },
          { rule_type: 'age_min', scope: 'wager',  config: { minAge: 19 }, priority: 10 },
          { rule_type: 'jurisdiction_allowlist', scope: 'wager', config: { countries: ['CA-ON'] }, priority: 20 },
          { rule_type: 'wager_limit_daily', scope: 'wager', config: { maxDailyUsd: 10000 }, priority: 30 },
          { rule_type: 'responsible_gaming', scope: 'wager', config: {}, priority: 40 },
          { rule_type: 'cooling_off_period', scope: 'withdrawal', config: { minHours: 24 }, priority: 50 },
          { rule_type: 'vpn_block', scope: 'wager', config: {}, priority: 60 },
        ],
      },
    ],
    flows: [
      { flow_kind: 'referral_reward',    billing_mode: 'immediate_on_committed', default_payee_strategy: 'algorithmic', default_currency: 'USD',  allowed_currencies: ['USD','EDGE'] },
      { flow_kind: 'quest_reward',       billing_mode: 'immediate_on_committed', default_payee_strategy: 'split',        default_currency: 'EDGE', allowed_currencies: ['EDGE','USD'], split_rules: [{ role: 'player', bps: 9500 }, { role: 'platform', bps: 500 }] },
      { flow_kind: 'engagement_payout',  billing_mode: 'scheduled',               default_payee_strategy: 'algorithmic', default_currency: 'USD',  allowed_currencies: ['USD','EDGE'] },
      { flow_kind: 'token_presale',      billing_mode: 'admin_batch',             default_payee_strategy: 'platform_treasury', default_currency: 'USD', allowed_currencies: ['USD','USDC','SOL'] },
      { flow_kind: 'token_liquidity_provision', billing_mode: 'scheduled',        default_payee_strategy: 'platform_treasury', default_currency: 'USDC',allowed_currencies: ['USDC','SOL','EDGE'] },
    ],
  },
  {
    ventureId: 'warforge',
    ownerEntityId: 'warforge-studios',
    launchStage: 'prototype',
    treasuries: [
      { label: 'WarForge Royalty Pool USDC', kind: 'spl_token', jurisdiction: 'CAYMAN', currency: 'USDC', custodian: 'self' },
    ],
    royalty: {
      label: 'WarForge IP Rake v1',
      layers: [
        { sequence: 1, label: 'edgeiq-holdings',   kind: 'platform_rake',  recipient_type: 'external_entity', recipient_id: 'edgeiq-holdings', bps: 400 },
        { sequence: 2, label: 'venture-treasury',  kind: 'venture_rake',   recipient_type: 'treasury', recipient_id: 'warforge-royalty-pool', bps: 600 },
        { sequence: 3, label: 'creator-ip',        kind: 'ip_royalty',     recipient_type: 'user', recipient_id: 'dynamic', bps: 2500, condition_expr: 'flowKind==ROYALTY_PAYOUT' },
      ],
    },
    ruleSets: [],
    flows: [
      { flow_kind: 'royalty_payout',    billing_mode: 'scheduled',   default_payee_strategy: 'split',             default_currency: 'USDC', allowed_currencies: ['USDC','SOL'] },
      { flow_kind: 'quest_reward',      billing_mode: 'immediate_on_committed', default_payee_strategy: 'platform_treasury', default_currency: 'USDC', allowed_currencies: ['USDC'] },
      { flow_kind: 'token_tge_launch',  billing_mode: 'admin_batch', default_payee_strategy: 'platform_treasury', default_currency: 'SOL',  allowed_currencies: ['SOL','USDC'] },
    ],
  },
  {
    ventureId: 'mcvgg',
    ownerEntityId: 'mcvgg-foundation',
    launchStage: 'alpha',
    tokenSymbol: 'EDGE',
    treasuries: [
      { label: 'MCV.gg EDGE Treasury', kind: 'multi_sig', jurisdiction: 'CAYMAN', currency: 'EDGE', custodian: 'self' },
      { label: 'MCV.gg LP Pool',       kind: 'spl_token', jurisdiction: 'CAYMAN', currency: 'USDC', custodian: 'self' },
    ],
    royalty: {
      label: 'MCV.gg Token v1',
      layers: [
        { sequence: 1, label: 'edgeiq-holdings',  kind: 'platform_rake',  recipient_type: 'external_entity', recipient_id: 'edgeiq-holdings', bps: 500 },
        { sequence: 2, label: 'foundation-treasury', kind: 'venture_rake', recipient_type: 'treasury', recipient_id: 'mcvgg-edge-treasury', bps: 500 },
      ],
    },
    ruleSets: [
      {
        label: 'MCV.gg Token Sale Global', jurisdiction: 'GLOBAL',
        rules: [
          { rule_type: 'jurisdiction_blocklist', scope: 'intake', config: { countries: ['US-*','CN','IR','KP','SY','CU'] }, priority: 10 },
          { rule_type: 'ofac', scope: 'intake', config: { requireScreening: true }, priority: 20 },
          { rule_type: 'max_token_alloc_per_wallet', scope: 'intake', config: { maxTokens: 100000 }, priority: 30 },
        ],
      },
    ],
    flows: [
      { flow_kind: 'token_presale',     billing_mode: 'admin_batch',   default_payee_strategy: 'platform_treasury', default_currency: 'USD',  allowed_currencies: ['USD','USDC','SOL'] },
      { flow_kind: 'token_tge_launch',  billing_mode: 'admin_batch',   default_payee_strategy: 'platform_treasury', default_currency: 'EDGE', allowed_currencies: ['EDGE'] },
      { flow_kind: 'token_liquidity_provision', billing_mode: 'scheduled', default_payee_strategy: 'platform_treasury', default_currency: 'USDC', allowed_currencies: ['USDC','SOL','EDGE'] },
    ],
  },
  {
    ventureId: 'arq',
    ownerEntityId: 'arq-labs',
    launchStage: 'concept',
    treasuries: [
      { label: 'ARQ Labs Operating USD', kind: 'stripe_connect', jurisdiction: 'US-DE', currency: 'USD', custodian: 'stripe' },
    ],
    royalty: {
      label: 'ARQ Labs Platform Rake v1',
      layers: [
        { sequence: 1, label: 'edgeiq-holdings',  kind: 'platform_rake',  recipient_type: 'external_entity', recipient_id: 'edgeiq-holdings', bps: 300 },
        { sequence: 2, label: 'venture-treasury', kind: 'venture_rake',   recipient_type: 'treasury', recipient_id: 'arq-labs-operating', bps: 500 },
      ],
    },
    ruleSets: [
      {
        label: 'ARQ Reg D 506(c)', jurisdiction: 'US-DE',
        rules: [
          { rule_type: 'reg_d_verification', scope: 'intake', config: {}, priority: 10 },
          { rule_type: 'ofac', scope: 'intake', config: { requireScreening: true }, priority: 20 },
        ],
      },
    ],
    flows: [
      { flow_kind: 'startup_equity_crowdfund', billing_mode: 'admin_batch', default_payee_strategy: 'platform_treasury', default_currency: 'USD', allowed_currencies: ['USD','USDC'] },
      { flow_kind: 'startup_safe_presale',     billing_mode: 'immediate_on_committed', default_payee_strategy: 'platform_treasury', default_currency: 'USD', allowed_currencies: ['USD'] },
    ],
  },
  {
    ventureId: 'edgeiq-markets',
    ownerEntityId: 'edgeiq-markets',
    launchStage: 'alpha',
    treasuries: [
      { label: 'Markets Sub Revenue CAD', kind: 'stripe_connect', jurisdiction: 'CA-ON', currency: 'CAD', custodian: 'stripe' },
    ],
    royalty: {
      label: 'EdgeIQ Markets Sub Rev v1',
      layers: [
        { sequence: 1, label: 'edgeiq-holdings',  kind: 'platform_rake', recipient_type: 'external_entity', recipient_id: 'edgeiq-holdings', bps: 500 },
        { sequence: 2, label: 'venture-treasury', kind: 'venture_rake',  recipient_type: 'treasury', recipient_id: 'edgeiq-markets-sub-rev', bps: 2000 },
        { sequence: 3, label: 'analyst-share',    kind: 'creator_share', recipient_type: 'user', recipient_id: 'dynamic', bps: 1000, condition_expr: 'flowKind==ROYALTY_PAYOUT' },
      ],
    },
    ruleSets: [],
    flows: [
      { flow_kind: 'royalty_payout',      billing_mode: 'scheduled', default_payee_strategy: 'split', default_currency: 'CAD', allowed_currencies: ['CAD','USD'] },
      { flow_kind: 'platform_fee_split',  billing_mode: 'scheduled', default_payee_strategy: 'platform_treasury', default_currency: 'CAD', allowed_currencies: ['CAD','USD'] },
    ],
  },
  {
    ventureId: 'mcv-platform',
    ownerEntityId: 'mcv-platform',
    launchStage: 'beta',
    treasuries: [
      { label: 'MCV Platform Rake USD', kind: 'stripe_connect', jurisdiction: 'CA-ON', currency: 'USD', custodian: 'stripe' },
    ],
    royalty: {
      label: 'MCV Platform Meter v1',
      layers: [
        { sequence: 1, label: 'edgeiq-holdings', kind: 'platform_rake', recipient_type: 'external_entity', recipient_id: 'edgeiq-holdings', bps: 10000 },
      ],
    },
    ruleSets: [],
    flows: [
      { flow_kind: 'royalty_payout',     billing_mode: 'scheduled', default_payee_strategy: 'platform_treasury', default_currency: 'USD', allowed_currencies: ['USD','USDC'] },
      { flow_kind: 'platform_fee_split', billing_mode: 'scheduled', default_payee_strategy: 'platform_treasury', default_currency: 'USD', allowed_currencies: ['USD','CAD'] },
    ],
  },
];

// ─── Run ────────────────────────────────────────────────────────────────

async function run() {
  console.log('[seed-capital-foundation] starting…');

  // 1. Legal entities (upsert by id)
  const { error: leErr } = await supabase.from('capital_legal_entity').upsert(
    LEGAL_ENTITIES.map((le) => ({ ...le, metadata: {} })),
    { onConflict: 'id' },
  );
  if (leErr) { console.error('legal_entity upsert failed:', leErr); process.exit(1); }
  console.log(`  ✓ ${LEGAL_ENTITIES.length} legal entities`);

  // 2. Per-venture seed
  for (const v of VENTURES) {
    console.log(`[${v.ventureId}] seeding…`);

    // 2a. Treasuries (upsert by (venture_id, label))
    const treasuryRows = v.treasuries.map((t) => ({
      venture_id: v.ventureId,
      label: t.label,
      kind: t.kind,
      jurisdiction: t.jurisdiction,
      currency: t.currency,
      custodian: t.custodian,
      owner_entity_id: v.ownerEntityId,
      balance_cache: [],
      policy: { autoExecute: false, manualApprovalAboveBps: 100 },
      metadata: {},
      active: true,
    }));
    const { data: treasuries, error: tErr } = await supabase
      .from('capital_treasury')
      .upsert(treasuryRows, { onConflict: 'venture_id,label' })
      .select();
    if (tErr) { console.error(`  ${v.ventureId} treasuries:`, tErr); continue; }
    const defaultTreasuryId = treasuries?.[0]?.id ?? null;
    console.log(`  ✓ ${treasuries?.length ?? 0} treasuries`);

    // 2b. Royalty graph + layers
    const { data: graph, error: gErr } = await supabase
      .from('capital_royalty_graph')
      .upsert({
        venture_id: v.ventureId,
        label: v.royalty.label,
        version: 1,
        effective_at: new Date().toISOString(),
        metadata: {},
      }, { onConflict: 'venture_id,label,version' })
      .select()
      .single();
    if (gErr) { console.error(`  ${v.ventureId} graph:`, gErr); continue; }

    const layerRows = v.royalty.layers.map((l) => ({
      graph_id: graph!.id,
      sequence: l.sequence,
      label: l.label,
      recipient_type: l.recipient_type,
      recipient_id: l.recipient_id,
      bps: l.bps,
      kind: l.kind,
      condition_expr: l.condition_expr ?? null,
      metadata: {},
    }));
    const { error: lErr } = await supabase
      .from('capital_royalty_graph_layer')
      .upsert(layerRows, { onConflict: 'graph_id,sequence' });
    if (lErr) { console.error(`  ${v.ventureId} layers:`, lErr); continue; }
    console.log(`  ✓ royalty graph v1 + ${layerRows.length} layers`);

    // 2c. Compliance rule sets + rules
    for (const rs of v.ruleSets) {
      const { data: ruleSetRow, error: rsErr } = await supabase
        .from('capital_compliance_rule_set')
        .upsert({
          venture_id: v.ventureId,
          label: rs.label,
          jurisdiction: rs.jurisdiction,
          description: null,
          metadata: {},
          active: true,
        }, { onConflict: 'venture_id,label' })
        .select()
        .single();
      if (rsErr) { console.error(`  ${v.ventureId} ruleset ${rs.label}:`, rsErr); continue; }

      // Delete old rules + re-insert (rules have no natural key friendly to upsert)
      await supabase.from('capital_compliance_rule').delete().eq('rule_set_id', ruleSetRow!.id);
      if (rs.rules.length > 0) {
        const ruleRows = rs.rules.map((r) => ({
          rule_set_id: ruleSetRow!.id,
          rule_type: r.rule_type,
          scope: r.scope,
          config: r.config,
          priority: r.priority ?? 100,
          active: true,
        }));
        const { error: rErr } = await supabase.from('capital_compliance_rule').insert(ruleRows);
        if (rErr) { console.error(`  ${v.ventureId} rules:`, rErr); continue; }
      }
      console.log(`  ✓ ruleset "${rs.label}" + ${rs.rules.length} rules`);
    }

    // 2d. DistributionConfig
    for (const f of v.flows) {
      const { error: cErr } = await supabase
        .from('capital_distribution_config')
        .upsert({
          venture_id: v.ventureId,
          flow_kind: f.flow_kind,
          scope_type: 'venture',
          scope_id: null,
          billing_mode: f.billing_mode,
          default_payee_strategy: f.default_payee_strategy,
          default_currency: f.default_currency,
          allowed_currencies: f.allowed_currencies,
          split_rules: f.split_rules ?? null,
          fx_policy: { provider: 'stripe-fx', slippageBps: 50, lockWindowSec: 120 },
          royalty_graph_id: graph!.id,
          treasury_id: defaultTreasuryId,
          metadata: {},
          active: true,
        }, { onConflict: 'venture_id,flow_kind,scope_type,scope_id' });
      if (cErr) { console.error(`  ${v.ventureId} config ${f.flow_kind}:`, cErr); }
    }
    console.log(`  ✓ ${v.flows.length} distribution configs`);

    // 2e. Update ventures row with foundation pointers (best-effort — table may not have all venture IDs)
    await supabase.from('ventures').update({
      owner_entity_id: v.ownerEntityId,
      default_treasury_id: defaultTreasuryId,
      default_royalty_graph_id: graph!.id,
      token_symbol: v.tokenSymbol ?? null,
      launch_stage: v.launchStage,
    }).eq('id', v.ventureId);
  }

  console.log('[seed-capital-foundation] done.');
}

run().catch((err) => { console.error(err); process.exit(1); });
