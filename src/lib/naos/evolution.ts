// @ts-nocheck
// NAOS Evolution Engine — Agent Growth, Trait Drift, Emotional Shifts, Skill Progression
// Every interaction updates agents across all 6 dimensions

import type {
  PersonalityMatrix, EmotionalState, AgentIdentity,
  InteractionOutcome, AgentMilestone,
} from './types';
import { generateFullName } from './genesis';

// ---------------------------------------------------------------------------
// Trait Drift — Personality Evolution
// ---------------------------------------------------------------------------

interface TraitShiftParams {
  outcome: InteractionOutcome;
  humanFeedback?: 'praise' | 'neutral' | 'correction' | 'veto';
  significance: number;  // 1-10 scale of how important this interaction was
  domain: string;
}

const OUTCOME_WEIGHTS: Record<InteractionOutcome, number> = {
  success: 0.5,
  failure: -2.0,
  partial: -0.3,
  vetoed: -1.0,
  pending: 0,
};

const FEEDBACK_WEIGHTS: Record<string, number> = {
  praise: 1.5,
  neutral: 0,
  correction: -0.5,
  veto: -1.5,
};

/** Compute trait deltas from an interaction outcome */
export function computeTraitDeltas(
  current: PersonalityMatrix,
  emotional: EmotionalState,
  params: TraitShiftParams,
): Partial<PersonalityMatrix> {
  const baseShift = (params.significance / 10) * 3; // max ±3 per interaction
  const outcomeWeight = OUTCOME_WEIGHTS[params.outcome];
  const feedbackWeight = params.humanFeedback ? FEEDBACK_WEIGHTS[params.humanFeedback] : 0;
  const momentumMultiplier = emotional.momentum > 85 ? 1.5 : emotional.momentum < 20 ? 0.5 : 1.0;

  const totalShift = baseShift * (outcomeWeight + feedbackWeight) * momentumMultiplier;

  const deltas: Partial<PersonalityMatrix> = {};

  if (params.outcome === 'success') {
    // Success increases confidence-related traits
    deltas.riskTolerance = clampDelta(totalShift * 0.3);
    deltas.assertiveness = clampDelta(totalShift * 0.4);
    deltas.urgencyBias = clampDelta(totalShift * 0.1);
  } else if (params.outcome === 'vetoed') {
    // Vetoes increase caution, decrease assertiveness
    deltas.riskTolerance = clampDelta(totalShift * 0.5);  // negative shift
    deltas.assertiveness = clampDelta(totalShift * 0.3);
    deltas.collaborationStyle = clampDelta(Math.abs(totalShift) * 0.2); // seek more input
  } else if (params.outcome === 'failure') {
    // Failure increases analytical bias (learn from mistakes)
    deltas.analyticalBias = clampDelta(Math.abs(totalShift) * 0.3);
    deltas.riskTolerance = clampDelta(totalShift * 0.4);
    deltas.urgencyBias = clampDelta(totalShift * 0.2); // slow down after failure
  }

  if (params.humanFeedback === 'praise') {
    deltas.creativityIndex = clampDelta(0.5); // reinforced, try more
  }

  return deltas;
}

/** Apply trait deltas to personality, respecting guardrails */
export function applyTraitDeltas(
  personality: PersonalityMatrix,
  deltas: Partial<PersonalityMatrix>,
): PersonalityMatrix {
  const updated = { ...personality };
  const numericTraits = [
    'riskTolerance', 'analyticalBias', 'creativityIndex', 'urgencyBias',
    'collaborationStyle', 'formalityLevel', 'verbosity', 'humorIndex',
    'assertiveness', 'empathyScore',
  ] as const;

  for (const trait of numericTraits) {
    if (deltas[trait] != null) {
      const newVal = personality[trait] + (deltas[trait] as number);
      (updated[trait] as number) = Math.max(5, Math.min(95, newVal)); // guardrail: 5-95
    }
  }

  return updated;
}

