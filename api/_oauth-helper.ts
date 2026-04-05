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
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/gmail.readonly',
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
};

export function getProviderConfig(provider: string): ProviderTokenConfig {
  const factory = PROVIDER_CONFIGS[provider];
  if (!factory) throw new Error(`Unknown OAuth provider: ${provider}`);
  return factory();
}

// ---------------------------------------------------------------------------
// Token retrieval — used by API routes to get a user's OAuth token
// ---------------------------------------------------------------------------

/**
 * Get the decrypted access token for a user+provider.
 * Falls back to static env var if no OAuth connection exists.
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
    // Check expiration and refresh if needed
    if (data.token_expires_at && new Date(data.token_expires_at) < new Date()) {
      if (data.refresh_token_encrypted) {
        const refreshed = await refreshProviderToken(userId, provider, data.refresh_token_encrypted);
        if (refreshed) return { token: refreshed, source: 'oauth' };
      }
      // Token expired and can't refresh — mark as expired
      await supabase.from('oauth_connections')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('provider', provider);
    } else {
      return { token: decryptToken(data.access_token_encrypted), source: 'oauth' };
    }
  }

  // Fall back to env var
  const envFallbacks: Record<string, string> = {
    github: process.env.GITHUB_TOKEN || '',
    google: process.env.GOOGLE_AI_KEY || '',
    notion: process.env.NOTION_API_KEY || process.env.NOTION_TOKEN || '',
    cloudflare: process.env.CLOUDFLARE_API_TOKEN || '',
  };

  const envToken = envFallbacks[provider];
  if (envToken) return { token: envToken, source: 'env' };

  throw new Error(`No token available for ${provider}`);
}

/**
 * Refresh an expired OAuth token.
 */
async function refreshProviderToken(
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
    .select('provider, provider_user_name, scopes, status, token_expires_at, updated_at')
    .eq('user_id', userId);

  return (data ?? []).map((c) => ({
    provider: c.provider,
    connected: c.status === 'active',
    userName: c.provider_user_name,
    scopes: c.scopes,
    status: c.status,
    expiresAt: c.token_expires_at,
  }));
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
