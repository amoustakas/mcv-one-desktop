import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  McpServerConfig,
  McpTool,
  McpResource,
  McpConnectionState,
} from '../lib/mcp/types';
import { McpConnectionManager } from '../lib/mcp/connection-manager';
import { McpServerRegistry } from '../lib/mcp/server-registry';
import { initMcpBridge, getMcpTools } from '@mcv/kits-sdk/builtin/mcp-bridge-kit';
import { getPreset } from '../lib/mcp/presets';

// Singleton instances
let registry: McpServerRegistry | null = null;
let connectionManager: McpConnectionManager | null = null;

function getRegistry(): McpServerRegistry {
  if (!registry) registry = new McpServerRegistry();
  return registry;
}

function getConnectionManager(): McpConnectionManager {
  if (!connectionManager) {
    connectionManager = new McpConnectionManager(getRegistry());
    initMcpBridge(connectionManager);
  }
  return connectionManager;
}

interface McpState {
  serverConfigs: Record<string, McpServerConfig>;
  connectionStatus: Record<string, McpConnectionState>;
  serverTools: Record<string, McpTool[]>;
  serverResources: Record<string, McpResource[]>;
  serverErrors: Record<string, string>;
  initialized: boolean;

  initialize: (oauthTokens: Record<string, string>, apiKeys: Record<string, string>) => Promise<void>;
  addServerFromPreset: (presetId: string, credentials: Record<string, string>) => void;
  addCustomServer: (config: McpServerConfig) => void;
  removeServer: (id: string) => Promise<void>;
  updateServer: (id: string, updates: Partial<McpServerConfig>) => void;
  connectServer: (id: string, oauthTokens: Record<string, string>, apiKeys: Record<string, string>) => Promise<void>;
  disconnectServer: (id: string) => Promise<void>;
  toggleTool: (serverId: string, toolName: string, enabled: boolean) => void;
  testConnection: (id: string, oauthTokens: Record<string, string>, apiKeys: Record<string, string>) => Promise<{ ok: boolean; toolCount: number; error?: string }>;

  getConnectedServers: () => McpServerConfig[];
  getAllMcpToolCount: () => number;
}

export const useMcpStore = create<McpState>()(
  persist(
    (set, get) => ({
      serverConfigs: {},
      connectionStatus: {},
      serverTools: {},
      serverResources: {},
      serverErrors: {},
      initialized: false,

      initialize: async (oauthTokens, apiKeys) => {
        const mgr = getConnectionManager();
        const reg = getRegistry();

        const configs = get().serverConfigs;
        for (const config of Object.values(configs)) {
          reg.add(config);
        }

        mgr.subscribe(() => {
          const status: Record<string, McpConnectionState> = {};
          const tools: Record<string, McpTool[]> = {};
          const resources: Record<string, McpResource[]> = {};
          const errors: Record<string, string> = {};

          for (const info of mgr.getAllConnections()) {
            status[info.config.id] = info.state;
            tools[info.config.id] = info.tools;
            resources[info.config.id] = info.resources;
            if (info.error) errors[info.config.id] = info.error;
          }

          set({
            connectionStatus: status,
            serverTools: tools,
            serverResources: resources,
            serverErrors: errors,
          });
        });

        await mgr.start(oauthTokens, apiKeys).catch(() => {});
        set({ initialized: true });
      },

      addServerFromPreset: (presetId, credentials) => {
        const preset = getPreset(presetId);
        if (!preset) return;

        const reg = getRegistry();
        const config = reg.createFromPreset(preset, credentials);
        reg.add(config);

        set((s) => ({
          serverConfigs: { ...s.serverConfigs, [config.id]: config },
        }));
      },

      addCustomServer: (config) => {
        getRegistry().add(config);
        set((s) => ({
          serverConfigs: { ...s.serverConfigs, [config.id]: config },
        }));
      },

      removeServer: async (id) => {
        await getConnectionManager().disconnectServer(id).catch(() => {});
        getRegistry().remove(id);

        set((s) => {
          const configs = { ...s.serverConfigs };
          delete configs[id];
          const status = { ...s.connectionStatus };
          delete status[id];
          const tools = { ...s.serverTools };
          delete tools[id];
          const resources = { ...s.serverResources };
          delete resources[id];
          const errors = { ...s.serverErrors };
          delete errors[id];
          return { serverConfigs: configs, connectionStatus: status, serverTools: tools, serverResources: resources, serverErrors: errors };
        });
      },

      updateServer: (id, updates) => {
        getRegistry().update(id, updates);
        set((s) => {
          const existing = s.serverConfigs[id];
          if (!existing) return s;
          return {
            serverConfigs: {
              ...s.serverConfigs,
              [id]: { ...existing, ...updates },
            },
          };
        });
      },

      connectServer: async (id, oauthTokens, apiKeys) => {
        await getConnectionManager().connectServer(id, oauthTokens, apiKeys);
      },

      disconnectServer: async (id) => {
        await getConnectionManager().disconnectServer(id);
      },

      toggleTool: (serverId, toolName, enabled) => {
        const config = get().serverConfigs[serverId];
        if (!config) return;

        let disabledTools = [...config.disabledTools];
        if (enabled) {
          disabledTools = disabledTools.filter((t) => t !== toolName);
        } else if (!disabledTools.includes(toolName)) {
          disabledTools.push(toolName);
        }

        get().updateServer(serverId, { disabledTools });
      },

      testConnection: async (id, oauthTokens, apiKeys) => {
        try {
          await getConnectionManager().connectServer(id, oauthTokens, apiKeys);
          const info = getConnectionManager().getConnection(id);
          return {
            ok: info?.state === 'ready',
            toolCount: info?.tools.length || 0,
          };
        } catch (err) {
          return {
            ok: false,
            toolCount: 0,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      },

      getConnectedServers: () => {
        const { serverConfigs, connectionStatus } = get();
        return Object.values(serverConfigs).filter(
          (c) => connectionStatus[c.id] === 'ready',
        );
      },

      getAllMcpToolCount: () => {
        return getMcpTools().length;
      },
    }),
    {
      name: 'mcv-mcp',
      partialize: (s) => ({
        serverConfigs: s.serverConfigs,
      }),
    },
  ),
);
