-- =============================================================
-- NexusOps — Migration 007: Explicit Data API grants
-- =============================================================
-- Supabase is removing implicit public-schema grants from new
-- projects on 2026-05-30, and from ALL projects on 2026-10-30.
-- Without explicit GRANTs supabase-js / PostgREST returns 42501.
--
-- This migration adds the required GRANT statements for every
-- table created in migrations 001–006. It is fully idempotent —
-- safe to re-run because GRANT is a no-op if already granted.
--
-- Grant strategy per role:
--   anon          — SELECT only on truly public tables (platform_config)
--   authenticated — SELECT + INSERT + UPDATE + DELETE, scoped by RLS
--   service_role  — Full access (used by server-side sync/admin routes)
-- =============================================================

-- ─── 001: Core governance tables ──────────────────────────────────────────────

-- profiles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;

-- workflows
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflows TO service_role;

-- execution_logs
GRANT SELECT, INSERT, UPDATE, DELETE ON public.execution_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.execution_logs TO service_role;

-- ai_interaction_logs
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_interaction_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_interaction_logs TO service_role;

-- performance_data
GRANT SELECT, INSERT, UPDATE, DELETE ON public.performance_data TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.performance_data TO service_role;

-- final_reports
GRANT SELECT, INSERT, UPDATE, DELETE ON public.final_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.final_reports TO service_role;

-- platform_config — anon can read (used by landing page / pricing)
GRANT SELECT ON public.platform_config TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_config TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_config TO service_role;

-- ─── 002 / 003: Sync tracking ─────────────────────────────────────────────────

-- sync_log — authenticated can read; only service_role writes (server-side sync)
GRANT SELECT ON public.sync_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sync_log TO service_role;

-- ─── 004: Agents, GAIA, audit, alerts ─────────────────────────────────────────

-- agent_configs
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_configs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_configs TO service_role;

-- gaia_sessions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gaia_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gaia_sessions TO service_role;

-- gaia_messages
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gaia_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gaia_messages TO service_role;

-- audit_events — authenticated can read; service_role writes
GRANT SELECT ON public.audit_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_events TO service_role;

-- alerts
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO service_role;

-- ─── 006: v2 tables ───────────────────────────────────────────────────────────

-- user_integrations
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_integrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_integrations TO service_role;

-- workspace_members
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_members TO service_role;

-- api_keys — users manage their own; service_role validates them server-side
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO service_role;
