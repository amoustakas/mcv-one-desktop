import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

// ---------------------------------------------------------------------------
// Cloudflare Kit — Workers, KV, R2, D1, Zones
// ---------------------------------------------------------------------------

async function postJson(url: string, body: Record<string, unknown>, ctx: KitExecutionContext) {
  const res = await ctx.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ── Workers ─────────────────────────────────────────────────────

const listWorkers: KitToolHandler = async (_input, ctx) => {
  const data = await postJson('/api/cloudflare-proxy', { action: 'list-workers' }, ctx);
  const workers = data.workers ?? [];
  if (workers.length === 0) return { success: true, data: [], displayMarkdown: 'No Workers found.' };
  const lines = workers.map(
    (w: { id: string; modified: string }) => `- **${w.id}** · modified ${timeAgo(w.modified)}`,
  );
  return { success: true, data: workers, displayMarkdown: `## Cloudflare Workers\n\n${lines.join('\n')}` };
};

// ── KV ──────────────────────────────────────────────────────────

const listKvNamespaces: KitToolHandler = async (_input, ctx) => {
  const data = await postJson('/api/cloudflare-proxy', { action: 'list-kv' }, ctx);
  const namespaces = data.namespaces ?? [];
  if (namespaces.length === 0) return { success: true, data: [], displayMarkdown: 'No KV namespaces found.' };
  const lines = namespaces.map(
    (ns: { id: string; title: string }) => `- **${ns.title}** \`${ns.id.slice(0, 12)}...\``,
  );
  return { success: true, data: namespaces, displayMarkdown: `## KV Namespaces\n\n${lines.join('\n')}` };
};

const kvListKeys: KitToolHandler = async (input, ctx) => {
  const nsId = input.namespace_id as string;
  const prefix = (input.prefix as string) || '';
  const data = await postJson('/api/cloudflare-proxy', { action: 'kv-list-keys', namespace_id: nsId, prefix }, ctx);
  const keys = data.keys ?? [];
  if (keys.length === 0) return { success: true, data: [], displayMarkdown: 'No keys found.' };
  const lines = keys.slice(0, 50).map((k: { name: string }) => `- \`${k.name}\``);
  return { success: true, data: keys, displayMarkdown: `## KV Keys${prefix ? ` (prefix: ${prefix})` : ''}\n\n${lines.join('\n')}\n\n*${keys.length} keys*` };
};

const kvGet: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/cloudflare-proxy', {
    action: 'kv-get',
    namespace_id: input.namespace_id,
    key: input.key,
  }, ctx);
  return { success: true, data, displayMarkdown: `**KV \`${data.key}\`:**\n\n\`\`\`\n${String(data.value).slice(0, 3000)}\n\`\`\`` };
};

const kvPut: KitToolHandler = async (input, ctx) => {
  await postJson('/api/cloudflare-proxy', {
    action: 'kv-put',
    namespace_id: input.namespace_id,
    key: input.key,
    value: input.value,
  }, ctx);
  return { success: true, displayMarkdown: `**KV \`${input.key}\`** updated.` };
};

// ── R2 ──────────────────────────────────────────────────────────

const listR2Buckets: KitToolHandler = async (_input, ctx) => {
  const data = await postJson('/api/cloudflare-proxy', { action: 'list-r2-buckets' }, ctx);
  const buckets = data.buckets ?? [];
  if (buckets.length === 0) return { success: true, data: [], displayMarkdown: 'No R2 buckets found.' };
  const lines = buckets.map(
    (b: { name: string; created: string }) => `- **${b.name}** · created ${timeAgo(b.created)}`,
  );
  return { success: true, data: buckets, displayMarkdown: `## R2 Buckets\n\n${lines.join('\n')}` };
};

// ── D1 ──────────────────────────────────────────────────────────

const listD1Databases: KitToolHandler = async (_input, ctx) => {
  const data = await postJson('/api/cloudflare-proxy', { action: 'list-d1' }, ctx);
  const databases = data.databases ?? [];
  if (databases.length === 0) return { success: true, data: [], displayMarkdown: 'No D1 databases found.' };
  const lines = databases.map(
    (db: { id: string; name: string; version: string }) => `- **${db.name}** (v${db.version}) \`${db.id.slice(0, 8)}...\``,
  );
  return { success: true, data: databases, displayMarkdown: `## D1 Databases\n\n${lines.join('\n')}` };
};

