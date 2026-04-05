import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations } from '../i18n';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('cabinetLocale');
    if (saved && translations[saved]) setLocale(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('cabinetLocale', locale);
  }, [locale]);

  const t = translations[locale] || translations.en;
  const isRtl = locale === 'ar';

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
