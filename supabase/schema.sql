-- MCV One Desktop — Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Conversations table
create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  venture_id text not null,
  title text not null default 'New Chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Messages table
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_conversations_venture on conversations(venture_id, updated_at desc);
create index if not exists idx_messages_conversation on messages(conversation_id, created_at asc);

-- RLS (disabled for now — enable once auth is added)
alter table conversations enable row level security;
alter table messages enable row level security;

-- Temporary open policy (replace with Clerk-based auth later)
create policy "Allow all conversations" on conversations for all using (true) with check (true);
create policy "Allow all messages" on messages for all using (true) with check (true);
