// NAOS Prediction Forge — Milofish Integration
// Every decision is a prediction. Collective intelligence emerges from agent consensus.

import type { Prediction } from './types';

/** Create a new prediction entry */
export function createPrediction(
  agentId: string,
  ventureId: string,
  domain: string,
  decisionContext: string,
  predictedOutcome: string,
  confidenceLevel: number,
): Prediction {
  return {
    agentId,
    ventureId,
    domain,
    decisionContext,
    predictedOutcome,
    confidenceLevel: Math.max(0, Math.min(100, confidenceLevel)),
  };
}

/** Resolve a prediction with the actual outcome, compute accuracy */
export function resolvePrediction(prediction: Prediction, actualOutcome: string): Prediction {
  // Accuracy is a fuzzy match — exact match = 100, partial = 50, miss = 0
  // In production, Claude evaluates semantic similarity between predicted and actual
  const accuracy = actualOutcome.toLowerCase() === prediction.predictedOutcome.toLowerCase() ? 100
    : actualOutcome.toLowerCase().includes(prediction.predictedOutcome.toLowerCase().split(' ')[0]) ? 60
    : 20;

  return {
    ...prediction,
    actualOutcome,
    accuracyScore: accuracy,
  };
}

/** Compute weighted consensus from multiple agent predictions */
export function computeConsensus(predictions: {
  prediction: Prediction;
  agentTier: number;
  historicalAccuracy: number;
  emotionalStability: number; // inverse of frustration
}[]): {
  consensusPrediction: string;
  consensusConfidence: number;
  outliers: Prediction[];
} {
  if (predictions.length === 0) {
    return { consensusPrediction: 'No predictions', consensusConfidence: 0, outliers: [] };
  }

  // Weight each prediction
  const weighted = predictions.map(p => {
    const tierWeight = (6 - p.agentTier) / 5; // Tier 1 = 1.0, Tier 5 = 0.2
    const accuracyWeight = p.historicalAccuracy / 100;
    const stabilityWeight = p.emotionalStability / 100;
    const totalWeight = tierWeight * 0.4 + accuracyWeight * 0.4 + stabilityWeight * 0.2;
    return { ...p, weight: totalWeight };
  });

  // Group by predicted outcome, sum weights
  const groups = new Map<string, number>();
  for (const w of weighted) {
    const key = w.prediction.predictedOutcome;
    groups.set(key, (groups.get(key) || 0) + w.weight);
  }

  // Consensus = highest weighted group
  let maxWeight = 0;
  let consensusPrediction = '';
  for (const [outcome, weight] of groups) {
    if (weight > maxWeight) { maxWeight = weight; consensusPrediction = outcome; }
  }

  const totalWeight = Array.from(groups.values()).reduce((s, w) => s + w, 0);
  const consensusConfidence = Math.round((maxWeight / totalWeight) * 100);

  // Outliers = predictions that disagree with consensus
  const outliers = predictions
    .filter(p => p.prediction.predictedOutcome !== consensusPrediction)
    .map(p => p.prediction);

  return { consensusPrediction, consensusConfidence, outliers };
}

/** Compute an agent's historical prediction accuracy */
export function computeAccuracy(resolvedPredictions: Prediction[]): number {
  if (resolvedPredictions.length === 0) return 50; // no data = neutral
  const totalAccuracy = resolvedPredictions.reduce((s, p) => s + (p.accuracyScore || 0), 0);
  return Math.round(totalAccuracy / resolvedPredictions.length);
}

// ---------------------------------------------------------------------------
// Consensus Trials — sim-mode convergence testing (Milofish seam 6)
// ---------------------------------------------------------------------------
// Every high-stakes decision is run through N iterations of the consensus
// engine before HITL approval. Used by sim-mode to verify that the agent
// fleet converges on the same answer across variation seeds, and that
// human-approved outcomes match the model's consensus ≥ threshold of the time.

export interface TrialAgent {
  /** Agent UUID */
  agentId: string;
  /** Organizational tier (1-5) */
  tier: number;
  /** Historical prediction accuracy (0-100) */
  historicalAccuracy: number;
  /** Emotional stability — inverse of frustration (0-100) */
  emotionalStability: number;
}

export interface TrialResolverParams {
  agent: TrialAgent;
  iteration: number;
  decisionContext: string;
  ventureId: string;
  domain: string;
}

export type TrialResolver = (params: TrialResolverParams) => Promise<Prediction> | Prediction;

export interface ConsensusTrialParams {
  /** Agents participating in the trial */
  agents: TrialAgent[];
  /** Decision context string shared across iterations */
  decisionContext: string;
  /** Venture identifier for tagging */
  ventureId: string;
  /** Domain the decision belongs to */
  domain: string;
  /** Number of iterations (default 5) */
  iterations?: number;
  /** Convergence threshold as a 0-1 fraction (default 0.85) */
  confidenceThreshold?: number;
  /**
   * Prediction producer. In sim-mode, a deterministic or rule-based resolver.
   * In production, the Claude-dispatched agent. Return one prediction per agent per iteration.
   */
  resolver: TrialResolver;
}

export interface ConsensusIterationResult {
  iteration: number;
  consensusPrediction: string;
  consensusConfidence: number;
  outliers: Prediction[];
  /** Every prediction produced in this iteration, keyed by agentId */
  predictionsByAgent: Record<string, Prediction>;
}

