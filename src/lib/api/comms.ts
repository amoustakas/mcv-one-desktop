import { apiPost, apiGet } from './client';
import type {
  CommsPlatform,
  UnifiedMessage,
  UnifiedChannel,
  UnifiedContact,
  SocialPost,
  PlatformStatus,
  PlatformHealth,
} from '../types/comms';

// ---------------------------------------------------------------------------
// Communications Hub — API Layer
// Wraps existing /api/* endpoints and normalizes responses into unified types.
// No new backend endpoints — pure client-side normalization.
// ---------------------------------------------------------------------------

// ── Slack ──

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function fetchSlackChannels(): Promise<UnifiedChannel[]> {
  const data = await apiGet<any>('/api/slack', { action: 'list-channels', limit: '200' });
  return (data.channels ?? []).map((ch: any) => ({
    id: ch.id,
    platform: 'slack' as CommsPlatform,
    name: ch.name,
    type: ch.is_im ? 'dm' : ch.is_mpim ? 'group' : 'channel',
    memberCount: ch.num_members,
    unreadCount: ch.unread_count ?? undefined,
    lastActivity: undefined,
    platformMeta: { topic: ch.topic?.value, purpose: ch.purpose?.value },
  }));
}

export async function fetchSlackHistory(channelId: string, limit = 20): Promise<UnifiedMessage[]> {
  const data = await apiGet<any>('/api/slack', {
    action: 'channel-history', channel: channelId, limit: String(limit),
  });
  return (data.messages ?? []).map((m: any) => ({
    id: m.ts,
    platform: 'slack' as CommsPlatform,
    channelId,
    channelName: '', // caller should enrich from channel data
    author: { name: m.user || 'Unknown', avatar: undefined, platformId: m.user || '' },
    content: m.text || '',
    timestamp: new Date(parseFloat(m.ts) * 1000).toISOString(),
    threadId: m.thread_ts,
    isRead: true,
    metadata: { subtype: m.subtype, reactions: m.reactions },
  }));
}

export async function sendSlackMessage(channel: string, text: string, threadTs?: string) {
  return apiPost('/api/slack', { action: 'send-message', channel, text, thread_ts: threadTs });
}

export async function fetchSlackUsers(): Promise<UnifiedContact[]> {
  const data = await apiGet<any>('/api/slack', { action: 'list-users', limit: '200' });
  return (data.members ?? [])
    .filter((u: any) => !u.is_bot && !u.deleted)
    .map((u: any) => ({
      id: `slack-${u.id}`,
      name: u.real_name || u.name,
      email: u.profile?.email,
      avatarUrl: u.profile?.image_72,
      platforms: [{ platform: 'slack' as CommsPlatform, platformId: u.id, handle: u.name }],
    }));
}

export async function fetchSlackOverview() {
  return apiGet<any>('/api/slack', { action: 'overview' });
}

// ── Discord ──

export async function fetchDiscordGuilds(): Promise<Array<{ id: string; name: string; icon: string | null }>> {
  const data = await apiGet<any>('/api/discord', { action: 'my-guilds' });
  return Array.isArray(data) ? data : [];
}

export async function fetchDiscordChannels(guildId: string): Promise<UnifiedChannel[]> {
  const data = await apiGet<any>('/api/discord', { action: 'list-guild-channels', guildId });
  return (Array.isArray(data) ? data : [])
    .filter((ch: any) => [0, 2, 5, 15].includes(ch.type)) // text, voice, announcement, forum
    .map((ch: any) => ({
      id: ch.id,
      platform: 'discord' as CommsPlatform,
      name: ch.name,
      type: ch.type === 0 ? 'channel' : ch.type === 12 ? 'thread' : 'channel',
      memberCount: undefined,
      lastActivity: ch.last_message_id ? undefined : undefined,
      platformMeta: { guildId, type: ch.type, position: ch.position },
    }));
}

export async function fetchDiscordMessages(channelId: string, limit = 50): Promise<UnifiedMessage[]> {
  const data = await apiGet<any>('/api/discord', { action: 'list-messages', channelId, limit: String(limit) });
  return (Array.isArray(data) ? data : []).map((m: any) => ({
    id: m.id,
    platform: 'discord' as CommsPlatform,
    channelId,
    channelName: '',
    author: {
      name: m.author?.global_name || m.author?.username || 'Unknown',
      avatar: m.author?.avatar
        ? `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}.png`
        : undefined,
      platformId: m.author?.id || '',
    },
    content: m.content || '',
    timestamp: m.timestamp,
    threadId: m.message_reference?.message_id,
    isRead: true,
    metadata: { embeds: m.embeds, attachments: m.attachments },
  }));
}

