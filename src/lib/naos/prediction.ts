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
