import type { ToolCallResult } from './types';

// ---------------------------------------------------------------------------
// Kit Sandbox — Web Worker-based isolated execution environment
// ---------------------------------------------------------------------------

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

export class KitSandbox {
  private worker: Worker | null = null;
  private pending = new Map<string, PendingExecution>();
  private executionCount = 0;

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
      this.worker = new Worker(
        new URL('../../workers/kit-executor.worker.ts', import.meta.url),
        { type: 'module' },
      );
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

  /** Proxy fetch requests from the worker through the main thread (with auth) */
  private async handleFetchProxy(request: FetchProxyRequest): Promise<void> {
    if (!this.worker) return;

    try {
      // Perform the actual fetch on the main thread (has Clerk JWT interceptor)
      const res = await fetch(request.url, request.options);
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

/** Singleton sandbox instance (reuses worker across executions) */
let defaultSandbox: KitSandbox | null = null;

export function getDefaultSandbox(): KitSandbox {
  if (!defaultSandbox) {
    defaultSandbox = new KitSandbox();
  }
  return defaultSandbox;
}
