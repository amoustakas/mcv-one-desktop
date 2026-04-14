// src/lib/mcp/presets.ts

export interface McpServerPreset {
  id: string;
  name: string;
  description: string;
  category: 'code' | 'data' | 'comms' | 'infra' | 'specialized';
  transport: 'stdio' | 'sse' | 'streamable-http';
  command?: string;
  args?: string[];
  url?: string;
  requiredCredentials: {
    key: string;
    label: string;
    type: 'oauth' | 'apikey' | 'manual';
    oauthProvider?: string;
    helpUrl?: string;
  }[];
  defaultVentureScope: string[] | '*';
  recommendedDisabledTools?: string[];
  tier: 1 | 2 | 3;
}

export const MCP_PRESETS: McpServerPreset[] = [
  // ── Tier 1: Ship Immediately ──
  {
    id: 'github',
    name: 'GitHub (Deep)',
    description:
      'Full GitHub API — issues, PRs, code search, branches, actions, file operations. Far deeper than the built-in GitHub kit.',
    category: 'code',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    requiredCredentials: [
      {
        key: 'GITHUB_PERSONAL_ACCESS_TOKEN',
        label: 'GitHub Personal Access Token',
        type: 'oauth',
        oauthProvider: 'github',
        helpUrl: 'https://github.com/settings/tokens',
      },
    ],
    defaultVentureScope: '*',
    recommendedDisabledTools: ['delete_repository', 'delete_branch'],
    tier: 1,
  },
  {
    id: 'brave-search',
    name: 'Brave Search',
    description:
      'Web search and local search via Brave Search API. Essential for intelligence gathering.',
    category: 'data',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    requiredCredentials: [
      {
        key: 'BRAVE_API_KEY',
        label: 'Brave Search API Key',
        type: 'manual',
        helpUrl: 'https://brave.com/search/api/',
      },
    ],
    defaultVentureScope: '*',
    tier: 1,
  },
  {
    id: 'fetch',
    name: 'Web Fetch',
    description:
      'Retrieve any URL and convert HTML to clean markdown. Lightweight web scraping without browser overhead.',
    category: 'data',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-fetch'],
    requiredCredentials: [],
    defaultVentureScope: '*',
    tier: 1,
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    description:
      'Direct SQL queries, table listing, and schema inspection. Connect to Supabase or any Postgres database.',
    category: 'data',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres'],
    requiredCredentials: [
      {
        key: 'DATABASE_URL',
        label: 'PostgreSQL Connection String',
        type: 'manual',
        helpUrl: 'https://supabase.com/dashboard/project/_/settings/database',
      },
    ],
    defaultVentureScope: '*',
    recommendedDisabledTools: [],
    tier: 1,
  },
  // ── Tier 2: Add When Needed ──
  {
    id: 'slack',
    name: 'Slack',
    description:
      'Send messages, manage channels, search conversations. Team coordination from NAOS.',
    category: 'comms',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-slack'],
    requiredCredentials: [
      {
        key: 'SLACK_BOT_TOKEN',
        label: 'Slack Bot Token',
        type: 'manual',
        helpUrl: 'https://api.slack.com/apps',
      },
    ],
    defaultVentureScope: '*',
    tier: 2,
  },
  {
    id: 'playwright',
    name: 'Playwright',
    description:
      'Browser automation — navigate, click, fill forms, screenshot, scrape dynamic content.',
    category: 'specialized',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@playwright/mcp@latest'],
    requiredCredentials: [],
    defaultVentureScope: '*',
    tier: 2,
  },
  {
    id: 'memory',
    name: 'Memory (Knowledge Graph)',
    description:
      'Persistent knowledge graph for cross-session memory. Stores entities and relations.',
    category: 'data',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
    requiredCredentials: [],
    defaultVentureScope: '*',
    tier: 2,
  },
];

/** Get presets by tier */
export function getPresetsByTier(tier: 1 | 2 | 3): McpServerPreset[] {
  return MCP_PRESETS.filter((p) => p.tier === tier);
}

/** Get a preset by ID */
export function getPreset(id: string): McpServerPreset | undefined {
  return MCP_PRESETS.find((p) => p.id === id);
}
