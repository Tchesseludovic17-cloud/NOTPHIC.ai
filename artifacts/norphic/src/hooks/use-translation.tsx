import React, { createContext, useContext, useEffect, useState } from "react";
import { translations, Language } from "@/lib/translations";

type TranslationContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultValue?: string) => string;
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Get language from localStorage or browser locale
    const saved = localStorage.getItem("app-language");
    if (saved === "en" || saved === "fr") return saved;

    const browserLang = navigator.language.split("-")[0];
    return (browserLang === "fr" ? "fr" : "en") as Language;
  });

  // Persist language preference
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app-language", lang);
    // Update document lang attribute
    document.documentElement.lang = lang;
  };

  // Set initial document lang
  useEffect(() => {
    document.documentElement.lang = language;
  }, []);

  // Translation function with dot notation support
  const t = (key: string, defaultValue: string = key): string => {
    const keys = key.split(".");
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }

    return typeof value === "string" ? value : defaultValue;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within TranslationProvider");
  }
  return context;
}