export interface ConsensusTrialResult {
  iterations: ConsensusIterationResult[];
  aggregate: {
    /** Most common consensus across all iterations */
    dominantConsensus: string;
    /** Fraction of iterations matching dominantConsensus (0-1) */
    convergenceScore: number;
    /** Average consensus confidence across iterations (0-100) */
    averageConfidence: number;
    /** Whether convergenceScore met confidenceThreshold */
    metThreshold: boolean;
  };
  /** Agents whose predictions disagreed with consensus in >50% of iterations */
  chronicOutliers: string[];
  /** Total trial runtime in milliseconds */
  durationMs: number;
  /** Timestamp (ISO) when trial finished */
  completedAt: string;
}

/**
 * Run N iterations of consensus over the same decision with (optionally varying)
 * resolvers. Returns per-iteration results plus aggregate convergence metrics.
 *
 * In sim-mode: resolver is deterministic or rule-based, no real API calls.
 * In production: resolver dispatches agents via NAOS runtime + Claude.
 *
 * Convergence ≥ threshold signals safe-to-approve; chronic outliers signal
 * agents whose opinions diverge from the fleet (flag for tier review or
 * retraining).
 */
export async function runConsensusTrial(
  params: ConsensusTrialParams,
): Promise<ConsensusTrialResult> {
  const iterations = params.iterations ?? 5;
  const confidenceThreshold = params.confidenceThreshold ?? 0.85;
  const startedAt = Date.now();
  const iterationResults: ConsensusIterationResult[] = [];

  for (let i = 0; i < iterations; i++) {
    const iterationPredictions = await Promise.all(
      params.agents.map(async (agent) => {
        const prediction = await params.resolver({
          agent,
          iteration: i,
          decisionContext: params.decisionContext,
          ventureId: params.ventureId,
          domain: params.domain,
        });
        return { agent, prediction };
      }),
    );

    const consensus = computeConsensus(
      iterationPredictions.map(({ agent, prediction }) => ({
        prediction,
        agentTier: agent.tier,
        historicalAccuracy: agent.historicalAccuracy,
        emotionalStability: agent.emotionalStability,
      })),
    );

    const predictionsByAgent: Record<string, Prediction> = {};
    for (const { agent, prediction } of iterationPredictions) {
      predictionsByAgent[agent.agentId] = prediction;
    }

    iterationResults.push({
      iteration: i,
      consensusPrediction: consensus.consensusPrediction,
      consensusConfidence: consensus.consensusConfidence,
      outliers: consensus.outliers,
      predictionsByAgent,
    });
  }

  // Aggregate: find the dominant consensus across iterations
  const consensusCounts = new Map<string, number>();
  for (const result of iterationResults) {
    consensusCounts.set(
      result.consensusPrediction,
      (consensusCounts.get(result.consensusPrediction) || 0) + 1,
    );
  }

  let dominantConsensus = '';
  let dominantCount = 0;
  for (const [prediction, count] of consensusCounts) {
    if (count > dominantCount) {
      dominantCount = count;
      dominantConsensus = prediction;
    }
  }

  const convergenceScore = iterations > 0 ? dominantCount / iterations : 0;
  const averageConfidence = iterations > 0
    ? Math.round(iterationResults.reduce((s, r) => s + r.consensusConfidence, 0) / iterations)
    : 0;
  const metThreshold = convergenceScore >= confidenceThreshold;

  // Identify chronic outliers: agents who disagreed in >50% of iterations
  const disagreementCounts = new Map<string, number>();
  for (const result of iterationResults) {
    for (const agent of params.agents) {
      const prediction = result.predictionsByAgent[agent.agentId];
      if (prediction && prediction.predictedOutcome !== result.consensusPrediction) {
        disagreementCounts.set(agent.agentId, (disagreementCounts.get(agent.agentId) || 0) + 1);
      }
    }
  }
  const chronicOutliers: string[] = [];
  for (const [agentId, count] of disagreementCounts) {
    if (count / iterations > 0.5) chronicOutliers.push(agentId);
  }

  return {
    iterations: iterationResults,
    aggregate: {
      dominantConsensus,
      convergenceScore,
      averageConfidence,
      metThreshold,
    },
    chronicOutliers,
    durationMs: Date.now() - startedAt,
    completedAt: new Date().toISOString(),
  };
}

/**
 * Deterministic rule-based resolver for sim-mode. Given an agent's tier and
 * domain familiarity, produces a prediction scored by a hashed projection
 * of (agentId + iteration + decisionContext). Same inputs → same outputs
 * (reproducible sim runs). Use for unit tests + offline trial harnesses.
 */
export function createDeterministicResolver(
  outcomeChoices: string[],
): TrialResolver {
  if (outcomeChoices.length === 0) {
    throw new Error('createDeterministicResolver: outcomeChoices must be non-empty');
  }
  return (params: TrialResolverParams): Prediction => {
    // Hash agent + iteration + context to a stable index
    const key = `${params.agent.agentId}:${params.iteration}:${params.decisionContext}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
    }
    const choiceIndex = Math.abs(hash) % outcomeChoices.length;
    // Confidence tracks tier + historical accuracy; higher tier + more accurate = more confident
    const confidence = Math.round(
      (6 - params.agent.tier) * 10 + params.agent.historicalAccuracy * 0.4,
    );
    return createPrediction(
      params.agent.agentId,
      params.ventureId,
      params.domain,
      params.decisionContext,
      outcomeChoices[choiceIndex],
      Math.min(100, Math.max(0, confidence)),
    );
  };
}
