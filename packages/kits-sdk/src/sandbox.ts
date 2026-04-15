import type { ToolCallResult } from './types';

// ---------------------------------------------------------------------------
// Kit Sandbox — Web Worker-based isolated execution environment
// ---------------------------------------------------------------------------
//
// The Worker file lives in the consuming app (it's a Vite asset URL referenced
// via `new URL('./path/to/worker.ts', import.meta.url)`), so the SDK can't
// instantiate it directly. Apps configure the worker factory once at startup:
//
//   import { configureSandbox } from '@mcv/kits-sdk/sandbox';
//   configureSandbox({
//     workerFactory: () => new Worker(
//       new URL('./workers/kit-executor.worker.ts', import.meta.url),
//       { type: 'module' },
//     ),
//   });
//
// After that, getDefaultSandbox() and KitSandbox both work portably.

interface SandboxOptions {
  timeout?: number;  // ms, default 30000
}

interface PendingExecution {
  resolve: (result: ToolCallResult) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

interface FetchProxyRequest {
  type: 'fetch_request';
  fetchId: string;
  url: string;
  options?: RequestInit;
}

export type WorkerFactory = () => Worker;

export class KitSandbox {
  private worker: Worker | null = null;
  private pending = new Map<string, PendingExecution>();
  private executionCount = 0;
  private workerFactory?: WorkerFactory;

  constructor(workerFactory?: WorkerFactory) {
    this.workerFactory = workerFactory;
  }

  /** Execute kit code in the Web Worker sandbox */
  async execute(
    code: string,
    toolName: string,
    input: Record<string, unknown>,
    options: SandboxOptions = {},
  ): Promise<ToolCallResult> {
    const timeout = options.timeout ?? 30000;
    const id = `exec_${++this.executionCount}`;

    // Create worker on first use (lazy init)
    if (!this.worker) {
      const factory = this.workerFactory ?? defaultWorkerFactory;
      if (!factory) {
        return {
          success: false,
          error: 'KitSandbox: no workerFactory configured. Call configureSandbox({ workerFactory }) at app startup.',
        };
      }
      this.worker = factory();
      this.worker.onmessage = (event) => this.handleWorkerMessage(event);
      this.worker.onerror = (event) => this.handleWorkerError(event);
    }

    return new Promise<ToolCallResult>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pending.delete(id);
        this.terminate();
        resolve({
          success: false,
          error: `Kit execution timed out after ${timeout}ms`,
        });
      }, timeout + 1000); // +1s buffer over worker's internal timeout

      this.pending.set(id, { resolve, reject, timeoutId });

      this.worker!.postMessage({
        type: 'execute',
        id,
        code,
        toolName,
        input,
        timeout,
      });
    });
  }

  /** Terminate the worker and reject all pending executions */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    for (const [, pending] of this.pending) {
      clearTimeout(pending.timeoutId);
      pending.resolve({ success: false, error: 'Sandbox terminated' });
    }
    this.pending.clear();
  }

  private handleWorkerMessage(event: MessageEvent): void {
    const msg = event.data;

    // Handle fetch proxy requests from worker
    if (msg.type === 'fetch_request') {
      this.handleFetchProxy(msg as FetchProxyRequest);
      return;
    }

    const pending = this.pending.get(msg.id);
    if (!pending) return;

    clearTimeout(pending.timeoutId);
    this.pending.delete(msg.id);

    if (msg.type === 'result') {
      const data = msg.data as ToolCallResult | undefined;
      pending.resolve(data ?? { success: true });
    } else if (msg.type === 'error') {
      pending.resolve({ success: false, error: msg.error || 'Unknown error' });
    }
  }

  private handleWorkerError(event: ErrorEvent): void {
    // Reject all pending executions on unhandled worker errors
    for (const [, pending] of this.pending) {
      clearTimeout(pending.timeoutId);
      pending.resolve({ success: false, error: event.message || 'Worker error' });
    }
    this.pending.clear();
    this.terminate();
  }

  /** Check if a URL is safe to proxy (SSRF prevention) */
  private isUrlAllowed(url: string): boolean {
    try {
      const parsed = new URL(url, window.location.origin);

      // Allow relative URLs (same-origin API calls like /api/*)
      if (parsed.origin === window.location.origin) return true;

      // Block non-HTTP protocols
      if (!['https:', 'http:'].includes(parsed.protocol)) return false;

      const host = parsed.hostname;

      // Block private/internal IP ranges
      if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return false;
      if (/^169\.254\./.test(host)) return false;  // AWS/GCP/Azure IMDS
      if (/^10\./.test(host)) return false;
      if (/^192\.168\./.test(host)) return false;
      if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
      if (host.endsWith('.internal') || host.endsWith('.local')) return false;

      return true;
    } catch {
      return false;
    }
  }

  /** Proxy fetch requests from the worker through the main thread (with auth) */
  private async handleFetchProxy(request: FetchProxyRequest): Promise<void> {
    if (!this.worker) return;

    // SSRF protection — validate URL before proxying
    if (!this.isUrlAllowed(request.url)) {
      this.worker.postMessage({
        type: 'fetch_response',
        fetchId: request.fetchId,
        ok: false,
        status: 403,
        error: `URL not allowed: ${request.url}`,
      });
      return;
    }

    // Strip sensitive headers from worker requests to prevent auth leakage to third-party origins
    const sanitizedOptions = { ...request.options };
    try {
      const parsed = new URL(request.url, window.location.origin);
      if (parsed.origin !== window.location.origin) {
        // External request — strip auth headers
        const headers = new Headers(sanitizedOptions.headers as HeadersInit);
        headers.delete('Authorization');
        headers.delete('Cookie');
        sanitizedOptions.headers = Object.fromEntries(headers.entries());
      }
    } catch { /* keep original options */ }

    try {
      const res = await fetch(request.url, sanitizedOptions);
      const data = await res.json().catch(() => null);

      this.worker.postMessage({
        type: 'fetch_response',
        fetchId: request.fetchId,
        ok: res.ok,
        status: res.status,
        data,
      });
    } catch (err) {
      this.worker?.postMessage({
        type: 'fetch_response',
        fetchId: request.fetchId,
        ok: false,
        status: 0,
        error: err instanceof Error ? err.message : 'Fetch failed',
      });
    }
  }
}

// ─── Module-level configuration ────────────────────────────────────────────

let defaultSandbox: KitSandbox | null = null;
let defaultWorkerFactory: WorkerFactory | null = null;

/** Configure the worker factory used by the default sandbox singleton.
 * Call this once at app startup, before any kit code executes. */
export function configureSandbox(opts: { workerFactory: WorkerFactory }): void {
  defaultWorkerFactory = opts.workerFactory;
}

/** Get (or lazily create) the singleton sandbox. */
export function getDefaultSandbox(): KitSandbox {
  if (!defaultSandbox) {
    defaultSandbox = new KitSandbox(defaultWorkerFactory ?? undefined);
  }
  return defaultSandbox;
}
