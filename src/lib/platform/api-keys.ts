// src/lib/platform/api-keys.ts
// API Key Management — generate, validate, revoke, list

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type RateLimitTier = 'free' | 'growth' | 'scale' | 'enterprise';

export interface ApiKey {
  id: string;
  ventureId: string;
  name: string;
  keyPrefix: string;       // "mcv_live_" or "mcv_test_"
  keyHash: string;          // SHA-256 hash of the full key (never store plaintext)
  lastUsedAt: string | null;
  expiresAt: string | null;
  rateLimitTier: RateLimitTier;
  permissions: string[];    // which API scopes are allowed
  createdAt: string;
}

export interface GeneratedApiKey {
  key: ApiKey;
  plaintext: string;        // full key — returned ONCE, never stored
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** SHA-256 hash via Web Crypto (works in both browser and edge runtime) */
async function sha256Hex(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Node.js fallback
  const { createHash } = await import('crypto');
  return createHash('sha256').update(input).digest('hex');
}

/** Generate 32 random URL-safe chars (nanoid-style, no external dep) */
function randomToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => chars[b % chars.length])
      .join('');
  }
  // Node.js fallback
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function newId(): string {
  return `${Date.now().toString(36)}-${randomToken(12)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a new API key.
 * Stores SHA-256 hash in Supabase. Returns full plaintext key ONCE.
 */
export async function generateApiKey(
  supabase: ReturnType<typeof import('@supabase/supabase-js').createClient>,
  ventureId: string,
  name: string,
  tier: RateLimitTier = 'free',
  options: {
    permissions?: string[];
    expiresAt?: string | null;
    test?: boolean;
  } = {},
): Promise<GeneratedApiKey> {
  const prefix = options.test ? 'mcv_test_' : 'mcv_live_';
  const token = randomToken(32);
  const plaintext = `${prefix}${token}`;
  const keyHash = await sha256Hex(plaintext);
  const id = newId();

  const row = {
    id,
    venture_id: ventureId,
    name,
    key_prefix: prefix,
    key_hash: keyHash,
    last_used_at: null,
    expires_at: options.expiresAt ?? null,
    rate_limit_tier: tier,
    permissions: options.permissions ?? ['*'],
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('api_keys').insert(row);
  if (error) throw new Error(`Failed to store API key: ${error.message}`);

  const key: ApiKey = {
    id,
    ventureId,
    name,
    keyPrefix: prefix,
    keyHash,
    lastUsedAt: null,
    expiresAt: options.expiresAt ?? null,
    rateLimitTier: tier,
    permissions: options.permissions ?? ['*'],
    createdAt: row.created_at,
  };

  return { key, plaintext };
}

/**
 * Validate an API key — hash it, look up in DB, check expiry.
 * Updates last_used_at on successful lookup.
 * Returns ApiKey or null if invalid/expired.
 */
export async function validateApiKey(
  supabase: ReturnType<typeof import('@supabase/supabase-js').createClient>,
  plaintext: string,
): Promise<ApiKey | null> {
  if (!plaintext || (!plaintext.startsWith('mcv_live_') && !plaintext.startsWith('mcv_test_'))) {
    return null;
  }

  const keyHash = await sha256Hex(plaintext);

  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .single();

  if (error || !data) return null;

  // Check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;

  // Update last_used_at (fire-and-forget, don't block the response)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(() => undefined)
    .catch(() => undefined);

  return {
    id: data.id,
    ventureId: data.venture_id,
    name: data.name,
    keyPrefix: data.key_prefix,
    keyHash: data.key_hash,
    lastUsedAt: data.last_used_at,
    expiresAt: data.expires_at,
    rateLimitTier: data.rate_limit_tier as RateLimitTier,
    permissions: data.permissions ?? ['*'],
    createdAt: data.created_at,
  };
}

/**
 * Revoke an API key by ID. Verifies ventureId ownership.
 */
export async function revokeApiKey(
  supabase: ReturnType<typeof import('@supabase/supabase-js').createClient>,
  keyId: string,
  ventureId: string,
): Promise<void> {
  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', keyId)
    .eq('venture_id', ventureId);

  if (error) throw new Error(`Failed to revoke API key: ${error.message}`);
}

/**
 * List all API keys for a venture.
 * Never returns the key hash — only prefix + last 4 chars of the ID for display.
 */
export async function listApiKeys(
  supabase: ReturnType<typeof import('@supabase/supabase-js').createClient>,
  ventureId: string,
): Promise<Omit<ApiKey, 'keyHash'>[]> {
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, venture_id, name, key_prefix, last_used_at, expires_at, rate_limit_tier, permissions, created_at')
    .eq('venture_id', ventureId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to list API keys: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    ventureId: row.venture_id,
    name: row.name,
    keyPrefix: row.key_prefix,
    lastUsedAt: row.last_used_at,
    expiresAt: row.expires_at,
    rateLimitTier: row.rate_limit_tier as RateLimitTier,
    permissions: row.permissions ?? ['*'],
    createdAt: row.created_at,
  }));
}
