import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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
): Promise<DbMessage | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, role, content })
    .select()
    .single();
  // bump conversation updated_at
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
