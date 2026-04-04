// Authenticated fetch wrapper — sends Clerk session token with all API requests

let getToken: (() => Promise<string | null>) | null = null;

export function setAuthTokenGetter(fn: () => Promise<string | null>) {
  getToken = fn;
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);

  // Inject auth token if available
  if (getToken) {
    try {
      const token = await getToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    } catch {
      // Token retrieval failed — continue without auth
    }
  }

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, { ...options, headers });
}

// Convenience for POST JSON
export async function apiPost(url: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const r = await apiFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return r.json();
}
