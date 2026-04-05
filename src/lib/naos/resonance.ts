// @ts-nocheck
// NAOS Resonance Network — Cross-Agent Ripple Effects
// When one agent evolves, it ripples through the organization

import type { AgentIdentity, EmotionalState, InteractionOutcome } from './types';

interface RippleTarget {
  agentId: string;
  relationship: 'parent' | 'child' | 'peer' | 'venture-mate';
  emotionalDelta: Partial<EmotionalState>;
  reason: string;
}

/** Compute ripple effects from an agent's interaction outcome */
export function computeRipples(
  sourceAgent: AgentIdentity,
  outcome: InteractionOutcome,
  significance: number,
  allAgents: AgentIdentity[],
): RippleTarget[] {
  const ripples: RippleTarget[] = [];
  const sig = significance / 10;

  // Parent gets informed
  if (sourceAgent.reportsTo) {
    const parentDelta: Partial<EmotionalState> = {};
    if (outcome === 'success') {
      parentDelta.confidence = 1 * sig;
      parentDelta.engagement = 0.5 * sig;
    } else if (outcome === 'failure') {
      parentDelta.caution = 2 * sig;
      parentDelta.frustration = 1 * sig;
    }
    ripples.push({
      agentId: sourceAgent.reportsTo,
      relationship: 'parent',
      emotionalDelta: parentDelta,
      reason: `Report ${sourceAgent.codename} ${outcome}`,
    });
  }

  // Children get morale boost/hit
  const children = allAgents.filter(a => a.reportsTo === sourceAgent.id);
  for (const child of children) {
    const childDelta: Partial<EmotionalState> = {};
    if (outcome === 'success') {
      childDelta.confidence = 0.5 * sig;
      childDelta.engagement = 0.5 * sig;
    } else if (outcome === 'failure') {
      childDelta.caution = 1 * sig;
    }
    ripples.push({
      agentId: child.id,
      relationship: 'child',
      emotionalDelta: childDelta,
      reason: `Leader ${sourceAgent.codename} ${outcome}`,
    });
  }

  // Peer ripple (same tier, same parent)
  const peers = allAgents.filter(a =>
    a.id !== sourceAgent.id &&
    a.reportsTo === sourceAgent.reportsTo &&
    a.tier === sourceAgent.tier
  );
  for (const peer of peers) {
    if (outcome === 'success' && significance >= 7) {
      ripples.push({
        agentId: peer.id,
        relationship: 'peer',
        emotionalDelta: { engagement: 0.3 * sig },
        reason: `Peer ${sourceAgent.codename} achieved high-impact success`,
      });
    } else if (outcome === 'failure' && significance >= 7) {
      ripples.push({
        agentId: peer.id,
        relationship: 'peer',
        emotionalDelta: { caution: 0.5 * sig },
        reason: `Peer ${sourceAgent.codename} experienced significant failure`,
      });
    }
  }

  // Venture-mates (same venture scope, different reporting chain)
  if (significance >= 8) {
    const ventureMates = allAgents.filter(a =>
      a.id !== sourceAgent.id &&
      a.reportsTo !== sourceAgent.reportsTo &&
      hasVentureOverlap(a.ventureScope, sourceAgent.ventureScope)
    );
    for (const mate of ventureMates.slice(0, 5)) { // cap at 5 to prevent cascade explosion
      if (outcome === 'success') {
        ripples.push({
          agentId: mate.id,
          relationship: 'venture-mate',
          emotionalDelta: { engagement: 0.2 },
          reason: `Venture momentum: ${sourceAgent.codename} success`,
        });
      }
    }
  }

  return ripples;
}

function hasVentureOverlap(scopeA: string[], scopeB: string[]): boolean {
  if (scopeA.includes('*') || scopeB.includes('*')) return true;
  return scopeA.some(v => scopeB.includes(v));
}
