-- MCV One Desktop — Venture Docs Migration
-- Templatized business documentation registry (Legal / Compliance / Research / Finance / Ops / Product)
-- plus per-venture document instances. Templates are seeded once from the Notion
-- "Business Documents Tracker" via scripts/import-notion-bdt.ts, then applied
-- per venture via POST /api/ventures?action=apply-doc-template.
--
-- Run AFTER migration-venture-os.sql.

-- =========================================================================
-- 1. doc_templates — global, versioned template registry
-- =========================================================================

create table if not exists doc_templates (
  id              text primary key,                 -- e.g. 'legal.msa', 'research.market-brief'
  department      text not null check (department in ('legal', 'compliance', 'research', 'finance', 'ops', 'product')),
  title           text not null,
  description     text,
  body_markdown   text not null,
  variables       jsonb not null default '[]'::jsonb,  -- ["venture","date","counterparty"]
  source          text not null default 'notion',       -- 'notion' | 'manual' | 'imported'
  source_ref      text,                                 -- Notion page id / URL of origin
  version         integer not null default 1,
  is_active       boolean not null default true,
  tags            text[] not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table doc_templates is 'Global document template registry. Seeded from Notion Business Documents Tracker; operators can add manual templates. Versioned — bumping version on re-import.';

create index if not exists idx_doc_templates_department on doc_templates(department);
create index if not exists idx_doc_templates_active on doc_templates(is_active) where is_active;
create index if not exists idx_doc_templates_tags on doc_templates using gin(tags);

alter table doc_templates enable row level security;

drop policy if exists "doc_templates_select" on doc_templates;
create policy "doc_templates_select" on doc_templates for select using (true);

drop policy if exists "doc_templates_mutate" on doc_templates;
create policy "doc_templates_mutate" on doc_templates for all using (auth.uid() is not null);

-- =========================================================================
-- 2. venture_docs — per-venture document instances
-- =========================================================================

create table if not exists venture_docs (
  id              uuid primary key default gen_random_uuid(),
  venture_id      text not null references ventures(id) on delete cascade,
  template_id     text references doc_templates(id) on delete set null,
  department      text not null check (department in ('legal', 'compliance', 'research', 'finance', 'ops', 'product')),
  title           text not null,
  body_markdown   text,
  status          text not null default 'draft' check (status in ('draft', 'in-review', 'approved', 'executed', 'archived')),
  meta            jsonb not null default '{}'::jsonb,
  variables       jsonb not null default '{}'::jsonb,  -- resolved values at instantiation time
  owner           text,                                 -- Clerk user id of doc owner
  reviewers       text[] not null default '{}',
  approved_at     timestamptz,
  executed_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table venture_docs is 'Per-venture document instances. One row per (venture, document) pair. Body is editable markdown; status transitions drive department Epics.';

create index if not exists idx_venture_docs_venture on venture_docs(venture_id, department);
create index if not exists idx_venture_docs_status on venture_docs(status);
create index if not exists idx_venture_docs_template on venture_docs(template_id);

alter table venture_docs enable row level security;

drop policy if exists "venture_docs_select" on venture_docs;
create policy "venture_docs_select" on venture_docs for select using (
  exists (
    select 1 from ventures v
    where v.id = venture_docs.venture_id
      and (v.clerk_org_id is null or (auth.jwt() ->> 'org_id') = v.clerk_org_id)
  )
);

drop policy if exists "venture_docs_mutate" on venture_docs;
create policy "venture_docs_mutate" on venture_docs for all using (
  auth.uid() is not null
) with check (
  auth.uid() is not null
);

create or replace function update_venture_docs_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_venture_docs_updated_at on venture_docs;
create trigger trg_venture_docs_updated_at before update on venture_docs
  for each row execute function update_venture_docs_updated_at();

-- =========================================================================
-- 3. Baseline templates (seed) — minimal set so the system is usable before
--    the Notion BDT import runs. The importer UPSERTs these by id and bumps version.
-- =========================================================================

insert into doc_templates (id, department, title, description, body_markdown, variables, source) values
  ('legal.msa',              'legal',      'Master Services Agreement',          'Standard MSA template for venture engagements.',                '# Master Services Agreement\n\nThis MSA is entered into by **{{venture}}** and **{{counterparty}}** on {{date}}.\n\n## 1. Services\n\n## 2. Fees\n\n## 3. Term and Termination\n\n## 4. Confidentiality\n\n## 5. Limitation of Liability\n',          '["venture","counterparty","date"]', 'manual'),
  ('legal.nda',              'legal',      'Mutual NDA',                          'Mutual non-disclosure agreement template.',                     '# Mutual NDA\n\nThis NDA is between **{{venture}}** and **{{counterparty}}** effective {{date}}.\n\n## Confidential Information\n\n## Permitted Use\n\n## Term\n',                                                                '["venture","counterparty","date"]', 'manual'),
  ('legal.ip-assignment',    'legal',      'IP Assignment Agreement',             'Assignment of work-product IP to the venture.',                 '# IP Assignment\n\n**{{contributor}}** assigns all work-product IP to **{{venture}}**.\n',                                                                                                                                  '["venture","contributor","date"]',  'manual'),
  ('legal.tos',              'legal',      'Terms of Service',                    'Public-facing ToS for venture products.',                       '# {{venture}} Terms of Service\n\nEffective: {{date}}\n\n## 1. Acceptance\n\n## 2. Use of Service\n\n## 3. Privacy\n\n## 4. Disclaimers\n',                                                                                  '["venture","date"]',                'manual'),
  ('legal.privacy',          'legal',      'Privacy Policy',                      'Privacy policy boilerplate.',                                   '# {{venture}} Privacy Policy\n\nEffective: {{date}}\n',                                                                                                                                                                      '["venture","date"]',                'manual'),

  ('compliance.soc2-prep',   'compliance', 'SOC2 Readiness Checklist',            'Pre-audit control checklist.',                                  '# SOC2 Readiness — {{venture}}\n\n- [ ] Access control policy\n- [ ] Change management\n- [ ] Incident response runbook\n- [ ] Vendor management log\n- [ ] Encryption at rest + in transit\n',                                '["venture"]',                       'manual'),
  ('compliance.gdpr-dpa',    'compliance', 'GDPR Data Processing Addendum',       'GDPR-compliant DPA template.',                                  '# DPA — {{venture}} and {{counterparty}}\n\n## 1. Subject Matter\n## 2. Processing Instructions\n## 3. Sub-processors\n',                                                                                                    '["venture","counterparty"]',        'manual'),
  ('compliance.state-filings', 'compliance', 'State Filings Tracker',             'Per-state registration and filing log.',                        '# State Filings — {{venture}}\n\n| State | Status | Filed | Renewal Due |\n|-------|--------|-------|-------------|\n| DE    |        |       |             |\n',                                                              '["venture"]',                       'manual'),

  ('research.market-brief',  'research',   'Market Brief',                        'Opportunity sizing and segmentation.',                          '# Market Brief — {{venture}}\n\n## TAM / SAM / SOM\n## Key Segments\n## Adjacent Markets\n## Entry Hypothesis\n',                                                                                                              '["venture"]',                       'manual'),
  ('research.competitor',    'research',   'Competitor Teardown',                 'Deep analysis of a named competitor.',                          '# Competitor — {{competitor}}\n\n## Positioning\n## Pricing\n## Distribution\n## Product Gaps\n## What {{venture}} Does Differently\n',                                                                                         '["venture","competitor"]',          'manual'),
  ('research.interview-log', 'research',   'Customer Interview Log',              'Semi-structured interview notes.',                              '# Interview — {{participant}} ({{date}})\n\n## Pain Points\n## Current Workflow\n## Willingness to Pay\n## Quotes\n',                                                                                                          '["venture","participant","date"]',  'manual'),

  ('finance.cap-table',      'finance',    'Cap Table Snapshot',                  'Current ownership snapshot.',                                   '# {{venture}} Cap Table — {{date}}\n\n| Holder | Class | Shares | % Fully Diluted |\n|--------|-------|--------|-----------------|\n',                                                                                          '["venture","date"]',                'manual'),
  ('finance.burn-model',     'finance',    'Burn Model',                          '12-month burn projection.',                                     '# {{venture}} Burn — {{date}}\n\n## Monthly Cash Out\n## Runway (months)\n## Trigger Events\n',                                                                                                                                '["venture","date"]',                'manual'),
  ('finance.unit-economics', 'finance',    'Unit Economics',                      'CAC / LTV / payback analysis.',                                 '# Unit Economics — {{venture}}\n\n## CAC\n## LTV\n## Payback Period\n## Contribution Margin\n',                                                                                                                                '["venture"]',                       'manual'),

  ('ops.runbook',            'ops',        'Service Runbook',                     'On-call operational procedures.',                               '# Runbook — {{service}}\n\n## Health Checks\n## Common Failures\n## Escalation\n## Recovery Procedures\n',                                                                                                                    '["venture","service"]',             'manual'),
  ('ops.postmortem',         'ops',        'Incident Postmortem',                 'Blameless post-incident review template.',                      '# Postmortem — {{incident}} ({{date}})\n\n## Summary\n## Timeline\n## Root Cause\n## Impact\n## Action Items\n',                                                                                                               '["venture","incident","date"]',     'manual'),
  ('ops.onboarding',         'ops',        'Team Onboarding Checklist',           'New hire first-week checklist.',                                '# Onboarding — {{venture}}\n\n- [ ] Accounts provisioned\n- [ ] Access granted\n- [ ] Welcome 1:1 scheduled\n- [ ] Tooling installed\n',                                                                                      '["venture"]',                       'manual'),

  ('product.prd',            'product',    'Product Requirements Document',        'Standard PRD.',                                                 '# PRD — {{feature}}\n\n## Problem\n## Users\n## Requirements\n## Success Metrics\n## Out of Scope\n',                                                                                                                           '["venture","feature"]',             'manual'),
  ('product.rfc',            'product',    'Request for Comments',                'Technical design RFC.',                                         '# RFC — {{title}}\n\n## Context\n## Proposal\n## Alternatives Considered\n## Risks\n',                                                                                                                                         '["venture","title"]',               'manual'),
  ('product.release-notes',  'product',    'Release Notes',                       'Release note template.',                                        '# {{venture}} Release Notes — {{version}}\n\n## Shipped\n## Fixed\n## Known Issues\n',                                                                                                                                         '["venture","version"]',             'manual')
on conflict (id) do nothing;

-- =========================================================================
-- 4. Realtime publication
-- =========================================================================

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table doc_templates;
    exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table venture_docs;
    exception when duplicate_object then null; end;
  end if;
end $$;
