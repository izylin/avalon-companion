"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "zh" | "en";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  text: (zh: string, en: string) => string;
};

const localeStorageKey = "avalon_note_locale_v1";
const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("zh");

  useEffect(() => {
    const saved = localStorage.getItem(localeStorageKey);
    const browserLocale: Locale = navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
    // Deferred until hydration so the server and first client render both start in Chinese.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocale(saved === "zh" || saved === "en" ? saved : browserLocale);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    localStorage.setItem(localeStorageKey, locale);
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale,
    text: (zh, en) => locale === "zh" ? zh : en
  }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}
