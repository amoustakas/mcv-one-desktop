// NAOS Culture Engine — Emergent Organizational Metrics
// Culture isn't configured — it emerges from aggregate agent behavior

import type { AgentIdentity, PersonalityMatrix, EmotionalState, CultureSnapshot } from './types';

interface AgentData {
  identity: AgentIdentity;
  personality: PersonalityMatrix;
  emotional: EmotionalState;
}

/** Compute a culture snapshot from current agent states */
export function computeCultureSnapshot(agents: AgentData[]): CultureSnapshot {
  const active = agents.filter(a => a.identity.status === 'active' || a.identity.status === 'probationary');
  if (active.length === 0) {
    return {
      date: new Date().toISOString().split('T')[0],
      innovationTemperature: 50,
      riskAppetite: 50,
      velocityPressure: 50,
      collaborationDensity: 50,
      trustBaseline: 50,
      totalAgents: 0,
      activePredictions: 0,
      orgMomentum: 50,
    };
  }

  // Tier-weighted average (C-suite opinions weigh 3x, ICs weigh 1x)
  function weightedAvg(fn: (a: AgentData) => number): number {
    let totalWeight = 0;
    let totalValue = 0;
    for (const a of active) {
      const weight = 6 - a.identity.tier; // tier 1 = weight 5, tier 5 = weight 1
      totalWeight += weight;
      totalValue += fn(a) * weight;
    }
    return Math.round(totalValue / totalWeight);
  }

  const innovationTemperature = weightedAvg(a => a.personality.creativityIndex);
  const riskAppetite = weightedAvg(a => a.personality.riskTolerance * (a.emotional.momentum / 100));
  const velocityPressure = weightedAvg(a => a.personality.urgencyBias);
  const collaborationDensity = weightedAvg(a => a.personality.collaborationStyle);
  const trustBaseline = weightedAvg(a => a.emotional.confidence);

  const orgMomentum = weightedAvg(a => a.emotional.momentum);

  return {
    date: new Date().toISOString().split('T')[0],
    innovationTemperature,
    riskAppetite,
    velocityPressure,
    collaborationDensity,
    trustBaseline,
    totalAgents: active.length,
    activePredictions: 0,
    orgMomentum,
  };
}
