// Draft-gate step handler.
//
// Emits a DraftArtifact into the provided ArtifactStore + decides whether
// to pause the workflow run (reviewTarget='human-inbox') or continue
// (reviewTarget='auto-approve' with sufficient confidence).

import type { DraftArtifact, DraftGateStep } from '../types';

export interface ArtifactStore {
  create(artifact: Omit<DraftArtifact, 'id' | 'createdAt' | 'updatedAt'>): Promise<DraftArtifact>;
}

export interface DraftGateContext {
  store: ArtifactStore;
  /** Prior-step dispatch result that provides the content to persist */
  content: Record<string, unknown>;
  /** Agent handle that produced the content */
  agentHandle: string;
  /** Confidence from the agent response */
  confidence: number;
  /** Workflow run identifier */
  runId: string;
  workflowId: string;
  ventureId: string | null;
}

export type DraftGateOutcome =
  | { action: 'continue'; artifactId: string }
  | { action: 'pause'; artifactId: string };

/**
 * Run a draft-gate step. Creates the DraftArtifact, then either pauses
 * the run (human review) or proceeds (auto-approve when confidence >=
 * threshold).
 */
export async function runDraftGateStep(
  step: DraftGateStep,
  ctx: DraftGateContext,
): Promise<DraftGateOutcome> {
  const artifact = await ctx.store.create({
    kind: step.artifactKind,
    payload: ctx.content,
    runId: ctx.runId,
    workflowId: ctx.workflowId,
    agentHandle: ctx.agentHandle,
    ventureId: ctx.ventureId,
    confidence: ctx.confidence,
    status: 'proposed',
  });

  if (step.reviewTarget === 'human-inbox') {
    return { action: 'pause', artifactId: artifact.id };
  }

  if (step.reviewTarget === 'auto-approve') {
    const threshold = step.autoApproveConfidence ?? 0.95;
    if (ctx.confidence >= threshold) {
      return { action: 'continue', artifactId: artifact.id };
    }
    return { action: 'pause', artifactId: artifact.id };
  }

  // agent-fleet review — future: dispatch reviewer persona. For now,
  // behave like human-inbox (pause).
  return { action: 'pause', artifactId: artifact.id };
}
