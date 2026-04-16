import { describe, it, expect } from 'vitest';
import { evaluateCompliance, isComplianceBlock, isComplianceReview } from '../compliance-evaluator';
import type { ComplianceRule, ComplianceRuleSet } from '../foundation-types';

const ruleSet: ComplianceRuleSet = {
  id: 'rs_1', ventureId: 'v1', label: 'Test', jurisdiction: 'CA-ON',
  description: null, metadata: {}, active: true,
  createdAt: '2026-01-01', updatedAt: '2026-01-01',
};

const investorBase = {
  id: 'u_1', jurisdiction: 'CA-ON',
  accreditationTier: 'verified' as const,
  dateOfBirth: '2000-01-01',
  ofacStatus: 'clear' as const,
  amlScore: 0.1,
  annualInvestmentToDateUsd: 5000,
  vpnDetected: false,
};

const treasury = { id: 't_1', jurisdiction: 'CA-ON', currency: 'CAD', kind: 'stripe_connect' };

const baseFlow = {
  flowKind: 're_capital_call' as const,
  scope: 'intake' as const,
  amountUsd: 1000, amountNative: 1000, currency: 'CAD',
  timestamp: '2026-04-16T12:00:00Z',
};

function makeRule(overrides: Partial<ComplianceRule>): ComplianceRule {
  return {
    id: 'r_' + Math.random().toString(36).slice(2, 8),
    ruleSetId: ruleSet.id,
    ruleType: 'other',
    scope: 'intake',
    config: {},
    priority: 100,
    active: true,
    effectiveAt: null,
    expiresAt: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  };
}

describe('evaluateCompliance', () => {
  it('allows when no rules match', () => {
    const r = evaluateCompliance({ ruleSet, rules: [], investor: investorBase, treasury, flow: baseFlow });
    expect(r.decision).toBe('allow');
    expect(r.reasons).toHaveLength(0);
  });

  it('blocks on accreditation floor mismatch', () => {
    const rules = [makeRule({ ruleType: 'accreditation_min', config: { tier: 'accredited' } })];
    const r = evaluateCompliance({ ruleSet, rules, investor: investorBase, treasury, flow: baseFlow });
    expect(isComplianceBlock(r)).toBe(true);
    expect(r.reasons[0].ruleType).toBe('accreditation_min');
  });

  it('allows when accreditation tier meets minimum', () => {
    const rules = [makeRule({ ruleType: 'accreditation_min', config: { tier: 'verified' } })];
    const r = evaluateCompliance({ ruleSet, rules, investor: investorBase, treasury, flow: baseFlow });
    expect(r.decision).toBe('allow');
  });

  it('blocks jurisdiction not in allowlist', () => {
    const rules = [makeRule({ ruleType: 'jurisdiction_allowlist', config: { countries: ['US-CA', 'US-NY'] } })];
    const r = evaluateCompliance({ ruleSet, rules, investor: investorBase, treasury, flow: baseFlow });
    expect(isComplianceBlock(r)).toBe(true);
  });

  it('blocks jurisdiction in blocklist', () => {
    const rules = [makeRule({ ruleType: 'jurisdiction_blocklist', config: { countries: ['CA-ON'] } })];
    const r = evaluateCompliance({ ruleSet, rules, investor: investorBase, treasury, flow: baseFlow });
    expect(isComplianceBlock(r)).toBe(true);
  });

  it('flags review when OFAC status is review', () => {
    const rules = [makeRule({ ruleType: 'ofac' })];
    const inv = { ...investorBase, ofacStatus: 'review' as const };
    const r = evaluateCompliance({ ruleSet, rules, investor: inv, treasury, flow: baseFlow });
    expect(isComplianceReview(r)).toBe(true);
  });

  it('blocks OFAC match', () => {
    const rules = [makeRule({ ruleType: 'ofac' })];
    const inv = { ...investorBase, ofacStatus: 'match' as const };
    const r = evaluateCompliance({ ruleSet, rules, investor: inv, treasury, flow: baseFlow });
    expect(isComplianceBlock(r)).toBe(true);
  });

  it('blocks under-minimum age', () => {
    const rules = [makeRule({ ruleType: 'age_min', config: { minAge: 19 } })];
    const inv = { ...investorBase, dateOfBirth: '2010-01-01' };
    const r = evaluateCompliance({ ruleSet, rules, investor: inv, treasury, flow: baseFlow });
    expect(isComplianceBlock(r)).toBe(true);
  });

  it('blocks exceeded Reg CF annual cap', () => {
    const rules = [makeRule({ ruleType: 'reg_cf_annual_cap', config: { capUsd: 10000 } })];
    const inv = { ...investorBase, annualInvestmentToDateUsd: 9500 };
    const flow = { ...baseFlow, amountUsd: 1000 };
    const r = evaluateCompliance({ ruleSet, rules, investor: inv, treasury, flow });
    expect(isComplianceBlock(r)).toBe(true);
  });

  it('blocks daily wager cap', () => {
    const rules = [makeRule({ ruleType: 'wager_limit_daily', scope: 'wager', config: { maxDailyUsd: 100 } })];
    const flow = { ...baseFlow, scope: 'wager' as const, amountUsd: 50, metadata: { todayWagerUsd: 75 } };
    const r = evaluateCompliance({ ruleSet, rules, investor: investorBase, treasury, flow });
    expect(isComplianceBlock(r)).toBe(true);
  });

  it('blocks when VPN detected', () => {
    const rules = [makeRule({ ruleType: 'vpn_block' })];
    const inv = { ...investorBase, vpnDetected: true };
    const r = evaluateCompliance({ ruleSet, rules, investor: inv, treasury, flow: baseFlow });
    expect(isComplianceBlock(r)).toBe(true);
  });

  it('blocks outside time_window', () => {
    const rules = [makeRule({ ruleType: 'time_window', config: { start: '2027-01-01' } })];
    const r = evaluateCompliance({ ruleSet, rules, investor: investorBase, treasury, flow: baseFlow });
    expect(isComplianceBlock(r)).toBe(true);
  });

  it('block dominates review', () => {
    const rules = [
      makeRule({ ruleType: 'ofac' }),
      makeRule({ ruleType: 'jurisdiction_blocklist', config: { countries: ['CA-ON'] } }),
    ];
    const inv = { ...investorBase, ofacStatus: null };
    const r = evaluateCompliance({ ruleSet, rules, investor: inv, treasury, flow: baseFlow });
    expect(r.decision).toBe('block');
    expect(r.reasons.length).toBeGreaterThanOrEqual(2);
  });

  it('ignores inactive and expired rules', () => {
    const rules = [
      makeRule({ ruleType: 'jurisdiction_blocklist', config: { countries: ['CA-ON'] }, active: false }),
      makeRule({ ruleType: 'jurisdiction_blocklist', config: { countries: ['CA-ON'] }, expiresAt: '2020-01-01' }),
    ];
    const r = evaluateCompliance({ ruleSet, rules, investor: investorBase, treasury, flow: baseFlow });
    expect(r.decision).toBe('allow');
  });

  it('respects priority sort', () => {
    const rules = [
      makeRule({ ruleType: 'ofac', priority: 200 }),
      makeRule({ ruleType: 'age_min', config: { minAge: 99 }, priority: 50 }),
    ];
    const r = evaluateCompliance({ ruleSet, rules, investor: investorBase, treasury, flow: baseFlow });
    expect(r.reasons[0].ruleType).toBe('age_min');
  });
});
