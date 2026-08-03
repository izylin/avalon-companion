"use client";

import { useEffect, useState } from "react";

export type Language = "zh" | "en";

export const languageStorageKey = "avalon_note_language_v1";

export function useLanguage() {
  const [language, setLanguage] = useState<Language>("zh");

  useEffect(() => {
    const saved = localStorage.getItem(languageStorageKey);
    // This is deliberately deferred until after hydration so the server markup is stable.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === "zh" || saved === "en") setLanguage(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    localStorage.setItem(languageStorageKey, language);
  }, [language]);

  return { language, setLanguage };
}

export function LanguageToggle({ language, onChange }: { language: Language; onChange: (language: Language) => void }) {
  return (
    <div className="language-toggle" role="group" aria-label="Language">
      <button className={language === "zh" ? "active" : ""} type="button" onClick={() => onChange("zh")} aria-pressed={language === "zh"}>中文</button>
      <button className={language === "en" ? "active" : ""} type="button" onClick={() => onChange("en")} aria-pressed={language === "en"}>EN</button>
    </div>
  );
}
