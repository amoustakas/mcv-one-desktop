// @ts-nocheck
// NAOS Authority Engine — Dynamic Autonomy Decisions
// Determines what each agent can auto-execute vs must escalate

import type { AgentIdentity, AgentTier, AutonomyDecision } from './types';

// Base spend limits per tier (adjusted by trust score)
const BASE_SPEND_LIMITS: Record<AgentTier, number> = {
  1: 5000,   // C-Suite: $5K
  2: 1000,   // Director: $1K
  3: 100,    // Manager: $100
  4: 0,      // Lead: $0
  5: 0,      // IC: $0
};

// Risk tolerance per tier (what risk levels they can auto-handle)
const TIER_RISK_TOLERANCE: Record<AgentTier, string[]> = {
  1: ['low', 'medium', 'high'],
  2: ['low', 'medium'],
  3: ['low'],
  4: ['low'],
  5: [],
};

/** Evaluate whether an agent can auto-execute an action */
export function evaluateAutonomy(
  agent: AgentIdentity,
  action: {
    description: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    domain: string;
    spendAmount?: number;
    isPublicFacing: boolean;
    ventureId: string;
  },
  trustScore: number, // 0-100, earned over time
): AutonomyDecision {
  const baseLimit = BASE_SPEND_LIMITS[agent.tier];
  const riskAllowed = TIER_RISK_TOLERANCE[agent.tier];

  // Trust bonus: every 10 points above 70 adds 20% to spend limit
  const trustMultiplier = trustScore > 70 ? 1 + ((trustScore - 70) / 10) * 0.2 : 1;
  const adjustedSpendLimit = Math.floor(baseLimit * trustMultiplier);

  // Check domain scope
  const inDomain = agent.domain.includes(action.domain) || agent.domain.includes('*');

  // Check venture scope
  const inVenture = agent.ventureScope.includes('*') || agent.ventureScope.includes(action.ventureId);

  // Critical risk always escalates
  if (action.riskLevel === 'critical') {
    return {
      agent,
      action: action.description,
      riskLevel: action.riskLevel,
      domain: action.domain,
      spendAmount: action.spendAmount,
      isPublicFacing: action.isPublicFacing,
      ventureId: action.ventureId,
      canAutoExecute: false,
      requiresEscalation: true,
      escalateTo: agent.reportsTo || 'founder',
      confidence: 0,
      reason: 'Critical risk always requires escalation',
    };
  }

  // Public-facing content from non-C-suite always escalates
  if (action.isPublicFacing && agent.tier > 1) {
    return {
      agent,
      action: action.description,
      riskLevel: action.riskLevel,
      domain: action.domain,
      spendAmount: action.spendAmount,
      isPublicFacing: action.isPublicFacing,
      ventureId: action.ventureId,
      canAutoExecute: false,
      requiresEscalation: true,
      escalateTo: agent.reportsTo || 'founder',
      confidence: 0,
      reason: 'Public-facing actions require C-Suite+ approval',
    };
  }

  // Spend check
  if (action.spendAmount && action.spendAmount > adjustedSpendLimit) {
    return {
      agent,
      action: action.description,
      riskLevel: action.riskLevel,
      domain: action.domain,
      spendAmount: action.spendAmount,
      isPublicFacing: action.isPublicFacing,
      ventureId: action.ventureId,
      canAutoExecute: false,
      requiresEscalation: true,
      escalateTo: agent.reportsTo || 'founder',
      confidence: 0,
      reason: `Spend $${action.spendAmount} exceeds limit $${adjustedSpendLimit} (tier ${agent.tier}, trust ${trustScore})`,
    };
  }

  // Risk check
  if (!riskAllowed.includes(action.riskLevel)) {
    return {
      agent,
      action: action.description,
      riskLevel: action.riskLevel,
      domain: action.domain,
      spendAmount: action.spendAmount,
      isPublicFacing: action.isPublicFacing,
      ventureId: action.ventureId,
      canAutoExecute: false,
      requiresEscalation: true,
      escalateTo: agent.reportsTo || 'founder',
      confidence: 0,
      reason: `${action.riskLevel} risk not within tier ${agent.tier} tolerance`,
    };
  }

  // Domain/venture scope check
  if (!inDomain || !inVenture) {
    return {
      agent,
      action: action.description,
      riskLevel: action.riskLevel,
      domain: action.domain,
      spendAmount: action.spendAmount,
      isPublicFacing: action.isPublicFacing,
      ventureId: action.ventureId,
      canAutoExecute: false,
      requiresEscalation: true,
      escalateTo: agent.reportsTo || 'founder',
      confidence: 0,
      reason: `Outside agent scope: ${!inDomain ? 'domain' : 'venture'} mismatch`,
    };
  }

  // All checks pass — auto-execute
  return {
    agent,
    action: action.description,
    riskLevel: action.riskLevel,
    domain: action.domain,
    spendAmount: action.spendAmount,
    isPublicFacing: action.isPublicFacing,
    ventureId: action.ventureId,
    canAutoExecute: true,
    requiresEscalation: false,
    escalateTo: null,
    confidence: Math.min(100, trustScore + (100 - agent.tier * 15)),
    reason: 'Within authority bounds',
  };
}
