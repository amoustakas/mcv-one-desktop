import { useQuery } from '@tanstack/react-query';
import { apiPost } from '../lib/api/client';

// ── Types ──────────────────────────────────────────────────────────────────
export type DossierEntityType =
  | 'prospect'
  | 'venture'
  | 'round'
  | 'contact'
  | 'deal'
  | 'organization';

export type Confidence = 'high' | 'medium' | 'low' | 'speculative';

export interface DossierFinding {
  claim: string;
  evidence: string;
  confidence: Confidence;
}

export interface DossierSource {
  url: string;
  accessed_at: string;
  author?: string;
  type?: string;
}

export interface Dossier {
  id: string;
  entity_type: DossierEntityType;
  entity_id: string;
  title: string;
  summary: string | null;
  findings: DossierFinding[];
  sources: DossierSource[];
  confidence: Confidence;
  authored_by_agent_id: string | null;
  authored_by_user_id: string | null;
  stale_at: string | null;
  version: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UseDossiersInput {
  entityType: DossierEntityType;
  /** null/undefined disables the query */
  entityId: string | null | undefined;
}

// ── Hooks ──────────────────────────────────────────────────────────────────

/** List all dossier versions for a given entity, newest version first. */
export function useResearchDossiers({ entityType, entityId }: UseDossiersInput) {
  return useQuery({
    queryKey: ['research-dossier', entityType, entityId],
    queryFn: () =>
      apiPost<{ dossiers: Dossier[] }>('/api/research', {
        action: 'list_dossiers',
        entity_type: entityType,
        entity_id: entityId!,
      }),
    enabled: !!entityId,
    staleTime: 30_000,
  });
}

/** Return just the latest (highest-version) dossier for an entity. */
export function useLatestDossier({ entityType, entityId }: UseDossiersInput) {
  return useQuery({
    queryKey: ['research-dossier-latest', entityType, entityId],
    queryFn: () =>
      apiPost<{ dossier: Dossier | null }>('/api/research', {
        action: 'latest_dossier',
        entity_type: entityType,
        entity_id: entityId!,
      }),
    enabled: !!entityId,
    staleTime: 30_000,
  });
}
