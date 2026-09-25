import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en';
import tr from './locales/tr';

export const SUPPORTED_LANGUAGES = ['tr', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Narrows a device locale to a language the app ships.
 *
 * @param value A locale code such as `tr-TR`.
 * @returns True when a translation file exists for it.
 */
function isSupported(value: string | null | undefined): value is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value ?? '');
}

const deviceLanguage = getLocales()[0]?.languageCode;

void i18n.use(initReactI18next).init({
  resources: {
    tr: { translation: tr },
    en: { translation: en },
  },
  lng: isSupported(deviceLanguage) ? deviceLanguage : 'tr',
  fallbackLng: 'tr',
  interpolation: { escapeValue: false },
});

export default i18n;
