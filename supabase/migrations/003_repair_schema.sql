-- =============================================================
-- NexusOps — Migration 003: Repair production schema
-- Safe to run multiple times (all statements use IF NOT EXISTS).
--
-- Fixes:
--   1. Creates performance_data table if missing (from migration 001)
--   2. Adds airtable_record_id to all synced tables (from migration 002)
--   3. Creates sync_log table if missing (from migration 002)
--   4. Adds RLS policies that may be missing
-- =============================================================

-- ── 1. Ensure performance_data table exists ───────────────────

CREATE TABLE IF NOT EXISTS public.performance_data (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name    text NOT NULL,
  workflow_id      uuid REFERENCES public.workflows(id),
  impressions      integer,
  clicks           integer,
  conversions      integer,
  spend            numeric(10,2),
  ctr              numeric(6,4),
  roas             numeric(8,2),
  reporting_period text,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE public.performance_data ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'performance_data' AND policyname = 'perf_data_authenticated'
  ) THEN
    CREATE POLICY "perf_data_authenticated" ON public.performance_data
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- ── 2. Add airtable_record_id to all synced tables ───────────

ALTER TABLE public.workflows
  ADD COLUMN IF NOT EXISTS airtable_record_id TEXT UNIQUE;

ALTER TABLE public.execution_logs
  ADD COLUMN IF NOT EXISTS airtable_record_id TEXT UNIQUE;

ALTER TABLE public.ai_interaction_logs
  ADD COLUMN IF NOT EXISTS airtable_record_id TEXT UNIQUE;

ALTER TABLE public.performance_data
  ADD COLUMN IF NOT EXISTS airtable_record_id TEXT UNIQUE;

ALTER TABLE public.final_reports
  ADD COLUMN IF NOT EXISTS airtable_record_id TEXT UNIQUE;

-- ── 3. Ensure sync_log table exists ──────────────────────────

CREATE TABLE IF NOT EXISTS public.sync_log (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source               TEXT NOT NULL DEFAULT 'airtable',
  started_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at         TIMESTAMPTZ,
  status               TEXT NOT NULL DEFAULT 'running',
  workflows_synced     INTEGER DEFAULT 0,
  exec_logs_synced     INTEGER DEFAULT 0,
  ai_logs_synced       INTEGER DEFAULT 0,
  perf_data_synced     INTEGER DEFAULT 0,
  reports_synced       INTEGER DEFAULT 0,
  error                TEXT,
  details              JSONB
);

ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sync_log' AND policyname = 'sync_log_read'
  ) THEN
    CREATE POLICY "sync_log_read" ON public.sync_log
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;
