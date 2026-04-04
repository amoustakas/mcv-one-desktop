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

-- Contacts table
create table if not exists contacts (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text,
  phone text,
  company text,
  role text,
  type text not null default 'lead',
  status text not null default 'active',
  venture_id text,
  notes text default '',
  tags text[] default '{}',
  linkedin_url text,
  twitter_url text,
  last_contacted timestamptz,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contacts_venture on contacts(venture_id);
create index if not exists idx_contacts_type on contacts(type);
alter table contacts enable row level security;
create policy "Allow all contacts" on contacts for all using (true) with check (true);

-- Deals table
create table if not exists deals (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  value numeric default 0,
  stage text not null default 'discovery',
  venture_id text,
  contact_id uuid references contacts(id) on delete set null,
  probability integer default 0,
  expected_close date,
  description text default '',
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_deals_venture on deals(venture_id);
create index if not exists idx_deals_stage on deals(stage);
alter table deals enable row level security;
create policy "Allow all deals" on deals for all using (true) with check (true);

-- Activities table (CRM interaction log)
create table if not exists activities (
  id uuid primary key default uuid_generate_v4(),
  type text not null default 'note',
  title text not null,
  description text default '',
  contact_id uuid references contacts(id) on delete cascade,
  deal_id uuid references deals(id) on delete set null,
  venture_id text,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_activities_contact on activities(contact_id, created_at desc);
create index if not exists idx_activities_deal on activities(deal_id, created_at desc);
alter table activities enable row level security;
create policy "Allow all activities" on activities for all using (true) with check (true);

-- Tasks table
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text default '',
  status text not null default 'todo',
  priority text default 'medium',
  venture_id text,
  assigned_to text,
  due_date date,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_venture on tasks(venture_id);
create index if not exists idx_tasks_status on tasks(status);
alter table tasks enable row level security;
create policy "Allow all tasks" on tasks for all using (true) with check (true);

-- Campaigns table (Growth Studio)
create table if not exists campaigns (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  status text not null default 'draft',
  type text not null default 'marketing',
  venture_id text,
  channel text,
  budget numeric default 0,
  reach integer default 0,
  conversions integer default 0,
  start_date date,
  end_date date,
  description text default '',
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_campaigns_venture on campaigns(venture_id);
alter table campaigns enable row level security;
create policy "Allow all campaigns" on campaigns for all using (true) with check (true);

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
