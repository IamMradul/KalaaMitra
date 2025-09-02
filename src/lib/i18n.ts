import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
  lng: (() => {
      if (typeof window !== 'undefined') {
    // Prefer SSR-provided html lang to ensure hydration consistency
    const htmlLang = document.documentElement.getAttribute('lang')
    if (htmlLang) return htmlLang
    // Then prefer cookie so SSR and client can align on refresh
    const match = document.cookie.match(/(?:^|; )preferredLanguage=([^;]+)/)
    if (match) return decodeURIComponent(match[1])
    // Finally, fall back to localStorage
    const ls = localStorage.getItem('preferredLanguage')
    if (ls) return ls
      }
      return 'en'
    })(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
