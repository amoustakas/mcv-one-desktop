import { getProviderToken } from './_oauth-helper.js';
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
// Discord API — guilds, channels, messages, members, roles, user
// Uses Discord REST API v10
// ---------------------------------------------------------------------------

const DISCORD_API = 'https://discord.com/api/v10';

async function discordFetch(path: string, token: string, options?: { method?: string; body?: unknown }) {
  const res = await fetch(`${DISCORD_API}${path}`, {
    method: options?.method || 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `Discord ${res.status}` }));
    throw new Error(err.message || `Discord API ${res.status}`);
  }
  if (res.status === 204) return {};
  return res.json();
}

// For bot-token based calls
async function discordBotFetch(path: string, options?: { method?: string; body?: unknown }) {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) throw new Error('DISCORD_BOT_TOKEN not configured');
  const res = await fetch(`${DISCORD_API}${path}`, {
    method: options?.method || 'GET',
    headers: {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `Discord ${res.status}` }));
    throw new Error(err.message || `Discord API ${res.status}`);
  }
  if (res.status === 204) return {};
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  // Try OAuth token first, fall back to bot token
  let token: string;
  let useBot = false;
  try {
    const result = await getProviderToken(userId, 'discord');
    token = result.token;
  } catch {
    if (process.env.DISCORD_BOT_TOKEN) {
      token = '';
      useBot = true;
    } else {
      return res.status(500).json({ error: 'Discord not connected. Add in Settings > Integrations.' });
    }
  }

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;
  const fetch_ = useBot ? discordBotFetch : (p: string, o?: { method?: string; body?: unknown }) => discordFetch(p, token, o);

  try {
    switch (action) {
      // ── User ──
      case 'me':
        return res.json(await discordFetch('/users/@me', token));

      case 'my-guilds':
        return res.json(await discordFetch('/users/@me/guilds', token));

      // ── Guilds (Servers) ──
      case 'get-guild': {
        const { guildId } = req.query;
        if (!guildId) return res.status(400).json({ error: 'guildId required' });
        return res.json(await fetch_(`/guilds/${guildId}?with_counts=true`));
      }

      case 'list-guild-channels': {
        const { guildId } = req.query;
        if (!guildId) return res.status(400).json({ error: 'guildId required' });
        return res.json(await fetch_(`/guilds/${guildId}/channels`));
      }

      case 'list-guild-members': {
        const { guildId, limit = '50' } = req.query;
        if (!guildId) return res.status(400).json({ error: 'guildId required' });
        return res.json(await fetch_(`/guilds/${guildId}/members?limit=${limit}`));
      }

      case 'list-guild-roles': {
        const { guildId } = req.query;
        if (!guildId) return res.status(400).json({ error: 'guildId required' });
        return res.json(await fetch_(`/guilds/${guildId}/roles`));
      }

      // ── Channels ──
      case 'get-channel': {
        const { channelId } = req.query;
        if (!channelId) return res.status(400).json({ error: 'channelId required' });
        return res.json(await fetch_(`/channels/${channelId}`));
      }

      // ── Messages ──
      case 'list-messages': {
        const { channelId, limit = '50' } = req.query;
        if (!channelId) return res.status(400).json({ error: 'channelId required' });
        return res.json(await fetch_(`/channels/${channelId}/messages?limit=${limit}`));
      }

      case 'send-message': {
        const { channelId, content, embeds } = req.body;
        if (!channelId || !content) return res.status(400).json({ error: 'channelId and content required' });
        return res.json(await fetch_(`/channels/${channelId}/messages`, {
          method: 'POST', body: { content, embeds },
        }));
      }

      case 'edit-message': {
        const { channelId, messageId, content } = req.body;
        if (!channelId || !messageId || !content) return res.status(400).json({ error: 'channelId, messageId, and content required' });
        return res.json(await fetch_(`/channels/${channelId}/messages/${messageId}`, {
          method: 'PATCH', body: { content },
        }));
      }

      case 'delete-message': {
        const { channelId, messageId } = req.body;
        if (!channelId || !messageId) return res.status(400).json({ error: 'channelId and messageId required' });
        return res.json(await fetch_(`/channels/${channelId}/messages/${messageId}`, { method: 'DELETE' }));
      }

      // ── Reactions ──
      case 'add-reaction': {
        const { channelId, messageId, emoji } = req.body;
        if (!channelId || !messageId || !emoji) return res.status(400).json({ error: 'channelId, messageId, and emoji required' });
        const encoded = encodeURIComponent(emoji);
        return res.json(await fetch_(`/channels/${channelId}/messages/${messageId}/reactions/${encoded}/@me`, { method: 'PUT' }));
      }

      // ── Threads ──
      case 'list-threads': {
        const { channelId } = req.query;
        if (!channelId) return res.status(400).json({ error: 'channelId required' });
        return res.json(await fetch_(`/channels/${channelId}/threads/archived/public`));
      }

      case 'create-thread': {
        const { channelId, name, message } = req.body;
        if (!channelId || !name) return res.status(400).json({ error: 'channelId and name required' });
        return res.json(await fetch_(`/channels/${channelId}/threads`, {
          method: 'POST', body: { name, type: 11, message: message ? { content: message } : undefined },
        }));
      }

      // ── Channel Management ──
      case 'create-channel': {
        const { guildId, name, type = 0, parent_id } = req.body;
        if (!guildId || !name) return res.status(400).json({ error: 'guildId and name required' });
        return res.json(await fetch_(`/guilds/${guildId}/channels`, {
          method: 'POST', body: { name, type, parent_id },
        }));
      }
      case 'delete-channel': {
        const { channelId } = req.body;
        if (!channelId) return res.status(400).json({ error: 'channelId required' });
        return res.json(await fetch_(`/channels/${channelId}`, { method: 'DELETE' }));
      }
      case 'update-channel': {
        const { channelId, name, topic, position } = req.body;
        if (!channelId) return res.status(400).json({ error: 'channelId required' });
        return res.json(await fetch_(`/channels/${channelId}`, {
          method: 'PATCH', body: { name, topic, position },
        }));
      }

      // ── Role Management ──
      case 'create-role': {
        const { guildId, name, color, permissions } = req.body;
        if (!guildId || !name) return res.status(400).json({ error: 'guildId and name required' });
        return res.json(await fetch_(`/guilds/${guildId}/roles`, {
          method: 'POST', body: { name, color, permissions },
        }));
      }
      case 'delete-role': {
        const { guildId, roleId } = req.body;
        if (!guildId || !roleId) return res.status(400).json({ error: 'guildId and roleId required' });
        return res.json(await fetch_(`/guilds/${guildId}/roles/${roleId}`, { method: 'DELETE' }));
      }
      case 'assign-role': {
        const { guildId, userId, roleId } = req.body;
        if (!guildId || !userId || !roleId) return res.status(400).json({ error: 'guildId, userId, and roleId required' });
        return res.json(await fetch_(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, { method: 'PUT' }));
      }
      case 'remove-role': {
        const { guildId, userId, roleId } = req.body;
        if (!guildId || !userId || !roleId) return res.status(400).json({ error: 'guildId, userId, and roleId required' });
        return res.json(await fetch_(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, { method: 'DELETE' }));
      }

      // ── Moderation ──
      case 'kick-member': {
        const { guildId, userId } = req.body;
        if (!guildId || !userId) return res.status(400).json({ error: 'guildId and userId required' });
        return res.json(await fetch_(`/guilds/${guildId}/members/${userId}`, { method: 'DELETE' }));
      }
      case 'ban-member': {
        const { guildId, userId, reason } = req.body;
        if (!guildId || !userId) return res.status(400).json({ error: 'guildId and userId required' });
        return res.json(await fetch_(`/guilds/${guildId}/bans/${userId}`, {
          method: 'PUT', body: { reason },
        }));
      }
      case 'unban-member': {
        const { guildId, userId } = req.body;
        if (!guildId || !userId) return res.status(400).json({ error: 'guildId and userId required' });
        return res.json(await fetch_(`/guilds/${guildId}/bans/${userId}`, { method: 'DELETE' }));
      }
      case 'timeout-member': {
        const { guildId, userId, communication_disabled_until } = req.body;
        if (!guildId || !userId) return res.status(400).json({ error: 'guildId and userId required' });
        return res.json(await fetch_(`/guilds/${guildId}/members/${userId}`, {
          method: 'PATCH', body: { communication_disabled_until },
        }));
      }

      // ── Pins ──
      case 'pin-message': {
        const { channelId, messageId } = req.body;
        if (!channelId || !messageId) return res.status(400).json({ error: 'channelId and messageId required' });
        return res.json(await fetch_(`/channels/${channelId}/pins/${messageId}`, { method: 'PUT' }));
      }

      // ── Webhooks ──
      case 'create-webhook': {
        const { channelId, name } = req.body;
        if (!channelId || !name) return res.status(400).json({ error: 'channelId and name required' });
        return res.json(await fetch_(`/channels/${channelId}/webhooks`, {
          method: 'POST', body: { name },
        }));
      }
      case 'list-webhooks': {
        const { channelId } = req.query;
        if (!channelId) return res.status(400).json({ error: 'channelId required' });
        return res.json(await fetch_(`/channels/${channelId}/webhooks`));
      }

      // ── Overview ──
      case 'overview': {
        const guilds = await discordFetch('/users/@me/guilds', token);
        return res.json({
          guilds: guilds.slice(0, 10).map((g: Record<string, unknown>) => ({
            id: g.id, name: g.name, icon: g.icon, owner: g.owner,
            member_count: g.approximate_member_count,
          })),
          total_guilds: guilds.length,
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
