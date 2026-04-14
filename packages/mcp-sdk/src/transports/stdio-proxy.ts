import type {
  McpTransport,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcNotification,
  StdioSpawnRequest,
} from '../types';

const LOCAL_SERVER = 'http://localhost:3100';

export class StdioProxyTransport implements McpTransport {
  private config: StdioSpawnRequest;
  private connected = false;
  private notificationHandlers: ((n: JsonRpcNotification) => void)[] = [];

  constructor(config: StdioSpawnRequest) {
    this.config = config;
  }

  async connect(): Promise<void> {
    const res = await fetch(`${LOCAL_SERVER}/mcp/spawn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.config),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(`Failed to spawn MCP server: ${body.error || res.statusText}`);
    }

    this.connected = true;
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;

    await fetch(`${LOCAL_SERVER}/mcp/kill/${this.config.id}`, {
      method: 'POST',
    }).catch(() => {
      // Best-effort cleanup
    });

    this.connected = false;
  }

  async send(message: JsonRpcRequest | JsonRpcNotification): Promise<JsonRpcResponse | null> {
    if (!this.connected) throw new Error('Transport not connected');

    const res = await fetch(`${LOCAL_SERVER}/mcp/message/${this.config.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(`Stdio message failed: ${body.error || res.statusText}`);
    }

    // Notifications don't expect a response
    if (!('id' in message)) return null;

    const json = await res.json();

    // The proxy may return notifications alongside the response
    if (json.notifications && Array.isArray(json.notifications)) {
      for (const n of json.notifications) {
        this.emitNotification(n as JsonRpcNotification);
      }
    }

    return json.response as JsonRpcResponse;
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
