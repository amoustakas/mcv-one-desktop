/**
 * Single Vercel serverless function that dispatches to every api handler.
 *
 * Vercel file-based routing would otherwise deploy each api/*.ts as its own
 * function — 117+ functions, which blows past free/hobby limits and adds
 * deployment overhead. This catchall consolidates everything into ONE
 * function that dynamically imports the right handler from _handlers/.
 *
 * Files/dirs inside api/ whose name starts with `_` are excluded from
 * Vercel deployment, so putting handlers under `_handlers/` keeps them
 * bundled into this function's deployment but not deployed as separate
 * routes.
 *
 * Path mapping:
 *   /api/epics              → _handlers/epics.ts
 *   /api/oauth/connect      → _handlers/oauth/connect.ts
 *   /api/v1/foo             → _handlers/v1/foo.ts
 *
 * Cold-start optimization: handlers are cached in a module-level Map after
 * first import, so subsequent requests skip the dynamic-import cost.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<unknown> | unknown;

const handlerCache = new Map<string, Handler | null>();

async function loadHandler(slugPath: string): Promise<Handler | null> {
  if (handlerCache.has(slugPath)) return handlerCache.get(slugPath) ?? null;

  // Reject path traversal + hidden files (everything is under _handlers/)
  if (slugPath.includes('..') || slugPath.startsWith('_') || slugPath.includes('/_')) {
    handlerCache.set(slugPath, null);
    return null;
  }

  const candidates = [
    `./_handlers/${slugPath}.ts`,
    `./_handlers/${slugPath}.js`,
    `./_handlers/${slugPath}/index.ts`,
    `./_handlers/${slugPath}/index.js`,
  ];

  for (const rel of candidates) {
    try {
      const mod = await import(/* @vite-ignore */ rel);
      const handler = mod?.default;
      if (typeof handler === 'function') {
        handlerCache.set(slugPath, handler);
        return handler;
      }
    } catch (e) {
      // Try the next candidate; log only on final miss
      if (rel === candidates[candidates.length - 1]) {
        console.warn(`[api-dispatcher] could not load ${slugPath}:`, e instanceof Error ? e.message : String(e));
      }
    }
  }

  handlerCache.set(slugPath, null);
  return null;
}

export default async function dispatch(req: VercelRequest, res: VercelResponse) {
  const slug = req.query.slug;
  const slugPath = Array.isArray(slug) ? slug.join('/') : typeof slug === 'string' ? slug : '';

  if (!slugPath) {
    return res.status(400).json({ error: 'No handler slug provided' });
  }

  const handler = await loadHandler(slugPath);
  if (!handler) {
    return res.status(404).json({ error: `No handler for /api/${slugPath}` });
  }

  try {
    await handler(req, res);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[api-dispatcher] /api/${slugPath} threw:`, msg);
    if (!res.headersSent) res.status(500).json({ error: msg });
  }
}