export async function sendDiscordMessage(channelId: string, content: string) {
  return apiPost('/api/discord', { action: 'send-message', channelId, content });
}

export async function fetchDiscordMembers(guildId: string): Promise<UnifiedContact[]> {
  const data = await apiGet<any>('/api/discord', { action: 'list-guild-members', guildId, limit: '100' });
  return (Array.isArray(data) ? data : []).map((m: any) => ({
    id: `discord-${m.user?.id}`,
    name: m.nick || m.user?.global_name || m.user?.username || 'Unknown',
    avatarUrl: m.user?.avatar
      ? `https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.png`
      : undefined,
    platforms: [{
      platform: 'discord' as CommsPlatform,
      platformId: m.user?.id || '',
      handle: m.user?.username || '',
    }],
  }));
}

// ── Gmail ──

export async function fetchGmailMessages(query?: string, maxResults = 20): Promise<UnifiedMessage[]> {
  const data = await apiGet<any>('/api/gmail', {
    action: 'search',
    q: query || 'in:inbox',
    maxResults: String(maxResults),
  });
  return (data.messages ?? []).map((m: any) => ({
    id: m.id,
    platform: 'gmail' as CommsPlatform,
    channelId: 'inbox',
    channelName: 'Gmail Inbox',
    author: { name: m.from || 'Unknown', avatar: undefined, platformId: m.from || '' },
    content: m.subject ? `${m.subject} — ${m.snippet || ''}` : m.snippet || '',
    timestamp: m.date ? new Date(m.date).toISOString() : new Date().toISOString(),
    isRead: true,
    metadata: { subject: m.subject, snippet: m.snippet },
  }));
}

export async function sendGmailMessage(to: string, subject: string, body: string) {
  return apiPost('/api/gmail', { action: 'send', to, subject, body });
}

// ── Twilio ──

export async function fetchTwilioMessages(limit = 20): Promise<UnifiedMessage[]> {
  const data = await apiGet<any>('/api/twilio', { action: 'list-messages', limit: String(limit) });
  const messages = data.messages ?? [];
  return messages.map((m: any) => {
    const isWhatsApp = m.from?.startsWith('whatsapp:') || m.to?.startsWith('whatsapp:');
    return {
      id: m.sid,
      platform: (isWhatsApp ? 'twilio-whatsapp' : 'twilio-sms') as CommsPlatform,
      channelId: m.from || '',
      channelName: isWhatsApp ? 'WhatsApp' : 'SMS',
      author: {
        name: m.direction === 'inbound' ? (m.from || 'Unknown') : 'You',
        platformId: m.from || '',
      },
      content: m.body || '',
      timestamp: m.date_sent || m.date_created || new Date().toISOString(),
      isRead: true,
      metadata: { direction: m.direction, status: m.status, to: m.to, from: m.from },
    };
  });
}

export async function sendSms(to: string, body: string) {
  return apiPost('/api/twilio', { action: 'send-sms', to, body });
}

export async function sendWhatsApp(to: string, body: string) {
  return apiPost('/api/twilio', { action: 'send-whatsapp', to, body });
}

// ── Twitter / X ──

export async function fetchTwitterTimeline(userId: string, maxResults = 10): Promise<SocialPost[]> {
  const data = await apiGet<any>('/api/twitter', {
    action: 'user-tweets', userId, max_results: String(maxResults),
  });
  const tweets = data.data ?? [];
  const users = data.includes?.users ?? [];
  const authorMap = new Map(users.map((u: any) => [u.id, u]));

  return tweets.map((t: any) => {
    const author = authorMap.get(t.author_id) ?? {};
    return {
      id: t.id,
      platform: 'twitter' as const,
      content: t.text || '',
      timestamp: t.created_at || new Date().toISOString(),
      metrics: {
        likes: t.public_metrics?.like_count ?? 0,
        shares: t.public_metrics?.retweet_count ?? 0,
        comments: t.public_metrics?.reply_count ?? 0,
        views: t.public_metrics?.impression_count,
      },
      url: `https://x.com/i/status/${t.id}`,
      author: {
        name: (author as any).name || 'Unknown',
        handle: `@${(author as any).username || ''}`,
        avatar: (author as any).profile_image_url,
      },
    };
  });
}

