import { getProviderToken } from './_oauth-helper';
import type { VercelRequest, VercelResponse } from '@vercel/node';

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return null; }
  try {
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}


// ---------------------------------------------------------------------------
// YouTube Data API v3 — channels, videos, playlists, search, comments, analytics
// Uses Google OAuth token (YouTube scopes share Google OAuth)
// ---------------------------------------------------------------------------

const YT_API = 'https://www.googleapis.com/youtube/v3';
const YT_ANALYTICS = 'https://youtubeanalytics.googleapis.com/v2';

async function ytFetch(path: string, token: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${path}${qs ? '?' + qs : ''}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `YouTube API ${res.status}`);
  }
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  let token: string;
  try {
    const result = await getProviderToken(userId, 'google');
    token = result.token;
  } catch {
    return res.status(500).json({ error: 'Google not connected. YouTube uses Google OAuth.' });
  }

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      // ── My Channel ──
      case 'my-channel':
        return res.json(await ytFetch(`${YT_API}/channels`, token, {
          part: 'snippet,statistics,contentDetails,brandingSettings',
          mine: 'true',
        }));

      case 'get-channel': {
        const { channelId } = req.query;
        if (!channelId) return res.status(400).json({ error: 'channelId required' });
        return res.json(await ytFetch(`${YT_API}/channels`, token, {
          part: 'snippet,statistics,contentDetails', id: channelId as string,
        }));
      }

      // ── Videos ──
      case 'list-videos': {
        const { channelId, maxResults = '10', order = 'date' } = req.query;
        const params: Record<string, string> = {
          part: 'snippet,statistics,contentDetails', type: 'video',
          maxResults: maxResults as string, order: order as string,
        };
        if (channelId) params.channelId = channelId as string;
        else params.forMine = 'true';
        return res.json(await ytFetch(`${YT_API}/search`, token, params));
      }

      case 'get-video': {
        const { videoId } = req.query;
        if (!videoId) return res.status(400).json({ error: 'videoId required' });
        return res.json(await ytFetch(`${YT_API}/videos`, token, {
          part: 'snippet,statistics,contentDetails,status', id: videoId as string,
        }));
      }

      // ── Search ──
      case 'search': {
        const { q, maxResults = '10', type = 'video', order = 'relevance' } = req.query;
        if (!q) return res.status(400).json({ error: 'q (query) required' });
        return res.json(await ytFetch(`${YT_API}/search`, token, {
          part: 'snippet', q: q as string, type: type as string,
          maxResults: maxResults as string, order: order as string,
        }));
      }

      // ── Playlists ──
      case 'my-playlists':
        return res.json(await ytFetch(`${YT_API}/playlists`, token, {
          part: 'snippet,contentDetails', mine: 'true', maxResults: '25',
        }));

      case 'playlist-items': {
        const { playlistId, maxResults = '20' } = req.query;
        if (!playlistId) return res.status(400).json({ error: 'playlistId required' });
        return res.json(await ytFetch(`${YT_API}/playlistItems`, token, {
          part: 'snippet,contentDetails', playlistId: playlistId as string,
          maxResults: maxResults as string,
        }));
      }

      // ── Comments ──
      case 'video-comments': {
        const { videoId, maxResults = '20' } = req.query;
        if (!videoId) return res.status(400).json({ error: 'videoId required' });
        return res.json(await ytFetch(`${YT_API}/commentThreads`, token, {
          part: 'snippet', videoId: videoId as string,
          maxResults: maxResults as string, order: 'relevance',
        }));
      }

      // ── Subscriptions ──
      case 'my-subscriptions':
        return res.json(await ytFetch(`${YT_API}/subscriptions`, token, {
          part: 'snippet', mine: 'true', maxResults: '25', order: 'alphabetical',
        }));

      // ── Analytics ──
      case 'channel-analytics': {
        const { startDate, endDate, metrics = 'views,estimatedMinutesWatched,averageViewDuration,subscribersGained' } = req.query;
        const today = new Date().toISOString().split('T')[0];
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        return res.json(await ytFetch(`${YT_ANALYTICS}/reports`, token, {
          ids: 'channel==MINE',
          startDate: (startDate as string) || thirtyDaysAgo,
          endDate: (endDate as string) || today,
          metrics: metrics as string,
          dimensions: 'day',
        }));
      }

      case 'top-videos': {
        const { maxResults = '10' } = req.query;
        const today = new Date().toISOString().split('T')[0];
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        return res.json(await ytFetch(`${YT_ANALYTICS}/reports`, token, {
          ids: 'channel==MINE',
          startDate: thirtyDaysAgo, endDate: today,
          metrics: 'views,estimatedMinutesWatched,likes',
          dimensions: 'video', sort: '-views',
          maxResults: maxResults as string,
        }));
      }

      // ── Comments CRUD ──
      case 'add-comment': {
        const { videoId, text: commentText } = req.body;
        if (!videoId || !commentText) return res.status(400).json({ error: 'videoId and text required' });
        const commentRes = await fetch(`${YT_API}/commentThreads?part=snippet`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ snippet: { videoId, topLevelComment: { snippet: { textOriginal: commentText } } } }),
        });
        return res.json(await commentRes.json());
      }

      case 'reply-comment': {
        const { parentId, text: replyText } = req.body;
        if (!parentId || !replyText) return res.status(400).json({ error: 'parentId and text required' });
        const replyRes = await fetch(`${YT_API}/comments?part=snippet`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ snippet: { parentId, textOriginal: replyText } }),
        });
        return res.json(await replyRes.json());
      }

      case 'delete-comment': {
        const { commentId } = req.body;
        if (!commentId) return res.status(400).json({ error: 'commentId required' });
        const delRes = await fetch(`${YT_API}/comments?id=${commentId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        return res.json({ deleted: delRes.ok });
      }

      // ── Playlist CRUD ──
      case 'create-playlist': {
        const { title, description: plDesc, privacyStatus = 'private' } = req.body;
        if (!title) return res.status(400).json({ error: 'title required' });
        const plRes = await fetch(`${YT_API}/playlists?part=snippet,status`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ snippet: { title, description: plDesc }, status: { privacyStatus } }),
        });
        return res.json(await plRes.json());
      }

      case 'add-to-playlist': {
        const { playlistId, videoId } = req.body;
        if (!playlistId || !videoId) return res.status(400).json({ error: 'playlistId and videoId required' });
        const addRes = await fetch(`${YT_API}/playlistItems?part=snippet`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ snippet: { playlistId, resourceId: { kind: 'youtube#video', videoId } } }),
        });
        return res.json(await addRes.json());
      }

      case 'delete-playlist': {
        const { playlistId } = req.body;
        if (!playlistId) return res.status(400).json({ error: 'playlistId required' });
        const delRes = await fetch(`${YT_API}/playlists?id=${playlistId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        return res.json({ deleted: delRes.ok });
      }

      // ── Video Update (metadata) ──
      case 'update-video': {
        const { videoId, title: vidTitle, description: vidDesc, tags, categoryId, privacyStatus = 'private' } = req.body;
        if (!videoId) return res.status(400).json({ error: 'videoId required' });
        const snippet: Record<string, unknown> = {};
        if (vidTitle) snippet.title = vidTitle;
        if (vidDesc) snippet.description = vidDesc;
        if (tags) snippet.tags = tags;
        if (categoryId) snippet.categoryId = categoryId;
        const upRes = await fetch(`${YT_API}/videos?part=snippet,status`, {
          method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: videoId, snippet, status: { privacyStatus } }),
        });
        return res.json(await upRes.json());
      }

      // ── Rate Video (like/dislike) ──
      case 'rate-video': {
        const { videoId, rating = 'like' } = req.body;
        if (!videoId) return res.status(400).json({ error: 'videoId required' });
        const rateRes = await fetch(`${YT_API}/videos/rate?id=${videoId}&rating=${rating}`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}` },
        });
        return res.json({ rated: rateRes.ok, rating });
      }

      // ── Captions ──
      case 'list-captions': {
        const { videoId } = req.query;
        if (!videoId) return res.status(400).json({ error: 'videoId required' });
        return res.json(await ytFetch(`${YT_API}/captions`, token, { part: 'snippet', videoId: videoId as string }));
      }

      // ── Demographics Analytics ──
      case 'audience-demographics': {
        const today = new Date().toISOString().split('T')[0];
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        return res.json(await ytFetch(`${YT_ANALYTICS}/reports`, token, {
          ids: 'channel==MINE', startDate: thirtyDaysAgo, endDate: today,
          metrics: 'viewerPercentage', dimensions: 'ageGroup,gender',
        }));
      }

      // ── Traffic Sources ──
      case 'traffic-sources': {
        const today = new Date().toISOString().split('T')[0];
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        return res.json(await ytFetch(`${YT_ANALYTICS}/reports`, token, {
          ids: 'channel==MINE', startDate: thirtyDaysAgo, endDate: today,
          metrics: 'views,estimatedMinutesWatched', dimensions: 'insightTrafficSourceType',
          sort: '-views',
        }));
      }

      // ── Overview ──
      case 'overview': {
        const channel = await ytFetch(`${YT_API}/channels`, token, {
          part: 'snippet,statistics', mine: 'true',
        });
        const ch = channel.items?.[0];
        return res.json({
          name: ch?.snippet?.title,
          subscribers: ch?.statistics?.subscriberCount,
          totalViews: ch?.statistics?.viewCount,
          videoCount: ch?.statistics?.videoCount,
          thumbnail: ch?.snippet?.thumbnails?.default?.url,
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
