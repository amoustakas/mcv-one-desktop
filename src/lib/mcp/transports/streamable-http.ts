import type {
  McpTransport,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcNotification,
} from '../types';

export class StreamableHttpTransport implements McpTransport {
  private url: string;
  private headers: Record<string, string>;
  private sessionId: string | null = null;
  private connected = false;
  private notificationHandlers: ((n: JsonRpcNotification) => void)[] = [];

  constructor(url: string, headers: Record<string, string> = {}) {
    this.url = url;
    this.headers = headers;
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.sessionId = null;
  }

  async send(message: JsonRpcRequest | JsonRpcNotification): Promise<JsonRpcResponse | null> {
    if (!this.connected) throw new Error('Transport not connected');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...this.headers,
    };

    if (this.sessionId) {
      headers['Mcp-Session-Id'] = this.sessionId;
    }

    const res = await fetch(this.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(message),
    });

    // Capture session ID from response
    const sid = res.headers.get('Mcp-Session-Id');
    if (sid) this.sessionId = sid;

    // Notifications don't expect a response body
    if (!('id' in message)) return null;

    const contentType = res.headers.get('Content-Type') || '';

    if (contentType.includes('text/event-stream')) {
      return this.parseSSEResponse(res);
    }

    // Standard JSON response
    const json = await res.json();

    // If the response is an array (batched), find matching id
    if (Array.isArray(json)) {
      const match = json.find(
        (r: JsonRpcResponse) => r.id === (message as JsonRpcRequest).id,
      );
      // Forward non-matching items as notifications if they lack an id
      for (const item of json) {
        if (!('id' in item) && 'method' in item) {
          this.emitNotification(item as JsonRpcNotification);
        }
      }
      return match || null;
    }

    return json as JsonRpcResponse;
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

  private async parseSSEResponse(res: Response): Promise<JsonRpcResponse | null> {
    const text = await res.text();
    const lines = text.split('\n');
    let result: JsonRpcResponse | null = null;

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') break;
      try {
        const parsed = JSON.parse(data);
        if ('id' in parsed) {
          result = parsed as JsonRpcResponse;
        } else if ('method' in parsed) {
          this.emitNotification(parsed as JsonRpcNotification);
        }
      } catch {
        // Skip malformed SSE data lines
      }
    }

    return result;
  }
}
