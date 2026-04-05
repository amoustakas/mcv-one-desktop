import { requireAuth } from './_auth';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Upstash Redis REST API — get/set, lists, hashes, sorted sets, pub/sub, rate limit
// ---------------------------------------------------------------------------

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || '';
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';

async function redisFetch(command: string[]) {
  if (!REDIS_URL || !REDIS_TOKEN) throw new Error('Upstash Redis not configured');
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Upstash ${res.status}`); }
  return res.json();
}

async function redisPipeline(commands: string[][]) {
  if (!REDIS_URL || !REDIS_TOKEN) throw new Error('Upstash Redis not configured');
  const res = await fetch(`${REDIS_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error(`Upstash pipeline ${res.status}`);
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      // ── Basic Key/Value ──
      case 'get': {
        const { key } = req.query;
        if (!key) return res.status(400).json({ error: 'key required' });
        return res.json(await redisFetch(['GET', key as string]));
      }

      case 'set': {
        const { key, value, ex } = req.body;
        if (!key || value === undefined) return res.status(400).json({ error: 'key and value required' });
        const cmd = ['SET', key, typeof value === 'string' ? value : JSON.stringify(value)];
        if (ex) cmd.push('EX', String(ex));
        return res.json(await redisFetch(cmd));
      }

      case 'del': {
        const { keys } = req.body;
        if (!keys) return res.status(400).json({ error: 'keys required (string or array)' });
        const keyArr = Array.isArray(keys) ? keys : [keys];
        return res.json(await redisFetch(['DEL', ...keyArr]));
      }

      case 'exists': {
        const { key } = req.query;
        if (!key) return res.status(400).json({ error: 'key required' });
        return res.json(await redisFetch(['EXISTS', key as string]));
      }

      case 'ttl': {
        const { key } = req.query;
        if (!key) return res.status(400).json({ error: 'key required' });
        return res.json(await redisFetch(['TTL', key as string]));
      }

      case 'keys': {
        const { pattern = '*' } = req.query;
        return res.json(await redisFetch(['KEYS', pattern as string]));
      }

      case 'mget': {
        const { keys } = req.body;
        if (!keys || !Array.isArray(keys)) return res.status(400).json({ error: 'keys array required' });
        return res.json(await redisFetch(['MGET', ...keys]));
      }

      case 'incr': {
        const { key, by = 1 } = req.body;
        if (!key) return res.status(400).json({ error: 'key required' });
        return res.json(await redisFetch(by === 1 ? ['INCR', key] : ['INCRBY', key, String(by)]));
      }

      // ── Lists ──
      case 'lpush': {
        const { key, values } = req.body;
        if (!key || !values) return res.status(400).json({ error: 'key and values required' });
        const vals = Array.isArray(values) ? values.map(String) : [String(values)];
        return res.json(await redisFetch(['LPUSH', key, ...vals]));
      }

      case 'lrange': {
        const { key, start = '0', stop = '-1' } = req.query;
        if (!key) return res.status(400).json({ error: 'key required' });
        return res.json(await redisFetch(['LRANGE', key as string, start as string, stop as string]));
      }

      case 'llen': {
        const { key } = req.query;
        if (!key) return res.status(400).json({ error: 'key required' });
        return res.json(await redisFetch(['LLEN', key as string]));
      }

      // ── Hashes ──
      case 'hset': {
        const { key, field, value } = req.body;
        if (!key || !field) return res.status(400).json({ error: 'key and field required' });
        return res.json(await redisFetch(['HSET', key, field, typeof value === 'string' ? value : JSON.stringify(value)]));
      }

      case 'hget': {
        const { key, field } = req.query;
        if (!key || !field) return res.status(400).json({ error: 'key and field required' });
        return res.json(await redisFetch(['HGET', key as string, field as string]));
      }

      case 'hgetall': {
        const { key } = req.query;
        if (!key) return res.status(400).json({ error: 'key required' });
        return res.json(await redisFetch(['HGETALL', key as string]));
      }

      // ── Sorted Sets ──
      case 'zadd': {
        const { key, score, member } = req.body;
        if (!key || score === undefined || !member) return res.status(400).json({ error: 'key, score, member required' });
        return res.json(await redisFetch(['ZADD', key, String(score), member]));
      }

      case 'zrange': {
        const { key, start = '0', stop = '-1' } = req.query;
        if (!key) return res.status(400).json({ error: 'key required' });
        return res.json(await redisFetch(['ZRANGE', key as string, start as string, stop as string, 'WITHSCORES']));
      }

      // ── Pipeline ──
      case 'pipeline': {
        const { commands } = req.body;
        if (!commands || !Array.isArray(commands)) return res.status(400).json({ error: 'commands array required' });
        return res.json(await redisPipeline(commands));
      }

      // ── Info ──
      case 'dbsize':
        return res.json(await redisFetch(['DBSIZE']));

      case 'info':
        return res.json(await redisFetch(['INFO']));

      case 'overview': {
        const [dbsize, info] = await Promise.all([
          redisFetch(['DBSIZE']),
          redisFetch(['INFO']),
        ]);
        return res.json({ keys: dbsize.result, info: typeof info.result === 'string' ? info.result.slice(0, 500) : info.result });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