const d1Query: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/cloudflare-proxy', {
    action: 'd1-query',
    database_id: input.database_id,
    sql: input.sql,
    params: input.params,
  }, ctx);
  const results = data.results ?? [];
  if (results.length === 0) return { success: true, data, displayMarkdown: 'Query returned no rows.' };

  // Render as markdown table
  const cols = Object.keys(results[0]);
  let md = `| ${cols.join(' | ')} |\n| ${cols.map(() => '---').join(' | ')} |\n`;
  for (const row of results.slice(0, 50)) {
    md += `| ${cols.map((c) => String(row[c] ?? '')).join(' | ')} |\n`;
  }
  if (results.length > 50) md += `\n*...${results.length - 50} more rows*`;
  if (data.meta) md += `\n\n*${data.meta.rows_read ?? 0} rows read, ${data.meta.rows_written ?? 0} written*`;

  return { success: true, data, displayMarkdown: md };
};

// ── Zones ───────────────────────────────────────────────────────

const listZones: KitToolHandler = async (_input, ctx) => {
  const data = await postJson('/api/cloudflare-proxy', { action: 'list-zones' }, ctx);
  const zones = data.zones ?? [];
  if (zones.length === 0) return { success: true, data: [], displayMarkdown: 'No zones/domains found.' };
  const lines = zones.map(
    (z: { domain: string; status: string; plan: string }) =>
      `- **${z.domain}** — \`${z.status}\` · ${z.plan}`,
  );
  return { success: true, data: zones, displayMarkdown: `## Cloudflare Zones\n\n${lines.join('\n')}` };
};

// ── Manifest ────────────────────────────────────────────────────

export const manifest: KitManifest = {
  id: 'cloudflare-ops',
  name: 'Cloudflare Operations',
  version: '1.0.0',
  description: 'Manage Cloudflare Workers, KV storage, R2 buckets, D1 databases, and DNS zones. Full infrastructure visibility and control.',
  author: 'MCV',
  capabilities: ['network', 'credentials'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use these tools when the user asks about Cloudflare Workers, KV storage, R2 buckets, D1 databases, domains/DNS, or edge infrastructure. Use list commands first to discover resources before operating on them.',
  tools: [
    {
      name: 'list_cf_workers',
      description: 'List all Cloudflare Workers deployed in the account.',
      input_schema: { type: 'object', properties: {} },
    },
    {
      name: 'list_cf_kv_namespaces',
      description: 'List all Cloudflare KV namespaces.',
      input_schema: { type: 'object', properties: {} },
    },
    {
      name: 'cf_kv_list_keys',
      description: 'List keys in a KV namespace, optionally filtered by prefix.',
      input_schema: {
        type: 'object',
        properties: {
          namespace_id: { type: 'string', description: 'KV namespace ID' },
          prefix: { type: 'string', description: 'Key prefix filter (optional)' },
        },
        required: ['namespace_id'],
      },
    },
    {
      name: 'cf_kv_get',
      description: 'Get a value from a KV namespace by key.',
      input_schema: {
        type: 'object',
        properties: {
          namespace_id: { type: 'string', description: 'KV namespace ID' },
          key: { type: 'string', description: 'Key to retrieve' },
        },
        required: ['namespace_id', 'key'],
      },
    },
    {
      name: 'cf_kv_put',
      description: 'Write a value to a KV namespace.',
      input_schema: {
        type: 'object',
        properties: {
          namespace_id: { type: 'string', description: 'KV namespace ID' },
          key: { type: 'string', description: 'Key to write' },
          value: { type: 'string', description: 'Value to store' },
        },
        required: ['namespace_id', 'key', 'value'],
      },
    },
    {
      name: 'list_cf_r2_buckets',
      description: 'List all Cloudflare R2 storage buckets.',
      input_schema: { type: 'object', properties: {} },
    },
    {
      name: 'list_cf_d1_databases',
      description: 'List all Cloudflare D1 SQL databases.',
      input_schema: { type: 'object', properties: {} },
    },
    {
      name: 'cf_d1_query',
      description: 'Execute a SQL query against a Cloudflare D1 database. Returns results as a table.',
      input_schema: {
        type: 'object',
        properties: {
          database_id: { type: 'string', description: 'D1 database UUID' },
          sql: { type: 'string', description: 'SQL query to execute' },
          params: { type: 'array', items: { type: 'string' }, description: 'Query parameters for prepared statements' },
        },
        required: ['database_id', 'sql'],
      },
    },
    {
      name: 'list_cf_zones',
      description: 'List all Cloudflare DNS zones (domains) in the account.',
      input_schema: { type: 'object', properties: {} },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  list_cf_workers: listWorkers,
  list_cf_kv_namespaces: listKvNamespaces,
  cf_kv_list_keys: kvListKeys,
  cf_kv_get: kvGet,
  cf_kv_put: kvPut,
  list_cf_r2_buckets: listR2Buckets,
  list_cf_d1_databases: listD1Databases,
  cf_d1_query: d1Query,
  list_cf_zones: listZones,
};
