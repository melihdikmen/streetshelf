import {
  getCrashlytics,
  recordError,
  setCrashlyticsCollectionEnabled,
  setUserId,
} from '@react-native-firebase/crashlytics';

import { type AppError } from './supabase';

/**
 * Crash and error reporting through Firebase Crashlytics (the Vouch setup).
 *
 * Only release builds report: crashes from a debug build are noise and would
 * bury real ones. JavaScript crashes and native crashes are caught by the SDK
 * itself; `reportUnexpected` adds the errors the app survives but cannot
 * explain. Reports carry the account id and nothing else about the person.
 * Every call is best effort: a build without Firebase must still run.
 */

/** Turns collection on for release builds and off for development. Call once at start-up. */
export function initCrashlytics(): void {
  try {
    void setCrashlyticsCollectionEnabled(getCrashlytics(), !__DEV__).catch(() => undefined);
  } catch {
    // No native module or no Firebase config: nothing to report to.
  }
}

/** Ties later reports to an account id (or clears it on sign-out). Never an email or a name. */
export function setCrashUser(userId: string | null): void {
  try {
    void setUserId(getCrashlytics(), userId ?? '').catch(() => undefined);
  } catch {
    // Best effort.
  }
}

/**
 * Records an error the user saw as "something went wrong" as a non-fatal.
 * Expected failures (offline, a wrong code, a rule like `own_item`) are part
 * of normal use and are not reported; only `unknown` means the app met
 * something it does not handle.
 */
export function reportUnexpected(error: AppError): void {
  if (error.code !== 'unknown') return;
  try {
    const cause = error.cause;
    const reported =
      cause instanceof Error
        ? cause
        : new Error(typeof cause === 'object' && cause !== null && 'message' in cause ? String(cause.message) : String(cause));
    recordError(getCrashlytics(), reported, 'AppError.unknown');
  } catch {
    // Best effort.
  }
}
