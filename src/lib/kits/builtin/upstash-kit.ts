import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function redisApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'GET') {
  if (method === 'GET') {
    const q = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
    const r = await ctx.fetch(`/api/upstash?${q}`);
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Upstash error'); }
    return r.json();
  }
  const r = await ctx.fetch('/api/upstash', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Upstash error'); }
  return r.json();
}

const getValue: KitToolHandler = async (input, ctx) => {
  const d = await redisApi('get', { key: input.key }, ctx);
  return { success: true, data: d, displayMarkdown: `**${input.key}** = \`${d.result ?? 'null'}\`` };
};

const setValue: KitToolHandler = async (input, ctx) => {
  const d = await redisApi('set', { key: input.key, value: input.value, ex: input.ttl }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Set **${input.key}** = \`${input.value}\`${input.ttl ? ` (TTL: ${input.ttl}s)` : ''}` };
};

const listKeys: KitToolHandler = async (input, ctx) => {
  const d = await redisApi('keys', { pattern: input.pattern ?? '*' }, ctx);
  const keys = d.result ?? [];
  return { success: true, data: keys, displayMarkdown: `## Keys (${keys.length})\n\n${keys.slice(0, 50).map((k: string) => `- \`${k}\``).join('\n')}` };
};

const dbSize: KitToolHandler = async (_i, ctx) => {
  const d = await redisApi('dbsize', {}, ctx);
  return { success: true, data: d, displayMarkdown: `**Database size:** ${d.result} keys` };
};

const increment: KitToolHandler = async (input, ctx) => {
  const d = await redisApi('incr', { key: input.key, by: input.by ?? 1 }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `**${input.key}** incremented to \`${d.result}\`` };
};

const redisOverview: KitToolHandler = async (_i, ctx) => {
  const d = await redisApi('overview', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## Upstash Redis\n\n- **Keys:** ${d.keys}` };
};

export const manifest: KitManifest = {
  id: 'upstash-cache', name: 'Upstash Redis', version: '1.0.0',
  description: 'Upstash — serverless Redis: key/value, lists, hashes, sorted sets, counters, and caching.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use upstash tools for caching, rate limiting, counters, session storage, and real-time data.',
  tools: [
    { name: 'redis_get', description: 'Get a value by key.', input_schema: { type: 'object', properties: { key: { type: 'string' } }, required: ['key'] } },
    { name: 'redis_set', description: 'Set a key/value with optional TTL.', input_schema: { type: 'object', properties: { key: { type: 'string' }, value: { type: 'string' }, ttl: { type: 'number', description: 'Expiry in seconds' } }, required: ['key', 'value'] } },
    { name: 'redis_keys', description: 'List keys matching a pattern.', input_schema: { type: 'object', properties: { pattern: { type: 'string', description: 'Glob pattern (default *)' } } } },
    { name: 'redis_dbsize', description: 'Get total key count.', input_schema: { type: 'object', properties: {} } },
    { name: 'redis_incr', description: 'Increment a counter.', input_schema: { type: 'object', properties: { key: { type: 'string' }, by: { type: 'number' } }, required: ['key'] } },
    { name: 'redis_overview', description: 'Redis database overview.', input_schema: { type: 'object', properties: {} } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  redis_get: getValue, redis_set: setValue, redis_keys: listKeys,
  redis_dbsize: dbSize, redis_incr: increment, redis_overview: redisOverview,
};
