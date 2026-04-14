import type {
  McpTransport,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcNotification,
} from '../types';

export class SseTransport implements McpTransport {
  private url: string;
  private headers: Record<string, string>;
  private eventSource: EventSource | null = null;
  private postEndpoint: string | null = null;
  private connected = false;
  private notificationHandlers: ((n: JsonRpcNotification) => void)[] = [];
  private pendingRequests = new Map<
    string | number,
    { resolve: (r: JsonRpcResponse) => void; reject: (e: Error) => void }
  >();

  constructor(url: string, headers: Record<string, string> = {}) {
    this.url = url;
    this.headers = headers;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.eventSource = new EventSource(this.url);

      this.eventSource.addEventListener('endpoint', (e: MessageEvent) => {
        const endpoint = e.data;
        this.postEndpoint = new URL(endpoint, this.url).toString();
        this.connected = true;
        resolve();
      });

      this.eventSource.addEventListener('message', (e: MessageEvent) => {
        try {
          const msg = JSON.parse(e.data);
          if ('id' in msg && this.pendingRequests.has(msg.id)) {
            const pending = this.pendingRequests.get(msg.id)!;
            this.pendingRequests.delete(msg.id);
            pending.resolve(msg as JsonRpcResponse);
          } else if ('method' in msg && !('id' in msg)) {
            this.emitNotification(msg as JsonRpcNotification);
          }
        } catch {
          // Skip malformed messages
        }
      });

      this.eventSource.onerror = () => {
        if (!this.connected) {
          reject(new Error('SSE connection failed'));
        }
      };
    });
  }

  async disconnect(): Promise<void> {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.connected = false;
    this.postEndpoint = null;
    for (const [, pending] of this.pendingRequests) {
      pending.reject(new Error('Transport disconnected'));
    }
    this.pendingRequests.clear();
  }

  async send(message: JsonRpcRequest | JsonRpcNotification): Promise<JsonRpcResponse | null> {
    if (!this.connected || !this.postEndpoint) {
      throw new Error('Transport not connected');
    }

    const res = await fetch(this.postEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.headers },
      body: JSON.stringify(message),
    });

    if (!res.ok) {
      throw new Error(`SSE POST failed: ${res.status} ${res.statusText}`);
    }

    if (!('id' in message)) return null;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(message.id);
        reject(new Error(`Request timed out: ${message.method}`));
      }, 30_000);

      this.pendingRequests.set(message.id, {
        resolve: (r) => {
          clearTimeout(timeout);
          resolve(r);
        },
        reject: (e) => {
          clearTimeout(timeout);
          reject(e);
        },
      });
    });
  }

  onNotification(handler: (n: JsonRpcNotification) => void): void {
    this.notificationHandlers.push(handler);
  }

  isConnected(): boolean {
    return this.connected;
  }

  private emitNotification(n: JsonRpcNotification): void {
    for (const h of this.notificationHandlers) h(n);
  }
}
