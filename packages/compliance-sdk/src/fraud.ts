// @mcv/compliance-sdk/fraud — Fraud detection engine factory.
//
// Returns risk-scoring + rule-CRUD bound to a caller-supplied Supabase client.
// Null supabase is tolerated — all methods degrade to safe no-op / empty
// results so hosts can instantiate the engine before bootstrapping the DB.

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  FraudCheckResult,
  FraudDecision,
  FraudRule,
  FraudRuleAction,
  FraudSignal,
  FraudSignalType,
  FraudSeverity,
} from './types';

export interface ScoreTransactionRequest {
  transactionId: string;
  ventureId: string;
  customerId: string;
  amount: number;
  currency: string;
  customerCountry?: string;
  paymentMethodCountry?: string;
  deviceFingerprint?: string;
  customerCreatedAt?: string;
  ipAddress?: string;
}

export interface FraudEngine {
  scoreTransaction(request: ScoreTransactionRequest): Promise<FraudCheckResult>;
  createFraudRule(input: Omit<FraudRule, 'id'>): Promise<FraudRule | null>;
  updateFraudRule(
    id: string,
    updates: Partial<Omit<FraudRule, 'id' | 'ventureId'>>,
  ): Promise<FraudRule | null>;
  listFraudRules(ventureId: string): Promise<FraudRule[]>;
}

