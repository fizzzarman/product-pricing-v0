"use client";

import * as React from "react";
import { DEFAULT_LOCALE, dictionary, type DictionaryKey, type Locale } from "@/lib/i18n/dictionary";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: DictionaryKey) => string;
}

const LocaleContext = React.createContext<LocaleContextValue | null>(null);
const STORAGE_KEY = "daamkoto-locale";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>(DEFAULT_LOCALE);

  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of external storage on mount
    if (stored === "en" || stored === "bn") setLocaleState(stored);
  }, []);

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = React.useCallback((key: DictionaryKey) => dictionary[locale][key] ?? dictionary.en[key] ?? key, [locale]);

  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = React.useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}
