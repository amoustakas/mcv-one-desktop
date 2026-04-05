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
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

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
