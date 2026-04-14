import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Browser-side Supabase client.
//   - `supabase` (anon client) — legacy singleton; RLS policies referencing
//     auth.uid() will NOT trigger. Kept for backward compatibility.
//   - `getAuthedClient(getToken)` — returns a client whose requests include
//     a Clerk-issued Supabase JWT so RLS + auth.jwt() claims work.
//     Set up a JWT template named "supabase" in Clerk signed with the
//     Supabase JWT secret. Usage:
//       const { getToken } = useAuth();
//       const sb = await getAuthedClient(() => getToken({ template: 'supabase' }));
// ---------------------------------------------------------------------------

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Cache per-token clients so we don't construct a new one on every query.
const _authedCache = new Map<string, SupabaseClient>();

export async function getAuthedClient(
  getToken: () => Promise<string | null | undefined>,
): Promise<SupabaseClient | null> {
  if (!supabaseUrl) return null;
  const token = await getToken();
  if (!token) return supabase; // fall back to anon if user not signed in
  const cached = _authedCache.get(token);
  if (cached) return cached;
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  _authedCache.set(token, client);
  return client;
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
