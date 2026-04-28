import React, { createContext, useContext, useState } from "react";

export const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "sw", label: "Swahili", flag: "🇰🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
] as const;

export const REGIONS = [
  { code: "KE", label: "Kenya" },
  { code: "NG", label: "Nigeria" },
  { code: "ZA", label: "South Africa" },
  { code: "GH", label: "Ghana" },
  { code: "TZ", label: "Tanzania" },
  { code: "UG", label: "Uganda" },
  { code: "RW", label: "Rwanda" },
  { code: "ET", label: "Ethiopia" },
  { code: "GB", label: "United Kingdom" },
  { code: "US", label: "United States" },
  { code: "FR", label: "France" },
  { code: "DE", label: "Germany" },
  { code: "IN", label: "India" },
  { code: "BR", label: "Brazil" },
  { code: "OTHER", label: "Other" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];
export type RegionCode = (typeof REGIONS)[number]["code"];

interface LocaleContextType {
  language: LanguageCode;
  region: RegionCode;
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

  function setLanguage(lang: LanguageCode) {
    setLangState(lang);
    try { localStorage.setItem("nexusops-lang", lang); } catch {}
  }

  function setRegion(r: RegionCode) {
    setRegionState(r);
    try { localStorage.setItem("nexusops-region", r); } catch {}
  }

  return (
    <LocaleContext.Provider value={{ language, region, setLanguage, setRegion }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
