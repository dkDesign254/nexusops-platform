-- =============================================================
-- NexusOps — Migration 004: Schema expansion
-- Safe to run on both fresh and existing databases.
-- All statements use IF NOT EXISTS / pg_type guards.
--
-- NOTE: migrations 001–003 use text columns (not ENUM types) for
-- workflow_status and execution_event_type. The ALTER TYPE blocks
-- below are no-ops on fresh databases; they only apply if those
-- ENUM types happen to exist from a pre-migration manual setup.
-- =============================================================

-- ─── Enum additions (only if the type already exists) ─────────────────────────

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workflow_status') THEN
    ALTER TYPE workflow_status ADD VALUE IF NOT EXISTS 'cancelled';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'execution_event_type') THEN
    ALTER TYPE execution_event_type ADD VALUE IF NOT EXISTS 'cancellation';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Enum type definitions (create if not already present) ────────────────────

DO $$ BEGIN
  CREATE TYPE audit_action AS ENUM (
    'workflow_created','workflow_cancelled','workflow_retried',
    'report_approved','report_rejected','agent_created','agent_updated',
    'user_role_changed','airtable_synced','integration_connected',
    'integration_disconnected','seed_run'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE alert_severity AS ENUM ('info','warning','critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE trigger_mode AS ENUM ('manual','scheduled','webhook');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE logging_level AS ENUM ('basic','standard','full');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- workflow_runtime enum — used by agent_configs below.
-- Create here so agent_configs CREATE TABLE always succeeds.
DO $$ BEGIN
  CREATE TYPE workflow_runtime AS ENUM ('make','n8n','langchain','crewai','zapier','custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── ai_interaction_logs: add new columns ─────────────────────────────────────
-- Table is named ai_interaction_logs in migration 001.
-- Guarded so it is safe to re-run.

ALTER TABLE public.ai_interaction_logs
  ADD COLUMN IF NOT EXISTS tokens_used  integer,
  ADD COLUMN IF NOT EXISTS confidence   integer,
  ADD COLUMN IF NOT EXISTS flagged      boolean DEFAULT false;

-- ─── final_reports: add new columns ──────────────────────────────────────────
-- Table is named final_reports in migration 001.

ALTER TABLE public.final_reports
  ADD COLUMN IF NOT EXISTS action_items     text,
  ADD COLUMN IF NOT EXISTS rejected         boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- ─── agent_configs ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.agent_configs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  varchar(255)   NOT NULL,
  description           text,
  runtime_preference    workflow_runtime,
  trigger_mode          trigger_mode   NOT NULL DEFAULT 'manual',
  ai_analysis_enabled   boolean        DEFAULT true,
  approval_required     boolean        DEFAULT false,
  logging_level         logging_level  NOT NULL DEFAULT 'standard',
  governance_checklist  jsonb,
  required_integrations jsonb,
  risk_level            varchar(32)    DEFAULT 'medium',
  created_by            varchar(255),
  created_at            timestamptz    DEFAULT now() NOT NULL,
  updated_at            timestamptz    DEFAULT now() NOT NULL
);

ALTER TABLE public.agent_configs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'agent_configs' AND policyname = 'agent_configs_authenticated'
  ) THEN
    CREATE POLICY "agent_configs_authenticated" ON public.agent_configs
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- ─── gaia_sessions ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.gaia_sessions (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid         REFERENCES auth.users(id) ON DELETE CASCADE,
  title        varchar(255),
  created_at   timestamptz  DEFAULT now() NOT NULL,
  updated_at   timestamptz  DEFAULT now() NOT NULL
);

ALTER TABLE public.gaia_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'gaia_sessions' AND policyname = 'gaia_sessions_own'
  ) THEN
    CREATE POLICY "gaia_sessions_own" ON public.gaia_sessions
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.gaia_messages (
  id         uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid         NOT NULL REFERENCES public.gaia_sessions(id) ON DELETE CASCADE,
  role       varchar(16)  NOT NULL,   -- 'user' | 'assistant'
  content    text         NOT NULL,
  timestamp  timestamptz  DEFAULT now() NOT NULL
);

ALTER TABLE public.gaia_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'gaia_messages' AND policyname = 'gaia_messages_authenticated'
  ) THEN
    CREATE POLICY "gaia_messages_authenticated" ON public.gaia_messages
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- ─── audit_events ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_events (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  action      audit_action NOT NULL,
  actor_id    uuid         REFERENCES auth.users(id),
  actor_name  varchar(255),
  target_id   varchar(255),
  target_type varchar(64),
  details     jsonb,
  timestamp   timestamptz  DEFAULT now() NOT NULL
);

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS audit_events_timestamp_idx ON public.audit_events(timestamp DESC);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'audit_events' AND policyname = 'audit_events_authenticated'
  ) THEN
    CREATE POLICY "audit_events_authenticated" ON public.audit_events
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- ─── alerts ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.alerts (
  id          uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid           REFERENCES public.workflows(id) ON DELETE SET NULL,
  severity    alert_severity NOT NULL DEFAULT 'info',
  title       varchar(255)   NOT NULL,
  message     text           NOT NULL,
  resolved    boolean        DEFAULT false,
  created_at  timestamptz    DEFAULT now() NOT NULL,
  resolved_at timestamptz
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'alerts' AND policyname = 'alerts_authenticated'
  ) THEN
    CREATE POLICY "alerts_authenticated" ON public.alerts
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- ─── Seed demo agent configs ──────────────────────────────────────────────────

INSERT INTO public.agent_configs
  (name, description, runtime_preference, trigger_mode, ai_analysis_enabled,
   approval_required, logging_level, risk_level, required_integrations, created_by)
VALUES
  ('Weekly Marketing Reporter',
   'Collects campaign KPIs, generates AI summary, flags anomalies, posts report.',
   'make', 'scheduled', true, false, 'full', 'low',
   '["Airtable","OpenAI","Make"]', 'admin'),
  ('Campaign Anomaly Detector',
   'Monitors ROAS/CTR in real time, raises alert if metric drops below threshold.',
   'n8n', 'webhook', true, true, 'full', 'medium',
   '["Airtable","OpenAI","n8n"]', 'admin'),
  ('Governance Audit Bot',
   'Verifies every workflow has a complete audit trail and flags missing steps.',
   NULL, 'scheduled', true, true, 'full', 'high',
   '["Supabase","OpenAI"]', 'admin')
ON CONFLICT DO NOTHING;

-- ─── Seed demo alerts ─────────────────────────────────────────────────────────

INSERT INTO public.alerts (severity, title, message, resolved)
VALUES
  ('warning',  'ROAS drop detected',
   'Campaign "Spring Sale" ROAS fell below 2.0x threshold. Review spend allocation.', false),
  ('critical', 'Workflow execution failed',
   'A workflow failed at the AI Report Generation step. Manual retry required.', false),
  ('info',     'Airtable sync complete',
   '42 records synced from Airtable to Supabase at 02:00 UTC.', true),
  ('warning',  'Missing audit logs',
   '3 workflows have incomplete audit trails — Workflow Completion log missing.', false),
  ('info',     'New agent deployed',
   'Campaign Anomaly Detector agent activated and monitoring 6 campaigns.', true)
ON CONFLICT DO NOTHING;
