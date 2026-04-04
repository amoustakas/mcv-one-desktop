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

-- Documents table (for NAOS document system / Notion ingestion)
create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  title text not null default 'Untitled',
  content text not null default '',
  doc_type text not null default 'note',
  venture_id text not null default 'mcv',
  source_url text,
  metadata jsonb default '{}',
  user_id text default 'system',
  embedding_status text default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_documents_venture on documents(venture_id, updated_at desc);
create index if not exists idx_documents_type on documents(doc_type);

alter table documents enable row level security;
create policy "Allow all documents" on documents for all using (true) with check (true);