export async function fetchTwitterUser(username: string) {
  return apiGet<any>('/api/twitter', { action: 'get-user', username });
}

// ── LinkedIn ──

export async function fetchLinkedInProfile() {
  return apiGet<any>('/api/linkedin', { action: 'me' });
}

export async function fetchLinkedInPosts(): Promise<SocialPost[]> {
  // LinkedIn v2 API doesn't expose a clean "my posts" list via ugcPosts without special access.
  // We return an empty array as a placeholder — this will be populated via the overview endpoint.
  return [];
}

// ── YouTube ──

export async function fetchYouTubeVideos(maxResults = 10): Promise<SocialPost[]> {
  const data = await apiGet<any>('/api/youtube', {
    action: 'list-videos', maxResults: String(maxResults),
  });
  const items = data.items ?? [];
  return items.map((item: any) => ({
    id: item.id?.videoId || item.id,
    platform: 'youtube' as const,
    content: item.snippet?.title || '',
    timestamp: item.snippet?.publishedAt || new Date().toISOString(),
    metrics: {
      likes: Number(item.statistics?.likeCount ?? 0),
      shares: 0,
      comments: Number(item.statistics?.commentCount ?? 0),
      views: Number(item.statistics?.viewCount ?? 0),
    },
    url: `https://youtube.com/watch?v=${item.id?.videoId || item.id}`,
    author: {
      name: item.snippet?.channelTitle || 'Unknown',
      handle: item.snippet?.channelTitle || '',
    },
  }));
}

// ── Venture Scoping ──

import { ventures } from '../ventures';
import type { UnifiedMessage as UM, UnifiedChannel as UC } from '../types/comms';

/**
 * Attempt to map a channel/message to a venture based on channel name matching
 * against venture slugs, names, or social handle keywords.
 */
function inferVentureId(channelName: string, platform: CommsPlatform): string | undefined {
  const lower = channelName.toLowerCase();
  for (const v of ventures) {
    // Match channel name against venture id, name, or domain prefix
    if (lower.includes(v.id) || lower.includes(v.name.toLowerCase()) || lower.includes(v.domain.split('.')[0])) {
      return v.id;
    }
    // Match against social handles
    const socials = v.socials;
    if (platform === 'discord' && socials.discord && lower.includes(v.id)) return v.id;
    if (platform === 'twitter' && socials.twitter) {
      const handle = socials.twitter.split('/').pop()?.toLowerCase();
      if (handle && lower.includes(handle)) return v.id;
    }
  }
  return undefined;
}

/** Tag messages with venture IDs based on channel name matching */
export function tagMessagesWithVentures(messages: UM[]): UM[] {
  return messages.map((m) => ({
    ...m,
    ventureId: m.ventureId || inferVentureId(m.channelName, m.platform),
  }));
}

/** Tag channels with venture IDs */
export function tagChannelsWithVentures(channels: UC[]): UC[] {
  return channels.map((ch) => ({
    ...ch,
    ventureId: ch.ventureId || inferVentureId(ch.name, ch.platform),
  }));
}

// ── Aggregators ──

/** Map of CommsPlatform → OAuth provider ID for integration status checks */
export const PLATFORM_TO_PROVIDER: Partial<Record<CommsPlatform, string>> = {
  slack: 'slack',
  discord: 'discord',
  gmail: 'google',
  'twilio-sms': 'twilio',
  'twilio-whatsapp': 'twilio',
  twitter: 'twitter',
  linkedin: 'linkedin',
  youtube: 'google',
};

