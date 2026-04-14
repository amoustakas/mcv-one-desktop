// Base API client — typed fetch wrapper with auth (via global interceptor) and error handling

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/** POST to a Vercel serverless API endpoint */
export async function apiPost<T>(
  endpoint: string,
  body: Record<string, unknown>,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    // Network-level failure — dev server down, CORS, proxy misconfig, etc.
    throw new ApiError(
      `Network error calling ${endpoint}: ${networkErr instanceof Error ? networkErr.message : 'unknown'}`,
      0,
    );
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    // Make common failure modes diagnosable instead of showing "unknown error"
    let message = data.error || data.message;
    if (!message) {
      if (res.status === 401) message = 'Authentication required — sign in to continue';
      else if (res.status === 403) message = 'Forbidden — your account lacks access to this resource';
      else if (res.status === 404) message = `Endpoint ${endpoint} not found (is the dev server running on port 3100?)`;
      else if (res.status >= 500) message = `Server error (${res.status}) — check the dev server terminal for details`;
      else message = `API error ${res.status}`;
    }
    throw new ApiError(message, res.status, data);
  }

  return res.json();
}

/** GET from a Vercel serverless API endpoint with query params */
export async function apiGet<T>(
  endpoint: string,
  params?: Record<string, string | undefined>,
): Promise<T> {
  const url = new URL(endpoint, window.location.origin);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString());

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(
      data.error || `API error: ${res.status}`,
      res.status,
      data,
    );
  }

  return res.json();
}
