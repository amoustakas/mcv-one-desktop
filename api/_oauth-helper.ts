import { createClient } from '@supabase/supabase-js';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// ---------------------------------------------------------------------------
// OAuth Helper — Token encryption, storage, and retrieval
// ---------------------------------------------------------------------------

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

const ENCRYPTION_KEY = process.env.OAUTH_ENCRYPTION_KEY || '';
const ALGORITHM = 'aes-256-gcm';

// ---------------------------------------------------------------------------
// Encryption
// ---------------------------------------------------------------------------

export function encryptToken(plaintext: string): string {
  if (!ENCRYPTION_KEY) throw new Error('OAUTH_ENCRYPTION_KEY not configured');
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  // Format: iv:authTag:ciphertext (all base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

export function decryptToken(encrypted: string): string {
  if (!ENCRYPTION_KEY) throw new Error('OAUTH_ENCRYPTION_KEY not configured');
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const [ivB64, authTagB64, ciphertext] = encrypted.split(':');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ---------------------------------------------------------------------------
// Provider configs (server-side — reads env vars)
// ---------------------------------------------------------------------------

interface ProviderTokenConfig {
  authUrl: string;
  tokenUrl: string;
  revokeUrl?: string;
  userInfoUrl: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
}

const PROVIDER_CONFIGS: Record<string, () => ProviderTokenConfig> = {
  github: () => ({
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    clientId: process.env.GITHUB_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET || '',
    scopes: ['repo', 'read:org', 'read:user'],
  }),
  google: () => ({
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    revokeUrl: 'https://oauth2.googleapis.com/revoke',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
    scopes: [
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/tasks',
      'https://www.googleapis.com/auth/contacts.readonly',
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  }),
  notion: () => ({
    authUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    userInfoUrl: 'https://api.notion.com/v1/users/me',
    clientId: process.env.NOTION_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.NOTION_OAUTH_CLIENT_SECRET || '',
    scopes: [],
  }),
  cloudflare: () => ({
    authUrl: 'https://dash.cloudflare.com/oauth2/authorize',
    tokenUrl: 'https://dash.cloudflare.com/oauth2/token',
    userInfoUrl: 'https://api.cloudflare.com/client/v4/user',
    clientId: process.env.CLOUDFLARE_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.CLOUDFLARE_OAUTH_CLIENT_SECRET || '',
    scopes: ['account:read', 'zone:read', 'worker:read'],
  }),
  stripe: () => ({
    authUrl: 'https://connect.stripe.com/oauth/authorize',
    tokenUrl: 'https://connect.stripe.com/oauth/token',
    revokeUrl: 'https://connect.stripe.com/oauth/deauthorize',
    userInfoUrl: 'https://api.stripe.com/v1/account',
    clientId: process.env.STRIPE_CLIENT_ID || '',
    clientSecret: process.env.STRIPE_SECRET_KEY || '',
    scopes: ['read_write'],
  }),
  slack: () => ({
    authUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    revokeUrl: 'https://slack.com/api/auth.revoke',
    userInfoUrl: 'https://slack.com/api/auth.test',
    clientId: process.env.SLACK_CLIENT_ID || '',
    clientSecret: process.env.SLACK_CLIENT_SECRET || '',
    scopes: ['channels:read', 'chat:write', 'users:read', 'team:read'],
  }),
  discord: () => ({
    authUrl: 'https://discord.com/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    revokeUrl: 'https://discord.com/api/oauth2/token/revoke',
    userInfoUrl: 'https://discord.com/api/users/@me',
    clientId: process.env.DISCORD_CLIENT_ID || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    scopes: ['identify', 'guilds', 'guilds.members.read'],
  }),
  linear: () => ({
    authUrl: 'https://linear.app/oauth/authorize',
    tokenUrl: 'https://api.linear.app/oauth/token',
    revokeUrl: 'https://api.linear.app/oauth/revoke',
    userInfoUrl: 'https://api.linear.app/graphql',
    clientId: process.env.LINEAR_CLIENT_ID || '',
    clientSecret: process.env.LINEAR_CLIENT_SECRET || '',
    scopes: ['read', 'write'],
  }),
  figma: () => ({
    authUrl: 'https://www.figma.com/oauth',
    tokenUrl: 'https://api.figma.com/v1/oauth/token',
    userInfoUrl: 'https://api.figma.com/v1/me',
    clientId: process.env.FIGMA_CLIENT_ID || '',
    clientSecret: process.env.FIGMA_CLIENT_SECRET || '',
    scopes: ['files:read'],
  }),
  linkedin: () => ({
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    userInfoUrl: 'https://api.linkedin.com/v2/userinfo',
    clientId: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    scopes: ['openid', 'profile', 'email', 'w_member_social'],
  }),
  twitch: () => ({
    authUrl: 'https://id.twitch.tv/oauth2/authorize',
    tokenUrl: 'https://id.twitch.tv/oauth2/token',
    revokeUrl: 'https://id.twitch.tv/oauth2/revoke',
    userInfoUrl: 'https://api.twitch.tv/helix/users',
    clientId: process.env.TWITCH_CLIENT_ID || '',
    clientSecret: process.env.TWITCH_CLIENT_SECRET || '',
    scopes: ['user:read:email', 'channel:read:subscriptions'],
  }),
  microsoft: () => ({
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    scopes: ['User.Read', 'Mail.ReadWrite', 'Mail.Send', 'Calendars.ReadWrite', 'Contacts.Read', 'Files.ReadWrite.All', 'Sites.Read.All', 'Team.ReadBasic.All', 'Channel.ReadBasic.All', 'ChannelMessage.Send', 'Chat.ReadWrite', 'Presence.Read.All', 'OnlineMeetings.ReadWrite', 'Group.Read.All', 'Tasks.ReadWrite', 'offline_access'],
  }),
};

export function getProviderConfig(provider: string): ProviderTokenConfig {
  const factory = PROVIDER_CONFIGS[provider];
  if (!factory) throw new Error(`Unknown OAuth provider: ${provider}`);
  return factory();
}

// ---------------------------------------------------------------------------
// Token retrieval — used by API routes to get a user's OAuth token
// ---------------------------------------------------------------------------

// Providers that require OAuth tokens — env var fallback would use wrong token type
const OAUTH_ONLY_PROVIDERS = new Set([
  'google', 'microsoft', 'linkedin',
]);

// Scopes version — increment when scopes change to detect stale connections
export const GOOGLE_SCOPES_VERSION = 2; // v1 = read-only, v2 = full access (2026-04-13)

/**
 * Get the decrypted access token for a user+provider.
 * Falls back to static env var for API-key providers only.
 * OAuth-only providers (Google, Microsoft) throw clear errors instead of
 * falling back to an unrelated API key.
 */
export async function getProviderToken(
  userId: string,
  provider: string,
): Promise<{ token: string; source: 'oauth' | 'env' }> {
  // Try OAuth token first
  const { data } = await supabase
    .from('oauth_connections')
    .select('access_token_encrypted, token_expires_at, refresh_token_encrypted, status')
    .eq('user_id', userId)
    .eq('provider', provider)
    .eq('status', 'active')
    .single();

  if (data) {
    // Pre-expiration refresh: refresh if token expires within 5 minutes
    const expiresAt = data.token_expires_at ? new Date(data.token_expires_at) : null;
    const fiveMinFromNow = new Date(Date.now() + 5 * 60 * 1000);
    const needsRefresh = expiresAt && expiresAt < fiveMinFromNow;

    if (needsRefresh) {
      if (data.refresh_token_encrypted) {
        const refreshed = await refreshProviderToken(userId, provider, data.refresh_token_encrypted);
        if (refreshed) return { token: refreshed, source: 'oauth' };
      }
      // Only mark as expired if actually past expiration (not just pre-expiry)
      if (expiresAt && expiresAt < new Date()) {
        await supabase.from('oauth_connections')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('provider', provider);
      } else {
        // Pre-expiry refresh failed but token still valid — use it
        return { token: decryptToken(data.access_token_encrypted), source: 'oauth' };
      }
    } else {
      return { token: decryptToken(data.access_token_encrypted), source: 'oauth' };
    }
  }

  // OAuth-only providers must not fall back to env vars (wrong token type)
  if (OAUTH_ONLY_PROVIDERS.has(provider)) {
    throw new Error(
      `${provider.charAt(0).toUpperCase() + provider.slice(1)} not connected. ` +
      'Please connect your account in Settings > Integrations.',
    );
  }

  // Fall back to env var for API-key providers only
  const envFallbacks: Record<string, string> = {
    github: process.env.GITHUB_TOKEN || '',
    notion: process.env.NOTION_API_KEY || process.env.NOTION_TOKEN || '',
    cloudflare: process.env.CLOUDFLARE_API_TOKEN || '',
    stripe: process.env.STRIPE_SECRET_KEY || '',
    slack: process.env.SLACK_BOT_TOKEN || '',
    discord: process.env.DISCORD_BOT_TOKEN || '',
    linear: process.env.LINEAR_API_KEY || '',
    figma: process.env.FIGMA_ACCESS_TOKEN || '',
    twitch: process.env.TWITCH_CLIENT_SECRET || '',
  };

  const envToken = envFallbacks[provider];
  if (envToken) return { token: envToken, source: 'env' };

  throw new Error(`No token available for ${provider}. Connect in Settings > Integrations.`);
}

// In-memory deduplication for concurrent refresh requests
const pendingRefreshes = new Map<string, Promise<string | null>>();

/**
 * Refresh an expired OAuth token.
 * Deduplicates concurrent refresh requests for the same user+provider.
 */
async function refreshProviderToken(
  userId: string,
  provider: string,
  refreshTokenEncrypted: string,
): Promise<string | null> {
  const dedupeKey = `${userId}:${provider}`;
  const existing = pendingRefreshes.get(dedupeKey);
  if (existing) return existing;

  const promise = doRefreshToken(userId, provider, refreshTokenEncrypted)
    .finally(() => pendingRefreshes.delete(dedupeKey));
  pendingRefreshes.set(dedupeKey, promise);
  return promise;
}

async function doRefreshToken(
  userId: string,
  provider: string,
  refreshTokenEncrypted: string,
): Promise<string | null> {
  try {
    const config = getProviderConfig(provider);
    const refreshToken = decryptToken(refreshTokenEncrypted);

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    });

    const res = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: body.toString(),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const newAccessToken = data.access_token;
    const newRefreshToken = data.refresh_token;
    const expiresIn = data.expires_in;

    // Update stored tokens
    const updates: Record<string, unknown> = {
      access_token_encrypted: encryptToken(newAccessToken),
      status: 'active',
      updated_at: new Date().toISOString(),
    };
    if (newRefreshToken) {
      updates.refresh_token_encrypted = encryptToken(newRefreshToken);
    }
    if (expiresIn) {
      updates.token_expires_at = new Date(Date.now() + expiresIn * 1000).toISOString();
    }

    await supabase.from('oauth_connections')
      .update(updates)
      .eq('user_id', userId)
      .eq('provider', provider);

    return newAccessToken;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Store connection
// ---------------------------------------------------------------------------

export async function storeOAuthConnection(
  userId: string,
  provider: string,
  accessToken: string,
  refreshToken: string | null,
  expiresIn: number | null,
  scopes: string[],
  providerUserId: string,
  providerUserName: string,
): Promise<void> {
  const row: Record<string, unknown> = {
    user_id: userId,
    provider,
    access_token_encrypted: encryptToken(accessToken),
    refresh_token_encrypted: refreshToken ? encryptToken(refreshToken) : null,
    token_expires_at: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
    scopes,
    scopes_version: provider === 'google' ? GOOGLE_SCOPES_VERSION : 1,
    provider_user_id: providerUserId,
    provider_user_name: providerUserName,
    status: 'active',
    updated_at: new Date().toISOString(),
  };

  await supabase
    .from('oauth_connections')
    .upsert(row, { onConflict: 'user_id,provider' });
}

// ---------------------------------------------------------------------------
// Get all connections for a user
// ---------------------------------------------------------------------------

export async function getUserConnections(userId: string) {
  const { data } = await supabase
    .from('oauth_connections')
    .select('provider, provider_user_name, scopes, scopes_version, status, token_expires_at, updated_at')
    .eq('user_id', userId);

  return (data ?? []).map((c) => {
    // Detect stale scopes — user needs to reconnect for new permissions
    const needsScopeUpgrade = c.provider === 'google'
      && (c.scopes_version ?? 1) < GOOGLE_SCOPES_VERSION;

    return {
      provider: c.provider,
      connected: c.status === 'active',
      userName: c.provider_user_name,
      scopes: c.scopes,
      scopesVersion: c.scopes_version ?? 1,
      needsScopeUpgrade,
      status: c.status,
      expiresAt: c.token_expires_at,
    };
  });
}

// ---------------------------------------------------------------------------
// Delete connection
// ---------------------------------------------------------------------------

export async function deleteOAuthConnection(userId: string, provider: string): Promise<void> {
  await supabase
    .from('oauth_connections')
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider);
}