/** Fetch messages from all connected messaging platforms in parallel */
export async function fetchUnifiedInbox(
  connectedPlatforms: CommsPlatform[],
): Promise<UnifiedMessage[]> {
  const fetchers: Array<Promise<UnifiedMessage[]>> = [];

  if (connectedPlatforms.includes('slack')) {
    fetchers.push(
      fetchSlackChannels()
        .then((channels) => {
          // Get history from first 5 active channels
          const top = channels.slice(0, 5);
          return Promise.all(top.map((ch) =>
            fetchSlackHistory(ch.id, 5).then((msgs) =>
              msgs.map((m) => ({ ...m, channelName: ch.name })),
            ),
          ));
        })
        .then((results) => results.flat()),
    );
  }

  if (connectedPlatforms.includes('discord')) {
    fetchers.push(
      fetchDiscordGuilds()
        .then((guilds) => {
          if (guilds.length === 0) return [];
          return fetchDiscordChannels(guilds[0].id);
        })
        .then((channels) => {
          const textChannels = channels.filter((ch) => ch.type === 'channel').slice(0, 3);
          return Promise.all(textChannels.map((ch) =>
            fetchDiscordMessages(ch.id, 5).then((msgs) =>
              msgs.map((m) => ({ ...m, channelName: ch.name })),
            ),
          ));
        })
        .then((results) => results.flat()),
    );
  }

  if (connectedPlatforms.includes('gmail')) {
    fetchers.push(fetchGmailMessages(undefined, 10));
  }

  if (connectedPlatforms.includes('twilio-sms') || connectedPlatforms.includes('twilio-whatsapp')) {
    fetchers.push(fetchTwilioMessages(10));
  }

  const results = await Promise.allSettled(fetchers);
  const allMessages: UnifiedMessage[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allMessages.push(...result.value);
    }
  }

  // Sort newest first
  return allMessages.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

/** Fetch channels from all connected platforms */
export async function fetchAllChannels(
  connectedPlatforms: CommsPlatform[],
): Promise<UnifiedChannel[]> {
  const fetchers: Array<Promise<UnifiedChannel[]>> = [];

  if (connectedPlatforms.includes('slack')) {
    fetchers.push(fetchSlackChannels());
  }

  if (connectedPlatforms.includes('discord')) {
    fetchers.push(
      fetchDiscordGuilds().then(async (guilds) => {
        const all: UnifiedChannel[] = [];
        for (const g of guilds.slice(0, 3)) {
          const channels = await fetchDiscordChannels(g.id);
          all.push(...channels.map((ch) => ({
            ...ch,
            name: `${g.name} / ${ch.name}`,
          })));
        }
        return all;
      }),
    );
  }

  // Gmail has a virtual "Inbox" channel
  if (connectedPlatforms.includes('gmail')) {
    fetchers.push(Promise.resolve([{
      id: 'gmail-inbox',
      platform: 'gmail' as CommsPlatform,
      name: 'Gmail Inbox',
      type: 'inbox' as const,
      platformMeta: {},
    }]));
  }

  const results = await Promise.allSettled(fetchers);
  const allChannels: UnifiedChannel[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allChannels.push(...result.value);
    }
  }

  return allChannels;
}

/** Derive platform statuses from integration connection states */
export function derivePlatformStatuses(
  connections: Record<string, { connected: boolean; flowState?: string }>,
): PlatformStatus[] {
  const platforms: CommsPlatform[] = [
    'slack', 'discord', 'gmail', 'twilio-sms', 'twilio-whatsapp',
    'twitter', 'linkedin', 'youtube',
  ];

  return platforms.map((platform) => {
    const providerId = PLATFORM_TO_PROVIDER[platform];
    const conn = providerId ? connections[providerId] : undefined;
    const connected = conn?.connected ?? false;

    let health: PlatformHealth = 'disconnected';
    if (connected) {
      health = conn?.flowState === 'degraded' ? 'degraded' : 'active';
    }

    return { platform, connected, health };
  });
}

/** Platform-aware send — routes to the correct API based on platform */
export async function sendMessage(
  platform: CommsPlatform,
  params: { channelId: string; content: string; threadId?: string; to?: string; subject?: string },
) {
  switch (platform) {
    case 'slack':
      return sendSlackMessage(params.channelId, params.content, params.threadId);
    case 'discord':
      return sendDiscordMessage(params.channelId, params.content);
    case 'gmail':
      return sendGmailMessage(params.to || params.channelId, params.subject || '(No subject)', params.content);
    case 'twilio-sms':
      return sendSms(params.to || params.channelId, params.content);
    case 'twilio-whatsapp':
      return sendWhatsApp(params.to || params.channelId, params.content);
    default:
      throw new Error(`Send not supported for platform: ${platform}`);
  }
}
