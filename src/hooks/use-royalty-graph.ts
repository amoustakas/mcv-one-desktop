// src/hooks/use-royalty-graph.ts
//
// React Query hooks for the T8.5 royalty-graph editor
// (`/api/royalty-graph` — get_active_graph / add_layer / update_layer).
//
// Contract: the graph/layer row shapes mirror `capital_royalty_graph` and
// `capital_royalty_graph_layer`. Hook inputs are camelCase; request bodies
// are snake_case to match the handler.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../lib/api/client';

export interface RoyaltyGraphRow {
  id: string;
  venture_id: string;
  label: string;
  version: number;
  effective_at: string;
  superseded_at: string | null;
  metadata: Record<string, unknown>;
}

export type RoyaltyKind =
  | 'platform_rake'
  | 'venture_rake'
  | 'ip_royalty'
  | 'affiliate'
  | 'creator_share'
  | 'reserve'
  | 'burn'
  | 'fee_split'
  | 'other';

export type RoyaltyRecipientType = 'treasury' | 'user' | 'external_entity' | 'pool';

export interface RoyaltyLayer {
  id: string;
  graph_id: string;
  sequence: number;
  label: string;
  recipient_type: RoyaltyRecipientType;
  recipient_id: string;
  bps: number;
  kind: RoyaltyKind;
  condition_expr: string | null;
  jurisdiction: string | null;
  metadata: Record<string, unknown>;
}

/** Fetch the active royalty graph + its ordered layers for a venture. */
export function useActiveRoyaltyGraph(ventureId: string | null) {
  return useQuery({
    queryKey: ['royalty-graph', 'active', ventureId],
    queryFn: () =>
      apiPost<{ graph: RoyaltyGraphRow | null; layers: RoyaltyLayer[]; total_bps: number }>(
        '/api/royalty-graph',
        { action: 'get_active_graph', venture_id: ventureId! },
      ),
    enabled: !!ventureId,
    staleTime: 30_000,
  });
}

/** Add a layer to an active royalty graph. Invalidates the graph query on success. */
export function useAddRoyaltyLayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      graphId: string;
      sequence: number;
      label: string;
      recipientType: RoyaltyRecipientType;
      recipientId: string;
      bps: number;
      kind: RoyaltyKind;
      conditionExpr?: string;
      jurisdiction?: string;
    }) =>
      apiPost<{ layer: RoyaltyLayer }>('/api/royalty-graph', {
        action: 'add_layer',
        graph_id: input.graphId,
        sequence: input.sequence,
        label: input.label,
        recipient_type: input.recipientType,
        recipient_id: input.recipientId,
        bps: input.bps,
        kind: input.kind,
        condition_expr: input.conditionExpr,
        jurisdiction: input.jurisdiction,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['royalty-graph'] }),
  });
}

/** Update a layer's bps/label/sequence. Invalidates the graph query on success. */
export function useUpdateRoyaltyLayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { layerId: string; bps?: number; label?: string; sequence?: number }) =>
      apiPost<{ layer: RoyaltyLayer }>('/api/royalty-graph', {
        action: 'update_layer',
        layer_id: input.layerId,
        bps: input.bps,
        label: input.label,
        sequence: input.sequence,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['royalty-graph'] }),
  });
}
