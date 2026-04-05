// ---------------------------------------------------------------------------
// Communications Hub — Unified Types
// Normalized types that bridge Slack, Discord, Gmail, Twilio, Twitter,
// LinkedIn, and YouTube into a single messaging model.
// ---------------------------------------------------------------------------

export type CommsPlatform =
  | 'slack'
  | 'discord'
  | 'gmail'
  | 'twilio-sms'
  | 'twilio-whatsapp'
  | 'twitter'
  | 'linkedin'
  | 'youtube';

/** Messaging platforms (excludes social-only feeds) */
export type MessagingPlatform = Extract<
  CommsPlatform,
  'slack' | 'discord' | 'gmail' | 'twilio-sms' | 'twilio-whatsapp'
>;

/** Social platforms (read-heavy, engagement-focused) */
export type SocialPlatform = Extract<
  CommsPlatform,
  'twitter' | 'linkedin' | 'youtube'
>;

// ── Platform metadata ──

export interface PlatformMeta {
  id: CommsPlatform;
  label: string;
  color: string;
  /** lucide-react icon name */
  icon: string;
}

export const PLATFORM_META: Record<CommsPlatform, PlatformMeta> = {
  slack:             { id: 'slack',             label: 'Slack',    color: '#4A154B', icon: 'Hash' },
  discord:           { id: 'discord',           label: 'Discord',  color: '#5865F2', icon: 'Gamepad2' },
  gmail:             { id: 'gmail',             label: 'Gmail',    color: '#EA4335', icon: 'Mail' },
  'twilio-sms':      { id: 'twilio-sms',        label: 'SMS',      color: '#F22F46', icon: 'MessageSquare' },
  'twilio-whatsapp': { id: 'twilio-whatsapp',    label: 'WhatsApp', color: '#25D366', icon: 'Phone' },
  twitter:           { id: 'twitter',           label: 'X / Twitter', color: '#1DA1F2', icon: 'Twitter' },
  linkedin:          { id: 'linkedin',          label: 'LinkedIn', color: '#0077B5', icon: 'Linkedin' },
  youtube:           { id: 'youtube',           label: 'YouTube',  color: '#FF0000', icon: 'Youtube' },
};

// ── Unified message ──

export interface MessageAuthor {
  name: string;
  avatar?: string;
  platformId: string;
}

export interface UnifiedMessage {
  id: string;
  platform: CommsPlatform;
  channelId: string;
  channelName: string;
  author: MessageAuthor;
  content: string;
  timestamp: string; // ISO 8601
  threadId?: string;
  isRead: boolean;
  ventureId?: string;
  metadata: Record<string, unknown>;
}

// ── Unified channel / conversation ──

export type ChannelType = 'channel' | 'dm' | 'group' | 'thread' | 'inbox' | 'feed';

export interface UnifiedChannel {
  id: string;
  platform: CommsPlatform;
  name: string;
  type: ChannelType;
  memberCount?: number;
  unreadCount?: number;
  lastActivity?: string;
  ventureId?: string;
  platformMeta: Record<string, unknown>;
}

// ── Unified contact ──

export interface ContactPlatformLink {
  platform: CommsPlatform;
  platformId: string;
  handle: string;
}

export interface UnifiedContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  platforms: ContactPlatformLink[];
  ventureId?: string;
}

// ── Compose ──

export interface ComposeTarget {
  platform: CommsPlatform;
  channelId: string;
  channelName: string;
  threadId?: string;
}

// ── Platform health ──

export type PlatformHealth = 'active' | 'degraded' | 'error' | 'disconnected';

export interface PlatformStatus {
  platform: CommsPlatform;
  connected: boolean;
  health: PlatformHealth;
  lastChecked?: string;
  accountLabel?: string;
}

// ── Analytics ──

export type AnalyticsPeriod = 'day' | 'week' | 'month';

export interface CommsAnalytics {
  platform: CommsPlatform;
  messagesSent: number;
  messagesReceived: number;
  avgResponseTimeMs?: number;
  period: AnalyticsPeriod;
}

// ── Social posts (Twitter, LinkedIn, YouTube) ──

export interface SocialMetrics {
  likes: number;
  shares: number;
  comments: number;
  views?: number;
}

export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  content: string;
  timestamp: string;
  metrics: SocialMetrics;
  url?: string;
  author: {
    name: string;
    handle: string;
    avatar?: string;
  };
}

// ── Tab system ──

export type CommsTab =
  | 'inbox'
  | 'calendar'
  | 'calls'
  | 'channels'
  | 'compose'
  | 'analytics'
  | 'social'
  | 'contacts'
  | 'broadcast'
  | 'status';

export type InboxFilter = 'all' | 'unread' | 'flagged';
