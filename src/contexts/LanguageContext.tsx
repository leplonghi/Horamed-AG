import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { PORTUGUESE_COUNTRIES, getLanguageByCountry } from '@/lib/stripeConfig';
import pt from '@/i18n/locales/pt.json';
import en from '@/i18n/locales/en.json';

export type Language = 'pt' | 'en';

interface CountryInfo {
  code: string;
  detected: boolean;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
  country: CountryInfo;
  isPortugueseCountry: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  pt: pt as Record<string, string>,
  en: en as Record<string, string>
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('horamed_language');
    if (saved === 'pt' || saved === 'en') return saved;

    // Detect by browser language
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'pt') return 'pt';

    return 'en';
  });

  const [country, setCountry] = useState<CountryInfo>({ code: 'BR', detected: false });

  useEffect(() => {
    // Detect country if not already set
    const fetchCountry = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.country_code) {
          setCountry({ code: data.country_code, detected: true });

          // Auto-switch language based on country if no manual setting exists
          if (!localStorage.getItem('horamed_language')) {
            const detectedLang = getLanguageByCountry(data.country_code);
            setLanguageState(detectedLang as Language);
          }
        }
      } catch (err) {
        console.error('Error detecting country:', err);
      }
    };
    fetchCountry();
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('horamed_language', lang);
  };

  const t = useCallback((key: string, params?: Record<string, string>): string => {
    let text = translations[language][key] || translations['en'][key] || key;

    // Replace parameters like {code} with actual values
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), value);
      });
    }

    return text;
  }, [language]);

  const isPortugueseCountry = PORTUGUESE_COUNTRIES.includes(country.code);

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t,
      country,
      isPortugueseCountry
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Alias for backward compatibility
export const useTranslation = useLanguage;
