import type {
  McpTransport,
  McpConnectionState,
  McpTool,
  McpResource,
  McpPrompt,
  McpServerCapabilities,
  McpServerInfo,
  McpToolCallResult,
  McpResourceContent,
  JsonRpcRequest,
  JsonRpcNotification,
  McpClientEventMap,
} from './types';

type EventHandler<K extends keyof McpClientEventMap> = (
  ...args: McpClientEventMap[K]
) => void;

const MCP_PROTOCOL_VERSION = '2025-03-26';

let nextRequestId = 1;

export class McpClient {
  private transport: McpTransport;
  private state: McpConnectionState = 'disconnected';
  private serverCapabilities: McpServerCapabilities | null = null;
  private serverInfo: McpServerInfo | null = null;
  private tools: McpTool[] = [];
  private resources: McpResource[] = [];
  private prompts: McpPrompt[] = [];
  private listeners = new Map<string, Set<EventHandler<keyof McpClientEventMap>>>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(transport: McpTransport) {
    this.transport = transport;

    this.transport.onNotification((notification) => {
      this.handleNotification(notification);
    });
  }

  getState(): McpConnectionState {
    return this.state;
  }

  getTools(): McpTool[] {
    return this.tools;
  }

  getResources(): McpResource[] {
    return this.resources;
  }

  getPrompts(): McpPrompt[] {
    return this.prompts;
  }

  getServerInfo(): McpServerInfo | null {
    return this.serverInfo;
  }

  getServerCapabilities(): McpServerCapabilities | null {
    return this.serverCapabilities;
  }

  async connect(): Promise<void> {
    if (this.state === 'ready' || this.state === 'connecting') return;

    this.setState('connecting');

    try {
      await this.transport.connect();
      await this.initialize();
      await this.discoverCapabilities();

      this.reconnectAttempts = 0;
      this.setState('ready');
      this.emit('connected');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.setState('error');
      this.emit('error', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    await this.transport.disconnect();
    this.tools = [];
    this.resources = [];
    this.prompts = [];
    this.serverCapabilities = null;
    this.serverInfo = null;
    this.setState('disconnected');
    this.emit('disconnected', 'user-initiated');
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<McpToolCallResult> {
    if (this.state !== 'ready') {
      throw new Error(`Cannot call tool: client is ${this.state}`);
    }

    const response = await this.request('tools/call', {
      name,
      arguments: args,
    });

    if (response.error) {
      return {
        content: [{ type: 'text', text: response.error.message }],
        isError: true,
      };
    }

    return response.result as McpToolCallResult;
  }

  async readResource(uri: string): Promise<McpResourceContent[]> {
    if (this.state !== 'ready') {
      throw new Error(`Cannot read resource: client is ${this.state}`);
    }

    const response = await this.request('resources/read', { uri });

    if (response.error) {
      throw new Error(response.error.message);
    }

    const result = response.result as { contents: McpResourceContent[] };
    return result.contents;
  }

  async refreshTools(): Promise<McpTool[]> {
    const response = await this.request('tools/list', {});
    if (response.result) {
      const result = response.result as { tools: McpTool[] };
      this.tools = result.tools;
      this.emit('tools-changed', this.tools);
    }
    return this.tools;
  }

  on<K extends keyof McpClientEventMap>(
    event: K,
    handler: EventHandler<K>,
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as EventHandler<keyof McpClientEventMap>);
  }

  off<K extends keyof McpClientEventMap>(
    event: K,
    handler: EventHandler<K>,
  ): void {
    this.listeners.get(event)?.delete(handler as EventHandler<keyof McpClientEventMap>);
  }

  /** Attempt reconnection with exponential backoff */
  scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setState('error');
      this.emit('error', new Error('Max reconnection attempts exceeded'));
      return;
    }

    this.setState('reconnecting');
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30_000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch {
        this.scheduleReconnect();
      }
    }, delay);
  }

  private setState(state: McpConnectionState): void {
    this.state = state;
  }

  private emit<K extends keyof McpClientEventMap>(
    event: K,
    ...args: McpClientEventMap[K]
  ): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    for (const handler of handlers) {
      try {
        (handler as EventHandler<K>)(...args);
      } catch {
        // Don't let listener errors crash the client
      }
    }
  }

  private async initialize(): Promise<void> {
    this.setState('initializing');

    const response = await this.request('initialize', {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {
        roots: { listChanged: false },
      },
      clientInfo: {
        name: 'mcv-desktop',
        version: '1.0.0',
      },
    });

    if (response.error) {
      throw new Error(`Initialize failed: ${response.error.message}`);
    }

    const result = response.result as {
      protocolVersion: string;
      capabilities: McpServerCapabilities;
      serverInfo: McpServerInfo;
    };

    this.serverCapabilities = result.capabilities;
    this.serverInfo = result.serverInfo;

    await this.notify('notifications/initialized', {});
  }

  private async discoverCapabilities(): Promise<void> {
    if (this.serverCapabilities?.tools) {
      const toolsRes = await this.request('tools/list', {});
      if (toolsRes.result) {
        const result = toolsRes.result as { tools: McpTool[] };
        this.tools = result.tools;
      }
    }

    if (this.serverCapabilities?.resources) {
      const resourcesRes = await this.request('resources/list', {});
      if (resourcesRes.result) {
        const result = resourcesRes.result as { resources: McpResource[] };
        this.resources = result.resources;
      }
    }

    if (this.serverCapabilities?.prompts) {
      const promptsRes = await this.request('prompts/list', {});
      if (promptsRes.result) {
        const result = promptsRes.result as { prompts: McpPrompt[] };
        this.prompts = result.prompts;
      }
    }
  }

  private async request(
    method: string,
    params: Record<string, unknown>,
  ) {
    const id = nextRequestId++;
    const message: JsonRpcRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    const response = await this.transport.send(message);

    if (!response) {
      throw new Error(`No response for ${method}`);
    }

    return response;
  }

  private async notify(method: string, params: Record<string, unknown>): Promise<void> {
    const message: JsonRpcNotification = {
      jsonrpc: '2.0',
      method,
      params,
    };
    await this.transport.send(message);
  }

  private handleNotification(notification: JsonRpcNotification): void {
    if (notification.method === 'notifications/tools/list_changed') {
      this.refreshTools().catch(() => {});
    }

    this.emit('notification', notification.method, notification.params);
  }
}
