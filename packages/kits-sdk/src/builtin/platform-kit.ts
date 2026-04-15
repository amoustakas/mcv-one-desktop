// @ts-nocheck
// src/lib/kits/builtin/platform-kit.ts
// Platform API Kit — manage API keys and webhook endpoints from the agent

import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

// ─────────────────────────────────────────────────────────
// API HELPER
// ─────────────────────────────────────────────────────────

async function platformApi(
  resource: string,
  action: string,
  params: Record<string, unknown>,
  method: 'GET' | 'POST',
  ctx: KitExecutionContext,
) {
  if (method === 'GET') {
    const query = new URLSearchParams({ resource, action, ventureId: ctx.ventureId });
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && String(v) !== '') query.set(k, String(v));
    }
    const res = await ctx.fetch(`/api/v1?${query.toString()}`);
    if (!res.ok) {
      const e = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(e.error ?? `Platform API ${res.status}`);
    }
    return res.json() as Promise<{ data: unknown; meta?: unknown }>;
  } else {
    const res = await ctx.fetch('/api/v1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource, action, ventureId: ctx.ventureId, ...params }),
    });
    if (!res.ok) {
      const e = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(e.error ?? `Platform API ${res.status}`);
    }
    return res.json() as Promise<{ data: unknown; meta?: unknown }>;
  }
}

// ─────────────────────────────────────────────────────────
// TOOL HANDLERS
// ─────────────────────────────────────────────────────────

const listApiKeys: KitToolHandler = async (_input, ctx) => {
  const result = await platformApi('api-keys', 'list', {}, 'GET', ctx);
  const keys = (result.data as Array<{
    id: string;
    name: string;
    keyPrefix: string;
    rateLimitTier: string;
    lastUsedAt: string | null;
    expiresAt: string | null;
    createdAt: string;
  }>) ?? [];

  if (keys.length === 0) {
    return { success: true, data: [], displayMarkdown: 'No API keys found for this venture.' };
  }

  const rows = keys
    .map(
      (k) =>
        `| ${k.name} | \`${k.keyPrefix}...${k.id.slice(-4)}\` | ${k.rateLimitTier} | ${k.lastUsedAt ?? 'never'} |`,
    )
    .join('\n');

  return {
    success: true,
    data: keys,
    displayMarkdown: `## API Keys (${keys.length})\n\n| Name | Key (redacted) | Tier | Last Used |\n|------|----------------|------|----------|\n${rows}`,
  };
};

const createApiKey: KitToolHandler = async (input, ctx) => {
  if (!input.name) {
    return { success: false, error: 'name is required for platform_create_api_key' };
  }

  const result = await platformApi(
    'api-keys',
    'create',
    {
      name: input.name,
      tier: input.tier ?? 'free',
      permissions: input.permissions ?? ['*'],
      expiresAt: input.expiresAt ?? null,
      test: input.test ?? false,
    },
    'POST',
    ctx,
  );

  const data = result.data as { key: { id: string; name: string; keyPrefix: string }; plaintext: string };

  return {
    success: true,
    data: result.data,
    displayMarkdown: `## New API Key Created\n\n**Name:** ${data.key.name}\n**Key:** \`${data.plaintext}\`\n\n> Save this key — it will not be shown again.`,
  };
};

const listWebhooks: KitToolHandler = async (_input, ctx) => {
  const result = await platformApi('webhooks', 'list', {}, 'GET', ctx);
  const endpoints = (result.data as Array<{
    id: string;
    url: string;
    events: string[];
    status: string;
    failureCount: number;
    lastDeliveredAt: string | null;
  }>) ?? [];

  if (endpoints.length === 0) {
    return { success: true, data: [], displayMarkdown: 'No webhook endpoints registered.' };
  }

  const rows = endpoints
    .map(
      (ep) =>
        `| ${ep.url} | ${ep.events.join(', ')} | ${ep.status} | ${ep.failureCount} | ${ep.lastDeliveredAt ?? 'never'} |`,
    )
    .join('\n');

  return {
    success: true,
    data: endpoints,
    displayMarkdown: `## Webhook Endpoints (${endpoints.length})\n\n| URL | Events | Status | Failures | Last Delivered |\n|-----|--------|--------|----------|----------------|\n${rows}`,
  };
};

const createWebhook: KitToolHandler = async (input, ctx) => {
  if (!input.url || !input.secret) {
    return { success: false, error: 'url and secret are required for platform_create_webhook' };
  }

  const result = await platformApi(
    'webhooks',
    'create',
    {
      url: input.url,
      secret: input.secret,
      events: input.events ?? ['*'],
    },
    'POST',
    ctx,
  );

  const ep = result.data as { id: string; url: string; events: string[] };

  return {
    success: true,
    data: result.data,
    displayMarkdown: `## Webhook Registered\n\n**ID:** ${ep.id}\n**URL:** ${ep.url}\n**Events:** ${ep.events.join(', ')}`,
  };
};

// ─────────────────────────────────────────────────────────
// MANIFEST
// ─────────────────────────────────────────────────────────

export const manifest: KitManifest = {
  id: 'platform-api',
  name: 'Platform API',
  version: '1.0.0',
  description: 'Manage API keys and webhook endpoints for the MCV Commerce & Financial OS PaaS layer.',
  author: 'MCV',
  ventureScope: '*',
  requiredEnv: [],
  tools: [
    {
      name: 'platform_list_api_keys',
      description: 'List all API keys for the current venture (keys are redacted — only prefix and ID suffix shown).',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
    {
      name: 'platform_create_api_key',
      description: 'Generate a new API key for the current venture. Returns the full plaintext key ONCE — save it immediately.',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Human-readable name for this key (e.g. "FutureState Production")',
          },
          tier: {
            type: 'string',
            enum: ['free', 'growth', 'scale', 'enterprise'],
            description: 'Rate limit tier',
          },
          permissions: {
            type: 'array',
            items: { type: 'string' },
            description: 'API scopes (default: ["*"] = all)',
          },
          expiresAt: {
            type: 'string',
            description: 'ISO expiry date (optional, null = never expires)',
          },
          test: {
            type: 'boolean',
            description: 'If true, generates mcv_test_ key instead of mcv_live_',
          },
        },
        required: ['name'],
      },
    },
    {
      name: 'platform_list_webhooks',
      description: 'List all webhook endpoints registered for the current venture.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
    {
      name: 'platform_create_webhook',
      description: 'Register a new webhook endpoint to receive events from the MCV platform.',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'HTTPS URL to POST events to',
          },
          secret: {
            type: 'string',
            description: 'Signing secret used to verify HMAC-SHA256 signatures (X-MCV-Signature header)',
          },
          events: {
            type: 'array',
            items: { type: 'string' },
            description: 'Event names to subscribe to (default: ["*"] = all events)',
          },
        },
        required: ['url', 'secret'],
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  platform_list_api_keys: listApiKeys,
  platform_create_api_key: createApiKey,
  platform_list_webhooks: listWebhooks,
  platform_create_webhook: createWebhook,
};