function signal(
  type: FraudSignalType,
  severity: FraudSeverity,
  description: string,
  score: number,
): FraudSignal {
  return { type, severity, description, score };
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function decisionFromScore(score: number): FraudDecision {
  if (score <= 30) return 'allow';
  if (score <= 70) return 'review';
  return 'block';
}

function checkGeoMismatch(
  customerCountry?: string,
  paymentMethodCountry?: string,
): FraudSignal[] {
  if (!customerCountry || !paymentMethodCountry) return [];
  if (customerCountry.toUpperCase() !== paymentMethodCountry.toUpperCase()) {
    return [
      signal(
        'geo_mismatch',
        'medium',
        `Customer country (${customerCountry}) differs from payment method country (${paymentMethodCountry})`,
        15,
      ),
    ];
  }
  return [];
}

function checkAccountAge(customerCreatedAt?: string): FraudSignal[] {
  if (!customerCreatedAt) return [];
  const ageHours = (Date.now() - new Date(customerCreatedAt).getTime()) / (1000 * 60 * 60);
  if (ageHours < 24) {
    return [
      signal(
        'account_age',
        ageHours < 1 ? 'high' : 'medium',
        `Account created ${ageHours.toFixed(1)} hours ago`,
        ageHours < 1 ? 25 : 15,
      ),
    ];
  }
  return [];
}

interface RuleContext {
  amount: number;
  amount_dollars: number;
  account_age_hours: number;
  geo_mismatch: number;
  has_device_fingerprint: number;
}

function evaluateComparison(expr: string, ctx: RuleContext): boolean {
  const opRegex = /^(\w+)\s*(>=|<=|==|!=|>|<)\s*(-?\d+(?:\.\d+)?)$/;
  const match = expr.trim().match(opRegex);
  if (!match) return false;

  const [, field, op, rawValue] = match;
  const value = parseFloat(rawValue);
  const ctxValue = (ctx as unknown as Record<string, number>)[field];
  if (ctxValue === undefined) return false;

  switch (op) {
    case '>':  return ctxValue > value;
    case '<':  return ctxValue < value;
    case '>=': return ctxValue >= value;
    case '<=': return ctxValue <= value;
    case '==': return ctxValue === value;
    case '!=': return ctxValue !== value;
    default:   return false;
  }
}

function evaluateRule(rule: FraudRule, request: ScoreTransactionRequest): boolean {
  const ctx: RuleContext = {
    amount: request.amount,
    amount_dollars: request.amount / 100,
    account_age_hours: request.customerCreatedAt
      ? (Date.now() - new Date(request.customerCreatedAt).getTime()) / (1000 * 60 * 60)
      : 9999,
    geo_mismatch: request.customerCountry !== request.paymentMethodCountry ? 1 : 0,
    has_device_fingerprint: request.deviceFingerprint ? 1 : 0,
  };

  const condition = rule.condition.trim();

  if (/\bAND\b/i.test(condition)) {
    return condition.split(/\bAND\b/i).every((part) => evaluateComparison(part, ctx));
  }
  if (/\bOR\b/i.test(condition)) {
    return condition.split(/\bOR\b/i).some((part) => evaluateComparison(part, ctx));
  }
  return evaluateComparison(condition, ctx);
}

export function createFraudEngine({
  supabase,
}: {
  supabase: SupabaseClient | null;
}): FraudEngine {
  async function checkVelocity(
    ventureId: string,
    amount: number,
  ): Promise<FraudSignal[]> {
    if (!supabase) return [];
    const signals: FraudSignal[] = [];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from('fraud_checks')
      .select('risk_score, created_at')
      .eq('venture_id', ventureId)
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false });

    const recentCount = data?.length ?? 0;

    if (recentCount >= 5) {
      signals.push(
        signal(
          'velocity_count',
          recentCount >= 10 ? 'critical' : 'high',
          `${recentCount} transactions in the last hour`,
          recentCount >= 10 ? 35 : 20,
        ),
      );
    }

    if (amount > 50000 && recentCount >= 3) {
      signals.push(
        signal(
          'velocity_amount',
          'high',
          `High-value transaction ($${(amount / 100).toFixed(2)}) after recent activity`,
          25,
        ),
      );
    }

    return signals;
  }

  async function checkUnusualAmount(
    ventureId: string,
    amount: number,
  ): Promise<FraudSignal[]> {
    if (!supabase) return [];

    const { data } = await supabase
      .from('fraud_checks')
      .select('risk_score')
      .eq('venture_id', ventureId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!data || data.length < 5) return [];

    if (amount > 200000) {
      return [
        signal(
          'unusual_amount',
          'medium',
          `Amount $${(amount / 100).toFixed(2)} is unusually high`,
          15,
        ),
      ];
    }
    return [];
  }

  async function applyCustomRules(
    request: ScoreTransactionRequest,
  ): Promise<{ signals: FraudSignal[]; forcedAction?: FraudRuleAction }> {
    if (!supabase) return { signals: [] };
    const signals: FraudSignal[] = [];
    let forcedAction: FraudRuleAction | undefined;

    const { data: rules } = await supabase
      .from('fraud_rules')
      .select('*')
      .eq('venture_id', request.ventureId)
      .eq('enabled', true);

    if (!rules) return { signals };

    for (const row of rules) {
      const rule: FraudRule = {
        id: row.id,
        ventureId: row.venture_id,
        name: row.name,
        condition: row.condition,
        action: row.action,
        scoreImpact: row.score_impact,
        enabled: row.enabled,
      };

      if (evaluateRule(rule, request)) {
        if (rule.action === 'block' || rule.action === 'review' || rule.action === 'require_3ds') {
          forcedAction = rule.action;
        }
        if (rule.scoreImpact > 0) {
          signals.push(
            signal(
              'card_testing',
              rule.scoreImpact >= 40 ? 'critical' : rule.scoreImpact >= 25 ? 'high' : 'medium',
              `Rule "${rule.name}" matched`,
              rule.scoreImpact,
            ),
          );
        }
      }
    }

    return { signals, forcedAction };
  }

  return {
    async scoreTransaction(request) {
      const allSignals: FraudSignal[] = [];

      const [velocitySignals, unusualSignals, { signals: ruleSignals, forcedAction }] =
        await Promise.all([
          checkVelocity(request.ventureId, request.amount),
          checkUnusualAmount(request.ventureId, request.amount),
          applyCustomRules(request),
        ]);

      allSignals.push(...velocitySignals);
      allSignals.push(...checkGeoMismatch(request.customerCountry, request.paymentMethodCountry));
      allSignals.push(...checkAccountAge(request.customerCreatedAt));
      allSignals.push(...unusualSignals);
      allSignals.push(...ruleSignals);

      const rawScore = allSignals.reduce((sum, s) => sum + s.score, 0);
      const riskScore = clamp(rawScore);

      let decision: FraudDecision = decisionFromScore(riskScore);
      if (forcedAction === 'block') decision = 'block';
      else if (forcedAction === 'review' && decision === 'allow') decision = 'review';

      const requiresVerification =
        forcedAction === 'require_3ds' || (riskScore >= 31 && riskScore <= 70);

      const result: FraudCheckResult = {
        transactionId: request.transactionId,
        riskScore,
        decision,
        signals: allSignals,
        requiresVerification,
      };

      if (supabase) {
        await supabase.from('fraud_checks').insert({
          venture_id: request.ventureId,
          transaction_id: request.transactionId,
          risk_score: riskScore,
          decision,
          signals: allSignals,
        });
      }

      return result;
    },

    async createFraudRule(input) {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('fraud_rules')
        .insert({
          venture_id: input.ventureId,
          name: input.name,
          condition: input.condition,
          action: input.action,
          score_impact: input.scoreImpact,
          enabled: input.enabled,
        })
        .select()
        .single();

      if (error || !data) return null;
      return {
        id: data.id,
        ventureId: data.venture_id,
        name: data.name,
        condition: data.condition,
        action: data.action as FraudRuleAction,
        scoreImpact: data.score_impact,
        enabled: data.enabled,
      };
    },

    async updateFraudRule(id, updates) {
      if (!supabase) return null;
      const patch: Record<string, unknown> = {};
      if (updates.name !== undefined) patch.name = updates.name;
      if (updates.condition !== undefined) patch.condition = updates.condition;
      if (updates.action !== undefined) patch.action = updates.action;
      if (updates.scoreImpact !== undefined) patch.score_impact = updates.scoreImpact;
      if (updates.enabled !== undefined) patch.enabled = updates.enabled;

      const { data, error } = await supabase
        .from('fraud_rules')
        .update(patch)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) return null;
      return {
        id: data.id,
        ventureId: data.venture_id,
        name: data.name,
        condition: data.condition,
        action: data.action as FraudRuleAction,
        scoreImpact: data.score_impact,
        enabled: data.enabled,
      };
    },

    async listFraudRules(ventureId) {
      if (!supabase) return [];
      const { data } = await supabase
        .from('fraud_rules')
        .select('*')
        .eq('venture_id', ventureId)
        .order('created_at', { ascending: false });

      if (!data) return [];
      return data.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        ventureId: row.venture_id as string,
        name: row.name as string,
        condition: row.condition as string,
        action: row.action as FraudRuleAction,
        scoreImpact: row.score_impact as number,
        enabled: row.enabled as boolean,
      }));
    },
  };
}
