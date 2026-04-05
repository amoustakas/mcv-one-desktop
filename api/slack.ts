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
// Slack API — messages, channels, users, team, reactions, files
// Uses Slack Web API directly via fetch
// ---------------------------------------------------------------------------

const SLACK_API = 'https://slack.com/api';

async function slackCall(method: string, token: string, params?: Record<string, unknown>) {
  const isGet = !params || Object.keys(params).length === 0;
  const url = isGet ? `${SLACK_API}/${method}` : `${SLACK_API}/${method}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: params ? JSON.stringify(params) : undefined,
  });

  const data = await res.json();
  if (!data.ok) throw new Error(data.error || `Slack ${method} failed`);
  return data;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  let token: string;
  try {
    const result = await getProviderToken(userId, 'slack');
    token = result.token;
  } catch {
    return res.status(500).json({ error: 'Slack not connected. Add in Settings > Integrations.' });
  }

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      // ── Team Info ──
      case 'team-info':
        return res.json(await slackCall('team.info', token));

      case 'auth-test':
        return res.json(await slackCall('auth.test', token));

      // ── Channels ──
      case 'list-channels': {
        const { limit = 100, types = 'public_channel,private_channel' } = req.query;
        return res.json(await slackCall('conversations.list', token, {
          limit: Number(limit), types, exclude_archived: true,
        }));
      }
      case 'channel-info': {
        const { channel } = req.query;
        if (!channel) return res.status(400).json({ error: 'channel required' });
        return res.json(await slackCall('conversations.info', token, { channel }));
      }
      case 'channel-history': {
        const { channel, limit = 20 } = req.query;
        if (!channel) return res.status(400).json({ error: 'channel required' });
        return res.json(await slackCall('conversations.history', token, {
          channel, limit: Number(limit),
        }));
      }
      case 'channel-members': {
        const { channel, limit = 100 } = req.query;
        if (!channel) return res.status(400).json({ error: 'channel required' });
        return res.json(await slackCall('conversations.members', token, {
          channel, limit: Number(limit),
        }));
      }

      // ── Messages ──
      case 'send-message': {
        const { channel, text, blocks, thread_ts } = req.body;
        if (!channel || !text) return res.status(400).json({ error: 'channel and text required' });
        return res.json(await slackCall('chat.postMessage', token, {
          channel, text, blocks, thread_ts,
        }));
      }
      case 'update-message': {
        const { channel, ts, text } = req.body;
        if (!channel || !ts || !text) return res.status(400).json({ error: 'channel, ts, and text required' });
        return res.json(await slackCall('chat.update', token, { channel, ts, text }));
      }
      case 'delete-message': {
        const { channel, ts } = req.body;
        if (!channel || !ts) return res.status(400).json({ error: 'channel and ts required' });
        return res.json(await slackCall('chat.delete', token, { channel, ts }));
      }
      case 'schedule-message': {
        const { channel, text, post_at } = req.body;
        if (!channel || !text || !post_at) return res.status(400).json({ error: 'channel, text, and post_at required' });
        return res.json(await slackCall('chat.scheduleMessage', token, { channel, text, post_at }));
      }

      // ── Users ──
      case 'list-users': {
        const { limit = 100 } = req.query;
        return res.json(await slackCall('users.list', token, { limit: Number(limit) }));
      }
      case 'user-info': {
        const { user } = req.query;
        if (!user) return res.status(400).json({ error: 'user required' });
        return res.json(await slackCall('users.info', token, { user }));
      }
      case 'user-profile': {
        const { user } = req.query;
        if (!user) return res.status(400).json({ error: 'user required' });
        return res.json(await slackCall('users.profile.get', token, { user }));
      }

      // ── Reactions ──
      case 'add-reaction': {
        const { channel, timestamp, name } = req.body;
        if (!channel || !timestamp || !name) return res.status(400).json({ error: 'channel, timestamp, and name required' });
        return res.json(await slackCall('reactions.add', token, { channel, timestamp, name }));
      }

      // ── Search ──
      case 'search-messages': {
        const { query, count = 20 } = req.query;
        if (!query) return res.status(400).json({ error: 'query required' });
        return res.json(await slackCall('search.messages', token, {
          query, count: Number(count),
        }));
      }

      // ── Channel Management ──
      case 'create-channel': {
        const { name, is_private = false } = req.body;
        if (!name) return res.status(400).json({ error: 'name required' });
        return res.json(await slackCall('conversations.create', token, { name, is_private }));
      }
      case 'archive-channel': {
        const { channel } = req.body;
        if (!channel) return res.status(400).json({ error: 'channel required' });
        return res.json(await slackCall('conversations.archive', token, { channel }));
      }
      case 'set-channel-topic': {
        const { channel, topic } = req.body;
        if (!channel || !topic) return res.status(400).json({ error: 'channel and topic required' });
        return res.json(await slackCall('conversations.setTopic', token, { channel, topic }));
      }
      case 'invite-to-channel': {
        const { channel, users } = req.body;
        if (!channel || !users) return res.status(400).json({ error: 'channel and users required' });
        return res.json(await slackCall('conversations.invite', token, { channel, users }));
      }

      // ── Reactions (extended) ──
      case 'remove-reaction': {
        const { channel, timestamp, name } = req.body;
        if (!channel || !timestamp || !name) return res.status(400).json({ error: 'channel, timestamp, and name required' });
        return res.json(await slackCall('reactions.remove', token, { channel, timestamp, name }));
      }

      // ── Threads ──
      case 'get-thread-replies': {
        const { channel, ts } = req.query;
        if (!channel || !ts) return res.status(400).json({ error: 'channel and ts required' });
        return res.json(await slackCall('conversations.replies', token, { channel, ts }));
      }

      // ── User Status ──
      case 'set-user-status': {
        const { status_text, status_emoji } = req.body;
        return res.json(await slackCall('users.profile.set', token, {
          profile: { status_text, status_emoji },
        }));
      }

      // ── Files ──
      case 'upload-file': {
        const { channel_id, content, filename, title } = req.body;
        if (!channel_id || !content) return res.status(400).json({ error: 'channel_id and content required' });
        return res.json(await slackCall('files.uploadV2', token, { channel_id, content, filename, title }));
      }

      // ── Overview ──
      case 'overview': {
        const [auth, channels, users] = await Promise.all([
          slackCall('auth.test', token),
          slackCall('conversations.list', token, { limit: 50, types: 'public_channel,private_channel', exclude_archived: true }),
          slackCall('users.list', token, { limit: 50 }),
        ]);
        return res.json({
          team: auth.team,
          user: auth.user,
          channels: channels.channels?.length ?? 0,
          members: users.members?.filter((m: { deleted: boolean; is_bot: boolean }) => !m.deleted && !m.is_bot)?.length ?? 0,
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
