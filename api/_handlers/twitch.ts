import { requireAuth } from './_auth.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Twitch API (Helix) — streams, users, channels, clips, schedule, chat
// Uses OAuth client credentials or user token
// ---------------------------------------------------------------------------

const TWITCH_API = 'https://api.twitch.tv/helix';
const CLIENT_ID = process.env.TWITCH_CLIENT_ID || '';
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET || '';
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAppToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;
  if (!CLIENT_ID || !CLIENT_SECRET) throw new Error('TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET not configured');

  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'client_credentials',
    }).toString(),
  });
  if (!res.ok) throw new Error('Failed to get Twitch app token');
  const data = await res.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.token;
}

async function twitchFetch(path: string, params: Record<string, string> = {}) {
  const token = await getAppToken();
  const qs = new URLSearchParams(params).toString();
  const url = `${TWITCH_API}${path}${qs ? '?' + qs : ''}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, 'Client-Id': CLIENT_ID },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Twitch API ${res.status}`);
  }
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      // ── Users ──
      case 'get-user': {
        const { login, id } = req.query;
        if (!login && !id) return res.status(400).json({ error: 'login or id required' });
        const params: Record<string, string> = {};
        if (login) params.login = login as string;
        if (id) params.id = id as string;
        return res.json(await twitchFetch('/users', params));
      }

      // ── Streams ──
      case 'get-streams': {
        const { game_id, user_login, first = '20', language } = req.query;
        const params: Record<string, string> = { first: first as string };
        if (game_id) params.game_id = game_id as string;
        if (user_login) params.user_login = user_login as string;
        if (language) params.language = language as string;
        return res.json(await twitchFetch('/streams', params));
      }

      case 'get-stream': {
        const { user_login } = req.query;
        if (!user_login) return res.status(400).json({ error: 'user_login required' });
        return res.json(await twitchFetch('/streams', { user_login: user_login as string }));
      }

      // ── Channels ──
      case 'get-channel': {
        const { broadcaster_id } = req.query;
        if (!broadcaster_id) return res.status(400).json({ error: 'broadcaster_id required' });
        return res.json(await twitchFetch('/channels', { broadcaster_id: broadcaster_id as string }));
      }

      case 'search-channels': {
        const { query, first = '10', live_only = 'false' } = req.query;
        if (!query) return res.status(400).json({ error: 'query required' });
        return res.json(await twitchFetch('/search/channels', {
          query: query as string, first: first as string, live_only: live_only as string,
        }));
      }

      // ── Games / Categories ──
      case 'top-games': {
        const { first = '20' } = req.query;
        return res.json(await twitchFetch('/games/top', { first: first as string }));
      }

      case 'search-categories': {
        const { query, first = '10' } = req.query;
        if (!query) return res.status(400).json({ error: 'query required' });
        return res.json(await twitchFetch('/search/categories', { query: query as string, first: first as string }));
      }

      // ── Clips ──
      case 'get-clips': {
        const { broadcaster_id, game_id, first = '10' } = req.query;
        if (!broadcaster_id && !game_id) return res.status(400).json({ error: 'broadcaster_id or game_id required' });
        const params: Record<string, string> = { first: first as string };
        if (broadcaster_id) params.broadcaster_id = broadcaster_id as string;
        if (game_id) params.game_id = game_id as string;
        return res.json(await twitchFetch('/clips', params));
      }

      // ── Videos ──
      case 'get-videos': {
        const { user_id, game_id, first = '10', type = 'all' } = req.query;
        if (!user_id && !game_id) return res.status(400).json({ error: 'user_id or game_id required' });
        const params: Record<string, string> = { first: first as string, type: type as string };
        if (user_id) params.user_id = user_id as string;
        if (game_id) params.game_id = game_id as string;
        return res.json(await twitchFetch('/videos', params));
      }

      // ── Schedule ──
      case 'get-schedule': {
        const { broadcaster_id } = req.query;
        if (!broadcaster_id) return res.status(400).json({ error: 'broadcaster_id required' });
        return res.json(await twitchFetch('/schedule', { broadcaster_id: broadcaster_id as string }));
      }

      // ── Followers ──
      case 'get-followers': {
        const { broadcaster_id, first = '20' } = req.query;
        if (!broadcaster_id) return res.status(400).json({ error: 'broadcaster_id required' });
        return res.json(await twitchFetch('/channels/followers', {
          broadcaster_id: broadcaster_id as string, first: first as string,
        }));
      }

      // ── Chat Emotes ──
      case 'get-emotes': {
        const { broadcaster_id } = req.query;
        if (!broadcaster_id) return res.status(400).json({ error: 'broadcaster_id required' });
        return res.json(await twitchFetch('/chat/emotes', { broadcaster_id: broadcaster_id as string }));
      }

      case 'global-emotes':
        return res.json(await twitchFetch('/chat/emotes/global'));

      // ── Overview ──
      case 'overview': {
        const [topStreams, topGames] = await Promise.all([
          twitchFetch('/streams', { first: '5' }),
          twitchFetch('/games/top', { first: '5' }),
        ]);
        return res.json({
          top_streams: topStreams.data?.map((s: { user_name: string; game_name: string; viewer_count: number }) => ({
            streamer: s.user_name, game: s.game_name, viewers: s.viewer_count,
          })),
          top_games: topGames.data?.map((g: { name: string }) => g.name),
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
