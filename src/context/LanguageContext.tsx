import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  SupportedLanguage,
  LanguageMeta,
  getStoredLanguage,
  setStoredLanguage,
  getLanguageMeta,
  t as translateHelper,
} from '../utils/i18n';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, fallback?: string) => string;
  meta: LanguageMeta;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key, fallback) => fallback || key,
  meta: getLanguageMeta('en'),
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => getStoredLanguage());

  const handleSetLanguage = useCallback((newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    setStoredLanguage(newLang);
  }, []);

  useEffect(() => {
    const onLangChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ language: SupportedLanguage }>).detail;
      if (detail && detail.language) {
        setLanguageState((prev) => (prev === detail.language ? prev : detail.language));
      }
    };

    window.addEventListener('lungta_language_changed', onLangChanged);
    return () => {
      window.removeEventListener('lungta_language_changed', onLangChanged);
    };
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) => translateHelper(key, language, fallback),
    [language]
  );

  const meta = useMemo(() => getLanguageMeta(language), [language]);

  const value = useMemo(
    () => ({ language, setLanguage: handleSetLanguage, t, meta }),
    [language, handleSetLanguage, t, meta]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
