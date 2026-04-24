/**
 * Referential substrate — agent_drafts.context_refs JSONB.
 *
 * Table: agent_drafts (migration-agent-drafts-2026-04-24.sql)
 * Column: context_refs jsonb DEFAULT '[]' — entries like
 *         [{"kind":"counsel_engagement","id":"goodmans-ip","label":"..."}]
 *
 * Referential is artifact-scoped, not query-scoped: it resolves refs
 * from a named draft ID (supplied via filters.correlationId OR via the
 * Router's context() entry-point). For free-text recall, referential
 * returns [] unless a correlationId scopes it.
 */

import type { RecallArgs, RecallHit, SubstrateAdapter, SubstrateContext } from '../types.js';
import { recencyScore } from '../ranker.js';

export const referentialAdapter: SubstrateAdapter = {
  kind: 'referential',
  async recall(args: RecallArgs, _queryEmbedding: number[] | null, ctx: SubstrateContext): Promise<RecallHit[]> {
    void _queryEmbedding;
    const correlationId = args.filters?.correlationId;
    if (!correlationId) return [];

    const { data, error } = await ctx.supabase
      .from('agent_drafts')
      .select('id, title, context_refs, target_venture, created_at')
      .order('created_at', { ascending: false })
      .limit(Math.min(args.topK ?? 8, 50));
    if (error) return [];
    const rows = (data ?? []) as Array<{
      id: string;
      title: string;
      context_refs: unknown;
      target_venture: string | null;
      created_at: string;
    }>;

    const hits: RecallHit[] = [];
    for (const draft of rows) {
      if (!Array.isArray(draft.context_refs)) continue;
      for (const ref of draft.context_refs) {
        if (!ref || typeof ref !== 'object') continue;
        const r = ref as { kind?: string; id?: string; label?: string };
        if (!r.kind || !r.id) continue;
        hits.push({
          id: `ref:${draft.id}:${r.kind}:${r.id}`,
          substrate: 'referential',
          content: `${r.kind}:${r.id}${r.label ? ` — ${r.label}` : ''}`,
          similarity: 0.6,
          recencyScore: recencyScore(draft.created_at),
          confidence: 0.85,
          provenance: {
            source: `draft:${draft.id}`,
            driver: 'referential',
            ventureId: draft.target_venture ?? undefined,
          },
          metadata: {
            draftId: draft.id,
            draftTitle: draft.title,
            refKind: r.kind,
            refId: r.id,
            refLabel: r.label,
          },
        });
      }
    }
    return hits;
  },
};
