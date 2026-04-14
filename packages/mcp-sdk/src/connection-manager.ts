import type {
  McpServerConfig,
  McpTool,
  McpResource,
  McpConnectionState,
} from './types';
import { McpClient } from './client';
import { StreamableHttpTransport } from './transports/streamable-http';
import { SseTransport } from './transports/sse';
import { StdioProxyTransport } from './transports/stdio-proxy';
import { McpServerRegistry } from './server-registry';

export interface ConnectionInfo {
  config: McpServerConfig;
  client: McpClient;
  state: McpConnectionState;
  tools: McpTool[];
  resources: McpResource[];
  error?: string;
}

type ConnectionManagerListener = () => void;

export class McpConnectionManager {
  private connections = new Map<string, ConnectionInfo>();
  private registry: McpServerRegistry;
  private listeners = new Set<ConnectionManagerListener>();
  private healthInterval: ReturnType<typeof setInterval> | null = null;

  constructor(registry: McpServerRegistry) {
    this.registry = registry;
  }

  async start(
    oauthTokens: Record<string, string>,
    apiKeys: Record<string, string>,
  ): Promise<void> {
    const configs = this.registry.getAll();
    const autoConnectConfigs = configs.filter((c) => c.autoConnect);

    await Promise.allSettled(
      autoConnectConfigs.map((config) =>
        this.connectServer(config.id, oauthTokens, apiKeys),
      ),
    );

    this.startHealthChecks();
  }

  async stop(): Promise<void> {
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
      this.healthInterval = null;
    }

    await Promise.allSettled(
      Array.from(this.connections.keys()).map((id) => this.disconnectServer(id)),
    );
  }

  async connectServer(
    serverId: string,
    oauthTokens: Record<string, string>,
    apiKeys: Record<string, string>,
  ): Promise<void> {
    const config = this.registry.get(serverId);
    if (!config) throw new Error(`No config found for server "${serverId}"`);

    if (this.connections.has(serverId)) {
      await this.disconnectServer(serverId);
    }

    let resolvedEnv: Record<string, string> = {};
    try {
      resolvedEnv = this.registry.resolveCredentials(
        config.env || {},
        oauthTokens,
        apiKeys,
      );
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.connections.set(serverId, {
        config,
        client: null as unknown as McpClient,
        state: 'error',
        tools: [],
        resources: [],
        error,
      });
      this.notify();
      throw err;
    }

    const transport = this.createTransport(config, resolvedEnv);
    const client = new McpClient(transport);

    const info: ConnectionInfo = {
      config,
      client,
      state: 'connecting',
      tools: [],
      resources: [],
    };
    this.connections.set(serverId, info);
    this.notify();

    client.on('connected', () => {
      info.state = 'ready';
      info.tools = client.getTools();
      info.resources = client.getResources();
      info.error = undefined;
      this.notify();
    });

    client.on('disconnected', (reason) => {
      info.state = 'disconnected';
      info.error = reason;
      this.notify();
    });

    client.on('error', (error) => {
      info.state = 'error';
      info.error = error.message;
      this.notify();
    });

    client.on('tools-changed', (tools) => {
      info.tools = tools;
      this.notify();
    });

    client.on('resources-changed', (resources) => {
      info.resources = resources;
      this.notify();
    });

    try {
      await client.connect();
    } catch (err) {
      info.state = 'error';
      info.error = err instanceof Error ? err.message : String(err);
      this.notify();
      throw err;
    }
  }

  async disconnectServer(serverId: string): Promise<void> {
    const info = this.connections.get(serverId);
    if (!info?.client) return;

    try {
      await info.client.disconnect();
    } catch {
      // Best-effort disconnect
    }

    this.connections.delete(serverId);
    this.notify();
  }

  getConnection(serverId: string): ConnectionInfo | undefined {
    return this.connections.get(serverId);
  }

  getAllConnections(): ConnectionInfo[] {
    return Array.from(this.connections.values());
  }

  getAllTools(): Map<string, McpTool[]> {
    const result = new Map<string, McpTool[]>();
    for (const [id, info] of this.connections) {
      if (info.state === 'ready') {
        result.set(id, info.tools);
      }
    }
    return result;
  }

  async callTool(
    serverId: string,
    toolName: string,
    args: Record<string, unknown>,
  ) {
    const info = this.connections.get(serverId);
    if (!info?.client || info.state !== 'ready') {
      throw new Error(`Server "${serverId}" is not connected`);
    }
    return info.client.callTool(toolName, args);
  }

  async readResource(serverId: string, uri: string) {
    const info = this.connections.get(serverId);
    if (!info?.client || info.state !== 'ready') {
      throw new Error(`Server "${serverId}" is not connected`);
    }
    return info.client.readResource(uri);
  }

  subscribe(listener: ConnectionManagerListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // Don't let listener errors crash the manager
      }
    }
  }

  private createTransport(
    config: McpServerConfig,
    resolvedEnv: Record<string, string>,
  ) {
    switch (config.transport) {
      case 'streamable-http':
        return new StreamableHttpTransport(
          config.url!,
          config.headers || {},
        );

      case 'sse':
        return new SseTransport(config.url!, config.headers || {});

      case 'stdio':
        return new StdioProxyTransport({
          id: config.id,
          command: config.command!,
          args: config.args || [],
          env: resolvedEnv,
        });

      default:
        throw new Error(`Unknown transport: ${config.transport}`);
    }
  }

  private startHealthChecks(): void {
    this.healthInterval = setInterval(() => {
      for (const [, info] of this.connections) {
        if (info.state === 'error' && info.config.autoConnect) {
          info.client?.scheduleReconnect();
        }
      }
    }, 60_000);
  }
}
