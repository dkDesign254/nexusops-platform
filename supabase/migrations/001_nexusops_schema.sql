-- =============================================================
-- NexusOps — Database Schema
-- Migration 001: Initial schema
-- All timestamps are UTC. All IDs use gen_random_uuid().
-- Row Level Security is enabled on all tables.
-- =============================================================

-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  organisation text,
  role text default 'member',  -- 'admin' | 'member' | 'viewer'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Workflows
create table public.workflows (
  id uuid primary key default gen_random_uuid(),
  workflow_id text unique not null,           -- WF-2026-001 format
  workflow_name text not null,
  requested_by text,
  runtime_used text,                          -- 'Make' | 'n8n'
  status text default 'Pending',              -- Pending | Running | Completed | Failed | Cancelled
  report_period text,
  date_requested timestamptz,
  date_completed timestamptz,
  duration_mins numeric(6,1),
  log_count integer default 0,
  trigger_source text default 'Manual',       -- Manual | Scheduled | API
  notes text,
  created_at timestamptz default now(),
  user_id uuid references auth.users(id)
);

-- Execution Log
create table public.execution_logs (
  id uuid primary key default gen_random_uuid(),
  log_id text,                                -- LOG-001 format
  workflow_id uuid references public.workflows(id) on delete cascade,
  runtime text,
  step_name text,
  event_type text,                            -- standard 8 event types
  status text,                                -- success | failed | skipped
  timestamp timestamptz,
  message text,
  created_at timestamptz default now()
);

-- AI Interaction Log
create table public.ai_interaction_logs (
  id uuid primary key default gen_random_uuid(),
  log_display_id text,                        -- AI-001 format
  workflow_id uuid references public.workflows(id) on delete cascade,
  prompt_text text,
  response_text text,
  model_used text,
  timestamp timestamptz,
  cost_notes text,
  created_at timestamptz default now()
);

-- Performance Data
create table public.performance_data (
  id uuid primary key default gen_random_uuid(),
  campaign_name text not null,
  workflow_id uuid references public.workflows(id),
  impressions integer,
  clicks integer,
  conversions integer,
  spend numeric(10,2),
  ctr numeric(6,4),
  roas numeric(8,2),
  reporting_period text,
  created_at timestamptz default now()
);

-- Final Reports
create table public.final_reports (
  id uuid primary key default gen_random_uuid(),
  report_display_id text,                     -- RPT-001 format
  workflow_id uuid references public.workflows(id) on delete cascade,
  executive_summary text,
  key_insights text,
  risks_or_anomalies text,
  recommendation text,
  approved boolean default false,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  report_timestamp timestamptz,
  created_at timestamptz default now()
);

-- Platform config (feature flags, landing page content, etc.)
create table public.platform_config (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null,
  description text,
  updated_at timestamptz default now()
);

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

alter table public.profiles enable row level security;
alter table public.workflows enable row level security;
alter table public.execution_logs enable row level security;
alter table public.ai_interaction_logs enable row level security;
alter table public.performance_data enable row level security;
alter table public.final_reports enable row level security;
alter table public.platform_config enable row level security;

-- Profiles: users see only their own
create policy "profiles_own" on public.profiles
  for all using (auth.uid() = id);

-- Workflows: all authenticated users see team data
create policy "workflows_authenticated" on public.workflows
  for all using (auth.role() = 'authenticated');

-- Execution logs: authenticated
create policy "exec_logs_authenticated" on public.execution_logs
  for all using (auth.role() = 'authenticated');

-- AI logs: authenticated
create policy "ai_logs_authenticated" on public.ai_interaction_logs
  for all using (auth.role() = 'authenticated');

-- Performance data: authenticated
create policy "perf_data_authenticated" on public.performance_data
  for all using (auth.role() = 'authenticated');

-- Final reports: authenticated
create policy "final_reports_authenticated" on public.final_reports
  for all using (auth.role() = 'authenticated');

-- Platform config: public read, admin write (enforced at app layer)
create policy "platform_config_public_read" on public.platform_config
  for select using (true);

-- =============================================================
-- DATA API GRANTS (required from Supabase 2026-05-30)
-- Without these, supabase-js / PostgREST returns 42501.
-- =============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles          TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflows         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflows         TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.execution_logs    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.execution_logs    TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_interaction_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_interaction_logs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.performance_data  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.performance_data  TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.final_reports     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.final_reports     TO service_role;

-- platform_config: anon can read (landing page pricing/config)
GRANT SELECT                          ON public.platform_config  TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_config   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_config   TO service_role;

-- =============================================================
-- TRIGGERS
-- =============================================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at on profiles
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();
