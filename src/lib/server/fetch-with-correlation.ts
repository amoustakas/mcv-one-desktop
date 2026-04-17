// Thin fetch wrapper that auto-injects x-correlation-id on outbound calls
// when an AsyncLocalStorage correlation_id is active. Use for calls to
// Triangle, Factory, Stripe, Plaid, Supabase so a single ID traces the
// full request path across the stack.

import { getActiveCorrelationId, withCorrelationHeader } from './correlation';

export async function fetchWithCorrelation(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const activeId = getActiveCorrelationId();
  if (activeId) {
    init.headers = withCorrelationHeader(
      init.headers as Record<string, string> | undefined,
      activeId,
    );
  }
  return fetch(input, init);
}

export { fetchWithCorrelation as cfetch };
