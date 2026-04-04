// Auth-aware fetch — intercepts all /api/ calls to inject Clerk JWT

let getToken: (() => Promise<string | null>) | null = null;

export function setAuthTokenGetter(fn: () => Promise<string | null>) {
  getToken = fn;
}

// Install global fetch interceptor for /api/ routes
const originalFetch = window.fetch.bind(window);

window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;

  // Only intercept our API routes
  if (url.startsWith('/api/') && getToken) {
    try {
      const token = await getToken();
      if (token) {
        const headers = new Headers(init?.headers);
        if (!headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        return originalFetch(input, { ...init, headers });
      }
    } catch {
      // Token retrieval failed — send request without auth
    }
  }

  return originalFetch(input, init);
};
