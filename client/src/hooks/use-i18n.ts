/**
 * NexusOps — useI18n hook (Airtable-backed translations)
 *
 * Loads translations from the Airtable Translations table for the active
 * language. Falls back to English for missing keys. Falls back to the key
 * itself if missing in English too (never shows blank UI).
 *
 * Persists language choice to localStorage AND optionally to Supabase
 * profiles.language_code when user is signed in.
 *
 * Arabic (ar) sets dir="rtl" on <html>. All others: dir="ltr".
 * This is applied by LocaleContext — useI18n reads from LocaleContext.
 *
 * Usage:
 *   const { t, loading } = useI18n();
 *   return <p>{t("hero.headline")}</p>;
 *
 * For static app-shell keys (nav, topbar) use the existing useT() hook
 * from LocaleContext which reads from the bundled translations.ts file.
 * useI18n is for dynamic CMS-driven content (landing, features, pricing copy).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchTranslations } from "@/lib/airtable";
import { useLocale } from "@/contexts/LocaleContext";

/** In-memory cache to avoid re-fetching on component re-mount */
const translationCache = new Map<string, Record<string, string>>();

export interface UseI18nReturn {
  /** Looks up a translation key. Returns English fallback or key itself if missing. */
  t: (key: string, fallback?: string) => string;
  loading: boolean;
  language: string;
}

/**
 * useI18n
 *
 * Fetches dynamic translations from Airtable for the active language.
 * @param section - Optional section to restrict fetch scope (e.g. "landing")
 */
export function useI18n(section?: string): UseI18nReturn {
  const { language } = useLocale();
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [enFallback, setEnFallback] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const cacheKey = `${language}:${section ?? "_all"}`;
  const enCacheKey = `en:${section ?? "_all"}`;

  const loadTranslations = useCallback(async () => {
    // Use cache if available
    if (translationCache.has(cacheKey)) {
      setTranslations(translationCache.get(cacheKey)!);
      if (translationCache.has(enCacheKey)) {
        setEnFallback(translationCache.get(enCacheKey)!);
      }
      return;
    }

    // Abort any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    try {
      const [langRecords, enRecords] = await Promise.all([
        fetchTranslations(language, section),
        language !== "en" ? fetchTranslations("en", section) : Promise.resolve([]),
      ]);

      const langMap: Record<string, string> = {};
      langRecords.forEach((r) => { langMap[r.key] = r.text; });

      const enMap: Record<string, string> = {};
      enRecords.forEach((r) => { enMap[r.key] = r.text; });

      translationCache.set(cacheKey, langMap);
      if (language !== "en") translationCache.set(enCacheKey, enMap);

      setTranslations(langMap);
      setEnFallback(enMap);
    } catch (err) {
      // Network error or token missing — silently degrade to key passthrough
      console.warn("[useI18n] Translation fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [language, section, cacheKey, enCacheKey]);

  useEffect(() => {
    loadTranslations();
    return () => { abortRef.current?.abort(); };
  }, [loadTranslations]);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      return translations[key] ?? enFallback[key] ?? fallback ?? key;
    },
    [translations, enFallback]
  );

  return { t, loading, language };
}
