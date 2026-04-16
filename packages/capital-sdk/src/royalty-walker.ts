// @mcv/capital-sdk/royalty-walker — pure royalty-graph evaluator.
//
// Given a RoyaltyGraph + its layers + a source amount + flow context,
// produce the ordered list of DistributionLegs. Each layer's bps applies
// to the source amount; the final leg pays the residual to the primary
// recipient. conditionExpr supports a tiny DSL: field OP value joined by &&.

import type {
  CapitalFlow,
  RoyaltyGraph,
  RoyaltyGraphLayer,
  DistributionLegRecipientType,
} from './foundation-types.js';

export interface RoyaltyContext {
  flowKind: CapitalFlow;
  amount: number;
  currency: string;
  jurisdiction?: string;
  metadata?: Record<string, unknown>;
}

export interface ComputedLeg {
  layerId: string | null;
  sequence: number;
  label: string;
  kind: string;
  recipientType: DistributionLegRecipientType;
  recipientId: string;
  amount: number;
  currency: string;
  bpsApplied: number;
}

export interface WalkInput {
  graph: RoyaltyGraph;
  layers: RoyaltyGraphLayer[];
  context: RoyaltyContext;
  primaryRecipient: { recipientType: DistributionLegRecipientType; recipientId: string; label?: string };
}

export interface WalkResult {
  legs: ComputedLeg[];
  totalRoyalty: number;
  residualToPrimary: number;
  currency: string;
}

export function computeRoyaltyLegs(input: WalkInput): WalkResult {
  const { graph, layers, context, primaryRecipient } = input;
  const { amount, currency, jurisdiction } = context;

  const sortedLayers = [...layers]
    .filter((l) => l.graphId === graph.id)
    .sort((a, b) => a.sequence - b.sequence);

  const computedLegs: ComputedLeg[] = [];
  let remaining = amount;

  for (const layer of sortedLayers) {
    if (layer.jurisdiction && jurisdiction && layer.jurisdiction !== jurisdiction) continue;
    if (layer.conditionExpr && !evaluateConditionExpr(layer.conditionExpr, context)) continue;

    const legAmount = roundMoney((amount * layer.bps) / 10000);
    if (legAmount <= 0) continue;

    if (legAmount > remaining) {
      computedLegs.push({
        layerId: layer.id,
        sequence: layer.sequence,
        label: layer.label,
        kind: layer.kind,
        recipientType: mapLayerRecipientType(layer.recipientType),
        recipientId: layer.recipientId,
        amount: roundMoney(remaining),
        currency,
        bpsApplied: Math.round((remaining / amount) * 10000),
      });
      remaining = 0;
      break;
    }

    computedLegs.push({
      layerId: layer.id,
      sequence: layer.sequence,
      label: layer.label,
      kind: layer.kind,
      recipientType: mapLayerRecipientType(layer.recipientType),
      recipientId: layer.recipientId,
      amount: legAmount,
      currency,
      bpsApplied: layer.bps,
    });
    remaining -= legAmount;
  }

  const residual = roundMoney(remaining);

  if (residual > 0) {
    computedLegs.push({
      layerId: null,
      sequence: (sortedLayers[sortedLayers.length - 1]?.sequence ?? 0) + 1,
      label: primaryRecipient.label ?? 'primary_recipient',
      kind: 'primary',
      recipientType: primaryRecipient.recipientType,
      recipientId: primaryRecipient.recipientId,
      amount: residual,
      currency,
      bpsApplied: Math.round((residual / amount) * 10000),
    });
  }

  return {
    legs: computedLegs,
    totalRoyalty: roundMoney(amount - residual),
    residualToPrimary: residual,
    currency,
  };
}

function evaluateConditionExpr(expr: string, ctx: RoyaltyContext): boolean {
  const clauses = expr.split('&&').map((s) => s.trim());
  for (const clause of clauses) {
    if (!evaluateSingleClause(clause, ctx)) return false;
  }
  return true;
}

function evaluateSingleClause(clause: string, ctx: RoyaltyContext): boolean {
  const cmpMatch = clause.match(/^(\w+)(==|!=|>=|<=|>|<)(.+)$/);
  if (!cmpMatch) return false;

  const [, left, op, rawRight] = cmpMatch;
  const right = rawRight.trim();

  const leftValue = resolveConditionField(left, ctx);
  if (leftValue === undefined) return false;

  if (typeof leftValue === 'number' && !Number.isNaN(Number(right))) {
    const r = Number(right);
    switch (op) {
      case '==': return leftValue === r;
      case '!=': return leftValue !== r;
      case '>=': return leftValue >= r;
      case '<=': return leftValue <= r;
      case '>':  return leftValue >  r;
      case '<':  return leftValue <  r;
    }
  }

  const leftStr = String(leftValue).toUpperCase();
  const rightStr = right.replace(/^['"]|['"]$/g, '').toUpperCase();
  switch (op) {
    case '==': return leftStr === rightStr;
    case '!=': return leftStr !== rightStr;
    default: return false;
  }
}

function resolveConditionField(field: string, ctx: RoyaltyContext): string | number | undefined {
  switch (field) {
    case 'flowKind': return ctx.flowKind;
    case 'amount': return ctx.amount;
    case 'currency': return ctx.currency;
    case 'jurisdiction': return ctx.jurisdiction;
    default: {
      const v = ctx.metadata?.[field];
      if (typeof v === 'string' || typeof v === 'number') return v;
      return undefined;
    }
  }
}

function roundMoney(n: number): number { return Math.round(n * 100) / 100; }

function mapLayerRecipientType(src: string): DistributionLegRecipientType {
  switch (src) {
    case 'treasury': return 'platform';
    case 'user': return 'royalty_holder';
    case 'external_entity': return 'external';
    case 'pool': return 'liquidity_pool';
    default: return 'external';
  }
}
