import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import arTranslations from './locales/ar.json';
import enTranslations from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      ar: { translation: arTranslations },
    },
    fallbackLng: 'ar',
    supportedLngs: ['en', 'ar'],
    // CRITICAL: run synchronously so first render has translations
    // @ts-ignore: initImmediate is not strictly typed in all versions
    initImmediate: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  } as any);

// Update document direction whenever language changes
const applyDirection = (lng: string) => {
  const isRtl = lng === 'ar';
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
};

i18n.on('languageChanged', applyDirection);

// Apply on first load
applyDirection(i18n.language || 'ar');

export default i18n;
