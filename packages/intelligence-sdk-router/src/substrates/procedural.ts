/**
 * Procedural substrate — kit_audit_log (tool-use history).
 *
 * Table: kit_audit_log (existing — appended by every kit tool call)
 * Scope: tenant + user + tool. Non-vector; ranked by recency.
 * Used to inform agents about what tools they've used recently, which
 * decompose into "how do I solve this type of problem" priors.
 */

import type { RecallArgs, RecallHit, SubstrateAdapter, SubstrateContext } from '../types.js';
import { recencyScore } from '../ranker.js';

export const proceduralAdapter: SubstrateAdapter = {
  kind: 'procedural',
  async recall(args: RecallArgs, _queryEmbedding: number[] | null, ctx: SubstrateContext): Promise<RecallHit[]> {
    void _queryEmbedding;
    if (!ctx.userId) return [];
    const topK = Math.min(args.topK ?? 8, 50);

    let builder = ctx.supabase
      .from('kit_audit_log')
      .select('id, kit_id, tool_name, user_id, status, error_message, created_at')
      .eq('user_id', ctx.userId)
      .order('created_at', { ascending: false })
      .limit(topK);
    if (args.filters?.since) {
      builder = builder.gte('created_at', args.filters.since);
    }
    const { data, error } = await builder;
    if (error) {
      // Defensive — kit_audit_log schema may vary across environments.
      return [];
    }
    const rows = (data ?? []) as Array<{
      id: string;
      kit_id: string | null;
      tool_name: string | null;
      user_id: string;
      status: string | null;
      error_message: string | null;
      created_at: string;
    }>;

    const query = args.query?.trim().toLowerCase() ?? '';
    return rows.map((r) => {
      const toolMatches = query && r.tool_name
        ? r.tool_name.toLowerCase().includes(query)
        : false;
      return {
        id: `kit_audit:${r.id}`,
        substrate: 'procedural' as const,
        content: `${r.tool_name ?? '(unnamed-tool)'} [${r.status ?? 'unknown'}]${r.error_message ? ` — ${r.error_message}` : ''}`,
        similarity: toolMatches ? 0.75 : 0.45,
        recencyScore: recencyScore(r.created_at),
        confidence: r.status === 'success' ? 0.85 : 0.4,
        provenance: {
          source: `kit_audit:${r.id}`,
          driver: 'procedural',
        },
        metadata: {
          kitId: r.kit_id,
          toolName: r.tool_name,
          status: r.status,
          createdAt: r.created_at,
        },
      };
    });
  },
};