/** Clamp a trait delta to ±5 max (daily limit is enforced at the store level) */
function clampDelta(delta: number): number {
  return Math.max(-5, Math.min(5, delta));
}

// ---------------------------------------------------------------------------
// Emotional State Updates
// ---------------------------------------------------------------------------

export function computeEmotionalDeltas(
  current: EmotionalState,
  outcome: InteractionOutcome,
  feedback?: string,
  significance?: number,
): Partial<EmotionalState> {
  const deltas: Partial<EmotionalState> = {};
  const sig = (significance || 5) / 10;

  switch (outcome) {
    case 'success':
      deltas.confidence = 3 * sig;
      deltas.engagement = 2 * sig;
      deltas.frustration = -2 * sig;
      deltas.excitement = 4 * sig;
      deltas.caution = -1 * sig;
      break;
    case 'failure':
      deltas.confidence = -4 * sig;
      deltas.frustration = 5 * sig;
      deltas.caution = 4 * sig;
      deltas.excitement = -3 * sig;
      break;
    case 'vetoed':
      deltas.confidence = -3 * sig;
      deltas.frustration = 4 * sig;
      deltas.caution = 3 * sig;
      deltas.assertiveness = -2 * sig;
      break;
    case 'partial':
      deltas.confidence = -1 * sig;
      deltas.caution = 1 * sig;
      break;
  }

  if (feedback === 'praise') {
    deltas.confidence = (deltas.confidence || 0) + 3;
    deltas.excitement = (deltas.excitement || 0) + 2;
    deltas.engagement = (deltas.engagement || 0) + 2;
  }

  return deltas;
}

/** Apply emotional deltas, clamping to 0-100 */
export function applyEmotionalDeltas(
  state: EmotionalState,
  deltas: Partial<EmotionalState>,
  triggerEvent: string,
): EmotionalState {
  const updated = { ...state };
  const fields = ['confidence', 'engagement', 'frustration', 'excitement', 'caution'] as const;

  for (const field of fields) {
    if (deltas[field] != null) {
      (updated[field] as number) = Math.max(0, Math.min(100, state[field] + (deltas[field] as number)));
    }
  }

  updated.triggers = [
    { event: triggerEvent, delta: Object.values(deltas).reduce((s, v) => s + (v || 0), 0), timestamp: new Date().toISOString() },
    ...state.triggers.slice(0, 19), // keep last 20 triggers
  ];
  updated.lastUpdated = new Date().toISOString();

  return updated;
}

// ---------------------------------------------------------------------------
// Momentum Calculation
// ---------------------------------------------------------------------------

/** Update momentum based on rolling window of outcomes */
export function updateMomentum(recentOutcomes: InteractionOutcome[]): number {
  const last10 = recentOutcomes.slice(-10);
  if (last10.length === 0) return 50;
  const successCount = last10.filter(o => o === 'success').length;
  return Math.round((successCount / last10.length) * 100);
}

// ---------------------------------------------------------------------------
// Skill Growth
// ---------------------------------------------------------------------------

export function updateDomainMastery(
  current: Record<string, number>,
  domain: string,
  outcome: InteractionOutcome,
  isNovelProblem: boolean,
  isCrossVenture: boolean,
): Record<string, number> {
  const updated = { ...current };
  const currentLevel = updated[domain] || 0;

  let delta = 0;
  if (outcome === 'success') {
    delta = isNovelProblem ? 5 : isCrossVenture ? 10 : Math.max(1, 3 - Math.floor(currentLevel / 30));
  } else if (outcome === 'failure') {
    delta = -0.5; // small decay on failure (learning from mistakes isn't punished hard)
  }

  updated[domain] = Math.max(0, Math.min(100, currentLevel + delta));
  return updated;
}

