// SQL step handler.
//
// Delegates to a caller-provided QueryExecutor. Separating the executor
// from the step primitive lets prod wire Supabase RPC or direct pg, while
// tests use an in-memory executor with assertion hooks.

import type { SqlStep } from '../types';

export interface SqlQuery {
  sql: string;
  params: Record<string, unknown>;
  /** Whether this query mutates state; classifies audit trail */
  mutating: boolean;
}

export interface SqlResult {
  rows: unknown[];
  rowCount: number;
  /** Additional metadata surfaced by the executor (e.g., Postgres command tag) */
  metadata?: Record<string, unknown>;
}

export interface QueryExecutor {
  execute(query: SqlQuery): Promise<SqlResult>;
}

export interface SqlStepContext {
  executor: QueryExecutor;
  /** Used to resolve :named params referenced in the SQL template */
  variables: Record<string, unknown>;
}

export async function runSqlStep(step: SqlStep, ctx: SqlStepContext): Promise<SqlResult> {
  const resolvedParams = resolveNamedParams(step.params, ctx.variables);
  return ctx.executor.execute({
    sql: step.sqlTemplate,
    params: resolvedParams,
    mutating: step.mutating,
  });
}

/**
 * Resolve any string param values that reference context variables via
 * `$varName` convention. Non-string params pass through unchanged. Lets
 * callers write `{ userId: '$triggerPayload.userId' }` in the step def.
 */
export function resolveNamedParams(
  declared: Record<string, unknown>,
  variables: Record<string, unknown>,
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(declared)) {
    if (typeof value === 'string' && value.startsWith('$')) {
      const path = value.slice(1);
      resolved[key] = resolvePath(variables, path);
    } else {
      resolved[key] = value;
    }
  }
  return resolved;
}

function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
