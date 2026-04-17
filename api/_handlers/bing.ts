import { requireAuth } from './_auth.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { requestLogger } from '../../src/lib/server/logger';
// ---------------------------------------------------------------------------
// Bing Search APIs — Web, News, Images, Videos, Entity, Autosuggest, SpellCheck
// ---------------------------------------------------------------------------

const BING_KEY = process.env.BING_SEARCH_KEY || process.env.MICROSOFT_BING_KEY || '';
const BING_SEARCH = 'https://api.bing.microsoft.com/v7.0';

async function bingFetch(path: string, params: Record<string, string> = {}) {
  if (!BING_KEY) throw new Error('BING_SEARCH_KEY not configured');
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BING_SEARCH}${path}${qs ? '?' + qs : ''}`, {
    headers: { 'Ocp-Apim-Subscription-Key': BING_KEY },
  });
  if (!res.ok) throw new Error(`Bing ${res.status}: ${await res.text().catch(() => '')}`);
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { log: __log, correlationId: __correlationId } = requestLogger(req as unknown as { headers?: Record<string, unknown>; url?: string; method?: string });
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
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      case 'web-search': {
        const { q, count = '10', offset = '0', mkt = 'en-US', freshness } = req.query;
        if (!q) return res.status(400).json({ error: 'q required' });
        const params: Record<string, string> = { q: q as string, count: count as string, offset: offset as string, mkt: mkt as string };
        if (freshness) params.freshness = freshness as string; // Day, Week, Month
        return res.json(await bingFetch('/search', params));
      }

      case 'news-search': {
        const { q, count = '10', mkt = 'en-US', category, freshness } = req.query;
        const params: Record<string, string> = { count: count as string, mkt: mkt as string };
        if (q) params.q = q as string;
        if (category) params.category = category as string; // Business, Entertainment, Health, etc.
        if (freshness) params.freshness = freshness as string;
        return res.json(await bingFetch('/news/search', params));
      }

      case 'trending-news': {
        const { mkt = 'en-US' } = req.query;
        return res.json(await bingFetch('/news/trendingtopics', { mkt: mkt as string }));
      }

      case 'image-search': {
        const { q, count = '10', size, imageType, aspect, color } = req.query;
        if (!q) return res.status(400).json({ error: 'q required' });
        const params: Record<string, string> = { q: q as string, count: count as string };
        if (size) params.size = size as string; // Small, Medium, Large, Wallpaper
        if (imageType) params.imageType = imageType as string; // Photo, Clipart, Line, etc.
        if (aspect) params.aspect = aspect as string; // Square, Wide, Tall
        if (color) params.color = color as string;
        return res.json(await bingFetch('/images/search', params));
      }

      case 'video-search': {
        const { q, count = '10', freshness, resolution, length } = req.query;
        if (!q) return res.status(400).json({ error: 'q required' });
        const params: Record<string, string> = { q: q as string, count: count as string };
        if (freshness) params.freshness = freshness as string;
        if (resolution) params.resolution = resolution as string; // 480p, 720p, 1080p
        if (length) params.videoLength = length as string; // Short, Medium, Long
        return res.json(await bingFetch('/videos/search', params));
      }

      case 'entity-search': {
        const { q, mkt = 'en-US' } = req.query;
        if (!q) return res.status(400).json({ error: 'q required' });
        return res.json(await bingFetch('/entities', { q: q as string, mkt: mkt as string }));
      }

      case 'autosuggest': {
        const { q, mkt = 'en-US' } = req.query;
        if (!q) return res.status(400).json({ error: 'q required' });
        return res.json(await bingFetch('/suggestions', { q: q as string, mkt: mkt as string }));
      }

      case 'spell-check': {
        const { text, mkt = 'en-US' } = req.query;
        if (!text) return res.status(400).json({ error: 'text required' });
        return res.json(await bingFetch('/spellcheck', { text: text as string, mkt: mkt as string, mode: 'proof' }));
      }

      case 'overview':
        return res.json({ configured: !!BING_KEY, endpoints: ['web-search', 'news-search', 'trending-news', 'image-search', 'video-search', 'entity-search', 'autosuggest', 'spell-check'] });

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err)) });
  }
}
