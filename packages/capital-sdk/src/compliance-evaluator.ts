// @mcv/capital-sdk/compliance-evaluator — stateless rule engine.
//
// Evaluates a ComplianceRuleSet against an investor + treasury + flow
// context. Returns a tri-state decision with itemized reasons so UI can
// render "allowed because X", "review because Y", "blocked because Z".

import type {
  ComplianceDecision,
  ComplianceEvaluation,
  ComplianceRule,
  ComplianceRuleSet,
  ComplianceRuleType,
  ComplianceScope,
  CapitalFlow,
} from './foundation-types.js';

export interface InvestorContext {
  id: string;
  jurisdiction?: string | null;
  accreditationTier?: 'unverified' | 'verified' | 'eligible' | 'accredited' | null;
  dateOfBirth?: string | null;
  ofacStatus?: 'clear' | 'review' | 'match' | 'unscreened' | null;
  amlScore?: number | null;
  annualInvestmentToDateUsd?: number | null;
  vpnDetected?: boolean | null;
  metadata?: Record<string, unknown>;
}

export interface TreasuryContext {
  id: string;
  jurisdiction: string;
  currency: string;
  kind: string;
}

export interface FlowContext {
  flowKind: CapitalFlow;
  scope: ComplianceScope;
  amountUsd?: number;
  amountNative?: number;
  currency?: string;
  timestamp?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface EvaluateInput {
  ruleSet: ComplianceRuleSet;
  rules: ComplianceRule[];
  investor: InvestorContext;
  treasury: TreasuryContext;
  flow: FlowContext;
}

export function evaluateCompliance(input: EvaluateInput): ComplianceEvaluation {
  const now = input.flow.timestamp ?? new Date().toISOString();
  const activeRules = input.rules
    .filter((r) => r.active)
    .filter((r) => r.scope === input.flow.scope)
    .filter((r) => !r.effectiveAt || r.effectiveAt <= now)
    .filter((r) => !r.expiresAt || r.expiresAt > now)
    .sort((a, b) => a.priority - b.priority);

  const reasons: ComplianceEvaluation['reasons'] = [];
  let decision: ComplianceDecision = 'allow';

  for (const rule of activeRules) {
    const outcome = evaluateRule(rule, input);
    if (outcome.status === 'pass') continue;
    reasons.push({ ruleId: rule.id, ruleType: rule.ruleType, message: outcome.message });
    if (outcome.status === 'block') decision = 'block';
    else if (outcome.status === 'review' && decision === 'allow') decision = 'review';
  }

  return { decision, reasons };
}

type RuleOutcome = { status: 'pass' } | { status: 'review' | 'block'; message: string };

function evaluateRule(rule: ComplianceRule, input: EvaluateInput): RuleOutcome {
  const { investor, flow } = input;
  const cfg = rule.config ?? {};

  switch (rule.ruleType as ComplianceRuleType) {
    case 'hold_period': {
      const minDays = cfg.minDays as number | undefined;
      const commitDateIso = flow.metadata?.commitDate as string | undefined;
      if (!minDays || !commitDateIso) return { status: 'pass' };
      const commitDate = new Date(commitDateIso).getTime();
      const cutoff = Date.now() - minDays * 24 * 60 * 60 * 1000;
      return commitDate <= cutoff
        ? { status: 'pass' }
        : { status: 'block', message: `Hold period ${minDays}d not elapsed since ${commitDateIso}` };
    }
    case 'accreditation_min': {
      const min = (cfg.tier as string | undefined) ?? 'accredited';
      const tiers = ['unverified', 'verified', 'eligible', 'accredited'] as const;
      const invIdx = tiers.indexOf((investor.accreditationTier ?? 'unverified') as typeof tiers[number]);
      const reqIdx = tiers.indexOf(min as typeof tiers[number]);
      if (reqIdx < 0) return { status: 'pass' };
      return invIdx >= reqIdx
        ? { status: 'pass' }
        : { status: 'block', message: `Investor tier '${investor.accreditationTier ?? 'unverified'}' below required '${min}'` };
    }
    case 'jurisdiction_allowlist': {
      const allowed = cfg.countries as string[] | undefined;
      const juris = investor.jurisdiction;
      if (!allowed || !juris) return { status: 'pass' };
      return allowed.includes(juris)
        ? { status: 'pass' }
        : { status: 'block', message: `Investor jurisdiction '${juris}' not in allowlist` };
    }
    case 'jurisdiction_blocklist': {
      const blocked = cfg.countries as string[] | undefined;
      const juris = investor.jurisdiction;
      if (!blocked || !juris) return { status: 'pass' };
      return blocked.includes(juris)
        ? { status: 'block', message: `Investor jurisdiction '${juris}' is blocked` }
        : { status: 'pass' };
    }
    case 'ofac': {
      const requireScreening = cfg.requireScreening as boolean | undefined;
      const status = investor.ofacStatus ?? 'unscreened';
      if (status === 'clear') return { status: 'pass' };
      if (status === 'match') return { status: 'block', message: 'OFAC SDN match' };
      if (status === 'review') return { status: 'review', message: 'OFAC possible match — review required' };
      return requireScreening
        ? { status: 'block', message: 'OFAC screening required and not completed' }
        : { status: 'review', message: 'OFAC screening not yet completed' };
    }
    case 'aml_score_max': {
      const max = cfg.maxScore as number | undefined;
      if (max === undefined) return { status: 'pass' };
      const score = investor.amlScore ?? 0;
      return score <= max
        ? { status: 'pass' }
        : { status: 'review', message: `AML score ${score.toFixed(2)} exceeds max ${max}` };
    }
    case 'age_min': {
      const minAge = cfg.minAge as number | undefined;
      if (!minAge || !investor.dateOfBirth) return { status: 'pass' };
      const years = yearsBetween(new Date(investor.dateOfBirth), new Date(flow.timestamp ?? new Date()));
      return years >= minAge
        ? { status: 'pass' }
        : { status: 'block', message: `Age ${years}y below minimum ${minAge}y` };
    }
    case 'investment_cap_per_investor': {
      const maxUsd = cfg.maxUsd as number | undefined;
      if (!maxUsd || flow.amountUsd === undefined) return { status: 'pass' };
      const soFar = investor.annualInvestmentToDateUsd ?? 0;
      return soFar + flow.amountUsd <= maxUsd
        ? { status: 'pass' }
        : { status: 'block', message: `Investment $${(soFar + flow.amountUsd).toFixed(0)} would exceed per-investor cap $${maxUsd}` };
    }
    case 'wager_limit_daily': {
      const maxDaily = cfg.maxDailyUsd as number | undefined;
      const todaySoFar = (flow.metadata?.todayWagerUsd as number | undefined) ?? 0;
      if (!maxDaily || flow.amountUsd === undefined) return { status: 'pass' };
      return todaySoFar + flow.amountUsd <= maxDaily
        ? { status: 'pass' }
        : { status: 'block', message: `Daily wager $${(todaySoFar + flow.amountUsd).toFixed(0)} would exceed cap $${maxDaily}` };
    }
    case 'responsible_gaming': {
      const selfExcludedUntil = flow.metadata?.selfExcludedUntil as string | undefined;
      if (!selfExcludedUntil) return { status: 'pass' };
      const until = new Date(selfExcludedUntil).getTime();
      return Date.now() >= until
        ? { status: 'pass' }
        : { status: 'block', message: `Investor self-excluded until ${selfExcludedUntil}` };
    }
    case 'cooling_off_period': {
      const lastActionIso = flow.metadata?.lastActionAt as string | undefined;
      const minHours = cfg.minHours as number | undefined;
      if (!minHours || !lastActionIso) return { status: 'pass' };
      const elapsed = (Date.now() - new Date(lastActionIso).getTime()) / (1000 * 60 * 60);
      return elapsed >= minHours
        ? { status: 'pass' }
        : { status: 'block', message: `Cooling-off period ${minHours}h not elapsed (${elapsed.toFixed(1)}h)` };
    }
    case 'max_token_alloc_per_wallet': {
      const maxTokens = cfg.maxTokens as number | undefined;
      const alreadyHolding = flow.metadata?.walletTokenBalance as number | undefined;
      if (!maxTokens || alreadyHolding === undefined || flow.amountNative === undefined) return { status: 'pass' };
      return alreadyHolding + flow.amountNative <= maxTokens
        ? { status: 'pass' }
        : { status: 'block', message: `Wallet alloc ${alreadyHolding + flow.amountNative} would exceed per-wallet cap ${maxTokens}` };
    }
    case 'reg_cf_annual_cap': {
      const capUsd = (cfg.capUsd as number | undefined) ?? 124000;
      const soFar = investor.annualInvestmentToDateUsd ?? 0;
      if (flow.amountUsd === undefined) return { status: 'pass' };
      return soFar + flow.amountUsd <= capUsd
        ? { status: 'pass' }
        : { status: 'block', message: `Reg CF annual investment would exceed $${capUsd}` };
    }
    case 'reg_d_verification': {
      return investor.accreditationTier === 'accredited'
        ? { status: 'pass' }
        : { status: 'block', message: 'Reg D requires accredited-investor verification' };
    }
    case 'vpn_block': {
      return investor.vpnDetected
        ? { status: 'block', message: 'VPN detected — jurisdictional compliance at risk' }
        : { status: 'pass' };
    }
    case 'time_window': {
      const startIso = cfg.start as string | undefined;
      const endIso = cfg.end as string | undefined;
      const now = new Date(flow.timestamp ?? new Date()).getTime();
      if (startIso && now < new Date(startIso).getTime()) {
        return { status: 'block', message: `Before window start ${startIso}` };
      }
      if (endIso && now > new Date(endIso).getTime()) {
        return { status: 'block', message: `After window end ${endIso}` };
      }
      return { status: 'pass' };
    }
    case 'other':
      return { status: 'pass' };
  }
}

function yearsBetween(a: Date, b: Date): number {
  const diff = b.getTime() - a.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

export function isComplianceAllow(result: ComplianceEvaluation): boolean { return result.decision === 'allow'; }
export function isComplianceBlock(result: ComplianceEvaluation): boolean { return result.decision === 'block'; }
export function isComplianceReview(result: ComplianceEvaluation): boolean { return result.decision === 'review'; }
