/**
 * NexusOps — useProfile hook
 *
 * Reads the current user's profile from the Supabase `profiles` table.
 * The profiles table is created by migration 006_nexusops_v2.sql and
 * auto-populated on signup via the handle_new_user trigger.
 *
 * Provides: full_name, organisation, role, plan, avatar_url,
 *           theme, language_code, onboarding_completed, nexusops_webhook_url.
 *
 * Used by:
 *   - AdminPage — to show actual role ('Admin'|'Member'|'Viewer')
 *   - SettingsPage — profile editing
 *   - TopBar — avatar display name
 *   - AuthGuard — role-based access control
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./use-auth";

export type UserRole = "admin" | "member" | "viewer";

export interface UserProfile {
  id: string;
  fullName: string | null;
  organisation: string | null;
  avatarUrl: string | null;
  plan: string;
  languageCode: string;
  theme: string;
  onboardingCompleted: boolean;
  stripeCustomerId: string | null;
  nexusopsWebhookUrl: string | null;
  role: UserRole;
}

export interface UseProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  updateProfile: (updates: Partial<Pick<UserProfile, "fullName" | "organisation" | "theme" | "languageCode">>) => Promise<void>;
}

/** Normalises a raw role string to the valid enum */
function parseRole(raw: string | null): UserRole {
  if (raw === "admin") return "admin";
  if (raw === "viewer") return "viewer";
  return "member";
}

/**
 * useProfile
 *
 * Returns the authenticated user's Supabase profile row.
 * Subscribes to realtime updates so the role badge stays in sync.
 */
export function useProfile(): UseProfileReturn {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select(
        "id, full_name, organisation, avatar_url, plan, language_code, theme, onboarding_completed, stripe_customer_id, nexusops_webhook_url, role"
      )
      .eq("id", user.id)
      .single();

    if (fetchError) {
      // Profile row may not exist yet (migration pending) — not a fatal error
      if (fetchError.code !== "PGRST116") {
        setError(fetchError.message);
      }
      setProfile(null);
    } else if (data) {
      setProfile({
        id: data.id as string,
        fullName: (data.full_name as string | null) ?? null,
        organisation: (data.organisation as string | null) ?? null,
        avatarUrl: (data.avatar_url as string | null) ?? null,
        plan: (data.plan as string | null) ?? "free",
        languageCode: (data.language_code as string | null) ?? "en",
        theme: (data.theme as string | null) ?? "dark",
        onboardingCompleted: (data.onboarding_completed as boolean | null) ?? false,
        stripeCustomerId: (data.stripe_customer_id as string | null) ?? null,
        nexusopsWebhookUrl: (data.nexusops_webhook_url as string | null) ?? null,
        role: parseRole(data.role as string | null),
      });
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (updates: Partial<Pick<UserProfile, "fullName" | "organisation" | "theme" | "languageCode">>) => {
      if (!user) return;

      const dbUpdates: Record<string, unknown> = {};
      if (updates.fullName !== undefined) dbUpdates["full_name"] = updates.fullName;
      if (updates.organisation !== undefined) dbUpdates["organisation"] = updates.organisation;
      if (updates.theme !== undefined) dbUpdates["theme"] = updates.theme;
      if (updates.languageCode !== undefined) dbUpdates["language_code"] = updates.languageCode;
      dbUpdates["updated_at"] = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("profiles")
        .update(dbUpdates)
        .eq("id", user.id);

      if (updateError) throw new Error(updateError.message);
      await fetchProfile();
    },
    [user, fetchProfile]
  );

  return { profile, loading, error, refresh: fetchProfile, updateProfile };
}
