import { useNavigation } from '../../stores/navigation';

// ---------------------------------------------------------------------------
// Venture Context Resolver
// Single source of truth for "current venture" across all queries.
// Resolves venture_id to use for scoping Memory, Docs, Files, RAG, Events.
//
// Rules:
// - In venture mode: use activeVenture
// - In global mode: return undefined (no filter — see everything)
// - Explicit override always wins
// ---------------------------------------------------------------------------

export type ScopeMode = 'current-venture' | 'all-ventures' | 'global-only';

export interface VentureScope {
  ventureId?: string;        // Current venture ID (undefined = no venture filter)
  mode: ScopeMode;           // How to interpret the scope
  includeGlobal: boolean;    // Include global records even in venture mode
}

/**
 * Hook — resolves the current venture scope for queries.
 * Use this in every Knowledge Hub query to stay compartmentalized.
 */
export function useVentureScope(override?: { scope?: ScopeMode; ventureId?: string }): VentureScope {
  const { mode, activeVenture } = useNavigation();

  // Explicit override
  if (override?.ventureId !== undefined) {
    return { ventureId: override.ventureId, mode: 'current-venture', includeGlobal: false };
  }

  const scope = override?.scope || (mode === 'venture' ? 'current-venture' : 'all-ventures');

  switch (scope) {
    case 'current-venture':
      return { ventureId: activeVenture || undefined, mode, includeGlobal: true };
    case 'all-ventures':
      return { ventureId: undefined, mode, includeGlobal: true };
    case 'global-only':
      return { ventureId: 'mcv', mode, includeGlobal: false };
  }
}

/**
 * Build a Supabase-style filter clause for the current scope.
 * Returns the value to pass as `venture_id` param to API routes.
 */
export function resolveVentureId(scope: VentureScope): string | undefined {
  return scope.ventureId;
}
