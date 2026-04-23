// Draft-artifact store contract + in-memory reference implementation.
//
// Production uses Supabase-backed draft_artifacts table; tests and
// sim-mode use InMemoryArtifactStore. Both implement ArtifactStore
// interface from steps/draft-gate.ts so call sites are swap-compatible.

import type { ArtifactStatus, DraftArtifact } from './types';
import type { ArtifactStore } from './steps/draft-gate';

function generateId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `draft-${ts}-${rand}`;
}

function isoNow(): string {
  return new Date().toISOString();
}

export class InMemoryArtifactStore implements ArtifactStore {
  private buffer: DraftArtifact[] = [];

  async create(input: Omit<DraftArtifact, 'id' | 'createdAt' | 'updatedAt'>): Promise<DraftArtifact> {
    const now = isoNow();
    const artifact: DraftArtifact = {
      ...input,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    this.buffer.unshift(artifact);
    return artifact;
  }

  async get(id: string): Promise<DraftArtifact | null> {
    return this.buffer.find((a) => a.id === id) ?? null;
  }

  async list(options: { status?: ArtifactStatus; limit?: number } = {}): Promise<DraftArtifact[]> {
    const filtered = options.status
      ? this.buffer.filter((a) => a.status === options.status)
      : this.buffer;
    return filtered.slice(0, options.limit ?? 100);
  }

  async transition(
    id: string,
    newStatus: ArtifactStatus,
    reviewer: { userId: string; note?: string },
  ): Promise<DraftArtifact> {
    const artifact = this.buffer.find((a) => a.id === id);
    if (!artifact) throw new Error(`[draft-artifacts] artifact ${id} not found`);
    artifact.status = newStatus;
    artifact.updatedAt = isoNow();
    artifact.reviewerUserId = reviewer.userId;
    if (reviewer.note !== undefined) artifact.reviewerNote = reviewer.note;
    return artifact;
  }

  clear(): void {
    this.buffer.length = 0;
  }

  size(): number {
    return this.buffer.length;
  }
}
