import type { McpServerConfig } from './types';
import { type McpServerPreset } from './presets';

const STORAGE_KEY = 'mcv-mcp-servers';

/** CRUD for MCP server configurations with persistence */
export class McpServerRegistry {
  private configs = new Map<string, McpServerConfig>();

  constructor() {
    this.loadFromStorage();
  }

  getAll(): McpServerConfig[] {
    return Array.from(this.configs.values());
  }

  get(id: string): McpServerConfig | undefined {
    return this.configs.get(id);
  }

  add(config: McpServerConfig): void {
    this.configs.set(config.id, config);
    this.saveToStorage();
  }

  update(id: string, updates: Partial<McpServerConfig>): void {
    const existing = this.configs.get(id);
    if (!existing) return;
    this.configs.set(id, { ...existing, ...updates });
    this.saveToStorage();
  }

  remove(id: string): void {
    this.configs.delete(id);
    this.saveToStorage();
  }

  /** Create a config from a preset, merging user-provided credentials */
  createFromPreset(
    preset: McpServerPreset,
    credentials: Record<string, string>,
  ): McpServerConfig {
    const env: Record<string, string> = {};
    for (const cred of preset.requiredCredentials) {
      if (cred.type === 'oauth' && cred.oauthProvider) {
        env[cred.key] = `$oauth:${cred.oauthProvider}`;
      } else if (credentials[cred.key]) {
        env[cred.key] = credentials[cred.key];
      }
    }

    // For postgres, the DATABASE_URL is passed as an arg, not env
    const args = [...(preset.args || [])];
    if (preset.id === 'postgres' && credentials['DATABASE_URL']) {
      args.push(credentials['DATABASE_URL']);
    }

    return {
      id: preset.id,
      name: preset.name,
      description: preset.description,
      transport: preset.transport,
      command: preset.command,
      args,
      env,
      ventureScope: preset.defaultVentureScope,
      enabledTools: '*',
      disabledTools: preset.recommendedDisabledTools || [],
      approvalMode: preset.id === 'postgres' ? 'all' : 'none',
      autoConnect: true,
      idleTimeoutMs: 1800_000,
      preset: preset.id,
      category: preset.category,
    };
  }

  /** Resolve credential references ($oauth:xxx, $apikey:xxx) to actual values */
  resolveCredentials(
    env: Record<string, string>,
    oauthTokens: Record<string, string>,
    apiKeys: Record<string, string>,
  ): Record<string, string> {
    const resolved: Record<string, string> = {};

    for (const [key, value] of Object.entries(env)) {
      if (value.startsWith('$oauth:')) {
        const provider = value.slice(7);
        const token = oauthTokens[provider];
        if (!token) throw new Error(`OAuth token not found for "${provider}". Connect it in Integrations first.`);
        resolved[key] = token;
      } else if (value.startsWith('$apikey:')) {
        const keyName = value.slice(8);
        const apiKey = apiKeys[keyName];
        if (!apiKey) throw new Error(`API key not found for "${keyName}". Configure it in Integrations first.`);
        resolved[key] = apiKey;
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as McpServerConfig[];
      for (const config of parsed) {
        this.configs.set(config.id, config);
      }
    } catch {
      // Corrupted storage — start fresh
    }
  }

  private saveToStorage(): void {
    try {
      const configs = Array.from(this.configs.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    } catch {
      // Storage full or unavailable
    }
  }
}
