// ---------------------------------------------------------------------------
// Kit Executor Web Worker
// ---------------------------------------------------------------------------
// Runs kit code in an isolated Worker context with no DOM access.
// All external communication (fetch, storage) is proxied through postMessage.
//
// SECURITY NOTE: This worker intentionally evaluates dynamic code strings
// from downloaded kits. The isolation comes from the Worker context itself
// (no DOM, no window, no localStorage) and the fetch proxy pattern
// (all network requests go through the main thread which has auth).

interface WorkerRequest {
  type: 'execute';
  id: string;
  code: string;
  toolName: string;
  input: Record<string, unknown>;
  timeout: number;
}

interface FetchProxyResponse {
  type: 'fetch_response';
  fetchId: string;
  ok: boolean;
  status: number;
  data?: unknown;
  error?: string;
}

// Pending fetch requests waiting for main thread proxy
const pendingFetches = new Map<string, {
  resolve: (v: { ok: boolean; status: number; data: unknown }) => void;
  reject: (e: Error) => void;
}>();
let fetchCounter = 0;

// Proxied fetch — sends request to main thread, waits for response
function proxiedFetch(
  url: string,
  options?: RequestInit,
): Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }> {
  const fetchId = `fetch_${++fetchCounter}`;

  return new Promise((resolve, reject) => {
    pendingFetches.set(fetchId, {
      resolve: (result) => {
        resolve({
          ok: result.ok,
          status: result.status,
          json: async () => result.data,
        });
      },
      reject,
    });

    self.postMessage({
      type: 'fetch_request',
      fetchId,
      url,
      options: options ? {
        method: options.method,
        headers: options.headers,
        body: options.body,
      } : undefined,
    });
  });
}

// Build a sandboxed execution environment for kit code
function buildSandboxedExecutor(code: string): {
  execute: (
    toolName: string,
    input: Record<string, unknown>,
    ctx: { fetch: typeof proxiedFetch },
  ) => Promise<unknown>;
} | null {
  // The kit code must define: exports.execute = async function(toolName, input, ctx) { ... }
  const moduleExports: Record<string, unknown> = {};

  try {
    // Use Function constructor with shadowed Worker globals.
    // This prevents kit code from accessing dangerous APIs directly.
    // NOTE: This is defense-in-depth, not a true security boundary.
    // Determined attackers could still escape via prototype walking.
    // True isolation requires ShadowRealm (not yet widely available).
    const factory = Function(  // eslint-disable-line no-new-func
      'exports',
      'fetch',
      'console',
      // Shadow dangerous Worker globals with undefined
      'self', 'globalThis',
      'XMLHttpRequest', 'importScripts',
      'indexedDB', 'caches',
      'postMessage', 'close',
      'WebSocket', 'EventSource',
      'Worker', 'SharedWorker',
      code,
    );

    const noop = undefined;
    factory(
      moduleExports,
      proxiedFetch,
      { log() {}, warn() {}, error() {} },
      // All shadowed globals → undefined
      noop, noop, noop, noop, noop, noop, noop, noop, noop, noop, noop,
    );
  } catch {
    return null;
  }

  if (typeof moduleExports.execute !== 'function') {
    return null;
  }

  return moduleExports as {
    execute: (
      toolName: string,
      input: Record<string, unknown>,
      ctx: { fetch: typeof proxiedFetch },
    ) => Promise<unknown>;
  };
}

// Handle messages from main thread
self.onmessage = async (event: MessageEvent<WorkerRequest | FetchProxyResponse>) => {
  const msg = event.data;

  // Handle fetch proxy responses from main thread
  if (msg.type === 'fetch_response') {
    const resp = msg as FetchProxyResponse;
    const pending = pendingFetches.get(resp.fetchId);
    if (pending) {
      pendingFetches.delete(resp.fetchId);
      if (resp.error) {
        pending.reject(new Error(resp.error));
      } else {
        pending.resolve({ ok: resp.ok, status: resp.status, data: resp.data });
      }
    }
    return;
  }

  if (msg.type !== 'execute') return;

  const { id, code, toolName, input, timeout } = msg as WorkerRequest;

  // Set up timeout
  const timeoutId = setTimeout(() => {
    self.postMessage({ type: 'error', id, error: `Kit execution timed out after ${timeout}ms` });
    self.close();
  }, timeout);

  try {
    const mod = buildSandboxedExecutor(code);
    if (!mod) {
      throw new Error('Kit module must export an "execute" function');
    }

    const result = await mod.execute(toolName, input, { fetch: proxiedFetch });

    clearTimeout(timeoutId);
    self.postMessage({ type: 'result', id, data: result });
  } catch (err) {
    clearTimeout(timeoutId);
    const message = err instanceof Error ? err.message : 'Unknown execution error';
    self.postMessage({ type: 'error', id, error: message });
  }
};
