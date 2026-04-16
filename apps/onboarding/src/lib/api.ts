// Thin client-side API helpers — POST to local Next.js server routes.
// /api/prospect drives the @mcv/onboarding-sdk orchestrator.
// /api/chat drives the agent-routed conversation (per journey, per agent).

export interface ApiCallOptions {
  action: string;
  [key: string]: unknown;
}

async function callApi<T>(endpoint: string, body: ApiCallOptions): Promise<T> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || `API ${res.status}`);
  }
  return res.json();
}

export function callProspectApi<T = unknown>(body: ApiCallOptions): Promise<T> {
  return callApi<T>('/api/prospect', body);
}

export function callChatApi<T = unknown>(body: ApiCallOptions): Promise<T> {
  return callApi<T>('/api/chat', body);
}
