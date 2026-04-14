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

      // ── Tweet CRUD ──
      case 'create-tweet': {
        const { text, reply_to, quote_tweet_id, poll_options, poll_duration_minutes } = req.body;
        if (!text) return res.status(400).json({ error: 'text required' });
        const body: Record<string, unknown> = { text };
        if (reply_to) body.reply = { in_reply_to_tweet_id: reply_to };
        if (quote_tweet_id) body.quote_tweet_id = quote_tweet_id;
        if (poll_options) body.poll = { options: poll_options, duration_minutes: poll_duration_minutes || 60 };
        return res.json(await xPost('/tweets', BEARER_TOKEN, body));
      }

      case 'delete-tweet': {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });
        const r = await fetch(`${X_API}/tweets/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${BEARER_TOKEN}` } });
        return res.json(await r.json());
      }

      case 'retweet': {
        const { userId: rtUid, tweetId } = req.body;
        if (!rtUid || !tweetId) return res.status(400).json({ error: 'userId and tweetId required' });
        return res.json(await xPost(`/users/${rtUid}/retweets`, BEARER_TOKEN, { tweet_id: tweetId }));
      }

      case 'like-tweet': {
        const { userId: likeUid, tweetId } = req.body;
        if (!likeUid || !tweetId) return res.status(400).json({ error: 'userId and tweetId required' });
        return res.json(await xPost(`/users/${likeUid}/likes`, BEARER_TOKEN, { tweet_id: tweetId }));
      }

      // ── Direct Messages ──
      case 'send-dm': {
        const { participant_id, text: dmText } = req.body;
        if (!participant_id || !dmText) return res.status(400).json({ error: 'participant_id and text required' });
        return res.json(await xPost('/dm_conversations/with/' + participant_id + '/messages', BEARER_TOKEN, { text: dmText }));
      }

      case 'list-dm-events': {
        const { max_results = '20' } = req.query;
        return res.json(await xFetch('/dm_events', BEARER_TOKEN, { max_results: max_results as string, 'dm_event.fields': 'created_at,dm_conversation_id,text,sender_id' }));
      }

      // ── Follows / Blocks / Mutes ──
      case 'follow': {
        const { sourceUserId, targetUserId } = req.body;
        if (!sourceUserId || !targetUserId) return res.status(400).json({ error: 'sourceUserId and targetUserId required' });
        return res.json(await xPost(`/users/${sourceUserId}/following`, BEARER_TOKEN, { target_user_id: targetUserId }));
      }

      case 'unfollow': {
        const { sourceUserId, targetUserId } = req.body;
        if (!sourceUserId || !targetUserId) return res.status(400).json({ error: 'sourceUserId and targetUserId required' });
        const r = await fetch(`${X_API}/users/${sourceUserId}/following/${targetUserId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${BEARER_TOKEN}` } });
        return res.json(await r.json());
      }

      case 'block': {
        const { sourceUserId, targetUserId } = req.body;
        if (!sourceUserId || !targetUserId) return res.status(400).json({ error: 'sourceUserId and targetUserId required' });
        return res.json(await xPost(`/users/${sourceUserId}/blocking`, BEARER_TOKEN, { target_user_id: targetUserId }));
      }

      case 'mute': {
        const { sourceUserId, targetUserId } = req.body;
        if (!sourceUserId || !targetUserId) return res.status(400).json({ error: 'sourceUserId and targetUserId required' });
        return res.json(await xPost(`/users/${sourceUserId}/muting`, BEARER_TOKEN, { target_user_id: targetUserId }));
      }

      // ── Lists ──
      case 'get-list': {
        const { listId } = req.query;
        if (!listId) return res.status(400).json({ error: 'listId required' });
        return res.json(await xFetch(`/lists/${listId}`, BEARER_TOKEN, { 'list.fields': 'follower_count,member_count,description,created_at,owner_id' }));
      }

      case 'list-members': {
        const { listId, max_results = '50' } = req.query;
        if (!listId) return res.status(400).json({ error: 'listId required' });
        return res.json(await xFetch(`/lists/${listId}/members`, BEARER_TOKEN, { max_results: max_results as string, 'user.fields': 'name,username,public_metrics' }));
      }

      case 'create-list': {
        const { name: listName, description: listDesc, private: isPrivate } = req.body;
        if (!listName) return res.status(400).json({ error: 'name required' });
        return res.json(await xPost('/lists', BEARER_TOKEN, { name: listName, description: listDesc, private: isPrivate ?? false }));
      }

      // ── Bookmarks ──
      case 'list-bookmarks': {
        const { userId: bmUid, max_results = '20' } = req.query;
        if (!bmUid) return res.status(400).json({ error: 'userId required' });
        return res.json(await xFetch(`/users/${bmUid}/bookmarks`, BEARER_TOKEN, { max_results: max_results as string, 'tweet.fields': 'created_at,public_metrics' }));
      }

      case 'bookmark-tweet': {
        const { userId: bmUid, tweetId } = req.body;
        if (!bmUid || !tweetId) return res.status(400).json({ error: 'userId and tweetId required' });
        return res.json(await xPost(`/users/${bmUid}/bookmarks`, BEARER_TOKEN, { tweet_id: tweetId }));
      }

      // ── Spaces ──
      case 'search-spaces': {
        const { query: spQuery } = req.query;
        if (!spQuery) return res.status(400).json({ error: 'query required' });
        return res.json(await xFetch('/spaces/search', BEARER_TOKEN, { query: spQuery as string, 'space.fields': 'title,host_ids,participant_count,state,started_at' }));
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
          name: u?.name, username: u?.username,
          followers: u?.public_metrics?.followers_count, following: u?.public_metrics?.following_count,
          tweets: u?.public_metrics?.tweet_count, verified: u?.verified,
          description: u?.description, avatar: u?.profile_image_url,
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err));
    return res.status(500).json({ error: message });
  }
}
