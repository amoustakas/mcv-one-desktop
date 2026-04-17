import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { requestLogger } from '../../src/lib/server/logger';
// Module-level client (like all our API files do)
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const { log: __log, correlationId: __correlationId } = requestLogger(_req as unknown as { headers?: Record<string, unknown>; url?: string; method?: string });
  try { res.setHeader('x-correlation-id', __correlationId); } catch { /* headers already sent */ }
  const __start = Date.now();
  __log.info({ event: 'request_in' });
  res.on('finish', () => {
    __log.info({ event: 'request_out', status: res.statusCode, duration_ms: Date.now() - __start });
  });
  res.on('close', () => {
    if (!res.writableEnded) {
      __log.warn({ event: 'request_abort', duration_ms: Date.now() - __start });
    }
  });
  try {
    // Debug: show what env vars resolved to
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'NONE';
    const keyType = process.env.SUPABASE_SERVICE_KEY ? 'SERVICE_KEY' : process.env.VITE_SUPABASE_ANON_KEY ? 'ANON_KEY' : 'NONE';

    const { data: tasks, error: taskErr } = await supabase.from('tasks').select('id, title, task_type').limit(5);
    const { data: docs, error: docErr } = await supabase.from('documents').select('id, title').limit(5);
    const { data: activities, error: actErr } = await supabase.from('activities').select('id, title').limit(5);

    res.json({
      env: { url: url.substring(0, 30) + '...', keyType },
      tasks: { count: tasks?.length || 0, error: taskErr?.message, sample: tasks?.slice(0, 2) },
      docs: { count: docs?.length || 0, error: docErr?.message },
      activities: { count: activities?.length || 0, error: actErr?.message },
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
