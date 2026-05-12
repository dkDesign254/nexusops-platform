import React, { createContext, useContext, useEffect, useState } from "react";
import { t as translate, type TranslationKey } from "@/i18n/translations";
export type { TranslationKey };

/** All 7 supported languages — codes match Airtable Translations table */
export const LANGUAGES = [
  { code: "en", label: "English",    flag: "🇬🇧", dir: "ltr" as const },
  { code: "fr", label: "Français",   flag: "🇫🇷", dir: "ltr" as const },
  { code: "es", label: "Español",    flag: "🇪🇸", dir: "ltr" as const },
  { code: "de", label: "Deutsch",    flag: "🇩🇪", dir: "ltr" as const },
  { code: "pt", label: "Português",  flag: "🇧🇷", dir: "ltr" as const },
  { code: "sw", label: "Kiswahili",  flag: "🇰🇪", dir: "ltr" as const },
  { code: "ar", label: "العربية",   flag: "🇸🇦", dir: "rtl" as const },
] as const;

export const REGIONS = [
  { code: "KE", label: "Kenya", flag: "🇰🇪" },
  { code: "NG", label: "Nigeria", flag: "🇳🇬" },
  { code: "ZA", label: "South Africa", flag: "🇿🇦" },
  { code: "GH", label: "Ghana", flag: "🇬🇭" },
  { code: "TZ", label: "Tanzania", flag: "🇹🇿" },
  { code: "UG", label: "Uganda", flag: "🇺🇬" },
  { code: "RW", label: "Rwanda", flag: "🇷🇼" },
  { code: "ET", label: "Ethiopia", flag: "🇪🇹" },
  { code: "GB", label: "United Kingdom", flag: "🇬🇧" },
  { code: "US", label: "United States", flag: "🇺🇸" },
  { code: "FR", label: "France", flag: "🇫🇷" },
  { code: "DE", label: "Germany", flag: "🇩🇪" },
  { code: "IN", label: "India", flag: "🇮🇳" },
  { code: "BR", label: "Brazil", flag: "🇧🇷" },
  { code: "OTHER", label: "Other", flag: "🌍" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];
export type RegionCode = (typeof REGIONS)[number]["code"];

interface LocaleContextType {
  language: LanguageCode;
  region: RegionCode;
  isRTL: boolean;
  setLanguage: (lang: LanguageCode) => void;
  setRegion: (region: RegionCode) => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

function readStored<T extends string>(key: string, fallback: T, valid: readonly { code: string }[]): T {
  try {
    const v = localStorage.getItem(key);
    if (v && valid.some((x) => x.code === v)) return v as T;
  } catch {}
  return fallback;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<LanguageCode>(() =>
    readStored("nexusops-lang", "en", LANGUAGES)
  );
  const [region, setRegionState] = useState<RegionCode>(() =>
    readStored("nexusops-region", "KE", REGIONS)
  );

  const currentLangMeta = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];
  const isRTL = currentLangMeta.dir === "rtl";

  // Apply RTL direction and lang attribute to <html>
  useEffect(() => {
    document.documentElement.setAttribute("lang", language);
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
  }, [language, isRTL]);

  function setLanguage(lang: LanguageCode) {
    setLangState(lang);
    try { localStorage.setItem("nexusops-lang", lang); } catch {}
  }

  function setRegion(r: RegionCode) {
    setRegionState(r);
    try { localStorage.setItem("nexusops-region", r); } catch {}
  }

  return (
    <LocaleContext.Provider value={{ language, region, isRTL, setLanguage, setRegion }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

/** Translation helper bound to the current language (static strings) */
export function useT() {
  const { language } = useLocale();
  return (key: TranslationKey) => translate(language, key);
}
