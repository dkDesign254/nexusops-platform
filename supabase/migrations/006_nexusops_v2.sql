-- ============================================================
-- NexusOps v2 — Supabase schema additions
-- Migration 006: profiles, api_keys, workspace_members,
--                user_integrations, handle_new_user trigger
-- Run in Supabase SQL Editor → New Query
-- ============================================================

-- ── Extended profiles ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id                    uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name             text,
  organisation          text,
  avatar_url            text,
  plan                  text DEFAULT 'free',
  language_code         text DEFAULT 'en',
  theme                 text DEFAULT 'dark',
  onboarding_completed  boolean DEFAULT false,
  stripe_customer_id    text,
  nexusops_webhook_url  text,
  role                  text DEFAULT 'member',   -- 'admin' | 'member' | 'viewer'
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- ── User integrations ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_integrations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_slug  text NOT NULL,
  config            jsonb DEFAULT '{}',
  connected_at      timestamptz DEFAULT now(),
  last_active       timestamptz,
  status            text DEFAULT 'active',
  UNIQUE(user_id, integration_slug)
);

-- ── Workspace members (collaboration layer) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS public.workspace_members (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_airtable_id   text NOT NULL,   -- Airtable record ID from Workspaces table
  user_id                 uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role                    text DEFAULT 'member',  -- 'owner' | 'admin' | 'member' | 'viewer'
  invited_by              uuid REFERENCES auth.users(id),
  joined_at               timestamptz DEFAULT now(),
  UNIQUE(workspace_airtable_id, user_id)
);

-- ── API keys (per user) ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.api_keys (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text NOT NULL,
  key_hash      text NOT NULL UNIQUE,   -- store hashed, never plaintext
  key_prefix    text NOT NULL,          -- first 8 chars for display (e.g. nxops_ab12)
  created_at    timestamptz DEFAULT now(),
  last_used_at  timestamptz,
  expires_at    timestamptz,
  is_active     boolean DEFAULT true
);

-- ── Row Level Security ─────────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies idempotently
DO $$ BEGIN
  DROP POLICY IF EXISTS "profiles_own" ON public.profiles;
  CREATE POLICY "profiles_own" ON public.profiles FOR ALL USING (auth.uid() = id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "integrations_own" ON public.user_integrations;
  CREATE POLICY "integrations_own" ON public.user_integrations FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "workspace_members_own" ON public.workspace_members;
  CREATE POLICY "workspace_members_own" ON public.workspace_members FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "workspace_admin_read" ON public.workspace_members;
  CREATE POLICY "workspace_admin_read" ON public.workspace_members
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "api_keys_own" ON public.api_keys;
  CREATE POLICY "api_keys_own" ON public.api_keys FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ── Auto-create profile on signup ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, nexusops_webhook_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    'https://agentops-platform.onrender.com/api/webhook/' || NEW.id::text
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
