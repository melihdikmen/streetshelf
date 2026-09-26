import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { storage } from '../storage/mmkv';
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

/** Where a language chosen in Settings is kept; it wins over the device's. */
const LANGUAGE_KEY = 'settings.language';

const deviceLanguage = getLocales()[0]?.languageCode;
const savedLanguage = storage.getString(LANGUAGE_KEY);

void i18n.use(initReactI18next).init({
  resources: {
    tr: { translation: tr },
    en: { translation: en },
  },
  lng: isSupported(savedLanguage) ? savedLanguage : isSupported(deviceLanguage) ? deviceLanguage : 'tr',
  fallbackLng: 'tr',
  interpolation: { escapeValue: false },
});

/**
 * Switches the app language and remembers it across launches. Read
 * synchronously at start-up (MMKV), so the first frame is already in the
 * chosen language.
 */
export function setLanguage(language: SupportedLanguage): void {
  storage.set(LANGUAGE_KEY, language);
  void i18n.changeLanguage(language);
}

export default i18n;