export function updateToolProficiency(
  current: Record<string, number>,
  tool: string,
  outcome: InteractionOutcome,
): Record<string, number> {
  const updated = { ...current };
  const currentLevel = updated[tool] || 0;
  const delta = outcome === 'success' ? 2 : outcome === 'failure' ? -0.5 : 0;
  updated[tool] = Math.max(0, Math.min(100, currentLevel + delta));
  return updated;
}

// ---------------------------------------------------------------------------
// Milestone Progression
// ---------------------------------------------------------------------------

export function checkMilestone(agent: AgentIdentity): {
  newMilestone: AgentMilestone | null;
  nameReady: boolean;
  fullName: string | null;
} {
  const count = agent.interactionCount;
  let newMilestone: AgentMilestone | null = null;
  let nameReady = false;
  let fullName: string | null = null;

  if (count >= 1000 && agent.milestone !== 'legendary') {
    newMilestone = 'legendary';
  } else if (count >= 500 && agent.milestone !== 'veteran' && agent.milestone !== 'legendary') {
    newMilestone = 'veteran';
  } else if (count >= 250 && !['established', 'veteran', 'legendary'].includes(agent.milestone)) {
    newMilestone = 'established';
  } else if (count >= 100 && !['settled', 'established', 'veteran', 'legendary'].includes(agent.milestone)) {
    newMilestone = 'settled';
  }

  // Name crystallization at 50 interactions
  if (count >= 50 && !agent.fullName) {
    nameReady = true;
    fullName = generateFullName(agent.codename, agent.role);
  }

  return { newMilestone, nameReady, fullName };
}

// ---------------------------------------------------------------------------
// Achievement Checking
// ---------------------------------------------------------------------------

export interface AchievementCheck {
  id: string;
  name: string;
  emoji: string;
  check: (agent: AgentIdentity, stats: AgentStats) => boolean;
}

interface AgentStats {
  consecutiveSuccesses: number;
  venturesCovered: number;
  predictionAccuracy: number;
  predictionsLogged: number;
  menteesEstablished: number;
  systemsDesigned: number;
  crisisSuccesses: number;
  totalInteractions: number;
  successRate: number;
  uniquePredictions: number;
  conflictsResolved: number;
}

export const ACHIEVEMENTS: AchievementCheck[] = [
  { id: 'first_blood', name: 'First Blood', emoji: '🏆', check: (_, s) => s.totalInteractions >= 1 && s.successRate > 0 },
  { id: 'streak_master', name: 'Streak Master', emoji: '⚡', check: (_, s) => s.consecutiveSuccesses >= 20 },
  { id: 'cross_venture', name: 'Cross-Venture', emoji: '🌍', check: (_, s) => s.venturesCovered >= 3 },
  { id: 'oracle', name: 'Oracle', emoji: '🔮', check: (_, s) => s.predictionsLogged >= 10 && s.predictionAccuracy >= 90 },
  { id: 'mentor', name: 'Mentor', emoji: '🎓', check: (_, s) => s.menteesEstablished >= 3 },
  { id: 'architect', name: 'Architect', emoji: '🏗️', check: (_, s) => s.systemsDesigned >= 5 },
  { id: 'clutch', name: 'Clutch', emoji: '🔥', check: (_, s) => s.crisisSuccesses >= 3 },
  { id: 'legendary', name: 'Legendary', emoji: '💎', check: (_, s) => s.totalInteractions >= 1000 && s.successRate >= 80 },
  { id: 'visionary', name: 'Visionary', emoji: '👁️', check: (_, s) => s.uniquePredictions >= 1 },
  { id: 'diplomat', name: 'Diplomat', emoji: '🤝', check: (_, s) => s.conflictsResolved >= 5 },
];

export function checkAchievements(agent: AgentIdentity, stats: AgentStats): string[] {
  const newAchievements: string[] = [];
  for (const achievement of ACHIEVEMENTS) {
    if (!agent.achievements.includes(achievement.id) && achievement.check(agent, stats)) {
      newAchievements.push(achievement.id);
    }
  }
  return newAchievements;
}
