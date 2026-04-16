// Thin client-side API helper — POSTs to the local Next.js server route
// at /api/prospect, which holds the service-role Supabase key and calls
// the @mcv/onboarding-sdk orchestrator.

export interface ApiCallOptions {
  action: string;
  [key: string]: unknown;
}

export async function callProspectApi<T = unknown>(body: ApiCallOptions): Promise<T> {
  const res = await fetch('/api/prospect', {
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
