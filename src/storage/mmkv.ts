import { getRandomBytes } from 'expo-crypto';
import { getItem, setItem } from 'expo-secure-store';
import { createMMKV } from 'react-native-mmkv';

/** Where the store's encryption key lives: Keychain on iOS, Keystore on Android. */
const KEY_NAME = 'streetshelf.storage-key';
const STORE_ID = 'streetshelf-secure';
const KEY_BYTES = 32;

/**
 * Returns the store's encryption key, minting one on first launch.
 *
 * Synchronous on purpose: the Supabase session is read at module scope,
 * before the first render, so a returning user is signed in on frame one.
 * The key is not behind `requireAuthentication`, so the sync accessor does
 * not block on a biometric prompt.
 */
function encryptionKey(): string {
  const existing = getItem(KEY_NAME);
  if (existing) return existing;
  const key = Array.from(getRandomBytes(KEY_BYTES))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  setItem(KEY_NAME, key);
  return key;
}

/**
 * Synchronous key-value storage, encrypted at rest.
 *
 * Deliberately narrow: the auth session and small UI preferences that must be
 * readable before the first render. Domain data belongs in Postgres, not here.
 */
export const storage = createMMKV({ id: STORE_ID, encryptionKey: encryptionKey() });
