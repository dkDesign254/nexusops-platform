-- Migration 004: Schema expansion for full NexusOps feature set
-- Run this in Supabase SQL Editor → New Query

-- ─── Enum additions ────────────────────────────────────────────────────────────

DO $$ BEGIN
  ALTER TYPE workflow_status ADD VALUE IF NOT EXISTS 'cancelled';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE execution_event_type ADD VALUE IF NOT EXISTS 'cancellation';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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

-- ─── AI_Logs: add new columns ─────────────────────────────────────────────────

ALTER TABLE "AI_Logs"
  ADD COLUMN IF NOT EXISTS tokens_used   integer,
  ADD COLUMN IF NOT EXISTS confidence    integer,
  ADD COLUMN IF NOT EXISTS flagged       boolean DEFAULT false;

-- ─── reports: add new columns ─────────────────────────────────────────────────

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS action_items    text,
  ADD COLUMN IF NOT EXISTS approved        boolean,
  ADD COLUMN IF NOT EXISTS rejected        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- ─── agent_configs ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agent_configs (
  id                   serial PRIMARY KEY,
  name                 varchar(255) NOT NULL,
  description          text,
  runtime_preference   workflow_runtime,
  trigger_mode         trigger_mode NOT NULL DEFAULT 'manual',
  ai_analysis_enabled  boolean DEFAULT true,
  approval_required    boolean DEFAULT false,
  logging_level        logging_level NOT NULL DEFAULT 'standard',
  governance_checklist jsonb,
  required_integrations jsonb,
  risk_level           varchar(32) DEFAULT 'medium',
  created_by           varchar(255),
  created_at           timestamptz DEFAULT now() NOT NULL,
  updated_at           timestamptz DEFAULT now() NOT NULL
);

-- ─── gaia_sessions ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gaia_sessions (
  id           serial PRIMARY KEY,
  user_open_id varchar(64),
  title        varchar(255),
  created_at   timestamptz DEFAULT now() NOT NULL,
  updated_at   timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS gaia_messages (
  id         serial PRIMARY KEY,
  session_id integer NOT NULL REFERENCES gaia_sessions(id) ON DELETE CASCADE,
  role       varchar(16) NOT NULL,
  content    text NOT NULL,
  timestamp  timestamptz DEFAULT now() NOT NULL
);

-- ─── audit_events ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_events (
  id            serial PRIMARY KEY,
  action        audit_action NOT NULL,
  actor_open_id varchar(64),
  actor_name    varchar(255),
  target_id     varchar(255),
  target_type   varchar(64),
  details       jsonb,
  timestamp     timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS audit_events_timestamp_idx ON audit_events(timestamp DESC);

-- ─── alerts ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS alerts (
  id          serial PRIMARY KEY,
  workflow_id varchar(36),
  severity    alert_severity NOT NULL DEFAULT 'info',
  title       varchar(255) NOT NULL,
  message     text NOT NULL,
  resolved    boolean DEFAULT false,
  created_at  timestamptz DEFAULT now() NOT NULL,
  resolved_at timestamptz
);

-- ─── performance_data ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS performance_data (
  id            serial PRIMARY KEY,
  workflow_id   varchar(36),
  report_period varchar(64),
  ctr           integer,
  roas          integer,
  conversions   integer,
  spend         integer,
  impressions   integer,
  created_at    timestamptz DEFAULT now() NOT NULL
);

-- ─── Seed demo agent configs ──────────────────────────────────────────────────

INSERT INTO agent_configs (name, description, runtime_preference, trigger_mode, ai_analysis_enabled, approval_required, logging_level, risk_level, required_integrations, created_by)
VALUES
  ('Weekly Marketing Reporter', 'Collects campaign KPIs, generates AI summary, flags anomalies, posts report.', 'make', 'scheduled', true, false, 'full', 'low', '["Airtable","OpenAI","Make"]', 'admin-dk-tl'),
  ('Campaign Anomaly Detector', 'Monitors ROAS/CTR in real time, raises alert if metric drops below threshold.', 'n8n', 'webhook', true, true, 'full', 'medium', '["Airtable","OpenAI","n8n"]', 'admin-dk-tl'),
  ('Governance Audit Bot', 'Verifies every workflow has a complete audit trail and flags missing steps.', NULL, 'scheduled', true, true, 'full', 'high', '["Supabase","OpenAI"]', 'admin-dk-tl')
ON CONFLICT DO NOTHING;

-- ─── Seed demo alerts ─────────────────────────────────────────────────────────

INSERT INTO alerts (severity, title, message, resolved)
VALUES
  ('warning',  'ROAS drop detected',      'Campaign "Spring Sale" ROAS fell below 2.0x threshold. Review spend allocation.', false),
  ('critical', 'Workflow execution failed','Workflow wf-alpha-001 failed at AI Report Generation step. Manual retry required.', false),
  ('info',     'Airtable sync complete',  '42 records synced from Airtable to Supabase at 02:00 UTC.', true),
  ('warning',  'Missing audit logs',      '3 workflows have incomplete audit trails — Workflow Completion log missing.', false),
  ('info',     'New agent deployed',      'Campaign Anomaly Detector agent activated and monitoring 6 campaigns.', true)
ON CONFLICT DO NOTHING;
