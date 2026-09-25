import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { storage } from '../../storage/mmkv';
import type { Database } from './database.generated';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to ' +
      '.env.local (local stack) and restart Metro; Expo inlines these at bundle time.',
  );
}

/** Loopback, private IPv4 ranges and .local names. */
const LOCAL_HOST = /^(localhost(:|$)|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?|.*\.local(:|$))/i;

/**
 * Whether a URL points at a development backend.
 *
 * @param url The configured Supabase URL.
 * @returns True for cleartext or private addresses.
 */
export function isLocalBackend(url: string): boolean {
  if (!url.startsWith('https://')) return true;
  return LOCAL_HOST.test(url.replace(/^https:\/\//, ''));
}

// A shipped build must not talk to a development backend. Expo inlines the
// URL at bundle time, so a release built with the wrong env file is wrong for
// good; crashing here surfaces it on the developer's device, not in review.
if (!__DEV__ && isLocalBackend(supabaseUrl)) {
  throw new Error(`This build points at a development backend (${supabaseUrl}).`);
}

/** Supabase Auth session storage over encrypted MMKV. */
const sessionStorage = {
  getItem: (key: string): string | null => storage.getString(key) ?? null,
  setItem: (key: string, value: string): void => storage.set(key, value),
  removeItem: (key: string): void => {
    storage.remove(key);
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: sessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresh tokens only while the app is in the foreground, as Supabase
// recommends for React Native; a background timer would be killed anyway.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
