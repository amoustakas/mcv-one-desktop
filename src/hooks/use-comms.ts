import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../lib/api/comms';
import type { CommsPlatform, SocialPost } from '../lib/types/comms';
import { useIntegrations } from '../stores/integrations';
import { useCommsStore } from '../stores/comms';

// ---------------------------------------------------------------------------
// Communications Hub — TanStack Query Hooks
// ---------------------------------------------------------------------------

// ── Query Keys ──

export const commsKeys = {
  inbox: (platforms?: CommsPlatform[]) => ['comms', 'inbox', platforms] as const,
  channels: (platforms?: CommsPlatform[]) => ['comms', 'channels', platforms] as const,
  messages: (platform: string, channelId: string) => ['comms', 'messages', platform, channelId] as const,
  social: (platform?: string) => ['comms', 'social', platform] as const,
  statuses: () => ['comms', 'statuses'] as const,
  slackUsers: () => ['comms', 'slack-users'] as const,
  discordGuilds: () => ['comms', 'discord-guilds'] as const,
  discordMembers: (guildId: string) => ['comms', 'discord-members', guildId] as const,
};

// ── Helper: get connected comms platforms ──

function useConnectedPlatforms(): CommsPlatform[] {
  const connections = useIntegrations((s) => s.connections);
  const activePlatforms = useCommsStore((s) => s.activePlatforms);

  return activePlatforms.filter((platform) => {
    const providerId = api.PLATFORM_TO_PROVIDER[platform];
    if (!providerId) return false;
    // Twilio uses API keys, not OAuth — check env availability via a flag
    if (providerId === 'twilio') return true; // assume available if user has it in activePlatforms
    if (providerId === 'twitter') return true; // bearer token, not per-user OAuth
    const conn = connections[providerId];
    return conn?.connected ?? false;
  });
}

// ── Inbox ──

export function useUnifiedInbox() {
  const connected = useConnectedPlatforms();
  return useQuery({
    queryKey: commsKeys.inbox(connected),
    queryFn: () => api.fetchUnifiedInbox(connected).then(api.tagMessagesWithVentures),
    staleTime: 30_000,
    enabled: connected.length > 0,
  });
}

// ── Channels ──

export function useCommsChannels() {
  const connected = useConnectedPlatforms();
  return useQuery({
    queryKey: commsKeys.channels(connected),
    queryFn: () => api.fetchAllChannels(connected).then(api.tagChannelsWithVentures),
    staleTime: 60_000,
    enabled: connected.length > 0,
  });
}

// ── Channel Messages ──

export function useChannelMessages(platform: CommsPlatform, channelId: string) {
  return useQuery({
    queryKey: commsKeys.messages(platform, channelId),
    queryFn: () => {
      switch (platform) {
        case 'slack':
          return api.fetchSlackHistory(channelId);
        case 'discord':
          return api.fetchDiscordMessages(channelId);
        case 'gmail':
          return api.fetchGmailMessages(undefined, 20);
        default:
          return Promise.resolve([]);
      }
    },
    staleTime: 30_000,
    enabled: !!channelId,
  });
}

// ── Social Feeds ──

export function useSocialFeed(platform: 'twitter' | 'linkedin' | 'youtube', userId?: string) {
  return useQuery({
    queryKey: commsKeys.social(platform),
    queryFn: async (): Promise<SocialPost[]> => {
      switch (platform) {
        case 'twitter':
          return userId ? api.fetchTwitterTimeline(userId) : [];
        case 'linkedin':
          return api.fetchLinkedInPosts();
        case 'youtube':
          return api.fetchYouTubeVideos();
        default:
          return [];
      }
    },
    staleTime: 60_000,
  });
}

// ── Platform Statuses ──

export function usePlatformStatuses() {
  const connections = useIntegrations((s) => s.connections);
  return api.derivePlatformStatuses(connections);
}

// ── Contacts (Slack users) ──

export function useSlackUsers() {
  return useQuery({
    queryKey: commsKeys.slackUsers(),
    queryFn: () => api.fetchSlackUsers(),
    staleTime: 300_000,
  });
}

// ── Discord guilds ──

export function useDiscordGuilds() {
  return useQuery({
    queryKey: commsKeys.discordGuilds(),
    queryFn: () => api.fetchDiscordGuilds(),
    staleTime: 300_000,
  });
}

export function useDiscordMembers(guildId: string) {
  return useQuery({
    queryKey: commsKeys.discordMembers(guildId),
    queryFn: () => api.fetchDiscordMembers(guildId),
    staleTime: 300_000,
    enabled: !!guildId,
  });
}

// ── Mutations ──

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      platform: CommsPlatform;
      channelId: string;
      content: string;
      threadId?: string;
      to?: string;
      subject?: string;
    }) => api.sendMessage(params.platform, params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comms', 'inbox'] });
      qc.invalidateQueries({ queryKey: ['comms', 'messages'] });
    },
  });
}

export function useBroadcast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      targets: Array<{ platform: CommsPlatform; channelId: string; to?: string }>;
      content: string;
      subject?: string;
    }) => {
      const results = await Promise.allSettled(
        params.targets.map((target) =>
          api.sendMessage(target.platform, {
            channelId: target.channelId,
            content: params.content,
            to: target.to,
            subject: params.subject,
          }),
        ),
      );
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;
      return { succeeded, failed, total: results.length };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comms'] });
    },
  });
}
