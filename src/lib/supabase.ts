import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Browser-side Supabase client.
//
// Single shared singleton. Uses the `accessToken` callback (supabase-js 2.44+)
// so every request transparently attaches the current Clerk session token —
// no per-call plumbing, no dual clients. Auth hook calls `setClerkTokenGetter`
// once after sign-in; the client reads through it on every request.
//
// Works with both Clerk integration paths:
//   (A) Native third-party (recommended): `getToken()` with no args. Supabase
//       validates the Clerk-issued JWT against Clerk's JWKS.
//   (B) Legacy JWT template: `getToken({ template: 'supabase' })` returns a
//       JWT signed with the Supabase JWT secret.
// ---------------------------------------------------------------------------

// Resolve env from Vite (browser) OR process.env (Node, when imported by
// api/*.ts handlers via server/api-routes.ts in local dev). import.meta.env
// is undefined in Node so guard the access.
const viteEnv: Record<string, string | undefined> = (() => {
  try { return (import.meta as unknown as { env?: Record<string, string> }).env || {}; }
  catch { return {}; }
})();
const nodeEnv: Record<string, string | undefined> =
  typeof process !== 'undefined' && process.env ? process.env : {};

const supabaseUrl = viteEnv.VITE_SUPABASE_URL || nodeEnv.VITE_SUPABASE_URL || nodeEnv.SUPABASE_URL || '';
const supabaseAnonKey = viteEnv.VITE_SUPABASE_ANON_KEY || nodeEnv.VITE_SUPABASE_ANON_KEY || nodeEnv.SUPABASE_SERVICE_KEY || '';

// Getter that returns the current Clerk JWT. Wired by auth.tsx on sign-in.
let _tokenGetter: (() => Promise<string | null | undefined>) | null = null;
let _cachedToken: string | null = null;
let _cachedTokenExpiresAt = 0;

export function setClerkTokenGetter(getter: (() => Promise<string | null | undefined>) | null) {
  _tokenGetter = getter;
  _cachedToken = null;
  _cachedTokenExpiresAt = 0;
  // Push the new token into the realtime channel so WebSocket subscriptions
  // authenticate correctly after sign-in.
  if (supabase && getter) {
    getter().then((t) => {
      if (t) supabase.realtime.setAuth(t);
    }).catch(() => { /* non-fatal */ });
  }
}

// Cache the token for 50 seconds — shorter than Clerk's 60s rotation window.
async function resolveToken(): Promise<string | null> {
  if (!_tokenGetter) return null;
  const now = Date.now();
  if (_cachedToken && now < _cachedTokenExpiresAt) return _cachedToken;
  try {
    const t = await _tokenGetter();
    _cachedToken = t || null;
    _cachedTokenExpiresAt = now + 50_000;
    return _cachedToken;
  } catch {
    return null;
  }
}

export const supabase: SupabaseClient | null = supabaseUrl
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      // supabase-js v2.44+: callback returns a JWT to attach on every request.
      // Returning null falls back to the anon key.
      accessToken: async () => (await resolveToken()) || null,
    })
  : null;

// Kept for backwards compat; most call sites should just use `supabase`.
export async function getAuthedClient(
  _getToken?: () => Promise<string | null | undefined>,
): Promise<SupabaseClient | null> {
  return supabase;
}

export interface DbConversation {
  id: string;
  venture_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface DbMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export async function getConversations(ventureId: string): Promise<DbConversation[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('conversations')
    .select('*')
    .eq('venture_id', ventureId)
    .order('updated_at', { ascending: false });
  return data ?? [];
}

export async function createConversation(ventureId: string, title: string): Promise<DbConversation | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from('conversations')
    .insert({ venture_id: ventureId, title })
    .select()
    .single();
  return data;
}

export async function getMessages(conversationId: string): Promise<DbMessage[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  metadata?: Record<string, unknown>,
): Promise<DbMessage | null> {
  if (!supabase) return null;
  const row: Record<string, unknown> = { conversation_id: conversationId, role, content };
  if (metadata) row.metadata = metadata;
  const { data } = await supabase
    .from('messages')
    .insert(row)
    .select()
    .single();
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);
  return data;
}

export async function deleteConversation(conversationId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('messages').delete().eq('conversation_id', conversationId);
  await supabase.from('conversations').delete().eq('id', conversationId);
}
