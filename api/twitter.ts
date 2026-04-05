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
// X (Twitter) API v2 — tweets, timeline, search, users, DMs, likes
// Uses Bearer token (App-only) or OAuth 2.0 user token
// ---------------------------------------------------------------------------

const X_API = 'https://api.twitter.com/2';
const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN || process.env.X_BEARER_TOKEN || '';

async function xFetch(path: string, token: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${X_API}${path}${qs ? '?' + qs : ''}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.title || `X API ${res.status}`);
  }
  return res.json();
}

async function xPost(path: string, token: string, body: unknown) {
  const res = await fetch(`${X_API}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.title || `X API ${res.status}`);
  }
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  if (!BEARER_TOKEN) {
    return res.status(500).json({ error: 'TWITTER_BEARER_TOKEN not configured' });
  }

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;
  const fields = 'tweet.fields=created_at,public_metrics,author_id,conversation_id,lang&user.fields=name,username,profile_image_url,public_metrics,verified,description&expansions=author_id';

  try {
    switch (action) {
      // ── Users ──
      case 'get-user': {
        const { username } = req.query;
        if (!username) return res.status(400).json({ error: 'username required' });
        return res.json(await xFetch(`/users/by/username/${username}`, BEARER_TOKEN, {
          'user.fields': 'name,username,profile_image_url,public_metrics,verified,description,created_at,location,url',
        }));
      }

      case 'get-user-by-id': {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await xFetch(`/users/${id}`, BEARER_TOKEN, {
          'user.fields': 'name,username,profile_image_url,public_metrics,verified,description,created_at',
        }));
      }

      // ── Tweets ──
      case 'get-tweet': {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await xFetch(`/tweets/${id}`, BEARER_TOKEN, {
          'tweet.fields': 'created_at,public_metrics,author_id,conversation_id,lang,entities',
          'user.fields': 'name,username,profile_image_url',
          expansions: 'author_id',
        }));
      }

      case 'user-tweets': {
        const { userId: uid, max_results = '10' } = req.query;
        if (!uid) return res.status(400).json({ error: 'userId required' });
        return res.json(await xFetch(`/users/${uid}/tweets`, BEARER_TOKEN, {
          max_results: max_results as string,
          'tweet.fields': 'created_at,public_metrics,lang',
        }));
      }

      case 'user-mentions': {
        const { userId: uid, max_results = '10' } = req.query;
        if (!uid) return res.status(400).json({ error: 'userId required' });
        return res.json(await xFetch(`/users/${uid}/mentions`, BEARER_TOKEN, {
          max_results: max_results as string,
          'tweet.fields': 'created_at,public_metrics,author_id',
          expansions: 'author_id',
        }));
      }

      // ── Search ──
      case 'search-recent': {
        const { query, max_results = '10' } = req.query;
        if (!query) return res.status(400).json({ error: 'query required' });
        return res.json(await xFetch('/tweets/search/recent', BEARER_TOKEN, {
          query: query as string,
          max_results: max_results as string,
          'tweet.fields': 'created_at,public_metrics,author_id,lang',
          'user.fields': 'name,username',
          expansions: 'author_id',
        }));
      }

      // ── Followers / Following ──
      case 'followers': {
        const { userId: uid, max_results = '50' } = req.query;
        if (!uid) return res.status(400).json({ error: 'userId required' });
        return res.json(await xFetch(`/users/${uid}/followers`, BEARER_TOKEN, {
          max_results: max_results as string,
          'user.fields': 'name,username,public_metrics,verified,description',
        }));
      }

      case 'following': {
        const { userId: uid, max_results = '50' } = req.query;
        if (!uid) return res.status(400).json({ error: 'userId required' });
        return res.json(await xFetch(`/users/${uid}/following`, BEARER_TOKEN, {
          max_results: max_results as string,
          'user.fields': 'name,username,public_metrics,verified,description',
        }));
      }

      // ── Likes ──
      case 'user-likes': {
        const { userId: uid, max_results = '10' } = req.query;
        if (!uid) return res.status(400).json({ error: 'userId required' });
        return res.json(await xFetch(`/users/${uid}/liked_tweets`, BEARER_TOKEN, {
          max_results: max_results as string,
          'tweet.fields': 'created_at,public_metrics',
        }));
      }

      // ── Lists ──
      case 'user-lists': {
        const { userId: uid } = req.query;
        if (!uid) return res.status(400).json({ error: 'userId required' });
        return res.json(await xFetch(`/users/${uid}/owned_lists`, BEARER_TOKEN, {
          'list.fields': 'follower_count,member_count,description,created_at',
        }));
      }

      // ── Trends (requires recent search workaround) ──
      case 'trending': {
        const { query = 'crypto OR AI OR fintech', max_results = '10' } = req.query;
        return res.json(await xFetch('/tweets/search/recent', BEARER_TOKEN, {
          query: `(${query}) -is:retweet lang:en`,
          max_results: max_results as string,
          'tweet.fields': 'created_at,public_metrics',
          sort_order: 'relevancy',
        }));
      }

      // ── Overview ──
      case 'overview': {
        const { username } = req.query;
        if (!username) return res.status(400).json({ error: 'username required for overview' });
        const user = await xFetch(`/users/by/username/${username}`, BEARER_TOKEN, {
          'user.fields': 'name,username,public_metrics,verified,description,created_at,profile_image_url',
        });
        const u = user.data;
        return res.json({
          name: u?.name,
          username: u?.username,
          followers: u?.public_metrics?.followers_count,
          following: u?.public_metrics?.following_count,
          tweets: u?.public_metrics?.tweet_count,
          verified: u?.verified,
          description: u?.description,
          avatar: u?.profile_image_url,
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
