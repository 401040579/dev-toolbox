import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en/common.json';
import zh from './zh/common.json';

function initialLanguage() {
  try {
    const saved = localStorage.getItem('dev-toolbox-lang');
    if (saved === 'en' || saved === 'zh') return saved;
  } catch { /* Browser storage can be disabled. */ }
  return navigator.language.startsWith('zh') ? 'zh' : 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
  },
  lng: initialLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

const updateDocumentLanguage = (language: string) => {
  document.documentElement.lang = language.startsWith('zh') ? 'zh-CN' : 'en';
};
updateDocumentLanguage(i18n.language);
i18n.on('languageChanged', updateDocumentLanguage);

export default i18n;
